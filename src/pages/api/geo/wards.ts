import type { APIRoute } from 'astro';
import { getWardBoundaries, FALLBACK_WARDS } from '~/lib/data/brampton-geohub';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const geo = await getWardBoundaries();
    return Response.json(geo, {
      headers: { 'cache-control': 'public, max-age=3600' },
    });
  } catch {
    return Response.json(FALLBACK_WARDS, {
      headers: { 'cache-control': 'no-store', 'x-fairplan-fallback': 'wards' },
    });
  }
};
