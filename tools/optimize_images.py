"""
Home-page image optimiser — writes responsive WebP copies to images/opt/.

Each source gets <slug>-800.webp and <slug>-1600.webp (never upscaled), used by
the home page through srcset so phones download ~5x less than desktops.

Run:
  .venv-tools/bin/python tools/optimize_images.py
"""
import re
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "images/opt"
WIDTHS = (800, 1600)
SOURCES = [
    "images/service-web.png", "images/graphic-campaigns-cover.png", "images/service-logo.jpg",
    "images/university.jpg", "images/titangym.jpg", "images/april4.png",
    "images/project-drbadis.jpg", "images/rozan6.jpg", "images/Modern promotional website.jpg",
    "images/logo3.jpg", "images/graphic4.jpg", "images/logo4.jpg", "images/logo6.jpg",
    "videos/posters/01-clothing-brand.png", "videos/posters/04-car-brand.png",
    "images/graphic1.jpg", "images/graphic7.jpg", "images/rozan8.jpg", "images/logo8.jpg",
    "images/april3.png", "images/april5.png", "images/rozan7.jpg",
    "images/logo2.jpg", "images/logo5.jpg", "images/logo7.jpg",
    "videos/posters/02-glass-brand.png", "videos/posters/03-villa-home-brand.png",
]
SITE_SHOTS = ROOT / "images/sites/raw"   # written by tools/capture_sites.mjs


def slug(path: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", Path(path).stem.lower()).strip("-")


def main() -> None:
    OUT.mkdir(exist_ok=True)
    before = after = 0
    for rel in SOURCES:
        src = ROOT / rel
        before += src.stat().st_size
        img = Image.open(src)
        img = img.convert("RGBA" if img.mode in ("RGBA", "LA", "P") else "RGB")
        for w in WIDTHS:
            target = min(w, img.width)
            h = round(img.height * target / img.width)
            dst = OUT / f"{slug(rel)}-{w}.webp"
            img.resize((target, h), Image.LANCZOS).save(dst, quality=82, method=6)
            if w == 1600:
                after += dst.stat().st_size
        print(f"✓ {rel} → {slug(rel)}-{{800,1600}}.webp")
    # Live-site screenshots → 1600px-wide, top 3200px, for the browser frame
    for shot in sorted(SITE_SHOTS.glob("*.png")):
        img = Image.open(shot).convert("RGB")
        img = img.resize((1600, round(img.height * 1600 / img.width)), Image.LANCZOS)
        img.crop((0, 0, 1600, min(img.height, 3200))).save(
            ROOT / "images/sites" / f"{shot.stem}.webp", quality=80, method=6)
        print(f"✓ site {shot.stem}.webp")
    print(f"\n{before / 1e6:.1f} MB → {after / 1e6:.1f} MB at full size")


if __name__ == "__main__":
    main()
