import {
  insertReminders,
  type PlanRow,
  type ReminderKind,
  type ReminderRow,
  type TicketRow,
} from './db';

/**
 * Build the reminder schedule for a notice (used on first lookup or signup).
 * Non-punitive cadence: 5d, 1d, 0d before due. Skips anything in the past.
 */
export function buildNoticeReminders(args: {
  ticket: TicketRow;
  userId: string | null;
  language?: string;
}): Omit<ReminderRow, 'created_at' | 'sent_at' | 'status'>[] {
  const dueMs = Date.parse(args.ticket.due_at);
  const rows: Omit<ReminderRow, 'created_at' | 'sent_at' | 'status'>[] = [];
  const points: Array<[ReminderKind, number]> = [
    ['notice_due_5d', 5 * 86_400_000],
    ['notice_due_1d', 1 * 86_400_000],
    ['notice_due_0d', 0],
  ];
  for (const [kind, offsetMs] of points) {
    const at = dueMs - offsetMs;
    if (at < Date.now()) continue;
    rows.push({
      id: `rem_${kind}_${args.ticket.id}`,
      ticket_id: args.ticket.id,
      plan_id: null,
      user_id: args.userId,
      kind,
      channel: 'email',
      language: args.language ?? 'en',
      scheduled_at: new Date(at).toISOString(),
      payload: null,
    });
  }
  return rows;
}

/**
 * Build the reminder schedule for an active payment plan.
 * Each instalment gets a 3-day-out heads-up plus a day-of message.
 */
export function buildPlanReminders(args: {
  ticket: TicketRow;
  plan: PlanRow;
  userId: string | null;
}): Omit<ReminderRow, 'created_at' | 'sent_at' | 'status'>[] {
  const firstMs = Date.parse(args.plan.first_payment_at);
  const rows: Omit<ReminderRow, 'created_at' | 'sent_at' | 'status'>[] = [];
  for (let i = 0; i < args.plan.months; i++) {
    const instalmentMs = firstMs + i * 30 * 86_400_000;
    for (const [kind, offsetMs] of [['plan_instalment_3d', 3 * 86_400_000], ['plan_instalment_0d', 0]] as const) {
      const at = instalmentMs - offsetMs;
      if (at < Date.now()) continue;
      rows.push({
        id: `rem_${kind}_${args.plan.id}_${i}`,
        ticket_id: args.ticket.id,
        plan_id: args.plan.id,
        user_id: args.userId,
        kind,
        channel: 'email',
        language: args.plan.language,
        scheduled_at: new Date(at).toISOString(),
        payload: JSON.stringify({ instalmentNumber: i + 1, totalInstalments: args.plan.months }),
      });
    }
  }
  return rows;
}

export async function scheduleNoticeReminders(
  db: D1Database,
  args: { ticket: TicketRow; userId: string | null; language?: string },
): Promise<number> {
  const rows = buildNoticeReminders(args);
  await insertReminders(db, rows);
  return rows.length;
}

export async function schedulePlanReminders(
  db: D1Database,
  args: { ticket: TicketRow; plan: PlanRow; userId: string | null },
): Promise<number> {
  const rows = buildPlanReminders(args);
  await insertReminders(db, rows);
  return rows.length;
}
