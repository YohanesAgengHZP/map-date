import { PlanCard } from "@/components/PlanCard";
import { DiscoverClient, type PlanEntry } from "@/components/DiscoverClient";
import { SiteHeader } from "@/components/SiteHeader";
import { SampleNote } from "@/components/ui";
import { getDestinations } from "@/data/destinations";
import { PLANS } from "@/data/plans";
import { calculateTotals } from "@/lib/itinerary";
import { estimateRoute } from "@/lib/routing";

export default function DiscoverPage() {
  const entries: PlanEntry[] = PLANS.map((plan) => {
    const destinations = getDestinations(plan.destinationIds);
    const { legs } = estimateRoute(destinations);
    const totals = calculateTotals(destinations, legs);

    return {
      id: plan.id,
      mood: plan.mood,
      tags: plan.tags,
      totalMinutes: totals.totalMinutes,
      card: <PlanCard plan={plan} />,
    };
  });

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <DiscoverClient entries={entries} />
        <div className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
          <SampleNote />
        </div>
      </main>
    </>
  );
}
