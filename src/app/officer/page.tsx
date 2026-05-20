import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireRole } from '~/lib/auth';
import { listOpenReviews } from '~/lib/db';
import { getCurrentUser } from '~/lib/auth-server';
import { env } from '~/lib/runtime';

export const metadata: Metadata = { title: 'Screening queue · FairPlan' };

const REASON_LABELS: Record<string, string> = {
  financial_hardship: 'Financial hardship',
  factual_dispute: 'Factual dispute',
  exceptional_circumstances: 'Exceptional circumstances',
};

function reasonsOf(json: string): string[] {
  try {
    return (JSON.parse(json) as string[]).map((r) => REASON_LABELS[r] ?? r);
  } catch {
    return [];
  }
}

function timeAgo(iso: string): string {
  const h = Math.floor((Date.now() - Date.parse(iso)) / 3_600_000);
  if (h < 1) return 'just now';
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function priorityTone(score: number): { dot: string; label: string } {
  if (score >= 0.85) return { dot: 'bg-danger', label: 'Critical' };
  if (score >= 0.6) return { dot: 'bg-warn', label: 'High' };
  return { dot: 'bg-fair', label: 'Standard' };
}

export default async function OfficerQueuePage() {
  const user = await getCurrentUser();
  const guard = requireRole(user, ['officer', 'manager']);
  if (!guard.ok) redirect(guard.redirect);

  const reviews = await listOpenReviews(env().DB);

  const stats = [
    { label: 'Open reviews', value: reviews.length, accent: false },
    {
      label: 'Awaiting first look',
      value: reviews.filter((r) => r.status === 'submitted').length,
      accent: false,
    },
    {
      label: 'In progress',
      value: reviews.filter((r) => r.status === 'under_review').length,
      accent: false,
    },
    {
      label: 'High priority',
      value: reviews.filter((r) => r.priority_score >= 0.8).length,
      accent: true,
    },
  ];

  return (
    <>
      <section className="border-b border-line/60">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10 py-12 md:py-16">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-fair-dark">
            Screening Officer console
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl text-balance">
            Your queue, prioritized.
          </h1>
          <p className="mt-3 max-w-prose text-ink-soft">
            Every case is pre-screened by the FairPlan agent with a non-binding recommendation, bylaw citation,
            and risk flags. You always have the final decision.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-6 lg:px-10 pt-8">
        <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className={`bg-surface-raised p-6 ${s.accent ? 'ring-1 ring-fair/30' : ''}`}>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-subtle">{s.label}</p>
              <p
                className={`mt-2 font-display text-3xl font-semibold tracking-tight ${s.accent ? 'text-fair-dark' : 'text-ink'}`}
              >
                {s.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-6 lg:px-10 py-12">
        {reviews.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="font-display text-2xl font-semibold">Queue clear.</p>
            <p className="mt-2 text-ink-soft">New screening reviews will appear here as residents submit them.</p>
          </div>
        ) : (
          <ol className="space-y-3">
            {reviews.map((r) => {
              const tone = priorityTone(r.priority_score);
              return (
                <li key={r.id}>
                  <Link
                    href={`/officer/${r.id}`}
                    className="card flex flex-col gap-4 p-6 transition hover:shadow-md md:flex-row md:items-center"
                  >
                    <div className="flex items-center gap-4 md:w-72 md:shrink-0">
                      <span className="flex flex-col items-center gap-1">
                        <span className={`h-2.5 w-2.5 rounded-full ${tone.dot}`} aria-hidden="true" />
                        <span className="text-[10px] uppercase tracking-[0.14em] text-ink-subtle">
                          {tone.label}
                        </span>
                      </span>
                      <div className="min-w-0">
                        <p className="font-mono text-xs text-ink-subtle">{r.ticket_id}</p>
                        <p className="mt-0.5 truncate font-medium text-ink">{r.offence_label}</p>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {reasonsOf(r.reasons).map((label) => (
                          <span key={label} className="pill bg-surface-sunken text-ink-soft">
                            {label}
                          </span>
                        ))}
                        {r.status === 'under_review' && (
                          <span className="pill bg-fair/10 text-fair-dark">AI draft ready</span>
                        )}
                      </div>
                      <p className="mt-2 max-w-prose text-sm text-ink-soft line-clamp-2">{r.narrative}</p>
                    </div>
                    <div className="flex items-center justify-between gap-4 md:flex-col md:items-end md:gap-1 md:shrink-0">
                      <p className="font-display text-lg font-semibold text-ink">
                        ${(r.amount_cents / 100).toLocaleString('en-CA')}
                      </p>
                      <p className="text-xs text-ink-subtle">Submitted {timeAgo(r.created_at)}</p>
                    </div>
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
