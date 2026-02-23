# Database Layer — Agent Guidelines

## Structure
- **Migrations:** SQL files in `migrations/` — run via Insforge admin panel or edge function
- **Types:** `types.ts` — TypeScript interfaces matching all database tables

## Migration Naming Convention
- Files named: `NNN_description.sql` (e.g., `001_core_tables.sql`, `002_tracker_tables.sql`)
- Use `IF NOT EXISTS` for all `CREATE TABLE` and `CREATE EXTENSION` statements
- Use `CREATE OR REPLACE` for functions/triggers

## TypeScript Types Pattern
- Each table has a corresponding interface (e.g., `User`, `UserProgress`, `Milestone`)
- Insert types omit server-generated fields: `type UserInsert = Omit<User, "id" | "created_at" | "updated_at">`
- Enum-like columns use TypeScript union types (e.g., `ProgressStage`, `ProgressStatus`)
- Import types: `import { User, UserProgress, Milestone } from "@/db/types"`

## Row Level Security
- All tables have RLS enabled
- Standard pattern: users can SELECT/UPDATE their own rows (`auth.uid() = id` or `auth.uid() = user_id`)
- Admin override: admin users can SELECT all rows via a separate policy checking `users.role = 'admin'`
- Insert policies are permissive during signup (service role handles creation)

## Key Relationships
- `user_progress.user_id` → `users.id` (CASCADE delete)
- `milestones.user_id` → `users.id` (CASCADE delete)
- `improvement_opportunities.user_id` → `users.id` (CASCADE delete)
- `war_battle_sessions.user_id` → `users.id` (CASCADE delete)
- `winning_solutions.user_id` → `users.id` (CASCADE delete)
- `success_nuggets.user_id` → `users.id` (CASCADE delete)
- `conversations.user_id` → `users.id` (CASCADE delete)
- `messages.conversation_id` → `conversations.id` (CASCADE delete)
- `UNIQUE(user_id, stage)` on user_progress — one row per user per stage
- `UNIQUE(user_id, milestone_type)` on milestones — one row per user per milestone

## Tracker Tables (migration 002)
- **improvement_opportunities** — CRUD with filtering by status/priority. Has `updated_at` auto-trigger.
- **war_battle_sessions** — Pre-populated 14 rows per battle. `battle_number` (1-3), `week_number` (1-14).
- **winning_solutions** — Before/after metrics with `metric_type`. `before_value`/`after_value` are NUMERIC.
- **success_nuggets** — `source` field distinguishes manual vs AI-generated. Has `updated_at` auto-trigger.

## Chat Tables (migration 002)
- **conversations** — Thread container, one per user chat session.
- **messages** — RLS checks via parent `conversations.user_id` (join-based policy).

## Book Embeddings (migration 002)
- **book_embeddings** — Uses pgvector `vector(1536)` type for OpenAI-compatible embeddings.
- HNSW index on `embedding` column for cosine similarity search.
- No `user_id` — shared read for all authenticated users, insert restricted to admin.
- Import type: `BookEmbedding` / `BookEmbeddingInsert` from `@/db/types`

## Onboarding Step (migration 003)
- `users.onboarding_step` — Integer column (default 1) tracking which wizard step the user is on
- Values 1-5 map to the 5 onboarding wizard steps
- Set to 6 when onboarding completes (past last step)

## Stage Progression
- Use `STAGE_ORDER` constant from `types.ts` for ordered stage logic
- Stages: onboarding → module_1 → module_2 → module_3 → module_4 → battle_1 → battle_2 → battle_3
