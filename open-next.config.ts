import { defineCloudflareConfig } from '@opennextjs/cloudflare';

// Minimal Cloudflare preset. ISR/incremental cache is unused — FairPlan
// renders dynamically — so we skip the KV cache override that would otherwise
// require a NEXT_INC_CACHE_KV binding in wrangler.jsonc.
export default defineCloudflareConfig({});
