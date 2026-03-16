# Ralph Agent Instructions

You are an autonomous coding agent working on a software project.

## Your Task

1. Read the PRD at `prd.json` (in the same directory as this file)
2. Read the progress log at `progress.txt` (check Codebase Patterns section first)
3. Check you're on the correct branch from PRD `branchName`. If not, check it out or create from main.
4. Pick the **highest priority** user story where `passes: false`
5. Implement that single user story
6. Run quality checks (e.g., typecheck, lint, test - use whatever your project requires)
7. **REQUIRED: Create or update AGENTS.md files** (see below - this is NOT optional)
8. If checks pass, commit ALL changes with message: `feat: [Story ID] - [Story Title]`
9. Update the PRD to set `passes: true` for the completed story
10. Append your progress to `progress.txt`

## Progress Report Format (progress.txt)

**progress.txt is a SESSION LOG** - temporary notes for continuing work on THIS feature.
It gets archived when you switch to a new feature.

APPEND to progress.txt (never replace, always append):
```
## [Date/Time] - [Story ID]
Session: [current session reference]
- What was implemented
- Files changed
- **Learnings for future iterations:**
  - Patterns discovered (e.g., "this codebase uses X for Y")
  - Gotchas encountered (e.g., "don't forget to update Z when changing W")
  - Useful context (e.g., "the evaluation panel is in component X")
---
```

The learnings section helps future iterations of THIS feature avoid repeating mistakes.

**NOTE:** If a learning is GENERAL and applies to the whole codebase (not just this feature),
put it in AGENTS.md instead! progress.txt is for feature-specific context.

## Consolidate Patterns

If you discover a **reusable pattern**, add it to the `## Codebase Patterns` section at the TOP of progress.txt:

```
## Codebase Patterns
- Example: Use `sql<number>` template for aggregations
- Example: Always use `IF NOT EXISTS` for migrations
```

Only add patterns that are **general and reusable**, not story-specific details.

## REQUIRED: Create/Update AGENTS.md Files

**AGENTS.md is PERMANENT DOCUMENTATION** - it stays with the codebase forever and helps ANY future developer/agent understand patterns and conventions. Unlike progress.txt (which is feature-specific and gets archived), AGENTS.md is the long-term knowledge base.

**This step is MANDATORY for every story.** Before committing, you MUST create or update AGENTS.md files.

### First Story Only - Create Root AGENTS.md
If `AGENTS.md` doesn't exist in the project root, create it with:
- Project overview and tech stack
- Key patterns and conventions
- Design system reference (if applicable)
- Common gotchas

### Every Story - Update Relevant AGENTS.md
1. Identify directories where you edited/created files
2. Create `AGENTS.md` in that directory if it doesn't exist
3. Add learnings that would help future developers/agents

### What to Include in AGENTS.md
**DO include:**
- Import patterns: "Import colors from `@/constants` using `import { Colors } from '@/constants'`"
- Component patterns: "Cards use `Colors.card` background with 16px border radius"
- Gotchas: "Font family names must match exactly: `Montserrat_500Medium`"
- Sync requirements: "When modifying X, also update Y"

**Do NOT include:**
- Story-specific implementation details
- Temporary notes or TODOs
- Info already in progress.txt

### Required AGENTS.md Locations
At minimum, create AGENTS.md in:
- Project root (`/AGENTS.md`) - on first story
- Any directory where you create 2+ files

## Quality Requirements

- ALL commits must pass quality checks (typecheck, lint, test)
- Do NOT commit broken code
- Keep changes focused and minimal
- Follow existing code patterns

## Stop Condition

After completing a user story, check if ALL stories have `passes: true`.

If ALL stories are complete, reply with:
<promise>COMPLETE</promise>

If there are still stories with `passes: false`, end normally (another iteration will continue).

## Important

- Work on ONE story per iteration
- Commit frequently
- Keep CI green
- Read Codebase Patterns in progress.txt before starting
