(() => {
  const canvas = document.getElementById("c");
  const ctx = canvas.getContext("2d");
  Prism.state.canvas = canvas;
  Prism.state.ctx = ctx;
  Prism.state.DPR = Math.min(2, window.devicePixelRatio || 1);

  function resize() {
    Prism.state.W = window.innerWidth;
    Prism.state.H = window.innerHeight;
    canvas.width = Math.floor(Prism.state.W * Prism.state.DPR);
    canvas.height = Math.floor(Prism.state.H * Prism.state.DPR);
    canvas.style.width = Prism.state.W + "px";
    canvas.style.height = Prism.state.H + "px";
    ctx.setTransform(Prism.state.DPR, 0, 0, Prism.state.DPR, 0, 0);
  }
  window.addEventListener("resize", resize);
  resize();

  Prism.Input.init(canvas);

  window.addEventListener("keydown", e => {
    const k = e.key.toLowerCase();
    if ((k === "p" || k === "escape") && (Prism.state.scene === "play" || Prism.state.scene === "pause")) {
      Prism.Game.togglePause();
    }
    if (k === "m") { Prism.Audio.setMuted(!Prism.state.settings.muted); }
  });
  window.addEventListener("wheel", e => {
    if (Prism.state.player && Prism.state.scene === "play") {
      const i = Prism.COLOR_ORDER.indexOf(Prism.state.player.color);
      Prism.state.player.color = Prism.COLOR_ORDER[(i + (e.deltaY > 0 ? 1 : -1) + 3) % 3];
    }
  }, { passive: true });

  // hook buttons
  function $(id) { return document.getElementById(id); }
  $("startBtn").addEventListener("click", () => Prism.Scenes.openLoadout());
  $("restartBtn").addEventListener("click", () => Prism.Scenes.openLoadout());
  $("resumeBtn").addEventListener("click", () => Prism.Game.togglePause());
  $("menuFromDeath").addEventListener("click", () => {
    Prism.Scenes.hideDeath(); Prism.Scenes.showMenu(); Prism.state.scene = "menu";
  });
  $("menuFromPause").addEventListener("click", () => {
    if (Prism.Music) Prism.Music.stop();
    Prism.Scenes.hidePause(); Prism.Scenes.showMenu(); Prism.state.scene = "menu"; Prism.state.player = null;
  });
  $("achBtn").addEventListener("click", () => Prism.Scenes.showAchievements());
  $("achClose").addEventListener("click", () => Prism.Scenes.hideAchievements());

  // settings
  const volEl = $("vol");
  const muteEl = $("mute");
  const bloomEl = $("bloom");
  const musicEl = $("music");
  const cbEl = $("cb");
  volEl.value = String(Math.round(Prism.state.settings.volume * 100));
  muteEl.checked = Prism.state.settings.muted;
  bloomEl.checked = Prism.PostFX.isEnabled();
  musicEl.checked = Prism.state.settings.music;
  cbEl.checked = Prism.state.settings.colorBlind;
  volEl.addEventListener("input", e => Prism.Audio.setVolume(parseFloat(e.target.value) / 100));
  muteEl.addEventListener("change", e => Prism.Audio.setMuted(e.target.checked));
  bloomEl.addEventListener("change", e => Prism.PostFX.setEnabled(e.target.checked));
  musicEl.addEventListener("change", e => {
    Prism.state.settings.music = e.target.checked;
    localStorage.setItem("prism_music", e.target.checked ? "1" : "0");
    if (!e.target.checked && Prism.Music) Prism.Music.stop();
    else if (Prism.state.scene === "play" && Prism.Music) Prism.Music.start();
  });
  cbEl.addEventListener("change", e => {
    Prism.state.settings.colorBlind = e.target.checked;
    localStorage.setItem("prism_cb", e.target.checked ? "1" : "0");
  });

  let lastT = 0;
  function frame(t) {
    const realDt = lastT ? (t - lastT) : 16.7;
    lastT = t;
    const dt = Math.min(2.5, realDt / 16.667);
    Prism.Game.update(dt);
    Prism.Game.render();
    Prism.Input.consumeFrame();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  Prism.Scenes.showMenu();
})();
