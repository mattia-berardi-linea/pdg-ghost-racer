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
    ? 'var(--navy-600)'
    : isDQ
    ? 'var(--alpine-500)'
    : bufferMin !== null && bufferMin < 30
    ? 'var(--sunset-gold)'
    : 'var(--mountain-green)';

  const bufferColor = isDQ
    ? 'var(--alpine-400)'
    : bufferMin !== null && bufferMin < 30
    ? 'var(--sunset-gold)'
    : 'var(--mountain-green)';

  const bufferBg = isDQ
    ? 'rgba(214,79,61,0.15)'
    : bufferMin !== null && bufferMin < 30
    ? 'rgba(251,191,36,0.12)'
    : 'rgba(74,222,128,0.1)';

  const bufferBorder = isDQ
    ? 'rgba(214,79,61,0.3)'
    : bufferMin !== null && bufferMin < 30
    ? 'rgba(251,191,36,0.3)'
    : 'rgba(74,222,128,0.25)';

  const handleClick = () => {
    selectCheckpoint(isSelected ? null : cp.id);
    setScrubberDistance(cp.cumulativeDistanceKm * 1000);
  };

  return (
    <tr
      onClick={handleClick}
      className="border-b cursor-pointer transition-colors"
      style={{
        borderColor: 'var(--navy-800)',
        background: isSelected ? 'rgba(91,165,214,0.08)' : undefined,
      }}
      onMouseEnter={(e) => {
        if (!isSelected) (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(26,41,66,0.6)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLTableRowElement).style.background = isSelected ? 'rgba(91,165,214,0.08)' : '';
      }}
    >
      {/* Name + distance */}
      <td className="py-2 px-3 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dotColor }} />
          <div>
            <div
              className="text-sm font-medium"
              style={{ color: hasCutoff ? 'white' : 'var(--stone-400)' }}
            >
              {cp.name}
              {cp.isExitCutoff && (
                <span className="ml-1 text-xs font-normal" style={{ color: 'var(--alpine-400)' }}>[EXIT]</span>
              )}
            </div>
            <div className="text-xs" style={{ color: 'var(--stone-500)' }}>
              {cp.cumulativeDistanceKm}km · {cp.altitudeM}m
            </div>
          </div>
        </div>
      </td>

      {/* Arrival */}
      <td className="py-2 px-3 text-sm font-mono whitespace-nowrap" style={{ color: 'var(--stone-300)' }}>
        {arrivalClock}
      </td>

      {/* Transition */}
      <td className="py-2 px-3 text-sm font-mono whitespace-nowrap" style={{ color: 'var(--sunset-gold)', opacity: 0.85 }}>
        {transitionMin > 0 ? `+${transitionMin}m` : '—'}
      </td>

      {/* Exit time */}
      <td className="py-2 px-3 text-sm font-mono whitespace-nowrap" style={{ color: 'var(--stone-300)' }}>
        {transitionMin > 0 ? exitClock : '—'}
      </td>

      {/* Cut-off */}
      <td className="py-2 px-3 text-sm font-mono whitespace-nowrap">
        {hasCutoff ? (
          <span style={{ color: isDQ ? 'var(--alpine-400)' : bufferMin !== null && bufferMin < 30 ? 'var(--sunset-gold)' : 'var(--stone-400)' }}>
            {cutoffClock}
            {cp.cutoffType === 'relative' && (
              <span className="text-xs ml-1" style={{ color: 'var(--stone-500)' }}>(+{cp.cutoffOffsetHours}h)</span>
            )}
            {cp.isExitCutoff && (
              <span className="text-xs ml-1" style={{ color: 'var(--stone-500)' }}>exit</span>
            )}
          </span>
        ) : (
          <span style={{ color: 'var(--navy-600)' }}>—</span>
        )}
      </td>

      {/* Buffer badge */}
      <td className="py-2 px-3 whitespace-nowrap">
        {hasCutoff && bufferMin !== null ? (
          <span
            className="inline-block text-xs font-mono font-bold px-2 py-0.5 rounded border"
            style={{ background: bufferBg, color: bufferColor, borderColor: bufferBorder }}
          >
            {isDQ ? '✗ DQ' : `+${Math.round(bufferMin)}m`}
          </span>
        ) : (
          <span className="text-xs" style={{ color: 'var(--navy-600)' }}>—</span>
        )}
      </td>
    </tr>
  );
}
