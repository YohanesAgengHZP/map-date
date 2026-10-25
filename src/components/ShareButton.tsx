"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { encodePlan } from "@/lib/myPlans";
import type { Mood } from "@/lib/types";
import { Button } from "./ui";

/**
 * Puts the whole plan in a link so it can be sent to someone else.
 *
 * Tries the native share sheet first, because the realistic case is sending a
 * plan to one person from a phone. Falls back to the clipboard, and finally to
 * a prompt holding the URL, which is ugly but always works: a share button
 * that silently does nothing is worse.
 */
export function ShareButton({
  title,
  mood,
  startTime,
  destinationIds,
}: {
  title: string;
  mood: Mood;
  startTime: string;
  destinationIds: string[];
}) {
  const [done, setDone] = useState(false);

  const share = async () => {
    const token = encodePlan({ title, mood, startTime, destinationIds });
    const url = `${window.location.origin}/mine?plan=${token}`;

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // Dismissed, or unavailable for this payload: fall through to copying.
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setDone(true);
      window.setTimeout(() => setDone(false), 2_000);
    } catch {
      // Insecure context or a browser that refuses: hand over the raw link.
      window.prompt("Copy this link", url);
    }
  };

  return (
    <Button
      onClick={share}
      className="shrink-0 bg-white/15 text-white backdrop-blur hover:bg-white/25"
    >
      {done ? <Check size={15} aria-hidden /> : <Share2 size={15} aria-hidden />}
      {done ? "Link copied" : "Share"}
    </Button>
  );
}
