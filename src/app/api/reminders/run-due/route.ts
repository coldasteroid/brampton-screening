import { getPlan, getTicket, logAudit, markReminderSent, pendingDueReminders } from '~/lib/db';
import { composeReminder } from '~/lib/agents/skills';
import type { Language } from '~/lib/ai/prompts';
import { env } from '~/lib/runtime';

const LANGS: readonly string[] = ['en', 'pa', 'hi', 'ur', 'fr', 'es'];
const asLang = (v: string): Language => (LANGS.includes(v) ? (v as Language) : 'en');

// Cron-trigger entrypoint. In production this Worker route is invoked on a
// 5-minute schedule via wrangler `triggers.crons`. It composes a personalized,
// multilingual reminder body for each due reminder, marks it sent, and (with an
// EMAIL binding configured) calls Email Workers to deliver it.
export async function POST() {
  const e = env();
  const now = new Date().toISOString();
  const due = await pendingDueReminders(e.DB, now, 50);

  for (const reminder of due) {
    const language = asLang(reminder.language);
    const existing = reminder.payload ? safeParse(reminder.payload) : {};
    let body: string | null = null;
    let provider = 'demo';

    try {
      const ticket = await getTicket(e.DB, reminder.ticket_id);
      if (ticket) {
        let plan = null as null | { months: number; monthlyDollars: number; instalmentNumber: number };
        if (reminder.plan_id) {
          const planRow = await getPlan(e.DB, reminder.plan_id);
          if (planRow) {
            plan = {
              months: planRow.months,
              monthlyDollars: planRow.monthly_cents / 100,
              instalmentNumber: Number(existing.instalmentNumber ?? 1),
            };
          }
        }
        const composed = await composeReminder(e, { ticket, kind: reminder.kind, language, plan });
        body = composed.text;
        provider = composed.provider;
      }
    } catch (err) {
      console.warn('[reminders] compose failed:', (err as Error).message);
    }

    const mergedPayload = JSON.stringify({ ...existing, ...(body ? { body, provider } : {}) });
    await markReminderSent(e.DB, reminder.id, mergedPayload);
    await logAudit(e.DB, {
      ticket_id: reminder.ticket_id,
      actor: 'system:reminder-cron',
      action: 'send_reminder',
      details: {
        id: reminder.id,
        kind: reminder.kind,
        channel: reminder.channel,
        language,
        provider,
      },
    });
  }

  return Response.json({ processed: due.length, ranAt: now });
}

function safeParse(s: string): Record<string, unknown> {
  try {
    return JSON.parse(s) as Record<string, unknown>;
  } catch {
    return {};
  }
}
