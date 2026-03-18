import { create } from 'zustand';
import type { ParsedActivity, NormalizedProfile, CourseSegment, SimulationResult, SlopeZone } from '@/types';
import { CHECKPOINTS, DEFAULT_START_TIME } from '@/lib/constants';
import { DEFAULT_PROFILE } from '@/data/defaultProfile';

// Build default transitions from checkpoint definitions
const buildDefaultTransitions = (): Record<string, number> => {
  const t: Record<string, number> = {};
  for (const cp of CHECKPOINTS) {
    t[cp.id] = cp.defaultTransitionMin;
  }
  return t;
};

interface RaceStore {
  // --- User inputs ---
  parsedActivities: ParsedActivity[];
  startTime: string;
  intensity: number; // -50 to +50
  conditions: number; // -30 | 0 | +30
  transitions: Record<string, number>; // checkpointId → minutes

  // --- Computed ---
  normalizedProfile: NormalizedProfile;
  courseSegments: CourseSegment[] | null;
  referenceZoneSpeeds: Record<SlopeZone, number> | null; // derived from Z2 median times
  simulationResult: SimulationResult | null;
  simulationStatus: 'idle' | 'running' | 'done' | 'error';

  // --- UI ---
  scrubberDistanceM: number; // drives ghost position on map
  selectedCheckpointId: string | null;

  // --- Actions ---
  addActivity: (activity: ParsedActivity) => void;
  removeActivity: (fileName: string) => void;
  setStartTime: (time: string) => void;
  setIntensity: (value: number) => void;
  setConditions: (value: number) => void;
  setTransition: (checkpointId: string, minutes: number) => void;
  setNormalizedProfile: (profile: NormalizedProfile) => void;
  setCourseSegments: (segments: CourseSegment[]) => void;
  setReferenceZoneSpeeds: (speeds: Record<SlopeZone, number>) => void;
  setSimulationResult: (result: SimulationResult) => void;
  setSimulationStatus: (status: RaceStore['simulationStatus']) => void;
  setScrubberDistance: (distM: number) => void;
  selectCheckpoint: (id: string | null) => void;
}

export const useRaceStore = create<RaceStore>((set) => ({
  // --- Defaults ---
  parsedActivities: [],
  startTime: DEFAULT_START_TIME,
  intensity: 0,
  conditions: 0,
  transitions: buildDefaultTransitions(),

  normalizedProfile: DEFAULT_PROFILE,
  courseSegments: null,
  referenceZoneSpeeds: null,
  simulationResult: null,
  simulationStatus: 'idle',

  scrubberDistanceM: 0,
  selectedCheckpointId: null,

  // --- Actions ---
  addActivity: (activity) =>
    set((state) => ({
      parsedActivities: [...state.parsedActivities.slice(0, 4), activity], // max 5
    })),

  removeActivity: (fileName) =>
    set((state) => ({
      parsedActivities: state.parsedActivities.filter((a) => a.fileName !== fileName),
    })),

  setStartTime: (time) => set({ startTime: time }),
  setIntensity: (value) => set({ intensity: Math.max(-50, Math.min(50, value)) }),
  setConditions: (value) => set({ conditions: value }),

  setTransition: (checkpointId, minutes) =>
    set((state) => ({
      transitions: { ...state.transitions, [checkpointId]: Math.max(0, minutes) },
    })),

  setNormalizedProfile: (profile) => set({ normalizedProfile: profile }),
  setCourseSegments: (segments) => set({ courseSegments: segments }),
  setReferenceZoneSpeeds: (speeds) => set({ referenceZoneSpeeds: speeds }),
  setSimulationResult: (result) => set({ simulationResult: result }),
  setSimulationStatus: (status) => set({ simulationStatus: status }),
  setScrubberDistance: (distM) => set({ scrubberDistanceM: distM }),
  selectCheckpoint: (id) => set({ selectedCheckpointId: id }),
}));
