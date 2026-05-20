import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import DisputeForm from '~/components/DisputeForm';
import { getTicket } from '~/lib/db';
import { env } from '~/lib/runtime';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return { title: `Screening Review · ${id?.toUpperCase()} · FairPlan` };
}

export default async function DisputePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = (rawId ?? '').toUpperCase();
  const ticket = id ? await getTicket(env().DB, id) : null;

  if (!ticket) redirect('/not-found?id=' + encodeURIComponent(id));

  return (
    <section className="mx-auto max-w-[1400px] px-6 lg:px-10 pt-12 pb-24 md:pt-16">
      <nav className="mb-8 text-sm">
        <Link href={`/ticket/${ticket.id}`} className="text-ink-subtle hover:text-ink">
          ← Back to notice {ticket.id}
        </Link>
      </nav>
      <header className="mb-10 max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-fair-dark">Screening Review</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl text-balance">
          Ask the City to take another look.
        </h1>
        <p className="mt-4 text-ink-soft">
          Under Brampton&apos;s APS, you have 15 days from the date on the notice to request a Screening Review.
          There&apos;s no cost to file. A human Screening Officer always decides.
        </p>
      </header>
      <DisputeForm ticket={ticket} />
    </section>
  );
}
