# PdG Ghost Racer

**Race strategy simulator for Patrouille des Glaciers 2026 — Zermatt → Verbier**

Patrouille des Glaciers is one of the world's most demanding ski mountaineering races: 57.5 km, 4 386 m of vertical gain, through the high Alps from Zermatt to Verbier. This tool lets teams preview their race before the start — upload a GPX training activity, set your target time, and watch a ghost racer navigate the course with real checkpoint predictions.

---

## Features

- **Ghost racer** — animated dot follows the course on a Mapbox map, driven by a physics-based simulation using your actual zone speeds
- **Checkpoint predictions** — arrival and exit times for all 11 checkpoints, computed from an empirical linear regression model fitted against 201 complete Z2 2022 finishers
- **Cut-off status** — green / amber / red badges show buffer or overage (e.g. `+42m` / `−15m`) for all timed checkpoints
- **GPX upload** — upload up to 5 training activities; the tool extracts your zone speeds (steep climb, moderate climb, flat, descent) via weighted averaging
- **Durability correction** — automatically slows your training-pace speeds to account for the PdG's 12 h duration using a power-law fatigue model calibrated on field data (TSB 4h50m → ~12h15m PdG)
- **Target time mode** — pin the total race time to any value (e.g. `12:00`); the simulator back-calculates the required speed multiplier so checkpoint proportions remain accurate
- **Altitude penalty** — speeds are reduced above 2 500 m and again above 3 200 m to model the oxygen deficit at Tête Blanche (3 648 m)
- **Elevation profile** — D3.js chart with scrubber; drag to move the ghost along the course
- **3D terrain** — one-click toggle loads Mapbox terrain DEM with atmosphere sky layer and tilts the camera to 65°
- **Transition manager** — adjust stop time at each checkpoint (skin swap, food, rope) and see the impact immediately

---

## Architecture

```
┌─────────────────────────────────────────────┐
│  usePdGCalculator (orchestration hook)      │
│    Step 1 — derive reference zone speeds    │
│             from Z2 median section times    │
│             (least-squares, 13×4 system)    │
│    Step 2 — normalize GPX → zone speeds     │
│             + durability correction         │
│    Step 3 — run simulation via Web Worker   │
│                                             │
│  Web Worker (calculator.worker.ts)          │
│    NORMALIZE_PROFILE  →  NormalizedProfile  │
│    SIMULATE           →  SimulationResult   │
│      ├── ghost timeline  (zone-speed model) │
│      └── checkpoint times (OLS regression) │
└─────────────────────────────────────────────┘
```

**Two-track checkpoint model**

The ghost animation and the checkpoint table use separate models intentionally:

| Track | Model | Purpose |
|-------|-------|---------|
| Ghost timeline | Zone-speed terrain simulation | Smooth animation along the GPX track |
| Checkpoint times | OLS linear regression (`section_min = a + b × total_min`) | Accurate inter-checkpoint proportions from real race data |

The regression coefficients were fitted from 201 complete Z2 2022 finishers (no DNF / DSQ). Checkpoints without a dedicated CSV column (Stöckji, Combe du Pas de Chèvres, Col de Riedmatten, Verbier combined) are derived by proportional GPX distance splitting.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (Turbopack), React 19, TypeScript |
| Map | Mapbox GL JS — `outdoors-v12` style + terrain DEM |
| Chart | D3.js — elevation profile with scrubber |
| State | Zustand |
| Styling | Tailwind CSS + custom navy / glacier / alpine design tokens |
| Compute | Web Worker (off-main-thread simulation) |

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/mattia-berardi-linea/pdg-ghost-racer.git
cd pdg-ghost-racer
npm install
```

### 2. Add your Mapbox token

Create `.env.local`:

```
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_token_here
```

Get a free token at [mapbox.com](https://www.mapbox.com/).

### 3. Run

```bash
npm run dev    # dev server at localhost:3000
npm run build  # production build
```

---

## Course Data

All checkpoint distances are GPX-derived from the SchweizMobil golden track (5 591 points, 56.70 km) — not the official race booklet distances, which differ slightly due to route variants.

| Checkpoint | GPX km | Altitude | Cut-off |
|-----------|--------|---------|---------|
| Zermatt | 0.00 | 1 608 m | Start 22:45 |
| Stöckji | 6.15 | 2 028 m | — |
| Schönbiel | 13.97 | 2 694 m | Start +3 h |
| Tête Blanche | 17.50 | 3 648 m | — |
| Arolla | 29.15 | 1 993 m | 06:30 EXIT |
| Combe du Pas de Chèvres | 33.10 | 2 855 m | — |
| Col de Riedmatten | 33.72 | 2 919 m | — |
| Pas du Chat | 36.09 | 2 479 m | — |
| Les Écoulaies (La Barma) | 40.73 | 2 458 m | 10:30 |
| Rosablanche | 43.36 | 3 198 m | 13:00 |
| Col de la Chaux | 47.48 | 2 959 m | — |
| Verbier | 56.70 | 1 472 m | 17:00 |

---

## How It Works

### Speed extraction from GPX

Each uploaded activity is parsed into track points. For each consecutive pair the tool computes haversine distance, smoothed slope grade (9-point box filter to suppress GPS altitude noise), and zone classification:

| Zone | Grade |
|------|-------|
| `steep_climb` | > 15 % |
| `moderate_climb` | 5 – 15 % |
| `flat` | −5 % to +5 % |
| `descent` | < −5 % |

Zone speeds are distance-weighted across all uploaded activities.

### Durability correction

Training speeds overestimate race performance. The correction:

```
factor = min( (T_raw / T_activity)^0.625,  1.8 )
effective_speed = measured_speed / factor
```

`β = 0.625` is calibrated so that a TSB result of 4h50m / 24 km / 2 500 m D+ predicts ~12h15m on the PdG — consistent with Riegel-based field estimates for mountain ultra events (equivalent Riegel exponent α ≈ 1.15).

### Reference calibration

When no GPX is uploaded, zone speeds are derived by solving a 13×4 least-squares system:

```
section_time_i = Σ_z  (distance_z_i / speed_z)
```

where the 13 rows are full-field Z2 median section times and the 4 columns are zone distances within each section.

---

## License

MIT
