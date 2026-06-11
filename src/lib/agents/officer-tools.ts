// Officer Agent tool registry — every tool is scoped to FairPlan's Brampton APS
// data. The model can only do APS work because these are the only callable
// surfaces, and each tool's zod schema rejects off-topic args at the door
// (regex-pinned ticket ids, capped query length, no free-form filters).

import { z } from 'zod';
import {
  getReview,
  getReviewForTicket,
  getTicket,
  listEvidence,
  listRecentDecisions,
  listUpcomingHearings,
} from '../db';
import { findPenalty } from '../data/penalties';
import { searchBylaws } from '../rag/bylaws';
import { compileEvidenceSummary } from '../evidence';

const BRP_ID = /^BRP-\d{4}-\d{6}$/i;
const REV_ID = /^rev_[a-z0-9]+$/i;

export interface OfficerTool<TArgs = unknown> {
  name: string;
  description: string;
  argsHint: string; // hand-written human-readable arg signature for the catalog
  argsSchema: z.ZodSchema<TArgs>;
  execute(env: Env, args: TArgs): Promise<unknown>;
}

// ---------- tool: get_ticket ----------
const getTicketArgs = z.object({
  ticketId: z.string().regex(BRP_ID, 'must be a Brampton notice id like BRP-2026-001234'),
});
const getTicketTool: OfficerTool<z.infer<typeof getTicketArgs>> = {
  name: 'get_ticket',
  description: 'Look up a Brampton APS notice by its number. Returns the offence, amount, dates, location, ward, by-law cited, and the offence risk class.',
  argsHint: '{ ticketId: "BRP-YYYY-NNNNNN" }',
  argsSchema: getTicketArgs,
  async execute(env, args) {
    const t = await getTicket(env.DB, args.ticketId.toUpperCase());
    if (!t) return { error: `Notice ${args.ticketId} not found.` };
    const penalty = findPenalty(t.offence_code);
    return {
      id: t.id,
      plate: t.plate,
      offence_code: t.offence_code,
      offence_label: t.offence_label,
      amount_cad: t.amount_cents / 100,
      issued_at: t.issued_at,
      due_at: t.due_at,
      location: t.location_text,
      ward: t.ward,
      status: t.status,
      cited_bylaw: penalty?.bylaw ?? null,
      category: penalty?.category ?? null,
      risk_class: penalty?.riskLevel ?? null,
    };
  },
};

// ---------- tool: search_bylaws ----------
const searchBylawsArgs = z.object({
  query: z.string().min(3).max(200),
});
const searchBylawsTool: OfficerTool<z.infer<typeof searchBylawsArgs>> = {
  name: 'search_bylaws',
  description: 'Search the Brampton + Ontario AMPS by-law corpus by keyword. Returns up to 4 sections with the verbatim text. Use this before quoting a by-law.',
  argsHint: '{ query: string (3-200 chars) }',
  argsSchema: searchBylawsArgs,
  async execute(_env, args) {
    const hits = searchBylaws(args.query, 4);
    if (hits.length === 0) {
      return {
        error:
          'No Brampton or Ontario APS by-law matches that query. If the question is outside Brampton APS, decline.',
      };
    }
    return {
      hits: hits.map((h) => ({
        bylaw: h.bylaw,
        section: h.section,
        title: h.title,
        jurisdiction: h.jurisdiction,
        category: h.category,
        text: h.body,
      })),
    };
  },
};

// ---------- tool: get_review ----------
const getReviewArgs = z
  .object({
    reviewId: z.string().regex(REV_ID).optional(),
    ticketId: z.string().regex(BRP_ID).optional(),
  })
  .refine((v) => Boolean(v.reviewId) !== Boolean(v.ticketId), {
    message: 'Provide exactly one of reviewId or ticketId.',
  });
const getReviewTool: OfficerTool<z.infer<typeof getReviewArgs>> = {
  name: 'get_review',
  description: "Fetch a screening review: the resident's reasons, narrative, status, any prior AI recommendation, the decision (if decided), and a compiled evidence manifest.",
  argsHint: '{ reviewId?: "rev_…" } OR { ticketId?: "BRP-…" } (exactly one)',
  argsSchema: getReviewArgs,
  async execute(env, args) {
    const r = args.reviewId
      ? await getReview(env.DB, args.reviewId)
      : await getReviewForTicket(env.DB, args.ticketId!.toUpperCase());
    if (!r) return { error: 'No screening review found for that input.' };
    const evidence = await listEvidence(env.DB, r.id);
    let reasons: string[] = [];
    try {
      reasons = JSON.parse(r.reasons || '[]') as string[];
    } catch {
      reasons = [];
    }
    let aiRecommendation: unknown = null;
    if (r.ai_recommendation) {
      try {
        aiRecommendation = JSON.parse(r.ai_recommendation);
      } catch {
        aiRecommendation = r.ai_recommendation;
      }
    }
    return {
      id: r.id,
      ticket_id: r.ticket_id,
      offence_label: r.offence_label,
      offence_code: r.offence_code,
      amount_cad: r.amount_cents / 100,
      reasons,
      narrative: r.narrative,
      status: r.status,
      priority_score: r.priority_score,
      ai_recommendation: aiRecommendation,
      decision: r.decision,
      decision_amount_cad: r.decision_amount_cents != null ? r.decision_amount_cents / 100 : null,
      decision_reasoning: r.decision_reasoning,
      decided_at: r.decided_at,
      evidence_manifest: compileEvidenceSummary(evidence) || '(no evidence on file)',
      evidence_count: evidence.length,
    };
  },
};

// ---------- tool: list_recent_decisions ----------
const listRecentArgs = z.object({
  offenceCode: z.string().max(20).optional(),
  limit: z.number().int().min(1).max(20).optional(),
});
const listRecentDecisionsTool: OfficerTool<z.infer<typeof listRecentArgs>> = {
  name: 'list_recent_decisions',
  description: 'List recent decided screening reviews for precedent. Optionally filter to one offence code (e.g. "PARK-FIRE-ROUTE"). Returns up to 20 rows.',
  argsHint: '{ offenceCode?: string, limit?: 1-20 (default 10) }',
  argsSchema: listRecentArgs,
  async execute(env, args) {
    const rows = await listRecentDecisions(env.DB, {
      offenceCode: args.offenceCode,
      limit: args.limit ?? 10,
    });
    if (rows.length === 0) return { decisions: [], note: 'No prior decisions on file matching those criteria.' };
    return {
      decisions: rows.map((r) => ({
        review_id: r.review_id,
        ticket_id: r.ticket_id,
        offence_code: r.offence_code,
        offence_label: r.offence_label,
        original_amount_cad: r.amount_cents / 100,
        decision: r.decision,
        decided_amount_cad:
          r.decision_amount_cents != null ? r.decision_amount_cents / 100 : null,
        reasoning: r.decision_reasoning,
        decided_at: r.decided_at,
      })),
    };
  },
};

// ---------- tool: list_upcoming_hearings ----------
const listHearingsArgs = z.object({ limit: z.number().int().min(1).max(20).optional() });
const listUpcomingHearingsTool: OfficerTool<z.infer<typeof listHearingsArgs>> = {
  name: 'list_upcoming_hearings',
  description: 'List the next scheduled hearings (review id, ticket id, offence, scheduled time).',
  argsHint: '{ limit?: 1-20 (default 10) }',
  argsSchema: listHearingsArgs,
  async execute(env, args) {
    const rows = await listUpcomingHearings(env.DB, args.limit ?? 10);
    if (rows.length === 0) return { hearings: [], note: 'No upcoming hearings scheduled.' };
    return {
      hearings: rows.map((h) => ({
        hearing_id: h.id,
        review_id: h.review_id,
        ticket_id: h.ticket_id,
        offence_label: h.offence_label,
        scheduled_at: h.scheduled_at,
        duration_minutes: h.duration_minutes,
        status: h.status,
      })),
    };
  },
};

// ---------- tool: compute_deadlines ----------
const computeArgs = z
  .object({
    ticketId: z.string().regex(BRP_ID).optional(),
    issuedAt: z.string().min(8).max(40).optional(),
    decidedAt: z.string().min(8).max(40).optional(),
  })
  .refine((v) => Boolean(v.ticketId) !== Boolean(v.issuedAt || v.decidedAt), {
    message: 'Provide ticketId, OR issuedAt/decidedAt, not both.',
  });
const computeDeadlinesTool: OfficerTool<z.infer<typeof computeArgs>> = {
  name: 'compute_deadlines',
  description: 'Compute the APS 15-day windows: when a Screening Review must be requested (issued + 15 days) and when a hearing must be requested after a decision (decided + 15 days). Returns days remaining vs today.',
  argsHint: '{ ticketId?: "BRP-…" } OR { issuedAt?: ISO, decidedAt?: ISO }',
  argsSchema: computeArgs,
  async execute(env, args) {
    let issuedAt: string | null = null;
    let decidedAt: string | null = args.decidedAt ?? null;
    let ticketId: string | null = null;
    if (args.ticketId) {
      const t = await getTicket(env.DB, args.ticketId.toUpperCase());
      if (!t) return { error: `Notice ${args.ticketId} not found.` };
      issuedAt = t.issued_at;
      ticketId = t.id;
    } else if (args.issuedAt) {
      issuedAt = args.issuedAt;
    }
    const now = new Date();
    const out: Record<string, unknown> = { ticket_id: ticketId, now: now.toISOString() };
    if (issuedAt) {
      const issued = new Date(issuedAt);
      const deadline = new Date(issued.getTime() + 15 * 86_400_000);
      const days = Math.floor((deadline.getTime() - now.getTime()) / 86_400_000);
      out.screening_review_deadline = deadline.toISOString();
      out.screening_review_days_remaining = days;
      out.screening_review_overdue = days < 0;
    }
    if (decidedAt) {
      const decided = new Date(decidedAt);
      const deadline = new Date(decided.getTime() + 15 * 86_400_000);
      const days = Math.floor((deadline.getTime() - now.getTime()) / 86_400_000);
      out.hearing_request_deadline = deadline.toISOString();
      out.hearing_request_days_remaining = days;
      out.hearing_request_overdue = days < 0;
    }
    if (!issuedAt && !decidedAt) {
      return { error: 'Provide ticketId, or issuedAt, or decidedAt.' };
    }
    return out;
  },
};

// ---------- registry ----------
export const OFFICER_TOOLS: OfficerTool<unknown>[] = [
  getTicketTool as unknown as OfficerTool<unknown>,
  searchBylawsTool as unknown as OfficerTool<unknown>,
  getReviewTool as unknown as OfficerTool<unknown>,
  listRecentDecisionsTool as unknown as OfficerTool<unknown>,
  listUpcomingHearingsTool as unknown as OfficerTool<unknown>,
  computeDeadlinesTool as unknown as OfficerTool<unknown>,
];

export interface ToolResult {
  ok: boolean;
  data?: unknown;
  error?: string;
}

export async function runOfficerTool(
  env: Env,
  name: string,
  rawArgs: unknown,
): Promise<ToolResult> {
  const tool = OFFICER_TOOLS.find((t) => t.name === name);
  if (!tool) {
    return { ok: false, error: `Unknown tool "${name}". Available: ${OFFICER_TOOLS.map((t) => t.name).join(', ')}.` };
  }
  const parsed = tool.argsSchema.safeParse(rawArgs ?? {});
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => `${i.path.join('.') || 'args'}: ${i.message}`).join('; ');
    return { ok: false, error: `Invalid args for ${name}: ${msg}` };
  }
  try {
    const data = await tool.execute(env, parsed.data);
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: `Tool "${name}" failed: ${(err as Error).message}` };
  }
}

/** Compact text block describing the tools, suitable for embedding in a prompt. */
export function toolCatalog(): string {
  return OFFICER_TOOLS.map(
    (t) => `- ${t.name}${t.argsHint ? ' ' + t.argsHint : ''}\n  ${t.description}`,
  ).join('\n');
}
