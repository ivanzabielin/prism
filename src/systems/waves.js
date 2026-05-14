(() => {
  const { rand, randi, choice, weightedChoice } = Prism.utils;

  // Compose a wave: returns an array of { type, color?, delay } spawn entries.
  function compose(wave) {
    const entries = [];
    if (wave % 5 === 0) return entries;

    const tier = wave;
    const budget = 5 + tier * 2 + Math.floor(tier / 2);

    const pool = [["chaser", 4]];
    if (tier >= 2) pool.push(["shooter", 2]);
    if (tier >= 3) pool.push(["teleporter", 2]);
    if (tier >= 4) pool.push(["swarmer", 3]);
    if (tier >= 5) pool.push(["mine", 1.4]);
    if (tier >= 6) pool.push(["splitter", 1.5]);
    if (tier >= 7) pool.push(["armored", 1.2]);
    if (tier >= 8) pool.push(["sniper", 1.5]);

    let remaining = budget;
    while (remaining > 0) {
      const type = weightedChoice(pool);
      const cost = costFor(type);
      if (cost > remaining + 1) { remaining = 0; continue; }
      const def = Prism.EnemyTypes[type];
      const color = choice(def.colors);
      const isElite = tier >= 5 && Math.random() < (0.06 + Math.min(0.14, (tier - 5) * 0.012));
      entries.push({ type, color, delay: rand(20, 50), isElite });
      remaining -= cost;
    }
    entries.sort(() => Math.random() - 0.5);
    return entries;
  }

  function costFor(type) {
    return {
      chaser: 1, shooter: 1.5, teleporter: 1.5, swarmer: 0.5,
      splitter: 2.5, sniper: 2, prism: 5,
      armored: 3, mine: 1.2,
    }[type] || 1;
  }

  function start(wave) {
    const s = Prism.state;
    s.wave = wave;
    s.waveActive = true;
    s.waveAnnounceTimer = 90;
    s.damageThisWave = 0;
    if (wave % 5 === 0) {
      s.spawnQueue = [];
      Prism.Enemies.spawnBoss(wave);
    } else {
      s.spawnQueue = compose(wave);
    }
    s.spawnTimer = 0;
    Prism.Audio.sfx.wave();
    Prism.Effects.flash(0.2);
    if (Prism.Music && Prism.Music.setIntensity) {
      Prism.Music.setIntensity(wave % 5 === 0 ? 1.0 : Math.min(0.85, wave * 0.06));
    }
  }

  function update(dt) {
    const s = Prism.state;
    if (s.waveAnnounceTimer > 0) s.waveAnnounceTimer -= dt;

    if (!s.waveActive && s.scene === "play") {
      s.waveTimer -= dt;
      if (s.waveTimer <= 0) start(s.wave + 1);
      return;
    }

    if (s.spawnQueue.length > 0) {
      s.spawnTimer -= dt;
      if (s.spawnTimer <= 0) {
        const e = s.spawnQueue.shift();
        const en = Prism.Enemies.spawnOffscreen(e.type, e.color);
        const tier = s.wave;
        en.hp += Math.floor(tier / 4);
        en.maxHp = en.hp;
        en.speed *= 1 + tier * 0.02;
        if (e.isElite) Prism.Enemies.makeElite(en);
        s.spawnTimer = e.delay;
      }
    } else if (s.enemies.length === 0 && !s.boss) {
      s.waveActive = false;
      const wasBoss = s.wave % 5 === 0;
      const untouched = s.damageThisWave === 0;
      s.score += 50 + s.wave * 10;
      if (untouched && s.wave > 0) {
        s.score += 100;
        Prism.Effects.floater(s.W / 2, s.H / 2 - 50, "UNTOUCHED +100", "#ffe066", 90, -0.3);
      }
      Prism.Effects.flash(0.25);
      if (Prism.Achievements) {
        Prism.Achievements.onWaveCleared(s.wave, untouched);
        if (wasBoss) Prism.Achievements.onBossKill();
      }
      if (!wasBoss && s.wave > 0) {
        Prism.Game.openUpgradeScreen();
      } else {
        s.waveTimer = 180;
      }
    }
  }

  window.Prism = window.Prism || {};
  Prism.Waves = { start, update };
})();