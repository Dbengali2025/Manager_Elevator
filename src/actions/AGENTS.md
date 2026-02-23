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
- `getSuccessNuggets()` — Fetches all success nuggets for the current user, ordered by created_at desc
- `createSuccessNugget(fields)` — Creates a new success nugget with achievement_statement, supporting_metrics, talking_points; defaults source to 'manual'
- `updateSuccessNugget(id, fields)` — Updates a nugget's achievement_statement, supporting_metrics, and talking_points
- `deleteSuccessNugget(id)` — Deletes a success nugget by ID
- `generateSuccessNuggets()` — Collects completed tracker data (opportunities, solutions, sessions) and sends to Insforge OpenRouter (GPT-4o) to generate 3-5 achievement summaries; returns `GeneratedNugget[]` for user review before saving
- `saveGeneratedNuggets(nuggets)` — Saves an array of AI-generated nuggets with `source='ai_generated'` to the success_nuggets table
- Export type: `GeneratedNugget` — `{ achievement_statement, supporting_metrics, talking_points }`
- Uses `WAR_BATTLE_SESSIONS` from `masterclass.ts` for session definitions (name, battle number)
- Uses `insforgeAI.chatCompletion()` from `@/lib/insforge` for AI generation
- Import: `import { getWarBattleSessions, markSessionComplete, saveSessionLink, getOpportunities, createOpportunity, updateOpportunityStatus, deleteOpportunity, getWinningSolutions, createWinningSolution, deleteWinningSolution, getSuccessNuggets, createSuccessNugget, updateSuccessNugget, deleteSuccessNugget, generateSuccessNuggets, saveGeneratedNuggets } from "@/actions/trackers"`
- Import type: `import type { GeneratedNugget } from "@/actions/trackers"`

## Success Dashboard Actions (`success-dashboard.ts`)
- `getSuccessDashboardData()` — Returns user name, company, progress records, milestones, and sessionsCompleted count for the success dashboard
- `checkAndUnlockMilestones()` — Checks if milestones should be unlocked based on progress, creates/updates milestone records, and sends Dana notification
- Milestone 1 (waste_eliminator): Unlocks when all 4 modules + battle 1 are completed
- Milestone 2 (ci_consultant): Unlocks when battle 2 + battle 3 are completed
- Returns `{ success, unlocked: MilestoneType[] }` — array of newly unlocked milestone types
- Uses fire-and-forget `notifyMilestoneUnlocked()` calls for Dana email notifications
- Import: `import { getSuccessDashboardData, checkAndUnlockMilestones } from "@/actions/success-dashboard"`
- Import type: `import type { SuccessDashboardData } from "@/actions/success-dashboard"`

## Chat Actions (`chat.ts`)
- `getConversations()` — Fetches all conversations for the current user, ordered by created_at desc
- `getMessages(conversationId)` — Fetches all messages for a conversation, ordered by created_at asc
- `createConversation(title)` — Creates a new conversation; returns the created `Conversation` record
- `sendMessage(conversationId, role, content)` — Saves a message (user or assistant); returns the created `Message` record
- `updateConversationTitle(conversationId, title)` — Updates a conversation's title
- `deleteConversation(conversationId)` — Deletes a conversation (messages cascade via FK)
- Insert returns array from Insforge REST API — use `Array.isArray(data) ? data[0] : data` to extract single record
- AI responses are streamed from `/api/chat` route (not via server actions) — see `src/app/api/chat/AGENTS.md`
- `sendMessage` is called after streaming completes to persist the full AI response
- Import: `import { getConversations, getMessages, createConversation, sendMessage, updateConversationTitle, deleteConversation } from "@/actions/chat"`

## Notification Actions (`notifications.ts`)
- `notifySessionCompleted(params)` — Emails Dana when a WAR Battle session is marked done. Params: userName, company, sessionNumber, sessionName, dateCompleted, powerpointLink
- `notifyMilestoneUnlocked(params)` — Emails Dana when a milestone is unlocked. Params: userName, company, milestoneType (`waste_eliminator` | `ci_consultant`)
- `notifyNewUserRegistered(params)` — Emails Dana when a new user registers. Params: fullName, email, company, industry, roleTitle
- All notifications are fire-and-forget — call with `.catch()` to avoid blocking user actions
- Dana's email from `DANA_NOTIFICATION_EMAIL` env var (default: danat4lssplus@gmail.com)
- HTML template uses brand colors (navy header, off-white bg) with Manager Elevator logo
- Import: `import { notifySessionCompleted, notifyMilestoneUnlocked, notifyNewUserRegistered } from "@/actions/notifications"`

## Settings Actions (`settings.ts`)
- `getProfileData()` — Fetches user profile fields (name, email, company, industry, role, miestro link status, notification prefs) for the settings page
- `updateProfile(fields)` — Updates user's full_name, company_name, industry, role_title in the users table
- `changePassword(currentPassword, newPassword)` — Verifies current password by re-authenticating via login, then updates password via `insforgeAuth.updatePassword()`
- Returns `ActionResult` with `{ success, error? }`
- Returns `ProfileData` type from `getProfileData()` with all profile fields
- Import: `import { getProfileData, updateProfile, changePassword } from "@/actions/settings"`
- Import type: `import type { ProfileData } from "@/actions/settings"`

## Admin Actions (`admin.ts`)
- `getAdminDashboardData()` — Fetches all users (role=user), their progress records, milestones, and WAR battle sessions; computes overview stats
- `checkIsAdmin()` — Returns boolean indicating if the current user has admin role
- Helper `verifyAdmin(token)` — Checks user role in users table; returns `{ userId, isAdmin }`
- Helper `groupBy(items, key)` — Groups array items by a key field into Record<string, T[]>
- Helper `formatStageName(stage)` — Converts stage key to display name (e.g., "module_1" → "Module 1")
- Returns `AdminDashboardData` with `stats` (totalUsers, activeUsersLast7Days, averageOnboardingRate) and `users` (AdminUser[])
- `AdminUser` type includes: id, full_name, email, company_name, industry, role_title, current_stage, sessions_completed, last_active, milestones[], progress_records[], war_sessions[]
- Admin check uses users table `role` column (not auth metadata)
- Non-admin users are redirected to /dashboard by the page component
- Import: `import { getAdminDashboardData, checkIsAdmin } from "@/actions/admin"`
- Import types: `import type { AdminUser, AdminOverviewStats, AdminDashboardData } from "@/actions/admin"`

## Gotchas
- `cookies()` must be awaited in Next.js 14 — `const cookieStore = await cookies()`
- Server actions can't redirect directly — return success and let client `router.push()`
- User profile insert may fail if auth ID doesn't match — logged but doesn't block signup flow
- `requestPasswordResetAction()` always returns success even on error — prevents attackers from enumerating valid emails
