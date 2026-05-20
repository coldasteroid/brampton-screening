import { z } from 'zod';
import { requireRole } from '~/lib/auth';
import { getReview, getTicket } from '~/lib/db';
import { draftOfficerRecommendation } from '~/lib/agents/skills';
import { getCurrentUser } from '~/lib/auth-server';
import { env } from '~/lib/runtime';

const body = z.object({ reviewId: z.string().min(1) });

export async function POST(request: Request) {
  const guard = requireRole(await getCurrentUser(), ['officer', 'manager']);
  if (!guard.ok) return new Response('forbidden', { status: 403 });

  const parsed = body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return new Response('bad request', { status: 400 });

  const e = env();
  const review = await getReview(e.DB, parsed.data.reviewId);
  if (!review) return new Response('not found', { status: 404 });

  const ticket = await getTicket(e.DB, review.ticket_id);
  if (!ticket) return new Response('ticket missing', { status: 500 });

  const recommendation = await draftOfficerRecommendation(e, { ticket, review });
  return Response.json(recommendation);
}
