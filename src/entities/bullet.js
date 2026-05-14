(() => {
  const { rand, dist2, clamp, norm } = Prism.utils;
  const TAU = Math.PI * 2;

  // ---- Player bullets ----
  function firePlayer(p) {
    const mods = p.mods;
    const baseSpread = 0.02;
    const total = 1 + mods.extraBolts;
    const arc = total === 1 ? 0 : 0.18 + total * 0.04 + (mods.spreadBonus || 0);
    const baseSpeed = 10 * mods.bulletSpeedMul;
    const baseLife = 70 * mods.bulletLifeMul;
    Prism.state.shotsFired += total;
    const critical = mods.lockedIn && p.lockHoldFrames >= 60;
    let dmg = mods.dmg;
    if (critical) dmg *= 3;
    if (mods.overdrive && Prism.state.combo >= 10) dmg = Math.ceil(dmg * 1.3);
    for (let i = 0; i < total; i++) {
      const offset = total === 1 ? 0 : (i / (total - 1) - 0.5) * arc;
      const a = p.angle + offset + (Math.random() - 0.5) * baseSpread;
      const bx = p.x + Math.cos(a) * (p.radius + 4);
      const by = p.y + Math.sin(a) * (p.radius + 4);
      Prism.state.bullets.push({
        x: bx, y: by,
        vx: Math.cos(a) * baseSpeed, vy: Math.sin(a) * baseSpeed,
        radius: critical ? 6 : 4,
        color: p.color,
        life: baseLife,
        dmg,
        pierce: mods.pierce,
        hits: new Set(),
        homing: false,
        echoTimer: mods.echo > 0 ? 3 : 0,
        echoCount: mods.echo,
        critical,
      });
      for (let k = 0; k < 3; k++) {
        Prism.Particles.spawn(bx, by,
          Math.cos(a) * rand(1, 3) + rand(-1, 1),
          Math.sin(a) * rand(1, 3) + rand(-1, 1),
          18, Prism.COLORS[p.color].hex, rand(1, 2.5));
      }
    }
    if (critical) {
      Prism.Effects.shockwave(p.x, p.y, Prism.COLORS[p.color].hex, 80, 18, 3);
      p.lockHoldFrames = 0;
    }
    Prism.Audio.sfx.shoot(p.color);
  }

  function spawnHomingSplinter(x, y, color) {
    const a = Math.random() * TAU;
    Prism.state.bullets.push({
      x, y, vx: Math.cos(a) * 3, vy: Math.sin(a) * 3,
      radius: 3.5, color, life: 80, dmg: 1,
      pierce: 0, hits: new Set(), homing: true, echoTimer: 0, echoCount: 0,
      critical: false,
    });
  }

  function updatePlayerBullets(dt) {
    const enemies = Prism.state.enemies;
    const bullets = Prism.state.bullets;
    for (const b of bullets) {
      // homing
      if (b.homing && enemies.length) {
        let best = null, bd = 1e9;
        for (const e of enemies) {
          if (e.spawnAnim > 0) continue;
          if (e.color !== b.color && e.color !== "W") continue;
          const dx = e.x - b.x, dy = e.y - b.y;
          const d = dx * dx + dy * dy;
          if (d < bd) { bd = d; best = e; }
        }
        if (best) {
          const dx = best.x - b.x, dy = best.y - b.y;
          const [nx, ny] = norm(dx, dy);
          const tvx = nx * 6, tvy = ny * 6;
          b.vx = b.vx * 0.9 + tvx * 0.1;
          b.vy = b.vy * 0.9 + tvy * 0.1;
        }
      }
      b.x += b.vx * dt; b.y += b.vy * dt;
      b.life -= dt;

      if (Math.random() < 0.4) {
        Prism.Particles.spawn(b.x, b.y, rand(-.4, .4), rand(-.4, .4), 14, Prism.COLORS[b.color].hex, rand(1, 2));
      }

      // echo trail damage spawn
      if (b.echoCount > 0) {
        b.echoTimer -= dt;
        if (b.echoTimer <= 0) {
          // leave a stationary damaging mote behind for short time
          Prism.state.enemyBullets.push({
            x: b.x, y: b.y, vx: 0, vy: 0,
            radius: 7, color: b.color, life: 24, dmg: 1,
            isEcho: true,
            ownerColor: b.color,
          });
          b.echoTimer = 3;
        }
      }

      // collisions
      for (const e of enemies) {
        if (e.spawnAnim > 0) continue;
        if (b.hits.has(e)) continue;
        const rr = b.radius + e.radius;
        if (dist2(b.x, b.y, e.x, e.y) < rr * rr) {
          const matched = (e.color === b.color || e.color === "W");
          if (matched) {
            b.hits.add(e);
            Prism.state.shotsHit += 1;
            Prism.Enemies.damage(e, b.dmg, b.x, b.y, b.color);
            if (b.pierce > 0) b.pierce -= 1;
            else b.life = 0;
            if (b.critical) {
              Prism.Effects.shockwave(b.x, b.y, Prism.COLORS[b.color].hex, 100, 20, 3);
            }
          } else {
            // reject
            b.life = 0;
            Prism.Particles.explosion(b.x, b.y, "#ffffff", 6, 3, 2, 18);
            Prism.Audio.sfx.reject();
            // refractor mod
            if (Prism.state.player.mods.refractorRadius > 0) {
              const r = Prism.state.player.mods.refractorRadius;
              const dmg = Prism.state.player.mods.refractorDmg;
              Prism.Effects.shockwave(b.x, b.y, Prism.COLORS[b.color].hex, r, 18, 3);
              for (const e2 of Prism.state.enemies) {
                if (e2.spawnAnim > 0) continue;
                if (e2.color === b.color || e2.color === "W") {
                  if (dist2(e2.x, e2.y, b.x, b.y) < r * r) {
                    Prism.Enemies.damage(e2, dmg, b.x, b.y, b.color);
                  }
                }
              }
            }
          }
          break;
        }
      }
    }
    Prism.state.bullets = bullets.filter(b => b.life > 0 && b.x > -40 && b.x < Prism.state.W + 40 && b.y > -40 && b.y < Prism.state.H + 40);
  }

  // ---- Enemy bullets ----
  function fireEnemy(e, opts = {}) {
    const a = opts.angle ?? Math.atan2((Prism.state.player.y - e.y), (Prism.state.player.x - e.x));
    const speed = opts.speed ?? 5;
    Prism.state.enemyBullets.push({
      x: e.x, y: e.y,
      vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
      radius: opts.radius ?? 5,
      color: opts.color ?? e.color,
      life: opts.life ?? 180,
      dmg: opts.dmg ?? 1,
      isEcho: false,
    });
    Prism.Audio.sfx.shoot(opts.color ?? e.color);
  }

  function updateEnemyBullets(dt) {
    const p = Prism.state.player;
    for (const b of Prism.state.enemyBullets) {
      b.x += b.vx * dt; b.y += b.vy * dt;
      b.life -= dt;
      if (!b.isEcho && Math.random() < 0.5) {
        Prism.Particles.spawn(b.x, b.y, rand(-.3, .3), rand(-.3, .3), 14, Prism.COLORS[b.color].hex, rand(1, 2));
      }
      if (p && p.invuln <= 0) {
        const rr = b.radius + p.radius;
        if (dist2(b.x, b.y, p.x, p.y) < rr * rr) {
          if (!b.isEcho || (b.isEcho && b.ownerColor !== p.color)) {
            // echoes don't hurt — they're player-owned damaging zones
            if (!b.isEcho) {
              Prism.Player.damage(1);
              b.life = 0;
            }
          }
        }
      }
      // echoes damage enemies
      if (b.isEcho) {
        for (const e of Prism.state.enemies) {
          if (e.spawnAnim > 0) continue;
          if (e.color !== b.ownerColor && e.color !== "W") continue;
          const rr = b.radius + e.radius;
          if (dist2(b.x, b.y, e.x, e.y) < rr * rr) {
            Prism.Enemies.damage(e, 1, b.x, b.y, b.ownerColor);
            b.life = Math.min(b.life, 4);
            break;
          }
        }
      }
    }
    Prism.state.enemyBullets = Prism.state.enemyBullets.filter(
      b => b.life > 0 && b.x > -40 && b.x < Prism.state.W + 40 && b.y > -40 && b.y < Prism.state.H + 40
    );
  }

  window.Prism = window.Prism || {};
  Prism.Bullets = { firePlayer, fireEnemy, updatePlayerBullets, updateEnemyBullets, spawnHomingSplinter };
})();