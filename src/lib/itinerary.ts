import { parseClock } from "./format";
import type { Destination, ItineraryStop, TravelLeg } from "./types";

/**
 * Lay out the date on a clock.
 *
 * Total estimated duration = sum of visit durations + sum of travel durations.
 * A leg whose travel time is unavailable contributes 0 minutes to the schedule
 * but is flagged so callers can mark the total as incomplete rather than wrong.
 */
export function buildItinerary(
  destinations: Destination[],
  legs: TravelLeg[],
  startTime: string,
): ItineraryStop[] {
  let cursor = parseClock(startTime);

  return destinations.map((destination, index) => {
    const arrivalMinutes = cursor;
    const departureMinutes = arrivalMinutes + destination.visitDurationMinutes;
    const travelToNext = index < destinations.length - 1 ? legs[index] : undefined;

    cursor = departureMinutes + (travelToNext?.minutes ?? 0);

    return {
      destination,
      order: index + 1,
      arrivalMinutes,
      departureMinutes,
      travelToNext,
    };
  });
}

export type ItineraryTotals = {
  visitMinutes: number;
  /** null when no leg could be resolved at all. */
  travelMinutes: number | null;
  /** visit + travel, or just visit when travel is unknown. */
  totalMinutes: number | null;
  /** True when a leg has no travel time, so totals are a floor, not a sum. */
  hasMissingTravel: boolean;
};

export function calculateTotals(
  destinations: Destination[],
  legs: TravelLeg[],
): ItineraryTotals {
  const visitMinutes = destinations.reduce(
    (sum, d) => sum + d.visitDurationMinutes,
    0,
  );

  // Only legs that actually connect two stops in the current order count.
  const relevantLegs = legs.slice(0, Math.max(0, destinations.length - 1));
  const knownLegs = relevantLegs.filter((leg) => leg.minutes !== null);
  const hasMissingTravel = knownLegs.length < relevantLegs.length;
  const travelMinutes =
    relevantLegs.length === 0
      ? 0
      : knownLegs.length === 0
        ? null
        : knownLegs.reduce((sum, leg) => sum + (leg.minutes ?? 0), 0);

  return {
    visitMinutes,
    travelMinutes,
    totalMinutes: travelMinutes === null ? visitMinutes : visitMinutes + travelMinutes,
    hasMissingTravel,
  };
}

/** Immutable reorder by one position. Out-of-range moves are a no-op. */
export function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length || from < 0 || from >= items.length || from === to) {
    return items;
  }
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}
