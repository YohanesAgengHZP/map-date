# Jalan-Jalan — UI/UX, Accessibility & QA Audit

Audited 2026-10-30 against `next dev` on `http://localhost:3000`, branch
`Feat-3/ux-accessibility-pass` at `e5fc063`. No application code was changed.

## A. Executive summary

**What it is.** A keyless hangout planner for Yogyakarta. Four ready-made
afternoons ship in the repo; a visitor can open one, see it scheduled against a
clock with travel times and a map, reorder or remove stops, search
OpenStreetMap for anywhere else, build a plan of their own, and pass the whole
thing to someone else inside a URL. No account, no backend, no pricing.
Everything personal lives in `localStorage`.

**Scope assessed.** All four routes (`/`, `/plan/[id]`, `/mine`, `/saved`),
the 404, all three dialogs, both empty states, the two provider-failure states,
five viewports from 320 px to 1440 px, and keyboard-only operation.

**Overall score: 8.3 / 10 — Good with Improvements.**

No P0 and no P1. Every critical journey completed end to end with no dead end
and no data loss. The issues below are real but none of them block a task.

**Three strongest aspects**

1. *It never lies about a number.* Routing falls back from OSRM to a
   distance estimate to nothing, and the footer says which one you are looking
   at ("We could not check the roads just now, so these travel times are rough
   guesses from the distance alone"). Blocking the router produced exactly that
   copy, not a silent wrong figure (T-21).
2. *Recovery is designed in.* Removing a stop leaves an Undo that takes
   keyboard focus (T-12). Deleting asks twice and cancels on blur (T-27).
   Hiding every plan offers "Show them all again", not a filter reset that
   would do nothing (T-29). A broken share link, a missing plan id and an
   unknown URL each get a different, plain-language explanation (T-23/24/25).
3. *Responsive and keyboard work is already done.* No horizontal scroll at any
   width from 320 px up, including at a 200 %-zoom-equivalent viewport.
   Every one of 99 interactive elements across five routes has an accessible
   name. Escape closes every dialog and returns focus to the control that
   opened it.

**Three most important problems**

1. **P2-1** The search sheet's live region tells a screen-reader user to
   "Type the name of anywhere you want to go" at the exact moment seven results
   appear on screen. Results arriving are never announced.
2. **P2-2** When the search provider is down, the status line says
   "Could not search just now" while the result area says "Nothing found for
   *zzzqqq*". Two answers to one question; the louder one blames the user's
   query for a network failure.
3. **P2-3** The focus ring inside the dark plan header measures 1.98:1 against
   its own background — below the 3:1 of WCAG 2.4.11. Four controls, including
   **Share** and **Delete this plan**, are hard to locate by keyboard.

**Key testing limitations**

- Chromium 140 headless only. **Safari and Firefox were not tested.**
- **No screen reader was run.** NVDA/VoiceOver findings below are inferences
  from the accessibility tree, and are labelled as such.
- **axe-core was unavailable** (no network access to fetch it). Automated
  checks are hand-written: colour contrast computed from resolved styles,
  accessible-name resolution, target size, heading order, landmark presence,
  duplicate ids. This is narrower than axe.
- Text contrast was computed only where a solid background could be resolved.
  Text over the hero gradients is reported separately and was checked by hand.
- **Non-text contrast (1.4.11)** was read from the design tokens, not measured
  per component.
- No real touch device: pointer behaviour at 390 px is emulated.

## B. Scorecard

| Category | Weight | Score | Evidence | Justification |
|---|---:|---:|---|---|
| Core task completion and usability | 25 % | 9 | J1–J4 all completed; T-01…T-16 | Every journey finished first time with no dead ends. Undo, two-tap delete and reversible hide make mistakes cheap. Deductions: an empty plan's card claims "under an hour"; an empty title silently becomes "My plan". |
| Accessibility | 20 % | 7 | T-30…T-40 | Strong base: 0 unnamed controls, logical tab order, focus returns on close, reduced motion honoured, reflow clean, 0 computed text-contrast failures. Against that: a confirmed 2.4.11 focus-contrast failure, a confirmed 4.1.3 status-message failure, and an `aria-label` that hides a stop's own warning from Tab users. Untested with assistive tech. |
| Functional reliability | 20 % | 9 | T-01…T-29 | Nothing broke. Routing, search, share round-trip, persistence across reload, double-submit, 200-character input, provider outages all behaved. One wrong claim on an empty card, one contradictory pair of messages. |
| Clarity and ease of understanding | 15 % | 8 | T-05, T-17…T-25 | Copy is unusually plain and honest — "They're shut by then", "Rough pin. This one is not mapped exactly". Deductions: the contradictory search failure, "Itinerary" vs "The plan" for the same thing, and a summary reading "Batak restaurant → Batak restaurant → Batak restaurant". |
| Navigation and information architecture | 10 % | 8 | T-03, T-26, T-41 | Two nav items, a back link on every deep page, consistent patterns. No current-page marker (`aria-current` absent) and no skip link. |
| Visual hierarchy and consistency | 5 % | 8 | screenshots `home-desktop`, `plan-desktop` | Clear type scale, one primary action per screen, per-category card tints aid scanning. Cards in one row take different heights, so the arrows sit on three different baselines. |
| Responsive experience | 5 % | 9 | T-42…T-47 | No horizontal scroll 320→1440 or at 720 px (200 % zoom). Mobile view toggle works, sheets fit inside the viewport at every width. |

**Overall = 9(.25) + 7(.20) + 9(.20) + 8(.15) + 8(.10) + 8(.05) + 9(.05) = 8.30**

**Issue counts:** P0 **0** · P1 **0** · P2 **4** · P3 **12**

**Test counts:** 47 executed — **43 PASS**, **4 FAIL**, 0 BLOCKED.
Not tested: cross-browser (Safari/Firefox), screen-reader behaviour, real touch
hardware, non-text contrast per component, `bookingRequired` scheduling effect.

**Critical journeys completed:** 4 of 4.

**Confidence:** High for functional behaviour and keyboard operation —
everything was driven in a real browser. Medium for accessibility, because no
assistive technology and no axe-core run backs it up.

## C. QA results

| ID | Scenario | Expected | Actual | Status | Sev | Evidence |
|---|---|---|---|---|---|---|
| T-01 | `npm test` | Suite passes | 94 tests, 6 files, all pass | PASS | — | vitest run |
| T-02 | `tsc --noEmit`, `eslint` | Clean | Both clean | PASS | — | npm scripts |
| T-03 | Nav to `/`, `/plan/[id]`, `/saved`, `/mine`, 404 | All reachable | All render; `/plan/nope` returns HTTP 404 with "This page isn't here" | PASS | — | T-25 |
| T-04 | Mood filter = Heritage | Grid narrows, count updates | "Showing 1 of 4", only Museum Activity | PASS | — | jA A1 |
| T-05 | Clear filters | Back to all | "Showing 4 of 4" | PASS | — | jA A2 |
| T-06 | Open a plan card | Plan page with schedule | 4 stops · 5–6 hours · ~13 min travel | PASS | — | jA A3 |
| T-07 | Plan summary totals | Visit + travel shown apart | 5 hr 43 min / 5 hr 30 min / ~13 min | PASS | — | jA A3 |
| T-08 | Open place detail | Modal with hours, address, duration | Opens, labelled by its own `h2` | PASS | — | jA A4 |
| T-09 | Change "How long to stay" | Whole schedule reflows | 1 hr 30 → 15 min; total 5 hr 43 → 4 hr 28 | PASS | — | jA A5/A6 |
| T-10 | Escape closes modal | Closes, focus returns | Closed; focus back on "See the place" | PASS | — | jA A6 |
| T-11 | Reorder stop up | Order and times recompute | Vredeburg moved to 1, legs rebuilt | PASS | — | jA A7 |
| T-12 | Remove a stop | Removal + undo offered | "Took X out. Undo"; focus lands on Undo; undo restores position | PASS | — | jA A8 |
| T-13 | "Open the whole route in Maps" | Correct multi-stop URL | `google.com/maps/dir/?api=1&origin=…&waypoints=…` | PASS | — | jA A9 |
| T-14 | Make your own → stops → reload | Plan persists | Both stops survive reload | PASS | — | jB B4–B9 |
| T-15 | Live place search | Real OSM results | 7 results for "prambanan", grouped "Found on the map" | PASS | — | jB B6 |
| T-16 | Add a searched place | Joins plan with schedule | "Prambanan entrance" added, 11:44–12:59 | PASS | — | jB B7 |
| T-17 | Share | Link to clipboard | 308-char `/mine?plan=…`, button reads "Link copied" | PASS | — | jB B10 |
| T-18 | Open share link in a cold browser | Plan renders without lookup | Full plan, "Shared with you" chip, nothing written to storage but the place cache | PASS | — | jC C1 |
| T-19 | Save a shared plan | Becomes the reader's own | `jalanjalan:myplans` written, header switches to Delete | PASS | — | jC C2 |
| T-20 | Own plan on Discover | Marked as the user's | "Yours" chip + Delete action | PASS | — | chips2 |
| T-21 | OSRM blocked | Says estimates are rough | "We could not check the roads just now…"; totals still shown | PASS | — | edge |
| T-22 | "Tidy up the order", router down | Honest failure | "Could not work out the driving order just now. Try again in a bit." | PASS | — | edge |
| T-23 | Malformed share token | Explains, offers a way back | "That link did not work" + how links travel | PASS | — | jC C4 |
| T-24 | Unknown plan id | Explains browser-local storage | "That plan is not here" | PASS | — | jC C5 |
| T-25 | Unknown plan route | 404 page | HTTP 404, "This page isn't here", link home | PASS | — | jC C6 |
| T-26 | Favourite → `/saved` → remove | Round trip | Saved, listed, removed, empty state returns | PASS | — | jC C7/C8 |
| T-27 | Delete confirmation | Two taps, blur cancels | "Tap again to delete"; blur restores "Delete this plan"; second tap deletes and routes home | PASS | — | edge |
| T-28 | 200-character title | Bounded, no overflow | Clipped to 60 by `maxLength`; no layout break | PASS | — | edge |
| T-29 | Hide all four plans | Recoverable empty state | "You have hidden every plan." + "Show them all again" | PASS | — | edge |
| T-30 | Accessible names, 5 routes | Every control named | 0 unnamed of 99 | PASS | — | run-a11y2 |
| T-31 | Heading order | No skipped level | h1→h2→h3 on `/`; h1→h2 on plan pages | PASS | — | run-a11y2 |
| T-32 | Landmarks | main/header/nav, one h1 | Present on every route | PASS | — | run-a11y2 |
| T-33 | Duplicate ids | None | None found | PASS | — | run-a11y2 |
| T-34 | Text contrast over solid backgrounds | ≥4.5:1 (3:1 large) | 0 failures across 4 routes | PASS | — | run-a11y2 |
| T-35 | Keyboard tab order | Logical, nothing trapped | 20 stops on `/`, 29 on a plan page, all in DOM order | PASS | — | kbd |
| T-36 | Focus visible | Ring on every control | 2 px clay, 3 px offset, settles after the 150 ms colour transition | PASS | — | focusring2 |
| T-37 | Dialog background scroll | Locked | `scrollY` unchanged after wheel | PASS | — | misc |
| T-38 | Reduced motion | Transitions disabled | `transition-duration: 1e-05s` | PASS | — | misc |
| T-39 | Map by keyboard | Pins focusable and operable | Pins are buttons ("Stop 2: Museum Benteng Vredeburg"); Enter opens a popup with "See the place"; zoom controls labelled; canvas has `aria-label="Map"`, `tabindex=0` | PASS | — | map/map2 |
| T-40 | Double-click submit | One plan created | Exactly one "Double tap test" | PASS | — | final |
| T-41 | Current page in nav | Marked | No `aria-current`, no visual marker | **FAIL** | P3 | `SiteHeader.tsx:21-34` |
| T-42 | Reflow 320 px | No horizontal scroll | 320/320 on `/` and a plan page | PASS | — | resp |
| T-43 | Reflow 375/390/768/1024 | No horizontal scroll | Clean at all four | PASS | — | resp |
| T-44 | 200 % zoom equivalent (720 px) | No horizontal scroll | 720/720 both routes | PASS | — | misc |
| T-45 | Mobile view toggle | Switches list ↔ map | Works at 320/375/390/768; hidden at ≥1024 where both show | PASS | — | resp |
| T-46 | Search live region | Announces results | Reverts to "Type the name of anywhere you want to go." with 6 results on screen | **FAIL** | P2 | misc |
| T-47 | Search provider down | One clear message | Status: "Could not search just now…" **and** body: "Nothing found for *zzzqqq*…" | **FAIL** | P2 | edge |
| T-48 | Focus indicator contrast, dark hero | ≥3:1 | clay `#8c3b3b` on `#2e2622` = **1.98:1** | **FAIL** | P2 | focusring2 + computed |
| T-49 | Console / network health | No errors, no broken assets | No console errors; only `ERR_ABORTED` on deliberately cancelled OSRM/tile requests | PASS | — | all runs |

## D. User journey assessment

### J1 — "Show me an afternoon and tell me when I'd be where" (built-in plan)

Home → Museum Activity → read the schedule → open a place → shorten the stay →
reorder → remove and undo → open the route in Maps. **7 steps, 0 failures.**

The page answers the question before any interaction: 4 stops, 5–6 hours,
~13 min travel, then each stop with a clock range. Changing one stay to 15 min
pushed every later arrival and dropped the total to 4 hr 28 min with no reload
and no save button — the most convincing moment in the product.

Friction: "See the place" opens a modal whose first focused control is the
heart, so a keyboard user's first stop is "Save for later" rather than the
content. The duration override is global and permanent — the same venue in
another plan silently inherits it, and the only hint is a "Reset to 1 hr 30 min"
link inside that one modal.

**A non-technical user can complete this unaided.** Yes.

### J2 — "Build my own afternoon and send it to a friend"

Discover → Make your own → title/time/mood → add a stop from the list → search
"prambanan" → add → close → Share. **8 steps, 0 failures.**

The dialog explains itself ("You add stops on the next screen. Plans you make
are kept in this browser only"), and the mood field defuses its own importance
("Only decides which mood filter your plan turns up under"). The search sheet
deliberately stays open after an add and says "Added Prambanan entrance. Add
another, or close to see the plan" — the right call for building a day out.

Friction: pressing **Make it** with an empty title creates a plan called
"My plan" with no comment. Do it twice and the grid holds two cards that cannot
be told apart. The empty plan's card then reads "0 stops · under an hour",
which is a length for an afternoon nobody has planned.

**A non-technical user can complete this unaided.** Yes.

### J3 — "Open the plan someone sent me"

Opened the 308-character link in a browser with empty storage. The plan
rendered immediately — no spinner, no Overpass wait — with a "Shared with you"
chip and a **Save to my plans** button, and nothing was written to storage
until that button was pressed. Pressing it moved the URL to `?id=` and swapped
the action to Delete. **3 steps, 0 failures.**

Tampering with the token produced "That link did not work" and an explanation
that a shared plan travels inside its link, rather than a half-rendered plan.

**A non-technical user can complete this unaided.** Yes.

### J4 — "Keep a place I liked"

Plan → See the place → Save for later → header "Saved" → the place is there →
heart removes it → empty state explains how to put one back. **6 steps, 0 failures.**

Friction: the "← Back to the plans" link at the bottom of `/saved` is 20 px
tall, below the 24 px pointer-target minimum.

**A non-technical user can complete this unaided.** Yes.

## E. Accessibility findings

### Confirmed failures

| WCAG | Finding |
|---|---|
| **2.4.11 Focus Appearance (AA, 2.2)** | The focus ring is `--color-clay` `#8c3b3b` everywhere. Inside the plan hero (`#2e2622`→`#241a16`) that is **1.98:1**, below 3:1. Affects "Back to plans", "Share", "Save as my plan" / "Delete this plan", and "Save to my plans" on a shared plan. |
| **4.1.3 Status Messages (AA)** | `AddStopDialog.tsx:219-233`: when a search answers, `searching` and `added` are both false, so the single `role="status"` region falls back to "Type the name of anywhere you want to go." A screen-reader user is told to type while results sit below. |
| **3.3.1 / 1.4.1-adjacent (clarity)** | `AddStopDialog.tsx:226` vs `:241`: a provider failure shows "Could not search just now" in the status region and "Nothing found for *query*" in the list area at the same time. |
| **2.5.8 Target Size (Minimum, AA)** | `/saved` "← Back to the plans" is 133 × **20** px with no larger hit area (`saved/page.tsx:18`). The two Discover `<select>`s are 20 px tall, but their wrapping `<label>` is 54.5 px and a click on it does move focus to the select — treat as borderline rather than a clean failure. |

### Potential issues (need assistive technology to confirm)

- **Accessible name shadows content.** `ItineraryStop.tsx:64` sets
  `aria-label="Stop 1: Museum Sonobudoyo"` on a button whose visible content
  also carries the arrival window, the length of the stay and the
  **"They're shut by then"** warning. Tabbing through the list announces only
  the label, so the warning — the single most consequential line on the card —
  is likely never heard in focus mode. Browse mode should still reach it.
- **Dialog tab cycle passes through `<body>`.** One Tab in twelve inside the
  native `<dialog>` lands on the document body with no visible focus before
  returning. Platform behaviour, not a trap, but it reads as a lost keypress.
- **First focus in the detail modal** is the heart ("Save … for later"), not
  the dialog or its heading.
- **No skip link.** `main`, `header` and `nav` landmarks are present and the
  header holds only three links, so the practical cost is small, but there is
  no bypass mechanism for keyboard users (2.4.1, technique-dependent).
- **No `aria-current`** on the header nav, so a screen-reader user cannot tell
  which of "Plans" / "Saved" they are on.

### Verified good

- 0 controls without an accessible name across five routes (99 controls).
- 0 computed text-contrast failures over solid backgrounds. The palette
  comments in `globals.css` record real remediation: `--color-ink-muted` was
  raised to `#766559` (5.17:1 on cream) and `--color-field` `#a08a70` exists so
  control borders clear 3:1 (1.4.11) without darkening every divider.
- Heading order is correct on every route; one `h1` per page.
- Escape closes all three dialogs; focus returns to the opener every time.
- Background scroll is locked while a dialog is open.
- `prefers-reduced-motion` zeroes transitions (`1e-05s` measured).
- Reflow is clean at 320 px and at a 200 %-zoom-equivalent 720 px.
- Mood tile images are correctly `alt=""` with adjacent text labels.
- Map pins are real buttons with "Stop N: Name" labels; zoom controls are
  labelled; the canvas has `aria-label="Map"` and `tabindex=0`.
- Status is never colour-only: the closing warning pairs an icon with words.

### Unverified

Screen-reader output (no NVDA/JAWS/VoiceOver run), Safari and Firefox, real
touch hardware, per-component non-text contrast, Windows High Contrast.

### Note on measurement

Reading `outlineColor` immediately after focus returns `currentColor`, because
`transition-colors` in Tailwind v4 includes `outline-color` and the ring fades
in over 150 ms. Measured after settling, every ring is 2 px solid clay. Code
comments in `DiscoverClient.tsx:203-205` and `AddStopDialog.tsx:180-185` claim
`outline-clay` emits no `outline-color` "in this build" — the served CSS shows
`.outline-clay { outline-color: var(--color-clay) }`, so those comments are now
wrong.

## F. Prioritised issues

| ID | Sev | Component | User impact | Fix | Effort |
|---|---|---|---|---|---|
| **P2-1** | P2 | `AddStopDialog.tsx:219-233` | Blind users are told to start typing at the moment results arrive; they have no idea the list below changed | Add a result branch to the existing region: `` `${n} places found. ${remote.length ? "Some are from the map." : ""}` `` when `answered && !failed && !searching` | S |
| **P2-2** | P2 | `AddStopDialog.tsx:236-243` | A network failure reads as "that place doesn't exist", so the user retypes instead of retrying | When `failed`, replace the centre message with the same connection wording instead of "Nothing found for …" | S |
| **P2-3** | P2 | `globals.css:70-74` + hero controls | Keyboard users lose track of focus on four controls in the dark header, including Share and Delete | Give the hero controls a light focus ring (e.g. `focus-visible:outline-white`), or switch the global ring to a two-tone outline that contrasts on both grounds | S |
| **P2-4** | P2 | `ItineraryStop.tsx:64` | Tab-navigating screen-reader users never hear the arrival time or "They're shut by then" | Drop the `aria-label` and let the button's own content be its name, or extend the label to include the clock range and the warning | S |
| **P3-5** | P3 | `PlanCard.tsx:91-96` | An empty plan's card claims "under an hour", a length for an afternoon with nothing in it | Render "Nothing planned yet" when `destinations.length === 0`, matching what the plan page already does | S |
| **P3-6** | P3 | `CreatePlanDialog.tsx:71-85`, `myPlans.ts:57` | Pressing "Make it" with an empty title silently produces "My plan"; two of them are indistinguishable in the grid | Either mark the field `required`, or show the fallback as the input's value so the user sees what they are about to get | S |
| **P3-7** | P3 | `SiteHeader.tsx:21-34` | No one can tell which page they are on from the nav | `aria-current="page"` plus a weight or underline change | S |
| **P3-8** | P3 | `PlanCard.tsx:27` | "Batak restaurant → Batak restaurant → Batak restaurant" reads as a bug | De-duplicate consecutive categories, or fall back to stop names when the categories collapse to one | S |
| **P3-9** | P3 | `PlanClient.tsx:431-444` | The mobile toggle says "Itinerary"; the panel it reveals says "The plan" | Label the toggle "The plan" / "Map" | S |
| **P3-10** | P3 | native `<dialog>` | One Tab per cycle lands on `<body>` with no visible focus | Accept as platform behaviour, or focus the dialog container on open | S |
| **P3-11** | P3 | `DiscoverClient.tsx:463-477` | The `<select>` itself is 20 px tall; tapping the label focuses but may not open the list on touch | Pad the select to 24 px rather than relying on the label | S |
| **P3-12** | P3 | `saved/page.tsx:18` | 20 px-tall standalone link, below the pointer-target minimum | `inline-block py-1.5` | S |
| **P3-13** | P3 | `DiscoverClient.tsx:339` | Cards in one row take different heights, so the arrows sit on three baselines | `h-full` on the card with `flex flex-col` and the footer pushed down | S |
| **P3-14** | P3 | `mine/page.tsx:5` | The tab says "Your plan" even on the error state and on a plan somebody else sent | Set the title from the resolved plan | M |
| **P3-15** | P3 | `DiscoverClient.tsx:203`, `AddStopDialog.tsx:180` | Comments assert `outline-clay` emits nothing; the served CSS says otherwise, so the next reader works around a problem that no longer exists | Delete or correct both comments | S |
| **P3-16** | P3 | `layout.tsx` | No skip link past the header | One `sr-only focus:not-sr-only` anchor to `#main` | S |

### Acceptance criteria for the four P2s

- **P2-1** — With a screen reader (or by reading the region's text), searching
  "prambanan" announces a count. Nothing announces while a request is in
  flight beyond the existing "Looking…".
- **P2-2** — With the search host blocked, the sheet shows exactly one message,
  and it names the connection rather than the query.
- **P2-3** — The focus ring on "Share", "Save as my plan", "Delete this plan"
  and "Back to plans" measures ≥3:1 against the hero gradient at both ends.
- **P2-4** — The itinerary stop's accessible name includes the arrival window
  and, when present, the closing warning; `CategoryIcon.test.ts`-style coverage
  or a snapshot asserts the warning is reachable.

## G. Recommended roadmap

**Fix immediately** (nothing here blocks release; these are the four that
cost real users something)
P2-1, P2-2, P2-3, P2-4. All four are small, local edits — roughly a
half-day together.

**Improve next**
P3-5 (empty-plan length), P3-6 (silent title fallback), P3-7 (`aria-current`),
P3-8 (repeated category summary), P3-12 (target size on `/saved`).

**Polish later**
P3-9 (toggle wording), P3-10 (dialog focus), P3-11 (select padding),
P3-13 (card heights), P3-14 (page title), P3-15 (stale comments),
P3-16 (skip link).

**Do not do**
No redesign, no drag-and-drop, no component library, no photo system. The
no-photo decision is argued from a survey of 934 POIs and the category-tile
fallback reads cleanly at every width tested. The duration knob, the one-sided
opening-hours check and the three-step routing fallback are the right shape
already.

## H. Final verdict

**Can a non-technical user use this website independently?**
Yes. Four journeys were completed with no outside help, no dead ends and no
step that required knowing how the app works. The copy does most of the work:
it explains where plans are stored, what a rough pin is, and when it is
guessing.

**What is the biggest obstacle to completing its primary task?**
For a sighted mouse user: nothing — the primary task is not obstructed. For a
screen-reader user, the add-stop search is the weak point: the live region
contradicts the screen when results arrive (P2-1) and again when the provider
fails (P2-2), and "add a stop" is the one action the whole editing flow hangs
off.

**Which three changes would create the greatest improvement?**
1. Announce search results, and say "connection" rather than "nothing found"
   when the provider fails (P2-1 + P2-2).
2. Give the dark hero its own focus ring colour (P2-3).
3. Let the itinerary stop's own content be its accessible name, so
   "They're shut by then" is heard by the people most likely to need it (P2-4).

**Is the website ready for real users?**
Yes, with the caveat that the four P2s should land before it is put in front of
anyone relying on a screen reader. There is no P0 and no P1; no journey is
broken; no data can be lost without an undo or a second confirmation.

**What must be retested after fixes?**
The add-stop sheet with a screen reader and with the search host blocked;
keyboard focus on all four hero controls at both ends of the gradient; the
itinerary stop announcement including a venue that triggers the closing
warning; the Discover grid with an empty plan in it; and a full 320 px reflow
pass, because P3-12 and P3-13 both touch layout.

---

## I. Applied

Every issue above was fixed and retested in the same browser the audit ran in.
`npm test` 98 passing (94 before, plus four for the new `summarizeCategories`),
`tsc --noEmit` clean, `eslint` clean, `next build` clean with all ten routes
still prerendered.

| ID | What changed | Retest |
|---|---|---|
| P2-1 | `AddStopDialog` — the one `role="status"` region gained an answered branch, so landing results are announced | "prambanan" → **"7 places to add."** where it used to say "Type the name of anywhere you want to go." |
| P2-2 | `AddStopDialog` — a failed request keeps its own wording in the result area instead of being overwritten by "Nothing found for …" | Photon blocked: both lines read "Could not search just now. Check your connection and try again." A genuine miss still reads "Nothing found for *qzxwvuy noplace*." |
| P2-3 | `globals.css` gained `.on-dark :focus-visible { outline-color: #fff }`; `PlanClient` marks the header band | Back to plans / Share / Save as my plan now ring `rgb(255,255,255)` (12.6:1 on `#2e2622`); everything off the band still rings clay |
| P2-4 | `ItineraryStop` — dropped the `aria-label`; the stop number carries an `sr-only` "Stop" | Accessible name is now `"Stop 1 Nanamia Pizzeria Pizzeria 06:00 – 07:30 (1 hr 30 min) They're shut by then"`. Badge still renders 24×24 with just the digit. |
| P3-5 | `PlanCard` — an empty plan shows one "Nothing planned yet" badge | Card reads "Nothing planned yet", no length claim |
| P3-6 | `CreatePlanDialog` — a hint appears while the title is blank | "Leave this blank and it will be called "My plan"." shows at empty, disappears on the first keystroke |
| P3-7 | `SiteHeader` is now a client component, marking the current page | `aria-current="page"` correct on `/`, `/saved` and `/plan/piggy`; underlined as well as recoloured |
| P3-8 | `summarizeCategories` in `format.ts`, used by `PlanCard` and `PlanClient` | Piggy's summary is **"3 × Batak restaurant"**. Covered by `format.test.ts`. |
| P3-9 | `PlanClient` — the mobile toggle says "The plan" / "Map" | Labels confirmed; the panel it reveals has the same name |
| P3-10 | `DestinationDetailModal` focuses the dialog itself; `AddStopDialog` focuses the search box | Detail modal opens on `DIALOG`, not the heart; the search sheet opens on `add-stop-search`; Escape still returns focus to the opener |
| P3-11 | `DiscoverClient` — `py-0.5` on the filter selects | 208 × **24** px |
| P3-12 | `/saved` back link padded | 133 × **32** px |
| P3-13 | `PlanCard` is a full-height column with the footer on `mt-auto`; the Discover wrapper is `h-full` | Row one: 329 / 329 / 329 px, one baseline |
| P3-14 | `MyPlanClient` sets `document.title` from the resolved plan | "Empty plan · Jalan-Jalan" on your own; "Link did not work · Jalan-Jalan" on a broken token |
| P3-15 | Stale comments about `outline-clay` deleted | — |
| P3-16 | Skip link in `SiteHeader`, `id="main"` on all five `<main>`s | First Tab reveals a 140 × 36 px link; Enter moves focus to `MAIN#main`. Parked by transform rather than `sr-only`, because `not-sr-only` zeroes the padding and left it 20 px tall. |

**Full regression after the changes**

- Journeys J1–J4 re-run end to end: all still complete, same results.
- Five viewports (320/375/390/768/1024): no horizontal scroll, **0** targets
  under 24 px on any route — the only remaining ones are MapLibre's own
  attribution links.
- Four routes re-audited: **0** unnamed controls, **0** text-contrast failures
  over solid backgrounds, no heading skips, no duplicate ids, landmarks and a
  skip link present on every page.
- Provider-outage paths re-checked: OSRM blocked still degrades to
  "rough guesses"; Photon blocked now says one thing instead of two.
- No console errors. The only failed requests are the deliberate
  `AbortController` cancellations on OSRM.

**Still not verified** — unchanged from the audit: no screen reader, no Safari
or Firefox, no real touch hardware, no axe-core, and non-text contrast read
from tokens rather than measured per component.
