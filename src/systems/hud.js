(() => {
  const { clamp } = Prism.utils;

  function draw(ctx) {
    const s = Prism.state;
    if (!s.player || s.scene === "menu") return;
    const p = s.player;

    // HP hearts
    for (let i = 0; i < p.maxHp; i++) {
      const x = 26 + i * 26, y = 28;
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(255,140,170,0.55)";
      if (i < p.hp) {
        ctx.fillStyle = "rgba(255,80,120,0.92)";
        ctx.fill();
      }
      ctx.stroke();
    }

    // color selector
    const cx = 26, cy = 56;
    for (let i = 0; i < Prism.COLOR_ORDER.length; i++) {
      const k = Prism.COLOR_ORDER[i];
      const c = Prism.COLORS[k];
      const x = cx + i * 36, y = cy + 14;
      const sel = p.color === k;
      ctx.lineWidth = sel ? 3 : 1.5;
      ctx.strokeStyle = c.hex;
      ctx.fillStyle = sel ? c.hex : "rgba(0,0,0,0)";
      ctx.beginPath(); ctx.arc(x, y, sel ? 13 : 10, 0, Math.PI * 2);
      if (sel) ctx.fill();
      ctx.stroke();
      ctx.fillStyle = sel ? "#000" : c.hex;
      ctx.font = "bold 12px ui-monospace, Menlo, monospace";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(String(i + 1), x, y + 1);
    }
    ctx.textBaseline = "alphabetic";

    // dash cooldown
    const dx = 26, dy = 96;
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.fillRect(dx, dy, 110, 6);
    ctx.fillStyle = p.dashCD <= 0 ? "#fff" : "rgba(140,180,240,0.6)";
    const r = clamp(1 - p.dashCD / p.dashMax, 0, 1);
    ctx.fillRect(dx, dy, 110 * r, 6);
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = "10px ui-monospace, Menlo, monospace";
    ctx.textAlign = "left";
    ctx.fillText("DASH", dx, dy - 4);

    // overload charge
    const ox = 26, oy = 120;
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(ox, oy, 110, 6);
    const cr = clamp(p.charge / p.chargeMax, 0, 1);
    const ready = cr >= 1;
    const oc = ready ? "#ffe066" : Prism.COLORS[p.color].hex;
    ctx.fillStyle = oc;
    ctx.globalAlpha = ready ? (0.7 + Math.sin(s.time * 0.4) * 0.3) : 0.85;
    ctx.fillRect(ox, oy, 110 * cr, 6);
    ctx.globalAlpha = 1;
    ctx.fillStyle = ready ? "#ffe066" : "rgba(255,255,255,0.55)";
    ctx.font = "10px ui-monospace, Menlo, monospace";
    ctx.fillText(ready ? "OVERLOAD READY  [R]" : "OVERLOAD", ox, oy - 4);

    // locked-in indicator
    if (p.mods.lockedIn && p.lockHoldFrames > 0) {
      const cf = clamp(p.lockHoldFrames / 60, 0, 1);
      const lx = 26, ly = 140;
      ctx.fillStyle = "rgba(255,255,255,0.1)"; ctx.fillRect(lx, ly, 110, 4);
      ctx.fillStyle = cf >= 1 ? "#ffe066" : "rgba(255,224,102,0.55)"; ctx.fillRect(lx, ly, 110 * cf, 4);
      ctx.fillStyle = "rgba(255,255,255,0.55)"; ctx.font = "10px ui-monospace";
      ctx.fillText(cf >= 1 ? "LOCK READY" : "LOCK", lx, ly - 3);
    }

    // score panel
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = "bold 28px ui-monospace, Menlo, monospace";
    ctx.fillText(String(s.score).padStart(6, "0"), Prism.state.W - 24, 36);
    ctx.font = "11px ui-monospace, Menlo, monospace";
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillText("WAVE " + s.wave + "  ·  BEST " + s.best, Prism.state.W - 24, 56);

    if (s.combo > 1) {
      const a = clamp(s.comboTimer / 90, 0, 1);
      ctx.fillStyle = `rgba(255,${200 - Math.min(120, s.combo * 4)},120,${a})`;
      ctx.font = "bold 18px ui-monospace, Menlo, monospace";
      ctx.fillText("× " + s.combo, Prism.state.W - 24, 80);
      // bar
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fillRect(Prism.state.W - 124, 88, 100, 4);
      ctx.fillStyle = `rgba(255,200,120,${a})`;
      ctx.fillRect(Prism.state.W - 124, 88, 100 * a, 4);
    }

    // upgrade pip list
    const tags = Object.entries(p.upgrades);
    if (tags.length) {
      ctx.font = "bold 9px ui-monospace, Menlo, monospace";
      ctx.textAlign = "right";
      ctx.fillStyle = "rgba(255,255,255,0.45)";
      ctx.fillText("UPGRADES", Prism.state.W - 24, 110);
      let yy = 124;
      for (const [id, n] of tags) {
        const def = Prism.Upgrades.byId(id);
        ctx.fillStyle = tagCol(def.tag);
        ctx.fillText(def.name + (n > 1 ? " ×" + n : ""), Prism.state.W - 24, yy);
        yy += 12;
      }
    }

    // wave announce
    if (s.waveAnnounceTimer > 0) {
      const a = clamp(s.waveAnnounceTimer / 90, 0, 1);
      ctx.globalAlpha = a;
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.font = "bold 28px ui-monospace, Menlo, monospace";
      ctx.fillText("WAVE " + s.wave, Prism.state.W / 2, 80);
      if (s.wave % 5 === 0) {
        ctx.fillStyle = "#ff5577";
        ctx.font = "bold 14px ui-monospace, Menlo, monospace";
        ctx.fillText("◆ BOSS ◆", Prism.state.W / 2, 102);
      }
      ctx.globalAlpha = 1;
    }

    // wave breather
    if (!s.waveActive && s.scene === "play") {
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.textAlign = "center";
      ctx.font = "bold 26px ui-monospace, Menlo, monospace";
      const next = s.wave + 1;
      ctx.fillText("WAVE " + next + " INCOMING", Prism.state.W / 2, Prism.state.H / 2 - 16);
      ctx.font = "12px ui-monospace, Menlo, monospace";
      ctx.fillStyle = "rgba(255,255,255,0.45)";
      ctx.fillText(Math.ceil(s.waveTimer / 60).toString(), Prism.state.W / 2, Prism.state.H / 2 + 8);
      if (next % 5 === 0) {
        ctx.fillStyle = "#ff5577";
        ctx.font = "bold 14px ui-monospace, Menlo, monospace";
        ctx.fillText("◆ BOSS ◆", Prism.state.W / 2, Prism.state.H / 2 + 32);
      }
    }

    // floaters
    for (const f of s.floaters) {
      const aa = clamp(f.life / f.max, 0, 1);
      ctx.fillStyle = f.color;
      ctx.globalAlpha = aa;
      ctx.font = "bold 14px ui-monospace, Menlo, monospace";
      ctx.textAlign = "center";
      ctx.fillText(f.text, f.x, f.y);
      ctx.globalAlpha = 1;
    }

    // reflex tint
    if (p.mods.reflex && p.hp <= 2) {
      ctx.fillStyle = "rgba(255,40,90,0.06)";
      ctx.fillRect(0, 0, Prism.state.W, Prism.state.H);
    }
  }

  function tagCol(tag) {
    if (tag === "offense") return "rgba(255,90,120,0.85)";
    if (tag === "defense") return "rgba(120,200,255,0.85)";
    return "rgba(255,200,90,0.85)";
  }

  window.Prism = window.Prism || {};
  Prism.HUD = { draw };
})();