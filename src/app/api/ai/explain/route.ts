import { z } from 'zod';
import { getTicket } from '~/lib/db';
import { explainTicket } from '~/lib/agents/skills';
import { env } from '~/lib/runtime';

const body = z.object({
  ticketId: z.string().regex(/^BRP-\d{4}-\d{6}$/),
  language: z.enum(['en', 'pa', 'hi', 'ur', 'fr', 'es']),
});

export async function POST(request: Request) {
  const e = env();
  const parsed = body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return Response.json({ error: 'bad request', issues: parsed.error.issues }, { status: 400 });
  }

  const ticket = await getTicket(e.DB, parsed.data.ticketId);
  if (!ticket) return Response.json({ error: 'not found' }, { status: 404 });

  const result = await explainTicket(e, ticket, parsed.data.language);
  return Response.json(result);
}
