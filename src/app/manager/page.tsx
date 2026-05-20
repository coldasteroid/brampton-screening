import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { requireRole } from '~/lib/auth';
import { decisionMix, managerKpis, offenceLoad, wardLoad } from '~/lib/db';
import { getBramptonProfile } from '~/lib/data/statcan';
import { getCurrentUser } from '~/lib/auth-server';
import { env } from '~/lib/runtime';

export const metadata: Metadata = { title: 'Manager analytics · FairPlan' };

const DECISION_META: Record<string, { label: string; tone: string }> = {
  cancelled: { label: 'Cancelled', tone: 'bg-fair text-ink' },
  reduced: { label: 'Reduced', tone: 'bg-warn text-ink' },
  upheld: { label: 'Upheld', tone: 'bg-ink text-white' },
  hearing_required: { label: 'Sent to hearing', tone: 'bg-indigo-500 text-white' },
};

export default async function ManagerPage() {
  const user = await getCurrentUser();
  const guard = requireRole(user, ['manager']);
  if (!guard.ok) redirect(guard.redirect);

  const e = env();
  const [kpis, mix, byWard, byOffence, profile] = await Promise.all([
    managerKpis(e.DB),
    decisionMix(e.DB),
    wardLoad(e.DB),
    offenceLoad(e.DB),
    getBramptonProfile(),
  ]);

  const totalDecided = mix.reduce((a, r) => a + r.n, 0);
  const wardMax = Math.max(1, ...byWard.map((w) => w.openCases));

  const kpiBlocks = [
    { label: 'Open reviews', value: kpis.openReviews.toString(), sub: 'In screening queue', accent: false },
    { label: 'Decided this week', value: kpis.decidedThisWeek.toString(), sub: 'Last 7 days', accent: false },
    {
      label: 'Cancellation rate',
      value: `${Math.round(kpis.cancellationRate * 100)}%`,
      sub: 'Of all decided reviews',
      accent: false,
    },
    {
      label: 'Hearing referrals',
      value: `${Math.round(kpis.hearingRate * 100)}%`,
      sub: 'Of all decided reviews',
      accent: false,
    },
    { label: 'Active payment plans', value: kpis.plansActive.toString(), sub: 'FairPlan instalments', accent: false },
    {
      label: 'Total open balance',
      value: `$${kpis.totalDueDollars.toLocaleString('en-CA', { maximumFractionDigits: 0 })}`,
      sub: 'Unpaid notices',
      accent: true,
    },
  ];

  return (
    <>
      <section className="border-b border-line/60">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10 py-12 md:py-16">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-fair-dark">Manager console</p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl text-balance">
            Operational view, hands-on context.
          </h1>
          <p className="mt-3 max-w-prose text-ink-soft">
            Trends across the screening queue, decision mix, geographic load, and equity overlays — drawn from D1
            and Statistics Canada at request time.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-6 lg:px-10 pt-10">
        <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-3 lg:grid-cols-6">
          {kpiBlocks.map((k) => (
            <div key={k.label} className={`bg-surface-raised p-6 ${k.accent ? 'ring-1 ring-fair/30' : ''}`}>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-subtle">{k.label}</p>
              <p
                className={`mt-2 font-display text-2xl font-semibold tracking-tight ${k.accent ? 'text-fair-dark' : 'text-ink'}`}
              >
                {k.value}
              </p>
              {k.sub && <p className="mt-1 text-xs text-ink-subtle">{k.sub}</p>}
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-6 lg:px-10 py-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <article className="card overflow-hidden">
            <div className="border-b border-line bg-surface-sunken px-6 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-subtle">Decision mix</p>
              <p className="mt-1 font-display text-lg font-semibold">
                {totalDecided} {totalDecided === 1 ? 'decision' : 'decisions'} to date
              </p>
            </div>
            <div className="px-6 py-6">
              {totalDecided === 0 ? (
                <p className="text-sm text-ink-soft">No decisions recorded yet.</p>
              ) : (
                <div className="space-y-4">
                  <div className="flex h-3 overflow-hidden rounded-full bg-surface-sunken">
                    {mix.map((m) => {
                      const meta = DECISION_META[m.decision] ?? DECISION_META.upheld;
                      const pct = (m.n / totalDecided) * 100;
                      return (
                        <span
                          key={m.decision}
                          className={`block h-full ${meta.tone}`}
                          style={{ width: `${pct}%` }}
                          title={`${meta.label}: ${m.n}`}
                        />
                      );
                    })}
                  </div>
                  <ul className="space-y-2 text-sm">
                    {mix.map((m) => {
                      const meta = DECISION_META[m.decision] ?? DECISION_META.upheld;
                      const pct = ((m.n / totalDecided) * 100).toFixed(0);
                      return (
                        <li key={m.decision} className="flex items-center justify-between">
                          <span className="flex items-center gap-2.5">
                            <span className={`h-2.5 w-2.5 rounded-full ${meta.tone}`} aria-hidden="true" />
                            <span className="font-medium text-ink">{meta.label}</span>
                          </span>
                          <span className="font-mono text-ink-subtle">
                            {m.n} · {pct}%
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          </article>

          <article className="card overflow-hidden">
            <div className="border-b border-line bg-surface-sunken px-6 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-subtle">Ward load</p>
              <p className="mt-1 font-display text-lg font-semibold">Open notices by ward</p>
            </div>
            <div className="px-6 py-6">
              <ul className="space-y-3">
                {byWard.map((w) => {
                  const pct = (w.openCases / wardMax) * 100;
                  return (
                    <li key={w.ward}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-ink">Ward {w.ward}</span>
                        <span className="font-mono text-ink-subtle">
                          {w.openCases} open · $
                          {w.totalDueDollars.toLocaleString('en-CA', { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-sunken">
                        <div className="h-full rounded-full bg-fair" style={{ width: `${pct}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </article>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-6 lg:px-10 pb-12">
        <article className="card overflow-hidden">
          <div className="border-b border-line bg-surface-sunken px-6 py-4 md:flex md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-subtle">
                Offence breakdown
              </p>
              <p className="mt-1 font-display text-lg font-semibold">Volume and revenue exposure</p>
            </div>
            <p className="mt-2 text-xs text-ink-subtle md:mt-0">
              January 2026 penalty schedule in effect
            </p>
          </div>
          <table className="w-full divide-y divide-line text-sm">
            <thead className="bg-surface-sunken text-left">
              <tr>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-ink-subtle">
                  Offence
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-ink-subtle">
                  Notices
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-ink-subtle">
                  Total exposure
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-surface-raised">
              {byOffence.map((o) => (
                <tr key={o.offence_label}>
                  <td className="px-5 py-3 text-ink">{o.offence_label}</td>
                  <td className="px-5 py-3 font-mono text-ink-soft">{o.n}</td>
                  <td className="px-5 py-3 font-mono text-ink-soft">
                    ${(o.total_cents / 100).toLocaleString('en-CA')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      </section>

      <section className="mx-auto max-w-[1400px] px-6 lg:px-10 pb-24">
        <article className="card overflow-hidden">
          <div className="border-b border-line bg-surface-sunken px-6 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-subtle">Equity context</p>
            <p className="mt-1 font-display text-lg font-semibold">Brampton at a glance</p>
            <p className="mt-1 text-xs text-ink-subtle">
              Used by the FairPlan agent to calibrate hardship bands · Statistics Canada Census 2021, CSD 3521010
            </p>
          </div>
          <div className="grid gap-px bg-line md:grid-cols-3">
            <div className="bg-surface-raised p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-subtle">Population</p>
              <p className="mt-2 font-display text-2xl font-semibold">
                {profile.totalPopulation.toLocaleString('en-CA')}
              </p>
            </div>
            <div className="bg-surface-raised p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-subtle">
                Median household income
              </p>
              <p className="mt-2 font-display text-2xl font-semibold">
                ${profile.medianHouseholdIncomeCAD.toLocaleString('en-CA')}
              </p>
            </div>
            <div className="bg-surface-raised p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-subtle">Below LIM-AT</p>
              <p className="mt-2 font-display text-2xl font-semibold">{profile.lowIncomePctLIM}%</p>
            </div>
          </div>
        </article>
      </section>
    </>
  );
}
