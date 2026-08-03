"use client";

import { SURVEY_SECTIONS, RATING_SCALE, ALL_QUESTIONS } from "@/lib/value-survey";

/**
 * The 16-statement Manager Value Self-Assessment. Shared by the onboarding
 * baseline and the 90/270/360-day retakes so both stay identical — the scores
 * are only comparable over time if the instrument does not change.
 */
export default function ValueSurveyForm({
  answers,
  onAnswerChange,
}: {
  answers: Record<string, number>;
  onAnswerChange: (questionId: string, value: number) => void;
}) {
  let questionNumber = 0;

  return (
    <div className="space-y-xl">
      {SURVEY_SECTIONS.map((section, sectionIndex) => (
        <div key={section.key}>
          <h3 className="font-heading text-h3 text-navy mb-xs">
            Section {sectionIndex + 1}: {section.title}
          </h3>
          <div className="h-px bg-paleGray mb-md" />

          <div className="space-y-lg">
            {section.questions.map((q) => {
              questionNumber += 1;
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
        </div>
      ))}
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
