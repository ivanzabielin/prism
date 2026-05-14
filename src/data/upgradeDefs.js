(() => {
  // Upgrade definitions. Each card may stack up to `maxStacks`.
  // `apply` mutates player/state when picked. Effects also read via `mods` from player.upgrades.
  // Tags: offense, defense, utility
  const DEFS = [
    {
      id: "refract",
      name: "REFRACTION",
      tag: "offense",
      maxStacks: 3,
      desc: "Fire +1 extra bolt at a slight angle.",
      apply(p) { p.mods.extraBolts += 1; },
    },
    {
      id: "velocity",
      name: "VELOCITY",
      tag: "offense",
      maxStacks: 3,
      desc: "Bolts travel 25% faster and live longer.",
      apply(p) { p.mods.bulletSpeedMul *= 1.25; p.mods.bulletLifeMul *= 1.2; },
    },
    {
      id: "pierce",
      name: "PENETRATION",
      tag: "offense",
      maxStacks: 2,
      desc: "Bolts pierce +1 enemy.",
      apply(p) { p.mods.pierce += 1; },
    },
    {
      id: "caliber",
      name: "CALIBER",
      tag: "offense",
      maxStacks: 3,
      desc: "Bolts deal +1 damage on matching color.",
      apply(p) { p.mods.dmg += 1; },
    },
    {
      id: "rapid",
      name: "RAPID",
      tag: "offense",
      maxStacks: 3,
      desc: "-22% time between shots.",
      apply(p) { p.mods.fireRateMul *= 0.78; },
    },
    {
      id: "refractor",
      name: "REFRACTOR",
      tag: "offense",
      maxStacks: 2,
      desc: "Rejected bolts emit a shockwave that damages matching enemies in 70px.",
      apply(p) { p.mods.refractorRadius += 70; p.mods.refractorDmg += 1; },
    },
    {
      id: "spectrum",
      name: "SPECTRUM",
      tag: "offense",
      maxStacks: 1,
      desc: "Killing an enemy spawns a homing splinter in its color.",
      apply(p) { p.mods.spectrum = true; },
    },
    {
      id: "echo",
      name: "ECHO",
      tag: "offense",
      maxStacks: 2,
      desc: "Bolts leave a damaging trail for a moment.",
      apply(p) { p.mods.echo += 1; },
    },
    {
      id: "vessel",
      name: "VESSEL",
      tag: "defense",
      maxStacks: 4,
      desc: "+1 max integrity and full repair.",
      apply(p) { p.maxHp += 1; p.hp = p.maxHp; },
    },
    {
      id: "mend",
      name: "MEND",
      tag: "defense",
      maxStacks: 2,
      desc: "Pickups appear 60% more often. Heals restore 2.",
      apply(p) { p.mods.pickupRateMul *= 1.6; p.mods.healAmount += 1; },
    },
    {
      id: "phase",
      name: "PHASE",
      tag: "defense",
      maxStacks: 3,
      desc: "Dash cooldown -25%, invulnerability +40%.",
      apply(p) { p.mods.dashCDMul *= 0.75; p.mods.dashInvulnMul *= 1.4; },
    },
    {
      id: "aegis",
      name: "AEGIS",
      tag: "defense",
      maxStacks: 3,
      desc: "+10% chance to ignore a hit.",
      apply(p) { p.mods.aegis += 0.10; },
    },
    {
      id: "reflex",
      name: "REFLEX",
      tag: "defense",
      maxStacks: 1,
      desc: "When below 2 integrity, time slows 50%.",
      apply(p) { p.mods.reflex = true; },
    },
    {
      id: "resonance",
      name: "RESONANCE",
      tag: "utility",
      maxStacks: 2,
      desc: "Combo decays 40% slower. Combo multiplier reaches further.",
      apply(p) { p.mods.comboHoldMul *= 1.4; p.mods.comboScoreMul += 0.15; },
    },
    {
      id: "magnetism",
      name: "MAGNETISM",
      tag: "utility",
      maxStacks: 2,
      desc: "Pickup attraction radius +80%.",
      apply(p) { p.mods.pickupRadiusMul *= 1.8; },
    },
    {
      id: "thrust",
      name: "THRUST",
      tag: "utility",
      maxStacks: 2,
      desc: "Movement speed +15%.",
      apply(p) { p.mods.speedMul *= 1.15; },
    },
    {
      id: "locked",
      name: "LOCKED-IN",
      tag: "utility",
      maxStacks: 1,
      desc: "Holding fire 1s makes the next bolt critical (×3).",
      apply(p) { p.mods.lockedIn = true; },
    },
    {
      id: "overdrive",
      name: "OVERDRIVE",
      tag: "utility",
      maxStacks: 1,
      desc: "At combo 10+, gain +30% damage and fire rate.",
      apply(p) { p.mods.overdrive = true; },
    },
  ];

  function byId(id) { return DEFS.find(d => d.id === id); }

  // Returns 3 unique offers, weighted by tag balance.
  function offer(player, count = 3) {
    const available = DEFS.filter(d => (player.upgrades[d.id] || 0) < d.maxStacks);
    const out = [];
    const taken = new Set();
    const tagWeights = { offense: 1, defense: 1, utility: 1 };
    if (player.hp <= 2) tagWeights.defense = 1.8;
    if (player.maxHp >= 7) tagWeights.defense = 0.6;
    while (out.length < count && out.length < available.length) {
      const pool = available.filter(d => !taken.has(d.id));
      const entries = pool.map(d => [d, tagWeights[d.tag] || 1]);
      const pick = Prism.utils.weightedChoice(entries);
      taken.add(pick.id);
      out.push(pick);
    }
    return out;
  }

  window.Prism = window.Prism || {};
  Prism.Upgrades = { DEFS, byId, offer };
})();