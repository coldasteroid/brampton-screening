import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import TicketLookup from '~/components/TicketLookup';
import { getCurrentUser } from '~/lib/auth-server';
import SignupForm from './SignupForm';

export const metadata: Metadata = { title: 'Create account · FairPlan' };

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) redirect('/');

  return (
    <>
      <section className="mx-auto max-w-[1200px] px-6 pt-14 pb-12 md:pt-20">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="min-w-0">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-fair-dark">
              Create an account
            </p>
            <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">
              A short signup, then you&apos;re in.
            </h1>
            <p className="mt-4 max-w-prose text-ink-soft">
              You&apos;ll get a Resident account by default. Brampton staff are provisioned by their manager.
            </p>

            <SignupForm />
          </div>

          <aside className="min-w-0">
            <div className="card overflow-hidden">
              <div className="border-b border-line bg-surface-sunken px-6 py-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-fair-dark">What you get</p>
                <p className="mt-1 font-display text-lg font-semibold text-ink">A resident account</p>
              </div>
              <ul className="divide-y divide-line text-sm">
                <li className="px-6 py-4">
                  <p className="font-medium text-ink">Look up any notice tied to you</p>
                  <p className="mt-0.5 text-ink-subtle">
                    Plate and address are matched automatically once you&apos;re signed in.
                  </p>
                </li>
                <li className="px-6 py-4">
                  <p className="font-medium text-ink">Personalized payment plans</p>
                  <p className="mt-0.5 text-ink-subtle">
                    Hardship-aware, 0% APR, calibrated to your household.
                  </p>
                </li>
                <li className="px-6 py-4">
                  <p className="font-medium text-ink">Notice history &amp; reminders</p>
                  <p className="mt-0.5 text-ink-subtle">
                    Every interaction logged for FOI/audit. Reminders in your language.
                  </p>
                </li>
              </ul>
              <div className="border-t border-line bg-surface-sunken px-6 py-4">
                <p className="text-xs text-ink-subtle">
                  Want to test as a Screening Officer or Manager? Sign in with the demo accounts on the{' '}
                  <a href="/login" className="text-ink underline underline-offset-4">
                    login page
                  </a>
                  .
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-6 pb-24">
        <div className="card p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-fair-dark">
                No account needed
              </p>
              <p className="mt-1 font-display text-lg font-semibold text-ink">
                Just want to check a notice? Enter it here.
              </p>
            </div>
            <div className="md:w-[26rem]">
              <TicketLookup variant="inline" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
