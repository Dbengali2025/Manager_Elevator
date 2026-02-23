import { getDashboardData } from "@/actions/dashboard";
import JourneyProgressBar from "@/components/dashboard/JourneyProgressBar";
import StatCards from "@/components/dashboard/StatCards";
import FeatureNavigationCards from "@/components/dashboard/FeatureNavigationCards";

export default async function DashboardPage() {
  const result = await getDashboardData();

  const userName = result.data?.userName ?? "there";
  const firstName = userName.split(" ")[0];
  const progressRecords = result.data?.progressRecords ?? [];
  const onboardingCompleted = result.data?.onboardingCompleted ?? false;
  const sessionsCompleted = result.data?.sessionsCompleted ?? 0;
  const activeProjects = result.data?.activeProjects ?? 0;
  const milestones = result.data?.milestones ?? [];
  const badgesEarned = milestones.filter((m) => m.unlocked).length;

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

      {/* Stat cards */}
      <StatCards
        progressRecords={progressRecords}
        sessionsCompleted={sessionsCompleted}
        activeProjects={activeProjects}
        badgesEarned={badgesEarned}
      />

      {/* Feature navigation cards */}
      <FeatureNavigationCards
        onboardingCompleted={onboardingCompleted}
        progressRecords={progressRecords}
      />
    </div>
  );
}
