import { getBramptonProfile } from '~/lib/data/statcan';

export async function GET() {
  const p = await getBramptonProfile();
  return Response.json({ value: p.totalPopulation, source: p.source, asOf: p.asOf });
}
