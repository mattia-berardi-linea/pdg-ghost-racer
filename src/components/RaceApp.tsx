'use client';

import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import { useRaceStore } from '@/store/raceStore';
import { usePdGCalculator } from '@/hooks/usePdGCalculator';
import { parseGpx } from '@/lib/gpxParser';
import { segmentCourse } from '@/lib/courseSegmenter';
import ParametersPanel from './panels/ParametersPanel';
import CheckpointTable from './table/CheckpointTable';
import ElevationProfile from './elevation/ElevationProfile';

// Mapbox must be client-only (no SSR)
const RaceMap = dynamic(() => import('./map/RaceMap'), { ssr: false });

export default function RaceApp() {
  const setCourseSegments = useRaceStore((s) => s.setCourseSegments);
  const simulationStatus = useRaceStore((s) => s.simulationStatus);

  // Activate the calculator hook (starts watching store & posting to worker)
  usePdGCalculator();

  // Load the Golden Track GPX on mount
  useEffect(() => {
    fetch('/gpx/pdg-golden-track.gpx')
      .then((r) => r.text())
      .then((xml) => {
        const activity = parseGpx(xml, 'pdg-golden-track.gpx');
        const segments = segmentCourse(activity.points);
        setCourseSegments(segments);
      })
      .catch((err) => console.error('[RaceApp] Failed to load Golden Track GPX:', err));
  }, [setCourseSegments]);

  return (
    <div className="h-screen w-screen bg-gray-950 text-white flex flex-col overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center gap-4 px-4 py-2 border-b border-gray-800 bg-gray-900 flex-shrink-0 z-10">
        <div className="flex items-center gap-2">
          <span className="text-xl">👻</span>
          <span className="font-bold text-white tracking-tight">PdG Ghost Racer</span>
          <span className="text-gray-600 text-xs ml-1">Zermatt → Verbier 2026</span>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {simulationStatus === 'running' && (
            <span className="text-blue-400 animate-pulse">● Simulating…</span>
          )}
          {simulationStatus === 'done' && (
            <span className="text-green-400">● Ready</span>
          )}
          {simulationStatus === 'error' && (
            <span className="text-red-400">● Error</span>
          )}
          <span>57.5km · 4386m D+</span>
        </div>
      </header>

      {/* Main grid */}
      <div className="flex-1 overflow-hidden grid" style={{ gridTemplateColumns: '1fr 280px', gridTemplateRows: '1fr' }}>

        {/* Left column: map + elevation + table */}
        <div className="flex flex-col">
          {/* Map */}
          <div className="flex-1 min-h-0 p-2 pb-0">
            <RaceMap />
          </div>

          {/* Elevation profile */}
          <div className="h-48 flex-shrink-0 px-2 py-1 border-t border-gray-800">
            <ElevationProfile />
          </div>

          {/* Checkpoint table */}
          <div className="flex-shrink-0 border-t border-gray-800 bg-gray-900/80 max-h-56 overflow-y-auto">
            <CheckpointTable />
          </div>
        </div>

        {/* Right panel */}
        <div className="border-l border-gray-800 bg-gray-900/60 p-3 overflow-y-auto">
          <ParametersPanel />
        </div>
      </div>
    </div>
  );
}
