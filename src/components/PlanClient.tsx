"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  Clock,
  Loader2,
  MapPin,
  Navigation,
  Route,
} from "lucide-react";
import { DESTINATIONS, getDestinations } from "@/data/destinations";
import {
  formatDistance,
  formatDuration,
  formatDurationBand,
} from "@/lib/format";
import { buildItinerary, calculateTotals, moveItem } from "@/lib/itinerary";
import { buildDirectionsUrl, estimateRoute, getRoute } from "@/lib/routing";
import { useFavorites } from "@/lib/useFavorites";
import type { Plan, RouteResult } from "@/lib/types";
import { AddStopDialog } from "./AddStopDialog";
import { DestinationDetailModal } from "./DestinationDetailModal";
import { ItineraryPanel } from "./ItineraryPanel";
import { PlanSummary } from "./PlanSummary";
import { SafeImage } from "./SafeImage";
import { Chip, SampleNote, cx } from "./ui";

// MapLibre GL touches `window` at import time, so the map never server-renders.
const InteractiveMap = dynamic(() => import("./InteractiveMap"), {
  ssr: false,
  loading: () => (
    <div className="bg-clay-soft/40 text-ink-muted flex h-full items-center justify-center gap-2 text-sm">
      <Loader2 size={15} className="animate-spin" aria-hidden />
      Loading map...
    </div>
  ),
});

export function PlanClient({
  plan,
  onStopsChange,
  owned = false,
  headerAction,
}: {
  plan: Plan;
  /** Fired on every stop edit. Persist it, mirror it, or ignore it. */
  onStopsChange?: (ids: string[]) => void;
  /**
   * True for a plan the user made. Built-in plans always keep at least one
   * stop, because emptying one is never what you meant, and their edits are a
   * scratch copy of what ships in `plans.ts` rather than something saved.
   */
  owned?: boolean;
  /** Slot in the hero for "Save as my plan" or "Delete this plan". */
  headerAction?: ReactNode;
}) {
  const [stopIds, setStopIds] = useState(plan.destinationIds);
  const [selectedId, setSelectedId] = useState<string | null>(
    plan.destinationIds[0] ?? null,
  );
  const [detailId, setDetailId] = useState<string | null>(null);
  const [addStopOpen, setAddStopOpen] = useState(false);
  const [mobileView, setMobileView] = useState<"itinerary" | "map">("itinerary");
  const { isFavorite, toggle } = useFavorites();

  const destinations = useMemo(() => getDestinations(stopIds), [stopIds]);

  // Start from the offline estimate so the first paint has real numbers, then
  // replace it with the routed answer when the provider responds.
  const [route, setRoute] = useState<RouteResult>(() =>
    estimateRoute(getDestinations(plan.destinationIds)),
  );

  useEffect(() => {
    const controller = new AbortController();
    getRoute(destinations, controller.signal)
      .then(setRoute)
      .catch(() => {
        /* aborted by a newer itinerary; the next run owns the state */
      });
    return () => controller.abort();
  }, [destinations]);

  /**
   * Derived rather than a loading flag: what matters is whether the legs on
   * screen still describe the stops on screen. True right after an edit, until
   * the provider answers for the new order.
   */
  const routeIsStale =
    route.legs.length !== Math.max(0, destinations.length - 1) ||
    route.legs.some((leg, index) => leg.fromId !== destinations[index]?.id);

  const stops = useMemo(
    () => buildItinerary(destinations, route.legs, plan.startTime),
    [destinations, route.legs, plan.startTime],
  );
  const totals = useMemo(
    () => calculateTotals(destinations, route.legs),
    [destinations, route.legs],
  );

  const totalMeters = route.legs.reduce((sum, leg) => sum + (leg.meters ?? 0), 0);
  const detailDestination = DESTINATIONS.find((d) => d.id === detailId);
  const addOptions = DESTINATIONS.filter((d) => !stopIds.includes(d.id));

  const selectStop = (id: string) => setSelectedId(id);

  const viewDetails = (id: string) => {
    setSelectedId(id);
    setDetailId(id);
  };

  /** Single write path, so persistence cannot be forgotten by one mutator. */
  const commitStops = (next: string[]) => {
    setStopIds(next);
    onStopsChange?.(next);
  };

  const moveStop = (index: number, delta: number) =>
    commitStops(moveItem(stopIds, index, index + delta));

  const removeStop = (id: string) => {
    if (!owned && stopIds.length <= 1) return;
    const next = stopIds.filter((x) => x !== id);
    commitStops(next);
    if (selectedId === id) setSelectedId(next[0] ?? null);
  };

  const addStop = (id: string) => {
    if (!stopIds.includes(id)) commitStops([...stopIds, id]);
    setSelectedId(id);
    setAddStopOpen(false);
  };

  const directionsUrl = buildDirectionsUrl(destinations);

  return (
    <>
      <section className="relative">
        <div className="relative h-56 sm:h-72 lg:h-80">
          <SafeImage
            src={plan.coverPhoto.url}
            alt={plan.coverPhoto.alt}
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#241a16]/85 via-[#241a16]/35 to-[#241a16]/25" />
        </div>

        <div className="absolute inset-0 mx-auto flex max-w-6xl flex-col px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white backdrop-blur transition-colors hover:bg-white/25"
          >
            <ArrowLeft size={13} aria-hidden />
            Back to plans
          </Link>

          <div className="mt-auto flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-3xl text-white sm:text-4xl">{plan.title}</h1>
              <p className="mt-1 text-sm text-white/80">
                {destinations.map((d) => d.category).join(" → ") || "No stops yet"}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {plan.tags.map((tag) => (
                  <Chip
                    key={tag}
                    className="border-white/25 bg-white/15 text-white"
                  >
                    {tag}
                  </Chip>
                ))}
              </div>
            </div>
            {headerAction}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 pt-5 sm:px-6">
        <div className="text-ink-soft flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <span className="inline-flex items-center gap-1.5">
            <MapPin size={14} className="text-clay" aria-hidden />
            {stops.length} stops
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock size={14} className="text-clay" aria-hidden />
            {totals.totalMinutes === null
              ? "Length unknown"
              : formatDurationBand(totals.totalMinutes)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Navigation size={14} className="text-clay" aria-hidden />
            {totals.travelMinutes === null
              ? "Travel time unknown"
              : `~ ${formatDuration(totals.travelMinutes)} travel`}
          </span>
        </div>

        <p className="text-ink-soft mt-4 max-w-2xl text-sm leading-relaxed">
          {plan.description}
        </p>
      </div>

      {/* Mobile switches between the list and the map; desktop shows both. */}
      <div className="mx-auto mt-5 max-w-6xl px-4 sm:px-6 lg:hidden">
        <div
          role="tablist"
          aria-label="Plan view"
          className="border-line bg-paper grid grid-cols-2 gap-1 rounded-full border p-1"
        >
          {(["itinerary", "map"] as const).map((view) => (
            <button
              key={view}
              role="tab"
              type="button"
              aria-selected={mobileView === view}
              onClick={() => setMobileView(view)}
              className={cx(
                "rounded-full py-2 text-sm font-medium capitalize transition-colors",
                mobileView === view ? "bg-clay text-white" : "text-ink-soft",
              )}
            >
              {view}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,26rem)_1fr] lg:items-start">
        <div className={cx("space-y-4", mobileView === "map" && "hidden lg:block")}>
          <PlanSummary totals={totals} routeSource={route.source} />

          <ItineraryPanel
            stops={stops}
            selectedId={selectedId}
            onSelect={selectStop}
            onViewDetails={viewDetails}
            onMove={moveStop}
            onRemove={removeStop}
            onAddStop={() => setAddStopOpen(true)}
            allowEmpty={owned}
          />

          <a
            href={directionsUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="bg-clay hover:bg-clay-dark flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-medium text-white transition-colors"
          >
            <Navigation size={15} aria-hidden />
            Open the whole route in Maps
          </a>

          <SampleNote />
        </div>

        <div
          className={cx(
            "border-line bg-paper relative overflow-hidden rounded-2xl border",
            "h-[60dvh] lg:sticky lg:top-20 lg:h-[calc(100dvh-7rem)]",
            mobileView === "itinerary" && "hidden lg:block",
          )}
        >
          <InteractiveMap
            destinations={destinations}
            legs={route.legs}
            geometry={route.geometry}
            selectedId={selectedId}
            onSelect={selectStop}
            onViewDetails={viewDetails}
            revealed={mobileView === "map"}
          />

          {/* Route overview, pinned above the map canvas. */}
          <div className="border-line bg-paper/95 pointer-events-none absolute top-3 left-3 z-[1000] flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs backdrop-blur">
            <Route size={13} className="text-clay" aria-hidden />
            <span className="text-ink font-medium">
              {stops.length} stops
              {totalMeters > 0 ? ` · ${formatDistance(totalMeters)}` : ""}
              {totals.travelMinutes !== null
                ? ` · ~ ${formatDuration(totals.travelMinutes)}`
                : " · travel time unknown"}
            </span>
            {routeIsStale ? (
              <Loader2 size={12} className="text-ink-muted animate-spin" aria-hidden />
            ) : null}
          </div>
        </div>
      </div>

      <DestinationDetailModal
        destination={detailDestination}
        open={detailId !== null}
        onClose={() => setDetailId(null)}
        isFavorite={detailId ? isFavorite(detailId) : false}
        onToggleFavorite={() => detailId && toggle(detailId)}
        onAddToItinerary={() => {
          if (!detailId) return;
          addStop(detailId);
          setDetailId(null);
        }}
        inItinerary={detailId ? stopIds.includes(detailId) : false}
      />

      <AddStopDialog
        open={addStopOpen}
        options={addOptions}
        onClose={() => setAddStopOpen(false)}
        onAdd={addStop}
      />
    </>
  );
}
