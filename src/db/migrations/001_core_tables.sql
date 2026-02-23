-- ============================================================================
-- Migration 001: Core Tables
-- Users, user_progress, and milestones tables for Manager Elevator MVP
-- Run via Insforge admin panel or edge function
-- ============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Users table
-- Stores user profile information and account settings
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  company_name TEXT NOT NULL DEFAULT '',
  industry TEXT NOT NULL DEFAULT '',
  role_title TEXT NOT NULL DEFAULT '',
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  ci_experience_level TEXT,
  miestro_linked BOOLEAN NOT NULL DEFAULT FALSE,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- User progress table
-- Tracks user journey through stages (onboarding → modules → battles)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stage TEXT NOT NULL CHECK (stage IN (
    'onboarding',
    'module_1',
    'module_2',
    'module_3',
    'module_4',
    'battle_1',
    'battle_2',
    'battle_3'
  )),
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN (
    'not_started',
    'in_progress',
    'completed'
  )),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, stage)
);

-- ============================================================================
-- Milestones table
-- Tracks unlocking of "Waste Eliminator" and "CI Consultant" milestones
-- ============================================================================
CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  milestone_type TEXT NOT NULL CHECK (milestone_type IN (
    'waste_eliminator',
    'ci_consultant'
  )),
  unlocked BOOLEAN NOT NULL DEFAULT FALSE,
  unlocked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, milestone_type)
);

-- ============================================================================
-- Row Level Security Policies
-- Users can only read/write their own rows
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

-- Users table: users can read and update their own record
CREATE POLICY users_select_own ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY users_update_own ON users
  FOR UPDATE USING (auth.uid() = id);

-- Allow inserts during signup (service role handles this)
CREATE POLICY users_insert ON users
  FOR INSERT WITH CHECK (TRUE);

-- User progress: users can CRUD their own progress
CREATE POLICY user_progress_select_own ON user_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY user_progress_insert_own ON user_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_progress_update_own ON user_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY user_progress_delete_own ON user_progress
  FOR DELETE USING (auth.uid() = user_id);

-- Milestones: users can read their own, inserts/updates controlled by server
CREATE POLICY milestones_select_own ON milestones
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY milestones_insert_own ON milestones
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY milestones_update_own ON milestones
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- Admin access policies
-- Admin users (role='admin') can read all rows for the admin dashboard
-- ============================================================================

CREATE POLICY users_admin_select ON users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

CREATE POLICY user_progress_admin_select ON user_progress
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

CREATE POLICY milestones_admin_select ON milestones
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- ============================================================================
-- Indexes for common query patterns
-- ============================================================================

CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_user_progress_stage ON user_progress(stage);
CREATE INDEX idx_milestones_user_id ON milestones(user_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
