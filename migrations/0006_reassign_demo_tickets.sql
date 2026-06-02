-- Re-assign demo tickets to the demo resident so "My notices" is populated.
--
-- Why this exists separately from 0004: migration 0001 seeds the tickets table
-- with `INSERT OR REPLACE`, which resets user_id to NULL on every re-run. This
-- migration sorts after 0001–0005, so a full re-apply restores ownership last.
-- Idempotent — safe to re-run.
UPDATE tickets SET user_id = 'usr_resident_demo'
WHERE id IN ('BRP-2026-001003', 'BRP-2026-001005', 'BRP-2026-001007');
