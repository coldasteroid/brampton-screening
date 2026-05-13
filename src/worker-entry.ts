/**
 * Production Worker entry — re-exports FairPlan's Durable Object and Workflow
 * classes alongside Astro's auto-generated handler. Activated via
 * `workerEntryPoint` in astro.config.mjs when deploying.
 *
 * Local development uses Astro's default entry, which is sufficient because
 * the pure-function path in src/lib/agents/skills.ts requires neither the DO
 * nor the Workflow to be bound.
 *
 * To enable for deploy:
 *   1. In astro.config.mjs, set `workerEntryPoint: { path: 'src/worker-entry.ts',
 *      namedExports: ['FairPlanCase', 'ScreeningWorkflow'] }`.
 *   2. In wrangler.jsonc, uncomment the `durable_objects` and `workflows` blocks.
 *   3. Run `npm run deploy`.
 */
export { FairPlanCase } from './lib/agents/case';
export { ScreeningWorkflow } from './lib/agents/workflow';
