#!/usr/bin/env bash
# Hero film pipeline: graded Remotion render -> every asset the site uses.
#
#   scripts/prepare-film.sh <input.mp4> <start-seconds> <duration-seconds> [--preview] [--poster N]
#   scripts/prepare-film.sh videos/film/gemini_generated_video_3db71569.mp4 4 6
#
# --preview  only renders 3 stills (start, middle, end), the poster and its depth map.
# --poster N the frame of the scrub range used as the poster (default 128).
#
# Writes to public/hero/:
#   frames/f_001..f_120.webp  scroll-scrub frames (graded, 720x1280, no upscaling)
#   poster-720.webp, poster-480.webp, poster-depth.webp
#   walk-720.mp4              mobile hero loop (no audio)
#   ambient.webm, ambient.mp4 desktop background loop (full clip, graded)
#   ambient-540.mp4           phone background loop
#   reel.mp4                  the original clip with sound, for the reel modal
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FILM="$ROOT/hero-film"
OUT="$ROOT/public/hero"
PY="$ROOT/.venv-tools/bin/python"
FF="$("$PY" -c 'import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())' 2>/dev/null)"
FRAMES=120

[ $# -ge 3 ] || { sed -n 2,8p "$0"; exit 1; }
INPUT="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"; START="$2"; DURATION="$3"; shift 3
PREVIEW=0; POSTER=128
while [ $# -gt 0 ]; do
  case "$1" in
    --preview) PREVIEW=1 ;;
    --poster) POSTER="$2"; shift ;;
    *) echo "unknown option $1"; exit 1 ;;
  esac
  shift
done

TOTAL=$(( $(printf '%.0f' "$(echo "$DURATION * 24" | bc)") ))
# (ffmpeg -i without an output exits 1, so don't let pipefail stop here)
FULL="$({ "$FF" -i "$INPUT" 2>&1 || true; } | sed -n 's/.*Duration: \([0-9:.]*\).*/\1/p' | awk -F: '{print $1*3600+$2*60+$3}')"
WALK="{\"start\":$START,\"duration\":$DURATION}"
mkdir -p "$OUT/frames"
cp "$INPUT" "$FILM/public/source.mp4"
cd "$FILM"

poster() {
  npx remotion render HeroWalk out/poster --sequence --frames="$POSTER" --image-format=png --props="$WALK" >/dev/null
  local png; png="$(ls out/poster/element-*"$POSTER".png | head -1)"
  "$FF" -v error -y -i "$png" -c:v libwebp -quality 80 "$OUT/poster-720.webp"
  "$FF" -v error -y -i "$png" -vf scale=480:-2 -c:v libwebp -quality 78 "$OUT/poster-480.webp"
  "$PY" "$ROOT/scripts/depth.py" "$png" "$OUT/poster-depth.webp"
}

if [ "$PREVIEW" = 1 ]; then
  rm -rf out/preview
  npx remotion render HeroWalk out/preview --sequence --frames="0,$((TOTAL / 2)),$((TOTAL - 1))" --image-format=png --props="$WALK" >/dev/null
  poster
  echo "Preview stills in $FILM/out/preview, poster + depth in $OUT"
  exit 0
fi

# 1) Graded walk as a PNG sequence, sampled down to $FRAMES WebP frames.
rm -rf out/walk "$OUT/frames"/*.webp
npx remotion render HeroWalk out/walk --sequence --image-format=png --props="$WALK"
ls out/walk/*.png > out/walk.txt
N=$(wc -l < out/walk.txt)
for i in $(seq 0 $((FRAMES - 1))); do
  src="$(sed -n "$(( i * (N - 1) / (FRAMES - 1) + 1 ))p" out/walk.txt)"
  "$FF" -v error -y -i "$src" -c:v libwebp -quality 72 "$OUT/frames/f_$(printf %03d $((i + 1))).webp"
done

# 2) Poster + depth map.
poster

# 3) Mobile loop from the same graded frames.
"$FF" -v error -y -framerate 24 -pattern_type glob -i 'out/walk/*.png' \
  -c:v libx264 -preset slow -crf 28 -pix_fmt yuv420p -movflags +faststart "$OUT/walk-720.mp4"

# 4) Ambient loop: the whole clip, graded, no audio.
npx remotion render Ambient out/ambient-master.mp4 --codec=h264 --crf=14 --muted --props="{\"start\":0,\"duration\":$FULL}"
"$FF" -v error -y -i out/ambient-master.mp4 -an -c:v libvpx-vp9 -b:v 0 -crf 42 -row-mt 1 "$OUT/ambient.webm"
"$FF" -v error -y -i out/ambient-master.mp4 -an -c:v libx264 -preset slow -crf 30 -pix_fmt yuv420p -movflags +faststart "$OUT/ambient.mp4"
"$FF" -v error -y -i out/ambient-master.mp4 -an -vf scale=540:-2 -c:v libx264 -preset slow -crf 31 -pix_fmt yuv420p -movflags +faststart "$OUT/ambient-540.mp4"

# 5) The reel modal plays the untouched original, with sound.
"$FF" -v error -y -i "$INPUT" -c copy -movflags +faststart "$OUT/reel.mp4"

du -h "$OUT"/*.* | sort -k2
echo "frames: $(ls "$OUT/frames" | wc -l | tr -d ' ') ($(du -sh "$OUT/frames" | cut -f1))"
