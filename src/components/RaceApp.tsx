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
    <div className="h-screen w-screen text-white flex flex-col overflow-hidden relative"
      style={{ background: 'linear-gradient(135deg, #0a1828 0%, #0f2035 40%, #0e1c32 70%, #091522 100%)' }}
    >
      {/* Subtle grid background */}
      <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.04 }}>
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(91,165,214,1) 1px, transparent 1px), linear-gradient(90deg, rgba(91,165,214,1) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }} />
      </div>

      {/* Radial glow — top left */}
      <div className="absolute pointer-events-none"
        style={{
          top: '-15%', left: '-5%', width: '45%', height: '55%',
          background: 'radial-gradient(ellipse at center, rgba(91,165,214,0.07) 0%, transparent 70%)',
        }}
      />

      {/* Top bar */}
      <header
        className="flex items-center gap-4 px-5 py-2.5 flex-shrink-0 z-10 border-b"
        style={{
          background: 'rgba(5,15,28,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderColor: 'rgba(255,255,255,0.07)',
        }}
      >
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black tracking-tight"
              style={{ color: 'rgba(147,213,247,0.95)' }}>
              PDG
            </span>
            <span className="text-xs font-medium tracking-widest uppercase"
              style={{ color: 'rgba(126,185,224,0.6)' }}>
              Race Simulator
            </span>
          </div>
          <div
            className="px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide border"
            style={{
              background: 'rgba(91,165,214,0.08)',
              borderColor: 'rgba(91,165,214,0.2)',
              color: 'rgba(161,204,234,0.9)',
            }}
          >
            Zermatt → Verbier 2026
          </div>
        </div>

        <div className="flex-1" />

        {/* Status */}
        <div className="flex items-center gap-3 text-xs">
          {simulationStatus === 'running' && (
            <span className="flex items-center gap-1.5" style={{ color: 'var(--glacier-400)' }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: 'var(--glacier-400)', boxShadow: '0 0 6px var(--glacier-400)' }} />
              Simulating…
            </span>
          )}
          {simulationStatus === 'done' && (
            <span className="flex items-center gap-1.5" style={{ color: 'var(--mountain-green)' }}>
              <span className="w-1.5 h-1.5 rounded-full"
                style={{ background: 'var(--mountain-green)', boxShadow: '0 0 6px var(--mountain-green)' }} />
              Ready
            </span>
          )}
          {simulationStatus === 'error' && (
            <span className="flex items-center gap-1.5" style={{ color: 'var(--alpine-500)' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--alpine-500)' }} />
              Error
            </span>
          )}
          <span className="font-medium tracking-wide" style={{ color: 'rgba(156,163,175,0.6)' }}>
            57.5 km · 4 386 m D+
          </span>
        </div>

        {/* PDG logo */}
        <div className="w-px h-6 mx-1 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.1)' }} />
        <img
          src="/pdg-logo.png"
          alt="Patrouille des Glaciers"
          style={{ height: '40px', width: 'auto', flexShrink: 0, opacity: 0.9 }}
        />
      </header>

      {/* Main grid */}
      <div
        className="flex-1 overflow-hidden grid relative z-0"
        style={{ gridTemplateColumns: '1fr clamp(288px, 22vw, 380px)', gridTemplateRows: '1fr' }}
      >
        {/* Left column: map + elevation + table */}
        <div
          className="grid min-h-0"
          style={{ gridTemplateRows: 'minmax(200px, 32vh) 12rem 1fr' }}
        >
          {/* Map */}
          <div className="min-h-0 p-2 pb-0">
            <div className="h-full rounded-xl overflow-hidden"
              style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
              <RaceMap />
            </div>
          </div>

          {/* Elevation profile */}
          <div className="min-h-0 px-2 py-1 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <ElevationProfile />
          </div>

          {/* Checkpoint table */}
          <div className="min-h-0 overflow-y-auto border-t"
            style={{
              borderColor: 'rgba(255,255,255,0.06)',
              background: 'rgba(5,15,26,0.6)',
            }}
          >
            <CheckpointTable />
          </div>
        </div>

        {/* Right panel */}
        <div
          className="border-l overflow-hidden flex flex-col"
          style={{
            borderColor: 'rgba(255,255,255,0.07)',
            background: 'rgba(5,12,22,0.7)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          <ParametersPanel />
        </div>
      </div>
    </div>
  );
}
