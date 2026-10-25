import { describe, expect, it } from "vitest";
import type { Destination } from "./types";
import { withVisitDuration, withVisitDurations } from "./visitDurations";

const place: Destination = {
  id: "osm:N:1",
  name: "Prambanan Temple",
  category: "Place of worship",
  description: "Place of worship.",
  latitude: -7.752,
  longitude: 110.4915,
  address: "",
  // What `places.ts` guesses from the category, and the reason this exists.
  visitDurationMinutes: 60,
  tags: [],
  directionsUrl: "https://example.test",
};

describe("visit duration overrides", () => {
  it("replaces the published guess", () => {
    expect(withVisitDuration(place, { "osm:N:1": 150 }).visitDurationMinutes).toBe(
      150,
    );
  });

  it("leaves a place alone when nothing was overridden", () => {
    // Same object, not a copy: the memos downstream key off identity, and a
    // fresh object every render would recompute the whole itinerary.
    expect(withVisitDuration(place, {})).toBe(place);
    expect(withVisitDuration(place, { "osm:N:2": 150 })).toBe(place);
  });

  it("leaves it alone when the override equals the published figure", () => {
    expect(withVisitDuration(place, { "osm:N:1": 60 })).toBe(place);
  });

  it("never mutates the place it was given", () => {
    withVisitDuration(place, { "osm:N:1": 150 });
    expect(place.visitDurationMinutes).toBe(60);
  });

  it("maps a whole itinerary, touching only what was edited", () => {
    const other: Destination = { ...place, id: "sonobudoyo" };
    const [first, second] = withVisitDurations([place, other], {
      "osm:N:1": 150,
    });
    expect(first.visitDurationMinutes).toBe(150);
    expect(second).toBe(other);
  });
});
