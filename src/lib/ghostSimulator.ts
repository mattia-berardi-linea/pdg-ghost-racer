import type {
  SimulatePayload,
  SimulationResult,
  GhostTimelinePoint,
  CheckpointResult,
  CheckpointDef,
  CourseSegment,
  SlopeZone,
} from '@/types';
import { parseStartTimeMs, resolveAbsoluteTimeMs, formatClock } from './timeUtils';
import { SECTION_REGRESSIONS } from '@/data/sectionRegressions';

const SNAP_THRESHOLD_M = 1000; // within 1km of checkpoint distance → snap
const GHOST_SAMPLE_INTERVAL_M = 200; // emit a ghost point every ~200m

/**
 * Power-law durability correction.
 *
 * When a user uploads a training activity, their measured zone speeds are
 * faster than they'll sustain over 12+ hours.  We scale speeds down by:
 *
 *   durabilityFactor = min( (T_raw / actDurationMs)^β, 1.8 )
 *
 * β = 0.625 is empirically calibrated so that a TSB result of 4h50m
 * (24 km / 2500 m D+) predicts ~12h15m on the PdG course, consistent
 * with Riegel-based field estimates for mountain ultra events.
 *
 * T_raw is estimated from a quick single-pass without the correction.
 * The factor is only applied when the estimated race is longer than the
 * uploaded activity (ratio > 1); no speed-up is ever applied.
 */
const DURABILITY_BETA = 0.625;
const DURABILITY_CAP  = 1.8;

function estimateRawDuration(
  courseSegments: CourseSegment[],
  speedMs: Record<SlopeZone, number>,
  intensityFactor: number,
  conditionsFactor: number,
  transitions: Record<string, number>,
  checkpoints: CheckpointDef[],
): number {
  let elapsedMs = 0;
  const processedIds = new Set<string>();
  const sortedCps = [...checkpoints].sort((a, b) => a.cumulativeDistanceKm - b.cumulativeDistanceKm);

  for (const segment of courseSegments) {
    const baseSpeed = speedMs[segment.zone];
    const effectiveSpeed = Math.max(baseSpeed * segment.altitudePenaltyFactor * intensityFactor * conditionsFactor, 0.1);
    elapsedMs += (segment.distanceM / effectiveSpeed) * 1000;

    for (const cp of sortedCps) {
      if (processedIds.has(cp.id)) continue;
      const cpDistM = cp.cumulativeDistanceKm * 1000;
      if (Math.abs(segment.cumulativeDistanceM - cpDistM) <= SNAP_THRESHOLD_M) {
        const transitionMin = transitions[cp.id] ?? cp.defaultTransitionMin;
        elapsedMs += transitionMin * 60000;
        processedIds.add(cp.id);
      }
    }
  }
  return elapsedMs;
}

const ZONES: SlopeZone[] = ['steep_climb', 'moderate_climb', 'flat', 'descent'];

function computeTransitionMs(checkpoints: CheckpointDef[], transitions: Record<string, number>): number {
  return checkpoints.reduce((sum, cp) => sum + (transitions[cp.id] ?? cp.defaultTransitionMin) * 60000, 0);
}

export function runSimulation(payload: SimulatePayload): SimulationResult {
  const {
    profile,
    courseSegments,
    checkpoints,
    startTimeStr,
    intensityFactor,
    conditionsFactor,
    transitions,
    activityDurationMs,
    targetTotalMs,
  } = payload;

  // Apply durability factor when the estimated race is longer than the uploaded activity
  let effectiveZoneSpeeds = profile.zoneSpeedMs;
  if (activityDurationMs > 0) {
    const T_raw = estimateRawDuration(courseSegments, profile.zoneSpeedMs, intensityFactor, conditionsFactor, transitions, checkpoints);
    const ratio = T_raw / activityDurationMs;
    if (ratio > 1) {
      const factor = Math.min(Math.pow(ratio, DURABILITY_BETA), DURABILITY_CAP);
      effectiveZoneSpeeds = {} as Record<SlopeZone, number>;
      for (const z of ZONES) {
        effectiveZoneSpeeds[z] = profile.zoneSpeedMs[z] / factor;
      }
    }
  }

  // Apply target total time override: back-calculate a global speed multiplier so the
  // simulation produces exactly targetTotalMs. Intensity + conditions are baked in.
  let finalIntensityFactor = intensityFactor;
  let finalConditionsFactor = conditionsFactor;
  if (targetTotalMs != null && targetTotalMs > 0) {
    const transitionMs = computeTransitionMs(checkpoints, transitions);
    const firstPassTotal = estimateRawDuration(courseSegments, effectiveZoneSpeeds, intensityFactor, conditionsFactor, transitions, checkpoints);
    const firstPassMovingMs = Math.max(firstPassTotal - transitionMs, 1);
    const targetMovingMs = Math.max(targetTotalMs - transitionMs, 1);
    const adjustment = firstPassMovingMs / targetMovingMs;
    // Bake intensity + conditions + adjustment into zone speeds so the main loop uses factor=1
    const adjusted = {} as Record<SlopeZone, number>;
    for (const z of ZONES) {
      adjusted[z] = effectiveZoneSpeeds[z] * intensityFactor * conditionsFactor * adjustment;
    }
    effectiveZoneSpeeds = adjusted;
    finalIntensityFactor = 1.0;
    finalConditionsFactor = 1.0;
  }

  const startMs = parseStartTimeMs(startTimeStr);
  let elapsedMs = 0;
  let lastGhostSampleDistM = 0;

  const ghostTimeline: GhostTimelinePoint[] = [];

  // Sort checkpoints by distance
  const sortedCheckpoints = [...checkpoints].sort(
    (a, b) => a.cumulativeDistanceKm - b.cumulativeDistanceKm
  );

  // Emit start point
  if (courseSegments.length > 0) {
    ghostTimeline.push({
      cumulativeDistanceM: 0,
      elapsedMs: 0,
      lat: courseSegments[0].fromPoint.lat,
      lon: courseSegments[0].fromPoint.lon,
      altitudeM: courseSegments[0].fromPoint.ele,
    });
  }

  for (const segment of courseSegments) {
    const baseSpeed = effectiveZoneSpeeds[segment.zone];
    const effectiveSpeed =
      baseSpeed * segment.altitudePenaltyFactor * finalIntensityFactor * finalConditionsFactor;

    const safeSpeed = Math.max(effectiveSpeed, 0.1);
    elapsedMs += (segment.distanceM / safeSpeed) * 1000;

    if (segment.cumulativeDistanceM - lastGhostSampleDistM >= GHOST_SAMPLE_INTERVAL_M) {
      ghostTimeline.push({
        cumulativeDistanceM: segment.cumulativeDistanceM,
        elapsedMs,
        lat: segment.toPoint.lat,
        lon: segment.toPoint.lon,
        altitudeM: segment.toPoint.ele,
      });
      lastGhostSampleDistM = segment.cumulativeDistanceM;
    }
  }

  const totalDistM =
    courseSegments.length > 0
      ? courseSegments[courseSegments.length - 1].cumulativeDistanceM
      : 0;

  // Derive checkpoint arrival times from the empirical section regression model.
  // The regression was trained on actual race times (including transitions), so we
  // must pass total time (moving + transitions) — not just moving time — otherwise
  // all checkpoint predictions are systematically too early by ~35 min (default transitions).
  const totalTransitionMs = computeTransitionMs(checkpoints, transitions);
  const checkpointResults = buildRegressionCheckpointResults(
    (elapsedMs + totalTransitionMs) / 60000,
    sortedCheckpoints,
    startMs,
    transitions,
  );

  return {
    startMs,
    ghostTimeline,
    checkpointResults,
    totalDurationMs: elapsedMs + totalTransitionMs,
    finishClock: formatClock(startMs + elapsedMs + totalTransitionMs),
    totalDistanceM: totalDistM,
  };
}

/**
 * Compute checkpoint arrival times using the empirical linear regression model
 * (section_time = intercept + slope × totalMin) rather than zone-speed
 * terrain accumulation.  This produces accurate inter-checkpoint proportions
 * across the full range of finishing times.
 */
function buildRegressionCheckpointResults(
  totalMin: number,
  checkpoints: CheckpointDef[],
  startMs: number,
  transitions: Record<string, number>,
): CheckpointResult[] {
  const results: CheckpointResult[] = [];
  let cumulativeMin = 0;

  for (const cp of checkpoints) {
    if (cp.id === 'zermatt') continue; // start — no result needed

    const reg = SECTION_REGRESSIONS[cp.id];
    if (!reg) continue; // unknown checkpoint — skip

    // Clamp to at least 1 min so section time is always positive
    const sectionMin = Math.max(1, reg.intercept + reg.slope * totalMin);
    cumulativeMin += sectionMin;

    results.push(buildCheckpointResult(cp, startMs, cumulativeMin * 60000, transitions));
  }

  return results;
}

function buildCheckpointResult(
  cp: CheckpointDef,
  startMs: number,
  elapsedMs: number,
  transitions: Record<string, number>
): CheckpointResult {
  const arrivalMs = startMs + elapsedMs;
  const transitionMin = transitions[cp.id] ?? cp.defaultTransitionMin;
  const exitMs = arrivalMs + transitionMin * 60000;

  let cutoffMs: number | null = null;
  let cutoffClock: string | null = null;

  if (cp.cutoffType === 'relative' && cp.cutoffOffsetHours != null) {
    cutoffMs = startMs + cp.cutoffOffsetHours * 3600000;
    cutoffClock = formatClock(cutoffMs);
  } else if (cp.cutoffType === 'absolute' && cp.cutoffAbsoluteTime) {
    cutoffMs = resolveAbsoluteTimeMs(cp.cutoffAbsoluteTime, startMs);
    cutoffClock = formatClock(cutoffMs);
  }

  // For Arolla (isExitCutoff), use exit time; for others, use arrival time
  const timeToCheck = cp.isExitCutoff ? exitMs : arrivalMs;
  const isDQ = cutoffMs !== null && timeToCheck > cutoffMs;

  let bufferMin: number | null = null;
  if (cutoffMs !== null) {
    bufferMin = (cutoffMs - timeToCheck) / 60000;
  }

  let status: CheckpointResult['status'] = 'none';
  if (cutoffMs !== null) {
    if (isDQ) {
      status = 'dq';
    } else if (bufferMin !== null && bufferMin < 30) {
      status = 'tight';
    } else {
      status = 'ok';
    }
  }

  return {
    checkpoint: cp,
    arrivalMs,
    arrivalClock: formatClock(arrivalMs),
    transitionMin,
    exitMs,
    exitClock: formatClock(exitMs),
    cutoffMs,
    cutoffClock,
    bufferMin,
    status,
    isDQ,
  };
}
