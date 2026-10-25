"use client";

import { useEffect, useRef } from "react";
import {
  Clock,
  Heart,
  MapPin,
  Navigation,
  Plus,
  Star,
  Timer,
  X,
} from "lucide-react";
import { formatDuration } from "@/lib/format";
import type { Destination } from "@/lib/types";
import { CategoryIcon } from "./CategoryIcon";
import { Button, Chip, Stat, cx } from "./ui";

/**
 * Destination detail. Native `<dialog>` so Escape, the top layer and focus
 * containment come from the platform; on narrow screens it is styled as a
 * bottom sheet that fills the viewport.
 */
export function DestinationDetailModal({
  destination,
  open,
  onClose,
  isFavorite,
  onToggleFavorite,
  onAddToItinerary,
  inItinerary,
}: {
  destination?: Destination;
  open: boolean;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onAddToItinerary?: () => void;
  inItinerary: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);


  return (
    <dialog
      ref={ref}
      aria-labelledby="destination-modal-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className={cx(
        "bg-paper text-ink m-0 w-screen max-w-none p-0 backdrop:bg-[#241a16]/60",
        // Mobile: full-height sheet pinned to the bottom. Desktop: centred card
        // that only grows to fit. Scoped with `max-sm:` so the two height rules
        // never both apply. A plain `h-*` plus `sm:h-auto` pair loses to source order.
        "max-sm:mt-auto max-sm:h-[94dvh] max-sm:rounded-t-3xl",
        // 62rem wide when a photo gallery sat beside the facts; without one
        // the text is all there is, so the card narrows to fit it.
        "sm:m-auto sm:max-h-[90dvh] sm:w-[min(34rem,94vw)] sm:rounded-2xl",
      )}
    >
      {destination ? (
        <div className="flex h-full flex-col">
          <div className="border-line bg-paper sticky top-0 z-10 flex items-start gap-3 border-b px-4 py-3 sm:px-6">
            {/* Small, beside the title, rather than a panel of its own: one
                icon does not fill a column, and the name is what the eye
                comes here for anyway. */}
            <span className="border-line mt-0.5 size-10 shrink-0 overflow-hidden rounded-lg border">
              <CategoryIcon category={destination.category} size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="destination-modal-title" className="truncate text-xl">
                {destination.name}
              </h2>
              <p className="text-ink-muted mt-0.5 truncate text-xs">
                {[
                  destination.category,
                  // Tags often repeat the category ("Bookstore"); don't say it twice.
                  ...destination.tags.filter(
                    (tag) => tag.toLowerCase() !== destination.category.toLowerCase(),
                  ),
                ]
                  .slice(0, 3)
                  .join(" · ")}
              </p>
            </div>
            <button
              type="button"
              onClick={onToggleFavorite}
              aria-pressed={isFavorite}
              aria-label={
                isFavorite
                  ? `Remove ${destination.name} from saved`
                  : `Save ${destination.name} for later`
              }
              className="hover:bg-clay-soft flex size-9 shrink-0 items-center justify-center rounded-full transition-colors"
            >
              <Heart
                size={18}
                className="text-clay"
                fill={isFavorite ? "currentColor" : "none"}
                aria-hidden
              />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close place details"
              className="hover:bg-clay-soft text-ink-soft flex size-9 shrink-0 items-center justify-center rounded-full transition-colors"
            >
              <X size={18} aria-hidden />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="space-y-4">
              {destination.rating !== undefined ? (
                <p className="text-ink-soft flex items-center gap-1.5 text-sm">
                  <Star size={14} className="text-clay" fill="currentColor" aria-hidden />
                  <span className="font-medium">{destination.rating.toFixed(1)}</span>
                  {destination.reviewCount ? (
                    <span className="text-ink-muted text-xs">
                      ({destination.reviewCount.toLocaleString("en-US")}+ reviews)
                    </span>
                  ) : null}
                </p>
              ) : null}

              <p className="text-ink-soft text-sm leading-relaxed">
                {destination.description}
              </p>

              <div className="flex flex-wrap gap-1.5">
                {destination.bookingRequired ? (
                  <Chip tone="clay">Book ahead</Chip>
                ) : null}
                {destination.tags.map((tag) => (
                  <Chip key={tag}>{tag}</Chip>
                ))}
              </div>

              <dl className="border-line space-y-3 border-t pt-4">
                <Stat icon={<Clock size={15} />} label="Opening hours">
                  {destination.openingHours ?? (
                    <span className="text-ink-muted">Not listed anywhere</span>
                  )}
                </Stat>
                <Stat icon={<Timer size={15} />} label="How long to stay">
                  {formatDuration(destination.visitDurationMinutes)}
                </Stat>
                <Stat icon={<MapPin size={15} />} label="Address">
                  {/* A place found through search has only the address tags
                      OpenStreetMap happens to carry, which is often none. */}
                  {destination.address || (
                    <span className="text-ink-muted">Not listed anywhere</span>
                  )}
                  {destination.locationPrecision === "approximate" ? (
                    <span className="text-ink-muted mt-0.5 block text-xs">
                      Rough pin. This one is not mapped exactly, so check
                      before you set off.
                    </span>
                  ) : null}
                </Stat>
              </dl>

              <div className="flex flex-col gap-2 pt-1">
                <a
                  href={destination.directionsUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="bg-clay hover:bg-clay-dark inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-white transition-colors"
                >
                  <Navigation size={15} aria-hidden />
                  Open in Maps
                </a>

                <div className="grid gap-2 sm:grid-cols-2">
                  <Button variant="secondary" onClick={onToggleFavorite}>
                    <Heart
                      size={15}
                      fill={isFavorite ? "currentColor" : "none"}
                      aria-hidden
                    />
                    {isFavorite ? "Saved" : "Save for later"}
                  </Button>
                  {onAddToItinerary ? (
                    <Button
                      variant="secondary"
                      onClick={onAddToItinerary}
                      disabled={inItinerary}
                    >
                      <Plus size={15} aria-hidden />
                      {inItinerary ? "Already in the plan" : "Add to the plan"}
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

        </div>
      ) : null}
    </dialog>
  );
}
