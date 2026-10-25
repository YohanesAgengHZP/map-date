import { createLocalStore } from "./localStore";
import type { Destination } from "./types";

/**
 * Places the user found through search, cached whole.
 *
 * Whole records rather than ids, which is the opposite of `myPlans`: a saved
 * plan derives its venues from `destinations.ts` so a photo or a rename shows
 * up inside it, but a live place has no entry in the repo to derive from. The
 * cache *is* the record.
 *
 * It is still only a cache. Every id is an OSM object id, so anything missing
 * here can be fetched again through `lookupPlaces`, which is what makes a
 * shared plan openable in a browser that never did the search.
 *
 * React-free on purpose, like `localStore` itself: `destinations.ts` imports
 * this and is reachable from server components. Subscribe to
 * `customPlacesStore` with `useLocalStore` where a component needs to re-render
 * as places arrive.
 *
 * ponytail: no eviction and no refresh. A venue that closes or moves keeps the
 * details it had when it was added. Add a `fetchedAt` and re-lookup on read if
 * staleness ever matters.
 */
export const customPlacesStore = createLocalStore<Destination[]>(
  "jalanjalan:places",
  [],
);

/**
 * Synchronous read, so `getDestination` keeps its signature and every existing
 * caller keeps working. Answers undefined during server render: there is no
 * localStorage there, and no built-in plan references a live place, so the only
 * surfaces that need these are client-rendered anyway.
 */
export function getCustomPlace(id: string): Destination | undefined {
  return customPlacesStore.read().find((place) => place.id === id);
}

/** Last write wins, so re-adding a place refreshes what we know about it. */
export function addCustomPlace(place: Destination) {
  const current = customPlacesStore.read();
  customPlacesStore.write([
    ...current.filter((p) => p.id !== place.id),
    place,
  ]);
}
