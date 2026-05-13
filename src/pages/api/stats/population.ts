import type { APIRoute } from 'astro';
import { getBramptonProfile } from '~/lib/data/statcan';

export const prerender = false;

export const GET: APIRoute = async () => {
  const p = await getBramptonProfile();
  return Response.json({ value: p.totalPopulation, source: p.source, asOf: p.asOf });
};
