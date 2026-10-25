# Rute

A hangout-planning prototype for Yogyakarta: browse ready-made plans, inspect each
stop's photos and details, see the route on an interactive map, and customise the
itinerary while duration and travel time recalculate.

Deliberately carries **no pricing**, because a plan should not read like a quote.
The copy is kept friendly rather than romantic: these are afternoons out, not dates.

Built with Next.js 16 (App Router), TypeScript, Tailwind CSS v4, MapLibre GL and
lucide-react. No database, no auth, no backend.

## Getting started

```bash
npm install
npm run dev     # http://localhost:3000
```

```bash
npm test        # unit tests for the itinerary calculations and sample data
npm run lint
npm run typecheck
npm run build
```

## Environment variables

Everything runs with no configuration. Both variables below are optional
overrides, and no API keys are required or committed.

| Variable | Default | Why you would set it |
| --- | --- | --- |
| `NEXT_PUBLIC_ROUTING_URL` | `https://router.project-osrm.org` | Point at your own OSRM instance. The public demo server is rate-limited and has no uptime guarantee. |
| `NEXT_PUBLIC_MAP_STYLE_URL` | `https://tiles.openfreemap.org/styles/liberty` | Use another OpenFreeMap style (`bright`, `positron`) or a self-hosted style JSON. |

All venue photos are local, so `images.remotePatterns` is intentionally unset.

## How the map and routing work

The brief allows Mapbox or Google Maps "if the project supports the necessary API
configuration". Both require a key, so this prototype uses the keyless stack
instead and keeps the provider behind one module:

- **Map:** MapLibre GL rendering [OpenFreeMap](https://openfreemap.org) vector
  tiles: free, keyless, no signup, no usage limits. The warm, desaturated palette
  from the design is a CSS filter on `.maplibregl-canvas`. Because the basemap is
  a canvas and the pins are DOM markers, that filter never touches pin, route or
  popup colour.
- **Routing:** `src/lib/routing.ts` is the only file that knows who computes
  routes. It calls OSRM for real road geometry and real driving durations, then
  degrades in two steps: a distance-based estimate (tagged `estimated`), and
  finally `unavailable`. Swap providers by replacing `routeViaProvider`;
  everything else consumes the `RouteResult` type.

Nothing fabricates a number it does not have. A leg with no answer renders as
"Travel time unavailable", and totals say so rather than quietly summing to a
wrong figure.

## Venue data

**Every venue and every photo is real.** Photos were supplied by the project
owner. Originals live in `design/assets/<folder>/`; the app serves WebP from
`public/venues/<slug>/` (50 MB of PNG → 5.2 MB). There is no stock imagery and
there are no invented venues.

Nine further venues came from the owner as a list of names and Google Maps
links: Jogja Art Activity, Jogja National Museum, Kids Fun Parcs, Ibarbo Park,
Hankki, Hou Kie, BPK Ola Kisat, BPK Tesalonika and Toba Tabo.

Every one of them has its own photos, and `itinerary.test.ts` asserts that no
venue is left on the placeholder, so a photo-less venue fails the suite instead
of reaching production unnoticed. One supplied photo is archived rather than
served: `design/assets/bpk_tesalonika/image.png` carries another account's
watermark, so `GROUPS` deliberately skips it.

Coordinates for those came out of the `!3d`/`!4d` pair in the supplied Google
Maps URL, and each was reverse-geocoded against OpenStreetMap to confirm the
street before being written down. **Use that pair, not the `@` one.** The `@`
value is the map viewport centre, which Google offsets from the pin: taking it
puts Nanamia's marker on Jalan Affandi, about 285 m from Jalan Moses Gatotkaca
where the restaurant actually is. Several of the original ten carry that error.

Four of those restaurants deliberately have no `openingHours` (Hankki, Hou Kie,
Ola Kisat, Tesalonika). Their hours are on Google and nowhere citable, and the
rule here is to leave a field blank rather than guess it.

After adding or replacing photos, rebuild the served copies:

```bash
python3 scripts/convert-venue-assets.py   # needs Pillow
```

`GROUPS` in that script is the single place that maps a source folder to a
destination id and fixes the photo order (photo 1 is the card cover). Folders it
does not list are ignored, which is how removed venues stay out of `public/`
while their originals stay archived.

Verification status per field:

- **Coordinates:** from OpenStreetMap where the venue is mapped, each checked
  against the routable road network. Six venues carry
  `locationPrecision: "approximate"`, which the detail panel displays: L'Union
  Pizza, the batik workshop, Mohan Burger and Jogja Art Activity are not in
  OpenStreetMap, so their pins are village- or street-level; Kids Fun Parcs and
  Ibarbo Park are only pinned to the road their kilometre-marker address names.
- **Opening hours:** only where a source publishes them. Giorno's, Sonobudoyo,
  Vredeburg, Gembira Loka and four of the new restaurants are deliberately
  blank. Two venues' hours were read off their own signage in a supplied photo:
  L'Union (`public/venues/lunion-pizza/3.webp`) and Toba Tabo
  (`public/venues/babi-toba-tabo/2.webp`).
- **`batik-workshop` is the weakest entry.** The photos are real but no venue
  name or address was supplied, so the name is a placeholder and the pin is an
  approximate point in the Tirtodipuran batik quarter. Confirm the operator
  before showing this to anyone.

## Plans you make

Alongside the nine that ship in `plans.ts`, you can build your own. They live in
`localStorage` under `dateroute:myplans`, in this browser only.

- **Make your own** on Discover asks for a title, a start time and a mood, then
  drops you on an empty plan where the existing stop picker does the rest.
- **Save as my plan** on any built-in plan snapshots the stops currently on
  screen, including edits you just made, into a plan of your own. The built-in
  is never modified; its edits stay per-session, as before.
- **Your plans** appear in the Discover grid with a `Yours` chip, obey the mood
  and time filters, and persist their stop edits as you make them.
- **Built-in plans can be hidden, not deleted.** They ship in the repo, so
  "delete" would be a lie. Hidden ones come back from `Show n hidden`.

Saved plans store ids and a title, never a copy of the venue. The cover photo,
the summary line and the stop list are derived from `destinations.ts` at render
time, so a venue that gains a photo updates inside saved plans too. Ids are
prefixed `mine-` and cannot collide with a built-in, which `myPlans.test.ts`
asserts. An id that no longer resolves is skipped rather than thrown.

`/mine?id=…` is a query parameter rather than `/mine/[id]` because the server
cannot know these ids: `/plan/[id]` is statically generated with
`dynamicParams: false`. One static route plus a parameter keeps the site static.

## Structure

```
src/
  app/
    page.tsx              Discover (hero, mood picker, filters, package grid)
    plan/[id]/page.tsx    Package details + itinerary + map
    mine/page.tsx         A plan you made, by ?id= (localStorage)
    saved/page.tsx        Saved destinations (localStorage)
  components/
    PlanCard              InteractiveMap      DestinationGallery
    DiscoverClient        MapPinPreview       DestinationDetailModal
    ItineraryPanel        PlanSummary         PhotoLightbox
    ItineraryStop         AddStopDialog       SafeImage
    PlanClient            SiteHeader          SavedClient
    BuiltInPlan           MyPlanClient        CreatePlanDialog
  data/                   destinations.ts, plans.ts
  lib/
    types.ts              Destination, DatePackage, TravelLeg, ItineraryStop
    itinerary.ts          Scheduling, totals, reordering
    routing.ts            Routing provider boundary + fallbacks
    format.ts             Rupiah, durations, clock times
    useFavorites.ts       localStorage-backed favourites
```

`PlanClient` owns a single `selectedId`. The map, the itinerary panel and the
detail modal all read from it, so there is no second selection state to drift.

Modals use the native `<dialog>` element, which supplies Escape-to-close, the top
layer and focus containment without a focus-trap dependency.

## Known limitations

- Favourites live in `localStorage`; there is no account system.
- Edits to a built-in plan are per-session; "Save as my plan" is how you keep
  one. Edits to a plan you made persist as you go.
- Plans you make and the plans you hide live in `localStorage`, so they are per
  browser: no sync between devices, and clearing site data removes them.
- Reordering uses explicit up/down controls rather than drag-and-drop, which is
  keyboard accessible and needs no drag library.
- The route polyline follows real roads only while the router answers; the
  distance-based fallback draws a dashed straight line so it never implies a road
  that was not routed.
- Opening hours are not checked against a stop's scheduled arrival time.
- Non-walking legs show a bare duration (`10 min · 7.4 km`) rather than naming a
  mode. The number comes from OSRM's driving profile, which is close enough for
  a motorbike or a ride-hail and optimistic for a bicycle; the summary footer
  says so. Nothing in the UI assumes you own a car.
- Walking legs are an estimate, not a routed footpath: OSRM's public demo only
  hosts the driving profile (asking it for `/foot` silently returns the road
  route), so any hop under 1.2 km straight-line is converted to a walk locally
  and labelled `est.`. The polyline drawn on the map is still the road geometry,
  so a short walk shows a road-shaped detour.
- No pricing anywhere, by design.
- Six venues have approximate pins, so travel times to them are approximate
  too. They are flagged in the UI.
- Five plans were added once the newer venues landed, so there are nine. Hou Kie
  is the only new venue not used by one, and is reachable by editing an
  itinerary.
- Jogja Art Activity has a second, newer branch in Mantrijeron. The pin is the
  Pangurakan one; no address for the other was findable.
- Eight of the original ten pins were taken from the `@` viewport value in a
  Google Maps URL rather than the `!3d`/`!4d` place marker, which puts every one
  of them about 284 m west of the real venue. Not yet corrected. Reproduce with
  a diff of each entry's `latitude`/`longitude` against the `!3d`/`!4d` pair in
  its own `directionsUrl`.
- `bookingRequired` is displayed as a chip but still does not affect scheduling.
- Giorno's Pizzeria and Hou Kie are in the venue pool but not in any plan.
- Workshops (batik, silver, pottery) actually run on **fixed session times**, but
  the scheduler still treats every stop as drop-in. It will happily schedule a
  14:40 arrival at a 14:00 class. Needs `sessionTimes` on `Destination` and
  snap-to-next-session in `buildItinerary`; for now the constraint is only stated
  in each description.
# map-date
