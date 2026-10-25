"use client";

import { useCallback } from "react";
import { getDestinations } from "@/data/destinations";
import { createLocalStore, useLocalStore } from "./localStore";
import type { Mood, Plan } from "./types";

/**
 * Plans the user made, plus the built-in plans they have hidden.
 *
 * Stored as ids and a title rather than a whole `Plan`: the cover photo and the
 * summary line are derived from `destinations.ts` at render time, so a venue
 * that gains a photo or changes its name updates inside saved plans too. A
 * snapshotted copy would quietly go stale.
 *
 * Built-ins are hidden, never deleted. They live in the repo, so "delete" would
 * be a lie, and a hidden list is reversible from the UI.
 */
export type MyPlan = {
  id: string;
  title: string;
  mood: Mood;
  /** "HH:MM" local, same as `Plan.startTime`. */
  startTime: string;
  destinationIds: string[];
  createdAt: number;
};

type Saved = { plans: MyPlan[]; hidden: string[] };

const EMPTY: Saved = { plans: [], hidden: [] };
const store = createLocalStore<Saved>("dateroute:myplans", EMPTY);

/** Ids are prefixed so a saved plan can never collide with a built-in one. */
export const MY_PLAN_PREFIX = "mine-";

export function isMyPlanId(id: string): boolean {
  return id.startsWith(MY_PLAN_PREFIX);
}

export function createMyPlan(input: {
  title: string;
  mood: Mood;
  startTime: string;
  destinationIds?: string[];
  now?: number;
}): MyPlan {
  const now = input.now ?? Date.now();
  return {
    id: `${MY_PLAN_PREFIX}${now.toString(36)}`,
    title: input.title.trim() || "My plan",
    mood: input.mood,
    startTime: input.startTime,
    destinationIds: input.destinationIds ?? [],
    createdAt: now,
  };
}

/**
 * Widen a saved plan into the `Plan` the rest of the app already renders, so
 * `PlanCard`, `PlanClient` and the map need no notion of "custom".
 */
export function toPlan(saved: MyPlan): Plan {
  const destinations = getDestinations(saved.destinationIds);
  const cover = destinations.flatMap((d) => d.photos)[0];

  return {
    id: saved.id,
    title: saved.title,
    description:
      destinations.length === 0
        ? "Nothing in this one yet. Add a stop to get started."
        : `Your own plan: ${destinations.map((d) => d.name).join(", then ")}.`,
    coverPhoto: cover ?? {
      id: `${saved.id}-cover`,
      url: "",
      alt: saved.title,
    },
    mood: saved.mood,
    destinationIds: saved.destinationIds,
    tags: ["Yours"],
    startTime: saved.startTime,
  };
}

export function useMyPlans() {
  const { plans, hidden } = useLocalStore(store);

  const add = useCallback((plan: MyPlan) => {
    const current = store.read();
    store.write({ ...current, plans: [...current.plans, plan] });
  }, []);

  const remove = useCallback((id: string) => {
    const current = store.read();
    store.write({ ...current, plans: current.plans.filter((p) => p.id !== id) });
  }, []);

  const setStops = useCallback((id: string, destinationIds: string[]) => {
    const current = store.read();
    store.write({
      ...current,
      plans: current.plans.map((p) =>
        p.id === id ? { ...p, destinationIds } : p,
      ),
    });
  }, []);

  const toggleHidden = useCallback((id: string) => {
    const current = store.read();
    store.write({
      ...current,
      hidden: current.hidden.includes(id)
        ? current.hidden.filter((x) => x !== id)
        : [...current.hidden, id],
    });
  }, []);

  return { plans, hidden, add, remove, setStops, toggleHidden };
}
