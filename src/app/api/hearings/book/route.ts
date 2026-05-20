import { z } from 'zod';
import { createHearing, getHearingForReview, getReview, logAudit } from '~/lib/db';
import { getCurrentUser } from '~/lib/auth-server';
import { env } from '~/lib/runtime';

const schema = z.object({
  reviewId: z.string().min(1),
  startsAt: z.string().datetime(),
});

export async function POST(request: Request) {
  const e = env();
  const user = await getCurrentUser();
  const form = await request.formData();
  const parsed = schema.safeParse({
    reviewId: form.get('reviewId'),
    startsAt: form.get('startsAt'),
  });
  if (!parsed.success) return new Response('bad request', { status: 400 });

  const review = await getReview(e.DB, parsed.data.reviewId);
  if (!review || review.decision !== 'hearing_required') {
    return new Response('review not eligible', { status: 409 });
  }

  const existing = await getHearingForReview(e.DB, review.id);
  if (existing) {
    return Response.redirect(new URL(`/hearing/${existing.id}`, request.url), 303);
  }

  const id = `hr_${crypto.randomUUID().replace(/-/g, '').slice(0, 14)}`;
  await createHearing(e.DB, { id, reviewId: review.id, scheduledAt: parsed.data.startsAt });
  await logAudit(e.DB, {
    ticket_id: review.ticket_id,
    actor: user ? `user:${user.id}` : 'resident:anonymous',
    action: 'book_hearing',
    details: { hearingId: id, scheduledAt: parsed.data.startsAt },
  });

  return Response.redirect(new URL(`/hearing/${id}`, request.url), 303);
}
