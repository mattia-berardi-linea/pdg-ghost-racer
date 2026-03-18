'use client';

import { useRaceStore } from '@/store/raceStore';

export default function StartTimeSelector() {
  const startTime = useRaceStore((s) => s.startTime);
  const setStartTime = useRaceStore((s) => s.setStartTime);

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">
        Start Time
      </label>
      <div className="flex items-center gap-2">
        <input
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-white text-sm font-mono w-28 focus:outline-none focus:border-blue-400"
        />
        <span className="text-gray-500 text-xs">Wave start (default 22:45)</span>
      </div>
    </div>
  );
}
