import { describe, expect, it } from "vitest";
import { DESTINATIONS } from "@/data/destinations";
import {
  buildOverpassQuery,
  fromOverpass,
  fromPhoton,
  isPlaceId,
  parsePlaceId,
  toPlaceId,
} from "./places";

/** Shaped like a real Photon answer for "nanamia". */
const PHOTON_FEATURE = {
  geometry: { coordinates: [110.3883598, -7.7761738] },
  properties: {
    osm_id: 4_239_111_222,
    osm_type: "N",
    osm_key: "amenity",
    osm_value: "restaurant",
    name: "Nanamia Pizzeria",
    street: "Jalan Moses Gatotkaca",
    housenumber: "B 9",
    district: "Mrican",
    city: "Yogyakarta",
    state: "Daerah Istimewa Yogyakarta",
    postcode: "55281",
    countrycode: "ID",
  },
};

describe("place ids", () => {
  it("round-trips an OSM object id", () => {
    const id = toPlaceId("W", 12_345);
    expect(id).toBe("osm:W:12345");
    expect(parsePlaceId(id)).toEqual({ type: "W", osmId: 12_345 });
    expect(isPlaceId(id)).toBe(true);
  });

  it("rejects anything that is not one", () => {
    // Built-in slugs must never parse as live ids, or a built-in venue would
    // be looked up remotely instead of read from the catalogue.
    for (const destination of DESTINATIONS) {
      expect(isPlaceId(destination.id)).toBe(false);
    }
    expect(parsePlaceId("osm:X:1")).toBeNull();
    expect(parsePlaceId("osm:N:")).toBeNull();
    expect(parsePlaceId("osm:N:12abc")).toBeNull();
  });
});

describe("fromPhoton", () => {
  it("maps a venue into a destination", () => {
    const place = fromPhoton(PHOTON_FEATURE)!;
    expect(place.id).toBe("osm:N:4239111222");
    expect(place.name).toBe("Nanamia Pizzeria");
    expect(place.category).toBe("Restaurant");
    expect(place.latitude).toBeCloseTo(-7.7761738);
    expect(place.longitude).toBeCloseTo(110.3883598);
    expect(place.address).toBe(
      "Jalan Moses Gatotkaca B 9, Mrican, Yogyakarta, Daerah Istimewa Yogyakarta, 55281",
    );
    expect(place.description).toBe("Restaurant in Mrican.");
    // No provider publishes how long to stay, so a category default stands in.
    expect(place.visitDurationMinutes).toBe(75);
    expect(place.directionsUrl).toContain("-7.7761738,110.3883598");
  });

  it("drops a result with no name", () => {
    const anonymous = {
      ...PHOTON_FEATURE,
      properties: { ...PHOTON_FEATURE.properties, name: "   " },
    };
    expect(fromPhoton(anonymous)).toBeNull();
  });

  it("drops a result whose coordinates are unusable", () => {
    for (const coordinates of [[0, 0], ["110.4", "-7.8"], [200, -7.8], []]) {
      expect(fromPhoton({ ...PHOTON_FEATURE, geometry: { coordinates } })).toBeNull();
    }
    expect(fromPhoton({ ...PHOTON_FEATURE, geometry: undefined })).toBeNull();
  });

  it("drops a place rather than a venue", () => {
    // Searching "jogja" offers the city itself. A city is not a stop.
    const city = {
      geometry: { coordinates: [110.3695, -7.7956] },
      properties: {
        osm_id: 1,
        osm_type: "R",
        osm_key: "place",
        osm_value: "city",
        name: "Yogyakarta",
      },
    };
    expect(fromPhoton(city)).toBeNull();
  });

  it("drops street furniture, which is tagged like a venue", () => {
    // Searching "taman" in Jogja returns park benches named "Bangku Taman".
    const bench = {
      geometry: { coordinates: [110.4, -7.78] },
      properties: {
        osm_id: 9,
        osm_type: "N",
        osm_key: "amenity",
        osm_value: "bench",
        name: "Bangku Taman",
      },
    };
    expect(fromPhoton(bench)).toBeNull();
  });

  it("drops a result with an unknown object type", () => {
    const odd = {
      ...PHOTON_FEATURE,
      properties: { ...PHOTON_FEATURE.properties, osm_type: "Q" },
    };
    expect(fromPhoton(odd)).toBeNull();
  });
});

describe("fromOverpass", () => {
  it("maps a node, keeping the opening hours OSM happens to know", () => {
    const place = fromOverpass({
      type: "node",
      id: 4_239_111_222,
      lat: -7.7761738,
      lon: 110.3883598,
      tags: {
        name: "Nanamia Pizzeria",
        amenity: "restaurant",
        opening_hours: "Mo-Su 11:00-22:00",
        "addr:street": "Jalan Moses Gatotkaca",
        "addr:city": "Yogyakarta",
      },
    })!;
    expect(place.id).toBe("osm:N:4239111222");
    expect(place.category).toBe("Restaurant");
    expect(place.openingHours).toBe("Mo-Su 11:00-22:00");
    expect(place.address).toBe("Jalan Moses Gatotkaca, Yogyakarta");
  });

  it("uses the computed centre for a way, which carries no lat/lon", () => {
    const place = fromOverpass({
      type: "way",
      id: 55,
      center: { lat: -7.8, lon: 110.37 },
      tags: { name: "Taman Sari", tourism: "attraction" },
    })!;
    expect(place.id).toBe("osm:W:55");
    expect(place.latitude).toBeCloseTo(-7.8);
    expect(place.visitDurationMinutes).toBe(75);
  });

  it("drops an element with no name or no position", () => {
    expect(
      fromOverpass({ type: "node", id: 1, lat: -7.8, lon: 110.37, tags: {} }),
    ).toBeNull();
    expect(fromOverpass({ type: "node", id: 1, tags: { name: "Nowhere" } })).toBeNull();
  });
});

describe("buildOverpassQuery", () => {
  it("groups ids by object type into one query", () => {
    const query = buildOverpassQuery(["osm:N:1", "osm:W:2", "osm:N:3"])!;
    expect(query).toContain("node(id:1,3);");
    expect(query).toContain("way(id:2);");
    // `center` is what gives ways and relations a position at all.
    expect(query).toContain("out tags center;");
  });

  it("ignores ids that are not live places, and asks nothing when none are", () => {
    expect(buildOverpassQuery(["nanamia-pizzeria", "osm:N:7"])).toContain(
      "node(id:7);",
    );
    expect(buildOverpassQuery(["nanamia-pizzeria", "vredeburg"])).toBeNull();
  });
});
