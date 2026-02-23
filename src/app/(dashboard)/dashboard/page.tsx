import { getDashboardData } from "@/actions/dashboard";
import JourneyProgressBar from "@/components/dashboard/JourneyProgressBar";

export default async function DashboardPage() {
  const result = await getDashboardData();

  const userName = result.data?.userName ?? "there";
  const firstName = userName.split(" ")[0];
  const progressRecords = result.data?.progressRecords ?? [];

  return (
    <div className="space-y-lg">
      {/* Welcome header */}
      <div>
        <h1 className="font-heading text-h1 text-charcoal">
          Welcome back, {firstName}
        </h1>
        <p className="mt-xs text-body text-charcoal/60">
          Let&apos;s elevate your career through continuous improvement mastery.
        </p>
      </div>

      {/* Journey progress bar */}
      <JourneyProgressBar progressRecords={progressRecords} />
    </div>
  );
}
