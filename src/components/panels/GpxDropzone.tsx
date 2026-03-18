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
        <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">GPX Files</span>
        <span className="text-xs text-gray-500">{slotsUsed}/5</span>
      </div>

      {/* Uploaded files list */}
      {parsedActivities.map((act) => (
        <div
          key={act.fileName}
          className="flex items-center justify-between bg-gray-800 rounded px-2 py-1.5 text-xs"
        >
          <span className="text-blue-400 truncate max-w-[160px]">{act.fileName}</span>
          <span className="text-gray-500 mx-2">
            {act.totalDistanceKm.toFixed(1)}km / {Math.round(act.totalElevationGainM)}m D+
          </span>
          <button
            onClick={() => removeActivity(act.fileName)}
            className="text-gray-600 hover:text-red-400 transition-colors ml-1"
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
          className={`
            border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
            ${dragging ? 'border-blue-400 bg-blue-900/20' : 'border-gray-600 hover:border-gray-500'}
          `}
        >
          <p className="text-gray-400 text-xs">
            Drop .gpx file{slotsLeft > 1 ? 's' : ''} here
            <br />
            <span className="text-gray-600">or click to browse</span>
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

      {error && <p className="text-red-400 text-xs">{error}</p>}

      {slotsUsed === 0 && (
        <p className="text-gray-600 text-xs">
          Using default profile (TSB 4h50m baseline)
        </p>
      )}
    </div>
  );
}
