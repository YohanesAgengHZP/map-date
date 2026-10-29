"use client";

import { useCallback } from "react";
import { getDestinations } from "@/data/destinations";
import { fromSharedPlace, isPlaceId, toSharedPlace } from "./places";
import { createLocalStore } from "./localStore";
import { useLocalStore } from "./useLocalStore";
import type { Destination, Mood, Plan } from "./types";

/**
 * Plans the user made, plus the built-in plans they have hidden.
 *
 * Stored as ids and a title rather than a whole `Plan`: the summary line is
 * derived from `destinations.ts` at render time, so a venue that changes its
 * name updates inside saved plans too. A snapshotted copy would quietly go
 * stale.
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
const store = createLocalStore<Saved>(
  "jalanjalan:myplans",
  EMPTY,
  "dateroute:myplans",
);

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

  return {
    id: saved.id,
    title: saved.title,
    description:
      destinations.length === 0
        ? "Nothing in this one yet. Add a stop to get started."
        : // Says no more than the stops: the same text is shown on a plan
          // somebody else shared, where "your plan" would be a lie.
          `${destinations.map((d) => d.name).join(", then ")}.`,
    mood: saved.mood,
    destinationIds: saved.destinationIds,
    tags: ["Yours"],
    startTime: saved.startTime,
  };
}

/* ------------------------------------------------------------------ *
 * Sharing
 *
 * A plan lives in one browser, so the only way to show someone else is to
 * put the whole thing in the link. Ids and a title are small enough to fit,
 * and it means no backend, no accounts and no expiring links.
 *
 * Stops the reader cannot look up are carried too. A built-in id resolves from
 * the repo, but a searched one resolves only through Overpass, which is slow
 * and sometimes unavailable, so the link carries enough to draw those stops
 * itself. Old links have no payload and still work: they fall back to the
 * Overpass lookup, which is the only path that existed before.
 * ------------------------------------------------------------------ */

type SharedPlan = Omit<MyPlan, "id" | "createdAt"> & {
  /** Records for stops that have no entry in the repo to resolve against. */
  places?: Destination[];
};

const MOOD_VALUES: Mood[] = ["cozy", "heritage", "outdoorsy", "foodie", "artsy"];

/** Caps both the id list and the carried records, so a hand-made link cannot
 *  ask for thousands of stops or bloat the reader's cache. */
const MAX_STOPS = 25;

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(token: string): string {
  const binary = atob(token.replace(/-/g, "+").replace(/_/g, "/"));
  return new TextDecoder().decode(
    Uint8Array.from(binary, (char) => char.charCodeAt(0)),
  );
}

/** Short keys because this ends up in a URL someone pastes into a chat. */
export function encodePlan(plan: SharedPlan): string {
  // Only stops that are actually in this plan, and only the ones the reader
  // could not otherwise resolve. Carrying a built-in would be dead weight.
  const payload = (plan.places ?? [])
    .filter(
      (place) => isPlaceId(place.id) && plan.destinationIds.includes(place.id),
    )
    .slice(0, MAX_STOPS)
    .map(toSharedPlace);

  return toBase64Url(
    JSON.stringify({
      t: plan.title,
      m: plan.mood,
      s: plan.startTime,
      d: plan.destinationIds,
      ...(payload.length > 0 ? { p: payload } : {}),
    }),
  );
}

/**
 * Anything arriving here came out of a URL, so none of it is trusted: a bad
 * token returns null and the page says so, rather than rendering half a plan
 * or throwing. Unknown venue ids are dropped by `getDestinations` downstream.
 */
export function decodePlan(token: string): SharedPlan | null {
  try {
    const raw: unknown = JSON.parse(fromBase64Url(token));
    if (typeof raw !== "object" || raw === null) return null;
    const { t, m, s, d, p } = raw as Record<string, unknown>;

    if (typeof t !== "string" || t.length === 0 || t.length > 120) return null;
    if (typeof m !== "string" || !MOOD_VALUES.includes(m as Mood)) return null;
    if (typeof s !== "string" || !/^\d{2}:\d{2}$/.test(s)) return null;
    if (!Array.isArray(d) || d.some((id) => typeof id !== "string")) return null;

    // A malformed place is dropped rather than failing the whole link: the
    // plan is still readable without it, and the stop can still be looked up
    // by id. `fromSharedPlace` range-checks every field it keeps.
    const places = Array.isArray(p)
      ? p
          .slice(0, MAX_STOPS)
          .map(fromSharedPlace)
          .filter((place): place is Destination => place !== null)
      : [];

    return {
      title: t,
      mood: m as Mood,
      startTime: s,
      // Cap the list so a hand-made link cannot ask for thousands of stops.
      destinationIds: (d as string[]).slice(0, MAX_STOPS),
      places,
    };
  } catch {
    return null;
  }
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

  const unhideAll = useCallback(() => {
    store.write({ ...store.read(), hidden: [] });
  }, []);

  return { plans, hidden, add, remove, setStops, toggleHidden, unhideAll };
}
