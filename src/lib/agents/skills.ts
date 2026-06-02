import { complete } from '../ai/router';
import {
  assistantPrompt,
  explainTicketPrompt,
  officerRecommendationPrompt,
  planExplanationPrompt,
  reminderPrompt,
  SUPPORTED_LANGUAGES,
  type Language,
} from '../ai/prompts';
import { findPenalty } from '../data/penalties';
import { getRateBundle, creditCardInterestCost } from '../data/boc';
import { hardshipBand } from '../data/statcan';
import {
  getTicket,
  insertPlan,
  logAudit,
  setReviewRecommendation,
  type EvidenceItemRow,
  type PlanRow,
  type ScreeningReviewRow,
  type TicketRow,
} from '../db';
import { schedulePlanReminders } from '../reminders';
import { searchBylaws, type BylawChunk } from '../rag/bylaws';

export interface ExplainResult {
  text: string;
  provider: 'workers-ai' | 'anthropic' | 'demo';
  language: Language;
}

export async function explainTicket(
  env: Env,
  ticket: TicketRow,
  language: Language,
): Promise<ExplainResult> {
  const penalty = findPenalty(ticket.offence_code);
  if (!penalty) throw new Error('Unknown offence code');

  const result = await complete(env, {
    messages: explainTicketPrompt(ticket, penalty, language),
    tag: 'explain',
    maxTokens: 480,
    temperature: 0.4,
  });

  await logAudit(env.DB, {
    ticket_id: ticket.id,
    actor: 'agent:payment',
    action: 'explain',
    details: { language, provider: result.provider, preview: result.text.slice(0, 120) },
  });

  return { text: result.text, provider: result.provider, language };
}

export interface ProposedPlan {
  planId: string;
  band: 'severe' | 'moderate' | 'standard';
  ratio: number;
  limatCAD: number;
  months: number;
  monthlyDollars: number;
  totalDollars: number;
  aprPct: number;
  comparison: {
    ccAPR: number;
    ccExtraCost: number;
    primeRate: number;
    asOf: string;
  };
}

export async function proposePlan(
  env: Env,
  args: { ticket: TicketRow; income: number; household: number; language: Language },
): Promise<ProposedPlan> {
  const { band, limatCAD, ratio } = hardshipBand(args.income, args.household);
  const total = args.ticket.amount_cents / 100;
  const months = band === 'severe' ? 12 : band === 'moderate' ? 6 : 3;
  const monthlyDollars = Math.round((total / months) * 100) / 100;

  const rates = await getRateBundle();
  const ccCost = creditCardInterestCost(total, rates.averageCreditCardAPR, months);

  const planId = crypto.randomUUID();
  const firstPaymentAt = new Date(Date.now() + 14 * 86_400_000).toISOString();

  const planRow: PlanRow = {
    id: planId,
    ticket_id: args.ticket.id,
    months,
    monthly_cents: Math.round(monthlyDollars * 100),
    total_cents: Math.round(total * 100),
    apr_pct: 0,
    hardship_band: band,
    first_payment_at: firstPaymentAt,
    language: args.language,
    pdf_r2_key: null,
    signed_at: null,
    created_at: new Date().toISOString(),
  };
  await insertPlan(env.DB, planRow);
  await schedulePlanReminders(env.DB, {
    ticket: args.ticket,
    plan: planRow,
    userId: args.ticket.user_id ?? null,
  });

  await logAudit(env.DB, {
    ticket_id: args.ticket.id,
    actor: 'agent:payment',
    action: 'propose_plan',
    details: { planId, band, months, monthlyDollars },
  });

  return {
    planId,
    band,
    ratio: Math.round(ratio * 100) / 100,
    limatCAD,
    months,
    monthlyDollars,
    totalDollars: total,
    aprPct: 0,
    comparison: {
      ccAPR: rates.averageCreditCardAPR,
      ccExtraCost: ccCost,
      primeRate: rates.primeRate,
      asOf: rates.asOf,
    },
  };
}

export type RecommendedAction = 'cancel' | 'reduce' | 'uphold' | 'hearing';

export interface OfficerRecommendation {
  recommended_action: RecommendedAction;
  reduced_amount_cents: number | null;
  reasoning: string;
  cited_bylaws: string[];
  risk_flags: string[];
  confidence: 'low' | 'medium' | 'high';
}

export async function draftOfficerRecommendation(
  env: Env,
  args: { ticket: TicketRow; review: ScreeningReviewRow; evidenceSummary?: string },
): Promise<OfficerRecommendation> {
  const penalty = findPenalty(args.ticket.offence_code);
  if (!penalty) throw new Error('Unknown offence code');

  const cited = lookupBylaw(`${args.ticket.offence_label} ${args.review.narrative ?? ''}`, 3);

  const result = await complete(env, {
    messages: officerRecommendationPrompt({
      ticket: args.ticket,
      penalty,
      review: args.review,
      evidenceSummary: args.evidenceSummary ?? '',
    }),
    tag: 'officer_recommendation',
    temperature: 0.2,
    maxTokens: 480,
  });

  const recommendation = parseRecommendation(result.text) ?? heuristicRecommendation(args, penalty);
  if (cited.length > 0) {
    const existing = new Set(recommendation.cited_bylaws);
    for (const c of cited) existing.add(`${c.bylaw} ${c.section}`);
    recommendation.cited_bylaws = Array.from(existing);
  }
  await setReviewRecommendation(env.DB, args.review.id, JSON.stringify(recommendation));
  await logAudit(env.DB, {
    ticket_id: args.ticket.id,
    actor: 'agent:screening',
    action: 'draft_recommendation',
    details: {
      reviewId: args.review.id,
      action: recommendation.recommended_action,
      provider: result.provider,
      ragHits: cited.map((c) => c.id),
    },
  });
  return recommendation;
}

/**
 * RAG skill — retrieve bylaw chunks relevant to a free-text query.
 * Backed by token-overlap retrieval today; same signature swaps to Vectorize +
 * bge-m3 embeddings on deploy by changing one import.
 */
export function lookupBylaw(query: string, k = 4): Array<BylawChunk & { score: number }> {
  return searchBylaws(query, k);
}

function parseRecommendation(text: string): OfficerRecommendation | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]) as Partial<OfficerRecommendation>;
    if (!parsed.recommended_action || !parsed.reasoning) return null;
    return {
      recommended_action: parsed.recommended_action,
      reduced_amount_cents: parsed.reduced_amount_cents ?? null,
      reasoning: parsed.reasoning,
      cited_bylaws: parsed.cited_bylaws ?? [],
      risk_flags: parsed.risk_flags ?? [],
      confidence: parsed.confidence ?? 'medium',
    };
  } catch {
    return null;
  }
}

/**
 * Deterministic recommendation used when the LLM returns unparseable output.
 * Keeps the officer queue functional and predictable even without a model.
 */
function heuristicRecommendation(
  args: { ticket: TicketRow; review: ScreeningReviewRow },
  penalty: ReturnType<typeof findPenalty> & {},
): OfficerRecommendation {
  const reasons = (JSON.parse(args.review.reasons || '[]') as string[]).map((r) => r.toLowerCase());
  const isSafety = penalty.riskLevel === 'severe' || penalty.riskLevel === 'high';
  const claimsHardship = reasons.includes('financial_hardship');
  const claimsFactual = reasons.includes('factual_dispute');

  if (isSafety && !claimsFactual) {
    return {
      recommended_action: 'uphold',
      reduced_amount_cents: null,
      reasoning:
        'Safety-class offence with no factual dispute. Hardship can be addressed through a FairPlan instalment plan rather than penalty reduction.',
      cited_bylaws: [penalty.bylaw],
      risk_flags: ['safety_violation', ...(claimsHardship ? ['financial_hardship'] : [])],
      confidence: 'medium',
    };
  }
  if (claimsFactual) {
    return {
      recommended_action: 'hearing',
      reduced_amount_cents: null,
      reasoning:
        'Resident raises a factual dispute. Recommend escalation to a hearing officer where evidence can be examined.',
      cited_bylaws: [penalty.bylaw],
      risk_flags: ['factual_dispute'],
      confidence: 'medium',
    };
  }
  if (claimsHardship) {
    return {
      recommended_action: 'reduce',
      reduced_amount_cents: Math.round(args.ticket.amount_cents * 0.7),
      reasoning:
        'Documented financial hardship with no factual dispute. Recommend a 30% reduction and FairPlan instalment to support compliance.',
      cited_bylaws: [penalty.bylaw],
      risk_flags: ['financial_hardship'],
      confidence: 'medium',
    };
  }
  return {
    recommended_action: 'uphold',
    reduced_amount_cents: null,
    reasoning: 'No mitigating circumstances strong enough to reduce or cancel. Offer a payment plan to support compliance.',
    cited_bylaws: [penalty.bylaw],
    risk_flags: [],
    confidence: 'low',
  };
}

export async function explainPlan(
  env: Env,
  args: {
    ticket: TicketRow;
    band: 'severe' | 'moderate' | 'standard';
    months: number;
    monthlyDollars: number;
    ccInterestCost: number;
    language: Language;
  },
): Promise<{ text: string; provider: 'workers-ai' | 'anthropic' | 'demo' }> {
  const result = await complete(env, {
    messages: planExplanationPrompt(args),
    tag: 'explain_plan',
    maxTokens: 380,
    temperature: 0.45,
  });

  await logAudit(env.DB, {
    ticket_id: args.ticket.id,
    actor: 'agent:payment',
    action: 'explain_plan',
    details: { language: args.language, provider: result.provider },
  });

  return { text: result.text, provider: result.provider };
}

/**
 * Conversational assistant skill — the multilingual chatbot. Grounds each turn
 * in retrieved by-law chunks (RAG) plus optional ticket facts, then answers in
 * the resident's language. Advisory only — never decides a case.
 */
export async function chatAssistant(
  env: Env,
  args: {
    messages: { role: 'user' | 'assistant'; content: string }[];
    language: Language;
    ticketId?: string | null;
  },
): Promise<{ text: string; provider: 'workers-ai' | 'anthropic' | 'demo'; citations: string[] }> {
  const lastUser = [...args.messages].reverse().find((m) => m.role === 'user')?.content ?? '';
  const hits = lookupBylaw(lastUser, 3);
  const bylawContext = hits.map((h) => `- ${h.bylaw} ${h.section} — ${h.title}: ${h.body}`).join('\n');

  let ticketContext = '';
  if (args.ticketId) {
    const ticket = await getTicket(env.DB, args.ticketId);
    if (ticket) {
      const penalty = findPenalty(ticket.offence_code);
      ticketContext = `Notice ${ticket.id}: ${ticket.offence_label} ($${(ticket.amount_cents / 100).toFixed(2)} CAD), due ${ticket.due_at}${penalty ? `, cited by-law ${penalty.bylaw}` : ''}.`;
    }
  }

  const result = await complete(env, {
    messages: assistantPrompt({
      history: args.messages,
      langName: SUPPORTED_LANGUAGES[args.language],
      bylawContext,
      ticketContext,
    }),
    tag: 'assistant',
    maxTokens: 420,
    temperature: 0.5,
  });

  await logAudit(env.DB, {
    ticket_id: args.ticketId ?? undefined,
    actor: 'agent:assistant',
    action: 'chat',
    details: { language: args.language, provider: result.provider, ragHits: hits.map((h) => h.id) },
  });

  return {
    text: result.text,
    provider: result.provider,
    citations: hits.map((h) => `${h.bylaw} ${h.section}`),
  };
}

const REMINDER_OCCASION: Record<string, string> = {
  notice_due_5d: 'the notice is due in 5 days',
  notice_due_1d: 'the notice is due tomorrow',
  notice_due_0d: 'the notice is due today',
  plan_instalment_3d: 'their next FairPlan instalment is due in 3 days',
  plan_instalment_0d: 'their FairPlan instalment is due today',
};

/**
 * Compose a personalized, multilingual payment reminder body for a notice or
 * plan instalment. Used by the reminder cron and by the resident-facing preview.
 */
export async function composeReminder(
  env: Env,
  args: {
    ticket: TicketRow;
    kind: string;
    language: Language;
    plan?: { months: number; monthlyDollars: number; instalmentNumber: number } | null;
  },
): Promise<{ text: string; provider: 'workers-ai' | 'anthropic' | 'demo' }> {
  const result = await complete(env, {
    messages: reminderPrompt({
      ticket: args.ticket,
      langName: SUPPORTED_LANGUAGES[args.language],
      occasion: REMINDER_OCCASION[args.kind] ?? 'a payment is coming due',
      plan: args.plan ?? null,
    }),
    tag: 'reminder',
    maxTokens: 220,
    temperature: 0.5,
  });
  return { text: result.text, provider: result.provider };
}

/**
 * Evidence compilation — assemble the files attached to a screening review into
 * a single honest manifest the Screening Officer (and the recommendation agent)
 * can read at a glance. Deterministic; makes no OCR/content claims.
 */
export function compileEvidenceSummary(evidence: EvidenceItemRow[]): string {
  if (evidence.length === 0) return '';
  const byType = new Map<string, number>();
  let totalBytes = 0;
  for (const e of evidence) {
    const type = (e.mime_type?.split('/')[1] ?? 'file').toUpperCase();
    byType.set(type, (byType.get(type) ?? 0) + 1);
    totalBytes += e.size_bytes ?? 0;
  }
  const typeSummary = Array.from(byType.entries())
    .map(([type, n]) => `${n}× ${type}`)
    .join(', ');
  const files = evidence
    .map(
      (e) =>
        `"${e.filename ?? e.r2_key}" (${e.mime_type ?? 'unknown'}, ${e.size_bytes ? `${Math.round(e.size_bytes / 1024)} KB` : 'size n/a'})`,
    )
    .join('; ');
  return `${evidence.length} file(s) attached — ${typeSummary}; ${Math.round(totalBytes / 1024)} KB total. Files: ${files}.`;
}
