# Manager Elevator - Agent Guidelines

## Project Overview
- **App:** Manager Elevator - AI-powered CI platform for Black middle managers
- **Stack:** Next.js 14 (App Router) + TypeScript + Tailwind CSS + Headless UI
- **Backend:** Insforge BaaS (PostgreSQL, JWT Auth, S3, Edge Functions, OpenRouter AI, Email)
- **Hosting:** Vercel

## Design System
- **Colors:** navy `#08376B`, skyBlue `#35C0ED`, mintGreen `#9AEBA6`, teal `#2F90B0`, offWhite `#F5F7FA`, paleGray `#E8ECF0`, charcoal `#1C2733`, success `#2E7D4F`, warning `#D4940A`, error `#C53030`
- **Fonts:** Tenor Sans (headings, `font-heading`), Montserrat (body, `font-body`)
- **Typography:** display 36px, h1 28px, h2 22px, h3 16px, body 14px, caption 12px
- **Spacing:** xs 4px, sm 8px, md 16px, lg 24px, xl 32px, 2xl 48px, 3xl 64px
- **Radius:** sm 6px, md 12px, lg 16px
- **Breakpoints:** 640px, 768px, 1024px, 1280px

## Key Patterns
- Google Fonts loaded via `next/font/google` in `src/app/layout.tsx` with CSS variables
- Tailwind configured with all design tokens in `tailwind.config.ts`
- Use `font-heading` class for headings (Tenor Sans), `font-body` for body (Montserrat)
- Body text defaults to Montserrat via the `font-body` class on `<body>`
- Headless UI (`@headlessui/react`) available for modals, dropdowns, tabs, etc.
- Path alias: `@/*` maps to `./src/*`

## Insforge Client (`src/lib/insforge.ts`) — REST, Auth, Email, AI
- **REST API:** `insforgeClient.from("table").select(token)` / `.insert(data, token)` / `.update(data, token, query)` / `.delete(token, query)`
- **Auth:** `insforgeAuth.signup(email, pw)` / `.login(email, pw)` / `.refreshToken(rt)` / `.getUser(token)` / `.resetPassword(email)` / `.updatePassword(pw, token)` / `.verifyOtp(email, code)`
- **AI:** `insforgeAI.chatCompletion({ messages, temperature?, max_tokens?, model? })` — calls Insforge OpenRouter (default: GPT-4o via `openai/gpt-4o`)
- **Embeddings:** `insforgeEmbeddings.create({ input, model? })` — generates text embeddings (default: `openai/text-embedding-3-small`, 1536 dimensions)
- **Email:** `insforgeEmail.send({ to, subject, html })` — sends transactional email via Insforge Email (AWS SES)
- All methods return `InsforgeResponse<T>` with `{ data, error }` pattern
- Query filtering uses PostgREST syntax (e.g. `"?id=eq.abc&status=eq.active"`)
- JWT token required for all authenticated requests — pass as `token` parameter
- AI endpoint: POST `/ai/v1/chat/completions` with OpenAI-compatible schema (model, messages, temperature, max_tokens)
- Environment: `NEXT_PUBLIC_INSFORGE_URL` (public, client-safe), `INSFORGE_API_KEY` (server-only), `DANA_NOTIFICATION_EMAIL` (admin notification recipient)

## Database (`src/db/`)
- **Migrations:** SQL files in `src/db/migrations/` — run via Insforge admin panel
- **Types:** `src/db/types.ts` — TypeScript interfaces for all tables
- Import core types: `import { User, UserProgress, Milestone } from "@/db/types"`
- Import tracker types: `import { ImprovementOpportunity, WarBattleSession, WinningSolution, SuccessNugget } from "@/db/types"`
- Import chat types: `import { Conversation, Message, BookEmbedding } from "@/db/types"`
- Insert types available: `ImprovementOpportunityInsert`, `WarBattleSessionInsert`, `WinningSolutionInsert`, `SuccessNuggetInsert`, `ConversationInsert`, `MessageInsert`, `BookEmbeddingInsert`
- Stage order constant: `import { STAGE_ORDER } from "@/db/types"`
- See `src/db/AGENTS.md` for detailed patterns

## App Layout (`src/components/layout/AppLayout.tsx`)
- All authenticated pages wrapped via `app/(dashboard)/layout.tsx` which renders `AppLayout`
- Sidebar: 240px wide, navy background, logo at top, 5 nav items, user avatar at bottom
- Navigation items: Dashboard, Masterclass, CI Trackers, Success Dashboard, CI Professor
- Active route detected via `usePathname()` — highlighted with `bg-white/15`
- Top header: 64px tall, white background, notification bell + settings gear on right
- Mobile (<768px): sidebar collapses to hamburger menu using Headless UI `Dialog` + `Transition`
- Content area: off-white background, `overflow-y-auto`, padded with `p-lg`
- Import: `import AppLayout from "@/components/layout/AppLayout"`

## Landing Page (`src/app/page.tsx`)
- Public page at root route `/` — no auth required
- Uses `next/image` for logo with priority loading
- Sticky header with logo, Log In, and Sign Up links
- Hero section with navy-to-teal gradient background and decorative blur circles
- Links to `/signup` for CTAs and `/login` for returning users
- Pricing section uses `id="pricing"` anchor for in-page linking from hero
- Footer shows TGE LLC copyright with dynamic year
- All sections mobile-responsive with Tailwind breakpoints (sm/lg)

## Auth Pages (`src/app/(auth)/`)
- Auth route group at `app/(auth)/` — no sidebar, centered layout
- Layout at `app/(auth)/layout.tsx` — offWhite bg, flex-center, no AppLayout wrapping
- **Signup:** `app/(auth)/signup/page.tsx` — client component with two steps: signup form → OTP verification
- **Login:** `app/(auth)/login/page.tsx` — email + password form, redirects to `/dashboard` on success
- **Reset Password:** `app/(auth)/reset-password/page.tsx` — three-step flow: enter email → enter code + new password → success confirmation
- Server actions in `src/actions/auth.ts`:
  - `signupAction()`, `verifyOtpAction()` — signup flow
  - `loginAction()` — login with email/password, sets JWT cookies
  - `requestPasswordResetAction()` — sends reset code (always returns success to prevent email enumeration)
  - `confirmPasswordResetAction()` — verifies recovery OTP + updates password
  - `logoutAction()` — deletes auth cookies
- JWT tokens stored in httpOnly cookies (`access_token`, `refresh_token`)
- Password validation: 8+ chars, 1 uppercase, 1 number — inline validation shown
- Industry dropdown options: Financial Services, Healthcare, Professional Services, Technology, Retail/E-commerce, Government/Non-profit, Other
- After successful signup+verify → redirect to `/onboarding`
- After successful login → redirect to `/dashboard`
- Form inputs use: `border-paleGray rounded-md focus:ring-skyBlue` pattern
- Buttons use: `bg-navy text-white rounded-md hover:bg-navy/90` pattern

## Auth Middleware (`src/middleware.ts`)
- Runs on all routes except static files, images, and favicon
- Public routes (no auth required): `/`, `/login`, `/signup`, `/reset-password`
- Auth-only routes: `/login`, `/signup`, `/reset-password` — redirect to `/dashboard` if already logged in
- Protected routes: all others — redirect to `/login?redirect={path}` if no auth token
- Checks `access_token` cookie for auth state
- If only `refresh_token` exists (expired access token), request passes through for server-side refresh
- Matcher excludes: `_next/static`, `_next/image`, `favicon.ico`, image file extensions

## Onboarding (`src/app/(dashboard)/onboarding/page.tsx`)
- 5-step wizard: Welcome → Assessment → Feature Tour → Miestro Link → Dashboard Preview
- Progress indicator shows "Step X of 5" with segmented bar
- "Skip onboarding" text link available on every step
- State resumes from saved `onboarding_step` in users table (user can leave and come back)
- Assessment saves CI experience level (beginner/intermediate/advanced) derived from 3 questions
- On completion: sets `onboarding_completed=true`, creates `user_progress` record for onboarding stage, redirects to `/dashboard`
- Already-completed users redirected to `/dashboard` on page load
- Server actions in `src/actions/onboarding.ts`: `getOnboardingUserInfo`, `saveOnboardingStep`, `saveAssessmentAnswers`, `completeOnboarding`
- Migration `003_add_onboarding_step.sql` adds `onboarding_step INTEGER DEFAULT 1` to users table
- Import pattern: `import { getOnboardingUserInfo, completeOnboarding } from "@/actions/onboarding"`

## Dashboard (`src/app/(dashboard)/dashboard/page.tsx`)
- Server Component — fetches data via `getDashboardData()` server action
- Shows welcome header with user's first name (extracted from `full_name`)
- `JourneyProgressBar` component renders 8-stage progress visualization
- `StatCards` renders 4 stat cards: Current Module, Sessions Done, Active Projects, Badges Earned
- `FeatureNavigationCards` renders 5 clickable feature cards with unlock logic and status tags
- Feature unlock rules based on onboarding completion and progress records
- Import: `import { getDashboardData } from "@/actions/dashboard"`
- Import: `import JourneyProgressBar from "@/components/dashboard/JourneyProgressBar"`
- Import: `import StatCards from "@/components/dashboard/StatCards"`
- Import: `import FeatureNavigationCards from "@/components/dashboard/FeatureNavigationCards"`
- `DashboardData` type includes: userName, onboardingCompleted, progressRecords, sessionsCompleted, activeProjects, milestones
- Stage order: onboarding → module_1-4 → battle_1-3 (defined in `STAGE_ORDER`)

## Masterclass (`src/app/(dashboard)/masterclass/page.tsx`)
- Client component with expandable module cards and session checklist
- Page title: "Leading Bulletproof Continuous Improvement Masterclass"
- 4 expandable module cards showing lesson titles from TGE Offerings doc
- Current module highlighted (auto-expanded) based on progress records
- Module status: Complete (green), In Progress (blue), Not Started (gray)
- "Go to Miestro" CTA button opens placeholder URL in new tab
- 14-week session checklist with checkboxes — persists to `war_battle_sessions` table
- Checking sessions updates module/battle progress in `user_progress` table
- Downloads section: placeholder "Tools coming soon"
- Server actions in `src/actions/masterclass.ts`:
  - `getMasterclassData()` — fetches user name, progress records, and session data
  - `toggleSessionCompletion(week, name, battle, done)` — toggles session done/pending, updates battle progress
- Exports: `MODULES` (4 modules with lesson arrays), `WAR_BATTLE_SESSIONS` (14 session definitions)
- Import: `import { getMasterclassData, toggleSessionCompletion, MODULES, WAR_BATTLE_SESSIONS } from "@/actions/masterclass"`

## CI Trackers (`src/app/(dashboard)/trackers/page.tsx`)
- Client component with Headless UI `TabGroup` for 4-tab navigation
- Page title: "CI Done Right Trackers" with subtitle
- 4 tabs: Waste WAR Battles, Opportunities, Impact Tracker, Success Nuggets
- Tab keys used in URL query param: `war-battles`, `opportunities`, `impact-tracker`, `success-nuggets`
- URL syncs with tab selection via `?tab=<key>` query param (e.g. `/trackers?tab=opportunities`)
- Default tab: Waste WAR Battles (index 0, when no tab param)
- Active tab shows sky blue underline indicator (3px, `after:bg-skyBlue`)
- Tabs scroll horizontally on mobile via `overflow-x-auto` container
- Each tab panel renders a dedicated component (placeholder stubs replaced by later stories)
- `useSearchParams()` requires `Suspense` boundary — page wraps content in `<Suspense>`
- Tab constants exported as `TABS` array — use for key lookups
- Import Headless UI Tab: `import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react"`
- Headless UI v2 uses `data-[selected]` attribute for styling selected tabs (not `aria-selected`)

## Tracker Components (`src/components/trackers/`)
- `WarBattleTracker` — 14-week WAR Battle session tracker table with status tags, mark complete, and link editing
- `OpportunitiesTracker` — CRUD table for improvement opportunities with modal form, filters, and delete confirmation
- `ImpactTracker` — Winning Solutions tracker with add modal, card display, summary stats bar, and auto-calculated ROI
- `SuccessNuggetsLibrary` — Success nuggets library with add/edit/delete, AI generation with review modal, card display, and source badges (Manual/AI Generated)
- Each tracker component manages its own data fetching — receives no props from the tab shell
- Server actions in `src/actions/trackers.ts`: `getWarBattleSessions`, `markSessionComplete`, `saveSessionLink`, `getOpportunities`, `createOpportunity`, `updateOpportunityStatus`, `deleteOpportunity`, `getWinningSolutions`, `createWinningSolution`, `deleteWinningSolution`, `getSuccessNuggets`, `createSuccessNugget`, `updateSuccessNugget`, `deleteSuccessNugget`, `generateSuccessNuggets`, `saveGeneratedNuggets`
- Shared constants imported from `src/actions/masterclass.ts`: `WAR_BATTLE_SESSIONS`
- Status badge pattern: `Record<StatusType, { label, bg, text }>` for consistent styling
- Modal pattern: Headless UI `Dialog` + `Transition` with `TransitionChild` for overlay + panel animations
- ROI calculation: `((Before-After)/Before)*100` for reductions (time_saved, cost_reduced), `((After-Before)/Before)*100` for gains (quality_improved, other)
- Import: `import WarBattleTracker from "@/components/trackers/WarBattleTracker"`
- Import: `import OpportunitiesTracker from "@/components/trackers/OpportunitiesTracker"`
- Import: `import ImpactTracker from "@/components/trackers/ImpactTracker"`
- Import: `import SuccessNuggetsLibrary from "@/components/trackers/SuccessNuggetsLibrary"`

## Success Dashboard (`src/app/(dashboard)/success-dashboard/page.tsx`)
- Client component that displays CI Done Right Success Dashboard with milestone cards
- Page title: "CI Done Right Success Dashboard" with subtitle
- Reuses `JourneyProgressBar` component from dashboard for journey progress visualization
- 2 milestone cards in responsive grid (1 col mobile, 2 cols desktop):
  - Card 1: "Most Valuable Workplace Waste Eliminator" — blue-to-teal gradient, star icon, requires 4 modules + battle 1
  - Card 2: "Certified CI Done Right Consultant" — teal-to-mint gradient, shield icon, requires battles 2 + 3
- Each card shows: icon, lock/unlock indicator, title, subtitle, requirement text, progress bar, progress count
- Unlocked milestones show celebration overlay with backdrop blur
- Quick Stats section with 3 `CircularProgressRing` components: Modules Completed (X/4, sky blue), Sessions Completed (X/14, teal), Battles Won (X/3, mint green)
- Modules and battles computed from `progressRecords`, sessions from `sessionsCompleted` (war_battle_sessions count)
- Rings in white card with `flex-wrap justify-center` — wrap/stack on mobile
- Milestone unlock check runs on page load via `checkAndUnlockMilestones()` — fire-and-forget, re-fetches data if newly unlocked
- Server actions in `src/actions/success-dashboard.ts`:
  - `getSuccessDashboardData()` — fetches user profile, progress records, milestones, and sessionsCompleted count
  - `checkAndUnlockMilestones()` — checks progress, creates/updates milestone records, notifies Dana
- Import: `import { getSuccessDashboardData, checkAndUnlockMilestones } from "@/actions/success-dashboard"`
- Import: `import CircularProgressRing from "@/components/dashboard/CircularProgressRing"`

## Email Notifications (`src/actions/notifications.ts`)
- Sends branded HTML emails to Dana via Insforge Email (AWS SES) for key platform events
- `notifySessionCompleted(params)` — WAR Battle session completed (includes user, company, session details, PowerPoint link)
- `notifyMilestoneUnlocked(params)` — Milestone unlocked (waste_eliminator or ci_consultant)
- `notifyNewUserRegistered(params)` — New user registration (includes name, email, company, industry, role)
- All notifications are **fire-and-forget** — call with `.catch()` so they never block user actions
- Integrated into: `markSessionComplete` (trackers.ts), `signupAction` (auth.ts)
- Milestone notifications called when milestones are unlocked (from success dashboard logic)
- Dana's email: `DANA_NOTIFICATION_EMAIL` env var (default: `danat4lssplus@gmail.com`)
- Email template: navy header with logo, white content area, off-white footer with TGE LLC branding
- Import: `import { notifySessionCompleted, notifyMilestoneUnlocked, notifyNewUserRegistered } from "@/actions/notifications"`

## Book Ingestion / RAG (`src/scripts/ingest-book.ts`)
- Script ingests "Bulletproof Your Manager Career" book (2059 lines, 15 chapters, 5 parts) into pgvector for RAG
- Run: `npx tsx --env-file=.env.local src/scripts/ingest-book.ts`
- Chunks book to ~500 tokens per chunk with 50-token overlap, respecting paragraph boundaries
- Each chunk stored with metadata: chapter name, part/section, approximate page range
- Embeddings generated via Insforge OpenRouter (`openai/text-embedding-3-small`, 1536 dimensions)
- Stored in `book_embeddings` table with `vector(1536)` column and HNSW cosine similarity index
- `insforgeEmbeddings.create({ input })` available in `src/lib/insforge.ts` for runtime embedding queries
- For RAG retrieval: embed user question → query pgvector for top-5 similar chunks → include as context in LLM prompt

## Quality Checks
- `npm run typecheck` — TypeScript strict mode
- `npm run build` — Full Next.js production build
- `npm run lint` — ESLint

## Gotchas
- Project directory has a space ("Manager Elevator") — always quote paths in scripts
- Package name is `manager-elevator` (lowercase, hyphenated)
- Tenor Sans only has weight 400 — specify `weight: "400"` in font config
