# Bounce Breakers (Web Prototype)

A fast, neon, momentum-heavy arcade prototype where movement is your main weapon.

## Features

- **Momentum movement loop**: acceleration + drift + ricochet motion.
- **Expressive controls**:
  - Move: `WASD` / Arrow keys
  - Dash impulse: `Shift`
  - Ground slam: `Space`
  - Redirect flick: Mouse click / `J`
- **Moving arena track** with layered parallax motion.
- **Micro-animations**:
  - Blob idle bounce
  - Squash-and-stretch at speed
  - Speed trails
  - Impact bursts (small exploding balls) on target hits
- **Penalty mechanic**: Stability meter drains on bad collisions / hard wall impacts.
- **Progression + upgrades**:
  - Wave scaling (enemy count + speed)
  - Upgrade points each wave
  - Spend points with:
    - `1` Dash Power
    - `2` Grip (momentum retention)
    - `3` Shield (penalty reduction)
- **Momentum Fever** rewards sustained high speed.

## Run locally

```bash
python3 -m http.server 4173
```

Then open: `http://127.0.0.1:4173`

## Goal

Build speed, slam through targets, maintain combo, survive escalating waves, and invest upgrades to adapt your playstyle.
