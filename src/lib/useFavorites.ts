"use client";

import { useCallback } from "react";
import { createLocalStore } from "./localStore";
import { useLocalStore } from "./useLocalStore";

/** Saved destinations, persisted in localStorage. See `localStore.ts`. */
const store = createLocalStore<string[]>(
  "jalanjalan:favorites",
  [],
  "dateroute:favorites",
);

export function useFavorites() {
  const favoriteIds = useLocalStore(store);

  const toggle = useCallback((id: string) => {
    const current = store.read();
    store.write(
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    );
  }, []);

  const isFavorite = useCallback(
    (id: string) => favoriteIds.includes(id),
    [favoriteIds],
  );

  return { favoriteIds, isFavorite, toggle };
}
