import type { APIRoute } from 'astro';
import { getTicket } from '~/lib/db';
import { findPenalty } from '~/lib/data/penalties';

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
  const env = locals.runtime.env;
  const id = params.id?.toString().toUpperCase() ?? '';
  if (!id) return new Response('missing id', { status: 400 });

  const ticket = await getTicket(env.DB, id);
  if (!ticket) return new Response('not found', { status: 404 });

  return Response.json({
    ticket,
    penalty: findPenalty(ticket.offence_code) ?? null,
  });
};
