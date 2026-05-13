/// <reference path="../.astro/types.d.ts" />
/// <reference types="@astrojs/cloudflare" />

type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {
    user: import('~/lib/auth').SessionUser | null;
    lang: import('~/lib/i18n').Lang;
  }
}

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  CONFIG: KVNamespace;
  EVIDENCE: R2Bucket;
  AI: Ai;
  BROWSER: Fetcher;
  AI_PROVIDER: 'workers-ai' | 'anthropic';
  ENV: string;
  ANTHROPIC_API_KEY?: string;
  AI_GATEWAY_URL?: string;
  AUTH_SECRET?: string;
}
