import { getBramptonProfile } from '~/lib/data/statcan';

export async function GET() {
  const p = await getBramptonProfile();
  return Response.json({
    value: 160,
    top: p.topLanguages,
    asOf: p.asOf,
    source: p.source,
  });
}
