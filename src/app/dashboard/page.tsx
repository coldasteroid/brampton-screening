import type { Metadata } from 'next';
import WardsMap from '~/components/WardsMap';
import PredictiveCollections from '~/components/PredictiveCollections';
import { ticketsByWard, listTickets } from '~/lib/db';
import { getRateBundle } from '~/lib/data/boc';
import { getBramptonProfile } from '~/lib/data/statcan';
import { recommendStrategy } from '~/lib/collections';
import { env } from '~/lib/runtime';

export const metadata: Metadata = { title: 'Public dashboard · FairPlan' };

export default async function DashboardPage() {
  const e = env();
  const [byWard, recent, rates, profile] = await Promise.all([
    ticketsByWard(e.DB),
    listTickets(e.DB, 50),
    getRateBundle(),
    getBramptonProfile(),
  ]);

  const now = Date.now();
  const atRisk = recent
    .filter((t) => t.status === 'open')
    .map((t) => {
      const daysToDue = (Date.parse(t.due_at) - now) / 86_400_000;
      const risk = Math.min(1, Math.max(0, 1.2 - daysToDue / 15));
      const amount = t.amount_cents / 100;
      return {
        id: t.id,
        ward: t.ward,
        label: t.offence_label,
        amount,
        daysToDue,
        risk,
        strategy: recommendStrategy({ risk, daysToDue, amount }),
      };
    })
    .sort((a, b) => b.risk - a.risk)
    .slice(0, 8);

  const open = recent.filter((t) => t.status === 'open');
  const openCents = open.reduce((a, t) => a + t.amount_cents, 0);
  const openCount = open.length;
  const avg = openCount ? Math.round(openCents / openCount / 100) : 0;

  const kpis = [
    {
      label: 'Open notices',
      value: openCount.toLocaleString('en-CA'),
      sub: 'In FairPlan demo dataset',
      accent: false,
    },
    {
      label: 'Outstanding balance',
      value: `$${(openCents / 100).toLocaleString('en-CA')}`,
      sub: 'Sum of unpaid notices',
      accent: false,
    },
    {
      label: 'Average notice',
      value: `$${avg.toLocaleString('en-CA')}`,
      sub: '2026 penalty schedule',
      accent: false,
    },
    {
      label: 'Credit-card APR benchmark',
      value: `${rates.averageCreditCardAPR.toFixed(2)}%`,
      sub: `vs FairPlan 0% APR · BoC ${rates.asOf}`,
      accent: true,
    },
  ];

  const profileRows = [
    { label: 'Population', value: profile.totalPopulation.toLocaleString('en-CA') },
    {
      label: 'Median household income',
      value: `$${profile.medianHouseholdIncomeCAD.toLocaleString('en-CA')}`,
    },
    { label: 'Below LIM-AT', value: `${profile.lowIncomePctLIM}%` },
    { label: 'Visible minority', value: `${profile.visibleMinorityPct}%` },
  ];

  return (
    <>
      <section className="border-b border-line/60">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10 py-14 md:py-20">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-fair-dark">Public dashboard</p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl text-balance">
            Real-time view of Brampton APS notices, fairness overlays, and predicted collections.
          </h1>
          <p className="mt-4 max-w-2xl text-ink-soft text-balance">
            Live ward boundaries from Brampton GeoHub, Bank of Canada rates from the Valet API, and Statistics
            Canada 2021 census data. Notice rows are demo data seeded against the Council-approved Jan 2026
            penalty schedule.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-6 lg:px-10 pt-10">
        <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-4">
          {kpis.map((k) => (
            <div key={k.label} className={`bg-surface-raised p-6 ${k.accent ? 'ring-1 ring-fair/30' : ''}`}>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-subtle">{k.label}</p>
              <p
                className={`mt-2 font-display text-3xl font-semibold tracking-tight ${k.accent ? 'text-fair-dark' : 'text-ink'}`}
              >
                {k.value}
              </p>
              {k.sub && <p className="mt-1 text-xs text-ink-subtle">{k.sub}</p>}
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-6 lg:px-10 py-12">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <article className="space-y-5">
            <header className="flex items-end justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-subtle">
                  Geographic overlay
                </p>
                <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">
                  Active notices by ward
                </h2>
              </div>
              <p className="text-xs text-ink-subtle">Live · Brampton GeoHub</p>
            </header>
            <WardsMap byWard={byWard} />
            <p className="text-xs text-ink-subtle text-balance">
              Tile basemap: CARTO Light · ward polygons: Brampton GeoHub ArcGIS Feature Service. Intensity reflects
              the number of active notices per ward in the demo dataset.
            </p>
          </article>

          <article className="space-y-5">
            <header>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-subtle">
                Predictive collections
              </p>
              <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">
                At-risk cases this week
              </h2>
            </header>
            <div className="card p-6">
              <PredictiveCollections cases={atRisk} />
            </div>
            <p className="text-xs text-ink-subtle text-balance">
              Risk score combines time-to-due, amount, and (in production) hardship-band and repeat-offender
              history. Drives FairPlan&apos;s proactive reminder cadence — replaces today&apos;s automatic
              credit-bureau referral.
            </p>
          </article>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-6 lg:px-10 pb-24">
        <div className="card overflow-hidden">
          <div className="border-b border-line bg-surface-sunken px-6 py-4 md:flex md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-subtle">Equity profile</p>
              <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">Brampton at a glance</h2>
            </div>
            <p className="mt-2 text-xs text-ink-subtle md:mt-0">
              Statistics Canada Census 2021 · CSD 3521010
            </p>
          </div>
          <div className="grid gap-px bg-line md:grid-cols-4">
            {profileRows.map((r) => (
              <div key={r.label} className="bg-surface-raised p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-subtle">{r.label}</p>
                <p className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink">{r.value}</p>
              </div>
            ))}
          </div>
          <div className="px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-subtle">
              Top languages spoken at home
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {profile.topLanguages.map((l) => (
                <span key={l.language} className="pill border border-line bg-surface-raised text-ink">
                  {l.language} <span className="text-ink-subtle">{l.share.toFixed(1)}%</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
