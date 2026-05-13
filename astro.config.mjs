import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

// FairPlan — Astro on Cloudflare Workers, with Workers Assets for static files.
export default defineConfig({
  site: 'https://fairplan.workers.dev',
  output: 'server',
  adapter: cloudflare({
    platformProxy: { enabled: true },
    imageService: 'compile',
  }),
  integrations: [
    react(),
    tailwind({ applyBaseStyles: false }),
  ],
  vite: {
    ssr: {
      external: ['node:buffer', 'node:crypto', 'node:stream'],
    },
  },
});
