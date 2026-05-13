import type { APIRoute } from 'astro';
import { z } from 'zod';
import { requireRole } from '~/lib/auth';
import { getReview, getTicket } from '~/lib/db';
import { draftOfficerRecommendation } from '~/lib/agents/skills';

export const prerender = false;

const body = z.object({ reviewId: z.string().min(1) });

export const POST: APIRoute = async ({ request, locals }) => {
  const guard = requireRole(locals.user, ['officer', 'manager']);
  if (!guard.ok) return new Response('forbidden', { status: 403 });

  const parsed = body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return new Response('bad request', { status: 400 });

  const env = locals.runtime.env;
  const review = await getReview(env.DB, parsed.data.reviewId);
  if (!review) return new Response('not found', { status: 404 });

  const ticket = await getTicket(env.DB, review.ticket_id);
  if (!ticket) return new Response('ticket missing', { status: 500 });

  const recommendation = await draftOfficerRecommendation(env, { ticket, review });
  return Response.json(recommendation);
};
