import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'About FairPlan' };

const canDo = [
  {
    title: 'Look up your notice',
    body: 'Type the notice number from your ticket and see every detail — the bylaw, the amount, where it was issued, when it’s due.',
  },
  {
    title: 'Read it in your language',
    body: 'Plain-language explanations in English, Punjabi, Hindi, or French. No legalese, no judgement.',
  },
  {
    title: 'Set up a payment plan',
    body: '3, 6, or 12 monthly instalments calibrated to your household income. 0% interest. No credit check.',
  },
  {
    title: 'File a Screening Review',
    body: 'If your circumstances don’t fit the standard flow, request a review. A municipal Screening Officer reads every submission.',
  },
];

const wontDo = [
  {
    title: 'It doesn’t decide your case',
    body: 'A Screening Officer — a person — reviews every Screening Review. The agent only prepares a summary for them.',
  },
  {
    title: 'It doesn’t change the bylaw or the amount',
    body: 'Penalty amounts are set by Brampton City Council. FairPlan can’t lower a fine; it can help you understand and pay it.',
  },
  {
    title: 'It doesn’t share your data with collectors',
    body: 'No credit-bureau referral, no third-party debt collection, no marketing list.',
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="mx-auto max-w-[820px] px-6 py-20 md:py-28 lg:px-10">
        <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight md:text-5xl text-balance">
          About FairPlan.
        </h1>
        <p className="mt-6 max-w-prose text-lg leading-relaxed text-ink-soft text-balance">
          FairPlan is a free tool that helps Brampton residents understand a penalty notice from the
          City, see what they owe, and choose a payment option that fits their household.
        </p>
        <p className="mt-4 max-w-prose text-lg leading-relaxed text-ink-soft text-balance">
          It’s built around one idea: a fine should never be the thing that pushes a family into
          default.
        </p>
      </section>

      <section className="mx-auto max-w-[820px] px-6 pb-20 lg:px-10">
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          What you can do here.
        </h2>
        <ul className="mt-8 grid gap-5 sm:grid-cols-2">
          {canDo.map((item) => (
            <li key={item.title} className="card p-6">
              <h3 className="font-display text-lg font-semibold tracking-tight text-ink">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{item.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-[820px] px-6 pb-20 lg:px-10">
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          What FairPlan doesn’t do.
        </h2>
        <p className="mt-3 max-w-prose text-ink-soft">
          To set expectations clearly, here’s what FairPlan is <em>not</em>:
        </p>
        <ul className="mt-6 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface-raised">
          {wontDo.map((item) => (
            <li key={item.title} className="p-6">
              <h3 className="font-display text-lg font-semibold tracking-tight text-ink">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{item.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-[820px] px-6 pb-20 lg:px-10">
        <h2 className="font-display text-2xl font-semibold tracking-tight">Your language matters.</h2>
        <p className="mt-3 max-w-prose text-ink-soft text-balance">
          More than 160 languages are spoken at home across Brampton. FairPlan currently supports
          English, Punjabi (ਪੰਜਾਬੀ), Hindi (हिन्दी), and French. The translation runs on every page —
          notice details, payment plans, and the agent’s explanations all switch together when you
          change languages.
        </p>
      </section>

      <section className="mx-auto max-w-[820px] px-6 pb-20 lg:px-10">
        <h2 className="font-display text-2xl font-semibold tracking-tight">Your privacy.</h2>
        <div className="mt-4 space-y-4 text-ink-soft">
          <p className="max-w-prose">
            You can look up a notice and read it in your language without creating an account or
            providing any personal information.
          </p>
          <p className="max-w-prose">
            If you set up a payment plan or file a Screening Review, FairPlan stores only what’s
            needed to fulfil that request — the ticket number, the plan terms, and any evidence you
            choose to attach. We don’t sell data and we don’t share it with collectors or credit
            bureaus.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[820px] px-6 pb-24 lg:px-10">
        <div className="card p-8 md:p-10">
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            Some things still need a person.
          </h2>
          <p className="mt-3 max-w-prose text-ink-soft">
            For an in-person hearing, an unresolved notice, or any other municipal service, you can
            reach the City through brampton.ca or 311.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/" className="btn-primary text-sm">
              Look up my notice
            </Link>
            <Link href="/bylaws" className="btn-ghost text-sm border border-line">
              Browse the bylaws
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
