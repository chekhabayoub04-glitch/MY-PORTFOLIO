#!/usr/bin/env bash
# Hero film pipeline: graded Remotion render -> every asset the site uses.
#
#   scripts/prepare-film.sh <input.mp4> <start-seconds> <duration-seconds> [options]
#   scripts/prepare-film.sh videos/film/gemini_generated_video_3db71569.mp4 4 6
#
# --preview      only 3 stills (start, middle, end), the poster and its depth map
# --poster N     the frame of the scrub range used as the poster (default 128)
# --stage S      render (Remotion only), encode (ffmpeg + depth only) or all (default)
#
# Writes to public/hero/:
#   frames/f_001..f_120.webp  scroll-scrub frames (graded, 720x1280, no upscaling)
#   poster-{360,540,720}.webp, poster-depth.webp
#   depth-atlas.webp          4x4 depth maps of scrub frames 0,8,..,112,119
#   walk-720.mp4              mobile hero loop (no audio, 0.5 s crossfade at the loop point)
#   ambient.webm, ambient.mp4 desktop background loop (full clip, graded, crossfaded)
#   ambient-540.mp4           phone background loop
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FILM="$ROOT/hero-film"
OUT="$ROOT/public/hero"
PY="$ROOT/.venv-tools/bin/python"
FF="$("$PY" -c 'import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())' 2>/dev/null)"
FRAMES=120
XF=0.5   # loop crossfade, seconds

[ $# -ge 3 ] || { sed -n 2,10p "$0"; exit 1; }
INPUT="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"; START="$2"; DURATION="$3"; shift 3
PREVIEW=0; POSTER=128; STAGE=all
while [ $# -gt 0 ]; do
  case "$1" in
    --preview) PREVIEW=1 ;;
    --poster) POSTER="$2"; shift ;;
    --stage) STAGE="$2"; shift ;;
    *) echo "unknown option $1"; exit 1 ;;
  esac
  shift
done

TOTAL=$(printf '%.0f' "$(echo "$DURATION * 24" | bc)")
# (ffmpeg -i without an output exits 1, so don't let pipefail stop here)
FULL="$({ "$FF" -i "$INPUT" 2>&1 || true; } | sed -n 's/.*Duration: \([0-9:.]*\).*/\1/p' | awk -F: '{print $1*3600+$2*60+$3}')"
WALK="{\"start\":$START,\"duration\":$DURATION}"
mkdir -p "$OUT/frames"
cd "$FILM"

render() {
  cp "$INPUT" public/source.mp4
  rm -rf out/poster && npx remotion render HeroWalk out/poster --sequence --frames="$POSTER" --image-format=png --props="$WALK"
  if [ "$PREVIEW" = 1 ]; then
    rm -rf out/preview
    npx remotion render HeroWalk out/preview --sequence --frames="0,$((TOTAL / 2)),$((TOTAL - 1))" --image-format=png --props="$WALK"
    return
  fi
  rm -rf out/walk && npx remotion render HeroWalk out/walk --sequence --image-format=png --props="$WALK"
  npx remotion render Ambient out/ambient-master.mp4 --codec=h264 --crf=14 --muted --props="{\"start\":0,\"duration\":$FULL}"
}

# Loops end by crossfading into their own first XF seconds and restart at XF,
# so the cut is invisible.
loop() {  # loop <input> <duration> <extra filters> <encoder args...>
  local in="$1" dur="$2" vf="$3"; shift 3
  "$FF" -v error -y -i "$in" -an -filter_complex \
    "[0]${vf}split[a][b];[a]trim=start=$XF,setpts=PTS-STARTPTS,fps=24[body];[b]trim=end=$XF,setpts=PTS-STARTPTS,fps=24[head];[body][head]xfade=transition=fade:duration=$XF:offset=$(echo "$dur - 2 * $XF" | bc)" \
    "$@"
}

encode() {
  local png; png="$(ls out/poster/*.png | head -1)"
  for w in 360 540 720; do
    "$FF" -v error -y -i "$png" -vf "scale=$w:-2:flags=lanczos" -c:v libwebp -quality 80 -preset photo "$OUT/poster-$w.webp"
  done
  "$PY" "$ROOT/scripts/depth.py" "$png" "$OUT/poster-depth.webp"
  [ "$PREVIEW" = 1 ] && return

  # 1) Graded walk sampled down to $FRAMES WebP frames (q80 keeps the grain, so no banding).
  rm -f "$OUT/frames"/*.webp
  ls out/walk/*.png > out/walk.txt
  local n; n=$(wc -l < out/walk.txt)
  pick() { sed -n "$(( $1 * (n - 1) / (FRAMES - 1) + 1 ))p" out/walk.txt; }
  # A frame over 45 KB steps down to q76, then q72.
  for i in $(seq 0 $((FRAMES - 1))); do
    local f; f="$OUT/frames/f_$(printf %03d $((i + 1))).webp"
    for q in 80 76 72; do
      "$FF" -v error -y -i "$(pick "$i")" -c:v libwebp -quality "$q" -preset photo -compression_level 6 "$f"
      [ "$(wc -c < "$f")" -le 46080 ] && break
    done
  done

  # 2) Depth atlas for the scrub: every 8th frame + the last.
  local atlas=""
  for k in 0 8 16 24 32 40 48 56 64 72 80 88 96 104 112 119; do atlas="$atlas $(pick "$k")"; done
  "$PY" "$ROOT/scripts/depth.py" --atlas "$OUT/depth-atlas.webp" $atlas

  # 3) Mobile loop from the same graded frames.
  "$FF" -v error -y -framerate 24 -pattern_type glob -i 'out/walk/*.png' -c:v libx264 -crf 12 -pix_fmt yuv420p out/walk-master.mp4
  loop out/walk-master.mp4 "$(echo "$n / 24" | bc -l)" "" -c:v libx264 -preset slow -crf 28 -pix_fmt yuv420p -movflags +faststart "$OUT/walk-720.mp4"

  # 4) Ambient loop: the whole clip, graded, no audio.
  local amb; amb="$(echo "$(printf '%.0f' "$(echo "$FULL * 24" | bc)") / 24" | bc -l)"
  loop out/ambient-master.mp4 "$amb" "" -c:v libvpx-vp9 -b:v 0 -crf 42 -row-mt 1 "$OUT/ambient.webm"
  loop out/ambient-master.mp4 "$amb" "" -c:v libx264 -preset slow -crf 30 -pix_fmt yuv420p -movflags +faststart "$OUT/ambient.mp4"
  loop out/ambient-master.mp4 "$amb" "scale=540:-2," -c:v libx264 -preset slow -crf 31 -pix_fmt yuv420p -movflags +faststart "$OUT/ambient-540.mp4"

  du -h "$OUT"/*.* | sort -k2
  echo "frames: $(ls "$OUT/frames" | wc -l | tr -d ' ') ($(du -sh "$OUT/frames" | cut -f1)), largest $(ls -S "$OUT/frames" | head -1) $(du -k "$OUT/frames/$(ls -S "$OUT/frames" | head -1)" | cut -f1) KB"
}

case "$STAGE" in
  render) render ;;
  encode) encode ;;
  all) render; encode ;;
  *) echo "unknown stage $STAGE"; exit 1 ;;
esac
