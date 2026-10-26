"use client";

import { useSyncExternalStore } from "react";
import type { LocalStore } from "./localStore";

/**
 * Subscribe a component to a `LocalStore`.
 *
 * Its own module purely so that `useSyncExternalStore` stays out of the server
 * bundle: `localStore.ts` is reachable from a server component, by way of
 * `getDestination` resolving a place the user searched for, and React's server
 * build does not export the client hooks.
 */
export function useLocalStore<T>(store: LocalStore<T>): T {
  return useSyncExternalStore(store.subscribe, store.read, store.serverSnapshot);
}
