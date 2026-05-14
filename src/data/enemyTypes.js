(() => {
  // Enemy archetypes. Color is set per-spawn (R/G/B/W) — the type is the behavior.
  const TYPES = {
    chaser: {
      name: "chaser",
      hp: 2, speed: 1.45, radius: 14, score: 10,
      shape: "triangle",
      ai: "chase",
      colors: ["R", "G", "B"],
      tier: 0,
    },
    shooter: {
      name: "shooter",
      hp: 3, speed: 1.0, radius: 16, score: 18,
      shape: "hex",
      ai: "kite",
      kiteDist: 240,
      shoots: true,
      shotCD: 130,
      bulletSpeed: 5,
      colors: ["R", "G", "B"],
      tier: 1,
    },
    teleporter: {
      name: "teleporter",
      hp: 2, speed: 1.3, radius: 13, score: 14,
      shape: "square",
      ai: "blink",
      blinkInterval: 200,
      colors: ["R", "G", "B"],
      tier: 1,
    },
    splitter: {
      name: "splitter",
      hp: 4, speed: 1.05, radius: 22, score: 28,
      shape: "diamond",
      ai: "chase",
      colors: ["R", "G", "B"],
      tier: 2,
      onDeath: "split",
    },
    sniper: {
      name: "sniper",
      hp: 2, speed: 0.6, radius: 15, score: 24,
      shape: "wedge",
      ai: "snipe",
      chargeTime: 80,
      bulletSpeed: 9,
      colors: ["R", "G", "B"],
      tier: 3,
    },
    swarmer: {
      name: "swarmer",
      hp: 1, speed: 2.1, radius: 9, score: 6,
      shape: "triangle",
      ai: "chase",
      colors: ["R", "G", "B"],
      tier: 2,
    },
    prism: {
      name: "prism",
      hp: 6, speed: 1.25, radius: 18, score: 45,
      shape: "diamond",
      ai: "chase",
      colors: ["W"],
      tier: 4,
    },
    armored: {
      name: "armored",
      hp: 8, speed: 0.65, radius: 22, score: 40,
      shape: "octagon",
      ai: "chase",
      colors: ["R", "G", "B"],
      tier: 4,
    },
    mine: {
      name: "mine",
      hp: 1, speed: 0.1, radius: 12, score: 18,
      shape: "star",
      ai: "mine",
      colors: ["R", "G", "B"],
      tier: 3,
      detonateRadius: 110,
      detonateBullets: 10,
    },
  };

  function get(name) { return TYPES[name]; }

  window.Prism = window.Prism || {};
  Prism.EnemyTypes = TYPES;
  Prism.EnemyTypesGet = get;
})();