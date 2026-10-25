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

export function formatDistance(meters: number): string {
  return meters < 950
    ? `${Math.round(meters / 10) * 10} m`
    : `${(meters / 1000).toFixed(1)} km`;
}
