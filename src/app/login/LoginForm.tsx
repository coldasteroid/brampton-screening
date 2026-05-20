'use client';

import { useActionState, useRef } from 'react';
import { signInAction, type LoginActionState } from './actions';

const DEMO_PASSWORD = 'fairplan2026';
const demos = [
  { label: 'Resident', email: 'resident@brampton.demo' },
  { label: 'Screening Officer', email: 'officer@brampton.demo' },
  { label: 'Manager', email: 'manager@brampton.demo' },
];

const initial: LoginActionState = { error: null, email: '' };

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(signInAction, initial);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  function fillDemo(email: string) {
    if (emailRef.current) emailRef.current.value = email;
    if (passwordRef.current) passwordRef.current.value = DEMO_PASSWORD;
    emailRef.current?.focus();
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="min-w-0">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-fair-dark">Sign in</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">
          Welcome back to FairPlan.
        </h1>
        <p className="mt-4 max-w-prose text-ink-soft">
          Residents and Brampton staff use the same portal — your role determines what you can see.
        </p>

        <form action={formAction} className="mt-10 space-y-5" noValidate>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-ink">
              Email
            </label>
            <input
              ref={emailRef}
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              defaultValue={state.email}
              className="input mt-2"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-ink">
              Password
            </label>
            <input
              ref={passwordRef}
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="input mt-2"
              placeholder="••••••••"
            />
          </div>

          {state.error && (
            <div
              className="rounded-xl border border-danger/30 bg-danger/5 p-4 text-sm text-danger"
              role="alert"
            >
              {state.error}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
            <p className="text-sm text-ink-subtle">
              New here?{' '}
              <a href="/signup" className="text-ink underline underline-offset-4">
                Create an account
              </a>
            </p>
            <button type="submit" disabled={pending} className="btn-primary">
              {pending ? 'Signing in…' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>

      <aside className="min-w-0">
        <div className="card overflow-hidden">
          <div className="border-b border-line bg-surface-sunken px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-fair-dark">For reviewers</p>
            <p className="mt-1 font-display text-lg font-semibold text-ink">Sample credentials</p>
            <p className="mt-1 text-xs text-ink-subtle">
              Click a role to autofill. Password is <span className="font-mono text-ink">{DEMO_PASSWORD}</span>.
            </p>
          </div>
          <ul className="divide-y divide-line">
            {demos.map((d) => (
              <li key={d.email}>
                <button
                  type="button"
                  onClick={() => fillDemo(d.email)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition hover:bg-surface-sunken"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">{d.label}</p>
                    <p className="mt-0.5 truncate font-mono text-xs text-ink-subtle">{d.email}</p>
                  </div>
                  <span className="pill bg-fair/10 text-xs text-fair-dark">Use</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="border-t border-line bg-surface-sunken px-6 py-4">
            <p className="text-xs text-ink-subtle">
              Demo accounts are created on first sign-in. Passwords are PBKDF2-SHA256 hashed; sessions are
              HMAC-signed cookies — see <span className="font-mono">src/lib/auth.ts</span>.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
