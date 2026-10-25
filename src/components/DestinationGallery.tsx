"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight, Expand } from "lucide-react";
import type { Photo } from "@/lib/types";
import { SafeImage } from "./SafeImage";
import { cx } from "./ui";

/**
 * Featured photo + thumbnail strip + prev/next + counter.
 * The index is owned by the parent so the lightbox opens on the same photo.
 */
export function DestinationGallery({
  photos,
  index,
  onIndexChange,
  onExpand,
  destinationName,
  priority,
}: {
  photos: Photo[];
  index: number;
  onIndexChange: (next: number) => void;
  onExpand?: () => void;
  destinationName: string;
  priority?: boolean;
}) {
  const hasPhotos = photos.length > 0;
  const safeIndex = hasPhotos ? Math.min(index, photos.length - 1) : 0;
  const current = photos[safeIndex];

  const step = (delta: number) => {
    if (!hasPhotos) return;
    onIndexChange((safeIndex + delta + photos.length) % photos.length);
  };

  const swipe = useSwipe({ onLeft: () => step(1), onRight: () => step(-1) });

  return (
    <div className="space-y-2">
      <div
        className="border-line bg-clay-soft/40 relative aspect-[4/3] overflow-hidden rounded-xl border"
        {...swipe}
      >
        <SafeImage
          src={current?.url}
          alt={current?.alt ?? `${destinationName}, no photo available`}
          sizes="(max-width: 1024px) 100vw, 55vw"
          priority={priority}
          fallbackLabel="No photos for this place yet"
        />

        {hasPhotos ? (
          <>
            {onExpand ? (
              <button
                type="button"
                onClick={onExpand}
                aria-label={`Open ${destinationName} photo ${safeIndex + 1} full screen`}
                className="absolute inset-0 cursor-zoom-in"
              >
                <span className="text-ink absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium opacity-0 transition-opacity hover:opacity-100 focus-visible:opacity-100">
                  <Expand size={11} aria-hidden />
                  Expand
                </span>
              </button>
            ) : null}

            <span
              aria-live="polite"
              className="pointer-events-none absolute top-3 right-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white"
            >
              {safeIndex + 1} of {photos.length}
            </span>

            {photos.length > 1 ? (
              <>
                <GalleryArrow side="left" onClick={() => step(-1)} />
                <GalleryArrow side="right" onClick={() => step(1)} />
              </>
            ) : null}

            {current?.caption ? (
              <p className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent px-3 pt-8 pb-2.5 text-xs text-white/90">
                {current.caption}
              </p>
            ) : null}
          </>
        ) : null}
      </div>

      {photos.length > 1 ? (
        <ul className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
          {photos.map((photo, i) => (
            <li key={photo.id}>
              <button
                type="button"
                onClick={() => onIndexChange(i)}
                aria-label={`Show photo ${i + 1} of ${photos.length}: ${photo.alt}`}
                aria-current={i === safeIndex}
                className={cx(
                  "relative block h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-colors",
                  i === safeIndex
                    ? "border-clay"
                    : "border-line hover:border-line-strong",
                )}
              >
                <SafeImage src={photo.url} alt="" sizes="80px" fallbackLabel="" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function GalleryArrow({
  side,
  onClick,
}: {
  side: "left" | "right";
  onClick: () => void;
}) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Previous photo" : "Next photo"}
      className={cx(
        "text-ink absolute top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-sm transition-colors hover:bg-white",
        side === "left" ? "left-2" : "right-2",
      )}
    >
      <Icon size={16} aria-hidden />
    </button>
  );
}

/** Horizontal swipe for one-handed browsing on mobile. */
function useSwipe({ onLeft, onRight }: { onLeft: () => void; onRight: () => void }) {
  const start = useRef<{ x: number; y: number } | null>(null);

  return {
    onTouchStart: (event: React.TouchEvent) => {
      const touch = event.touches[0];
      start.current = { x: touch.clientX, y: touch.clientY };
    },
    onTouchEnd: (event: React.TouchEvent) => {
      if (!start.current) return;
      const touch = event.changedTouches[0];
      const dx = touch.clientX - start.current.x;
      const dy = touch.clientY - start.current.y;
      start.current = null;
      // Ignore mostly-vertical gestures so page scrolling still works.
      if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy)) return;
      if (dx < 0) onLeft();
      else onRight();
    },
  };
}
