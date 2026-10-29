import type { Destination } from "./types";

/**
 * Is a stop scheduled for a time the venue is shut?
 *
 * Until now `openingHours` was a string the detail panel printed and nothing
 * read, so the scheduler would happily put you outside Sonobudoyo at 21:40.
 *
 * The plan is a clock, not a calendar. `Plan.startTime` is "HH:MM" and there
 * is no date anywhere in the app, so a rule like "Mo-Fr 08:00-17:00" cannot be
 * evaluated as written: nobody has said which day they are going. Asking for a
 * date to make this field work would be a worse trade than leaving it half
 * answered.
 *
 * The half that is answerable is the time of day. Take the union of every
 * window the string mentions and test against that. If 21:40 falls outside all
 * of them, the place is shut at 21:40 whichever day you turn up, and that
 * holds however the day rules are written. If it falls inside one, say
 * nothing: "open on some days at this hour" is not worth interrupting anyone
 * with.
 *
 * So this is deliberately one-sided. It never claims a venue is open, only
 * that it is closed, and only when the string it was given proves it. Two
 * fields in this app are already guesses with the word "guess" on them; a
 * third that cried wolf would get the first two ignored too.
 */

/** Minutes from midnight. `end` may exceed 1440 for a window running past it. */
export type OpeningWindow = { start: number; end: number };

/** What is wrong with a stop's timing, or null when nothing provably is. */
export type HoursWarning = "closed-on-arrival" | "closes-during-visit";

const MINUTES_PER_DAY = 1440;

/** Matches "09:00-17:00" and the en-dashed "11:00 – 22:00" the seed data uses. */
const WINDOW = /(\d{1,2}):(\d{2})\s*[-–—]\s*(\d{1,2}):(\d{2})/g;

/**
 * Read the opening windows out of whatever the field happens to hold. Two
 * shapes turn up: OSM `opening_hours` syntax from Overpass ("Mo-Fr 08:00-17:00;
 * Sa 09:00-14:00") and the hand-written display strings in `destinations.ts`
 * ("11:00 – 22:00 (Fri from 14:00)").
 *
 * Both are read the same way, by pulling out the time ranges and ignoring
 * everything around them. The day specs, the `off` and `PH` tokens and the
 * parenthetical asides are all discarded on purpose: none of them can change
 * the answer this module gives, which is about the clock alone.
 *
 * Returns null, not an empty array, when there is nothing to go on. A venue
 * with no hours and a venue described as "by appointment" are both unknown,
 * and unknown must never read as closed.
 */
export function parseOpeningHours(hours?: string): OpeningWindow[] | null {
  if (!hours) return null;

  // "24/7" carries no time range, so it would otherwise parse as unknown.
  if (/24\s*\/\s*7/.test(hours)) return [{ start: 0, end: MINUTES_PER_DAY }];

  const windows: OpeningWindow[] = [];
  for (const [, h1, m1, h2, m2] of hours.matchAll(WINDOW)) {
    const start = clockToMinutes(h1, m1);
    const end = clockToMinutes(h2, m2);
    if (start === null || end === null) continue;

    windows.push({
      // "22:00-02:00" is one evening rather than a typo, so the window runs
      // past midnight instead of being thrown away as backwards.
      start,
      end: end <= start ? end + MINUTES_PER_DAY : end,
    });
  }

  return windows.length > 0 ? windows : null;
}

/** 24:00 is a legal end of day in OSM syntax, so the hour range allows it. */
function clockToMinutes(hour: string, minute: string): number | null {
  const h = Number(hour);
  const m = Number(minute);
  if (h > 24 || m > 59) return null;
  return h * 60 + m;
}

/**
 * Is this minute inside any of the windows?
 *
 * `allowEnd` is the difference between turning up and leaving. Arriving at
 * 22:00 somewhere that closes at 22:00 is arriving at a locked door; leaving
 * at 22:00 is leaving as it shuts, which is fine.
 */
function covers(
  windows: OpeningWindow[],
  minutes: number,
  allowEnd = false,
): boolean {
  const clock = ((Math.round(minutes) % MINUTES_PER_DAY) + MINUTES_PER_DAY) %
    MINUTES_PER_DAY;

  return windows.some((window) => {
    // A window running past midnight is matched by looking at the clock time
    // as if it were tomorrow, which is where the rest of that window lives.
    const t = clock >= window.start ? clock : clock + MINUTES_PER_DAY;
    return t >= window.start && (allowEnd ? t <= window.end : t < window.end);
  });
}

/**
 * The check the itinerary actually runs. Null means either "fits" or "no idea",
 * and the UI treats them the same, because there is nothing useful to say in
 * either case.
 */
export function checkOpeningHours(
  destination: Pick<Destination, "openingHours">,
  arrivalMinutes: number,
  departureMinutes: number,
): HoursWarning | null {
  const windows = parseOpeningHours(destination.openingHours);
  if (!windows) return null;

  if (!covers(windows, arrivalMinutes)) return "closed-on-arrival";
  if (!covers(windows, departureMinutes, true)) return "closes-during-visit";
  return null;
}
