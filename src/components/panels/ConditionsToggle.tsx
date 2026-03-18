'use client';

import { useRaceStore } from '@/store/raceStore';

const OPTIONS = [
  { value: -30, label: 'Deep powder', emoji: '❄️', color: '#60a5fa' },
  { value: 0,   label: 'Normal',      emoji: '⛅', color: '#22c55e' },
  { value: 30,  label: 'Icy fast',    emoji: '🔥', color: '#f59e0b' },
];

export default function ConditionsToggle() {
  const conditions = useRaceStore((s) => s.conditions);
  const setConditions = useRaceStore((s) => s.setConditions);

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">
        Snow Conditions
      </label>
      <div className="flex gap-1">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setConditions(opt.value)}
            className={`
              flex-1 py-1.5 px-1 rounded text-xs font-medium transition-all border
              ${conditions === opt.value
                ? 'border-transparent text-gray-900'
                : 'border-gray-700 text-gray-400 hover:border-gray-500'}
            `}
            style={
              conditions === opt.value
                ? { background: opt.color, color: '#111' }
                : {}
            }
          >
            <span className="block text-base">{opt.emoji}</span>
            <span className="block leading-tight">{opt.label}</span>
            <span className="block text-xs opacity-70">
              {opt.value === 0 ? '±0%' : `${opt.value > 0 ? '+' : ''}${opt.value}%`}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
