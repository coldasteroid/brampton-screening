import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getHearing, getReview } from '~/lib/db';
import { env } from '~/lib/runtime';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return { title: `Hearing confirmed · ${id}` };
}

export default async function HearingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const e = env();
  const hearing = id ? await getHearing(e.DB, id) : null;
  if (!hearing) redirect('/');

  const review = await getReview(e.DB, hearing.review_id);
  const when = new Date(hearing.scheduled_at);
  const formatted = {
    date: when.toLocaleDateString('en-CA', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }),
    time: when.toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit' }),
  };

  return (
    <section className="mx-auto max-w-2xl px-6 py-16 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-fair/15 text-fair-dark">
        <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" aria-hidden="true">
          <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
          <path d="M3 9h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path
            d="m9 14 2 2 4-4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <h1 className="mt-6 font-display text-4xl font-semibold tracking-tight">Hearing confirmed.</h1>
      <p className="mt-3 text-ink-soft">A Hearing Officer will see you at the time below.</p>

      <div className="card mt-10 p-6 text-left">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-subtle">When</p>
        <p className="mt-2 font-display text-2xl font-semibold tracking-tight">{formatted.date}</p>
        <p className="mt-1 text-ink">
          {formatted.time} · {hearing.duration_minutes} minutes
        </p>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-ink-subtle">Where</p>
        <p className="mt-2 text-ink">Court Services, 5 Ray Lawson Blvd, Brampton L6Y 5L7</p>
        {review && (
          <>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-ink-subtle">For notice</p>
            <p className="mt-2 font-mono text-ink">{review.ticket_id}</p>
          </>
        )}
      </div>

      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <a href={`/api/hearings/${hearing.id}/ics`} className="btn-primary text-sm" download>
          Add to calendar (.ics)
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 5v12m0 0-5-5m5 5 5-5M5 21h14"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
        <Link href="/" className="btn-ghost text-sm border border-line">
          Back to portal
        </Link>
      </div>

      <p className="mt-10 text-xs text-ink-subtle text-balance">
        Cancellations are free up to 48 hours before the hearing. Call Court Services at 905-450-4770.
      </p>
    </section>
  );
}
