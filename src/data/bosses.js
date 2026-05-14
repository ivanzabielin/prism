(() => {
  // 3 boss variants cycling by tier. Each defines name, subtitle, base stats, attack patterns.
  const BOSSES = [
    {
      id: "shard",
      name: "PRISM SHARD",
      subtitle: "FIRST FACET",
      baseHp: 90,
      baseSpeed: 1.0,
      baseRadius: 42,
      score: 320,
      patterns: ["radial", "spread", "spiral"],
    },
    {
      id: "warden",
      name: "WARDEN",
      subtitle: "GUARDIAN OF HUES",
      baseHp: 140,
      baseSpeed: 1.1,
      baseRadius: 46,
      score: 480,
      patterns: ["spread", "summon", "lance"],
    },
    {
      id: "nebula",
      name: "NEBULA",
      subtitle: "INFINITE REFRACTION",
      baseHp: 200,
      baseSpeed: 1.05,
      baseRadius: 50,
      score: 720,
      patterns: ["spiral", "lance", "burst"],
    },
  ];

  function forWave(wave) {
    const idx = Math.floor((wave / 5) - 1) % BOSSES.length;
    return BOSSES[Math.max(0, idx)];
  }

  function tierMul(wave) {
    const cycle = Math.floor((wave / 5) - 1);
    const loop = Math.floor(cycle / BOSSES.length);
    return 1 + loop * 0.6;
  }

  window.Prism = window.Prism || {};
  Prism.Bosses = { BOSSES, forWave, tierMul };
})();
