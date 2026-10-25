import Link from "next/link";
import { ArrowRight, Clock, MapPin } from "lucide-react";
import { getDestinations } from "@/data/destinations";
import { calculateTotals } from "@/lib/itinerary";
import { estimateRoute } from "@/lib/routing";
import { formatDurationBand } from "@/lib/format";
import type { Plan } from "@/lib/types";
import { SafeImage } from "./SafeImage";
import { Chip } from "./ui";

/**
 * Card durations use the offline distance estimate rather than a live route:
 * a Discover grid should not fire a routing request per card, and the figure is
 * shown as a band ("3–4 hours") precisely because it is approximate.
 */
export function PlanCard({
  plan,
  priority,
  href,
}: {
  plan: Plan;
  priority?: boolean;
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
      <div className="relative aspect-[4/3] overflow-hidden">
        <SafeImage
          src={plan.coverPhoto.url}
          alt={plan.coverPhoto.alt}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          priority={priority}
          className="transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-x-0 bottom-0 flex gap-2 bg-gradient-to-t from-black/55 to-transparent p-3 pt-10">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/92 px-2.5 py-1 text-[11px] font-medium text-ink">
            <MapPin size={12} aria-hidden />
            {destinations.length} stops
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/92 px-2.5 py-1 text-[11px] font-medium text-ink">
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
          {/* The badges over the photo already carry stops and length, so this
              row shows the one thing they do not: when to set off. */}
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
