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
import {
  buildDirectionsUrl,
  estimateRoute,
  getRoute,
  optimizeOrder,
} from "@/lib/routing";
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
  const [tidying, setTidying] = useState(false);
  const [orderNote, setOrderNote] = useState<string | null>(null);
  /** The stop last taken out, and where it sat, so it can be put back. */
  const [undo, setUndo] = useState<{
    id: string;
    index: number;
    name: string;
  } | null>(null);
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
    // Any edit makes the last answer about the order, and the last offer to
    // undo, stale.
    setOrderNote(null);
    setUndo(null);
  };

  /**
   * Ask the router for the shortest way round the same stops.
   *
   * Not an effect and not debounced: it runs when the button is pressed and
   * never on its own. Rearranging someone's afternoon is not something to do
   * because they happened to add a stop.
   */
  const tidyOrder = async () => {
    setTidying(true);
    setOrderNote(null);
    try {
      const suggestion = await optimizeOrder(destinations);
      if (suggestion.status === "reordered") {
        commitStops(suggestion.destinations.map((d) => d.id));
      } else {
        setOrderNote(
          suggestion.status === "already-shortest"
            ? "That is already the short way round."
            : "Could not work out the driving order just now. Try again in a bit.",
        );
      }
    } finally {
      setTidying(false);
    }
  };

  const moveStop = (index: number, delta: number) =>
    commitStops(moveItem(stopIds, index, index + delta));

  /**
   * Taking a stop out is the one destructive edit reachable in a single click,
   * from a 28px icon sitting beside the two reorder buttons — and on a plan of
   * your own it is written to storage in the same tick. So it offers the way
   * back rather than asking first: a confirm on every removal would tax the
   * ordinary case to guard the rare one.
   */
  const removeStop = (id: string) => {
    if (!owned && stopIds.length <= 1) return;
    const index = stopIds.indexOf(id);
    const name = getDestination(id)?.name ?? "That stop";
    const next = stopIds.filter((x) => x !== id);
    commitStops(next);
    setUndo({ id, index, name });
    if (selectedId === id) setSelectedId(next[0] ?? null);
  };

  const undoRemove = () => {
    if (!undo) return;
    const next = [...stopIds];
    next.splice(undo.index, 0, undo.id);
    commitStops(next);
    setSelectedId(undo.id);
  };

  /**
   * Adds and selects, and deliberately does not close anything. Building an
   * afternoon means adding several places in a row, and the search sheet used
   * to shut after every single one, so each extra stop cost a reopen and a
   * retype. Whoever opened a surface closes it: the detail modal dismisses
   * itself below, and the search sheet stays up until it is dismissed.
   */
  const addStop = (id: string) => {
    if (!stopIds.includes(id)) commitStops([...stopIds, id]);
    setSelectedId(id);
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
        <div className="text-ink-soft flex flex-wrap items-center gap-x-5 gap-y-2 text-sm tabular-nums">
          <span className="inline-flex items-center gap-1.5">
            <MapPin size={14} className="text-clay" aria-hidden />
            {stops.length} {stops.length === 1 ? "stop" : "stops"}
          </span>
          {/* An empty plan measured "under an hour · ~ 0 min travel", which
              describes an afternoon nobody has planned yet. */}
          {stops.length > 0 ? (
            <>
              <span className="inline-flex items-center gap-1.5">
                <Clock size={14} className="text-clay" aria-hidden />
                {totals.totalMinutes === null
                  ? "Length unknown"
                  : formatDurationBand(totals.totalMinutes)}
              </span>
              {stops.length > 1 ? (
                <span className="inline-flex items-center gap-1.5">
                  <Navigation size={14} className="text-clay" aria-hidden />
                  {totals.travelMinutes === null
                    ? "Travel time unknown"
                    : `~ ${formatDuration(totals.travelMinutes)} travel`}
                </span>
              ) : null}
            </>
          ) : null}
        </div>

        {/* `max-w-[65ch]`, not `max-w-2xl`: 42rem at 14px measured about 90
            characters a line, well past the 60–75 a reader tracks comfortably,
            and this paragraph is the longest prose in the app. */}
        <p className="text-ink-soft mt-4 max-w-[65ch] text-sm leading-relaxed">
          {plan.description}
        </p>

        {unresolvedCount > 0 ? (
          <p className="border-line text-ink-soft mt-4 max-w-[65ch] rounded-xl border border-dashed p-3 text-xs leading-relaxed">
            {unresolvedCount === 1 ? "One stop" : `${unresolvedCount} stops`} in
            this plan would not load. Places you searched for are looked up
            again each time the plan is opened, so either the connection failed
            or the place is no longer on the map.
          </p>
        ) : null}
      </div>

      {/* Mobile switches between the list and the map; desktop shows both. */}
      <div className="mx-auto mt-5 max-w-6xl px-4 sm:px-6 lg:hidden">
        {/* A group of toggle buttons, not a tablist. It used to claim
            `role="tablist"`/`role="tab"`, which promises the APG keyboard map
            — arrow keys moving between tabs, roving tabindex — and there was
            none, nor a `role="tabpanel"` for `aria-selected` to point at. Two
            plain buttons with `aria-pressed` announce the same state and
            behave the way they announce. */}
        <div
          role="group"
          aria-label="Plan view"
          className="border-line bg-paper grid grid-cols-2 gap-1 rounded-full border p-1"
        >
          {(["itinerary", "map"] as const).map((view) => (
            <button
              key={view}
              type="button"
              aria-pressed={mobileView === view}
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
        {/* `min-w-0`, or the page scrolls sideways at 320px. A grid item's
            `min-width` is `auto`, so this column refuses to shrink below the
            min-content of an itinerary row — a 24px number, a 64px thumbnail
            and a `truncate` venue name, whose `white-space: nowrap` reports
            its full width. The desktop track already guards the same thing
            with `minmax(0,26rem)`; the single-column mobile case had nothing. */}
        <div
          className={cx(
            "min-w-0 space-y-4",
            mobileView === "map" && "hidden lg:block",
          )}
        >
          {/* An empty plan reported "0 min / 0 min / 0 min · under an hour",
              which is three facts about nothing above the one instruction
              that matters. */}
          {stops.length > 0 ? (
            <PlanSummary totals={totals} routeSource={route.source} />
          ) : null}

          <ItineraryPanel
            stops={stops}
            selectedId={selectedId}
            onSelect={selectStop}
            onViewDetails={viewDetails}
            onMove={moveStop}
            onRemove={removeStop}
            undoName={undo?.name ?? null}
            onUndoRemove={undoRemove}
            onAddStop={() => setAddStopOpen(true)}
            onTidyOrder={tidyOrder}
            tidying={tidying}
            orderNote={orderNote}
            allowEmpty={owned}
          />

          {/* Hidden while the plan is empty: there is no route to open, and as
              the only filled button on the screen it outranked the one action
              the page actually had. */}
          {stops.length > 0 ? (
            <a
              href={directionsUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="bg-clay hover:bg-clay-dark flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-medium text-white transition-colors"
            >
              <Navigation size={15} aria-hidden />
              Open the whole route in Maps
            </a>
          ) : null}

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

          {/* Route overview, pinned above the map canvas. Hidden on an empty
              plan, where "0 stops" only repeats the panel heading alongside it
              and the canvas already carries its own "add a stop" line. */}
          <div
            className={cx(
              "border-line bg-paper/95 pointer-events-none absolute top-3 left-3 z-[1000] flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs backdrop-blur",
              stops.length === 0 && "hidden",
            )}
          >
            <Route size={13} className="text-clay" aria-hidden />
            <span className="text-ink font-medium tabular-nums">
              {stops.length} {stops.length === 1 ? "stop" : "stops"}
              {totalMeters > 0 ? ` · ${formatDistance(totalMeters)}` : ""}
              {/* Nothing travels between one stop and itself. */}
              {stops.length < 2
                ? ""
                : totals.travelMinutes !== null
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
