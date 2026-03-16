"use client";

import { useEffect, useState, useCallback } from "react";
import { WAR_BATTLE_SESSIONS } from "@/lib/masterclass-data";
import {
  getWarBattleSessions,
  markSessionComplete,
  saveSessionLink,
} from "@/actions/trackers";
import type { WarBattleSession, BattleSessionStatus } from "@/db/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SessionRow {
  week: number;
  name: string;
  battle: number;
  status: BattleSessionStatus;
  dateCompleted: string | null;
  powerpointLink: string | null;
  isActive: boolean;
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  BattleSessionStatus,
  { label: string; bg: string; text: string }
> = {
  done: { label: "Done", bg: "bg-success/10", text: "text-success" },
  active: { label: "Active", bg: "bg-skyBlue/10", text: "text-skyBlue" },
  pending: { label: "Pending", bg: "bg-paleGray", text: "text-charcoal/50" },
};

function StatusBadge({ status }: { status: BattleSessionStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-sm py-[2px] text-caption font-medium ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Link cell
// ---------------------------------------------------------------------------

function LinkCell({
  week,
  link,
  onSave,
}: {
  week: number;
  link: string | null;
  onSave: (week: number, value: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(link ?? "");

  useEffect(() => {
    setValue(link ?? "");
  }, [link]);

  if (editing) {
    return (
      <div className="flex items-center gap-xs">
        <input
          type="url"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Paste URL..."
          className="w-full min-w-[140px] rounded-md border border-paleGray px-sm py-[4px] text-caption focus:border-skyBlue focus:ring-1 focus:ring-skyBlue outline-none"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onSave(week, value);
              setEditing(false);
            }
            if (e.key === "Escape") {
              setValue(link ?? "");
              setEditing(false);
            }
          }}
        />
        <button
          onClick={() => {
            onSave(week, value);
            setEditing(false);
          }}
          className="shrink-0 rounded-md bg-navy px-sm py-[4px] text-caption text-white hover:bg-navy/90"
        >
          Save
        </button>
        <button
          onClick={() => {
            setValue(link ?? "");
            setEditing(false);
          }}
          className="shrink-0 text-caption text-charcoal/50 hover:text-charcoal"
        >
          Cancel
        </button>
      </div>
    );
  }

  if (link) {
    return (
      <div className="flex items-center gap-xs">
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-caption text-skyBlue hover:underline truncate max-w-[160px]"
        >
          {link}
        </a>
        <button
          onClick={() => setEditing(true)}
          className="shrink-0 text-charcoal/40 hover:text-charcoal"
          title="Edit link"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-charcoal/40 hover:text-skyBlue"
          title="Open link"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="text-caption text-charcoal/40 italic hover:text-charcoal/60"
    >
      No file yet
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function WarBattleTracker() {
  const [sessions, setSessions] = useState<WarBattleSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<number | null>(null);

  const fetchSessions = useCallback(async () => {
    const result = await getWarBattleSessions();
    if (result.success && result.data) {
      setSessions(result.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Build row data: merge WAR_BATTLE_SESSIONS definitions with actual DB records
  const rows: SessionRow[] = WAR_BATTLE_SESSIONS.map((def) => {
    const dbRecord = sessions.find((s) => s.week_number === def.week);
    const status: BattleSessionStatus = dbRecord?.status ?? "pending";

    return {
      week: def.week,
      name: def.name,
      battle: def.battle,
      status,
      dateCompleted: dbRecord?.date_completed ?? null,
      powerpointLink: dbRecord?.powerpoint_link ?? null,
      isActive: false, // computed below
    };
  });

  // Determine active row: the first non-done session
  const firstPendingIndex = rows.findIndex((r) => r.status !== "done");
  if (firstPendingIndex >= 0) {
    rows[firstPendingIndex].isActive = true;
    rows[firstPendingIndex].status = "active";
  }

  async function handleMarkComplete(week: number) {
    setCompleting(week);
    const result = await markSessionComplete(week);
    if (result.success) {
      await fetchSessions();
    }
    setCompleting(null);
  }

  async function handleSaveLink(week: number, value: string) {
    await saveSessionLink(week, value);
    await fetchSessions();
  }

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return "\u2014";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-paleGray bg-white p-2xl text-center">
        <div className="animate-pulse space-y-md">
          <div className="h-4 bg-paleGray rounded w-1/3 mx-auto" />
          <div className="h-32 bg-paleGray/50 rounded" />
        </div>
      </div>
    );
  }

  const doneCount = rows.filter((r) => r.status === "done").length;

  return (
    <div className="space-y-lg">
      {/* Progress summary */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-body text-charcoal/60">
            <span className="font-semibold text-charcoal">{doneCount}</span> of{" "}
            <span className="font-semibold text-charcoal">14</span> sessions
            completed
          </p>
        </div>
        <div className="h-2 w-32 rounded-full bg-paleGray overflow-hidden">
          <div
            className="h-full rounded-full bg-skyBlue transition-all duration-300"
            style={{ width: `${(doneCount / 14) * 100}%` }}
          />
        </div>
      </div>

      {/* Sessions table */}
      <div className="overflow-x-auto rounded-lg border border-paleGray bg-white">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-paleGray bg-offWhite">
              <th className="px-md py-sm text-left text-caption font-semibold text-charcoal/70 w-[60px] sticky left-0 bg-offWhite z-10">
                Week #
              </th>
              <th className="px-md py-sm text-left text-caption font-semibold text-charcoal/70">
                Session Name
              </th>
              <th className="px-md py-sm text-left text-caption font-semibold text-charcoal/70 w-[140px]">
                PowerPoint Link
              </th>
              <th className="px-md py-sm text-left text-caption font-semibold text-charcoal/70 w-[110px]">
                Date Completed
              </th>
              <th className="px-md py-sm text-left text-caption font-semibold text-charcoal/70 w-[90px]">
                Status
              </th>
              <th className="px-md py-sm text-right text-caption font-semibold text-charcoal/70 w-[110px]">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const isEven = i % 2 === 0;
              const isActiveRow = row.isActive;
              return (
                <tr
                  key={row.week}
                  className={`border-b border-paleGray last:border-0 transition-colors ${
                    isActiveRow
                      ? "bg-skyBlue/5"
                      : isEven
                        ? "bg-white"
                        : "bg-offWhite/50"
                  }`}
                >
                  <td className={`px-md py-sm text-body text-charcoal font-medium sticky left-0 z-10 ${
                    isActiveRow ? "bg-skyBlue/5" : isEven ? "bg-white" : "bg-offWhite/50"
                  }`}>
                    {row.week}
                  </td>
                  <td className="px-md py-sm">
                    <span className="text-body text-charcoal">
                      {row.name}
                      {row.battle > 1 && (
                        <span className="ml-sm inline-flex items-center whitespace-nowrap rounded-full bg-teal/10 px-xs py-[1px] text-[10px] font-medium text-teal align-middle">
                          Battle {row.battle}
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-md py-sm">
                    <LinkCell
                      week={row.week}
                      link={row.powerpointLink}
                      onSave={handleSaveLink}
                    />
                  </td>
                  <td className="px-md py-sm text-body text-charcoal/70">
                    {formatDate(row.dateCompleted)}
                  </td>
                  <td className="px-md py-sm">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="px-md py-sm text-right">
                    {isActiveRow && (
                      <button
                        onClick={() => handleMarkComplete(row.week)}
                        disabled={completing === row.week}
                        className="inline-flex items-center gap-xs rounded-md bg-navy px-sm py-[6px] min-h-[36px] text-caption text-white hover:bg-navy/90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                      >
                        {completing === row.week ? (
                          <>
                            <svg
                              className="animate-spin h-3 w-3"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                              />
                            </svg>
                            Saving...
                          </>
                        ) : (
                          <>
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            Mark Complete
                          </>
                        )}
                      </button>
                    )}
                    {row.status === "done" && (
                      <span className="inline-flex items-center gap-xs text-caption text-success">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                          <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                        Completed
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* How It Works info box */}
      <div className="rounded-lg border border-skyBlue/20 bg-skyBlue/5 p-lg">
        <div className="flex gap-md">
          <div className="shrink-0 mt-[2px]">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-skyBlue"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
          </div>
          <div>
            <h4 className="text-body font-semibold text-charcoal">
              How It Works
            </h4>
            <ul className="mt-sm space-y-xs text-caption text-charcoal/70">
              <li>
                1. Work through each session following the Masterclass lessons
              </li>
              <li>
                2. Paste your PowerPoint or file link for each completed session
              </li>
              <li>
                3. Click &quot;Mark Complete&quot; when you finish the active
                session
              </li>
              <li>
                4. Sessions advance automatically &mdash; your next session
                becomes active
              </li>
              <li>
                5. Complete all 14 sessions across 3 battles to earn your
                milestones
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
