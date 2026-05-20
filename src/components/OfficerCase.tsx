'use client';

import { useState } from 'react';
import type { OfficerRecommendation, RecommendedAction } from '~/lib/agents/skills';
import type { EvidenceItemRow, ScreeningReviewWithTicket } from '~/lib/db';

interface Props {
  review: ScreeningReviewWithTicket;
  initialRecommendation: OfficerRecommendation | null;
  evidence: EvidenceItemRow[];
}

const ACTION_LABEL: Record<RecommendedAction, string> = {
  cancel: 'Cancel the notice',
  reduce: 'Reduce the amount',
  uphold: 'Uphold as issued',
  hearing: 'Refer to hearing',
};

export default function OfficerCase({ review, initialRecommendation, evidence }: Props) {
  const [rec, setRec] = useState<OfficerRecommendation | null>(initialRecommendation);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [action, setAction] = useState<RecommendedAction>(initialRecommendation?.recommended_action ?? 'uphold');
  const [amountDollars, setAmountDollars] = useState<number>(
    initialRecommendation?.reduced_amount_cents
      ? initialRecommendation.reduced_amount_cents / 100
      : Math.round((review.amount_cents / 100) * 0.7),
  );
  const [reasoning, setReasoning] = useState(initialRecommendation?.reasoning ?? '');
  const [submitting, setSubmitting] = useState(false);

  async function generate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/screening/recommend`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ reviewId: review.id }),
      });
      if (!res.ok) throw new Error(`AI draft failed (${res.status})`);
      const next = (await res.json()) as OfficerRecommendation;
      setRec(next);
      setAction(next.recommended_action);
      if (next.reduced_amount_cents) setAmountDollars(next.reduced_amount_cents / 100);
      setReasoning(next.reasoning);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  async function submit(e: { preventDefault: () => void }) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/screening/decide', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          reviewId: review.id,
          decision: action === 'cancel' ? 'cancelled'
            : action === 'reduce' ? 'reduced'
            : action === 'uphold' ? 'upheld'
            : 'hearing_required',
          amountCents: action === 'reduce' ? Math.round(amountDollars * 100) : null,
          reasoning,
        }),
      });
      if (!res.ok) throw new Error(`Could not record decision (${res.status})`);
      window.location.href = `/decision/${encodeURIComponent(review.id)}`;
    } catch (e) {
      setError((e as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="space-y-5">
        <div className="card overflow-hidden">
          <div className="border-b border-line bg-surface-sunken px-6 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-fair-dark">Agent recommendation</p>
            <p className="mt-1 font-display text-lg font-semibold text-ink">
              {rec ? ACTION_LABEL[rec.recommended_action] : 'No draft yet'}
            </p>
          </div>
          <div className="px-6 py-6">
            {rec ? (
              <div className="space-y-4 text-sm">
                <p className="leading-relaxed text-ink">{rec.reasoning}</p>
                {rec.reduced_amount_cents && (
                  <p className="text-ink-soft">
                    Suggested reduced amount:{' '}
                    <span className="font-medium text-ink">
                      ${(rec.reduced_amount_cents / 100).toLocaleString('en-CA')}
                    </span>
                  </p>
                )}
                {rec.cited_bylaws.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-subtle">Cited bylaws</p>
                    <ul className="mt-1.5 space-y-1 text-ink-soft">
                      {rec.cited_bylaws.map((b) => <li key={b}>· {b}</li>)}
                    </ul>
                  </div>
                )}
                {rec.risk_flags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {rec.risk_flags.map((f) => (
                      <span key={f} className="pill bg-surface-sunken text-ink-soft">{f.replace(/_/g, ' ')}</span>
                    ))}
                  </div>
                )}
                <p className="border-t border-line pt-3 text-xs text-ink-subtle">
                  Confidence: <span className="font-medium text-ink">{rec.confidence}</span> · Advisory only — your
                  decision below is binding.
                </p>
              </div>
            ) : (
              <div className="text-sm text-ink-soft">
                <p>The agent hasn't drafted a recommendation for this case yet.</p>
                <button onClick={generate} disabled={generating} className="btn-primary mt-4 text-sm disabled:opacity-60">
                  {generating ? 'Drafting…' : 'Generate AI recommendation'}
                </button>
              </div>
            )}
            {rec && (
              <button
                onClick={generate}
                disabled={generating}
                className="btn-ghost mt-5 text-sm border border-line disabled:opacity-60"
              >
                {generating ? 'Re-drafting…' : 'Re-draft'}
              </button>
            )}
          </div>
        </div>

        <form onSubmit={submit} className="card overflow-hidden">
          <div className="border-b border-line bg-surface-sunken px-6 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-fair-dark">Officer decision</p>
            <p className="mt-1 font-display text-lg font-semibold text-ink">What's your call?</p>
          </div>
          <div className="space-y-5 px-6 py-6">
            <fieldset>
              <legend className="sr-only">Decision</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {(Object.keys(ACTION_LABEL) as RecommendedAction[]).map((a) => (
                  <label
                    key={a}
                    className={
                      'flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ' +
                      (action === a
                        ? 'border-ink bg-ink text-white'
                        : 'border-line bg-surface-raised text-ink-soft hover:border-ink/40')
                    }
                  >
                    <input
                      type="radio"
                      name="action"
                      value={a}
                      checked={action === a}
                      onChange={() => setAction(a)}
                      className="sr-only"
                    />
                    <span>{ACTION_LABEL[a]}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            {action === 'reduce' && (
              <div>
                <label htmlFor="amt" className="block text-sm font-medium text-ink">
                  Reduced amount (CAD)
                </label>
                <input
                  id="amt"
                  type="number"
                  min="0"
                  max={review.amount_cents / 100}
                  step="0.01"
                  value={amountDollars}
                  onChange={(e) => setAmountDollars(parseFloat(e.target.value) || 0)}
                  className="input mt-2"
                />
                <p className="mt-1 text-xs text-ink-subtle">
                  Original: ${(review.amount_cents / 100).toLocaleString('en-CA')}
                </p>
              </div>
            )}

            <div>
              <label htmlFor="reasoning" className="block text-sm font-medium text-ink">
                Your reasoning
              </label>
              <p className="mt-1 text-xs text-ink-subtle">
                Used in the Notice of Decision sent to the resident. Be specific and reference the bylaw.
              </p>
              <textarea
                id="reasoning"
                required
                minLength={20}
                value={reasoning}
                onChange={(e) => setReasoning(e.target.value)}
                rows={5}
                className="input mt-2 resize-none"
                placeholder="Cite the bylaw section, address the resident's reasons, and explain what changes for them next."
              />
            </div>

            {error && (
              <div className="rounded-xl border border-danger/30 bg-danger/5 p-3 text-sm text-danger" role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || reasoning.trim().length < 20}
              className="btn-primary w-full justify-center disabled:opacity-60"
            >
              {submitting ? 'Recording…' : 'Record decision'}
            </button>
          </div>
        </form>
      </section>

      <aside className="space-y-5">
        <div className="card p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-subtle">Notice</p>
          <p className="mt-2 font-display text-2xl font-semibold tracking-tight">{review.offence_label}</p>
          <p className="mt-1 text-sm text-ink-soft">{review.location_text}</p>
          <p className="mt-3 font-mono text-xs text-ink-subtle">{review.ticket_id}</p>
          <p className="mt-4 font-display text-2xl text-ink">
            ${(review.amount_cents / 100).toLocaleString('en-CA')}
          </p>
        </div>

        <div className="card p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-subtle">Resident's narrative</p>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink">
            {review.narrative || '(no narrative provided)'}
          </p>
        </div>

        <div className="card p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-subtle">
            Evidence ({evidence.length})
          </p>
          {evidence.length === 0 ? (
            <p className="mt-3 text-sm text-ink-subtle">No files uploaded with this review.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {evidence.map((e) => (
                <li key={e.id}>
                  <a
                    href={`/api/evidence/${e.id}`}
                    target="_blank"
                    rel="noopener"
                    className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface-raised px-3 py-2 text-sm hover:border-ink/40"
                  >
                    <span className="min-w-0 truncate font-medium text-ink">{e.filename ?? e.r2_key}</span>
                    <span className="text-xs text-ink-subtle">
                      {e.mime_type?.split('/')[1]?.toUpperCase()} ·{' '}
                      {e.size_bytes ? `${Math.round(e.size_bytes / 1024)} KB` : '—'}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}
