(() => {
  const DEFS = [
    { id: "firstBlood", name: "FIRST BLOOD", desc: "Destroy your first enemy.", check: (run) => run.kills >= 1 },
    { id: "refractor", name: "REFRACTOR", desc: "Clear wave 1.", check: (run) => run.wavesCleared >= 1 },
    { id: "shardHunter", name: "SHARD HUNTER", desc: "Defeat your first boss.", check: (run) => run.bossesDefeated >= 1 },
    { id: "chromatic", name: "CHROMATIC", desc: "Reach wave 10.", check: (run) => run.wave >= 10 },
    { id: "artisan", name: "ARTISAN", desc: "Reach wave 15.", check: (run) => run.wave >= 15 },
    { id: "architect", name: "PRISMATIC ARCHITECT", desc: "Reach wave 20.", check: (run) => run.wave >= 20 },
    { id: "untouched", name: "UNTOUCHED", desc: "Clear a wave without taking damage.", check: (run) => run.untouchedWaves >= 1 },
    { id: "conductor", name: "CONDUCTOR", desc: "Reach combo ×20.", check: (run) => run.bestCombo >= 20 },
    { id: "maestro", name: "MAESTRO", desc: "Reach combo ×40.", check: (run) => run.bestCombo >= 40 },
    { id: "purifier", name: "PURIFIER", desc: "End a run at 90%+ accuracy.", check: (run) => run.ended && run.accuracy >= 0.9 && run.shots >= 50 },
    { id: "survivor", name: "SURVIVOR", desc: "Survive 5 minutes.", check: (run) => run.time >= 300 },
    { id: "destroyer", name: "DESTROYER", desc: "200 kills in a run.", check: (run) => run.kills >= 200 },
    { id: "overdriven", name: "OVERDRIVEN", desc: "Fire 10 Overloads in a run.", check: (run) => run.overloads >= 10 },
  ];

  let session = freshSession();
  let unlockedThisSession = [];

  function freshSession() {
    return {
      kills: 0, wavesCleared: 0, bossesDefeated: 0, wave: 0,
      untouchedWaves: 0, bestCombo: 0,
      time: 0, shots: 0, hits: 0, accuracy: 0,
      ended: false, overloads: 0,
    };
  }

  function reset() { session = freshSession(); unlockedThisSession = []; }

  function onKill(e) { session.kills += 1; }
  function onWaveCleared(wave, untouched) {
    session.wavesCleared += 1; session.wave = wave;
    if (untouched) session.untouchedWaves += 1;
    sync(); check();
  }
  function onBossKill() { session.bossesDefeated += 1; sync(); check(); }
  function onOverload() { session.overloads += 1; sync(); check(); }
  function onCombo(c) { session.bestCombo = Math.max(session.bestCombo, c); }
  function onTime(sec) { session.time = sec; }
  function onRunEnd() {
    session.ended = true;
    sync();
    check();
  }

  function sync() {
    const s = Prism.state;
    session.shots = s.shotsFired;
    session.hits = s.shotsHit;
    session.accuracy = s.shotsFired > 0 ? s.shotsHit / s.shotsFired : 0;
    session.bestCombo = Math.max(session.bestCombo, s.bestComboThisRun);
    session.wave = s.wave;
  }

  function check() {
    sync();
    for (const def of DEFS) {
      if (!Prism.state.achievements[def.id] && def.check(session)) {
        Prism.state.achievements[def.id] = 1;
        unlockedThisSession.push(def);
        localStorage.setItem("prism_ach", JSON.stringify(Prism.state.achievements));
        Prism.Effects.floater(Prism.state.W / 2, 140 + unlockedThisSession.length * 20,
          "★ " + def.name + " UNLOCKED ★", "#ffe066", 140, -0.3);
        if (Prism.Audio && Prism.Audio.sfx.upgrade) Prism.Audio.sfx.upgrade();
      }
    }
  }

  function newUnlocks() { return unlockedThisSession.slice(); }
  function defs() { return DEFS; }
  function unlocked() { return Prism.state.achievements; }

  window.Prism = window.Prism || {};
  Prism.Achievements = { reset, onKill, onWaveCleared, onBossKill, onOverload, onCombo, onTime, onRunEnd, check, newUnlocks, defs, unlocked };
})();
