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
