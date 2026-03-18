'use client';

import { useState, useRef, useEffect } from 'react';
import GpxDropzone from './GpxDropzone';
import StartTimeSelector from './StartTimeSelector';
import IntensitySlider from './IntensitySlider';
import ConditionsToggle from './ConditionsToggle';
import TransitionsManager from './TransitionsManager';
import { useRaceStore } from '@/store/raceStore';
import { formatDuration } from '@/lib/timeUtils';

/** Parse "H:MM" or "HH:MM" duration string → milliseconds. Returns null if invalid. */
function parseDurationInput(str: string): number | null {
  const parts = str.trim().split(':');
  if (parts.length !== 2) return null;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
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

function Divider() {
  return <div className="border-t" style={{ borderColor: 'var(--navy-700)' }} />;
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
    <div className="flex flex-col gap-5 h-full overflow-y-auto px-1">

      {/* Summary card */}
      <div
        className="rounded-lg p-4 border"
        style={{
          background: 'linear-gradient(135deg, var(--navy-900), var(--navy-800))',
          borderColor: 'rgba(91,165,214,0.25)',
          boxShadow: '0 4px 24px rgba(91,165,214,0.08)',
        }}
      >
        <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--stone-400)' }}>
          Estimated Finish
        </div>

        {simulationStatus === 'running' ? (
          <div className="text-sm animate-pulse" style={{ color: 'var(--stone-500)' }}>Calculating…</div>
        ) : simulationResult ? (
          <div>
            <div className="text-3xl font-bold font-mono text-white tracking-tight">
              {simulationResult.finishClock}
            </div>

            {/* Editable total time */}
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-xs" style={{ color: 'var(--stone-500)' }}>Total:</span>
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
                    className="w-16 text-xs font-mono rounded px-1.5 py-0.5 outline-none border"
                    style={{
                      background: 'var(--navy-800)',
                      borderColor: inputError ? 'var(--alpine-500)' : 'var(--glacier-500)',
                      color: inputError ? 'var(--alpine-400)' : 'white',
                    }}
                  />
                  <button onClick={cancelEdit} className="text-xs leading-none" style={{ color: 'var(--stone-500)' }}>✕</button>
                </>
              ) : (
                <>
                  <button
                    onClick={startEditing}
                    className="text-xs font-mono underline decoration-dashed underline-offset-2"
                    style={{ color: 'var(--stone-300)' }}
                    title="Click to set a target total time"
                  >
                    {displayMs ? formatDuration(displayMs) : '—'}
                  </button>
                  {targetTotalMs ? (
                    <button onClick={clearTarget} className="text-xs leading-none ml-0.5 hover:opacity-80" style={{ color: 'var(--alpine-400)' }} title="Clear target">✕</button>
                  ) : (
                    <button onClick={startEditing} className="text-xs leading-none ml-0.5 opacity-40 hover:opacity-80" style={{ color: 'var(--glacier-400)' }} title="Set target time">✏</button>
                  )}
                </>
              )}
            </div>

            {targetTotalMs && (
              <div className="text-xs mt-1.5 font-medium" style={{ color: 'var(--sunset-gold)' }}>
                Target mode — checkpoint times adjusted
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm" style={{ color: 'var(--stone-500)' }}>—</div>
        )}

        {normalizedProfile.activityCount === 0 && !targetTotalMs && (
          <div className="text-xs mt-2" style={{ color: 'var(--sunset-gold)' }}>Using default profile</div>
        )}
        {normalizedProfile.activityCount > 0 && (
          <div className="text-xs mt-2" style={{ color: 'var(--glacier-400)' }}>
            Profile from {normalizedProfile.activityCount} GPX file{normalizedProfile.activityCount > 1 ? 's' : ''}
          </div>
        )}
      </div>

      <Divider />
      <GpxDropzone />
      <Divider />
      <StartTimeSelector />
      <Divider />
      <IntensitySlider />
      <Divider />
      <ConditionsToggle />
      <Divider />
      <TransitionsManager />
    </div>
  );
}
