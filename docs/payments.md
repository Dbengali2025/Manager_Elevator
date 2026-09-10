# Payments setup

Manager Elevator uses Stripe-hosted Checkout with two recurring USD prices:

| Option | Amount | Stripe interval | Environment variable |
| --- | --- | --- | --- |
| Monthly | $97 | month | `STRIPE_PRICE_MONTHLY` |
| Annual | $997 | year | `STRIPE_PRICE_ANNUAL` |

Both include full platform access. The annual option preserves the existing priority-support benefit and saves $167 versus 12 monthly payments. There is no automatic free trial. Dana can issue promotion codes in Stripe or grant complimentary access from an expanded user row in Admin. Complimentary access does not cancel or modify an existing subscription or its charges.

## Configuration

Set these values in `.env.local` for development and the app's Vercel environment settings for deployment. Keep secret keys out of chat and source control.

```dotenv
APP_URL=https://YOUR_APP_DOMAIN
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_MONTHLY=price_...
STRIPE_PRICE_ANNUAL=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Use Dana's existing Stripe account. Create one recurring $97 USD monthly Price and one recurring $997 USD annual Price. Use test-mode products/prices and a test key first; live prices and keys are separate. Checkout validates amount, currency and interval against `src/lib/billing-plans.ts`, so a mistakenly configured $997 monthly price cannot charge customers.

Configure the Stripe Customer Portal to support payment-method updates, invoices, and subscription cancellation at the end of the current period. Enable plan switching between these two Prices if Dana wants self-service changes. Hosted checkout requires no publishable key.

Register a snapshot webhook at `https://YOUR_APP_DOMAIN/api/stripe/webhook`, using API version `2026-08-26.dahlia` to match the installed Stripe SDK, for:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

Copy that endpoint's signing secret into `STRIPE_WEBHOOK_SECRET`. For local testing, use `stripe listen --forward-to localhost:3000/api/stripe/webhook` and its separate signing secret. See [Stripe webhooks](https://docs.stripe.com/webhooks) and [customer portal configuration](https://docs.stripe.com/customer-management/integrate-customer-portal).

## Rollout

Run `src/db/migrations/007_billing.sql` alongside deploying the payment-enabled app, after all Stripe configuration is ready. It creates private billing tables and RPCs, adds paid-access restrictions to app data, protects admin roles, and makes the `lesson-resources` bucket private. It does not delete members or their work. Existing non-admin users will need to subscribe unless Dana grants them access. Apply this first to a test project before production.

Keep the billing page outside the paid dashboard layout so expired and unpaid members can recover their membership. Subscription state is written only on the server. Webhooks verify the raw-body signature, retrieve current Stripe state, and atomically save it with a timestamp guard against older concurrent writes. Failed synchronization returns 500 for Stripe retries. Successful Checkout returns also synchronize the verified subscription, reducing webhook-delay confusion.

Access requires an active, recognized subscription whose paid period has not ended, an admin account, or Dana's explicit complimentary grant. Past-due, unpaid, incomplete, canceled, paused, and trialing subscriptions do not grant access. Cancel-at-period-end keeps access through the paid period. An expired local period denies access even if a renewal webhook is delayed; resend the event from Stripe to recover synchronization.

## Verification

Run `npm run test:billing`, `npm run typecheck`, `npm run lint`, and `npm run build`. Run `npm run test:billing:db` with PostgreSQL tools installed to test the migration and access-control assertions in an isolated temporary database. This test never connects to the app database. The hosted InsForge SQL rehearsal returned `FORBIDDEN`; the same migration and authenticated-role assertions passed locally. The production migration remains unapplied.

With Stripe test credentials, complete one checkout for each option, then test a canceled checkout, a declined card, a renewal failure, cancellation, recovery through the portal, and duplicate clicks. Verify the selected interval in Checkout before paying. Verify a user cannot claim another customer's Checkout session, access paid API routes or direct database records without membership, or grant themselves complimentary access. Verify lesson files are unavailable at their old public URLs after the storage change; invalidate any upstream public caches if necessary. Verify Dana can grant and revoke complimentary access and that this leaves Stripe charges unchanged.

Before going live, replace test keys/Price IDs with their live counterparts, register the live webhook, enable the live portal, and redeploy. No live keys or checkout have been configured by the code change alone.

## Rollback

Roll back the application deployment and remove the `paid_access_required` policies from the listed application tables if paid access must be disabled. Keep billing tables and Stripe subscriptions intact; rolling back code does not cancel charges. Lesson resources can remain private because the previous app already uses the server download proxy. Do not roll back billing data or remove a webhook while active subscriptions still need reconciliation.
