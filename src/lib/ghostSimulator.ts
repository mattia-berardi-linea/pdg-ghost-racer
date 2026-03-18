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

const SNAP_THRESHOLD_M = 1000; // within 1km of checkpoint distance → snap
const GHOST_SAMPLE_INTERVAL_M = 200; // emit a ghost point every ~200m

/**
 * Power-law durability correction.
 *
 * When a user uploads a short training activity, their measured zone speeds
 * are faster than they'll manage over 12+ hours.  We scale speeds down by:
 *
 *   durabilityFactor = min( (T_raw / actDurationMs)^β, 1.4 )
 *
 * where β = α / (1 - α) = 0.11 / 0.89 ≈ 0.1236  (Riegel exponent α = 0.11).
 *
 * T_raw is estimated from a quick single-pass without the correction.
 * The factor is only applied when activities were uploaded (actDurationMs > 0)
 * and the activity is shorter than 2 h (if it's already race-length, no correction).
 */
const DURABILITY_BETA = 0.1236;
const DURABILITY_CAP  = 1.4;
const TWO_HOURS_MS    = 2 * 3600 * 1000;

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
  } = payload;

  // Apply durability factor when uploaded activities are shorter than 2h
  let effectiveZoneSpeeds = profile.zoneSpeedMs;
  if (activityDurationMs > 0 && activityDurationMs < TWO_HOURS_MS) {
    const T_raw = estimateRawDuration(courseSegments, profile.zoneSpeedMs, intensityFactor, conditionsFactor, transitions, checkpoints);
    const ratio = T_raw / activityDurationMs;
    const factor = Math.min(Math.pow(ratio, DURABILITY_BETA), DURABILITY_CAP);
    const zones: SlopeZone[] = ['steep_climb', 'moderate_climb', 'flat', 'descent'];
    effectiveZoneSpeeds = {} as Record<SlopeZone, number>;
    for (const z of zones) {
      effectiveZoneSpeeds[z] = profile.zoneSpeedMs[z] / factor;
    }
  }

  const startMs = parseStartTimeMs(startTimeStr);
  let elapsedMs = 0;
  let lastGhostSampleDistM = 0;

  const ghostTimeline: GhostTimelinePoint[] = [];
  const checkpointResults: CheckpointResult[] = [];

  // Sort checkpoints by distance
  const sortedCheckpoints = [...checkpoints].sort(
    (a, b) => a.cumulativeDistanceKm - b.cumulativeDistanceKm
  );

  // Track which checkpoints have been processed
  const processedIds = new Set<string>();

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
      baseSpeed * segment.altitudePenaltyFactor * intensityFactor * conditionsFactor;

    // Guard against zero/negative speed
    const safeSpeed = Math.max(effectiveSpeed, 0.1);
    const segmentDurationMs = (segment.distanceM / safeSpeed) * 1000;

    elapsedMs += segmentDurationMs;

    // Emit ghost sample points periodically
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

    // Check if any checkpoint falls near this segment's end
    for (const cp of sortedCheckpoints) {
      if (processedIds.has(cp.id)) continue;
      const cpDistM = cp.cumulativeDistanceKm * 1000;
      if (Math.abs(segment.cumulativeDistanceM - cpDistM) <= SNAP_THRESHOLD_M) {
        const result = buildCheckpointResult(cp, startMs, elapsedMs, transitions);
        checkpointResults.push(result);
        processedIds.add(cp.id);

        // Transition time pauses movement but ticks the clock
        elapsedMs += result.transitionMin * 60000;
      }
    }
  }

  // Ensure finish checkpoint is in results
  const totalDistM =
    courseSegments.length > 0
      ? courseSegments[courseSegments.length - 1].cumulativeDistanceM
      : 0;

  const finishMs = startMs + elapsedMs;

  return {
    startMs,
    ghostTimeline,
    checkpointResults,
    totalDurationMs: elapsedMs,
    finishClock: formatClock(finishMs),
    totalDistanceM: totalDistM,
  };
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
