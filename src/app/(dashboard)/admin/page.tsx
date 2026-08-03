"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getAdminDashboardData, checkIsAdmin } from "@/actions/admin";
import type { AdminUser, AdminOverviewStats } from "@/actions/admin";
import type { UserProgress } from "@/db/types";

// ---------------------------------------------------------------------------
// Stage filter options
// ---------------------------------------------------------------------------

const STAGE_FILTERS = [
  { value: "all", label: "All Stages" },
  { value: "Not Started", label: "Not Started" },
  { value: "Onboarding", label: "Onboarding" },
  { value: "Module 1", label: "Module 1" },
  { value: "Module 2", label: "Module 2" },
  { value: "Module 3", label: "Module 3" },
  { value: "Module 4", label: "Module 4" },
  { value: "Battle 1", label: "Battle 1" },
  { value: "Battle 2", label: "Battle 2" },
  { value: "Battle 3", label: "Battle 3" },
];

const MILESTONE_FILTERS = [
  { value: "all", label: "All Milestones" },
  { value: "waste_eliminator", label: "Waste Eliminator" },
  { value: "ci_consultant", label: "CI Consultant" },
  { value: "none", label: "No Milestones" },
];

// ---------------------------------------------------------------------------
// Main Admin Page
// ---------------------------------------------------------------------------

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminOverviewStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [stageFilter, setStageFilter] = useState("all");
  const [milestoneFilter, setMilestoneFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  // Expanded user row
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      router.replace("/dashboard");
      return;
    }

    const result = await getAdminDashboardData();
    if (result.success && result.data) {
      setStats(result.data.stats);
      setUsers(result.data.users);
    } else {
      setError(result.error ?? "Failed to load admin data");
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Apply filters
  const filteredUsers = users.filter((user) => {
    if (stageFilter !== "all" && user.current_stage !== stageFilter) return false;

    if (milestoneFilter !== "all") {
      if (milestoneFilter === "none") {
        if (user.milestones.some((m) => m.unlocked)) return false;
      } else {
        if (!user.milestones.some((m) => m.milestone_type === milestoneFilter && m.unlocked)) return false;
      }
    }

    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      const lastActive = new Date(user.last_active);
      if (lastActive < filterDate) return false;
    }

    return true;
  });

  // CSV export
  const exportCSV = () => {
    const headers = [
      "Name", "Email", "HBCU Alma Mater", "Company", "Industry", "Current Stage",
      "Sessions Completed", "Last Active", "Milestones",
      "Value Baseline", "Value 90-Day", "Value 270-Day", "Value 360-Day", "Value Change",
    ];
    const scoreFor = (user: AdminUser, occasion: string) => {
      const s = user.value_surveys.find((v) => v.occasion === occasion);
      return s ? String(s.total_score) : "";
    };
    const rows = filteredUsers.map((user) => [
      user.full_name,
      user.email,
      user.hbcu_alma_mater,
      user.company_name,
      user.industry,
      user.current_stage,
      String(user.sessions_completed),
      formatDate(user.last_active),
      user.milestones
        .filter((m) => m.unlocked)
        .map((m) => formatMilestoneName(m.milestone_type))
        .join("; ") || "None",
      scoreFor(user, "baseline"),
      scoreFor(user, "day_90"),
      scoreFor(user, "day_270"),
      scoreFor(user, "day_360"),
      user.value_score_delta === null
        ? ""
        : `${user.value_score_delta > 0 ? "+" : ""}${user.value_score_delta}`,
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `manager-elevator-users-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-3xl">
        <p className="text-error text-body">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-lg">
      {/* Page header */}
      <div>
        <h1 className="font-heading text-h1 text-charcoal">Admin Dashboard</h1>
        <p className="mt-xs text-body text-charcoal/60">
          Manage users and monitor platform engagement
        </p>
      </div>

      {/* Overview stats */}
      {stats && <OverviewStats stats={stats} />}

      {/* Filters and export */}
      <div className="flex flex-wrap items-center gap-md">
        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          className="rounded-md border border-paleGray bg-white px-md py-sm text-body text-charcoal focus:border-skyBlue focus:ring-skyBlue"
        >
          {STAGE_FILTERS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <select
          value={milestoneFilter}
          onChange={(e) => setMilestoneFilter(e.target.value)}
          className="rounded-md border border-paleGray bg-white px-md py-sm text-body text-charcoal focus:border-skyBlue focus:ring-skyBlue"
        >
          {MILESTONE_FILTERS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <div className="flex items-center gap-sm">
          <label className="text-caption text-charcoal/60">Active since:</label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="rounded-md border border-paleGray bg-white px-md py-sm text-body text-charcoal focus:border-skyBlue focus:ring-skyBlue"
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter("")}
              className="text-caption text-charcoal/40 hover:text-charcoal"
            >
              Clear
            </button>
          )}
        </div>

        <div className="ml-auto">
          <button
            onClick={exportCSV}
            className="flex items-center gap-sm rounded-md bg-navy px-md py-sm text-body font-medium text-white hover:bg-navy/90 transition-colors"
          >
            <ExportIcon />
            Export CSV
          </button>
        </div>
      </div>

      {/* User count */}
      <p className="text-caption text-charcoal/60">
        Showing {filteredUsers.length} of {users.length} users
      </p>

      {/* User list table */}
      <div className="overflow-x-auto rounded-lg border border-paleGray bg-white shadow-sm">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-b border-paleGray bg-offWhite">
              <th className="px-md py-sm text-left text-caption font-semibold text-charcoal/60 sticky left-0 bg-offWhite z-10">Name</th>
              <th className="px-md py-sm text-left text-caption font-semibold text-charcoal/60">Company</th>
              <th className="px-md py-sm text-left text-caption font-semibold text-charcoal/60">Industry</th>
              <th className="px-md py-sm text-left text-caption font-semibold text-charcoal/60">Current Stage</th>
              <th className="px-md py-sm text-left text-caption font-semibold text-charcoal/60">Sessions</th>
              <th className="px-md py-sm text-left text-caption font-semibold text-charcoal/60">Value Score</th>
              <th className="px-md py-sm text-left text-caption font-semibold text-charcoal/60">Last Active</th>
              <th className="px-md py-sm text-left text-caption font-semibold text-charcoal/60">Milestones</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-md py-xl text-center text-body text-charcoal/40">
                  No users match the selected filters
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  isExpanded={expandedUserId === user.id}
                  onToggle={() => setExpandedUserId(expandedUserId === user.id ? null : user.id)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Overview Stats
// ---------------------------------------------------------------------------

function OverviewStats({ stats }: { stats: AdminOverviewStats }) {
  return (
    <div className="grid grid-cols-1 gap-md sm:grid-cols-3">
      <StatCard
        label="Total Registered Users"
        value={String(stats.totalUsers)}
        icon={<UsersIcon />}
      />
      <StatCard
        label="Active Users (7 days)"
        value={String(stats.activeUsersLast7Days)}
        icon={<ActivityIcon />}
      />
      <StatCard
        label="Onboarding Completion"
        value={`${stats.averageOnboardingRate}%`}
        icon={<CheckCircleIcon />}
      />
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-md rounded-lg border border-paleGray bg-white p-lg shadow-sm">
      <div className="flex h-[48px] w-[48px] flex-shrink-0 items-center justify-center rounded-lg bg-navy/10 text-navy">
        {icon}
      </div>
      <div>
        <p className="text-display font-heading text-charcoal">{value}</p>
        <p className="text-caption text-charcoal/60">{label}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// User Row (with expand toggle)
// ---------------------------------------------------------------------------

function UserRow({
  user,
  isExpanded,
  onToggle,
}: {
  user: AdminUser;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const unlockedMilestones = user.milestones.filter((m) => m.unlocked);

  return (
    <>
      <tr
        className="border-b border-paleGray cursor-pointer hover:bg-offWhite/50 transition-colors"
        onClick={onToggle}
      >
        <td className="px-md py-sm sticky left-0 bg-white z-10">
          <div className="flex items-center gap-sm">
            <ChevronIcon expanded={isExpanded} />
            <div>
              <p className="text-body font-medium text-charcoal">{user.full_name}</p>
              <p className="text-caption text-charcoal/40">{user.email}</p>
            </div>
          </div>
        </td>
        <td className="px-md py-sm text-body text-charcoal">{user.company_name}</td>
        <td className="px-md py-sm text-body text-charcoal">{user.industry}</td>
        <td className="px-md py-sm">
          <StageBadge stage={user.current_stage} />
        </td>
        <td className="px-md py-sm text-body text-charcoal">{user.sessions_completed} / 14</td>
        <td className="px-md py-sm">
          <ValueScoreCell user={user} />
        </td>
        <td className="px-md py-sm text-body text-charcoal">{formatDate(user.last_active)}</td>
        <td className="px-md py-sm">
          <div className="flex gap-xs">
            {unlockedMilestones.length === 0 ? (
              <span className="text-caption text-charcoal/40">None</span>
            ) : (
              unlockedMilestones.map((m) => (
                <MilestoneBadge key={m.id} type={m.milestone_type} />
              ))
            )}
          </div>
        </td>
      </tr>
      {isExpanded && (
        <tr className="border-b border-paleGray bg-offWhite">
          <td colSpan={8} className="px-lg py-md">
            <UserDetailPanel user={user} />
          </td>
        </tr>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Manager Value Self-Assessment
// ---------------------------------------------------------------------------

const VALUE_OCCASION_LABELS: Record<string, string> = {
  baseline: "Baseline",
  day_90: "90-day",
  day_270: "270-day",
  day_360: "360-day",
};

function ValueScoreCell({ user }: { user: AdminUser }) {
  const baseline = user.value_surveys.find((s) => s.occasion === "baseline");
  const latest = user.value_surveys[user.value_surveys.length - 1];

  if (!baseline) {
    return <span className="text-caption text-charcoal/40">Not taken</span>;
  }

  const delta = user.value_score_delta;

  return (
    <div className="whitespace-nowrap">
      <span className="text-body text-charcoal">{latest.total_score} / 80</span>
      {delta !== null && (
        <span
          className={`ml-xs text-caption font-medium ${
            delta > 0 ? "text-success" : delta < 0 ? "text-error" : "text-charcoal/50"
          }`}
        >
          {delta > 0 ? "+" : ""}
          {delta}
        </span>
      )}
    </div>
  );
}

function ValueSurveyPanel({ user }: { user: AdminUser }) {
  if (user.value_surveys.length === 0) {
    return (
      <div>
        <h4 className="text-caption font-semibold text-charcoal/60 mb-sm">
          Manager Value Self-Assessment
        </h4>
        <p className="text-caption text-charcoal/40">Not taken yet</p>
      </div>
    );
  }

  const baseline = user.value_surveys.find((s) => s.occasion === "baseline");

  return (
    <div>
      <h4 className="text-caption font-semibold text-charcoal/60 mb-sm">
        Manager Value Self-Assessment
      </h4>
      <div className="flex flex-wrap gap-sm">
        {user.value_surveys.map((s) => {
          const delta =
            baseline && s.occasion !== "baseline"
              ? s.total_score - baseline.total_score
              : null;
          return (
            <div
              key={s.occasion}
              className="rounded-md border border-paleGray bg-white px-md py-sm"
            >
              <p className="text-caption text-charcoal/60">
                {VALUE_OCCASION_LABELS[s.occasion] ?? s.occasion}
              </p>
              <p className="text-body font-medium text-charcoal">
                {s.total_score} / 80
                {delta !== null && (
                  <span
                    className={`ml-xs text-caption ${
                      delta > 0 ? "text-success" : delta < 0 ? "text-error" : "text-charcoal/50"
                    }`}
                  >
                    {delta > 0 ? "+" : ""}
                    {delta}
                  </span>
                )}
              </p>
              <p className="text-caption text-charcoal/50">{s.tier}</p>
              <p className="text-caption text-charcoal/40">{formatDate(s.completed_at)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// User Detail Panel (expanded view)
// ---------------------------------------------------------------------------

function UserDetailPanel({ user }: { user: AdminUser }) {
  const stageOrder = [
    "onboarding", "module_1", "module_2", "module_3", "module_4",
    "battle_1", "battle_2", "battle_3",
  ];
  const stageNames: Record<string, string> = {
    onboarding: "Onboarding",
    module_1: "Module 1",
    module_2: "Module 2",
    module_3: "Module 3",
    module_4: "Module 4",
    battle_1: "Battle 1",
    battle_2: "Battle 2",
    battle_3: "Battle 3",
  };

  const progressMap: Record<string, UserProgress> = {};
  user.progress_records.forEach((p) => { progressMap[p.stage] = p; });

  const completedSessions = user.war_sessions
    .filter((s) => s.status === "done")
    .sort((a, b) => a.week_number - b.week_number);

  return (
    <div className="space-y-md">
      {/* Manager Value Self-Assessment scores over time */}
      <ValueSurveyPanel user={user} />

      {/* Journey Stages */}
      <div>
        <h4 className="text-body font-semibold text-charcoal mb-sm">Journey Progress</h4>
        <div className="grid grid-cols-2 gap-sm sm:grid-cols-4 lg:grid-cols-8">
          {stageOrder.map((stage) => {
            const record = progressMap[stage];
            const status = record?.status ?? "not_started";
            return (
              <div
                key={stage}
                className={`rounded-md p-sm text-center text-caption ${
                  status === "completed"
                    ? "bg-success/10 text-success border border-success/20"
                    : status === "in_progress"
                    ? "bg-skyBlue/10 text-skyBlue border border-skyBlue/20"
                    : "bg-paleGray/50 text-charcoal/40 border border-paleGray"
                }`}
              >
                <p className="font-medium">{stageNames[stage]}</p>
                {record?.completed_at && (
                  <p className="mt-xs text-[10px]">{formatDate(record.completed_at)}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Session Completions */}
      {completedSessions.length > 0 && (
        <div>
          <h4 className="text-body font-semibold text-charcoal mb-sm">
            Completed Sessions ({completedSessions.length} / 14)
          </h4>
          <div className="grid grid-cols-1 gap-xs sm:grid-cols-2 lg:grid-cols-3">
            {completedSessions.map((s) => (
              <div key={s.id} className="flex items-center gap-sm rounded-md bg-white p-sm border border-paleGray">
                <span className="flex h-[24px] w-[24px] flex-shrink-0 items-center justify-center rounded-full bg-success/10 text-success text-caption font-semibold">
                  {s.week_number}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-caption text-charcoal">{s.session_name}</p>
                  {s.date_completed && (
                    <p className="text-[10px] text-charcoal/40">{formatDate(s.date_completed)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tracker Summary */}
      <div className="flex gap-lg text-caption text-charcoal/60">
        <span>Role: {user.role_title || "N/A"}</span>
        <span>Joined: {formatDate(user.last_active)}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Badge Components
// ---------------------------------------------------------------------------

function StageBadge({ stage }: { stage: string }) {
  const config: Record<string, { bg: string; text: string }> = {
    "Not Started": { bg: "bg-paleGray", text: "text-charcoal/60" },
    Onboarding: { bg: "bg-warning/10", text: "text-warning" },
    "Module 1": { bg: "bg-skyBlue/10", text: "text-skyBlue" },
    "Module 2": { bg: "bg-skyBlue/10", text: "text-skyBlue" },
    "Module 3": { bg: "bg-skyBlue/10", text: "text-skyBlue" },
    "Module 4": { bg: "bg-skyBlue/10", text: "text-skyBlue" },
    "Battle 1": { bg: "bg-teal/10", text: "text-teal" },
    "Battle 2": { bg: "bg-teal/10", text: "text-teal" },
    "Battle 3": { bg: "bg-success/10", text: "text-success" },
  };
  const c = config[stage] ?? { bg: "bg-paleGray", text: "text-charcoal/60" };

  return (
    <span className={`inline-block rounded-full px-sm py-xs text-caption font-medium ${c.bg} ${c.text}`}>
      {stage}
    </span>
  );
}

function MilestoneBadge({ type }: { type: string }) {
  const isWaste = type === "waste_eliminator";
  return (
    <span
      className={`inline-flex items-center gap-xs rounded-full px-sm py-xs text-[10px] font-medium ${
        isWaste ? "bg-skyBlue/10 text-skyBlue" : "bg-mintGreen/10 text-teal"
      }`}
      title={formatMilestoneName(type)}
    >
      {isWaste ? <StarIcon /> : <ShieldIcon />}
      {isWaste ? "WE" : "CC"}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

function LoadingSkeleton() {
  return (
    <div className="space-y-lg animate-pulse">
      <div className="h-8 w-48 rounded bg-paleGray" />
      <div className="h-4 w-72 rounded bg-paleGray" />
      <div className="grid grid-cols-1 gap-md sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-lg bg-paleGray" />
        ))}
      </div>
      <div className="h-10 w-full rounded bg-paleGray" />
      <div className="space-y-sm">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-14 rounded bg-paleGray" />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatMilestoneName(type: string): string {
  return type === "waste_eliminator"
    ? "Waste Eliminator"
    : "CI Consultant";
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`flex-shrink-0 text-charcoal/40 transition-transform ${expanded ? "rotate-90" : ""}`}
    >
      <path d="M6 4l4 4-4 4" />
    </svg>
  );
}

function ExportIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 10v3a1 1 0 001 1h10a1 1 0 001-1v-3" />
      <path d="M8 2v8M5 5l3-3 3 3" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function ActivityIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 2l2.4 4.8L18 7.6l-4 3.9 1 5.5L10 14.5 4.9 17l1-5.5-4-3.9 5.6-.8z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 1L3 5v6c0 5.5 3 8.3 7 9 4-.7 7-3.5 7-9V5l-7-4z" />
    </svg>
  );
}
