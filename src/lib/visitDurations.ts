import { createLocalStore } from "./localStore";
import type { Destination } from "./types";

/**
 * How long you reckon you will actually spend somewhere, when it differs from
 * what the data says.
 *
 * This is the one number the whole itinerary hangs off, and for a searched
 * place it is the weakest field in the record: no provider publishes it, so
 * `places.ts` guesses from the category and Prambanan Temple comes back as an
 * hour. A guess nobody can correct is worse than a guess with a knob on it.
 *
 * Keyed by place id and kept apart from the places themselves, so it applies
 * to a hand-written venue and a searched one alike, and so clearing the place
 * cache does not throw away judgements the user made.
 *
 * React-free for the same reason as `localStore`: subscribe with
 * `useLocalStore` where a component needs to re-render.
 */
export const visitDurationsStore = createLocalStore<Record<string, number>>(
  "jalanjalan:durations",
  {},
);

/** Offered in the picker. 75 is in there because several built-ins use it. */
export const DURATION_PRESETS = [
  15, 30, 45, 60, 75, 90, 120, 150, 180, 240, 300,
];

const MIN_MINUTES = 5;
const MAX_MINUTES = 24 * 60;

export function setVisitDuration(id: string, minutes: number | null) {
  const current = visitDurationsStore.read();

  // Back to the published figure: drop the key rather than storing a value
  // equal to the default, so "has the user had an opinion here" stays legible.
  if (minutes === null) {
    if (!(id in current)) return;
    const rest = Object.fromEntries(
      Object.entries(current).filter(([key]) => key !== id),
    );
    visitDurationsStore.write(rest);
    return;
  }

  const rounded = Math.round(minutes);
  if (rounded < MIN_MINUTES || rounded > MAX_MINUTES) return;
  visitDurationsStore.write({ ...current, [id]: rounded });
}

/**
 * Returns the same object when there is no override, so the common case keeps
 * referential stability and the memos downstream do not recompute.
 */
export function withVisitDuration(
  destination: Destination,
  overrides: Record<string, number>,
): Destination {
  const minutes = overrides[destination.id];
  if (minutes === undefined || minutes === destination.visitDurationMinutes) {
    return destination;
  }
  return { ...destination, visitDurationMinutes: minutes };
}

export function withVisitDurations(
  destinations: Destination[],
  overrides: Record<string, number>,
): Destination[] {
  return destinations.map((d) => withVisitDuration(d, overrides));
}
