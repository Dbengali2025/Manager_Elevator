"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { Suspense } from "react";
import WarBattleTracker from "@/components/trackers/WarBattleTracker";
import OpportunitiesTracker from "@/components/trackers/OpportunitiesTracker";

const TABS = [
  { key: "war-battles", label: "Waste WAR Battles" },
  { key: "opportunities", label: "Opportunities" },
  { key: "impact-tracker", label: "Impact Tracker" },
  { key: "success-nuggets", label: "Success Nuggets" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function TrackersContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams.get("tab") as TabKey | null;
  const selectedIndex = Math.max(
    0,
    TABS.findIndex((t) => t.key === tabParam)
  );

  function handleTabChange(index: number) {
    const tab = TABS[index];
    router.replace(`/trackers?tab=${tab.key}`, { scroll: false });
  }

  return (
    <div className="space-y-lg">
      {/* Page header */}
      <div>
        <h1 className="font-heading text-h1 text-charcoal">
          CI Done Right Trackers
        </h1>
        <p className="mt-xs text-body text-charcoal/60">
          Track your 14-week Waste WAR Battle journey
        </p>
      </div>

      {/* Tabbed navigation */}
      <TabGroup selectedIndex={selectedIndex} onChange={handleTabChange}>
        <div className="overflow-x-auto -mx-lg px-lg">
          <TabList className="flex gap-xl border-b border-paleGray min-w-max">
            {TABS.map((tab) => (
              <Tab
                key={tab.key}
                className="relative pb-md text-body font-medium outline-none transition-colors whitespace-nowrap data-[selected]:text-charcoal data-[selected]:after:absolute data-[selected]:after:bottom-0 data-[selected]:after:left-0 data-[selected]:after:right-0 data-[selected]:after:h-[3px] data-[selected]:after:bg-skyBlue data-[selected]:after:rounded-full text-charcoal/50 hover:text-charcoal/80 cursor-pointer"
              >
                {tab.label}
              </Tab>
            ))}
          </TabList>
        </div>

        <TabPanels className="mt-lg">
          <TabPanel>
            <WarBattleTracker />
          </TabPanel>
          <TabPanel>
            <OpportunitiesTracker />
          </TabPanel>
          <TabPanel>
            <ImpactTrackerPlaceholder />
          </TabPanel>
          <TabPanel>
            <SuccessNuggetsPlaceholder />
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  );
}

export default function TrackersPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-lg">
          <div>
            <h1 className="font-heading text-h1 text-charcoal">
              CI Done Right Trackers
            </h1>
            <p className="mt-xs text-body text-charcoal/60">
              Track your 14-week Waste WAR Battle journey
            </p>
          </div>
          <div className="h-[48px] border-b border-paleGray" />
        </div>
      }
    >
      <TrackersContent />
    </Suspense>
  );
}

/* ---------- Placeholder components ---------- */


function ImpactTrackerPlaceholder() {
  return (
    <div className="rounded-lg border border-paleGray bg-white p-2xl text-center">
      <div className="mx-auto mb-md flex h-[48px] w-[48px] items-center justify-center rounded-full bg-success/10">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-success"
        >
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      </div>
      <h3 className="font-heading text-h3 text-charcoal">Impact Tracker</h3>
      <p className="mt-sm text-body text-charcoal/60">
        Document measurable results and auto-calculate improvement metrics.
      </p>
    </div>
  );
}

function SuccessNuggetsPlaceholder() {
  return (
    <div className="rounded-lg border border-paleGray bg-white p-2xl text-center">
      <div className="mx-auto mb-md flex h-[48px] w-[48px] items-center justify-center rounded-full bg-teal/10">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-teal"
        >
          <path d="M12 2l2.4 4.8L20 7.6l-4 3.9 1 5.5L12 14.5 6.9 17l1-5.5-4-3.9 5.6-.8z" />
        </svg>
      </div>
      <h3 className="font-heading text-h3 text-charcoal">Success Nuggets</h3>
      <p className="mt-sm text-body text-charcoal/60">
        Build your success nuggets library for performance reviews and career
        conversations.
      </p>
    </div>
  );
}
