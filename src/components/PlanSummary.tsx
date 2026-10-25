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
          ? "Travel times come from a routing service. About right on a motorbike or an ojek, optimistic on a bike. Walks are marked separately."
          : routeSource === "estimated"
            ? "Could not reach the routing service, so these travel times are rough guesses from distance alone."
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
    <div className={`px-3 py-2.5 ${className ?? ""}`}>
      <dt className="text-ink-muted flex items-center gap-1.5 text-[11px] tracking-wide uppercase">
        <span className="text-clay">{icon}</span>
        {label}
      </dt>
      <dd className="text-ink mt-0.5 text-sm font-semibold">{children}</dd>
    </div>
  );
}
