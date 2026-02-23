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
- `UNIQUE(user_id, stage)` on user_progress — one row per user per stage
- `UNIQUE(user_id, milestone_type)` on milestones — one row per user per milestone

## Stage Progression
- Use `STAGE_ORDER` constant from `types.ts` for ordered stage logic
- Stages: onboarding → module_1 → module_2 → module_3 → module_4 → battle_1 → battle_2 → battle_3
