'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useRaceStore } from '@/store/raceStore';
import { CHECKPOINTS, COURSE_BOUNDS } from '@/lib/constants';
import { segmentsToGeoJSON } from '@/lib/courseSegmenter';
import type { CheckpointResult, GhostTimelinePoint } from '@/types';
import { useMapSync } from '@/hooks/useMapSync';

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';

function getStatusColor(status: CheckpointResult['status'] | 'none'): string {
  switch (status) {
    case 'ok':    return '#22c55e';
    case 'tight': return '#f59e0b';
    case 'dq':    return '#ef4444';
    default:      return '#6b7280';
  }
}

export default function RaceMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<mapboxgl.Map | null>(null);
  const ghostMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const cpMarkersRef   = useRef<mapboxgl.Marker[]>([]);
  const [is3D, setIs3D] = useState(false);

  const courseSegments   = useRaceStore((s) => s.courseSegments);
  const simulationResult = useRaceStore((s) => s.simulationResult);
  const scrubberDistanceM = useRaceStore((s) => s.scrubberDistanceM);
  const { syncToDistance } = useMapSync(mapRef);

  // ── 1. Initialize map ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;
    if (!TOKEN || TOKEN === 'pk.YOUR_TOKEN_HERE') return;

    mapboxgl.accessToken = TOKEN;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      bounds: COURSE_BOUNDS,
      fitBoundsOptions: { padding: 60 },
    });

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    mapRef.current = map;

    // Create ghost marker as soon as map DOM is ready (before style loads)
    // DOM markers work independently of map style
    const el = document.createElement('div');
    el.style.cssText = `
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #1d4ed8;
      border: 3px solid #ffffff;
      box-shadow: 0 0 0 3px rgba(29,78,216,0.5), 0 2px 8px rgba(0,0,0,0.4);
      pointer-events: none;
      z-index: 10;
    `;
    ghostMarkerRef.current = new mapboxgl.Marker({ element: el, anchor: 'center' })
      .setLngLat([7.748, 46.024]) // Zermatt start
      .addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
      ghostMarkerRef.current = null;
    };
  }, []);

  // ── 2. Draw course line ───────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !courseSegments || courseSegments.length === 0) return;

    const addCourse = () => {
      const geojson = segmentsToGeoJSON(courseSegments);

      if (map.getSource('course')) {
        (map.getSource('course') as mapboxgl.GeoJSONSource).setData(geojson);
        return;
      }

      map.addSource('course', { type: 'geojson', data: geojson });

      map.addLayer({
        id: 'course-glow',
        type: 'line',
        source: 'course',
        paint: { 'line-color': '#ef4444', 'line-width': 7, 'line-opacity': 0.25, 'line-blur': 3 },
      });
      map.addLayer({
        id: 'course-line',
        type: 'line',
        source: 'course',
        paint: { 'line-color': '#ef4444', 'line-width': 2.5, 'line-opacity': 0.95 },
      });
    };

    if (map.isStyleLoaded()) addCourse();
    else map.once('load', addCourse);
  }, [courseSegments]);

  // ── 3. Place checkpoint markers ───────────────────────────────────────────
  const placeCheckpointMarkers = useCallback(() => {
    const map = mapRef.current;
    if (!map || !courseSegments || courseSegments.length === 0) return;

    cpMarkersRef.current.forEach((m) => m.remove());
    cpMarkersRef.current = [];

    const results = simulationResult?.checkpointResults ?? [];

    for (const cp of CHECKPOINTS) {
      const result   = results.find((r) => r.checkpoint.id === cp.id);
      const color    = result ? getStatusColor(result.status) : '#6b7280';
      const hasCutoff = cp.cutoffType !== 'none';

      const targetDistM = cp.cumulativeDistanceKm * 1000;
      const segment = courseSegments.reduce((prev, curr) =>
        Math.abs(curr.cumulativeDistanceM - targetDistM) <
        Math.abs(prev.cumulativeDistanceM - targetDistM) ? curr : prev
      );

      const { lon, lat } = segment.toPoint;

      const el = document.createElement('div');
      el.style.cssText = `
        width: ${hasCutoff ? 14 : 8}px;
        height: ${hasCutoff ? 14 : 8}px;
        border-radius: 50%;
        background: ${color};
        border: 2px solid rgba(255,255,255,0.8);
        cursor: pointer;
        pointer-events: auto;
        ${hasCutoff ? `animation: pulse-${result?.status ?? 'none'} 2s infinite;` : ''}
      `;

      const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat([lon, lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 16, className: 'cp-popup' })
            .setHTML(buildPopupHTML(cp.name, result))
        )
        .addTo(map);

      cpMarkersRef.current.push(marker);
    }
  }, [courseSegments, simulationResult]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (map.isStyleLoaded()) placeCheckpointMarkers();
    else map.once('load', placeCheckpointMarkers);
  }, [placeCheckpointMarkers]);

  // ── 4. Update ghost marker position whenever scrubber moves ──────────────
  useEffect(() => {
    const marker = ghostMarkerRef.current;
    const timeline = simulationResult?.ghostTimeline;
    if (!marker || !timeline || timeline.length === 0) return;

    const point = findNearestTimelinePoint(timeline, scrubberDistanceM);
    if (!point) return;

    marker.setLngLat([point.lon, point.lat]);
    syncToDistance(scrubberDistanceM);
  }, [scrubberDistanceM, simulationResult, syncToDistance]);

  // ── 5. Toggle 3D terrain ──────────────────────────────────────────────────
  const toggle3D = useCallback(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    if (!is3D) {
      if (!map.getSource('mapbox-dem')) {
        map.addSource('mapbox-dem', {
          type: 'raster-dem',
          url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
          tileSize: 512,
          maxzoom: 14,
        });
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (map as any).setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
      if (!map.getLayer('sky')) {
        map.addLayer({
          id: 'sky',
          type: 'sky',
          paint: {
            'sky-type': 'atmosphere',
            'sky-atmosphere-sun': [0.0, 0.0],
            'sky-atmosphere-sun-intensity': 15,
          },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);
      }
      map.easeTo({ pitch: 65, bearing: -20, duration: 1000 });
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (map as any).setTerrain(null);
      if (map.getLayer('sky')) map.removeLayer('sky');
      map.easeTo({ pitch: 0, bearing: 0, duration: 800 });
    }

    setIs3D((prev) => !prev);
  }, [is3D]);

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden">
      {(!TOKEN || TOKEN === 'pk.YOUR_TOKEN_HERE') && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10 text-center px-8">
          <div>
            <p className="text-amber-400 font-semibold text-lg mb-2">Mapbox token required</p>
            <p className="text-gray-400 text-sm">
              Add your token to <code className="text-blue-400">.env.local</code>
              <br />
              <code className="text-gray-300">NEXT_PUBLIC_MAPBOX_TOKEN=pk.xxx</code>
            </p>
          </div>
        </div>
      )}
      <div ref={mapContainer} className="w-full h-full" />

      {/* 3D terrain toggle */}
      {TOKEN && TOKEN !== 'pk.YOUR_TOKEN_HERE' && (
        <button
          onClick={toggle3D}
          className="absolute bottom-8 left-3 text-xs font-bold rounded px-2.5 py-1 border transition-colors"
          style={{
            background: is3D ? 'rgba(91,165,214,0.25)' : 'rgba(15,31,53,0.85)',
            borderColor: is3D ? 'rgba(91,165,214,0.6)' : 'rgba(91,165,214,0.25)',
            color: is3D ? '#5ba5d6' : '#9ca3af',
            backdropFilter: 'blur(4px)',
          }}
          title={is3D ? 'Switch to 2D' : 'Switch to 3D terrain'}
        >
          {is3D ? '2D' : '3D'}
        </button>
      )}
    </div>
  );
}

function findNearestTimelinePoint(
  timeline: GhostTimelinePoint[],
  targetDistM: number
): GhostTimelinePoint | null {
  if (timeline.length === 0) return null;
  let lo = 0, hi = timeline.length - 1;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (timeline[mid].cumulativeDistanceM < targetDistM) lo = mid + 1;
    else hi = mid;
  }
  return timeline[lo] ?? timeline[timeline.length - 1];
}

function buildPopupHTML(name: string, result?: CheckpointResult): string {
  if (!result) return `<div style="font-family:'Barlow',sans-serif;font-size:12px;color:#d1d5db;background:#0f1f35;padding:10px;border-radius:8px;border:1px solid #253752">${name}</div>`;
  const bufferStr =
    result.bufferMin !== null
      ? result.isDQ
        ? `<span style="color:#e56b5a">✗ DQ</span>`
        : `<span style="color:${result.bufferMin < 30 ? '#fbbf24' : '#4ade80'}">+${Math.round(result.bufferMin)}m buffer</span>`
      : '';
  return `
    <div style="font-family:'Barlow',sans-serif;font-size:12px;color:#d1d5db;background:#0f1f35;padding:10px;border-radius:8px;border:1px solid #253752;min-width:148px;box-shadow:0 4px 16px rgba(0,0,0,0.4)">
      <div style="font-weight:700;margin-bottom:5px;color:#ffffff;font-size:13px">${name}</div>
      <div style="color:#9ca3af">Arrival: <span style="color:#d1d5db;font-weight:600">${result.arrivalClock}</span></div>
      ${result.cutoffClock ? `<div style="color:#9ca3af">Cut-off: <span style="color:#d1d5db;font-weight:600">${result.cutoffClock}</span></div>` : ''}
      ${bufferStr ? `<div style="margin-top:4px">${bufferStr}</div>` : ''}
    </div>`;
}
