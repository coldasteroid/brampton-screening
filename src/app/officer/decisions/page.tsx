import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireRole } from '~/lib/auth';
import { listRecentDecisions } from '~/lib/db';
import { getCurrentUser } from '~/lib/auth-server';
import { env } from '~/lib/runtime';

export const metadata: Metadata = { title: 'Past decisions · FairPlan' };

const DECISION_META: Record<string, { label: string; tone: string }> = {
  cancelled: { label: 'Cancelled', tone: 'bg-fair/15 text-fair-dark' },
  reduced: { label: 'Reduced', tone: 'bg-warn/15 text-amber-700' },
  upheld: { label: 'Upheld', tone: 'bg-ink/5 text-ink' },
  hearing_required: { label: 'Sent to hearing', tone: 'bg-indigo-100 text-indigo-700' },
};

function fmt(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default async function OfficerDecisionsPage() {
  const guard = requireRole(await getCurrentUser(), ['officer', 'manager']);
  if (!guard.ok) redirect(guard.redirect);

  const rows = await listRecentDecisions(env().DB, { limit: 50 });

  const byOutcome = rows.reduce(
    (acc, r) => {
      acc[r.decision] = (acc[r.decision] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <>
      <section className="border-b border-line/60">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10 py-12 md:py-16">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-fair-dark">
            Screening Officer console
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl text-balance">
            Past decisions.
          </h1>
          <p className="mt-3 max-w-prose text-ink-soft">
            The 50 most recent decided reviews. Open any row to preview the staff confirmation and the Notice
            of Decision sent to the resident.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {(['cancelled', 'reduced', 'upheld', 'hearing_required'] as const).map((k) => (
              <span key={k} className={`pill ${DECISION_META[k].tone}`}>
                {DECISION_META[k].label}: <span className="font-mono">{byOutcome[k] ?? 0}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-6 lg:px-10 py-12">
        {rows.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="font-display text-2xl font-semibold">No decisions yet.</p>
            <p className="mt-2 text-ink-soft">
              Decisions you record from the <Link href="/officer" className="underline">queue</Link> will appear here.
            </p>
          </div>
        ) : (
          <ol className="space-y-3">
            {rows.map((r) => {
              const meta = DECISION_META[r.decision] ?? DECISION_META.upheld;
              const final =
                r.decision === 'cancelled'
                  ? '$0.00'
                  : r.decision === 'reduced' && r.decision_amount_cents != null
                    ? `$${(r.decision_amount_cents / 100).toLocaleString('en-CA')}`
                    : `$${(r.amount_cents / 100).toLocaleString('en-CA')}`;
              return (
                <li key={r.review_id}>
                  <Link
                    href={`/decision/${r.review_id}`}
                    className="card flex flex-col gap-4 p-6 transition hover:shadow-md md:flex-row md:items-center"
                  >
                    <div className="flex items-center gap-4 md:w-72 md:shrink-0">
                      <span className={`pill ${meta.tone}`}>{meta.label}</span>
                      <div className="min-w-0">
                        <p className="font-mono text-xs text-ink-subtle">{r.ticket_id}</p>
                        <p className="mt-0.5 truncate font-medium text-ink">{r.offence_label}</p>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="line-clamp-2 max-w-prose text-sm text-ink-soft">
                        {r.decision_reasoning || '(no reasoning recorded)'}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-4 md:flex-col md:items-end md:gap-1 md:shrink-0">
                      <p className="font-display text-lg font-semibold text-ink">{final}</p>
                      <p className="text-xs text-ink-subtle">{fmt(r.decided_at)}</p>
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
