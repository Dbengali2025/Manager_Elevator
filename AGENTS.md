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

## Insforge Client (`src/lib/insforge.ts`)
- **REST API:** `insforgeClient.from("table").select(token)` / `.insert(data, token)` / `.update(data, token, query)` / `.delete(token, query)`
- **Auth:** `insforgeAuth.signup(email, pw)` / `.login(email, pw)` / `.refreshToken(rt)` / `.getUser(token)` / `.resetPassword(email)` / `.updatePassword(pw, token)` / `.verifyOtp(email, code)`
- All methods return `InsforgeResponse<T>` with `{ data, error }` pattern
- Query filtering uses PostgREST syntax (e.g. `"?id=eq.abc&status=eq.active"`)
- JWT token required for all authenticated requests — pass as `token` parameter
- Environment: `NEXT_PUBLIC_INSFORGE_URL` (public, client-safe), `INSFORGE_API_KEY` (server-only)

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

## Quality Checks
- `npm run typecheck` — TypeScript strict mode
- `npm run build` — Full Next.js production build
- `npm run lint` — ESLint

## Gotchas
- Project directory has a space ("Manager Elevator") — always quote paths in scripts
- Package name is `manager-elevator` (lowercase, hyphenated)
- Tenor Sans only has weight 400 — specify `weight: "400"` in font config
