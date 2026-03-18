// ---------------------------------------------------------------------------
// Raw GPX
// ---------------------------------------------------------------------------
export interface TrackPoint {
  lat: number;
  lon: number;
  ele: number; // metres
  time?: Date;
}

export interface ParsedActivity {
  fileName: string;
  points: TrackPoint[];
  totalDistanceKm: number;
  totalElevationGainM: number;
  activityDurationMs: number; // moving time derived from timestamps; 0 if no timestamps
}

// ---------------------------------------------------------------------------
// Slope zones
// ---------------------------------------------------------------------------
export type SlopeZone = 'steep_climb' | 'moderate_climb' | 'flat' | 'descent';

// ---------------------------------------------------------------------------
// Performance profile
// ---------------------------------------------------------------------------
export interface NormalizedProfile {
  zoneSpeedMs: Record<SlopeZone, number>; // weighted mean speed per zone (m/s)
  activityCount: number;
  activityDurationMs: number; // distance-weighted average moving time across uploads; 0 if no activities
  zonesWithData: SlopeZone[]; // zones with >50m of measured data
}

// ---------------------------------------------------------------------------
// Course
// ---------------------------------------------------------------------------
export interface CoursePoint {
  lat: number;
  lon: number;
  ele: number;
}

export interface CourseSegment {
  index: number;
  fromPoint: CoursePoint;
  toPoint: CoursePoint;
  distanceM: number;
  gradePercent: number;
  zone: SlopeZone;
  cumulativeDistanceM: number; // cumulative distance at END of this segment
  altitudePenaltyFactor: number; // 1.0 | 0.92 | 0.85
}

// ---------------------------------------------------------------------------
// Checkpoints
// ---------------------------------------------------------------------------
export interface CheckpointDef {
  id: string;
  name: string;
  cumulativeDistanceKm: number;
  altitudeM: number;
  cutoffType: 'relative' | 'absolute' | 'none';
  cutoffOffsetHours?: number; // relative: hours after start
  cutoffAbsoluteTime?: string; // absolute: "HH:MM"
  isExitCutoff: boolean; // true = uses exit time (Arolla), false = arrival time
  defaultTransitionMin: number;
}

// ---------------------------------------------------------------------------
// Simulation
// ---------------------------------------------------------------------------
export interface CheckpointResult {
  checkpoint: CheckpointDef;
  arrivalMs: number;
  arrivalClock: string; // "HH:MM"
  transitionMin: number;
  exitMs: number;
  exitClock: string;
  cutoffMs: number | null;
  cutoffClock: string | null;
  bufferMin: number | null; // null if no cutoff
  status: 'ok' | 'tight' | 'dq' | 'none';
  isDQ: boolean;
}

export interface GhostTimelinePoint {
  cumulativeDistanceM: number;
  elapsedMs: number;
  lat: number;
  lon: number;
  altitudeM: number;
}

export interface SimulationResult {
  startMs: number;
  ghostTimeline: GhostTimelinePoint[];
  checkpointResults: CheckpointResult[];
  totalDurationMs: number;
  finishClock: string;
  totalDistanceM: number;
}

// ---------------------------------------------------------------------------
// Worker protocol
// ---------------------------------------------------------------------------
export interface SimulatePayload {
  profile: NormalizedProfile;
  courseSegments: CourseSegment[];
  checkpoints: CheckpointDef[];
  startTimeStr: string; // "HH:MM"
  intensityFactor: number; // 0.5 – 1.5
  conditionsFactor: number; // 0.7 – 1.3
  transitions: Record<string, number>; // checkpointId → minutes
  activityDurationMs: number; // moving time of the user's uploaded activities; 0 = no uploads
  targetTotalMs?: number; // if set, override total race time; speeds are back-calculated to match
}

export interface NormalizePayload {
  activities: ParsedActivity[];
}

export type WorkerRequest =
  | { id: string; type: 'SIMULATE'; payload: SimulatePayload }
  | { id: string; type: 'NORMALIZE_PROFILE'; payload: NormalizePayload };

export type WorkerResponse =
  | { id: string; type: 'SIMULATION_RESULT'; result: SimulationResult }
  | { id: string; type: 'PROFILE_RESULT'; result: NormalizedProfile }
  | { id: string; type: 'ERROR'; message: string };
