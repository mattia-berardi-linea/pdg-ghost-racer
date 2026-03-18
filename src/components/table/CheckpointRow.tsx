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

  const bufferColor = isDQ
    ? 'text-red-400'
    : bufferMin !== null && bufferMin < 30
    ? 'text-amber-400'
    : 'text-green-400';

  const bufferBg = isDQ
    ? 'bg-red-900/40 border-red-700/50'
    : bufferMin !== null && bufferMin < 30
    ? 'bg-amber-900/30 border-amber-700/50'
    : 'bg-green-900/20 border-green-800/30';

  const handleClick = () => {
    selectCheckpoint(isSelected ? null : cp.id);
    setScrubberDistance(cp.cumulativeDistanceKm * 1000);
  };

  return (
    <tr
      onClick={handleClick}
      className={`
        border-b border-gray-800/60 cursor-pointer transition-colors
        ${isSelected ? 'bg-blue-900/20' : 'hover:bg-gray-800/40'}
      `}
    >
      {/* Name + distance */}
      <td className="py-2 px-3 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
            !hasCutoff ? 'bg-gray-600' :
            isDQ ? 'bg-red-500' :
            bufferMin !== null && bufferMin < 30 ? 'bg-amber-400' : 'bg-green-500'
          }`} />
          <div>
            <div className={`text-sm font-medium ${hasCutoff ? 'text-white' : 'text-gray-400'}`}>
              {cp.name}
              {cp.isExitCutoff && (
                <span className="ml-1 text-red-400 text-xs font-normal">[EXIT]</span>
              )}
            </div>
            <div className="text-xs text-gray-600">
              {cp.cumulativeDistanceKm}km · {cp.altitudeM}m
            </div>
          </div>
        </div>
      </td>

      {/* Arrival */}
      <td className="py-2 px-3 text-sm font-mono text-gray-300 whitespace-nowrap">
        {arrivalClock}
      </td>

      {/* Transition */}
      <td className="py-2 px-3 text-sm font-mono text-amber-400/80 whitespace-nowrap">
        {transitionMin > 0 ? `+${transitionMin}m` : '—'}
      </td>

      {/* Exit time */}
      <td className="py-2 px-3 text-sm font-mono text-gray-300 whitespace-nowrap">
        {transitionMin > 0 ? exitClock : '—'}
      </td>

      {/* Cut-off */}
      <td className="py-2 px-3 text-sm font-mono whitespace-nowrap">
        {hasCutoff ? (
          <span className={isDQ ? 'text-red-400' : bufferMin !== null && bufferMin < 30 ? 'text-amber-400' : 'text-gray-400'}>
            {cutoffClock}
            {cp.cutoffType === 'relative' && (
              <span className="text-xs text-gray-600 ml-1">(+{cp.cutoffOffsetHours}h)</span>
            )}
            {cp.isExitCutoff && (
              <span className="text-xs text-gray-600 ml-1">exit</span>
            )}
          </span>
        ) : (
          <span className="text-gray-700">—</span>
        )}
      </td>

      {/* Buffer badge */}
      <td className="py-2 px-3 whitespace-nowrap">
        {hasCutoff && bufferMin !== null ? (
          <span className={`inline-block text-xs font-mono font-bold px-2 py-0.5 rounded border ${bufferBg} ${bufferColor}`}>
            {isDQ ? '✗ DQ' : `+${Math.round(bufferMin)}m`}
          </span>
        ) : (
          <span className="text-gray-700 text-xs">—</span>
        )}
      </td>
    </tr>
  );
}
