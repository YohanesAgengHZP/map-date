import type { Destination, LatLng, RouteResult, TravelLeg } from "./types";

/**
 * Routing provider boundary.
 *
 * Default provider is OSRM's public demo server: real road geometry and real
 * driving durations with no API key, which is why this prototype ships with
 * live routes instead of invented numbers. Point `NEXT_PUBLIC_ROUTING_URL` at
 * your own OSRM instance for production use (the demo server is rate-limited
 * and offers no uptime guarantee).
 *
 * To swap in Mapbox/Google instead, replace the body of `routeViaProvider`.
 * Everything else consumes `RouteResult` and does not care who produced it.
 */
const ROUTING_BASE_URL =
  process.env.NEXT_PUBLIC_ROUTING_URL ?? "https://router.project-osrm.org";

/** City-traffic constants for the offline fallback. Tune to taste. */
const DETOUR_FACTOR = 1.35; // straight-line -> road distance
const CITY_SPEED_KMH = 22;

/**
 * Walking thresholds.
 *
 * OSRM's public demo only hosts the driving profile. Asking it for `/foot`
 * silently returns the road route, so walking has to be worked out here. Any
 * leg whose straight-line distance is under `WALKABLE_METRES` is treated as a
 * walk, which matters most around Malioboro, where the one-way system turns a
 * 350 m stroll into a 1.8 km drive.
 */
const WALKABLE_METRES = 1_200;
const WALK_PATH_FACTOR = 1.15; // straight-line -> actual pavement distance
const WALK_SPEED_KMH = 4.8;

function walkingLeg(from: Destination, to: Destination): TravelLeg {
  const meters =
    haversineMeters(toLatLng(from), toLatLng(to)) * WALK_PATH_FACTOR;
  return {
    fromId: from.id,
    toId: to.id,
    mode: "walking",
    meters: Math.round(meters),
    minutes: Math.max(1, Math.round((meters / 1000 / WALK_SPEED_KMH) * 60)),
    // Not a routed footpath, so it stays labelled an estimate.
    source: "estimated",
  };
}

/** Replace short driving legs with a walking estimate. */
function preferWalking(
  destinations: Destination[],
  legs: TravelLeg[],
): TravelLeg[] {
  return legs.map((leg, index) => {
    const from = destinations[index];
    const to = destinations[index + 1];
    if (!from || !to) return leg;
    const straightLine = haversineMeters(toLatLng(from), toLatLng(to));
    return straightLine <= WALKABLE_METRES ? walkingLeg(from, to) : leg;
  });
}

function haversineMeters(a: LatLng, b: LatLng): number {
  const R = 6_371_000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Distance-based guess, used only when no router answered. Explicitly tagged
 * `estimated` so the UI can say so rather than passing it off as a route.
 */
export function estimateRoute(destinations: Destination[]): RouteResult {
  const legs = pairs(destinations).map(([from, to]): TravelLeg => {
    const meters = haversineMeters(toLatLng(from), toLatLng(to)) * DETOUR_FACTOR;
    return {
      fromId: from.id,
      toId: to.id,
      mode: "driving" as const,
      meters: Math.round(meters),
      minutes: Math.max(1, Math.round(meters / 1000 / CITY_SPEED_KMH * 60)),
      source: "estimated",
    };
  });
  return {
    legs: preferWalking(destinations, legs),
    geometry: null,
    source: "estimated",
  };
}

function unavailableRoute(destinations: Destination[]): RouteResult {
  return {
    legs: pairs(destinations).map(([from, to]) => ({
      fromId: from.id,
      toId: to.id,
      mode: "driving" as const,
      minutes: null,
      meters: null,
      source: "unavailable" as const,
    })),
    geometry: null,
    source: "unavailable",
  };
}

type OsrmResponse = {
  code: string;
  routes?: {
    legs: { duration: number; distance: number }[];
    geometry?: { coordinates: [number, number][] };
  }[];
};

async function routeViaProvider(
  destinations: Destination[],
  signal?: AbortSignal,
): Promise<RouteResult> {
  const path = destinations.map((d) => `${d.longitude},${d.latitude}`).join(";");
  const url = `${ROUTING_BASE_URL}/route/v1/driving/${path}?overview=full&geometries=geojson`;

  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Routing provider returned ${response.status}`);

  const data = (await response.json()) as OsrmResponse;
  const route = data.routes?.[0];
  if (data.code !== "Ok" || !route) throw new Error(`Routing failed: ${data.code}`);

  const legs = pairs(destinations).map(([from, to], index): TravelLeg => {
    const leg = route.legs[index];
    if (!leg) {
      return {
        fromId: from.id,
        toId: to.id,
        mode: "driving",
        minutes: null,
        meters: null,
        source: "unavailable",
      };
    }
    return {
      fromId: from.id,
      toId: to.id,
      mode: "driving",
      minutes: Math.max(1, Math.round(leg.duration / 60)),
      meters: Math.round(leg.distance),
      source: "routed",
    };
  });

  const geometry =
    route.geometry?.coordinates.map(([lng, lat]) => ({ lat, lng })) ?? null;

  return { legs: preferWalking(destinations, legs), geometry, source: "routed" };
}

/**
 * Resolve travel between stops, degrading honestly:
 * routed -> distance estimate -> unavailable.
 */
export async function getRoute(
  destinations: Destination[],
  signal?: AbortSignal,
): Promise<RouteResult> {
  if (destinations.length < 2) {
    return { legs: [], geometry: null, source: "routed" };
  }
  try {
    return await routeViaProvider(destinations, signal);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    // ponytail: one retry tier is enough; the estimate is good to ~±5 min in town.
    try {
      return estimateRoute(destinations);
    } catch {
      return unavailableRoute(destinations);
    }
  }
}

export function toLatLng(destination: Destination): LatLng {
  return { lat: destination.latitude, lng: destination.longitude };
}

function pairs<T>(items: T[]): [T, T][] {
  return items.slice(0, -1).map((item, i) => [item, items[i + 1]]);
}

/** Multi-stop Google Maps directions link. Works without any API key. */
export function buildDirectionsUrl(destinations: Destination[]): string {
  if (destinations.length === 0) return "https://www.google.com/maps";
  const points = destinations.map((d) => `${d.latitude},${d.longitude}`);
  const params = new URLSearchParams({
    api: "1",
    origin: points[0],
    destination: points[points.length - 1],
    travelmode: "driving",
  });
  const waypoints = points.slice(1, -1);
  if (waypoints.length > 0) params.set("waypoints", waypoints.join("|"));
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
