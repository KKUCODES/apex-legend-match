import { LEGENDS, LEGEND_PROFILES } from './data.js';

// ============================================================
//  COMPUTATION
// ============================================================
export function normalizeScores(scores) {
  return scores.map(s => {
    const n = 1 + (s / 30) * 9;
    return Math.max(1, Math.min(10, Math.round(n * 10) / 10));
  });
}

export function euclideanDist(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += (a[i] - b[i]) ** 2;
  return Math.sqrt(sum);
}

export function computeResults(userDims) {
  const matches = LEGENDS.map(p => ({
    legend: p, dist: euclideanDist(userDims, p.slice(4))
  }));
  matches.sort((a, b) => a.dist - b.dist);
  return { top: matches[0], userDims, all: matches };
}

export function generateDescription(legend, dist, userDims, legendDims) {
  const name = legend[1];
  const en = legend[2];
  const id = legend[0];
  const dimKeys = ['侵略','智略','机动','协作','韧性'];

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
