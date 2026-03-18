import type { TrackPoint, CourseSegment } from '@/types';
import { haversineDistance, slopeGrade, classifyZone } from './slopeZones';
import { getAltitudePenaltyFactor } from './altitudePenalty';

/**
 * Smooth elevations with a box filter to reduce GPS altitude noise before
 * grade classification.  halfWindow = 4 → 9-point window (~90 m at 10 m/pt
 * spacing).  Only the smoothed value is used for grade/zone; raw elevations
 * are kept for altitude-penalty and display.
 */
function smoothElevations(points: TrackPoint[], halfWindow = 4): number[] {
  return points.map((_, i) => {
    const lo = Math.max(0, i - halfWindow);
    const hi = Math.min(points.length - 1, i + halfWindow);
    let sum = 0;
    for (let j = lo; j <= hi; j++) sum += points[j].ele;
    return sum / (hi - lo + 1);
  });
}

/**
 * Convert an array of TrackPoints (from the Golden Track GPX) into
 * CourseSegments used by the simulation engine.
 */
export function segmentCourse(points: TrackPoint[]): CourseSegment[] {
  const smoothedEle = smoothElevations(points);
  const segments: CourseSegment[] = [];
  let cumulativeDistanceM = 0;

  for (let i = 0; i < points.length - 1; i++) {
    const from = points[i];
    const to = points[i + 1];

    const distanceM = haversineDistance(from, to);
    if (distanceM < 0.1) continue; // skip duplicate points

    // Use smoothed elevations for grade/zone to suppress GPS altitude noise
    const smoothedFrom = { ...from, ele: smoothedEle[i] };
    const smoothedTo   = { ...to,   ele: smoothedEle[i + 1] };
    const grade = slopeGrade(smoothedFrom, smoothedTo, distanceM);
    const zone = classifyZone(grade);
    // Use raw midpoint altitude for penalty calculation
    const midAlt = (from.ele + to.ele) / 2;
    const altitudePenaltyFactor = getAltitudePenaltyFactor(midAlt);

    cumulativeDistanceM += distanceM;

    segments.push({
      index: segments.length,
      fromPoint: { lat: from.lat, lon: from.lon, ele: from.ele },
      toPoint: { lat: to.lat, lon: to.lon, ele: to.ele },
      distanceM,
      gradePercent: grade,
      zone,
      cumulativeDistanceM,
      altitudePenaltyFactor,
    });
  }

  return segments;
}

/**
 * Build a GeoJSON LineString from course segments (for Mapbox layer).
 */
export function segmentsToGeoJSON(segments: CourseSegment[]) {
  const coordinates = segments.length > 0
    ? [
        [segments[0].fromPoint.lon, segments[0].fromPoint.lat],
        ...segments.map((s) => [s.toPoint.lon, s.toPoint.lat]),
      ]
    : [];

  return {
    type: 'Feature' as const,
    properties: {},
    geometry: {
      type: 'LineString' as const,
      coordinates,
    },
  };
}
