(() => {
  // Manages the upgrade selection screen.
  const Sys = {
    cards: [],
    hover: -1,
    intro: 0,
  };

  function open() {
    Prism.state.scene = "upgrade";
    Sys.cards = Prism.Upgrades.offer(Prism.state.player, 3);
    Sys.hover = -1;
    Sys.intro = 30;
    Prism.Audio.sfx.upgrade();
  }

  function cardRects() {
    const { W, H } = Prism.state;
    const cw = 240, ch = 320, gap = 32;
    const total = Sys.cards.length;
    const totalW = cw * total + gap * (total - 1);
    const x0 = (W - totalW) / 2;
    const y = H / 2 - ch / 2 + 20;
    return Sys.cards.map((c, i) => ({ x: x0 + i * (cw + gap), y, w: cw, h: ch }));
  }

  function update(dt) {
    if (Prism.state.scene !== "upgrade") return;
    if (Sys.intro > 0) Sys.intro -= dt;
    const m = Prism.Input.mouse;
    const rects = cardRects();
    let h = -1;
    for (let i = 0; i < rects.length; i++) {
      const r = rects[i];
      if (m.x >= r.x && m.x <= r.x + r.w && m.y >= r.y && m.y <= r.y + r.h) { h = i; break; }
    }
    if (h !== Sys.hover) {
      if (h >= 0) Prism.Audio.sfx.cardHover();
      Sys.hover = h;
    }
    // click select
    if (m.down && !m.prevDown && h >= 0) {
      pick(h);
    }
    // keyboard
    if (Prism.Input.justPressed("1")) pick(0);
    if (Prism.Input.justPressed("2")) pick(1);
    if (Prism.Input.justPressed("3")) pick(2);
  }

  function pick(i) {
    const def = Sys.cards[i]; if (!def) return;
    const p = Prism.state.player;
    p.upgrades[def.id] = (p.upgrades[def.id] || 0) + 1;
    Prism.state.upgrades[def.id] = (Prism.state.upgrades[def.id] || 0) + 1;
    def.apply(p);
    Prism.Audio.sfx.cardSelect();
    Prism.Effects.flash(0.3);
    Prism.Effects.shockwave(Prism.state.W / 2, Prism.state.H / 2, "#ffffff", 360, 36, 4);
    Prism.state.scene = "play";
    Prism.state.waveTimer = 100;
  }

  function render(ctx) {
    if (Prism.state.scene !== "upgrade") return;
    const { W, H } = Prism.state;
    // dim background
    ctx.fillStyle = "rgba(2,3,8,0.78)";
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    const t = 1 - Math.max(0, Sys.intro / 30);
    ctx.globalAlpha = t;

    // title
    ctx.fillStyle = "#e8eef6";
    ctx.font = "bold 14px ui-monospace, Menlo, monospace";
    ctx.textAlign = "center";
    ctx.fillText("WAVE " + Prism.state.wave + " CLEARED", W / 2, H / 2 - 220);
    ctx.font = "bold 36px ui-monospace, Menlo, monospace";
    const grd = ctx.createLinearGradient(W / 2 - 200, 0, W / 2 + 200, 0);
    grd.addColorStop(0, "#ff3a66"); grd.addColorStop(0.5, "#3aff8c"); grd.addColorStop(1, "#3aa6ff");
    ctx.fillStyle = grd;
    ctx.fillText("REFRACT", W / 2, H / 2 - 180);
    ctx.font = "12px ui-monospace, Menlo, monospace";
    ctx.fillStyle = "rgba(232,238,246,0.55)";
    ctx.fillText("CHOOSE A MODIFICATION  ·  1 / 2 / 3  ·  CLICK", W / 2, H / 2 - 156);

    const rects = cardRects();
    for (let i = 0; i < rects.length; i++) {
      const r = rects[i];
      const def = Sys.cards[i];
      const hovered = i === Sys.hover;
      const stacks = (Prism.state.player.upgrades[def.id] || 0);

      // glow on hover
      if (hovered) {
        const g = ctx.createRadialGradient(r.x + r.w / 2, r.y + r.h / 2, 0, r.x + r.w / 2, r.y + r.h / 2, 260);
        g.addColorStop(0, tagColor(def.tag, 0.4));
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.fillRect(r.x - 60, r.y - 60, r.w + 120, r.h + 120);
      }

      // card body
      const ox = hovered ? -6 : 0;
      ctx.fillStyle = "rgba(10,14,24,0.95)";
      roundRect(ctx, r.x, r.y + ox, r.w, r.h, 12);
      ctx.fill();
      ctx.lineWidth = hovered ? 2.5 : 1.5;
      ctx.strokeStyle = hovered ? tagColor(def.tag, 1) : "rgba(120,180,255,0.3)";
      ctx.stroke();

      // tag
      ctx.fillStyle = tagColor(def.tag, 0.85);
      ctx.font = "bold 10px ui-monospace, Menlo, monospace";
      ctx.textAlign = "left";
      ctx.fillText(def.tag.toUpperCase(), r.x + 18, r.y + ox + 24);

      // glyph
      drawCardGlyph(ctx, def, r.x + r.w / 2, r.y + ox + 110, hovered);

      // name
      ctx.fillStyle = "#f4f6fb";
      ctx.font = "bold 22px ui-monospace, Menlo, monospace";
      ctx.textAlign = "center";
      ctx.fillText(def.name, r.x + r.w / 2, r.y + ox + 200);

      // desc
      ctx.fillStyle = "rgba(232,238,246,0.72)";
      ctx.font = "12px ui-monospace, Menlo, monospace";
      wrapText(ctx, def.desc, r.x + r.w / 2, r.y + ox + 228, r.w - 28, 16);

      // stacks
      if (stacks > 0) {
        ctx.fillStyle = tagColor(def.tag, 1);
        ctx.font = "bold 10px ui-monospace, Menlo, monospace";
        ctx.fillText("OWNED " + stacks + "/" + def.maxStacks, r.x + r.w / 2, r.y + ox + r.h - 18);
      } else {
        ctx.fillStyle = "rgba(255,255,255,0.32)";
        ctx.font = "bold 10px ui-monospace, Menlo, monospace";
        ctx.fillText("[ " + (i + 1) + " ]", r.x + r.w / 2, r.y + ox + r.h - 18);
      }
    }
    ctx.restore();
  }

  function tagColor(tag, a) {
    if (tag === "offense") return `rgba(255,90,120,${a})`;
    if (tag === "defense") return `rgba(120,200,255,${a})`;
    return `rgba(255,200,90,${a})`;
  }

  function drawCardGlyph(ctx, def, x, y, hot) {
    const c = tagColor(def.tag, 1);
    ctx.save(); ctx.translate(x, y);
    ctx.strokeStyle = c; ctx.lineWidth = 2.5;
    ctx.fillStyle = tagColor(def.tag, 0.18);
    const t = performance.now() * 0.002;
    ctx.rotate(hot ? Math.sin(t) * 0.1 : 0);
    ctx.beginPath();
    // shape per tag
    if (def.tag === "offense") {
      // triangle
      ctx.moveTo(28, 0); ctx.lineTo(-18, 22); ctx.lineTo(-18, -22);
      ctx.closePath();
    } else if (def.tag === "defense") {
      // hex
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const xx = Math.cos(a) * 26, yy = Math.sin(a) * 26;
        if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
      }
      ctx.closePath();
    } else {
      // diamond
      ctx.moveTo(0, -26); ctx.lineTo(26, 0); ctx.lineTo(0, 26); ctx.lineTo(-26, 0);
      ctx.closePath();
    }
    ctx.fill(); ctx.stroke();
    // inner mark
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.restore();
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

  function wrapText(ctx, text, x, y, maxW, lh) {
    const words = text.split(" ");
    let line = "", ly = y;
    for (const w of words) {
      const test = line ? line + " " + w : w;
      if (ctx.measureText(test).width > maxW) {
        ctx.fillText(line, x, ly);
        line = w; ly += lh;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, x, ly);
  }

  window.Prism = window.Prism || {};
  Prism.UpgradeScreen = { open, update, render };
})();