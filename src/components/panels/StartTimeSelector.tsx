'use client';

import { useState } from 'react';
import { useRaceStore } from '@/store/raceStore';

export default function StartTimeSelector() {
  const storeStartTime = useRaceStore((s) => s.startTime);
  const setStartTime = useRaceStore((s) => s.setStartTime);
  const [local, setLocal] = useState(storeStartTime);

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs" style={{ color: 'rgba(156,163,175,0.55)' }}>Wave start (default 22:45)</span>
      <input
        type="time"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={(e) => setStartTime(e.target.value)}
        className="font-data rounded-xl px-3 py-1.5 text-white text-sm w-28 outline-none border transition-colors"
        style={{
          background: 'rgba(255,255,255,0.05)',
          borderColor: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(91,165,214,0.5)')}
        onBlurCapture={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
      />
    </div>
  );
}
