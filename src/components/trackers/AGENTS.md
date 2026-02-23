# Tracker Components

## Overview
Components for the CI Done Right Trackers tab panels. Each component manages its own data fetching and state.

## Components

### WarBattleTracker (`WarBattleTracker.tsx`)
- Client component for the "Waste WAR Battles" tab
- Merges 14 static session definitions (`WAR_BATTLE_SESSIONS`) with DB records from `war_battle_sessions` table
- Active session = first non-done session (only one at a time)
- "Mark Complete" button on active row triggers `markSessionComplete()` server action
- PowerPoint link inline editing: click "No file yet" to enter edit mode, paste URL, save
- Status badges: Done (green), Active (blue), Pending (gray) using `STATUS_CONFIG` map
- Loading state with skeleton placeholder while fetching
- Progress summary bar at top showing X of 14 sessions completed

## Patterns
- Import server actions from `@/actions/trackers` for tracker-specific operations
- Import shared constants from `@/actions/masterclass` (e.g., `WAR_BATTLE_SESSIONS`)
- Import types from `@/db/types` (e.g., `WarBattleSession`, `BattleSessionStatus`)
- Components fetch data on mount via `useEffect` + `useCallback` pattern
- After mutations (mark complete, save link), re-fetch sessions to refresh UI
- Status config pattern: `Record<Status, { label, bg, text }>` for consistent badge styling
