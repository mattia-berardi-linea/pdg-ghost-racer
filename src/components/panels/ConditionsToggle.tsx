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

  const color =
    conditions > 20 ? '#f59e0b' : conditions > 0 ? '#22c55e' : conditions < -20 ? '#3b82f6' : '#22c55e';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
          Conditions
        </label>
        <span className="text-xs font-mono" style={{ color }}>
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
        className="w-full accent-blue-400 cursor-pointer"
      />
      <div className="flex justify-between text-xs text-gray-600">
        <span>-30% (bad)</span>
        <span>0</span>
        <span>+30% (good)</span>
      </div>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
