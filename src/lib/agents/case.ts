/**
 * FairPlanCase — Durable Object stub.
 *
 * Designed for the next sprint: one DO per ticket, holds full conversation
 * history, the active hardship band, and the proposed plan with synchronous
 * SQLite-backed reads (< 5 ms). For the 1-day POC build the agent skills run
 * stateless against D1 via `./skills`; promoting them onto a DO is a routing
 * change in the API handlers, not a rewrite.
 *
 * Wiring into a Workers deployment requires a custom `workerEntryPoint` in
 * astro.config.mjs that re-exports this class alongside the Astro handler.
 */

import { explainTicket, proposePlan, explainPlan } from './skills';

export class FairPlanCase {
  state: DurableObjectState;
  env: Env;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const body = await req.json().catch(() => ({}));

    try {
      switch (url.pathname) {
        case '/explain': {
          const result = await explainTicket(this.env, (body as any).ticket, (body as any).language);
          return Response.json(result);
        }
        case '/propose-plan': {
          const result = await proposePlan(this.env, body as any);
          return Response.json(result);
        }
        case '/explain-plan': {
          const result = await explainPlan(this.env, body as any);
          return Response.json(result);
        }
        default:
          return new Response('unknown skill', { status: 404 });
      }
    } catch (err) {
      return Response.json({ error: (err as Error).message }, { status: 500 });
    }
  }
}
