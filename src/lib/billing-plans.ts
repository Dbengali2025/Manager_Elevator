export const BILLING_PLANS = {
  monthly: {
    name: "Monthly",
    amount: 9700,
    interval: "month",
    features: ["All 4 masterclass modules", "CI Professor AI chatbot", "All trackers & dashboards", "Success nuggets generator", "Milestone badge unlocks"],
  },
  annual: {
    name: "Annual",
    amount: 99700,
    interval: "year",
    features: ["Everything in Monthly", "Priority support"],
  },
} as const;

export type BillingPlan = keyof typeof BILLING_PLANS;

export function isBillingPlan(value: unknown): value is BillingPlan {
  return value === "monthly" || value === "annual";
}

export function hasSubscriptionAccess(
  subscription: { status: string; current_period_end: string; plan: string | null },
  now = Date.now()
) {
  // No automatic trials. Dana can grant complimentary access separately.
  return subscription.status === "active" && isBillingPlan(subscription.plan) &&
    new Date(subscription.current_period_end).getTime() > now;
}
