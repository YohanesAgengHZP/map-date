import Link from "next/link";
import { ArrowRight, Clock, MapPin } from "lucide-react";
import { getDestinations } from "@/data/destinations";
import { calculateTotals } from "@/lib/itinerary";
import { estimateRoute } from "@/lib/routing";
import { formatDurationBand } from "@/lib/format";
import type { Plan } from "@/lib/types";
import { CategoryPattern, iconFor } from "./CategoryIcon";
import { Chip } from "./ui";

/**
 * Card durations use the offline distance estimate rather than a live route:
 * a Discover grid should not fire a routing request per card, and the figure is
 * shown as a band ("3–4 hours") precisely because it is approximate.
 */
export function PlanCard({
  plan,
  href,
}: {
  plan: Plan;
  /** Plans the user made live at `/mine?id=`, not `/plan/[id]`. */
  href?: string;
}) {
  const destinations = getDestinations(plan.destinationIds);
  const { legs } = estimateRoute(destinations);
  const totals = calculateTotals(destinations, legs);
  const summary = destinations.map((d) => d.category).join(" → ");

  return (
    <Link
      href={href ?? `/plan/${plan.id}`}
      className="group border-line bg-paper focus-visible:outline-clay block overflow-hidden rounded-2xl border transition-shadow hover:shadow-[0_8px_30px_-12px_rgba(46,38,34,0.25)]"
    >
      {/* Where the cover photo used to be. A row of the plan's own category
          icons, derived from the stops: it changes as the plan does, and it
          says at a glance whether this is three restaurants or a museum and a
          park. Shallower than the old 4:3 photo, because an icon row does not
          need the height and the text below is now the thing worth reading.

          The same icons tile faintly behind it, because five of them centred
          in a 5:2 box left most of the box empty — worst on a plan with no
          stops yet, which was a single pin in a pink field. The row stays at
          full strength so it is still the thing being read. */}
      <div className="bg-clay-soft/50 border-line relative flex aspect-[5/2] items-center justify-center gap-4 overflow-hidden border-b">
        <CategoryPattern
          categories={destinations.map((d) => d.category)}
          tiles={24}
          className="text-clay/15"
        />

        {destinations.slice(0, 5).map((destination, index) => {
          const Icon = iconFor(destination.category);
          return (
            <Icon
              key={`${destination.id}-${index}`}
              size={28}
              strokeWidth={1.25}
              aria-hidden
              // `relative`, or the absolutely positioned pattern paints over it.
              className="text-clay relative transition-transform duration-500 group-hover:-translate-y-0.5"
            />
          );
        })}
        {destinations.length === 0 ? (
          <MapPin
            size={26}
            strokeWidth={1.25}
            aria-hidden
            className="text-clay/40 relative"
          />
        ) : null}

        <div className="absolute inset-x-0 bottom-0 flex gap-2 p-3">
          <span className="text-ink border-line inline-flex items-center gap-1 rounded-full border bg-white/90 px-2.5 py-1 text-[11px] font-medium">
            <MapPin size={12} aria-hidden />
            {destinations.length} stops
          </span>
          <span className="text-ink border-line inline-flex items-center gap-1 rounded-full border bg-white/90 px-2.5 py-1 text-[11px] font-medium">
            <Clock size={12} aria-hidden />
            {totals.totalMinutes === null
              ? "Length unknown"
              : formatDurationBand(totals.totalMinutes)}
          </span>
        </div>
      </div>

      <div className="space-y-2 p-4">
        <h3 className="text-lg leading-snug">{plan.title}</h3>
        <p className="text-ink-muted text-xs">{summary || "No stops yet"}</p>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {plan.tags.map((tag) => (
            <Chip key={tag} tone="clay">
              {tag}
            </Chip>
          ))}
        </div>

        <div className="border-line mt-3 flex items-center justify-between border-t pt-3">
          {/* The badges over the icon row already carry stops and length, so
              this row shows the one thing they do not: when to set off. */}
          <span className="text-ink-soft inline-flex items-center gap-1.5 text-sm">
            <Clock size={14} className="text-clay" aria-hidden />
            Starts around {plan.startTime}
          </span>
          <span
            aria-hidden
            className="bg-clay group-hover:bg-clay-dark flex size-8 items-center justify-center rounded-full text-white transition-colors"
          >
            <ArrowRight size={15} />
          </span>
        </div>
      </div>
    </Link>
  );
}
