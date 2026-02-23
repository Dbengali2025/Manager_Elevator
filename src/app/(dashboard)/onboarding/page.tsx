"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getOnboardingUserInfo,
  saveOnboardingStep,
  saveAssessmentAnswers,
  completeOnboarding,
} from "@/actions/onboarding";

// ---------------------------------------------------------------------------
// Assessment questions
// ---------------------------------------------------------------------------

const ASSESSMENT_QUESTIONS = [
  {
    id: "q1",
    question: "How familiar are you with Lean Six Sigma?",
    options: [
      { value: "not_familiar", label: "Not familiar at all" },
      { value: "heard_of_it", label: "I've heard of it but haven't studied it" },
      { value: "very_familiar", label: "Quite familiar — I've studied or applied some concepts" },
      { value: "certified", label: "Certified or extensively trained" },
    ],
  },
  {
    id: "q2",
    question: "Have you led a continuous improvement event before?",
    options: [
      { value: "never", label: "No, never" },
      { value: "participated", label: "I've participated but not led one" },
      { value: "led_one", label: "I've led one event" },
      { value: "led_multiple", label: "I've led multiple events" },
    ],
  },
  {
    id: "q3",
    question: "How do you currently track improvement metrics?",
    options: [
      { value: "no_tracking", label: "I don't currently track metrics" },
      { value: "informal", label: "Informally — notes, mental tracking" },
      { value: "dashboards", label: "Spreadsheets or basic dashboards" },
      { value: "formal_tools", label: "Formal CI tools or enterprise systems" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Feature cards for the guided tour
// ---------------------------------------------------------------------------

const FEATURE_TOUR_CARDS = [
  {
    icon: GraduationCapIcon,
    title: "Masterclass",
    description:
      "4 comprehensive modules with 25 lessons covering CI methodology — from identifying waste to implementing winning solutions.",
  },
  {
    icon: ClipboardIcon,
    title: "CI Trackers",
    description:
      "Track your 14-week Waste WAR Battle journey, log improvement opportunities, and document your measurable wins.",
  },
  {
    icon: TrophyIcon,
    title: "Success Dashboard",
    description:
      "Visualize your progress with milestone cards, progress rings, and unlock revenue opportunities as you advance.",
  },
  {
    icon: ChatIcon,
    title: "CI Professor",
    description:
      "Your AI-powered mentor trained on the CI Done Right methodology. Ask questions and get personalized guidance anytime.",
  },
  {
    icon: StarIcon,
    title: "Success Nuggets",
    description:
      "Build a library of AI-generated achievement summaries for performance reviews and career conversations.",
  },
];

// ---------------------------------------------------------------------------
// Journey stages for the preview
// ---------------------------------------------------------------------------

const JOURNEY_STAGES = [
  { label: "Onboarding", status: "current" as const },
  { label: "Module 1", status: "future" as const },
  { label: "Module 2", status: "future" as const },
  { label: "Module 3", status: "future" as const },
  { label: "Module 4", status: "future" as const },
  { label: "Battle 1", status: "future" as const },
  { label: "Battle 2", status: "future" as const },
  { label: "Battle 3", status: "future" as const },
];

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [userName, setUserName] = useState("");
  const [assessmentAnswers, setAssessmentAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load user info and resume from saved step
  useEffect(() => {
    async function loadUser() {
      const result = await getOnboardingUserInfo();
      if (result.success) {
        if (result.onboardingCompleted) {
          router.replace("/dashboard");
          return;
        }
        setUserName(result.userName ?? "");
        // Resume from saved step (but at least 1)
        const savedStep = result.onboardingStep ?? 1;
        if (savedStep >= 1 && savedStep <= 5) {
          setCurrentStep(savedStep);
        }
      }
      setLoading(false);
    }
    loadUser();
  }, [router]);

  // ---------------------------------------------------------------------------
  // Step navigation
  // ---------------------------------------------------------------------------

  async function goToStep(step: number) {
    setCurrentStep(step);
    // Fire and forget — save step progress
    saveOnboardingStep(step).catch(console.error);
  }

  async function handleNext() {
    if (currentStep < 5) {
      await goToStep(currentStep + 1);
    }
  }

  async function handleBack() {
    if (currentStep > 1) {
      await goToStep(currentStep - 1);
    }
  }

  async function handleSkip() {
    await handleComplete();
  }

  // ---------------------------------------------------------------------------
  // Assessment save
  // ---------------------------------------------------------------------------

  async function handleAssessmentSubmit() {
    // Ensure all questions answered
    if (Object.keys(assessmentAnswers).length < ASSESSMENT_QUESTIONS.length) {
      return;
    }

    setSaving(true);
    const result = await saveAssessmentAnswers(assessmentAnswers);
    setSaving(false);

    if (result.success) {
      setCurrentStep(3);
    }
  }

  // ---------------------------------------------------------------------------
  // Complete onboarding
  // ---------------------------------------------------------------------------

  async function handleComplete() {
    setSaving(true);
    const result = await completeOnboarding();
    setSaving(false);

    if (result.success) {
      router.push("/dashboard");
    }
  }

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-body text-charcoal/60">Loading...</div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress indicator */}
      <div className="mb-xl">
        <div className="flex items-center justify-between mb-sm">
          <h2 className="text-caption font-medium text-charcoal/60 uppercase tracking-wide">
            Step {currentStep} of 5
          </h2>
          <button
            onClick={handleSkip}
            className="text-caption text-charcoal/40 hover:text-charcoal/60 transition-colors"
          >
            Skip onboarding
          </button>
        </div>
        <div className="flex gap-xs">
          {[1, 2, 3, 4, 5].map((step) => (
            <div
              key={step}
              className={`h-1 flex-1 rounded-full transition-colors ${
                step <= currentStep ? "bg-skyBlue" : "bg-paleGray"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="bg-white rounded-lg shadow-sm p-xl">
        {currentStep === 1 && (
          <StepWelcome userName={userName} onNext={handleNext} />
        )}
        {currentStep === 2 && (
          <StepAssessment
            answers={assessmentAnswers}
            onAnswerChange={(qId, value) =>
              setAssessmentAnswers((prev) => ({ ...prev, [qId]: value }))
            }
            onSubmit={handleAssessmentSubmit}
            onBack={handleBack}
            saving={saving}
          />
        )}
        {currentStep === 3 && (
          <StepFeatureTour onNext={handleNext} onBack={handleBack} />
        )}
        {currentStep === 4 && (
          <StepMiestroLink onNext={handleNext} onBack={handleBack} />
        )}
        {currentStep === 5 && (
          <StepDashboardPreview
            onComplete={handleComplete}
            onBack={handleBack}
            saving={saving}
          />
        )}
      </div>
    </div>
  );
}

// ===========================================================================
// Step 1: Welcome
// ===========================================================================

function StepWelcome({
  userName,
  onNext,
}: {
  userName: string;
  onNext: () => void;
}) {
  const firstName = userName.split(" ")[0] || "there";

  return (
    <div className="text-center">
      {/* Welcome icon */}
      <div className="mx-auto w-[72px] h-[72px] rounded-full bg-skyBlue/10 flex items-center justify-center mb-lg">
        <svg
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-skyBlue"
        >
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </div>

      <h1 className="font-heading text-h1 text-navy mb-sm">
        Welcome to the Manager Elevator, {firstName}.
      </h1>
      <p className="text-body text-charcoal/70 max-w-lg mx-auto mb-xl leading-relaxed">
        Let&apos;s elevate your career through continuous improvement mastery.
        We&apos;ll walk you through a quick setup to personalize your experience
        and get you started on your CI journey.
      </p>

      <div className="bg-offWhite rounded-md p-lg mb-xl text-left max-w-md mx-auto">
        <h3 className="font-heading text-h3 text-charcoal mb-sm">
          Here&apos;s what we&apos;ll cover:
        </h3>
        <ul className="space-y-sm">
          {[
            "Quick CI experience assessment",
            "Feature overview and guided tour",
            "Masterclass account connection",
            "Your learning journey preview",
          ].map((item, i) => (
            <li key={i} className="flex items-center gap-sm text-body text-charcoal/80">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-skyBlue/20 text-skyBlue text-caption flex items-center justify-center font-medium">
                {i + 1}
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={onNext}
        className="bg-navy text-white font-medium text-body py-sm px-xl rounded-md hover:bg-navy/90 focus:outline-none focus:ring-2 focus:ring-skyBlue transition-colors"
      >
        Get Started
      </button>
    </div>
  );
}

// ===========================================================================
// Step 2: CI Assessment
// ===========================================================================

function StepAssessment({
  answers,
  onAnswerChange,
  onSubmit,
  onBack,
  saving,
}: {
  answers: Record<string, string>;
  onAnswerChange: (questionId: string, value: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  saving: boolean;
}) {
  const allAnswered = Object.keys(answers).length >= ASSESSMENT_QUESTIONS.length;

  return (
    <div>
      <h1 className="font-heading text-h1 text-navy mb-sm">
        CI Experience Assessment
      </h1>
      <p className="text-body text-charcoal/70 mb-lg">
        Help us understand your continuous improvement background. This helps us
        personalize your experience. Don&apos;t worry — there are no wrong answers!
      </p>

      <div className="space-y-xl">
        {ASSESSMENT_QUESTIONS.map((q, qIndex) => (
          <div key={q.id}>
            <p className="text-body font-medium text-charcoal mb-md">
              {qIndex + 1}. {q.question}
            </p>
            <div className="space-y-sm">
              {q.options.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center gap-md p-md rounded-md border cursor-pointer transition-colors ${
                    answers[q.id] === option.value
                      ? "border-skyBlue bg-skyBlue/5"
                      : "border-paleGray hover:border-skyBlue/50"
                  }`}
                >
                  <input
                    type="radio"
                    name={q.id}
                    value={option.value}
                    checked={answers[q.id] === option.value}
                    onChange={() => onAnswerChange(q.id, option.value)}
                    className="w-4 h-4 text-skyBlue border-paleGray focus:ring-skyBlue"
                  />
                  <span className="text-body text-charcoal">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-xl pt-lg border-t border-paleGray">
        <button
          onClick={onBack}
          className="text-body text-charcoal/60 hover:text-charcoal transition-colors"
        >
          Back
        </button>
        <button
          onClick={onSubmit}
          disabled={!allAnswered || saving}
          className="bg-navy text-white font-medium text-body py-sm px-xl rounded-md hover:bg-navy/90 focus:outline-none focus:ring-2 focus:ring-skyBlue disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? "Saving..." : "Continue"}
        </button>
      </div>
    </div>
  );
}

// ===========================================================================
// Step 3: Feature Tour
// ===========================================================================

function StepFeatureTour({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div>
      <h1 className="font-heading text-h1 text-navy mb-sm">
        Your CI Toolkit
      </h1>
      <p className="text-body text-charcoal/70 mb-lg">
        Here&apos;s everything you&apos;ll have access to on your journey to
        becoming a CI Done Right expert.
      </p>

      <div className="grid gap-md sm:grid-cols-2">
        {FEATURE_TOUR_CARDS.map((card) => (
          <div
            key={card.title}
            className="rounded-md border border-paleGray p-lg hover:border-skyBlue/40 transition-colors"
          >
            <div className="flex items-center gap-sm mb-sm">
              <div className="w-10 h-10 rounded-md bg-skyBlue/10 flex items-center justify-center">
                <card.icon />
              </div>
              <h3 className="font-heading text-h3 text-charcoal">
                {card.title}
              </h3>
            </div>
            <p className="text-body text-charcoal/70 leading-relaxed">
              {card.description}
            </p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-xl pt-lg border-t border-paleGray">
        <button
          onClick={onBack}
          className="text-body text-charcoal/60 hover:text-charcoal transition-colors"
        >
          Back
        </button>
        <button
          onClick={onNext}
          className="bg-navy text-white font-medium text-body py-sm px-xl rounded-md hover:bg-navy/90 focus:outline-none focus:ring-2 focus:ring-skyBlue transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

// ===========================================================================
// Step 4: Miestro Account Link
// ===========================================================================

function StepMiestroLink({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div>
      <h1 className="font-heading text-h1 text-navy mb-sm">
        Connect Your Masterclass Account
      </h1>
      <p className="text-body text-charcoal/70 mb-lg">
        Your course content is hosted on Miestro. Link your account to access
        all 25 lessons and 14 sessions.
      </p>

      <div className="bg-offWhite rounded-md p-lg mb-lg">
        <div className="flex items-start gap-md">
          <div className="w-10 h-10 rounded-md bg-teal/10 flex items-center justify-center flex-shrink-0 mt-xs">
            <LinkIcon />
          </div>
          <div>
            <h3 className="font-heading text-h3 text-charcoal mb-xs">
              How to connect your Miestro account
            </h3>
            <ol className="space-y-sm text-body text-charcoal/80 list-decimal list-inside">
              <li>
                Visit the Miestro platform using the button below
              </li>
              <li>
                Create an account or log in with the same email you used here
              </li>
              <li>
                Enroll in the &quot;Leading Bulletproof Continuous Improvement
                Masterclass&quot;
              </li>
              <li>
                Come back here and start tracking your progress
              </li>
            </ol>
          </div>
        </div>
      </div>

      <a
        href="https://miestro.com"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-sm bg-teal text-white font-medium text-body py-sm px-lg rounded-md hover:bg-teal/90 transition-colors mb-lg"
      >
        Go to Miestro
        <ExternalLinkIcon />
      </a>

      <p className="text-caption text-charcoal/50 mb-lg">
        You can always link your account later from the Settings page.
      </p>

      <div className="flex items-center justify-between pt-lg border-t border-paleGray">
        <button
          onClick={onBack}
          className="text-body text-charcoal/60 hover:text-charcoal transition-colors"
        >
          Back
        </button>
        <button
          onClick={onNext}
          className="bg-navy text-white font-medium text-body py-sm px-xl rounded-md hover:bg-navy/90 focus:outline-none focus:ring-2 focus:ring-skyBlue transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

// ===========================================================================
// Step 5: Dashboard Preview
// ===========================================================================

function StepDashboardPreview({
  onComplete,
  onBack,
  saving,
}: {
  onComplete: () => void;
  onBack: () => void;
  saving: boolean;
}) {
  return (
    <div>
      <h1 className="font-heading text-h1 text-navy mb-sm">
        Your Learning Journey
      </h1>
      <p className="text-body text-charcoal/70 mb-lg">
        Here&apos;s a preview of the path ahead. You&apos;ll progress through 4
        modules and 3 Waste WAR Battles to earn your milestones.
      </p>

      {/* Journey preview */}
      <div className="bg-offWhite rounded-md p-lg mb-lg">
        <div className="flex items-center overflow-x-auto pb-sm gap-xs">
          {JOURNEY_STAGES.map((stage, i) => (
            <div key={stage.label} className="flex items-center flex-shrink-0">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-caption font-medium ${
                    stage.status === "current"
                      ? "bg-skyBlue text-white"
                      : "bg-paleGray text-charcoal/50"
                  }`}
                >
                  {stage.status === "current" ? (
                    <CheckCircleIcon />
                  ) : i >= 5 ? (
                    <TrophySmallIcon />
                  ) : (
                    i + 1
                  )}
                </div>
                <span className={`mt-xs text-caption whitespace-nowrap ${
                  stage.status === "current"
                    ? "text-skyBlue font-medium"
                    : "text-charcoal/50"
                }`}>
                  {stage.label}
                </span>
              </div>
              {i < JOURNEY_STAGES.length - 1 && (
                <div
                  className={`w-8 h-px mx-xs ${
                    stage.status === "current" ? "bg-skyBlue" : "border-t border-dashed border-paleGray"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Milestone cards preview */}
      <div className="grid gap-md sm:grid-cols-2 mb-lg">
        <div className="rounded-md p-lg bg-gradient-to-br from-skyBlue/10 to-teal/10 border border-skyBlue/20">
          <div className="flex items-center gap-sm mb-sm">
            <span className="text-lg">&#127775;</span>
            <h3 className="font-heading text-h3 text-charcoal">
              Waste Eliminator
            </h3>
          </div>
          <p className="text-caption text-charcoal/60">
            Complete all 4 modules + 1st Waste WAR Battle to unlock affiliate
            revenue opportunities.
          </p>
        </div>
        <div className="rounded-md p-lg bg-gradient-to-br from-teal/10 to-mintGreen/10 border border-teal/20">
          <div className="flex items-center gap-sm mb-sm">
            <span className="text-lg">&#128737;</span>
            <h3 className="font-heading text-h3 text-charcoal">
              CI Consultant
            </h3>
          </div>
          <p className="text-caption text-charcoal/60">
            Complete all 3 Waste WAR Battles to unlock consulting opportunities.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-lg border-t border-paleGray">
        <button
          onClick={onBack}
          className="text-body text-charcoal/60 hover:text-charcoal transition-colors"
        >
          Back
        </button>
        <button
          onClick={onComplete}
          disabled={saving}
          className="bg-navy text-white font-medium text-body py-sm px-xl rounded-md hover:bg-navy/90 focus:outline-none focus:ring-2 focus:ring-skyBlue disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? "Finishing..." : "Go to Dashboard"}
        </button>
      </div>
    </div>
  );
}

// ===========================================================================
// Icons
// ===========================================================================

function GraduationCapIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-skyBlue">
      <path d="M3 7l7-4 7 4-7 4-7-4z" />
      <path d="M3 7v5c0 2 3.5 4 7 4s7-2 7-4V7" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-skyBlue">
      <rect x="3" y="2" width="14" height="16" rx="2" />
      <path d="M7 6h6M7 10h6M7 14h4" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-skyBlue">
      <path d="M6 3h8v5a4 4 0 01-8 0V3z" />
      <path d="M6 5H4a1 1 0 00-1 1v1a3 3 0 003 3" />
      <path d="M14 5h2a1 1 0 011 1v1a3 3 0 01-3 3" />
      <path d="M10 12v3" />
      <path d="M7 17h6" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-skyBlue">
      <path d="M4 14v2a2 2 0 002 2h8a2 2 0 002-2v-2" />
      <path d="M4 6a6 6 0 0112 0v4a4 4 0 01-4 4H8a4 4 0 01-4-4V6z" />
      <circle cx="8" cy="8" r="1" fill="currentColor" />
      <circle cx="12" cy="8" r="1" fill="currentColor" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-skyBlue">
      <path d="M10 2l2.4 4.8L18 7.6l-4 3.9 1 5.5L10 14.5 4.9 17l1-5.5-4-3.9 5.6-.8z" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-teal">
      <path d="M8 11a4 4 0 005.5.5l2-2a4 4 0 00-5.5-5.5l-1 1" />
      <path d="M12 9a4 4 0 00-5.5-.5l-2 2a4 4 0 005.5 5.5l1-1" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2h8v8" />
      <path d="M14 2L6 10" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 10l3 3 5-5" />
    </svg>
  );
}

function TrophySmallIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 2h6v4a3 3 0 01-6 0V2z" />
      <path d="M8 10v2" />
      <path d="M6 14h4" />
    </svg>
  );
}
