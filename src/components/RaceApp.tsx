'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useRaceStore } from '@/store/raceStore';
import { usePdGCalculator } from '@/hooks/usePdGCalculator';
import { parseGpx } from '@/lib/gpxParser';
import { segmentCourse } from '@/lib/courseSegmenter';
import ParametersPanel from './panels/ParametersPanel';
import CheckpointTable from './table/CheckpointTable';
import ElevationProfile from './elevation/ElevationProfile';

// Mapbox must be client-only (no SSR)
const RaceMap = dynamic(() => import('./map/RaceMap'), { ssr: false });

type MobileTab = 'map' | 'results' | 'plan';

function MapIcon() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
  );
}

function SlidersIcon() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
    </svg>
  );
}

const TABS = [
  { id: 'map' as MobileTab,     label: 'Map',     Icon: MapIcon },
  { id: 'results' as MobileTab, label: 'Results', Icon: ListIcon },
  { id: 'plan' as MobileTab,    label: 'Plan',    Icon: SlidersIcon },
];

export default function RaceApp() {
  const setCourseSegments = useRaceStore((s) => s.setCourseSegments);
  const simulationStatus = useRaceStore((s) => s.simulationStatus);
  const [activeTab, setActiveTab] = useState<MobileTab>('map');

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
    <div
      className="h-screen w-screen text-white flex flex-col overflow-hidden relative"
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

      {/* ─── Top bar ──────────────────────────────────────────────────────────── */}
      <header
        className="flex items-center gap-3 px-3 sm:px-5 py-2 sm:py-2.5 flex-shrink-0 z-10 border-b"
        style={{
          background: 'rgba(5,15,28,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderColor: 'rgba(255,255,255,0.07)',
        }}
      >
        {/* Brand */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-lg sm:text-xl font-black tracking-tight"
              style={{ color: 'rgba(147,213,247,0.95)' }}>
              PDG
            </span>
            <span className="text-xs font-medium tracking-widest uppercase hidden sm:inline"
              style={{ color: 'rgba(126,185,224,0.6)' }}>
              Race Simulator
            </span>
          </div>
          <div
            className="px-2 py-0.5 rounded-full text-xs font-medium tracking-wide border hidden sm:block"
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
        <div className="flex items-center gap-2 sm:gap-3 text-xs">
          {simulationStatus === 'running' && (
            <span className="flex items-center gap-1.5" style={{ color: 'var(--glacier-400)' }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: 'var(--glacier-400)', boxShadow: '0 0 6px var(--glacier-400)' }} />
              <span className="hidden sm:inline">Simulating…</span>
            </span>
          )}
          {simulationStatus === 'done' && (
            <span className="flex items-center gap-1.5" style={{ color: 'var(--mountain-green)' }}>
              <span className="w-1.5 h-1.5 rounded-full"
                style={{ background: 'var(--mountain-green)', boxShadow: '0 0 6px var(--mountain-green)' }} />
              <span className="hidden sm:inline">Ready</span>
            </span>
          )}
          {simulationStatus === 'error' && (
            <span className="flex items-center gap-1.5" style={{ color: 'var(--alpine-500)' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--alpine-500)' }} />
              <span className="hidden sm:inline">Error</span>
            </span>
          )}
          <span className="font-medium tracking-wide hidden md:inline" style={{ color: 'rgba(156,163,175,0.6)' }}>
            57.5 km · 4 386 m D+
          </span>
        </div>

        <div className="w-px h-5 sm:h-6 mx-0.5 sm:mx-1 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.1)' }} />
        <img
          src="/pdg-logo.png"
          alt="Patrouille des Glaciers"
          className="flex-shrink-0 h-8 lg:h-10 w-auto"
          style={{ opacity: 0.9 }}
        />
      </header>

      {/* ─── Desktop layout (lg+) ─────────────────────────────────────────────── */}
      <div
        className="flex-1 overflow-hidden relative z-0 hidden lg:grid"
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

      {/* ─── Mobile layout (<lg) ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden relative z-0 lg:hidden">

        {/* Map tab: full-height map + elevation strip at bottom */}
        {activeTab === 'map' && (
          <div className="h-full flex flex-col">
            <div className="flex-1 min-h-0">
              <RaceMap />
            </div>
            <div
              className="flex-shrink-0 border-t"
              style={{ height: '9rem', borderColor: 'rgba(255,255,255,0.06)' }}
            >
              <ElevationProfile />
            </div>
          </div>
        )}

        {/* Results tab: scrollable checkpoint table */}
        {activeTab === 'results' && (
          <div className="h-full overflow-y-auto" style={{ background: 'rgba(5,15,26,0.6)' }}>
            <CheckpointTable />
          </div>
        )}

        {/* Plan tab: parameters panel manages its own internal scroll */}
        {activeTab === 'plan' && (
          <div className="h-full overflow-hidden flex flex-col">
            <ParametersPanel />
          </div>
        )}
      </div>

      {/* ─── Mobile bottom tab bar ────────────────────────────────────────────── */}
      <nav
        className="lg:hidden flex-shrink-0 flex border-t z-20"
        style={{
          background: 'rgba(5,15,28,0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderColor: 'rgba(255,255,255,0.07)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {TABS.map(({ id, label, Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-3 relative transition-colors"
              style={{ color: isActive ? 'var(--glacier-400)' : 'rgba(107,114,128,0.7)' }}
            >
              {/* Active indicator line at top */}
              {isActive && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full"
                  style={{ background: 'var(--glacier-400)' }}
                />
              )}
              <Icon />
              <span className="text-xs font-medium tracking-wide">{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
