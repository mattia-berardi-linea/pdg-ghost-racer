import type { TrackPoint, CourseSegment } from '@/types';
import { haversineDistance, slopeGrade, classifyZone } from './slopeZones';
import { getAltitudePenaltyFactor } from './altitudePenalty';

/**
 * Convert an array of TrackPoints (from the Golden Track GPX) into
 * CourseSegments used by the simulation engine.
 */
export function segmentCourse(points: TrackPoint[]): CourseSegment[] {
  const segments: CourseSegment[] = [];
  let cumulativeDistanceM = 0;

  for (let i = 0; i < points.length - 1; i++) {
    const from = points[i];
    const to = points[i + 1];

    const distanceM = haversineDistance(from, to);
    if (distanceM < 0.1) continue; // skip duplicate points

    const grade = slopeGrade(from, to, distanceM);
    const zone = classifyZone(grade);
    // Use midpoint altitude for penalty calculation
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
