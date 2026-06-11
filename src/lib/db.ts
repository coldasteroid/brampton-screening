// Thin D1 helpers. Keep query strings here so they're easy to audit.

export interface TicketRow {
  id: string;
  plate: string;
  offence_code: string;
  offence_label: string;
  amount_cents: number;
  issued_at: string;
  due_at: string;
  location_text: string | null;
  ward: number | null;
  status: string;
  user_id: string | null;
  created_at: string;
}

export interface PlanRow {
  id: string;
  ticket_id: string;
  months: number;
  monthly_cents: number;
  total_cents: number;
  apr_pct: number;
  hardship_band: string;
  first_payment_at: string;
  language: string;
  pdf_r2_key: string | null;
  signed_at: string | null;
  created_at: string;
}

export async function getTicket(db: D1Database, id: string): Promise<TicketRow | null> {
  return await db
    .prepare('SELECT * FROM tickets WHERE id = ?1 LIMIT 1')
    .bind(id)
    .first<TicketRow>();
}

export async function listTickets(db: D1Database, limit = 50): Promise<TicketRow[]> {
  const res = await db.prepare('SELECT * FROM tickets ORDER BY issued_at DESC LIMIT ?1').bind(limit).all<TicketRow>();
  return res.results ?? [];
}

export async function ticketsByWard(db: D1Database): Promise<Array<{ ward: number; n: number; total_cents: number }>> {
  const res = await db
    .prepare(
      `SELECT ward, COUNT(*) AS n, SUM(amount_cents) AS total_cents
       FROM tickets
       WHERE ward IS NOT NULL
       GROUP BY ward
       ORDER BY ward ASC`,
    )
    .all<{ ward: number; n: number; total_cents: number }>();
  return res.results ?? [];
}

export async function getPlan(db: D1Database, id: string): Promise<PlanRow | null> {
  return await db.prepare('SELECT * FROM payment_plans WHERE id = ?1 LIMIT 1').bind(id).first<PlanRow>();
}

export async function insertPlan(db: D1Database, plan: PlanRow): Promise<void> {
  await db
    .prepare(
      `INSERT INTO payment_plans (id, ticket_id, months, monthly_cents, total_cents, apr_pct, hardship_band, first_payment_at, language, pdf_r2_key, signed_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)`,
    )
    .bind(
      plan.id,
      plan.ticket_id,
      plan.months,
      plan.monthly_cents,
      plan.total_cents,
      plan.apr_pct,
      plan.hardship_band,
      plan.first_payment_at,
      plan.language,
      plan.pdf_r2_key,
      plan.signed_at,
    )
    .run();
}

export async function logAudit(
  db: D1Database,
  entry: { ticket_id?: string; actor: string; action: string; details?: unknown },
): Promise<void> {
  await db
    .prepare(
      'INSERT INTO audit_log (ticket_id, actor, action, details) VALUES (?1, ?2, ?3, ?4)',
    )
    .bind(entry.ticket_id ?? null, entry.actor, entry.action, entry.details ? JSON.stringify(entry.details) : null)
    .run();
}

export interface ScreeningReviewRow {
  id: string;
  ticket_id: string;
  user_id: string | null;
  reasons: string;
  narrative: string | null;
  language: string;
  status: string;
  priority_score: number;
  ai_recommendation: string | null;
  ai_recommendation_at: string | null;
  officer_id: string | null;
  decision: string | null;
  decision_amount_cents: number | null;
  decision_reasoning: string | null;
  decided_at: string | null;
  created_at: string;
}

export interface ScreeningReviewWithTicket extends ScreeningReviewRow {
  offence_label: string;
  amount_cents: number;
  ward: number | null;
  location_text: string | null;
  offence_code: string;
  due_at: string;
}

export async function listOpenReviews(
  db: D1Database,
  limit = 50,
): Promise<ScreeningReviewWithTicket[]> {
  const res = await db
    .prepare(
      `SELECT r.*, t.offence_label, t.amount_cents, t.ward, t.location_text, t.offence_code, t.due_at
       FROM screening_reviews r
       JOIN tickets t ON t.id = r.ticket_id
       WHERE r.status IN ('submitted', 'under_review')
       ORDER BY r.priority_score DESC, r.created_at ASC
       LIMIT ?1`,
    )
    .bind(limit)
    .all<ScreeningReviewWithTicket>();
  return res.results ?? [];
}

export async function getReview(
  db: D1Database,
  id: string,
): Promise<ScreeningReviewWithTicket | null> {
  return await db
    .prepare(
      `SELECT r.*, t.offence_label, t.amount_cents, t.ward, t.location_text, t.offence_code, t.due_at
       FROM screening_reviews r
       JOIN tickets t ON t.id = r.ticket_id
       WHERE r.id = ?1 LIMIT 1`,
    )
    .bind(id)
    .first<ScreeningReviewWithTicket>();
}

export async function setReviewRecommendation(
  db: D1Database,
  reviewId: string,
  recommendationJson: string,
): Promise<void> {
  await db
    .prepare(
      `UPDATE screening_reviews
       SET ai_recommendation = ?2, ai_recommendation_at = datetime('now'), status = 'under_review'
       WHERE id = ?1`,
    )
    .bind(reviewId, recommendationJson)
    .run();
}

export interface EvidenceItemRow {
  id: string;
  review_id: string;
  r2_key: string;
  filename: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  ocr_text: string | null;
  uploaded_at: string;
}

export async function createReview(
  db: D1Database,
  args: {
    id: string;
    ticketId: string;
    userId: string | null;
    reasons: string[];
    narrative: string;
    language: string;
    priorityScore: number;
  },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO screening_reviews (id, ticket_id, user_id, reasons, narrative, language, priority_score)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`,
    )
    .bind(
      args.id,
      args.ticketId,
      args.userId,
      JSON.stringify(args.reasons),
      args.narrative,
      args.language,
      args.priorityScore,
    )
    .run();
}

export async function attachEvidence(
  db: D1Database,
  args: {
    id: string;
    reviewId: string;
    r2Key: string;
    filename: string;
    mimeType: string;
    sizeBytes: number;
  },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO evidence_items (id, review_id, r2_key, filename, mime_type, size_bytes)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6)`,
    )
    .bind(args.id, args.reviewId, args.r2Key, args.filename, args.mimeType, args.sizeBytes)
    .run();
}

export interface ManagerKpis {
  openReviews: number;
  decidedThisWeek: number;
  cancellationRate: number;
  reductionRate: number;
  hearingRate: number;
  plansActive: number;
  totalDueDollars: number;
}

export interface DecisionMixRow {
  decision: string;
  n: number;
}

export interface WardLoadRow {
  ward: number;
  openCases: number;
  totalDueDollars: number;
  decidedReviews: number;
}

export interface OffenceLoadRow {
  offence_code: string;
  offence_label: string;
  n: number;
  total_cents: number;
}

export async function managerKpis(db: D1Database): Promise<ManagerKpis> {
  const row = await db
    .prepare(
      `SELECT
        (SELECT COUNT(*) FROM screening_reviews WHERE status IN ('submitted','under_review')) AS open_reviews,
        (SELECT COUNT(*) FROM screening_reviews WHERE status='decided' AND decided_at >= datetime('now','-7 days')) AS decided_this_week,
        (SELECT COUNT(*) FROM screening_reviews WHERE decision='cancelled') AS cancelled,
        (SELECT COUNT(*) FROM screening_reviews WHERE decision='reduced') AS reduced,
        (SELECT COUNT(*) FROM screening_reviews WHERE decision='hearing_required') AS hearing,
        (SELECT COUNT(*) FROM screening_reviews WHERE status='decided') AS decided_total,
        (SELECT COUNT(*) FROM payment_plans) AS plans_active,
        (SELECT COALESCE(SUM(amount_cents),0) FROM tickets WHERE status='open') AS open_due_cents
       `,
    )
    .first<{
      open_reviews: number;
      decided_this_week: number;
      cancelled: number;
      reduced: number;
      hearing: number;
      decided_total: number;
      plans_active: number;
      open_due_cents: number;
    }>();

  const decided = row?.decided_total ?? 0;
  const rate = (n: number) => (decided ? n / decided : 0);
  return {
    openReviews: row?.open_reviews ?? 0,
    decidedThisWeek: row?.decided_this_week ?? 0,
    cancellationRate: rate(row?.cancelled ?? 0),
    reductionRate: rate(row?.reduced ?? 0),
    hearingRate: rate(row?.hearing ?? 0),
    plansActive: row?.plans_active ?? 0,
    totalDueDollars: (row?.open_due_cents ?? 0) / 100,
  };
}

export async function decisionMix(db: D1Database): Promise<DecisionMixRow[]> {
  const res = await db
    .prepare(
      `SELECT decision, COUNT(*) AS n FROM screening_reviews
       WHERE status='decided' AND decision IS NOT NULL
       GROUP BY decision`,
    )
    .all<DecisionMixRow>();
  return res.results ?? [];
}

export async function wardLoad(db: D1Database): Promise<WardLoadRow[]> {
  const res = await db
    .prepare(
      `SELECT t.ward AS ward,
              SUM(CASE WHEN t.status='open' THEN 1 ELSE 0 END) AS openCases,
              SUM(CASE WHEN t.status='open' THEN t.amount_cents ELSE 0 END) / 100.0 AS totalDueDollars,
              (SELECT COUNT(*) FROM screening_reviews r WHERE r.ticket_id IN (SELECT id FROM tickets WHERE ward=t.ward) AND r.status='decided') AS decidedReviews
       FROM tickets t
       WHERE t.ward IS NOT NULL
       GROUP BY t.ward
       ORDER BY t.ward ASC`,
    )
    .all<WardLoadRow>();
  return res.results ?? [];
}

export async function offenceLoad(db: D1Database): Promise<OffenceLoadRow[]> {
  const res = await db
    .prepare(
      `SELECT offence_code, offence_label, COUNT(*) AS n, SUM(amount_cents) AS total_cents
       FROM tickets
       GROUP BY offence_code, offence_label
       ORDER BY n DESC, total_cents DESC`,
    )
    .all<OffenceLoadRow>();
  return res.results ?? [];
}

export type ReminderKind =
  | 'notice_due_5d'
  | 'notice_due_1d'
  | 'notice_due_0d'
  | 'plan_instalment_3d'
  | 'plan_instalment_0d';

export interface ReminderRow {
  id: string;
  ticket_id: string;
  plan_id: string | null;
  user_id: string | null;
  kind: ReminderKind;
  channel: 'email' | 'sms';
  language: string;
  scheduled_at: string;
  sent_at: string | null;
  status: 'pending' | 'sent' | 'cancelled' | 'failed';
  payload: string | null;
  created_at: string;
}

export async function insertReminders(db: D1Database, rows: Omit<ReminderRow, 'created_at' | 'sent_at' | 'status'>[]): Promise<void> {
  if (rows.length === 0) return;
  const stmt = db.prepare(
    `INSERT OR IGNORE INTO reminders (id, ticket_id, plan_id, user_id, kind, channel, language, scheduled_at, payload)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`,
  );
  await db.batch(rows.map((r) => stmt.bind(
    r.id, r.ticket_id, r.plan_id, r.user_id, r.kind, r.channel, r.language, r.scheduled_at, r.payload,
  )));
}

export async function listRemindersForTicket(db: D1Database, ticketId: string): Promise<ReminderRow[]> {
  const res = await db
    .prepare('SELECT * FROM reminders WHERE ticket_id = ?1 ORDER BY scheduled_at ASC')
    .bind(ticketId)
    .all<ReminderRow>();
  return res.results ?? [];
}

export async function listRemindersForUser(db: D1Database, userId: string, limit = 20): Promise<ReminderRow[]> {
  const res = await db
    .prepare('SELECT * FROM reminders WHERE user_id = ?1 ORDER BY scheduled_at ASC LIMIT ?2')
    .bind(userId, limit)
    .all<ReminderRow>();
  return res.results ?? [];
}

export async function pendingDueReminders(db: D1Database, nowIso: string, limit = 100): Promise<ReminderRow[]> {
  const res = await db
    .prepare(
      'SELECT * FROM reminders WHERE status = \'pending\' AND scheduled_at <= ?1 ORDER BY scheduled_at ASC LIMIT ?2',
    )
    .bind(nowIso, limit)
    .all<ReminderRow>();
  return res.results ?? [];
}

export async function markReminderSent(db: D1Database, id: string, payload?: string | null): Promise<void> {
  await db
    .prepare(
      'UPDATE reminders SET status = \'sent\', sent_at = datetime(\'now\'), payload = COALESCE(?2, payload) WHERE id = ?1',
    )
    .bind(id, payload ?? null)
    .run();
}

export interface UserTicketRow extends TicketRow {
  active_plan_id: string | null;
  active_plan_months: number | null;
  active_plan_monthly_cents: number | null;
  active_review_id: string | null;
  active_review_status: string | null;
  decision: string | null;
}

export async function listTicketsForUser(db: D1Database, userId: string): Promise<UserTicketRow[]> {
  const res = await db
    .prepare(
      `SELECT t.*,
              p.id AS active_plan_id,
              p.months AS active_plan_months,
              p.monthly_cents AS active_plan_monthly_cents,
              r.id AS active_review_id,
              r.status AS active_review_status,
              r.decision AS decision
       FROM tickets t
       LEFT JOIN payment_plans p ON p.ticket_id = t.id
       LEFT JOIN screening_reviews r ON r.ticket_id = t.id
       WHERE t.user_id = ?1
       ORDER BY t.issued_at DESC`,
    )
    .bind(userId)
    .all<UserTicketRow>();
  return res.results ?? [];
}

export async function listReviewsForUser(
  db: D1Database,
  userId: string,
): Promise<ScreeningReviewWithTicket[]> {
  const res = await db
    .prepare(
      `SELECT r.*, t.offence_label, t.amount_cents, t.ward, t.location_text, t.offence_code, t.due_at
       FROM screening_reviews r
       JOIN tickets t ON t.id = r.ticket_id
       WHERE r.user_id = ?1
       ORDER BY r.created_at DESC`,
    )
    .bind(userId)
    .all<ScreeningReviewWithTicket>();
  return res.results ?? [];
}

export interface HearingRow {
  id: string;
  review_id: string;
  scheduled_at: string;
  duration_minutes: number;
  officer_id: string | null;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  decision: string | null;
  notes: string | null;
  created_at: string;
}

export async function createHearing(
  db: D1Database,
  args: { id: string; reviewId: string; scheduledAt: string; officerId?: string | null; durationMinutes?: number },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO hearings (id, review_id, scheduled_at, duration_minutes, officer_id)
       VALUES (?1, ?2, ?3, ?4, ?5)`,
    )
    .bind(args.id, args.reviewId, args.scheduledAt, args.durationMinutes ?? 30, args.officerId ?? null)
    .run();
}

export async function getHearingForReview(db: D1Database, reviewId: string): Promise<HearingRow | null> {
  return await db
    .prepare('SELECT * FROM hearings WHERE review_id = ?1 ORDER BY created_at DESC LIMIT 1')
    .bind(reviewId)
    .first<HearingRow>();
}

export async function getHearing(db: D1Database, id: string): Promise<HearingRow | null> {
  return await db.prepare('SELECT * FROM hearings WHERE id = ?1 LIMIT 1').bind(id).first<HearingRow>();
}

export async function listUpcomingHearings(db: D1Database, limit = 50): Promise<Array<HearingRow & { ticket_id: string; offence_label: string }>> {
  const res = await db
    .prepare(
      `SELECT h.*, r.ticket_id, t.offence_label
       FROM hearings h
       JOIN screening_reviews r ON r.id = h.review_id
       JOIN tickets t ON t.id = r.ticket_id
       WHERE h.status = 'scheduled' AND h.scheduled_at >= datetime('now')
       ORDER BY h.scheduled_at ASC
       LIMIT ?1`,
    )
    .bind(limit)
    .all<HearingRow & { ticket_id: string; offence_label: string }>();
  return res.results ?? [];
}

export async function listEvidence(db: D1Database, reviewId: string): Promise<EvidenceItemRow[]> {
  const res = await db
    .prepare('SELECT * FROM evidence_items WHERE review_id = ?1 ORDER BY uploaded_at DESC')
    .bind(reviewId)
    .all<EvidenceItemRow>();
  return res.results ?? [];
}

export interface RecentDecisionRow {
  review_id: string;
  ticket_id: string;
  offence_code: string;
  offence_label: string;
  amount_cents: number;
  decision: string;
  decision_amount_cents: number | null;
  decision_reasoning: string | null;
  decided_at: string;
}

/**
 * Recent decisions for precedent lookup by the officer agent. Optionally
 * narrowed to one offence code so "what have we done with fire-route disputes"
 * returns relevant precedent without dumping the full decision history.
 */
export async function listRecentDecisions(
  db: D1Database,
  opts: { offenceCode?: string; limit?: number } = {},
): Promise<RecentDecisionRow[]> {
  const limit = Math.max(1, Math.min(20, opts.limit ?? 10));
  if (opts.offenceCode) {
    const res = await db
      .prepare(
        `SELECT r.id AS review_id, r.ticket_id, t.offence_code, t.offence_label, t.amount_cents,
                r.decision, r.decision_amount_cents, r.decision_reasoning, r.decided_at
         FROM screening_reviews r
         JOIN tickets t ON t.id = r.ticket_id
         WHERE r.status = 'decided' AND t.offence_code = ?1
         ORDER BY r.decided_at DESC
         LIMIT ?2`,
      )
      .bind(opts.offenceCode, limit)
      .all<RecentDecisionRow>();
    return res.results ?? [];
  }
  const res = await db
    .prepare(
      `SELECT r.id AS review_id, r.ticket_id, t.offence_code, t.offence_label, t.amount_cents,
              r.decision, r.decision_amount_cents, r.decision_reasoning, r.decided_at
       FROM screening_reviews r
       JOIN tickets t ON t.id = r.ticket_id
       WHERE r.status = 'decided'
       ORDER BY r.decided_at DESC
       LIMIT ?1`,
    )
    .bind(limit)
    .all<RecentDecisionRow>();
  return res.results ?? [];
}

/**
 * Officers think in notice numbers (BRP-…), not screening-review ids (rev_…).
 * Returns the latest review (if any) for the given notice.
 */
export async function getReviewForTicket(
  db: D1Database,
  ticketId: string,
): Promise<ScreeningReviewWithTicket | null> {
  return await db
    .prepare(
      `SELECT r.*, t.offence_label, t.amount_cents, t.ward, t.location_text, t.offence_code, t.due_at
       FROM screening_reviews r
       JOIN tickets t ON t.id = r.ticket_id
       WHERE r.ticket_id = ?1
       ORDER BY r.created_at DESC
       LIMIT 1`,
    )
    .bind(ticketId)
    .first<ScreeningReviewWithTicket>();
}

export async function decideReview(
  db: D1Database,
  args: {
    reviewId: string;
    officerId: string;
    decision: 'cancelled' | 'reduced' | 'upheld' | 'hearing_required';
    amountCents?: number | null;
    reasoning: string;
  },
): Promise<void> {
  await db
    .prepare(
      `UPDATE screening_reviews
       SET status = 'decided', officer_id = ?2, decision = ?3, decision_amount_cents = ?4,
           decision_reasoning = ?5, decided_at = datetime('now')
       WHERE id = ?1`,
    )
    .bind(args.reviewId, args.officerId, args.decision, args.amountCents ?? null, args.reasoning)
    .run();
}
