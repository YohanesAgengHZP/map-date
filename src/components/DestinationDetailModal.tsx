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
import { useLocalStore } from "@/lib/useLocalStore";
import {
  DURATION_PRESETS,
  setVisitDuration,
  visitDurationsStore,
} from "@/lib/visitDurations";
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
    if (open && !dialog.open) {
      dialog.showModal();
      // The first focusable in here is the heart, so opening a place put a
      // keyboard user on "Save for later" before they had read a word of it.
      // Focusing the card itself starts them at the top, where the name is.
      dialog.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      tabIndex={-1}
      aria-labelledby="destination-modal-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className={cx(
        // `open:flex`, not `flex`: a bare `display:flex` would beat the UA's
        // `dialog:not([open]) { display: none }` and show the card while closed.
        "bg-paper text-ink m-0 w-screen max-w-none p-0 backdrop:bg-[#241a16]/60 open:flex open:flex-col",
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
        // `min-h-0 flex-1`, not `h-full`: at `sm` and up the dialog is capped
        // by `max-h` and has no definite height, so a percentage height here
        // resolved to `auto` and the scrollable body never got a height to
        // overflow. Same bug the stop search had.
        <div className="flex min-h-0 flex-1 flex-col">
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

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
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
                  <VisitDurationPicker destination={destination} />
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

/**
 * The only editable field in here, because it is the only one the app made up.
 * Everything else came from a source; this came from a lookup table keyed on
 * category, and it is what every arrival time in the plan is built on.
 *
 * A native `<select>` rather than a number input: the useful answers are a
 * short list, it needs no validation, and it is keyboard and screen-reader
 * sane with no library.
 */
function VisitDurationPicker({ destination }: { destination: Destination }) {
  const overrides = useLocalStore(visitDurationsStore);
  const published = destination.visitDurationMinutes;
  const current = overrides[destination.id] ?? published;
  const edited = current !== published;

  // The published figure is always offered, even when it is not a preset:
  // several built-in venues sit at 75 minutes, and dropping back to the
  // original has to stay reachable.
  const options = [...new Set([...DURATION_PRESETS, published, current])].sort(
    (a, b) => a - b,
  );

  return (
    // `Stat` stacks its label straight onto the value, so without the top
    // margin the focus ring overlaps "HOW LONG TO STAY"; the wider column gap
    // keeps it off the reset link.
    <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-2">
      <label className="sr-only" htmlFor="visit-duration">
        How long to stay at {destination.name}
      </label>
      <select
        id="visit-duration"
        value={current}
        onChange={(event) => {
          const minutes = Number(event.target.value);
          setVisitDuration(destination.id, minutes === published ? null : minutes);
        }}
        className="border-line cursor-pointer rounded-lg border bg-transparent px-2 py-1 text-sm"
      >
        {options.map((minutes) => (
          <option key={minutes} value={minutes}>
            {formatDuration(minutes)}
          </option>
        ))}
      </select>

      {edited ? (
        <button
          type="button"
          onClick={() => setVisitDuration(destination.id, null)}
          className="text-ink-muted hover:text-clay text-xs underline underline-offset-2"
        >
          Reset to {formatDuration(published)}
        </button>
      ) : null}
    </span>
  );
}
