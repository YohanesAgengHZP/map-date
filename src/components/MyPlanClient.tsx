"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { Trash2 } from "lucide-react";
import { toPlan, useMyPlans } from "@/lib/myPlans";
import { PlanClient } from "./PlanClient";
import { Button } from "./ui";

/**
 * A plan the user made, addressed by `?id=`.
 *
 * It is a query parameter rather than `/mine/[id]` because these plans live in
 * localStorage: the server cannot know the ids at build time, and `/plan/[id]`
 * is statically generated with `dynamicParams: false`. One static route plus a
 * parameter keeps the whole site static.
 */
export function MyPlanClient() {
  const router = useRouter();
  const id = useSearchParams().get("id");
  const { plans, remove, setStops } = useMyPlans();
  const [deleting, setDeleting] = useState(false);

  const saved = plans.find((p) => p.id === id);

  const onStopsChange = useCallback(
    (ids: string[]) => {
      if (saved) setStops(saved.id, ids);
    },
    [saved, setStops],
  );

  if (!saved) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6">
        <h1 className="text-2xl">That plan is not here</h1>
        <p className="text-ink-soft mx-auto mt-2 max-w-md text-sm leading-relaxed">
          Plans you make are kept in this browser only, so a link to one will
          not open anywhere else, and clearing site data removes them.
        </p>
        <Link href="/" className="mt-6 inline-block">
          <Button variant="secondary">Back to plans</Button>
        </Link>
      </div>
    );
  }

  const confirmDelete = () => {
    if (!deleting) {
      setDeleting(true);
      return;
    }
    remove(saved.id);
    router.push("/");
  };

  return (
    <PlanClient
      // Keyed so switching between two saved plans remounts rather than
      // carrying the previous plan's stop state across.
      key={saved.id}
      plan={toPlan(saved)}
      owned
      onStopsChange={onStopsChange}
      headerAction={
        <Button
          onClick={confirmDelete}
          onBlur={() => setDeleting(false)}
          className="shrink-0 bg-white/15 text-white backdrop-blur hover:bg-white/25"
        >
          <Trash2 size={15} aria-hidden />
          {deleting ? "Tap again to delete" : "Delete this plan"}
        </Button>
      }
    />
  );
}
