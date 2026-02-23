// Database table types for Manager Elevator MVP
// Maps to the SQL schema defined in migrations/001_core_tables.sql

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

// ---------------------------------------------------------------------------
// Insert types (omit server-generated fields)
// ---------------------------------------------------------------------------

export type UserInsert = Omit<User, "id" | "created_at" | "updated_at">;

export type UserProgressInsert = Omit<UserProgress, "id" | "created_at">;

export type MilestoneInsert = Omit<Milestone, "id" | "created_at">;

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
