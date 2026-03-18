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

  const color =
    intensity > 20 ? '#ef4444' : intensity > 0 ? '#f59e0b' : intensity < -20 ? '#3b82f6' : '#22c55e';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
          Intensity
        </label>
        <span className="text-xs font-mono" style={{ color }}>
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
        className="w-full accent-blue-400 cursor-pointer"
      />
      <div className="flex justify-between text-xs text-gray-600">
        <span>-50% (easy)</span>
        <span>0</span>
        <span>+50% (max)</span>
      </div>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
