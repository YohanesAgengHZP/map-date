"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, type ReactNode } from "react";
import { Eye, EyeOff, Plus, Search, SlidersHorizontal, Trash2 } from "lucide-react";
import { MOODS, TIME_FILTERS } from "@/data/plans";
import { getDestinations } from "@/data/destinations";
import { calculateTotals } from "@/lib/itinerary";
import { createMyPlan, toPlan, useMyPlans } from "@/lib/myPlans";
import { estimateRoute } from "@/lib/routing";
import type { Mood } from "@/lib/types";
import { CreatePlanDialog } from "./CreatePlanDialog";
import { PlanCard } from "./PlanCard";
import { SafeImage } from "./SafeImage";
import { Button, cx } from "./ui";

/**
 * Built-in cards arrive pre-rendered from the server, which keeps `plans.ts`
 * out of the client bundle. Cards for plans the user made have to be built
 * here, because they only exist in this browser.
 */
export type PlanEntry = {
  id: string;
  mood: Mood;
  tags: string[];
  totalMinutes: number | null;
  card: ReactNode;
  /** True for a plan the user made: deletable, and never hidden. */
  mine?: boolean;
};

type TimeId = (typeof TIME_FILTERS)[number]["id"];

export function DiscoverClient({ entries }: { entries: PlanEntry[] }) {
  const [mood, setMood] = useState<Mood | "any">("any");
  const [time, setTime] = useState<TimeId>("any");
  const [creating, setCreating] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { plans, hidden, add, remove, toggleHidden } = useMyPlans();

  /**
   * The built-in cards arrive pre-rendered from the server. The user's own are
   * built here, because they only exist in this browser. Both go through the
   * same filters so there is one list to look at.
   */
  const mine: PlanEntry[] = useMemo(
    () =>
      plans.map((saved) => {
        const plan = toPlan(saved);
        const destinations = getDestinations(plan.destinationIds);
        const totals = calculateTotals(destinations, estimateRoute(destinations).legs);
        return {
          id: plan.id,
          mood: plan.mood,
          tags: plan.tags,
          totalMinutes: totals.totalMinutes,
          mine: true,
          card: <PlanCard plan={plan} href={`/mine?id=${plan.id}`} />,
        };
      }),
    [plans],
  );

  const visible = useMemo(() => {
    const timeFilter = TIME_FILTERS.find((t) => t.id === time)!;
    const timeMin = "minMinutes" in timeFilter ? timeFilter.minMinutes : 0;

    return [...mine, ...entries].filter((entry) => {
      if (!entry.mine && hidden.includes(entry.id) && !showHidden) return false;

      const moodMatch =
        mood === "any" ||
        entry.mood === mood ||
        entry.tags.some((tag) => tag.toLowerCase() === mood);

      // An unknown duration should not be silently filtered out.
      const timeMatch =
        entry.totalMinutes === null ||
        (entry.totalMinutes >= timeMin && entry.totalMinutes <= timeFilter.maxMinutes);

      return moodMatch && timeMatch;
    });
  }, [entries, mine, hidden, showHidden, mood, time]);

  const scrollToResults = () =>
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const filtersActive = mood !== "any" || time !== "any";

  const startPlan = (input: { title: string; mood: Mood; startTime: string }) => {
    const plan = createMyPlan(input);
    add(plan);
    setCreating(false);
    router.push(`/mine?id=${plan.id}`);
  };

  return (
    <>
      <section className="relative mx-auto max-w-6xl px-4 pt-6 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl">
          <div className="relative aspect-[4/5] sm:aspect-[16/9] lg:aspect-[21/9]">
            <SafeImage
              src="/venues/mediterranea/1.webp"
              alt="Dining room with string lights and potted plants at Mediterranea"
              sizes="100vw"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#241a16]/85 via-[#241a16]/45 to-transparent" />
          </div>

          <div className="absolute inset-0 flex flex-col justify-end p-5 sm:justify-center sm:p-10 lg:p-14">
            <div className="max-w-md">
              <h1 className="text-3xl leading-[1.1] text-white sm:text-4xl lg:text-5xl">
                So, where
                <br />
                are we going?
              </h1>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/80 sm:text-base">
                A few afternoons around Jogja, already worked out. Where to go,
                how long it takes, and what the place actually looks like.
              </p>
            </div>

            <div className="border-line bg-paper/95 mt-5 flex max-w-2xl flex-col gap-3 rounded-2xl border p-3 backdrop-blur sm:mt-7 sm:flex-row sm:items-end">
              <FilterSelect
                label="Mood"
                value={mood}
                onChange={(value) => setMood(value as Mood | "any")}
                options={[
                  { value: "any", label: "Any mood" },
                  ...MOODS.map((m) => ({ value: m.id, label: m.label })),
                ]}
              />
              <FilterSelect
                label="Time"
                value={time}
                onChange={(value) => setTime(value as TimeId)}
                options={TIME_FILTERS.map((t) => ({ value: t.id, label: t.label }))}
              />
              <Button onClick={scrollToResults} className="shrink-0 sm:px-5">
                <Search size={15} aria-hidden />
                Show me
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-12 sm:px-6">
        <h2 className="text-2xl">What are you in the mood for?</h2>
        <p className="text-ink-muted mt-1 text-sm">
          Tap one to narrow things down.
        </p>

        <ul className="hide-scrollbar mt-5 flex snap-x gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 sm:overflow-visible lg:grid-cols-5">
          {MOODS.map((item) => {
            const selected = mood === item.id;
            return (
              <li key={item.id} className="w-32 shrink-0 snap-start sm:w-auto">
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setMood(selected ? "any" : item.id)}
                  className={cx(
                    "group w-full text-left",
                    "focus-visible:outline-clay",
                  )}
                >
                  <span
                    className={cx(
                      "relative block aspect-[4/3] overflow-hidden rounded-xl border-2 transition-colors",
                      selected ? "border-clay" : "border-transparent",
                    )}
                  >
                    <SafeImage
                      src={item.photo}
                      alt={item.alt}
                      sizes="(max-width: 640px) 128px, 16vw"
                      className="transition-transform duration-500 group-hover:scale-105"
                    />
                  </span>
                  <span
                    className={cx(
                      "mt-2 block text-sm font-medium",
                      selected ? "text-clay" : "text-ink",
                    )}
                  >
                    {item.label}
                  </span>
                  <span className="text-ink-muted block text-xs">{item.blurb}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section
        ref={resultsRef}
        className="mx-auto max-w-6xl scroll-mt-20 px-4 pt-12 pb-20 sm:px-6"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl">Plans we could do</h2>
            <p className="text-ink-muted mt-1 text-sm">
              Every one of them has somewhere to eat built in.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {filtersActive ? (
              <Button
                variant="ghost"
                onClick={() => {
                  setMood("any");
                  setTime("any");
                }}
              >
                <SlidersHorizontal size={14} aria-hidden />
                Clear
              </Button>
            ) : null}
            <Button onClick={() => setCreating(true)}>
              <Plus size={15} aria-hidden />
              Make your own
            </Button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
          <p aria-live="polite" className="text-ink-muted text-xs">
            Showing {visible.length} of {entries.length + mine.length}
          </p>
          {hidden.length > 0 ? (
            <button
              type="button"
              onClick={() => setShowHidden((value) => !value)}
              className="text-ink-soft hover:text-clay inline-flex items-center gap-1.5 text-xs underline underline-offset-2"
            >
              {showHidden ? <EyeOff size={12} aria-hidden /> : <Eye size={12} aria-hidden />}
              {showHidden
                ? "Stop showing hidden"
                : `Show ${hidden.length} hidden`}
            </button>
          ) : null}
        </div>

        {visible.length === 0 ? (
          <div className="border-line bg-paper mt-5 rounded-2xl border border-dashed p-10 text-center">
            <p className="text-ink-soft text-sm">
              Hmm, nothing fits that combination.
            </p>
            <Button
              variant="secondary"
              className="mt-4"
              onClick={() => {
                setMood("any");
                setTime("any");
              }}
            >
              Start over
            </Button>
          </div>
        ) : (
          <ul className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((entry) => {
              const isHidden = hidden.includes(entry.id);
              return (
                <li key={entry.id} className="relative">
                  <div className={cx(isHidden && "opacity-55")}>{entry.card}</div>
                  <CardAction
                    entry={entry}
                    hidden={isHidden}
                    onDelete={() => remove(entry.id)}
                    onToggleHidden={() => toggleHidden(entry.id)}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <CreatePlanDialog
        open={creating}
        onClose={() => setCreating(false)}
        onCreate={startPlan}
      />
    </>
  );
}

/**
 * Sits over the card rather than inside it: the card is one big `<Link>`, and
 * a button nested in an anchor is neither valid nor keyboard-sane.
 *
 * Deleting a plan you made asks twice, because it cannot be undone. Hiding a
 * built-in does not, because unhiding is right there.
 */
function CardAction({
  entry,
  hidden,
  onDelete,
  onToggleHidden,
}: {
  entry: PlanEntry;
  hidden: boolean;
  onDelete: () => void;
  onToggleHidden: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  if (entry.mine) {
    return (
      <button
        type="button"
        onClick={() => {
          if (!confirming) {
            setConfirming(true);
            return;
          }
          onDelete();
        }}
        onBlur={() => setConfirming(false)}
        className={cx(
          "absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-medium backdrop-blur transition-colors",
          confirming
            ? "bg-clay text-white"
            : "text-ink bg-white/92 hover:bg-white",
        )}
      >
        <Trash2 size={12} aria-hidden />
        {confirming ? "Tap again to delete" : "Delete"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onToggleHidden}
      aria-label={hidden ? "Show this plan again" : "Hide this plan"}
      className="text-ink absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-white/92 px-2.5 py-1.5 text-[11px] font-medium backdrop-blur transition-colors hover:bg-white"
    >
      {hidden ? <Eye size={12} aria-hidden /> : <EyeOff size={12} aria-hidden />}
      {hidden ? "Unhide" : "Hide"}
    </button>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="border-line min-w-0 flex-1 rounded-xl border px-3 py-1.5 sm:border-0">
      <span className="text-ink-muted block text-[11px] tracking-wide uppercase">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="text-ink w-full cursor-pointer appearance-none bg-transparent pr-4 text-sm focus:outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
