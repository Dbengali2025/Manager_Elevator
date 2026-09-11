# Manager Elevator — Product Reference Guide

| | |
|---|---|
| Owner | Transformational Growth Enterprises LLC (Dana Thompson) |
| Product | Manager Elevator — AI-powered Continuous Improvement platform for Black middle managers |
| Live URL | https://app.managerelevator.com |
| Last Updated | September 2026 |

*This document is the single reference for what was built, which platforms power it, how to operate it, and where the product is headed next.*

# 1. What Manager Elevator Is

Manager Elevator is the digital companion to Dana Thompson's LBCI (Lead Bulletproof Continuous Improvement) Masterclass and his book *Bulletproof Your Manager Career*. It turns the masterclass into an interactive platform where members learn the CI methodology, practice it with AI coaching, and track the measurable business results they create.

**Core capabilities shipped in v1:**

| Area | What Users Get |
|---|---|
| Auth & Onboarding | Email + verification-code signup (with resend), profile capture (HBCU alma mater, company, industry, role), onboarding assessment |
| Masterclass Hub | 4 modules / 25 lessons with per-lesson completion, module quizzes, session tracking (14 sessions), 85 downloadable lesson resources served from storage |
| CI Professor | AI chat coach with RAG over Dana's 120-page book (professorial, supportive persona) |
| Trackers | Improvement opportunities → winning solutions → Waste WAR battle sessions, with ROI math |
| Manager Value Survey | Recurring self-assessment; Dana tracks effectiveness by re-running it at intervals |
| Success Dashboard | Milestones, AI-generated Success Nuggets, progress views |
| Emails | Admin notifications to Dana, user milestone emails, Monday weekly digest, notification preferences |
| Billing | $97/mo and $997/yr subscriptions via Stripe Checkout + Customer Portal; complimentary access grants |
| Admin | Dana's operator dashboard: stats, user list, complimentary grants |
| Feature Unlocking | Progress-based (not subscription-tiered) — features unlock as members advance |

# 2. Platform Stack

```
USER BROWSER
  app.managerelevator.com (Next.js 14, TypeScript, Tailwind + Headless UI)
      |
  +---+-------------------+----------------+
  |                       |                |
VERCEL               INSFORGE           STRIPE
Hosting +            Postgres + RLS     Checkout +
weekly cron          Auth (email OTP)   Customer Portal +
                     AI gateway         webhooks
                     Storage, pgvector
                          |
                     +----+----+
                     |         |
                 OPENROUTER  RESEND
                 (AI models) product email
```

| Platform | Role | Where to Manage |
|---|---|---|
| Vercel | Production hosting, server actions/API routes, weekly cron | vercel.com — team **dbengali2025s-projects**, project **manager-elevator** (auto-deploys from GitHub main) |
| InsForge | PostgreSQL (+ RLS), authentication (email + OTP), AI gateway (OpenRouter), storage, pgvector | InsForge dashboard — project https://97k43jb9.us-west.insforge.app |
| Stripe | Checkout, subscriptions, Customer Portal, webhooks | dashboard.stripe.com — "TGrowthE" merchant (Dana) |
| Resend | Product/transactional email (not auth email) | resend.com |
| GitHub | Source, version history | github.com/Dbengali2025/Manager_Elevator |
| Domain / DNS | managerelevator.com | CheapNames registrar. Root serves Dana's waitlist (by design, until launch cutover); app. subdomain → Vercel. ⚠️ Root MX/SPF (secureserver.net) hosts Dana's mailbox — never modify. |

*Why InsForge: BaaS with Postgres, auth, RLS, storage, and an OpenAI-compatible AI gateway — one platform covers database, login, files, and AI calls.*

⚠️ **Two Vercel projects exist.** Production is **dbengali2025s-projects/manager-elevator** (app.managerelevator.com). The other, app-build-26/manager-elevator, only owns manager-elevator.vercel.app — env vars set there do NOT affect production.

# 3. GitHub & Deployment Workflow

| | |
|---|---|
| URL | https://github.com/Dbengali2025/Manager_Elevator |
| Production branch | main — every push auto-deploys to production via Vercel |
| Commit style | Conventional prefixes: feat:, fix:, docs: |

**Deploying changes**

1. Push (or merge) to main on GitHub.
2. Vercel builds automatically (`npm run build`).
3. For env var changes, update Vercel → Settings → Environment Variables on the **dbengali** project, then redeploy.

**Cron jobs (vercel.json)**

| Job | Schedule | Purpose |
|---|---|---|
| /api/cron/weekly-digest | Mondays 14:00 UTC | Weekly digest email to members |

Requires `Authorization: Bearer ${CRON_SECRET}` (Vercel injects it for scheduled runs). Supports `?to=<email>` for single-recipient test sends.

# 4. InsForge (Backend & Database)

**What lives here**

- **Authentication** — email/password signup with emailed verification codes (OTP), password reset. Auth emails are sent by InsForge itself (AWS SES), not Resend.
- **PostgreSQL** — all app data with Row Level Security.
- **AI Gateway** — OpenRouter-compatible; default model `anthropic/claude-sonnet-4.6` (src/lib/insforge.ts). Powers CI Professor chat and Success Nugget generation.
- **Storage** — `lesson-resources` bucket: 85 mapped lesson resources (~300 MB), keyed `m{module}/l{lesson}/file`.
- **pgvector** — `book_embeddings` table holds Dana's book, chunked and embedded (openai/text-embedding-3-small) for CI Professor RAG.

**Key tables**

| Table | Purpose |
|---|---|
| users | Profile (name, HBCU, company, industry, role), onboarding state, app role (user/admin) |
| user_progress | Module/lesson progress and unlocks |
| lesson_completions | Per-lesson completion records (modules 1–4, lessons 1–7) |
| lesson_resources | Maps lessons to storage objects for downloads |
| conversations / messages | CI Professor chat history |
| book_embeddings | RAG chunks of Dana's book (pgvector) |
| improvement_opportunities / winning_solutions / war_battle_sessions | Tracker data + ROI inputs |
| manager_value_surveys | Recurring value survey responses |
| milestones / success_nuggets | Success Dashboard content (nuggets are AI-generated) |
| billing_customers / billing_subscriptions / billing_access_grants | Stripe customer + subscription mirror; complimentary access grants |

**InsForge environment variables**

```
NEXT_PUBLIC_INSFORGE_URL=https://97k43jb9.us-west.insforge.app
NEXT_PUBLIC_INSFORGE_ANON_KEY=<anon key>   # client-safe; REQUIRED fallback for auth endpoints
INSFORGE_API_KEY=<admin key>               # server-only, never expose
```

⚠️ **Auth endpoints must never be called with the admin API key.** InsForge treats an admin-authenticated signup as *admin user creation* and silently skips the verification email (bug found & fixed Sep 2026 — commit ab478d1). The request helper in src/lib/insforge.ts falls back to the anon key on /api/auth/ paths; keep it that way.

# 5. Payments & Pricing (Stripe)

**Architecture**

- **Stripe Checkout** (hosted) — card details never touch the app's servers.
- **Customer Portal** — self-serve cancel / payment-method changes via "Manage billing".
- **Webhooks** — POST /api/stripe/webhook (signature-verified with STRIPE_WEBHOOK_SECRET). Events: customer.subscription.created/updated/deleted, checkout.session.completed, checkout.session.async_payment_succeeded, invoice.paid, invoice.payment_failed. Every event re-fetches current Stripe state (stale/replayed payloads can't regress the DB).
- **Complimentary access** — billing_access_grants rows (granted by Dana in /admin) unlock the platform without a subscription.
- **Gating** — platform access requires an active subscription or a grant; unpaid users are routed to /billing.

**Pricing**

| Plan | Price | Notes |
|---|---|---|
| Monthly | $97.00/mo | No trial |
| Annual | $997.00/yr | ≈ 14% off vs monthly |

**Status (Sep 2026):** test mode verified end-to-end in production; live mode is activated on the Stripe account but live products/webhook are not yet created. The cutover is fully scripted: `scripts/go-live-payments.mjs` (see the companion doc "Manager Elevator — Going Live with Payments.docx").

**Stripe environment variables**

```
STRIPE_SECRET_KEY=        # sk_test_ now; sk_live_ after cutover
STRIPE_PRICE_MONTHLY=     # price_...
STRIPE_PRICE_ANNUAL=      # price_...
STRIPE_WEBHOOK_SECRET=    # whsec_...
APP_URL=https://app.managerelevator.com
```

**Notes**

- In-app cancel = cancel at period end (access until the paid period ends). On the current Stripe API the portal sets `cancel_at` rather than `cancel_at_period_end`; the sync treats either as a cancel (fix 343401a).
- Refunds: Stripe Dashboard → Payments → Refund. Cancel does not auto-refund.

# 6. Email

Two senders, split by purpose:

| Sender | What it sends |
|---|---|
| **InsForge (AWS SES)** | Auth email only: signup verification codes, password reset codes |
| **Resend** | Product email: new-signup + milestone notifications to Dana (DANA_NOTIFICATION_EMAIL), user milestone emails, Monday weekly digest. From address set by EMAIL_FROM. Users control these in Settings → notification preferences. |

```
RESEND_API_KEY=re_...
EMAIL_FROM=Manager Elevator <...>
DANA_NOTIFICATION_EMAIL=danat4lssplus@gmail.com
```

# 7. AI Pipeline (CI Professor & Success Nuggets)

- All AI calls go through the InsForge AI gateway (OpenRouter) — no direct OpenAI/Anthropic keys in the app.
- Default chat model: `anthropic/claude-sonnet-4.6`; embeddings: `openai/text-embedding-3-small`.
- **RAG**: Dana's book (*Bulletproof Your Manager Career*, 120 pages / 15 chapters) is chunked and embedded into `book_embeddings`; CI Professor retrieves relevant chunks per question. Ingest script: `src/scripts/ingest-book.ts`.
- Persona: professorial and supportive. No usage limits in MVP.

# 8. User Journeys (Quick Reference)

**A. New member**
Signup (profile + password) → emailed 6-digit code (Resend-code button, 30s cooldown) → /billing → pay $97 or $997 via Stripe Checkout → onboarding assessment → dashboard.

**B. Complimentary member**
Dana grants access in /admin → member signs up → platform unlocked without a subscription (billing page shows complimentary status).

**C. Working the masterclass**
Masterclass → lesson pages in order → mark complete (module quizzes at checkpoints) → download lesson resources → features unlock with progress. Course video hosted on Miestro (link-out).

**D. Tracking results**
Trackers → log improvement opportunity → attach winning solution → run Waste WAR battle sessions → ROI computed as ((Before − After) / Before) × 100 for reductions.

**E. Operator (Dana)**
Login with an admin-role account → /admin → stats, user list, complimentary grants.

# 9. Environment Variables (Complete Checklist)

| Category | Variables |
|---|---|
| App | APP_URL |
| InsForge | NEXT_PUBLIC_INSFORGE_URL, NEXT_PUBLIC_INSFORGE_ANON_KEY, INSFORGE_API_KEY |
| Stripe | STRIPE_SECRET_KEY, STRIPE_PRICE_MONTHLY, STRIPE_PRICE_ANNUAL, STRIPE_WEBHOOK_SECRET |
| Email | RESEND_API_KEY, EMAIL_FROM, DANA_NOTIFICATION_EMAIL |
| Ops | CRON_SECRET |

**Rule: never commit secrets. All production values live in Vercel → Environment Variables on the dbengali2025s-projects project only.** Template: .env.example.

# 10. Key Files for Developers

| If you need to understand… | Start here |
|---|---|
| InsForge client (REST, auth, AI, email wrappers) | src/lib/insforge.ts |
| Auth flows (signup / OTP / login / reset) | src/actions/auth.ts, src/app/(auth)/* |
| Billing + Stripe sync | src/lib/billing.ts, src/lib/stripe.ts, src/lib/billing-plans.ts, src/app/api/stripe/webhook/route.ts, src/actions/billing.ts |
| Masterclass progress & quizzes | src/actions/masterclass.ts, src/lib/quiz-data.ts |
| CI Professor chat | src/actions/chat.ts, src/app/api/chat |
| Trackers & ROI | src/actions/trackers.ts |
| Success Dashboard / nuggets / milestones | src/actions/success-dashboard.ts |
| Emails & digest | src/actions/notifications.ts, src/app/api/cron/weekly-digest/route.ts |
| Admin panel | src/actions/admin.ts, src/app/(dashboard)/admin |
| Book ingest (RAG) | src/scripts/ingest-book.ts |
| Payments go-live | scripts/go-live-payments.mjs |

# 11. Operational Runbook

**Dana / operator common tasks**

| Task | How |
|---|---|
| Grant someone free (complimentary) access | /admin → grant access |
| See signups / stats | /admin (plus automatic email notifications on each signup) |
| Refund a customer | Stripe Dashboard → Payments → select payment → Refund |
| Cancel someone's subscription | Member self-serves via Manage billing; or cancel in Stripe Dashboard |
| Send a test weekly digest | GET /api/cron/weekly-digest?to=you@example.com with the CRON_SECRET bearer header |
| Change pricing | New Stripe Prices + update STRIPE_PRICE_* env vars + update src/lib/billing-plans.ts + redeploy (existing subscribers keep their price) |
| Delete a stuck unverified signup | InsForge CLI: `db query "DELETE FROM auth.users WHERE email='...' AND email_verified=false"` |

**When something breaks**

1. Vercel → Deployments → Function logs (server action / API errors)
2. Stripe → Developers → Webhooks (delivery status) and Events
3. InsForge logs: `npx -y @insforge/cli logs insforge.logs` (or `diagnose`) — auth/email/DB events
4. Resend dashboard — product email delivery

# 12. Accounts & Access

| Asset | Owner / Notes |
|---|---|
| Domain managerelevator.com | Dana — CheapNames registrar. Root = waitlist (until launch cutover); ⚠️ never touch root MX/SPF (Dana's mailbox). |
| Vercel team dbengali2025s-projects | Dana — invite developers as needed |
| GitHub Dbengali2025/Manager_Elevator | Dana's account |
| Stripe "TGrowthE" | Dana — live mode activated |
| InsForge project 97k43jb9 | Access via InsForge dashboard / CLI |
| Resend | Product email sending |

**Store credentials in a password manager, not in git. .env.local is gitignored.**

# 13. Roadmap & Remaining Work

**Shipped (v1):** everything in Section 1, including verified email system and test-mode payments.

**Next up (from REMAINING-WORK.md):**

| Item | Notes |
|---|---|
| Live payments cutover | Script + guide ready; needs Dana's live key + Vercel token (~20 min) |
| Launch cutover | Point root managerelevator.com at Vercel (replaces waitlist), add www redirect, keep MX untouched |
| Waitlist migration | Export signups from the old waitlist tool → invite campaign |
| Badge artwork | Placeholders in use; final art from Dana |
| Miestro link | Final course URL + account-link instructions from Dana |

# 14. Related Documentation Index

| Document | Contents |
|---|---|
| docs/HANDOFF.md | Developer orientation, access, client contact |
| docs/GETTING_STARTED_GUIDE.md | End-user onboarding guide (customer-facing source) |
| docs/payments.md | Stripe billing design notes |
| REMAINING-WORK.md | Open items and launch cutover plan |
| tasks/prd-manager-elevator-mvp.md | Original MVP PRD (19 user stories, 27 FRs) |
| "Manager Elevator — Going Live with Payments.docx" | Plain-language live-payments guide for Dana |
| .env.example | Environment variable template |

*Proprietary. © 2026 Transformational Growth Enterprises LLC. For internal handoff and operator reference.*
