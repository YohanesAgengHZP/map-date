"use client";

import { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { Photo } from "@/lib/types";
import { SafeImage } from "./SafeImage";
import { cx } from "./ui";

/**
 * Full-screen photo view. Uses a native `<dialog>`, which gives Escape-to-close,
 * the top layer and focus containment without a focus-trap dependency.
 */
export function PhotoLightbox({
  open,
  photos,
  index,
  onIndexChange,
  onClose,
  title,
}: {
  open: boolean;
  photos: Photo[];
  index: number;
  onIndexChange: (next: number) => void;
  onClose: () => void;
  title: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const step = (delta: number) => {
    if (photos.length === 0) return;
    onIndexChange((index + delta + photos.length) % photos.length);
  };

  const current = photos[index];

  return (
    <dialog
      ref={ref}
      aria-label={`${title} photos`}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") step(1);
        if (event.key === "ArrowLeft") step(-1);
      }}
      className="m-0 h-dvh max-h-none w-screen max-w-none bg-[#17120f]/97 p-0 backdrop:bg-black/70"
    >
      {open && current ? (
        <div className="flex h-full flex-col gap-3 p-3 sm:flex-row sm:p-6">
          <div className="relative min-h-0 flex-1">
            <SafeImage
              src={current.url}
              alt={current.alt}
              sizes="100vw"
              className="object-contain"
            />

            {/* Left-aligned: the close control owns the top-right corner. */}
            <span className="absolute top-3 left-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white">
              {index + 1} / {photos.length}
            </span>

            {photos.length > 1 ? (
              <>
                <LightboxArrow side="left" onClick={() => step(-1)} />
                <LightboxArrow side="right" onClick={() => step(1)} />
              </>
            ) : null}

            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-4 pt-10 pb-3">
              <p className="text-sm font-semibold text-white">{title}</p>
              {current.caption ? (
                <p className="text-xs text-white/75">{current.caption}</p>
              ) : null}
            </div>
          </div>

          {photos.length > 1 ? (
            <ul className="hide-scrollbar flex shrink-0 gap-2 overflow-x-auto sm:w-24 sm:flex-col sm:overflow-x-visible sm:overflow-y-auto">
              {photos.map((photo, i) => (
                <li key={photo.id}>
                  <button
                    type="button"
                    onClick={() => onIndexChange(i)}
                    aria-label={`Show photo ${i + 1}: ${photo.alt}`}
                    aria-current={i === index}
                    className={cx(
                      "relative block h-14 w-20 shrink-0 overflow-hidden rounded-md border-2 transition-colors sm:h-16 sm:w-full",
                      i === index ? "border-rose" : "border-white/20 hover:border-white/50",
                    )}
                  >
                    <SafeImage src={photo.url} alt="" sizes="96px" fallbackLabel="" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          <button
            type="button"
            onClick={onClose}
            aria-label="Close photo viewer"
            className="absolute top-4 right-4 z-10 flex size-9 items-center justify-center rounded-full bg-black/55 text-white transition-colors hover:bg-black/75 sm:top-6 sm:right-6"
          >
            <X size={17} aria-hidden />
          </button>
        </div>
      ) : null}
    </dialog>
  );
}

function LightboxArrow({
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
        "absolute top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white transition-colors hover:bg-black/70",
        side === "left" ? "left-2 sm:left-4" : "right-2 sm:right-4",
      )}
    >
      <Icon size={20} aria-hidden />
    </button>
  );
}
