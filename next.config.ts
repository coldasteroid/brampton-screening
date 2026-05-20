import type { NextConfig } from 'next';
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';

const nextConfig: NextConfig = {
  // FairPlan runs on Cloudflare Workers via @opennextjs/cloudflare.
  // Bindings (D1 DB, KV CONFIG, R2 EVIDENCE, AI, BROWSER) are accessed via
  // getCloudflareContext() — see src/lib/runtime.ts.
  reactStrictMode: true,
};

// Activates Cloudflare bindings inside `next dev` so server components / route
// handlers can call env() without booting wrangler. No-op outside dev.
initOpenNextCloudflareForDev();

export default nextConfig;
