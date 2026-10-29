"use client";

import { Clock, Hourglass, Navigation } from "lucide-react";
import { formatDuration } from "@/lib/format";
import type { ItineraryTotals } from "@/lib/itinerary";
import type { EstimateSource } from "@/lib/types";

/**
 * Total duration = visit time + travel time. The two are shown separately
 * because they behave differently when stops are reordered, and because travel
 * can be unknown while visit time never is.
 */
export function PlanSummary({
  totals,
  routeSource,
}: {
  totals: ItineraryTotals;
  routeSource: EstimateSource;
}) {
  return (
    <div className="border-line bg-paper rounded-xl border">
      <dl className="grid grid-cols-2 divide-x divide-[var(--color-line)] sm:grid-cols-3">
        <Cell icon={<Clock size={14} />} label="Total duration">
          {totals.totalMinutes === null
            ? "Not sure"
            : formatDuration(totals.totalMinutes)}
          {totals.hasMissingTravel && totals.totalMinutes !== null ? (
            <span className="text-ink-muted text-xs"> +</span>
          ) : null}
        </Cell>

        <Cell icon={<Hourglass size={14} />} label="Time at stops">
          {formatDuration(totals.visitMinutes)}
        </Cell>

        <Cell
          icon={<Navigation size={14} />}
          label="Travel between stops"
          className="col-span-2 border-t border-[var(--color-line)] sm:col-span-1 sm:border-t-0"
        >
          {totals.travelMinutes === null
            ? "Not sure"
            : `~ ${formatDuration(totals.travelMinutes)}`}
        </Cell>
      </dl>

      <p className="border-line text-ink-muted border-t px-3 py-2 text-[11px] leading-relaxed">
        {routeSource === "routed"
          ? "Travel times are about right on a motorbike or an ojek, optimistic on a bike. Walks are marked separately."
          : routeSource === "estimated"
            ? "We could not check the roads just now, so these travel times are rough guesses from the distance alone."
            : "No travel times this time, so the total only counts time at the stops."}
      </p>
    </div>
  );
}

function Cell({
  icon,
  label,
  children,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    // A column with the value pushed to the bottom, because the three labels
    // are not the same length: "Travel between stops" wrapped to three lines
    // where "Time at stops" took one, and the figures ended up on three
    // different baselines. Pinning them to the bottom lines them up whatever
    // the labels do. Sentence case rather than uppercase with letter-spacing,
    // which is what made the longest label wrap in the first place.
    <div className={`flex flex-col px-3 py-2.5 ${className ?? ""}`}>
      <dt className="text-ink-muted flex items-start gap-1.5 text-[11px] leading-tight">
        <span className="text-clay mt-px shrink-0">{icon}</span>
        {label}
      </dt>
      {/* `tabular-nums`: every figure here is recomputed when a stop is added,
          removed or reordered, and proportional digits changed width as they
          did it, so the three columns twitched on each edit. */}
      <dd className="text-ink mt-auto pt-1.5 text-sm font-semibold tabular-nums">
        {children}
      </dd>
    </div>
  );
}
