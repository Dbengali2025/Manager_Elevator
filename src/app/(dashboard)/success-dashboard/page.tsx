"use client";

import { useEffect, useState, useCallback } from "react";
import JourneyProgressBar from "@/components/dashboard/JourneyProgressBar";
import CircularProgressRing from "@/components/dashboard/CircularProgressRing";
import {
  getSuccessDashboardData,
  checkAndUnlockMilestones,
  type SuccessDashboardData,
} from "@/actions/success-dashboard";
import type { MilestoneType, ProgressStage } from "@/db/types";

// ---------------------------------------------------------------------------
// Milestone config
// ---------------------------------------------------------------------------

interface MilestoneConfig {
  type: MilestoneType;
  title: string;
  subtitle: string;
  requirementText: string;
  requiredStages: ProgressStage[];
  progressLabel: (completed: number, total: number) => string;
  gradient: string;
  iconBg: string;
}

const MILESTONE_CONFIGS: MilestoneConfig[] = [
  {
    type: "waste_eliminator",
    title: "Most Valuable Workplace Waste Eliminator",
    subtitle: "Unlocks affiliate revenue opportunities",
    requirementText: "Complete 4 modules + 1st Waste WAR Battle",
    requiredStages: ["module_1", "module_2", "module_3", "module_4", "battle_1"],
    progressLabel: (c, t) => `${c} of ${t} requirements completed`,
    gradient: "from-[#08376B] via-[#1a5a8f] to-[#2F90B0]",
    iconBg: "bg-white/20",
  },
  {
    type: "ci_consultant",
    title: "Certified CI Done Right Consultant",
    subtitle: "Unlocks consulting opportunities",
    requirementText: "Complete 2nd and 3rd Waste WAR Battles",
    requiredStages: ["battle_2", "battle_3"],
    progressLabel: (c, t) => `${c} of ${t} battles completed`,
    gradient: "from-[#2F90B0] via-[#4da89f] to-[#9AEBA6]",
    iconBg: "bg-white/20",
  },
];

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function StarIcon() {
  return (
    <svg className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      className="h-8 w-8 text-white"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      className="h-5 w-5 text-white/50"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}

function UnlockedStarIcon() {
  return (
    <svg className="h-5 w-5 text-yellow-300" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function UnlockedShieldIcon() {
  return (
    <svg
      className="h-5 w-5 text-emerald-300"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Milestone Card
// ---------------------------------------------------------------------------

function MilestoneCard({
  config,
  completedCount,
  isUnlocked,
}: {
  config: MilestoneConfig;
  completedCount: number;
  isUnlocked: boolean;
}) {
  const total = config.requiredStages.length;
  const progressPercent = total > 0 ? (completedCount / total) * 100 : 0;

  return (
    <div
      className={`relative overflow-hidden rounded-lg bg-gradient-to-br ${config.gradient} p-lg text-white shadow-md`}
    >
      {/* Icon + lock/unlock indicator */}
      <div className="flex items-start justify-between mb-md">
        <div className={`${config.iconBg} rounded-lg p-sm`}>
          {config.type === "waste_eliminator" ? <StarIcon /> : <ShieldIcon />}
        </div>
        <div className="rounded-lg bg-white/15 p-sm">
          {isUnlocked ? (
            config.type === "waste_eliminator" ? (
              <UnlockedStarIcon />
            ) : (
              <UnlockedShieldIcon />
            )
          ) : (
            <LockIcon />
          )}
        </div>
      </div>

      {/* Title + subtitle */}
      <h3 className="font-heading text-xl font-medium mb-xs">{config.title}</h3>
      <p className="text-sm text-white/70 mb-lg">{config.subtitle}</p>

      {/* Requirement box */}
      <div className="rounded-md bg-white/15 p-md">
        <p className="text-xs uppercase tracking-wider text-white/60 mb-xs">
          Requirement to Unlock
        </p>
        <p className="text-sm font-semibold">{config.requirementText}</p>

        {/* Progress bar */}
        <div className="mt-sm h-1.5 w-full rounded-full bg-white/20">
          <div
            className="h-1.5 rounded-full bg-white transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <p className="mt-xs text-xs text-white/60">
          {config.progressLabel(completedCount, total)}
        </p>
      </div>

      {/* Unlocked celebration overlay */}
      {isUnlocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px] rounded-lg">
          <div className="text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/30 mb-sm">
              {config.type === "waste_eliminator" ? (
                <svg className="h-8 w-8 text-yellow-300" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              ) : (
                <svg className="h-8 w-8 text-emerald-300" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              )}
            </div>
            <p className="text-lg font-heading font-medium">Milestone Unlocked!</p>
            <p className="text-sm text-white/80 mt-xs">{config.title}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-lg">
      <div className="h-8 w-64 bg-paleGray rounded" />
      <div className="h-4 w-80 bg-paleGray rounded" />
      <div className="h-32 bg-white rounded-lg" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
        <div className="h-64 bg-paleGray rounded-lg" />
        <div className="h-64 bg-paleGray rounded-lg" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SuccessDashboardPage() {
  const [data, setData] = useState<SuccessDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const result = await getSuccessDashboardData();
    if (result.success && result.data) {
      setData(result.data);
    } else {
      setError(result.error ?? "Failed to load dashboard data");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Check milestones on load
  useEffect(() => {
    if (!data) return;
    checkAndUnlockMilestones().then((result) => {
      if (result.unlocked.length > 0) {
        // Re-fetch to reflect newly unlocked milestones
        fetchData();
      }
    }).catch(() => {
      // Milestone check is non-critical
    });
  }, [data?.progressRecords, fetchData]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <LoadingSkeleton />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="rounded-lg bg-white p-2xl text-center shadow-sm">
          <p className="text-charcoal/60">{error ?? "Something went wrong"}</p>
        </div>
      </div>
    );
  }

  const completedStages = new Set(
    data.progressRecords.filter((p) => p.status === "completed").map((p) => p.stage)
  );

  // Compute quick stats from progress records
  const modulesCompleted = (["module_1", "module_2", "module_3", "module_4"] as const).filter(
    (s) => completedStages.has(s)
  ).length;
  const battlesWon = (["battle_1", "battle_2", "battle_3"] as const).filter(
    (s) => completedStages.has(s)
  ).length;

  return (
    <div className="max-w-6xl mx-auto space-y-lg">
      {/* Page header */}
      <div>
        <h1 className="font-heading text-h1 text-charcoal">
          CI Done Right Success Dashboard
        </h1>
        <p className="text-body text-charcoal/60 mt-xs">
          Track your achievements and unlock revenue opportunities
        </p>
      </div>

      {/* Journey Progress Bar */}
      <JourneyProgressBar progressRecords={data.progressRecords} />

      {/* Milestone Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
        {MILESTONE_CONFIGS.map((config) => {
          const completedCount = config.requiredStages.filter((stage) =>
            completedStages.has(stage)
          ).length;
          const milestone = data.milestones.find(
            (m) => m.milestone_type === config.type
          );
          const isUnlocked = milestone?.unlocked ?? false;

          return (
            <MilestoneCard
              key={config.type}
              config={config}
              completedCount={completedCount}
              isUnlocked={isUnlocked}
            />
          );
        })}
      </div>

      {/* Quick Stats - Circular Progress Rings */}
      <div className="rounded-lg bg-white p-xl shadow-sm">
        <h2 className="font-heading text-h2 text-charcoal mb-lg text-center">
          Quick Stats
        </h2>
        <div className="flex flex-wrap justify-center gap-xl sm:gap-2xl">
          <CircularProgressRing
            value={modulesCompleted}
            total={4}
            label="Modules Completed"
            color="stroke-skyBlue"
            colorHex="#35C0ED"
          />
          <CircularProgressRing
            value={data.sessionsCompleted}
            total={14}
            label="Sessions Completed"
            color="stroke-teal"
            colorHex="#2F90B0"
          />
          <CircularProgressRing
            value={battlesWon}
            total={3}
            label="Battles Won"
            color="stroke-mintGreen"
            colorHex="#9AEBA6"
          />
        </div>
      </div>
    </div>
  );
}
