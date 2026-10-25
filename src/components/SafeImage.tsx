"use client";

import Image from "next/image";
import { useState } from "react";
import { ImageOff } from "lucide-react";
import { cx } from "./ui";

/**
 * `next/image` plus the two fallbacks the brief asks for: no photo at all, and
 * a photo URL that fails to load. Both land on the same quiet placeholder
 * instead of a broken frame.
 */
export function SafeImage({
  src,
  alt,
  sizes,
  priority,
  className,
  fallbackLabel = "No photo yet",
}: {
  src?: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  fallbackLabel?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={`${alt}. ${fallbackLabel}`}
        className={cx(
          "bg-clay-soft/70 text-ink-muted flex h-full w-full flex-col items-center justify-center gap-2 p-3 text-center",
          className,
        )}
      >
        <ImageOff size={20} aria-hidden />
        <span className="text-[11px] leading-tight">{fallbackLabel}</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      onError={() => setFailed(true)}
      className={cx("object-cover", className)}
    />
  );
}
