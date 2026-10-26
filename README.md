# Jalan-Jalan

A hangout-planning prototype for Yogyakarta: browse ready-made plans, search
OpenStreetMap for anywhere else you want to go, see the route on an interactive
map, and customise the itinerary while duration and travel time recalculate.

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
| `NEXT_PUBLIC_PHOTON_URL` | `https://photon.komoot.io/api` | Point at your own Photon instance. Backs the place search box. |
| `NEXT_PUBLIC_OVERPASS_URL` | `https://overpass-api.de/api/interpreter` | Point at your own Overpass instance. Resolves OSM ids arriving in a shared link. |

The app renders no images at all, so `next/image` is unused and the `images`
config is intentionally absent. See **Venue data** for why.

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

## Adding places: live search

The twenty venues in `destinations.ts` are a hand-written seed, not the whole
catalogue. Anything else is searched out of OpenStreetMap from the **Add a
stop** dialog, so adding a place never means editing code.

`src/lib/places.ts` is the only file that knows who supplies places, and it uses
two keyless, CORS-enabled services:

- **Photon** (`searchPlaces`) answers free-text search with ranked fuzzy
  matches. Name, coordinates and an address; nothing else.
- **Overpass** (`lookupPlaces`) answers "what is OSM object N/W/R 123?". That is
  how a plan arriving in a share link resolves stops this browser never saw, and
  it returns the full tag set, so opening hours come along for free.

Searched places get an id like `osm:N:4239111222`, prefixed so it can never
collide with a built-in slug, and are cached whole in `localStorage` under
`jalanjalan:places`. `getDestination` is the single seam: built-ins first, then
that cache. Every other call site was untouched by the feature.

Two fields no provider publishes are filled locally and marked as guesses:
`visitDurationMinutes` comes from a per-category table, and `description` says
only what the tags already say. The duration is editable — see below, because
every arrival time in a plan is built on it. Results are filtered before display — a city, a
street, and street furniture like the four park benches named "Bangku Taman"
are not places you spend an hour.

Swap in Google or Foursquare by replacing those two functions. Everything
downstream consumes `Destination`.

## Venue data

**Every venue is real; none are invented.** The twenty in `destinations.ts`
came from the project owner, nine of them as a list of names and Google Maps
links: Jogja Art Activity, Jogja National Museum, Kids Fun Parcs, Ibarbo Park,
Hankki, Hou Kie, BPK Ola Kisat, BPK Tesalonika and Toba Tabo.

**There are no photos, anywhere, by design.** The owner supplied real venue
photos and the app used to serve them from `public/venues/`. They were removed
when live search landed: OpenStreetMap has no venue imagery worth the name, so
keeping them meant two classes of venue, with everything you added yourself
looking broken beside the seed data. An Overpass survey of 934 named Jogja POIs
found an image tag on 13 of them — 0.7% of restaurants, 0.6% of cafés, and none
at all on bars, parks or attractions. Wikidata/Wikimedia Commons resolves
properly for the few that have it, which is not enough to build a UI on.

Places show a category icon instead (`CategoryIcon`), matched by regex from the
category string so a hand-written venue and something found seconds ago render
identically. The tile is tinted per category family — a coffee tile is amber, a
park green, a museum stone — because one flat tint for everything made a page of
search results read as a column of photos that had failed to load.
`itinerary.test.ts` asserts no photo field or `.webp` path ever comes back.

The boxes the photos used to fill — the card cover, the plan header, the home
hero — tile those same icons instead (`CategoryPattern`), derived from the
plan's own stops. A few icons centred in a photo-shaped box left most of the
box empty, which reads as a failed image; a tile has no middle.

The original PNGs are still in `design/assets/<folder>/`, unused by the app and
not shipped. The served WebP copies and the Pillow script that produced them
are in git history as of `Free choose POIs`.

Coordinates came out of the `!3d`/`!4d` pair in the supplied Google
Maps URL, and each was reverse-geocoded against OpenStreetMap to confirm the
street before being written down. **Use that pair, not the `@` one.** The `@`
value is the map viewport centre, which Google offsets from the pin: taking it
puts Nanamia's marker on Jalan Affandi, about 285 m from Jalan Moses Gatotkaca
where the restaurant actually is. Several of the original ten carry that error.

Four of those restaurants deliberately have no `openingHours` (Hankki, Hou Kie,
Ola Kisat, Tesalonika). Their hours are on Google and nowhere citable, and the
rule here is to leave a field blank rather than guess it.

Verification status per field:

- **Coordinates:** from OpenStreetMap where the venue is mapped, each checked
  against the routable road network. Six venues carry
  `locationPrecision: "approximate"`, which the detail panel displays: L'Union
  Pizza, the batik workshop, Mohan Burger and Jogja Art Activity are not in
  OpenStreetMap, so their pins are village- or street-level; Kids Fun Parcs and
  Ibarbo Park are only pinned to the road their kilometre-marker address names.
- **Opening hours:** only where a source publishes them. Giorno's, Sonobudoyo,
  Vredeburg, Gembira Loka and four of the new restaurants are deliberately
  blank. Two venues' hours were read off their own signage in a photo the owner
  supplied: L'Union and Toba Tabo. The images are gone; the hours they gave are
  still the best source there is for those two.
- **`batik-workshop` is the weakest entry.** No venue name or address was
  supplied, so the name is a placeholder and the pin is an approximate point in
  the Tirtodipuran batik quarter. Confirm the operator before showing this to
  anyone.

## How long you stay somewhere

`visitDurationMinutes` is the number the whole itinerary hangs off, and it is
the weakest field in the record: no source publishes it. For the twenty
built-ins it is a considered figure; for a searched place it is a lookup on the
category, which is how Prambanan Temple arrives as one hour.

So it has a knob on it. **How long to stay** in the detail panel is a native
`<select>`, and changing it reschedules every stop after it, the totals and the
duration band. Overrides live in `localStorage` under `jalanjalan:durations`,
keyed by place id, kept apart from the places themselves so they survive
clearing the place cache and apply to built-in and searched venues alike.
Choosing the published figure deletes the key rather than storing a value equal
to the default, so "has anyone had an opinion here" stays answerable.

They are applied in `PlanClient` rather than inside `getDestination`: the
Discover grid renders on the server, where `localStorage` does not exist, and a
card claiming a different length to the page it opens would be a hydration
mismatch. Editing a duration is something you do on the plan page.

A shared link carries the sender's duration for the places it carries, so a
plan that says five hours still says five hours when it arrives. An override on
a *built-in* venue does not travel, because built-ins are resolved from the
reader's own repo copy.

## Plans you make

Alongside the four that ship in `plans.ts`, you can build your own. They live in
`localStorage` under `jalanjalan:myplans`, in this browser only. The app was
called `dateroute` before, so both stores still read the old key when the new
one is empty: renaming should not throw away what someone already saved.

- **Make your own** on Discover asks for a title, a start time and a mood, then
  drops you on an empty plan where the existing stop picker does the rest.
- **Save as my plan** on any built-in plan snapshots the stops currently on
  screen, including edits you just made, into a plan of your own. The built-in
  is never modified; its edits stay per-session, as before.
- **Your plans** appear in the Discover grid with a `Yours` chip, obey the mood
  and time filters, and persist their stop edits as you make them.
- **Built-in plans can be hidden, not deleted.** They ship in the repo, so
  "delete" would be a lie. Hidden ones come back from `Show n hidden`.

Saved plans store ids and a title, never a copy of the venue. The summary line
and the stop list are derived at render time, so a venue that is renamed updates
inside saved plans too. Places you searched for are the exception: they have no
repo entry to derive from, so `jalanjalan:places` caches the whole record. Ids are
prefixed `mine-` and cannot collide with a built-in, which `myPlans.test.ts`
asserts. An id that no longer resolves is skipped rather than thrown.

`/mine?id=…` is a query parameter rather than `/mine/[id]` because the server
cannot know these ids: `/plan/[id]` is statically generated with
`dynamicParams: false`. One static route plus a parameter keeps the site static.

## Sharing a plan

**Share** on any plan page sends the whole plan inside the link, as
`/mine?plan=<token>`: base64url of `{t, m, s, d, p}` — title, mood, start time,
stop ids, and records for the stops the reader cannot look up. No backend, no
accounts, no link that expires, and nothing of yours is uploaded anywhere. It
shares the stops **currently on screen**, so a built-in plan you just tweaked
can be passed on without saving it first.

That `p` payload is the difference between a link that opens and one that
hangs. A built-in id resolves from the repo, but a searched one resolves only
through Overpass, which answers in 10 to 20 seconds under load and was
returning `502` while this was being tested. Carrying name, category,
coordinates, duration and hours costs about 110 bytes per stop — a four-stop
plan with one searched place is a 359-character URL — and the plan then renders
immediately, offline, with no lookup at all.

Links shared before `p` existed carry only ids and still work: they fall back
to the Overpass lookup, and a stop that cannot be resolved is named in a notice
rather than silently dropped.

The button tries the native share sheet (the realistic case is one person
sending to one person from a phone), falls back to the clipboard, and finally to
a prompt holding the raw URL. A share button that silently does nothing is
worse than an ugly one.

Whoever opens the link sees the plan with a `Shared with you` chip and a **Save
to my plans** button. The plan is not saved until they press it. The place
records it carries are written to the `jalanjalan:places` cache on arrival,
which is what lets the stops render at all; caching a place is not saving a
plan.

`decodePlan` treats the token as untrusted input, because it is: wrong shape,
unknown mood, malformed time or a non-string id all return null and the page
says the link did not work, rather than rendering half a plan. Both the stop
list and the carried records are capped at 25.

Carried records get the same treatment in `fromSharedPlace`, and the two fields
that could do harm are never read from the token at all: `directionsUrl` is
rebuilt from the validated coordinates, so a crafted link cannot aim **Open in
Maps** at a site of its choosing, and `description` is derived from the
category rather than carried as free text. A malformed record is dropped on its
own instead of failing the whole link. `myPlans.test.ts` covers the round trip,
non-ASCII titles, URL safety, backwards compatibility and each rejection.

## Structure

```
src/
  app/
    page.tsx              Discover (hero, mood picker, filters, package grid)
    plan/[id]/page.tsx    Package details + itinerary + map
    mine/page.tsx         A plan you made, by ?id= (localStorage)
    saved/page.tsx        Saved destinations (localStorage)
  components/
    PlanCard              InteractiveMap      CategoryIcon
    DiscoverClient        MapPinPreview       DestinationDetailModal
    ItineraryPanel        PlanSummary         SavedClient
    ItineraryStop         AddStopDialog       CreatePlanDialog
    PlanClient            SiteHeader          ShareButton
    BuiltInPlan           MyPlanClient
  data/                   destinations.ts, plans.ts
  lib/
    types.ts              Destination, Plan, TravelLeg, ItineraryStop
    itinerary.ts          Scheduling, totals, reordering
    routing.ts            Routing provider boundary + fallbacks
    places.ts             Place provider boundary (Photon + Overpass)
    customPlaces.ts       Cache of places found through search
    localStore.ts         localStorage as an external store (React-free)
    useLocalStore.ts      The React binding for it
    format.ts             Durations, distances, clock times
    useFavorites.ts       localStorage-backed favourites
```

`localStore.ts` is deliberately React-free so `destinations.ts` can read the
searched-place cache during server render and `getDestination` can stay
synchronous. Importing `useSyncExternalStore` there would put a client-only
hook in the server graph and break the build, which is why the hook lives in
its own module.

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
- There are four plans, grouped by what you feel like doing rather than by
  mood. Stop order inside each is geographic, not the order the owner listed
  them in, so a plan does not cross the city twice.
- Jogja Art Activity has a second, newer branch in Mantrijeron. The pin is the
  Pangurakan one; no address for the other was findable.
- Eight of the original ten pins were taken from the `@` viewport value in a
  Google Maps URL rather than the `!3d`/`!4d` place marker, which puts every one
  of them about 284 m west of the real venue. Not yet corrected. Reproduce with
  a diff of each entry's `latitude`/`longitude` against the `!3d`/`!4d` pair in
  its own `directionsUrl`.
- `bookingRequired` is displayed as a chip but still does not affect scheduling.
- Searched places carry no photo, no written description and often no address:
  only what OpenStreetMap tags happen to hold. The detail panel says "Not
  listed anywhere" rather than leaving a field blank.
- `visitDurationMinutes` for a searched place starts as a per-category guess
  (`VISIT_MINUTES` in `places.ts`), so Prambanan Temple arrives as one hour
  until someone corrects it. Overrides are per browser and per place, not per
  plan: the same venue in two plans gets the same figure.
- Search ranking is biased toward Jogja by a hardcoded `SEARCH_CENTER`, even
  though the dialog will happily find somewhere in another country.
- Neither Photon nor Overpass is retried or backed off, and repeated searches
  are not cached. Both public endpoints are rate-limited with no uptime
  guarantee; point the env vars at your own instances for anything real.
- Overpass answers in 10–20 seconds under load, and returns `502` often enough
  to have done so during testing. Links now carry their own place records, so
  only ones shared before that change still wait on it.
- Six venues sit in the pool without being in a plan, reachable by editing an
  itinerary: L'Union, Ryuji, the batik workshop, Jogja Art Activity, Kids Fun
  Parcs and Ibarbo Park.
- Workshops (batik, silver, pottery) actually run on **fixed session times**, but
  the scheduler still treats every stop as drop-in. It will happily schedule a
  14:40 arrival at a 14:00 class. Needs `sessionTimes` on `Destination` and
  snap-to-next-session in `buildItinerary`; for now the constraint is only stated
  in each description.
