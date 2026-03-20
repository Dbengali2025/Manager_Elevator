"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  getMasterclassData,
  toggleSessionCompletion,
} from "@/actions/masterclass";
import { MODULES, WAR_BATTLE_SESSIONS } from "@/lib/masterclass-data";
import type { MasterclassData } from "@/actions/masterclass";
import type { UserProgress, WarBattleSession } from "@/db/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ModuleStatus = "completed" | "in_progress" | "not_started";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getModuleStatus(
  stageKey: string,
  progressRecords: UserProgress[]
): ModuleStatus {
  const record = progressRecords.find((r) => r.stage === stageKey);
  if (!record) return "not_started";
  if (record.status === "completed") return "completed";
  return "in_progress";
}

function getCurrentModule(progressRecords: UserProgress[]): number {
  // Find the highest module that's in_progress or if none, the first not_started
  for (let i = 4; i >= 1; i--) {
    const status = getModuleStatus(`module_${i}`, progressRecords);
    if (status === "in_progress" || status === "completed") return i;
  }
  return 1;
}

function isSessionDone(
  weekNumber: number,
  battleNumber: number,
  sessions: WarBattleSession[]
): boolean {
  return sessions.some(
    (s) => s.week_number === weekNumber && s.battle_number === battleNumber && s.status === "done"
  );
}

function getSessionDateCompleted(
  weekNumber: number,
  battleNumber: number,
  sessions: WarBattleSession[]
): string | null {
  const session = sessions.find(
    (s) => s.week_number === weekNumber && s.battle_number === battleNumber && s.status === "done"
  );
  return session?.date_completed ?? null;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function ChevronDownIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-5 w-5 text-charcoal/40 transition-transform ${open ? "rotate-180" : ""}`}
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M12.416 3.376a.75.75 0 01.208 1.04l-5 7.5a.75.75 0 01-1.154.114l-3-3a.75.75 0 011.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 011.04-.207z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg className="ml-1 h-4 w-4 inline" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8.22 2.97a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06l2.97-2.97H3.75a.75.75 0 010-1.5h7.44L8.22 4.03a.75.75 0 010-1.06z" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M10.75 16.82A7.462 7.462 0 0115 15.5c.71 0 1.396.098 2.046.282A.75.75 0 0018 15.06V4.31a.75.75 0 00-.546-.721A9.006 9.006 0 0015 3.25a8.999 8.999 0 00-4.25 1.065V16.82zM9.25 4.315A8.999 8.999 0 005 3.25c-.85 0-1.673.118-2.454.339A.75.75 0 002 4.31v10.75a.75.75 0 00.954.721A7.462 7.462 0 015 15.5a7.46 7.46 0 014.25 1.32V4.315z" />
    </svg>
  );
}

function ToolsIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M14.5 10a4.5 4.5 0 004.284-5.882c-.105-.324-.51-.391-.752-.15L15.34 6.66a.454.454 0 01-.493.101 3.046 3.046 0 01-1.608-1.607.454.454 0 01.1-.493l2.693-2.692c.24-.241.174-.647-.15-.752a4.5 4.5 0 00-5.873 4.575c.055.873-.128 1.808-.8 2.368l-7.482 6.236a2.037 2.037 0 102.86 2.86l6.236-7.483c.56-.671 1.495-.854 2.368-.8.096.007.193.01.291.01zM5 16a1 1 0 11-2 0 1 1 0 012 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Module status badge
// ---------------------------------------------------------------------------

function ModuleStatusBadge({ status }: { status: ModuleStatus }) {
  const config = {
    completed: { label: "Complete", bg: "bg-success/10", text: "text-success" },
    in_progress: { label: "In Progress", bg: "bg-skyBlue/10", text: "text-skyBlue" },
    not_started: { label: "Not Started", bg: "bg-charcoal/10", text: "text-charcoal/70" },
  }[status];

  return (
    <span
      className={`inline-flex items-center rounded-full px-sm py-[2px] text-caption font-medium ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Module card component
// ---------------------------------------------------------------------------

function ModuleCard({
  module,
  status,
  isCurrentModule,
}: {
  module: (typeof MODULES)[number];
  status: ModuleStatus;
  isCurrentModule: boolean;
}) {
  const [open, setOpen] = useState(isCurrentModule);

  return (
    <div className="rounded-lg bg-white shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-lg text-left min-h-[44px]"
      >
        <div className="flex items-center gap-md">
          <div
            className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-white font-heading text-h3 ${
              status === "completed"
                ? "bg-success"
                : status === "in_progress"
                  ? "bg-skyBlue"
                  : "bg-charcoal/15 text-charcoal/70"
            }`}
          >
            {status === "completed" ? (
              <CheckIcon />
            ) : (
              module.number
            )}
          </div>
          <div>
            <div className="flex items-center gap-sm">
              <h3 className="font-heading text-h3 text-charcoal">
                Module {module.number}
              </h3>
              <ModuleStatusBadge status={status} />
            </div>
            <p className="mt-[2px] text-body text-charcoal/60">
              {module.title}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-sm">
          <span className="text-caption text-charcoal/40">
            {module.lessons.length} Lessons
          </span>
          <ChevronDownIcon open={open} />
        </div>
      </button>

      {open && (
        <div className="border-t border-paleGray px-lg pb-lg">
          <ul className="mt-md space-y-sm">
            {module.lessons.map((lesson) => (
              <li
                key={lesson.number}
                className="flex items-start gap-sm text-body text-charcoal/80"
              >
                <span className="mt-[2px] flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-skyBlue/10 text-[10px] font-medium text-skyBlue">
                  {lesson.number}
                </span>
                <span>{lesson.title}</span>
              </li>
            ))}
          </ul>
          <a
            href={module.miestroUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-md inline-flex items-center gap-sm rounded-md bg-navy px-lg py-sm min-h-[44px] text-body font-medium text-white transition-colors hover:bg-navy/90"
          >
            <BookIcon />
            Start Module {module.number}
            <ExternalLinkIcon />
          </a>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Battle section colors
// ---------------------------------------------------------------------------

const BATTLE_CONFIG = [
  { number: 1, label: "Battle 1", accent: "bg-skyBlue", accentLight: "bg-skyBlue/10", textColor: "text-skyBlue", borderColor: "border-skyBlue/20" },
  { number: 2, label: "Battle 2", accent: "bg-teal", accentLight: "bg-teal/10", textColor: "text-teal", borderColor: "border-teal/20" },
  { number: 3, label: "Battle 3", accent: "bg-success", accentLight: "bg-mintGreen/20", textColor: "text-success", borderColor: "border-success/20" },
];

// ---------------------------------------------------------------------------
// Single battle expandable section
// ---------------------------------------------------------------------------

function BattleSection({
  battleNumber,
  sessions,
  onToggle,
  loading,
}: {
  battleNumber: number;
  sessions: WarBattleSession[];
  onToggle: (week: number, name: string, battle: number, done: boolean) => void;
  loading: number | null;
}) {
  const [open, setOpen] = useState(battleNumber === 1);
  const config = BATTLE_CONFIG[battleNumber - 1];

  const completedCount = WAR_BATTLE_SESSIONS.filter((s) =>
    isSessionDone(s.week, battleNumber, sessions)
  ).length;
  const totalCount = WAR_BATTLE_SESSIONS.length;
  const allDone = completedCount === totalCount;

  return (
    <div className="rounded-lg bg-white shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-lg text-left min-h-[44px]"
      >
        <div className="flex items-center gap-md">
          <div
            className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-white font-heading text-h3 ${
              allDone ? "bg-success" : config.accent
            }`}
          >
            {allDone ? (
              <CheckIcon />
            ) : (
              battleNumber
            )}
          </div>
          <div>
            <div className="flex items-center gap-sm">
              <h3 className="font-heading text-h3 text-charcoal">
                {config.label}
              </h3>
              <span
                className={`inline-flex items-center rounded-full px-sm py-[2px] text-caption font-medium ${
                  allDone
                    ? "bg-success/10 text-success"
                    : completedCount > 0
                      ? "bg-skyBlue/10 text-skyBlue"
                      : "bg-charcoal/10 text-charcoal/70"
                }`}
              >
                {allDone ? "Complete" : completedCount > 0 ? "In Progress" : "Not Started"}
              </span>
            </div>
            <p className="mt-[2px] text-body text-charcoal/60">
              {completedCount} of {totalCount} sessions completed
            </p>
          </div>
        </div>
        <div className="flex items-center gap-sm">
          {/* Progress ring */}
          <div className="hidden sm:block">
            <svg className="h-8 w-8 -rotate-90" viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="13" fill="none" stroke="#E8ECF0" strokeWidth="3" />
              <circle
                cx="16"
                cy="16"
                r="13"
                fill="none"
                stroke={allDone ? "#2E7D4F" : battleNumber === 1 ? "#35C0ED" : battleNumber === 2 ? "#2F90B0" : "#2E7D4F"}
                strokeWidth="3"
                strokeDasharray={`${(completedCount / totalCount) * 81.68} 81.68`}
                strokeLinecap="round"
              />
            </svg>
          </div>
          <ChevronDownIcon open={open} />
        </div>
      </button>

      {open && (
        <div className="border-t border-paleGray divide-y divide-paleGray">
          {WAR_BATTLE_SESSIONS.map((session) => {
            const done = isSessionDone(session.week, battleNumber, sessions);
            const dateCompleted = getSessionDateCompleted(session.week, battleNumber, sessions);
            const isLoading = loading === session.week * 100 + battleNumber;

            return (
              <label
                key={`${battleNumber}-${session.week}`}
                className={`flex items-center gap-md px-lg py-md min-h-[44px] cursor-pointer transition-colors hover:bg-offWhite ${
                  done ? "bg-success/[0.03]" : ""
                }`}
              >
                <div className="relative flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={done}
                    disabled={isLoading}
                    onChange={() =>
                      onToggle(session.week, session.name, battleNumber, !done)
                    }
                    className="peer sr-only"
                  />
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
                      done
                        ? "border-success bg-success text-white"
                        : "border-paleGray bg-white"
                    } ${isLoading ? "opacity-50" : ""}`}
                  >
                    {done && <CheckIcon />}
                    {isLoading && (
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-skyBlue border-t-transparent" />
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <span className="text-caption font-medium text-charcoal/50">
                    Week {session.week}
                  </span>
                  <p
                    className={`text-body ${done ? "text-charcoal/50 line-through" : "text-charcoal"}`}
                  >
                    {session.name}
                  </p>
                </div>

                {dateCompleted && (
                  <span className="flex-shrink-0 text-caption text-charcoal/40">
                    {formatDate(dateCompleted)}
                  </span>
                )}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Session checklist — 3 expandable Battle sections
// ---------------------------------------------------------------------------

function SessionChecklist({
  sessions,
  onToggle,
  loading,
}: {
  sessions: WarBattleSession[];
  onToggle: (week: number, name: string, battle: number, done: boolean) => void;
  loading: number | null;
}) {
  return (
    <div className="space-y-md">
      {BATTLE_CONFIG.map((config) => (
        <BattleSection
          key={config.number}
          battleNumber={config.number}
          sessions={sessions}
          onToggle={onToggle}
          loading={loading}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Downloads section placeholder
// ---------------------------------------------------------------------------

function DownloadsSection() {
  return (
    <div className="rounded-lg bg-white shadow-sm p-lg">
      <div className="flex items-center gap-sm">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal/10 text-teal">
          <ToolsIcon />
        </div>
        <h3 className="font-heading text-h3 text-charcoal">
          Tools & Downloads
        </h3>
      </div>
      <p className="mt-md text-body text-charcoal/60">
        Downloadable tools and templates for each lesson are coming soon. Stay tuned!
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Masterclass page
// ---------------------------------------------------------------------------

export default function MasterclassPage() {
  const [data, setData] = useState<MasterclassData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toggleLoading, setToggleLoading] = useState<number | null>(null);
  const router = useRouter();

  const loadData = useCallback(async () => {
    try {
      const result = await getMasterclassData();
      if (result.success && result.data) {
        setData(result.data);
      } else if (result.error === "Not authenticated") {
        // Token expired and refresh failed — redirect to login
        router.push("/login");
        return;
      } else {
        console.error("[Masterclass] Load failed:", result.error);
      }
    } catch (err) {
      console.error("[Masterclass] Failed to load data:", err);
    }
    setIsLoading(false);
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleSession = async (
    week: number,
    name: string,
    battle: number,
    done: boolean
  ) => {
    if (!data) return;

    setToggleLoading(week * 100 + battle);

    // Optimistic update
    const updatedSessions = [...data.sessions];
    const existingIdx = updatedSessions.findIndex(
      (s) => s.week_number === week
    );

    if (done) {
      if (existingIdx >= 0) {
        updatedSessions[existingIdx] = {
          ...updatedSessions[existingIdx],
          status: "done",
          date_completed: new Date().toISOString(),
        };
      } else {
        updatedSessions.push({
          id: `temp-${week}`,
          user_id: "",
          battle_number: battle,
          week_number: week,
          session_name: name,
          powerpoint_link: null,
          date_completed: new Date().toISOString(),
          status: "done",
          created_at: new Date().toISOString(),
        });
      }
    } else {
      if (existingIdx >= 0) {
        updatedSessions[existingIdx] = {
          ...updatedSessions[existingIdx],
          status: "pending",
          date_completed: null,
        };
      }
    }

    setData({ ...data, sessions: updatedSessions });

    try {
      const result = await toggleSessionCompletion(week, name, battle, done);

      if (!result.success) {
        // Revert on failure
        await loadData();
      } else {
        // Reload to get updated progress records
        await loadData();
      }
    } catch (err) {
      console.error("[Masterclass] Toggle session failed:", err);
      await loadData();
    }

    setToggleLoading(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-3xl">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-skyBlue border-t-transparent" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-3xl text-center text-body text-charcoal/60">
        Failed to load masterclass data. Please try again.
      </div>
    );
  }

  const currentModule = getCurrentModule(data.progressRecords);
  const completedSessions = data.sessions.filter(
    (s) => s.status === "done"
  ).length;

  return (
    <div className="space-y-lg">
      {/* Page header */}
      <div>
        <h1 className="font-heading text-h1 text-charcoal">
          Leading Bulletproof Continuous Improvement Masterclass
        </h1>
        <p className="mt-xs text-body text-charcoal/60">
          4 Modules, 25 Lessons &mdash; Your complete CI mastery curriculum
        </p>
      </div>

      {/* Current progress indicator */}
      <div className="flex items-center gap-md rounded-lg bg-skyBlue/10 p-md">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-skyBlue text-white text-caption font-bold">
          {currentModule}
        </div>
        <div>
          <p className="text-body font-medium text-charcoal">
            Currently on Module {currentModule}
          </p>
          <p className="text-caption text-charcoal/60">
            {completedSessions} of 14 sessions completed
          </p>
        </div>
      </div>

      {/* Module cards */}
      <div className="space-y-md">
        <h2 className="font-heading text-h2 text-charcoal">Modules</h2>
        {MODULES.map((module) => {
          const status = getModuleStatus(module.stage, data.progressRecords);
          return (
            <ModuleCard
              key={module.number}
              module={module}
              status={status}
              isCurrentModule={module.number === currentModule}
            />
          );
        })}
      </div>

      {/* Session checklist */}
      <div className="space-y-md">
        <h2 className="font-heading text-h2 text-charcoal">
          14-Week WAR Battle Sessions Checklist
        </h2>
        <SessionChecklist
          sessions={data.sessions}
          onToggle={handleToggleSession}
          loading={toggleLoading}
        />
      </div>

      {/* Downloads placeholder */}
      <DownloadsSection />
    </div>
  );
}
