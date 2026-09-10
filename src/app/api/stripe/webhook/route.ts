import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { syncSubscription } from "@/lib/billing";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await request.text(), signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await syncSubscription(event.data.object.id);
        break;
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const subscription = event.data.object.subscription;
        if (subscription) await syncSubscription(typeof subscription === "string" ? subscription : subscription.id);
        break;
      }
      case "invoice.paid":
      case "invoice.payment_failed": {
        const subscription = event.data.object.parent?.subscription_details?.subscription;
        if (subscription) await syncSubscription(typeof subscription === "string" ? subscription : subscription.id);
        break;
      }
    }
    return NextResponse.json({ received: true });
  } catch {
    // Non-2xx lets Stripe retry transient database/API failures.
    console.error("Stripe webhook synchronization failed", event.id, event.type);
    return NextResponse.json({ error: "Unable to synchronize billing" }, { status: 500 });
  }
}
