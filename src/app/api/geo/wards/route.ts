import { getWardBoundaries, FALLBACK_WARDS } from '~/lib/data/brampton-geohub';

export async function GET() {
  try {
    const geo = await getWardBoundaries();
    return Response.json(geo, { headers: { 'cache-control': 'public, max-age=3600' } });
  } catch {
    return Response.json(FALLBACK_WARDS, {
      headers: { 'cache-control': 'no-store', 'x-fairplan-fallback': 'wards' },
    });
  }
}
