(() => {
  const Game = {};

  function start() {
    const s = Prism.state;
    Prism.Audio.ensure();
    s.scene = "play";
    s.player = Prism.Player.make();
    s.enemies = []; s.bullets = []; s.enemyBullets = []; s.particles = [];
    s.pickups = []; s.shockwaves = []; s.floaters = [];
    s.shake = 0; s.hitstop = 0; s.flash = 0; s.timeScale = 1; s.time = 0;
    s.score = 0; s.combo = 0; s.comboTimer = 0; s.bestComboThisRun = 0; s.kills = 0;
    s.wave = 0; s.waveActive = false; s.waveTimer = 90;
    s.spawnQueue = []; s.spawnTimer = 0;
    s.boss = null;
    s.upgrades = {};
    s.bossIntro = { active: false, t: 0, max: 120, name: "", sub: "" };
    s.bossesDefeated = 0;
    s.shotsFired = 0; s.shotsHit = 0;
    s.runStart = performance.now();
    s.runTime = 0;
    s.damageThisWave = 0;
    if (Prism.Achievements) Prism.Achievements.reset();
    if (Prism.Music && Prism.state.settings.music) Prism.Music.start();
    Prism.Scenes.hideMenu();
    Prism.Scenes.hideDeath();
    Prism.Scenes.hidePause();
  }

  function togglePause() {
    if (Prism.state.scene === "play") {
      Prism.state.scene = "pause";
      Prism.Scenes.showPause();
    } else if (Prism.state.scene === "pause") {
      Prism.state.scene = "play";
      Prism.Scenes.hidePause();
    }
  }

  function onDeath() {
    const s = Prism.state;
    s.scene = "dead";
    s.flash = 0.8;
    if (s.score > s.best) { s.best = s.score; localStorage.setItem("prism_best", String(s.best)); }
    if (s.wave > s.bestWave) { s.bestWave = s.wave; localStorage.setItem("prism_best_wave", String(s.bestWave)); }
    if (Prism.Music) Prism.Music.stop();
    if (Prism.Achievements) Prism.Achievements.onRunEnd();
    Prism.Scenes.showDeath();
  }

  function openUpgradeScreen() {
    Prism.UpgradeScreen.open();
  }

  function update(dt) {
    const s = Prism.state;

    if (s.scene === "menu" || s.scene === "pause" || s.scene === "dead") return;
    if (s.scene === "loadout") { Prism.Loadout.update(dt); return; }

    if (s.scene === "upgrade") {
      Prism.Particles.update(dt);
      Prism.Effects.update(dt);
      Prism.UpgradeScreen.update(dt);
      s.time += dt;
      return;
    }

    if (s.hitstop > 0) { s.hitstop -= dt; return; }

    // run timer
    if (s.runStart) s.runTime = (performance.now() - s.runStart) / 1000;
    if (Prism.Achievements) Prism.Achievements.onTime(s.runTime);

    // time scale (reflex + boss intro)
    let dts = dt * s.timeScale;
    if (s.player && s.player.mods.reflex && s.player.hp <= 2) dts *= 0.55;
    if (s.bossIntro.active) {
      s.bossIntro.t -= dt;
      if (s.bossIntro.t <= 0) s.bossIntro.active = false;
      dts *= 0.22;
    }

    s.time += dts;
    s.shake *= Math.pow(0.86, dts);
    s.flash *= Math.pow(0.92, dts);

    if (s.comboTimer > 0) {
      s.comboTimer -= dts;
      if (s.comboTimer <= 0) s.combo = 0;
    }

    Prism.Player.update(dts);
    Prism.Bullets.updatePlayerBullets(dts);
    Prism.Bullets.updateEnemyBullets(dts);
    Prism.Enemies.update(dts);
    Prism.Pickups.update(dts);
    Prism.Particles.update(dts);
    Prism.Effects.update(dts);
    Prism.Waves.update(dts);
  }

  function render() {
    Prism.Render.render(Prism.state.ctx);
  }

  window.Prism = window.Prism || {};
  Prism.Game = Object.assign(Game, { start, togglePause, onDeath, openUpgradeScreen, update, render });
})();