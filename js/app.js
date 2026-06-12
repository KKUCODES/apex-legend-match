import {
  EASTER_EGG_OPTION_SCORES,
  EASTER_EGG_RULES,
  OPTION_TRAIT_SCORES,
  QUESTIONS,
  TRAIT_KEYS,
} from './data.js';
import { initParticles } from './effects.js';
import { computeResults, normalizeScores, normalizeTraitScores } from './scoring.js';
import {
  markSelectedOption,
  renderQuestion,
  renderResult,
  showImageFallback,
  showScreen,
  showToast,
} from './render.js';

// ============================================================
//  STATE
// ============================================================
const state = {
  scores: [0,0,0,0,0],
  traitScores: createTraitScores(),
  eggScores: createEggScores(),
  currentQ: 0,
  selectedIdx: -1,
  results: null,
};

function createTraitScores() {
  return Array(TRAIT_KEYS.length).fill(0);
}

function createEggScores() {
  return Object.fromEntries(Object.keys(EASTER_EGG_RULES).map(id => [id, 0]));
}

// ============================================================
//  QUIZ FLOW
// ============================================================
function startQuiz() {
  state.currentQ = 0;
  state.selectedIdx = -1;
  state.scores = [0,0,0,0,0];
  state.traitScores = createTraitScores();
  state.eggScores = createEggScores();
  renderQuestion(state.currentQ);
  showScreen('quiz');
}

function selectOption(idx) {
  if (idx < 0 || idx >= QUESTIONS[state.currentQ].opts.length) return;
  state.selectedIdx = idx;
  markSelectedOption(idx);
}

function nextQuestion() {
  if (state.selectedIdx < 0) return;
  const dims = QUESTIONS[state.currentQ].opts[state.selectedIdx][1];
  for (let i = 0; i < 5; i++) state.scores[i] += dims[i];
  const traits = OPTION_TRAIT_SCORES[state.currentQ]?.[state.selectedIdx] || [];
  traits.forEach((score, i) => {
    state.traitScores[i] = (state.traitScores[i] || 0) + score;
  });
  const eggScores = EASTER_EGG_OPTION_SCORES[state.currentQ]?.[state.selectedIdx] || {};
  Object.entries(eggScores).forEach(([id, score]) => {
    state.eggScores[id] = (state.eggScores[id] || 0) + score;
  });

  if (state.currentQ < QUESTIONS.length - 1) {
    state.currentQ++;
    state.selectedIdx = -1;
    renderQuestion(state.currentQ);
    return;
  }

  state.results = computeResults(
    normalizeScores(state.scores),
    state.eggScores,
    normalizeTraitScores(state.traitScores),
  );
  showScreen('result');
  renderResult(state.results);
}

function restartQuiz() {
  state.results = null;
  showScreen('welcome');
}

// ============================================================
//  SHARE & RESTART
// ============================================================
async function shareResult() {
  if (!state.results) return;
  const p = state.results.top.legend;
  const simPct = (Math.max(0, (1 - state.results.top.dist / 20.1) * 100)).toFixed(1);
  const shareUrl = window.location.href;
  const text = `APEX\n\n我的传奇人格：${p[1]}（${p[2]}）\n匹配度：${simPct}%\n\n你也来测测你的传奇人格：\n${shareUrl}`;

  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      showToast('已复制到剪贴板');
      return;
    } catch (error) {
      fallbackCopy(text);
    }
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
  showToast('已复制到剪贴板');
}

// ============================================================
//  EVENT BINDING
// ============================================================
function handleClick(event) {
  const optionButton = event.target.closest('[data-option-index]');
  if (optionButton && optionButton.closest('#optionsContainer')) {
    selectOption(Number(optionButton.dataset.optionIndex));
    return;
  }

  const actionTarget = event.target.closest('[data-action]');
  if (!actionTarget) return;

  switch (actionTarget.dataset.action) {
    case 'start-quiz':
      startQuiz();
      break;
    case 'next-question':
      nextQuestion();
      break;
    case 'restart-quiz':
      restartQuiz();
      break;
    case 'share-result':
      shareResult();
      break;
    case 'history':
      showToast('历史记录尚未启用');
      break;
    default:
      break;
  }
}

function handleImageError(event) {
  const img = event.target;
  if (img instanceof HTMLImageElement && img.dataset.fallbackDisplay) {
    showImageFallback(img);
  }
}

// ============================================================
//  KEYBOARD SUPPORT
// ============================================================
function handleKeyboard(event) {
  const quiz = document.getElementById('screen-quiz');
  if (quiz.classList.contains('hidden')) return;

  if (event.key >= '1'&& event.key <= '4') {
    selectOption(parseInt(event.key) - 1);
    return;
  }

  const key = event.key.toLowerCase();
  if (key === 'a') selectOption(0);
  if (key === 'b') selectOption(1);
  if (key === 'c') selectOption(2);
  if (key === 'd') selectOption(3);
  if (event.key === 'Enter'|| event.key === ' ') {
    event.preventDefault();
    nextQuestion();
  }
}

function initApp() {
  const progress = document.getElementById('progressFill');
  if (progress) progress.max = QUESTIONS.length;

  document.addEventListener('click', handleClick);
  document.addEventListener('keydown', handleKeyboard);
  document.getElementById('resultContent').addEventListener('error', handleImageError, true);
  initParticles();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp, { once: true });
} else {
  initApp();
}
