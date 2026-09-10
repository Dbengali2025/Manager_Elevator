"use client";

import { useEffect, useState } from "react";
import { getComplimentaryAccess, setComplimentaryAccess } from "@/actions/billing";

export default function ComplimentaryAccess({ userId }: { userId: string }) {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let current = true;
    getComplimentaryAccess(userId).then((result) => {
      if (!current) return;
      if (result.error) setError(result.error);
      else setEnabled(result.enabled ?? false);
    }).catch(() => { if (current) setError("Unable to load billing access."); });
    return () => { current = false; };
  }, [userId]);
  async function toggle() {
    setBusy(true);
    setError("");
    try {
      const result = await setComplimentaryAccess(userId, !enabled);
      if (result.error) setError(result.error);
      else setEnabled(result.enabled ?? false);
    } catch { setError("Unable to update access."); }
    finally { setBusy(false); }
  }
  return <section className="rounded-md border border-paleGray bg-white p-md">
    <h3 className="font-heading text-h3 text-navy">Membership access</h3>
    <p className="my-sm text-body text-charcoal/70">{enabled ? "Complimentary access is enabled." : "An active paid subscription is required."} This setting does not cancel or change Stripe charges.</p>
    <button disabled={enabled === null || busy} onClick={toggle} className="min-h-[44px] rounded-md border border-navy px-md text-body text-navy disabled:opacity-50">{busy ? "Saving…" : enabled ? "Remove complimentary access" : "Grant complimentary access"}</button>
    {error && <p role="alert" className="mt-sm text-body text-error">{error}</p>}
  </section>;
}
