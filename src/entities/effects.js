(() => {
  function shockwave(x, y, color, maxRadius = 140, life = 26, lineWidth = 4) {
    Prism.state.shockwaves.push({ x, y, color, r: 0, max: maxRadius, life, maxLife: life, lw: lineWidth });
  }

  function floater(x, y, text, color, life = 50, dy = -0.6) {
    Prism.state.floaters.push({ x, y, text, color, life, max: life, dy });
  }

  function shake(amount) {
    Prism.state.shake = Math.min(40, Prism.state.shake + amount);
  }

  function hitstop(frames) {
    Prism.state.hitstop = Math.max(Prism.state.hitstop, frames);
  }

  function flash(intensity) {
    Prism.state.flash = Math.max(Prism.state.flash, intensity);
  }

  function update(dt) {
    for (const s of Prism.state.shockwaves) {
      const t = 1 - s.life / s.maxLife;
      s.r = s.max * Prism.utils.easeOutCubic(t);
      s.life -= dt;
    }
    Prism.state.shockwaves = Prism.state.shockwaves.filter(s => s.life > 0);

    for (const f of Prism.state.floaters) {
      f.y += f.dy * dt;
      f.dy *= Math.pow(0.96, dt);
      f.life -= dt;
    }
    Prism.state.floaters = Prism.state.floaters.filter(f => f.life > 0);
  }

  window.Prism = window.Prism || {};
  Prism.Effects = { shockwave, floater, shake, hitstop, flash, update };
})();