# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Start

```bash
npm install                          # Install dependencies
npm run dev                          # Start dev server → http://localhost:3000
npm run build                        # Production build
npm run start                        # Run production server
```

**Requirements:** Node.js 18+, Mapbox token in `.env.local` (see Configuration)

## Project Overview

**PdG Ghost Racer** is a race strategy simulator for Patrouille des Glaciers 2026, a 57.5 km ski mountaineering race from Zermatt to Verbier. The tool lets teams upload training GPX files, set a target finish time, and visualize checkpoint predictions with cut-off status via an animated "ghost racer" on an interactive 3D map.

This is a **fully client-side application** with no backend or database.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (React 19, TypeScript 5) with Turbopack |
| **State** | Zustand (minimal, focused store) |
| **Map** | Mapbox GL JS v3.20 with DEM terrain, swisstopo WMTS overlay |
| **Chart** | D3.js v7 (elevation profile with interactive scrubber) |
| **Styling** | Tailwind CSS v4 with custom design tokens (navy, glacier, alpine) |
| **Compute** | Web Worker (off-main-thread simulation + GPX normalization) |

## Architecture Overview

### Data Flow

```
User Input (GPX, sliders, checkpoints)
        ↓
    Zustand Store (raceStore.ts)
        ↓
    usePdGCalculator Hook (orchestrates 3-phase pipeline)
        ├─ Phase 1: Load golden track GPX → derive reference zone speeds
        ├─ Phase 2: Parse user GPX → normalize speeds per slope zone via Worker
        └─ Phase 3: Run simulation with all inputs → emit ghost timeline + checkpoint times
        ↓
    Worker Bridge (calculator.worker.ts)
        ├─ ghostSimulator: produces ghost timeline (200m samples) + checkpoint results
        └─ profileNormalizer: extracts weighted zone speeds from activities
        ↓
    UI Components
        ├─ RaceMap: Mapbox (animates ghost marker via scrubberDistanceM)
        ├─ ElevationProfile: D3 chart (drag scrubber ↔ sync map + store)
        └─ CheckpointTable: results with cut-off status badges
```

### Key Abstractions

**1. Slope Zones** (`src/lib/slopeZones.ts`, `src/types/index.ts`)
- Four terrain classifications based on smoothed grade %:
  - `steep_climb` (≥15%) — high altitude sections
  - `moderate_climb` (5–15%) — most ascents
  - `flat` (−5 to +5%) — valley sections
  - `descent` (<−5%) — downhill sections
- Each zone has a measured or reference speed (m/s)
- Altitude penalty applied in brackets: 1.0 (≤2500m), 0.92 (2500–3200m), 0.85 (>3200m)

**2. Simulation Engine** (`src/lib/ghostSimulator.ts`)
- **Durability Correction** — power-law model (β=0.625) converts training speeds to ultra-endurance speeds
  - Prevents overestimation when activity duration < race duration
  - Calibrated so TSB 4h50m → ~12h15m on PdG course
- **Ghost Timeline** — accumulates time segment-by-segment with durability + altitude + intensity/conditions factors
- **Checkpoint Timing** — uses OLS regression on Z2 2022 finisher data (201 athletes)
  - Direct linear model per section ensures accurate inter-checkpoint proportions
  - Regressions live in `src/data/sectionRegressions.ts`

**3. Profile Normalization** (`src/lib/profileNormalizer.ts`)
- Extracts weighted-average speed per zone from uploaded GPX activities
- Requires timestamps for speed calculation; falls back to heuristic (Swiss perf km formula) if missing
- Filters unrealistic speeds (>36 km/h), pauses (>1h gaps), and short segments (<0.5m)
- Returns `NormalizedProfile` with zones-with-data flag to patch missing zones with reference speeds

**4. Reference Calibration** (`src/lib/referenceCalibrator.ts`)
- Derives initial zone speeds from Z2 2022 median section times (`src/data/referenceRace.ts`)
- Maps median elapsed times → average speeds per zone using GPX distances
- Produces a baseline profile that works even without user GPX upload
- Default scaling (1.355×) produces ~12h total when no activities uploaded

**5. Store** (`src/store/raceStore.ts`)
- Single source of truth: parsed activities, normalized profile, course segments, simulation results
- UI components subscribe to specific slices (no prop drilling)
- Actions: `addActivity`, `setIntensity`, `setTransition`, `setScrubberDistance`, etc.

### File Organization

```
src/
  app/
    page.tsx              ← Root (just imports RaceApp)
    layout.tsx            ← Metadata, fonts, dark mode setup
    globals.css           ← CSS variables (--glacier-*, --alpine-*, --navy-*)
  
  components/
    RaceApp.tsx           ← Main layout: header + 3-column grid
    map/
      RaceMap.tsx         ← Mapbox with terrain, swisstopo, ghost marker, camera
    elevation/
      ElevationProfile.tsx ← D3 elevation chart with scrubber
    table/
      CheckpointTable.tsx ← Checkpoint times, cut-off badges, buffer status
      CheckpointRow.tsx   ← Single row component
    panels/
      ParametersPanel.tsx ← Right sidebar: GPX upload, sliders, pit stop editor
      GpxDropzone.tsx     ← File drag-drop, max 5 activities
      IntensitySlider.tsx ← ±50% speed adjustment
      ConditionsToggle.tsx ← −30% | 0 | +30% weather factor
      TransitionsManager.tsx ← Pit stop duration per checkpoint
      StartTimeSelector.tsx ← Race start time picker

  hooks/
    usePdGCalculator.ts   ← Orchestrates 3-phase pipeline (reference → profile → simulate)
    useGpxParser.ts       ← GPX file parsing wrapper
    useMapSync.ts         ← Syncs store scrubber ↔ map camera

  lib/
    constants.ts          ← **SINGLE SOURCE** for all race config
                             (checkpoints, cut-offs, slope thresholds, start time)
    ghostSimulator.ts     ← Simulation engine: durability, altitude, checkpoint timing
    referenceCalibrator.ts ← Derives initial zone speeds from Z2 data
    profileNormalizer.ts  ← Extracts speeds from GPX activities
    courseSegmenter.ts    ← Parses GPX → segments with slope zones & penalty factors
    gpxParser.ts          ← Raw XML → TrackPoint[] (lat/lon/ele/time)
    slopeZones.ts         ← Zone classification, haversine distance, grade calc
    altitudePenalty.ts    ← Speed penalty brackets
    timeUtils.ts          ← Clock time ↔ ms conversions, formatting
    
  data/
    referenceRace.ts      ← Z2 2022 median section times (201 finishers)
    sectionRegressions.ts ← OLS regression coefficients per checkpoint

  store/
    raceStore.ts          ← Zustand state, all app state in one place

  types/
    index.ts              ← TypeScript interfaces (TrackPoint, NormalizedProfile,
                             SimulationResult, CheckpointResult, etc.)

  workers/
    calculator.worker.ts  ← Web Worker: simulation + profile normalization
    workerBridge.ts       ← Worker lifecycle, message routing, promise wrappers

public/
  gpx/
    pdg-golden-track.gpx  ← Course track (56.70 km, 5,591 points)
  pdg-logo.png           ← Header logo
```

## Configuration & Customization

All race parameters live in a **single file**: `src/lib/constants.ts`

### Essential Configuration

**Checkpoints** — Each entry defines distance, altitude, cut-off type, and pit stop default:
```typescript
{
  id: 'arolla',
  name: 'Arolla',
  cumulativeDistanceKm: 29.15,     // GPX-derived
  altitudeM: 1993,
  cutoffType: 'absolute',          // 'absolute' | 'relative' | 'none'
  cutoffAbsoluteTime: '06:30',     // HH:MM for absolute, ignored for relative
  isExitCutoff: true,              // true = exit time (Arolla), false = arrival
  defaultTransitionMin: 10,        // Pre-filled pit stop minutes
}
```

**Start Time & Dates**
```typescript
export const DEFAULT_START_TIME = '22:45';
export const RACE_DATE_2026 = '2026-05-01';
export const SUNRISE_CLOCK = '06:24';
```

**Slope Thresholds** — Control zone classification
```typescript
export const SLOPE_THRESHOLDS = {
  steepClimbMin: 15,   // grade% >= 15 → steep_climb
  moderateClimbMin: 5, // 5–15 → moderate_climb
  flatMax: 5,          // −5 to +5 → flat
  flatMin: -5,
};
```

**Altitude Penalty** — Speed reduction above thresholds
```typescript
export const ALTITUDE_PENALTY_BRACKETS = [
  { maxAlt: 2500, factor: 1.0 },
  { maxAlt: 3200, factor: 0.92 },
  { maxAlt: Infinity, factor: 0.85 },
];
```

**Buffer Warning Thresholds**
```typescript
export const BUFFER_TIGHT_MIN = 30;    // < 30 min → amber
export const BUFFER_CRITICAL_MIN = 15; // < 15 min → red
```

### Updating for Future Races

**New GPX track:**
1. Replace `public/gpx/pdg-golden-track.gpx`
2. Measure each checkpoint's cumulative distance on the new GPX
3. Update `cumulativeDistanceKm` values in `CHECKPOINTS`
4. Recalculate `COURSE_BOUNDS` if start/end shifted

**New cut-off times:**
- Edit `cutoffAbsoluteTime` or `cutoffOffsetHours` in `CHECKPOINTS`

**Recalibrate checkpoint regressions** (after new race results):
1. Get official CSV with per-checkpoint elapsed times for all finishers
2. Fit OLS: `section_time_min = intercept + slope × total_race_time_min`
3. Update `src/data/sectionRegressions.ts` with new coefficients

## Environment Setup

Create `.env.local` in the project root:
```
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_actual_token_here
```

- Free tier is sufficient; get token at [mapbox.com](https://mapbox.com)
- Restrict to your domain in Mapbox dashboard for security
- The app shows a clear error if missing or invalid

## Key Implementation Patterns

### Web Worker Usage
- Off-main-thread simulation and GPX normalization prevent UI blocking
- `workerBridge.ts` wraps the worker with Promise-based message routing
- Each message has a unique ID; responses are correlated by ID
- Two request types: `SIMULATE` and `NORMALIZE_PROFILE`

### Durability Correction Logic
```
T_raw = time without correction
ratio = T_raw / activity_duration_ms
if ratio > 1:
  factor = min(ratio^0.625, 1.8)
  effective_speed = measured_speed / factor
```
- Only applied when estimated race > activity duration
- Exponent 0.625 empirically calibrated to Riegel formula
- Cap of 1.8 prevents extreme slowdowns (pathological activities)

### Scrubber Sync Pattern
- `ElevationProfile` renders D3 chart with mouse event handlers
- On drag: calls `setScrubberDistance(distM)` → updates store
- `RaceMap` watches `scrubberDistanceM` → animates ghost marker via `mapboxgl.LngLatAltitude`
- No prop drilling; both components read/write the same store slice

### Zone Speed Extraction
- Samples are weighted by distance (longer samples count more)
- Filters: speed > 10 m/s (unrealistic), gap > 1h (pauses), segment < 0.5m (noise)
- Fallback: Swiss performance km heuristic (1 perf km = 1km + 100m vert) if no timestamps

## Testing & Debugging

**Quick debug:**
- Open DevTools Console for worker messages and errors
- Check `simulationStatus` in store (idle | running | done | error)
- Verify `.env.local` Mapbox token with a fetch test in console:
  ```javascript
  fetch('https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/0/0/0.json?access_token=pk.XXX')
  ```

**Simulation correctness:**
- Reference speeds derived from Z2 2022 medians should produce ~12–13h with default profile
- Durability factor should be 1.0–1.5 for typical mountain races (4–8 hour activities)
- Ghost timeline points should hit checkpoints near the regression predictions (±5–10 min acceptable)

## Important Files to Know

| File | Purpose |
|------|---------|
| `src/lib/constants.ts` | **All race config** — checkpoints, cut-offs, start time |
| `src/lib/ghostSimulator.ts` | Core simulation: durability, altitude, checkpoint timing |
| `src/lib/referenceCalibrator.ts` | Z2 median times → reference zone speeds |
| `src/store/raceStore.ts` | Zustand store; single source of truth |
| `src/data/sectionRegressions.ts` | OLS regression per checkpoint section |
| `src/data/referenceRace.ts` | Z2 2022 finisher median times (source data) |
| `src/hooks/usePdGCalculator.ts` | Orchestrates reference → profile → simulate pipeline |
| `src/workers/calculator.worker.ts` | Off-thread: simulation + GPX normalization |
| `INTEGRATION.md` | Deployment, infrastructure, regression update guide |

## See Also

- **README.md** — User-facing feature overview and live demo link
- **INTEGRATION.md** — Detailed deployment, branding, and future-race customization guide

---

*PDG Ghost Racer © 2026 Linea Advisory · MIT License*
