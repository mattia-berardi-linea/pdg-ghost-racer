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
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-xs uppercase">
              {['Checkpoint', 'Arrival', 'Stop', 'Exit', 'Cut-off', 'Buffer'].map((h, i) => (
                <th
                  key={h}
                  className="text-left py-2.5 px-3 font-semibold tracking-widest"
                  style={{
                    color: 'rgba(107,114,128,0.7)',
                    fontSize: '0.65rem',
                    letterSpacing: '0.08em',
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                    background: 'rgba(8,16,28,0.97)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  {h}
                  {/* Status badge inline with Buffer column */}
                  {i === 5 && (
                    <span className="ml-2 align-middle">
                      {simulationStatus === 'running' && (
                        <span className="inline-flex items-center gap-1" style={{ color: 'var(--glacier-400)' }}>
                          <span className="w-1 h-1 rounded-full animate-pulse" style={{ background: 'var(--glacier-400)' }} />
                        </span>
                      )}
                      {dqCount > 0 && (
                        <span className="font-data font-medium rounded-full px-1.5 py-0.5 border normal-case"
                          style={{ background: 'rgba(214,79,61,0.12)', color: 'var(--alpine-400)', borderColor: 'rgba(214,79,61,0.25)' }}>
                          {dqCount} DQ
                        </span>
                      )}
                      {tightCount > 0 && dqCount === 0 && (
                        <span className="font-data font-medium rounded-full px-1.5 py-0.5 border normal-case"
                          style={{ background: 'rgba(251,191,36,0.1)', color: 'var(--sunset-gold)', borderColor: 'rgba(251,191,36,0.25)' }}>
                          {tightCount} tight
                        </span>
                      )}
                      {dqCount === 0 && tightCount === 0 && simulationResult && (
                        <span className="w-1.5 h-1.5 rounded-full inline-block"
                          style={{ background: 'var(--mountain-green)', boxShadow: '0 0 4px var(--mountain-green)' }} />
                      )}
                    </span>
                  )}
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

      <div className="px-3 py-2 text-xs border-t" style={{ color: 'rgba(107,114,128,0.45)', borderColor: 'rgba(255,255,255,0.05)' }}>
        Click a row to scrub to that checkpoint · Arolla [EXIT] = cut-off on departure
      </div>
    </div>
  );
}
