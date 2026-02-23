# Actions Directory - Agent Guidelines

## Overview
Server actions for Manager Elevator. These run on the server only (`"use server"` directive).

## Auth Actions (`auth.ts`)
- `signupAction(input)` — Calls Insforge Auth signup, creates user profile in users table
- `verifyOtpAction(email, code)` — Verifies email OTP, sets httpOnly JWT cookies
- `loginAction(email, password)` — Authenticates user, sets httpOnly JWT cookies
- `requestPasswordResetAction(email)` — Sends recovery code via Insforge Auth (always returns success to prevent email enumeration)
- `confirmPasswordResetAction(email, code, newPassword)` — Verifies recovery OTP, updates password
- `logoutAction()` — Deletes access_token and refresh_token cookies
- All actions return `ActionResult` with `{ success, error? }`

## Patterns
- Import: `import { loginAction, logoutAction, requestPasswordResetAction, confirmPasswordResetAction } from "@/actions/auth"`
- Cookies set via `next/headers` `cookies()` — await the cookies() call (Next.js 14+)
- `access_token` cookie: httpOnly, maxAge = expires_in from auth response
- `refresh_token` cookie: httpOnly, maxAge = 30 days
- Secure flag set only in production (`process.env.NODE_ENV === "production"`)
- Password reset uses `verifyOtp(email, code, "recovery")` type — different from signup which uses `"signup"` type

## Onboarding Actions (`onboarding.ts`)
- `getOnboardingUserInfo()` — Returns user name, onboarding state, CI experience level, and current step
- `saveOnboardingStep(step)` — Saves current wizard step (1-5) for resume support
- `saveAssessmentAnswers(answers)` — Saves CI assessment, derives experience level, advances step
- `completeOnboarding()` — Sets `onboarding_completed=true`, creates `user_progress` record for onboarding stage
- Helper `getToken()` — Reads access_token from cookies for auth
- Helper `deriveExperienceLevel(answers)` — Scores answers to determine beginner/intermediate/advanced

## Dashboard Actions (`dashboard.ts`)
- `getDashboardData()` — Returns user info, progress records, session/project counts, and milestones
- Returns `{ success, error?, data?: DashboardData }` where `DashboardData` includes:
  - `userName` — full name from users table
  - `onboardingCompleted` — boolean from users table
  - `progressRecords` — all user_progress records (for journey bar + feature unlock logic)
  - `sessionsCompleted` — count of war_battle_sessions with status=done
  - `activeProjects` — count of improvement_opportunities with status=active
  - `milestones` — all milestone records (for badges earned count)
- Helper `getToken()` — same pattern as onboarding (reads access_token from cookies)
- Import: `import { getDashboardData } from "@/actions/dashboard"`

## Masterclass Actions (`masterclass.ts`)
- `getMasterclassData()` — Returns user name, progress records, and WAR battle sessions
- `toggleSessionCompletion(week, name, battle, done)` — Toggles session done/pending, auto-updates battle progress in user_progress
- Exports `MODULES` constant — 4 modules with lesson title arrays (from TGE Offerings doc)
- Exports `WAR_BATTLE_SESSIONS` constant — 14 session definitions with week, name, battle number
- `updateModuleProgress(userId, token)` — internal helper that syncs battle stage progress based on session completions
- Import: `import { getMasterclassData, toggleSessionCompletion, MODULES, WAR_BATTLE_SESSIONS } from "@/actions/masterclass"`
- Import types: `import type { MasterclassData } from "@/actions/masterclass"`

## Tracker Actions (`trackers.ts`)
- `getWarBattleSessions()` — Fetches all WAR battle session records for the current user
- `markSessionComplete(weekNumber)` — Marks a session as done with current timestamp; creates record if none exists
- `saveSessionLink(weekNumber, link)` — Saves/updates the PowerPoint link for a session; creates pending record if none exists
- `getOpportunities()` — Fetches all improvement opportunities for the current user, ordered by created_at desc
- `createOpportunity(fields)` — Creates a new improvement opportunity with title, description, priority, category, status
- `updateOpportunityStatus(id, status)` — Updates the status of an opportunity (active/completed/deferred)
- `deleteOpportunity(id)` — Deletes an opportunity by ID
- `getWinningSolutions()` — Fetches all winning solutions for the current user, ordered by created_at desc
- `createWinningSolution(fields)` — Creates a new winning solution with title, problem_addressed, description, metric_type, before/after values, unit, date_implemented, notes
- `deleteWinningSolution(id)` — Deletes a winning solution by ID
- Uses `WAR_BATTLE_SESSIONS` from `masterclass.ts` for session definitions (name, battle number)
- Import: `import { getWarBattleSessions, markSessionComplete, saveSessionLink, getOpportunities, createOpportunity, updateOpportunityStatus, deleteOpportunity, getWinningSolutions, createWinningSolution, deleteWinningSolution } from "@/actions/trackers"`

## Notification Actions (`notifications.ts`)
- `notifySessionCompleted(params)` — Emails Dana when a WAR Battle session is marked done. Params: userName, company, sessionNumber, sessionName, dateCompleted, powerpointLink
- `notifyMilestoneUnlocked(params)` — Emails Dana when a milestone is unlocked. Params: userName, company, milestoneType (`waste_eliminator` | `ci_consultant`)
- `notifyNewUserRegistered(params)` — Emails Dana when a new user registers. Params: fullName, email, company, industry, roleTitle
- All notifications are fire-and-forget — call with `.catch()` to avoid blocking user actions
- Dana's email from `DANA_NOTIFICATION_EMAIL` env var (default: danat4lssplus@gmail.com)
- HTML template uses brand colors (navy header, off-white bg) with Manager Elevator logo
- Import: `import { notifySessionCompleted, notifyMilestoneUnlocked, notifyNewUserRegistered } from "@/actions/notifications"`

## Gotchas
- `cookies()` must be awaited in Next.js 14 — `const cookieStore = await cookies()`
- Server actions can't redirect directly — return success and let client `router.push()`
- User profile insert may fail if auth ID doesn't match — logged but doesn't block signup flow
- `requestPasswordResetAction()` always returns success even on error — prevents attackers from enumerating valid emails
