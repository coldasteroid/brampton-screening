import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'About FairPlan' };

const stack = [
  {
    group: 'Edge & runtime',
    items: [
      ['Cloudflare Workers', 'Single-region edge runtime, Next.js server routes compile to it'],
      ['Workers Assets', 'Static frontend bundle co-located with the Worker'],
      ['Custom domain via Registrar', 'Pointed via DNS once production environment is selected'],
    ],
  },
  {
    group: 'State & storage',
    items: [
      ['D1', 'Tickets, plans, audit log — SQLite, point-in-time restore'],
      ['R2', 'Signed PDF agreements and evidence uploads'],
      ['KV', 'Feature flags & translation cache'],
    ],
  },
  {
    group: 'AI',
    items: [
      ['Workers AI', 'Llama 3.3 70B + bge-m3 + Whisper, on-platform inference'],
      ['AI Gateway', 'Cost tracking, request caching, PII guardrails'],
      ['Anthropic Claude', 'Hot-swappable via AI Gateway for reasoning-heavy steps'],
    ],
  },
  {
    group: 'Public data',
    items: [
      ['Brampton GeoHub', 'Ward boundary FeatureServer — live'],
      ['Statistics Canada 2021', 'Brampton CSD 3521010 profile, LIM-AT thresholds'],
      ['Bank of Canada Valet', 'Live prime + overnight rates for APR comparison'],
    ],
  },
];

const skills = [
  {
    name: 'explain_ticket',
    input: 'ticket, language',
    output: "plain-language explanation in resident's language",
    notes: 'Composes bylaw context + 3-option narrative. Bounded to ~480 tokens.',
  },
  {
    name: 'propose_plan',
    input: 'ticket, annual income, household size, language',
    output: 'plan band, months, monthly $, BoC comparison, plan id (persisted)',
    notes: 'Deterministic policy logic + LIM-AT band; live BoC rates; no LLM in the decision.',
  },
  {
    name: 'explain_plan',
    input: 'ticket, band, months, monthly $, CC interest cost, language',
    output: "warm two-paragraph rationale in resident's language",
    notes: 'LLM call. Explicitly references concrete numbers from the deterministic plan.',
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="mx-auto max-w-[1200px] px-6 py-16 md:py-24">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-fair-dark">
          About this proof of concept
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl text-balance">
          What FairPlan is, what it isn&apos;t, and how it&apos;s built.
        </h1>
        <p className="mt-5 max-w-prose text-lg leading-relaxed text-ink-soft text-balance">
          FairPlan is a working proof of concept for the City of Brampton&apos;s published POC topic on
          Administrative Penalty System Modernization &amp; Personalized Payment Experience. It is not affiliated
          with the City. Every line item from the official benefits list is addressed by a corresponding flow in
          this build.
        </p>
      </section>

      <section className="mx-auto max-w-[1200px] px-6 pb-16">
        <h2 className="font-display text-2xl font-semibold tracking-tight">Architecture</h2>
        <p className="mt-3 max-w-prose text-ink-soft">
          A single Next.js app deploys to Cloudflare Workers via @opennextjs/cloudflare. Server-rendered pages live
          alongside route handlers that delegate to a small set of agent skills. Every model call is
          provider-agnostic — flip the <code className="font-mono text-fair-dark">AI_PROVIDER</code> environment
          variable to switch from Workers AI to Anthropic Claude via Cloudflare AI Gateway without changing
          application code.
        </p>

        <div className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-2">
          {stack.map((s) => (
            <div key={s.group} className="bg-surface-raised p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-fair-dark">{s.group}</p>
              <ul className="mt-3 space-y-2.5">
                {s.items.map(([k, v]) => (
                  <li key={k} className="text-sm">
                    <span className="font-medium text-ink">{k}</span>
                    <span className="text-ink-subtle"> — {v}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-6 pb-16">
        <h2 className="font-display text-2xl font-semibold tracking-tight">Agent skills</h2>
        <p className="mt-3 max-w-prose text-ink-soft">
          Skills are small, auditable, Zod-validated functions. The LLM is used for explanation and translation
          only — decisions that touch money (which band, which plan length, payment amounts) are deterministic
          policy code that a Screening Officer can review line-by-line.
        </p>
        <div className="mt-8 overflow-hidden rounded-2xl border border-line">
          <table className="w-full divide-y divide-line text-sm">
            <thead className="bg-surface-sunken text-left">
              <tr>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-ink-subtle">
                  Skill
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-ink-subtle">
                  Input
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-ink-subtle">
                  Output
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-ink-subtle">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-surface-raised">
              {skills.map((s) => (
                <tr key={s.name}>
                  <td className="px-5 py-4 font-mono text-xs">{s.name}</td>
                  <td className="px-5 py-4 text-ink-soft">{s.input}</td>
                  <td className="px-5 py-4 text-ink-soft">{s.output}</td>
                  <td className="px-5 py-4 text-ink-subtle">{s.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-6 pb-24">
        <h2 className="font-display text-2xl font-semibold tracking-tight">Roadmap beyond this sprint</h2>
        <ul className="mt-5 grid gap-4 md:grid-cols-2">
          {[
            ['Durable Objects per case', 'One actor per ticket holding multi-turn conversation, alarms for reminders'],
            ['Workflows for screening', 'Durable multi-day pipeline with waitForEvent for officer approval'],
            ['Vectorize over bylaws', 'RAG over Brampton bylaws + Ontario AMPS regs — multilingual via bge-m3'],
            ['Cloudflare Realtime', 'Live remote hearing with on-screen bylaw clause assistance'],
            ['Cloudflare Access', 'SSO-gated staff app with Screening Officer queue and audit trail'],
            ['Email Workers + Queues', 'Outbound reminders + inbound reply routing per ticket ID'],
          ].map(([t, b]) => (
            <li key={t} className="card p-5">
              <p className="font-display text-lg font-semibold">{t}</p>
              <p className="mt-1.5 text-sm text-ink-soft">{b}</p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
