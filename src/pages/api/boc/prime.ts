import type { APIRoute } from 'astro';
import { getRateBundle } from '~/lib/data/boc';

export const prerender = false;

export const GET: APIRoute = async () => {
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
};
