import { z } from 'zod';
import { chatAssistant } from '~/lib/agents/skills';
import { env } from '~/lib/runtime';

const body = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1).max(2000),
      }),
    )
    .min(1)
    .max(20),
  lang: z.enum(['en', 'pa', 'hi', 'fr']).default('en'),
  ticketId: z.string().max(40).optional().nullable(),
});

export async function POST(request: Request) {
  const parsed = body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return Response.json({ error: 'bad request' }, { status: 400 });

  const { messages, lang, ticketId } = parsed.data;

  const result = await chatAssistant(env(), {
    messages,
    language: lang,
    ticketId: ticketId ?? null,
  });

  return Response.json(result);
}
