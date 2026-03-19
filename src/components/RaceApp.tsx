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
    <div className="h-screen w-screen text-white flex flex-col overflow-hidden" style={{ background: 'var(--navy-950)' }}>
      {/* Top bar */}
      <header
        className="flex items-center gap-4 px-5 py-3 flex-shrink-0 z-10 border-b"
        style={{ background: 'var(--navy-900)', borderColor: 'var(--navy-700)', backdropFilter: 'blur(8px)' }}
      >
        {/* Brand */}
        <div className="flex items-center gap-3">
          <span className="text-base font-bold tracking-tight text-white">PDG Simulator</span>
          <div className="w-px h-8 mx-1" style={{ background: 'var(--navy-700)' }} />
          <span className="text-sm" style={{ color: 'var(--stone-400)' }}>Zermatt → Verbier 2026</span>
        </div>

        <div className="flex-1" />

        {/* Status */}
        <div className="flex items-center gap-3 text-xs">
          {simulationStatus === 'running' && (
            <span className="flex items-center gap-1.5" style={{ color: 'var(--glacier-400)' }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--glacier-400)' }} />
              Simulating…
            </span>
          )}
          {simulationStatus === 'done' && (
            <span className="flex items-center gap-1.5" style={{ color: 'var(--mountain-green)' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--mountain-green)' }} />
              Ready
            </span>
          )}
          {simulationStatus === 'error' && (
            <span className="flex items-center gap-1.5" style={{ color: 'var(--alpine-500)' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--alpine-500)' }} />
              Error
            </span>
          )}
          <span className="font-medium" style={{ color: 'var(--stone-500)' }}>57.5 km · 4386 m D+</span>
        </div>

        {/* PDG logo */}
        <div className="w-px h-8 mx-1 flex-shrink-0" style={{ background: 'var(--navy-700)' }} />
        <img
          src="/pdg-logo.png"
          alt="Patrouille des Glaciers"
          style={{ height: '44px', width: 'auto', flexShrink: 0 }}
        />
      </header>

      {/* Main grid */}
      <div
        className="flex-1 overflow-hidden grid"
        style={{ gridTemplateColumns: '1fr clamp(288px, 22vw, 380px)', gridTemplateRows: '1fr' }}
      >
        {/* Left column: map + elevation + table */}
        <div
          className="grid min-h-0"
          style={{ gridTemplateRows: 'minmax(200px, 42vh) 12rem 1fr' }}
        >
          {/* Map */}
          <div className="min-h-0 p-2 pb-0">
            <RaceMap />
          </div>

          {/* Elevation profile */}
          <div className="min-h-0 px-2 py-1 border-t" style={{ borderColor: 'var(--navy-700)' }}>
            <ElevationProfile />
          </div>

          {/* Checkpoint table */}
          <div className="min-h-0 overflow-y-auto border-t" style={{ borderColor: 'var(--navy-700)', background: 'var(--navy-900)' }}>
            <CheckpointTable />
          </div>
        </div>

        {/* Right panel */}
        <div className="border-l p-3 overflow-y-auto" style={{ borderColor: 'var(--navy-700)', background: 'var(--navy-900)' }}>
          <ParametersPanel />
        </div>
      </div>
    </div>
  );
}
