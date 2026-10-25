import { describe, expect, it } from "vitest";
import { DESTINATIONS, getDestinations } from "@/data/destinations";
import { PLANS } from "@/data/plans";
import { formatClock, formatDuration } from "./format";
import { buildItinerary, calculateTotals, moveItem } from "./itinerary";
import { estimateRoute } from "./routing";
import type { Destination, TravelLeg } from "./types";

const leg = (fromId: string, toId: string, minutes: number | null): TravelLeg => ({
  fromId,
  toId,
  mode: "driving",
  minutes,
  meters: minutes === null ? null : minutes * 300,
  source: minutes === null ? "unavailable" : "routed",
});

// batik-workshop 120 min, nanamia-pizzeria 90 min, mediterranea 90 min.
const THREE = ["batik-workshop", "nanamia-pizzeria", "mediterranea"];

describe("buildItinerary", () => {
  it("chains arrival times through visit and travel durations", () => {
    const stops = buildItinerary(
      getDestinations(THREE),
      [leg("batik-workshop", "nanamia-pizzeria", 10), leg("nanamia-pizzeria", "mediterranea", 15)],
      "10:00",
    );

    // 10:00 + 120 visit -> 12:00, + 10 travel -> 12:10, + 90 visit -> 13:40,
    // + 15 travel -> 13:55, + 90 visit -> 15:25.
    expect(stops.map((s) => formatClock(s.arrivalMinutes))).toEqual([
      "10:00",
      "12:10",
      "13:55",
    ]);
    expect(formatClock(stops[2].departureMinutes)).toBe("15:25");
    expect(stops.map((s) => s.order)).toEqual([1, 2, 3]);
    expect(stops[2].travelToNext).toBeUndefined();
  });

  it("renumbers and reschedules after a reorder", () => {
    const reordered = moveItem(THREE, 2, 0);
    expect(reordered).toEqual(["mediterranea", "batik-workshop", "nanamia-pizzeria"]);

    const stops = buildItinerary(
      getDestinations(reordered),
      [leg("mediterranea", "batik-workshop", 12), leg("batik-workshop", "nanamia-pizzeria", 10)],
      "10:00",
    );

    expect(stops[0].destination.id).toBe("mediterranea");
    expect(stops.map((s) => s.order)).toEqual([1, 2, 3]);
    // 10:00 + 90 -> 11:30, +12 -> 11:42
    expect(formatClock(stops[1].arrivalMinutes)).toBe("11:42");
  });

  it("does not shift the clock when a travel time is unavailable", () => {
    const stops = buildItinerary(
      getDestinations(THREE),
      [
        leg("batik-workshop", "nanamia-pizzeria", null),
        leg("nanamia-pizzeria", "mediterranea", 15),
      ],
      "10:00",
    );
    expect(formatClock(stops[1].arrivalMinutes)).toBe("12:00");
  });

  it("is a no-op when moving past either end", () => {
    expect(moveItem(THREE, 0, -1)).toBe(THREE);
    expect(moveItem(THREE, 2, 3)).toBe(THREE);
  });
});

describe("calculateTotals", () => {
  it("adds visit time and travel time", () => {
    const totals = calculateTotals(getDestinations(THREE), [
      leg("batik-workshop", "nanamia-pizzeria", 10),
      leg("nanamia-pizzeria", "mediterranea", 15),
    ]);

    expect(totals.visitMinutes).toBe(300); // 120 + 90 + 90
    expect(totals.travelMinutes).toBe(25);
    expect(formatDuration(totals.totalMinutes!)).toBe("5 hr 25 min");
    expect(totals.hasMissingTravel).toBe(false);
  });

  it("ignores legs left over from a longer itinerary", () => {
    // Legs are recomputed asynchronously, so a stale third leg can briefly
    // outlive a removed stop. It must not inflate the total.
    const totals = calculateTotals(
      getDestinations(["batik-workshop", "nanamia-pizzeria"]),
      [
        leg("batik-workshop", "nanamia-pizzeria", 10),
        leg("nanamia-pizzeria", "mediterranea", 15),
      ],
    );
    expect(totals.travelMinutes).toBe(10);
    expect(totals.totalMinutes).toBe(220);
  });

  it("flags partial travel instead of reporting a wrong total", () => {
    const totals = calculateTotals(getDestinations(THREE), [
      leg("batik-workshop", "nanamia-pizzeria", null),
      leg("nanamia-pizzeria", "mediterranea", 15),
    ]);
    expect(totals.hasMissingTravel).toBe(true);
    expect(totals.travelMinutes).toBe(15);
  });

  it("reports travel as unknown when no leg resolved", () => {
    const totals = calculateTotals(getDestinations(THREE), [
      leg("batik-workshop", "nanamia-pizzeria", null),
      leg("nanamia-pizzeria", "mediterranea", null),
    ]);
    expect(totals.travelMinutes).toBeNull();
    expect(totals.totalMinutes).toBe(300); // visit time only, never a fake sum
  });

  it("has no travel to total for a single stop", () => {
    const totals = calculateTotals(getDestinations(["nanamia-pizzeria"]), []);
    expect(totals.travelMinutes).toBe(0);
    expect(totals.totalMinutes).toBe(90);
    expect(totals.hasMissingTravel).toBe(false);
  });
});

describe("estimateRoute (offline fallback)", () => {
  it("produces one labelled leg per hop with plausible city times", () => {
    const result = estimateRoute(getDestinations(THREE));
    expect(result.legs).toHaveLength(2);
    expect(result.source).toBe("estimated");
    expect(result.geometry).toBeNull();
    for (const l of result.legs) {
      expect(l.minutes).toBeGreaterThan(0);
      expect(l.minutes).toBeLessThan(120);
      expect(l.source).toBe("estimated");
    }
  });

  it("returns no legs for a single stop", () => {
    expect(estimateRoute(getDestinations(["nanamia-pizzeria"])).legs).toEqual([]);
  });

  it("walks the short hops instead of driving them", () => {
    // Vredeburg to Sonobudoyo is ~350 m apart, but Malioboro's one-way system
    // makes the driving route 1.8 km. It has to come back as a walk.
    const [hop] = estimateRoute(getDestinations(["vredeburg", "sonobudoyo"])).legs;
    expect(hop.mode).toBe("walking");
    expect(hop.meters).toBeLessThan(600);
    expect(hop.minutes).toBeLessThanOrEqual(8);
  });

  it("still drives the long hops", () => {
    // Rogoyudan across to Condongcatur is far too far to walk.
    const [hop] = estimateRoute(getDestinations(["lunion-pizza", "ryuji"])).legs;
    expect(hop.mode).toBe("driving");
    expect(hop.meters).toBeGreaterThan(5_000);
  });
});

describe("real-asset data integrity", () => {
  it("resolves every id referenced by a plan", () => {
    for (const plan of PLANS) {
      expect(getDestinations(plan.destinationIds)).toHaveLength(
        plan.destinationIds.length,
      );
    }
  });

  it("gives every destination a visit duration and a unique id", () => {
    const ids = DESTINATIONS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const d of DESTINATIONS) {
      expect(d.visitDurationMinutes).toBeGreaterThan(0);
    }
  });

  it("carries no photo fields or image assets anywhere in the data", () => {
    // The app has no imagery at all: OpenStreetMap has none for searched
    // places, so built-in venues do not get any either. Guards against a
    // photo field creeping back into one entry and not the rest.
    //
    // Matches field names and asset paths, not the word itself: Mohan Burger
    // genuinely has a photobox in it, and that is a fact about the venue.
    const serialised = JSON.stringify(DESTINATIONS) + JSON.stringify(PLANS);
    expect(serialised).not.toMatch(/"(photos|coverPhoto)"/);
    expect(serialised).not.toMatch(/\.webp|\/venues\//i);
  });

  it("keeps em dashes and ellipsis characters out of the copy", () => {
    // Long dashes mid-sentence read as machine-written. Numeric ranges still
    // use an en dash ("11:00 - 22:00"), which is ordinary typography.
    const copy = [
      ...DESTINATIONS.flatMap((d) => [d.name, d.description, d.address, ...d.tags]),
      ...PLANS.flatMap((p) => [p.title, p.description, ...p.tags]),
    ];
    const offenders = copy.filter((s) => /[\u2014\u2026]/.test(s));
    expect(offenders).toEqual([]);
  });

  it("carries no pricing anywhere in the data", () => {
    const serialised = JSON.stringify(DESTINATIONS) + JSON.stringify(PLANS);
    expect(serialised).not.toMatch(/price|budget|Rp ?[0-9]/i);
  });

  it("keeps dessert stops out of the data entirely", () => {
    const text = JSON.stringify(DESTINATIONS).toLowerCase();
    expect(text).not.toMatch(/dessert|gelato|patisserie/);
  });

  it("marks a stop approximate whenever its pin is not precisely mapped", () => {
    const approximate = DESTINATIONS.filter(
      (d) => d.locationPrecision === "approximate",
    ).map((d) => d.id);
    expect(approximate).toEqual([
      "lunion-pizza",
      "batik-workshop",
      "mohan-burger",
      // Not mapped as venues either: the art studio's building is absent from
      // OpenStreetMap, and both parks are only pinned to the road their
      // kilometre-marker address names.
      "jogja-art-activity",
      "kids-fun-parcs",
      "ibarbo-park",
    ]);
  });

  it("keeps each venue's pin consistent with the street in its address", () => {
    // Guards against coordinate drift: a pin that wanders to another branch or
    // another part of town while the address line stays put.
    const haversine = (a: Destination, b: Destination) => {
      const R = 6_371_000;
      const rad = (d: number) => (d * Math.PI) / 180;
      const dLat = rad(b.latitude - a.latitude);
      const dLng = rad(b.longitude - a.longitude);
      const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) ** 2;
      return 2 * R * Math.asin(Math.sqrt(h));
    };
    const byId = (id: string) => DESTINATIONS.find((d) => d.id === id)!;

    // Both sit on Jalan Tirtodipuran and "Batik, Then Dinner" promises the hop
    // between them is on foot. Nanamia is deliberately the North Area branch,
    // several kilometres away, so it is not part of this set.
    const tirtodipuran = ["batik-workshop", "mediterranea"];
    for (const a of tirtodipuran) {
      for (const b of tirtodipuran) {
        if (a === b) continue;
        expect(
          haversine(byId(a), byId(b)),
          `${a} -> ${b} is too far apart to be the same street`,
        ).toBeLessThan(1_200);
      }
    }
  });

  it("gives every plan somewhere to eat", () => {
    const EATERIES = new Set(
      DESTINATIONS.filter((d) =>
        /restaurant|pizzeria|pizza workshop/i.test(d.category),
      ).map((d) => d.id),
    );
    for (const plan of PLANS) {
      expect(
        plan.destinationIds.some((id) => EATERIES.has(id)),
        `${plan.id} has no food stop`,
      ).toBe(true);
    }
  });

  it("leaves every mood with at least one matching plan", () => {
    const moods = new Set(
      PLANS.flatMap((p) => [p.mood, ...p.tags.map((t) => t.toLowerCase())]),
    );
    for (const mood of ["cozy", "heritage", "outdoorsy", "foodie", "artsy"]) {
      expect(moods.has(mood)).toBe(true);
    }
  });
});

describe("formatting fallbacks", () => {
  it("wraps clock times past midnight", () => {
    expect(formatClock(1_470)).toBe("00:30");
  });
});
