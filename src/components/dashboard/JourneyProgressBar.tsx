"use client";

import { type ProgressStage, STAGE_ORDER, type UserProgress } from "@/db/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface JourneyProgressBarProps {
  progressRecords: UserProgress[];
}

interface StageInfo {
  key: ProgressStage;
  label: string;
  isBattle: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STAGES: StageInfo[] = [
  { key: "onboarding", label: "Onboarding", isBattle: false },
  { key: "module_1", label: "Module 1", isBattle: false },
  { key: "module_2", label: "Module 2", isBattle: false },
  { key: "module_3", label: "Module 3", isBattle: false },
  { key: "module_4", label: "Module 4", isBattle: false },
  { key: "battle_1", label: "Battle 1", isBattle: true },
  { key: "battle_2", label: "Battle 2", isBattle: true },
  { key: "battle_3", label: "Battle 3", isBattle: true },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getStageStatus(
  stage: ProgressStage,
  progressRecords: UserProgress[]
): "completed" | "active" | "future" {
  const record = progressRecords.find((r) => r.stage === stage);
  if (record?.status === "completed") return "completed";
  if (record?.status === "in_progress") return "active";

  // If no record exists, check if this is the next uncompleted stage
  const stageIndex = STAGE_ORDER.indexOf(stage);
  const allPrior = STAGE_ORDER.slice(0, stageIndex);
  const allPriorCompleted = allPrior.every((s) =>
    progressRecords.some((r) => r.stage === s && r.status === "completed")
  );

  if (allPriorCompleted && stageIndex === 0) return "active";
  if (allPriorCompleted && allPrior.length > 0) return "active";

  return "future";
}

function getStageNumber(stage: ProgressStage): number {
  return STAGE_ORDER.indexOf(stage) + 1;
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function CheckIcon() {
  return (
    <svg
      className="h-5 w-5 text-white"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? "h-5 w-5"}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9H4.5a2.5 2.5 0 010-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 000-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0012 0V2z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Stage Node
// ---------------------------------------------------------------------------

function StageNode({
  stage,
  status,
}: {
  stage: StageInfo;
  status: "completed" | "active" | "future";
}) {
  const num = getStageNumber(stage.key);

  if (status === "completed") {
    return (
      <div className="flex flex-col items-center gap-sm">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-skyBlue">
          <CheckIcon />
        </div>
        <span className="text-caption text-charcoal/70 whitespace-nowrap">
          {stage.label}
        </span>
      </div>
    );
  }

  if (status === "active") {
    return (
      <div className="flex flex-col items-center gap-sm">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-skyBlue bg-white">
          {stage.isBattle ? (
            <TrophyIcon className="h-5 w-5 text-skyBlue" />
          ) : (
            <span className="text-sm font-semibold text-skyBlue">{num}</span>
          )}
        </div>
        <span className="text-caption font-semibold text-skyBlue whitespace-nowrap">
          {stage.label}
        </span>
      </div>
    );
  }

  // Future
  return (
    <div className="flex flex-col items-center gap-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-paleGray bg-white">
        {stage.isBattle ? (
          <TrophyIcon className="h-5 w-5 text-charcoal/30" />
        ) : (
          <span className="text-sm font-semibold text-charcoal/30">{num}</span>
        )}
      </div>
      <span className="text-caption text-charcoal/40 whitespace-nowrap">
        {stage.label}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Connector Line
// ---------------------------------------------------------------------------

function ConnectorLine({ completed }: { completed: boolean }) {
  return (
    <div className="flex-1 mx-1 mt-[-12px]">
      {completed ? (
        <div className="h-0.5 w-full bg-skyBlue" />
      ) : (
        <div className="h-0.5 w-full border-t-2 border-dashed border-paleGray" />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// JourneyProgressBar
// ---------------------------------------------------------------------------

export default function JourneyProgressBar({
  progressRecords,
}: JourneyProgressBarProps) {
  const statuses = STAGES.map((s) => ({
    stage: s,
    status: getStageStatus(s.key, progressRecords),
  }));

  return (
    <div className="rounded-lg bg-white p-lg shadow-sm">
      <h2 className="font-heading text-h2 text-charcoal mb-lg">
        Your Learning Journey
      </h2>
      <div className="overflow-x-auto">
        <div className="flex items-start min-w-[600px] px-sm">
          {statuses.map((item, i) => (
            <div key={item.stage.key} className="contents">
              <StageNode stage={item.stage} status={item.status} />
              {i < statuses.length - 1 && (
                <ConnectorLine completed={item.status === "completed"} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
