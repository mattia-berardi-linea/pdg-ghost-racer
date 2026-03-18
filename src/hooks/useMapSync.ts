'use client';

import { useCallback, useRef } from 'react';
import type mapboxgl from 'mapbox-gl';
import { useRaceStore } from '@/store/raceStore';
import type { GhostTimelinePoint } from '@/types';

const EMPTY_TIMELINE: GhostTimelinePoint[] = [];

/**
 * Syncs scrubber distance → map pan (no zoom change — keeps user's current zoom level).
 */
export function useMapSync(mapRef: React.RefObject<mapboxgl.Map | null>) {
  const ghostTimeline = useRaceStore(
    (s) => s.simulationResult?.ghostTimeline ?? EMPTY_TIMELINE
  );
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const syncToDistance = useCallback(
    (distM: number) => {
      if (!mapRef.current || ghostTimeline.length === 0) return;

      const point = findNearestPoint(ghostTimeline, distM);
      if (!point) return;

      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        // Pan to ghost position WITHOUT changing the user's current zoom level
        mapRef.current?.panTo([point.lon, point.lat], { duration: 200 });
      }, 60);
    },
    [mapRef, ghostTimeline]
  );

  return { syncToDistance };
}

function findNearestPoint(
  timeline: GhostTimelinePoint[],
  targetDistM: number
): GhostTimelinePoint | null {
  if (timeline.length === 0) return null;
  let lo = 0;
  let hi = timeline.length - 1;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (timeline[mid].cumulativeDistanceM < targetDistM) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }
  return timeline[lo] ?? timeline[timeline.length - 1];
}
