import type { Destination } from "./types";

/**
 * Place provider boundary: OpenStreetMap, reached through two keyless services.
 *
 * - Photon answers free-text search ("nanamia") with ranked, fuzzy matches.
 *   It carries name, coordinates and an address, and nothing else.
 * - Overpass answers "what is OSM object N/W/R 123?", which is how a plan that
 *   arrived in a share link resolves stops this browser has never seen. It also
 *   returns the full tag set, so opening hours come along for free.
 *
 * Neither needs an API key and both are CORS-enabled, so this runs in the
 * browser with no route handler in between. Point the env vars at your own
 * instances for production: the public endpoints are rate-limited and offer no
 * uptime guarantee.
 *
 * To swap in Google/Foursquare instead, replace `searchPlaces` and
 * `lookupPlaces`. Everything else consumes `Destination` and does not care who
 * produced it.
 *
 * OSM carries no usable venue imagery, which is why the app has no photos at
 * all: a survey of 934 named Jogja POIs found an image tag on 13. Places show
 * a category icon instead. See `CategoryIcon`.
 */
const PHOTON_URL =
  process.env.NEXT_PUBLIC_PHOTON_URL ?? "https://photon.komoot.io/api";
const OVERPASS_URL =
  process.env.NEXT_PUBLIC_OVERPASS_URL ??
  "https://overpass-api.de/api/interpreter";

/** Ranking bias, not a filter: this is a Yogyakarta app, so Jogja ranks first. */
const SEARCH_CENTER = { lat: -7.7956, lon: 110.3695 };

/* ------------------------------------------------------------------ *
 * Asking the network politely
 *
 * Both endpoints are shared, rate-limited and free, and Overpass answers in
 * 10 to 20 seconds under load and returned 502 often enough to do so during
 * testing. Two cheap habits make that survivable without a backend: ask once
 * again when the failure looks transient, and never ask the same question
 * twice in a session.
 * ------------------------------------------------------------------ */

const RETRY_DELAY_MS = 400;

/** 429 and 5xx are worth asking again. A 404 or a 400 will not change. */
function isTransient(status: number): boolean {
  return status === 429 || status >= 500;
}

/**
 * Resolves early on abort rather than rejecting: the retry that follows calls
 * `fetch` with the same aborted signal, which rejects immediately by itself.
 * One wasted timer beats an abort-listener dance.
 */
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Exactly one retry. The person who typed is still waiting, and hammering a
 * rate-limited endpoint is how you stay rate-limited.
 */
async function fetchRetrying(
  url: string | URL,
  init: RequestInit,
  who: string,
): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const last = attempt > 0;

    // The refusal is thrown outside the try on purpose: raised inside it, the
    // catch below would treat "400, do not retry" as a transport failure and
    // retry it anyway.
    let response: Response | null = null;
    try {
      response = await fetch(url, init);
    } catch (error) {
      // An abort is the caller changing its mind, not a failure to retry.
      if (last || init.signal?.aborted) throw error;
    }

    if (response) {
      if (response.ok) return response;
      if (last || !isTransient(response.status)) {
        throw new Error(`${who} answered ${response.status}`);
      }
    }

    await wait(RETRY_DELAY_MS);
  }
}

/**
 * Per session and in memory only. These answers go stale, and the places that
 * actually became stops are already persisted by `customPlaces`.
 *
 * Bounded, because a long session of typing is a long session of distinct
 * queries. `Map` iterates in insertion order, so the first key is the oldest.
 */
const MAX_CACHED = 50;

function remember<T>(cache: Map<string, T>, key: string, value: T): T {
  cache.set(key, value);
  while (cache.size > MAX_CACHED) {
    const oldest = cache.keys().next().value;
    if (oldest === undefined) break;
    cache.delete(oldest);
  }
  return value;
}

const searchCache = new Map<string, Destination[]>();
/** `null` records "asked, and Overpass does not know it" so it is asked once. */
const lookupCache = new Map<string, Destination | null>();

/** Exported for tests; nothing in the app needs to forget an answer. */
export function clearPlaceCaches(): void {
  searchCache.clear();
  lookupCache.clear();
}

/* ------------------------------------------------------------------ *
 * Ids
 *
 * `osm:N:123456` rather than a slug. Prefixed so a live place can never
 * collide with a built-in id in `destinations.ts`, and stable enough to put
 * in a share link, because the whole point is that any browser can resolve it
 * again through Overpass.
 * ------------------------------------------------------------------ */

const OSM_TYPES = { N: "node", W: "way", R: "relation" } as const;

type OsmType = keyof typeof OSM_TYPES;

export function toPlaceId(type: string, id: number | string): string {
  return `osm:${type}:${id}`;
}

export function isPlaceId(id: string): boolean {
  return parsePlaceId(id) !== null;
}

export function parsePlaceId(
  id: string,
): { type: OsmType; osmId: number } | null {
  const match = /^osm:([NWR]):(\d+)$/.exec(id);
  if (!match) return null;
  return { type: match[1] as OsmType, osmId: Number(match[2]) };
}

/* ------------------------------------------------------------------ *
 * OSM tags -> the fields the app needs
 * ------------------------------------------------------------------ */

/**
 * OSM keys that describe where something is rather than a place you would go.
 * A search for "jogja" otherwise offers the city itself as a stop.
 */
const NOT_A_VENUE = new Set([
  "place",
  "boundary",
  "highway",
  "railway",
  "waterway",
  "landuse",
  "building",
  "address",
  "aeroway",
  "barrier",
  "power",
]);

/**
 * Street furniture. These carry an `amenity` tag like a restaurant does, so
 * the key alone does not filter them: a search for "taman" in Jogja otherwise
 * offers four park benches named "Bangku Taman" as places to spend an hour.
 */
const NOT_A_STOP = new Set([
  "bench",
  "waste_basket",
  "recycling",
  "drinking_water",
  "toilets",
  "bicycle_parking",
  "motorcycle_parking",
  "parking",
  "parking_space",
  "parking_entrance",
  "fuel",
  "atm",
  "post_box",
  "telephone",
  "vending_machine",
  "street_lamp",
  "surveillance",
  "shelter",
  "clock",
]);

/**
 * How long people actually spend somewhere, by OSM category. A guess, but a
 * guess the itinerary needs: no provider publishes this, and it is the one
 * field a live source can never fill. Tune to taste; override by hand in
 * `destinations.ts` for a venue you know better.
 */
const VISIT_MINUTES: Record<string, number> = {
  cafe: 60,
  fast_food: 45,
  restaurant: 75,
  bar: 90,
  pub: 90,
  ice_cream: 30,
  food_court: 60,
  museum: 90,
  gallery: 60,
  attraction: 75,
  artwork: 20,
  viewpoint: 20,
  zoo: 150,
  theme_park: 180,
  water_park: 180,
  park: 60,
  garden: 60,
  cinema: 150,
  marketplace: 60,
  mall: 120,
};

const DEFAULT_VISIT_MINUTES = 60;

/** "fast_food" -> "Fast food". Falls back to the key when there is no value. */
function toCategory(key?: string, value?: string): string {
  const raw = value ?? key ?? "Place";
  const spaced = raw.replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function joinAddress(parts: (string | undefined)[]): string {
  return parts.filter((part) => part && part.trim().length > 0).join(", ");
}

/** "Jl. Moses Gatotkaca" + "B 9" -> "Jl. Moses Gatotkaca B 9". */
function streetLine(street?: string, houseNumber?: string): string | undefined {
  if (!street) return houseNumber;
  return houseNumber ? `${street} ${houseNumber}` : street;
}

/**
 * OSM gives no prose, and inventing some would be worse than having none. This
 * says only what the tags already say: what kind of place, and roughly where.
 */
function describe(category: string, where: string | undefined): string {
  return where ? `${category} in ${where}.` : category;
}

function directionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

function isUsableCoord(lat: unknown, lng: unknown): boolean {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180 &&
    // 0,0 is in the Gulf of Guinea and is what a provider returns when it
    // actually means "no idea".
    !(lat === 0 && lng === 0)
  );
}

/* ------------------------------------------------------------------ *
 * Photon: free-text search
 * ------------------------------------------------------------------ */

type PhotonFeature = {
  geometry?: { coordinates?: unknown };
  properties?: Record<string, unknown>;
};

/**
 * Nothing arriving from a third party is trusted: a feature without a name or
 * without usable coordinates is dropped rather than turned into a stop with a
 * blank label or a pin in the ocean.
 */
export function fromPhoton(feature: PhotonFeature): Destination | null {
  const props = feature.properties;
  if (!props) return null;

  const name = typeof props.name === "string" ? props.name.trim() : "";
  if (name.length === 0) return null;

  const key = typeof props.osm_key === "string" ? props.osm_key : undefined;
  if (key && NOT_A_VENUE.has(key)) return null;
  if (typeof props.osm_value === "string" && NOT_A_STOP.has(props.osm_value)) {
    return null;
  }

  const osmType = typeof props.osm_type === "string" ? props.osm_type : "";
  const osmId = props.osm_id;
  if (!(osmType in OSM_TYPES)) return null;
  if (typeof osmId !== "number" && typeof osmId !== "string") return null;

  const coords = feature.geometry?.coordinates;
  if (!Array.isArray(coords)) return null;
  const [lng, lat] = coords as unknown[];
  if (!isUsableCoord(lat, lng)) return null;

  const value = typeof props.osm_value === "string" ? props.osm_value : undefined;
  const category = toCategory(key, value);
  const str = (field: string) =>
    typeof props[field] === "string" ? (props[field] as string) : undefined;
  const where = str("district") ?? str("city") ?? str("county") ?? str("state");

  return {
    id: toPlaceId(osmType, osmId),
    name,
    category,
    description: describe(category, where),
    latitude: lat as number,
    longitude: lng as number,
    address: joinAddress([
      streetLine(str("street"), str("housenumber")),
      str("district"),
      str("city"),
      str("state"),
      str("postcode"),
    ]),
    visitDurationMinutes: VISIT_MINUTES[value ?? ""] ?? DEFAULT_VISIT_MINUTES,
    // A searched result is a mapped OSM object, so its pin is the real one.
    tags: [],
    directionsUrl: directionsUrl(lat as number, lng as number),
  };
}

export async function searchPlaces(
  query: string,
  signal?: AbortSignal,
): Promise<Destination[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  // Backspacing a letter and typing it again is the common case, and it used
  // to cost a second request.
  const key = trimmed.toLowerCase();
  const hit = searchCache.get(key);
  if (hit) return hit;

  const url = new URL(PHOTON_URL);
  url.searchParams.set("q", trimmed);
  url.searchParams.set("limit", "12");
  url.searchParams.set("lang", "en");
  url.searchParams.set("lat", String(SEARCH_CENTER.lat));
  url.searchParams.set("lon", String(SEARCH_CENTER.lon));

  const response = await fetchRetrying(url, { signal }, "Photon");

  const body: unknown = await response.json();
  const features =
    typeof body === "object" && body !== null && "features" in body
      ? (body as { features: unknown }).features
      : null;
  if (!Array.isArray(features)) return [];

  const places = features
    .map((feature) => fromPhoton(feature as PhotonFeature))
    .filter((place): place is Destination => place !== null);

  // Keep the highest-ranked entry per id. Not deduped by name on purpose:
  // Nanamia has two branches and there are two Batak kitchens on one street,
  // so same-name results are usually genuinely different places.
  const byId = new Map<string, Destination>();
  for (const place of places) {
    if (!byId.has(place.id)) byId.set(place.id, place);
  }
  return remember(searchCache, key, [...byId.values()]);
}

/* ------------------------------------------------------------------ *
 * Share links
 *
 * A shared plan names its stops by id. Built-in ids resolve from the repo, but
 * a searched one resolves only through Overpass, which answers in 10 to 20
 * seconds under load and sometimes not at all. Carrying the few fields needed
 * to draw the stop means the plan renders immediately and offline, and the
 * Overpass lookup becomes enrichment rather than a dependency.
 * ------------------------------------------------------------------ */

/**
 * The smallest record that still renders a place. Single-letter keys and
 * five-decimal coordinates (about a metre) because this ends up in a URL
 * someone pastes into a chat: roughly 110 bytes per stop rather than 400.
 */
export type SharedPlace = {
  i: string;
  n: string;
  c: string;
  y: number;
  x: number;
  v: number;
  h?: string;
};

export function toSharedPlace(place: Destination): SharedPlace {
  return {
    i: place.id,
    n: place.name,
    c: place.category,
    y: Number(place.latitude.toFixed(5)),
    x: Number(place.longitude.toFixed(5)),
    v: place.visitDurationMinutes,
    ...(place.openingHours ? { h: place.openingHours } : {}),
  };
}

/** A minute budget past this is not a stop on an afternoon out. */
const MAX_VISIT_MINUTES = 24 * 60;

/**
 * Rebuild a place from a share link, which is hostile input by definition.
 *
 * Every field is range-checked, and the two fields that could do harm are
 * never read from the token at all: `directionsUrl` is derived from the
 * validated coordinates, so a crafted link cannot point "Open in Maps" at a
 * site of its choosing, and `description` is derived from the category rather
 * than carried as free text.
 */
export function fromSharedPlace(raw: unknown): Destination | null {
  if (typeof raw !== "object" || raw === null) return null;
  const { i, n, c, y, x, v, h } = raw as Record<string, unknown>;

  if (typeof i !== "string" || !isPlaceId(i)) return null;

  const name = typeof n === "string" ? n.trim() : "";
  if (name.length === 0 || name.length > 120) return null;

  const category = typeof c === "string" ? c.trim() : "";
  if (category.length === 0 || category.length > 60) return null;

  if (!isUsableCoord(y, x)) return null;

  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  const minutes = Math.round(v);
  if (minutes <= 0 || minutes > MAX_VISIT_MINUTES) return null;

  const hours = typeof h === "string" ? h.trim().slice(0, 80) : undefined;

  return {
    id: i,
    name,
    category,
    description: describe(category, undefined),
    latitude: y as number,
    longitude: x as number,
    address: "",
    visitDurationMinutes: minutes,
    ...(hours ? { openingHours: hours } : {}),
    tags: [],
    directionsUrl: directionsUrl(y as number, x as number),
  };
}

/* ------------------------------------------------------------------ *
 * Overpass: resolve by id
 * ------------------------------------------------------------------ */

type OverpassElement = {
  type?: unknown;
  id?: unknown;
  lat?: unknown;
  lon?: unknown;
  center?: { lat?: unknown; lon?: unknown };
  tags?: Record<string, unknown>;
};

export function fromOverpass(element: OverpassElement): Destination | null {
  const tags = element.tags ?? {};
  const name = typeof tags.name === "string" ? tags.name.trim() : "";
  if (name.length === 0) return null;

  const type = typeof element.type === "string" ? element.type : "";
  const letter = (Object.keys(OSM_TYPES) as OsmType[]).find(
    (initial) => OSM_TYPES[initial] === type,
  );
  if (!letter || typeof element.id !== "number") return null;

  // Nodes carry lat/lon directly; ways and relations carry a computed centre.
  const lat = element.lat ?? element.center?.lat;
  const lng = element.lon ?? element.center?.lon;
  if (!isUsableCoord(lat, lng)) return null;

  const str = (field: string) =>
    typeof tags[field] === "string" ? (tags[field] as string) : undefined;
  const key = (["amenity", "tourism", "leisure", "shop", "historic"] as const).find(
    (candidate) => typeof tags[candidate] === "string",
  );
  const value = key ? (tags[key] as string) : undefined;
  const category = toCategory(key, value);
  const where = str("addr:suburb") ?? str("addr:city");

  return {
    id: toPlaceId(letter, element.id),
    name,
    category,
    description: describe(category, where),
    latitude: lat as number,
    longitude: lng as number,
    address: joinAddress([
      streetLine(str("addr:street"), str("addr:housenumber")),
      str("addr:suburb"),
      str("addr:city"),
      str("addr:postcode"),
    ]),
    visitDurationMinutes: VISIT_MINUTES[value ?? ""] ?? DEFAULT_VISIT_MINUTES,
    openingHours: str("opening_hours"),
    tags: [],
    directionsUrl: directionsUrl(lat as number, lng as number),
  };
}

/** Overpass QL asking for every id at once, grouped by object type. */
export function buildOverpassQuery(ids: string[]): string | null {
  const byType = new Map<OsmType, number[]>();
  for (const id of ids) {
    const parsed = parsePlaceId(id);
    if (!parsed) continue;
    const bucket = byType.get(parsed.type) ?? [];
    bucket.push(parsed.osmId);
    byType.set(parsed.type, bucket);
  }
  if (byType.size === 0) return null;

  const clauses = [...byType]
    .map(([type, osmIds]) => `${OSM_TYPES[type]}(id:${osmIds.join(",")});`)
    .join("");
  return `[out:json][timeout:20];(${clauses});out tags center;`;
}

/**
 * Resolve ids this browser has never seen, which is what happens when a shared
 * plan names a place the reader never added. Unresolvable ids are simply
 * absent from the result; the caller decides what to say about them.
 */
export async function lookupPlaces(
  ids: string[],
  signal?: AbortSignal,
): Promise<Destination[]> {
  // Cached per id rather than per call, so a plan that adds one stop to four
  // already-known ones asks about the one. Ids already known to be
  // unresolvable are not asked about again: a share link naming a dead id
  // otherwise spent 10 to 20 seconds on it on every mount.
  const known = ids
    .map((id) => lookupCache.get(id))
    .filter((place): place is Destination => place != null);
  const missing = ids.filter((id) => !lookupCache.has(id));
  if (missing.length === 0) return known;

  const query = buildOverpassQuery(missing);
  if (!query) return known;

  const response = await fetchRetrying(
    OVERPASS_URL,
    {
      method: "POST",
      body: new URLSearchParams({ data: query }),
      signal,
    },
    "Overpass",
  );

  const body: unknown = await response.json();
  const elements =
    typeof body === "object" && body !== null && "elements" in body
      ? (body as { elements: unknown }).elements
      : null;
  if (!Array.isArray(elements)) return known;

  const found = elements
    .map((element) => fromOverpass(element as OverpassElement))
    .filter((place): place is Destination => place !== null);

  // Record the misses too, which is the whole point of asking.
  const byId = new Map(found.map((place) => [place.id, place]));
  for (const id of missing) {
    remember(lookupCache, id, byId.get(id) ?? null);
  }

  return [...known, ...found];
}
