import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import PlanRecommender from '~/components/PlanRecommender';
import { getTicket } from '~/lib/db';
import { getCurrentUser } from '~/lib/auth-server';
import { getLang } from '~/lib/i18n-server';
import { env } from '~/lib/runtime';

export const metadata: Metadata = { title: 'Personalized plan · FairPlan' };

export default async function PlanPage({
  searchParams,
}: {
  searchParams: Promise<{ ticket?: string }>;
}) {
  const { ticket: ticketParam } = await searchParams;
  const id = (ticketParam ?? '').toUpperCase();
  const ticket = id ? await getTicket(env().DB, id) : null;

  if (!ticket) {
    redirect('/not-found?id=' + encodeURIComponent(id));
  }

  const lang = await getLang();
  // Reference for nav guard parity with Astro's `Astro.locals.user` access.
  await getCurrentUser();

  return (
    <section className="mx-auto max-w-[1200px] px-6 lg:px-10 pt-14 pb-24 md:pt-20">
      <nav className="mb-8 text-sm">
        <Link href={`/ticket/${ticket.id}`} className="text-ink-subtle hover:text-ink">
          ← Back to notice {ticket.id}
        </Link>
      </nav>
      <PlanRecommender ticket={ticket} language={lang} />
    </section>
  );
}
