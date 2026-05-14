# PRISM

A neon arena shooter where every bolt has a color and only matching hues take damage. Everything else refracts off.

![status](https://img.shields.io/badge/play-in%20browser-ff3a66?style=flat-square) ![tech](https://img.shields.io/badge/canvas%202D-vanilla%20js-3aa6ff?style=flat-square) ![lines](https://img.shields.io/badge/single%20HTML-no%20build-3aff8c?style=flat-square)

## Play

```
git clone <this repo>
cd prism
# either:
double-click index.html         # works on file:// — classic scripts, no module CORS
# or:
python -m http.server 8765      # then open http://localhost:8765/index.html
```

`start.bat` automates the server route on Windows.

## Controls

| Key                 | Action                              |
|---------------------|-------------------------------------|
| `WASD` / Arrows     | Move                                |
| `Mouse`             | Aim                                 |
| `LMB`               | Fire                                |
| `RMB` / `R`         | Overload (when charged)             |
| `1` / `2` / `3`     | Switch beam — Red / Green / Blue    |
| `Q` / `E` / Wheel   | Cycle beam                          |
| `Space` / `Shift`   | Dash (i-frames)                     |
| `P` / `Esc`         | Pause                               |
| `M`                 | Mute                                |

## Features

- Three ship classes — **LANCE** (pierce/damage), **ARC** (spread), **PULSE** (refractor) — chosen at the loadout screen.
- **18 stackable upgrades** offered after every non-boss wave, weighted by your current build.
- **9 enemy archetypes**: chaser, shooter, teleporter, swarmer, splitter, sniper, mine, armored, prismatic.
- **Elite variants** past wave 5 — tougher, faster, drop better.
- **3 boss types** cycling every fifth wave: SHARD (radial/spread/spiral), WARDEN (summon/lance), NEBULA (burst/spiral).
- **Slow-mo boss intros** with title cards.
- **Overload active** — radius-clear of bullets and enemies, charges from kills.
- **Procedural ambient music** (Web Audio: drone + chord progression + plucks with echo).
- **Bloom postprocessing** via offscreen canvas blur.
- **13 achievements** persisted to `localStorage`.
- **Color-blind mode** — letters on enemies.
- Particle juice, screen shake, hit-pause, shockwaves, untouched-wave bonus.

## Architecture

```
prism/
├── index.html
├── style.css
├── start.bat
└── src/
    ├── main.js
    ├── core/      utils, colors, state, audio, input, game
    ├── data/      enemyTypes, upgradeDefs, ships, bosses
    ├── entities/  particle, effects, bullet, pickup, enemy, player
    └── systems/   scenes, hud, upgrades, achievements, loadout, postfx, music, render, waves
```

Classic `<script>` tags, single global `Prism.*` namespace — runs from `file://` with no build step.

## License

MIT.
