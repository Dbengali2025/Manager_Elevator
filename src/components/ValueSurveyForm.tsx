"use client";

import { useRef, useState } from "react";
import { SURVEY_SECTIONS, RATING_SCALE, ALL_QUESTIONS } from "@/lib/value-survey";

/**
 * The 16-statement Manager Value Self-Assessment. Shared by the onboarding
 * baseline and the 90/270/360-day retakes so both stay identical — the scores
 * are only comparable over time if the instrument does not change.
 *
 * Sections are shown one at a time with Previous/Next navigation (the full
 * 16-statement list scrolled far off screen). The parent keeps the submit
 * button, which stays disabled until every statement is answered.
 */
export default function ValueSurveyForm({
  answers,
  onAnswerChange,
}: {
  answers: Record<string, number>;
  onAnswerChange: (questionId: string, value: number) => void;
}) {
  const [sectionIndex, setSectionIndex] = useState(0);
  const topRef = useRef<HTMLDivElement>(null);

  const section = SURVEY_SECTIONS[sectionIndex];
  const totalSections = SURVEY_SECTIONS.length;
  const isLastSection = sectionIndex === totalSections - 1;

  // Questions are numbered continuously across sections (Section 2 starts at 5)
  const firstQuestionNumber = SURVEY_SECTIONS.slice(0, sectionIndex).reduce(
    (sum, s) => sum + s.questions.length,
    0
  );

  const sectionAnswered = (idx: number) =>
    SURVEY_SECTIONS[idx].questions.filter(
      (q) => typeof answers[q.id] === "number"
    ).length;

  const goToSection = (idx: number) => {
    setSectionIndex(idx);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div ref={topRef} className="scroll-mt-lg">
      {/* Section progress header */}
      <div className="flex items-center justify-between mb-sm">
        <span className="text-caption font-medium text-charcoal/50">
          Section {sectionIndex + 1} of {totalSections}
        </span>
        <span className="text-caption text-charcoal/40">
          {sectionAnswered(sectionIndex)} of {section.questions.length} answered
          in this section
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-paleGray mb-lg">
        <div
          className="h-1.5 rounded-full bg-skyBlue transition-all"
          style={{ width: `${((sectionIndex + 1) / totalSections) * 100}%` }}
        />
      </div>

      <h3 className="font-heading text-h3 text-navy mb-xs">
        Section {sectionIndex + 1}: {section.title}
      </h3>
      <div className="h-px bg-paleGray mb-md" />

      <div className="space-y-lg">
        {section.questions.map((q, qIdx) => {
          const questionNumber = firstQuestionNumber + qIdx + 1;
          const current = answers[q.id];

          return (
            <fieldset key={q.id}>
              <legend className="text-body text-charcoal mb-sm">
                <span className="font-medium">{questionNumber}.</span> {q.text}
              </legend>

              <div className="flex flex-wrap gap-xs" role="radiogroup" aria-label={q.text}>
                {RATING_SCALE.map((option) => {
                  const selected = current === option.value;
                  return (
                    <label
                      key={option.value}
                      title={option.label}
                      className={`flex-1 min-w-[64px] cursor-pointer rounded-md border px-xs py-sm text-center transition-colors ${
                        selected
                          ? "border-skyBlue bg-skyBlue/10"
                          : "border-paleGray hover:border-skyBlue/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        value={option.value}
                        checked={selected}
                        onChange={() => onAnswerChange(q.id, option.value)}
                        className="sr-only"
                      />
                      <span
                        className={`block text-body font-semibold ${
                          selected ? "text-skyBlue" : "text-charcoal"
                        }`}
                      >
                        {option.value}
                      </span>
                      <span
                        className={`block text-caption leading-tight ${
                          selected ? "text-skyBlue" : "text-charcoal/50"
                        }`}
                      >
                        {option.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          );
        })}
      </div>

      {/* Section navigation */}
      <div className="mt-xl flex items-center justify-between">
        <button
          type="button"
          onClick={() => goToSection(Math.max(0, sectionIndex - 1))}
          disabled={sectionIndex === 0}
          className="rounded-md px-md py-sm text-body font-medium text-charcoal/60 hover:text-charcoal disabled:opacity-30 disabled:cursor-not-allowed min-h-[44px]"
        >
          Previous
        </button>

        <div className="flex gap-1.5">
          {SURVEY_SECTIONS.map((s, idx) => {
            const complete = sectionAnswered(idx) === SURVEY_SECTIONS[idx].questions.length;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => goToSection(idx)}
                title={`Section ${idx + 1}: ${s.title}`}
                className={`h-2.5 w-2.5 rounded-full transition-colors ${
                  idx === sectionIndex
                    ? "bg-skyBlue"
                    : complete
                      ? "bg-skyBlue/40"
                      : "bg-paleGray"
                }`}
              />
            );
          })}
        </div>

        {!isLastSection ? (
          <button
            type="button"
            onClick={() => goToSection(sectionIndex + 1)}
            className="rounded-md bg-skyBlue px-lg py-sm text-body font-medium text-white hover:bg-skyBlue/90 min-h-[44px]"
          >
            Next
          </button>
        ) : (
          <span className="px-md py-sm" aria-hidden="true" />
        )}
      </div>
    </div>
  );
}

export function SurveyProgressNote({ answers }: { answers: Record<string, number> }) {
  const answered = ALL_QUESTIONS.filter((q) => typeof answers[q.id] === "number").length;
  return (
    <span className="text-caption text-charcoal/60">
      {answered} of {ALL_QUESTIONS.length} answered
    </span>
  );
}
