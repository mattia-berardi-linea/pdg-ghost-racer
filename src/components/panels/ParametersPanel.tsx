'use client';

import { useState, useRef, useEffect } from 'react';
import GpxDropzone from './GpxDropzone';
import StartTimeSelector from './StartTimeSelector';
import IntensitySlider from './IntensitySlider';
import ConditionsToggle from './ConditionsToggle';
import TransitionsManager from './TransitionsManager';
import { useRaceStore } from '@/store/raceStore';
import { formatDuration } from '@/lib/timeUtils';

/** Parse "H:MM", "HH:MM", "HHMM", or "HMM" duration string → milliseconds. Returns null if invalid. */
function parseDurationInput(str: string): number | null {
  const trimmed = str.trim();
  let h: number, m: number;
  if (trimmed.includes(':')) {
    const parts = trimmed.split(':');
    if (parts.length !== 2) return null;
    h = parseInt(parts[0], 10);
    m = parseInt(parts[1], 10);
  } else if (/^\d{3,4}$/.test(trimmed)) {
    h = parseInt(trimmed.slice(0, trimmed.length - 2), 10);
    m = parseInt(trimmed.slice(-2), 10);
  } else {
    return null;
  }
  if (isNaN(h) || isNaN(m) || h < 0 || m < 0 || m > 59) return null;
  const ms = (h * 60 + m) * 60000;
  return ms > 0 ? ms : null;
}

/** Format milliseconds as "H:MM" for the editable input. */
function formatDurationInput(ms: number): string {
  const totalMin = Math.round(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}:${String(m).padStart(2, '0')}`;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-semibold uppercase tracking-widest mb-3"
      style={{ color: 'rgba(156,163,175,0.6)', letterSpacing: '0.1em' }}>
      {children}
    </div>
  );
}

function Divider() {
  return <div className="border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }} />;
}

export default function ParametersPanel() {
  const simulationResult = useRaceStore((s) => s.simulationResult);
  const simulationStatus = useRaceStore((s) => s.simulationStatus);
  const normalizedProfile = useRaceStore((s) => s.normalizedProfile);
  const targetTotalMs = useRaceStore((s) => s.targetTotalMs);
  const setTargetTotalMs = useRaceStore((s) => s.setTargetTotalMs);

  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  function startEditing() {
    const current = targetTotalMs ?? simulationResult?.totalDurationMs;
    setInputValue(current ? formatDurationInput(current) : '');
    setInputError(false);
    setEditing(true);
  }

  function commitEdit() {
    const parsed = parseDurationInput(inputValue);
    if (parsed) {
      setTargetTotalMs(parsed);
      setEditing(false);
      setInputError(false);
    } else {
      setInputError(true);
    }
  }

  function cancelEdit() {
    setEditing(false);
    setInputError(false);
  }

  function clearTarget() {
    setTargetTotalMs(null);
    setEditing(false);
  }

  const displayMs = targetTotalMs ?? simulationResult?.totalDurationMs ?? null;

  return (
    <div className="flex flex-col h-full min-h-0">

      {/* Summary card — sticky, never scrolls */}
      <div className="flex-shrink-0 p-4">
        <div
          className="rounded-2xl p-4 relative overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(91,165,214,0.2)',
            boxShadow: '0 4px 32px rgba(91,165,214,0.06), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          {/* Subtle inner glow */}
          <div className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at 30% 0%, rgba(91,165,214,0.06) 0%, transparent 60%)',
            }}
          />

          <div className="relative">
            {/* Label row */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: 'rgba(156,163,175,0.6)', letterSpacing: '0.1em' }}>
                Estimated Finish
              </span>
              {simulationStatus === 'running' && (
                <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--glacier-400)' }}>
                  <span className="w-1 h-1 rounded-full animate-pulse"
                    style={{ background: 'var(--glacier-400)' }} />
                  Updating…
                </span>
              )}
            </div>

            {simulationResult ? (
              <div>
                {/* Big finish clock */}
                <div className="font-data text-4xl font-light tracking-tight text-white leading-none mb-2">
                  {simulationResult.finishClock}
                </div>

                {/* Editable total time */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs" style={{ color: 'rgba(156,163,175,0.5)' }}>Total race time:</span>
                  {editing ? (
                    <>
                      <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => { setInputValue(e.target.value); setInputError(false); }}
                        onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') cancelEdit(); }}
                        onBlur={commitEdit}
                        placeholder="H:MM"
                        className="w-16 text-xs font-data rounded-lg px-2 py-0.5 outline-none border"
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          borderColor: inputError ? 'var(--alpine-500)' : 'var(--glacier-400)',
                          color: inputError ? 'var(--alpine-400)' : 'white',
                        }}
                      />
                      <button onClick={cancelEdit} className="text-xs leading-none opacity-50 hover:opacity-80 transition-opacity"
                        style={{ color: 'var(--stone-400)' }}>✕</button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={startEditing}
                        className="text-xs font-data underline decoration-dashed underline-offset-2 transition-colors hover:text-white"
                        style={{ color: 'rgba(209,213,219,0.7)' }}
                        title="Click to set a target total time"
                      >
                        {displayMs ? formatDuration(displayMs) : '—'}
                      </button>
                      {targetTotalMs ? (
                        <button onClick={clearTarget}
                          className="text-xs leading-none ml-0.5 opacity-60 hover:opacity-100 transition-opacity"
                          style={{ color: 'var(--alpine-400)' }} title="Clear target">✕</button>
                      ) : (
                        <button onClick={startEditing}
                          className="text-xs leading-none ml-0.5 opacity-30 hover:opacity-70 transition-opacity"
                          style={{ color: 'var(--glacier-400)' }} title="Set target time">✏</button>
                      )}
                    </>
                  )}
                </div>

                {targetTotalMs && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <div
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
                      style={{
                        background: 'rgba(251,191,36,0.1)',
                        borderColor: 'rgba(251,191,36,0.25)',
                        color: 'var(--sunset-gold)',
                      }}
                    >
                      <span className="w-1 h-1 rounded-full" style={{ background: 'var(--sunset-gold)' }} />
                      Target mode
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="font-data text-3xl font-light tracking-tight"
                style={{ color: 'rgba(156,163,175,0.25)' }}>—:——</div>
            )}

            {normalizedProfile.activityCount > 0 && (
              <div className="text-xs mt-3 flex items-center gap-1.5" style={{ color: 'rgba(126,185,224,0.7)' }}>
                <span className="w-1 h-1 rounded-full" style={{ background: 'var(--glacier-400)' }} />
                Profile from {normalizedProfile.activityCount} GPX file{normalizedProfile.activityCount > 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sections — scrollable area below the card */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-0 px-4 pb-4">

        <section className="py-4">
          <SectionLabel>Training GPX</SectionLabel>
          <GpxDropzone />
        </section>

        <Divider />

        <section className="py-4">
          <SectionLabel>Start Time</SectionLabel>
          <StartTimeSelector />
        </section>

        <Divider />

        <section className="py-4">
          <SectionLabel>Race Intensity</SectionLabel>
          <IntensitySlider />
        </section>

        <Divider />

        <section className="py-4">
          <SectionLabel>Snow Conditions</SectionLabel>
          <ConditionsToggle />
        </section>

        <Divider />

        <section className="py-4">
          <SectionLabel>Pit Stop Times</SectionLabel>
          <TransitionsManager />
        </section>

      </div>
    </div>
  );
}
