import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutAction } from "@/actions/auth";
import { confirmCheckout } from "@/actions/billing";
import { getBillingAccess, getBillingUser, findBillingCustomer } from "@/lib/billing";
import { BILLING_PLANS, isBillingPlan } from "@/lib/billing-plans";
import BillingControls from "@/components/billing/BillingControls";

export const dynamic = "force-dynamic";

export default async function BillingPage({ searchParams }: { searchParams: { session_id?: string; canceled?: string; plan?: string } }) {
  const user = await getBillingUser();
  if (!user) redirect("/login");
  let notice = "";
  if (typeof searchParams.session_id === "string") {
    try {
      const confirmed = await confirmCheckout(searchParams.session_id);
      notice = confirmed ? "Checkout received. Your access status is shown below." : "Payment has not been confirmed for this account. Refresh to check again.";
    } catch {
      notice = "We’re still confirming your payment. Refresh this page shortly; you do not need to pay again.";
    }
  }
  let access;
  let customer;
  try {
    [access, customer] = await Promise.all([getBillingAccess(), findBillingCustomer(user.id)]);
  } catch {
    return <main className="mx-auto max-w-2xl p-xl"><h1 className="font-heading text-h1 text-navy">Billing is temporarily unavailable</h1><p className="my-lg">Please try again shortly or contact Dana for help.</p><Link href="/billing" className="inline-flex min-h-[44px] items-center text-navy underline">Try again</Link></main>;
  }
  const subscription = access.subscriptions.find((s) => !["canceled", "incomplete_expired"].includes(s.status));
  return <main className="min-h-screen bg-offWhite px-md py-xl sm:px-lg">
    <div className="mx-auto max-w-3xl space-y-lg">
      <header className="flex items-center justify-between gap-md">
        <Link href="/" className="font-heading text-h2 text-navy">Manager Elevator</Link>
        <form action={async () => { "use server"; await logoutAction(); redirect("/login"); }}><button className="min-h-[44px] px-sm text-body text-navy">Log out</button></form>
      </header>
      <h1 className="font-heading text-h1 text-navy">{access.allowed ? "Your membership" : "Choose your membership"}</h1>
      <p className="text-body text-charcoal/70">Signed in as {user.email}</p>
      {notice && <p role="status" className="rounded-md bg-skyBlue/10 p-md text-body text-navy">{notice}</p>}
      {searchParams.canceled === "1" && <p role="status" className="text-body text-charcoal">Checkout was canceled. You can choose a plan when you’re ready.</p>}
      {access.allowed && <div className="rounded-lg bg-mintGreen/30 p-lg">
        <p className="mb-md text-body text-navy">{user.isAdmin ? "Administrator access" : access.complimentary ? "You have complimentary access." : "Your membership is active."}</p>
        <Link href={user.onboardingCompleted ? "/dashboard" : "/onboarding"} className="inline-flex min-h-[44px] items-center rounded-md bg-navy px-lg py-sm text-body text-white">Continue to Manager Elevator</Link>
      </div>}
      {subscription && <section className="rounded-lg border border-paleGray bg-white p-lg text-body text-charcoal">
        <p>{subscription.plan ? BILLING_PLANS[subscription.plan].name : "Subscription"} · {subscription.status.replaceAll("_", " ")}</p>
        <p className="mt-sm">{subscription.cancel_at_period_end ? "Access ends" : "Current billing period ends"}: {new Date(subscription.current_period_end).toLocaleDateString("en-US", { timeZone: "UTC" })}</p>
        {!access.allowed && <p className="mt-sm">Use Manage billing to resolve your payment and restore access.</p>}
      </section>}
      <BillingControls hasCustomer={!!customer} subscribed={!!subscription || access.allowed} selectedPlan={isBillingPlan(searchParams.plan) ? searchParams.plan : undefined} />
    </div>
  </main>;
}
