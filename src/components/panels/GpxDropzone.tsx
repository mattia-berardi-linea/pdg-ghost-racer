'use client';

import { useRef, useState, useCallback } from 'react';
import { useRaceStore } from '@/store/raceStore';
import { useGpxParser } from '@/hooks/useGpxParser';

export default function GpxDropzone() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedActivities = useRaceStore((s) => s.parsedActivities);
  const removeActivity = useRaceStore((s) => s.removeActivity);
  const { parseAndAdd } = useGpxParser();

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      setError(null);
      const gpxFiles = Array.from(files).filter((f) => f.name.endsWith('.gpx'));
      if (gpxFiles.length === 0) {
        setError('Only .gpx files are supported.');
        return;
      }
      const { errors } = await parseAndAdd(gpxFiles);
      if (errors.length > 0) setError(errors[0]);
    },
    [parseAndAdd]
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const slotsUsed = parsedActivities.length;
  const slotsLeft = 5 - slotsUsed;

  return (
    <div className="space-y-2">
      {/* Uploaded files list */}
      {parsedActivities.map((act) => (
        <div
          key={act.fileName}
          className="flex items-center justify-between rounded-xl px-3 py-2 text-xs border transition-colors group"
          style={{
            background: 'rgba(91,165,214,0.06)',
            borderColor: 'rgba(91,165,214,0.18)',
          }}
        >
          <span className="truncate max-w-[140px] font-medium" style={{ color: 'var(--glacier-400)' }}>
            {act.fileName}
          </span>
          <span className="mx-2 font-data tabular-nums" style={{ color: 'rgba(156,163,175,0.55)' }}>
            {act.totalDistanceKm.toFixed(1)} km · {Math.round(act.totalElevationGainM)} m
          </span>
          <button
            onClick={() => removeActivity(act.fileName)}
            className="opacity-40 hover:opacity-100 transition-opacity rounded-full w-5 h-5 flex items-center justify-center text-base leading-none"
            style={{ color: 'var(--alpine-400)' }}
            aria-label="Remove"
          >
            ×
          </button>
        </div>
      ))}

      {/* Drop zone */}
      {slotsLeft > 0 && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all duration-200"
          style={{
            borderColor: dragging ? 'rgba(91,165,214,0.6)' : 'rgba(255,255,255,0.1)',
            background: dragging ? 'rgba(91,165,214,0.06)' : 'rgba(255,255,255,0.02)',
          }}
          onMouseEnter={(e) => {
            if (!dragging) (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.2)';
            if (!dragging) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)';
          }}
          onMouseLeave={(e) => {
            if (!dragging) (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.1)';
            if (!dragging) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.02)';
          }}
        >
          <div className="text-2xl mb-2 opacity-40">↑</div>
          <p className="text-xs leading-relaxed" style={{ color: 'rgba(156,163,175,0.7)' }}>
            Drop training GPX files here
          </p>
          <p className="text-xs mt-1" style={{ color: 'rgba(107,114,128,0.6)' }}>
            Up to 5 activities · click to browse
          </p>
          <div className="mt-2 font-data text-xs"
            style={{ color: 'rgba(91,165,214,0.5)' }}>
            {slotsUsed}/5 slots used
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".gpx"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
        </div>
      )}

      {error && (
        <p className="text-xs px-3 py-2 rounded-lg border"
          style={{
            color: 'var(--alpine-400)',
            background: 'rgba(214,79,61,0.08)',
            borderColor: 'rgba(214,79,61,0.2)',
          }}>
          {error}
        </p>
      )}
    </div>
  );
}
