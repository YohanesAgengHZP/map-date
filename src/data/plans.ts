import type { Mood, Plan } from "@/lib/types";

/** Plans are built from the real venues in `destinations.ts`. */

export const MOODS: { id: Mood; label: string; blurb: string }[] = [
  {
    id: "cozy",
    label: "Cozy",
    blurb: "Warm rooms, long sits",
  },
  {
    id: "heritage",
    label: "Heritage",
    blurb: "Forts, museums, old streets",
  },
  {
    id: "outdoorsy",
    label: "Outdoorsy",
    blurb: "Air, water, long walks",
  },
  {
    id: "foodie",
    label: "Foodie",
    blurb: "Mostly about the food",
  },
  {
    id: "artsy",
    label: "Artsy",
    blurb: "Paint, batik, make things",
  },
];

/**
 * Four plans, grouped the way the owner asked for them rather than by mood.
 *
 * Stop order inside each one is geographic, not the order the list was written
 * in: a plan that crosses the city twice is a worse plan, and the itinerary is
 * reorderable on the page anyway. "Cafe / Food Only" in particular runs south
 * to north, from Tirtodipuran up to Ngaglik.
 */
export const PLANS: Plan[] = [
  {
    id: "museum-activity",
    title: "Museum Activity",
    description:
      "The three museums, then lunch. Sonobudoyo and Vredeburg are three hundred metres apart at Titik Nol, so start there and walk between them, then west to the old art academy in Wirobrajan before heading south to Tirtodipuran to eat. None of the three publish their hours, and the gallery depends on what is hanging, so check before a long day out.",
    mood: "heritage",
    destinationIds: [
      "sonobudoyo",
      "vredeburg",
      "jogja-national-museum",
      "mediterranea",
    ],
    tags: ["Heritage", "Artsy", "Museums"],
    startTime: "09:00",
  },
  {
    id: "lets-go-outdoor",
    title: "Let's Go Outdoor",
    description:
      "An afternoon on the lake paths at Gembira Loka, then north to Ambarrukmo for wood-fired pizza. Plenty of walking first, which is what makes sitting down afterwards the point. Giorno's opening time is disputed between sources, so call ahead if you are running early.",
    mood: "outdoorsy",
    destinationIds: ["gembira-loka", "giorno-pizzeria"],
    tags: ["Outdoorsy", "Foodie", "Half day"],
    startTime: "13:00",
  },
  {
    id: "cafe-food-only",
    title: "Cafe / Food Only",
    description:
      "No museums, no walking tours, just places to sit and eat. Five of them, running south to north: Tirtodipuran, then Ambarrukmo, then two in Condongcatur, then up to Ngaglik. Nobody needs all five in one day, so treat it as a shortlist and drop the ones you are not in the mood for.",
    mood: "foodie",
    destinationIds: [
      "mediterranea",
      "giorno-pizzeria",
      "hou-kie",
      "mohan-burger",
      "hankki-korean",
    ],
    tags: ["Foodie", "Cozy", "Cafe"],
    startTime: "11:00",
  },
  {
    id: "piggy",
    title: "Piggy",
    description:
      "Three pork kitchens, east then south. Babi panggang Karo in Kledokan first, then the two Batak places on Jalan Ipda Tut Harsono, which sit a hundred and fifty metres apart. Non-halal from end to end, which is the thing to agree on before setting off. Toba Tabo stops serving at 21:00.",
    mood: "foodie",
    destinationIds: ["bpk-ola-kisat", "bpk-tesalonika", "babi-toba-tabo"],
    tags: ["Foodie", "Pork", "Non-halal"],
    startTime: "17:00",
  },
];

export function getPlan(id: string): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}

export const TIME_FILTERS = [
  { id: "any", label: "Any time", maxMinutes: Infinity },
  { id: "short", label: "Up to 3 hours", maxMinutes: 180 },
  { id: "half-day", label: "3 – 5 hours", maxMinutes: 300 },
  { id: "full-day", label: "5 hours or more", maxMinutes: Infinity, minMinutes: 300 },
] as const;
