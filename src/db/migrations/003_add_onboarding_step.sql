-- ============================================================================
-- Migration 003: Add onboarding_step column to users table
-- Tracks which onboarding wizard step the user is on (1-5) for resume support
-- ============================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 1;
