import type { Metadata } from 'next';
import Link from 'next/link';
import TicketLookup from '~/components/TicketLookup';
import LiveStat from '~/components/LiveStat';

export const metadata: Metadata = {
  title: 'FairPlan — Brampton APS Modernization',
};

const journey = [
  {
    n: '01',
    title: 'Look up your notice',
    body: 'Enter the notice number from your ticket. Every detail — bylaw, due date, location — surfaces in your language.',
  },
  {
    n: '02',
    title: 'See it explained, calmly',
    body: 'The agent reads the bylaw in plain language. No legalese, no judgement. Multilingual translation built in.',
  },
  {
    n: '03',
    title: 'Choose how to pay',
    body: 'Pay now, request a Screening Review, or activate a hardship-aware payment plan that fits your income. 0% APR.',
  },
];

const actions = [
  {
    href: '/',
    eyebrow: 'Resident portal',
    title: 'Look up a notice',
    body: 'Find your penalty by notice number and see what you owe — translated, with payment options.',
    cta: 'Start with my notice number',
  },
  {
    href: '/bylaws',
    eyebrow: 'Knowledge base',
    title: 'Understand a bylaw',
    body: 'Search the bylaws our agent cites — property standards, parking, rental licensing, AMPS procedure.',
    cta: 'Browse bylaws',
  },
  {
    href: '/my-notices',
    eyebrow: 'Your account',
    title: 'My notices & plans',
    body: 'Track every notice on your account, active payment plans, and Screening Reviews you’ve filed.',
    cta: 'View my account',
  },
];

export default function Home() {
  return (
    <>
      <section className="relative">
        <div className="mx-auto max-w-[1200px] px-6 pt-20 pb-16 lg:px-10 md:pt-28 md:pb-20">
          <div className="max-w-3xl">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-fair-dark">
              Brampton resident portal
            </p>
            <h1 className="mt-5 font-display text-5xl font-semibold leading-[1.04] tracking-tight text-balance md:text-[64px]">
              A penalty notice <span className="italic text-ink-soft">shouldn&apos;t</span>
              <br className="hidden md:block" />
              push a family into default.
            </h1>
            <p className="mt-6 max-w-prose text-lg leading-relaxed text-ink-soft text-balance">
              Look up your Brampton penalty notice, read what it means in your language, and choose a
              payment option that fits your household. No login required.
            </p>

            <div className="mt-10">
              <TicketLookup variant="hero" />
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-2 text-xs text-ink-subtle">
              <span className="pill bg-surface-sunken">No login required</span>
              <span className="pill bg-surface-sunken">English · ਪੰਜਾਬੀ · हिन्दी · Français</span>
              <span className="pill bg-surface-sunken">AODA-aware</span>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-line/60 bg-surface-raised/70">
        <div className="mx-auto grid max-w-[1200px] grid-cols-2 gap-10 px-6 py-10 md:grid-cols-4 md:gap-6 lg:px-10">
          <LiveStat
            label="Brampton residents"
            endpoint="/api/stats/population"
            format="number"
            fallback="656,480"
            hint="Statistics Canada 2021"
          />
          <LiveStat
            label="Languages at home"
            endpoint="/api/stats/languages"
            format="number"
            fallback="160+"
            hint="StatCan 2021 census"
          />
          <LiveStat
            label="Bank of Canada prime"
            endpoint="/api/boc/prime"
            format="percent"
            fallback="5.45%"
            hint="Live · Valet API"
          />
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-fair animate-pulse" aria-hidden />
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-ink-subtle">
                FairPlan APR
              </span>
            </div>
            <p className="font-display text-3xl font-semibold leading-none tracking-tight text-ink">
              0.00%
            </p>
            <p className="text-xs text-ink-subtle">Every plan, every income band</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-6 pt-24 pb-8 lg:px-10">
        <header className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-fair-dark">
            How it works for you
          </p>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight">
            Three steps. Three minutes. Your language.
          </h2>
          <p className="mt-4 text-ink-soft text-balance">
            FairPlan walks you from a paper notice to a clear decision — without phone trees, paperwork,
            or guessing what the bylaw means.
          </p>
        </header>

        <ol className="mt-12 grid gap-6 md:grid-cols-3">
          {journey.map((s) => (
            <li key={s.n} className="card relative overflow-hidden p-7">
              <p className="font-mono text-xs font-semibold tracking-[0.18em] text-fair-dark">
                STEP {s.n}
              </p>
              <h3 className="mt-4 font-display text-2xl font-semibold tracking-tight">{s.title}</h3>
              <p className="mt-3 leading-relaxed text-ink-soft">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-[1200px] px-6 py-20 lg:px-10">
        <header className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-fair-dark">
            One resident, one notice
          </p>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight">
            What this feels like, in practice.
          </h2>
          <p className="mt-4 text-ink-soft text-balance">
            A real situation a Brampton household might face today, and the outcome FairPlan can offer.
          </p>
        </header>

        <div className="mt-10 grid gap-6 md:grid-cols-2 md:gap-8">
          <article className="card overflow-hidden">
            <div className="border-b border-line bg-surface-sunken px-7 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-subtle">
                Notice received
              </p>
              <p className="mt-1 font-display text-xl font-semibold text-ink">
                $750 · Property Maintenance · Ward 9
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-5 px-7 py-7 text-sm">
              <div>
                <dt className="text-ink-subtle">Issued under</dt>
                <dd className="mt-1 font-medium text-ink">Property Standards 119-2019</dd>
              </div>
              <div>
                <dt className="text-ink-subtle">Due in</dt>
                <dd className="mt-1 font-medium text-ink">15 days · no extensions</dd>
              </div>
              <div>
                <dt className="text-ink-subtle">If unpaid</dt>
                <dd className="mt-1 font-medium text-ink">Credit-bureau referral</dd>
              </div>
              <div>
                <dt className="text-ink-subtle">Plans offered today</dt>
                <dd className="mt-1 font-medium text-danger">None</dd>
              </div>
            </dl>
          </article>

          <article className="card overflow-hidden ring-1 ring-fair/30">
            <div className="border-b border-fair/20 bg-fair/5 px-7 py-5">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-fair animate-pulse" aria-hidden />
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-fair-dark">
                  With FairPlan
                </p>
              </div>
              <p className="mt-1 font-display text-xl font-semibold text-ink">
                12 × <span className="tabular-nums">$62.50</span>
                <span className="text-ink-subtle">/mo</span>
              </p>
            </div>
            <div className="space-y-4 px-7 py-7 text-sm">
              <p className="leading-relaxed text-ink-soft">
                0% APR. Calibrated to Statistics Canada LIM-AT for your household size. Agreement signed
                in about four minutes — no call, no office visit.
              </p>
              <div className="rounded-xl border border-line bg-surface-sunken px-5 py-4">
                <p className="text-xs uppercase tracking-[0.16em] text-ink-subtle">
                  Equivalent on a credit card
                </p>
                <p className="mt-1 text-ink">
                  12 months at 21.99% APR ={' '}
                  <span className="font-semibold text-danger">+$93.40 interest</span>
                </p>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-6 pb-24 lg:px-10">
        <header className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-fair-dark">
            What you can do here
          </p>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight">
            Pick the path that fits your situation.
          </h2>
        </header>

        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-3">
          {actions.map((a) => (
            <Link
              key={a.title}
              href={a.href}
              className="group flex flex-col gap-4 bg-surface-raised p-8 transition hover:bg-surface-sunken"
            >
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-fair-dark">
                {a.eyebrow}
              </p>
              <h3 className="font-display text-2xl font-semibold tracking-tight">{a.title}</h3>
              <p className="text-ink-soft leading-relaxed">{a.body}</p>
              <p className="mt-auto inline-flex items-center gap-2 text-sm font-medium text-ink group-hover:text-fair-dark">
                {a.cta}
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M5 12h14m-5-5 5 5-5 5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-6 pb-24 lg:px-10">
        <div className="card overflow-hidden">
          <div className="grid items-center gap-8 p-10 md:grid-cols-[1.1fr_auto] md:gap-12 md:p-14">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-fair-dark">
                Need a person?
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight">
                A Screening Officer can review your case.
              </h2>
              <p className="mt-4 max-w-prose text-ink-soft text-balance">
                If the circumstances of your notice don&apos;t fit the standard flow — disability,
                emergency, or evidence to submit — file a Screening Review. A municipal officer reads
                every submission and replies in writing.
              </p>
            </div>
            <div className="flex flex-col gap-3 md:items-end">
              <Link href="/" className="btn-primary text-sm">
                Look up my notice first
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M5 12h14m-5-5 5 5-5 5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
              <Link href="/about" className="btn-ghost text-sm border border-line">
                How FairPlan works
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
