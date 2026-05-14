(() => {
  // Ship classes: passive mods applied at run start. All share the Overload active.
  const SHIPS = [
    {
      id: "lance",
      name: "LANCE",
      role: "Focus",
      accent: "#ff5577",
      glyph: "▲",
      desc: "Single, hard bolt. Pierces.",
      stats: ["+1 damage", "+1 pierce", "Slower fire"],
      apply(p) {
        p.mods.dmg += 1;
        p.mods.pierce += 1;
        p.mods.fireRateMul *= 1.25;
        p.mods.bulletSpeedMul *= 1.15;
      },
    },
    {
      id: "arc",
      name: "ARC",
      role: "Spread",
      accent: "#55aaff",
      glyph: "✦",
      desc: "Triple bolt. Fast cadence.",
      stats: ["+2 extra bolts", "Faster fire", "Wider arc"],
      apply(p) {
        p.mods.extraBolts += 2;
        p.mods.fireRateMul *= 0.85;
        p.mods.spreadBonus = 0.08;
      },
    },
    {
      id: "pulse",
      name: "PULSE",
      role: "Wave",
      accent: "#ffcc66",
      glyph: "◆",
      desc: "Refraction shockwaves on rejected bolts.",
      stats: ["+60px refractor", "+50% bullet life", "+15% pickup attract"],
      apply(p) {
        p.mods.refractorRadius += 60;
        p.mods.refractorDmg += 1;
        p.mods.bulletLifeMul *= 1.5;
        p.mods.pickupRadiusMul *= 1.15;
      },
    },
  ];

  function byId(id) { return SHIPS.find(s => s.id === id) || SHIPS[0]; }

  window.Prism = window.Prism || {};
  Prism.Ships = { SHIPS, byId };
})();
