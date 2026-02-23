# Dashboard Components - Agent Guidelines

## JourneyProgressBar (`JourneyProgressBar.tsx`)
- Client component — renders 8-stage learning journey visualization
- Props: `{ progressRecords: UserProgress[] }` — pass records from `user_progress` table
- Stage status logic: `completed` (record with status=completed), `active` (first uncompleted stage where all prior are complete), `future` (everything else)
- Completed stages: filled sky-blue circle with white checkmark
- Active stage: sky-blue border circle with number or trophy icon, label in sky blue
- Future stages: gray border circle with number or trophy icon, label in gray
- Battle stages (battle_1-3) show trophy icon instead of number
- Connector lines: solid sky-blue between completed stages, dashed gray for future
- Horizontally scrollable on mobile (min-width 600px)
- Import: `import JourneyProgressBar from "@/components/dashboard/JourneyProgressBar"`
- Uses `STAGE_ORDER` and `UserProgress` from `@/db/types`

## StatCards (`StatCards.tsx`)
- Client component — renders 4 stat cards in a responsive grid (2x2 on mobile, 4 across on desktop)
- Props: `{ progressRecords, sessionsCompleted, activeProjects, badgesEarned }`
- Current Module derived from progress records (highest completed module + 1, capped at 4)
- Card styling: white bg, rounded-lg, shadow-sm, large number display
- Import: `import StatCards from "@/components/dashboard/StatCards"`

## FeatureNavigationCards (`FeatureNavigationCards.tsx`)
- Client component — renders 5 feature navigation cards with unlock logic
- Props: `{ onboardingCompleted: boolean, progressRecords: UserProgress[] }`
- 5 features: Onboarding, Masterclass, CI Trackers, Success Dashboard, CI Professor
- Status types: `complete` (green), `in_progress` (blue), `up_next` (orange), `locked` (gray)
- Unlock rules:
  - Onboarding: always unlocked (shown as complete or in_progress)
  - Masterclass: unlocks after onboarding complete
  - CI Trackers: unlocks after first session (any module in_progress or completed)
  - Success Dashboard: unlocks after module_1 completed
  - CI Professor: unlocks after onboarding complete
- Locked cards: disabled button, opacity-60, lock icon, not clickable
- Unlocked cards: navigate to feature page via `router.push()` on click
- Top border accent: green for complete, blue for in_progress, transparent for others
- Grid: 1 col mobile, 2 cols tablet, 3 cols medium, 5 cols desktop
- Import: `import FeatureNavigationCards from "@/components/dashboard/FeatureNavigationCards"`
