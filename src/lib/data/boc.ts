// Bank of Canada Valet API client
// Free, no key, CORS-enabled. Used for the APR-comparison widget.
// https://www.bankofcanada.ca/valet/docs

const BASE = 'https://www.bankofcanada.ca/valet';

export interface ValetObservation {
  date: string; // ISO date
  rate: number; // percent
}

export interface RateBundle {
  asOf: string;
  primeRate: number;
  overnightRate: number;
  // Synthesised consumer benchmarks (industry averages, kept here so the UI is self-contained)
  averageCreditCardAPR: number;
  averageLineOfCreditAPR: number;
  paydayLoanEffectiveAPR: number;
}

async function fetchSeries(seriesId: string, init?: RequestInit): Promise<ValetObservation | null> {
  const res = await fetch(`${BASE}/observations/${seriesId}/json?recent=1`, {
    headers: { accept: 'application/json' },
    ...init,
  });
  if (!res.ok) return null;
  const json = (await res.json()) as {
    observations?: Array<Record<string, { v: string } | string>>;
  };
  const obs = json.observations?.[0];
  if (!obs) return null;
  const value = (obs[seriesId] as { v: string } | undefined)?.v;
  const date = (obs['d'] as string | undefined) ?? '';
  if (!value) return null;
  return { date, rate: parseFloat(value) };
}

/**
 * Pulls live BoC rates and bundles them with industry-average consumer credit benchmarks.
 * Falls back to recent observed values if the API is unreachable so the demo never breaks.
 */
export async function getRateBundle(fetchImpl: typeof fetch = fetch): Promise<RateBundle> {
  const FALLBACK: RateBundle = {
    asOf: new Date().toISOString().slice(0, 10),
    primeRate: 5.45,
    overnightRate: 3.25,
    averageCreditCardAPR: 21.99,
    averageLineOfCreditAPR: 9.45,
    paydayLoanEffectiveAPR: 391.07,
  };

  try {
    const [prime, overnight] = await Promise.all([
      fetchSeries('V80691311', { signal: AbortSignal.timeout(2500) }),
      fetchSeries('V39079', { signal: AbortSignal.timeout(2500) }),
    ]);
    return {
      asOf: prime?.date ?? FALLBACK.asOf,
      primeRate: prime?.rate ?? FALLBACK.primeRate,
      overnightRate: overnight?.rate ?? FALLBACK.overnightRate,
      averageCreditCardAPR: FALLBACK.averageCreditCardAPR,
      averageLineOfCreditAPR: FALLBACK.averageLineOfCreditAPR,
      paydayLoanEffectiveAPR: FALLBACK.paydayLoanEffectiveAPR,
    };
  } catch {
    return FALLBACK;
  }
}

/** Compute interest cost of paying a fine via credit card at observed APR, over N months. */
export function creditCardInterestCost(principalDollars: number, aprPct: number, months: number): number {
  const r = aprPct / 100 / 12;
  if (r === 0) return 0;
  const monthly = (principalDollars * r) / (1 - Math.pow(1 + r, -months));
  return Math.round((monthly * months - principalDollars) * 100) / 100;
}
