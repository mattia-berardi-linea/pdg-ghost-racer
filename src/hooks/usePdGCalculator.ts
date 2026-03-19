'use client';

import { useEffect, useRef } from 'react';
import { useRaceStore } from '@/store/raceStore';
import { useCalculatorWorker } from '@/workers/workerBridge';
import { CHECKPOINTS } from '@/lib/constants';
import { deriveReferenceZoneSpeeds } from '@/lib/referenceCalibrator';
import type { SimulationResult, NormalizedProfile, SlopeZone } from '@/types';

/**
 * Scale factor applied to reference speeds when no GPX is uploaded.
 * Calibrated so the default profile produces ~12h total on the PdG course.
 * Derived empirically: at 1.096 the simulator returns 14h42 (882 min);
 * scaling linearly → 1.096 × (882−35)/(720−35) ≈ 1.355
 */
const DEFAULT_MULTIPLIER = 1.355;

const ZONES: SlopeZone[] = ['steep_climb', 'moderate_climb', 'flat', 'descent'];

/**
 * Orchestrates all simulation logic:
 * 1. When courseSegments load → derive reference zone speeds from Z2 median times
 * 2. When activities change → normalize profile via worker, then patch missing zones
 *    with reference speeds
 * 3. When profile/inputs change → run simulation via worker
 * 4. Updates store with all results
 */
export function usePdGCalculator() {
  const { post } = useCalculatorWorker();

  const parsedActivities = useRaceStore((s) => s.parsedActivities);
  const normalizedProfile = useRaceStore((s) => s.normalizedProfile);
  const courseSegments = useRaceStore((s) => s.courseSegments);
  const referenceZoneSpeeds = useRaceStore((s) => s.referenceZoneSpeeds);
  const startTime = useRaceStore((s) => s.startTime);
  const intensity = useRaceStore((s) => s.intensity);
  const conditions = useRaceStore((s) => s.conditions);
  const transitions = useRaceStore((s) => s.transitions);
  const targetTotalMs = useRaceStore((s) => s.targetTotalMs);

  const setNormalizedProfile = useRaceStore((s) => s.setNormalizedProfile);
  const setReferenceZoneSpeeds = useRaceStore((s) => s.setReferenceZoneSpeeds);
  const setSimulationResult = useRaceStore((s) => s.setSimulationResult);
  const setSimulationStatus = useRaceStore((s) => s.setSimulationStatus);
  const setTargetTotalMs = useRaceStore((s) => s.setTargetTotalMs);

  // Track whether we've derived reference speeds for the current course
  const refDerivedRef = useRef(false);

  // Step 1: Derive reference zone speeds when course loads
  useEffect(() => {
    if (!courseSegments || courseSegments.length === 0) return;
    if (refDerivedRef.current) return; // only once per course load

    refDerivedRef.current = true;
    const refSpeeds = deriveReferenceZoneSpeeds(courseSegments);
    setReferenceZoneSpeeds(refSpeeds);

    // If no activities uploaded, set profile to reference × DEFAULT_MULTIPLIER
    if (parsedActivities.length === 0) {
      const zoneSpeedMs = {} as Record<SlopeZone, number>;
      for (const z of ZONES) zoneSpeedMs[z] = refSpeeds[z] * DEFAULT_MULTIPLIER;
      setNormalizedProfile({
        zoneSpeedMs,
        activityCount: 0,
        activityDurationMs: 0,
        zonesWithData: [],
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseSegments]);

  // Step 2: Re-normalize profile when activities change
  useEffect(() => {
    if (parsedActivities.length === 0) return;

    post<{ id: string; type: 'PROFILE_RESULT'; result: NormalizedProfile }>({
      type: 'NORMALIZE_PROFILE',
      payload: { activities: parsedActivities },
    }).then((res) => {
      if (res.type !== 'PROFILE_RESULT') return;
      const profile = res.result;

      // GPX takes priority over any active target — let the measured speeds drive the estimate
      setTargetTotalMs(null);

      // Patch zones that have no measured data with reference speeds
      if (referenceZoneSpeeds && profile.zonesWithData.length < ZONES.length) {
        const patched = { ...profile.zoneSpeedMs };
        for (const z of ZONES) {
          if (!profile.zonesWithData.includes(z)) {
            patched[z] = referenceZoneSpeeds[z] * DEFAULT_MULTIPLIER;
          }
        }
        setNormalizedProfile({ ...profile, zoneSpeedMs: patched });
      } else {
        setNormalizedProfile(profile);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsedActivities]);

  // Step 3: Re-run simulation when any input changes
  useEffect(() => {
    if (!courseSegments || courseSegments.length === 0) return;

    setSimulationStatus('running');

    post<{ id: string; type: 'SIMULATION_RESULT'; result: SimulationResult }>({
      type: 'SIMULATE',
      payload: {
        profile: normalizedProfile,
        courseSegments,
        checkpoints: CHECKPOINTS,
        startTimeStr: startTime,
        intensityFactor: 1 + intensity / 100,
        conditionsFactor: 1 + conditions / 100,
        transitions,
        activityDurationMs: normalizedProfile.activityDurationMs,
        targetTotalMs: targetTotalMs ?? undefined,
      },
    }).then((res) => {
      if (res.type === 'SIMULATION_RESULT') {
        setSimulationResult(res.result);
        setSimulationStatus('done');
      } else if (res.type === 'ERROR') {
        console.error('[Simulation error]', (res as unknown as { message: string }).message);
        setSimulationStatus('error');
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedProfile, courseSegments, startTime, intensity, conditions, transitions, targetTotalMs]);
}
