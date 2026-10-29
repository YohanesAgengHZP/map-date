/** 210 -> "3 hr 30 min", 45 -> "45 min". */
export function formatDuration(minutes: number): string {
  const whole = Math.round(minutes);
  const hours = Math.floor(whole / 60);
  const mins = whole % 60;
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} hr`;
  return `${hours} hr ${mins} min`;
}

/** 840 -> "14:00". Wraps past midnight so late dates stay readable. */
export function formatClock(minutesFromMidnight: number): string {
  const wrapped = ((Math.round(minutesFromMidnight) % 1440) + 1440) % 1440;
  const hours = String(Math.floor(wrapped / 60)).padStart(2, "0");
  const mins = String(wrapped % 60).padStart(2, "0");
  return `${hours}:${mins}`;
}

/** "14:00" -> 840. Returns 0 for anything unparseable. */
export function parseClock(time: string): number {
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
}

/** 210 -> "3–4 hours". A soft band, for cards where precision would overpromise. */
export function formatDurationBand(minutes: number): string {
  const lower = Math.floor(minutes / 60);
  const upper = Math.ceil(minutes / 60);
  if (upper === 0) return "under an hour";
  if (lower === upper) return `${upper} hour${upper === 1 ? "" : "s"}`;
  return `${lower}–${upper} hours`;
}

/**
 * The one-line "what is this plan" summary, from the stops' categories.
 *
 * Runs of the same category collapse: Piggy is three Batak restaurants and
 * read "Batak restaurant → Batak restaurant → Batak restaurant", which looks
 * like a rendering fault rather than a plan. A count says the same thing and
 * says it on purpose.
 */
export function summarizeCategories(categories: string[]): string {
  const runs: { category: string; count: number }[] = [];
  for (const category of categories) {
    const last = runs.at(-1);
    if (last?.category === category) last.count += 1;
    else runs.push({ category, count: 1 });
  }
  return runs
    .map(({ category, count }) => (count > 1 ? `${count} × ${category}` : category))
    .join(" → ");
}

export function formatDistance(meters: number): string {
  return meters < 950
    ? `${Math.round(meters / 10) * 10} m`
    : `${(meters / 1000).toFixed(1)} km`;
}
