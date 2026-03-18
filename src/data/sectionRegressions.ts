/**
 * Linear regression coefficients for each inter-checkpoint section.
 *
 * Derived from all 201 complete Z2 2022 finishers (no DNF / DSQ,
 * all 11 intermediate checkpoints present).
 *
 * Model:  section_time_min = intercept + slope × total_race_time_min
 *
 * "total_race_time_min" is the full elapsed time including transitions.
 * Section times are also elapsed (arrival-to-arrival), so typical
 * transition time at the start of each section is baked into the intercept.
 *
 * Sections that match a CSV checkpoint column directly use OLS on raw data.
 * Stöckji (no CSV column) is a proportional split of the Z→Schönbiel
 * regression by GPX distance (6.15 / 13.97 = 44.0 %).
 * Combe du pas de Chèvres and Col de Riedmatten are proportional splits of
 * the Arolla→Riedmatten regression (86.4 % / 13.6 % by GPX distance).
 * Verbier combines the Chaux→Ruinettes and Ruinettes→Verbier regressions
 * (Les Ruinettes is not an app checkpoint).
 *
 * Keyed by the *arriving* checkpoint id.
 */
export const SECTION_REGRESSIONS: Record<string, { intercept: number; slope: number }> = {
  // 44.0 % of Z→Schönbiel regression (GPX 0 → 6 150 m)
  stockji:         { intercept:  11.0710, slope: 0.060571 },
  // remaining 56.0 % of Z→Schönbiel (GPX 6 150 → 13 970 m)
  schonbiel:       { intercept:  14.0773, slope: 0.077018 },
  // direct CSV: Schönbiel (S1) → Tête Blanche (S2)
  tete_blanche:    { intercept:   5.3037, slope: 0.159628 },
  // direct CSV: Tête Blanche (S2) → Arolla (S5) — via Col de Bertol & Plans de Bertol
  arolla:          { intercept:  -0.0766, slope: 0.138022 },
  // 86.4 % of Arolla→Riedmatten regression (GPX 29 150 → 33 100 m)
  combe_chevres:   { intercept:   7.7805, slope: 0.091611 },
  // remaining 13.6 % of Arolla→Riedmatten (GPX 33 100 → 33 720 m)
  col_riedmatten:  { intercept:   1.2213, slope: 0.014379 },
  // direct CSV: Col de Riedmatten (S6) → Pas du Chat (S7)
  pas_du_chat:     { intercept:  -0.7131, slope: 0.047366 },
  // direct CSV: Pas du Chat (S7) → Les Ecoulaies (S8 = La Barma)
  ecoulaies:       { intercept: -12.5730, slope: 0.119241 },
  // direct CSV: Les Ecoulaies (S8) → Rosablanche (S9)
  rosablanche:     { intercept:   0.0666, slope: 0.127514 },
  // direct CSV: Rosablanche (S9) → Col de la Chaux (S10)
  col_chaux:       { intercept:  -9.6552, slope: 0.070627 },
  // combined: Chaux→Ruinettes (S10→S11) + Ruinettes→Verbier (S11→finish)
  verbier:         { intercept: -16.5025, slope: 0.094021 },
};
