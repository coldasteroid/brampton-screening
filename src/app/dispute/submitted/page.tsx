import type { Metadata } from 'next';
import Link from 'next/link';
import { getReview } from '~/lib/db';
import { env } from '~/lib/runtime';

export const metadata: Metadata = { title: 'Review submitted · FairPlan' };

export default async function DisputeSubmittedPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const review = id ? await getReview(env().DB, id) : null;

  return (
    <section className="mx-auto max-w-2xl px-6 py-24 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-fair/15 text-fair-dark">
        <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" aria-hidden="true">
          <path
            d="m5 12 5 5 9-11"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <h1 className="mt-6 font-display text-4xl font-semibold tracking-tight">Screening Review submitted.</h1>
      <p className="mt-3 text-ink-soft">
        Your case is in the queue. The FairPlan agent will draft a pre-screening recommendation within minutes; a
        human Screening Officer reviews it next.
      </p>
      {review && (
        <p className="mt-6 font-mono text-xs text-ink-subtle">
          Review ID: {review.id} · Notice {review.ticket_id}
        </p>
      )}
      <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link href="/" className="btn-primary text-sm">
          Back to portal
        </Link>
        {review && (
          <Link href={`/ticket/${review.ticket_id}`} className="btn-ghost text-sm border border-line">
            View notice
          </Link>
        )}
      </div>
    </section>
  );
}
