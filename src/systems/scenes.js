(() => {
  const $ = id => document.getElementById(id);

  function showMenu() { $("menu").classList.remove("hidden"); }
  function hideMenu() { $("menu").classList.add("hidden"); }
  function openLoadout() {
    hideMenu(); hideDeath(); hidePause();
    if (Prism.Loadout) Prism.Loadout.open();
  }
  function showDeath() {
    const s = Prism.state;
    const accuracy = s.shotsFired > 0 ? Math.round((s.shotsHit / s.shotsFired) * 100) : 0;
    const m = Math.floor(s.runTime / 60), sec = Math.floor(s.runTime % 60);
    $("bdScore").textContent  = s.score;
    $("bdWave").textContent   = s.wave;
    $("bdKills").textContent  = s.kills;
    $("bdCombo").textContent  = "×" + s.bestComboThisRun;
    $("bdAcc").textContent    = accuracy + "%";
    $("bdTime").textContent   = m + ":" + String(sec).padStart(2, "0");
    $("bdBoss").textContent   = s.bossesDefeated;
    $("bdShip").textContent   = (s.player && s.player.ship) ? s.player.ship.name : "—";
    $("bestScore").textContent = "ALL-TIME BEST " + s.best + "  ·  WAVE " + s.bestWave;
    // achievements unlocked
    const ach = $("bdAchievements");
    ach.innerHTML = "";
    const unlocks = Prism.Achievements ? Prism.Achievements.newUnlocks() : [];
    if (unlocks.length === 0) {
      ach.innerHTML = "<div class='ach-empty'>NO NEW MEDALS</div>";
    } else {
      for (const u of unlocks) {
        const el = document.createElement("div");
        el.className = "ach-row";
        el.innerHTML = "<b>★ " + u.name + "</b><span>" + u.desc + "</span>";
        ach.appendChild(el);
      }
    }
    $("deathScreen").classList.remove("hidden");
  }
  function hideDeath() { $("deathScreen").classList.add("hidden"); }
  function showPause() { $("pauseScreen").classList.remove("hidden"); }
  function hidePause() { $("pauseScreen").classList.add("hidden"); }
  function showAchievements() {
    const dlg = $("achPanel");
    const list = $("achList");
    list.innerHTML = "";
    for (const def of Prism.Achievements.defs()) {
      const got = Prism.Achievements.unlocked()[def.id];
      const el = document.createElement("div");
      el.className = "ach-row " + (got ? "got" : "locked");
      el.innerHTML = "<b>" + (got ? "★ " : "◇ ") + def.name + "</b><span>" + def.desc + "</span>";
      list.appendChild(el);
    }
    dlg.classList.remove("hidden");
  }
  function hideAchievements() { $("achPanel").classList.add("hidden"); }

  window.Prism = window.Prism || {};
  Prism.Scenes = { showMenu, hideMenu, openLoadout, showDeath, hideDeath, showPause, hidePause, showAchievements, hideAchievements };
})();
