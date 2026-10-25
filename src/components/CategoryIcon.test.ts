import { describe, expect, it } from "vitest";
import { DESTINATIONS } from "@/data/destinations";
import { iconFor } from "./CategoryIcon";

/**
 * The icon is the only thing standing in for a photo, and it is matched by
 * regex against a free-text category, so it is worth checking that the twenty
 * hand-written venues and the categories OpenStreetMap actually returns during
 * testing land somewhere sensible rather than all falling through to the pin.
 */
describe("iconFor", () => {
  it("gives every built-in venue something better than the fallback", () => {
    const fallbacks = DESTINATIONS.filter(
      (d) => iconFor(d.category) === iconFor("something unmatchable"),
    ).map((d) => d.category);
    expect(fallbacks).toEqual([]);
  });

  it("matches the OSM categories search actually returns", () => {
    // All seen in real Photon and Overpass answers while building this.
    for (const category of [
      "Restaurant",
      "Cafe",
      "Fast food",
      "Museum",
      "Attraction",
      "Park",
      "Place of worship",
      "Religion",
      "Hotel",
      "Gallery",
    ]) {
      expect(iconFor(category)).not.toBe(iconFor("something unmatchable"));
    }
  });

  it("puts things that are alike on the same icon, and unalike apart", () => {
    expect(iconFor("Pizzeria")).toBe(iconFor("Batak restaurant"));
    expect(iconFor("Museum")).toBe(iconFor("Museum Benteng"));
    expect(iconFor("Pizzeria")).not.toBe(iconFor("Museum"));
    expect(iconFor("Cafe")).not.toBe(iconFor("Craft workshop"));
  });

  it("falls back rather than throwing on a category it has never seen", () => {
    // OSM has thousands of values; most will never be in the table.
    expect(iconFor("")).toBeDefined();
    expect(iconFor("nuclear reprocessing plant")).toBeDefined();
  });
});
