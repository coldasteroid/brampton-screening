import { z } from 'zod';
import { requireRole } from '~/lib/auth';
import { decideReview, getReview, logAudit } from '~/lib/db';
import { getCurrentUser } from '~/lib/auth-server';
import { env } from '~/lib/runtime';

const body = z.object({
  reviewId: z.string().min(1),
  decision: z.enum(['cancelled', 'reduced', 'upheld', 'hearing_required']),
  amountCents: z.number().int().nullable().optional(),
  reasoning: z.string().min(20).max(4000),
});

export async function POST(request: Request) {
  const guard = requireRole(await getCurrentUser(), ['officer', 'manager']);
  if (!guard.ok) return new Response('forbidden', { status: 403 });

  const parsed = body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return new Response('bad request', { status: 400 });

  const e = env();
  const review = await getReview(e.DB, parsed.data.reviewId);
  if (!review) return new Response('not found', { status: 404 });

  await decideReview(e.DB, {
    reviewId: parsed.data.reviewId,
    officerId: guard.user.id,
    decision: parsed.data.decision,
    amountCents: parsed.data.decision === 'reduced' ? (parsed.data.amountCents ?? null) : null,
    reasoning: parsed.data.reasoning,
  });
  await logAudit(e.DB, {
    ticket_id: review.ticket_id,
    actor: `officer:${guard.user.id}`,
    action: 'decide_review',
    details: { reviewId: parsed.data.reviewId, decision: parsed.data.decision },
  });

  return Response.json({ ok: true });
}
