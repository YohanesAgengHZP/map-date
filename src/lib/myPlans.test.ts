import { describe, expect, it } from "vitest";
import { createMyPlan, decodePlan, encodePlan, isMyPlanId, toPlan } from "./myPlans";
import { PLANS } from "@/data/plans";
import { toSharedPlace } from "./places";
import type { Destination } from "./types";

describe("plans the user makes", () => {
  it("never collides with a built-in plan id", () => {
    const mine = createMyPlan({ title: "Mine", mood: "foodie", startTime: "15:00" });
    expect(isMyPlanId(mine.id)).toBe(true);
    expect(PLANS.some((p) => p.id === mine.id)).toBe(false);
    expect(PLANS.every((p) => !isMyPlanId(p.id))).toBe(true);
  });

  it("gives two plans made in the same session different ids", () => {
    const a = createMyPlan({ title: "A", mood: "cozy", startTime: "10:00", now: 1 });
    const b = createMyPlan({ title: "B", mood: "cozy", startTime: "10:00", now: 2 });
    expect(a.id).not.toBe(b.id);
  });

  it("falls back to a title rather than saving a blank one", () => {
    expect(createMyPlan({ title: "   ", mood: "artsy", startTime: "09:00" }).title).toBe(
      "My plan",
    );
  });

  it("starts with no stops and survives the round trip to a Plan", () => {
    const empty = toPlan(
      createMyPlan({ title: "Empty", mood: "artsy", startTime: "09:00" }),
    );
    expect(empty.destinationIds).toEqual([]);
    // An empty plan still has to render, and say so rather than look broken.
    expect(empty.title).toBe("Empty");
    expect(empty.description).toContain("Nothing in this one yet");
    // Marks it as the user's own wherever it gets listed.
    expect(empty.tags).toEqual(["Yours"]);
  });

  it("drops ids of venues that no longer exist instead of throwing", () => {
    const plan = toPlan(
      createMyPlan({
        title: "Stale",
        mood: "foodie",
        startTime: "18:00",
        destinationIds: ["deleted-venue", "hou-kie"],
      }),
    );
    // destinationIds keeps what was saved; the derived copy skips the unknown.
    expect(plan.destinationIds).toEqual(["deleted-venue", "hou-kie"]);
    expect(plan.description).toContain("Hou Kie");
    expect(plan.description).not.toContain("deleted-venue");
  });

  it("describes a plan without claiming whose it is", () => {
    // The same text renders on a plan someone else shared with you.
    const plan = toPlan(
      createMyPlan({
        title: "Theirs",
        mood: "foodie",
        startTime: "18:00",
        destinationIds: ["hou-kie"],
      }),
    );
    expect(plan.description).not.toMatch(/your/i);
  });
});

/** A plan carrying the given stops, so each test names only what it cares about. */
function sampleFor(destinationIds: string[]) {
  return {
    title: "Shared",
    mood: "foodie" as const,
    startTime: "17:00",
    destinationIds,
  };
}

describe("sharing a plan by link", () => {
  const sample = {
    title: "Piggy, but ours",
    mood: "foodie" as const,
    startTime: "17:00",
    destinationIds: ["bpk-ola-kisat", "babi-toba-tabo"],
  };

  it("survives the round trip", () => {
    expect(decodePlan(encodePlan(sample))).toEqual({ ...sample, places: [] });
  });

  it("keeps non-ASCII titles intact", () => {
    // btoa alone mangles these, so the encoder goes through UTF-8 bytes.
    const emoji = { ...sample, title: "Jalan-jalan sore 🍖 Yogyakarta" };
    expect(decodePlan(encodePlan(emoji))?.title).toBe(emoji.title);
  });

  it("produces a token that is safe in a URL", () => {
    const token = encodePlan(sample);
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(encodeURIComponent(token)).toBe(token);
  });

  it("refuses anything that is not a plan rather than half-rendering it", () => {
    const encode = (value: unknown) =>
      Buffer.from(JSON.stringify(value)).toString("base64url");

    expect(decodePlan("not-base64-at-all!!")).toBeNull();
    expect(decodePlan(encode("a string"))).toBeNull();
    expect(decodePlan(encode(null))).toBeNull();
    // A mood outside the five the UI knows would break the filters.
    expect(decodePlan(encode({ t: "x", m: "flirty", s: "10:00", d: [] }))).toBeNull();
    expect(decodePlan(encode({ t: "x", m: "foodie", s: "teatime", d: [] }))).toBeNull();
    expect(decodePlan(encode({ t: "", m: "foodie", s: "10:00", d: [] }))).toBeNull();
    expect(decodePlan(encode({ t: "x", m: "foodie", s: "10:00", d: [1, 2] }))).toBeNull();
    expect(decodePlan(encode({ t: "x", m: "foodie", s: "10:00" }))).toBeNull();
  });

  it("caps a hand-made link so it cannot ask for thousands of stops", () => {
    const huge = { ...sample, destinationIds: Array(500).fill("hou-kie") };
    expect(decodePlan(encodePlan(huge))?.destinationIds).toHaveLength(25);
  });
});

/**
 * A searched place has no entry in the repo, so a link naming one used to
 * leave the reader waiting on Overpass. These cover the records that now ride
 * along instead.
 */
describe("sharing a plan that names a searched place", () => {
  const tamanSari: Destination = {
    id: "osm:N:6596889692",
    name: "Taman Sari Water Castle",
    category: "Museum",
    description: "Museum in Patehan.",
    latitude: -7.8100524,
    longitude: 110.3592071,
    address: "Jalan Masjid Soko Tunggal, Patehan, Yogyakarta",
    visitDurationMinutes: 90,
    openingHours: "Mo-Su 09:00-15:00",
    tags: [],
    directionsUrl: "https://www.google.com/maps/search/?api=1&query=-7.81,110.35",
  };

  const withPlace = {
    ...sampleFor(["sonobudoyo", tamanSari.id]),
    places: [tamanSari],
  };

  it("carries enough to draw the stop without any lookup", () => {
    const place = decodePlan(encodePlan(withPlace))?.places?.[0];
    expect(place).toBeDefined();
    expect(place!.id).toBe(tamanSari.id);
    expect(place!.name).toBe(tamanSari.name);
    expect(place!.category).toBe("Museum");
    expect(place!.visitDurationMinutes).toBe(90);
    expect(place!.openingHours).toBe("Mo-Su 09:00-15:00");
    // Five decimals is about a metre, which is as much as a pin needs.
    expect(place!.latitude).toBeCloseTo(tamanSari.latitude, 4);
    expect(place!.longitude).toBeCloseTo(tamanSari.longitude, 4);
  });

  it("does not carry built-in stops, which the reader already has", () => {
    const withBuiltIn = {
      ...sampleFor(["sonobudoyo"]),
      places: [{ ...tamanSari, id: "sonobudoyo" }],
    };
    expect(decodePlan(encodePlan(withBuiltIn))?.places).toEqual([]);
  });

  it("does not carry a place that is not actually in the plan", () => {
    const stale = { ...sampleFor(["sonobudoyo"]), places: [tamanSari] };
    expect(decodePlan(encodePlan(stale))?.places).toEqual([]);
  });

  it("stays backwards compatible with links that carry no records", () => {
    // Every link shared before this existed. It must still open, and still
    // fall through to the Overpass lookup for its unknown stops.
    const old = Buffer.from(
      JSON.stringify({ t: "Old", m: "foodie", s: "10:00", d: ["osm:N:1"] }),
    ).toString("base64url");
    const decoded = decodePlan(old);
    expect(decoded?.destinationIds).toEqual(["osm:N:1"]);
    expect(decoded?.places).toEqual([]);
  });

  it("never takes a link's word for where Open in Maps points", () => {
    // The dangerous field. A crafted link must not be able to aim the
    // directions button at a site of its choosing.
    const hostile = Buffer.from(
      JSON.stringify({
        t: "x",
        m: "foodie",
        s: "10:00",
        d: ["osm:N:1"],
        p: [
          {
            i: "osm:N:1",
            n: "Totally Real Cafe",
            c: "Cafe",
            y: -7.8,
            x: 110.37,
            v: 60,
            directionsUrl: "https://phishing.example/steal",
            description: "<script>alert(1)</script>",
          },
        ],
      }),
    ).toString("base64url");

    const place = decodePlan(hostile)?.places?.[0];
    expect(place!.directionsUrl).toBe(
      "https://www.google.com/maps/search/?api=1&query=-7.8,110.37",
    );
    expect(place!.description).not.toContain("script");
  });

  it("drops a malformed record instead of failing the whole link", () => {
    const encode = (places: unknown[]) =>
      Buffer.from(
        JSON.stringify({ t: "x", m: "foodie", s: "10:00", d: ["osm:N:1"], p: places }),
      ).toString("base64url");

    const good = toSharedPlace(tamanSari);
    const bad = [
      { ...good, i: "not-an-osm-id" },
      { ...good, n: "" },
      { ...good, y: 0, x: 0 },
      { ...good, y: 999 },
      { ...good, v: 0 },
      { ...good, v: 60 * 48 },
      { ...good, c: "" },
      "a string",
      null,
    ];

    // The good one survives; every malformed sibling is dropped silently.
    expect(decodePlan(encode([...bad, good]))?.places).toHaveLength(1);
    expect(decodePlan(encode(bad))?.places).toEqual([]);
    // And the plan itself still opens.
    expect(decodePlan(encode(bad))?.title).toBe("x");
  });

  it("caps the records a link can seed into the reader's cache", () => {
    const many = Array.from({ length: 200 }, (_, index) => ({
      ...tamanSari,
      id: `osm:N:${index + 1}`,
    }));
    const huge = {
      ...sampleFor(many.map((place) => place.id)),
      places: many,
    };
    expect(decodePlan(encodePlan(huge))?.places?.length).toBeLessThanOrEqual(25);
  });
});
