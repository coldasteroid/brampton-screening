'use client';

import { useRef, useState } from 'react';
import type { TicketRow } from '~/lib/db';

interface Props {
  ticket: TicketRow;
}

const REASONS = [
  {
    code: 'financial_hardship',
    label: 'Financial hardship',
    hint: 'My household income makes paying this notice in full a real challenge.',
  },
  {
    code: 'factual_dispute',
    label: 'Factual dispute',
    hint: 'I believe the notice was issued in error or the facts on it are wrong.',
  },
  {
    code: 'exceptional_circumstances',
    label: 'Exceptional circumstances',
    hint: 'Something outside my control made compliance impossible at the time.',
  },
];

const MAX_FILES = 5;
const MAX_FILE_BYTES = 8 * 1024 * 1024;
const ACCEPT = 'image/png,image/jpeg,image/heic,application/pdf';

export default function DisputeForm({ ticket }: Props) {
  const [reasons, setReasons] = useState<string[]>([]);
  const [narrative, setNarrative] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  function toggleReason(code: string) {
    setReasons((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
  }

  function addFiles(picked: FileList | null) {
    if (!picked) return;
    const next = [...files];
    for (const f of Array.from(picked)) {
      if (next.length >= MAX_FILES) break;
      if (f.size > MAX_FILE_BYTES) {
        setError(`${f.name} exceeds the 8 MB limit.`);
        continue;
      }
      next.push(f);
    }
    setFiles(next);
    if (fileInput.current) fileInput.current.value = '';
  }

  function removeFile(idx: number) {
    setFiles(files.filter((_, i) => i !== idx));
  }

  async function submit(e: { preventDefault: () => void }) {
    e.preventDefault();
    if (reasons.length === 0) {
      setError('Pick at least one reason.');
      return;
    }
    if (narrative.trim().length < 30) {
      setError('Tell us a little more — at least 30 characters helps the officer.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const fd = new FormData();
    fd.set('ticketId', ticket.id);
    fd.set('reasons', JSON.stringify(reasons));
    fd.set('narrative', narrative);
    for (const f of files) fd.append('evidence', f, f.name);

    try {
      const res = await fetch('/api/screening/submit', { method: 'POST', body: fd });
      if (!res.ok) throw new Error(`Could not submit (${res.status})`);
      const j = (await res.json()) as { reviewId: string };
      window.location.href = `/dispute/submitted?id=${encodeURIComponent(j.reviewId)}`;
    } catch (e) {
      setError((e as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="space-y-8">
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-ink">Why are you asking for a Screening Review?</legend>
          <p className="text-xs text-ink-subtle">Pick all that apply.</p>
          {REASONS.map((r) => {
            const checked = reasons.includes(r.code);
            return (
              <label
                key={r.code}
                className={
                  'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ' +
                  (checked ? 'border-ink bg-ink/5' : 'border-line bg-surface-raised hover:border-ink/40')
                }
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleReason(r.code)}
                  className="mt-1 h-4 w-4 accent-fair"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-ink">{r.label}</span>
                  <span className="mt-0.5 block text-xs text-ink-soft">{r.hint}</span>
                </span>
              </label>
            );
          })}
        </fieldset>

        <div>
          <label htmlFor="narrative" className="block text-sm font-medium text-ink">
            Tell us, in your own words
          </label>
          <p className="mt-1 text-xs text-ink-subtle">
            The Screening Officer reads this directly. Be specific about dates, what happened, and what you'd like
            them to consider.
          </p>
          <textarea
            id="narrative"
            rows={6}
            value={narrative}
            onChange={(e) => setNarrative(e.target.value)}
            className="input mt-2 resize-none"
            placeholder="On the day of the citation, I was…"
          />
          <p className="mt-1 text-right text-xs text-ink-subtle">{narrative.length} characters</p>
        </div>

        <div>
          <label htmlFor="evidence" className="block text-sm font-medium text-ink">
            Evidence (optional)
          </label>
          <p className="mt-1 text-xs text-ink-subtle">
            Up to {MAX_FILES} files. Photos or PDFs, max 8 MB each. Stored privately in your case file.
          </p>
          <input
            id="evidence"
            ref={fileInput}
            type="file"
            multiple
            accept={ACCEPT}
            onChange={(e) => addFiles(e.target.files)}
            className="mt-2 block w-full text-sm text-ink-soft file:mr-4 file:rounded-lg file:border-0 file:bg-ink file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-white hover:file:bg-ink-soft"
          />
          {files.length > 0 && (
            <ul className="mt-3 space-y-2">
              {files.map((f, i) => (
                <li key={`${f.name}-${i}`} className="flex items-center justify-between rounded-lg border border-line bg-surface-raised px-3 py-2 text-sm">
                  <span className="min-w-0 truncate">
                    <span className="font-medium text-ink">{f.name}</span>
                    <span className="ml-2 text-ink-subtle">{(f.size / 1024).toFixed(0)} KB</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="ml-3 text-xs text-danger underline-offset-4 hover:underline"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {error && (
          <div className="rounded-xl border border-danger/30 bg-danger/5 p-4 text-sm text-danger" role="alert">
            {error}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
          <p className="text-sm text-ink-subtle">
            By submitting, you agree to a non-binding AI pre-screening before the human officer reviews.
          </p>
          <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-60">
            {submitting ? 'Submitting…' : 'Submit Screening Review'}
          </button>
        </div>
      </section>

      <aside className="space-y-5">
        <div className="card p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-subtle">Notice on file</p>
          <p className="mt-2 font-display text-2xl font-semibold tracking-tight">{ticket.offence_label}</p>
          <p className="mt-1 text-sm text-ink-soft">{ticket.location_text ?? '—'}</p>
          <p className="mt-3 font-mono text-xs text-ink-subtle">{ticket.id}</p>
          <p className="mt-4 font-display text-2xl text-ink">
            ${(ticket.amount_cents / 100).toLocaleString('en-CA')}
          </p>
        </div>

        <div className="card p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-subtle">What happens next</p>
          <ol className="mt-3 space-y-3 text-sm text-ink-soft">
            <li>
              <span className="font-medium text-ink">1. Pre-screening (instant).</span> The FairPlan agent drafts a
              recommendation with relevant by-laws.
            </li>
            <li>
              <span className="font-medium text-ink">2. Officer review (within 10 days).</span> A human Screening Officer
              examines your case and the agent's draft.
            </li>
            <li>
              <span className="font-medium text-ink">3. Decision.</span> You'll receive a Notice of Decision in your
              account explaining the outcome.
            </li>
          </ol>
        </div>
      </aside>
    </form>
  );
}
