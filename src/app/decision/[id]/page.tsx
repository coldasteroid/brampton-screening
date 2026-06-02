import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getReview } from '~/lib/db';
import { getCurrentUser } from '~/lib/auth-server';
import type { OfficerRecommendation } from '~/lib/agents/skills';
import { env } from '~/lib/runtime';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return { title: `Notice of Decision · ${id}` };
}

const DECISION_LABEL: Record<string, { tone: string; title: string; cta: string }> = {
  cancelled: {
    tone: 'bg-fair/10 border-fair/30 text-fair-dark',
    title: 'Notice cancelled',
    cta: 'No payment owed. No further action required.',
  },
  reduced: {
    tone: 'bg-warn/10 border-warn/30 text-amber-700',
    title: 'Penalty reduced',
    cta: 'The reduced amount is due in 15 days. You can activate a FairPlan instalment at no cost.',
  },
  upheld: {
    tone: 'bg-ink/5 border-line text-ink',
    title: 'Notice upheld',
    cta: 'The original amount is due in 15 days. A FairPlan instalment plan remains available.',
  },
  hearing_required: {
    tone: 'bg-indigo-100 border-indigo-300 text-indigo-700',
    title: 'Hearing required',
    cta: 'Your matter has been referred to a Hearing Officer. You will receive a scheduling notice within 10 business days.',
  },
};

const ACTION_LABEL: Record<string, string> = {
  cancel: 'Cancel the notice',
  reduce: 'Reduce the amount',
  uphold: 'Uphold as issued',
  hearing: 'Refer to hearing',
};

export default async function DecisionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const review = id ? await getReview(env().DB, id) : null;

  if (!review || review.status !== 'decided') redirect('/');

  const user = await getCurrentUser();
  const isStaff = user?.role === 'officer' || user?.role === 'manager';

  const decision = review.decision!;
  const meta = DECISION_LABEL[decision] ?? DECISION_LABEL.upheld;
  const originalDollars = (review.amount_cents / 100).toLocaleString('en-CA', {
    style: 'currency',
    currency: 'CAD',
  });
  const reducedDollars =
    decision === 'reduced' && review.decision_amount_cents
      ? (review.decision_amount_cents / 100).toLocaleString('en-CA', {
          style: 'currency',
          currency: 'CAD',
        })
      : null;

  if (isStaff) {
    let aiRec: OfficerRecommendation | null = null;
    if (review.ai_recommendation) {
      try {
        aiRec = JSON.parse(review.ai_recommendation) as OfficerRecommendation;
      } catch {
        aiRec = null;
      }
    }
    const officerDecisionToAction: Record<string, string> = {
      cancelled: 'cancel',
      reduced: 'reduce',
      upheld: 'uphold',
      hearing_required: 'hearing',
    };
    const decidedAction = officerDecisionToAction[decision];
    const aligned = aiRec ? aiRec.recommended_action === decidedAction : null;

    return (
      <section className="mx-auto max-w-3xl px-6 pt-12 pb-24 md:pt-16">
        <Link href="/officer" className="text-sm text-ink-subtle hover:text-ink">
          ← Back to queue
        </Link>

        <p className="mt-6 font-mono text-xs uppercase tracking-[0.18em] text-fair-dark">
          Decision recorded
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">
          {meta.title}
        </h1>
        <p className="mt-3 text-ink-soft">
          The Notice of Decision is now available to the resident. They have 15 days to request a Hearing
          Officer review.
        </p>

        <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 rounded-2xl border border-line bg-surface-raised p-6">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-subtle">Notice</dt>
            <dd className="mt-1 font-mono text-ink">{review.ticket_id}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-subtle">Offence</dt>
            <dd className="mt-1 text-ink">{review.offence_label}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-subtle">Original amount</dt>
            <dd className="mt-1 text-ink">{originalDollars}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-subtle">
              {decision === 'cancelled'
                ? 'Final amount'
                : decision === 'reduced'
                  ? 'Reduced to'
                  : decision === 'hearing_required'
                    ? 'Pending hearing'
                    : 'Amount upheld'}
            </dt>
            <dd className="mt-1 font-display text-xl font-semibold text-fair-dark">
              {decision === 'cancelled'
                ? '$0.00'
                : decision === 'hearing_required'
                  ? originalDollars
                  : (reducedDollars ?? originalDollars)}
            </dd>
          </div>
          <div className="col-span-2 border-t border-line pt-4">
            <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-subtle">Review</dt>
            <dd className="mt-1 font-mono text-xs text-ink-soft">{review.id}</dd>
          </div>
        </dl>

        <section className="mt-10">
          <h2 className="font-display text-2xl font-semibold tracking-tight">Your reasoning</h2>
          <p className="mt-4 whitespace-pre-line text-ink-soft leading-relaxed">
            {review.decision_reasoning || '(no reasoning recorded)'}
          </p>
        </section>

        {aiRec && (
          <section className="mt-8 rounded-2xl border border-line bg-surface-sunken p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-subtle">
                AI draft · advisory
              </p>
              <span
                className={
                  'pill ' +
                  (aligned ? 'bg-fair/15 text-fair-dark' : 'bg-warn/15 text-amber-700')
                }
              >
                {aligned ? 'Officer aligned with AI' : 'Officer overrode AI'}
              </span>
            </div>
            <p className="mt-3 text-sm text-ink">
              <span className="font-medium">AI recommended:</span>{' '}
              {ACTION_LABEL[aiRec.recommended_action] ?? aiRec.recommended_action}
              {aiRec.confidence && (
                <span className="ml-2 text-xs text-ink-subtle">
                  · confidence: {aiRec.confidence}
                </span>
              )}
            </p>
            <p className="mt-2 text-sm text-ink-soft leading-relaxed">{aiRec.reasoning}</p>
            {aiRec.cited_bylaws.length > 0 && (
              <p className="mt-3 text-xs text-ink-subtle">
                Cited: {aiRec.cited_bylaws.join(' · ')}
              </p>
            )}
          </section>
        )}

        <div className="mt-12 flex flex-wrap items-center gap-3">
          <Link href="/officer" className="btn-primary text-sm">
            Back to queue
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M5 12h14m-5-5 5 5-5 5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          <a
            href={`/api/decision-letter/${review.id}`}
            target="_blank"
            rel="noopener"
            className="btn-ghost text-sm border border-line"
          >
            Preview resident&apos;s letter
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M14 3h7v7M10 14 21 3M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl px-6 pt-14 pb-24 md:pt-20">
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-fair-dark">Notice of Decision</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">{meta.title}</h1>

      <div className={`mt-8 rounded-2xl border p-6 ${meta.tone}`}>
        <p className="text-sm">{meta.cta}</p>
      </div>

      <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-5 rounded-2xl border border-line bg-surface-raised p-6">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-subtle">Notice number</dt>
          <dd className="mt-1 font-mono text-ink">{review.ticket_id}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-subtle">Offence</dt>
          <dd className="mt-1 text-ink">{review.offence_label}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-subtle">Original amount</dt>
          <dd className="mt-1 text-ink">{originalDollars}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-subtle">
            {decision === 'cancelled'
              ? 'Amount now owed'
              : decision === 'reduced'
                ? 'Reduced to'
                : 'Amount due'}
          </dt>
          <dd className="mt-1 font-display text-xl font-semibold text-fair-dark">
            {decision === 'cancelled' ? '$0.00' : (reducedDollars ?? originalDollars)}
          </dd>
        </div>
      </dl>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-semibold tracking-tight">Screening Officer&apos;s reasoning</h2>
        <p className="mt-4 whitespace-pre-line text-ink-soft leading-relaxed">
          {review.decision_reasoning || '(no reasoning recorded)'}
        </p>
      </section>

      <section className="mt-10 border-t border-line pt-8">
        <h2 className="font-display text-2xl font-semibold tracking-tight">Your rights</h2>
        <p className="mt-3 text-ink-soft leading-relaxed">
          If you disagree with this decision, you may request a hearing before a Hearing Officer within 15 days.
          Hearing Officers are independent of City staff. Contact City Court Services at{' '}
          <span className="font-medium text-ink">905-450-4770</span> or visit 5 Ray Lawson Blvd, Brampton, L6Y 5L7.
        </p>
      </section>

      <div className="mt-12 flex flex-wrap items-center gap-3">
        {decision === 'hearing_required' && (
          <Link href={`/hearing/select/${review.id}`} className="btn-primary text-sm">
            Book your hearing
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M5 12h14m-5-5 5 5-5 5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        )}
        <a
          href={`/api/decision-letter/${review.id}`}
          target="_blank"
          rel="noopener"
          className={
            decision === 'hearing_required'
              ? 'btn-ghost text-sm border border-line'
              : 'btn-primary text-sm'
          }
        >
          Download decision letter
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

      <p className="mt-10 text-xs text-ink-subtle">
        Reference: <span className="font-mono">{review.id}</span>
      </p>
    </section>
  );
}
