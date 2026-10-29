"use client";

import { useEffect, useRef } from "react";
import { Loader2, Plus, Shuffle } from "lucide-react";
import type { ItineraryStop as Stop } from "@/lib/types";
import { ItineraryStop } from "./ItineraryStop";
import { Button } from "./ui";

export function ItineraryPanel({
  stops,
  selectedId,
  onSelect,
  onViewDetails,
  onMove,
  onRemove,
  onAddStop,
  onTidyOrder,
  tidying = false,
  orderNote,
  undoName = null,
  onUndoRemove,
  allowEmpty = false,
}: {
  stops: Stop[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onViewDetails: (id: string) => void;
  onMove: (index: number, delta: number) => void;
  onRemove: (id: string) => void;
  onAddStop: () => void;
  /** Ask the router for the shortest order through the same stops. */
  onTidyOrder: () => void;
  tidying?: boolean;
  /** What came back when the order did not change. */
  orderNote?: string | null;
  /** The stop last taken out, if it can still be put back. */
  undoName?: string | null;
  onUndoRemove?: () => void;
  /**
   * A built-in plan always keeps at least one stop, because emptying one is
   * never what you meant. A plan you made is yours to empty, and it started
   * empty anyway.
   */
  allowEmpty?: boolean;
}) {
  // Below three stops there is nothing to rearrange: the first one stays put.
  const canTidy = stops.length >= 3;

  /**
   * Focus the undo button once per removal, not once per render.
   *
   * An inline `ref={(node) => node?.focus()}` is a new function on every
   * render, so React reattaches and re-runs it every time — and the route
   * fetch that follows a removal lands a second or two later and re-renders.
   * Focus was being snatched back from wherever the user had moved on to.
   * Keyed on the name, so removing a second stop still moves focus.
   */
  const undoRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (undoName) undoRef.current?.focus();
  }, [undoName]);

  return (
    <section aria-label="The plan, stop by stop">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-xl">The plan</h2>
        <span className="text-ink-muted text-xs">
          {stops.length} {stops.length === 1 ? "stop" : "stops"}
        </span>
      </div>

      {/* No "nothing here yet" placeholder. It sat directly above a button
          that said the same thing, under a heading already reading "0 stops",
          on a page whose description and map both say it too. */}
      {stops.length > 0 ? (
        <ol className="mt-3">
          {stops.map((stop, index) => (
            <ItineraryStop
              key={stop.destination.id}
              stop={stop}
              selected={stop.destination.id === selectedId}
              isFirst={index === 0}
              isLast={index === stops.length - 1}
              onSelect={() => onSelect(stop.destination.id)}
              onViewDetails={() => onViewDetails(stop.destination.id)}
              onMove={(delta) => onMove(index, delta)}
              onRemove={() => onRemove(stop.destination.id)}
              canRemove={allowEmpty || stops.length > 1}
            />
          ))}
        </ol>
      ) : null}

      {canTidy ? (
        <button
          type="button"
          onClick={onTidyOrder}
          disabled={tidying}
          className="text-clay hover:bg-clay-soft mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50"
        >
          {tidying ? (
            <Loader2 size={13} aria-hidden className="animate-spin" />
          ) : (
            <Shuffle size={13} aria-hidden />
          )}
          {tidying ? "Working it out" : "Tidy up the order"}
        </button>
      ) : null}

      {/* A note, not a toast: nothing changed on screen, so something has to
          say why. `role="status"` because it answers a button press.

          Always mounted, never conditionally rendered with its text: a live
          region inserted at the same moment as its content is announced
          unreliably. One region for both messages, so there is one voice here.

          The undo button takes focus as it appears (see `undoRef` above).
          Removing a stop unmounts the button that was focused, which dropped
          focus to `<body>` and sent a keyboard user back to the top of the
          document; landing them on the way back is both the fix and the
          useful place to be. */}
      <p role="status" className="text-ink-muted mt-1 flex min-h-5 items-center gap-2 px-2.5 text-xs">
        {undoName ? (
          <>
            <span>Took {undoName} out.</span>
            <button
              ref={undoRef}
              type="button"
              onClick={onUndoRemove}
              className="text-clay font-medium underline underline-offset-2"
            >
              Undo
            </button>
          </>
        ) : (
          orderNote
        )}
      </p>

      {/* On an empty plan this is the only thing left to do, so it leads
          rather than sitting under the filled "Open in Maps" link — which a
          plan with no stops cannot use anyway. "Another" needs a first. */}
      <Button
        variant={stops.length === 0 ? "primary" : "secondary"}
        onClick={onAddStop}
        className="mt-3 w-full"
      >
        <Plus size={15} aria-hidden />
        {stops.length === 0 ? "Add the first stop" : "Add another stop"}
      </Button>
    </section>
  );
}
