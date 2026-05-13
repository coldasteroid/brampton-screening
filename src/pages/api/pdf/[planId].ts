import type { APIRoute } from 'astro';

export const prerender = false;

/**
 * Returns a print-optimized HTML agreement for a payment plan.
 *
 * Local development ships HTML directly — the resident clicks "Save as PDF"
 * from the toolbar, the browser produces a clean PDF, and there is no
 * external dependency.
 *
 * Production upgrade (one paragraph): install `@cloudflare/puppeteer`, bind
 * BROWSER in wrangler.jsonc, and replace the `return new Response(html, …)`
 * below with:
 *
 *   const browser = await puppeteer.launch(env.BROWSER);
 *   const page = await browser.newPage();
 *   await page.setContent(html, { waitUntil: 'networkidle0' });
 *   const pdf = await page.pdf({ format: 'A4', printBackground: true });
 *   await browser.close();
 *   await env.EVIDENCE.put(`agreements/${planId}.pdf`, pdf, …);
 *   return new Response(pdf, { headers: { 'content-type': 'application/pdf', … } });
 */
export const GET: APIRoute = async ({ params, locals }) => {
  const env = locals.runtime.env;
  const planId = params.planId?.toString() ?? '';
  if (!planId) return new Response('missing planId', { status: 400 });

  const row = await env.DB.prepare(
    `SELECT p.*, t.offence_label, t.location_text, t.plate, t.id AS ticket_id, t.amount_cents, t.issued_at
     FROM payment_plans p JOIN tickets t ON t.id = p.ticket_id
     WHERE p.id = ?1 LIMIT 1`,
  )
    .bind(planId)
    .first<any>();

  if (!row) return new Response('plan not found', { status: 404 });

  const monthly = (row.monthly_cents / 100).toLocaleString('en-CA', { style: 'currency', currency: 'CAD' });
  const total = (row.total_cents / 100).toLocaleString('en-CA', { style: 'currency', currency: 'CAD' });

  const html = renderAgreement({
    planId,
    ticketId: row.ticket_id,
    offenceLabel: row.offence_label,
    location: row.location_text ?? '—',
    plate: row.plate,
    months: row.months,
    monthly,
    total,
    firstPayment: row.first_payment_at,
    band: row.hardship_band,
    language: row.language,
    signedAt: row.signed_at ?? new Date().toISOString(),
  });

  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
};

interface AgreementProps {
  planId: string;
  ticketId: string;
  offenceLabel: string;
  location: string;
  plate: string;
  months: number;
  monthly: string;
  total: string;
  firstPayment: string;
  band: string;
  language: string;
  signedAt: string;
}

function renderAgreement(p: AgreementProps): string {
  const dateStr = new Date(p.signedAt).toLocaleDateString('en-CA', { dateStyle: 'long' });
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>FairPlan Agreement · ${p.planId}</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: #FAFAF7;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    color: #0B1F3A;
    line-height: 1.55;
  }
  .toolbar { position: sticky; top: 0; z-index: 10; background: #0B1F3A; color: #fff; padding: 0.75rem 1.5rem; display: flex; justify-content: space-between; align-items: center; }
  .toolbar button { background: #00C49A; color: #0B1F3A; border: 0; font: inherit; font-weight: 600; padding: 0.5rem 1rem; border-radius: 0.5rem; cursor: pointer; }
  main { max-width: 760px; margin: 2.5rem auto; background: #fff; border: 1px solid #E5E7EB; border-radius: 1rem; padding: 3rem; box-shadow: 0 8px 32px -16px rgba(11,31,58,0.15); }
  h1 { font-family: 'Fraunces', Georgia, serif; font-size: 2.25rem; margin: 0 0 0.25rem; letter-spacing: -0.02em; }
  .sub { color: #475569; font-size: 0.95rem; margin: 0; }
  .meta { margin-top: 2.5rem; display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem 2rem; }
  .meta dt { font-size: 0.7rem; letter-spacing: 0.14em; text-transform: uppercase; color: #64748B; margin-bottom: 0.25rem; }
  .meta dd { margin: 0; font-weight: 500; }
  .panel { margin-top: 2.5rem; background: linear-gradient(135deg, rgba(0,196,154,0.08), rgba(0,196,154,0)); border: 1px solid rgba(0,196,154,0.3); border-radius: 0.75rem; padding: 1.75rem; }
  .panel h2 { font-family: 'Fraunces', serif; font-size: 1.5rem; margin: 0 0 0.5rem; }
  .terms { margin-top: 2.5rem; }
  .terms h3 { font-family: 'Fraunces', serif; font-size: 1.15rem; margin: 1.5rem 0 0.5rem; }
  .terms p { font-size: 0.92rem; color: #1E3252; margin: 0.4rem 0; }
  .sig { margin-top: 3rem; display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; align-items: end; }
  .sig div { border-top: 1px solid #0B1F3A; padding-top: 0.4rem; font-size: 0.78rem; color: #475569; }
  .footer { margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid #E5E7EB; font-size: 0.72rem; color: #64748B; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; }
  .mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }
  @media print {
    body { background: #fff; }
    .toolbar { display: none; }
    main { box-shadow: none; border: 0; padding: 0; margin: 0; max-width: none; }
  }
</style>
</head>
<body>
  <div class="toolbar">
    <span>FairPlan Agreement · ${p.planId.slice(0, 8)}</span>
    <button onclick="window.print()">Save as PDF</button>
  </div>
  <main>
    <header>
      <h1>Payment Plan Agreement</h1>
      <p class="sub">City of Brampton · Administrative Penalty System · Notice <span class="mono">${p.ticketId}</span></p>
    </header>

    <dl class="meta">
      <div><dt>Offence</dt><dd>${escapeHtml(p.offenceLabel)}</dd></div>
      <div><dt>Location</dt><dd>${escapeHtml(p.location)}</dd></div>
      <div><dt>Vehicle / plate</dt><dd class="mono">${escapeHtml(p.plate)}</dd></div>
      <div><dt>Hardship band</dt><dd>${escapeHtml(p.band)}</dd></div>
      <div><dt>Language</dt><dd>${escapeHtml(p.language.toUpperCase())}</dd></div>
      <div><dt>Date signed</dt><dd>${escapeHtml(dateStr)}</dd></div>
    </dl>

    <section class="panel">
      <h2>${p.months} monthly instalments of ${p.monthly}</h2>
      <p>Total: <strong>${p.total}</strong> · APR: <strong>0.00%</strong> · First payment: ${escapeHtml(new Date(p.firstPayment).toLocaleDateString('en-CA', { dateStyle: 'long' }))}</p>
    </section>

    <section class="terms">
      <h3>1. The City charges no interest.</h3>
      <p>FairPlan instalment plans are offered at 0% APR. No service fees are added to the principal.</p>
      <h3>2. Missed payments are handled with care, not collections.</h3>
      <p>If a payment is missed, the City will contact the resident in their selected language and offer a no-penalty rebalance before any escalation. No automatic credit-bureau referral is issued.</p>
      <h3>3. The resident may change the plan at any time.</h3>
      <p>Length of plan, monthly amount, and first-payment date can be adjusted in the FairPlan portal at no charge.</p>
      <h3>4. Information used.</h3>
      <p>The hardship band is calibrated using Statistics Canada's Low Income Measure After Tax (LIM-AT) threshold for 2024, adjusted for household size per StatCan methodology. Income data submitted is not retained beyond the active plan.</p>
      <h3>5. Right to a Screening Review.</h3>
      <p>Accepting a payment plan does not waive the resident's right to dispute the underlying notice under section 7 of the City's Administrative Penalty System by-law.</p>
    </section>

    <div class="sig">
      <div>Resident signature (e-signed)</div>
      <div>City of Brampton — Court Services</div>
    </div>

    <div class="footer">
      <span>FairPlan · POC for the City of Brampton AI Program</span>
      <span class="mono">${p.planId}</span>
    </div>
  </main>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
