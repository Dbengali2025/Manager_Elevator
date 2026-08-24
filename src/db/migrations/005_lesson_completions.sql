-- Migration 005: Per-lesson completion tracking
-- The "X of 25 lessons completed" counter previously counted WAR battle
-- sessions and could never reflect lesson progress. This table records each
-- lesson a user marks complete; the masterclass page counts these (plus all
-- lessons of modules whose quiz was passed) for the header counter.

CREATE TABLE IF NOT EXISTS lesson_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_number INT NOT NULL CHECK (module_number BETWEEN 1 AND 4),
  lesson_number INT NOT NULL CHECK (lesson_number BETWEEN 1 AND 7),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, module_number, lesson_number)
);

CREATE INDEX IF NOT EXISTS idx_lesson_completions_user_id
  ON lesson_completions(user_id);

-- Grants match the other user-owned tables: authenticated gets DML, anon
-- gets nothing, and RLS decides row access.
GRANT SELECT, INSERT, DELETE ON lesson_completions TO authenticated;

ALTER TABLE lesson_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lesson_completions_select ON lesson_completions;
DROP POLICY IF EXISTS lesson_completions_insert ON lesson_completions;
DROP POLICY IF EXISTS lesson_completions_delete ON lesson_completions;

CREATE POLICY lesson_completions_select ON lesson_completions
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY lesson_completions_insert ON lesson_completions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY lesson_completions_delete ON lesson_completions
  FOR DELETE USING (user_id = auth.uid());
