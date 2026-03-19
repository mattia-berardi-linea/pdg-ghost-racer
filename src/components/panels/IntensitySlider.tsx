'use client';

import { useState } from 'react';
import { useRaceStore } from '@/store/raceStore';

export default function IntensitySlider() {
  const storeIntensity = useRaceStore((s) => s.intensity);
  const setIntensity = useRaceStore((s) => s.setIntensity);
  const [local, setLocal] = useState(storeIntensity);

  const label =
    local === 0
      ? 'Race pace (neutral)'
      : local > 0
      ? `+${local}% faster than training`
      : `${local}% slower than training`;

  const valueColor =
    local > 20 ? 'var(--alpine-500)'
    : local > 0 ? 'var(--sunset-gold)'
    : local < -20 ? 'var(--glacier-400)'
    : 'var(--mountain-green)';

  // Track fill percentage (0-100 mapped from -50/+50)
  const pct = ((local + 50) / 100) * 100;
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

      {/* Slider + track */}
      <div className="relative">
        {/* Filled track */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 rounded-full pointer-events-none"
          style={{ background: 'rgba(255,255,255,0.07)' }} />
        {/* Filled portion */}
        <div className="absolute top-1/2 -translate-y-1/2 h-1 rounded-full pointer-events-none"
          style={{
            left: isPositive ? '50%' : `${pct}%`,
            right: isPositive ? `${100 - pct}%` : '50%',
            background: isNeutral
              ? 'var(--mountain-green)'
              : isPositive
              ? 'linear-gradient(90deg, rgba(251,191,36,0.6), var(--sunset-gold))'
              : 'linear-gradient(90deg, var(--glacier-400), rgba(126,185,224,0.6))',
          }}
        />
        {/* Zero marker */}
        <div className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3 rounded-full pointer-events-none"
          style={{ left: '50%', transform: 'translateX(-50%) translateY(-50%)', background: 'rgba(255,255,255,0.2)' }} />
        <input
          type="range"
          min={-50}
          max={50}
          step={1}
          value={local}
          onChange={(e) => setLocal(Number(e.target.value))}
          onPointerUp={(e) => setIntensity(Number((e.target as HTMLInputElement).value))}
          className="relative w-full"
          style={{ accentColor: 'var(--glacier-400)' }}
        />
      </div>

      <div className="flex justify-between items-center text-xs" style={{ color: 'rgba(107,114,128,0.8)' }}>
        <span>−50%</span>
        <button
          onClick={() => { setLocal(0); setIntensity(0); }}
          className="px-2.5 py-0.5 rounded-full text-xs font-medium transition-all border hover:opacity-100 opacity-60"
          style={{
            background: 'rgba(255,255,255,0.04)',
            borderColor: 'rgba(255,255,255,0.1)',
            color: 'rgba(209,213,219,0.8)',
          }}
        >
          Reset
        </button>
        <span>+50%</span>
      </div>
    </div>
  );
}
