(() => {
  const { rand, randi, choice, clamp, lerp, dist2 } = Prism.utils;
  const TAU = Math.PI * 2;

  function spawn(typeName, x, y, color, opts = {}) {
    const def = Prism.EnemyTypes[typeName];
    const c = color || choice(def.colors);
    const e = {
      type: typeName,
      def,
      color: c,
      x, y, vx: 0, vy: 0,
      angle: rand(0, TAU),
      spin: rand(-0.04, 0.04),
      hp: opts.hp ?? def.hp,
      maxHp: opts.hp ?? def.hp,
      speed: (opts.speed ?? def.speed),
      radius: opts.radius ?? def.radius,
      score: opts.score ?? def.score,
      cd: rand(40, 130),
      blink: rand(120, 220),
      charge: 0,
      isBoss: !!opts.isBoss,
      bossId: opts.bossId || null,
      bossPatterns: opts.bossPatterns || ["radial", "spread", "spiral"],
      bossPattern: 0,
      bossPatternTimer: 0,
      bossTimer: 0,
      colorTimer: rand(120, 200),
      flash: 0,
      spawnAnim: opts.noAnim ? 0 : 30,
      isElite: !!opts.isElite,
      elitePulse: 0,
      mineDetonating: false,
      mineDetonateTimer: 0,
    };
    Prism.state.enemies.push(e);
    return e;
  }

  function spawnOffscreen(typeName, color, opts = {}) {
    const W = Prism.state.W, H = Prism.state.H;
    const side = randi(0, 4);
    const m = 60;
    let x, y;
    if (side === 0) { x = -m; y = rand(0, H); }
    else if (side === 1) { x = W + m; y = rand(0, H); }
    else if (side === 2) { y = -m; x = rand(0, W); }
    else { y = H + m; x = rand(0, W); }
    return spawn(typeName, x, y, color, opts);
  }

  function makeElite(e) {
    e.isElite = true;
    e.maxHp = Math.ceil(e.maxHp * 2.2);
    e.hp = e.maxHp;
    e.speed *= 1.15;
    e.score = Math.ceil(e.score * 2.6);
    e.radius *= 1.1;
  }

  function spawnBoss(wave) {
    const def = Prism.Bosses.forWave(wave);
    const mul = Prism.Bosses.tierMul(wave);
    const W = Prism.state.W;
    const hp = Math.ceil(def.baseHp * mul);
    const b = spawn("prism", W / 2, -100, "W", {
      hp,
      speed: def.baseSpeed * (1 + (mul - 1) * 0.2),
      radius: def.baseRadius,
      score: Math.ceil(def.score * mul),
      isBoss: true,
      bossId: def.id,
      bossPatterns: def.patterns.slice(),
      noAnim: true,
    });
    b.color = choice(Prism.COLOR_ORDER);
    Prism.state.boss = b;
    Prism.Audio.sfx.boss();
    Prism.Effects.flash(0.6);
    Prism.Effects.shockwave(W / 2, Prism.state.H / 2, "#ffffff", 380, 60, 6);

    // boss intro cinematic
    Prism.state.bossIntro = {
      active: true,
      t: 120,
      max: 120,
      name: def.name,
      sub: def.subtitle + "  ·  TIER " + Math.ceil(wave / 5),
    };
    if (Prism.Music && Prism.Music.setIntensity) Prism.Music.setIntensity(1.0);
  }

  function damage(e, amount, hx, hy, hcolor) {
    e.hp -= amount;
    e.flash = 8;
    Prism.Effects.shake(amount * 2);
    Prism.Effects.hitstop(amount >= 3 ? 3 : 1.6);
    Prism.Particles.explosion(hx, hy, Prism.COLORS[hcolor || e.color].hex, 8 + amount * 3, 4, 2.5, 26);
    Prism.Audio.sfx.hit();
    if (e.hp <= 0) kill(e);
  }

  function kill(e) {
    const s = Prism.state;
    s.combo += 1;
    s.bestComboThisRun = Math.max(s.bestComboThisRun, s.combo);
    s.comboTimer = 90 * (s.player ? s.player.mods.comboHoldMul : 1);
    const comboBonus = 1 + Math.min(2, (s.combo - 1) * 0.1 * (s.player ? s.player.mods.comboScoreMul : 1));
    const eliteMul = e.isElite ? 1.4 : 1;
    const gained = Math.floor(e.score * comboBonus * eliteMul);
    s.score += gained;
    s.kills += 1;

    // overload charge
    if (s.player) {
      s.player.charge = Math.min(s.player.chargeMax, s.player.charge + (e.isBoss ? 60 : e.isElite ? 28 : 12));
    }

    Prism.Effects.shake(e.isBoss ? 32 : 8);
    Prism.Effects.hitstop(e.isBoss ? 18 : 6);
    Prism.Particles.explosion(e.x, e.y, Prism.COLORS[e.color].hex, e.isBoss ? 100 : 30, e.isBoss ? 9 : 5, e.isBoss ? 5 : 3, 50);
    Prism.Particles.ring(e.x, e.y, Prism.COLORS[e.color].hex, e.isBoss ? 80 : 40, 22);
    Prism.Effects.shockwave(e.x, e.y, Prism.COLORS[e.color].hex, e.isBoss ? 220 : 80, e.isBoss ? 40 : 22, e.isBoss ? 5 : 3);
    Prism.Effects.floater(e.x, e.y - 10, "+" + gained, Prism.COLORS[e.color].hex, 50);

    if (e.isBoss) {
      Prism.Audio.sfx.bigKill();
      Prism.Effects.flash(0.75);
      Prism.Pickups.spawn(e.x, e.y, "heal");
      Prism.Pickups.spawn(e.x + 30, e.y, "shield");
      Prism.Pickups.spawn(e.x - 30, e.y, "heal");
      Prism.state.boss = null;
      Prism.state.bossesDefeated = (Prism.state.bossesDefeated || 0) + 1;
      if (Prism.Music && Prism.Music.setIntensity) Prism.Music.setIntensity(0.3);
    } else {
      Prism.Audio.sfx.kill();
      const player = s.player;
      const base = e.def.onDeath === "split" ? 0 : 0.06;
      const eliteBoost = e.isElite ? 4 : 1;
      const chance = base * (player ? player.mods.pickupRateMul : 1) * eliteBoost;
      if (Math.random() < chance) Prism.Pickups.spawn(e.x, e.y, "heal");
      else if (Math.random() < 0.05 * (player ? player.mods.pickupRateMul : 1) * eliteBoost)
        Prism.Pickups.spawn(e.x, e.y, "shield");
    }

    if (e.def.onDeath === "split" && !e.isBoss) {
      for (let i = 0; i < 2; i++) {
        const a = Math.random() * TAU;
        const ne = spawn("chaser", e.x + Math.cos(a) * 10, e.y + Math.sin(a) * 10, e.color, { hp: 1, speed: 1.8, radius: 9, score: 5 });
        ne.spawnAnim = 14;
      }
    }

    if (e.type === "mine" && !e.mineFired) {
      mineDetonate(e);
      e.mineFired = true;
    }

    if (s.player && s.player.mods.spectrum) {
      Prism.Bullets.spawnHomingSplinter(e.x, e.y, e.color);
    }

    if (Prism.Achievements) Prism.Achievements.onKill(e);

    const idx = Prism.state.enemies.indexOf(e);
    if (idx >= 0) Prism.state.enemies.splice(idx, 1);
  }

  function mineDetonate(e) {
    const def = e.def;
    const count = def.detonateBullets || 10;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * TAU + rand(-0.04, 0.04);
      Prism.state.enemyBullets.push({
        x: e.x, y: e.y, vx: Math.cos(a) * 3.4, vy: Math.sin(a) * 3.4,
        radius: 5, color: e.color, life: 140, dmg: 1, isEcho: false,
      });
    }
    Prism.Particles.ring(e.x, e.y, Prism.COLORS[e.color].hex, 70, 32);
    Prism.Effects.shockwave(e.x, e.y, Prism.COLORS[e.color].hex, 130, 22, 3);
    Prism.Audio.sfx.shoot(e.color);
  }

  function update(dt) {
    const p = Prism.state.player; if (!p) return;
    for (const e of Prism.state.enemies) {
      if (e.spawnAnim > 0) { e.spawnAnim -= dt; continue; }
      if (e.flash > 0) e.flash -= dt;
      e.angle += e.spin * dt;
      if (e.isElite) e.elitePulse += dt;

      if (e.isBoss) { updateBoss(e, dt, p); continue; }

      const def = e.def;
      const tx = p.x - e.x, ty = p.y - e.y;
      const d = Math.hypot(tx, ty) || 1;
      const nx = tx / d, ny = ty / d;

      if (def.ai === "chase") {
        e.vx = lerp(e.vx, nx * e.speed, 0.06 * dt);
        e.vy = lerp(e.vy, ny * e.speed, 0.06 * dt);
      } else if (def.ai === "kite") {
        const drive = (d - def.kiteDist) / 200;
        e.vx = lerp(e.vx, nx * e.speed * clamp(drive, -1, 1) + ny * 0.6, 0.04 * dt);
        e.vy = lerp(e.vy, ny * e.speed * clamp(drive, -1, 1) - nx * 0.6, 0.04 * dt);
        e.cd -= dt;
        if (e.cd <= 0 && d < 480) {
          Prism.Bullets.fireEnemy(e, { speed: def.bulletSpeed, color: e.color });
          e.cd = def.shotCD + rand(-20, 20);
        }
      } else if (def.ai === "blink") {
        e.vx = lerp(e.vx, nx * e.speed * 0.7, 0.05 * dt);
        e.vy = lerp(e.vy, ny * e.speed * 0.7, 0.05 * dt);
        e.blink -= dt;
        if (e.blink <= 0) {
          Prism.Particles.ring(e.x, e.y, Prism.COLORS[e.color].hex, 30, 16);
          const ang = Math.random() * TAU;
          const dst = rand(120, 220);
          e.x = clamp(p.x + Math.cos(ang) * dst, 30, Prism.state.W - 30);
          e.y = clamp(p.y + Math.sin(ang) * dst, 30, Prism.state.H - 30);
          e.blink = def.blinkInterval + rand(-40, 40);
          Prism.Particles.ring(e.x, e.y, Prism.COLORS[e.color].hex, 30, 16);
        }
      } else if (def.ai === "snipe") {
        e.vx = lerp(e.vx, nx * 0.4, 0.03 * dt);
        e.vy = lerp(e.vy, ny * 0.4, 0.03 * dt);
        e.charge += dt;
        if (e.charge > def.chargeTime) {
          Prism.Bullets.fireEnemy(e, { speed: def.bulletSpeed, color: e.color, radius: 6, life: 240 });
          Prism.Effects.shockwave(e.x, e.y, Prism.COLORS[e.color].hex, 60, 14, 2);
          e.charge = -rand(40, 90);
        }
      } else if (def.ai === "mine") {
        // drift slowly, detonate when player close
        e.vx = lerp(e.vx, nx * 0.15, 0.02 * dt);
        e.vy = lerp(e.vy, ny * 0.15, 0.02 * dt);
        if (e.mineDetonating) {
          e.mineDetonateTimer -= dt;
          if (e.mineDetonateTimer <= 0) {
            mineDetonate(e);
            e.hp = 0;
            kill(e);
            continue;
          }
        } else if (d < (def.detonateRadius || 110)) {
          e.mineDetonating = true;
          e.mineDetonateTimer = 26;
          Prism.Audio.sfx.cardHover();
        }
      }

      e.x += e.vx * dt; e.y += e.vy * dt;

      e.x = clamp(e.x, -80, Prism.state.W + 80);
      e.y = clamp(e.y, -80, Prism.state.H + 80);

      if (p.invuln <= 0) {
        const rr = e.radius + p.radius;
        if (dist2(e.x, e.y, p.x, p.y) < rr * rr) {
          Prism.Player.damage(1);
          e.vx -= nx * 3; e.vy -= ny * 3;
        }
      }
    }
  }

  function updateBoss(b, dt, p) {
    b.colorTimer -= dt;
    b.bossTimer += dt;
    b.bossPatternTimer += dt;
    if (b.colorTimer <= 0) {
      b.color = choice(Prism.COLOR_ORDER);
      b.colorTimer = rand(110, 170);
      Prism.Particles.ring(b.x, b.y, Prism.COLORS[b.color].hex, 60, 28);
      Prism.Effects.shockwave(b.x, b.y, Prism.COLORS[b.color].hex, 90, 18, 3);
    }
    if (b.bossPatternTimer > 320) {
      b.bossPattern = (b.bossPattern + 1) % b.bossPatterns.length;
      b.bossPatternTimer = 0;
    }
    const tx = p.x - b.x, ty = p.y - b.y;
    const d = Math.hypot(tx, ty) || 1;
    const nx = tx / d, ny = ty / d;
    const target = 280;
    const drive = (d - target) / 200;
    b.vx = lerp(b.vx, nx * b.speed * clamp(drive, -1, 1) + ny * 1.1, 0.04 * dt);
    b.vy = lerp(b.vy, ny * b.speed * clamp(drive, -1, 1) - nx * 1.1, 0.04 * dt);
    b.x += b.vx * dt; b.y += b.vy * dt;
    b.x = clamp(b.x, b.radius, Prism.state.W - b.radius);
    b.y = clamp(b.y, b.radius, Prism.state.H - b.radius);

    b.cd -= dt;
    if (b.cd <= 0) {
      const pat = b.bossPatterns[b.bossPattern];
      bossAttack(b, pat, tx, ty);
    }

    if (p.invuln <= 0) {
      const rr = b.radius + p.radius;
      if (dist2(b.x, b.y, p.x, p.y) < rr * rr) Prism.Player.damage(1);
    }
  }

  function bossAttack(b, pat, tx, ty) {
    const baseA = Math.atan2(ty, tx);
    if (pat === "radial") {
      const count = 14 + Math.floor(b.bossTimer / 600);
      for (let i = 0; i < count; i++) {
        const a = baseA + (i / count) * TAU;
        Prism.state.enemyBullets.push({
          x: b.x, y: b.y, vx: Math.cos(a) * 3.6, vy: Math.sin(a) * 3.6,
          radius: 5, color: b.color, life: 220, dmg: 1, isEcho: false,
        });
      }
      b.cd = 130;
    } else if (pat === "spread") {
      for (let i = -2; i <= 2; i++) {
        const a = baseA + i * 0.12;
        Prism.state.enemyBullets.push({
          x: b.x, y: b.y, vx: Math.cos(a) * 6, vy: Math.sin(a) * 6,
          radius: 5, color: b.color, life: 180, dmg: 1, isEcho: false,
        });
      }
      b.cd = 28;
    } else if (pat === "spiral") {
      const a = b.bossTimer * 0.08;
      for (let k = 0; k < 3; k++) {
        const ang = a + (k * TAU / 3);
        Prism.state.enemyBullets.push({
          x: b.x, y: b.y, vx: Math.cos(ang) * 4.2, vy: Math.sin(ang) * 4.2,
          radius: 4, color: b.color, life: 200, dmg: 1, isEcho: false,
        });
      }
      b.cd = 8;
    } else if (pat === "summon") {
      // spawn 2 minions of boss color
      for (let i = 0; i < 2; i++) {
        const a = Math.random() * TAU;
        const e = spawn("chaser", b.x + Math.cos(a) * 50, b.y + Math.sin(a) * 50, b.color, { hp: 2, speed: 1.6 });
        e.spawnAnim = 20;
      }
      b.cd = 240;
      Prism.Effects.shockwave(b.x, b.y, Prism.COLORS[b.color].hex, 120, 22, 3);
    } else if (pat === "lance") {
      // 3 fast aimed shots in a tight cluster
      for (let i = -1; i <= 1; i++) {
        const a = baseA + i * 0.04;
        Prism.state.enemyBullets.push({
          x: b.x, y: b.y, vx: Math.cos(a) * 8, vy: Math.sin(a) * 8,
          radius: 6, color: b.color, life: 200, dmg: 1, isEcho: false,
        });
      }
      Prism.Effects.shockwave(b.x, b.y, Prism.COLORS[b.color].hex, 60, 12, 2);
      b.cd = 50;
    } else if (pat === "burst") {
      // expanding ring with delay
      const count = 24;
      for (let i = 0; i < count; i++) {
        const a = (i / count) * TAU;
        Prism.state.enemyBullets.push({
          x: b.x, y: b.y, vx: Math.cos(a) * 2.6, vy: Math.sin(a) * 2.6,
          radius: 5, color: b.color, life: 260, dmg: 1, isEcho: false,
        });
      }
      // second ring opposite phase
      setTimeout(() => {
        if (!Prism.state.boss) return;
        for (let i = 0; i < count; i++) {
          const a = (i / count) * TAU + (TAU / count) / 2;
          Prism.state.enemyBullets.push({
            x: b.x, y: b.y, vx: Math.cos(a) * 2.6, vy: Math.sin(a) * 2.6,
            radius: 5, color: b.color, life: 260, dmg: 1, isEcho: false,
          });
        }
      }, 320);
      b.cd = 200;
    }
    Prism.Audio.sfx.shoot(b.color);
  }

  window.Prism = window.Prism || {};
  Prism.Enemies = { spawn, spawnOffscreen, spawnBoss, damage, kill, update, makeElite };
})();
