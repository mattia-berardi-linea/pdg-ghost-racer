/**
 * Z2 (elite) Patrouille des Glaciers 2022 — reference section times.
 *
 * Derived from the official mso.swiss results for the top-10 Z2 finishers.
 * Each medianMs is the median inter-checkpoint time across the top 10,
 * excluding obvious data errors (finishers #4 and #6 for sections 3 & 4
 * showed Plans de Bertol times later than their Arolla time).
 *
 * Total median: ~449.8 min ≈ 7h 30m  (winner was ~6h 36m; median is better
 * for calibration as it averages out transition-time variability).
 */
export interface ReferenceSection {
  fromDistM: number;
  toDistM: number;
  label: string;
  medianMs: number; // median moving time for this section across Z2 top-10
}

// ---------------------------------------------------------------------------
// NOTE: fromDistM / toDistM are in GPX-track metres (total 56 700 m), not
// the official race distances.  Intermediate points (Col de Bertol, Plans de
// Bertol, Les Ruinettes) are interpolated proportionally between confirmed
// GPX checkpoints.  medianMs values are unchanged — they come from Z2 timing.
// ---------------------------------------------------------------------------
export const REFERENCE_SECTIONS: ReferenceSection[] = [
  // Zermatt (0 m) → Schönbiel (13 970 m)
  { fromDistM:     0, toDistM: 13970, label: 'Zermatt → Schönbiel',             medianMs:  87.10 * 60_000 },
  // Schönbiel (13 970 m) → Tête Blanche (17 500 m)
  { fromDistM: 13970, toDistM: 17500, label: 'Schönbiel → Tête Blanche',        medianMs:  78.02 * 60_000 },
  // Tête Blanche (17 500 m) → Col de Bertol (~19 440 m, interpolated)
  { fromDistM: 17500, toDistM: 19440, label: 'Tête Blanche → Col de Bertol',    medianMs:  22.33 * 60_000 },
  // Col de Bertol (~19 440 m) → Plans de Bertol (~20 410 m, interpolated)
  { fromDistM: 19440, toDistM: 20410, label: 'Col de Bertol → Plans de Bertol', medianMs:   7.84 * 60_000 },
  // Plans de Bertol (~20 410 m) → Arolla (29 150 m)
  { fromDistM: 20410, toDistM: 29150, label: 'Plans de Bertol → Arolla',        medianMs:  28.68 * 60_000 },
  // Arolla (29 150 m) → Col de Riedmatten (33 720 m)
  { fromDistM: 29150, toDistM: 33720, label: 'Arolla → Col de Riedmatten',      medianMs:  56.37 * 60_000 },
  // Col de Riedmatten (33 720 m) → Pas du Chat (33 820 m) — adjacent cols on same ridge
  { fromDistM: 33720, toDistM: 33820, label: 'Col de Riedmatten → Pas du Chat', medianMs:  18.01 * 60_000 },
  // Pas du Chat (33 820 m) → La Barma (40 730 m)
  { fromDistM: 33820, toDistM: 40730, label: 'Pas du Chat → La Barma',          medianMs:  40.95 * 60_000 },
  // La Barma (40 730 m) → Rosablanche (43 360 m)
  { fromDistM: 40730, toDistM: 43360, label: 'La Barma → Rosablanche',          medianMs:  57.51 * 60_000 },
  // Rosablanche (43 360 m) → Col de la Chaux (47 480 m)
  { fromDistM: 43360, toDistM: 47480, label: 'Rosablanche → Col de la Chaux',   medianMs:  25.41 * 60_000 },
  // Col de la Chaux (47 480 m) → Les Ruinettes (~52 500 m, interpolated)
  { fromDistM: 47480, toDistM: 52500, label: 'Col de la Chaux → Les Ruinettes', medianMs:  14.19 * 60_000 },
  // Les Ruinettes (~52 500 m) → Verbier (56 700 m)
  { fromDistM: 52500, toDistM: 56700, label: 'Les Ruinettes → Verbier',         medianMs:  13.40 * 60_000 },
];
