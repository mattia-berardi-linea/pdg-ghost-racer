'use client';

import { useRaceStore } from '@/store/raceStore';

export default function ConditionsToggle() {
  const conditions = useRaceStore((s) => s.conditions);
  const setConditions = useRaceStore((s) => s.setConditions);

  const label =
    conditions === 0
      ? 'Normal conditions'
      : conditions > 0
      ? `+${conditions}% faster (firm snow / good grip)`
      : `${conditions}% slower (deep snow / poor conditions)`;

  const valueColor =
    conditions > 15 ? 'var(--mountain-green)'
    : conditions > 0 ? 'var(--glacier-400)'
    : conditions < -15 ? 'var(--alpine-400)'
    : 'var(--stone-400)';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--stone-400)' }}>
          Conditions
        </label>
        <span className="text-xs font-mono font-semibold" style={{ color: valueColor }}>
          {conditions > 0 ? `+${conditions}` : conditions}%
        </span>
      </div>
      <input
        type="range"
        min={-30}
        max={30}
        step={5}
        value={conditions}
        onChange={(e) => setConditions(Number(e.target.value))}
        className="w-full cursor-pointer"
        style={{ accentColor: 'var(--glacier-400)' }}
      />
      <div className="flex justify-between text-xs" style={{ color: 'var(--stone-500)' }}>
        <span>-30% (bad)</span>
        <span>0</span>
        <span>+30% (good)</span>
      </div>
      <p className="text-xs" style={{ color: 'var(--stone-500)' }}>{label}</p>
    </div>
  );
}
