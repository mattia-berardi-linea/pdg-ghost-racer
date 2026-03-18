import type { ParsedActivity, NormalizedProfile, SlopeZone, TrackPoint } from '@/types';
import { haversineDistance, slopeGrade, classifyZone } from './slopeZones';

const ZONES: SlopeZone[] = ['steep_climb', 'moderate_climb', 'flat', 'descent'];

interface ZoneAccumulator {
  weightedSpeedSum: number; // sum of (speed × distance)
  totalDistanceM: number;
}

/**
 * Extract per-segment speed samples from a parsed activity.
 * Requires timestamps; if missing, returns an empty sample set.
 */
function extractZoneSpeeds(activity: ParsedActivity): Record<SlopeZone, ZoneAccumulator> {
  const acc: Record<SlopeZone, ZoneAccumulator> = {
    steep_climb:    { weightedSpeedSum: 0, totalDistanceM: 0 },
    moderate_climb: { weightedSpeedSum: 0, totalDistanceM: 0 },
    flat:           { weightedSpeedSum: 0, totalDistanceM: 0 },
    descent:        { weightedSpeedSum: 0, totalDistanceM: 0 },
  };

  const pts = activity.points;
  const hasTimestamps = pts.length > 1 && pts[0].time && pts[pts.length - 1].time;

  if (hasTimestamps) {
    // Use actual timestamps for speed calculation
    for (let i = 1; i < pts.length; i++) {
      const from = pts[i - 1];
      const to = pts[i];
      if (!from.time || !to.time) continue;

      const distM = haversineDistance(from, to);
      if (distM < 0.5) continue;

      const dtS = (to.time.getTime() - from.time.getTime()) / 1000;
      if (dtS <= 0 || dtS > 3600) continue; // skip gaps > 1h (pauses)

      const speedMs = distM / dtS;
      if (speedMs > 10) continue; // skip unrealistic speeds (>36 km/h)

      const grade = slopeGrade(from as TrackPoint & { lat: number; lon: number; ele: number }, to as TrackPoint & { lat: number; lon: number; ele: number }, distM);
      const zone = classifyZone(grade);

      acc[zone].weightedSpeedSum += speedMs * distM;
      acc[zone].totalDistanceM += distM;
    }
  } else {
    // No timestamps: infer speeds from distance/elevation and a reference pace
    // Use total distance / estimated time (from TSB-like heuristic)
    // For each segment, assign a plausible speed based on zone
    // This is a fallback — the default profile is better for timestampless files
    const totalDistM = activity.totalDistanceKm * 1000;
    const totalEleGain = activity.totalElevationGainM;
    // Swiss performance km formula: 1 perf km = 1km flat OR 100m vert
    const perfKm = activity.totalDistanceKm + totalEleGain / 100;
    const estimatedHours = perfKm / 6.0; // ~6 perf km/h is a solid mountain athlete

    for (let i = 1; i < pts.length; i++) {
      const from = pts[i - 1];
      const to = pts[i];
      const distM = haversineDistance(from, to);
      if (distM < 0.5) continue;

      const grade = slopeGrade(from, to, distM);
      const zone = classifyZone(grade);

      // Assign proportional speed based on zone ratio
      const zoneSpeed = estimatedHours > 0
        ? (totalDistM / (estimatedHours * 3600)) * getZoneMultiplier(zone)
        : 1.0;

      acc[zone].weightedSpeedSum += zoneSpeed * distM;
      acc[zone].totalDistanceM += distM;
    }
  }

  return acc;
}

function getZoneMultiplier(zone: SlopeZone): number {
  switch (zone) {
    case 'steep_climb': return 0.37;
    case 'moderate_climb': return 0.63;
    case 'flat': return 1.0;
    case 'descent': return 1.48;
  }
}

/**
 * Normalize up to 5 activities into a single weighted performance profile.
 * Each activity is weighted by its total distance (more distance = more representative).
 */
export function normalizeProfile(activities: ParsedActivity[]): NormalizedProfile {
  if (activities.length === 0) {
    throw new Error('No activities to normalize');
  }

  const combined: Record<SlopeZone, ZoneAccumulator> = {
    steep_climb:    { weightedSpeedSum: 0, totalDistanceM: 0 },
    moderate_climb: { weightedSpeedSum: 0, totalDistanceM: 0 },
    flat:           { weightedSpeedSum: 0, totalDistanceM: 0 },
    descent:        { weightedSpeedSum: 0, totalDistanceM: 0 },
  };

  for (const activity of activities) {
    const zoneSpeeds = extractZoneSpeeds(activity);
    for (const zone of ZONES) {
      combined[zone].weightedSpeedSum += zoneSpeeds[zone].weightedSpeedSum;
      combined[zone].totalDistanceM += zoneSpeeds[zone].totalDistanceM;
    }
  }

  // Compute distance-weighted average moving duration
  let totalDistKm = 0;
  let weightedDurationMs = 0;
  for (const activity of activities) {
    totalDistKm += activity.totalDistanceKm;
    weightedDurationMs += activity.activityDurationMs * activity.totalDistanceKm;
  }
  const activityDurationMs = totalDistKm > 0 ? weightedDurationMs / totalDistKm : 0;

  // Zones with >50m of measured speed data
  const zonesWithData: SlopeZone[] = ZONES.filter(
    (z) => combined[z].totalDistanceM > 50
  );

  // Fall back to default profile speeds for zones with no data
  const { DEFAULT_PROFILE } = require('../data/defaultProfile');
  const zoneSpeedMs = {} as Record<SlopeZone, number>;

  for (const zone of ZONES) {
    if (combined[zone].totalDistanceM > 50) {
      zoneSpeedMs[zone] = combined[zone].weightedSpeedSum / combined[zone].totalDistanceM;
    } else {
      zoneSpeedMs[zone] = DEFAULT_PROFILE.zoneSpeedMs[zone];
    }
  }

  return { zoneSpeedMs, activityCount: activities.length, activityDurationMs, zonesWithData };
}
