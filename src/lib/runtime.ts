import { getCloudflareContext } from '@opennextjs/cloudflare';

// Single entry point for Cloudflare bindings. Mirrors the Astro pattern of
// `locals.runtime.env` — call env() from server components, route handlers,
// and server actions. opennextjs-cloudflare populates the request-scoped
// AsyncLocalStorage so the sync form is safe everywhere except middleware.
export function runtime() {
  return getCloudflareContext();
}

// Cast to FairPlan's strict Env. opennextjs-cloudflare's generated
// CloudflareEnv types every binding as optional; at runtime they are populated
// by wrangler from wrangler.jsonc, so the non-optional Env shape is accurate.
export function env(): Env {
  return getCloudflareContext().env as unknown as Env;
}
