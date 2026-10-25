#!/usr/bin/env python3
"""Convert the real venue photos in design/assets into web-ready WebP.

Source of truth is `design/assets/<folder>/`, which holds the originals exactly
as supplied (large PNGs). This script writes `public/venues/<slug>/<n>.webp`,
which is what the app actually serves and what `destinations.ts` points at.

Run after adding or replacing photos:

    python3 scripts/convert-venue-assets.py

GROUPS below is the only place that knows (a) which source folder maps to which
destination id, and (b) what order the photos appear in. Photo 1 is the one
used as the card cover, so order matters. Folders not listed are ignored, which
is how removed venues (sarsa, jemparingan) stay out of public/ while their
originals remain archived.

Requires Pillow: python3 -m pip install Pillow
"""

from pathlib import Path
import shutil
import sys

try:
    from PIL import Image
except ImportError:  # pragma: no cover - developer tooling
    sys.exit("Pillow is required: python3 -m pip install Pillow")

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "design" / "assets"
OUT = ROOT / "public" / "venues"

MAX_WIDTH = 1600
QUALITY = 82

# destination id -> source files, in display order (first = card cover)
GROUPS: dict[str, list[str]] = {
    "batik-workshop": ["batik_workshop/image copy.png", "batik_workshop/image.png"],
    "gembira-loka": [
        "gembira_loka/image copy.png",
        "gembira_loka/image copy 2.png",
        "gembira_loka/image.png",
    ],
    "giorno": [
        "giorno/image.png",
        "giorno/image copy 2.png",
        "giorno/image copy.png",
    ],
    "mediterranea": [
        "meddietranie/image.png",
        "meddietranie/image copy.png",
        "meddietranie/image copy 2.png",
    ],
    "nanamia": ["nanamia_piizaria/image.png", "nanamia_piizaria/image copy.png"],
    "lunion-pizza": [
        "pizza_baking/image.png",
        "pizza_baking/image copy.png",
        "pizza_baking/image copy 2.png",
    ],
    "sonobudoyo": [
        "sonobudoyo/image copy.png",
        "sonobudoyo/image copy 2.png",
        "sonobudoyo/image.png",
    ],
    "vredeburg": [
        "vredeburg/image.png",
        "vredeburg/image copy 2.png",
        "vredeburg/image copy.png",
    ],
    "mohan-burger": ["mohan/image.png", "mohan/image copy.png"],
    "ryuji": ["ryuji/image.png", "ryuji/image copy.png"],
    "jogja-art-activity": [
        "jogja_art_activity/image copy.png",
        "jogja_art_activity/image.png",
    ],
    "jogja-national-museum": [
        "jogja_national_museum/image.png",
        "jogja_national_museum/image copy 2.png",
        "jogja_national_museum/image copy.png",
    ],
    "kids-fun-parcs": ["kids_fun/image.png", "kids_fun/image copy.png"],
    "hankki-korean": [
        "hankki/image copy.png",
        "hankki/image.png",
        "hankki/image copy 2.png",
    ],
    "ibarbo-park": ["ibarbo/image.png", "ibarbo/image copy.png"],
    "hou-kie": ["hou_kie/image.png", "hou_kie/image copy.png"],
    "bpk-ola-kisat": ["ola_kisat/image.png"],
    # bpk_tesalonika/image.png is deliberately NOT listed: it carries another
    # account's watermark, so it is somebody else's photo. Archived, not served.
    "bpk-tesalonika": ["bpk_tesalonika/image copy.png"],
    "babi-toba-tabo": ["toba_tabo/image copy.png", "toba_tabo/image.png"],
}


def main() -> None:
    missing = [rel for files in GROUPS.values() for rel in files if not (SRC / rel).exists()]
    if missing:
        sys.exit("Missing source files:\n  " + "\n  ".join(missing))

    if OUT.exists():
        shutil.rmtree(OUT)

    total_in = total_out = 0
    for slug, files in GROUPS.items():
        (OUT / slug).mkdir(parents=True, exist_ok=True)
        for index, rel in enumerate(files, start=1):
            src = SRC / rel
            total_in += src.stat().st_size

            image = Image.open(src).convert("RGB")
            if image.width > MAX_WIDTH:
                height = round(image.height * MAX_WIDTH / image.width)
                image = image.resize((MAX_WIDTH, height), Image.LANCZOS)

            dst = OUT / slug / f"{index}.webp"
            image.save(dst, "WEBP", quality=QUALITY, method=6)
            total_out += dst.stat().st_size
            print(f"  {slug}/{index}.webp  {image.width}x{image.height}  <- {rel}")

    print(f"\n{total_in // 1024 // 1024} MB PNG -> {total_out // 1024} KB WebP")


if __name__ == "__main__":
    main()
