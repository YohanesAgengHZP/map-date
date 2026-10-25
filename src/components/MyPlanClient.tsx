"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { BookmarkPlus, Trash2 } from "lucide-react";
import { customPlacesStore } from "@/lib/customPlaces";
import { createMyPlan, decodePlan, toPlan, useMyPlans } from "@/lib/myPlans";
import { useLocalStore } from "@/lib/useLocalStore";
import { PlanClient } from "./PlanClient";
import { ShareButton } from "./ShareButton";
import { Button } from "./ui";

/**
 * Two things live on this route:
 *
 * - `?id=`   a plan of your own, read from localStorage and saved as you edit.
 * - `?plan=` a plan somebody sent you, carried entirely inside the link. It is
 *            not yours until you save it, so nothing is written on arrival.
 *
 * Query parameters rather than `/mine/[id]` because the server cannot know
 * these ids: `/plan/[id]` is statically generated with `dynamicParams: false`.
 * One static route plus a parameter keeps the whole site static.
 */
export function MyPlanClient() {
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get("id");
  const token = params.get("plan");
  const { plans, add, remove, setStops } = useMyPlans();

  // Subscribed for the re-render alone. `toPlan` derives the summary line from
  // the stops, so a shared plan whose live places land a moment later would
  // otherwise keep describing only the stops that resolved on first paint,
  // while the header already counts all of them.
  useLocalStore(customPlacesStore);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  const decoded = useMemo(() => (token ? decodePlan(token) : null), [token]);
  const shared = useMemo(
    () => (decoded ? createMyPlan(decoded) : null),
    [decoded],
  );

  /**
   * Records the link carried for stops that have no entry in the repo. Handed
   * to `PlanClient`, which seeds them before it decides what needs looking up.
   * Caching a place is not saving the plan: the plan itself is still only
   * written when the reader presses "Save to my plans".
   */
  const seedPlaces = decoded?.places;

  const saved = plans.find((p) => p.id === id);

  const onStopsChange = useCallback(
    (ids: string[]) => {
      if (saved) setStops(saved.id, ids);
    },
    [saved, setStops],
  );

  if (!saved && !shared) {
    const badLink = Boolean(token);
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6">
        <h1 className="text-2xl">
          {badLink ? "That link did not work" : "That plan is not here"}
        </h1>
        <p className="text-ink-soft mx-auto mt-2 max-w-md text-sm leading-relaxed">
          {badLink
            ? "A shared plan travels inside its link, so it only opens if the whole link arrived in one piece. Ask for it again, and check nothing was cut off at the end."
            : "Plans you make are kept in this browser only, so a link to one will not open anywhere else, and clearing site data removes them."}
        </p>
        <Link href="/" className="mt-6 inline-block">
          <Button variant="secondary">Back to plans</Button>
        </Link>
      </div>
    );
  }

  // A shared plan is shown but not stored until the reader asks for it.
  if (shared && !saved) {
    const keep = () => {
      add(shared);
      setSaving(true);
      router.replace(`/mine?id=${shared.id}`);
    };

    return (
      <PlanClient
        key={shared.id}
        plan={{ ...toPlan(shared), tags: ["Shared with you"] }}
        seedPlaces={seedPlaces}
        headerAction={
          <div className="flex shrink-0 flex-wrap gap-2">
            <ShareButton
              title={shared.title}
              mood={shared.mood}
              startTime={shared.startTime}
              destinationIds={shared.destinationIds}
            />
            <Button
              onClick={keep}
              disabled={saving}
              className="shrink-0 bg-white/15 text-white backdrop-blur hover:bg-white/25"
            >
              <BookmarkPlus size={15} aria-hidden />
              {saving ? "Saving..." : "Save to my plans"}
            </Button>
          </div>
        }
      />
    );
  }

  if (!saved) return null;

  const confirmDelete = () => {
    if (!deleting) {
      setDeleting(true);
      return;
    }
    remove(saved.id);
    router.push("/");
  };

  return (
    <PlanClient
      // Keyed so switching between two saved plans remounts rather than
      // carrying the previous plan's stop state across.
      key={saved.id}
      plan={toPlan(saved)}
      owned
      onStopsChange={onStopsChange}
      headerAction={
        <div className="flex shrink-0 flex-wrap gap-2">
          <ShareButton
            title={saved.title}
            mood={saved.mood}
            startTime={saved.startTime}
            destinationIds={saved.destinationIds}
          />
          <Button
            onClick={confirmDelete}
            onBlur={() => setDeleting(false)}
            className="shrink-0 bg-white/15 text-white backdrop-blur hover:bg-white/25"
          >
            <Trash2 size={15} aria-hidden />
            {deleting ? "Tap again to delete" : "Delete this plan"}
          </Button>
        </div>
      }
    />
  );
}
