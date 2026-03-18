'use client';

import { useRaceStore } from '@/store/raceStore';
import { CHECKPOINTS } from '@/lib/constants';

const TRANSITION_CHECKPOINTS = CHECKPOINTS.filter((cp) => cp.defaultTransitionMin > 0 || cp.cutoffType !== 'none');

export default function TransitionsManager() {
  const transitions = useRaceStore((s) => s.transitions);
  const setTransition = useRaceStore((s) => s.setTransition);

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">
        Pit Stop Times (min)
      </label>
      <div className="space-y-1">
        {TRANSITION_CHECKPOINTS.map((cp) => (
          <div key={cp.id} className="flex items-center justify-between gap-2">
            <span className={`text-xs truncate flex-1 ${cp.cutoffType !== 'none' ? 'text-amber-400' : 'text-gray-400'}`}>
              {cp.name}
              {cp.isExitCutoff && <span className="ml-1 text-red-400 text-xs">(exit)</span>}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setTransition(cp.id, Math.max(0, (transitions[cp.id] ?? 0) - 1))}
                className="w-5 h-5 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs flex items-center justify-center"
              >
                −
              </button>
              <span className="w-8 text-center text-sm font-mono text-white">
                {transitions[cp.id] ?? 0}
              </span>
              <button
                onClick={() => setTransition(cp.id, (transitions[cp.id] ?? 0) + 1)}
                className="w-5 h-5 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs flex items-center justify-center"
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
