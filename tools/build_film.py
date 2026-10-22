"""
Hero film builder: turns Ayoub's walk-in video into scroll-scrubbed frames.

Drop the edited video in videos/film/ (any of .mp4 .mov .m4v .webm), then run:
  .venv-tools/bin/python tools/build_film.py [--frames 120] [--focus 0.5]

A landscape clip becomes images/film/desktop/NNN.webp (16:9) and
images/film/mobile/NNN.webp (9:16), centre-cropped around --focus
(0 = left edge, 1 = right edge). A vertical clip is kept whole: the desktop
page shows it as a tall centre panel, so both sets keep the 9:16 frame.
images/film/film.json tells js/noir/film.js which kind it is. Frames are
sampled evenly over the whole clip, so the last frame is its last shot (the smile).
"""
import argparse
import json
import shutil
import subprocess
import tempfile
from pathlib import Path

import imageio_ffmpeg
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = ROOT / "videos/film"
OUT = ROOT / "images/film"
LANDSCAPE = {"desktop": (1280, 720, 70), "mobile": (540, 960, 68)}   # width, height, webp quality
PORTRAIT = {"desktop": (720, 1280, 72), "mobile": (540, 960, 68)}


def find_source() -> Path:
    clips = sorted(p for p in SRC_DIR.iterdir() if p.suffix.lower() in {".mp4", ".mov", ".m4v", ".webm"})
    if not clips:
        raise SystemExit(f"No video found in {SRC_DIR.relative_to(ROOT)}/ — add your clip there first.")
    return clips[0]


def cover(img: Image.Image, w: int, h: int, focus: float) -> Image.Image:
    scale = max(w / img.width, h / img.height)
    img = img.resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS)
    left = round((img.width - w) * focus)
    top = round((img.height - h) * .35)   # keep the face: bias the crop towards the top
    return img.crop((left, top, left + w, top + h))


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--frames", type=int, default=0, help="default: every frame, up to 240")
    ap.add_argument("--focus", type=float, default=.5)
    args = ap.parse_args()

    src = find_source()
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    nframes, duration = imageio_ffmpeg.count_frames_and_secs(str(src))
    args.frames = args.frames or min(nframes, 240)
    fps = args.frames / duration
    print(f"{src.name}: {nframes} frames, {duration:.1f}s → {args.frames} scrub frames")

    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run([ffmpeg, "-loglevel", "error", "-i", str(src), "-vf", f"fps={fps:.5f}",
                        "-frames:v", str(args.frames), "-q:v", "2", f"{tmp}/%04d.jpg"], check=True)
        stills = sorted(Path(tmp).glob("*.jpg"))
        first = Image.open(stills[0])
        portrait = first.height > first.width
        targets = PORTRAIT if portrait else LANDSCAPE
        if OUT.exists():
            shutil.rmtree(OUT)
        for name, (w, h, q) in targets.items():
            (OUT / name).mkdir(parents=True)
            for i, still in enumerate(stills):
                cover(Image.open(still).convert("RGB"), w, h, args.focus).save(
                    OUT / name / f"{i:03d}.webp", quality=q, method=6)
            size = sum(f.stat().st_size for f in (OUT / name).iterdir())
            print(f"✓ {name}: {len(stills)} frames, {size / 1e6:.1f} MB")

    (OUT / "film.json").write_text(json.dumps({
        "frames": len(stills),
        "duration": round(duration, 2),
        "portrait": portrait,
    }))
    print("✓ images/film/film.json — bump ?v= in index.html and deploy")


if __name__ == "__main__":
    main()
