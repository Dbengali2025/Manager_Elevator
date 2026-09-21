"use client";

import { useCallback, useEffect, useState } from "react";
import { listPreapprovedEmails, addPreapprovedEmails, removePreapprovedEmail } from "@/actions/billing";
import type { PreapprovedEmail } from "@/actions/billing";

export default function PreapprovedEmails() {
  const [rows, setRows] = useState<PreapprovedEmail[] | null>(null);
  const [raw, setRaw] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const result = await listPreapprovedEmails();
      if (result.error) setError(result.error);
      else setRows(result.rows ?? []);
    } catch {
      setError("Unable to load pre-approved emails.");
    }
  }, []);

  useEffect(() => {
    if (open && rows === null) refresh();
  }, [open, rows, refresh]);

  async function add() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await addPreapprovedEmails(raw, note);
      if (result.error) {
        setError(result.error);
      } else {
        setMessage(`Added ${result.added}${result.skipped ? ` (${result.skipped} already listed)` : ""}.`);
        setRaw("");
        await refresh();
      }
    } catch {
      setError("Unable to add pre-approved emails.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(email: string) {
    setError("");
    setMessage("");
    try {
      const result = await removePreapprovedEmail(email);
      if (result.error) setError(result.error);
      else await refresh();
    } catch {
      setError("Unable to remove that email.");
    }
  }

  const pending = rows?.filter((r) => !r.claimed_by) ?? [];
  const claimed = rows?.filter((r) => r.claimed_by) ?? [];

  return (
    <section className="rounded-lg border border-paleGray bg-white shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-lg py-md text-left"
      >
        <div>
          <h2 className="font-heading text-h3 text-charcoal">Pre-Approved Access</h2>
          <p className="text-caption text-charcoal/60">
            Add emails for the HBCU Alumni program or testers — they get complimentary access automatically when they sign up.
          </p>
        </div>
        <span className="text-charcoal/40">{open ? "▾" : "▸"}</span>
      </button>

      {open && (
        <div className="space-y-md border-t border-paleGray px-lg py-md">
          <div className="space-y-sm">
            <textarea
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              rows={3}
              placeholder={"Paste emails — one per line, or separated by commas or spaces"}
              className="w-full rounded-md border border-paleGray bg-white px-md py-sm text-body text-charcoal focus:border-skyBlue focus:ring-skyBlue"
            />
            <div className="flex flex-wrap items-center gap-sm">
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Note (e.g., HBCU Alumni Fall 2026)"
                className="flex-1 min-w-[220px] rounded-md border border-paleGray bg-white px-md py-sm text-body text-charcoal focus:border-skyBlue focus:ring-skyBlue"
              />
              <button
                onClick={add}
                disabled={busy || !raw.trim()}
                className="min-h-[44px] rounded-md bg-navy px-md text-body font-medium text-white hover:bg-navy/90 disabled:opacity-50 transition-colors"
              >
                {busy ? "Adding…" : "Add emails"}
              </button>
            </div>
            {message && <p className="text-body text-success">{message}</p>}
            {error && <p role="alert" className="text-body text-error">{error}</p>}
          </div>

          {rows === null ? (
            <p className="text-caption text-charcoal/40">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="text-caption text-charcoal/40">No pre-approved emails yet.</p>
          ) : (
            <div className="space-y-md">
              {pending.length > 0 && (
                <EmailList
                  title={`Awaiting signup (${pending.length})`}
                  rows={pending}
                  onRemove={remove}
                />
              )}
              {claimed.length > 0 && (
                <EmailList title={`Claimed (${claimed.length})`} rows={claimed} />
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function EmailList({
  title,
  rows,
  onRemove,
}: {
  title: string;
  rows: PreapprovedEmail[];
  onRemove?: (email: string) => void;
}) {
  return (
    <div>
      <h3 className="mb-sm text-caption font-semibold text-charcoal/60">{title}</h3>
      <ul className="divide-y divide-paleGray rounded-md border border-paleGray">
        {rows.map((row) => (
          <li key={row.email} className="flex flex-wrap items-center gap-sm px-md py-sm">
            <span className="text-body text-charcoal">{row.email}</span>
            {row.note && <span className="text-caption text-charcoal/50">{row.note}</span>}
            <span className="ml-auto text-caption text-charcoal/40">
              {row.claimed_at
                ? `Claimed ${new Date(row.claimed_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                : `Added ${new Date(row.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
            </span>
            {onRemove && (
              <button
                onClick={() => onRemove(row.email)}
                className="text-caption text-error hover:underline"
              >
                Remove
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
