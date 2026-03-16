"use client";

import type { UserProgress } from "@/db/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StatCardsProps {
  progressRecords: UserProgress[];
  sessionsCompleted: number;
  activeProjects: number;
  badgesEarned: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getCurrentModule(progressRecords: UserProgress[]): number {
  const moduleStages = ["module_1", "module_2", "module_3", "module_4"] as const;

  // Find the highest completed module
  let highestCompleted = 0;
  for (let i = 0; i < moduleStages.length; i++) {
    const record = progressRecords.find((r) => r.stage === moduleStages[i]);
    if (record?.status === "completed") {
      highestCompleted = i + 1;
    }
  }

  // Current module is next after highest completed, capped at 4
  if (highestCompleted >= 4) return 4;
  return highestCompleted + 1;
}

// ---------------------------------------------------------------------------
// StatCards
// ---------------------------------------------------------------------------

export default function StatCards({
  progressRecords,
  sessionsCompleted,
  activeProjects,
  badgesEarned,
}: StatCardsProps) {
  const currentModule = getCurrentModule(progressRecords);

  const stats = [
    { label: "Current Module", value: currentModule },
    { label: "Battle Sessions Completed", value: sessionsCompleted },
    { label: "Active Projects", value: activeProjects },
    { label: "Badges Earned", value: badgesEarned },
  ];

  return (
    <div className="grid grid-cols-2 gap-md lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-lg bg-white p-lg shadow-sm"
        >
          <p className="text-caption text-charcoal/60">{stat.label}</p>
          <p className="mt-xs text-display font-semibold text-charcoal">
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}
