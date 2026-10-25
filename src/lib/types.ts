export type Mood = "cozy" | "heritage" | "outdoorsy" | "foodie" | "artsy";

export type Photo = {
  id: string;
  url: string;
  alt: string;
  caption?: string;
};

/**
 * Deliberately carries no pricing: the product is about where to go and when,
 * and an afternoon out should not read like a quote. Cost is left to the venue.
 */
export type Destination = {
  id: string;
  name: string;
  category: string;
  description: string;
  latitude: number;
  longitude: number;
  address: string;
  photos: Photo[];
  visitDurationMinutes: number;
  /**
   * How well the coordinate is known. "approximate" means the pin is only
   * village- or street-level. The venue is real but its exact spot was not in
   * OpenStreetMap, so the UI must say so rather than imply a precise location.
   * Absent means exact.
   */
  locationPrecision?: "approximate";
  /** True when the venue runs fixed sessions and will not take walk-ins. */
  bookingRequired?: boolean;
  openingHours?: string;
  rating?: number;
  reviewCount?: number;
  tags: string[];
  directionsUrl: string;
};

export type Plan = {
  id: string;
  title: string;
  description: string;
  coverPhoto: Photo;
  /** Primary mood, used by the Discover filter. `tags` carries the rest. */
  mood: Mood;
  destinationIds: string[];
  tags: string[];
  /** Suggested start time, "HH:MM" local. */
  startTime: string;
};

/** Where a travel estimate came from, so the UI never implies false precision. */
export type EstimateSource = "routed" | "estimated" | "unavailable";

export type TravelLeg = {
  fromId: string;
  toId: string;
  /**
   * How you would actually cover this leg. Short hops are walked: driving
   * directions around a one-way system can report 1.8 km between two places
   * three hundred metres apart.
   */
  mode: "driving" | "walking";
  /** null when no provider could answer. Render it as unknown, never as 0. */
  minutes: number | null;
  meters: number | null;
  source: EstimateSource;
};

export type LatLng = { lat: number; lng: number };

export type RouteResult = {
  legs: TravelLeg[];
  /** Road-following polyline when a router answered, else null (straight lines). */
  geometry: LatLng[] | null;
  source: EstimateSource;
};

export type ItineraryStop = {
  destination: Destination;
  /** 1-based position shown on the pin and the card. */
  order: number;
  /** Minutes from midnight, so arithmetic stays trivial. */
  arrivalMinutes: number;
  departureMinutes: number;
  /** Travel to the *next* stop; undefined for the final stop. */
  travelToNext?: TravelLeg;
};
