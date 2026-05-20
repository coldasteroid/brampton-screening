import { getRateBundle } from '~/lib/data/boc';

export async function GET() {
  const r = await getRateBundle();
  return Response.json({
    value: r.primeRate,
    asOf: r.asOf,
    overnight: r.overnightRate,
    consumerBenchmarks: {
      averageCreditCardAPR: r.averageCreditCardAPR,
      averageLineOfCreditAPR: r.averageLineOfCreditAPR,
    },
  });
}
