"use client";

import { Plus } from "lucide-react";
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
  allowEmpty = false,
}: {
  stops: Stop[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onViewDetails: (id: string) => void;
  onMove: (index: number, delta: number) => void;
  onRemove: (id: string) => void;
  onAddStop: () => void;
  /**
   * A built-in plan always keeps at least one stop, because emptying one is
   * never what you meant. A plan you made is yours to empty, and it started
   * empty anyway.
   */
  allowEmpty?: boolean;
}) {
  return (
    <section aria-label="The plan, stop by stop">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-xl">The plan</h2>
        <span className="text-ink-muted text-xs">
          {stops.length} {stops.length === 1 ? "stop" : "stops"}
        </span>
      </div>

      {stops.length === 0 ? (
        <p className="border-line text-ink-soft mt-3 rounded-xl border border-dashed p-6 text-center text-sm">
          Nothing here yet. Add a stop below to start.
        </p>
      ) : (
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
      )}

      <Button variant="secondary" onClick={onAddStop} className="mt-3 w-full">
        <Plus size={15} aria-hidden />
        Add another stop
      </Button>
    </section>
  );
}
