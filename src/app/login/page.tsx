import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import TicketLookup from '~/components/TicketLookup';
import { getCurrentUser } from '~/lib/auth-server';
import LoginForm from './LoginForm';

export const metadata: Metadata = { title: 'Sign in · FairPlan' };

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect('/');

  return (
    <>
      <section className="mx-auto max-w-[1200px] px-6 pt-14 pb-12 md:pt-20">
        <LoginForm />
      </section>

      <section className="mx-auto max-w-[1200px] px-6 pb-24">
        <div className="card p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-fair-dark">
                No sign-in needed
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
