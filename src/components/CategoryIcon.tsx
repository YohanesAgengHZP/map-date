import { createElement } from "react";
import {
  Armchair,
  Beer,
  Bike,
  Camera,
  Castle,
  Coffee,
  FerrisWheel,
  Landmark,
  MapPin,
  Mountain,
  Palette,
  ShoppingBag,
  Trees,
  UtensilsCrossed,
  Waves,
  type LucideIcon,
} from "lucide-react";
import { cx } from "./ui";

/**
 * What sits where a photo used to.
 *
 * The app has no imagery at all now, built-in or searched, because
 * OpenStreetMap carries none for the kind of places this is about. An icon is
 * the one thing that can be derived for every venue from a field they all
 * have, so a hand-written entry and something you found thirty seconds ago
 * look identical. That consistency is the whole point.
 *
 * Decorative by design: every place this renders already shows the category as
 * text right beside it, so announcing it twice only makes a screen reader
 * noisier. Hence `aria-hidden` rather than `role="img"`.
 */

/**
 * Ordered: the first pattern that matches wins, so put the specific ones
 * first. Matched against the category string, which is hand-written for the
 * built-in venues ("Batak restaurant", "Batik workshop") and derived from OSM
 * tags for everything else ("Fast food", "Place of worship").
 */
const ICONS: [RegExp, LucideIcon][] = [
  [/coffee|cafe|kedai|kopi/, Coffee],
  [/bar\b|pub|brew|beer|wine/, Beer],
  [/pizz|restaurant|food|warung|kitchen|burger|rumah makan|bakery|dessert/, UtensilsCrossed],
  [/museum|heritage|monument|historic|fort|benteng/, Landmark],
  [
    // "Religion" shows up on its own because OSM tags some of these with a
    // `religion` key and no value for `toCategory` to prefer.
    /palace|castle|kraton|keraton|temple|candi|worship|religio|mosque|masjid|church|shrine/,
    Castle,
  ],
  [/galler|art|batik|craft|studio|paint|workshop/, Palette],
  [/zoo|theme|amusement|fun|kids|play|water park/, FerrisWheel],
  // `tourism=attraction` and `tourism=viewpoint` are two of the commonest
  // values OSM returns, and nothing above catches them.
  [/attraction|viewpoint|sight|tourist|monument/, Camera],
  [/park|garden|taman|forest|tree/, Trees],
  [/beach|lake|river|waterfall|pantai|water/, Waves],
  [/mountain|hill|volcano|viewpoint|gunung/, Mountain],
  [/mall|shop|market|store|pasar/, ShoppingBag],
  [/cycl|bike|sport|gym/, Bike],
  [/lounge|spa|hotel|guest|stay/, Armchair],
];

export function iconFor(category: string): LucideIcon {
  const needle = category.toLowerCase();
  return ICONS.find(([pattern]) => pattern.test(needle))?.[1] ?? MapPin;
}

/**
 * Fills its container, the way the old photo component did, so every caller
 * keeps its existing sized wrapper and aspect ratio.
 */
export function CategoryIcon({
  category,
  size = 20,
  className,
}: {
  category: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cx(
        "bg-clay-soft/70 text-clay flex h-full w-full items-center justify-center",
        className,
      )}
    >
      {/* `createElement` rather than binding the icon to a capitalised local
          and rendering `<Icon />`: the lint rule reads that as building a
          component mid-render. The reference is a stable module constant, but
          this says so plainly instead of arguing with the rule. */}
      {createElement(iconFor(category), { size, strokeWidth: 1.5 })}
    </span>
  );
}
