-- FairPlan screening review pipeline: dispute requests, evidence, officer decisions, hearings.

CREATE TABLE IF NOT EXISTS screening_reviews (
  id                      TEXT PRIMARY KEY,
  ticket_id               TEXT NOT NULL REFERENCES tickets(id),
  user_id                 TEXT REFERENCES users(id),                -- null if submitted anonymously
  reasons                 TEXT NOT NULL,                            -- JSON array of reason codes
  narrative               TEXT,                                     -- resident's free text
  language                TEXT NOT NULL DEFAULT 'en',
  status                  TEXT NOT NULL DEFAULT 'submitted',        -- submitted | under_review | decided | hearing_requested | withdrawn
  priority_score          REAL NOT NULL DEFAULT 0,                  -- 0..1, computed at intake
  ai_recommendation       TEXT,                                     -- JSON OfficerRecommendation
  ai_recommendation_at    TEXT,
  officer_id              TEXT REFERENCES users(id),
  decision                TEXT,                                     -- cancelled | reduced | upheld | hearing_required
  decision_amount_cents   INTEGER,
  decision_reasoning      TEXT,
  decided_at              TEXT,
  created_at              TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_reviews_status ON screening_reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_ticket ON screening_reviews(ticket_id);
CREATE INDEX IF NOT EXISTS idx_reviews_priority ON screening_reviews(priority_score DESC);

CREATE TABLE IF NOT EXISTS evidence_items (
  id           TEXT PRIMARY KEY,
  review_id    TEXT NOT NULL REFERENCES screening_reviews(id) ON DELETE CASCADE,
  r2_key       TEXT NOT NULL,
  filename     TEXT,
  mime_type    TEXT,
  size_bytes   INTEGER,
  ocr_text     TEXT,
  uploaded_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_evidence_review ON evidence_items(review_id);

CREATE TABLE IF NOT EXISTS hearings (
  id                TEXT PRIMARY KEY,
  review_id         TEXT NOT NULL REFERENCES screening_reviews(id) ON DELETE CASCADE,
  scheduled_at      TEXT NOT NULL,
  duration_minutes  INTEGER NOT NULL DEFAULT 30,
  officer_id        TEXT REFERENCES users(id),
  status            TEXT NOT NULL DEFAULT 'scheduled',              -- scheduled | completed | cancelled | no_show
  decision          TEXT,
  notes             TEXT,
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_hearings_review ON hearings(review_id);
CREATE INDEX IF NOT EXISTS idx_hearings_scheduled ON hearings(scheduled_at);

-- Seed: a handful of in-flight screening reviews so the officer queue is populated immediately.
INSERT OR REPLACE INTO screening_reviews (id, ticket_id, user_id, reasons, narrative, language, status, priority_score, created_at) VALUES
  ('rev_demo_001', 'BRP-2026-001003', 'usr_resident_demo',
   '["financial_hardship","factual_dispute"]',
   'I am the homeowner. The ground cover citation was issued during a 3-week period when I was hospitalized. Photos of recovery and recent landscaping work attached.',
   'en', 'submitted', 0.78, datetime('now', '-2 days')),
  ('rev_demo_002', 'BRP-2026-001006', NULL,
   '["financial_hardship"]',
   'I run a small basement-suite rental and was not aware the licensing registration had lapsed. I am willing to register immediately. Single-parent household, currently below LIM-AT.',
   'en', 'submitted', 0.92, datetime('now', '-1 days')),
  ('rev_demo_003', 'BRP-2026-001005', NULL,
   '["exceptional_circumstances"]',
   'My vehicle was towed before I could move it during the snow event. I have a receipt from the towing company showing it was not at the location during the citation window.',
   'en', 'under_review', 0.65, datetime('now', '-4 days')),
  ('rev_demo_004', 'BRP-2026-001009', NULL,
   '["factual_dispute"]',
   'I am the tenant, not the landlord. The vital-services failure was reported to the landlord and to the property standards office. I have copies of the complaints.',
   'en', 'submitted', 0.84, datetime('now', '-12 hours'));
