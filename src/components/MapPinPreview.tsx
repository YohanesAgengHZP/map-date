"use client";

import { Clock } from "lucide-react";
import { formatDuration } from "@/lib/format";
import type { Destination } from "@/lib/types";
import { SafeImage } from "./SafeImage";
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
      <div className="border-line relative size-16 shrink-0 overflow-hidden rounded-lg border">
        <SafeImage
          src={destination.photos[0]?.url}
          alt={destination.photos[0]?.alt ?? destination.name}
          sizes="64px"
          fallbackLabel="No photo"
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-ink truncate text-sm font-semibold">{destination.name}</p>
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
