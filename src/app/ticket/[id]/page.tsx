import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import TicketExperience from '~/components/TicketExperience';
import { getTicket, listRemindersForTicket } from '~/lib/db';
import { findPenalty } from '~/lib/data/penalties';
import { scheduleNoticeReminders } from '~/lib/reminders';
import { getCurrentUser } from '~/lib/auth-server';
import { getLang } from '~/lib/i18n-server';
import { env } from '~/lib/runtime';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return { title: `Notice ${id?.toUpperCase()} · FairPlan` };
}

export default async function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = (rawId ?? '').toUpperCase();
  const e = env();
  const ticket = id ? await getTicket(e.DB, id) : null;
  const penalty = ticket ? (findPenalty(ticket.offence_code) ?? null) : null;

  if (!ticket) {
    redirect('/not-found?id=' + encodeURIComponent(id));
  }

  const [user, lang] = await Promise.all([getCurrentUser(), getLang()]);
  await scheduleNoticeReminders(e.DB, {
    ticket,
    userId: user?.id ?? ticket.user_id ?? null,
  });
  const reminders = await listRemindersForTicket(e.DB, ticket.id);

  return (
    <section className="mx-auto max-w-[1200px] px-6 lg:px-10 pt-14 pb-24 md:pt-20">
      <nav className="mb-8 text-sm">
        <Link href="/" className="text-ink-subtle hover:text-ink">
          ← Back to resident portal
        </Link>
      </nav>
      <TicketExperience ticket={ticket} penalty={penalty} reminders={reminders} language={lang} />
    </section>
  );
}
