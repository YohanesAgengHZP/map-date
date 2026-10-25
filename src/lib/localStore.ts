"use client";

import { useSyncExternalStore } from "react";

/**
 * A JSON value in localStorage, exposed as an external store.
 *
 * External store rather than component state so every consumer sees the same
 * value: two `useState` copies of the same key drift the moment one of them
 * writes. This is the shape `useFavorites` worked out; it is factored out here
 * because saved plans need exactly the same behaviour.
 *
 * ponytail: no account system in scope. Swap `read`/`write` for API calls if
 * sign-in ever lands, and every consumer keeps working.
 */
export type LocalStore<T> = {
  read: () => T;
  write: (value: T) => void;
  subscribe: (listener: () => void) => () => void;
  serverSnapshot: () => T;
};

export function createLocalStore<T>(key: string, fallback: T): LocalStore<T> {
  const fallbackRaw = JSON.stringify(fallback);
  let cache = fallback;
  let snapshot = fallbackRaw;
  const listeners = new Set<() => void>();

  function read(): T {
    try {
      const raw = window.localStorage.getItem(key) ?? fallbackRaw;
      // Cache by raw string so the snapshot is referentially stable between
      // reads. useSyncExternalStore loops forever on a fresh object each call.
      if (raw !== snapshot) {
        snapshot = raw;
        cache = JSON.parse(raw) as T;
      }
    } catch {
      // Private mode, or a corrupt value someone hand-edited: behave as empty
      // rather than taking the whole page down.
      snapshot = fallbackRaw;
      cache = fallback;
    }
    return cache;
  }

  function write(value: T) {
    snapshot = JSON.stringify(value);
    cache = value;
    try {
      window.localStorage.setItem(key, snapshot);
    } catch {
      // Keep the in-memory value even when persistence is unavailable.
    }
    for (const listener of listeners) listener();
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    // Another tab writing the same key should update this one too.
    const onStorage = (event: StorageEvent) => {
      if (event.key === key) listener();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  }

  return { read, write, subscribe, serverSnapshot: () => fallback };
}

export function useLocalStore<T>(store: LocalStore<T>): T {
  return useSyncExternalStore(store.subscribe, store.read, store.serverSnapshot);
}
