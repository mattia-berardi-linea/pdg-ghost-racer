/**
 * Derives reference zone speeds (m/s) from the Z2 top-10 median section times
 * and the actual course segments via least-squares regression.
 *
 * Model:  time_section_i = Σ_z (distance_z_i / speed_z)
 *
 * Let x[z] = 1/speed[z] (pace in s/m).  Then:
 *   b[i] = Σ_z  A[i][z] * x[z]   where A[i][z] = metres of zone z in section i.
 *
 * Solve the 12×4 system in the least-squares sense via the 4×4 normal equations:
 *   (A^T A) x = A^T b
 * using Gaussian elimination with partial pivoting.
 *
 * Results are then clamped to physiologically reasonable bounds.
 */

import type { CourseSegment, SlopeZone } from '@/types';
import { REFERENCE_SECTIONS } from '@/data/referenceRace';

const ZONES: SlopeZone[] = ['steep_climb', 'moderate_climb', 'flat', 'descent'];
const ZONE_IDX: Record<SlopeZone, number> = {
  steep_climb: 0, moderate_climb: 1, flat: 2, descent: 3,
};

// Physiological clamps (m/s) — prevents degenerate solutions
const CLAMP: Record<SlopeZone, [number, number]> = {
  steep_climb:    [0.30, 2.00],
  moderate_climb: [0.50, 3.00],
  flat:           [0.80, 5.00],
  descent:        [1.00, 8.00],
};

/**
 * Build the A matrix (numSections × 4) where each row is the zone-distance breakdown
 * for one reference section.  b is the section time in seconds.
 */
function buildSystem(
  segments: CourseSegment[]
): { A: number[][]; b: number[] } {
  const nSections = REFERENCE_SECTIONS.length;
  const A: number[][] = Array.from({ length: nSections }, () => [0, 0, 0, 0]);
  const b: number[] = new Array(nSections).fill(0);

  for (let i = 0; i < nSections; i++) {
    const ref = REFERENCE_SECTIONS[i];
    b[i] = ref.medianMs / 1000; // convert ms → s

    for (const seg of segments) {
      const segStart = seg.cumulativeDistanceM - seg.distanceM;
      const segEnd   = seg.cumulativeDistanceM;

      // Overlap of [segStart, segEnd] with [ref.fromDistM, ref.toDistM]
      const lo = Math.max(segStart, ref.fromDistM);
      const hi = Math.min(segEnd,   ref.toDistM);
      if (hi <= lo) continue;

      const overlapFraction = (hi - lo) / seg.distanceM;
      A[i][ZONE_IDX[seg.zone]] += seg.distanceM * overlapFraction;
    }
  }

  return { A, b };
}

/**
 * Solve 4×4 system via Gaussian elimination with partial pivoting.
 * Returns solution vector x (length 4).
 */
function solveGaussian(M: number[][], rhs: number[]): number[] {
  const n = 4;
  // Augmented matrix [M | rhs]
  const aug = M.map((row, i) => [...row, rhs[i]]);

  for (let col = 0; col < n; col++) {
    // Partial pivot: find row with max absolute value in column
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) maxRow = row;
    }
    [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];

    if (Math.abs(aug[col][col]) < 1e-12) continue; // singular column — skip

    // Eliminate below
    for (let row = col + 1; row < n; row++) {
      const factor = aug[row][col] / aug[col][col];
      for (let k = col; k <= n; k++) {
        aug[row][k] -= factor * aug[col][k];
      }
    }
  }

  // Back-substitution
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    if (Math.abs(aug[i][i]) < 1e-12) { x[i] = 0; continue; }
    x[i] = aug[i][n];
    for (let j = i + 1; j < n; j++) x[i] -= aug[i][j] * x[j];
    x[i] /= aug[i][i];
  }
  return x;
}

/**
 * Derive reference zone speeds from the course segments and the Z2 median section times.
 * Returns a map of zone → speed in m/s.
 */
export function deriveReferenceZoneSpeeds(
  segments: CourseSegment[]
): Record<SlopeZone, number> {
  const { A, b } = buildSystem(segments);

  // Normal equations: (A^T A) x = A^T b
  const At = transpose(A);
  const AtA = multiplyMM(At, A);
  const Atb = multiplyMv(At, b);

  const paceSperM = solveGaussian(AtA, Atb);

  // Convert pace → speed, apply clamps
  const result = {} as Record<SlopeZone, number>;
  for (const zone of ZONES) {
    const idx = ZONE_IDX[zone];
    const pace = paceSperM[idx];
    const rawSpeed = pace > 1e-6 ? 1 / pace : CLAMP[zone][1];
    result[zone] = Math.max(CLAMP[zone][0], Math.min(CLAMP[zone][1], rawSpeed));
  }
  return result;
}

// --- Small matrix helpers ---

function transpose(M: number[][]): number[][] {
  const rows = M.length, cols = M[0].length;
  return Array.from({ length: cols }, (_, c) =>
    Array.from({ length: rows }, (__, r) => M[r][c])
  );
}

function multiplyMM(A: number[][], B: number[][]): number[][] {
  const r = A.length, inner = B.length, c = B[0].length;
  return Array.from({ length: r }, (_, i) =>
    Array.from({ length: c }, (__, j) =>
      Array.from({ length: inner }, (___, k) => A[i][k] * B[k][j])
        .reduce((s, v) => s + v, 0)
    )
  );
}

function multiplyMv(A: number[][], v: number[]): number[] {
  return A.map((row) => row.reduce((s, a, k) => s + a * v[k], 0));
}
