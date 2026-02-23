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
- `getDashboardData()` — Returns user name + all progress records from `user_progress` table
- Returns `{ success, error?, data?: { userName, progressRecords } }`
- Progress records used by `JourneyProgressBar` to determine stage states
- Helper `getToken()` — same pattern as onboarding (reads access_token from cookies)
- Import: `import { getDashboardData } from "@/actions/dashboard"`

## Gotchas
- `cookies()` must be awaited in Next.js 14 — `const cookieStore = await cookies()`
- Server actions can't redirect directly — return success and let client `router.push()`
- User profile insert may fail if auth ID doesn't match — logged but doesn't block signup flow
- `requestPasswordResetAction()` always returns success even on error — prevents attackers from enumerating valid emails
