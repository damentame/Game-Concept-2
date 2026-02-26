# Bounce Breakers (Web Prototype)

Fast neon momentum game prototype focused on smooth movement and readable feedback.

## Features

- Momentum movement with drift + ricochet.
- Side-scrolling **moving background/track** (right-to-left racer-like illusion).
- Performance-focused effects pass:
  - significantly reduced particle counts
  - hard particle cap
  - lighter trail spawning
- Ability unlock progression:
  - Dash available immediately
  - Slam unlocks at Wave 2
  - Flick unlocks at Wave 3
- Upgrade progression (spend points with keys `1/2/3`):
  - Dash power
  - Grip
  - Shield
- Penalty system via Stability meter.

## Controls

- Move: `WASD` / Arrow keys
- Dash: `Shift`
- Slam: `Space` (after unlock)
- Flick: Mouse click / `J` (after unlock)
- Upgrades: `1` / `2` / `3`

## Run

```bash
python3 -m http.server 4173
```

Open: `http://127.0.0.1:4173`
