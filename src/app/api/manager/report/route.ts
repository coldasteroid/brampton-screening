import { requireRole } from '~/lib/auth';
import { decisionMix, managerKpis, offenceLoad, wardLoad } from '~/lib/db';
import { getBramptonProfile } from '~/lib/data/statcan';
import { getCurrentUser } from '~/lib/auth-server';
import { env } from '~/lib/runtime';

const DECISION_LABEL: Record<string, string> = {
  cancelled: 'Cancelled',
  reduced: 'Reduced',
  upheld: 'Upheld',
  hearing_required: 'Sent to hearing',
};

export async function GET() {
  const guard = requireRole(await getCurrentUser(), ['manager']);
  if (!guard.ok) return new Response('forbidden', { status: 403 });

  const e = env();
  const [kpis, mix, byWard, byOffence, profile] = await Promise.all([
    managerKpis(e.DB),
    decisionMix(e.DB),
    wardLoad(e.DB),
    offenceLoad(e.DB),
    getBramptonProfile(),
  ]);

  const totalDecided = mix.reduce((a, r) => a + r.n, 0);
  const generatedAt = new Date().toLocaleString('en-CA', { dateStyle: 'long', timeStyle: 'short' });

  const html = renderReport({ kpis, mix, byWard, byOffence, profile, totalDecided, generatedAt });
  return new Response(html, {
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
  });
}

interface ReportArgs {
  kpis: Awaited<ReturnType<typeof managerKpis>>;
  mix: Awaited<ReturnType<typeof decisionMix>>;
  byWard: Awaited<ReturnType<typeof wardLoad>>;
  byOffence: Awaited<ReturnType<typeof offenceLoad>>;
  profile: Awaited<ReturnType<typeof getBramptonProfile>>;
  totalDecided: number;
  generatedAt: string;
}

function renderReport(p: ReportArgs): string {
  const money = (n: number) => `$${n.toLocaleString('en-CA', { maximumFractionDigits: 0 })}`;
  const pct = (r: number) => `${Math.round(r * 100)}%`;

  const kpiCards = [
    ['Open reviews', String(p.kpis.openReviews)],
    ['Decided this week', String(p.kpis.decidedThisWeek)],
    ['Cancellation rate', pct(p.kpis.cancellationRate)],
    ['Reduction rate', pct(p.kpis.reductionRate)],
    ['Hearing referrals', pct(p.kpis.hearingRate)],
    ['Active payment plans', String(p.kpis.plansActive)],
    ['Total open balance', money(p.kpis.totalDueDollars)],
  ]
    .map(
      ([label, value]) =>
        `<div class="kpi"><div class="kpi-label">${escapeHtml(label)}</div><div class="kpi-value">${escapeHtml(value)}</div></div>`,
    )
    .join('');

  const mixRows = p.mix
    .map(
      (m) =>
        `<tr><td>${escapeHtml(DECISION_LABEL[m.decision] ?? m.decision)}</td><td class="num">${m.n}</td><td class="num">${
          p.totalDecided ? Math.round((m.n / p.totalDecided) * 100) : 0
        }%</td></tr>`,
    )
    .join('');

  const wardRows = p.byWard
    .map(
      (w) =>
        `<tr><td>Ward ${w.ward}</td><td class="num">${w.openCases}</td><td class="num">${money(w.totalDueDollars)}</td><td class="num">${w.decidedReviews}</td></tr>`,
    )
    .join('');

  const offenceRows = p.byOffence
    .map(
      (o) =>
        `<tr><td>${escapeHtml(o.offence_label)}</td><td class="num">${o.n}</td><td class="num">${money(o.total_cents / 100)}</td></tr>`,
    )
    .join('');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>APS Operational Report · City of Brampton</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #FAFAF7; font-family: 'Inter', system-ui, sans-serif; color: #0B1F3A; line-height: 1.5; }
  .toolbar { position: sticky; top: 0; z-index: 10; background: #0B1F3A; color: #fff; padding: 0.75rem 1.5rem; display: flex; justify-content: space-between; align-items: center; }
  .toolbar button { background: #005EB8; color: #fff; border: 0; font: inherit; font-weight: 600; padding: 0.5rem 1rem; border-radius: 0.5rem; cursor: pointer; }
  main { max-width: 880px; margin: 2.5rem auto; background: #fff; border: 1px solid #E5E7EB; border-radius: 1rem; padding: 3rem; box-shadow: 0 8px 32px -16px rgba(11,31,58,0.15); }
  h1 { font-family: 'Fraunces', Georgia, serif; font-size: 1.9rem; margin: 0 0 0.25rem; letter-spacing: -0.02em; }
  .sub { color: #475569; font-size: 0.95rem; margin: 0; }
  h2 { font-family: 'Fraunces', serif; font-size: 1.15rem; margin: 2.5rem 0 0.75rem; }
  .kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: #E5E7EB; border: 1px solid #E5E7EB; border-radius: 0.75rem; overflow: hidden; margin-top: 1.5rem; }
  .kpi { background: #fff; padding: 1rem 1.25rem; }
  .kpi-label { font-size: 0.65rem; letter-spacing: 0.12em; text-transform: uppercase; color: #64748B; }
  .kpi-value { font-family: 'Fraunces', serif; font-size: 1.5rem; margin-top: 0.25rem; }
  table { width: 100%; border-collapse: collapse; font-size: 0.9rem; margin-top: 0.5rem; }
  th, td { text-align: left; padding: 0.55rem 0.75rem; border-bottom: 1px solid #EEF0F3; }
  th { font-size: 0.65rem; letter-spacing: 0.12em; text-transform: uppercase; color: #64748B; }
  td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
  .footer { margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid #E5E7EB; font-size: 0.72rem; color: #64748B; }
  @media print { body { background: #fff; } .toolbar { display: none; } main { box-shadow: none; border: 0; padding: 0; margin: 0; max-width: none; } }
</style>
</head>
<body>
  <div class="toolbar">
    <span>APS Operational Report</span>
    <button onclick="window.print()">Save as PDF</button>
  </div>
  <main>
    <header>
      <h1>Administrative Penalty System — Operational Report</h1>
      <p class="sub">City of Brampton · FairPlan · Generated ${escapeHtml(p.generatedAt)}</p>
    </header>

    <h2>Key indicators</h2>
    <div class="kpis">${kpiCards}</div>

    <h2>Decision mix (${p.totalDecided} decided to date)</h2>
    <table>
      <thead><tr><th>Outcome</th><th class="num">Count</th><th class="num">Share</th></tr></thead>
      <tbody>${mixRows || '<tr><td colspan="3">No decisions recorded yet.</td></tr>'}</tbody>
    </table>

    <h2>Load by ward</h2>
    <table>
      <thead><tr><th>Ward</th><th class="num">Open</th><th class="num">Open balance</th><th class="num">Decided</th></tr></thead>
      <tbody>${wardRows || '<tr><td colspan="4">No ward data.</td></tr>'}</tbody>
    </table>

    <h2>Offence breakdown</h2>
    <table>
      <thead><tr><th>Offence</th><th class="num">Notices</th><th class="num">Total exposure</th></tr></thead>
      <tbody>${offenceRows || '<tr><td colspan="3">No notices.</td></tr>'}</tbody>
    </table>

    <h2>Equity context</h2>
    <table>
      <tbody>
        <tr><td>Population</td><td class="num">${p.profile.totalPopulation.toLocaleString('en-CA')}</td></tr>
        <tr><td>Median household income</td><td class="num">${money(p.profile.medianHouseholdIncomeCAD)}</td></tr>
        <tr><td>Below LIM-AT</td><td class="num">${p.profile.lowIncomePctLIM}%</td></tr>
      </tbody>
    </table>

    <div class="footer">
      Sources: FairPlan D1 (operational data) · Statistics Canada Census 2021, CSD 3521010 (equity context).
      January 2026 penalty schedule in effect. Generated by the FairPlan manager console.
    </div>
  </main>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
}
