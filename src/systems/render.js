(() => {
  const { clamp } = Prism.utils;
  const TAU = Math.PI * 2;

  function drawGlow(ctx, x, y, r, col, alpha = 1) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, col);
    g.addColorStop(1, "transparent");
    ctx.globalAlpha = alpha;
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.globalAlpha = 1;
  }

  function drawShape(ctx, shape, x, y, r, angle, isBoss) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
    switch (shape) {
      case "triangle":
        ctx.beginPath();
        ctx.moveTo(r, 0); ctx.lineTo(-r * 0.7, r * 0.8); ctx.lineTo(-r * 0.7, -r * 0.8);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        break;
      case "hex":
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * TAU;
          if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
          else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath(); ctx.fill(); ctx.stroke();
        break;
      case "square":
        ctx.beginPath(); ctx.rect(-r, -r, r * 2, r * 2);
        ctx.fill(); ctx.stroke();
        break;
      case "diamond":
        ctx.beginPath();
        ctx.moveTo(0, -r); ctx.lineTo(r, 0); ctx.lineTo(0, r); ctx.lineTo(-r, 0);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        if (isBoss) {
          ctx.beginPath(); ctx.arc(0, 0, r * 0.55, 0, TAU); ctx.stroke();
        }
        break;
      case "wedge":
        ctx.beginPath();
        ctx.moveTo(r * 1.3, 0); ctx.lineTo(-r * 0.5, r * 0.6);
        ctx.lineTo(-r * 0.2, 0); ctx.lineTo(-r * 0.5, -r * 0.6);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        break;
      case "octagon":
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * TAU + TAU / 16;
          if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
          else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath(); ctx.fill(); ctx.stroke();
        // inner ring for armored
        ctx.beginPath(); ctx.arc(0, 0, r * 0.55, 0, TAU); ctx.stroke();
        break;
      case "star":
        ctx.beginPath();
        const spikes = 5;
        for (let i = 0; i < spikes * 2; i++) {
          const a = (i / (spikes * 2)) * TAU - Math.PI / 2;
          const rr = i % 2 === 0 ? r : r * 0.45;
          if (i === 0) ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
          else ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
        }
        ctx.closePath(); ctx.fill(); ctx.stroke();
        break;
    }
    ctx.restore();
  }

  function renderBackground(ctx) {
    const { W, H, time } = Prism.state;
    const pulse = 0.04 * Math.sin(time * 0.03);
    const grd = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.8);
    grd.addColorStop(0, `rgba(${10 + pulse * 60},${14 + pulse * 40},${28 + pulse * 60},1)`);
    grd.addColorStop(1, "rgba(2,3,6,1)");
    ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H);

    // grid
    ctx.strokeStyle = "rgba(120,170,230,0.05)";
    ctx.lineWidth = 1;
    const gs = 60;
    const ox = (time * 0.3) % gs, oy = (time * 0.3) % gs;
    ctx.beginPath();
    for (let x = -gs + ox; x < W + gs; x += gs) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
    for (let y = -gs + oy; y < H + gs; y += gs) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
    ctx.stroke();

    // drifting motes
    ctx.fillStyle = "rgba(120,170,230,0.08)";
    for (let i = 0; i < 40; i++) {
      const x = (Math.sin(i * 23.7 + time * 0.005) * 0.5 + 0.5) * W;
      const y = (Math.cos(i * 17.3 + time * 0.004) * 0.5 + 0.5) * H;
      ctx.beginPath(); ctx.arc(x, y, 1.2, 0, TAU); ctx.fill();
    }
  }

  function render(ctx) {
    const s = Prism.state;
    ctx.save();
    const sx = (Math.random() - 0.5) * s.shake;
    const sy = (Math.random() - 0.5) * s.shake;
    ctx.translate(sx, sy);

    renderBackground(ctx);

    ctx.globalCompositeOperation = "lighter";

    // shockwaves (additive)
    for (const sw of s.shockwaves) {
      const t = 1 - sw.life / sw.maxLife;
      ctx.globalAlpha = 1 - t;
      ctx.strokeStyle = sw.color;
      ctx.lineWidth = sw.lw * (1 - t * 0.6);
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.r, 0, TAU);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // particles
    for (const p of s.particles) {
      const a = clamp(p.life / p.max, 0, 1);
      const ss = p.shrink ? p.size * a : p.size;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = a;
      ctx.beginPath(); ctx.arc(p.x, p.y, ss, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // pickups
    for (const k of s.pickups) {
      const col = k.kind === "heal" ? "#ff88aa" : "#88ccff";
      const r = 9 + Math.sin(k.t * 0.15) * 2;
      ctx.fillStyle = col;
      ctx.globalAlpha = 0.18;
      ctx.beginPath(); ctx.arc(k.x, k.y, r * 2.5, 0, TAU); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = col; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(k.x, k.y, r, 0, TAU); ctx.stroke();
      ctx.beginPath();
      if (k.kind === "heal") {
        ctx.moveTo(k.x - 3, k.y); ctx.lineTo(k.x + 3, k.y);
        ctx.moveTo(k.x, k.y - 3); ctx.lineTo(k.x, k.y + 3);
      } else {
        ctx.arc(k.x, k.y, r * 0.45, 0, TAU);
      }
      ctx.stroke();
    }

    // enemy bullets
    for (const b of s.enemyBullets) {
      const c = Prism.COLORS[b.color];
      drawGlow(ctx, b.x, b.y, b.isEcho ? 22 : 16, c.glow, b.isEcho ? 0.55 : 0.5);
      ctx.fillStyle = c.hex;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.radius, 0, TAU); ctx.fill();
      if (b.isEcho) {
        ctx.strokeStyle = c.hex; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.radius * 1.5 + (Math.sin(s.time * 0.4) + 1), 0, TAU); ctx.stroke();
      }
    }

    // enemies
    for (const e of s.enemies) {
      const c = Prism.COLORS[e.color];
      if (e.spawnAnim > 0) {
        const t = 1 - e.spawnAnim / 30;
        ctx.globalAlpha = t;
        drawGlow(ctx, e.x, e.y, 50, c.glow, 0.5 * t);
        ctx.strokeStyle = c.hex; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(e.x, e.y, (1 - t) * 60 + 8, 0, TAU); ctx.stroke();
        ctx.globalAlpha = 1;
        continue;
      }
      drawGlow(ctx, e.x, e.y, e.isBoss ? 140 : 40, c.glow, e.flash > 0 ? 0.95 : 0.45);
      if (e.flash > 0) {
        ctx.globalAlpha = clamp(e.flash / 8, 0, 1);
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc(e.x, e.y, e.radius * 1.6, 0, TAU); ctx.fill();
        ctx.globalAlpha = 1;
      }
      ctx.lineWidth = e.isBoss ? 3 : 2.2;
      ctx.strokeStyle = c.hex; ctx.fillStyle = c.soft;
      // sniper charge ring
      if (e.def && e.def.ai === "snipe" && e.charge > 0) {
        const p = Prism.state.player;
        ctx.save();
        ctx.strokeStyle = c.hex;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.35 * clamp(e.charge / e.def.chargeTime, 0, 1);
        ctx.beginPath();
        ctx.moveTo(e.x, e.y); ctx.lineTo(p.x, p.y);
        ctx.stroke();
        ctx.restore();
      }
      drawShape(ctx, e.def.shape, e.x, e.y, e.radius, e.angle, e.isBoss);

      // elite outer pulse ring
      if (e.isElite) {
        const p = (Math.sin(e.elitePulse * 0.2) * 0.5 + 0.5);
        ctx.strokeStyle = c.hex;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.4 + p * 0.4;
        ctx.beginPath(); ctx.arc(e.x, e.y, e.radius + 6 + p * 4, 0, TAU); ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // mine detonate ring
      if (e.type === "mine" && e.mineDetonating) {
        const t = 1 - e.mineDetonateTimer / 26;
        ctx.strokeStyle = c.hex;
        ctx.lineWidth = 2;
        ctx.globalAlpha = t;
        ctx.beginPath(); ctx.arc(e.x, e.y, e.radius + t * 30, 0, TAU); ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // color-blind glyph
      if (Prism.state.settings.colorBlind && e.color !== "W") {
        ctx.fillStyle = "#000";
        ctx.globalAlpha = 0.7;
        ctx.font = "bold " + Math.floor(e.radius * 0.9) + "px ui-monospace, Menlo, monospace";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(e.color, e.x, e.y + 1);
        ctx.textBaseline = "alphabetic";
        ctx.globalAlpha = 1;
      }

      // hp bar for tough non-bosses
      if (!e.isBoss && e.maxHp > 2 && e.hp < e.maxHp) {
        const w = e.radius * 2, h = 3;
        const x = e.x - w / 2, y = e.y + e.radius + 6;
        ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
        ctx.fillStyle = c.hex; ctx.fillRect(x, y, w * (e.hp / e.maxHp), h);
      }

      // boss bar
      if (e.isBoss) {
        const w = 280, h = 8;
        const x = Prism.state.W / 2 - w / 2, y = Prism.state.H - 36;
        ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillRect(x - 3, y - 3, w + 6, h + 6);
        ctx.fillStyle = c.hex; ctx.fillRect(x, y, w * (e.hp / e.maxHp), h);
        ctx.fillStyle = "#fff"; ctx.font = "bold 10px ui-monospace, Menlo, monospace";
        ctx.textAlign = "center";
        ctx.fillText("◆ PRISM SHARD ◆", Prism.state.W / 2, y - 6);
      }
    }

    // player bullets
    for (const b of s.bullets) {
      const c = Prism.COLORS[b.color];
      drawGlow(ctx, b.x, b.y, 24, c.glow, 0.6);
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(b.x, b.y, b.radius * 0.7, 0, TAU); ctx.fill();
      ctx.fillStyle = c.hex; ctx.globalAlpha = 0.9;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.radius, 0, TAU); ctx.fill();
      ctx.globalAlpha = 1;
    }

    // player
    const p = s.player;
    if (p) {
      for (const t of p.trail) {
        const a = t.life / 12;
        ctx.globalAlpha = a * 0.4;
        ctx.fillStyle = Prism.COLORS[t.color].hex;
        ctx.beginPath(); ctx.arc(t.x, t.y, p.radius * 0.5 * a, 0, TAU); ctx.fill();
      }
      ctx.globalAlpha = 1;

      const c = Prism.COLORS[p.color];
      drawGlow(ctx, p.x, p.y, 60, c.glow, 0.55);
      ctx.save();
      ctx.translate(p.x, p.y); ctx.rotate(p.angle);
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = c.hex;
      ctx.fillStyle = Prism.rgba(p.color, 0.18);
      if (p.invuln > 0 && Math.floor(p.invuln / 4) % 2 === 0) ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.moveTo(p.radius * 1.15, 0);
      ctx.lineTo(-p.radius * 0.7, p.radius * 0.9);
      ctx.lineTo(-p.radius * 0.4, 0);
      ctx.lineTo(-p.radius * 0.7, -p.radius * 0.9);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(0, 0, 3, 0, TAU); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    ctx.globalCompositeOperation = "source-over";
    ctx.restore();

    // bloom postprocessing on the un-flashed scene
    if (Prism.PostFX) Prism.PostFX.apply(ctx);

    if (s.flash > 0.01) {
      ctx.fillStyle = `rgba(255,255,255,${s.flash})`;
      ctx.fillRect(0, 0, Prism.state.W, Prism.state.H);
    }

    Prism.HUD.draw(ctx);
    Prism.UpgradeScreen.render(ctx);
    if (Prism.Loadout) Prism.Loadout.render(ctx);
    renderBossIntro(ctx);
  }

  function renderBossIntro(ctx) {
    const bi = Prism.state.bossIntro;
    if (!bi || !bi.active) return;
    const t = 1 - bi.t / bi.max;
    const W = Prism.state.W, H = Prism.state.H;
    // bands
    const bandH = Math.min(120, 80 + 40 * Math.sin(t * Math.PI));
    const slide = 1 - Math.abs(t - 0.5) * 2;
    const ease = Math.max(0, slide);
    ctx.fillStyle = `rgba(0,0,0,${0.55 * ease})`;
    ctx.fillRect(0, H / 2 - bandH, W, bandH);
    ctx.fillRect(0, H / 2, W, bandH);
    // title
    const offset = (1 - ease) * 80;
    ctx.save();
    ctx.globalAlpha = ease;
    ctx.translate(W / 2 + (t < 0.5 ? -offset : offset), H / 2);
    ctx.textAlign = "center";
    ctx.font = "bold 56px ui-monospace, Menlo, monospace";
    const grd = ctx.createLinearGradient(-200, 0, 200, 0);
    grd.addColorStop(0, "#ff3a66"); grd.addColorStop(0.5, "#3aff8c"); grd.addColorStop(1, "#3aa6ff");
    ctx.fillStyle = grd;
    ctx.fillText(bi.name, 0, 0);
    ctx.font = "12px ui-monospace, Menlo, monospace";
    ctx.fillStyle = "rgba(232,238,246,0.7)";
    ctx.fillText(bi.sub, 0, 24);
    ctx.font = "bold 11px ui-monospace, Menlo, monospace";
    ctx.fillStyle = "rgba(255,90,120,0.85)";
    ctx.fillText("◆ INCOMING ◆", 0, -44);
    ctx.restore();
  }

  window.Prism = window.Prism || {};
  Prism.Render = { render, drawGlow, drawShape };
})();