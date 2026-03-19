'use client';

import { useRaceStore } from '@/store/raceStore';
import { CHECKPOINTS } from '@/lib/constants';

const ALWAYS_INCLUDE = new Set(['pas_du_chat', 'col_chaux']);
const ALWAYS_EXCLUDE = new Set(['zermatt', 'verbier']);

const TRANSITION_CHECKPOINTS = CHECKPOINTS.filter((cp) =>
  !ALWAYS_EXCLUDE.has(cp.id) &&
  (ALWAYS_INCLUDE.has(cp.id) || cp.defaultTransitionMin > 0 || cp.cutoffType !== 'none')
);

export default function TransitionsManager() {
  const transitions = useRaceStore((s) => s.transitions);
  const setTransition = useRaceStore((s) => s.setTransition);

  return (
    <div className="space-y-2">
      {TRANSITION_CHECKPOINTS.map((cp) => {
        const val = transitions[cp.id] ?? 0;
        const hasCutoff = cp.cutoffType !== 'none';
        return (
          <div key={cp.id}
            className="flex items-center justify-between gap-2 rounded-xl px-3 py-2 border"
            style={{
              background: hasCutoff ? 'rgba(251,191,36,0.04)' : 'rgba(255,255,255,0.02)',
              borderColor: hasCutoff ? 'rgba(251,191,36,0.12)' : 'rgba(255,255,255,0.06)',
            }}
          >
            <span
              className="text-xs truncate flex-1"
              style={{ color: hasCutoff ? 'rgba(251,191,36,0.85)' : 'rgba(156,163,175,0.7)' }}
            >
              {cp.name}
              {cp.isExitCutoff && (
                <span className="ml-1.5 text-xs opacity-60" style={{ color: 'var(--alpine-400)' }}>exit</span>
              )}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setTransition(cp.id, Math.max(0, val - 1))}
                className="w-6 h-6 rounded-lg flex items-center justify-center text-sm font-medium transition-all border"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  borderColor: 'rgba(255,255,255,0.1)',
                  color: 'rgba(209,213,219,0.8)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.2)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.1)';
                }}
              >
                −
              </button>
              <span className="w-7 text-center font-data text-sm font-medium text-white tabular-nums">
                {val}
              </span>
              <button
                onClick={() => setTransition(cp.id, val + 1)}
                className="w-6 h-6 rounded-lg flex items-center justify-center text-sm font-medium transition-all border"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  borderColor: 'rgba(255,255,255,0.1)',
                  color: 'rgba(209,213,219,0.8)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.2)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.1)';
                }}
              >
                +
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
