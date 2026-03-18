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

  // Focus input when editing starts
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
      {/* Summary header */}
      <div className="bg-gray-800/60 rounded-lg p-3 border border-gray-700">
        <div className="text-xs text-gray-400 mb-1">Estimated Finish</div>
        {simulationStatus === 'running' ? (
          <div className="text-gray-500 text-sm animate-pulse">Calculating…</div>
        ) : simulationResult ? (
          <div>
            <div className="text-2xl font-bold font-mono text-white">
              {simulationResult.finishClock}
            </div>

            {/* Editable total time row */}
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-xs text-gray-400">Total:</span>
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
                    className={`w-16 text-xs font-mono bg-gray-700 rounded px-1 py-0.5 outline-none border ${inputError ? 'border-red-500 text-red-400' : 'border-blue-500 text-white'}`}
                  />
                  <button onClick={cancelEdit} className="text-gray-500 hover:text-gray-300 text-xs leading-none">✕</button>
                </>
              ) : (
                <>
                  <button
                    onClick={startEditing}
                    className="text-xs font-mono text-gray-300 hover:text-white underline decoration-dashed underline-offset-2"
                    title="Click to set a target total time"
                  >
                    {displayMs ? formatDuration(displayMs) : '—'}
                  </button>
                  {targetTotalMs && (
                    <button onClick={clearTarget} className="text-gray-500 hover:text-red-400 text-xs leading-none ml-0.5" title="Clear target">✕</button>
                  )}
                  {!targetTotalMs && (
                    <button onClick={startEditing} className="text-gray-600 hover:text-gray-400 ml-0.5" title="Set target time">✏</button>
                  )}
                </>
              )}
            </div>

            {targetTotalMs && (
              <div className="text-xs text-amber-400/90 mt-1">Target mode — checkpoint times adjusted</div>
            )}
          </div>
        ) : (
          <div className="text-gray-600 text-sm">—</div>
        )}
        {normalizedProfile.activityCount === 0 && !targetTotalMs && (
          <div className="text-xs text-amber-500/80 mt-1">Using default profile</div>
        )}
        {normalizedProfile.activityCount > 0 && (
          <div className="text-xs text-blue-400/80 mt-1">
            Profile from {normalizedProfile.activityCount} GPX file{normalizedProfile.activityCount > 1 ? 's' : ''}
          </div>
        )}
      </div>

      <div className="border-t border-gray-800" />
      <GpxDropzone />
      <div className="border-t border-gray-800" />
      <StartTimeSelector />
      <div className="border-t border-gray-800" />
      <IntensitySlider />
      <div className="border-t border-gray-800" />
      <ConditionsToggle />
      <div className="border-t border-gray-800" />
      <TransitionsManager />
    </div>
  );
}
