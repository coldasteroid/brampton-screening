import type { APIRoute } from 'astro';
import { z } from 'zod';
import { getTicket } from '~/lib/db';
import { proposePlan } from '~/lib/agents/skills';

export const prerender = false;

const body = z.object({
  ticketId: z.string().regex(/^BRP-\d{4}-\d{6}$/),
  annualIncome: z.number().min(0).max(2_000_000),
  householdSize: z.number().int().min(1).max(15),
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

  const result = await proposePlan(env, {
    ticket,
    income: parsed.data.annualIncome,
    household: parsed.data.householdSize,
    language: parsed.data.language,
  });
  return Response.json(result);
};
