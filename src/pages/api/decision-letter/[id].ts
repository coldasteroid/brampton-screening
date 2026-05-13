import type { APIRoute } from 'astro';
import { getReview } from '~/lib/db';
import { findPenalty } from '~/lib/data/penalties';

export const prerender = false;

const DECISION_LABEL: Record<string, string> = {
  cancelled: 'Notice cancelled',
  reduced: 'Penalty reduced',
  upheld: 'Notice upheld',
  hearing_required: 'Hearing required',
};

const DECISION_CTA: Record<string, string> = {
  cancelled:
    'The Administrative Penalty Notice referenced above has been cancelled. No payment is owed. No further action is required.',
  reduced:
    'The penalty amount has been reduced as shown. The remaining balance is now due in 15 days. You may activate a FairPlan instalment at any time at no cost.',
  upheld:
    'After review, the original penalty has been upheld. The amount remains due in 15 days from the date of this Notice. A FairPlan instalment plan remains available.',
  hearing_required:
    'Your matter has been referred to a Hearing Officer. You will receive a scheduling notice within 10 business days. No payment is due until the hearing outcome is delivered.',
};

export const GET: APIRoute = async ({ params, locals }) => {
  const env = locals.runtime.env;
  const id = params.id?.toString() ?? '';
  if (!id) return new Response('missing id', { status: 400 });

  const review = await getReview(env.DB, id);
  if (!review || review.status !== 'decided' || !review.decision) {
    return new Response('decision not available', { status: 404 });
  }

  const penalty = findPenalty(review.offence_code);
  const originalDollars = (review.amount_cents / 100).toLocaleString('en-CA', {
    style: 'currency',
    currency: 'CAD',
  });
  const reducedDollars =
    review.decision === 'reduced' && review.decision_amount_cents != null
      ? (review.decision_amount_cents / 100).toLocaleString('en-CA', { style: 'currency', currency: 'CAD' })
      : null;
  const decidedAt = review.decided_at
    ? new Date(review.decided_at).toLocaleDateString('en-CA', { dateStyle: 'long' })
    : '—';

  const html = renderLetter({
    reviewId: review.id,
    ticketId: review.ticket_id,
    offenceLabel: review.offence_label,
    bylaw: penalty?.bylaw ?? '—',
    location: review.location_text ?? '—',
    originalDollars,
    reducedDollars,
    decision: review.decision,
    decisionLabel: DECISION_LABEL[review.decision] ?? review.decision,
    decisionCta: DECISION_CTA[review.decision] ?? '',
    reasoning: review.decision_reasoning ?? '',
    decidedAt,
  });

  return new Response(html, {
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
  });
};

interface LetterProps {
  reviewId: string;
  ticketId: string;
  offenceLabel: string;
  bylaw: string;
  location: string;
  originalDollars: string;
  reducedDollars: string | null;
  decision: string;
  decisionLabel: string;
  decisionCta: string;
  reasoning: string;
  decidedAt: string;
}

function renderLetter(p: LetterProps): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Notice of Decision · ${escapeHtml(p.ticketId)}</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #FAFAF7; font-family: 'Inter', system-ui, sans-serif; color: #0B1F3A; line-height: 1.55; }
  .toolbar { position: sticky; top: 0; z-index: 10; background: #0B1F3A; color: #fff; padding: 0.75rem 1.5rem; display: flex; justify-content: space-between; align-items: center; }
  .toolbar button { background: #00C49A; color: #0B1F3A; border: 0; font: inherit; font-weight: 600; padding: 0.5rem 1rem; border-radius: 0.5rem; cursor: pointer; }
  main { max-width: 760px; margin: 2.5rem auto; background: #fff; border: 1px solid #E5E7EB; border-radius: 1rem; padding: 3rem; box-shadow: 0 8px 32px -16px rgba(11,31,58,0.15); }
  h1 { font-family: 'Fraunces', Georgia, serif; font-size: 2rem; margin: 0 0 0.25rem; letter-spacing: -0.02em; }
  .sub { color: #475569; font-size: 0.95rem; margin: 0; }
  .badge { display: inline-block; margin-top: 1rem; padding: 0.4rem 0.85rem; border-radius: 999px; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; }
  .badge.cancelled { background: rgba(0,196,154,0.12); color: #009776; }
  .badge.reduced   { background: rgba(245,158,11,0.12); color: #B45309; }
  .badge.upheld    { background: rgba(11,31,58,0.06); color: #0B1F3A; }
  .badge.hearing_required { background: rgba(99,102,241,0.12); color: #4338CA; }
  .meta { margin-top: 2rem; display: grid; grid-template-columns: 1fr 1fr; gap: 1rem 2rem; }
  .meta dt { font-size: 0.7rem; letter-spacing: 0.14em; text-transform: uppercase; color: #64748B; margin-bottom: 0.25rem; }
  .meta dd { margin: 0; font-weight: 500; }
  .panel { margin-top: 2.25rem; padding: 1.5rem; border: 1px solid #E5E7EB; border-radius: 0.75rem; }
  .panel h2 { font-family: 'Fraunces', serif; font-size: 1.2rem; margin: 0 0 0.5rem; }
  .panel p { margin: 0.3rem 0; color: #1E3252; }
  .amount-row { display: flex; gap: 2rem; flex-wrap: wrap; margin-top: 1rem; }
  .amount-row div { min-width: 8rem; }
  .amount-row .label { font-size: 0.7rem; letter-spacing: 0.14em; text-transform: uppercase; color: #64748B; }
  .amount-row .value { font-family: 'Fraunces', serif; font-size: 1.5rem; }
  .reasoning { margin-top: 2rem; }
  .reasoning h3 { font-family: 'Fraunces', serif; font-size: 1.05rem; margin: 0 0 0.5rem; }
  .reasoning p { white-space: pre-line; color: #1E3252; }
  .cta { margin-top: 2rem; padding: 1.25rem 1.5rem; background: linear-gradient(135deg, rgba(0,196,154,0.06), rgba(0,196,154,0)); border: 1px solid rgba(0,196,154,0.25); border-radius: 0.75rem; font-size: 0.95rem; color: #0B1F3A; }
  .rights { margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid #E5E7EB; font-size: 0.82rem; color: #475569; }
  .rights h3 { font-family: 'Fraunces', serif; font-size: 1rem; margin: 0 0 0.4rem; color: #0B1F3A; }
  .footer { margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid #E5E7EB; font-size: 0.72rem; color: #64748B; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; }
  .mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }
  @media print { body { background: #fff; } .toolbar { display: none; } main { box-shadow: none; border: 0; padding: 0; margin: 0; max-width: none; } }
</style>
</head>
<body>
  <div class="toolbar">
    <span>Notice of Decision · ${escapeHtml(p.reviewId)}</span>
    <button onclick="window.print()">Save as PDF</button>
  </div>
  <main>
    <header>
      <h1>Notice of Decision</h1>
      <p class="sub">City of Brampton · Administrative Penalty System · Screening Review</p>
      <span class="badge ${escapeHtml(p.decision)}">${escapeHtml(p.decisionLabel)}</span>
    </header>

    <dl class="meta">
      <div><dt>Notice number</dt><dd class="mono">${escapeHtml(p.ticketId)}</dd></div>
      <div><dt>Review number</dt><dd class="mono">${escapeHtml(p.reviewId)}</dd></div>
      <div><dt>Offence</dt><dd>${escapeHtml(p.offenceLabel)}</dd></div>
      <div><dt>Cited by-law</dt><dd>${escapeHtml(p.bylaw)}</dd></div>
      <div><dt>Location</dt><dd>${escapeHtml(p.location)}</dd></div>
      <div><dt>Decision date</dt><dd>${escapeHtml(p.decidedAt)}</dd></div>
    </dl>

    <section class="panel">
      <h2>Outcome</h2>
      <div class="amount-row">
        <div>
          <div class="label">Original amount</div>
          <div class="value">${escapeHtml(p.originalDollars)}</div>
        </div>
        ${
          p.reducedDollars
            ? `<div>
                 <div class="label">Reduced to</div>
                 <div class="value" style="color:#009776">${escapeHtml(p.reducedDollars)}</div>
               </div>`
            : ''
        }
        ${
          p.decision === 'cancelled'
            ? `<div>
                 <div class="label">Amount now owed</div>
                 <div class="value" style="color:#009776">$0.00</div>
               </div>`
            : ''
        }
      </div>
    </section>

    <section class="reasoning">
      <h3>Screening Officer's reasoning</h3>
      <p>${escapeHtml(p.reasoning) || '(no reasoning recorded)'}</p>
    </section>

    <section class="cta">${escapeHtml(p.decisionCta)}</section>

    <section class="rights">
      <h3>Your rights</h3>
      <p>
        If you disagree with this decision, you may request a hearing before a Hearing Officer within 15 days of
        the decision date shown above. Hearing Officers are independent of City staff. Contact City Court Services
        at 905-450-4770 or visit 5 Ray Lawson Blvd, Brampton, L6Y 5L7.
      </p>
    </section>

    <div class="footer">
      <span>FairPlan · City of Brampton APS · Notice of Decision</span>
      <span class="mono">${escapeHtml(p.reviewId)}</span>
    </div>
  </main>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
