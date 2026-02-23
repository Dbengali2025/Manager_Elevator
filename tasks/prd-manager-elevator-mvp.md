# PRD: Manager Elevator MVP

## Introduction

Manager Elevator is an AI-powered continuous improvement (CI) platform designed for Black middle managers in corporate America — particularly HBCU graduates — who need practical, step-by-step guidance to lead their teams through successful CI events without expensive consultants or complex certifications.

The platform combines a comprehensive masterclass (hosted externally on Miestro), practical tracking tools, a gamified achievement system, and an AI-powered coaching chatbot to help managers execute 14-week continuous improvement projects, document their results, and articulate their achievements for career advancement.

**Client:** Dana Thompson / Transformational Growth Enterprises LLC (TGE)
**Domain:** ManagerElevator.com
**Pricing:** $97/month or $1,000/year
**Target Delivery:** Prototype February 2026, Launch March 2026

---

## Goals

- Provide Black middle managers with a practical, step-by-step platform to execute continuous improvement events independently
- Integrate with Miestro-hosted masterclass content (4 modules, 25 lessons) via simple link-out with manual progress tracking in-app
- Enable managers to track improvement opportunities, Waste WAR Battle sessions, solution impact, and career-advancement "success nuggets" across 4 integrated trackers
- Deliver AI-powered coaching via a chatbot trained on the "Bulletproof Your Manager Career" book (120 pages, 15 chapters, 5 parts) using RAG
- Gamify the journey with a milestone/badge system that unlocks real revenue opportunities (affiliate program, consulting certification)
- Notify Dana Thompson when users hit key milestones for coaching follow-up
- Ship a mobile-responsive web app that busy managers can access on-the-go
- Convert users through the TGE ecosystem funnel: Free community → $47/mo community → $97/mo app → $10K+ mentorship

---

## User Stories

### US-001: User Registration & Account Creation
**Description:** As a new user, I want to create an account with my professional details so that I can access the Manager Elevator platform.

**Acceptance Criteria:**
- [ ] Registration form captures: full name, email, password, company name, industry (dropdown), current role/title
- [ ] Email verification flow sends confirmation code via Insforge Auth
- [ ] Password requirements enforced (minimum 8 characters, 1 uppercase, 1 number)
- [ ] Duplicate email prevention with clear error message
- [ ] After verification, user is redirected to onboarding flow
- [ ] User record created in Insforge PostgreSQL database
- [ ] npm run typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-002: User Login & Session Management
**Description:** As a returning user, I want to log in securely so that I can access my dashboard and continue my journey.

**Acceptance Criteria:**
- [ ] Email/password login form on dedicated login page
- [ ] "Forgot Password" link triggers password reset email via Insforge Auth
- [ ] Password reset flow with email code verification
- [ ] JWT session persists across browser tabs
- [ ] Session refresh token handling prevents unexpected logouts
- [ ] Redirect to main dashboard after successful login
- [ ] npm run typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-003: Onboarding Flow
**Description:** As a new user, I want a guided onboarding experience so that I understand the platform's value and know how to use each feature.

**Acceptance Criteria:**
- [ ] Step 1: Welcome message — "Welcome to the Manager Elevator, [Name]. Let's elevate your career through continuous improvement mastery."
- [ ] Step 2: Brief CI experience assessment (multiple choice questions about current CI knowledge level)
- [ ] Step 3: Guided tour highlighting 5 main features (Onboarding, Masterclass, Trackers, Success Dashboard, CI Professor)
- [ ] Step 4: Prompt to link Miestro account (provide instructions and external link to Miestro sign-up)
- [ ] Step 5: Dashboard introduction showing the learning journey ahead
- [ ] Progress indicators showing current step (1 of 5)
- [ ] "Skip" option available but discouraged via UI
- [ ] Onboarding status saved — user can resume if they leave mid-flow
- [ ] Onboarding marked "Complete" on dashboard after finishing all steps
- [ ] npm run typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-004: Main Dashboard
**Description:** As a logged-in user, I want to see my command center dashboard so that I can track my overall progress and navigate to any feature.

**Acceptance Criteria:**
- [ ] Welcome header: "Welcome back, [Name]" with subtitle "Let's elevate your career through continuous improvement mastery."
- [ ] "Your Learning Journey" progress bar showing 8 stages: Onboarding → Module 1 → Module 2 → Module 3 → Module 4 → Battle 1 → Battle 2 → Battle 3
- [ ] Completed stages show checkmark icon with solid fill; current stage is highlighted; future stages are grayed
- [ ] 4 quick stat cards: Current Module (number), Sessions Done (number), Active Projects (number), Badges Earned (number)
- [ ] 5 feature navigation cards in responsive grid:
  1. Onboarding — status tag (Complete/In Progress), "Get started with the platform basics"
  2. Masterclass — status tag, "Learn CI methodologies and tools"
  3. CI Trackers — status tag (Up Next/In Progress), "Track your improvement projects"
  4. Success Dashboard — status tag (Locked/Unlocked), "Visualize your achievements"
  5. CI Professor — status tag (Locked/Unlocked), "AI-powered guidance assistant"
- [ ] Each card is clickable and navigates to the corresponding feature page (unless locked)
- [ ] Locked cards show lock icon, gray styling, and are not clickable
- [ ] Feature unlock rules (progress-based):
  1. Onboarding — always available
  2. Masterclass — unlocks after completing onboarding
  3. CI Trackers — unlocks after starting Masterclass (at least 1 session checked)
  4. Success Dashboard — unlocks after completing at least 1 module
  5. CI Professor — unlocks after completing onboarding
- [ ] Left sidebar navigation with: Dashboard, Masterclass, CI Trackers, Success Dashboard, CI Professor
- [ ] User avatar and name displayed at bottom of sidebar
- [ ] Notification bell icon in top-right header
- [ ] Settings gear icon in top-right header
- [ ] Layout matches the provided main dashboard mockup
- [ ] Mobile responsive: sidebar collapses to hamburger menu, cards stack vertically
- [ ] npm run typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-005: Landing Page (Public)
**Description:** As a prospective user, I want to see an empowering landing page so that I understand the value of Manager Elevator and sign up.

**Acceptance Criteria:**
- [ ] Headline: "Finally Execute Continuous Improvement the Right Way — Without the Expensive Consultant."
- [ ] Subheadline emphasizing practical step-by-step guidance for HBCU grads and Black managers
- [ ] Key value propositions displayed: practical implementation, 14-week methodology, career advancement, affordable alternative to $15K+ consultants
- [ ] Pricing section showing $97/month and $1,000/year options
- [ ] Primary CTA button: "Start Your Journey" — links to sign-up page
- [ ] Manager Elevator logo displayed prominently
- [ ] Professional, empowering design using TGE brand colors (Navy, Sky Blue, Mint Green, Teal)
- [ ] Mobile-responsive layout
- [ ] Page is publicly accessible without authentication
- [ ] npm run typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-006: Masterclass Access Page
**Description:** As a user, I want a gateway page to access the Miestro-hosted masterclass so that I can view my course progress and navigate to lessons.

**Acceptance Criteria:**
- [ ] Page title: "Leading Bulletproof Continuous Improvement Masterclass"
- [ ] Overview section showing 4 modules with all 25 lesson titles:
  **Module 1: "The Value of Illuminating Workplace Problems" (7 Lessons)**
  1. "The Problem: Middle-Managers Are Undervalued"
  2. "Creating Value: Introduction to the Continuous Improvement Done Right Formula"
  3. "Waste Warrior Exercise #1 – Recognizing problems by identifying workplace waste"
  4. "Waste Warrior Exercise #2 – Prioritizing which problems to fix"
  5. "Waste Warrior Exercise #3 – Completing a SIPOC diagram for the problem"
  6. "Waste Warrior Exercise #4 – Developing the Problem Statement paragraph"
  7. "How to Maximize the Next 30 Days in Your Current Manager Assignment"
  **Module 2: "Investigating Root Causes for Success" (7 Lessons)**
  1. "Introducing the Waste WAR Battle 10 Steps for CI Success"
  2. "Waste WAR Battle Session #1: Step 1 – Clarify the Opportunity"
  3. "Waste WAR Battle Session #2: Step 2 – Define the Success Metrics"
  4. "Waste WAR Battle Session #3: Step 3 – Confirm the Current State"
  5. "Waste WAR Battle Session #4: Step 3 continued – Confirm the Current State"
  6. "Waste WAR Battle Session #5: Step 4 – Determine Pain and Root Causes"
  7. "Waste WAR Battle Session #6: Step 4 continued – Determine Pain and Root Causes"
  **Module 3: "Intelligently Testing Potential Solutions" (7 Lessons)**
  1. "Waste WAR Battle Session #7: Step 5 – Define the Ideal Future State"
  2. "Waste WAR Battle Session #8: Step 6 – Brainstorm Potential Solutions"
  3. "Waste WAR Battle Session #9: Step 6 continued – Brainstorm Potential Solutions"
  4. "Waste WAR Battle Session #10: Step 7 – Test Potential Solutions & Step 8 – Measure the Improvement"
  5. "Waste WAR Battle Session #11: Step 7 continued & Step 8 continued"
  6. "Waste WAR Battle Session #12: Step 7 continued & Step 8 continued"
  7. "Waste WAR Battle Session #13: Step 7 continued & Step 8 continued"
  **Module 4: "Implementing Winning Solutions for Success" (4 Lessons)**
  1. "Waste WAR Battle Session #14: Step 9 – Implement the Winning Solutions & Step 10 – Share and Sustain the Results"
  2. "How to Maximize the First 100 Days of a New Manager Assignment"
  3. "Solidifying Your Continuous Improvement Team Culture"
  4. "Creating Extra Income as a Bulletproof Continuous Improvement Consultant"
- [ ] Module cards showing module name, description, and number of lessons
- [ ] Current progress indicator showing which module/lesson user is on (manually tracked)
- [ ] "Go to Miestro" primary CTA button that opens Miestro platform in a new tab
- [ ] Session checklist showing all 14 weekly sessions with manual completion checkboxes
- [ ] When user checks a session complete, progress updates on dashboard
- [ ] Downloads section listing available PowerPoints and tools per lesson (hosted in Insforge Storage, served directly from app)
- [ ] npm run typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-007: Waste WAR Battle Project Tracker
**Description:** As a user, I want to track my 14-week Waste WAR Battle sessions so that I can monitor progress and share completed work with Dana.

**Acceptance Criteria:**
- [ ] Table layout with columns: Week #, Session Name, PowerPoint Link, Date Completed, Status
- [ ] 14 rows pre-populated with the following session names:
  | Week | Session Name |
  |------|-------------|
  | 1 | Step 1 – Clarify the Opportunity |
  | 2 | Step 2 – Define the Success Metrics |
  | 3 | Step 3 – Confirm the Current State |
  | 4 | Step 3 continued – Confirm the Current State |
  | 5 | Step 4 – Determine Pain and Root Causes |
  | 6 | Step 4 continued – Determine Pain and Root Causes |
  | 7 | Step 5 – Define the Ideal Future State |
  | 8 | Step 6 – Brainstorm Potential Solutions |
  | 9 | Step 6 continued – Brainstorm Potential Solutions |
  | 10 | Step 7 – Test Potential Solutions & Step 8 – Measure the Improvement |
  | 11 | Step 7 continued & Step 8 continued |
  | 12 | Step 7 continued & Step 8 continued |
  | 13 | Step 7 continued & Step 8 continued |
  | 14 | Step 9 – Implement the Winning Solutions & Step 10 – Share and Sustain |
- [ ] PowerPoint Link column allows user to paste an external URL (Google Drive, Dropbox, etc.)
- [ ] Link displays as clickable with external link icon
- [ ] "No file yet" shown in italic when no link is provided
- [ ] Date Completed auto-fills when user marks session as done
- [ ] Status tags: Done (green), Active (blue, for current week), Pending (gray, for future weeks)
- [ ] Only one session can be "Active" at a time
- [ ] "How It Works" info box at bottom explaining: upload PowerPoint files after each weekly session, Dana will be notified
- [ ] When a session is marked "Done", an email notification is sent to Dana via Insforge Email
- [ ] Notification includes: user name, session number, session name, date completed, link to PowerPoint
- [ ] npm run typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-008: Improvement Opportunities Tracker
**Description:** As a user, I want to log and prioritize workplace waste and improvement opportunities so that I can track which problems to address.

**Acceptance Criteria:**
- [ ] "Add Opportunity" button opens a form modal
- [ ] Form fields: Opportunity Title, Description, Priority (High/Medium/Low), Category/Type, Status (Active/Completed/Deferred)
- [ ] Opportunities displayed in a list/table view with sortable columns
- [ ] Filter by status (Active, Completed, Deferred, All)
- [ ] Filter by priority (High, Medium, Low, All)
- [ ] Inline editing for status changes (dropdown)
- [ ] Delete opportunity with confirmation dialog
- [ ] Empty state message when no opportunities logged: "Start logging improvement opportunities you've identified"
- [ ] npm run typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-009: Winning Solutions Impact Tracker
**Description:** As a user, I want to document measurable results from my implemented solutions so that I can demonstrate ROI and career value.

**Acceptance Criteria:**
- [ ] "Add Solution" button opens a form modal
- [ ] Form fields: Solution Title, Problem Addressed, Solution Description, Metric Type (Time Saved, Cost Reduced, Quality Improved, Other), Before Value (number), After Value (number), Unit (hours, dollars, percentage, custom), Date Implemented, Notes
- [ ] Auto-calculated improvement: displays difference and percentage change between Before and After values
- [ ] Solutions displayed in card or table format showing key metrics
- [ ] Summary stats at top: Total Solutions Implemented, Total Time Saved, Total Cost Reduced
- [ ] npm run typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-010: Mining for CI Success Nuggets (AI-Powered)
**Description:** As a user, I want AI to analyze my tracker data and extract key achievements so that I can use them in performance reviews and advancement conversations.

**Acceptance Criteria:**
- [ ] "Generate Nuggets" button triggers AI analysis of user's tracker data (opportunities completed, solutions implemented, metrics achieved)
- [ ] AI generates 3-5 achievement summaries formatted for performance reviews
- [ ] Each nugget includes: achievement statement, supporting metrics, suggested talking points
- [ ] User can edit, save, or delete generated nuggets
- [ ] Saved nuggets stored in a "Success Nuggets Library" accessible from the Trackers Hub
- [ ] User can manually add their own nuggets via "Add Nugget" form
- [ ] AI uses Insforge OpenRouter integration for text generation
- [ ] npm run typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-011: Trackers Hub Navigation
**Description:** As a user, I want a central hub with tabbed navigation so that I can easily switch between all 4 tracker views.

**Acceptance Criteria:**
- [ ] Page title: "CI Done Right Trackers" with subtitle "Track your 14-week Waste WAR Battle journey"
- [ ] 4 horizontal tabs: Waste WAR Battles, Opportunities, Impact Tracker, Success Nuggets
- [ ] Active tab shows underline indicator matching design system
- [ ] Tab content switches without page reload
- [ ] URL updates with tab identifier (e.g., /trackers?tab=opportunities) so direct linking works
- [ ] Default tab: Waste WAR Battles
- [ ] Layout matches the provided CI Trackers mockup
- [ ] Mobile responsive: tabs scroll horizontally on small screens
- [ ] npm run typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-012: CI Done Right Success Dashboard
**Description:** As a user, I want a gamified success dashboard so that I can see my achievements, milestones, and unlocked revenue opportunities.

**Acceptance Criteria:**
- [ ] Page title: "CI Done Right Success Dashboard" with subtitle "Track your achievements and unlock revenue opportunities"
- [ ] "Your Journey Progress" bar showing same 8 stages as main dashboard (Onboarding through 3rd Battle)
- [ ] Milestone Card 1: "Most Valuable Workplace Waste Eliminator"
  - Subtitle: "Unlocks affiliate revenue opportunities"
  - Requirement: "Complete 4 modules + 1st Waste WAR Battle"
  - Progress indicator: "X of 5 requirements completed"
  - Lock icon when incomplete, star icon when unlocked
  - Blue-to-teal gradient card background
- [ ] Milestone Card 2: "Certified CI Done Right Consultant"
  - Subtitle: "Unlocks consulting opportunities"
  - Requirement: "Complete 2nd and 3rd Waste WAR Battles"
  - Progress indicator: "X of 2 battles completed"
  - Lock icon when incomplete, shield icon when unlocked
  - Teal-to-mint gradient card background
- [ ] Quick Stats section with circular progress rings: Modules Completed (X of 4), Sessions Completed (X of 14), Battles Won (X of 3)
- [ ] Layout matches the provided Success Dashboard mockup
- [ ] Mobile responsive: milestone cards stack vertically
- [ ] npm run typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-013: CI Done Right Professor (AI Chatbot)
**Description:** As a user, I want to chat with an AI assistant trained on the CI methodology book so that I can get instant answers to my continuous improvement questions.

**Acceptance Criteria:**
- [ ] Clean chat interface with message bubbles (user on right, AI on left)
- [ ] Text input field at bottom with send button
- [ ] AI responses stream in real-time (token by token) using Insforge OpenRouter with streaming
- [ ] RAG pipeline: user question is embedded → similar passages retrieved from book content → passed as context to LLM
- [ ] Book content ("Bulletproof Your Manager Career", 120 pages, 15 chapters across 5 parts) ingested and stored as vector embeddings in Insforge pgvector
- [ ] Book structure for chunking: Part I (Ch 1-3: The Problem), Part II (Ch 4-5: The Solution/CI Done Right Formula), Part III (Ch 6-8: Identifying Waste), Part IV (Ch 9-12: Eliminating Waste/WAR Battles), Part V (Ch 13-15: Sustained Success)
- [ ] AI responses reference relevant book chapters/sections when applicable
- [ ] Chat history persisted per user in database — loads previous conversations on page visit
- [ ] "New Chat" button starts a fresh conversation
- [ ] Suggested starter questions displayed on empty chat: e.g., "What is the CI Done Right formula?", "How do I run a Waste WAR Battle?", "How do I document my CI wins?"
- [ ] AI personality: professorial and supportive — speaks like a knowledgeable CI professor/mentor who encourages and guides without being condescending. Reflects Dana Thompson's teaching style from the book.
- [ ] Model: GPT-4o via Insforge OpenRouter
- [ ] AI scope limited to CI methodology, career advancement for managers, and book content — deflects off-topic questions politely
- [ ] npm run typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-014: Settings & Profile Page
**Description:** As a user, I want to manage my profile and preferences so that I can keep my information current and control notifications.

**Acceptance Criteria:**
- [ ] Profile section: editable fields for name, company, industry, role/title
- [ ] Email displayed (read-only, with "Change Email" flow if needed)
- [ ] Notification preferences: toggle for email notifications on milestones, toggle for weekly progress digest
- [ ] Miestro account connection: display linked status or "Link Account" instructions
- [ ] "Change Password" flow via Insforge Auth
- [ ] Save button persists changes to database
- [ ] npm run typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-015: Email Notifications to Dana
**Description:** As the platform owner (Dana), I want to receive email notifications when users hit milestones so that I can follow up with coaching.

**Acceptance Criteria:**
- [ ] Email sent to Dana when a user completes any Waste WAR Battle session (marks as "Done")
- [ ] Email sent when a user unlocks "Most Valuable Workplace Waste Eliminator" milestone
- [ ] Email sent when a user unlocks "Certified CI Done Right Consultant" milestone
- [ ] Email includes: user's name, company, what they completed, date, and link to user's PowerPoint (if applicable)
- [ ] Emails sent via Insforge Email (AWS SES)
- [ ] Emails use a clean, branded HTML template with Manager Elevator logo
- [ ] npm run typecheck passes

### US-016: Sidebar Navigation & Layout Shell
**Description:** As a user, I want consistent navigation across all pages so that I can move between features easily.

**Acceptance Criteria:**
- [ ] Left sidebar with Manager Elevator logo at top
- [ ] Navigation items with icons: Dashboard, Masterclass, CI Trackers, Success Dashboard, CI Professor
- [ ] Active page highlighted with brand color background
- [ ] User avatar (initial circle) and name at bottom of sidebar
- [ ] Top header bar with notification bell and settings gear icons
- [ ] Sidebar collapses to hamburger menu on mobile (below 768px breakpoint)
- [ ] Sidebar width approximately 240px on desktop
- [ ] Content area fills remaining width
- [ ] npm run typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-017: Responsive Mobile Layout
**Description:** As a busy manager on-the-go, I want the app to work well on my phone so that I can access it anywhere.

**Acceptance Criteria:**
- [ ] All pages render correctly at 640px, 768px, 1024px, and 1280px breakpoints
- [ ] Sidebar collapses to hamburger menu on screens below 768px
- [ ] Dashboard feature cards stack vertically on mobile (1 column)
- [ ] Dashboard feature cards show 2-3 per row on tablet, 5 across on desktop
- [ ] Tracker tables become horizontally scrollable on small screens
- [ ] Chat interface is full-width on mobile with sticky input bar
- [ ] Touch targets are minimum 44px for mobile
- [ ] Typography remains readable (minimum 14px body text on mobile)
- [ ] npm run typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-018: Admin Dashboard for Dana
**Description:** As the platform owner (Dana), I want an admin view so that I can see all users' progress, engagement, and milestones in one place.

**Acceptance Criteria:**
- [ ] Admin login uses a designated admin flag on Dana's user account (or separate admin role in Insforge)
- [ ] Admin dashboard shows: total registered users, active users (last 7 days), onboarding completion rate
- [ ] User list table with columns: Name, Company, Industry, Current Stage, Sessions Completed, Last Active, Milestones
- [ ] Click a user row to see their detailed progress: journey stage, tracker data, sessions completed with dates
- [ ] Filter users by: current stage, milestone status, last active date range
- [ ] Export user list as CSV
- [ ] Admin route protected — only accessible to users with admin role
- [ ] Admin nav item only visible to admin users
- [ ] npm run typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-019: Database Schema & Insforge Setup
**Description:** As a developer, I need the database schema and Insforge project configured so that all features have proper data storage.

**Acceptance Criteria:**
- [ ] Insforge project configured with API key and base URL
- [ ] Users table: id, email, full_name, company_name, industry, role_title, onboarding_completed, ci_experience_level, miestro_linked, role (user/admin), created_at, updated_at
- [ ] User progress table: user_id, stage (enum: onboarding, module_1-4, battle_1-3), status (not_started, in_progress, completed), completed_at
- [ ] Tracker: improvement_opportunities table: id, user_id, title, description, priority, category, status, created_at, updated_at
- [ ] Tracker: war_battle_sessions table: id, user_id, battle_number (1-3), week_number (1-14), session_name, powerpoint_link, date_completed, status, created_at
- [ ] Tracker: winning_solutions table: id, user_id, title, problem_addressed, description, metric_type, before_value, after_value, unit, date_implemented, notes, created_at
- [ ] Tracker: success_nuggets table: id, user_id, achievement_statement, supporting_metrics, talking_points, source (ai_generated/manual), created_at, updated_at
- [ ] Chat: conversations table: id, user_id, title, created_at
- [ ] Chat: messages table: id, conversation_id, role (user/assistant), content, created_at
- [ ] Milestones table: id, user_id, milestone_type (waste_eliminator/ci_consultant), unlocked, unlocked_at
- [ ] Book embeddings table: id, chunk_text, embedding (vector), chapter, section, page_range
- [ ] Row Level Security policies: users can only read/write their own data
- [ ] npm run typecheck passes

---

## Functional Requirements

- **FR-1:** The system must allow user registration with email/password via Insforge Auth, capturing name, email, company, industry, and role.
- **FR-2:** The system must authenticate users via JWT tokens with session refresh, using Insforge Auth.
- **FR-3:** The system must provide a 5-step onboarding flow that tracks completion state and can be resumed.
- **FR-4:** The system must display a main dashboard with a learning journey progress bar (8 stages), 4 quick stat cards, and 5 feature navigation cards.
- **FR-5:** The system must provide a Masterclass page that displays 4 modules with lesson counts, a session checklist with manual completion tracking, and a "Go to Miestro" link that opens in a new tab.
- **FR-6:** When a user marks a masterclass session as complete, the system must update the user's progress across the dashboard, success dashboard, and journey progress bar.
- **FR-7:** The system must provide a Trackers Hub with 4 tabbed views: Waste WAR Battles, Opportunities, Impact Tracker, and Success Nuggets.
- **FR-8:** The Waste WAR Battle tracker must display 14 rows (one per week) with session name, PowerPoint link field, date completed, and status badge.
- **FR-9:** When a user marks a Waste WAR Battle session as "Done," the system must send an email notification to Dana via Insforge Email containing user name, session details, and PowerPoint link.
- **FR-10:** The Improvement Opportunities tracker must allow CRUD operations on opportunities with priority and status filtering.
- **FR-11:** The Winning Solutions Impact tracker must auto-calculate improvement percentage from before/after values and display summary statistics.
- **FR-12:** The Success Nuggets feature must use Insforge OpenRouter AI to analyze tracker data and generate 3-5 formatted achievement summaries suitable for performance reviews.
- **FR-13:** The CI Done Right Success Dashboard must display 2 milestone cards with progress tracking and lock/unlock states based on completion criteria.
- **FR-14:** Milestone 1 ("Most Valuable Workplace Waste Eliminator") must unlock when the user completes all 4 modules and the 1st Waste WAR Battle.
- **FR-15:** Milestone 2 ("Certified CI Done Right Consultant") must unlock when the user completes the 2nd and 3rd Waste WAR Battles.
- **FR-16:** The CI Professor chatbot must use RAG with book content embedded via pgvector in Insforge, powered by Insforge OpenRouter for LLM inference with streaming responses.
- **FR-17:** Chat history must persist per user with the ability to start new conversations.
- **FR-18:** The landing page must be publicly accessible and display pricing ($97/month, $1,000/year) with a "Start Your Journey" sign-up CTA.
- **FR-19:** The Settings page must allow users to edit profile info, manage notification preferences, and link their Miestro account.
- **FR-20:** All pages must use the left sidebar navigation layout with responsive collapse to hamburger menu below 768px.
- **FR-21:** The system must support password reset via email verification code through Insforge Auth.
- **FR-22:** The system must track user progress state changes and update all related views (dashboard stats, journey bar, success dashboard) in real-time within the session.
- **FR-23:** Features must unlock based on user progress: (1) Onboarding always available, (2) Masterclass unlocks after onboarding complete, (3) CI Trackers unlock after at least 1 masterclass session checked, (4) Success Dashboard unlocks after completing at least 1 module, (5) CI Professor unlocks after onboarding complete.
- **FR-24:** The system must provide an admin dashboard for Dana showing all registered users, their progress stages, session completion data, and milestone status with filtering and CSV export.
- **FR-25:** Admin access must be role-gated — only users with an admin flag can access the admin dashboard.
- **FR-26:** Once a user has paid (externally), they have full access to all features gated only by progress — no subscription-tier feature locking within the app.
- **FR-27:** The RAG pipeline must chunk the "Bulletproof Your Manager Career" book (120 pages, 15 chapters) into ~500-token segments, generate embeddings via Insforge OpenRouter, and store them in pgvector for semantic retrieval.

---

## Non-Goals (Out of Scope for MVP)

- **No native video hosting** — Miestro handles all course videos and media
- **No user file uploads** — users paste external links (Google Drive, Dropbox, etc.) to their own files. Course tools/templates from Dana ARE hosted in Insforge Storage.
- **No native community features** — communities live in Miestro
- **No payment/subscription processing** — handled externally via Miestro or other tools for MVP
- **No social features** — focus on individual manager journey
- **No HR system integrations** — manual documentation for MVP
- **No native mobile apps** — mobile-responsive web only
- **No deep Miestro API sync** — MVP uses simple link-out; API progress sync deferred pending Miestro API investigation
- **No advanced analytics/reporting** — simple progress tracking and stats only
- **No team collaboration** — single user per account
- **No affiliate program management** — milestone unlocks display messaging only; actual affiliate tracking is external
- **No consulting certification management** — milestone display only; listing on TGrowthE.com is manual
- **No multi-language support**
- **No dark mode**

---

## Design Considerations

### Design System
The complete design system has been provided (12-page PDF) and must be followed precisely:

**Color Palette:**
| Token | Hex | Usage |
|-------|-----|-------|
| Navy Primary | #08376B | Headers, primary CTAs, sidebar background, main text |
| Sky Blue | #35C0ED | Interactive elements, links, highlights, secondary buttons |
| Mint Green | #9AEBA6 | Success states, completed items, positive metrics |
| Teal | #2F90B0 | Secondary actions, subheadings, tertiary buttons |
| White | #FFFFFF | Page backgrounds |
| Off White | #F5F7FA | Content area background |
| Pale Gray | #E8ECF0 | Dividers, disabled states |
| Charcoal | #1C2733 | Dark text alternatives |
| Success | #2E7D4F | Success status badges, positive indicators |
| Warning | #D4940A | Warning states, pending badges |
| Error | #C53030 | Error states, validation errors |
| Gradient | Sky → Mint | Milestone card backgrounds, special elements |

**Typography:**
- Display font: Tenor Sans (headings, page titles, feature names) — 36px display, 28px H1, 22px H2
- Body font: Montserrat (body copy, labels, buttons, UI elements) — 16px H3, 14px body, 12px caption

**Component Library:**
- 5 button variants: Navy primary (filled), Sky Blue secondary (filled), Teal tertiary (filled), outlined (white bg + navy border), dark (charcoal)
- Input fields: Label above, 1px border, rounded corners (md/12px), red border + label for error state
- Status tags: Completed (green fill), In Progress (blue outline), Pending (orange outline), Locked (gray fill)
- Toggles: Sky Blue when active, gray when inactive
- Feature step cards: numbered badge (top-left), title, description, action link — bordered card with hover state
- Progress bars: solid fill bars with percentage label
- Milestone badges: gradient background card with icon, title, description, progress sub-bar

**Layout:**
- Card-based dashboard with left sidebar navigation
- 12-column grid, 8px base unit, 24px gutters
- Breakpoints: 640px (mobile), 768px (tablet), 1024px (laptop), 1280px (desktop)
- Border radius: sm/6px (buttons, tags), md/12px (cards, inputs), lg/16px (milestone cards), full (avatars)
- 3 elevation levels for cards and modals
- Spacing scale: xs 4px, sm 8px, md 16px, lg 24px, xl 32px, 2xl 48px, 3xl 64px

### Screen Mockups (Provided)
Three screen mockups serve as the implementation reference:
1. **Main Dashboard** (`public/main-dashboard-mockup.png`) — sidebar, journey bar, stat cards, 5 feature cards
2. **CI Done Right Success Dashboard** (`public/CI-done-right-success-dashboard-mockup.png`) — journey bar, 2 milestone cards, quick stats rings
3. **CI Done Right Trackers** (`public/CI-done-right-trackers-mockup.png`) — tabbed interface, Waste WAR Battles table

### Logo
Manager Elevator logo provided at `public/manager-elevator_logo.png` — "Rise with Continuous Improvement" tagline.

---

## Technical Considerations

### Tech Stack
| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | Next.js 14 + TypeScript | App Router, React Server Components where appropriate |
| Styling | Tailwind CSS | Custom theme config matching design system tokens |
| UI Components | Headless UI | Accessible, unstyled components for dropdowns, modals, tabs |
| Backend/BaaS | Insforge | PostgreSQL with auto REST APIs, Edge Functions (Deno) |
| Authentication | Insforge Auth | JWT-based, email/password, email verification, password reset |
| Database | Insforge PostgreSQL | Row Level Security, pgvector extension for embeddings |
| File Storage | Insforge Storage (S3) | Course tools/templates hosted per lesson (25-75 files from Dana), logo/assets. User files remain external links. |
| AI/LLM | Insforge OpenRouter | Chat completions with streaming for CI Professor chatbot |
| Vector Search | Insforge pgvector | Book content embeddings for RAG retrieval |
| Email | Insforge Email (AWS SES) | Transactional notifications to Dana, password reset emails |
| Hosting | Vercel | Zero-config deployment via Insforge |
| External | Miestro | Course hosting — link-out integration only for MVP |

### Insforge Configuration
- API Key: provided by client (environment variable)
- Base URL: `https://97k43jb9.us-west.insforge.app`
- MCP server available for development: `@insforge/mcp@latest`

### Key Architecture Decisions
1. **Miestro = link-out only:** No API integration for MVP. Users click through to Miestro for course content, then manually track session completion in Manager Elevator. Future: investigate Miestro API for progress sync.
2. **AI via Insforge OpenRouter:** Use Insforge's built-in AI integration (OpenRouter) rather than direct OpenAI API. Simplifies billing and infrastructure.
3. **RAG with pgvector:** Book content chunked, embedded, and stored in Insforge's PostgreSQL with pgvector. On each chat query, retrieve top-K similar chunks and include as context for the LLM.
4. **User files = external links, course tools = hosted:** Users paste URLs to their own Google Drive / Dropbox files for completed PowerPoints. Dana's course templates and tools (25-75 static files) are uploaded to Insforge Storage and served directly from the app's Masterclass page.
5. **Email via Insforge SES:** All transactional emails (verification, password reset, Dana notifications) through Insforge's built-in email service.
6. **Progress is app-side only:** Since Miestro is link-out, all progress tracking is managed within Manager Elevator's database. Users manually update their progress.

### Performance Requirements
- Landing page loads in under 2 seconds (LCP)
- Dashboard loads in under 3 seconds after authentication
- AI chatbot first token appears within 2 seconds of sending a message
- All pages must score 90+ on Lighthouse mobile performance

### Security Requirements
- Row Level Security on all user data tables — users can only access their own records
- JWT tokens stored in httpOnly cookies (not localStorage)
- HTTPS enforced on all routes
- API keys stored as environment variables, never in client code
- Input sanitization on all form fields
- No AI rate limiting for MVP — monitor costs and add limits post-launch if needed
- Admin routes protected by role check — only users with role=admin can access /admin paths

---

## Success Metrics

- **Onboarding completion rate:** >80% of registered users complete all 5 onboarding steps
- **Masterclass access rate:** >70% of users click through to Miestro within their first week
- **Tracker adoption:** >60% of users log at least one improvement opportunity within 30 days
- **Session completion:** Average of 5+ Waste WAR Battle sessions completed per active user
- **AI chatbot usage:** >50% of active users interact with CI Professor at least once per week
- **Milestone achievement:** >30% of users reach "Most Valuable Workplace Waste Eliminator" within 6 months
- **Dana notification utility:** Dana receives and acts on >90% of session completion notifications
- **Mobile usage:** >40% of sessions from mobile devices
- **Page load performance:** All core pages load within 3 seconds on 4G mobile connections

---

## Information Required From Client

The following items must be provided before the corresponding features can be fully implemented. Development can begin on the platform foundation, authentication, dashboard, and layout while these items are gathered.

### Priority 1 — Needed Before AI Features (CI Professor)
| # | Item | Status | Details | Blocks |
|---|------|--------|---------|--------|
| 1 | **Book content** | PROVIDED | "Bulletproof Your Manager Career" (120 pages, 15 chapters, 5 parts) — markdown file in project directory | US-013 |
| 2 | **AI personality guidelines** | CONFIRMED | Professorial and supportive — like a knowledgeable CI professor/mentor who encourages and guides. System prompt to reflect Dana's teaching style from the book. | US-013 |
| 3 | **OpenRouter model preference** | CONFIRMED | GPT-4o via Insforge OpenRouter | US-013, US-010 |

### Priority 2 — Needed Before Tracker Implementation
| # | Item | Status | Details | Blocks |
|---|------|--------|---------|--------|
| 4 | **14 session names** | PROVIDED | Extracted from TGE Offerings document — see US-007 acceptance criteria | US-007 |
| 5 | **All 25 lesson titles** | PROVIDED | Extracted from TGE Offerings document — see US-006 acceptance criteria | US-006 |
| 6 | **Tracker field requirements** | PROPOSED | Field lists proposed in US-007, US-008, US-009, US-010 — client to confirm or adjust | All trackers |
| 7 | **ROI calculation formula** | CONFIRMED | Standard calculation: Improvement = (Before - After) for reductions, (After - Before) for gains. Percentage = ((difference) / Before) * 100. Auto-calculated from user's before/after values. | US-009 |
| 8 | **Downloadable tools list** | NEEDS INPUT FROM DANA | Dana to provide PowerPoint templates, Excel tools, and Word docs organized by lesson (1-3 files per lesson, ~25-75 files total). Files will be uploaded to Insforge Storage and served directly from the app. | US-006 |

### Priority 3 — Needed Before Notifications & Milestones
| # | Item | Status | Details | Blocks |
|---|------|--------|---------|--------|
| 9 | **Dana's notification email** | PROVIDED | danat4lssplus@gmail.com (may change before launch) | US-015 |
| 10 | **Notification trigger list** | CONFIRMED | Session marked done → email to Dana. Milestone unlocked → email to Dana. New user registration → email to Dana. | US-015 |
| 11 | **Badge artwork** | WILL GENERATE | AI-generated custom badges using Nano Banana (Gemini image generation). Two badges: (1) "Most Valuable Workplace Waste Eliminator" — star motif, Navy/Sky Blue/Mint gradient, (2) "Certified CI Done Right Consultant" — shield motif, Teal/Mint gradient. Styled with ME brand colors, suitable for LinkedIn sharing. | US-012 |
| 12 | **Milestone unlock criteria** | CONFIRMED | Milestone 1 = all 4 modules marked complete in-app + 1st Battle (14 sessions) done. Milestone 2 = 2nd + 3rd Battles done. "Complete a module" = user marks all lessons in that module as done within Manager Elevator. | US-012 |

### Priority 4 — Needed Before Launch
| # | Item | Status | Details | Blocks |
|---|------|--------|---------|--------|
| 13 | **Landing page copy** | WILL HELP DRAFT | We will help draft marketing copy, value props, and section content | US-005 |
| 14 | **Onboarding assessment questions** | WILL HELP DRAFT | We will help create 3-5 CI experience assessment questions | US-003 |
| 15 | **Miestro account link instructions** | NEEDS INPUT | What URL/process should users follow to create/link their Miestro account? | US-003, US-006 |
| 16 | **Affiliate program details** | CONFIRMED EXTERNAL | Milestone card displays congratulatory message + link to external affiliate signup. Affiliate management is outside the app. | US-012 |
| 17 | **Consulting certification details** | CONFIRMED EXTERNAL | Milestone card displays congratulatory message + link to TGrowthE.com. Listing management is outside the app. | US-012 |

### API Keys & Configuration (Needed for Development)
| # | Item | Status | Details |
|---|------|--------|---------|
| 18 | **Insforge API key** | PROVIDED | In MCP config |
| 19 | **Miestro URL** | NEEDS INPUT | Direct URL to the masterclass on Miestro platform |
| 20 | **Domain DNS access** | NEEDS INPUT | Access to configure ManagerElevator.com DNS for Vercel deployment |

---

## Open Questions

1. **Miestro progress sync (future):** Does Miestro offer an API or webhooks? If so, we could auto-sync course progress in a future version rather than requiring manual tracking. This should be investigated post-MVP.
2. ~~**Subscription gating:**~~ **RESOLVED** — No in-app subscription gating. Once a user has paid (externally), they have full access. Payment verification is handled outside the app. For MVP/beta, accounts may be created directly.
3. **Multiple Waste WAR Battles:** The progress bar shows Battle 1, 2, 3. Can a user run multiple battles simultaneously, or must they complete one before starting the next?
4. ~~**Feature unlocking sequence:**~~ **RESOLVED** — Progress-based unlocking: Onboarding (always) → Masterclass (after onboarding) → CI Trackers (after 1st session) → Success Dashboard (after 1st module) → CI Professor (after onboarding). See FR-23.
5. **Data export:** Should users be able to export their tracker data (CSV, PDF) for MVP, or is that deferred?
6. ~~**AI usage limits:**~~ **RESOLVED** — No usage limits for MVP. Will monitor costs and add limits in future if needed.
7. ~~**Admin panel for Dana:**~~ **RESOLVED** — Yes, admin dashboard included as US-018. Dana gets both an admin view AND email notifications.
8. **Onboarding assessment impact:** Does the CI experience assessment in onboarding affect what the user sees (personalized path), or is it purely informational for Dana?
