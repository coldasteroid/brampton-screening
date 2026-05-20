'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReminderRow, TicketRow } from '~/lib/db';
import type { PenaltyCode } from '~/lib/data/penalties';

interface Props {
  ticket: TicketRow;
  penalty: PenaltyCode | null;
  reminders: ReminderRow[];
  language: 'en' | 'pa' | 'hi' | 'fr';
}

const REMINDER_LABEL: Record<string, string> = {
  notice_due_5d: '5-day reminder',
  notice_due_1d: 'Final reminder',
  notice_due_0d: 'Due today notice',
  plan_instalment_3d: 'Upcoming instalment',
  plan_instalment_0d: 'Instalment day notice',
};

function reminderDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-CA', { dateStyle: 'medium' });
}

export default function TicketExperience({ ticket, penalty, reminders, language }: Props) {
  const [explain, setExplain] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<string>('');

  const dueIn = useMemo(
    () => Math.ceil((Date.parse(ticket.due_at) - Date.now()) / 86_400_000),
    [ticket.due_at],
  );
  const overdue = dueIn < 0;
  const amount = (ticket.amount_cents / 100).toLocaleString('en-CA', {
    style: 'currency',
    currency: 'CAD',
  });

  async function runExplain() {
    setLoading(true);
    setError(null);
    setExplain('');
    try {
      const res = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ticketId: ticket.id, language }),
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const j = (await res.json()) as { text?: string; provider?: string };
      setExplain(j.text ?? '');
      setProvider(j.provider ?? '');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    runExplain();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticket.id, language]);

  const planHref = `/plan?ticket=${encodeURIComponent(ticket.id)}`;

  return (
    <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="pill bg-ink/5 font-mono text-ink">{ticket.id}</span>
          <span
            className={
              'pill ' +
              (overdue
                ? 'bg-danger/10 text-danger'
                : dueIn <= 5
                  ? 'bg-warn/15 text-amber-700'
                  : 'bg-fair/15 text-fair-dark')
            }
          >
            {overdue ? `Overdue by ${Math.abs(dueIn)}d` : `Due in ${dueIn}d`}
          </span>
          {penalty && <span className="pill bg-surface-sunken text-ink-soft">{penalty.category}</span>}
        </div>
        <h1 className="font-display text-4xl font-semibold tracking-tight md:text-5xl">{ticket.offence_label}</h1>
        <p className="font-display text-3xl text-ink-soft">{amount}</p>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-2xl border border-line bg-surface-raised p-6">
          <Field label="Cited bylaw" value={penalty?.bylaw ?? '—'} />
          <Field label="Location" value={ticket.location_text ?? '—'} />
          <Field label="Issued" value={formatDate(ticket.issued_at)} />
          <Field label="Due" value={formatDate(ticket.due_at)} />
          <Field label="Plate" value={ticket.plate} mono />
          <Field label="Ward" value={ticket.ward ? `Ward ${ticket.ward}` : '—'} />
        </dl>

        <div className="grid gap-3 sm:grid-cols-3">
          <a href={`/pay/${ticket.id}`} className="btn-secondary text-sm">
            Pay now
          </a>
          <a href={planHref} className="btn-primary text-sm">
            Set up a payment plan
          </a>
          <a href={`/dispute/${ticket.id}`} className="btn-ghost text-sm border border-line">
            Request Screening Review
          </a>
        </div>
      </section>

      <aside className="space-y-5">
        <div className="card overflow-hidden">
          <div className="border-b border-line bg-surface-sunken px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-subtle">FairPlan agent</p>
            <p className="mt-1 font-display text-lg font-semibold text-ink">Your notice, in plain language</p>
          </div>
          <div className="px-6 py-6">
            {loading && (
              <div className="space-y-2.5" aria-live="polite" aria-busy="true">
                <Shimmer width="92%" />
                <Shimmer width="85%" />
                <Shimmer width="40%" />
                <div className="h-3" />
                <Shimmer width="78%" />
                <Shimmer width="64%" />
              </div>
            )}
            {!loading && error && (
              <div className="rounded-xl border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
                <p className="font-medium">We couldn't reach the explanation service.</p>
                <p className="mt-1 text-danger/80">{error}</p>
                <button onClick={runExplain} className="mt-3 text-sm underline">
                  Try again
                </button>
              </div>
            )}
            {!loading && !error && explain && (
              <div className="prose prose-ink max-w-prose whitespace-pre-line text-[15px] leading-relaxed text-ink">
                {explain}
              </div>
            )}
            {provider && (
              <p className="mt-4 border-t border-line pt-3 text-xs text-ink-subtle">
                generated by <span className="font-mono">{provider}</span> · routed through Cloudflare AI Gateway
              </p>
            )}
          </div>
        </div>

        {reminders.length > 0 && (
          <div className="card overflow-hidden">
            <div className="border-b border-line bg-surface-sunken px-6 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-subtle">Reminders</p>
              <p className="mt-1 font-display text-lg font-semibold text-ink">
                We'll keep you in the loop
              </p>
              <p className="mt-1 text-xs text-ink-subtle">
                Non-punitive, in your language. No credit-bureau threats.
              </p>
            </div>
            <ol className="divide-y divide-line">
              {reminders.map((r) => {
                const isSent = r.status === 'sent';
                return (
                  <li key={r.id} className="flex items-center justify-between gap-3 px-6 py-3.5 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium text-ink">{REMINDER_LABEL[r.kind] ?? r.kind}</p>
                      <p className="mt-0.5 text-xs text-ink-subtle">{reminderDate(r.scheduled_at)}</p>
                    </div>
                    <span
                      className={
                        'pill text-xs ' +
                        (isSent ? 'bg-fair/15 text-fair-dark' : 'bg-surface-sunken text-ink-subtle')
                      }
                    >
                      {isSent ? 'Sent' : 'Scheduled'}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </aside>
    </div>
  );
}

function Field({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-subtle">{label}</dt>
      <dd className={'mt-1 text-ink ' + (mono ? 'font-mono' : '')}>{value}</dd>
    </div>
  );
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString('en-CA', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

function Shimmer({ width = '100%' }: { width?: string }) {
  return (
    <div
      className="h-4 animate-pulse rounded-md bg-gradient-to-r from-line/60 via-line to-line/60 bg-[length:200%_100%]"
      style={{ width }}
    />
  );
}
