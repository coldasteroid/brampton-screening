import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getHearingForReview, getReview } from '~/lib/db';
import { offerSlots, formatSlot } from '~/lib/hearings';
import { env } from '~/lib/runtime';

export const metadata: Metadata = { title: 'Book hearing · FairPlan' };

export default async function HearingSelectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const e = env();
  const review = id ? await getReview(e.DB, id) : null;

  if (!review || review.decision !== 'hearing_required') redirect('/');

  const existing = await getHearingForReview(e.DB, review.id);
  if (existing) redirect(`/hearing/${existing.id}`);

  const slots = offerSlots(review.id).map((s) => {
    const f = formatSlot(s);
    return { id: s.id, isoStart: s.startsAt.toISOString(), date: f.date, time: f.time };
  });

  return (
    <section className="mx-auto max-w-3xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-fair-dark">Book your hearing</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">
        Pick a time that works for you.
      </h1>
      <p className="mt-4 max-w-prose text-ink-soft">
        Hearings are heard by an independent Hearing Officer (not the Screening Officer who reviewed your case).
        They run about 30 minutes. You&apos;ll receive a calendar invitation as soon as you confirm.
      </p>

      <ul className="mt-10 space-y-3">
        {slots.map((slot) => (
          <li key={slot.id}>
            <form
              method="POST"
              action="/api/hearings/book"
              className="card flex items-center gap-4 p-5 transition hover:shadow-md"
            >
              <input type="hidden" name="reviewId" value={review.id} />
              <input type="hidden" name="startsAt" value={slot.isoStart} />
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg font-semibold text-ink">{slot.date}</p>
                <p className="mt-1 text-sm text-ink-soft">
                  {slot.time} · 30 minutes · Court Services, 5 Ray Lawson Blvd
                </p>
              </div>
              <button type="submit" className="btn-primary text-sm">
                Book this slot
              </button>
            </form>
          </li>
        ))}
      </ul>

      <p className="mt-10 text-xs text-ink-subtle text-balance">
        Can&apos;t make any of these? Call City Court Services at 905-450-4770. Cancellations are free up to 48
        hours before the scheduled time.
      </p>
    </section>
  );
}
