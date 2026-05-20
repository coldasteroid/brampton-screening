import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import OfficerCase from '~/components/OfficerCase';
import { requireRole } from '~/lib/auth';
import { getReview, getTicket, listEvidence } from '~/lib/db';
import type { OfficerRecommendation } from '~/lib/agents/skills';
import { getCurrentUser } from '~/lib/auth-server';
import { env } from '~/lib/runtime';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return { title: `Review ${id} · FairPlan` };
}

export default async function OfficerCasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const guard = requireRole(await getCurrentUser(), ['officer', 'manager']);
  if (!guard.ok) redirect(guard.redirect);

  const { id } = await params;
  const e = env();
  const review = id ? await getReview(e.DB, id) : null;
  if (!review) redirect('/officer');

  const [ticket, evidence] = await Promise.all([
    getTicket(e.DB, review.ticket_id),
    listEvidence(e.DB, review.id),
  ]);

  const recommendation: OfficerRecommendation | null = review.ai_recommendation
    ? (JSON.parse(review.ai_recommendation) as OfficerRecommendation)
    : null;

  return (
    <section className="mx-auto max-w-[1400px] px-6 lg:px-10 pt-12 pb-24 md:pt-16">
      <nav className="mb-8 text-sm">
        <Link href="/officer" className="text-ink-subtle hover:text-ink">
          ← Back to queue
        </Link>
      </nav>
      {ticket && (
        <OfficerCase review={review} initialRecommendation={recommendation} evidence={evidence} />
      )}
    </section>
  );
}
