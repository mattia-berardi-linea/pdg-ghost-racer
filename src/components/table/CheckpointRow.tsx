'use client';

import type { CheckpointResult } from '@/types';
import { useRaceStore } from '@/store/raceStore';

interface Props {
  result: CheckpointResult;
}

export default function CheckpointRow({ result }: Props) {
  const { checkpoint: cp, arrivalClock, exitClock, cutoffClock, bufferMin, status, isDQ, transitionMin } = result;
  const setScrubberDistance = useRaceStore((s) => s.setScrubberDistance);
  const selectCheckpoint = useRaceStore((s) => s.selectCheckpoint);
  const selectedId = useRaceStore((s) => s.selectedCheckpointId);

  const isSelected = selectedId === cp.id;
  const hasCutoff = cp.cutoffType !== 'none';

  const dotColor = !hasCutoff
    ? 'rgba(55,74,102,0.8)'
    : isDQ
    ? 'var(--alpine-500)'
    : bufferMin !== null && bufferMin < 30
    ? 'var(--sunset-gold)'
    : 'var(--mountain-green)';

  const dotGlow = !hasCutoff
    ? 'none'
    : isDQ
    ? '0 0 6px rgba(229,107,90,0.6)'
    : bufferMin !== null && bufferMin < 30
    ? '0 0 6px rgba(251,191,36,0.5)'
    : '0 0 6px rgba(74,222,128,0.5)';

  const bufferColor = isDQ
    ? 'var(--alpine-400)'
    : bufferMin !== null && bufferMin < 30
    ? 'var(--sunset-gold)'
    : 'var(--mountain-green)';

  const bufferBg = isDQ
    ? 'rgba(214,79,61,0.12)'
    : bufferMin !== null && bufferMin < 30
    ? 'rgba(251,191,36,0.1)'
    : 'rgba(74,222,128,0.08)';

  const bufferBorder = isDQ
    ? 'rgba(214,79,61,0.25)'
    : bufferMin !== null && bufferMin < 30
    ? 'rgba(251,191,36,0.25)'
    : 'rgba(74,222,128,0.2)';

  const handleClick = () => {
    selectCheckpoint(isSelected ? null : cp.id);
    setScrubberDistance(cp.cumulativeDistanceKm * 1000);
  };

  return (
    <tr
      onClick={handleClick}
      className="border-b cursor-pointer transition-colors duration-150"
      style={{
        borderColor: 'rgba(255,255,255,0.04)',
        background: isSelected
          ? 'rgba(91,165,214,0.07)'
          : undefined,
        borderLeft: isSelected ? '2px solid rgba(91,165,214,0.4)' : '2px solid transparent',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.03)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLTableRowElement).style.background = isSelected ? 'rgba(91,165,214,0.07)' : '';
      }}
    >
      {/* Name + distance */}
      <td className="py-2 px-3 whitespace-nowrap">
        <div className="flex items-center gap-2.5">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: dotColor, boxShadow: dotGlow }}
          />
          <div>
            <div
              className="text-sm font-medium leading-tight"
              style={{ color: hasCutoff ? 'rgba(249,250,251,0.9)' : 'rgba(156,163,175,0.6)' }}
            >
              {cp.name}
              {cp.isExitCutoff && (
                <span className="ml-1.5 text-xs font-normal px-1 py-0.5 rounded"
                  style={{
                    color: 'var(--alpine-400)',
                    background: 'rgba(214,79,61,0.1)',
                    fontSize: '0.6rem',
                    letterSpacing: '0.05em',
                  }}>
                  EXIT
                </span>
              )}
            </div>
            <div className="text-xs font-data tabular-nums leading-tight"
              style={{ color: 'rgba(107,114,128,0.6)' }}>
              {cp.cumulativeDistanceKm} km · {cp.altitudeM} m
            </div>
          </div>
        </div>
      </td>

      {/* Arrival */}
      <td className="py-2 px-3 whitespace-nowrap">
        <span className="font-data text-sm tabular-nums" style={{ color: 'rgba(209,213,219,0.85)' }}>
          {arrivalClock}
        </span>
      </td>

      {/* Transition */}
      <td className="py-2 px-3 whitespace-nowrap">
        <span className="font-data text-sm tabular-nums" style={{ color: 'rgba(251,191,36,0.7)' }}>
          {transitionMin > 0 ? `+${transitionMin}m` : '—'}
        </span>
      </td>

      {/* Exit time */}
      <td className="py-2 px-3 whitespace-nowrap">
        <span className="font-data text-sm tabular-nums" style={{ color: 'rgba(209,213,219,0.7)' }}>
          {transitionMin > 0 ? exitClock : '—'}
        </span>
      </td>

      {/* Cut-off */}
      <td className="py-2 px-3 whitespace-nowrap">
        {hasCutoff ? (
          <span className="font-data text-sm tabular-nums"
            style={{ color: isDQ ? 'var(--alpine-400)' : bufferMin !== null && bufferMin < 30 ? 'var(--sunset-gold)' : 'rgba(156,163,175,0.55)' }}>
            {cutoffClock}
            {cp.cutoffType === 'relative' && (
              <span className="text-xs ml-1" style={{ color: 'rgba(107,114,128,0.6)' }}>(+{cp.cutoffOffsetHours}h)</span>
            )}
            {cp.isExitCutoff && (
              <span className="text-xs ml-1" style={{ color: 'rgba(107,114,128,0.5)' }}>exit</span>
            )}
          </span>
        ) : (
          <span style={{ color: 'rgba(55,74,102,0.6)' }}>—</span>
        )}
      </td>

      {/* Buffer badge */}
      <td className="py-2 px-3 whitespace-nowrap">
        {hasCutoff && bufferMin !== null ? (
          <span
            className="inline-block font-data text-xs font-semibold px-2.5 py-0.5 rounded-full border tabular-nums"
            style={{ background: bufferBg, color: bufferColor, borderColor: bufferBorder }}
          >
            {isDQ ? `✗ −${Math.round(Math.abs(bufferMin))}m` : `+${Math.round(bufferMin)}m`}
          </span>
        ) : (
          <span style={{ color: 'rgba(55,74,102,0.5)' }}>—</span>
        )}
      </td>
    </tr>
  );
}
