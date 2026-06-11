import { z } from 'zod';
import { chatAssistant, officerChatAssistant } from '~/lib/agents/skills';
import { requireRole } from '~/lib/auth';
import { getCurrentUser } from '~/lib/auth-server';
import { env } from '~/lib/runtime';

const attachmentSchema = z.object({
  key: z.string().startsWith('agent-scratch/').max(200),
  filename: z.string().min(1).max(120),
  mimeType: z.string().min(1).max(60),
  sizeBytes: z.number().int().nonnegative().max(8 * 1024 * 1024),
});

const messageSchema = z
  .object({
    role: z.enum(['user', 'assistant']),
    content: z.string().max(4000).default(''),
    attachments: z.array(attachmentSchema).max(3).optional(),
  })
  .refine((m) => m.content.trim().length > 0 || (m.attachments && m.attachments.length > 0), {
    message: 'message must have content or at least one attachment',
  });

const body = z.object({
  messages: z.array(messageSchema).min(1).max(30),
  lang: z.enum(['en', 'pa', 'hi', 'fr']).default('en'),
  ticketId: z.string().max(40).optional().nullable(),
  mode: z.enum(['resident', 'officer']).default('resident'),
});

export async function POST(request: Request) {
  const parsed = body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return Response.json({ error: 'bad request', issues: parsed.error.issues }, { status: 400 });

  const { messages, lang, ticketId, mode } = parsed.data;

  if (mode === 'officer') {
    const guard = requireRole(await getCurrentUser(), ['officer', 'manager']);
    if (!guard.ok) return Response.json({ error: 'forbidden' }, { status: 403 });

    const result = await officerChatAssistant(env(), {
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
        attachments: m.attachments,
      })),
      ticketId: ticketId ?? null,
    });
    return Response.json(result);
  }

  // Resident flow ignores attachments (residents don't upload via chat).
  const result = await chatAssistant(env(), {
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    language: lang,
    ticketId: ticketId ?? null,
  });
  return Response.json(result);
}
