'use client';

import { useRaceStore } from '@/store/raceStore';
import CheckpointRow from './CheckpointRow';
import { CHECKPOINTS } from '@/lib/constants';
import type { CheckpointResult } from '@/types';

export default function CheckpointTable() {
  const simulationResult = useRaceStore((s) => s.simulationResult);
  const simulationStatus = useRaceStore((s) => s.simulationStatus);

  // Build full results list — include all checkpoints, filling blanks for unprocessed ones
  const resultMap = new Map<string, CheckpointResult>(
    simulationResult?.checkpointResults.map((r) => [r.checkpoint.id, r]) ?? []
  );

  const rows: CheckpointResult[] = CHECKPOINTS.map((cp) => {
    if (resultMap.has(cp.id)) return resultMap.get(cp.id)!;
    // Placeholder row (no simulation data yet)
    return {
      checkpoint: cp,
      arrivalMs: 0,
      arrivalClock: '—',
      transitionMin: cp.defaultTransitionMin,
      exitMs: 0,
      exitClock: '—',
      cutoffMs: null,
      cutoffClock: cp.cutoffAbsoluteTime ?? null,
      bufferMin: null,
      status: 'none',
      isDQ: false,
    };
  });

  const dqCount = rows.filter((r) => r.isDQ).length;
  const tightCount = rows.filter((r) => r.status === 'tight').length;

  return (
    <div className="w-full">
      {/* Status bar */}
      <div className="flex items-center gap-4 px-3 py-2 bg-gray-900 border-b border-gray-800">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex-1">
          Race vs Clock
        </h2>
        {simulationStatus === 'running' && (
          <span className="text-xs text-blue-400 animate-pulse">Recalculating…</span>
        )}
        {dqCount > 0 && (
          <span className="text-xs bg-red-900/50 text-red-400 border border-red-800 rounded px-2 py-0.5 font-mono">
            {dqCount} DQ
          </span>
        )}
        {tightCount > 0 && dqCount === 0 && (
          <span className="text-xs bg-amber-900/40 text-amber-400 border border-amber-700 rounded px-2 py-0.5 font-mono">
            {tightCount} tight
          </span>
        )}
        {dqCount === 0 && tightCount === 0 && simulationResult && (
          <span className="text-xs bg-green-900/30 text-green-400 border border-green-800 rounded px-2 py-0.5 font-mono">
            All clear
          </span>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-xs text-gray-500 uppercase border-b border-gray-800">
              <th className="text-left py-2 px-3 font-medium">Checkpoint</th>
              <th className="text-left py-2 px-3 font-medium">Arrival</th>
              <th className="text-left py-2 px-3 font-medium">Stop</th>
              <th className="text-left py-2 px-3 font-medium">Exit</th>
              <th className="text-left py-2 px-3 font-medium">Cut-off</th>
              <th className="text-left py-2 px-3 font-medium">Buffer</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <CheckpointRow key={row.checkpoint.id} result={row} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-3 py-2 text-xs text-gray-600 border-t border-gray-800">
        Click a row to scrub to that checkpoint on the map and elevation profile.
        Arolla [EXIT] = cut-off applies to departure time, not arrival.
      </div>
    </div>
  );
}
