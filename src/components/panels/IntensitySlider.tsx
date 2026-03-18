'use client';

import { useRaceStore } from '@/store/raceStore';

export default function IntensitySlider() {
  const intensity = useRaceStore((s) => s.intensity);
  const setIntensity = useRaceStore((s) => s.setIntensity);

  const label =
    intensity === 0
      ? 'Race pace (neutral)'
      : intensity > 0
      ? `+${intensity}% faster than training`
      : `${intensity}% slower than training`;

  const valueColor =
    intensity > 20 ? 'var(--alpine-500)'
    : intensity > 0 ? 'var(--sunset-gold)'
    : intensity < -20 ? 'var(--glacier-400)'
    : 'var(--mountain-green)';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--stone-400)' }}>
          Intensity
        </label>
        <span className="text-xs font-mono font-semibold" style={{ color: valueColor }}>
          {intensity > 0 ? `+${intensity}` : intensity}%
        </span>
      </div>
      <input
        type="range"
        min={-50}
        max={50}
        step={5}
        value={intensity}
        onChange={(e) => setIntensity(Number(e.target.value))}
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
