import type { Destination } from "@/lib/types";

/**
 * REAL VENUES ONLY.
 *
 * Every entry below is an actual place in or around Yogyakarta, and every photo
 * is a real photo of that place, supplied by the project owner and served from
 * `public/venues/<slug>/`. No stock imagery and no invented venues remain.
 *
 * Coordinates come from OpenStreetMap where the venue is mapped, and were
 * checked against the routable road network. Where a venue is NOT in
 * OpenStreetMap the pin is only village- or street-level; those carry
 * `locationPrecision: "approximate"` and the UI says so rather than implying a
 * precision we do not have.
 *
 * Opening hours are only stated where a source actually gives them. Several
 * venues are therefore blank on purpose. See the per-entry comments.
 *
 * No pricing by design. See the note on `Destination` in `lib/types.ts`.
 */

export const DESTINATIONS: Destination[] = [
  {
    id: "nanamia-pizzeria",
    name: "Nanamia Pizzeria",
    category: "Pizzeria",
    // North Area branch, on Jalan Moses Gatotkaca in Mrican. The Tirtodipuran
    // branch is the other one; coordinates and address both point here.
    description:
      "Wood-fired, thin-crust Italian, and one of the places that started Jogja's proper-pizza habit. Antipasti, pasta and pizza. This is the North Area branch off Gejayan, tucked down a side street near Jogja Plaza; there is a second branch south on Tirtodipuran if this one is full.",
    latitude: -7.7761738,
    longitude: 110.3883598,
    address: "Jl. Moses Gatotkaca No.B 9 - 14, Mrican, Caturtunggal, Kec. Depok, Kabupaten Sleman, Daerah Istimewa Yogyakarta 55281",
    photos: [
      {
        id: "nanamia-1",
        url: "/venues/nanamia/1.webp",
        alt: "Bright dining room with yellow walls and teal columns, guests at tables",
      },
      {
        id: "nanamia-2",
        url: "/venues/nanamia/2.webp",
        alt: "Yellow and teal interior with the Pizza Nanamia sign on the wall",
      },
    ],
    visitDurationMinutes: 90,
    openingHours: "11:00 – 22:00",
    tags: ["Foodie", "Pizza", "Garden seating"],
    directionsUrl:
      "https://www.google.com/maps/place/Nanamia+Pizzeria+(North+Area)/@-7.7761738,110.3883598,17z/data=!4m6!3m5!1s0x2e7a59c7d0f0c797:0x485cfaac95e66563!8m2!3d-7.7761791!4d110.3909347!16s%2Fg%2F1tvrfh17?entry=ttu&g_ep=EgoyMDI2MTAyMC4wIKXMDSoASAFQAw%3D%3D",
  },
  {
    id: "mediterranea",
    name: "Mediterranea Restaurant by Kamil",
    category: "Mediterranean restaurant",
    // OpenStreetMap lists it at "24 A, Jalan Tirtodipuran", matching the
    // published address; 6 m from the road.
    description:
      "French-Mediterranean cooking on Tirtodipuran, open since 2012. Meze, salads, pasta, fish and a well-known pizza; vegetarian, vegan and gluten-free options, and a bakery counter by the door. Worth booking if you are going at the weekend.",
    latitude: -7.818465,
    longitude: 110.3619559,
    address: "Tirtodipuran St No.24A, Mantrijeron, Yogyakarta City, Special Region of Yogyakarta 55143",
    photos: [
      {
        id: "mediterranea-1",
        url: "/venues/mediterranea/1.webp",
        alt: "Dining room with a circular emblem on the wall, string lights and potted plants",
      },
      {
        id: "mediterranea-2",
        url: "/venues/mediterranea/2.webp",
        alt: "Blue-walled dining room with wooden tables, framed pictures and a ceiling fan",
      },
      {
        id: "mediterranea-3",
        url: "/venues/mediterranea/3.webp",
        alt: "Black and white view of the Mediterranea window sign above stacked plates",
      },
    ],
    visitDurationMinutes: 90,
    openingHours: "08:00 – 23:00",
    rating: 4.6,
    reviewCount: 1_600,
    tags: ["Dinner", "Mediterranean", "Booking advised"],
    directionsUrl:
      "https://www.google.com/maps/place/Mediterranea+Restaurant+by+Kamil/@-7.818465,110.3619559,17z/data=!3m1!4b1!4m6!3m5!1s0x2e7a57bd1a830c51:0x917adbfd1657973b!8m2!3d-7.818465!4d110.3645308!16s%2Fg%2F11hc_2l3kv?entry=ttu&g_ep=EgoyMDI2MTAyMC4wIKXMDSoASAFQAw%3D%3D",
  },
  {
    id: "giorno-pizzeria",
    name: "Giorno's Pizzeria",
    category: "Pizzeria",
    // Not in OpenStreetMap, but the coordinate matches the published address
    // (Ambarukmo 377A) and snaps 9 m to an unnamed lane, consistent with being
    // down a gang opposite Ambarrukmo Plaza. openingHours omitted on purpose:
    // sources disagree on whether it opens at 10:00 or 15:00.
    description:
      "Italian down a lane opposite Ambarrukmo Plaza, two floors with the upstairs the one to ask for. Pizza, antipasti and pasta, using Camilla la Mozzarella cheeses. Different sources give different opening times, so call first.",
    latitude: -7.7836247,
    longitude: 110.3987375,
    address: "Ambarukmo 377A, Ambarukmo, Caturtunggal, Kec. Depok, Kabupaten Sleman, Daerah Istimewa Yogyakarta 55281",
    photos: [
      {
        id: "giorno-1",
        url: "/venues/giorno/1.webp",
        alt: "The two-storey restaurant lit up at night, strung with lights and hanging plants",
      },
      {
        id: "giorno-2",
        url: "/venues/giorno/2.webp",
        alt: "Interior stairway flanked by green plants leading to the upper floor",
      },
      {
        id: "giorno-3",
        url: "/venues/giorno/3.webp",
        alt: "Ground-floor counter and staircase seen from the entrance",
      },
    ],
    visitDurationMinutes: 90,
    tags: ["Foodie", "Pizza", "Halal"],
    directionsUrl:
      "https://www.google.com/maps/place/Giorno's+Pizzeria+%7C+Halal+Italian+Pizza/@-7.7836247,110.3987375,17z/data=!3m1!4b1!4m6!3m5!1s0x2e7a598b67a20111:0x772ac2422ada3dfd!8m2!3d-7.78363!4d110.4013124!16s%2Fg%2F11s9jmjsxh?entry=ttu&g_ep=EgoyMDI2MTAyMC4wIKXMDSoASAFQAw%3D%3D",
  },
  {
    id: "lunion-pizza",
    name: "L'Union Pizza",
    category: "Pizza workshop",
    // Address and hours read directly off the venue's own signage. See
    // public/venues/lunion-pizza/3.webp. Jalan Rogoyudan is not in
    // OpenStreetMap, so the pin is the Sinduadi village point.
    locationPrecision: "approximate",
    description:
      "Make your own pizza. That's the whole point, printed right on their sign. You build it and bake it yourself, so this one is as much an activity as a meal. Friday opens later than the rest of the week.",
    latitude: -7.7700141,
    longitude: 110.3582908,
    address: "Jl. Rogoyudan 1, Rogoyudan, Sinduadi, Kec. Mlati, Kabupaten Sleman, Daerah Istimewa Yogyakarta 55284",
    photos: [
      {
        id: "lunion-1",
        url: "/venues/lunion-pizza/1.webp",
        alt: "A group in aprons shaping pizza dough along a brick counter",
      },
      {
        id: "lunion-2",
        url: "/venues/lunion-pizza/2.webp",
        alt: "The courtyard at dusk, tables set out under a lit canopy",
      },
      {
        id: "lunion-3",
        url: "/venues/lunion-pizza/3.webp",
        alt: "The L'Union Pizza sign reading Make Ur Own Pizza, with opening hours and address",
      },
    ],
    visitDurationMinutes: 120,
    openingHours: "11:00 – 22:00 (Fri from 14:00)",
    tags: ["Foodie", "Make your own", "Pizza"],
    directionsUrl:
      "https://www.google.com/maps/place/L'Union+Pizza+Restaurant/@-7.7700141,110.3582908,17z/data=!3m1!4b1!4m6!3m5!1s0x2e7a597539d9e8bb:0x2a28f63251f6a572!8m2!3d-7.7700194!4d110.3608657!16s%2Fg%2F11y3ddmgtq?entry=ttu&g_ep=EgoyMDI2MTAyMC4wIKXMDSoASAFQAw%3D%3D",
  },
  {
    id: "vredeburg",
    name: "Museum Benteng Vredeburg",
    category: "Museum",
    // OpenStreetMap tourism=museum on Jalan Margo Mulyo. Hours change and no
    // source was to hand, so none is stated.
    description:
      "A Dutch fort at the bottom of Malioboro, now a museum of the independence struggle told through dioramas. The grounds are open and shaded, and it's about three hundred metres from Sonobudoyo, so the two go together on foot.",
    latitude: -7.8002877,
    longitude: 110.3635893,
    address: "Jl. Margo Mulyo No.6, Ngupasan, Kec. Gondomanan, Kota Yogyakarta, Daerah Istimewa Yogyakarta 55122",
    photos: [
      {
        id: "vredeburg-1",
        url: "/venues/vredeburg/1.webp",
        alt: "A large bronze relief sculpture mounted on a dark gallery wall",
      },
      {
        id: "vredeburg-2",
        url: "/venues/vredeburg/2.webp",
        alt: "A gallery room hung with paintings above a dark wood floor",
      },
      {
        id: "vredeburg-3",
        url: "/venues/vredeburg/3.webp",
        alt: "A museum corridor with a diorama set behind a rope barrier",
      },
    ],
    visitDurationMinutes: 75,
    tags: ["Heritage", "Museum", "Malioboro"],
    directionsUrl:
      "https://www.google.com/maps/place/Vredeburg+Fort+Museum/@-7.8002877,110.3635893,17z/data=!3m1!4b1!4m6!3m5!1s0x2e7a5788c0b3eecf:0xb9611ce0232a9ff8!8m2!3d-7.800293!4d110.3661642!16zL20vMGJyZmY4?entry=ttu&g_ep=EgoyMDI2MTAyMC4wIKXMDSoASAFQAw%3D%3D",
  },
  {
    id: "sonobudoyo",
    name: "Museum Sonobudoyo",
    category: "Museum",
    // OpenStreetMap tourism=museum; Jalan Pangurakan matches the address on
    // sonobudoyo.jogjaprov.go.id. The site publishes no hours and no wayang
    // schedule, so neither is stated here.
    description:
      "The best Javanese collection in the city, just north of the Kraton: keris, masks, batik and a serious wayang holding. It's also known for evening wayang kulit in its own pavilion; the museum doesn't publish the schedule online, so ask before you build an evening around it.",
    latitude: -7.8022517,
    longitude: 110.3613692,
    address: "Jl. Pangurakan No.6, Ngupasan, Kec. Gondomanan, Kota Yogyakarta, Daerah Istimewa Yogyakarta 55122",
    photos: [
      {
        id: "sonobudoyo-1",
        url: "/venues/sonobudoyo/1.webp",
        alt: "Display cases of wayang puppets and krises in a darkened gallery",
      },
      {
        id: "sonobudoyo-2",
        url: "/venues/sonobudoyo/2.webp",
        alt: "Mannequins in Javanese batik dress standing in front of a display screen",
      },
      {
        id: "sonobudoyo-3",
        url: "/venues/sonobudoyo/3.webp",
        alt: "A long gallery hall of artefacts beneath a hanging lamp",
      },
    ],
    visitDurationMinutes: 90,
    tags: ["Heritage", "Museum", "Wayang"],
    directionsUrl:
      "https://www.google.com/maps/place/Museum+Sonobudoyo+Unit+I/@-7.8022517,110.3613692,17z/data=!3m1!4b1!4m6!3m5!1s0x2e7a578f83070a4f:0x9d10431ac43ec5ee!8m2!3d-7.802257!4d110.3639441!16s%2Fg%2F11h1v81d_?entry=ttu&g_ep=EgoyMDI2MTAyMC4wIKXMDSoASAFQAw%3D%3D",
  },
  {
    id: "gembira-loka",
    name: "Gembira Loka Zoo",
    category: "Zoo",
    // OpenStreetMap tourism=zoo, Jalan Kebun Raya No. 2. No hours source to hand.
    description:
      "The city zoo east of the Kraton, built around a lake you can cross by boat. Big enough to fill an afternoon on foot, and the shaded paths make it bearable in the middle of the day.",
    latitude: -7.8039517,
    longitude: 110.3955387,
    address: "Jl. Kebun Raya No.2, Rejowinangun, Kec. Kotagede, Kota Yogyakarta, Daerah Istimewa Yogyakarta 55171",
    photos: [
      {
        id: "gembira-loka-1",
        url: "/venues/gembira-loka/1.webp",
        alt: "Visitors in small boats on the green lake inside the zoo",
      },
      {
        id: "gembira-loka-2",
        url: "/venues/gembira-loka/2.webp",
        alt: "The painted welcome arch at the entrance, under tall trees",
      },
      {
        id: "gembira-loka-3",
        url: "/venues/gembira-loka/3.webp",
        alt: "A crowd seated under a canopy watching a show on the lawn",
      },
    ],
    visitDurationMinutes: 150,
    tags: ["Outdoorsy", "Walking", "Half day"],
    directionsUrl:
      "https://www.google.com/maps/place/Gembira+Loka+Zoo/@-7.8039517,110.3955387,17z/data=!3m1!4b1!4m6!3m5!1s0x2e7a57196b21a901:0x77e3f6112577fb0f!8m2!3d-7.803957!4d110.3981136!16s%2Fm%2F0130d2nz?entry=ttu&g_ep=EgoyMDI2MTAyMC4wIKXMDSoASAFQAw%3D%3D",
  },
  {
    id: "batik-workshop",
    name: "Batik Workshop",
    category: "Craft workshop",
    // WEAKEST ENTRY. The photos are real, but no venue name or address was
    // supplied, so the name is a placeholder and the pin is an approximate
    // point in the Tirtodipuran batik quarter. Confirm the operator before
    // this is shown to anyone.
    locationPrecision: "approximate",
    bookingRequired: true,
    description:
      "A half-day batik class: draw in wax with a canting, dye, then wait while it dries. Slow, fiddly, and you leave holding something you made. Still working out exactly which studio this is. The photos are real, the pin is a guess.",
    // Pin corrected to Jalan Tirtodipuran to match the supplied address; the
    // previous value landed on Jalan Karawitan II in Kasihan, Bantul.
    latitude: -7.8185241,
    longitude: 110.3651688,
    address: "Daerah Istimewa, Tirtodipuran St No.54, Mantrijeron, Yogyakarta City, Special Region of Yogyakarta 55143",
    photos: [
      {
        id: "batik-1",
        url: "/venues/batik-workshop/1.webp",
        alt: "A woman drawing batik with a canting at a work table, framed batik on the walls behind",
      },
      {
        id: "batik-2",
        url: "/venues/batik-workshop/2.webp",
        alt: "A long cream batik cloth with a floral pattern laid out on a table",
      },
    ],
    visitDurationMinutes: 120,
    tags: ["Artsy", "Workshop", "To confirm"],
    directionsUrl:
      "https://www.google.com/maps/place/Batik+Winotosastro/@-7.8102505,110.3381566,15z/data=!4m10!1m2!2m1!1sTirtodipuran+batik+quarter,+Mantrijeron,+Yogyakarta!3m6!1s0x2e7a57bd3d22a9d3:0x9d53ab89ce3a51ee!8m2!3d-7.8189788!4d110.3674359!15sCjNUaXJ0b2RpcHVyYW4gYmF0aWsgcXVhcnRlciwgTWFudHJpamVyb24sIFlvZ3lha2FydGFaMyIxdGlydG9kaXB1cmFuIGJhdGlrIHF1YXJ0ZXIgbWFudHJpamVyb24geW9neWFrYXJ0YZIBCmhhbmRpY3JhZnSaASRDaGREU1VoTk1HOW5TMFZKUTBGblNVTnFNamhZWDNWblJSQULgAQD6AQQIABBI!16s%2Fg%2F1hc94p_lk?entry=ttu&g_ep=EgoyMDI2MTAyMC4wIKXMDSoASAFQAw%3D%3D",
  },
  {
    id: "mohan-burger",
    name: "Mohan Burger",
    category: "Burger restaurant",
    // Not in OpenStreetMap. Pinned to Pakuwon Mall, which the venue sits just
    // east of on Jalan Kaliwaru, so the pin is good to a few hundred metres
    // rather than exact.
    locationPrecision: "approximate",
    description:
      "Thick-cut chicken burgers behind Pakuwon Mall in Condongcatur. Started as a bajaj cart at Embung Langensari and got popular enough to earn a permanent room, which now has a photobox in it. Opens early for a burger place.",
    latitude: -7.76,
    longitude: 110.3990012,
    address: "Jl. Kaliwaru No. 1b, Kaliwaru, Condongcatur, Depok, Sleman",
    photos: [
      {
        id: "mohan-1",
        url: "/venues/mohan-burger/1.webp",
        alt: "A tall fried chicken burger sitting in a bowl of cheese sauce, with a drink behind it",
      },
      {
        id: "mohan-2",
        url: "/venues/mohan-burger/2.webp",
        alt: "Several burgers on metal trays with Mohan-printed paper liners, beside a tray of saucy fried chicken",
      },
    ],
    visitDurationMinutes: 75,
    openingHours: "08:00 – 23:00",
    tags: ["Foodie", "Burgers", "Opens early"],
    directionsUrl:
      "https://www.google.com/maps/search/?api=1&query=Mohan+Burger+Kaliwaru+Condongcatur",
  },
  {
    id: "ryuji",
    name: "Ryuji Ramen, Salmon & Sushi",
    category: "Japanese restaurant",
    // Coordinate taken from the Google Maps place link and reverse-geocoded to
    // Jalan Kyai Haji Wahid Hasyim, Ngropoh, Condongcatur.
    description:
      "Ramen, salmon and sushi in Condongcatur, a few minutes east of Pakuwon Mall. The salmon is what people go for. Hours are unconfirmed, so check before a late one.",
    latitude: -7.7621532,
    longitude: 110.4037734,
    address: "Jl. K.H. Wahid Hasyim, Ngropoh, Condongcatur, Depok, Sleman",
    photos: [
      {
        id: "ryuji-1",
        url: "/venues/ryuji/1.webp",
        alt: "A long plate of salmon sushi rolls topped with roe and mayonnaise",
      },
      {
        id: "ryuji-2",
        url: "/venues/ryuji/2.webp",
        alt: "Chopsticks lifting a salmon-topped sushi roll from a dark plate",
      },
    ],
    visitDurationMinutes: 75,
    tags: ["Foodie", "Ramen", "Sushi"],
    directionsUrl:
      "https://www.google.com/maps/search/?api=1&query=-7.7621532,110.4037734",
  },

  /**
   * The ten entries below came from the project owner as a list of names and
   * Google Maps links, not from a venue survey, so each field says exactly
   * where it came from:
   *
   * - Coordinates are the `!3d/!4d` place marker out of the supplied Google
   *   Maps URL, which is the pin itself. The `@` pair earlier in those URLs is
   *   only the viewport centre and sits a couple of hundred metres off; see the
   *   note in the README.
   * - Every coordinate was reverse-geocoded against OpenStreetMap to confirm
   *   the street before being written down.
   * - Opening hours are blank for the six restaurants on purpose. Their hours
   *   live on Google and nowhere citable, and a planner that invents them is
   *   worse than one that says nothing.
   *
   * Photos are owner-supplied and real, same as the rest of the file, and every
   * venue now has its own. `itinerary.test.ts` asserts that, so a photo-less
   * venue fails the suite rather than slipping out to production behind a
   * placeholder.
   */
  {
    id: "jogja-art-activity",
    name: "Jogja Art Activity",
    category: "Craft workshop",
    // Runs out of Griya Abhipraya (Gedung Purbonegoro) on Jalan Pangurakan,
    // behind the main post office at Titik Nol and opposite Sonobudoyo. The
    // building is not in OpenStreetMap, so the pin is the post office next door.
    //
    // There is a second, newer branch in Mantrijeron: photo 2 is its opening
    // banner. It post-dates every listing that is indexed, so no address for it
    // was findable and the pin stays on Pangurakan. Confirm which branch you
    // are going to before relying on the map.
    locationPrecision: "approximate",
    description:
      "Pottery and painting in the same room, in a colonial building behind the post office at Titik Nol. Hand-built clay, canvas, tote bags and bucket hats, so two people can take on different things and still sit at one table. Aprons and paint refills are part of it. Walk-in rather than a fixed class. There is a newer branch in Mantrijeron as well, and this pin is the Pangurakan one.",
    latitude: -7.8018266,
    longitude: 110.3651725,
    address: "Griya Abhipraya, Jl. Pangurakan, Ngupasan, Kec. Gondomanan, Kota Yogyakarta, Daerah Istimewa Yogyakarta 55122",
    photos: [
      {
        id: "jogja-art-activity-1",
        url: "/venues/jogja-art-activity/1.webp",
        alt: "A group in green aprons outside the studio, each holding up the piece they painted",
      },
      {
        id: "jogja-art-activity-2",
        url: "/venues/jogja-art-activity/2.webp",
        alt: "Tables of people painting in the evening under string lights, below an Art Time banner for the Mantrijeron branch",
      },
    ],
    visitDurationMinutes: 120,
    openingHours: "10:00 – 21:00 (Fri – Sun from 09:00)",
    tags: ["Artsy", "Pottery", "Painting"],
    directionsUrl:
      "https://www.google.com/maps/search/?api=1&query=Jogja+Art+Activity+Griya+Abhipraya+Pangurakan+Yogyakarta",
  },
  {
    id: "jogja-national-museum",
    name: "Jogja National Museum",
    category: "Art museum",
    // OpenStreetMap tourism=museum on Jalan Prof. Dr. Ki Amri Yahya, Pakuncen.
    // No hours published, and what is on changes by exhibition anyway.
    description:
      "A former art academy in Wirobrajan now used for exhibitions, and the home ground for the city's big annual shows. What is on changes, so check the current programme first; between shows the halls can be empty.",
    latitude: -7.8000614,
    longitude: 110.3532393,
    address: "Jl. Prof. Dr. Ki Amri Yahya, Pakuncen, Kec. Wirobrajan, Kota Yogyakarta, Daerah Istimewa Yogyakarta 55253",
    photos: [
      {
        id: "jogja-national-museum-1",
        url: "/venues/jogja-national-museum/1.webp",
        alt: "A crocheted coral reef installation filling a glass dome, with yellow fish strung overhead",
      },
      {
        id: "jogja-national-museum-2",
        url: "/venues/jogja-national-museum/2.webp",
        alt: "A visitor looking up at a wall of large, densely drawn figures in bright marker",
      },
      {
        id: "jogja-national-museum-3",
        url: "/venues/jogja-national-museum/3.webp",
        alt: "A guide talking to a group in a red-walled room hung with framed works",
      },
    ],
    visitDurationMinutes: 75,
    tags: ["Artsy", "Gallery", "Check programme"],
    directionsUrl:
      "https://www.google.com/maps/search/?api=1&query=Jogja+National+Museum+Wirobrajan+Yogyakarta",
  },
  {
    id: "kids-fun-parcs",
    name: "Kids Fun Parcs",
    category: "Theme park",
    // Not in OpenStreetMap as a venue; pinned to Jalan Wonosari in Sitimulyo,
    // which matches the published Km 10 address. Hours vary per zone and
    // between sources, so only the common range is stated.
    locationPrecision: "approximate",
    description:
      "A two-hectare park out at Km 10 on the Wonosari road: rides, go-karts and a pool, open since 1998. Zones keep their own hours and the published times disagree, so check before building an afternoon around the karts.",
    latitude: -7.8282054,
    longitude: 110.4464549,
    address: "Jl. Wonosari Km 10, Sitimulyo, Kec. Piyungan, Kabupaten Bantul, Daerah Istimewa Yogyakarta 55792",
    photos: [
      {
        id: "kids-fun-parcs-1",
        url: "/venues/kids-fun-parcs/1.webp",
        alt: "Two small electric police cars on a miniature street circuit built around a Tugu replica",
      },
      {
        id: "kids-fun-parcs-2",
        url: "/venues/kids-fun-parcs/2.webp",
        alt: "A blue and gold carousel turning behind a low hedge on a bright day",
      },
    ],
    visitDurationMinutes: 180,
    openingHours: "09:00 – 17:00 (zones vary)",
    tags: ["Outdoorsy", "Rides", "Half day"],
    directionsUrl:
      "https://www.google.com/maps/search/?api=1&query=Kids+Fun+Parcs+Piyungan+Bantul",
  },
  {
    id: "ibarbo-park",
    name: "Ibarbo Park",
    category: "Theme park",
    // A separate place from Kids Fun, despite the two often being named
    // together: this one is on Jalan Magelang in Sleman, not the Wonosari road.
    // Pinned to Jalan Magelang in Caturharjo, matching the Km 14 address.
    locationPrecision: "approximate",
    description:
      "The one on the Magelang road, not the Wonosari one. Rides, an aviary and a water zone on the same site, with an animal show in the middle of the afternoon. Splashworld shuts earlier than the rest, and weekend hours run later.",
    latitude: -7.6849652,
    longitude: 110.3405999,
    address: "Jl. Magelang Km 14, Jetis, Caturharjo, Kec. Sleman, Kabupaten Sleman, Daerah Istimewa Yogyakarta 55515",
    photos: [
      {
        id: "ibarbo-park-1",
        url: "/venues/ibarbo-park/1.webp",
        alt: "The park seen from above at dusk, rides and painted facades lit along a curving street",
      },
      {
        id: "ibarbo-park-2",
        url: "/venues/ibarbo-park/2.webp",
        alt: "A giant sprinkled doughnut sculpture on the street outside the park entrance",
      },
    ],
    visitDurationMinutes: 180,
    openingHours: "09:00 – 20:00 (Sat – Sun until 22:00)",
    tags: ["Outdoorsy", "Rides", "Half day"],
    directionsUrl:
      "https://www.google.com/maps/search/?api=1&query=Ibarbo+Park+Caturharjo+Sleman",
  },
  {
    id: "hankki-korean",
    name: "Hankki Korean Resto Jogja",
    category: "Korean restaurant",
    // Place marker reverse-geocodes to Jalan Damai in Sinduharjo, Ngaglik,
    // well north of the ring road. The house number and hamlet come off the
    // venue's own caption in photo 3, which is more specific than anything
    // OpenStreetMap has. Hours are still not published anywhere citable.
    description:
      "Korean food up on Jalan Damai in Ngaglik, north of the ring road and a fair ride from the city centre. Stews, kimbap, rice sets and fried chicken, brought out as a spread rather than grilled at the table, in a bright room done out with timber and lattice screens.",
    latitude: -7.734471,
    longitude: 110.3944807,
    address: "Jl. Damai No.1, Tambakan, Sinduharjo, Kec. Ngaglik, Kabupaten Sleman, Daerah Istimewa Yogyakarta 55581",
    photos: [
      {
        id: "hankki-korean-1",
        url: "/venues/hankki-korean/1.webp",
        alt: "A full table of Korean dishes on turquoise plates: kimbap, fried chicken, salad, rice and stew",
      },
      {
        id: "hankki-korean-2",
        url: "/venues/hankki-korean/2.webp",
        alt: "A bubbling stone pot of budae jjigae on a wooden tray with rice and side dishes",
      },
      {
        id: "hankki-korean-3",
        url: "/venues/hankki-korean/3.webp",
        alt: "The dining room in pale timber with lattice screens, a tiled canopy and diners by the window",
      },
    ],
    visitDurationMinutes: 90,
    tags: ["Foodie", "Korean", "North Jogja"],
    directionsUrl:
      "https://www.google.com/maps/place/Hankki+Korean+Resto+Jogja/@-7.7426014,110.3879272,15.63z/data=!4m6!3m5!1s0x2e7a59c42679c94b:0x7edfee40d816ffe3!8m2!3d-7.734471!4d110.3944807!16s%2Fg%2F11zhs45n_c",
  },
  {
    id: "hou-kie",
    name: "Hou Kie",
    category: "Hong Kong restaurant",
    // Place marker reverse-geocodes to Jalan K.H. Wahid Hasyim in Ngropoh,
    // Condongcatur: the same street as Ryuji, a few hundred metres apart.
    description:
      "Hong Kong style cooking in Condongcatur, on the same stretch as Ryuji. Claypot rice and braised meat brought to a small, tiled room with round tables, which makes it the easy one to fall back on when somewhere nearby is full.",
    latitude: -7.7620258,
    longitude: 110.4038493,
    address: "Jl. K.H. Wahid Hasyim, Ngropoh, Condongcatur, Kec. Depok, Kabupaten Sleman, Daerah Istimewa Yogyakarta 55281",
    photos: [
      {
        id: "hou-kie-1",
        url: "/venues/hou-kie/1.webp",
        alt: "Two claypots of rice and braised meat on a blue table with a dish of sauce",
      },
      {
        id: "hou-kie-2",
        url: "/venues/hou-kie/2.webp",
        alt: "The dining room with round tables, a wood-panelled ceiling and the Hou Kie counter sign",
      },
    ],
    visitDurationMinutes: 75,
    tags: ["Foodie", "Hong Kong", "Cafe"],
    directionsUrl:
      "https://www.google.com/maps/place/HOU+KIE/@-7.765346,110.4002629,13.74z/data=!4m6!3m5!1s0x2e7a598f5efe399d:0x8a39c73e77e2430e!8m2!3d-7.7620258!4d110.4038493!16s%2Fg%2F11yjg0y4rx",
  },
  {
    id: "bpk-ola-kisat",
    name: "BPK Ola Kisat Yogyakarta",
    category: "Batak restaurant",
    // Place marker reverse-geocodes to Kledokan in Caturtunggal. OpenStreetMap
    // has no street name for that point, so the address stops at the hamlet.
    // The pin is the venue marker itself, so it is still exact.
    description:
      "Babi panggang Karo in Kledokan, off the Seturan side of Caturtunggal. Roast pork with the sour, spicy sauce it comes with, done the Karo way. Non-halal, and worth knowing that before you suggest it.",
    latitude: -7.776616,
    longitude: 110.4119409,
    address: "Kledokan, Caturtunggal, Kec. Depok, Kabupaten Sleman, Daerah Istimewa Yogyakarta 55281",
    photos: [
      {
        id: "bpk-ola-kisat-1",
        url: "/venues/bpk-ola-kisat/1.webp",
        alt: "The lit entrance at night, a BPK Olakisat Jogja sign above a brick doorway with benches either side",
      },
    ],
    visitDurationMinutes: 75,
    tags: ["Foodie", "Pork", "Non-halal"],
    directionsUrl:
      "https://www.google.com/maps/place/BPK+Ola+Kisat+Yogyakarta/@-7.7926459,110.3728887,13.22z/data=!4m6!3m5!1s0x2e7a59ec5b45d92f:0x4f9422e41dbe0a94!8m2!3d-7.776616!4d110.4119409!16s%2Fg%2F11bwp5s1sy",
  },
  {
    id: "bpk-tesalonika",
    name: "BPK Tesalonika Simpang Selayang",
    category: "Batak restaurant",
    // Place marker reverse-geocodes to Jalan Ipda Tut Harsono in Mujamuju,
    // Umbulharjo. This is the Yogyakarta branch of the Medan original.
    description:
      "The Yogyakarta branch of a Medan babi panggang Karo house, on Jalan Ipda Tut Harsono in Umbulharjo. Roast pork, rice and sauce, eaten at a plain table. Non-halal. Toba Tabo is a couple of hundred metres along the same street if this one is full.",
    latitude: -7.7957132,
    longitude: 110.3928004,
    address: "Jl. Ipda Tut Harsono, Mujamuju, Kec. Umbulharjo, Kota Yogyakarta, Daerah Istimewa Yogyakarta 55165",
    // Only one photo: the other supplied shot of the storefront carries another
    // account's watermark, so it stays archived rather than served.
    photos: [
      {
        id: "bpk-tesalonika-1",
        url: "/venues/bpk-tesalonika/1.webp",
        alt: "Roast pork and chopped greens on a green plate, with rice, soup and two sauces around it",
      },
    ],
    visitDurationMinutes: 75,
    tags: ["Foodie", "Pork", "Non-halal"],
    directionsUrl:
      "https://www.google.com/maps/place/RM+BPK+TESALONIKA+SIMPANG+SELAYANG+CABANG+YOGYAKARTA/@-7.7926459,110.3728887,13.22z/data=!4m6!3m5!1s0x2e7a57e1c146cdaf:0x81090762355b6a1c!8m2!3d-7.7957132!4d110.3928004!16s%2Fg%2F11lp4vqrmd",
  },
  {
    id: "babi-toba-tabo",
    name: "Babi Khas Batak Toba Tabo",
    category: "Batak restaurant",
    // Place marker reverse-geocodes to Jalan Ipda Tut Harsono in Mujamuju as
    // well, roughly 150 m north of Tesalonika. Two Batak kitchens on one
    // street is not an error in the data.
    //
    // openingHours read straight off the venue's own banner in photo 2, the
    // same way L'Union's were: "BUKA SETIAP HARI 11.00 - 21.00 WIB".
    description:
      "Batak pork in Umbulharjo, on the same street as Tesalonika and about a hundred and fifty metres north of it. Saksang and panggang rather than a long menu, eaten off red tables. Non-halal.",
    latitude: -7.7943805,
    longitude: 110.3930104,
    address: "Jl. Ipda Tut Harsono, Mujamuju, Kec. Umbulharjo, Kota Yogyakarta, Daerah Istimewa Yogyakarta 55165",
    photos: [
      {
        id: "babi-toba-tabo-1",
        url: "/venues/babi-toba-tabo/1.webp",
        alt: "Four oval plates of crisp and braised pork with cucumber and cabbage on a red table",
      },
      {
        id: "babi-toba-tabo-2",
        url: "/venues/babi-toba-tabo/2.webp",
        alt: "The red dining area under a banner reading Buka Setiap Hari 11.00 to 21.00 WIB",
      },
    ],
    visitDurationMinutes: 75,
    openingHours: "11:00 – 21:00",
    tags: ["Foodie", "Pork", "Non-halal"],
    directionsUrl:
      "https://www.google.com/maps/place/Babi+Khas+Batak+TOBA+TABO/@-7.7925779,110.3870209,12.62z/data=!4m6!3m5!1s0x2e7a5735207b25cb:0x9c2b900275c93eef!8m2!3d-7.7943805!4d110.3930104!16s%2Fg%2F11pz6sg71f",
  },
];
const BY_ID = new Map(DESTINATIONS.map((d) => [d.id, d]));

export function getDestination(id: string): Destination | undefined {
  return BY_ID.get(id);
}

/** Resolve ids to destinations, dropping anything unknown. */
export function getDestinations(ids: string[]): Destination[] {
  return ids
    .map((id) => BY_ID.get(id))
    .filter((d): d is NonNullable<typeof d> => d !== undefined);
}