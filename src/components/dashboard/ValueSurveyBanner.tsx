import Link from "next/link";

/**
 * Shown on the dashboard when a 90/270/360-day Manager Value Self-Assessment
 * retake has come due. Silent when nothing is outstanding.
 */
export default function ValueSurveyBanner({
  dueOccasion,
}: {
  dueOccasion: { key: string; label: string } | null;
}) {
  if (!dueOccasion) return null;

  return (
    <div className="rounded-lg border border-skyBlue/30 bg-skyBlue/5 p-lg flex flex-col gap-md sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h2 className="font-heading text-h3 text-navy">
          Your {dueOccasion.label} is ready
        </h2>
        <p className="mt-xs text-body text-charcoal/70">
          Retake the Manager Value Self-Assessment to see how your marketplace
          value has shifted since your baseline. It takes about 5 minutes.
        </p>
      </div>
      <Link
        href="/value-survey"
        className="flex-shrink-0 self-start sm:self-auto bg-navy text-white font-medium text-body py-sm px-lg rounded-md hover:bg-navy/90 focus:outline-none focus:ring-2 focus:ring-skyBlue transition-colors"
      >
        Take Survey
      </Link>
    </div>
  );
}
