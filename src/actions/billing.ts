"use server";

import { revalidatePath } from "next/cache";
import { BILLING_PLANS, isBillingPlan } from "@/lib/billing-plans";
import { billingRequest, ensureBillingCustomer, findBillingCustomer, getBillingUser, syncSubscription } from "@/lib/billing";
import { getAppUrl, getPriceId, getStripe } from "@/lib/stripe";

export async function startCheckout(plan: string): Promise<{ url?: string; error?: string }> {
  if (!isBillingPlan(plan)) return { error: "Choose a valid plan." };
  const user = await getBillingUser();
  if (!user) return { error: "Please log in before choosing a plan." };
  let locked = false;
  const lockId = crypto.randomUUID();
  try {
    const stripe = getStripe();
    const price = await stripe.prices.retrieve(getPriceId(plan));
    if (!price.active || price.currency !== "usd" || price.unit_amount !== BILLING_PLANS[plan].amount ||
      price.recurring?.interval !== BILLING_PLANS[plan].interval || price.recurring.interval_count !== 1) {
      throw new Error("Configured price does not match the displayed plan");
    }
    const customer = await ensureBillingCustomer(user);
    locked = await billingRequest<boolean>("rpc/acquire_billing_checkout_lock", "POST", { p_user_id: user.id, p_lock_id: lockId });
    if (!locked) return { error: "Checkout is already opening. Please try again shortly." };

    const subscriptions = await stripe.subscriptions.list({ customer: customer.stripe_customer_id, status: "all", limit: 100 });
    if (subscriptions.data.some((s) => !["canceled", "incomplete_expired"].includes(s.status))) {
      return { error: "You already have a subscription. Use Manage billing to update it or resolve a payment." };
    }
    const sessions = await stripe.checkout.sessions.list({ customer: customer.stripe_customer_id, status: "open", limit: 100 });
    for (const session of sessions.data) {
      if (session.metadata?.plan === plan && session.url) return { url: session.url };
      await stripe.checkout.sessions.expire(session.id);
    }
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customer.stripe_customer_id,
      client_reference_id: user.id,
      payment_method_types: ["card"],
      line_items: [{ price: price.id, quantity: 1 }],
      metadata: { user_id: user.id, plan },
      subscription_data: { metadata: { user_id: user.id, plan } },
      allow_promotion_codes: true,
      success_url: `${getAppUrl()}/billing?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${getAppUrl()}/billing?canceled=1&plan=${plan}`,
    }, { idempotencyKey: `checkout-${user.id}-${lockId}` });
    if (!session.url) throw new Error("Checkout URL missing");
    return { url: session.url };
  } catch (error) {
    console.error("Checkout failed:", error instanceof Error ? error.message : "Unknown error");
    return { error: "Checkout is unavailable right now. Please try again later or contact Dana." };
  } finally {
    if (locked) {
      await billingRequest(`records/billing_customers?user_id=eq.${user.id}&checkout_lock_id=eq.${lockId}`, "PATCH", { checkout_lock_until: null, checkout_lock_id: null })
        .catch(() => console.error("Unable to release checkout lock; it will expire automatically"));
    }
  }
}

export async function openBillingPortal(): Promise<{ url?: string; error?: string }> {
  try {
    const user = await getBillingUser();
    if (!user) return { error: "Please log in to manage billing." };
    const customer = await findBillingCustomer(user.id);
    if (!customer) return { error: "Choose a plan to set up billing first." };
    const session = await getStripe().billingPortal.sessions.create({ customer: customer.stripe_customer_id, return_url: `${getAppUrl()}/billing` });
    return { url: session.url };
  } catch {
    return { error: "Billing management is unavailable. Please try again later or contact Dana." };
  }
}

export async function confirmCheckout(sessionId: string) {
  const user = await getBillingUser();
  if (!user || !/^cs_[a-zA-Z0-9_]+$/.test(sessionId)) return false;
  const customer = await findBillingCustomer(user.id);
  if (!customer) return false;
  const session = await getStripe().checkout.sessions.retrieve(sessionId);
  // The return URL itself never grants access; verify ownership and Stripe state.
  if (session.customer !== customer.stripe_customer_id || session.client_reference_id !== user.id ||
    session.status !== "complete" || !session.subscription) return false;
  await syncSubscription(typeof session.subscription === "string" ? session.subscription : session.subscription.id);
  return true;
}

export async function getComplimentaryAccess(userId: string) {
  const admin = await getBillingUser();
  if (!admin?.isAdmin || !/^[0-9a-f-]{36}$/i.test(userId)) return { error: "Not authorized." };
  try {
    const rows = await billingRequest<Array<{ enabled: boolean }>>(`records/billing_access_grants?user_id=eq.${userId}`);
    return { enabled: rows[0]?.enabled === true };
  } catch {
    return { error: "Unable to load billing access." };
  }
}

export interface PreapprovedEmail {
  email: string;
  note: string;
  created_at: string;
  claimed_by: string | null;
  claimed_at: string | null;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function listPreapprovedEmails(): Promise<{ rows?: PreapprovedEmail[]; error?: string }> {
  const admin = await getBillingUser();
  if (!admin?.isAdmin) return { error: "Not authorized." };
  try {
    const rows = await billingRequest<PreapprovedEmail[]>("records/billing_preapproved_emails");
    rows.sort((a, b) => b.created_at.localeCompare(a.created_at));
    return { rows };
  } catch {
    return { error: "Unable to load pre-approved emails." };
  }
}

export async function addPreapprovedEmails(raw: string, note: string): Promise<{ added?: number; skipped?: number; error?: string }> {
  const admin = await getBillingUser();
  if (!admin?.isAdmin || typeof raw !== "string" || typeof note !== "string") return { error: "Not authorized." };
  const emails = Array.from(new Set(raw.split(/[\s,;]+/).map((e) => e.trim().toLowerCase()).filter(Boolean)));
  if (emails.length === 0) return { error: "Enter at least one email address." };
  if (emails.length > 200) return { error: "Add at most 200 emails at a time." };
  const invalid = emails.find((e) => !EMAIL_PATTERN.test(e) || e.length > 254);
  if (invalid) return { error: `Not a valid email address: ${invalid}` };
  try {
    const existing = new Set((await billingRequest<PreapprovedEmail[]>("records/billing_preapproved_emails")).map((r) => r.email));
    const fresh = emails.filter((e) => !existing.has(e));
    if (fresh.length > 0) {
      await billingRequest("records/billing_preapproved_emails", "POST",
        fresh.map((email) => ({ email, note: note.trim().slice(0, 200), created_by: admin.id })));
    }
    return { added: fresh.length, skipped: emails.length - fresh.length };
  } catch {
    return { error: "Unable to add pre-approved emails." };
  }
}

export async function removePreapprovedEmail(email: string): Promise<{ ok?: boolean; error?: string }> {
  const admin = await getBillingUser();
  if (!admin?.isAdmin || typeof email !== "string" || !EMAIL_PATTERN.test(email)) return { error: "Not authorized." };
  try {
    // Claimed rows stay as an audit trail; use the per-user toggle to revoke access.
    await billingRequest(`records/billing_preapproved_emails?email=eq.${encodeURIComponent(email.toLowerCase())}&claimed_by=is.null`, "DELETE");
    return { ok: true };
  } catch {
    return { error: "Unable to remove that email." };
  }
}

export async function setComplimentaryAccess(userId: string, enabled: boolean) {
  const admin = await getBillingUser();
  if (!admin?.isAdmin || !/^[0-9a-f-]{36}$/i.test(userId) || typeof enabled !== "boolean") return { error: "Not authorized." };
  try {
    await billingRequest("rpc/set_billing_access_grant", "POST", { p_user_id: userId, p_enabled: enabled, p_admin_id: admin.id });
    revalidatePath("/admin");
    revalidatePath("/billing");
    return { enabled };
  } catch {
    return { error: "Unable to update complimentary access." };
  }
}
