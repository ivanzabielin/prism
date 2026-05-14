(() => {
  const state = {
    scene: "menu",          // menu | play | upgrade | pause | dead
    canvas: null,
    ctx: null,
    W: 0, H: 0, DPR: 1,

    player: null,
    enemies: [],
    bullets: [],
    enemyBullets: [],
    particles: [],
    pickups: [],
    shockwaves: [],
    floaters: [],           // floating score text

    boss: null,

    shake: 0,
    hitstop: 0,
    flash: 0,
    timeScale: 1,
    time: 0,

    wave: 0,
    waveActive: false,
    waveTimer: 0,
    spawnQueue: [],
    spawnTimer: 0,
    enemiesAlive: 0,
    waveAnnounceTimer: 0,

    score: 0,
    combo: 0,
    comboTimer: 0,
    bestComboThisRun: 0,
    kills: 0,

    upgrades: {},           // { upgradeId: stacks }

    best: parseInt(localStorage.getItem("prism_best") || "0", 10),
    bestWave: parseInt(localStorage.getItem("prism_best_wave") || "0", 10),

    upgradeChoices: null,   // array of upgrade defs offered now

    selectedShip: localStorage.getItem("prism_ship") || "lance",
    bossIntro: { active: false, t: 0, max: 120, name: "", sub: "" },
    bossesDefeated: 0,
    shotsFired: 0,
    shotsHit: 0,
    runStart: 0,
    runTime: 0,
    damageThisWave: 0,
    achievements: JSON.parse(localStorage.getItem("prism_ach") || "{}"),

    settings: {
      volume: parseFloat(localStorage.getItem("prism_vol") || "0.7"),
      muted: localStorage.getItem("prism_muted") === "1",
      music: localStorage.getItem("prism_music") !== "0",
      colorBlind: localStorage.getItem("prism_cb") === "1",
    },
  };

  window.Prism = window.Prism || {};
  Prism.state = state;
})();