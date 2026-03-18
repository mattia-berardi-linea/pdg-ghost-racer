'use client';

import { useRaceStore } from '@/store/raceStore';
import CheckpointRow from './CheckpointRow';
import { CHECKPOINTS } from '@/lib/constants';
import type { CheckpointResult } from '@/types';

export default function CheckpointTable() {
  const simulationResult = useRaceStore((s) => s.simulationResult);
  const simulationStatus = useRaceStore((s) => s.simulationStatus);

  const resultMap = new Map<string, CheckpointResult>(
    simulationResult?.checkpointResults.map((r) => [r.checkpoint.id, r]) ?? []
  );

  const rows: CheckpointResult[] = CHECKPOINTS.map((cp) => {
    if (resultMap.has(cp.id)) return resultMap.get(cp.id)!;
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
      <div
        className="flex items-center gap-4 px-3 py-2 border-b"
        style={{ background: 'var(--navy-900)', borderColor: 'var(--navy-700)' }}
      >
        <h2 className="text-xs font-semibold uppercase tracking-wider flex-1" style={{ color: 'var(--stone-400)' }}>
          Race vs Clock
        </h2>
        {simulationStatus === 'running' && (
          <span className="text-xs animate-pulse" style={{ color: 'var(--glacier-400)' }}>Recalculating…</span>
        )}
        {dqCount > 0 && (
          <span
            className="text-xs rounded px-2 py-0.5 font-mono border"
            style={{
              background: 'rgba(214,79,61,0.15)',
              color: 'var(--alpine-400)',
              borderColor: 'rgba(214,79,61,0.3)',
            }}
          >
            {dqCount} DQ
          </span>
        )}
        {tightCount > 0 && dqCount === 0 && (
          <span
            className="text-xs rounded px-2 py-0.5 font-mono border"
            style={{
              background: 'rgba(251,191,36,0.12)',
              color: 'var(--sunset-gold)',
              borderColor: 'rgba(251,191,36,0.3)',
            }}
          >
            {tightCount} tight
          </span>
        )}
        {dqCount === 0 && tightCount === 0 && simulationResult && (
          <span
            className="text-xs rounded px-2 py-0.5 font-mono border"
            style={{
              background: 'rgba(74,222,128,0.1)',
              color: 'var(--mountain-green)',
              borderColor: 'rgba(74,222,128,0.25)',
            }}
          >
            All clear
          </span>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr
              className="text-xs uppercase border-b"
              style={{ borderColor: 'var(--navy-700)', background: 'rgba(26,41,66,0.5)' }}
            >
              {['Checkpoint', 'Arrival', 'Stop', 'Exit', 'Cut-off', 'Buffer'].map((h) => (
                <th
                  key={h}
                  className="text-left py-2 px-3 font-medium tracking-wider"
                  style={{ color: 'var(--stone-400)' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <CheckpointRow key={row.checkpoint.id} result={row} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-3 py-2 text-xs border-t" style={{ color: 'var(--stone-500)', borderColor: 'var(--navy-700)' }}>
        Click a row to scrub to that checkpoint on the map and elevation profile.
        Arolla [EXIT] = cut-off applies to departure time, not arrival.
      </div>
    </div>
  );
}
