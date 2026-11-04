---
name: web-media-enhance
description: Enhance low-quality photos and videos for the portfolio website — AI upscale (Real-ESRGAN), sharpen, gentle auto-tone, denoise video, then export fast web files (WebP/AVIF srcset, H.264/AV1 + poster). Use whenever the user says a picture or video is blurry, pixelated, low-res, "رديئة", "حسّن الصورة", "photo enhancer", "upscale", "make it HD/4K", or wants media ready for the site.
---

# Web Media Enhance (portfolio)

Entry point for "my images/videos look bad on the site". It chains the other installed skills
and two bundled scripts. **Never overwrite originals** — write to `images/opt/` or `videos/web/`.

## 0. Setup (once per machine)
```bash
python -m venv .venv-tools
.venv-tools/bin/pip install torch spandrel pillow numpy   # NVIDIA: install CUDA torch first (pytorch.org)
```
`ffmpeg` is required for video. Model weights (~65 MB) auto-download into
`.claude/skills/web-media-enhance/models/` (git-ignored) on first AI run.

## 1. Inspect before touching anything
For each file report size, format, and visible problems (blur, JPEG blocks, noise, colour cast,
too dark). `python -c "from PIL import Image;im=Image.open('x');print(im.size,im.mode)"` /
`ffprobe -v error -show_entries stream=width,height,codec_name,bit_rate -of csv <video>`.
Pick the content type: **photo** (people, places, products) vs **graphic** (logos, flat
illustrations, text) — graphics use `--model anime`, which keeps lines clean.

## 2. Photos
```bash
.venv-tools/bin/python .claude/skills/web-media-enhance/scripts/enhance_image.py images/x.jpg --tone
```
- Upscales with Real-ESRGAN only when the source is narrower than the largest width (default 1600).
- Writes `images/opt/<slug>-800.webp/.avif` and `-1600.*` — the same names the site's `srcset` uses.
- Flags: `--widths 800 1600 2400`, `--model anime`, `--no-ai`, `--sharpen 0..150`, `--no-avif`.
- Colour cast (yellow indoor light, blue tint) → run the `auto-white-balance` skill first.
- Very dark/flat → `--tone`, or the `auto-tone` skill (`punch`, strength 0.7) for more control.
- Need print/poster size instead of web → `upscale-for-print` skill. Have Upscayl installed
  with a GPU → `upscale-image` skill is faster. Big mixed folders → `web-ready` skill.

## 3. Videos
```bash
bash .claude/skills/web-media-enhance/scripts/enhance_video.sh videos/source/clip.mp4 videos/web 1080
```
Denoise → Lanczos scale → unsharp → slight contrast/saturation → H.264 faststart MP4 (+ AV1
WebM with `AV1=1`) + WebP poster, and prints a ready `<video>` tag. Background/hero loops:
height 720, no audio (default). Showreels with sound: `KEEP_AUDIO=1`.
True AI video upscaling (frame-by-frame Real-ESRGAN) is very slow without a GPU — offer it only
for short clips, by extracting frames with ffmpeg, running `enhance_image.py --no-avif` on them,
and re-encoding.

## 4. Verify (mandatory)
- Compare before/after side-by-side at 100% crop on faces, text and edges; show the user.
- Watch for AI artefacts: plastic skin, invented letters in logos/text, halos from over-sharpening.
  If text gets mangled, re-run with `--no-ai` or use the original vector/logo file.
- Check sizes: hero images < 300 KB at 1600w, cards < 120 KB at 800w, loop videos < 3 MB.
- Then wire into HTML with `<picture>` (AVIF → WebP) + `srcset` + `width/height` + `loading="lazy"`
  (except the hero), and follow the `pro-portfolio` skill to test and deploy.

## Honest limits
AI upscaling reconstructs *plausible* detail; it cannot recover a face or text that is not in the
pixels. Beyond ~4× the result looks clean but "painted". Always prefer a better original if one exists.
