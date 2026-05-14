(() => {
  const Input = {
    keys: new Set(),
    mouse: { x: 0, y: 0, down: false, prevDown: false, rmb: false, rmbJust: false },
    pressed: new Set(),
    consumed: new Set(),
  };

  const movementKeys = new Set(["arrowup", "arrowdown", "arrowleft", "arrowright", " "]);

  function init(canvas) {
    window.addEventListener("keydown", e => {
      const k = e.key.toLowerCase();
      if (movementKeys.has(k)) e.preventDefault();
      if (!Input.keys.has(k)) Input.pressed.add(k);
      Input.keys.add(k);
    });
    window.addEventListener("keyup", e => {
      Input.keys.delete(e.key.toLowerCase());
    });
    canvas.addEventListener("mousemove", e => {
      const r = canvas.getBoundingClientRect();
      Input.mouse.x = e.clientX - r.left;
      Input.mouse.y = e.clientY - r.top;
    });
    canvas.addEventListener("mousedown", e => {
      if (e.button === 0) { Input.mouse.down = true; Prism.Audio.ensure(); }
      if (e.button === 2) { Input.mouse.rmbJust = !Input.mouse.rmb; Input.mouse.rmb = true; Prism.Audio.ensure(); }
    });
    window.addEventListener("mouseup", e => {
      if (e.button === 0) Input.mouse.down = false;
      if (e.button === 2) Input.mouse.rmb = false;
    });
    canvas.addEventListener("contextmenu", e => e.preventDefault());
    window.addEventListener("blur", () => { Input.keys.clear(); Input.mouse.down = false; });
  }

  function consumeFrame() {
    Input.pressed.clear();
    Input.mouse.prevDown = Input.mouse.down;
    Input.mouse.rmbJust = false;
  }

  function justPressed(k) {
    return Input.pressed.has(k.toLowerCase());
  }
  function held(k) {
    return Input.keys.has(k.toLowerCase());
  }
  function heldAny(...ks) {
    for (const k of ks) if (Input.keys.has(k.toLowerCase())) return true;
    return false;
  }

  window.Prism = window.Prism || {};
  Prism.Input = Object.assign(Input, { init, consumeFrame, justPressed, held, heldAny });
})();