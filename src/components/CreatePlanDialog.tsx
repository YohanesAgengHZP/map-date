"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { MOODS } from "@/data/plans";
import type { Mood } from "@/lib/types";
import { Button, cx } from "./ui";

/**
 * Title, start time and mood. Stops are not picked here on purpose: the plan
 * page already has a stop picker with search, durations and a live map, and
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
            <span className="text-ink-muted block text-[11px] tracking-wider uppercase">
              Call it
            </span>
            <input
              autoFocus
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Saturday, probably food"
              maxLength={60}
              /* No `focus:outline-none`. It was being replaced by a one-pixel
                 border recolour, which is weaker than the two-pixel clay ring
                 `globals.css` already gives every `:focus-visible`, and it
                 fired on mouse clicks too because it was `focus:` rather than
                 `focus-visible:`. Letting the global ring do its job. */
              /* `text-base` below `sm`: iOS Safari zooms the page when a
                 focused input renders under 16px. */
              className="border-field focus:border-clay mt-1 w-full rounded-xl border px-3 py-2 text-base sm:text-sm"
            />
          </label>

          <label className="block">
            <span className="text-ink-muted block text-[11px] tracking-wider uppercase">
              Setting off around
            </span>
            {/* Native time input: a picker library for this would be silly. */}
            <input
              type="time"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
              required
              className="border-field focus:border-clay mt-1 w-full rounded-xl border px-3 py-2 text-base tabular-nums sm:text-sm"
            />
          </label>

          <fieldset>
            <legend className="text-ink-muted block text-[11px] tracking-wider uppercase">
              Mood
            </legend>
            {/* One arrives already picked, which read as a decision the app
                had made about your afternoon. It only files the plan under a
                filter, so the line says so and the choice stops mattering. */}
            <p className="text-ink-muted mt-1 text-xs">
              Only decides which mood filter your plan turns up under.
            </p>
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
                      // Outlined, so its border is what identifies it as a
                      // control. The selected one is filled and exempt.
                      : "border-field text-ink-soft hover:bg-clay-soft border",
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
