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
      ? `+${local}% faster (firm snow)`
      : `${local}% slower (deep snow)`;

  const valueColor =
    local > 15 ? 'var(--mountain-green)'
    : local > 0 ? 'var(--glacier-400)'
    : local < -15 ? 'var(--alpine-400)'
    : 'rgba(156,163,175,0.7)';

  const pct = ((local + 30) / 60) * 100;
  const isPositive = local > 0;
  const isNeutral = local === 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: 'rgba(156,163,175,0.7)' }}>
          {label}
        </span>
        <span
          className="font-data text-sm font-semibold tabular-nums"
          style={{ color: valueColor }}
        >
          {local > 0 ? `+${local}` : local}%
        </span>
      </div>

      {/* Slider */}
      <div className="relative" style={{ height: '20px' }}>
        {/* Background track */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 rounded-full pointer-events-none"
          style={{ background: 'rgba(255,255,255,0.07)' }} />
        {/* Colored fill */}
        <div className="absolute top-1/2 -translate-y-1/2 h-1 rounded-full pointer-events-none"
          style={{
            left: 0,
            right: `${100 - pct}%`,
            background: isNeutral
              ? 'rgba(156,163,175,0.4)'
              : isPositive
              ? 'linear-gradient(90deg, rgba(74,222,128,0.3), var(--mountain-green))'
              : 'linear-gradient(90deg, var(--alpine-400), rgba(239,136,121,0.5))',
          }}
        />
        {/* Zero marker */}
        <div className="absolute w-0.5 h-3 rounded-full pointer-events-none"
          style={{ left: '50%', top: '50%', transform: 'translateX(-50%) translateY(-50%)', background: 'rgba(255,255,255,0.2)' }} />
        {/* Custom thumb — positioned via pct so it always sits exactly on the line */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: '16px',
            height: '16px',
            top: '50%',
            left: `${pct}%`,
            transform: 'translate(-50%, -50%)',
            background: 'var(--glacier-400)',
            boxShadow: '0 0 0 3px rgba(126, 185, 224, 0.2), 0 0 10px rgba(126, 185, 224, 0.35)',
            zIndex: 1,
          }}
        />
        {/* Native input — invisible, owns all drag/click interaction */}
        <input
          type="range"
          min={-30}
          max={30}
          step={1}
          value={local}
          onChange={(e) => setLocal(Number(e.target.value))}
          onPointerUp={(e) => setConditions(Number((e.target as HTMLInputElement).value))}
          className="absolute inset-0 w-full cursor-pointer"
          style={{ opacity: 0, height: '100%' }}
        />
      </div>

      <div className="flex justify-between items-center text-xs" style={{ color: 'rgba(107,114,128,0.8)' }}>
        <span>−30% bad</span>
        <button
          onClick={() => { setLocal(0); setConditions(0); }}
          className="px-2.5 py-0.5 rounded-full text-xs font-medium transition-all border hover:opacity-100 opacity-60"
          style={{
            background: 'rgba(255,255,255,0.04)',
            borderColor: 'rgba(255,255,255,0.1)',
            color: 'rgba(209,213,219,0.8)',
          }}
        >
          Reset
        </button>
        <span>+30% good</span>
      </div>
    </div>
  );
}
