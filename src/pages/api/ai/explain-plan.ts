import type { APIRoute } from 'astro';
import { z } from 'zod';
import { getTicket } from '~/lib/db';
import { explainPlan } from '~/lib/agents/skills';

export const prerender = false;

const body = z.object({
  ticketId: z.string().regex(/^BRP-\d{4}-\d{6}$/),
  band: z.enum(['severe', 'moderate', 'standard']),
  months: z.number().int(),
  monthlyDollars: z.number(),
  ccInterestCost: z.number(),
  language: z.enum(['en', 'pa', 'hi', 'ur', 'fr', 'es']),
});

export const POST: APIRoute = async ({ request, locals }) => {
  const env = locals.runtime.env;
  const parsed = body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return Response.json({ error: 'bad request', issues: parsed.error.issues }, { status: 400 });
  }

  const ticket = await getTicket(env.DB, parsed.data.ticketId);
  if (!ticket) return Response.json({ error: 'not found' }, { status: 404 });

  const result = await explainPlan(env, { ticket, ...parsed.data });
  return Response.json(result);
};
