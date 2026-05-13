-- FairPlan reminder ledger.
-- Reminders are scheduled at plan/notice creation, then a cron-triggered Worker
-- moves due rows to status='sent'. The City never sends a punitive reminder —
-- every row here has a kind that maps to a non-threatening, in-language template.

CREATE TABLE IF NOT EXISTS reminders (
  id            TEXT PRIMARY KEY,
  ticket_id     TEXT NOT NULL REFERENCES tickets(id),
  plan_id       TEXT REFERENCES payment_plans(id),
  user_id       TEXT REFERENCES users(id),
  kind          TEXT NOT NULL,                        -- notice_due_5d | notice_due_1d | notice_due_0d | plan_instalment_3d | plan_instalment_0d
  channel       TEXT NOT NULL DEFAULT 'email',        -- email | sms
  language      TEXT NOT NULL DEFAULT 'en',
  scheduled_at  TEXT NOT NULL,
  sent_at       TEXT,
  status        TEXT NOT NULL DEFAULT 'pending',      -- pending | sent | cancelled | failed
  payload       TEXT,                                 -- JSON for the renderer
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_reminders_ticket ON reminders(ticket_id);
CREATE INDEX IF NOT EXISTS idx_reminders_due ON reminders(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_reminders_plan ON reminders(plan_id);
