import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import Module from "node:module";
import Stripe from "stripe";
import { BILLING_PLANS, hasSubscriptionAccess, isBillingPlan } from "../src/lib/billing-plans";

// Exercise the real actions and HTTP handler while isolating external services.
// No Stripe account, payment, or production data is used by these tests.
const user = { id: "11111111-1111-4111-8111-111111111111", email: "member@example.com", isAdmin: false };
let authenticated = true;
let priceAmount = 9700;
let priceInterval = "month";
let locked = true;
let existingSubscriptions: Array<{ status: string }> = [];
let openSessions: Array<{ id: string; url: string; metadata: { plan: string } }> = [];
let created: Record<string, unknown> | undefined;
let checkoutOwner = "cus_member";
let checkoutStatus = "complete";
let syncFails = false;
let synced: string[] = [];
let dbCalls: Array<{ path: string; method?: string; body?: unknown }> = [];
let portalCustomer = "";
const signingSecret = "whsec_local_test_only";
const realStripe = new Stripe("sk_test_local_test_only");

const billingMock = {
  getBillingUser: async () => authenticated ? user : null,
  ensureBillingCustomer: async () => ({ user_id: user.id, stripe_customer_id: "cus_member" }),
  findBillingCustomer: async () => ({ user_id: user.id, stripe_customer_id: "cus_member" }),
  billingRequest: async (path: string, method?: string, body?: unknown) => {
    dbCalls.push({ path, method, body });
    return path.includes("acquire_billing_checkout_lock") ? locked : [];
  },
  syncSubscription: async (id: string) => {
    if (syncFails) throw new Error("database unavailable");
    synced.push(id);
  },
};
const stripeMock = {
  prices: { retrieve: async () => ({ id: "price_monthly", active: true, currency: "usd", unit_amount: priceAmount, recurring: { interval: priceInterval, interval_count: 1 } }) },
  subscriptions: { list: async () => ({ data: existingSubscriptions }) },
  checkout: { sessions: {
    list: async () => ({ data: openSessions }),
    expire: async () => ({}),
    create: async (params: Record<string, unknown>) => { created = params; return { url: "https://checkout.stripe.com/test" }; },
    retrieve: async () => ({ customer: checkoutOwner, client_reference_id: user.id, status: checkoutStatus, subscription: "sub_member" }),
  } },
  billingPortal: { sessions: { create: async (params: { customer: string }) => { portalCustomer = params.customer; return { url: "https://billing.stripe.com/test" }; } } },
  webhooks: realStripe.webhooks,
};
const moduleLoader = Module as unknown as { _load: (id: string, ...args: unknown[]) => unknown };
const originalLoad = moduleLoader._load;
moduleLoader._load = function (id, ...args) {
  if (id === "@/lib/billing") return billingMock;
  if (id === "@/lib/stripe") return { getStripe: () => stripeMock, getAppUrl: () => "https://app.example.com", getPriceId: () => "price_monthly" };
  if (id === "next/cache") return { revalidatePath: () => {} };
  if (id === "next/server") return { NextResponse: Response };
  return originalLoad.call(this, id, ...args);
};
const actions = require("../src/actions/billing") as typeof import("../src/actions/billing");
const { POST } = require("../src/app/api/stripe/webhook/route") as typeof import("../src/app/api/stripe/webhook/route");
moduleLoader._load = originalLoad;

beforeEach(() => {
  authenticated = true;
  user.isAdmin = false;
  priceAmount = 9700;
  priceInterval = "month";
  locked = true;
  existingSubscriptions = [];
  openSessions = [];
  created = undefined;
  checkoutOwner = "cus_member";
  checkoutStatus = "complete";
  syncFails = false;
  synced = [];
  dbCalls = [];
  portalCustomer = "";
  process.env.STRIPE_WEBHOOK_SECRET = signingSecret;
});

test("only active recognized plans inside their paid period grant access", () => {
  const current = { status: "active", current_period_end: "2030-02-01T00:00:00Z", plan: "monthly" };
  const now = Date.parse("2030-01-01T00:00:00Z");
  assert.equal(hasSubscriptionAccess(current, now), true);
  for (const status of ["trialing", "past_due", "unpaid", "canceled", "incomplete", "incomplete_expired", "paused"]) {
    assert.equal(hasSubscriptionAccess({ ...current, status }, now), false, status);
  }
  assert.equal(hasSubscriptionAccess({ ...current, plan: null }, now), false);
  assert.equal(hasSubscriptionAccess({ ...current, current_period_end: "invalid" }, now), false);
  assert.equal(hasSubscriptionAccess({ ...current, current_period_end: new Date(now).toISOString() }, now), false);
  assert.equal(isBillingPlan("__proto__"), false);
  assert.equal(BILLING_PLANS.annual.amount, 99700);
});

test("checkout rejects forged plans and unauthenticated requests", async () => {
  assert.ok((await actions.startCheckout("price_attacker")).error);
  authenticated = false;
  assert.ok((await actions.startCheckout("monthly")).error);
  assert.equal(created, undefined);
});

test("checkout refuses a Stripe price that differs from advertised price", async () => {
  priceAmount = 100;
  assert.ok((await actions.startCheckout("monthly")).error);
  assert.equal(created, undefined);
});

test("the $997 option must bill annually and rejects a monthly Stripe price", async () => {
  priceAmount = 99700;
  assert.ok((await actions.startCheckout("annual")).error);
  priceInterval = "year";
  assert.ok((await actions.startCheckout("annual")).url);
  assert.equal(BILLING_PLANS.annual.interval, "year");
});

test("concurrent checkout lock and existing subscriptions prevent duplicate purchases", async () => {
  locked = false;
  assert.ok((await actions.startCheckout("monthly")).error);
  locked = true;
  for (const status of ["active", "past_due", "trialing", "unpaid", "incomplete"]) {
    existingSubscriptions = [{ status }];
    assert.ok((await actions.startCheckout("monthly")).error);
  }
  assert.equal(created, undefined);
});

test("open checkout is reused and its lock is released", async () => {
  openSessions = [{ id: "cs_open", url: "https://checkout.stripe.com/existing", metadata: { plan: "monthly" } }];
  assert.equal((await actions.startCheckout("monthly")).url, openSessions[0].url);
  assert.equal(created, undefined);
  assert.ok(dbCalls.some((call) => call.method === "PATCH" && call.path.includes("checkout_lock_id=eq.")));
});

test("checkout creates a recurring subscription for the authenticated customer without a trial", async () => {
  assert.ok((await actions.startCheckout("monthly")).url);
  assert.equal(created?.mode, "subscription");
  assert.equal(created?.customer, "cus_member");
  assert.deepEqual(created?.line_items, [{ price: "price_monthly", quantity: 1 }]);
  assert.deepEqual(created?.subscription_data, { metadata: { user_id: user.id, plan: "monthly" } });
  assert.equal(created?.success_url, "https://app.example.com/billing?session_id={CHECKOUT_SESSION_ID}");
});

test("success URL cannot claim another customer's or incomplete checkout", async () => {
  checkoutOwner = "cus_someone_else";
  assert.equal(await actions.confirmCheckout("cs_test_valid"), false);
  checkoutOwner = "cus_member";
  checkoutStatus = "open";
  assert.equal(await actions.confirmCheckout("cs_test_valid"), false);
  assert.deepEqual(synced, []);
  checkoutStatus = "complete";
  assert.equal(await actions.confirmCheckout("cs_test_valid"), true);
  assert.deepEqual(synced, ["sub_member"]);
});

test("portal uses the authenticated user's stored customer", async () => {
  assert.ok((await actions.openBillingPortal()).url);
  assert.equal(portalCustomer, "cus_member");
});

test("members cannot grant themselves complimentary access", async () => {
  assert.ok((await actions.setComplimentaryAccess(user.id, true)).error);
  assert.equal(dbCalls.length, 0);
  user.isAdmin = true;
  assert.equal((await actions.setComplimentaryAccess(user.id, true)).enabled, true);
  assert.deepEqual(dbCalls[0].body, { p_user_id: user.id, p_enabled: true, p_admin_id: user.id });
});

function webhook(type: string, object: Record<string, unknown>, valid = true) {
  const payload = JSON.stringify({ id: "evt_test", type, data: { object } });
  const signature = realStripe.webhooks.generateTestHeaderString({ payload, secret: valid ? signingSecret : "wrong_secret" });
  return new Request("https://app.example.com/api/stripe/webhook", { method: "POST", body: payload, headers: { "stripe-signature": signature } });
}

test("webhook rejects invalid signatures and missing configuration", async () => {
  assert.equal((await POST(webhook("customer.subscription.updated", { id: "sub_member" }, false))).status, 400);
  delete process.env.STRIPE_WEBHOOK_SECRET;
  assert.equal((await POST(webhook("customer.subscription.updated", { id: "sub_member" }))).status, 503);
  assert.deepEqual(synced, []);
});

test("signed subscription, renewal, failure, and deletion events synchronize authoritative state", async () => {
  for (const type of ["customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"]) {
    assert.equal((await POST(webhook(type, { id: "sub_member" }))).status, 200);
  }
  for (const type of ["invoice.paid", "invoice.payment_failed"]) {
    assert.equal((await POST(webhook(type, { parent: { subscription_details: { subscription: "sub_member" } } }))).status, 200);
  }
  assert.equal(synced.length, 5);
});

test("webhook returns a retryable failure when synchronization fails", async () => {
  syncFails = true;
  assert.equal((await POST(webhook("customer.subscription.updated", { id: "sub_member" }))).status, 500);
});
