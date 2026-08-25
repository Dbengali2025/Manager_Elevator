# Manager Elevator — Remaining Work

_Last updated: August 24, 2026 (post email/notifications launch)_

Current state: app is live at **app.managerelevator.com** under Dana's Vercel (auto-deploys from GitHub `main`). Email system fully verified — admin notifications, user milestone emails, and the Monday weekly digest are all live and tested. Root domain still serves Dana's waitlist by design.

---

## 1. Stripe / Payments  🆕 (biggest remaining build)

Not yet scoped or started. Open questions to settle with Dana before building:

- [ ] **What's being sold?** Monthly/annual subscription for app access? One-time purchase bundled with the masterclass? Tiers?
- [ ] **Pricing** — amounts, trial period (if any), coupon needs
- [ ] **What does non-payment gate?** Note the MVP decision was *progress-based* feature unlocking, not subscription gating — need to decide how payment status interacts with that (e.g., paywall at signup vs. free onboarding + paid masterclass)
- [ ] Dana needs a **Stripe account** (or activate an existing one) — keys, business profile, payout bank

Build items once scoped:
- [ ] Stripe products/prices + checkout flow (Stripe Checkout recommended for MVP)
- [ ] Webhook endpoint to sync subscription status into the `users` table
- [ ] Gating middleware/UI for unpaid users + billing management (Stripe Customer Portal)
- [ ] Test-mode end-to-end pass, then live keys in Vercel env

## 2. Launch cutover (when Dana says go)

- [ ] Point root `managerelevator.com` at Vercel (A record in CheapNames) — replaces the waitlist with the app's landing page; `app.` keeps working
- [ ] Add `www.managerelevator.com` redirect in Vercel
- [ ] ⚠️ Do **not** touch the root MX/SPF records (`secureserver.net`) — Dana's mailbox lives there
- [ ] Export waitlist signups from the old waitlist tool → invite campaign?

## 3. Account & repo housekeeping

- [ ] **Aki**: delete old Vercel project (`app-build-26/manager-elevator`) — it stops working Aug 27 anyway when the rotated Insforge key expires
- [ ] **Dana (GitHub, 2 min)**: Settings → General → switch default branch to `main`; then delete the stale `ralph/manager-elevator-mvp` branch
- [ ] **Dana (GitHub)**: make the repo **private** (Settings → Danger Zone) — an admin API key sat in this public repo until Aug 24 (rotated same day, old key dead Aug 27)
- [ ] **Dana (Resend)**: rotate the Resend API key at some point — the current one was shared in chat during setup; update `RESEND_API_KEY` in Vercel after rotating
- [ ] Remove the two stray files from the repo working dir (`LBCI Masterclass Lessons Resources Table.pdf`, `drive-download-*.zip`) — source materials, shouldn't be committed

## 4. Still needed from Dana (content)

- [ ] **Badge artwork** for the two milestones (Waste Eliminator, CI Consultant) — we can generate placeholders if he prefers
- [ ] **Miestro URL + account-link instructions** — the `miestro_linked` flag exists in Settings but points nowhere yet (MVP is link-out only)
- [ ] Confirm the **Module 2 Quiz Q2 fix** and new **section-by-section survey** look right to him (both shipped Aug 24)

## 5. Nice-to-haves / known minor issues

- [ ] **DMARC record** (`TXT _dmarc` → `v=DMARC1; p=none;`) in CheapNames — improves deliverability reporting; 1 record
- [ ] `EMAIL_FROM` + secrets currently set for **Production only** in Vercel — add to Preview if preview deploys are ever used
- [ ] **Signup edge case**: if the verification email fails to send (bad address), the user is stuck on the verify step — Insforge creates the auth user but no OTP. Consider a "resend code" affordance or moving auth emails to Resend
- [ ] Old preview/deployment URLs on the deleted project will 404 after cleanup — expected

---

## Recently completed (for context)

- ✅ Module 2 Quiz Q2 corrected; Value Survey paginated by section; lesson-completion tracking + fixed "X of 25" counter (Aug 24)
- ✅ Vercel project recreated under Dana's account with GitHub auto-deploy; `app.managerelevator.com` live with SSL (Aug 24)
- ✅ Leaked Insforge admin key rotated + scrubbed from repo (Aug 24)
- ✅ Resend: domain verified, sending from `notifications@managerelevator.com`; admin notifications, user milestone congrats emails, notification preference toggles (persisted), weekly digest cron (Mondays ~10am ET) — all tested and delivered (Aug 24)
- ✅ All 85 lesson resources uploaded and mapped (Aug 4); full E2E test pass (Aug 3)
