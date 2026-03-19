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
    <div className="space-y-1.5">
      <label className="text-xs font-semibold uppercase tracking-wider block" style={{ color: 'var(--stone-400)' }}>
        Pit Stop Times (min)
      </label>
      <div className="space-y-1.5">
        {TRANSITION_CHECKPOINTS.map((cp) => (
          <div key={cp.id} className="flex items-center justify-between gap-2">
            <span
              className="text-xs truncate flex-1"
              style={{ color: cp.cutoffType !== 'none' ? 'var(--sunset-gold)' : 'var(--stone-400)' }}
            >
              {cp.name}
              {cp.isExitCutoff && (
                <span className="ml-1 text-xs" style={{ color: 'var(--alpine-400)' }}>(exit)</span>
              )}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setTransition(cp.id, Math.max(0, (transitions[cp.id] ?? 0) - 1))}
                className="w-6 h-6 rounded flex items-center justify-center text-sm font-medium transition-colors"
                style={{ background: 'var(--navy-800)', color: 'var(--stone-300)', border: '1px solid var(--navy-700)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--navy-700)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--navy-800)')}
              >
                −
              </button>
              <span className="w-8 text-center text-sm font-mono text-white">
                {transitions[cp.id] ?? 0}
              </span>
              <button
                onClick={() => setTransition(cp.id, (transitions[cp.id] ?? 0) + 1)}
                className="w-6 h-6 rounded flex items-center justify-center text-sm font-medium transition-colors"
                style={{ background: 'var(--navy-800)', color: 'var(--stone-300)', border: '1px solid var(--navy-700)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--navy-700)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--navy-800)')}
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
