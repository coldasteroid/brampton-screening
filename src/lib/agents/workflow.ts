// ScreeningWorkflow — a Cloudflare Workflow that orchestrates the multi-day
// dispute lifecycle. Each step is durably memoized; the worker can be evicted
// or redeployed and the workflow resumes at the next un-memoized step.
//
// Wiring (production):
//   1. Uncomment the SCREENING_WORKFLOW binding block in wrangler.jsonc.
//   2. Re-export this class from src/worker-entry.ts.
//   3. Run: wrangler deploy.
//
// Local development relies on the pure-function path in src/lib/agents/skills.ts;
// this file ships ready for the deploy upgrade.

import {
  WorkflowEntrypoint,
  type WorkflowEvent,
  type WorkflowStep,
} from 'cloudflare:workers';

import { draftOfficerRecommendation } from './skills';
import { getReview, getTicket, logAudit } from '../db';

export interface ScreeningWorkflowParams {
  reviewId: string;
}

/**
 * Pipeline:
 *   intake → draft AI recommendation → await officer decision → notify resident
 */
export class ScreeningWorkflow extends WorkflowEntrypoint<Env, ScreeningWorkflowParams> {
  async run(event: WorkflowEvent<ScreeningWorkflowParams>, step: WorkflowStep) {
    const { reviewId } = event.payload;

    const review = await step.do('intake', async () => {
      const row = await getReview(this.env.DB, reviewId);
      if (!row) throw new Error(`Review ${reviewId} not found`);
      return row;
    });

    const ticket = await step.do('load-ticket', async () => {
      const row = await getTicket(this.env.DB, review.ticket_id);
      if (!row) throw new Error(`Ticket ${review.ticket_id} not found`);
      return row;
    });

    await step.do('draft-recommendation', { retries: { limit: 3, delay: '10 seconds', backoff: 'exponential' } }, async () => {
      await draftOfficerRecommendation(this.env, { ticket, review });
    });

    const decision = await step.waitForEvent<{ decision: string; officerId: string; reasoning: string }>(
      'officer-decision',
      { type: 'officer-decision', timeout: '14 days' },
    );

    await step.do('notify-resident', async () => {
      await logAudit(this.env.DB, {
        ticket_id: ticket.id,
        actor: 'system:workflow',
        action: 'notify_decision',
        details: { reviewId, decision: decision.payload.decision },
      });
    });

    return { reviewId, decision: decision.payload };
  }
}
