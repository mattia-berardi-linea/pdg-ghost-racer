/**
 * Z2 Patrouille des Glaciers 2022 — reference section times.
 *
 * Derived from the official mso.swiss results for ALL 201 Z2 finishers
 * with complete checkpoint data (vs. previous top-10 only).
 * Each medianMs is the median inter-checkpoint elapsed time across all
 * complete finishers (position ≠ 999, all 11 intermediate checkpoints present).
 *
 * Total median: ~805 min ≈ 13h 25m  (typical PDG finisher — much better
 * calibration anchor for non-elite athletes than the previous 7h 30m
 * top-10 reference).
 *
 * Note: elapsed times include transition time at checkpoints. This is
 * acceptable — transitions for the median field are small relative to
 * moving time and average out across 201 finishers.
 */
export interface ReferenceSection {
  fromDistM: number;
  toDistM: number;
  label: string;
  medianMs: number; // median elapsed time for this section across all Z2 finishers
}

// ---------------------------------------------------------------------------
// NOTE: fromDistM / toDistM are in GPX-track metres (total 56 700 m), not
// the official race distances.  Intermediate points (Col de Bertol, Plans de
// Bertol, Les Ruinettes) are interpolated proportionally between confirmed
// GPX checkpoints.  Pas du Chat is GPX-located at 36 087 m / 2 480 m elev.
// Arolla→Riedmatten (S5→S6, 96.6 min median) is split at Combe du pas de
// Chèvres proportionally by GPX distance (86.4 % / 13.6 %).
// ---------------------------------------------------------------------------
export const REFERENCE_SECTIONS: ReferenceSection[] = [
  // Zermatt (0 m) → Schönbiel (13 970 m)
  { fromDistM:     0, toDistM: 13970, label: 'Zermatt → Schönbiel',               medianMs: 135.2 * 60_000 },
  // Schönbiel (13 970 m) → Tête Blanche (17 500 m)
  { fromDistM: 13970, toDistM: 17500, label: 'Schönbiel → Tête Blanche',          medianMs: 132.9 * 60_000 },
  // Tête Blanche (17 500 m) → Col de Bertol (~19 440 m, interpolated)
  { fromDistM: 17500, toDistM: 19440, label: 'Tête Blanche → Col de Bertol',      medianMs:  44.7 * 60_000 },
  // Col de Bertol (~19 440 m) → Plans de Bertol (~20 410 m, interpolated)
  { fromDistM: 19440, toDistM: 20410, label: 'Col de Bertol → Plans de Bertol',   medianMs:  15.3 * 60_000 },
  // Plans de Bertol (~20 410 m) → Arolla (29 150 m)
  { fromDistM: 20410, toDistM: 29150, label: 'Plans de Bertol → Arolla',          medianMs:  51.4 * 60_000 },
  // Arolla (29 150 m) → Combe du pas de Chèvres (33 100 m)
  // 86.4 % of the Arolla→Riedmatten CSV section (96.6 min) by GPX distance
  { fromDistM: 29150, toDistM: 33100, label: 'Arolla → Combe Chèvres',            medianMs:  83.5 * 60_000 },
  // Combe du pas de Chèvres (33 100 m) → Col de Riedmatten (33 720 m)
  // remaining 13.6 %
  { fromDistM: 33100, toDistM: 33720, label: 'Combe Chèvres → Col de Riedmatten', medianMs:  13.1 * 60_000 },
  // Col de Riedmatten (33 720 m) → Pas du Chat (36 087 m)
  { fromDistM: 33720, toDistM: 36087, label: 'Col de Riedmatten → Pas du Chat',   medianMs:  36.6 * 60_000 },
  // Pas du Chat (36 087 m) → Les Ecoulaies (41 050 m)
  { fromDistM: 36087, toDistM: 41050, label: 'Pas du Chat → Les Ecoulaies',       medianMs:  86.0 * 60_000 },
  // Les Ecoulaies (41 050 m) → Rosablanche (43 360 m)
  { fromDistM: 41050, toDistM: 43360, label: 'Les Ecoulaies → Rosablanche',       medianMs: 103.5 * 60_000 },
  // Rosablanche (43 360 m) → Col de la Chaux (47 480 m)
  { fromDistM: 43360, toDistM: 47480, label: 'Rosablanche → Col de la Chaux',     medianMs:  45.3 * 60_000 },
  // Col de la Chaux (47 480 m) → Les Ruinettes (~52 500 m, interpolated)
  { fromDistM: 47480, toDistM: 52500, label: 'Col de la Chaux → Les Ruinettes',   medianMs:  30.8 * 60_000 },
  // Les Ruinettes (~52 500 m) → Verbier (56 700 m)
  { fromDistM: 52500, toDistM: 56700, label: 'Les Ruinettes → Verbier',           medianMs:  27.2 * 60_000 },
];
