// Manager Value Self-Assessment Survey
// Source: Manager_Value_Self_Assessment_Survey.docx (Transformational Growth Enterprises).
// 16 statements across 4 sections, each rated 1-5, for a maximum score of 80.

export interface SurveyQuestion {
  id: string;
  text: string;
}

export interface SurveySection {
  key: string;
  title: string;
  questions: SurveyQuestion[];
}

export const RATING_SCALE = [
  { value: 1, label: "Strongly Disagree" },
  { value: 2, label: "Disagree" },
  { value: 3, label: "Neutral" },
  { value: 4, label: "Agree" },
  { value: 5, label: "Strongly Agree" },
];

export const SURVEY_SECTIONS: SurveySection[] = [
  {
    key: "leadership",
    title: "Leadership Perception & Visibility",
    questions: [
      { id: "q1", text: "Senior leadership recognizes me as a problem-solver who brings solutions, not just problems." },
      { id: "q2", text: "I am regularly invited to participate in high-level strategic discussions and decision-making." },
      { id: "q3", text: "My contributions and achievements are acknowledged and celebrated by leadership." },
      { id: "q4", text: "Other departments seek my expertise and collaboration on strategic initiatives." },
    ],
  },
  {
    key: "team",
    title: "Team Performance & Results",
    questions: [
      { id: "q5", text: "My team consistently meets or exceeds performance targets and KPIs." },
      { id: "q6", text: "I can clearly demonstrate the financial impact and ROI of my team's improvements." },
      { id: "q7", text: "My team's performance is used as a benchmark for other departments." },
      { id: "q8", text: "I have documented evidence of process improvements that saved time or money." },
    ],
  },
  {
    key: "problem_solving",
    title: "Problem-Solving & Innovation",
    questions: [
      { id: "q9", text: "I proactively identify workplace waste and inefficiencies before they become major issues." },
      { id: "q10", text: "I have successfully led continuous improvement initiatives that delivered measurable results." },
      { id: "q11", text: "My team views me as an innovative leader who encourages creative problem-solving." },
      { id: "q12", text: "I regularly propose new ideas and solutions to senior leadership." },
    ],
  },
  {
    key: "career",
    title: "Career Advancement & Development",
    questions: [
      { id: "q13", text: "I have a clear path for career advancement with specific milestones and timelines." },
      { id: "q14", text: "Senior leadership has explicitly discussed promotion opportunities with me in the past 12 months." },
      { id: "q15", text: "I am considered a high-potential manager within my organization." },
      { id: "q16", text: "I have been given stretch assignments or special projects in the past year." },
    ],
  },
];

export const ALL_QUESTIONS = SURVEY_SECTIONS.flatMap((s) => s.questions);
export const MAX_SECTION_SCORE = 20;
export const MAX_TOTAL_SCORE = 80;

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

export interface SurveyTier {
  key: string;
  label: string;
  minScore: number;
  description: string;
}

// Ordered highest-first so the first match wins.
export const SURVEY_TIERS: SurveyTier[] = [
  {
    key: "high_value",
    label: "High Value Manager",
    minScore: 65,
    description: "You are well-positioned as a valuable manager with strong visibility and results.",
  },
  {
    key: "developing_value",
    label: "Developing Value Manager",
    minScore: 50,
    description: "You have a solid foundation but significant opportunities for improvement.",
  },
  {
    key: "emerging_value",
    label: "Emerging Value Manager",
    minScore: 35,
    description: "You have potential but need to focus on building credibility.",
  },
  {
    key: "undervalued",
    label: "Undervalued Manager",
    minScore: 0,
    description: "Your value is not being recognized.",
  },
];

export interface SurveyResult {
  sectionScores: Record<string, number>;
  totalScore: number;
  percentage: number;
  tier: SurveyTier;
}

export function scoreSurvey(answers: Record<string, number>): SurveyResult {
  const sectionScores: Record<string, number> = {};

  for (const section of SURVEY_SECTIONS) {
    sectionScores[section.key] = section.questions.reduce(
      (sum, q) => sum + (answers[q.id] ?? 0),
      0
    );
  }

  const totalScore = Object.values(sectionScores).reduce((a, b) => a + b, 0);
  const percentage = Math.round((totalScore / MAX_TOTAL_SCORE) * 100);
  const tier = SURVEY_TIERS.find((t) => totalScore >= t.minScore) ?? SURVEY_TIERS[SURVEY_TIERS.length - 1];

  return { sectionScores, totalScore, percentage, tier };
}

export function isSurveyComplete(answers: Record<string, number>): boolean {
  return ALL_QUESTIONS.every((q) => {
    const v = answers[q.id];
    return typeof v === "number" && v >= 1 && v <= 5;
  });
}

export function sectionTitle(key: string): string {
  return SURVEY_SECTIONS.find((s) => s.key === key)?.title ?? key;
}

// ---------------------------------------------------------------------------
// Retake schedule
//
// Dana tracks effectiveness by re-running the same survey at fixed intervals
// after the baseline taken during onboarding.
// ---------------------------------------------------------------------------

export interface SurveyOccasion {
  key: string;
  label: string;
  shortLabel: string;
  offsetDays: number;
}

export const BASELINE_OCCASION = "baseline";

export const SURVEY_OCCASIONS: SurveyOccasion[] = [
  { key: "baseline", label: "Baseline (Onboarding)", shortLabel: "Baseline", offsetDays: 0 },
  { key: "day_90", label: "90-Day Check-In", shortLabel: "90 days", offsetDays: 90 },
  { key: "day_270", label: "270-Day Check-In", shortLabel: "270 days", offsetDays: 270 },
  { key: "day_360", label: "360-Day Check-In", shortLabel: "360 days", offsetDays: 360 },
];

export function occasionLabel(key: string): string {
  return SURVEY_OCCASIONS.find((o) => o.key === key)?.label ?? key;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function dueDateFor(baselineCompletedAt: Date, occasionKey: string): Date | null {
  const occasion = SURVEY_OCCASIONS.find((o) => o.key === occasionKey);
  if (!occasion) return null;
  return new Date(baselineCompletedAt.getTime() + occasion.offsetDays * MS_PER_DAY);
}

/**
 * The earliest retake that is now due and not yet completed.
 * Returns null when the baseline is missing or nothing is due yet.
 */
export function getDueOccasion(
  baselineCompletedAt: Date | null,
  completedOccasions: string[],
  now: Date = new Date()
): SurveyOccasion | null {
  if (!baselineCompletedAt) return null;

  for (const occasion of SURVEY_OCCASIONS) {
    if (occasion.key === BASELINE_OCCASION) continue;
    if (completedOccasions.includes(occasion.key)) continue;

    const due = dueDateFor(baselineCompletedAt, occasion.key);
    if (due && now >= due) return occasion;
  }

  return null;
}

/** The next retake that has not happened yet, whether or not it is due. */
export function getNextOccasion(
  baselineCompletedAt: Date | null,
  completedOccasions: string[]
): { occasion: SurveyOccasion; dueDate: Date } | null {
  if (!baselineCompletedAt) return null;

  for (const occasion of SURVEY_OCCASIONS) {
    if (occasion.key === BASELINE_OCCASION) continue;
    if (completedOccasions.includes(occasion.key)) continue;

    const dueDate = dueDateFor(baselineCompletedAt, occasion.key);
    if (dueDate) return { occasion, dueDate };
  }

  return null;
}
