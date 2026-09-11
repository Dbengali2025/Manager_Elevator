"use client";

import { useState } from "react";
import { startCheckout, openBillingPortal } from "@/actions/billing";
import { BILLING_PLANS, type BillingPlan } from "@/lib/billing-plans";

export default function BillingControls({ hasCustomer, subscribed, selectedPlan }: {
  hasCustomer: boolean; subscribed: boolean; selectedPlan?: BillingPlan;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function run(plan?: BillingPlan) {
    setBusy(true);
    setError("");
    try {
      const result = plan ? await startCheckout(plan) : await openBillingPortal();
      if (result.url) window.location.assign(result.url);
      else setError(result.error || "Please try again.");
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return <div className="space-y-lg">
    {error && <p role="alert" className="rounded-md bg-error/10 p-md text-body text-error">{error}</p>}
    {!subscribed && <div className="grid gap-lg sm:grid-cols-2">
      {(Object.entries(BILLING_PLANS) as Array<[BillingPlan, typeof BILLING_PLANS[BillingPlan]]>).map(([key, plan]) => (
        <section key={key} className={`flex flex-col rounded-lg border bg-white p-xl ${selectedPlan === key ? "border-skyBlue ring-2 ring-skyBlue/20" : "border-paleGray"}`}>
          <h2 className="font-heading text-h2 text-navy">{plan.name}</h2>
          <p className="my-md text-charcoal"><span className="font-heading text-display text-navy">${plan.amount / 100}</span> /{plan.interval}</p>
          <ul className="mb-lg flex-1 space-y-sm text-body text-charcoal">{plan.features.map((feature) => <li key={feature}>✓ {feature}</li>)}</ul>
          <button disabled={busy} onClick={() => run(key)} className="min-h-[44px] rounded-md bg-navy px-lg py-md text-body font-semibold text-white disabled:opacity-50">{busy ? "Please wait…" : `Choose ${plan.name}`}</button>
        </section>
      ))}
    </div>}
    <p className="text-body text-charcoal/70">Subscriptions renew automatically. Cancel anytime through Manage billing. Platform access requires an active subscription.</p>
    {hasCustomer && <button disabled={busy} onClick={() => run()} className="min-h-[44px] rounded-md border border-navy px-lg py-sm text-body font-semibold text-navy disabled:opacity-50">Manage billing</button>}
  </div>;
}
