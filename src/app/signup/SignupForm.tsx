'use client';

import { useActionState } from 'react';
import { signUpAction, type SignupActionState } from './actions';

const initial: SignupActionState = { error: null, email: '', name: '' };

export default function SignupForm() {
  const [state, formAction, pending] = useActionState(signUpAction, initial);

  return (
    <form action={formAction} className="mt-10 space-y-5" noValidate>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-ink">
          Email
        </label>
        <input
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
        <label htmlFor="name" className="block text-sm font-medium text-ink">
          Your name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          defaultValue={state.name}
          className="input mt-2"
          placeholder="Priya Sandhu"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-ink">
          Choose a password
        </label>
        <p className="mt-1 text-xs text-ink-subtle">At least 8 characters.</p>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
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
          Already have one?{' '}
          <a href="/login" className="text-ink underline underline-offset-4">
            Sign in
          </a>
        </p>
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? 'Creating…' : 'Create account'}
        </button>
      </div>
    </form>
  );
}
