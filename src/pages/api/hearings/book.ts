import type { APIRoute } from 'astro';
import { z } from 'zod';
import { createHearing, getHearingForReview, getReview, logAudit } from '~/lib/db';

export const prerender = false;

const schema = z.object({
  reviewId: z.string().min(1),
  startsAt: z.string().datetime(),
});

export const POST: APIRoute = async ({ request, locals }) => {
  const env = locals.runtime.env;
  const form = await request.formData();
  const parsed = schema.safeParse({
    reviewId: form.get('reviewId'),
    startsAt: form.get('startsAt'),
  });
  if (!parsed.success) return new Response('bad request', { status: 400 });

  const review = await getReview(env.DB, parsed.data.reviewId);
  if (!review || review.decision !== 'hearing_required') {
    return new Response('review not eligible', { status: 409 });
  }

  const existing = await getHearingForReview(env.DB, review.id);
  if (existing) {
    return Response.redirect(new URL(`/hearing/${existing.id}`, request.url), 303);
  }

  const id = `hr_${crypto.randomUUID().replace(/-/g, '').slice(0, 14)}`;
  await createHearing(env.DB, { id, reviewId: review.id, scheduledAt: parsed.data.startsAt });
  await logAudit(env.DB, {
    ticket_id: review.ticket_id,
    actor: locals.user ? `user:${locals.user.id}` : 'resident:anonymous',
    action: 'book_hearing',
    details: { hearingId: id, scheduledAt: parsed.data.startsAt },
  });

  return Response.redirect(new URL(`/hearing/${id}`, request.url), 303);
};
