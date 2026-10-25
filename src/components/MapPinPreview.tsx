"use client";

import { Clock } from "lucide-react";
import { formatDuration } from "@/lib/format";
import type { Destination } from "@/lib/types";
import { CategoryIcon } from "./CategoryIcon";
import { Button } from "./ui";

/** The compact card that appears when a pin is tapped. */
export function MapPinPreview({
  destination,
  onViewDetails,
}: {
  destination: Destination;
  onViewDetails: () => void;
}) {
  return (
    <div className="border-line bg-paper flex w-60 gap-3 rounded-xl border p-2.5 shadow-lg">
      <div className="border-line size-16 shrink-0 overflow-hidden rounded-lg border">
        <CategoryIcon category={destination.category} size={22} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-ink truncate text-sm font-semibold">{destination.name}</p>
        {/* The icon beside this is decorative, so the category has to be said
            here or a tapped pin never names what kind of place it is. */}
        <p className="text-ink-muted truncate text-xs">{destination.category}</p>
        <p className="text-ink-muted mt-0.5 flex items-center gap-1 text-xs">
          <Clock size={11} aria-hidden />
          {formatDuration(destination.visitDurationMinutes)} here
        </p>
        <Button onClick={onViewDetails} className="mt-2 w-full px-3 py-1.5 text-xs">
          See the place
        </Button>
      </div>
    </div>
  );
}
