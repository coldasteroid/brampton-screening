import type { APIRoute } from 'astro';
import { ticketsByWard, listTickets } from '~/lib/db';
import { getRateBundle } from '~/lib/data/boc';
import { getBramptonProfile } from '~/lib/data/statcan';

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  const env = locals.runtime.env;
  const [byWard, recent, rates, profile] = await Promise.all([
    ticketsByWard(env.DB),
    listTickets(env.DB, 25),
    getRateBundle(),
    getBramptonProfile(),
  ]);

  const totalDue = recent.reduce(
    (acc, t) => (t.status === 'open' ? acc + t.amount_cents : acc),
    0,
  );

  // Toy predictive-collections score: cases due in <= 7 days and unpaid get high risk.
  const now = Date.now();
  const atRisk = recent
    .filter((t) => t.status === 'open')
    .map((t) => {
      const daysToDue = Math.max(0, (Date.parse(t.due_at) - now) / 86_400_000);
      const risk = Math.min(1, 1.2 - daysToDue / 15);
      return { id: t.id, ward: t.ward, label: t.offence_label, amount: t.amount_cents / 100, daysToDue, risk };
    })
    .sort((a, b) => b.risk - a.risk)
    .slice(0, 8);

  return Response.json({
    byWard,
    recent,
    atRisk,
    totals: { openCents: totalDue, openCount: recent.filter((t) => t.status === 'open').length },
    rates,
    profile,
  });
};
