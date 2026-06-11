// ============================================================
//  PARTICLES
// ============================================================
export function initParticles() {
  const container = document.getElementById('particles');
  if (!container) return;

  const colors = ['#FF2B22', '#FF7A21', '#FFD47B', '#B80D11'];
  for (let i = 0; i < 35; i++) {
    const dot = document.createElement('div');
    dot.className = 'dot';
    const color = colors[Math.floor(Math.random() * colors.length)];
    const length = 8 + Math.random() * 28;
    dot.style.width = (1 + Math.random() * 2) + 'px';
    dot.style.height = length + 'px';
    dot.style.left = Math.random() * 100 + '%';
    dot.style.color = color;
    dot.style.background = `linear-gradient(180deg, ${color}, transparent)`;
    dot.style.animationDuration = (12 + Math.random() * 20) + 's';
    dot.style.animationDelay = -(Math.random() * 20) + 's';
    container.appendChild(dot);
  }
}
