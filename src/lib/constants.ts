import type { CheckpointDef } from '@/types';

// ---------------------------------------------------------------------------
// Altitude penalty brackets
// ---------------------------------------------------------------------------
export const ALTITUDE_PENALTY_BRACKETS = [
  { maxAlt: 2500, factor: 1.0 },
  { maxAlt: 3200, factor: 0.92 },
  { maxAlt: Infinity, factor: 0.85 },
] as const;

// ---------------------------------------------------------------------------
// Slope zone grade thresholds (%)
// ---------------------------------------------------------------------------
export const SLOPE_THRESHOLDS = {
  steepClimbMin: 15, // grade% >= this → steep_climb
  moderateClimbMin: 5, // grade% >= this (< steep) → moderate_climb
  flatMax: 5, // grade% < this and > flatMin → flat
  flatMin: -5, // grade% > this → flat (else descent)
} as const;

// ---------------------------------------------------------------------------
// Official PdG 2026 checkpoints – Zermatt → Verbier
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// NOTE on distances: all cumulativeDistanceKm values are derived from the
// PDG Golden Track GPX (public/gpx/pdg-golden-track.gpx, 56.70 km total).
// They differ from official race distances because the GPX approximates the
// actual race route.  Elevations are also taken from the GPX at the matched
// track point, except Zermatt (official) and La Barma / Rosablanche where
// the GPX value is noted.
// ---------------------------------------------------------------------------
export const CHECKPOINTS: CheckpointDef[] = [
  {
    id: 'zermatt',
    name: 'Zermatt',
    cumulativeDistanceKm: 0,
    altitudeM: 1608,
    cutoffType: 'none',
    isExitCutoff: false,
    defaultTransitionMin: 0,
  },
  {
    id: 'stockji',
    name: 'Stöckji',
    cumulativeDistanceKm: 6.15,   // GPX: 5 m from ref coords (official 6.5 km)
    altitudeM: 2028,              // GPX elevation (official route hits ~2600 m)
    cutoffType: 'none',
    isExitCutoff: false,
    defaultTransitionMin: 5, // rope up
  },
  {
    id: 'schonbiel',
    name: 'Schönbiel',
    cumulativeDistanceKm: 13.97,  // GPX (official 12 km)
    altitudeM: 2694,
    cutoffType: 'relative',
    cutoffOffsetHours: 3,
    isExitCutoff: false,
    defaultTransitionMin: 0,
  },
  {
    id: 'tete_blanche',
    name: 'Tête Blanche',
    cumulativeDistanceKm: 17.50,  // GPX: 25 m from ref coords (official 22 km)
    altitudeM: 3648,
    cutoffType: 'none',
    isExitCutoff: false,
    defaultTransitionMin: 5, // skins off
  },
  {
    id: 'arolla',
    name: 'Arolla',
    cumulativeDistanceKm: 29.15,  // GPX: 295 m from ref coords (official 34 km)
    altitudeM: 1993,
    cutoffType: 'absolute',
    cutoffAbsoluteTime: '06:30',
    isExitCutoff: true, // ← EXIT time counts, not arrival
    defaultTransitionMin: 10,
  },
  {
    id: 'combe_chevres',
    name: 'Combe du pas de Chèvres',
    cumulativeDistanceKm: 33.10,  // GPX ~33.1 km; on ascent from Arolla to Riedmatten (official 33.1 km)
    altitudeM: 2750,              // approx — 86% of climb from Arolla (1993 m) to Riedmatten (2919 m)
    cutoffType: 'absolute',
    cutoffAbsoluteTime: '08:15',
    isExitCutoff: false,
    defaultTransitionMin: 0,
  },
  {
    id: 'col_riedmatten',
    name: 'Col de Riedmatten',
    cumulativeDistanceKm: 33.72,  // GPX: 2 m from ref coords (official 38.5 km)
    altitudeM: 2919,
    cutoffType: 'none',
    isExitCutoff: false,
    defaultTransitionMin: 5, // skins off
  },
  {
    id: 'pas_du_chat',
    name: 'Pas du Chat',
    cumulativeDistanceKm: 36.09,  // GPX: 36.087 km matched at 2480 m (descent from Riedmatten)
    altitudeM: 2479,
    cutoffType: 'none',
    isExitCutoff: false,
    defaultTransitionMin: 0,
  },
  {
    id: 'ecoulaies',
    name: 'Les Ecoulaies',
    cumulativeDistanceKm: 41.05,  // GPX: slightly further than La Barma (40.73 km); 2547 m on ascent to Rosablanche
    altitudeM: 2547,
    cutoffType: 'absolute',
    cutoffAbsoluteTime: '10:45',
    isExitCutoff: false,
    defaultTransitionMin: 5,
  },
  {
    id: 'rosablanche',
    name: 'Rosablanche',
    cumulativeDistanceKm: 43.36,  // GPX peak 3198 m (official 49 km / 3336 m summit)
    altitudeM: 3198,              // GPX elevation at checkpoint path (not true summit)
    cutoffType: 'absolute',
    cutoffAbsoluteTime: '13:00',
    isExitCutoff: false,
    defaultTransitionMin: 5,
  },
  {
    id: 'col_chaux',
    name: 'Col de la Chaux',
    cumulativeDistanceKm: 47.48,  // GPX: 3 m from ref coords (official 52 km)
    altitudeM: 2959,
    cutoffType: 'none',
    isExitCutoff: false,
    defaultTransitionMin: 0,
  },
  {
    id: 'verbier',
    name: 'Verbier',
    cumulativeDistanceKm: 56.70,  // GPX end point (official 57.5 km)
    altitudeM: 1472,
    cutoffType: 'absolute',
    cutoffAbsoluteTime: '17:00',
    isExitCutoff: false,
    defaultTransitionMin: 0,
  },
];

// Approximate course bounds for initial map fit [SW, NE]
export const COURSE_BOUNDS: [[number, number], [number, number]] = [
  [7.221, 45.980],
  [7.748, 46.113],
];

export const DEFAULT_START_TIME = '22:45';
export const RACE_DATE_2026 = '2026-05-01'; // approximate, to be confirmed

// Buffer thresholds for status coloring
export const BUFFER_TIGHT_MIN = 30; // < 30min → tight (amber)
export const BUFFER_CRITICAL_MIN = 15; // < 15min → red
