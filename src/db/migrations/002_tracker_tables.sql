-- ============================================================================
-- Migration 002: Tracker & Chat Tables
-- Improvement opportunities, WAR battle sessions, winning solutions,
-- success nuggets, conversations, messages, and book embeddings
-- Run via Insforge admin panel or edge function
-- ============================================================================

-- Enable pgvector for book embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- Improvement Opportunities table
-- Tracks workplace waste and improvement opportunities identified by users
-- ============================================================================
CREATE TABLE IF NOT EXISTS improvement_opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  category TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'deferred')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE TRIGGER improvement_opportunities_updated_at
  BEFORE UPDATE ON improvement_opportunities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- WAR Battle Sessions table
-- Tracks the 14-week Waste WAR Battle journey with 3 battles
-- ============================================================================
CREATE TABLE IF NOT EXISTS war_battle_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  battle_number INT NOT NULL CHECK (battle_number BETWEEN 1 AND 3),
  week_number INT NOT NULL CHECK (week_number BETWEEN 1 AND 14),
  session_name TEXT NOT NULL,
  powerpoint_link TEXT,
  date_completed TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'done')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Winning Solutions table
-- Documents measurable results from CI solutions with before/after metrics
-- ============================================================================
CREATE TABLE IF NOT EXISTS winning_solutions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  problem_addressed TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  metric_type TEXT NOT NULL DEFAULT 'other' CHECK (metric_type IN (
    'time_saved', 'cost_reduced', 'quality_improved', 'other'
  )),
  before_value NUMERIC,
  after_value NUMERIC,
  unit TEXT NOT NULL DEFAULT '',
  date_implemented TIMESTAMPTZ,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Success Nuggets table
-- Achievement statements for performance reviews (manual or AI-generated)
-- ============================================================================
CREATE TABLE IF NOT EXISTS success_nuggets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_statement TEXT NOT NULL,
  supporting_metrics TEXT NOT NULL DEFAULT '',
  talking_points TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('ai_generated', 'manual')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE TRIGGER success_nuggets_updated_at
  BEFORE UPDATE ON success_nuggets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Conversations table
-- Chat conversation threads for the CI Professor
-- ============================================================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Conversation',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Messages table
-- Individual messages within conversations (user or AI)
-- ============================================================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Book Embeddings table
-- RAG storage for "Bulletproof Your Manager Career" book chunks
-- Uses pgvector for similarity search
-- ============================================================================
CREATE TABLE IF NOT EXISTS book_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chunk_text TEXT NOT NULL,
  embedding vector(1536),
  chapter TEXT NOT NULL DEFAULT '',
  section TEXT NOT NULL DEFAULT '',
  page_range TEXT NOT NULL DEFAULT ''
);

-- ============================================================================
-- Row Level Security Policies
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE improvement_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE war_battle_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE winning_solutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE success_nuggets ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_embeddings ENABLE ROW LEVEL SECURITY;

-- Improvement Opportunities: users CRUD their own
CREATE POLICY io_select_own ON improvement_opportunities
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY io_insert_own ON improvement_opportunities
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY io_update_own ON improvement_opportunities
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY io_delete_own ON improvement_opportunities
  FOR DELETE USING (auth.uid() = user_id);

-- WAR Battle Sessions: users CRUD their own
CREATE POLICY wbs_select_own ON war_battle_sessions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY wbs_insert_own ON war_battle_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY wbs_update_own ON war_battle_sessions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY wbs_delete_own ON war_battle_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Winning Solutions: users CRUD their own
CREATE POLICY ws_select_own ON winning_solutions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY ws_insert_own ON winning_solutions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY ws_update_own ON winning_solutions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY ws_delete_own ON winning_solutions
  FOR DELETE USING (auth.uid() = user_id);

-- Success Nuggets: users CRUD their own
CREATE POLICY sn_select_own ON success_nuggets
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY sn_insert_own ON success_nuggets
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY sn_update_own ON success_nuggets
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY sn_delete_own ON success_nuggets
  FOR DELETE USING (auth.uid() = user_id);

-- Conversations: users CRUD their own
CREATE POLICY conv_select_own ON conversations
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY conv_insert_own ON conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY conv_update_own ON conversations
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY conv_delete_own ON conversations
  FOR DELETE USING (auth.uid() = user_id);

-- Messages: users can CRUD messages in their own conversations
CREATE POLICY msg_select_own ON messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid())
  );
CREATE POLICY msg_insert_own ON messages
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid())
  );
CREATE POLICY msg_delete_own ON messages
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid())
  );

-- Book Embeddings: readable by all authenticated users (no user_id column)
CREATE POLICY be_select_authenticated ON book_embeddings
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Book Embeddings: inserts managed by server/admin only
CREATE POLICY be_insert_admin ON book_embeddings
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- ============================================================================
-- Admin access policies (admin can read all rows)
-- ============================================================================

CREATE POLICY io_admin_select ON improvement_opportunities
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

CREATE POLICY wbs_admin_select ON war_battle_sessions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

CREATE POLICY ws_admin_select ON winning_solutions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

CREATE POLICY sn_admin_select ON success_nuggets
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

CREATE POLICY conv_admin_select ON conversations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

CREATE POLICY msg_admin_select ON messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- ============================================================================
-- Indexes for common query patterns
-- ============================================================================

CREATE INDEX idx_io_user_id ON improvement_opportunities(user_id);
CREATE INDEX idx_io_status ON improvement_opportunities(status);
CREATE INDEX idx_io_priority ON improvement_opportunities(priority);

CREATE INDEX idx_wbs_user_id ON war_battle_sessions(user_id);
CREATE INDEX idx_wbs_battle_number ON war_battle_sessions(battle_number);
CREATE INDEX idx_wbs_status ON war_battle_sessions(status);

CREATE INDEX idx_ws_user_id ON winning_solutions(user_id);
CREATE INDEX idx_ws_metric_type ON winning_solutions(metric_type);

CREATE INDEX idx_sn_user_id ON success_nuggets(user_id);
CREATE INDEX idx_sn_source ON success_nuggets(source);

CREATE INDEX idx_conv_user_id ON conversations(user_id);

CREATE INDEX idx_msg_conversation_id ON messages(conversation_id);
CREATE INDEX idx_msg_created_at ON messages(created_at);

-- HNSW index for vector similarity search on book embeddings
CREATE INDEX idx_be_embedding ON book_embeddings
  USING hnsw (embedding vector_cosine_ops);
