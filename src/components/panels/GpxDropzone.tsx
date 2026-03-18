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
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--stone-400)' }}>
          GPX Files
        </span>
        <span className="text-xs font-mono" style={{ color: 'var(--stone-500)' }}>{slotsUsed}/5</span>
      </div>

      {/* Uploaded files list */}
      {parsedActivities.map((act) => (
        <div
          key={act.fileName}
          className="flex items-center justify-between rounded-lg px-3 py-2 text-xs border"
          style={{ background: 'var(--navy-800)', borderColor: 'var(--navy-700)' }}
        >
          <span className="truncate max-w-[150px] font-medium" style={{ color: 'var(--glacier-400)' }}>
            {act.fileName}
          </span>
          <span className="mx-2" style={{ color: 'var(--stone-500)' }}>
            {act.totalDistanceKm.toFixed(1)}km / {Math.round(act.totalElevationGainM)}m D+
          </span>
          <button
            onClick={() => removeActivity(act.fileName)}
            className="transition-colors"
            style={{ color: 'var(--stone-500)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--alpine-400)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--stone-500)')}
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
          className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all"
          style={{
            borderColor: dragging ? 'var(--glacier-400)' : 'var(--navy-600)',
            background: dragging ? 'rgba(91,165,214,0.08)' : 'transparent',
          }}
          onMouseEnter={(e) => {
            if (!dragging) (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--navy-500, var(--navy-600))';
          }}
          onMouseLeave={(e) => {
            if (!dragging) (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--navy-600)';
          }}
        >
          <p className="text-xs leading-relaxed" style={{ color: 'var(--stone-400)' }}>
            Drop up to 5 representative training activities here
            <br />
            <span style={{ color: 'var(--stone-500)' }}>to estimate your PdG race time</span>
            <br />
            <span style={{ color: 'var(--stone-600)' }}>or click to browse</span>
          </p>
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

      {error && <p className="text-xs" style={{ color: 'var(--alpine-400)' }}>{error}</p>}

    </div>
  );
}
