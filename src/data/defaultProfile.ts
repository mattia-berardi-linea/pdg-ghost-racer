import type { NormalizedProfile } from '@/types';

/**
 * Default performance profile derived from Trophée du St-Bernard result:
 * 4h50m / 24km / 2500m D+
 *
 * This produces approximately 12h15m on the PdG course at neutral
 * intensity and conditions settings.
 */
export const DEFAULT_PROFILE: NormalizedProfile = {
  zoneSpeedMs: {
    steep_climb: 0.56, // ~2.0 km/h (>15% grade)
    moderate_climb: 0.94, // ~3.4 km/h (5–15% grade)
    flat: 1.50, // ~5.4 km/h (-5% to +5% grade)
    descent: 2.22, // ~8.0 km/h (<-5% grade)
  },
  activityCount: 0, // 0 = using default (no GPX uploaded)
  activityDurationMs: 0,
  zonesWithData: [],
};
