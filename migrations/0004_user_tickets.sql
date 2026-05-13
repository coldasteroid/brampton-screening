-- Link tickets to user accounts. Optional — anonymous lookup still works.
ALTER TABLE tickets ADD COLUMN user_id TEXT REFERENCES users(id);

CREATE INDEX IF NOT EXISTS idx_tickets_user ON tickets(user_id);

-- Seed: assign three demo tickets to the demo resident so "My notices" is populated.
UPDATE tickets SET user_id='usr_resident_demo'
WHERE id IN ('BRP-2026-001003', 'BRP-2026-001005', 'BRP-2026-001007');
