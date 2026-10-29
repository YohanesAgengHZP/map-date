"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowDown,
  ChevronDown,
  Eye,
  EyeOff,
  Plus,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import { MOODS, TIME_FILTERS } from "@/data/plans";
import { getDestinations } from "@/data/destinations";
import { calculateTotals } from "@/lib/itinerary";
import { createMyPlan, toPlan, useMyPlans } from "@/lib/myPlans";
import { estimateRoute } from "@/lib/routing";
import type { Mood } from "@/lib/types";
import { CategoryPattern } from "./CategoryIcon";
import { CreatePlanDialog } from "./CreatePlanDialog";
import { PlanCard } from "./PlanCard";
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

/**
 * What the hero tiles with. Written out rather than derived from the cards
 * below it: the built-in ones arrive pre-rendered as `ReactNode`, so their
 * categories are not reachable here, and this panel is about the app rather
 * than about any one plan anyway. It only has to look like an afternoon out.
 */
const HERO_CATEGORIES = [
  "Cafe",
  "Museum",
  "Park",
  "Restaurant",
  "Attraction",
  "Gallery",
  "Market",
  "Zoo",
];

export function DiscoverClient({ entries }: { entries: PlanEntry[] }) {
  const [mood, setMood] = useState<Mood | "any">("any");
  const [time, setTime] = useState<TimeId>("any");
  const [creating, setCreating] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { plans, hidden, add, remove, toggleHidden, unhideAll } = useMyPlans();

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

  // `hidden` holds persisted ids, which outlive the plans they name. A stale
  // one offered "Show 1 hidden" beside "Showing 6 of 6" — a count of nothing.
  const hiddenHere = entries.filter((entry) => hidden.includes(entry.id));

  const startPlan = (input: { title: string; mood: Mood; startTime: string }) => {
    const plan = createMyPlan(input);
    add(plan);
    setCreating(false);
    router.push(`/mine?id=${plan.id}`);
  };

  return (
    <>
      <section className="relative mx-auto max-w-6xl px-4 pt-6 sm:px-6">
        {/* Was a photo with the copy laid over it, which is why this used to
            be an aspect-ratio box with an absolutely positioned overlay. With
            no photograph there is nothing to size to, so the panel simply
            wraps its own content: no fixed ratio and no overlay.

            The copy is a column and the filter bar stops at `max-w-2xl`, so a
            6xl panel still left its right-hand half bare dark brown. The tile
            fills it, faded out from the left so it never sits behind the
            heading. */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2e2622] to-[#241a16]">
          <CategoryPattern
            categories={HERO_CATEGORIES}
            tiles={60}
            className="text-white/[0.06] [mask-image:linear-gradient(to_right,transparent_30%,black_85%)]"
          />
          <div className="relative flex flex-col p-6 sm:p-10 lg:p-12">
            <div className="max-w-md">
              <h1 className="text-3xl leading-[1.1] text-white sm:text-4xl lg:text-5xl">
                So, where
                <br />
                are we going?
              </h1>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/80 sm:text-base">
                A few afternoons around Jogja, already worked out. Where to
                go, how long it takes, and how far apart everything is. Open
                one and you can add anywhere else you like.
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
              {/* "Show me" promised a search that had already happened: the
                  filters apply as they change, so pressing it only moved the
                  page. Named for what it does. */}
              <Button onClick={scrollToResults} className="shrink-0 sm:px-5">
                <ArrowDown size={15} aria-hidden />
                See the plans
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
                  // No `focus-visible:outline-clay`: that utility emits no
                  // `outline-color` in this build. The global rule rings it.
                  // `rounded-xl` matches the tile inside, so the ring traces
                  // the card rather than cutting its corners.
                  className="group w-full rounded-xl text-left"
                >
                  {/* These were photo tiles, then text only: a mood is not a
                      category, and no icon honestly stands for "Cozy" the way
                      one stands for "Pizzeria". A drawing can, and these are
                      drawings — one per mood, of nowhere in particular — so
                      they say nothing false about any real venue the way a
                      stock photograph of someone else's café would. */}
                  <span
                    className={cx(
                      "block overflow-hidden rounded-xl border-2 transition-colors",
                      selected
                        ? "border-clay bg-clay-soft/50"
                        : "border-line bg-paper group-hover:border-clay/40",
                    )}
                  >
                    {/* `contain`, not `cover`: the art runs to the edges of its
                        square and a 4:3 crop would cut the pens off the bottom
                        of "Artsy". The letterbox is invisible because the
                        converter repaints each backdrop `--color-paper`.

                        Plain `img`: five static WebPs of known size, already
                        sized for the tile, so `next/image` would add a config
                        and a round trip to re-do work the build step did. */}
                    {/* eslint-disable-next-line @next/next/no-img-element --
                        the rule guards against unsized, unoptimised images.
                        These are five static WebPs built to the tile's size by
                        `convert-mood-assets.py`, with width, height and lazy
                        loading set; `next/image` would re-optimise them at
                        request time for nothing. */}
                    <img
                      src={`/moods/${item.id}.webp`}
                      alt=""
                      width={512}
                      height={512}
                      loading="lazy"
                      className="aspect-[4/3] w-full bg-paper object-contain"
                    />
                    <span className="block px-3 py-2.5">
                      <span
                        className={cx(
                          "block text-sm font-medium",
                          selected ? "text-clay" : "text-ink",
                        )}
                      >
                        {item.label}
                      </span>
                      <span className="text-ink-muted mt-0.5 block text-xs leading-snug">
                        {item.blurb}
                      </span>
                    </span>
                  </span>
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
          {hiddenHere.length > 0 ? (
            <button
              type="button"
              onClick={() => setShowHidden((value) => !value)}
              className="text-ink-soft hover:text-clay inline-flex items-center gap-1.5 text-xs underline underline-offset-2"
            >
              {showHidden ? <EyeOff size={12} aria-hidden /> : <Eye size={12} aria-hidden />}
              {showHidden
                ? "Stop showing hidden"
                : `Show ${hiddenHere.length} hidden`}
            </button>
          ) : null}
        </div>

        {visible.length === 0 ? (
          /* "Start over" used to clear only the two filters, so hiding every
             plan left a button that did nothing and a message blaming a
             combination the user had not picked. It now undoes whatever is
             actually emptying the list, and says which that is. */
          <div className="border-line bg-paper mt-5 rounded-2xl border border-dashed p-10 text-center">
            <p className="text-ink-soft text-sm">
              {filtersActive
                ? "Hmm, nothing fits that combination."
                : "You have hidden every plan."}
            </p>
            <Button
              variant="secondary"
              className="mt-4"
              onClick={() => {
                setMood("any");
                setTime("any");
                unhideAll();
              }}
            >
              {filtersActive ? "Start over" : "Show them all again"}
            </Button>
          </div>
        ) : (
          <ul className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((entry) => {
              const isHidden = hidden.includes(entry.id);
              return (
                <li key={entry.id} className="group/card relative">
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
 *
 * Pointer devices only reveal it on hover or focus: it sat on every card at
 * all times, so the first word a new visitor read on a grid of suggestions
 * was "Delete". Where there is no hover it stays visible, as does the button
 * on an already-hidden card, which is the only way back.
 */
const ACTION_CLASS =
  "absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-medium backdrop-blur transition";

const ACTION_REVEAL =
  "md:opacity-0 md:focus-visible:opacity-100 md:group-hover/card:opacity-100";

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
          ACTION_CLASS,
          confirming
            ? "bg-clay text-white"
            : cx("text-ink bg-white/92 hover:bg-white", ACTION_REVEAL),
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
      className={cx(
        ACTION_CLASS,
        "text-ink bg-white/92 hover:bg-white",
        !hidden && ACTION_REVEAL,
      )}
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
    // The border used to drop at `sm`, which left the two filters reading as
    // plain text on desktop — the first interaction on the page, with nothing
    // to say it could be interacted with. Border and chevron at every width.
    //
    // The ring is drawn here, not on the `<select>`: the rounding lives on this
    // label, so a ring around the bare select traced a hard-cornered box inside
    // a rounded pill. Same fix as the search field in `AddStopDialog`.
    //
    // The border is left alone while focused. Recolouring it too put two clay
    // outlines two pixels apart, which reads as one cramped double border
    // rather than a ring; the border's job is to mark the control at rest.
    <label className="border-field focus-within:outline-[var(--color-clay)] relative min-w-0 flex-1 rounded-xl border px-3 py-1.5 focus-within:outline-2 focus-within:outline-offset-2">
      <span className="text-ink-muted block text-[11px] tracking-wider uppercase">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="text-ink w-full cursor-pointer appearance-none bg-transparent pr-6 text-sm outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={16}
        aria-hidden
        className="text-ink-muted pointer-events-none absolute right-3 bottom-2"
      />
    </label>
  );
}
