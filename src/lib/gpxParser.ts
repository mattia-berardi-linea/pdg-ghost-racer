import type { TrackPoint, ParsedActivity } from '@/types';
import { haversineDistance } from './slopeZones';

/**
 * Parse a GPX file (as string) into a ParsedActivity.
 * Uses the browser's DOMParser — must be called client-side.
 */
export function parseGpx(xmlString: string, fileName: string): ParsedActivity {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'application/xml');

  const parserError = doc.querySelector('parsererror');
  if (parserError) {
    throw new Error(`Invalid GPX file: ${fileName}`);
  }

  // Support both <trkpt> (track) and <rtept> (route) elements
  const trkpts = Array.from(
    doc.querySelectorAll('trkpt, rtept, wpt')
  ) as Element[];

  if (trkpts.length === 0) {
    throw new Error(`No track points found in ${fileName}`);
  }

  const points: TrackPoint[] = trkpts.map((pt) => {
    const lat = parseFloat(pt.getAttribute('lat') ?? '0');
    const lon = parseFloat(pt.getAttribute('lon') ?? '0');
    const eleEl = pt.querySelector('ele');
    const ele = eleEl ? parseFloat(eleEl.textContent ?? '0') : 0;
    const timeEl = pt.querySelector('time');
    const time = timeEl ? new Date(timeEl.textContent ?? '') : undefined;
    return { lat, lon, ele, time };
  });

  // Calculate total distance
  let totalDistanceKm = 0;
  for (let i = 1; i < points.length; i++) {
    totalDistanceKm += haversineDistance(points[i - 1], points[i]) / 1000;
  }

  // Calculate total elevation gain (only positive deltas)
  let totalElevationGainM = 0;
  for (let i = 1; i < points.length; i++) {
    const delta = points[i].ele - points[i - 1].ele;
    if (delta > 0) totalElevationGainM += delta;
  }

  // Calculate moving time from timestamps (sum intervals where 0 < dt < 1h)
  let activityDurationMs = 0;
  for (let i = 1; i < points.length; i++) {
    const t0 = points[i - 1].time;
    const t1 = points[i].time;
    if (!t0 || !t1) continue;
    const dt = t1.getTime() - t0.getTime();
    if (dt > 0 && dt < 3_600_000) activityDurationMs += dt;
  }

  return { fileName, points, totalDistanceKm, totalElevationGainM, activityDurationMs };
}

/**
 * Parse a GPX File object. Returns a promise.
 */
export function parseGpxFile(file: File): Promise<ParsedActivity> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = parseGpx(e.target?.result as string, file.name);
        resolve(result);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
    reader.readAsText(file);
  });
}
