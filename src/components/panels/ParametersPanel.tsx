'use client';

import GpxDropzone from './GpxDropzone';
import StartTimeSelector from './StartTimeSelector';
import IntensitySlider from './IntensitySlider';
import ConditionsToggle from './ConditionsToggle';
import TransitionsManager from './TransitionsManager';
import { useRaceStore } from '@/store/raceStore';
import { formatDuration } from '@/lib/timeUtils';

export default function ParametersPanel() {
  const simulationResult = useRaceStore((s) => s.simulationResult);
  const simulationStatus = useRaceStore((s) => s.simulationStatus);
  const normalizedProfile = useRaceStore((s) => s.normalizedProfile);

  return (
    <div className="flex flex-col gap-5 h-full overflow-y-auto px-1">
      {/* Summary header */}
      <div className="bg-gray-800/60 rounded-lg p-3 border border-gray-700">
        <div className="text-xs text-gray-400 mb-1">Estimated Finish</div>
        {simulationStatus === 'running' ? (
          <div className="text-gray-500 text-sm animate-pulse">Calculating…</div>
        ) : simulationResult ? (
          <div>
            <div className="text-2xl font-bold font-mono text-white">
              {simulationResult.finishClock}
            </div>
            <div className="text-xs text-gray-400">
              Total: {formatDuration(simulationResult.totalDurationMs)}
            </div>
          </div>
        ) : (
          <div className="text-gray-600 text-sm">—</div>
        )}
        {normalizedProfile.activityCount === 0 && (
          <div className="text-xs text-amber-500/80 mt-1">Using default profile</div>
        )}
        {normalizedProfile.activityCount > 0 && (
          <div className="text-xs text-blue-400/80 mt-1">
            Profile from {normalizedProfile.activityCount} GPX file{normalizedProfile.activityCount > 1 ? 's' : ''}
          </div>
        )}
      </div>

      <div className="border-t border-gray-800" />
      <GpxDropzone />
      <div className="border-t border-gray-800" />
      <StartTimeSelector />
      <div className="border-t border-gray-800" />
      <IntensitySlider />
      <div className="border-t border-gray-800" />
      <ConditionsToggle />
      <div className="border-t border-gray-800" />
      <TransitionsManager />
    </div>
  );
}
