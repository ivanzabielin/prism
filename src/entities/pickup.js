(() => {
  const { rand, dist2 } = Prism.utils;

  function spawn(x, y, kind) {
    Prism.state.pickups.push({
      x, y,
      vx: rand(-1, 1), vy: rand(-1, 1),
      kind, life: 600, t: 0,
    });
  }

  function update(dt) {
    const p = Prism.state.player; if (!p) return;
    const attract = 140 * p.mods.pickupRadiusMul;
    for (const k of Prism.state.pickups) {
      k.t += dt;
      k.vx *= Math.pow(0.96, dt);
      k.vy *= Math.pow(0.96, dt);
      const dx = p.x - k.x, dy = p.y - k.y, d = Math.hypot(dx, dy);
      if (d < attract) {
        const pull = 0.18 * (1 - d / attract + 0.5);
        k.vx += dx / (d || 1) * pull;
        k.vy += dy / (d || 1) * pull;
      }
      k.x += k.vx * dt; k.y += k.vy * dt;
      k.life -= dt;
      const rr = 18 + p.radius;
      if (dist2(k.x, k.y, p.x, p.y) < rr * rr) {
        if (k.kind === "heal") {
          p.hp = Math.min(p.maxHp, p.hp + p.mods.healAmount);
          Prism.Effects.floater(k.x, k.y - 8, "+REPAIR", "#ff88aa", 50);
        } else if (k.kind === "shield") {
          p.invuln = Math.max(p.invuln, 180);
          Prism.Effects.floater(k.x, k.y - 8, "+SHIELD", "#88ccff", 50);
        }
        Prism.Particles.explosion(k.x, k.y, k.kind === "heal" ? "#ff88aa" : "#88ccff", 18, 4, 3, 30);
        Prism.Effects.shockwave(k.x, k.y, k.kind === "heal" ? "#ff88aa" : "#88ccff", 80, 18, 3);
        Prism.Audio.sfx.pickup();
        k.life = 0;
      }
    }
    Prism.state.pickups = Prism.state.pickups.filter(k => k.life > 0);
  }

  window.Prism = window.Prism || {};
  Prism.Pickups = { spawn, update };
})();