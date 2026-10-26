"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  Clock,
  Loader2,
  MapPin,
  Navigation,
  Route,
} from "lucide-react";
import {
  DESTINATIONS,
  getDestination,
  getDestinations,
} from "@/data/destinations";
import { addCustomPlace, customPlacesStore } from "@/lib/customPlaces";
import {
  formatDistance,
  formatDuration,
  formatDurationBand,
} from "@/lib/format";
import { buildItinerary, calculateTotals, moveItem } from "@/lib/itinerary";
import { lookupPlaces } from "@/lib/places";
import { buildDirectionsUrl, estimateRoute, getRoute } from "@/lib/routing";
import { useFavorites } from "@/lib/useFavorites";
import { useLocalStore } from "@/lib/useLocalStore";
import { visitDurationsStore, withVisitDurations } from "@/lib/visitDurations";
import type { Destination, Plan, RouteResult } from "@/lib/types";
import { AddStopDialog } from "./AddStopDialog";
import { DestinationDetailModal } from "./DestinationDetailModal";
import { ItineraryPanel } from "./ItineraryPanel";
import { PlanSummary } from "./PlanSummary";
import { CategoryPattern } from "./CategoryIcon";
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
  seedPlaces,
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
  /**
   * Records for stops that cannot be resolved from the repo, handed over by
   * whoever built the plan. A shared link carries these so its stops render
   * without a lookup.
   */
  seedPlaces?: Destination[];
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
  const customPlaces = useLocalStore(customPlacesStore);
  const durations = useLocalStore(visitDurationsStore);

  // `customPlaces` is in the deps because `getDestinations` reads the live-place
  // cache internally, which the lint rule cannot see. Dropping it, as the rule
  // suggests, leaves this memo stale when a shared plan's stops arrive from
  // Overpass a moment after first paint.
  //
  // Durations are applied here rather than inside `getDestination` so the
  // server-rendered Discover cards cannot disagree with the client about how
  // long a plan takes. Editing one is a thing you do on this page.
  const destinations = useMemo(
    () => withVisitDurations(getDestinations(stopIds), durations),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stopIds, customPlaces, durations],
  );

  /**
   * Seed first, and from inside this component rather than its parent.
   * Effects run child-before-parent across the tree but in declaration order
   * within one component, so seeding here is the only placement that is
   * guaranteed to happen before the lookup below decides what is missing.
   * Seeding from the parent fired a real Overpass request every time.
   */
  useEffect(() => {
    for (const place of seedPlaces ?? []) addCustomPlace(place);
  }, [seedPlaces]);

  /**
   * Stops this browser has never seen, which is what a shared link looks like
   * when it names a place the reader did not search for themselves. Every live
   * id is an OSM object id, so it can be fetched back.
   *
   * `attempted` stops a plan whose stops OSM has since deleted from being
   * asked for again on every edit: those ids stay missing no matter how often
   * we ask. It is marked on settle, never up front, because a run that gets
   * torn down answered nothing. Marking early means StrictMode's remount
   * aborts the only request and the retry finds nothing left to ask for.
   */
  const attempted = useRef(new Set<string>());
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    const missing = stopIds.filter(
      (id) => !getDestination(id) && !attempted.current.has(id),
    );
    if (missing.length === 0) return;

    let active = true;
    const controller = new AbortController();
    setResolving(true);

    lookupPlaces(missing, controller.signal)
      .then((found) => {
        for (const place of found) addCustomPlace(place);
      })
      .catch((error: unknown) => {
        if (active) console.error("Could not resolve shared stops", error);
      })
      .finally(() => {
        if (!active) return;
        for (const id of missing) attempted.current.add(id);
        setResolving(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [stopIds]);

  /**
   * Stops the plan names that nothing could resolve. Said out loud rather than
   * dropped quietly: a shared plan that renders four of its five stops with no
   * explanation looks like the sender's plan, not like a failure.
   */
  const unresolvedCount = resolving ? 0 : stopIds.length - destinations.length;

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
  const detailDestination = detailId ? getDestination(detailId) : undefined;

  // Built-ins plus everywhere the user has already searched out, so a place
  // added to one plan is one tap away in the next without searching again.
  const addOptions = useMemo(
    () =>
      [...DESTINATIONS, ...customPlaces].filter(
        (d) => !stopIds.includes(d.id),
      ),
    [customPlaces, stopIds],
  );

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

  /**
   * Adding from search caches the whole record first. A plan stores only ids,
   * and a live place has no entry in `destinations.ts` to resolve an id
   * against, so skipping the cache would add a stop that cannot be rendered.
   */
  const addPlace = (place: Destination) => {
    if (!getDestination(place.id)) addCustomPlace(place);
    addStop(place.id);
  };

  const directionsUrl = buildDirectionsUrl(destinations);

  return (
    <>
      {/* The hero was a full-bleed cover photo. It is now the same dark band
          without one, so the white title, chips and header buttons keep
          working unchanged, with the plan's own category icons tiled faintly
          across it as texture rather than decoration. Four huge icons pushed
          to the right edge left the middle of the band visibly empty; a tile
          has no middle.

          `min-h`, not `h`, and the text sits in the band rather than in an
          overlay absolutely positioned over it. A fixed 11rem with the content
          laid on top looked right until a narrow screen: a long title wraps,
          the Share and Delete buttons drop to their own line, and the whole
          group overflowed the band and printed itself on the cream below. The
          band now grows to whatever it holds, and `min-h` keeps the roomy
          proportions on a wide one. */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#2e2622] to-[#241a16]">
        <CategoryPattern
          categories={destinations.map((d) => d.category)}
          tiles={60}
          className="text-white/[0.07]"
        />

        <div className="relative mx-auto flex min-h-44 max-w-6xl flex-col px-4 py-4 sm:min-h-52 sm:px-6">
          <Link
            href="/"
            className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white backdrop-blur transition-colors hover:bg-white/25"
          >
            <ArrowLeft size={13} aria-hidden />
            Back to plans
          </Link>

          {/* `pt-6` as well as `mt-auto`: once the content is tall enough to
              set the band's height there is no slack left for `auto` to eat,
              and the title would sit against the back link. */}
          <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-6">
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

        {unresolvedCount > 0 ? (
          <p className="border-line text-ink-soft mt-4 max-w-2xl rounded-xl border border-dashed p-3 text-xs leading-relaxed">
            {unresolvedCount === 1 ? "One stop" : `${unresolvedCount} stops`} in
            this plan could not be loaded. Places added from OpenStreetMap are
            fetched again when the plan is opened, so this usually means the
            lookup failed or the place is no longer on the map.
          </p>
        ) : null}
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
        excludeIds={stopIds}
        onClose={() => setAddStopOpen(false)}
        onAdd={addPlace}
      />
    </>
  );
}
