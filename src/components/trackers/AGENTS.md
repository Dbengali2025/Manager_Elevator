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

### OpportunitiesTracker (`OpportunitiesTracker.tsx`)
- Client component for the "Opportunities" tab
- Full CRUD: Add via modal form, inline status change via dropdown, delete with confirmation dialog
- Filters: status (Active/Completed/Deferred/All) and priority (High/Medium/Low/All)
- Empty state shown when no opportunities exist yet
- "Add Opportunity" modal with fields: Title, Description, Priority (dropdown), Category (text), Status (dropdown)
- Delete confirmation modal using Headless UI Dialog
- Optimistic status updates — reverts on server failure
- Priority badges: High (red), Medium (warning), Low (sky blue) using `PRIORITY_CONFIG` map

### ImpactTracker (`ImpactTracker.tsx`)
- Client component for the "Impact Tracker" tab
- CRUD for winning solutions: Add via modal form, delete with confirmation dialog
- "Add Solution" modal with fields: Title, Problem Addressed, Description, Metric Type (dropdown), Before Value, After Value, Unit, Date Implemented, Notes
- Auto-calculated improvement shown in modal preview: absolute difference and percentage
- ROI formula: `((Before-After)/Before)*100` for reductions (time_saved, cost_reduced), `((After-Before)/Before)*100` for gains
- Solutions displayed as cards showing title, metric type badge, before/after values, improvement percentage
- Summary stats bar at top: Total Solutions count + aggregate improvement per metric type
- Metric type config: `METRIC_CONFIG` maps `time_saved` (sky blue), `cost_reduced` (green), `quality_improved` (teal), `other` (gray)
- Empty state shown when no solutions exist yet

## Patterns
- Import server actions from `@/actions/trackers` for tracker-specific operations
- Import shared constants from `@/actions/masterclass` (e.g., `WAR_BATTLE_SESSIONS`)
- Import types from `@/db/types` (e.g., `WarBattleSession`, `BattleSessionStatus`, `ImprovementOpportunity`, `OpportunityPriority`, `OpportunityStatus`, `WinningSolution`, `MetricType`)
- Components fetch data on mount via `useEffect` + `useCallback` pattern
- After mutations (mark complete, save link, create/delete opportunity/solution), re-fetch data to refresh UI
- Status config pattern: `Record<Status, { label, bg, text }>` for consistent badge styling
- Modal pattern: `Transition` > `Dialog` with two `TransitionChild`s (overlay + panel)
- Form state reset on modal open using `useEffect` keyed on `open` prop
- Use `Array.from(set)` instead of `[...set]` spread for Set iteration (avoids TypeScript downlevelIteration requirement)
