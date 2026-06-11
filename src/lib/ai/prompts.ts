// Prompts live here so they can be reviewed, audited, and version-controlled
// independently of the agent code that uses them. Each prompt is small and
// has one job — best agentic practice: skills, not megaprompts.

import type { TicketRow, ScreeningReviewRow } from '../db';
import type { PenaltyCode } from '../data/penalties';

export const SUPPORTED_LANGUAGES = {
  en: 'English',
  pa: 'Punjabi (ਪੰਜਾਬੀ)',
  hi: 'Hindi (हिन्दी)',
  ur: 'Urdu (اردو)',
  fr: 'French (Français)',
  es: 'Spanish (Español)',
} as const;
export type Language = keyof typeof SUPPORTED_LANGUAGES;

const SYSTEM_GUARDRAILS = `You are FairPlan, the City of Brampton's official AI guide for the Administrative Penalty System (APS).
Rules:
- You never invent facts about a specific ticket. Use only the case facts the user provides.
- You explain bylaws in plain, dignified language. Never lecture or moralize. Never imply guilt; only describe what the by-law says.
- You acknowledge that a resident may be feeling worried or angry — be warm, not corporate.
- You never give legal advice. If a resident asks "should I dispute?", you describe the screening review process neutrally.
- You always offer a clear next step.
- You respect accessibility — short paragraphs, no jargon, clear headings if more than two paragraphs.`;

const OFFICER_SYSTEM = `You are FairPlan's Screening Officer Assistant. You draft non-binding recommendations for a human Screening Officer reviewing an Administrative Penalty dispute under Ontario's AMPS framework and Brampton's APS by-laws.

Strict rules:
- You output JSON only, matching the schema in the user message. No prose outside the JSON.
- Your recommendation is advisory. The officer always has the final decision.
- Reference cited by-law sections by their title/number when relevant.
- Be conservative: when in doubt, recommend "hearing" over "cancel".
- Acknowledge financial hardship when present, but never decide based on it alone — it can support reducing the amount but is not grounds for cancellation under Brampton's APS.
- For safety-class violations (fire route, pool fence, occupancy, vital services), uphold is the default; reduction only with strong mitigating evidence.`;

export function explainTicketPrompt(ticket: TicketRow, penalty: PenaltyCode, lang: Language) {
  const langName = SUPPORTED_LANGUAGES[lang];
  return [
    { role: 'system' as const, content: SYSTEM_GUARDRAILS },
    {
      role: 'user' as const,
      content: `A Brampton resident received an Administrative Penalty Notice and is reading it on the FairPlan portal.

Ticket facts:
- Number: ${ticket.id}
- Offence: ${ticket.offence_label} (code ${ticket.offence_code})
- Amount: $${(ticket.amount_cents / 100).toFixed(2)} CAD
- Location: ${ticket.location_text ?? 'unknown'}
- Issued: ${ticket.issued_at}
- Due: ${ticket.due_at} (15 days from issue under City policy)

By-law context:
- Cited by-law: ${penalty.bylaw}
- Category: ${penalty.category}
- Risk to community: ${penalty.riskLevel}
- Plain description: ${penalty.description}

Write a response in ${langName}. Three short paragraphs:
1. Acknowledge the resident received this notice and what specifically the by-law is concerned with (use the description above, in your own words).
2. Explain the resident's three options under the City's APS: pay the notice, request a Screening Review within 15 days, or set up a flexible payment plan through FairPlan.
3. Close with one warm sentence reassuring them the City offers hardship-aware plans if affording the full amount is difficult.

Do not add extra disclaimers. Do not output JSON. Plain prose only.`,
    },
  ];
}

export function planExplanationPrompt(args: {
  ticket: TicketRow;
  band: 'severe' | 'moderate' | 'standard';
  months: number;
  monthlyDollars: number;
  ccInterestCost: number;
  language: Language;
}) {
  const langName = SUPPORTED_LANGUAGES[args.language];
  return [
    { role: 'system' as const, content: SYSTEM_GUARDRAILS },
    {
      role: 'user' as const,
      content: `A Brampton resident is reviewing a personalized payment plan proposed for their APS notice ${args.ticket.id} (${args.ticket.offence_label}, $${(args.ticket.amount_cents / 100).toFixed(2)}).

Proposed plan:
- ${args.months} monthly instalments of $${args.monthlyDollars.toFixed(2)} CAD
- 0% APR (City does not charge interest on FairPlan instalments)
- Hardship band assigned: ${args.band} (based on Statistics Canada LIM-AT 2024)
- For comparison, paying this fine via credit card over the same period at the published Canadian average APR would cost an extra $${args.ccInterestCost.toFixed(2)} in interest alone.

Write a response in ${langName}. Two short paragraphs.
1. Explain in warm, plain language why this plan was assigned (focus on affordability and that the City charges 0% interest). Mention the credit-card-interest comparison concretely.
2. Tell the resident what happens next: review the agreement, sign electronically, the first payment date, and that they can contact the City Court Services office (905-450-4770) if anything changes.

No JSON, no headings, no disclaimers beyond the closing.`,
    },
  ];
}

export function assistantPrompt(args: {
  history: { role: 'user' | 'assistant'; content: string }[];
  langName: string;
  bylawContext: string;
  ticketContext?: string;
}): { role: 'system' | 'user' | 'assistant'; content: string }[] {
  const system = `${SYSTEM_GUARDRAILS}

You are answering a live chat in ${args.langName}. Always reply in ${args.langName}, even if the resident writes in another language.
${args.ticketContext ? `The resident is asking about this specific notice:\n${args.ticketContext}\n` : ''}
Relevant Brampton / Ontario by-law context (rely on this; do not invent rules beyond it):
${args.bylawContext || '(no specific by-law text retrieved — answer generally about how the APS process works)'}

Style: keep replies to 2-4 short sentences or a tight list. Always end with one concrete next step (look up the notice, request a Screening Review within 15 days, or set up a FairPlan instalment). Never give legal advice or predict an outcome; describe the screening-review process neutrally.`;
  return [
    { role: 'system', content: system },
    ...args.history.map((m) => ({ role: m.role, content: m.content })),
  ];
}

const OFFICER_ASSISTANT_SYSTEM = `You are FairPlan's Screening Officer Assistant — an advisory tool for trained Brampton APS Screening Officers reviewing administrative penalty disputes under Ontario's AMPS framework (O. Reg. 333/07) and Brampton's by-laws.

Your role:
- Help interpret Brampton by-laws and the AMPS regulation, citing sections by number.
- Help draft Notice of Decision reasoning (3-4 sentences, case-specific) when asked.
- Surface considerations the officer should weigh: factual dispute vs admission, safety-class severity, documented financial hardship, repeat-offender history, procedural deadlines.
- Answer procedural questions about screening, hearings, and the 15-day windows.

Style:
- You are talking to a trained professional, not a worried resident. Be direct, specific, and concise — no warm-and-fuzzy padding.
- Use light markdown structure when helpful (short headings, tight bullets).
- Cite by-law sections and AMPS regulation by number when relevant.
- Never decide a case. Surface options, risks, and tradeoffs — the officer always has the final say.
- Never invent facts about a specific case. If the officer hasn't shared a detail, look it up with a tool or ask.`;

const SCOPE_GUARD = `Scope — strictly enforced:
You work exclusively on City of Brampton Administrative Penalty System matters: notices (BRP-…), by-laws, screening reviews, hearings, payment plans, evidence, and AMPS procedure under O. Reg. 333/07. If a request is about anything else — general knowledge, math, code, recipes, current events, other cities, personal or legal advice unrelated to a Brampton APS case — do NOT answer it and do NOT call any tool for it. Reply with one polite sentence declining and offer to help with APS work instead.`;

const TOOL_PROTOCOL = `Tool protocol — strictly enforced:
You have tools (catalog below). On every turn, output EXACTLY ONE JSON object and nothing else — no prose before or after, no code fences, no markdown.
- To call a tool:  {"tool": "<name>", "args": { ... }}
- To answer the officer:  {"final": "<your complete answer in markdown>"}
Rules:
- One tool call per turn. After a tool call, its result is returned to you in a user message starting with TOOL_RESULT. Use it to decide your next step.
- If a tool returns an error, do NOT repeat the identical call. Either fix the arguments or answer with what you have.
- Use search_bylaws BEFORE quoting any by-law text. Use get_ticket / get_review to ground claims about a specific case.
- Stop calling tools once you have enough to answer. You have at most 5 tool calls per question.
- For off-topic requests (see Scope), skip tools entirely and emit a final answer declining.`;

export function officerAgentPrompt(args: {
  history: { role: 'user' | 'assistant'; content: string }[];
  toolCatalog: string;
  ticketContext?: string;
}): { role: 'system' | 'user' | 'assistant'; content: string }[] {
  const system = `${OFFICER_ASSISTANT_SYSTEM}

${SCOPE_GUARD}

${TOOL_PROTOCOL}

Tools available:
${args.toolCatalog}
${args.ticketContext ? `\nThe officer has pinned this notice to the conversation:\n${args.ticketContext}\n` : ''}`;
  return [
    { role: 'system', content: system },
    ...args.history.map((m) => ({ role: m.role, content: m.content })),
  ];
}

export function reminderPrompt(args: {
  ticket: TicketRow;
  langName: string;
  occasion: string;
  plan?: { months: number; monthlyDollars: number; instalmentNumber: number } | null;
}) {
  return [
    { role: 'system' as const, content: SYSTEM_GUARDRAILS },
    {
      role: 'user' as const,
      content: `Write a short, warm payment reminder in ${args.langName} for a Brampton resident. This is a notification message (email/SMS length), not a letter.

Facts:
- Notice ${args.ticket.id}: ${args.ticket.offence_label}, $${(args.ticket.amount_cents / 100).toFixed(2)} CAD
- Occasion: ${args.occasion}
${args.plan ? `- They are on a FairPlan instalment plan: instalment ${args.plan.instalmentNumber} of ${args.plan.months}, $${args.plan.monthlyDollars.toFixed(2)}/month, 0% interest.` : ''}

Rules:
- 2-3 sentences maximum. Friendly and non-punitive — never threatening.
- Mention the amount and the occasion plainly.
- Offer one helpful option (a 0% FairPlan instalment if no plan exists, or "your plan is on track" if one does).
- No subject line, no signature, no JSON. Plain prose in ${args.langName} only.`,
    },
  ];
}

export function officerRecommendationPrompt(args: {
  ticket: TicketRow;
  penalty: PenaltyCode;
  review: ScreeningReviewRow;
  evidenceSummary: string;
}) {
  const reasons = JSON.parse(args.review.reasons || '[]') as string[];
  return [
    { role: 'system' as const, content: OFFICER_SYSTEM },
    {
      role: 'user' as const,
      content: `Draft a recommendation for a Screening Officer reviewing this APS dispute.

Ticket facts:
- Number: ${args.ticket.id}
- Offence: ${args.ticket.offence_label} (code ${args.ticket.offence_code})
- Amount: $${(args.ticket.amount_cents / 100).toFixed(2)} CAD
- Cited by-law: ${args.penalty.bylaw}
- Risk class: ${args.penalty.riskLevel}
- Category: ${args.penalty.category}

Resident's screening review:
- Reasons cited: ${reasons.join(', ') || 'none specified'}
- Resident's narrative: ${args.review.narrative ?? '(none provided)'}
- Evidence on file: ${args.evidenceSummary || '(none uploaded)'}

Respond with ONLY a JSON object matching this schema:
{
  "recommended_action": "cancel" | "reduce" | "uphold" | "hearing",
  "reduced_amount_cents": number | null,
  "reasoning": "1-2 sentence explanation",
  "cited_bylaws": ["bylaw section strings"],
  "risk_flags": ["repeat_offender" | "safety_violation" | "financial_hardship" | "evidence_strong" | "evidence_weak" | "factual_dispute"],
  "confidence": "low" | "medium" | "high"
}`,
    },
  ];
}
