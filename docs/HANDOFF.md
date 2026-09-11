# Manager Elevator — Developer Handoff Package

*Prepared by Akinyemi Bajulaiye (Pentridge Media) · September 2026*

## The Product

| | |
|---|---|
| **App name** | Manager Elevator |
| **Client** | Dana Thompson — Transformational Growth Enterprises LLC (TGE) |
| **Live URL** | https://app.managerelevator.com |
| **GitHub repo** | github.com/Dbengali2025/Manager_Elevator |
| **Main branch** | main (production — auto-deploys to Vercel) |
| **Vercel team** | dbengali2025s-projects · project: manager-elevator |
| **Stack** | Next.js 14 · TypeScript · React · Tailwind CSS + Headless UI · InsForge (Postgres + Auth + AI gateway + Storage) · Stripe Checkout · Resend · Vercel |

## Documentation Included in the Repo

Start with **docs/PRODUCT_REFERENCE_GUIDE.md**. Everything about the platform, environment variables, database schema, payments, email, deployment, and the operational runbook is in there.

| | |
|---|---|
| **docs/PRODUCT_REFERENCE_GUIDE.md** | Full platform reference — stack, env vars, InsForge tables, Stripe billing, Resend email, AI/RAG pipeline, cron jobs, user journeys, key source files, runbook |
| **docs/GETTING_STARTED_GUIDE.md** | End-user onboarding guide (source for the customer-facing document) |
| **docs/payments.md** | Stripe billing design notes |
| **REMAINING-WORK.md** | Open items: live-payments cutover, root-domain launch cutover, waitlist migration |
| **tasks/prd-manager-elevator-mvp.md** | Original MVP PRD — 19 user stories, 27 functional requirements |
| **scripts/go-live-payments.mjs** | One-command Stripe test→live cutover (see "Manager Elevator — Going Live with Payments.docx") |

## Logins & Access

All production secrets are stored in Vercel → Settings → Environment Variables (on the **dbengali2025s-projects** project — not the secondary app-build-26 project). Never commit them to the repo. Dana grants access to each platform directly.

| | |
|---|---|
| **Vercel** | Team: dbengali2025s-projects · Project: manager-elevator · serves app.managerelevator.com, auto-deploys from GitHub main. (A second project, app-build-26/manager-elevator, only owns manager-elevator.vercel.app — env vars there do NOT affect production.) |
| **GitHub** | github.com/Dbengali2025/Manager_Elevator · Dana's account controls access |
| **InsForge** | Postgres + Auth + AI gateway + Storage · project https://97k43jb9.us-west.insforge.app · credentials in Vercel env |
| **Stripe** | Merchant account "TGrowthE" (Dana) · live mode activated; products currently test-mode (see go-live script) |
| **Resend** | Transactional product email (notifications, digests) |
| **Domain** | managerelevator.com — registrar: CheapNames. Root domain intentionally still serves Dana's waitlist; the app lives on the app. subdomain. ⚠️ Never touch the root MX/SPF records (secureserver.net) — Dana's mailbox lives there. |
| **Admin panel** | app.managerelevator.com/admin · users with role = admin in the users table |

## Client Contact

| | |
|---|---|
| **Client** | Dana Thompson (he/him) |
| **Email** | danat4lssplus@gmail.com |
| **Company** | Transformational Growth Enterprises LLC |

*The repo docs are comprehensive. Read docs/PRODUCT_REFERENCE_GUIDE.md before anything else — it answers most questions about how the platform is built.*
