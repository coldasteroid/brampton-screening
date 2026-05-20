import type { Metadata } from 'next';
import TicketLookup from '~/components/TicketLookup';
import LiveStat from '~/components/LiveStat';

export const metadata: Metadata = {
  title: 'FairPlan — Brampton APS Modernization',
};

const benefits = [
  {
    title: 'Automated screening intake',
    body: 'Photo, free-text, or speech evidence enters one structured case in seconds — bilingual, with bylaw citations attached.',
  },
  {
    title: 'Screening Officer copilot',
    body: "A draft recommendation lands in the officer's queue with every relevant facts row, citation, and risk flag pre-populated.",
  },
  {
    title: 'Auto-correspondence',
    body: "Notices of Affirmation, Decision, and Reminders generated in the resident's language and delivered via email or PDF.",
  },
  {
    title: 'Personalized payment plans',
    body: '3 / 6 / 12-month plans calibrated to Statistics Canada LIM-AT, 0% APR, with a live credit-card cost comparison.',
  },
  {
    title: 'Predictive collections',
    body: 'Flags cases at risk of default before the 15-day window closes — intervenes with reminders, not credit-bureau referrals.',
  },
  {
    title: 'Manager dashboards',
    body: 'Equity overlays, ward-level trend lines, collection forecasts — the operational view Council expects in 2026.',
  },
];

const story = [
  {
    n: '01',
    title: 'Look up your notice',
    body: 'Enter the notice number from your ticket. We surface every detail — bylaw, due date, location — in your language.',
  },
  {
    n: '02',
    title: 'See it explained, calmly',
    body: 'Our agent reads the bylaw in plain language — no legalese, no judgement. Multilingual translation routes through Workers AI in the next sprint.',
  },
  {
    n: '03',
    title: 'Choose how to pay',
    body: 'Pay now, dispute through Screening Review, or activate a hardship-aware plan that fits your income. 0% APR.',
  },
];

export default function Home() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl gap-14 px-6 pt-16 pb-20 md:grid-cols-[1.05fr_0.95fr] md:pt-24 md:pb-28 md:gap-16">
          <div className="relative">
            <span className="pill border border-line bg-surface-raised text-ink-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-fair animate-pulse" aria-hidden />
              City of Brampton AI POC · 2026
            </span>
            <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.05] tracking-tight text-balance md:text-6xl">
              A penalty notice <span className="italic text-ink-soft">shouldn&apos;t</span>
              <br className="hidden md:block" />
              push a family into default.
            </h1>
            <p className="mt-6 max-w-prose text-lg leading-relaxed text-ink-soft text-balance">
              FairPlan modernizes Brampton&apos;s Administrative Penalty System with AI-assisted screening,
              multilingual explanations, and personalized payment plans calibrated to household hardship —
              built end-to-end on Cloudflare.
            </p>

            <div className="mt-9">
              <TicketLookup variant="hero" />
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-3 text-xs text-ink-subtle">
              <span className="pill bg-surface-sunken">No login required</span>
              <span className="pill bg-surface-sunken">Multilingual-ready architecture</span>
              <span className="pill bg-surface-sunken">AODA-aware</span>
            </div>
          </div>

          <aside className="relative">
            <div
              className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-fair-light/40 via-transparent to-ink-soft/10 blur-2xl"
              aria-hidden
            />
            <div className="card overflow-hidden">
              <div className="border-b border-line bg-surface-sunken px-6 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-subtle">
                  A real Brampton resident, today
                </p>
                <p className="mt-1 font-display text-lg font-semibold text-ink">
                  $750 — Property Maintenance, Ward 9
                </p>
              </div>
              <div className="space-y-5 px-6 py-6">
                <div className="grid grid-cols-2 gap-5 text-sm">
                  <div>
                    <p className="text-ink-subtle">Issued under</p>
                    <p className="font-medium text-ink">Property Standards 119-2019</p>
                  </div>
                  <div>
                    <p className="text-ink-subtle">Due in</p>
                    <p className="font-medium text-ink">15 days · no extensions</p>
                  </div>
                  <div>
                    <p className="text-ink-subtle">If unpaid</p>
                    <p className="font-medium text-ink">Credit-bureau referral</p>
                  </div>
                  <div>
                    <p className="text-ink-subtle">Payment plans today</p>
                    <p className="font-medium text-danger">None offered</p>
                  </div>
                </div>
                <div className="rounded-xl border border-fair/30 bg-fair/5 p-5">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-fair animate-pulse" />
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-fair-dark">
                      With FairPlan
                    </p>
                  </div>
                  <p className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink">
                    12 × <span className="tabular-nums">$62.50</span>
                    <span className="text-ink-subtle">/mo</span>
                  </p>
                  <p className="mt-1 text-sm text-ink-soft">
                    0% APR · LIM-AT calibrated · agreement signed in 4 minutes
                  </p>
                  <p className="mt-3 text-xs text-ink-subtle">
                    Equivalent credit-card cost over 12 months at 21.99% APR:{' '}
                    <span className="text-danger">+$93.40 in interest</span>
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <div className="border-y border-line/60 bg-surface-raised/70">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-10 px-6 py-10 md:grid-cols-4 md:gap-6">
            <LiveStat
              label="Brampton residents"
              endpoint="/api/stats/population"
              format="number"
              fallback="656,480"
              hint="Statistics Canada 2021"
            />
            <LiveStat
              label="Bank of Canada prime"
              endpoint="/api/boc/prime"
              format="percent"
              fallback="5.45%"
              hint="Live · Valet API"
            />
            <LiveStat
              label="Languages at home"
              endpoint="/api/stats/languages"
              format="number"
              fallback="160+"
              hint="StatCan 2021 census"
            />
            <LiveStat
              label="2026 revenue uplift"
              endpoint="/api/stats/revenue"
              format="currency"
              fallback="$1,970,000"
              hint="Council projection · Jan 1 2026"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-6 lg:px-10 py-24">
        <header className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-fair-dark">
            How a resident moves through it
          </p>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight">
            Three steps, three minutes, three languages.
          </h2>
        </header>
        <ol className="mt-12 grid gap-6 md:grid-cols-3">
          {story.map((s) => (
            <li key={s.n} className="card p-7">
              <p className="font-mono text-xs text-fair-dark">{s.n}</p>
              <h3 className="mt-4 font-display text-2xl font-semibold tracking-tight">{s.title}</h3>
              <p className="mt-3 text-ink-soft leading-relaxed">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-[1400px] px-6 lg:px-10 py-16">
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-fair-dark">
              Every line item from the City&apos;s POC brief
            </p>
            <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight">
              Six benefits. One end-to-end system.
            </h2>
          </div>
          <a href="/dashboard" className="btn-ghost self-start text-sm">
            View the public dashboard →
          </a>
        </header>
        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-3">
          {benefits.map((b) => (
            <article key={b.title} className="bg-surface-raised p-7">
              <h3 className="font-display text-lg font-semibold tracking-tight text-ink">{b.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">{b.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-6 lg:px-10 py-16">
        <div className="card overflow-hidden">
          <div className="grid gap-10 p-10 md:grid-cols-[1fr_1.1fr] md:gap-14 md:p-14">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-fair-dark">Why Cloudflare</p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-4xl">
                Edge-native, audit-grade, and procurement-ready from day one.
              </h2>
              <p className="mt-5 leading-relaxed text-ink-soft text-balance">
                FairPlan runs on Cloudflare Workers, with a Durable Object per ticket holding stateful agent
                context. Every model call routes through AI Gateway for visible cost tracking, caching, and PII
                redaction — exactly the governance posture a Canadian municipality needs.
              </p>
            </div>
            <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line text-sm">
              {[
                ['Workers Assets', 'Next.js + React on the edge'],
                ['Durable Objects', 'One case agent per ticket'],
                ['D1', 'Audit log with point-in-time restore'],
                ['Vectorize', 'RAG over Brampton bylaws (next sprint)'],
                ['Workers AI', 'Multilingual, on-platform inference'],
                ['AI Gateway', 'Cost cap, cache, Claude fallback'],
                ['Browser Rendering', 'Branded PDF agreements'],
                ['R2', 'Evidence & document store'],
              ].map(([k, v]) => (
                <li key={k} className="bg-surface-raised p-5">
                  <p className="font-mono text-xs uppercase tracking-[0.14em] text-fair-dark">{k}</p>
                  <p className="mt-1.5 leading-snug text-ink-soft">{v}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
