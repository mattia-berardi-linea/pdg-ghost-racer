# PDG Ghost Racer — Integration Guide

This document is intended for the PDG organization's technical team. It explains how to take ownership of this application, configure it for your infrastructure, and customize it for future race editions.

---

## Table of Contents

1. [Quick Start](#1-quick-start)
2. [Mapbox Token](#2-mapbox-token)
3. [Race Configuration](#3-race-configuration)
4. [Course GPX Track](#4-course-gpx-track)
5. [Checkpoint Regression Update (Future Races)](#5-checkpoint-regression-update-future-races)
6. [Branding](#6-branding)
7. [Deployment on Vercel](#7-deployment-on-vercel)
8. [Architecture Overview](#8-architecture-overview)
9. [Key Files Reference](#9-key-files-reference)

---

## 1. Quick Start

```bash
git clone <your-fork-url>
cd pdg-ghost-racer
npm install
# Configure .env.local (see §2)
npm run dev   # → http://localhost:3000
```

Node.js 18+ required. No database, no backend — the app is fully client-side.

---

## 2. Mapbox Token

The interactive 3D map requires a [Mapbox](https://mapbox.com) access token. The free tier is sufficient for moderate traffic.

**Steps:**
1. Create an account at [mapbox.com](https://mapbox.com)
2. Go to your Account → Tokens → Create a new token (default scopes are fine)
3. Create a file called `.env.local` in the project root:

```
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_actual_token_here
```

> **Note:** This token is exposed in the client bundle (required by Mapbox GL JS). Restrict it to your domain in the Mapbox dashboard: Account → Tokens → URL Restrictions → add `https://your-domain.com`.

The app renders a clear error message if the token is missing or invalid, so there is no risk of a silent failure.

---

## 3. Race Configuration

All race parameters live in a **single file**: `src/lib/constants.ts`.

### Start time

```typescript
// src/lib/constants.ts
export const DEFAULT_START_TIME = '22:45';
```

Change to the official 2028/2030 start time. The app accepts any `HH:MM` string.

### Race date

```typescript
export const RACE_DATE_2026 = '2026-05-01'; // → update to confirmed date
```

This is currently a placeholder. The exact value is not user-visible but is used in date calculations.

### Checkpoints & cut-off times

Each checkpoint is defined as an object:

```typescript
{
  id: 'arolla',
  name: 'Arolla',
  cumulativeDistanceKm: 29.15,   // GPX-derived (see §4)
  altitudeM: 1993,
  cutoffType: 'absolute',        // 'absolute' | 'relative' | 'none'
  cutoffAbsoluteTime: '06:30',   // HH:MM clock time
  isExitCutoff: true,            // true = exit time; false = arrival time
  defaultTransitionMin: 10,      // pre-filled pit stop time
},
```

**Cut-off types:**
| `cutoffType` | Usage | Fields needed |
|---|---|---|
| `'absolute'` | Fixed clock time (e.g. "06:30") | `cutoffAbsoluteTime: 'HH:MM'` |
| `'relative'` | Hours after start (e.g. Schönbiel +3h) | `cutoffOffsetHours: number` |
| `'none'` | No cut-off at this point | — |

**To update cut-offs for a new edition:** simply change `cutoffAbsoluteTime` or `cutoffOffsetHours` in the relevant checkpoint objects.

### Buffer warning thresholds

```typescript
export const BUFFER_TIGHT_MIN = 30;    // < 30 min → amber warning
export const BUFFER_CRITICAL_MIN = 15; // < 15 min → red warning
```

---

## 4. Course GPX Track

The golden track GPX lives at `public/gpx/pdg-golden-track.gpx`.

This file is used for **two purposes:**
1. Drawing the course line on the map
2. Computing segment distances and slopes that drive the simulation

**To replace the GPX for a different edition or a more accurate track:**

1. Export the new GPX from SchweizMobil / Swisstopo / official source
2. Overwrite `public/gpx/pdg-golden-track.gpx`
3. Update all `cumulativeDistanceKm` values in `src/lib/constants.ts` to match the new GPX distances (measure each checkpoint against the new track)
4. Update `COURSE_BOUNDS` at the bottom of `constants.ts` if the start/end points shifted significantly

> **Why GPX distances differ from official race distances:** The official booklet uses road-book km; the GPX approximates the ski route which doesn't follow the same reference. This is intentional — the simulation uses GPX distances for consistency.

---

## 5. Checkpoint Regression Update (Future Races)

Checkpoint arrival predictions use a **linear regression** trained on 201 Z2 2022 finishers:

```
section_time_min = intercept + slope × total_race_time_min
```

The coefficients live in `src/data/sectionRegressions.ts`.

**To re-train for a new race year (e.g. 2026 results):**

1. Obtain the official results CSV with per-checkpoint times for all finishers
2. For each section, run an OLS regression: response = section elapsed time (min), predictor = total race time (min)
3. Update the `intercept` and `slope` values in `sectionRegressions.ts`
4. For checkpoints without a dedicated CSV column (Stöckji, Combe du Pas de Chèvres, Col de Riedmatten), use a proportional split based on GPX distance — the existing code comments explain the split percentages used

The source data (Z2 2022 medians per section) is in `src/data/referenceRace.ts` for reference.

---

## 6. Branding

| Asset | Location | Notes |
|---|---|---|
| PDG logo (top-right header) | `public/pdg-logo.png` | Replace with official logo at same filename |
| Favicon | `public/favicon.ico` | Standard 32×32 ICO |
| App title (browser tab) | `src/app/layout.tsx` | `metadata.title` and `metadata.description` |
| Header text | `src/components/RaceApp.tsx` line ~70 | "PDG Race Simulator" + "Zermatt → Verbier 2026" |
| Colour palette | `src/app/globals.css` | CSS variables: `--glacier-*`, `--alpine-*`, `--navy-*` |

---

## 7. Deployment on Vercel

The app is pre-configured for Vercel. Zero-config deployment:

1. Fork or transfer the repository to your GitHub organization
2. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
3. Add the environment variable: `NEXT_PUBLIC_MAPBOX_TOKEN` = your production Mapbox token
4. Deploy — Vercel auto-detects Next.js and uses the correct build settings

**Environment variables required:**

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Yes | Mapbox public token (`pk.xxx`) |

No other environment variables are needed. The Swiss topo overlay (swisstopo WMTS) is a free public API that requires no key.

---

## 8. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  Browser                                                 │
│  ┌──────────────┐   ┌──────────────┐  ┌──────────────┐  │
│  │  RaceApp.tsx │   │  Zustand     │  │  Web Worker  │  │
│  │  (layout,    │──▶│  raceStore   │◀─│  calculator  │  │
│  │   routing)   │   │  (state)     │  │  .worker.ts  │  │
│  └──────────────┘   └──────────────┘  └──────────────┘  │
│         │                  │                  │           │
│  ┌──────┴──────┐    ┌──────┴──────┐   ┌──────┴──────┐   │
│  │  RaceMap    │    │  Checkpoint │   │  Ghost      │   │
│  │  (Mapbox)   │    │  Table      │   │  Simulator  │   │
│  └─────────────┘    └─────────────┘   └─────────────┘   │
│                     ┌─────────────┐                      │
│                     │  Elevation  │                      │
│                     │  Profile    │                      │
│                     │  (D3.js)    │                      │
│                     └─────────────┘                      │
└─────────────────────────────────────────────────────────┘
         │
   Static assets
   public/gpx/pdg-golden-track.gpx
   public/pdg-logo.png
```

**Data flow on load:**
1. `RaceApp` fetches the Golden Track GPX → parses it → splits into ~5500 course segments
2. Reference zone speeds are derived from Z2 median section times (`referenceRace.ts`)
3. A default 12h simulation runs immediately (no GPX upload needed)

**Data flow on GPX upload:**
1. User drops a `.gpx` training file → `useGpxParser` parses it in the main thread
2. `usePdGCalculator` sends it to the Web Worker for zone speed normalization
3. Worker returns a `NormalizedProfile` → triggers a new simulation
4. Simulation result updates the store → all UI components re-render

**Two-track simulation:**
| Track | Model | Used for |
|---|---|---|
| Ghost timeline | Zone-speed × altitude penalty × durability | Map animation |
| Checkpoint times | OLS regression on total race time | Checkpoint table |

---

## 9. Key Files Reference

| File | Purpose |
|---|---|
| `src/lib/constants.ts` | **All race config** — checkpoints, cut-offs, start time, thresholds |
| `src/data/sectionRegressions.ts` | OLS regression coefficients per section |
| `src/data/referenceRace.ts` | Z2 2022 median section times (source for reference speeds) |
| `src/lib/ghostSimulator.ts` | Core simulation engine — durability model, altitude penalty |
| `src/lib/referenceCalibrator.ts` | Derives zone speeds from section regression data |
| `src/store/raceStore.ts` | Zustand store — single source of truth for all app state |
| `src/workers/calculator.worker.ts` | Off-thread: simulation + GPX normalization |
| `src/hooks/usePdGCalculator.ts` | Orchestrates the 3-step pipeline (reference → profile → simulate) |
| `src/components/RaceApp.tsx` | Root layout component |
| `src/components/map/RaceMap.tsx` | Mapbox map (3D terrain, swisstopo toggle, ghost marker) |
| `src/components/elevation/ElevationProfile.tsx` | D3 elevation chart with drag scrubber |
| `src/components/table/CheckpointTable.tsx` | Checkpoint table with cut-off status |
| `src/components/panels/ParametersPanel.tsx` | Right-side controls (GPX upload, sliders, pit stops) |
| `public/gpx/pdg-golden-track.gpx` | Course track (5 591 points, 56.70 km) |

---

*© 2026 [Linea Advisory](https://linea-advisory.com) · Built by Mattia Berardi · [mattia.berardi87@gmail.com](mailto:mattia.berardi87@gmail.com) · MIT License*
