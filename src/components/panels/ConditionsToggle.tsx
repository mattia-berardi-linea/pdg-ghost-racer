'use client';

import { useState } from 'react';
import { useRaceStore } from '@/store/raceStore';

export default function ConditionsToggle() {
  const storeConditions = useRaceStore((s) => s.conditions);
  const setConditions = useRaceStore((s) => s.setConditions);
  const [local, setLocal] = useState(storeConditions);

  const label =
    local === 0
      ? 'Normal conditions'
      : local > 0
      ? `+${local}% faster (firm snow / good grip)`
      : `${local}% slower (deep snow / poor conditions)`;

  const valueColor =
    local > 15 ? 'var(--mountain-green)'
    : local > 0 ? 'var(--glacier-400)'
    : local < -15 ? 'var(--alpine-400)'
    : 'var(--stone-400)';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--stone-400)' }}>
          Conditions
        </label>
        <span className="text-xs font-mono font-semibold" style={{ color: valueColor }}>
          {local > 0 ? `+${local}` : local}%
        </span>
      </div>
      <input
        type="range"
        min={-30}
        max={30}
        step={1}
        value={local}
        onChange={(e) => setLocal(Number(e.target.value))}
        onPointerUp={(e) => setConditions(Number((e.target as HTMLInputElement).value))}
        className="w-full cursor-pointer"
        style={{ accentColor: 'var(--glacier-400)' }}
      />
      <div className="flex justify-between text-xs" style={{ color: 'var(--stone-500)' }}>
        <span>-30% (bad)</span>
        <button onClick={() => { setLocal(0); setConditions(0); }} className="hover:opacity-100 opacity-60 underline decoration-dashed underline-offset-2 cursor-pointer">0</button>
        <span>+30% (good)</span>
      </div>
      <p className="text-xs" style={{ color: 'var(--stone-500)' }}>{label}</p>
    </div>
  );
}
