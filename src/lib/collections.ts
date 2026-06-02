// Predictive collections — next-best-action recommender.
//
// Pairs with the risk score in dashboard/summary: a risk number tells you *which*
// cases need attention; this tells you *what to do* about each one. Deterministic
// and explainable on purpose — a municipal collections team (and an auditor) can
// see exactly why each case was routed the way it was, with no per-row LLM cost.
// Replaces today's blunt "refer overdue accounts to a credit bureau" default with
// a graduated, hardship-aware ladder.

export type CollectionStrategy =
  | 'gentle_reminder'
  | 'offer_plan'
  | 'personal_outreach'
  | 'escalate';

export interface StrategyRecommendation {
  strategy: CollectionStrategy;
  label: string;
  rationale: string;
}

const LABEL: Record<CollectionStrategy, string> = {
  gentle_reminder: 'Automated reminder',
  offer_plan: 'Offer FairPlan instalment',
  personal_outreach: 'Personal outreach',
  escalate: 'Escalate · final notice',
};

/**
 * Recommend the next collection action for an at-risk case.
 * @param risk        0–1 risk score (higher = more likely to go unpaid)
 * @param daysToDue   days until due (negative = already overdue)
 * @param amount      balance in dollars
 * @param band        optional hardship band if the resident has a plan/profile
 */
export function recommendStrategy(args: {
  risk: number;
  daysToDue: number;
  amount: number;
  band?: 'severe' | 'moderate' | 'standard' | null;
}): StrategyRecommendation {
  const { risk, daysToDue, amount, band } = args;
  const overdue = daysToDue <= 0;
  const hardshipLikely = band === 'severe' || band === 'moderate';

  let strategy: CollectionStrategy;
  let rationale: string;

  if (overdue && amount >= 500 && risk >= 0.85) {
    strategy = 'escalate';
    rationale = 'Overdue, high balance, high risk — route to a senior officer for a final notice before any external step.';
  } else if (risk >= 0.85 || (overdue && amount >= 300)) {
    strategy = 'personal_outreach';
    rationale = 'High likelihood of default — a personalized call or email recovers more than another automated notice.';
  } else if (hardshipLikely || amount >= 300) {
    strategy = 'offer_plan';
    rationale = hardshipLikely
      ? 'Hardship signals present — proactively offer a 0% FairPlan instalment to keep the account in good standing.'
      : 'Larger balance — offering a 0% FairPlan instalment now lifts the chance of full recovery.';
  } else {
    strategy = 'gentle_reminder';
    rationale = 'Still within the window and low risk — a friendly multilingual reminder is usually enough.';
  }

  return { strategy, label: LABEL[strategy], rationale };
}
