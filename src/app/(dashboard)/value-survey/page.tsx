"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getValueSurveyStatus,
  submitValueSurvey,
  type SurveyEntry,
} from "@/actions/value-survey";
import ValueSurveyForm, { SurveyProgressNote } from "@/components/ValueSurveyForm";
import {
  isSurveyComplete,
  occasionLabel,
  sectionTitle,
  MAX_SECTION_SCORE,
  MAX_TOTAL_SCORE,
  SURVEY_SECTIONS,
} from "@/lib/value-survey";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function ValueSurveyPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<SurveyEntry[]>([]);
  const [dueOccasion, setDueOccasion] = useState<{ key: string; label: string } | null>(null);
  const [nextOccasion, setNextOccasion] = useState<{ key: string; label: string; dueDate: string } | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [justSubmitted, setJustSubmitted] = useState(false);

  async function load() {
    const status = await getValueSurveyStatus();
    if (status.success) {
      setHistory(status.history);
      setDueOccasion(status.dueOccasion);
      setNextOccasion(status.nextOccasion);
    } else {
      setError(status.error ?? "Failed to load your survey history.");
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit() {
    if (!dueOccasion) return;
    if (!isSurveyComplete(answers)) {
      setError("Please rate every statement before submitting.");
      return;
    }

    setError("");
    setSaving(true);
    const result = await submitValueSurvey(dueOccasion.key, answers);
    setSaving(false);

    if (result.success) {
      setAnswers({});
      setJustSubmitted(true);
      setLoading(true);
      await load();
    } else {
      setError(result.error ?? "Failed to save your survey. Please try again.");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-body text-charcoal/60">Loading...</div>
      </div>
    );
  }

  const baseline = history.find((h) => h.occasion === "baseline");
  const latest = history[history.length - 1];

  return (
    <div className="max-w-3xl mx-auto space-y-lg">
      <div>
        <h1 className="font-heading text-h1 text-charcoal">
          Manager Value Self-Assessment
        </h1>
        <p className="mt-xs text-body text-charcoal/60">
          Your marketplace value, measured over time. You take this at
          onboarding and again at 90, 270, and 360 days.
        </p>
      </div>

      {justSubmitted && (
        <div className="bg-success/10 border border-success/30 text-success text-body rounded-md px-md py-sm">
          Survey saved. Thank you — your progress has been recorded.
        </div>
      )}

      {error && (
        <div className="bg-error/10 border border-error/30 text-error text-body rounded-md px-md py-sm">
          {error}
        </div>
      )}

      {/* Score history */}
      {history.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-lg">
          <h2 className="font-heading text-h2 text-navy mb-md">Your scores</h2>

          <div className="space-y-md">
            {history.map((entry) => {
              const delta = baseline && entry.occasion !== "baseline"
                ? entry.totalScore - baseline.totalScore
                : null;

              return (
                <div
                  key={entry.occasion}
                  className="flex items-center justify-between gap-md border border-paleGray rounded-md px-md py-sm"
                >
                  <div className="min-w-0">
                    <p className="text-body font-medium text-charcoal">
                      {occasionLabel(entry.occasion)}
                    </p>
                    <p className="text-caption text-charcoal/60">
                      {formatDate(entry.completedAt)} · {entry.tier}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-h3 font-heading text-navy">
                      {entry.totalScore}
                      <span className="text-caption text-charcoal/50">
                        /{MAX_TOTAL_SCORE}
                      </span>
                    </p>
                    {delta !== null && (
                      <p
                        className={`text-caption font-medium ${
                          delta > 0 ? "text-success" : delta < 0 ? "text-error" : "text-charcoal/50"
                        }`}
                      >
                        {delta > 0 ? "+" : ""}
                        {delta} vs baseline
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Section breakdown of the most recent result */}
          {latest && (
            <div className="mt-lg pt-lg border-t border-paleGray">
              <h3 className="font-heading text-h3 text-charcoal mb-md">
                Section breakdown — {occasionLabel(latest.occasion)}
              </h3>
              <div className="space-y-sm">
                {SURVEY_SECTIONS.map((section) => {
                  const score = latest.sectionScores[section.key] ?? 0;
                  const pct = Math.round((score / MAX_SECTION_SCORE) * 100);
                  return (
                    <div key={section.key}>
                      <div className="flex items-center justify-between mb-xs">
                        <span className="text-caption text-charcoal/80">
                          {sectionTitle(section.key)}
                        </span>
                        <span className="text-caption text-charcoal/60">
                          {score}/{MAX_SECTION_SCORE}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-paleGray overflow-hidden">
                        <div
                          className="h-full rounded-full bg-skyBlue"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Due retake — show the form */}
      {dueOccasion ? (
        <div className="bg-white rounded-lg shadow-sm p-xl">
          <h2 className="font-heading text-h2 text-navy mb-sm">
            {dueOccasion.label}
          </h2>
          <p className="text-body text-charcoal/70 mb-md">
            Rate each statement from 1 to 5 based on how well it describes your
            situation <span className="font-medium">today</span>. Answer honestly
            rather than trying to beat your last score — the value is in an
            accurate picture.
          </p>

          <div className="bg-offWhite rounded-md px-lg py-md mb-xl">
            <p className="text-caption text-charcoal/70">
              <span className="font-medium text-charcoal">Rating scale:</span>{" "}
              1 = Strongly Disagree · 2 = Disagree · 3 = Neutral · 4 = Agree ·
              5 = Strongly Agree
            </p>
          </div>

          <ValueSurveyForm answers={answers} onAnswerChange={(id, v) =>
            setAnswers((prev) => ({ ...prev, [id]: v }))
          } />

          <div className="flex items-center justify-end gap-md mt-xl pt-lg border-t border-paleGray">
            <SurveyProgressNote answers={answers} />
            <button
              onClick={handleSubmit}
              disabled={!isSurveyComplete(answers) || saving}
              className="bg-navy text-white font-medium text-body py-sm px-xl rounded-md hover:bg-navy/90 focus:outline-none focus:ring-2 focus:ring-skyBlue disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "Saving..." : "Submit Survey"}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-lg">
          {history.length === 0 ? (
            <>
              <p className="text-body text-charcoal/70">
                You haven&apos;t taken the Manager Value Self-Assessment yet. It
                is part of onboarding — finish onboarding to set your baseline.
              </p>
              <Link
                href="/onboarding"
                className="inline-block mt-md text-body text-skyBlue hover:text-teal font-medium"
              >
                Go to onboarding
              </Link>
            </>
          ) : nextOccasion ? (
            <p className="text-body text-charcoal/70">
              You&apos;re all caught up. Your next check-in is the{" "}
              <span className="font-medium text-charcoal">{nextOccasion.label}</span>,
              available on{" "}
              <span className="font-medium text-charcoal">
                {formatDate(nextOccasion.dueDate)}
              </span>
              . We&apos;ll prompt you on your dashboard when it opens.
            </p>
          ) : (
            <p className="text-body text-charcoal/70">
              You&apos;ve completed every check-in in the series. Nice work —
              your full progression is shown above.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
