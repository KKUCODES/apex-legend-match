// ============================================================
//  RADAR CHART
// ============================================================
export function drawRadar(userDims, legendDims, labels, legendColor) {
  const canvas = document.getElementById('radarCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const cx = W / 2, cy = H / 2;
  const R = Math.min(W, H) / 2 - 54;
  const n = 5;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(6,9,14,0.32)';
  ctx.fillRect(0, 0, W, H);

  // Grid rings
  for (let ring = 2.5; ring <= 10; ring += 2.5) {
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      const r = (ring / 10) * R;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = ring === 10 ? 'rgba(255,212,123,0.22)': 'rgba(255,212,123,0.12)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = 'rgba(223,211,194,0.34)';
    ctx.font = '10px Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(String(Math.round(ring * 10)), cx + 2, cy - (ring / 10) * R + 4);
  }

  // Axis lines
  for (let i = 0; i < n; i++) {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + R * Math.cos(angle), cy + R * Math.sin(angle));
    ctx.strokeStyle = 'rgba(0,226,209,0.16)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Legend polygon
  drawPoly(ctx, cx, cy, R, legendDims, legendColor + '34', legendColor, n);
  // User polygon
  drawPoly(ctx, cx, cy, R, userDims, 'rgba(255,212,123,0.24)', '#FFD47B', n);

  // Labels
  ctx.font = '13px "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'center';
  for (let i = 0; i < n; i++) {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const lr = R + 32;
    const lx = cx + lr * Math.cos(angle);
    const ly = cy + lr * Math.sin(angle);
    ctx.fillStyle = 'rgba(239,229,210,0.72)';
    ctx.fillText(labels[i], lx, ly + 4);
  }
}

function drawPoly(ctx, cx, cy, R, dims, fill, stroke, n) {
  const points = [];
  ctx.beginPath();
  for (let i = 0; i <= n; i++) {
    const idx = i % n;
    const angle = (Math.PI * 2 * idx) / n - Math.PI / 2;
    const r = (dims[idx] / 10) * R;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    if (i < n) points.push([x, y]);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.shadowColor = stroke;
  ctx.shadowBlur = 14;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.shadowBlur = 0;

  points.forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = stroke;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.62)';
    ctx.lineWidth = 1;
    ctx.stroke();
  });
}
