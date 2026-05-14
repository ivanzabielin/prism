(() => {
  const TAU = Math.PI * 2;
  const rand = (a, b) => a + Math.random() * (b - a);
  const randi = (a, b) => Math.floor(rand(a, b));
  const choice = arr => arr[Math.floor(Math.random() * arr.length)];
  const choiceN = (arr, n) => {
    const pool = arr.slice();
    const out = [];
    for (let i = 0; i < n && pool.length; i++) {
      out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    }
    return out;
  };
  const weightedChoice = (entries) => {
    let total = 0;
    for (const [, w] of entries) total += w;
    let r = Math.random() * total;
    for (const [v, w] of entries) { r -= w; if (r <= 0) return v; }
    return entries[entries.length - 1][0];
  };
  const clamp = (x, a, b) => x < a ? a : x > b ? b : x;
  const lerp = (a, b, t) => a + (b - a) * t;
  const dist2 = (ax, ay, bx, by) => { const dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; };
  const len = (x, y) => Math.hypot(x, y);
  const norm = (x, y) => { const l = Math.hypot(x, y) || 1; return [x / l, y / l]; };
  const angleTo = (ax, ay, bx, by) => Math.atan2(by - ay, bx - ax);
  const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
  const easeInOutCubic = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  window.Prism = window.Prism || {};
  Prism.utils = { TAU, rand, randi, choice, choiceN, weightedChoice, clamp, lerp, dist2, len, norm, angleTo, easeOutCubic, easeInOutCubic };
})();