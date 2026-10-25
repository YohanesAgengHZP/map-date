"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BookmarkPlus } from "lucide-react";
import { createMyPlan, useMyPlans } from "@/lib/myPlans";
import type { Plan } from "@/lib/types";
import { PlanClient } from "./PlanClient";
import { ShareButton } from "./ShareButton";
import { Button } from "./ui";

/**
 * One of the nine plans that ship in `plans.ts`, plus a way to keep the version
 * you just edited.
 *
 * Edits to a built-in are a scratch copy by design, so this is the escape
 * hatch: it snapshots whatever stops are on screen into a plan of your own and
 * takes you there. The built-in is left exactly as it ships.
 */
export function BuiltInPlan({ plan }: { plan: Plan }) {
  const router = useRouter();
  const { add } = useMyPlans();
  // Echoes PlanClient's stop list so the copy captures live edits rather than
  // the ids this plan was published with. PlanClient still owns the state.
  const [stopIds, setStopIds] = useState(plan.destinationIds);
  const [saving, setSaving] = useState(false);

  const saveCopy = () => {
    const mine = createMyPlan({
      title: `${plan.title} (mine)`,
      mood: plan.mood,
      startTime: plan.startTime,
      destinationIds: stopIds,
    });
    add(mine);
    setSaving(true);
    router.push(`/mine?id=${mine.id}`);
  };

  return (
    <PlanClient
      plan={plan}
      onStopsChange={setStopIds}
      headerAction={
        <div className="flex shrink-0 flex-wrap gap-2">
          {/* Shares the stops currently on screen, not the published ones, so
              a tweaked plan can be sent on without saving it first. */}
          <ShareButton
            title={plan.title}
            mood={plan.mood}
            startTime={plan.startTime}
            destinationIds={stopIds}
          />
          <Button
            onClick={saveCopy}
            disabled={saving}
            className="shrink-0 bg-white/15 text-white backdrop-blur hover:bg-white/25"
          >
            <BookmarkPlus size={15} aria-hidden />
            {saving ? "Saving..." : "Save as my plan"}
          </Button>
        </div>
      }
    />
  );
}
