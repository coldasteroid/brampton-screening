import type { NextConfig } from 'next';
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';

const nextConfig: NextConfig = {
  // FairPlan runs on Cloudflare Workers via @opennextjs/cloudflare.
  // Bindings (D1 DB, KV CONFIG, R2 EVIDENCE, AI, BROWSER) are accessed via
  // getCloudflareContext() — see src/lib/runtime.ts.
  reactStrictMode: true,
};

// Activates Cloudflare bindings inside `next dev` so server components / route
// handlers can call env() without booting wrangler. Guarded so it never runs
// during `next build` (where it would otherwise try to open a remote-binding
// preview session against the Cloudflare API and break the build).
if (process.env.NODE_ENV === 'development') {
  initOpenNextCloudflareForDev();
}

export default nextConfig;
