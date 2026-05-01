"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  getMasterclassData,
  toggleSessionCompletion,
  getLessonResources,
} from "@/actions/masterclass";
import { MODULES, WAR_BATTLE_SESSIONS } from "@/lib/masterclass-data";
import { MODULE_QUIZZES } from "@/lib/quiz-data";
import type { MasterclassData, LessonResource } from "@/actions/masterclass";
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

function DownloadIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
      <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
      <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
    </svg>
  );
}

function PaperclipIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M15.621 4.379a3 3 0 00-4.242 0l-7 7a3 3 0 004.241 4.243h.001l.497-.5a.75.75 0 011.064 1.057l-.498.501-.002.002a4.5 4.5 0 01-6.364-6.364l7-7a4.5 4.5 0 016.368 6.36l-3.455 3.553A2.625 2.625 0 119.52 9.52l3.45-3.451a.75.75 0 111.061 1.06l-3.45 3.451a1.125 1.125 0 001.587 1.595l3.454-3.553a3 3 0 000-4.242z" clipRule="evenodd" />
    </svg>
  );
}

const FILE_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  docx: { label: "DOCX", color: "bg-blue-100 text-blue-700" },
  doc: { label: "DOC", color: "bg-blue-100 text-blue-700" },
  pdf: { label: "PDF", color: "bg-red-100 text-red-700" },
  pptx: { label: "PPTX", color: "bg-orange-100 text-orange-700" },
  ppt: { label: "PPT", color: "bg-orange-100 text-orange-700" },
  xlsx: { label: "XLSX", color: "bg-green-100 text-green-700" },
  xls: { label: "XLS", color: "bg-green-100 text-green-700" },
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ResourceItem({ resource }: { resource: LessonResource }) {
  const typeConfig = FILE_TYPE_CONFIG[resource.file_type] ?? {
    label: resource.file_type.toUpperCase(),
    color: "bg-charcoal/10 text-charcoal/70",
  };

  const downloadUrl = `/api/resources/download?path=${encodeURIComponent(resource.storage_path)}&name=${encodeURIComponent(resource.file_name)}`;

  return (
    <a
      href={downloadUrl}
      className="flex items-center gap-sm px-sm py-xs rounded-md hover:bg-offWhite transition-colors group"
    >
      <span
        className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold ${typeConfig.color}`}
      >
        {typeConfig.label}
      </span>
      <span className="flex-1 text-caption text-charcoal/80 group-hover:text-charcoal truncate">
        {resource.display_name}
      </span>
      <span className="text-[11px] text-charcoal/40 flex-shrink-0">
        {formatFileSize(resource.file_size)}
      </span>
      <span className="text-charcoal/30 group-hover:text-skyBlue flex-shrink-0 transition-colors">
        <DownloadIcon />
      </span>
    </a>
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

function VimeoEmbed({ vimeoId, title }: { vimeoId: string; title: string }) {
  return (
    <div style={{ padding: "56.25% 0 0 0", position: "relative" }}>
      <iframe
        src={`https://player.vimeo.com/video/${vimeoId}?title=0&byline=0&portrait=0&badge=0&autopause=0&player_id=0&app_id=58479`}
        frameBorder="0"
        allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
        }}
        title={title}
      />
    </div>
  );
}

function PlayIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M2 10a8 8 0 1116 0 8 8 0 01-16 0zm6.39-2.908a.75.75 0 01.766.027l3.5 2.25a.75.75 0 010 1.262l-3.5 2.25A.75.75 0 018 12.25v-4.5a.75.75 0 01.39-.658z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function LessonRow({
  lesson,
  moduleNumber,
  resources,
}: {
  lesson: { number: number; title: string; vimeoId: string };
  moduleNumber: number;
  resources: LessonResource[];
}) {
  const lessonResources = resources.filter(
    (r) => r.module_number === moduleNumber && r.lesson_number === lesson.number
  );
  const [showResources, setShowResources] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const hasResources = lessonResources.length > 0;

  return (
    <li>
      <div className="flex items-start gap-sm text-body text-charcoal/80">
        <span className="mt-[2px] flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-skyBlue/10 text-[10px] font-medium text-skyBlue">
          {lesson.number}
        </span>
        <span className="flex-1">{lesson.title}</span>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={() => setShowVideo(!showVideo)}
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors min-h-[28px] ${
              showVideo
                ? "bg-skyBlue/20 text-skyBlue"
                : "bg-skyBlue/10 text-skyBlue hover:bg-skyBlue/20"
            }`}
          >
            <PlayIcon />
            Video
          </button>
          {hasResources && (
            <button
              type="button"
              onClick={() => setShowResources(!showResources)}
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium bg-teal/10 text-teal hover:bg-teal/20 transition-colors min-h-[28px]"
            >
              <PaperclipIcon />
              {lessonResources.length}
            </button>
          )}
        </div>
      </div>
      {showVideo && (
        <div className="ml-7 mt-xs mb-sm rounded-lg overflow-hidden border border-paleGray">
          <VimeoEmbed
            vimeoId={lesson.vimeoId}
            title={`Module ${moduleNumber} Lesson ${lesson.number}`}
          />
        </div>
      )}
      {hasResources && showResources && (
        <div className="ml-7 mt-xs mb-sm rounded-md border border-paleGray bg-offWhite/50 p-sm space-y-0.5">
          {lessonResources.map((resource) => (
            <ResourceItem key={resource.id} resource={resource} />
          ))}
        </div>
      )}
    </li>
  );
}

// ---------------------------------------------------------------------------
// Quiz component
// ---------------------------------------------------------------------------

function QuizIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.94 6.94a.75.75 0 11-1.061-1.061 3 3 0 112.871 5.026v.345a.75.75 0 01-1.5 0v-.5c0-.72.57-1.172 1.081-1.287A1.5 1.5 0 108.94 6.94zM10 15a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
    </svg>
  );
}

function ModuleQuizSection({ moduleNumber }: { moduleNumber: number }) {
  const quiz = MODULE_QUIZZES.find((q) => q.moduleNumber === moduleNumber);

  const [started, setStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);

  if (!quiz) return null;

  const question = quiz.questions[currentQuestion];
  const totalQuestions = quiz.questions.length;
  const answeredCount = Object.keys(selectedAnswers).length;

  const score = submitted
    ? quiz.questions.filter((q) => selectedAnswers[q.id] === q.correctAnswer).length
    : 0;
  const percentage = submitted ? Math.round((score / totalQuestions) * 100) : 0;
  const passed = percentage >= quiz.passThreshold;

  const handleSelect = (questionId: number, answer: string) => {
    if (submitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = () => {
    if (answeredCount < totalQuestions) return;
    setSubmitted(true);
  };

  const handleRetake = () => {
    setSelectedAnswers({});
    setSubmitted(false);
    setCurrentQuestion(0);
  };

  if (!started) {
    return (
      <div className="mt-md rounded-lg border-2 border-dashed border-skyBlue/30 bg-skyBlue/5 p-lg">
        <div className="flex items-center gap-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-skyBlue/10 text-skyBlue">
            <QuizIcon />
          </div>
          <h4 className="font-heading text-h3 text-charcoal">
            Module {moduleNumber} Quiz
          </h4>
        </div>
        <p className="mt-sm text-body text-charcoal/60">
          {totalQuestions} multiple choice questions. Score 80% or higher to complete this module.
        </p>
        <button
          type="button"
          onClick={() => setStarted(true)}
          className="mt-md inline-flex items-center gap-sm rounded-md bg-skyBlue px-lg py-sm min-h-[44px] text-body font-medium text-white transition-colors hover:bg-skyBlue/90"
        >
          <QuizIcon />
          Start Quiz
        </button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="mt-md rounded-lg border-2 border-paleGray bg-white p-lg">
        <div className={`rounded-lg p-lg text-center ${passed ? "bg-success/10" : "bg-red-50"}`}>
          <div className={`text-h1 font-heading ${passed ? "text-success" : "text-red-600"}`}>
            {percentage}%
          </div>
          <p className={`text-body font-medium ${passed ? "text-success" : "text-red-600"}`}>
            {score} of {totalQuestions} correct
          </p>
          <p className={`mt-xs text-body ${passed ? "text-success/80" : "text-red-500"}`}>
            {passed
              ? "Congratulations! You\u2019ve successfully completed this module!"
              : `You need 80% to pass. Review the lessons and try again.`}
          </p>
        </div>

        {/* Review answers */}
        <div className="mt-lg space-y-md">
          <h4 className="font-heading text-h3 text-charcoal">Review Answers</h4>
          {quiz.questions.map((q, idx) => {
            const selected = selectedAnswers[q.id];
            const isCorrect = selected === q.correctAnswer;
            return (
              <div key={q.id} className={`rounded-md border p-md ${isCorrect ? "border-success/30 bg-success/5" : "border-red-200 bg-red-50/50"}`}>
                <p className="text-caption font-medium text-charcoal/50">
                  Question {idx + 1} ({q.lessonRef})
                </p>
                <p className="mt-xs text-body text-charcoal">{q.question}</p>
                <div className="mt-sm space-y-xs">
                  {q.options.map((opt) => {
                    const isSelected = selected === opt.label;
                    const isAnswer = opt.label === q.correctAnswer;
                    return (
                      <div
                        key={opt.label}
                        className={`rounded-md px-sm py-xs text-body ${
                          isAnswer
                            ? "bg-success/10 text-success font-medium"
                            : isSelected && !isAnswer
                              ? "bg-red-100 text-red-700 line-through"
                              : "text-charcoal/60"
                        }`}
                      >
                        {opt.label}) {opt.text}
                        {isAnswer && " \u2713"}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {!passed && (
          <button
            type="button"
            onClick={handleRetake}
            className="mt-lg inline-flex items-center gap-sm rounded-md bg-skyBlue px-lg py-sm min-h-[44px] text-body font-medium text-white transition-colors hover:bg-skyBlue/90"
          >
            Retake Quiz
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="mt-md rounded-lg border-2 border-paleGray bg-white p-lg">
      {/* Progress bar */}
      <div className="flex items-center justify-between mb-sm">
        <span className="text-caption font-medium text-charcoal/50">
          Question {currentQuestion + 1} of {totalQuestions}
        </span>
        <span className="text-caption text-charcoal/40">
          {answeredCount} answered
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-paleGray mb-lg">
        <div
          className="h-1.5 rounded-full bg-skyBlue transition-all"
          style={{ width: `${((currentQuestion + 1) / totalQuestions) * 100}%` }}
        />
      </div>

      {/* Question */}
      <p className="text-caption font-medium text-skyBlue mb-xs">{question.lessonRef}</p>
      <p className="text-body text-charcoal whitespace-pre-line">{question.question}</p>

      {/* Options */}
      <div className="mt-md space-y-sm">
        {question.options.map((opt) => {
          const isSelected = selectedAnswers[question.id] === opt.label;
          return (
            <button
              key={opt.label}
              type="button"
              onClick={() => handleSelect(question.id, opt.label)}
              className={`w-full text-left rounded-lg border-2 p-md transition-colors min-h-[44px] ${
                isSelected
                  ? "border-skyBlue bg-skyBlue/5"
                  : "border-paleGray hover:border-skyBlue/30 hover:bg-skyBlue/5"
              }`}
            >
              <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-caption font-bold mr-sm ${
                isSelected ? "bg-skyBlue text-white" : "bg-charcoal/10 text-charcoal/50"
              }`}>
                {opt.label}
              </span>
              <span className="text-body text-charcoal">{opt.text}</span>
            </button>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="mt-lg flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
          disabled={currentQuestion === 0}
          className="rounded-md px-md py-sm text-body font-medium text-charcoal/60 hover:text-charcoal disabled:opacity-30 disabled:cursor-not-allowed min-h-[44px]"
        >
          Previous
        </button>

        <div className="flex gap-1">
          {quiz.questions.map((q, idx) => (
            <button
              key={q.id}
              type="button"
              onClick={() => setCurrentQuestion(idx)}
              className={`h-2 w-2 rounded-full transition-colors ${
                idx === currentQuestion
                  ? "bg-skyBlue"
                  : selectedAnswers[q.id]
                    ? "bg-skyBlue/40"
                    : "bg-paleGray"
              }`}
            />
          ))}
        </div>

        {currentQuestion < totalQuestions - 1 ? (
          <button
            type="button"
            onClick={() => setCurrentQuestion(currentQuestion + 1)}
            className="rounded-md px-md py-sm text-body font-medium text-skyBlue hover:text-skyBlue/80 min-h-[44px]"
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={answeredCount < totalQuestions}
            className="rounded-md bg-skyBlue px-lg py-sm text-body font-medium text-white hover:bg-skyBlue/90 disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]"
          >
            Submit Quiz
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Module card component
// ---------------------------------------------------------------------------

function ModuleCard({
  module,
  status,
  isCurrentModule,
  resources,
}: {
  module: (typeof MODULES)[number];
  status: ModuleStatus;
  isCurrentModule: boolean;
  resources: LessonResource[];
}) {
  const [open, setOpen] = useState(isCurrentModule);

  const moduleResources = resources.filter(
    (r) => r.module_number === module.number
  );
  const totalResources = moduleResources.length;

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
          {totalResources > 0 && (
            <span className="inline-flex items-center gap-1 text-caption text-teal">
              <PaperclipIcon />
              {totalResources}
            </span>
          )}
          <span className="text-caption text-charcoal/40">
            {module.lessons.length} Lessons
          </span>
          <ChevronDownIcon open={open} />
        </div>
      </button>

      {open && (
        <div className="border-t border-paleGray px-lg pb-lg">
          {/* Welcome video */}
          <div className="mt-md">
            <p className="text-caption font-medium text-charcoal/60 mb-xs">
              Welcome to Module {module.number}
            </p>
            <div className="rounded-lg overflow-hidden border border-paleGray">
              <VimeoEmbed
                vimeoId={module.welcomeVimeoId}
                title={`Welcome to Module ${module.number}`}
              />
            </div>
          </div>

          {/* Lessons */}
          <ul className="mt-md space-y-sm">
            {module.lessons.map((lesson) => (
              <LessonRow
                key={lesson.number}
                lesson={lesson}
                moduleNumber={module.number}
                resources={resources}
              />
            ))}
          </ul>

          {/* Module Quiz */}
          <ModuleQuizSection moduleNumber={module.number} />
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
// Downloads summary section
// ---------------------------------------------------------------------------

function DownloadsSection({ resources }: { resources: LessonResource[] }) {
  if (resources.length === 0) {
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
        {resources.length} resource{resources.length !== 1 ? "s" : ""} available across your lessons.
        Look for the <span className="inline-flex items-center gap-0.5 text-teal font-medium"><PaperclipIcon /> clip</span> icon next to each lesson to access its tools and templates.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Masterclass page
// ---------------------------------------------------------------------------

export default function MasterclassPage() {
  const [data, setData] = useState<MasterclassData | null>(null);
  const [resources, setResources] = useState<LessonResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toggleLoading, setToggleLoading] = useState<number | null>(null);
  const router = useRouter();

  const loadData = useCallback(async () => {
    try {
      const [result, resourcesResult] = await Promise.all([
        getMasterclassData(),
        getLessonResources(),
      ]);
      if (result.success && result.data) {
        setData(result.data);
      } else if (result.error === "Not authenticated") {
        router.push("/login");
        return;
      } else {
        console.error("[Masterclass] Load failed:", result.error);
      }
      if (resourcesResult.success && resourcesResult.data) {
        setResources(resourcesResult.data);
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
              resources={resources}
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

      {/* Downloads summary */}
      <DownloadsSection resources={resources} />
    </div>
  );
}
