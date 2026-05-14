(() => {
  let ctx = null;
  let masterGain = null;

  function ensure() {
    if (!ctx) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = ctx.createGain();
        masterGain.gain.value = Prism.state.settings.muted ? 0 : Prism.state.settings.volume;
        masterGain.connect(ctx.destination);
      } catch (e) { ctx = null; }
    }
    if (ctx && ctx.state === "suspended") ctx.resume();
  }

  function setVolume(v) {
    Prism.state.settings.volume = v;
    localStorage.setItem("prism_vol", String(v));
    if (masterGain) masterGain.gain.value = Prism.state.settings.muted ? 0 : v;
  }
  function setMuted(m) {
    Prism.state.settings.muted = m;
    localStorage.setItem("prism_muted", m ? "1" : "0");
    if (masterGain) masterGain.gain.value = m ? 0 : Prism.state.settings.volume;
  }

  function tone({ freq = 440, dur = 0.1, type = "square", vol = 0.05, slide = 0, attack = 0.005, release = 0.06 }) {
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slide) {
      const target = Math.max(20, freq + slide);
      osc.frequency.exponentialRampToValueAtTime(target, t + dur);
    }
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + release);
    osc.connect(g); g.connect(masterGain);
    osc.start(t); osc.stop(t + dur + release + 0.02);
  }

  function noise({ dur = 0.1, vol = 0.05, hp = 400, lp = 8000 }) {
    if (!ctx) return;
    const t = ctx.currentTime;
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const g = ctx.createGain(); g.gain.value = vol;
    const f1 = ctx.createBiquadFilter(); f1.type = "highpass"; f1.frequency.value = hp;
    const f2 = ctx.createBiquadFilter(); f2.type = "lowpass"; f2.frequency.value = lp;
    src.connect(f1); f1.connect(f2); f2.connect(g); g.connect(masterGain);
    src.start(t);
  }

  const sfx = {
    shoot(c) {
      const f = c === "R" ? 880 : c === "G" ? 740 : c === "B" ? 620 : 1000;
      tone({ freq: f, dur: 0.04, type: "square", vol: 0.035, slide: -300 });
    },
    hit() { tone({ freq: 120, dur: 0.06, type: "sawtooth", vol: 0.05, slide: -60 }); noise({ dur: 0.05, vol: 0.04 }); },
    reject() { tone({ freq: 160, dur: 0.04, type: "square", vol: 0.025, slide: 60 }); },
    kill() {
      tone({ freq: 60, dur: 0.18, type: "sawtooth", vol: 0.07, slide: -30 });
      noise({ dur: 0.18, vol: 0.05, hp: 200 });
    },
    bigKill() {
      tone({ freq: 60, dur: 0.32, type: "sawtooth", vol: 0.09, slide: -40 });
      noise({ dur: 0.32, vol: 0.07, hp: 120 });
      setTimeout(() => tone({ freq: 220, dur: 0.18, type: "triangle", vol: 0.06 }), 80);
    },
    dash() { tone({ freq: 520, dur: 0.12, type: "sine", vol: 0.05, slide: -300 }); },
    hurt() {
      tone({ freq: 220, dur: 0.22, type: "sawtooth", vol: 0.08, slide: -120 });
      noise({ dur: 0.12, vol: 0.06, hp: 120 });
    },
    wave() {
      tone({ freq: 330, dur: 0.12, type: "triangle", vol: 0.06 });
      setTimeout(() => tone({ freq: 494, dur: 0.18, type: "triangle", vol: 0.06 }), 100);
    },
    death() {
      for (let i = 0; i < 8; i++)
        setTimeout(() => tone({ freq: 60 + i * 8, dur: 0.18, type: "sawtooth", vol: 0.06, slide: -80 }), i * 60);
    },
    pickup() { tone({ freq: 880, dur: 0.08, type: "triangle", vol: 0.05, slide: 400 }); },
    boss() {
      for (let i = 0; i < 5; i++)
        setTimeout(() => tone({ freq: 55 + i * 8, dur: 0.3, type: "sawtooth", vol: 0.08 }), i * 120);
    },
    upgrade() {
      tone({ freq: 523, dur: 0.12, type: "triangle", vol: 0.06 });
      setTimeout(() => tone({ freq: 659, dur: 0.12, type: "triangle", vol: 0.06 }), 80);
      setTimeout(() => tone({ freq: 784, dur: 0.18, type: "triangle", vol: 0.07 }), 160);
    },
    cardHover() { tone({ freq: 660, dur: 0.03, type: "sine", vol: 0.02 }); },
    cardSelect() {
      tone({ freq: 440, dur: 0.05, type: "triangle", vol: 0.05 });
      tone({ freq: 880, dur: 0.08, type: "triangle", vol: 0.04, slide: 400 });
    },
    shockwave() { noise({ dur: 0.22, vol: 0.06, hp: 80, lp: 1200 }); },
  };

  function getContext() { return ctx; }
  function getMaster() { return masterGain; }

  window.Prism = window.Prism || {};
  Prism.Audio = { ensure, sfx, setVolume, setMuted, getContext, getMaster };
})();