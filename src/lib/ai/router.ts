// AI router — dispatches between Cloudflare Workers AI (default), Anthropic Claude
// (via AI Gateway when ANTHROPIC_API_KEY is set), and a curated demo fallback used
// during local development when no provider is bound. One config flip changes
// provider; calling code never knows the difference.

import { sampleResponse } from './sample-responses';

export type AIMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export interface CompleteOpts {
  messages: AIMessage[];
  maxTokens?: number;
  temperature?: number;
  /** Friendly label that gets tagged into AI Gateway analytics. */
  tag?: string;
}

export interface CompletionResult {
  text: string;
  provider: 'workers-ai' | 'anthropic' | 'demo';
  model: string;
}

const WORKERS_AI_MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
const ANTHROPIC_MODEL = 'claude-opus-4-7';

export async function complete(env: Env, opts: CompleteOpts): Promise<CompletionResult> {
  const provider = env.AI_PROVIDER ?? 'workers-ai';

  try {
    if (provider === 'anthropic' && env.ANTHROPIC_API_KEY) {
      return await completeAnthropic(env, opts);
    }
    if (env.AI) {
      return await completeWorkersAI(env, opts);
    }
  } catch (err) {
    console.warn('[ai-router] provider call failed, using demo fallback:', (err as Error).message);
  }

  return demoFallback(opts);
}

async function completeWorkersAI(env: Env, opts: CompleteOpts): Promise<CompletionResult> {
  const out = (await env.AI.run(WORKERS_AI_MODEL as any, {
    messages: opts.messages,
    max_tokens: opts.maxTokens ?? 512,
    temperature: opts.temperature ?? 0.3,
  } as any)) as { response?: string };
  const text = (out.response ?? '').trim();
  if (!text) throw new Error('Workers AI returned empty response');
  return { text, provider: 'workers-ai', model: WORKERS_AI_MODEL };
}

async function completeAnthropic(env: Env, opts: CompleteOpts): Promise<CompletionResult> {
  const base = env.AI_GATEWAY_URL?.replace(/\/$/, '') ?? 'https://api.anthropic.com';
  const url = `${base}/v1/messages`;
  const system = opts.messages.find((m) => m.role === 'system')?.content;
  const userAndAsst = opts.messages.filter((m) => m.role !== 'system');

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
      ...(opts.tag ? { 'cf-aig-metadata': JSON.stringify({ tag: opts.tag }) } : {}),
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: opts.maxTokens ?? 768,
      temperature: opts.temperature ?? 0.3,
      system,
      messages: userAndAsst.map((m) => ({ role: m.role, content: m.content })),
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Anthropic call failed: ${res.status} ${txt.slice(0, 200)}`);
  }
  const json = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
  const text = (json.content ?? [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text ?? '')
    .join('')
    .trim();
  return { text, provider: 'anthropic', model: ANTHROPIC_MODEL };
}

function demoFallback(opts: CompleteOpts): CompletionResult {
  const system = opts.messages.find((m) => m.role === 'system')?.content ?? '';
  const lastUser = [...opts.messages].reverse().find((m) => m.role === 'user')?.content ?? '';
  // Include the system text so language detection works for chat/reminder, where
  // the "respond in <language>" marker lives in the system prompt, not the user turn.
  return {
    text: sampleResponse(opts.tag ?? '', `${system}\n${lastUser}`),
    provider: 'demo',
    model: 'fairplan-demo-fallback',
  };
}
