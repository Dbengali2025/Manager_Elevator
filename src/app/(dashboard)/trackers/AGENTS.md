# CI Trackers Page

## Overview
Tracker hub with 4-tab navigation for CI tracking features.

## Patterns
- Client component with Headless UI `TabGroup` for tab switching
- URL query param `?tab=<key>` syncs with selected tab via `useSearchParams()` + `router.replace()`
- Tab keys: `war-battles`, `opportunities`, `impact-tracker`, `success-nuggets`
- `useSearchParams()` requires `Suspense` boundary — the page export wraps `TrackersContent` in `<Suspense>`
- Headless UI v2 Tab styling uses `data-[selected]` CSS attribute selector (not className callbacks)
- Active tab underline: `data-[selected]:after:bg-skyBlue` with `after:h-[3px]` pseudo-element

## Adding Tab Content
When replacing placeholder components with real tracker components:
1. Import the component at the top of the file
2. Replace the corresponding `*Placeholder` function call in the `TabPanel`
3. The component receives no props from the tab shell — each tracker manages its own data fetching

## Tab → Component Mapping
- "Waste WAR Battles" → `WarBattleTracker` (US-014)
- "Opportunities" → `OpportunitiesTracker` (US-016)
- "Impact Tracker" → `ImpactTracker` (US-017)
- "Success Nuggets" → `SuccessNuggetsLibrary` (US-018)
