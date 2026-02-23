// Database table types for Manager Elevator MVP
// Maps to SQL schema in migrations/001_core_tables.sql and 002_tracker_tables.sql

// ---------------------------------------------------------------------------
// Enums / union types matching CHECK constraints
// ---------------------------------------------------------------------------

export type ProgressStage =
  | "onboarding"
  | "module_1"
  | "module_2"
  | "module_3"
  | "module_4"
  | "battle_1"
  | "battle_2"
  | "battle_3";

export type ProgressStatus = "not_started" | "in_progress" | "completed";

export type MilestoneType = "waste_eliminator" | "ci_consultant";

export type UserRole = "user" | "admin";

export type OpportunityPriority = "high" | "medium" | "low";

export type OpportunityStatus = "active" | "completed" | "deferred";

export type BattleSessionStatus = "pending" | "active" | "done";

export type MetricType = "time_saved" | "cost_reduced" | "quality_improved" | "other";

export type NuggetSource = "ai_generated" | "manual";

export type MessageRole = "user" | "assistant";

// ---------------------------------------------------------------------------
// Table row types
// ---------------------------------------------------------------------------

/** Row from the `users` table */
export interface User {
  id: string;
  email: string;
  full_name: string;
  company_name: string;
  industry: string;
  role_title: string;
  onboarding_completed: boolean;
  ci_experience_level: string | null;
  miestro_linked: boolean;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

/** Row from the `user_progress` table */
export interface UserProgress {
  id: string;
  user_id: string;
  stage: ProgressStage;
  status: ProgressStatus;
  completed_at: string | null;
  created_at: string;
}

/** Row from the `milestones` table */
export interface Milestone {
  id: string;
  user_id: string;
  milestone_type: MilestoneType;
  unlocked: boolean;
  unlocked_at: string | null;
  created_at: string;
}

/** Row from the `improvement_opportunities` table */
export interface ImprovementOpportunity {
  id: string;
  user_id: string;
  title: string;
  description: string;
  priority: OpportunityPriority;
  category: string;
  status: OpportunityStatus;
  created_at: string;
  updated_at: string;
}

/** Row from the `war_battle_sessions` table */
export interface WarBattleSession {
  id: string;
  user_id: string;
  battle_number: number;
  week_number: number;
  session_name: string;
  powerpoint_link: string | null;
  date_completed: string | null;
  status: BattleSessionStatus;
  created_at: string;
}

/** Row from the `winning_solutions` table */
export interface WinningSolution {
  id: string;
  user_id: string;
  title: string;
  problem_addressed: string;
  description: string;
  metric_type: MetricType;
  before_value: number | null;
  after_value: number | null;
  unit: string;
  date_implemented: string | null;
  notes: string;
  created_at: string;
}

/** Row from the `success_nuggets` table */
export interface SuccessNugget {
  id: string;
  user_id: string;
  achievement_statement: string;
  supporting_metrics: string;
  talking_points: string;
  source: NuggetSource;
  created_at: string;
  updated_at: string;
}

/** Row from the `conversations` table */
export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
}

/** Row from the `messages` table */
export interface Message {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  created_at: string;
}

/** Row from the `book_embeddings` table */
export interface BookEmbedding {
  id: string;
  chunk_text: string;
  embedding: number[] | null;
  chapter: string;
  section: string;
  page_range: string;
}

// ---------------------------------------------------------------------------
// Insert types (omit server-generated fields)
// ---------------------------------------------------------------------------

export type UserInsert = Omit<User, "id" | "created_at" | "updated_at">;

export type UserProgressInsert = Omit<UserProgress, "id" | "created_at">;

export type MilestoneInsert = Omit<Milestone, "id" | "created_at">;

export type ImprovementOpportunityInsert = Omit<ImprovementOpportunity, "id" | "created_at" | "updated_at">;

export type WarBattleSessionInsert = Omit<WarBattleSession, "id" | "created_at">;

export type WinningSolutionInsert = Omit<WinningSolution, "id" | "created_at">;

export type SuccessNuggetInsert = Omit<SuccessNugget, "id" | "created_at" | "updated_at">;

export type ConversationInsert = Omit<Conversation, "id" | "created_at">;

export type MessageInsert = Omit<Message, "id" | "created_at">;

export type BookEmbeddingInsert = Omit<BookEmbedding, "id">;

// ---------------------------------------------------------------------------
// Ordered stages for progress logic
// ---------------------------------------------------------------------------

export const STAGE_ORDER: ProgressStage[] = [
  "onboarding",
  "module_1",
  "module_2",
  "module_3",
  "module_4",
  "battle_1",
  "battle_2",
  "battle_3",
];
