import { ALTITUDE_PENALTY_BRACKETS } from './constants';

/**
 * Returns the altitude performance penalty factor for a given elevation (m).
 * 0–2500m  → 1.00 (no penalty)
 * 2500–3200m → 0.92 (-8%)
 * >3200m   → 0.85 (-15%, "Tête Blanche Effect")
 */
export function getAltitudePenaltyFactor(altitudeM: number): number {
  for (const bracket of ALTITUDE_PENALTY_BRACKETS) {
    if (altitudeM <= bracket.maxAlt) return bracket.factor;
  }
  return ALTITUDE_PENALTY_BRACKETS[ALTITUDE_PENALTY_BRACKETS.length - 1].factor;
}
