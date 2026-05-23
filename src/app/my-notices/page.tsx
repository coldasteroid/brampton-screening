import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireRole } from '~/lib/auth';
import { listReviewsForUser, listTicketsForUser } from '~/lib/db';
import { getCurrentUser } from '~/lib/auth-server';
import { env } from '~/lib/runtime';

export const metadata: Metadata = { title: 'My notices · FairPlan' };

function statusBadge(t: {
  decision: string | null;
  active_review_status: string | null;
  active_plan_id: string | null;
  due_at: string;
}): { label: string; tone: string } {
  if (t.decision === 'cancelled') return { label: 'Cancelled', tone: 'bg-fair/15 text-fair-dark' };
  if (t.decision === 'reduced') return { label: 'Reduced', tone: 'bg-warn/15 text-amber-700' };
  if (t.active_review_status === 'submitted')
    return { label: 'Review submitted', tone: 'bg-indigo-100 text-indigo-700' };
  if (t.active_review_status === 'under_review')
    return { label: 'Under review', tone: 'bg-indigo-100 text-indigo-700' };
  if (t.active_plan_id) return { label: 'Plan active', tone: 'bg-fair/15 text-fair-dark' };
  const daysToDue = Math.ceil((Date.parse(t.due_at) - Date.now()) / 86_400_000);
  if (daysToDue < 0) return { label: `Overdue by ${Math.abs(daysToDue)}d`, tone: 'bg-danger/10 text-danger' };
  if (daysToDue <= 5) return { label: `Due in ${daysToDue}d`, tone: 'bg-warn/15 text-amber-700' };
  return { label: `Due in ${daysToDue}d`, tone: 'bg-surface-sunken text-ink-soft' };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', { dateStyle: 'medium' });
}

export default async function MyNoticesPage() {
  const user = await getCurrentUser();
  const guard = requireRole(user, ['resident', 'officer', 'manager']);
  if (!guard.ok) redirect(guard.redirect);

  const e = env();
  const [tickets, reviews] = await Promise.all([
    listTicketsForUser(e.DB, guard.user.id),
    listReviewsForUser(e.DB, guard.user.id),
  ]);

  return (
    <>
      <section className="border-b border-line/60">
        <div className="mx-auto max-w-[1200px] px-6 lg:px-10 py-12 md:py-16">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-fair-dark">
            Signed in as {guard.user.name}
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl text-balance">
            My notices.
          </h1>
          <p className="mt-3 max-w-prose text-ink-soft">
            Everything tied to your account — open notices, payment plans, and Screening Reviews you&apos;ve filed.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-6 lg:px-10 py-12">
        <header className="mb-6 flex items-end justify-between">
          <h2 className="font-display text-2xl font-semibold tracking-tight">Notices</h2>
          <Link href="/" className="text-sm text-ink-subtle underline-offset-4 hover:underline">
            + Look up another notice
          </Link>
        </header>

        {tickets.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="font-display text-xl font-semibold">No notices on your account.</p>
            <p className="mt-2 text-ink-soft">Use the resident portal to look one up.</p>
          </div>
        ) : (
          <ol className="space-y-3">
            {tickets.map((t) => {
              const badge = statusBadge(t);
              const amount = (t.amount_cents / 100).toLocaleString('en-CA', {
                style: 'currency',
                currency: 'CAD',
              });
              return (
                <li key={t.id}>
                  <Link
                    href={`/ticket/${t.id}`}
                    className="card flex flex-col gap-4 p-6 transition hover:shadow-md md:flex-row md:items-center"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs text-ink-subtle">{t.id}</span>
                        <span className={`pill ${badge.tone}`}>{badge.label}</span>
                      </div>
                      <p className="mt-2 font-medium text-ink">{t.offence_label}</p>
                      <p className="mt-1 text-sm text-ink-soft">
                        {t.location_text ?? '—'} · Issued {formatDate(t.issued_at)}
                      </p>
                      {t.active_plan_id && t.active_plan_months && t.active_plan_monthly_cents && (
                        <p className="mt-2 text-xs text-fair-dark">
                          FairPlan: {t.active_plan_months} × ${(t.active_plan_monthly_cents / 100).toFixed(2)}
                          /mo · 0% APR
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-6 md:flex-col md:items-end md:gap-1 md:shrink-0">
                      <p className="font-display text-xl font-semibold text-ink">{amount}</p>
                      <p className="text-xs text-ink-subtle">Due {formatDate(t.due_at)}</p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {reviews.length > 0 && (
        <section className="mx-auto max-w-[1200px] px-6 lg:px-10 pb-24">
          <header className="mb-6">
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              Screening Reviews you&apos;ve filed
            </h2>
          </header>
          <ol className="space-y-3">
            {reviews.map((r) => {
              const decided = r.status === 'decided';
              const tone = decided ? 'bg-fair/15 text-fair-dark' : 'bg-indigo-100 text-indigo-700';
              const statusLabel = decided
                ? r.decision === 'cancelled'
                  ? 'Cancelled'
                  : r.decision === 'reduced'
                    ? 'Reduced'
                    : r.decision === 'hearing_required'
                      ? 'Sent to hearing'
                      : 'Upheld'
                : r.status === 'under_review'
                  ? 'Under review'
                  : 'Submitted';
              return (
                <li key={r.id}>
                  <Link
                    href={decided ? `/decision/${r.id}` : `/ticket/${r.ticket_id}`}
                    className="card flex flex-col gap-4 p-6 transition hover:shadow-md md:flex-row md:items-center"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs text-ink-subtle">{r.id}</span>
                        <span className={`pill ${tone}`}>{statusLabel}</span>
                      </div>
                      <p className="mt-2 font-medium text-ink">{r.offence_label}</p>
                      <p className="mt-1 truncate text-sm text-ink-soft">{r.narrative}</p>
                    </div>
                    <div className="md:shrink-0">
                      <p className="text-xs text-ink-subtle">Filed {formatDate(r.created_at)}</p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      )}
    </>
  );
}
