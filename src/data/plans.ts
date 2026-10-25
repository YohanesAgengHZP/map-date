import type { Mood, Plan } from "@/lib/types";

/**
 * Plans are built from the real venues in `destinations.ts`, and every cover
 * photo is a real photo of one of the stops in that plan.
 */

export const MOODS: { id: Mood; label: string; blurb: string; photo: string; alt: string }[] = [
  {
    id: "cozy",
    label: "Cozy",
    blurb: "Warm rooms, long sits",
    photo: "/venues/lunion-pizza/2.webp",
    alt: "A courtyard at dusk with tables under a lit canopy",
  },
  {
    id: "heritage",
    label: "Heritage",
    blurb: "Forts, museums, old streets",
    photo: "/venues/sonobudoyo/1.webp",
    alt: "Display cases of wayang puppets in a darkened gallery",
  },
  {
    id: "outdoorsy",
    label: "Outdoorsy",
    blurb: "Air, water, long walks",
    photo: "/venues/gembira-loka/1.webp",
    alt: "Visitors in small boats on a green lake",
  },
  {
    id: "foodie",
    label: "Foodie",
    blurb: "Mostly about the food",
    photo: "/venues/nanamia/1.webp",
    alt: "A bright pizzeria dining room with guests at tables",
  },
  {
    id: "artsy",
    label: "Artsy",
    blurb: "Paint, batik, make things",
    photo: "/venues/batik-workshop/1.webp",
    alt: "A woman drawing batik with a canting at a work table",
  },
];

export const PLANS: Plan[] = [
  {
    id: "batik-and-dinner",
    title: "Batik, Then Dinner",
    description:
      "A morning bent over hot wax in the Tirtodipuran batik quarter, then a long Mediterranean lunch further down the same street. The two stops are a few hundred metres apart, so this one is entirely on foot.",
    coverPhoto: {
      id: "batik-and-dinner-cover",
      url: "/venues/batik-workshop/1.webp",
      alt: "A woman drawing batik with a canting at a work table",
    },
    mood: "artsy",
    destinationIds: ["batik-workshop", "mediterranea"],
    tags: ["Artsy", "Cozy", "Walkable"],
    startTime: "10:00",
  },
  {
    id: "fort-and-shadows",
    title: "Fort & Shadow Puppets",
    description:
      "Start at the fort on Malioboro, walk the three hundred metres to Sonobudoyo, then head north for wood-fired pizza off Gejayan. Sonobudoyo also runs evening wayang kulit, so check the schedule before you build an evening around it.",
    coverPhoto: {
      id: "fort-and-shadows-cover",
      url: "/venues/vredeburg/1.webp",
      alt: "A large bronze relief sculpture mounted on a dark gallery wall",
    },
    mood: "heritage",
    destinationIds: ["vredeburg", "sonobudoyo", "nanamia-pizzeria"],
    tags: ["Heritage", "Foodie", "Museums"],
    startTime: "14:00",
  },
  {
    id: "zoo-and-burger",
    title: "Zoo, Then Burger",
    description:
      "An afternoon walking the lake paths at Gembira Loka, then north to Condongcatur for a burger behind Pakuwon Mall. Plenty of walking early on, so the sitting down at the end is the point.",
    coverPhoto: {
      id: "zoo-and-burger-cover",
      url: "/venues/gembira-loka/3.webp",
      alt: "A crowd seated under a canopy watching a show on the lawn",
    },
    mood: "outdoorsy",
    destinationIds: ["gembira-loka", "mohan-burger"],
    tags: ["Outdoorsy", "Foodie", "Half day"],
    startTime: "14:30",
  },
  {
    id: "make-and-ramen",
    title: "Make Your Own, Then Ramen",
    description:
      "Build and bake your own pizza out at Rogoyudan, then cut east across the ring road for ramen and salmon in Condongcatur. Two very different ways of being fed, one afternoon.",
    coverPhoto: {
      id: "make-and-ramen-cover",
      url: "/venues/lunion-pizza/1.webp",
      alt: "A group in aprons shaping pizza dough along a brick counter",
    },
    mood: "foodie",
    destinationIds: ["lunion-pizza", "ryuji"],
    tags: ["Foodie", "Make your own", "Evening"],
    startTime: "15:00",
  },

  /**
   * The five below were built once the newer venues landed. Each start time is
   * set so the plan actually fits inside the hours we know about: the parks
   * both shut in the late afternoon, and Toba Tabo opens at 11:00.
   */
  {
    id: "paint-then-fort",
    title: "Paint, Then the Fort",
    description:
      "A morning at the clay and canvas tables behind the post office at Titik Nol, then three hundred metres up the road to the fort. Lunch is further south on Tirtodipuran, so the last leg is a short ride rather than a walk.",
    coverPhoto: {
      id: "paint-then-fort-cover",
      url: "/venues/jogja-art-activity/1.webp",
      alt: "A group in green aprons outside the studio, each holding up the piece they painted",
    },
    mood: "artsy",
    destinationIds: ["jogja-art-activity", "vredeburg", "mediterranea"],
    tags: ["Artsy", "Heritage", "Titik Nol"],
    startTime: "10:00",
  },
  {
    id: "gallery-then-batak",
    title: "Gallery, Then Batak",
    description:
      "Whatever is hanging in the old art academy in Wirobrajan, then east across town for roast pork and saksang on Jalan Ipda Tut Harsono. Check the gallery's current programme first, because between shows there may be nothing up.",
    coverPhoto: {
      id: "gallery-then-batak-cover",
      url: "/venues/jogja-national-museum/1.webp",
      alt: "A crocheted coral reef installation filling a glass dome, with yellow fish strung overhead",
    },
    mood: "artsy",
    destinationIds: ["jogja-national-museum", "babi-toba-tabo"],
    tags: ["Artsy", "Foodie", "Evening"],
    startTime: "15:00",
  },
  {
    id: "up-the-magelang-road",
    title: "Up the Magelang Road",
    description:
      "An afternoon of rides and painted facades at Km 14 on the Magelang road, then cut east to Ngaglik for Korean. Both ends of this one are well north of the ring road, so it is a riding day rather than a walking one.",
    coverPhoto: {
      id: "up-the-magelang-road-cover",
      url: "/venues/ibarbo-park/1.webp",
      alt: "The park seen from above at dusk, rides and painted facades lit along a curving street",
    },
    mood: "outdoorsy",
    destinationIds: ["ibarbo-park", "hankki-korean"],
    tags: ["Outdoorsy", "Foodie", "Half day"],
    startTime: "13:00",
  },
  {
    id: "karts-then-karo",
    title: "Karts, Then Karo Pork",
    description:
      "Go-karts and a miniature Jogja out at Km 10 on the Wonosari road, then north-west to Kledokan for babi panggang Karo. The park's zones close at different times, so start early enough to use them.",
    coverPhoto: {
      id: "karts-then-karo-cover",
      url: "/venues/kids-fun-parcs/1.webp",
      alt: "Two small electric police cars on a miniature street circuit built around a Tugu replica",
    },
    mood: "outdoorsy",
    destinationIds: ["kids-fun-parcs", "bpk-ola-kisat"],
    tags: ["Outdoorsy", "Foodie", "Half day"],
    startTime: "12:30",
  },
  {
    id: "two-kitchens-one-street",
    title: "Two Kitchens, One Street",
    description:
      "Both Batak kitchens on Jalan Ipda Tut Harsono, a hundred and fifty metres apart, taken one after the other. Order light at the first. Non-halal from end to end, which is the thing to agree on before you set off.",
    coverPhoto: {
      id: "two-kitchens-one-street-cover",
      url: "/venues/babi-toba-tabo/1.webp",
      alt: "Four oval plates of crisp and braised pork with cucumber and cabbage on a red table",
    },
    mood: "foodie",
    destinationIds: ["bpk-tesalonika", "babi-toba-tabo"],
    tags: ["Foodie", "Cozy", "Walkable"],
    startTime: "17:30",
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
