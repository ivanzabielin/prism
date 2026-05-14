(() => {
  const { rand } = Prism.utils;
  const TAU = Math.PI * 2;

  function spawn(x, y, vx, vy, life, color, size = 2, opts = {}) {
    Prism.state.particles.push({
      x, y, vx, vy,
      life, max: life,
      color,
      size,
      glow: opts.glow !== false,
      shrink: opts.shrink !== false,
      drag: opts.drag ?? 0.94,
      gravity: opts.gravity ?? 0,
    });
  }

  function explosion(x, y, color, count = 24, speed = 4, size = 3, life = 40, opts = {}) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * TAU;
      const s = rand(speed * 0.3, speed);
      spawn(x, y, Math.cos(a) * s, Math.sin(a) * s, rand(life * 0.6, life), color, rand(size * 0.5, size), opts);
    }
  }

  function ring(x, y, color, radius = 40, segments = 24) {
    for (let i = 0; i < segments; i++) {
      const a = (i / segments) * TAU;
      spawn(x, y, Math.cos(a) * radius / 8, Math.sin(a) * radius / 8, 32, color, 2);
    }
  }

  function streak(x, y, ang, color, count = 8, spread = 0.5, speed = 6, life = 22) {
    for (let i = 0; i < count; i++) {
      const a = ang + rand(-spread, spread);
      const s = rand(speed * 0.4, speed);
      spawn(x, y, Math.cos(a) * s, Math.sin(a) * s, rand(life * 0.6, life), color, rand(1.5, 3));
    }
  }

  function update(dt) {
    const arr = Prism.state.particles;
    for (const p of arr) {
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vx *= Math.pow(p.drag, dt);
      p.vy *= Math.pow(p.drag, dt);
      p.vy += p.gravity * dt;
      p.life -= dt;
    }
    Prism.state.particles = arr.filter(p => p.life > 0);
  }

  window.Prism = window.Prism || {};
  Prism.Particles = { spawn, explosion, ring, streak, update };
})();