# Manager Elevator

AI-powered Continuous Improvement platform for Black middle managers — the digital companion to Dana Thompson's LBCI Masterclass. Live at [app.managerelevator.com](https://app.managerelevator.com).

> ⚠️ **Branches: always work from `main`.** `main` is the production branch — every push auto-deploys to app.managerelevator.com via Vercel. The repo's default branch, `ralph/manager-elevator-mvp`, is a legacy alias kept pointed at the same commit as `main`; do **not** target it with pull requests or push work to it — changes merged there will never deploy.

## Documentation

Start with **[docs/PRODUCT_REFERENCE_GUIDE.md](docs/PRODUCT_REFERENCE_GUIDE.md)** — the full platform reference (stack, deployment, database schema, Stripe billing, email, AI pipeline, operational runbook).

| Document | Contents |
|---|---|
| [docs/HANDOFF.md](docs/HANDOFF.md) | Developer orientation: access, accounts, client contact |
| [docs/PRODUCT_REFERENCE_GUIDE.md](docs/PRODUCT_REFERENCE_GUIDE.md) | Complete platform reference |
| [docs/GETTING_STARTED_GUIDE.md](docs/GETTING_STARTED_GUIDE.md) | End-user onboarding guide |
| [docs/payments.md](docs/payments.md) | Stripe billing design notes |
| [REMAINING-WORK.md](REMAINING-WORK.md) | Open items: live-payments cutover, launch cutover |

## Local Development

```bash
npm install
cp .env.example .env.local   # fill in values — see docs/PRODUCT_REFERENCE_GUIDE.md §9
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Stack

Next.js 14 · TypeScript · Tailwind CSS + Headless UI · [InsForge](https://insforge.dev) (Postgres, Auth, AI gateway, Storage) · Stripe Checkout · Resend · Vercel

## Deploying

Push to `main` — Vercel builds and deploys production automatically. Environment variables live in Vercel → Settings → Environment Variables on the **dbengali2025s-projects/manager-elevator** project (never commit secrets; `.env.local` is gitignored).
