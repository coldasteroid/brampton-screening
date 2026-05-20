import { getTicket } from '~/lib/db';
import { findPenalty } from '~/lib/data/penalties';
import { env } from '~/lib/runtime';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: raw } = await params;
  const id = (raw ?? '').toUpperCase();
  if (!id) return new Response('missing id', { status: 400 });

  const ticket = await getTicket(env().DB, id);
  if (!ticket) return new Response('not found', { status: 404 });

  return Response.json({
    ticket,
    penalty: findPenalty(ticket.offence_code) ?? null,
  });
}
