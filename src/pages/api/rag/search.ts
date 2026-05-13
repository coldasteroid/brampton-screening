import type { APIRoute } from 'astro';
import { z } from 'zod';
import { lookupBylaw } from '~/lib/agents/skills';

export const prerender = false;

const schema = z.object({
  q: z.string().min(1).max(500),
  k: z.coerce.number().int().min(1).max(10).optional(),
});

export const GET: APIRoute = ({ url }) => {
  const parsed = schema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) return Response.json({ error: 'bad query' }, { status: 400 });
  const hits = lookupBylaw(parsed.data.q, parsed.data.k ?? 4);
  return Response.json({ query: parsed.data.q, hits });
};
