import type { Metadata } from 'next';
import TicketLookup from '~/components/TicketLookup';

export const metadata: Metadata = {
  title: 'FairPlan — Brampton APS Modernization',
};

export default function Home() {
  return (
    <section className="mx-auto max-w-[680px] px-6 py-24 md:py-32 lg:px-10">
      <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight md:text-5xl text-balance">
        A penalty notice <span className="italic text-ink-soft">shouldn&apos;t</span> push a family
        into default.
      </h1>
      <p className="mt-6 max-w-prose text-lg leading-relaxed text-ink-soft text-balance">
        FairPlan modernizes Brampton&apos;s Administrative Penalty System with AI-assisted screening,
        multilingual explanations, and personalized payment plans calibrated to household hardship.
      </p>
      <div className="mt-10">
        <p className="mb-3 text-sm font-medium text-ink">Look up your penalty notice</p>
        <TicketLookup variant="hero" />
      </div>
    </section>
  );
}
