'use client';

import { useCallback } from 'react';
import { parseGpxFile } from '@/lib/gpxParser';
import { useRaceStore } from '@/store/raceStore';

export function useGpxParser() {
  const addActivity = useRaceStore((s) => s.addActivity);
  const parsedActivities = useRaceStore((s) => s.parsedActivities);

  const parseAndAdd = useCallback(
    async (files: File[]): Promise<{ success: string[]; errors: string[] }> => {
      const remaining = 5 - parsedActivities.length;
      const toProcess = files.slice(0, remaining);

      const success: string[] = [];
      const errors: string[] = [];

      await Promise.all(
        toProcess.map(async (file) => {
          try {
            const activity = await parseGpxFile(file);
            addActivity(activity);
            success.push(file.name);
          } catch (err) {
            errors.push(`${file.name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
        })
      );

      return { success, errors };
    },
    [addActivity, parsedActivities.length]
  );

  return { parseAndAdd };
}
