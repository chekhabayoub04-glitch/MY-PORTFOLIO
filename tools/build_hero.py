"""
Hero asset pipeline — Ayoub Chekhab portfolio.

Turns the studio portrait (white background) into the two layers used by the
"Shadow Reveal" hero:

  ayoub-cutout.webp  → full-colour portrait, transparent background (the light)
  ayoub-shadow.webp  → near-black silhouette with a faint rim (the shadow)

Run:
  python3 -m venv .venv-tools && .venv-tools/bin/pip install pillow numpy
  .venv-tools/bin/python tools/build_hero.py
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "images/hero/ayoub-source.png"
OUT = ROOT / "images/hero"
MARK = (255, 0, 255)
# Background pockets enclosed by the arms (not reachable from the border).
POCKETS = [(290, 900), (878, 905)]


def cutout_alpha(rgb: Image.Image) -> np.ndarray:
    """Flood-fill the white studio background from every bright border pixel."""
    probe = rgb.copy()
    w, h = probe.size
    px = np.asarray(rgb)
    seeds = [(x, 0) for x in range(0, w, 6)] + [(x, h - 1) for x in range(0, w, 6)]
    seeds += [(0, y) for y in range(0, h, 6)] + [(w - 1, y) for y in range(0, h, 6)]
    for x, y in seeds + POCKETS:
        r, g, b = px[y, x]
        if min(r, g, b) > 225 and probe.getpixel((x, y)) != MARK:
            ImageDraw.floodfill(probe, (x, y), MARK, thresh=38)

    bg = np.all(np.asarray(probe) == MARK, axis=-1)
    alpha = Image.fromarray(np.where(bg, 0, 255).astype(np.uint8))
    # Shrink 1px to kill the white halo, then feather the edge.
    alpha = alpha.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.1))
    return np.asarray(alpha)


def main() -> None:
    src = Image.open(SRC).convert("RGB")
    alpha = cutout_alpha(src)
    rgb = np.asarray(src).astype(np.float32)

    # Decontaminate edge pixels: pull white fringe towards the subject colour.
    a = alpha.astype(np.float32)[..., None] / 255.0
    edge = (a > 0) & (a < 1)
    rgb = np.where(edge, rgb * (0.55 + 0.45 * a), rgb)

    color = np.dstack([rgb.clip(0, 255).astype(np.uint8), alpha])
    Image.fromarray(color).save(OUT / "ayoub-cutout.webp", quality=90, method=6)

    # Shadow layer: crushed luminance keeps only a whisper of form + warm rim.
    lum = (rgb @ np.array([0.299, 0.587, 0.114], dtype=np.float32))[..., None]
    shadow = (lum / 255.0) ** 2.8 * 22.0
    rim = np.asarray(Image.fromarray(alpha).filter(ImageFilter.FIND_EDGES)
                     .filter(ImageFilter.GaussianBlur(2.5))).astype(np.float32)[..., None]
    warm = np.array([255, 196, 0], dtype=np.float32) * (rim / 255.0) * 0.35
    shadow_rgb = (np.repeat(shadow, 3, axis=-1) + warm + 6).clip(0, 255).astype(np.uint8)
    Image.fromarray(np.dstack([shadow_rgb, alpha])).save(
        OUT / "ayoub-shadow.webp", quality=88, method=6)

    kept = (alpha > 0).mean() * 100
    print(f"cutout ready — subject covers {kept:.1f}% of the frame")


if __name__ == "__main__":
    main()
