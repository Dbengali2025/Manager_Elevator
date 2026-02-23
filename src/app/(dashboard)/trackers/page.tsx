"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { Suspense } from "react";
import WarBattleTracker from "@/components/trackers/WarBattleTracker";
import OpportunitiesTracker from "@/components/trackers/OpportunitiesTracker";
import ImpactTracker from "@/components/trackers/ImpactTracker";
import SuccessNuggetsLibrary from "@/components/trackers/SuccessNuggetsLibrary";

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
            <ImpactTracker />
          </TabPanel>
          <TabPanel>
            <SuccessNuggetsLibrary />
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

