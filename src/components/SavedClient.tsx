"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { getDestinations } from "@/data/destinations";
import { formatDuration } from "@/lib/format";
import { useFavorites } from "@/lib/useFavorites";
import { useLocalStore } from "@/lib/useLocalStore";
import { visitDurationsStore, withVisitDurations } from "@/lib/visitDurations";
import { DestinationDetailModal } from "./DestinationDetailModal";
import { CategoryIcon } from "./CategoryIcon";
import { Button } from "./ui";

export function SavedClient() {
  const { favoriteIds, isFavorite, toggle } = useFavorites();
  const [detailId, setDetailId] = useState<string | null>(null);
  const durations = useLocalStore(visitDurationsStore);
  const saved = withVisitDurations(getDestinations(favoriteIds), durations);
  const detailDestination = saved.find((d) => d.id === detailId);

  if (saved.length === 0) {
    return (
      <p className="border-line text-ink-soft mt-6 rounded-2xl border border-dashed p-10 text-center text-sm">
        Nothing saved yet. Tap the heart on a place to keep it here.
      </p>
    );
  }

  return (
    <>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {saved.map((destination) => (
          <li
            key={destination.id}
            className="border-line bg-paper overflow-hidden rounded-2xl border"
          >
            <div className="relative aspect-[5/2]">
              {/* The one place with a whole 5:2 box and a single icon to put
                  in it, so it tiles: patternless, this was the emptiest
                  surface left in the app. */}
              <CategoryIcon category={destination.category} size={34} pattern />
              <button
                type="button"
                onClick={() => toggle(destination.id)}
                aria-label={`Remove ${destination.name} from saved`}
                className="text-clay absolute top-2 right-2 flex size-8 items-center justify-center rounded-full bg-white/90"
              >
                <Heart size={15} fill="currentColor" aria-hidden />
              </button>
            </div>
            <div className="space-y-1 p-3">
              <p className="text-sm font-semibold">{destination.name}</p>
              <p className="text-ink-muted text-xs">
                {destination.category} ·{" "}
                {formatDuration(destination.visitDurationMinutes)}
              </p>
              <Button
                variant="secondary"
                className="mt-2 w-full"
                onClick={() => setDetailId(destination.id)}
              >
                See the place
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <DestinationDetailModal
        destination={detailDestination}
        open={detailId !== null}
        onClose={() => setDetailId(null)}
        isFavorite={detailId ? isFavorite(detailId) : false}
        onToggleFavorite={() => detailId && toggle(detailId)}
        inItinerary={false}
      />
    </>
  );
}
