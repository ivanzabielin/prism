(() => {
  // Procedural ambient music: bass drone + pad chord progression + occasional plucks.
  let on = false;
  let nodes = [];
  let timer = null;
  let bus = null;
  let lpFilter = null;
  let echo = null;
  let echoGain = null;
  let busLevel = 0.65;
  let chordIdx = 0;
  let plinkIdx = 0;
  let intensity = 0;   // 0..1, ramps up during combat

  // Minor key chord progression — i / VI / iv / III / VII (Am-F-Dm-C-G)
  const PROGRESSION = [
    [220.00, 261.63, 329.63], // Am
    [174.61, 220.00, 261.63], // F
    [146.83, 220.00, 261.63], // Dm
    [130.81, 196.00, 261.63], // C
    [196.00, 246.94, 293.66], // G
  ];
  const PENTA = [220, 261.63, 293.66, 329.63, 392, 440, 523.25];

  function start() {
    if (on) return;
    Prism.Audio.ensure();
    const ac = Prism.Audio.getContext();
    const master = Prism.Audio.getMaster();
    if (!ac || !master) return;
    on = true;

    bus = ac.createGain(); bus.gain.value = busLevel;
    lpFilter = ac.createBiquadFilter();
    lpFilter.type = "lowpass";
    lpFilter.frequency.value = 2200;
    lpFilter.Q.value = 0.4;
    echo = ac.createDelay(2.0); echo.delayTime.value = 0.42;
    echoGain = ac.createGain(); echoGain.gain.value = 0.28;
    bus.connect(lpFilter);
    lpFilter.connect(master);
    lpFilter.connect(echo);
    echo.connect(echoGain);
    echoGain.connect(echo);
    echoGain.connect(master);

    // bass drone
    const bass = ac.createOscillator();
    bass.type = "sine";
    bass.frequency.value = 55;
    const bg = ac.createGain(); bg.gain.value = 0.08;
    bass.connect(bg); bg.connect(bus);
    bass.start();
    nodes.push(bass);

    // bass LFO
    const lfo = ac.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.08;
    const lfoGain = ac.createGain(); lfoGain.gain.value = 0.04;
    lfo.connect(lfoGain); lfoGain.connect(bg.gain);
    lfo.start();
    nodes.push(lfo);

    // shimmer high drone
    const shimmer = ac.createOscillator();
    shimmer.type = "triangle";
    shimmer.frequency.value = 880;
    const sg = ac.createGain(); sg.gain.value = 0.005;
    shimmer.connect(sg); sg.connect(bus);
    shimmer.start();
    nodes.push(shimmer);
    const sLfo = ac.createOscillator();
    sLfo.frequency.value = 0.15;
    const sLfoGain = ac.createGain(); sLfoGain.gain.value = 0.004;
    sLfo.connect(sLfoGain); sLfoGain.connect(sg.gain);
    sLfo.start();
    nodes.push(sLfo);

    scheduleNextChord();
    schedulePluck();
  }

  function scheduleNextChord() {
    if (!on) return;
    const ac = Prism.Audio.getContext();
    if (!ac) return;
    const chord = PROGRESSION[chordIdx % PROGRESSION.length];
    chordIdx++;
    const t = ac.currentTime;
    const sustain = 4.4 + intensity * 1.0;
    for (let i = 0; i < chord.length; i++) {
      const f = chord[i] * (i === 0 ? 0.5 : 1);
      const o = ac.createOscillator();
      o.type = i === 0 ? "sine" : "triangle";
      o.frequency.value = f;
      const g = ac.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.022 + intensity * 0.015, t + 0.9);
      g.gain.linearRampToValueAtTime(0.014, t + sustain * 0.6);
      g.gain.exponentialRampToValueAtTime(0.0001, t + sustain);
      o.connect(g); g.connect(bus);
      o.start(t); o.stop(t + sustain + 0.1);
    }
    timer = setTimeout(scheduleNextChord, 4200 - intensity * 600);
  }

  function schedulePluck() {
    if (!on) return;
    const ac = Prism.Audio.getContext();
    if (!ac) return;
    if (Math.random() < 0.6 + intensity * 0.3) {
      const f = PENTA[Math.floor(Math.random() * PENTA.length)];
      const t = ac.currentTime + Math.random() * 0.4;
      const o = ac.createOscillator();
      o.type = "triangle";
      o.frequency.value = f * (Math.random() < 0.4 ? 2 : 1);
      const g = ac.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.05, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
      o.connect(g); g.connect(bus);
      o.start(t); o.stop(t + 1.0);
    }
    setTimeout(schedulePluck, 1100 + Math.random() * 2400 - intensity * 800);
  }

  function stop() {
    if (!on) return;
    on = false;
    if (timer) clearTimeout(timer);
    for (const n of nodes) { try { n.stop(); } catch (_) {} }
    nodes = [];
    if (bus) { try { bus.disconnect(); } catch (_) {} }
  }

  function setIntensity(v) {
    intensity = Math.max(0, Math.min(1, v));
    if (lpFilter) lpFilter.frequency.value = 2000 + intensity * 4000;
  }

  window.Prism = window.Prism || {};
  Prism.Music = { start, stop, setIntensity };
})();
