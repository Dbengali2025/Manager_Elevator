-- Migration 006: Notification preference columns
-- Backs the two Settings toggles (previously client-state only). Both default
-- TRUE to match the UI's prior implied behavior.

ALTER TABLE users ADD COLUMN IF NOT EXISTS notify_milestones BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS notify_weekly_digest BOOLEAN NOT NULL DEFAULT TRUE;
