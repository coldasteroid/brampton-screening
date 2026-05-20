// Cloudflare bindings for FairPlan. @opennextjs/cloudflare reads this shape
// from the global CloudflareEnv interface — see src/lib/runtime.ts for the
// runtime accessor (env() / runtime()).

declare global {
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

  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface CloudflareEnv extends Env {}
}

export {};
