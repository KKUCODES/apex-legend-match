import {
  EASTER_EGG_OPTION_SCORES,
  EASTER_EGG_RULES,
  LEGENDS,
  LEGEND_MATCH_CALIBRATION,
  LEGEND_TRAIT_PROFILES,
  LEGEND_PROFILES,
  OPTION_TRAIT_SCORES,
  QUESTIONS,
  TRAIT_KEYS,
} from './data.js';

// ============================================================
//  COMPUTATION
// ============================================================
const DIMENSION_COUNT = 5;
const TRAIT_COUNT = TRAIT_KEYS.length;
const HIDDEN_LEGEND_ID_START = 90;
const CENTERED_VECTOR_EPSILON = 0.25;
const CENTER_ABSORPTION_WEIGHT = 0.3;
const DIMENSION_RANK_WEIGHT = 0.65;
const TRAIT_RANK_WEIGHT = 1.35;

function getScoreBounds() {
  const min = Array(DIMENSION_COUNT).fill(0);
  const max = Array(DIMENSION_COUNT).fill(0);

  QUESTIONS.forEach(question => {
    for (let i = 0; i < DIMENSION_COUNT; i++) {
      const values = question.opts.map(option => option[1][i]);
      min[i] += Math.min(...values);
      max[i] += Math.max(...values);
    }
  });

  return { min, max };
}

const SCORE_BOUNDS = getScoreBounds();
const TRAIT_SCORE_BOUNDS = getTraitScoreBounds();
const DIMENSION_CENTER = getNeutralDimensionCenter();
const EASTER_EGG_MAX_SCORES = getEasterEggMaxScores();

export function normalizeScores(scores) {
  return scores.map((s, i) => normalizeScoreValue(s, i));
}

export function normalizeTraitScores(scores) {
  return scores.map((s, i) => normalizeTraitScoreValue(s, i));
}

function normalizeScoreValue(score, dimensionIndex) {
  const range = SCORE_BOUNDS.max[dimensionIndex] - SCORE_BOUNDS.min[dimensionIndex] || 1;
  const n = 1 + ((score - SCORE_BOUNDS.min[dimensionIndex]) / range) * 9;
  return Math.max(1, Math.min(10, Math.round(n * 10) / 10));
}

function normalizeTraitScoreValue(score, traitIndex) {
  const range = TRAIT_SCORE_BOUNDS.max[traitIndex] - TRAIT_SCORE_BOUNDS.min[traitIndex] || 1;
  const n = 1 + ((score - TRAIT_SCORE_BOUNDS.min[traitIndex]) / range) * 9;
  return Math.max(1, Math.min(10, Math.round(n * 10) / 10));
}

function getTraitScoreBounds() {
  const min = Array(TRAIT_COUNT).fill(0);
  const max = Array(TRAIT_COUNT).fill(0);

  OPTION_TRAIT_SCORES.forEach(row => {
    for (let i = 0; i < TRAIT_COUNT; i++) {
      const values = row.map(option => option[i] || 0);
      min[i] += Math.min(...values);
      max[i] += Math.max(...values);
    }
  });

  return { min, max };
}

function getNeutralDimensionCenter() {
  const rawCenter = Array(DIMENSION_COUNT).fill(0);

  QUESTIONS.forEach(question => {
    for (let i = 0; i < DIMENSION_COUNT; i++) {
      rawCenter[i] += question.opts.reduce((sum, option) => sum + option[1][i], 0) / question.opts.length;
    }
  });

  return rawCenter.map((score, i) => normalizeScoreValue(score, i));
}

function getEasterEggMaxScores() {
  const ids = Object.keys(EASTER_EGG_RULES);
  const maxScores = Object.fromEntries(ids.map(id => [id, 0]));

  EASTER_EGG_OPTION_SCORES.forEach(row => {
    ids.forEach(id => {
      const bestForQuestion = Math.max(0, ...row.map(option => option[id] || 0));
      maxScores[id] += bestForQuestion;
    });
  });

  return maxScores;
}

export function euclideanDist(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += (a[i] - b[i]) ** 2;
  return Math.sqrt(sum);
}

function centeredCosineDist(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < DIMENSION_COUNT; i++) {
    const av = a[i] - DIMENSION_CENTER[i];
    const bv = b[i] - DIMENSION_CENTER[i];
    dot += av * bv;
    normA += av * av;
    normB += bv * bv;
  }

  const magA = Math.sqrt(normA);
  const magB = Math.sqrt(normB);
  if (magA < CENTERED_VECTOR_EPSILON || magB < CENTERED_VECTOR_EPSILON) {
    return 1 + euclideanDist(a, b) / 20.1;
  }

  return 1 - dot / (magA * magB);
}

function centeredMagnitude(dims) {
  let sum = 0;
  for (let i = 0; i < DIMENSION_COUNT; i++) {
    sum += (dims[i] - DIMENSION_CENTER[i]) ** 2;
  }
  return Math.sqrt(sum);
}

function combatProfileDist(userDims, legendDims) {
  // 防止过于接近中心的角色吸收大量轻微倾向答案。
  const centerPenalty = CENTER_ABSORPTION_WEIGHT / (centeredMagnitude(legendDims) + 0.75);
  return centeredCosineDist(userDims, legendDims) + centerPenalty;
}

function traitProfileDist(userTraits, legendId) {
  const profile = LEGEND_TRAIT_PROFILES[legendId];
  if (!userTraits || !profile) return 0;

  let sum = 0;
  for (let i = 0; i < TRAIT_COUNT; i++) {
    sum += Math.abs((userTraits[i] || 1) - (profile[i] || 1));
  }

  return sum / (TRAIT_COUNT * 9);
}

function buildMatch(userDims, legend, userTraits) {
  const legendDims = legend.slice(4);
  const dimensionRank = combatProfileDist(userDims, legendDims);
  const traitRank = traitProfileDist(userTraits, legend[0]);
  const calibration = LEGEND_MATCH_CALIBRATION[legend[0]] || 0;
  return {
    legend,
    dist: euclideanDist(userDims, legendDims),
    rankScore: dimensionRank * DIMENSION_RANK_WEIGHT + traitRank * TRAIT_RANK_WEIGHT + calibration,
    traitRank,
  };
}

export function computeResults(userDims, eggScores = {}, userTraits = null) {
  const playableMatches = LEGENDS
    .filter(p => p[0] < HIDDEN_LEGEND_ID_START)
    .map(p => buildMatch(userDims, p, userTraits));

  playableMatches.sort((a, b) => a.rankScore - b.rankScore);

  const hiddenMatches = LEGENDS
    .filter(p => p[0] >= HIDDEN_LEGEND_ID_START)
    .map(p => buildMatch(userDims, p, userTraits));

  hiddenMatches.sort((a, b) => a.rankScore - b.rankScore);

  const bestHidden = selectEasterEggMatch(hiddenMatches, eggScores);
  const matches = bestHidden ? [bestHidden, ...playableMatches] : [...playableMatches];

  return { top: matches[0], userDims, all: matches };
}

function selectEasterEggMatch(hiddenMatches, eggScores) {
  let best = null;

  hiddenMatches.forEach(match => {
    const id = match.legend[0];
    const rule = EASTER_EGG_RULES[id];
    if (!rule) return;

    const score = eggScores[id] || 0;
    if (score < rule.minScore) return;

    const surplus = score - rule.minScore;
    const completion = score / (EASTER_EGG_MAX_SCORES[id] || rule.minScore);
    if (
      !best ||
      completion > best.completion ||
      (completion === best.completion && surplus > best.surplus) ||
      (completion === best.completion && surplus === best.surplus && match.dist < best.match.dist)
    ) {
      best = { match, score, surplus, completion };
    }
  });

  if (!best) {
    return null;
  }

  return {
    ...best.match,
    eggScore: best.score,
    eggThreshold: EASTER_EGG_RULES[best.match.legend[0]].minScore,
    eggCompletion: best.completion,
  };
}

export function getScoreDebugInfo() {
  return { dimensions: SCORE_BOUNDS, traits: TRAIT_SCORE_BOUNDS };
}

export function generateDescription(legend, dist, userDims, legendDims) {
  const name = legend[1];
  const en = legend[2];
  const id = legend[0];
  const dimKeys = ['进攻欲','智略','机动性','团队协作','韧性'];

  const matchPct = parseFloat(((1 - dist / 20.1) * 100).toFixed(1));

  // 找到用户与角色差异最大的维度
  const diffs = userDims.map((u, i) => ({ i, diff: Math.abs(u - legendDims[i]) }));
  diffs.sort((a, b) => b.diff - a.diff);
  const maxDiff = diffs[0].diff;
  const maxDiffIdx = diffs[0].i;

  // 找到用户最突出的维度
  const userTop = [...Array(5)].map((_, i) => i).sort((a, b) => userDims[b] - userDims[a])[0];

  const profile = LEGEND_PROFILES[id];

  // 匹配度句
  let matchLine = '';
  if (matchPct >= 85) matchLine = `你与${name}（${en}）的灵魂几乎同频——`;
  else if (matchPct >= 70) matchLine = `你在${name}（${en}）身上看到了自己的影子——`;
  else matchLine = `你和${name}（${en}）有着微妙的共鸣——`;

  // 差异句
  let diffLine = '';
  if (maxDiff < 1) {
    diffLine = `你们的五维图谱几乎完美重合，仿佛战场上的一面镜子。`;
  } else {
    const diffDimName = dimKeys[maxDiffIdx];
    const userVal = userDims[maxDiffIdx];
    const legendVal = legendDims[maxDiffIdx];
    if (userVal > legendVal) {
      diffLine = `不过你在「${diffDimName}」上比${name}更加突出，这让你成为了一个更极致的版本。`;
    } else {
      diffLine = `不过你在「${diffDimName}」上比${name}稍弱一些——但这也意味着你有更大的成长空间。`;
    }
  }

  return matchLine + profile.core + ''+ diffLine;
}
