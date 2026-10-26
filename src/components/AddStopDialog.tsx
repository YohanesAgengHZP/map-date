"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin, Plus, Search, X } from "lucide-react";
import { formatDuration } from "@/lib/format";
import { searchPlaces } from "@/lib/places";
import type { Destination } from "@/lib/types";
import { CategoryIcon } from "./CategoryIcon";
import { Button } from "./ui";

/** Long enough that typing "nanamia" does not fire a request per keystroke. */
const DEBOUNCE_MS = 350;
const MIN_QUERY = 3;

function matches(destination: Destination, query: string): boolean {
  const haystack = `${destination.name} ${destination.category}`.toLowerCase();
  return haystack.includes(query.toLowerCase());
}

export function AddStopDialog({
  open,
  options,
  excludeIds,
  onClose,
  onAdd,
}: {
  open: boolean;
  /** Places already known to the app and not yet in this plan. */
  options: Destination[];
  /** Everything already in the plan, so search cannot offer a duplicate. */
  excludeIds: string[];
  onClose: () => void;
  onAdd: (destination: Destination) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState("");

  /**
   * The last answer, tagged with the query it answers.
   *
   * Tagged rather than three separate flags, because that makes "are we
   * waiting?" derivable: an answer for a query other than the one in the box
   * is by definition still in flight. Separate `searching`/`failed` state
   * would have to be reset from inside the effect, which is a cascading render
   * and, worse, leaves a window where stale results show under a new query.
   */
  const [answer, setAnswer] = useState<{
    query: string;
    places: Destination[];
    failed: boolean;
  }>({ query: "", places: [], failed: false });

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const trimmed = query.trim();
  const searchable = trimmed.length >= MIN_QUERY;
  const answered = answer.query === trimmed;
  const searching = searchable && !answered;
  const failed = answered && answer.failed;
  const results = answered ? answer.places : [];

  useEffect(() => {
    if (!searchable) return;

    // Aborted rather than ignored: a slow answer for "nan" must not land after
    // the answer for "nanamia", and the request is pointless once typing has
    // moved on.
    const controller = new AbortController();

    const timer = setTimeout(() => {
      searchPlaces(trimmed, controller.signal)
        .then((places) => setAnswer({ query: trimmed, places, failed: false }))
        .catch((error: unknown) => {
          if (controller.signal.aborted) return;
          console.error("Place search failed", error);
          setAnswer({ query: trimmed, places: [], failed: true });
        });
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchable, trimmed]);

  // Local matches first: a built-in venue has a written description and
  // checked hours, so it is the better answer whenever it is an answer at all.
  // Filtered from the first keystroke, not from `MIN_QUERY`: the threshold
  // exists to spare the provider a request, and a list that ignores the two
  // letters you just typed reads as broken.
  const local = trimmed
    ? options.filter((option) => matches(option, trimmed))
    : options;
  const localIds = new Set(local.map((place) => place.id));
  const remote = results.filter(
    (place) => !localIds.has(place.id) && !excludeIds.includes(place.id),
  );

  const close = () => {
    setQuery("");
    onClose();
  };

  return (
    <dialog
      ref={ref}
      aria-labelledby="add-stop-title"
      onClose={close}
      onClick={(event) => {
        if (event.target === ref.current) close();
      }}
      className="bg-paper text-ink m-0 w-screen max-w-none p-0 backdrop:bg-[#241a16]/60 max-sm:mt-auto max-sm:h-[80dvh] max-sm:rounded-t-3xl sm:m-auto sm:max-h-[85dvh] sm:w-[min(32rem,94vw)] sm:rounded-2xl"
    >
      <div className="flex h-full flex-col">
        <div className="border-line flex items-center gap-3 border-b px-4 py-3">
          <h2 id="add-stop-title" className="flex-1 text-lg">
            Add a stop
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="hover:bg-clay-soft text-ink-soft flex size-9 items-center justify-center rounded-full transition-colors"
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        <div className="border-line border-b px-4 py-3">
          <label className="sr-only" htmlFor="add-stop-search">
            Search for a place
          </label>
          {/* `border-field`, not `border-line`: the input itself is
              `bg-transparent`, so this border is the only thing that says
              there is a field here. */}
          {/* `border-field`, not `border-line`: the input is `bg-transparent`,
              so this border is the only thing that says there is a field here.
              The ring itself is left to the `:focus-visible` rule in
              `globals.css`, which is why the input no longer sets
              `outline-none` — a wrapper ring drawn here would be a second way
              of doing what the whole app already does one way. */}
          <div className="border-field focus-within:border-clay flex items-center gap-2 rounded-full border px-3 py-2 transition-colors">
            <Search size={15} className="text-ink-muted shrink-0" aria-hidden />
            <input
              id="add-stop-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search any place, or pick one below"
              className="min-w-0 flex-1 bg-transparent text-sm"
            />
            {searching ? (
              <Loader2
                size={14}
                className="text-ink-muted shrink-0 animate-spin"
                aria-hidden
              />
            ) : null}
          </div>
          <p
            role="status"
            className="text-ink-muted mt-2 text-[11px] leading-tight"
          >
            {failed
              ? "Could not search just now. Check your connection and try again."
              : searching
                ? "Looking..."
                : "Type the name of anywhere you want to go."}
          </p>
        </div>

        {local.length === 0 && remote.length === 0 ? (
          <p className="text-ink-soft p-6 text-center text-sm">
            {searchable
              ? searching
                ? "Searching..."
                : `Nothing found for "${trimmed}". Try the name on its own, or put the town after it.`
              : "Everywhere else is already in this plan. Search to add somewhere new."}
          </p>
        ) : (
          // `overscroll-contain`: without it, flicking past the end of the
          // results keeps going and scrolls the plan behind the sheet.
          <ul className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
            {local.map((destination) => (
              <PlaceRow
                key={destination.id}
                destination={destination}
                onAdd={() => onAdd(destination)}
              />
            ))}

            {remote.length > 0 ? (
              <li className="text-ink-muted px-2 pt-4 pb-1 text-[11px] font-semibold tracking-wide uppercase">
                Found on the map
              </li>
            ) : null}

            {remote.map((destination) => (
              <PlaceRow
                key={destination.id}
                destination={destination}
                onAdd={() => onAdd(destination)}
              />
            ))}
          </ul>
        )}
      </div>
    </dialog>
  );
}

function PlaceRow({
  destination,
  onAdd,
}: {
  destination: Destination;
  onAdd: () => void;
}) {
  return (
    <li className="border-line hover:bg-clay-soft/30 flex items-center gap-3 rounded-xl border-b p-2 last:border-b-0">
      <span className="border-line size-14 shrink-0 overflow-hidden rounded-lg border">
        <CategoryIcon category={destination.category} size={20} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">
          {destination.name}
        </span>
        <span className="text-ink-muted block truncate text-xs">
          {destination.category} ·{" "}
          {formatDuration(destination.visitDurationMinutes)}
        </span>
        {destination.address ? (
          <span className="text-ink-muted mt-0.5 flex items-center gap-1 text-[11px]">
            <MapPin size={10} className="shrink-0" aria-hidden />
            <span className="truncate">{destination.address}</span>
          </span>
        ) : null}
      </span>
      <Button onClick={onAdd} className="shrink-0 px-3 py-1.5 text-xs">
        <Plus size={13} aria-hidden />
        Add
      </Button>
    </li>
  );
}
