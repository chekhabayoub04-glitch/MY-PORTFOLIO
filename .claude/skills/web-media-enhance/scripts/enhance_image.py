"""Enhance a low-quality photo for the portfolio site and export web-ready files.

Pipeline:  load -> (optional) gentle auto-tone -> AI super-resolution (Real-ESRGAN via
spandrel) when the source is smaller than the target -> Lanczos down to the target ->
light unsharp mask -> WebP + AVIF at each requested width (never upscaled past --max).

Originals are never modified. Output goes to images/opt/<slug>-<width>.<ext> by default,
the same naming the site's srcset already uses (see tools/optimize_images.py).

Examples
--------
python enhance_image.py images/logo3.jpg
python enhance_image.py images/*.jpg --widths 800 1600 --tone
python enhance_image.py art.png --model anime --max 2400 --out-dir images/opt
python enhance_image.py photo.jpg --no-ai          # classic sharpen/resize only
"""
import argparse
import os
import re
import sys
import urllib.request
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter, ImageOps

MODELS = {
    "photo": ("RealESRGAN_x4plus.pth",
              "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth"),
    "anime": ("RealESRGAN_x4plus_anime_6B.pth",
              "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.2.4/RealESRGAN_x4plus_anime_6B.pth"),
}
MODELS_DIR = Path(__file__).resolve().parent.parent / "models"


def slug(p: Path) -> str:
    return re.sub(r"[^a-z0-9]+", "-", p.stem.lower()).strip("-")


def load_model(name: str, device_pref: str):
    import torch
    from spandrel import ModelLoader
    fname, url = MODELS[name]
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    path = MODELS_DIR / fname
    if not path.exists():
        print(f"downloading {name} weights -> {path}")
        urllib.request.urlretrieve(url, path)
    if device_pref == "auto":
        if torch.cuda.is_available():
            device = "cuda"
        elif getattr(torch.backends, "mps", None) and torch.backends.mps.is_available():
            device = "mps"
        else:
            device = "cpu"
    else:
        device = device_pref
    model = ModelLoader().load_from_file(str(path)).to(device).eval()
    print(f"model: {name} ({model.scale}x) on {device}")
    return model, device


def sr(img: Image.Image, model, device, tile=384, overlap=24) -> Image.Image:
    """One tiled, feather-blended super-resolution pass."""
    import torch
    a = np.asarray(img.convert("RGB")).copy()
    H, W, _ = a.shape
    s = model.scale
    out = np.zeros((H * s, W * s, 3), np.float32)
    acc = np.zeros((H * s, W * s, 1), np.float32)
    step = max(1, tile - overlap)
    ys = sorted(set(list(range(0, H, step)) + [max(0, H - tile)]))
    xs = sorted(set(list(range(0, W, step)) + [max(0, W - tile)]))
    with torch.inference_mode():
        for y in ys:
            for x in xs:
                y1, x1 = min(y + tile, H), min(x + tile, W)
                y0, x0 = max(0, y1 - tile), max(0, x1 - tile)
                t = torch.from_numpy(a[y0:y1, x0:x1]).permute(2, 0, 1)[None].float().div_(255).to(device)
                r = model(t).clamp_(0, 1)[0].permute(1, 2, 0).cpu().numpy()
                ph, pw = r.shape[:2]
                wy = np.minimum(np.arange(ph), np.arange(ph)[::-1]) + 1
                wx = np.minimum(np.arange(pw), np.arange(pw)[::-1]) + 1
                f = np.minimum.outer(wy, wx).astype(np.float32)[..., None]
                out[y0 * s:y0 * s + ph, x0 * s:x0 * s + pw] += r * f
                acc[y0 * s:y0 * s + ph, x0 * s:x0 * s + pw] += f
    out /= np.maximum(acc, 1e-6)
    return Image.fromarray((out * 255 + 0.5).clip(0, 255).astype(np.uint8))


def auto_tone(img: Image.Image, strength=0.6) -> Image.Image:
    """Gentle 0.5% contrast stretch blended with the original (keeps the mood)."""
    toned = ImageOps.autocontrast(img, cutoff=0.5, preserve_tone=True)
    return Image.blend(img, toned, strength)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("src", nargs="+", type=Path)
    ap.add_argument("--out-dir", type=Path, default=Path("images/opt"))
    ap.add_argument("--widths", type=int, nargs="+", default=[800, 1600])
    ap.add_argument("--max", type=int, default=0, help="largest width to produce (default: max of --widths)")
    ap.add_argument("--model", choices=list(MODELS), default="photo",
                    help="photo (default) or anime for logos/illustrations/flat graphics")
    ap.add_argument("--no-ai", action="store_true", help="skip super-resolution (resize + sharpen only)")
    ap.add_argument("--tone", action="store_true", help="apply gentle auto-contrast before upscaling")
    ap.add_argument("--sharpen", type=float, default=60, help="unsharp percent, 0 to disable (default 60)")
    ap.add_argument("--webp-q", type=int, default=82)
    ap.add_argument("--avif-q", type=int, default=60)
    ap.add_argument("--no-avif", action="store_true")
    ap.add_argument("--device", choices=["auto", "cuda", "mps", "cpu"], default="auto")
    args = ap.parse_args()

    target = args.max or max(args.widths)
    args.out_dir.mkdir(parents=True, exist_ok=True)
    model = device = None

    for src in args.src:
        img = ImageOps.exif_transpose(Image.open(src)).convert("RGB")
        w, h = img.size
        print(f"\n{src}  {w}x{h}")
        if args.tone:
            img = auto_tone(img)
        if w < target and not args.no_ai:
            if model is None:
                model, device = load_model(args.model, args.device)
            while img.width < target:
                img = sr(img, model, device)
                print(f"  super-resolved -> {img.width}x{img.height}")
        for width in sorted(set(args.widths)):
            width = min(width, target)
            out = img.resize((width, round(img.height * width / img.width)), Image.LANCZOS) \
                if img.width != width else img.copy()
            if args.sharpen > 0:
                out = out.filter(ImageFilter.UnsharpMask(radius=1.2, percent=int(args.sharpen), threshold=2))
            base = args.out_dir / f"{slug(src)}-{width}"
            out.save(f"{base}.webp", "WEBP", quality=args.webp_q, method=6)
            msg = f"  {base}.webp {os.path.getsize(f'{base}.webp') // 1024}KB"
            if not args.no_avif:
                out.save(f"{base}.avif", "AVIF", quality=args.avif_q)
                msg += f"  .avif {os.path.getsize(f'{base}.avif') // 1024}KB"
            print(msg)


if __name__ == "__main__":
    sys.exit(main())
