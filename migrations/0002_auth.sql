-- FairPlan auth — minimal session-cookie based auth.
-- Demo users are seeded lazily on first login (see src/lib/auth.ts → seedDemoUsersIfNeeded)
-- so password hashes are computed by the same PBKDF2 routine that verifies them.

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  password_hash TEXT NOT NULL,            -- format: pbkdf2$<iterations>$<salt-hex>$<hash-hex>
  role          TEXT NOT NULL DEFAULT 'resident',  -- 'resident' | 'officer' | 'manager'
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
