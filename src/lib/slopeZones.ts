import type { SlopeZone, CoursePoint } from '@/types';
import { SLOPE_THRESHOLDS } from './constants';

const EARTH_RADIUS_M = 6371000;

/**
 * Haversine distance between two lat/lon points (metres).
 */
export function haversineDistance(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number }
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const aa =
    sinDLat * sinDLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLon * sinDLon;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(aa));
}

/**
 * Compute slope grade (%) between two points.
 * Positive = uphill, negative = downhill.
 */
export function slopeGrade(from: CoursePoint, to: CoursePoint, distM: number): number {
  if (distM < 0.1) return 0;
  return ((to.ele - from.ele) / distM) * 100;
}

/**
 * Classify a grade% into a SlopeZone.
 */
export function classifyZone(gradePercent: number): SlopeZone {
  if (gradePercent >= SLOPE_THRESHOLDS.steepClimbMin) return 'steep_climb';
  if (gradePercent >= SLOPE_THRESHOLDS.moderateClimbMin) return 'moderate_climb';
  if (gradePercent > SLOPE_THRESHOLDS.flatMin) return 'flat';
  return 'descent';
}
