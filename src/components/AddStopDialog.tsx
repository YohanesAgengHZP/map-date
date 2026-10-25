"use client";

import { useEffect, useRef } from "react";
import { Plus, X } from "lucide-react";
import { formatDuration } from "@/lib/format";
import type { Destination } from "@/lib/types";
import { SafeImage } from "./SafeImage";
import { Button } from "./ui";

export function AddStopDialog({
  open,
  options,
  onClose,
  onAdd,
}: {
  open: boolean;
  options: Destination[];
  onClose: () => void;
  onAdd: (id: string) => void;
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
      aria-labelledby="add-stop-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className="bg-paper text-ink m-0 w-screen max-w-none p-0 backdrop:bg-[#241a16]/60 max-sm:mt-auto max-sm:h-[80dvh] max-sm:rounded-t-3xl sm:m-auto sm:max-h-[85dvh] sm:w-[min(32rem,94vw)] sm:rounded-2xl"
    >
      <div className="flex h-full flex-col">
        <div className="border-line flex items-center gap-3 border-b px-4 py-3">
          <h2 id="add-stop-title" className="flex-1 text-lg">
            Add a stop
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

        {options.length === 0 ? (
          <p className="text-ink-soft p-6 text-center text-sm">
            Everywhere else is already in this plan.
          </p>
        ) : (
          <ul className="min-h-0 flex-1 overflow-y-auto p-3">
            {options.map((destination) => (
              <li
                key={destination.id}
                className="border-line hover:bg-clay-soft/30 flex items-center gap-3 rounded-xl border-b p-2 last:border-b-0"
              >
                <span className="border-line relative size-14 shrink-0 overflow-hidden rounded-lg border">
                  <SafeImage
                    src={destination.photos[0]?.url}
                    alt={destination.photos[0]?.alt ?? destination.name}
                    sizes="56px"
                    fallbackLabel="No photo"
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">
                    {destination.name}
                  </span>
                  <span className="text-ink-muted block truncate text-xs">
                    {destination.category} ·{" "}
                    {formatDuration(destination.visitDurationMinutes)}
                  </span>
                </span>
                <Button
                  onClick={() => onAdd(destination.id)}
                  className="shrink-0 px-3 py-1.5 text-xs"
                >
                  <Plus size={13} aria-hidden />
                  Add
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </dialog>
  );
}
