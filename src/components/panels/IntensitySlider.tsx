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

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--stone-400)' }}>
          Intensity
        </label>
        <span className="text-xs font-mono font-semibold" style={{ color: valueColor }}>
          {local > 0 ? `+${local}` : local}%
        </span>
      </div>
      <input
        type="range"
        min={-50}
        max={50}
        step={1}
        value={local}
        onChange={(e) => setLocal(Number(e.target.value))}
        onPointerUp={(e) => setIntensity(Number((e.target as HTMLInputElement).value))}
        className="w-full cursor-pointer"
        style={{ accentColor: 'var(--glacier-400)' }}
      />
      <div className="flex justify-between text-xs" style={{ color: 'var(--stone-500)' }}>
        <span>-50% (easy)</span>
        <span>0</span>
        <span>+50% (max)</span>
      </div>
      <p className="text-xs" style={{ color: 'var(--stone-500)' }}>{label}</p>
    </div>
  );
}
