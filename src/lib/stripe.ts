import "server-only";
import Stripe from "stripe";
import type { BillingPlan } from "@/lib/billing-plans";

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe is not configured");
  return new Stripe(key, { maxNetworkRetries: 2, timeout: 15000 });
}

export function getPriceId(plan: BillingPlan) {
  const id = plan === "monthly" ? process.env.STRIPE_PRICE_MONTHLY : process.env.STRIPE_PRICE_ANNUAL;
  if (!id?.startsWith("price_")) throw new Error("Stripe price is not configured");
  return id;
}

export function getAppUrl() {
  const url = new URL(process.env.APP_URL || "http://localhost:3000");
  if (process.env.NODE_ENV === "production" && (!process.env.APP_URL || url.protocol !== "https:")) {
    throw new Error("APP_URL must be the HTTPS app URL");
  }
  return url.origin;
}
