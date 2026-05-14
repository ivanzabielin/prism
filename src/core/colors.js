(() => {
  const COLORS = {
    R: { key: "R", hex: "#ff3a66", glow: "rgba(255,58,102,1)", soft: "rgba(255,58,102,0.18)", rgb: [255, 58, 102] },
    G: { key: "G", hex: "#3aff8c", glow: "rgba(58,255,140,1)", soft: "rgba(58,255,140,0.18)", rgb: [58, 255, 140] },
    B: { key: "B", hex: "#3aa6ff", glow: "rgba(58,166,255,1)", soft: "rgba(58,166,255,0.18)", rgb: [58, 166, 255] },
    W: { key: "W", hex: "#f4f6fb", glow: "rgba(244,246,251,1)", soft: "rgba(244,246,251,0.18)", rgb: [244, 246, 251] },
  };
  const COLOR_ORDER = ["R", "G", "B"];

  function rgba(key, alpha) {
    const c = COLORS[key].rgb;
    return `rgba(${c[0]},${c[1]},${c[2]},${alpha})`;
  }

  window.Prism = window.Prism || {};
  Prism.COLORS = COLORS;
  Prism.COLOR_ORDER = COLOR_ORDER;
  Prism.rgba = rgba;
})();