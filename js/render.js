import { CLASS_COLORS, QUESTIONS } from './data.js';
import { drawRadar } from './radar.js';
import { generateDescription } from './scoring.js';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];
const DIMENSION_NAMES = ['进攻欲','侦察力','控场力','团队协作','应变性'];

// ============================================================
//  SCREEN MANAGEMENT
// ============================================================
export function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  document.getElementById('screen-'+ name).classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth'});
}

export function renderQuestion(currentQ) {
  const q = QUESTIONS[currentQ];
  document.getElementById('questionText').textContent = q.q;
  document.getElementById('qLabel').innerHTML = `第 <strong>${currentQ + 1}</strong> / ${QUESTIONS.length} 题`;
  const pct = Math.round(((currentQ + 1) / QUESTIONS.length) * 100);
  document.getElementById('qPercent').textContent = pct + '%';
  document.getElementById('progressFill').value = currentQ + 1;
  document.getElementById('diamondWrapper').style.left = pct + '%';

  const container = document.getElementById('optionsContainer');
  container.innerHTML = q.opts.map((opt, i) => `
    <button class="option-card"type="button"data-option-index="${i}"aria-pressed="false">
      <span class="option-key">${OPTION_LABELS[i]}</span>
      <span class="option-copy">${opt[0]}</span>
    </button>
  `).join('');

  const btn = document.getElementById('nextBtn');
  btn.classList.add('is-disabled');
  if (currentQ === QUESTIONS.length - 1) btn.textContent = '查看结果 →';
  else btn.textContent = '下一题 →';
}

export function markSelectedOption(idx) {
  document.querySelectorAll('.option-card').forEach((c, i) => {
    c.classList.toggle('is-selected', i === idx);
    c.setAttribute('aria-pressed', i === idx ? 'true': 'false');
  });
  document.getElementById('nextBtn').classList.remove('is-disabled');
}

// ============================================================
//  RESULT RENDERING
// ============================================================
export function renderResult(results) {
  const r = results.top;
  const p = r.legend;
  const dist = r.dist;
  const matchPct = (Math.max(0, (1 - dist / 20.1) * 100)).toFixed(1);
  const classColor = CLASS_COLORS[p[3]] || '#DA292A';
  const uv = results.userDims.map(d => Math.round(d * 10) / 10);
  const pv = p.slice(4);
  const neighbors = results.all.filter(n => n.legend[0] !== 99).slice(1, 4);

  const pctNum = parseFloat(matchPct);
  const isEasterEgg = p[0] === 99;
  const tierLabel = isEasterEgg ? '隐藏档案': pctNum >= 85 ? '传奇级契合': pctNum >= 70 ? '战术协同': pctNum >= 55 ? '同队感应': '外域路人';

  const now = new Date();
  const dateStr = now.getFullYear() + '-'+ String(now.getMonth()+1).padStart(2,'0') + '-'+ String(now.getDate()).padStart(2,'0');

  const portraitFile = p[2].toLowerCase().replace(/\s+/g, '_');

  const container = document.getElementById('resultContent');
  container.innerHTML = `
    <section class="hud-shell result-hud"style="--role-color:${classColor}; --panel-accent:${classColor};">
      <div class="result-topbar">
        <button class="icon-button"data-action="restart-quiz"aria-label="返回">←</button>
        <div class="result-title">
          <strong>检测结果</strong>
          <span>APEX RESULTS</span>
        </div>
        <button class="history-button"data-action="history">⊕ 历史记录</button>
      </div>

      <!-- 档案抬头 -->
      <div class="archive-meta">档案编号 AXTI-${String(p[0]).padStart(4,'0')} · ${dateStr}</div>

      <!-- 传奇画像 -->
      <div class="result-hero">
        <div class="portrait-orbit"style="--role-color:${classColor};">
          <img src="portraits/${portraitFile}.webp"data-fallback-display="grid"alt="${p[1]}">
          <div class="portrait-fallback">◇</div>
        </div>
        <div class="result-identity">
          <h2>${p[1]}</h2>
          <p>${p[2]} · ${p[3]}</p>
          <div class="match-row">
            <div class="match-ring"style="--match:${Math.min(100, pctNum) * 3.6}deg; --role-color:${classColor};"><span class="match-value">${Math.round(pctNum)}<small>%</small></span></div>
            <div class="tier-panel">${tierLabel}</div>
          </div>
        </div>
      </div>

      <!-- 战术分析 -->
      <div class="analysis-box"style="--panel-accent:${classColor};">
        <p class="panel-title">战术分析</p>
        <div class="analysis-copy">${generateDescription(p, dist, uv, pv)}</div>
        <div class="analysis-watermark"></div>
      </div>

      <div class="combat-grid">
        <!-- 五维作战数据 -->
        <div class="data-panel"style="--panel-accent:var(--apex-red);">
          <p class="panel-title">五维作战数据</p>
          <div class="metric-legend">
            <span style="--legend-color:var(--apex-gold);">用户</span>
            <span style="--legend-color:${classColor};">角色</span>
          </div>
          <div class="metric-list">
            ${DIMENSION_NAMES.map((d, i) => {
              const uVal = uv[i], pVal = pv[i];
              return `<div class="metric-row">
                <span>${d}</span>
                <div class="metric-bars">
                  <div class="metric-bar"><div class="metric-fill"style="--value:${uVal*10}%; --bar-color:var(--apex-gold);"></div></div>
                  <div class="metric-bar"><div class="metric-fill"style="--value:${pVal*10}%; --bar-color:${classColor};"></div></div>
                </div>
                <span class="metric-values">
                  <b style="color:var(--apex-gold);">${Math.round(uVal * 10)}</b>
                  <b style="color:${classColor};">${Math.round(pVal * 10)}</b>
                </span>
              </div>`;
            }).join('')}
          </div>
        </div>

        <!-- 雷达图 -->
        <div class="data-panel radar-panel"style="--panel-accent:var(--apex-red);">
          <p class="panel-title">能力雷达图</p>
          <canvas id="radarCanvas"width="320"height="320"></canvas>
        </div>
      </div>

      <!-- 关联档案 -->
      <div class="related-panel"style="--panel-accent:var(--apex-red);">
        <div class="related-head">
          <p class="panel-title">关联档案</p>
          <span class="related-more">更多匹配 →</span>
        </div>
        <div class="neighbor-grid">
          ${neighbors.map((n, idx) => {
            const nl = n.legend;
            const nlPct = (Math.max(0, (1 - n.dist / 20.1) * 100)).toFixed(1);
            const nlColor = CLASS_COLORS[nl[3]] || '#DA292A';
            const nlFile = nl[2].toLowerCase().replace(/\s+/g, '_');
            return `<article class="related-card"style="--role-color:${nlColor};">
              <div class="related-rank">${idx + 2}</div>
              <img src="portraits/${nlFile}.webp"data-fallback-display="flex"alt="${nl[1]}">
              <div class="related-fallback">◇</div>
              <div class="related-copy">
                <h3>${nl[1]}</h3>
                <small>${nl[3]}</small>
                <p>${Math.round(parseFloat(nlPct))}<span>%</span></p>
                <small>契合度</small>
              </div>
            </article>`;
          }).join('')}
        </div>
      </div>

      <div class="result-actions">
        <button class="hud-action"data-action="restart-quiz">重新检测</button>
        <button class="hud-action hud-action--ghost"data-action="share-result">分享档案</button>
      </div>
      <p class="result-footer">APEX · 人格分析系统 · 外域边境</p>
    </section>
  `;

  // Draw radar chart
  setTimeout(() => drawRadar(uv, pv, DIMENSION_NAMES, classColor), 100);
}

export function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.remove('hidden');
  setTimeout(() => t.classList.add('hidden'), 2000);
}

export function showImageFallback(img) {
  img.style.display = 'none';
  const fallback = img.nextElementSibling;
  if (fallback) fallback.style.display = img.dataset.fallbackDisplay || 'grid';
}
