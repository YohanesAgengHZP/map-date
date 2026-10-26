#!/usr/bin/env python3
"""Convert the mood illustrations in design/assets/categories into web WebP.

Source of truth is `design/assets/categories/<name>.png`, the originals exactly
as supplied (1024px PNGs, ~800 KB each). This writes `public/moods/<mood>.webp`,
which is what the app serves and what the mood tiles on the home page point at.

Run after adding or replacing an illustration:

    python3 scripts/convert-mood-assets.py

Requires Pillow: python3 -m pip install Pillow

These are moods, not venues: there is one picture per mood, it is a drawing
rather than a photograph of anywhere, and it is served to everybody. That is
why these can exist while the app still has no venue photos — nothing here
claims to show a real place. See the data note in `types.ts`.
"""

from pathlib import Path
import shutil
import sys

try:
    from PIL import Image, ImageDraw
except ImportError:  # pragma: no cover - developer tooling
    sys.exit("Pillow is required: python3 -m pip install Pillow")

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "design" / "assets" / "categories"
OUT = ROOT / "public" / "moods"

# Wide enough for the tile at its largest (~230px) on a 2x screen.
WIDTH = 512
QUALITY = 82

# `--color-paper`. The tiles sit on it and the art is rendered `object-contain`,
# so matching it exactly is what makes the letterboxing invisible.
PAPER = (255, 253, 250)

# How far from the corner colour still counts as background. Generous enough to
# take an anti-aliased edge, tight enough to leave the art alone.
TOLERANCE = 24

# source file -> mood id in `MOODS`, which is also the served filename
MOODS = {
    "cozy.png": "cozy",
    "heritage.png": "heritage",
    "outdoor.png": "outdoorsy",
    "food.png": "foodie",
    "arts.png": "artsy",
}


def flatten_background(image: Image.Image) -> Image.Image:
    """Repaint the surrounding background `PAPER`, leaving the drawing alone.

    The originals do not agree on a backdrop: four are near-white and `food` is
    cream, which side by side in a row of five tiles reads as one tile being
    dirty. Flooding inward from the four corners only touches background that
    is actually connected to the edge, so white *inside* the drawing — the
    candle glow, the sheet of paper, the rice — keeps whatever shade it was
    drawn with.
    """
    canvas = image.copy()
    for corner in [
        (0, 0),
        (canvas.width - 1, 0),
        (0, canvas.height - 1),
        (canvas.width - 1, canvas.height - 1),
    ]:
        ImageDraw.floodfill(canvas, corner, PAPER, thresh=TOLERANCE)
    return canvas


def main() -> None:
    missing = [name for name in MOODS if not (SRC / name).exists()]
    if missing:
        sys.exit("Missing source files:\n  " + "\n  ".join(missing))

    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)

    total_in = total_out = 0
    for name, mood in MOODS.items():
        src = SRC / name
        total_in += src.stat().st_size

        image = Image.open(src).convert("RGB")
        image = flatten_background(image)
        if image.width > WIDTH:
            height = round(image.height * WIDTH / image.width)
            image = image.resize((WIDTH, height), Image.LANCZOS)

        dst = OUT / f"{mood}.webp"
        image.save(dst, "WEBP", quality=QUALITY, method=6)
        total_out += dst.stat().st_size
        print(f"  moods/{mood}.webp  {image.width}x{image.height}  <- {name}")

    print(f"\n{total_in // 1024} KB PNG -> {total_out // 1024} KB WebP")


if __name__ == "__main__":
    main()
