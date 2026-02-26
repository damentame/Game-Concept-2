# Bounce Breakers Runner

A simplified auto-runner version of Bounce Breakers.

## What changed

- The ball now moves left-to-right automatically (no left/right controls).
- Normal gravity is applied at all times.
- Fast side-scrolling background layers create a racer-like motion feel.
- Terrain includes rolling ramps so the ball can launch and land.
- Momentum Fever increases bounce intensity and visual intensity.
- Unlockable abilities as distance increases:
  - **Boost** (`Shift`)
  - **Explosion** (`E`)
  - **Split** (`Q`)
- The player can die from impact damage (HP reaches zero) or falling off the track.

## Controls

- Jump: `Space`
- Boost (unlock): `Shift`
- Explosion (unlock): `E`
- Split (unlock): `Q`

## Run

```bash
python3 -m http.server 4173
```

Then open `http://127.0.0.1:4173`.
