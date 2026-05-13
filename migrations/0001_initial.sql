-- FairPlan initial schema
-- D1 (SQLite). All money stored as integer cents to avoid float drift.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS tickets (
  id              TEXT PRIMARY KEY,                -- e.g. "BRP-2026-001234"
  plate           TEXT NOT NULL,
  offence_code    TEXT NOT NULL,                   -- references penalties.code
  offence_label   TEXT NOT NULL,
  amount_cents    INTEGER NOT NULL,
  issued_at       TEXT NOT NULL,                   -- ISO 8601
  due_at          TEXT NOT NULL,                   -- issued_at + 15 days
  location_text   TEXT,
  ward            INTEGER,                         -- 1..10 (Brampton)
  status          TEXT NOT NULL DEFAULT 'open',    -- open | paid | plan | disputed | defaulted
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_tickets_plate ON tickets(plate);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_ward ON tickets(ward);

CREATE TABLE IF NOT EXISTS payment_plans (
  id                TEXT PRIMARY KEY,
  ticket_id         TEXT NOT NULL REFERENCES tickets(id),
  months            INTEGER NOT NULL,              -- 3, 6, or 12
  monthly_cents     INTEGER NOT NULL,
  total_cents       INTEGER NOT NULL,
  apr_pct           REAL NOT NULL DEFAULT 0,       -- City charges 0%
  hardship_band     TEXT NOT NULL,                 -- 'severe' | 'moderate' | 'standard'
  first_payment_at  TEXT NOT NULL,
  language          TEXT NOT NULL DEFAULT 'en',    -- en | pa | hi | fr
  pdf_r2_key        TEXT,                          -- key in R2 EVIDENCE bucket
  signed_at         TEXT,
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_plans_ticket ON payment_plans(ticket_id);

CREATE TABLE IF NOT EXISTS audit_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id   TEXT,
  actor       TEXT NOT NULL,                       -- 'resident' | 'agent:payment' | 'agent:screening' | 'officer:<id>'
  action      TEXT NOT NULL,                       -- 'view' | 'explain' | 'propose_plan' | 'sign' | 'override'
  details     TEXT,                                -- JSON blob
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_ticket ON audit_log(ticket_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);

-- Seed data: real Brampton Jan 2026 penalty schedule + demo tickets across wards
INSERT OR REPLACE INTO tickets (id, plate, offence_code, offence_label, amount_cents, issued_at, due_at, location_text, ward) VALUES
  ('BRP-2026-001001', 'CBPN 471', 'PARK-FIRE-ROUTE',    'Parking in a Fire Route',          35000,  '2026-05-04T09:14:00Z', '2026-05-19T23:59:59Z', '24 Queen Street W',         1),
  ('BRP-2026-001002', 'BTFK 821', 'PARK-HYDRANT',       'Parking within 3m of a Hydrant',   30000,  '2026-05-06T17:22:00Z', '2026-05-21T23:59:59Z', '410 Kennedy Road S',        3),
  ('BRP-2026-001003', 'CGPP 119', 'PROP-MAINT',         'Ground Cover / Property Maintenance', 75000, '2026-04-28T11:00:00Z', '2026-05-13T23:59:59Z', '78 Sunny Meadow Blvd',      9),
  ('BRP-2026-001004', 'BWRX 552', 'POOL-FENCE',         'Pool Fence Enclosure',            100000,  '2026-05-01T14:30:00Z', '2026-05-16T23:59:59Z', '12 Goldfinch Drive',        6),
  ('BRP-2026-001005', 'BNJC 003', 'SNOW-CLEAR',         'Snow Clearing — repeat offender',  75000,  '2026-02-11T08:00:00Z', '2026-02-26T23:59:59Z', '143 Bovaird Drive E',       7),
  ('BRP-2026-001006', 'BVDA 909', 'RENTAL-UNLIC',       'Operating Rental Without Licence',150000,  '2026-04-30T10:45:00Z', '2026-05-15T23:59:59Z', '55 Father Tobin Road',      9),
  ('BRP-2026-001007', 'CAYJ 232', 'PARK-SIDEWALK',      'Obstructing Sidewalk',              5000,  '2026-05-09T19:05:00Z', '2026-05-24T23:59:59Z', '300 Main Street N',         1),
  ('BRP-2026-001008', 'BTUR 660', 'OCCUPANCY',          'Occupancy Standards (unsafe sleeping)',150000,'2026-04-22T16:00:00Z','2026-05-07T23:59:59Z','201 Knightsbridge Road',   5),
  ('BRP-2026-001009', 'BWZX 117', 'VITAL-SERV',         'Vital Services (heat/water)',     100000,  '2026-03-15T09:30:00Z', '2026-03-30T23:59:59Z', '6 Avondale Boulevard',      4),
  ('BRP-2026-001010', 'CPDA 042', 'PARK-FIRE-ROUTE',    'Parking in a Fire Route',          35000,  '2026-05-11T07:45:00Z', '2026-05-26T23:59:59Z', '499 Main Street S',         3);
