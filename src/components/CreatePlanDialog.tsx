"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { MOODS } from "@/data/plans";
import type { Mood } from "@/lib/types";
import { Button, cx } from "./ui";

/**
 * Title, start time and mood. Stops are not picked here on purpose: the plan
 * page already has a stop picker with photos, durations and a live map, and
 * rebuilding a worse one inside a dialog helps nobody.
 */
export function CreatePlanDialog({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (input: { title: string; mood: Mood; startTime: string }) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [title, setTitle] = useState("");
  const [mood, setMood] = useState<Mood>("foodie");
  const [startTime, setStartTime] = useState("15:00");

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="create-plan-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className="bg-paper text-ink m-0 w-screen max-w-none p-0 backdrop:bg-[#241a16]/60 max-sm:mt-auto max-sm:rounded-t-3xl sm:m-auto sm:w-[min(28rem,94vw)] sm:rounded-2xl"
    >
      <form
        method="dialog"
        onSubmit={(event) => {
          event.preventDefault();
          onCreate({ title, mood, startTime });
        }}
      >
        <div className="border-line flex items-center gap-3 border-b px-4 py-3">
          <h2 id="create-plan-title" className="flex-1 text-lg">
            Start a plan
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="hover:bg-clay-soft text-ink-soft flex size-9 items-center justify-center rounded-full transition-colors"
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        <div className="space-y-4 p-4">
          <label className="block">
            <span className="text-ink-muted block text-[11px] tracking-wide uppercase">
              Call it
            </span>
            <input
              autoFocus
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Saturday, probably food"
              maxLength={60}
              className="border-line focus:border-clay mt-1 w-full rounded-xl border px-3 py-2 text-sm focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="text-ink-muted block text-[11px] tracking-wide uppercase">
              Setting off around
            </span>
            {/* Native time input: a picker library for this would be silly. */}
            <input
              type="time"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
              required
              className="border-line focus:border-clay mt-1 w-full rounded-xl border px-3 py-2 text-sm focus:outline-none"
            />
          </label>

          <fieldset>
            <legend className="text-ink-muted block text-[11px] tracking-wide uppercase">
              Mood
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {MOODS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={mood === item.id}
                  onClick={() => setMood(item.id)}
                  className={cx(
                    "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                    mood === item.id
                      ? "bg-clay text-white"
                      : "border-line text-ink-soft hover:bg-clay-soft border",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </fieldset>

          <p className="text-ink-muted text-xs leading-relaxed">
            You add stops on the next screen. Plans you make are kept in this
            browser only, so they will not follow you to another device.
          </p>
        </div>

        <div className="border-line flex justify-end gap-2 border-t px-4 py-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Make it</Button>
        </div>
      </form>
    </dialog>
  );
}
