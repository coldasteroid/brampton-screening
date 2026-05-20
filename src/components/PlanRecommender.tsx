'use client';

import { useState } from 'react';
import type { TicketRow } from '~/lib/db';

interface Props {
  ticket: TicketRow;
  language: 'en' | 'pa' | 'hi' | 'fr';
}

type Stage = 'form' | 'proposed' | 'signed';

interface Plan {
  planId: string;
  band: 'severe' | 'moderate' | 'standard';
  ratio: number;
  limatCAD: number;
  months: number;
  monthlyDollars: number;
  totalDollars: number;
  aprPct: number;
  comparison: { ccAPR: number; ccExtraCost: number; primeRate: number; asOf: string };
}

export default function PlanRecommender({ ticket, language }: Props) {
  const [stage, setStage] = useState<Stage>('form');
  const [income, setIncome] = useState<number>(45000);
  const [household, setHousehold] = useState<number>(3);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amount = (ticket.amount_cents / 100).toLocaleString('en-CA', {
    style: 'currency',
    currency: 'CAD',
  });

  async function submit(e: { preventDefault: () => void }) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/propose-plan', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ticketId: ticket.id,
          annualIncome: income,
          householdSize: household,
          language,
        }),
      });
      if (!res.ok) throw new Error(`Could not generate plan (${res.status})`);
      const p = (await res.json()) as Plan;
      setPlan(p);
      setStage('proposed');
      explainPlan(p);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function explainPlan(p: Plan) {
    setExplanation('');
    try {
      const res = await fetch('/api/ai/explain-plan', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ticketId: ticket.id,
          band: p.band,
          months: p.months,
          monthlyDollars: p.monthlyDollars,
          ccInterestCost: p.comparison.ccExtraCost,
          language,
        }),
      });
      if (res.ok) {
        const j = (await res.json()) as { text?: string };
        setExplanation(j.text ?? '');
      }
    } catch {}
  }

  if (stage === 'form') {
    return (
      <form onSubmit={submit} className="space-y-8" aria-describedby="plan-help">
        <header className="space-y-3">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-fair-dark">Step 1 of 2</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
            Tell us a little, so the plan fits you.
          </h2>
          <p id="plan-help" className="max-w-prose text-ink-soft">
            Used only on your device and in this case file. Combined with Statistics Canada's LIM-AT threshold for 2024 to
            calibrate the most respectful plan we can offer.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <Field
            label="Approximate household income (CAD / year)"
            sub="Before tax. Used only to choose a band."
            id="income"
          >
            <input
              id="income"
              type="number"
              min="0"
              step="500"
              value={income}
              onChange={(e) => setIncome(Math.max(0, parseInt(e.target.value || '0')))}
              className="input"
            />
            <SliderHint income={income} household={household} />
          </Field>

          <Field label="Household size" sub="Including yourself, partners, dependents." id="household">
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <button
                  type="button"
                  key={n}
                  onClick={() => setHousehold(n)}
                  className={
                    'min-w-[3rem] rounded-xl border px-4 py-3 text-sm font-medium transition ' +
                    (n === household
                      ? 'border-ink bg-ink text-white'
                      : 'border-line bg-surface-raised text-ink-soft hover:border-ink/40')
                  }
                >
                  {n}
                </button>
              ))}
            </div>
          </Field>
        </div>

        {error && (
          <div className="rounded-xl border border-danger/30 bg-danger/5 p-4 text-sm text-danger">{error}</div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6">
          <p className="text-sm text-ink-subtle">
            Notice <span className="font-mono">{ticket.id}</span> · {amount} · {ticket.offence_label}
          </p>
          <button type="submit" disabled={loading} className="btn-primary disabled:opacity-60">
            {loading ? 'Calibrating…' : 'See my personalized plan'}
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M5 12h14m-5-5 5 5-5 5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </form>
    );
  }

  if (stage === 'proposed' && plan) {
    return (
      <ProposedPlanView
        ticket={ticket}
        plan={plan}
        explanation={explanation}
        onSign={async () => setStage('signed')}
      />
    );
  }

  if (stage === 'signed' && plan) {
    return <SignedView ticket={ticket} plan={plan} />;
  }

  return null;
}

function ProposedPlanView({
  ticket,
  plan,
  explanation,
  onSign,
}: {
  ticket: TicketRow;
  plan: Plan;
  explanation: string;
  onSign: () => Promise<void>;
}) {
  const bandCopy: Record<Plan['band'], { title: string; body: string; tone: string }> = {
    severe: {
      title: 'Severe-hardship band',
      body: 'Household income below 80% of LIM-AT. 12 monthly instalments, longest plan, 0% APR.',
      tone: 'bg-danger/5 border-danger/30 text-danger',
    },
    moderate: {
      title: 'Moderate-hardship band',
      body: 'Household income between 80% and 130% of LIM-AT. 6 monthly instalments, 0% APR.',
      tone: 'bg-warn/10 border-warn/40 text-amber-700',
    },
    standard: {
      title: 'Standard band',
      body: 'Household income above 130% of LIM-AT. 3 monthly instalments, 0% APR.',
      tone: 'bg-fair/10 border-fair/30 text-fair-dark',
    },
  };
  const meta = bandCopy[plan.band];
  const monthly = plan.monthlyDollars.toLocaleString('en-CA', { style: 'currency', currency: 'CAD' });
  const total = plan.totalDollars.toLocaleString('en-CA', { style: 'currency', currency: 'CAD' });

  return (
    <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="space-y-6">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-fair-dark">Step 2 of 2</p>

        <div className={'rounded-2xl border p-5 text-sm ' + meta.tone}>
          <p className="font-semibold">{meta.title}</p>
          <p className="mt-1.5 opacity-85">{meta.body}</p>
        </div>

        <div className="card overflow-hidden">
          <div className="border-b border-line bg-surface-sunken px-7 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-subtle">Your plan</p>
            <p className="mt-1 font-display text-2xl font-semibold tracking-tight">
              {plan.months} × {monthly}
              <span className="text-ink-subtle">/mo</span>
            </p>
          </div>
          <div className="grid gap-5 px-7 py-6 md:grid-cols-3">
            <Stat label="Total" value={total} />
            <Stat label="APR" value="0.00%" sub="City charges no interest" />
            <Stat label="First payment" value={daysFromNow(14)} sub="Adjustable" />
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="border-b border-line bg-surface-sunken px-7 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-subtle">
              vs. paying by credit card
            </p>
            <p className="mt-1 font-display text-lg font-semibold">
              Live Canadian benchmarks · {plan.comparison.asOf}
            </p>
          </div>
          <div className="grid gap-5 px-7 py-6 md:grid-cols-3">
            <Stat label="Avg credit-card APR" value={`${plan.comparison.ccAPR.toFixed(2)}%`} tone="warn" />
            <Stat label="Extra interest you'd pay" value={`$${plan.comparison.ccExtraCost.toFixed(2)}`} tone="danger" />
            <Stat label="BoC prime today" value={`${plan.comparison.primeRate.toFixed(2)}%`} sub="Bank of Canada" />
          </div>
        </div>

        <button onClick={onSign} className="btn-primary w-full sm:w-auto">
          Accept &amp; e-sign the agreement
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M5 12h14m-5-5 5 5-5 5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </section>

      <aside className="space-y-5">
        <div className="card overflow-hidden">
          <div className="border-b border-line bg-surface-sunken px-6 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-subtle">FairPlan agent</p>
            <p className="mt-0.5 font-display text-lg font-semibold">In plain language</p>
          </div>
          <div className="prose prose-ink max-w-prose whitespace-pre-line px-6 py-6 text-[15px] leading-relaxed">
            {explanation || 'Generating an explanation tailored to your plan…'}
          </div>
        </div>

        <div className="card p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-subtle">Notice on file</p>
          <p className="mt-2 font-display text-lg font-semibold">{ticket.offence_label}</p>
          <p className="mt-1 text-sm text-ink-soft">{ticket.location_text}</p>
          <p className="mt-3 font-mono text-xs text-ink-subtle">{ticket.id}</p>
        </div>
      </aside>
    </div>
  );
}

function SignedView({ ticket, plan }: { ticket: TicketRow; plan: Plan }) {
  const monthly = plan.monthlyDollars.toLocaleString('en-CA', { style: 'currency', currency: 'CAD' });
  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-fair/40 bg-fair/10 p-8">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-fair text-ink">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
              <path
                d="m5 12 5 5 9-11"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <div>
            <p className="font-display text-2xl font-semibold">Plan activated.</p>
            <p className="mt-0.5 text-sm text-ink-soft">
              Notice <span className="font-mono">{ticket.id}</span> is now on a {plan.months}-month plan at {monthly}/mo.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="card p-6">
          <p className="font-display text-lg font-semibold">Your agreement</p>
          <p className="mt-2 text-sm text-ink-soft">
            Signed digitally and stored in Cloudflare R2. Open the agreement in a new tab and save a PDF copy for your
            records.
          </p>
          <a href={`/api/pdf/${plan.planId}`} target="_blank" rel="noopener" className="btn-secondary mt-5 text-sm">
            Open agreement
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M14 5h5v5M19 5l-9 9M9 5H5v14h14v-4"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </div>
        <div className="card p-6">
          <p className="font-display text-lg font-semibold">What happens next</p>
          <ul className="mt-3 space-y-2.5 text-sm text-ink-soft">
            <li>• First payment scheduled in 14 days. Adjustable in the portal.</li>
            <li>• Reminders sent via email and SMS.</li>
            <li>• Miss a payment? FairPlan rebalances automatically — no credit-bureau referral.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  sub,
  id,
  children,
}: {
  label: string;
  sub?: string;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
      </label>
      {sub && <p className="mt-1 text-xs text-ink-subtle">{sub}</p>}
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: 'warn' | 'danger' | 'fair';
}) {
  const colour =
    tone === 'warn'
      ? 'text-amber-700'
      : tone === 'danger'
        ? 'text-danger'
        : tone === 'fair'
          ? 'text-fair-dark'
          : 'text-ink';
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-subtle">{label}</p>
      <p className={'mt-1.5 font-display text-2xl font-semibold tracking-tight ' + colour}>{value}</p>
      {sub && <p className="mt-1 text-xs text-ink-subtle">{sub}</p>}
    </div>
  );
}

function SliderHint({ income, household }: { income: number; household: number }) {
  const limat = Math.round(28000 * Math.sqrt(household));
  const ratio = income / limat;
  let label = `Above LIM-AT for a household of ${household}`;
  let tone = 'text-fair-dark';
  if (ratio < 0.8) {
    label = 'Below LIM-AT — severe hardship band';
    tone = 'text-danger';
  } else if (ratio < 1.3) {
    label = 'Near LIM-AT — moderate hardship band';
    tone = 'text-amber-700';
  }
  return <p className={`mt-2 text-xs ${tone}`}>{label}</p>;
}

function daysFromNow(days: number): string {
  const d = new Date(Date.now() + days * 86_400_000);
  return d.toLocaleDateString('en-CA', { dateStyle: 'medium' });
}
