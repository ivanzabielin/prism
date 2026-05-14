(() => {
  let hover = -1;
  let intro = 0;
  let prevMouseDown = false;

  function open() {
    Prism.state.scene = "loadout";
    intro = 30;
    hover = -1;
  }

  function close() {
    Prism.state.scene = "menu";
  }

  function cardRects() {
    const { W, H } = Prism.state;
    const cw = 240, ch = 360, gap = 32;
    const total = Prism.Ships.SHIPS.length;
    const totalW = cw * total + gap * (total - 1);
    const x0 = (W - totalW) / 2;
    const y = H / 2 - ch / 2 + 24;
    return Prism.Ships.SHIPS.map((_, i) => ({ x: x0 + i * (cw + gap), y, w: cw, h: ch }));
  }

  function update(dt) {
    if (Prism.state.scene !== "loadout") return;
    if (intro > 0) intro -= dt;
    const m = Prism.Input.mouse;
    const rects = cardRects();
    let h = -1;
    for (let i = 0; i < rects.length; i++) {
      const r = rects[i];
      if (m.x >= r.x && m.x <= r.x + r.w && m.y >= r.y && m.y <= r.y + r.h) { h = i; break; }
    }
    if (h !== hover) {
      if (h >= 0) Prism.Audio.sfx.cardHover();
      hover = h;
    }
    if (m.down && !prevMouseDown && h >= 0) pick(h);
    prevMouseDown = m.down;
    if (Prism.Input.justPressed("1")) pick(0);
    if (Prism.Input.justPressed("2")) pick(1);
    if (Prism.Input.justPressed("3")) pick(2);
    if (Prism.Input.justPressed("escape")) close();
  }

  function pick(i) {
    const ship = Prism.Ships.SHIPS[i]; if (!ship) return;
    Prism.state.selectedShip = ship.id;
    localStorage.setItem("prism_ship", ship.id);
    Prism.Audio.sfx.cardSelect();
    Prism.Game.start();
  }

  function render(ctx) {
    if (Prism.state.scene !== "loadout") return;
    const { W, H } = Prism.state;
    ctx.fillStyle = "rgba(2,3,8,0.88)";
    ctx.fillRect(0, 0, W, H);
    const t = 1 - Math.max(0, intro / 30);
    ctx.save();
    ctx.globalAlpha = t;
    ctx.fillStyle = "#e8eef6";
    ctx.textAlign = "center";
    ctx.font = "bold 12px ui-monospace, Menlo, monospace";
    ctx.fillStyle = "rgba(232,238,246,0.55)";
    ctx.fillText("SELECT VESSEL  ·  1 / 2 / 3  ·  CLICK", W / 2, H / 2 - 220);
    ctx.font = "bold 38px ui-monospace, Menlo, monospace";
    const grd = ctx.createLinearGradient(W / 2 - 200, 0, W / 2 + 200, 0);
    grd.addColorStop(0, "#ff3a66"); grd.addColorStop(0.5, "#3aff8c"); grd.addColorStop(1, "#3aa6ff");
    ctx.fillStyle = grd;
    ctx.fillText("LOADOUT", W / 2, H / 2 - 180);

    const rects = cardRects();
    for (let i = 0; i < rects.length; i++) {
      const r = rects[i];
      const ship = Prism.Ships.SHIPS[i];
      const hot = i === hover;
      // glow
      if (hot) {
        const g = ctx.createRadialGradient(r.x + r.w / 2, r.y + r.h / 2, 0, r.x + r.w / 2, r.y + r.h / 2, 280);
        const col = ship.accent;
        g.addColorStop(0, hexA(col, 0.45));
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.fillRect(r.x - 60, r.y - 60, r.w + 120, r.h + 120);
      }
      const ox = hot ? -6 : 0;
      ctx.fillStyle = "rgba(10,14,24,0.94)";
      roundRect(ctx, r.x, r.y + ox, r.w, r.h, 14); ctx.fill();
      ctx.lineWidth = hot ? 2.5 : 1.5;
      ctx.strokeStyle = hot ? ship.accent : "rgba(120,180,255,0.3)";
      ctx.stroke();

      ctx.font = "bold 10px ui-monospace, Menlo, monospace";
      ctx.textAlign = "left";
      ctx.fillStyle = hexA(ship.accent, 0.85);
      ctx.fillText(ship.role.toUpperCase(), r.x + 18, r.y + ox + 24);

      // big glyph
      ctx.save();
      ctx.translate(r.x + r.w / 2, r.y + ox + 120);
      const pulse = 1 + Math.sin(performance.now() * 0.003 + i) * 0.04;
      ctx.scale(pulse, pulse);
      ctx.fillStyle = ship.accent;
      ctx.globalAlpha = 0.18 + (hot ? 0.15 : 0);
      ctx.beginPath(); ctx.arc(0, 0, 56, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.font = "bold 72px ui-monospace, Menlo, monospace";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillStyle = ship.accent;
      ctx.fillText(ship.glyph, 0, 4);
      ctx.restore();
      ctx.textBaseline = "alphabetic";

      ctx.font = "bold 24px ui-monospace, Menlo, monospace";
      ctx.fillStyle = "#f4f6fb";
      ctx.textAlign = "center";
      ctx.fillText(ship.name, r.x + r.w / 2, r.y + ox + 220);

      ctx.font = "12px ui-monospace, Menlo, monospace";
      ctx.fillStyle = "rgba(232,238,246,0.72)";
      ctx.fillText(ship.desc, r.x + r.w / 2, r.y + ox + 244);

      // stats
      ctx.font = "11px ui-monospace, Menlo, monospace";
      ctx.fillStyle = hexA(ship.accent, 0.9);
      ctx.textAlign = "center";
      let yy = r.y + ox + 272;
      for (const s of ship.stats) {
        ctx.fillText("· " + s, r.x + r.w / 2, yy);
        yy += 16;
      }

      ctx.fillStyle = "rgba(255,255,255,0.32)";
      ctx.font = "bold 10px ui-monospace, Menlo, monospace";
      ctx.fillText("[ " + (i + 1) + " ]", r.x + r.w / 2, r.y + ox + r.h - 18);
    }

    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "10px ui-monospace, Menlo, monospace";
    ctx.fillText("ESC TO RETURN", W / 2, H - 36);

    ctx.restore();
  }

  function hexA(hex, a) {
    const h = hex.replace("#", "");
    const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${a})`;
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  window.Prism = window.Prism || {};
  Prism.Loadout = { open, close, update, render };
})();
