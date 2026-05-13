// Statistics Canada — Brampton Census 2021 (CSD 3521010)
// Public, no key, OGL-Canada.

// Note: the canonical URL pattern has shifted; we keep the most-recent-known endpoint
// and a static snapshot from the 2021 release so the demo never breaks if the upstream is unreachable.

export interface BramptonProfile {
  asOf: string;
  source: 'live' | 'snapshot';
  totalPopulation: number;
  medianHouseholdIncomeCAD: number;
  lowIncomePctLIM: number; // % of population below the LIM-AT line
  topLanguages: Array<{ language: string; share: number }>;
  visibleMinorityPct: number;
  immigrantPct: number;
  homeownershipPct: number;
}

// 2021 Census of Population — Brampton CSD 3521010, snapshot for resilience.
export const BRAMPTON_SNAPSHOT: BramptonProfile = {
  asOf: '2021-05-11',
  source: 'snapshot',
  totalPopulation: 656480,
  medianHouseholdIncomeCAD: 105863,
  lowIncomePctLIM: 12.4,
  topLanguages: [
    { language: 'English', share: 32.9 },
    { language: 'Punjabi', share: 23.0 },
    { language: 'Urdu', share: 4.5 },
    { language: 'Hindi', share: 3.8 },
    { language: 'Gujarati', share: 3.0 },
    { language: 'Tamil', share: 2.3 },
  ],
  visibleMinorityPct: 78.9,
  immigrantPct: 52.3,
  homeownershipPct: 81.1,
};

export async function getBramptonProfile(): Promise<BramptonProfile> {
  // Live fetch path can be enabled later via Statistics Canada WDS — for the
  // 1-day demo we ship the snapshot so the page never depends on the upstream.
  return BRAMPTON_SNAPSHOT;
}

// Low-income measure after tax (LIM-AT) thresholds for a single-person household,
// scaled by sqrt(N) for larger households per StatCan methodology.
// Published values updated 2025 for tax year 2024.
const LIMAT_SINGLE_CAD = 28000;

export function limatThresholdFor(householdSize: number): number {
  if (householdSize < 1) return LIMAT_SINGLE_CAD;
  return Math.round(LIMAT_SINGLE_CAD * Math.sqrt(householdSize));
}

export type HardshipBand = 'severe' | 'moderate' | 'standard';

/**
 * Map household income + size to a hardship band the payment-plan engine uses.
 * 'severe' < 80% of LIM-AT, 'moderate' < 130% of LIM-AT, 'standard' otherwise.
 */
export function hardshipBand(
  annualIncomeCAD: number,
  householdSize: number,
): { band: HardshipBand; limatCAD: number; ratio: number } {
  const limat = limatThresholdFor(householdSize);
  const ratio = annualIncomeCAD / limat;
  if (ratio < 0.8) return { band: 'severe', limatCAD: limat, ratio };
  if (ratio < 1.3) return { band: 'moderate', limatCAD: limat, ratio };
  return { band: 'standard', limatCAD: limat, ratio };
}
