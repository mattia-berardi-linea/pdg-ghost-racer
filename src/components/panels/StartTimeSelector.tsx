'use client';

import { useRaceStore } from '@/store/raceStore';

export default function StartTimeSelector() {
  const startTime = useRaceStore((s) => s.startTime);
  const setStartTime = useRaceStore((s) => s.setStartTime);

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold uppercase tracking-wider block" style={{ color: 'var(--stone-400)' }}>
        Start Time
      </label>
      <div className="flex items-center gap-2">
        <input
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="rounded px-2 py-1.5 text-white text-sm font-mono w-28 outline-none border"
          style={{
            background: 'var(--navy-800)',
            borderColor: 'var(--navy-700)',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--glacier-500)')}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--navy-700)')}
        />
        <span className="text-xs" style={{ color: 'var(--stone-500)' }}>Wave start (default 22:45)</span>
      </div>
    </div>
  );
}
