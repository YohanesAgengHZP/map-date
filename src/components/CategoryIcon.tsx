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
 *
 * The third column is the tile's colour. One flat tint for every category read
 * as a photo that had failed to load, because twenty search results were
 * twenty identical beige squares; a tint per family makes the tile look chosen
 * rather than missing, and makes a list scannable by shape and colour before
 * you read a single name. Kept deliberately desaturated: the palette is cream
 * and terracotta, and a list of saturated chips would fight it.
 */
const ICONS: [RegExp, LucideIcon, string][] = [
  [/coffee|cafe|kedai|kopi/, Coffee, "bg-[#f3e6d3] text-[#8a5a24]"],
  [/bar\b|pub|brew|beer|wine/, Beer, "bg-[#f2eacd] text-[#7f6a16]"],
  [
    /pizz|restaurant|food|warung|kitchen|burger|rumah makan|bakery|dessert/,
    UtensilsCrossed,
    "bg-[#f7e3da] text-[#a0482f]",
  ],
  [
    /museum|heritage|monument|historic|fort|benteng/,
    Landmark,
    "bg-[#eae3d8] text-[#6d5c49]",
  ],
  [
    // "Religion" shows up on its own because OSM tags some of these with a
    // `religion` key and no value for `toCategory` to prefer.
    /palace|castle|kraton|keraton|temple|candi|worship|religio|mosque|masjid|church|shrine/,
    Castle,
    "bg-[#ece2ee] text-[#73447a]",
  ],
  [
    /galler|art|batik|craft|studio|paint|workshop/,
    Palette,
    "bg-[#f8e3e8] text-[#a44059]",
  ],
  [
    /zoo|theme|amusement|fun|kids|play|water park/,
    FerrisWheel,
    "bg-[#fbe7cc] text-[#b06411]",
  ],
  // `tourism=attraction` and `tourism=viewpoint` are two of the commonest
  // values OSM returns, and nothing above catches them.
  [
    /attraction|viewpoint|sight|tourist|monument/,
    Camera,
    "bg-[#e2eaef] text-[#3f6480]",
  ],
  [/park|garden|taman|forest|tree/, Trees, "bg-[#e4ecdf] text-[#4a6b44]"],
  [
    /beach|lake|river|waterfall|pantai|water/,
    Waves,
    "bg-[#dfebec] text-[#3c6a6c]",
  ],
  [
    /mountain|hill|volcano|viewpoint|gunung/,
    Mountain,
    "bg-[#e6e9ef] text-[#4f5a74]",
  ],
  [
    /mall|shop|market|store|pasar/,
    ShoppingBag,
    "bg-[#ece9f1] text-[#5f5486]",
  ],
  [/cycl|bike|sport|gym/, Bike, "bg-[#e8eee0] text-[#566b2f]"],
  [/lounge|spa|hotel|guest|stay/, Armchair, "bg-[#f2e8e2] text-[#8a6354]"],
];

/** Clay, the brand colour: what an unrecognised category falls back to. */
const FALLBACK: [LucideIcon, string] = [MapPin, "bg-clay-soft/70 text-clay"];

function lookup(category: string): [LucideIcon, string] {
  const needle = category.toLowerCase();
  const hit = ICONS.find(([pattern]) => pattern.test(needle));
  return hit ? [hit[1], hit[2]] : FALLBACK;
}

export function iconFor(category: string): LucideIcon {
  return lookup(category)[0];
}

/** Tailwind classes for the tile behind `iconFor(category)`. */
export function tintFor(category: string): string {
  return lookup(category)[1];
}

/**
 * The wallpaper version: the same symbols tiled across a whole band.
 *
 * Wherever a cover photo used to be there is now a box the photo's shape with
 * a few 28px icons floating in the middle of it, which reads as an image that
 * failed to load rather than as a choice. Tiling fills the band with something
 * still derived from the plan — three restaurants and a museum tile
 * differently from a zoo and a park — and the caller's `overflow-hidden` crops
 * the edges so it reads as a pattern that continues past them.
 *
 * Absolutely positioned: it is a background, and every caller already has a
 * relative box with real content to lay over it.
 */
export function CategoryPattern({
  categories,
  tiles = 30,
  className,
}: {
  categories: string[];
  /** Enough to overflow the band; surplus is cropped, a shortfall leaves a gap. */
  tiles?: number;
  /** Colour and opacity, which only the caller knows: this sits on clay on a card and on near-black in a hero. */
  className?: string;
}) {
  // Falls back rather than rendering nothing: a plan with no stops yet is
  // exactly the card that looks emptiest.
  const source = categories.length > 0 ? categories : ["place"];

  return (
    <div
      aria-hidden
      className={cx(
        "pointer-events-none absolute inset-0 flex flex-wrap content-center justify-center",
        className,
      )}
    >
      {Array.from({ length: tiles }, (_, index) =>
        createElement(iconFor(source[index % source.length]), {
          key: index,
          size: 30,
          strokeWidth: 1.25,
          // Nudged off the line it would otherwise sit on. A flat grid of
          // identical symbols looks like a spreadsheet; the zigzag reads as
          // something laid by hand. Columns fall where they fall, since the
          // row length depends on how wide the caller is.
          className: cx(
            "size-20 shrink-0 p-5",
            index % 2 === 0 ? "-translate-y-2" : "translate-y-2",
          ),
        }),
      )}
    </div>
  );
}

/**
 * Fills its container, the way the old photo component did, so every caller
 * keeps its existing sized wrapper and aspect ratio.
 */
export function CategoryIcon({
  category,
  size = 20,
  pattern = false,
  className,
}: {
  category: string;
  size?: number;
  /**
   * Tile the icon faintly behind itself. Off by default: in the 56px square
   * beside a search result there is no room for texture, and a pattern that
   * small is just noise. On for the few callers with a photo-shaped box to
   * fill, where a single small icon on a flat field looks like a failed image.
   */
  pattern?: boolean;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cx(
        "relative flex h-full w-full items-center justify-center overflow-hidden",
        tintFor(category),
        className,
      )}
    >
      {/* No colour of its own, so it inherits the tint's: a green park tiles
          in the park green, and adding a category to `ICONS` needs no second
          decision about what its pattern looks like. */}
      {pattern ? (
        <CategoryPattern
          categories={[category]}
          tiles={18}
          className="opacity-20"
        />
      ) : null}

      {/* `createElement` rather than binding the icon to a capitalised local
          and rendering `<Icon />`: the lint rule reads that as building a
          component mid-render. The reference is a stable module constant, but
          this says so plainly instead of arguing with the rule. */}
      <span className="relative">
        {createElement(iconFor(category), { size, strokeWidth: 1.5 })}
      </span>
    </span>
  );
}
