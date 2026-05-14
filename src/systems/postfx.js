(() => {
  let bloom = null;
  let bctx = null;
  let prevW = 0, prevH = 0;
  let enabled = localStorage.getItem("prism_bloom") !== "0";
  let supportsFilter = null;

  function detectFilter() {
    if (supportsFilter !== null) return supportsFilter;
    const c = document.createElement("canvas");
    const t = c.getContext("2d");
    t.filter = "blur(4px)";
    supportsFilter = t.filter === "blur(4px)";
    return supportsFilter;
  }

  function ensure() {
    const W = Prism.state.W, H = Prism.state.H;
    const bw = Math.max(64, Math.floor(W / 3));
    const bh = Math.max(64, Math.floor(H / 3));
    if (!bloom || prevW !== bw || prevH !== bh) {
      bloom = document.createElement("canvas");
      bloom.width = bw; bloom.height = bh;
      bctx = bloom.getContext("2d");
      prevW = bw; prevH = bh;
    }
  }

  function apply(ctx) {
    if (!enabled || !detectFilter()) return;
    ensure();
    const W = Prism.state.W, H = Prism.state.H;
    bctx.globalCompositeOperation = "source-over";
    bctx.clearRect(0, 0, bloom.width, bloom.height);
    bctx.filter = "blur(4px) brightness(1.6) saturate(1.2)";
    bctx.drawImage(ctx.canvas, 0, 0, bloom.width, bloom.height);
    bctx.filter = "blur(8px)";
    bctx.globalCompositeOperation = "lighter";
    bctx.drawImage(bloom, 0, 0, bloom.width, bloom.height);
    bctx.filter = "none";

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.55;
    ctx.drawImage(bloom, 0, 0, W, H);
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function toggle() {
    enabled = !enabled;
    localStorage.setItem("prism_bloom", enabled ? "1" : "0");
    return enabled;
  }

  function setEnabled(v) {
    enabled = !!v;
    localStorage.setItem("prism_bloom", enabled ? "1" : "0");
  }

  function isEnabled() { return enabled; }

  window.Prism = window.Prism || {};
  Prism.PostFX = { apply, toggle, setEnabled, isEnabled };
})();