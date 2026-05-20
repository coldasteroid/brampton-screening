import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireRole } from '~/lib/auth';
import { listUpcomingHearings } from '~/lib/db';
import { getCurrentUser } from '~/lib/auth-server';
import { env } from '~/lib/runtime';

export const metadata: Metadata = { title: 'Hearings · FairPlan' };

function fmt(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' }),
    time: d.toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit' }),
  };
}

export default async function HearingsPage() {
  const user = await getCurrentUser();
  const guard = requireRole(user, ['officer', 'manager']);
  if (!guard.ok) redirect(guard.redirect);

  const hearings = await listUpcomingHearings(env().DB);

  return (
    <>
      <section className="border-b border-line/60">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10 py-12 md:py-16">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-fair-dark">Hearings console</p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl text-balance">
            Upcoming hearings.
          </h1>
          <p className="mt-3 max-w-prose text-ink-soft">
            Bookings made by residents after a Screening Officer referred their case. Heard by an independent
            Hearing Officer.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-6 lg:px-10 py-12">
        {hearings.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="font-display text-2xl font-semibold">No upcoming hearings.</p>
            <p className="mt-2 text-ink-soft">
              When a review is referred to hearing and a resident books a slot, it appears here.
            </p>
          </div>
        ) : (
          <ol className="space-y-3">
            {hearings.map((h) => {
              const f = fmt(h.scheduled_at);
              return (
                <li key={h.id}>
                  <Link
                    href={`/hearing/${h.id}`}
                    className="card flex flex-col gap-4 p-6 transition hover:shadow-md md:flex-row md:items-center"
                  >
                    <div className="md:w-40">
                      <p className="font-display text-lg font-semibold text-ink">{f.date}</p>
                      <p className="text-sm text-ink-soft">{f.time}</p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs text-ink-subtle">{h.ticket_id}</p>
                      <p className="mt-0.5 font-medium text-ink">{h.offence_label}</p>
                    </div>
                    <span className="pill bg-fair/15 text-fair-dark">{h.duration_minutes} min</span>
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </>
  );
}
