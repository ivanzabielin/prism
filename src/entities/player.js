(() => {
  const { lerp, clamp, rand } = Prism.utils;
  const TAU = Math.PI * 2;

  function makeMods() {
    return {
      extraBolts: 0,
      bulletSpeedMul: 1,
      bulletLifeMul: 1,
      pierce: 0,
      dmg: 1,
      fireRateMul: 1,
      refractorRadius: 0,
      refractorDmg: 1,
      spectrum: false,
      echo: 0,
      pickupRateMul: 1,
      healAmount: 1,
      dashCDMul: 1,
      dashInvulnMul: 1,
      aegis: 0,
      reflex: false,
      comboHoldMul: 1,
      comboScoreMul: 1,
      pickupRadiusMul: 1,
      speedMul: 1,
      lockedIn: false,
      overdrive: false,
      spreadBonus: 0,
    };
  }

  function make() {
    const p = {
      x: Prism.state.W / 2, y: Prism.state.H / 2,
      vx: 0, vy: 0, angle: 0,
      radius: 14,
      hp: 5, maxHp: 5,
      color: "R",
      speed: 4.2,
      dashCD: 0, dashTime: 0, dashDir: { x: 0, y: 0 }, dashMax: 60,
      invuln: 0,
      shootCD: 0,
      trail: [],
      mods: makeMods(),
      lockHoldFrames: 0,
      upgrades: {},
      charge: 0, chargeMax: 100,
      overloadFlash: 0,
      ship: null,
    };
    const shipId = Prism.state.selectedShip || "lance";
    const ship = Prism.Ships.byId(shipId);
    p.ship = ship;
    ship.apply(p);
    return p;
  }

  function tryOverload() {
    const p = Prism.state.player;
    if (!p || Prism.state.scene !== "play") return;
    if (p.charge < p.chargeMax) return;
    p.charge = 0;
    p.overloadFlash = 30;
    p.invuln = Math.max(p.invuln, 30);
    const radius = 240;
    Prism.Effects.shake(28);
    Prism.Effects.hitstop(8);
    Prism.Effects.flash(0.55);
    Prism.Effects.shockwave(p.x, p.y, "#ffffff", radius, 36, 6);
    Prism.Effects.shockwave(p.x, p.y, Prism.COLORS[p.color].hex, radius + 60, 50, 4);
    Prism.Particles.explosion(p.x, p.y, "#ffffff", 80, 7, 4, 60);
    Prism.Audio.sfx.bigKill();
    Prism.Audio.sfx.shockwave();
    if (Prism.Achievements) Prism.Achievements.onOverload();
    // damage all enemies in range regardless of color
    for (const e of Prism.state.enemies.slice()) {
      if (e.spawnAnim > 0) continue;
      const dx = e.x - p.x, dy = e.y - p.y;
      if (dx * dx + dy * dy < radius * radius) {
        Prism.Enemies.damage(e, e.isBoss ? 6 : 4, e.x, e.y, p.color);
      }
    }
    // destroy enemy bullets in range
    for (const b of Prism.state.enemyBullets) {
      const dx = b.x - p.x, dy = b.y - p.y;
      if (dx * dx + dy * dy < radius * radius) {
        Prism.Particles.explosion(b.x, b.y, Prism.COLORS[b.color].hex, 4, 3, 2, 18);
        b.life = 0;
      }
    }
  }

  function tryDash() {
    const p = Prism.state.player;
    if (!p || Prism.state.scene !== "play") return;
    if (p.dashCD > 0) return;
    let dx = 0, dy = 0;
    if (Prism.Input.heldAny("w", "arrowup")) dy -= 1;
    if (Prism.Input.heldAny("s", "arrowdown")) dy += 1;
    if (Prism.Input.heldAny("a", "arrowleft")) dx -= 1;
    if (Prism.Input.heldAny("d", "arrowright")) dx += 1;
    if (dx === 0 && dy === 0) { dx = Math.cos(p.angle); dy = Math.sin(p.angle); }
    const len = Math.hypot(dx, dy) || 1;
    p.dashDir.x = dx / len; p.dashDir.y = dy / len;
    p.dashTime = 12;
    p.dashCD = 60 * p.mods.dashCDMul;
    p.dashMax = p.dashCD;
    p.invuln = 14 * p.mods.dashInvulnMul;
    for (let i = 0; i < 16; i++) {
      Prism.Particles.spawn(p.x, p.y,
        -p.dashDir.x * rand(2, 5) + rand(-1, 1),
        -p.dashDir.y * rand(2, 5) + rand(-1, 1),
        rand(18, 30), Prism.COLORS[p.color].hex, rand(2, 4));
    }
    Prism.Audio.sfx.dash();
  }

  function update(dt) {
    const p = Prism.state.player; if (!p) return;
    const I = Prism.Input;

    // color switch
    if (I.justPressed("1")) p.color = "R";
    if (I.justPressed("2")) p.color = "G";
    if (I.justPressed("3")) p.color = "B";
    if (I.justPressed("q")) cycle(-1);
    if (I.justPressed("e")) cycle(1);
    if (I.justPressed(" ") || I.justPressed("shift")) tryDash();
    if (I.justPressed("r") || I.justPressed("f")) tryOverload();
    if (Prism.Input.mouse.rmbJust) tryOverload();
    if (p.overloadFlash > 0) p.overloadFlash -= dt;

    let dx = 0, dy = 0;
    if (I.heldAny("w", "arrowup")) dy -= 1;
    if (I.heldAny("s", "arrowdown")) dy += 1;
    if (I.heldAny("a", "arrowleft")) dx -= 1;
    if (I.heldAny("d", "arrowright")) dx += 1;
    const len = Math.hypot(dx, dy);
    if (len > 0) { dx /= len; dy /= len; }

    if (p.dashTime > 0) {
      p.x += p.dashDir.x * 11 * dt; p.y += p.dashDir.y * 11 * dt;
      p.dashTime -= dt;
      if (Math.random() < 0.8) {
        Prism.Particles.spawn(p.x, p.y, rand(-.5, .5), rand(-.5, .5), 22, Prism.COLORS[p.color].hex, 3);
      }
    } else {
      const sp = p.speed * p.mods.speedMul;
      const tvx = dx * sp, tvy = dy * sp;
      p.vx = lerp(p.vx, tvx, 1 - Math.pow(1 - 0.22, dt));
      p.vy = lerp(p.vy, tvy, 1 - Math.pow(1 - 0.22, dt));
      p.x += p.vx * dt; p.y += p.vy * dt;
    }
    p.x = clamp(p.x, p.radius, Prism.state.W - p.radius);
    p.y = clamp(p.y, p.radius, Prism.state.H - p.radius);

    if (p.dashCD > 0) p.dashCD -= dt;
    if (p.invuln > 0) p.invuln -= dt;
    if (p.shootCD > 0) p.shootCD -= dt;

    p.angle = Math.atan2(Prism.Input.mouse.y - p.y, Prism.Input.mouse.x - p.x);

    p.trail.push({ x: p.x, y: p.y, life: 12, color: p.color });
    if (p.trail.length > 18) p.trail.shift();
    for (const t of p.trail) t.life -= dt;
    p.trail = p.trail.filter(t => t.life > 0);

    if (Prism.Input.mouse.down) {
      p.lockHoldFrames += dt;
      if (p.shootCD <= 0) {
        Prism.Bullets.firePlayer(p);
        let cd = 9 * p.mods.fireRateMul;
        if (p.mods.overdrive && Prism.state.combo >= 10) cd *= 0.7;
        p.shootCD = cd;
      }
    } else {
      p.lockHoldFrames = 0;
    }
  }

  function cycle(dir) {
    const p = Prism.state.player;
    const i = Prism.COLOR_ORDER.indexOf(p.color);
    p.color = Prism.COLOR_ORDER[(i + dir + 3) % 3];
  }

  function damage(amount) {
    const p = Prism.state.player; if (!p) return;
    if (p.invuln > 0) return;
    if (p.mods.aegis > 0 && Math.random() < p.mods.aegis) {
      Prism.Effects.shockwave(p.x, p.y, "#ffffff", 60, 18, 3);
      Prism.Effects.flash(0.15);
      p.invuln = 18;
      return;
    }
    p.hp -= amount;
    p.invuln = 50;
    Prism.state.damageThisWave += amount;
    Prism.Effects.shake(24);
    Prism.Effects.flash(0.5);
    Prism.Particles.explosion(p.x, p.y, "#ffffff", 24, 5, 3, 36);
    Prism.Audio.sfx.hurt();
    if (p.hp <= 0) die();
  }

  function die() {
    const p = Prism.state.player;
    Prism.Particles.explosion(p.x, p.y, "#ffffff", 100, 9, 5, 90);
    Prism.Particles.explosion(p.x, p.y, Prism.COLORS[p.color].hex, 70, 7, 4, 80);
    Prism.Effects.shockwave(p.x, p.y, "#ffffff", 280, 50, 6);
    Prism.Audio.sfx.death();
    Prism.Game.onDeath();
  }

  window.Prism = window.Prism || {};
  Prism.Player = { make, update, damage, tryDash, tryOverload, makeMods };
})();