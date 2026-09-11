import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getValidToken } from "@/lib/auth-helpers";
import { insforgeAuth, insforgeClient } from "@/lib/insforge";
import { BILLING_PLANS, hasSubscriptionAccess, type BillingPlan } from "@/lib/billing-plans";
import { getStripe, getPriceId } from "@/lib/stripe";
import type Stripe from "stripe";
import type { BillingCustomer, BillingSubscription } from "@/db/types";

// Privileged access is deliberately confined to billing tables/RPCs. Never
// return this credential or accept a table name from a client.
export async function billingRequest<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_INSFORGE_URL}/api/database/${path}`, {
    method,
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
    headers: {
      Authorization: `Bearer ${process.env.INSFORGE_API_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Billing database request failed (${response.status})`);
  const text = await response.text();
  return text ? JSON.parse(text) as T : undefined as T;
}

export const getBillingUser = cache(async () => {
  const token = await getValidToken();
  if (!token) return null;
  const { data: user, error } = await insforgeAuth.getUser(token);
  if (error || !user) return null;
  const { data: profiles, error: profileError } = await insforgeClient.from("users")
    .select<Array<{ role: string; onboarding_completed: boolean }>>(token, `?id=eq.${user.id}&select=role,onboarding_completed`);
  if (profileError || !profiles?.[0]) throw new Error("Unable to load account");
  return { id: user.id, email: user.email, token, isAdmin: profiles[0].role === "admin", onboardingCompleted: profiles[0].onboarding_completed };
});

export const getBillingAccess = cache(async () => {
  const user = await getBillingUser();
  if (!user) return { user: null, allowed: false, complimentary: false, subscriptions: [] as BillingSubscription[] };
  if (user.isAdmin) return { user, allowed: true, complimentary: false, subscriptions: [] as BillingSubscription[] };
  const [subscriptions, grants] = await Promise.all([
    billingRequest<BillingSubscription[]>(`records/billing_subscriptions?user_id=eq.${user.id}`),
    billingRequest<Array<{ enabled: boolean }>>(`records/billing_access_grants?user_id=eq.${user.id}`),
  ]);
  const complimentary = grants[0]?.enabled === true;
  return { user, allowed: complimentary || subscriptions.some((s) => hasSubscriptionAccess(s)), complimentary, subscriptions };
});

export async function requirePaidAccess() {
  const access = await getBillingAccess();
  if (!access.user) redirect("/login");
  if (!access.allowed) redirect("/billing");
  return access.user.token;
}

export async function findBillingCustomer(userId: string) {
  const customers = await billingRequest<BillingCustomer[]>(`records/billing_customers?user_id=eq.${userId}`);
  return customers[0] ?? null;
}

export async function ensureBillingCustomer(user: { id: string; email: string }) {
  const existing = await findBillingCustomer(user.id);
  if (existing) return existing;
  const customer = await getStripe().customers.create({ email: user.email, metadata: { user_id: user.id } }, { idempotencyKey: `customer-${user.id}` });
  try {
    await billingRequest("records/billing_customers", "POST", [{ user_id: user.id, stripe_customer_id: customer.id }]);
  } catch (error) {
    const winner = await findBillingCustomer(user.id);
    if (!winner) throw error;
    return winner;
  }
  return { user_id: user.id, stripe_customer_id: customer.id };
}

export function subscriptionPlan(subscription: Stripe.Subscription): BillingPlan | null {
  if (subscription.items.data.length !== 1) return null;
  const item = subscription.items.data[0];
  for (const plan of ["monthly", "annual"] as const) {
    const expected = BILLING_PLANS[plan];
    if (item.price.id === getPriceId(plan) && item.quantity === 1 &&
      item.price.currency === "usd" && item.price.unit_amount === expected.amount &&
      item.price.recurring?.interval === expected.interval && item.price.recurring.interval_count === 1) return plan;
  }
  return null;
}

export async function syncSubscription(subscriptionId: string) {
  // Always retrieve current Stripe state: delayed or repeated webhook payloads
  // must not restore an old subscription state.
  const observedAt = new Date().toISOString();
  const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const customers = await billingRequest<BillingCustomer[]>(`records/billing_customers?stripe_customer_id=eq.${encodeURIComponent(customerId)}`);
  const customer = customers[0];
  // Ignore unrelated subscriptions in Dana's Stripe account.
  if (!customer) return;
  const periodEnd = subscription.items.data[0]?.current_period_end ?? 0;
  await billingRequest("rpc/sync_billing_subscription", "POST", {
    p_subscription_id: subscription.id,
    p_customer_id: customerId,
    p_user_id: customer.user_id,
    p_status: subscription.status,
    p_plan: subscriptionPlan(subscription),
    p_period_end: new Date(periodEnd * 1000).toISOString(),
    // On Stripe API 2026-08-26+, the Customer Portal's "cancel at period end"
    // sets cancel_at instead of cancel_at_period_end, so honor either signal.
    p_cancel_at_period_end: subscription.cancel_at_period_end || subscription.cancel_at != null,
    p_observed_at: observedAt,
  });
}
