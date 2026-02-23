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

## Quality Checks
- `npm run typecheck` — TypeScript strict mode
- `npm run build` — Full Next.js production build
- `npm run lint` — ESLint

## Gotchas
- Project directory has a space ("Manager Elevator") — always quote paths in scripts
- Package name is `manager-elevator` (lowercase, hyphenated)
- Tenor Sans only has weight 400 — specify `weight: "400"` in font config
