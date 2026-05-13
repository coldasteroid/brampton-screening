import type { APIRoute } from 'astro';
import { logAudit, markReminderSent, pendingDueReminders } from '~/lib/db';

export const prerender = false;

/**
 * Cron-trigger entrypoint. In production this Worker route is invoked on a
 * 5-minute schedule via wrangler `triggers.crons`, marks due reminders as sent,
 * and (with EMAIL binding configured) calls Email Workers to deliver them.
 *
 * Local development: callable manually for demo purposes.
 */
export const POST: APIRoute = async ({ locals }) => {
  const env = locals.runtime.env;
  const now = new Date().toISOString();
  const due = await pendingDueReminders(env.DB, now, 50);

  for (const reminder of due) {
    await markReminderSent(env.DB, reminder.id);
    await logAudit(env.DB, {
      ticket_id: reminder.ticket_id,
      actor: 'system:reminder-cron',
      action: 'send_reminder',
      details: { id: reminder.id, kind: reminder.kind, channel: reminder.channel, language: reminder.language },
    });
  }

  return Response.json({ processed: due.length, ranAt: now });
};
