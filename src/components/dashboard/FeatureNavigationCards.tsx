"use client";

import { useRouter } from "next/navigation";
import type { UserProgress } from "@/db/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FeatureNavigationCardsProps {
  onboardingCompleted: boolean;
  progressRecords: UserProgress[];
}

type FeatureStatus = "complete" | "in_progress" | "up_next" | "locked";

interface FeatureCard {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  getStatus: (
    onboardingCompleted: boolean,
    progressRecords: UserProgress[]
  ) => FeatureStatus;
}

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

function hasCompletedStage(
  progressRecords: UserProgress[],
  stage: string
): boolean {
  return progressRecords.some(
    (r) => r.stage === stage && r.status === "completed"
  );
}

function hasAnySession(progressRecords: UserProgress[]): boolean {
  // User has completed at least one module session (any module stage in_progress or completed)
  return progressRecords.some(
    (r) =>
      r.stage.startsWith("module_") &&
      (r.status === "completed" || r.status === "in_progress")
  );
}

function hasCompletedFirstModule(progressRecords: UserProgress[]): boolean {
  return hasCompletedStage(progressRecords, "module_1");
}

// ---------------------------------------------------------------------------
// Status tag component
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  FeatureStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  complete: {
    label: "Complete",
    bg: "bg-success/10",
    text: "text-success",
    border: "border-success",
  },
  in_progress: {
    label: "In Progress",
    bg: "bg-skyBlue/10",
    text: "text-skyBlue",
    border: "border-skyBlue",
  },
  up_next: {
    label: "Up Next",
    bg: "bg-warning/10",
    text: "text-warning",
    border: "border-warning",
  },
  locked: {
    label: "Locked",
    bg: "bg-paleGray/50",
    text: "text-charcoal/40",
    border: "border-paleGray",
  },
};

function StatusTag({ status }: { status: FeatureStatus }) {
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
// Icons
// ---------------------------------------------------------------------------

function CheckCircleIcon() {
  return (
    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#2E7D4F" opacity="0.15" />
      <path
        d="M9 12l2 2 4-4"
        stroke="#2E7D4F"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="#2E7D4F"
        strokeWidth="1.5"
        fill="none"
      />
    </svg>
  );
}

function GraduationCapIcon() {
  return (
    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="6" fill="#35C0ED" opacity="0.15" />
      <path
        d="M12 7l-7 3.5 7 3.5 7-3.5L12 7z"
        stroke="#35C0ED"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M7 12v4c0 1.1 2.24 2 5 2s5-.9 5-2v-4"
        stroke="#35C0ED"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="6" fill="#2F90B0" opacity="0.15" />
      <path
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"
        stroke="#2F90B0"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <rect
        x="9"
        y="3"
        width="6"
        height="4"
        rx="1"
        stroke="#2F90B0"
        strokeWidth="1.5"
      />
      <path
        d="M9 12l2 2 4-4"
        stroke="#2F90B0"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="6" fill="#D4940A" opacity="0.15" />
      <path
        d="M6 9H4.5a2.5 2.5 0 010-5H6"
        stroke="#D4940A"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M18 9h1.5a2.5 2.5 0 000-5H18"
        stroke="#D4940A"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M4 22h16"
        stroke="#D4940A"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"
        stroke="#D4940A"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"
        stroke="#D4940A"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M18 2H6v7a6 6 0 0012 0V2z"
        stroke="#D4940A"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="6" fill="#08376B" opacity="0.15" />
      <path
        d="M12 3c-4.97 0-9 3.13-9 7 0 2.38 1.46 4.5 3.74 5.84L5 21l4.16-2.5C10.06 18.83 11.01 19 12 19c4.97 0 9-3.13 9-7s-4.03-7-9-7z"
        stroke="#08376B"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="8.5" cy="10" r="1" fill="#08376B" />
      <circle cx="12" cy="10" r="1" fill="#08376B" />
      <circle cx="15.5" cy="10" r="1" fill="#08376B" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="6" fill="#E8ECF0" />
      <rect
        x="6"
        y="11"
        width="12"
        height="8"
        rx="2"
        stroke="#9CA3AF"
        strokeWidth="1.5"
      />
      <path
        d="M8 11V8a4 4 0 118 0v3"
        stroke="#9CA3AF"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Feature definitions
// ---------------------------------------------------------------------------

const FEATURES: FeatureCard[] = [
  {
    id: "onboarding",
    title: "Onboarding",
    description: "Get started with the platform basics",
    href: "/onboarding",
    icon: <CheckCircleIcon />,
    getStatus: (onboardingCompleted, progressRecords) => {
      if (onboardingCompleted || hasCompletedStage(progressRecords, "onboarding"))
        return "complete";
      return "in_progress";
    },
  },
  {
    id: "masterclass",
    title: "Masterclass",
    description: "Learn CI methodologies and tools",
    href: "/masterclass",
    icon: <GraduationCapIcon />,
    getStatus: (onboardingCompleted, progressRecords) => {
      if (!onboardingCompleted && !hasCompletedStage(progressRecords, "onboarding"))
        return "locked";
      // Check if all 4 modules completed
      const allModulesComplete = ["module_1", "module_2", "module_3", "module_4"].every(
        (s) => hasCompletedStage(progressRecords, s)
      );
      if (allModulesComplete) return "complete";
      // Check if any module has progress
      if (hasAnySession(progressRecords)) return "in_progress";
      return "up_next";
    },
  },
  {
    id: "trackers",
    title: "CI Trackers",
    description: "Track your improvement projects",
    href: "/trackers",
    icon: <ClipboardIcon />,
    getStatus: (onboardingCompleted, progressRecords) => {
      // Unlock after 1st session (any module in_progress or completed)
      if (!hasAnySession(progressRecords)) return "locked";
      return "up_next";
    },
  },
  {
    id: "success-dashboard",
    title: "Success Dashboard",
    description: "Visualize your achievements",
    href: "/success-dashboard",
    icon: <TrophyIcon />,
    getStatus: (_onboardingCompleted, progressRecords) => {
      // Unlock after 1st module complete
      if (!hasCompletedFirstModule(progressRecords)) return "locked";
      return "up_next";
    },
  },
  {
    id: "ci-professor",
    title: "CI Professor",
    description: "AI-powered guidance assistant",
    href: "/ci-professor",
    icon: <ChatIcon />,
    getStatus: (onboardingCompleted, progressRecords) => {
      if (!onboardingCompleted && !hasCompletedStage(progressRecords, "onboarding"))
        return "locked";
      return "up_next";
    },
  },
];

// ---------------------------------------------------------------------------
// Card border accent color by status
// ---------------------------------------------------------------------------

function getCardBorderColor(status: FeatureStatus): string {
  switch (status) {
    case "complete":
      return "border-t-4 border-t-success";
    case "in_progress":
      return "border-t-4 border-t-skyBlue";
    case "up_next":
      return "border-t-4 border-t-transparent";
    case "locked":
      return "border-t-4 border-t-transparent";
  }
}

// ---------------------------------------------------------------------------
// FeatureNavigationCards
// ---------------------------------------------------------------------------

export default function FeatureNavigationCards({
  onboardingCompleted,
  progressRecords,
}: FeatureNavigationCardsProps) {
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {FEATURES.map((feature) => {
        const status = feature.getStatus(onboardingCompleted, progressRecords);
        const isLocked = status === "locked";

        return (
          <button
            key={feature.id}
            type="button"
            disabled={isLocked}
            onClick={() => {
              if (!isLocked) router.push(feature.href);
            }}
            className={`flex flex-col items-start rounded-lg bg-white p-lg shadow-sm text-left transition-shadow ${getCardBorderColor(status)} ${
              isLocked
                ? "cursor-not-allowed opacity-60"
                : "cursor-pointer hover:shadow-md"
            }`}
          >
            <div className="flex w-full items-center gap-sm">
              {isLocked ? <LockIcon /> : feature.icon}
              <StatusTag status={status} />
            </div>
            <h3 className="mt-md font-heading text-h3 text-charcoal">
              {feature.title}
            </h3>
            <p className="mt-xs text-caption text-charcoal/60">
              {feature.description}
            </p>
          </button>
        );
      })}
    </div>
  );
}
