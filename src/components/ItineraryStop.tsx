"use client";

import { ArrowDown, ArrowUp, Footprints, Navigation, Trash2 } from "lucide-react";
import { formatClock, formatDistance, formatDuration } from "@/lib/format";
import type { ItineraryStop as Stop } from "@/lib/types";
import { CategoryIcon } from "./CategoryIcon";
import { cx } from "./ui";

export function ItineraryStop({
  stop,
  selected,
  isFirst,
  isLast,
  onSelect,
  onViewDetails,
  onMove,
  onRemove,
  canRemove,
}: {
  stop: Stop;
  selected: boolean;
  isFirst: boolean;
  isLast: boolean;
  onSelect: () => void;
  onViewDetails: () => void;
  onMove: (delta: number) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const { destination, order, arrivalMinutes, departureMinutes, travelToNext } = stop;

  return (
    <li>
      <div
        className={cx(
          "rounded-xl border transition-colors",
          selected
            ? "border-clay bg-clay-soft/40"
            : "border-line bg-paper hover:border-line-strong",
        )}
      >
        {/* The whole card selects the stop; the controls below are separate
            buttons, so they are rendered as siblings rather than nested. */}
        <button
          type="button"
          onClick={onSelect}
          aria-pressed={selected}
          aria-label={`Stop ${order}: ${destination.name}`}
          className="flex w-full gap-3 p-3 text-left"
        >
          <span
            aria-hidden
            className={cx(
              "flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
              selected ? "bg-clay-dark text-white" : "bg-clay text-white",
            )}
          >
            {order}
          </span>

          <span className="border-line size-16 shrink-0 overflow-hidden rounded-lg border">
            <CategoryIcon category={destination.category} size={22} />
          </span>

          <span className="min-w-0 flex-1">
            <span className="text-ink block truncate text-sm font-semibold">
              {destination.name}
            </span>
            <span className="text-ink-muted block truncate text-xs">
              {destination.category}
            </span>
            <span className="text-ink-soft mt-1 block text-xs">
              {formatClock(arrivalMinutes)} – {formatClock(departureMinutes)}
              <span className="text-ink-muted">
                {" "}
                ({formatDuration(destination.visitDurationMinutes)})
              </span>
            </span>
          </span>
        </button>

        <div className="border-line flex items-center gap-1 border-t px-2 py-1.5">
          <button
            type="button"
            onClick={onViewDetails}
            className="text-clay hover:bg-clay-soft rounded-full px-2.5 py-1 text-xs font-medium transition-colors"
          >
            See the place
          </button>
          <div className="ml-auto flex items-center gap-0.5">
            <IconButton
              label={`Move ${destination.name} earlier`}
              disabled={isFirst}
              onClick={() => onMove(-1)}
            >
              <ArrowUp size={14} aria-hidden />
            </IconButton>
            <IconButton
              label={`Move ${destination.name} later`}
              disabled={isLast}
              onClick={() => onMove(1)}
            >
              <ArrowDown size={14} aria-hidden />
            </IconButton>
            <IconButton
              label={`Take ${destination.name} out of the plan`}
              disabled={!canRemove}
              onClick={onRemove}
            >
              <Trash2 size={14} aria-hidden />
            </IconButton>
          </div>
        </div>
      </div>

      {travelToNext ? (
        <p className="text-ink-muted flex items-center gap-1.5 py-2 pl-5 text-xs">
          {travelToNext.mode === "walking" ? (
            <Footprints size={12} aria-hidden />
          ) : (
            <Navigation size={12} aria-hidden />
          )}
          {travelToNext.minutes === null ? (
            <span>No travel estimate</span>
          ) : (
            <span>
              {formatDuration(travelToNext.minutes)}
              {travelToNext.mode === "walking" ? " on foot" : ""}
              {travelToNext.meters !== null
                ? ` · ${formatDistance(travelToNext.meters)}`
                : ""}
              {travelToNext.source === "estimated" ? " (est.)" : ""}
            </span>
          )}
        </p>
      ) : null}
    </li>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="text-ink-soft hover:bg-clay-soft hover:text-clay flex size-7 items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  );
}
