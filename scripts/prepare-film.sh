#!/usr/bin/env bash
# Hero film pipeline: graded Remotion render -> every asset the site uses.
#
#   scripts/prepare-film.sh <input.mp4> <start-seconds> <duration-seconds> [options]
#   scripts/prepare-film.sh videos/film/gemini_generated_video_3db71569.mp4 4 6
#
# --preview      only 3 stills (start, middle, end), the poster and its depth map
# --poster N     the frame used as the poster (default 12: the loop starts there)
# --stage S      render (Remotion only), encode (ffmpeg + depth only) or all (default)
#
# Writes to public/hero/:
#   poster-{360,540,720}.webp, poster-depth.webp
#   depth-atlas.webp          4x4 depth maps of walk frames 0,8,..,112,119 (WebGL parallax)
#   walk-1080.mp4, walk-720.mp4  the hero walk loop, desktop / phones (no audio, 0.5 s crossfade at the loop point)
#   walk-720.avif, walk-540.webp the same loop as animated images, when autoplaying video is refused
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
PREVIEW=0; POSTER=12; STAGE=all
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
mkdir -p "$OUT"
cd "$FILM"

render() {
  cp "$INPUT" public/source.mp4
  rm -rf out/poster && npx remotion render HeroWalk out/poster --sequence --frames="$POSTER" --image-format=png --props="${WALK%\}},\"grain\":0}"
  if [ "$PREVIEW" = 1 ]; then
    rm -rf out/preview
    npx remotion render HeroWalk out/preview --sequence --frames="0,$((TOTAL / 2)),$((TOTAL - 1))" --image-format=png --props="$WALK"
    return
  fi
  # the walk without baked grain: the site lays its own over it, and grain costs bits
  rm -rf out/walk && npx remotion render HeroWalk out/walk --sequence --image-format=png --props="${WALK%\}},\"grain\":0}"
  npx remotion render Ambient out/ambient-master.mp4 --codec=h264 --crf=14 --muted --props="{\"start\":0,\"duration\":$FULL}"
}

# Loops end by crossfading into their own first XF seconds and restart at XF,
# so the cut is invisible.
loop() {  # loop <input> <duration> <extra filters> <encoder args...>
  local in="$1" dur="$2" vf="$3"; shift 3
  local src=(-i "$in"); [[ "$in" == *'*'* ]] && src=(-framerate 24 -pattern_type glob -i "$in")
  "$FF" -v error -y "${src[@]}" -an -filter_complex \
    "[0]${vf}split[a][b];[a]trim=start=$XF,setpts=PTS-STARTPTS,fps=24[body];[b]trim=end=$XF,setpts=PTS-STARTPTS,fps=24[head];[body][head]xfade=transition=fade:duration=$XF:offset=$(echo "$dur - 2 * $XF" | bc)" \
    "$@"
}

encode() {
  local png; png="$(ls out/poster/*.png | head -1)"
  for w in 360 540 720; do
    "$FF" -v error -y -i "$png" -vf "scale=$w:-2:flags=lanczos" -c:v libwebp -quality 85 -preset photo "$OUT/poster-$w.webp"
  done
  "$PY" "$ROOT/scripts/depth.py" "$png" "$OUT/poster-depth.webp"
  [ "$PREVIEW" = 1 ] && return

  # The graded walk, sampled down to $FRAMES frames for the depth atlas
  ls out/walk/*.png > out/walk.txt
  local n; n=$(wc -l < out/walk.txt)
  pick() { sed -n "$(( $1 * (n - 1) / (FRAMES - 1) + 1 ))p" out/walk.txt; }

  # Depth atlas for the WebGL parallax: every 8th frame + the last.
  local atlas=""
  for k in 0 8 16 24 32 40 48 56 64 72 80 88 96 104 112 119; do atlas="$atlas $(pick "$k")"; done
  "$PY" "$ROOT/scripts/depth.py" --atlas "$OUT/depth-atlas.webp" $atlas

  # The hero loop, straight from the lossless graded frames (one encode only):
  # 1080p for desktop, 720p for phones.
  local dur; dur="$(echo "$n / 24" | bc -l)"
  loop "out/walk/*.png" "$dur" "scale=1080:1920:flags=lanczos,unsharp=5:5:0.4:5:5:0," -c:v libx264 -preset veryslow -tune film -crf 22 -pix_fmt yuv420p -movflags +faststart "$OUT/walk-1080.mp4"
  loop "out/walk/*.png" "$dur" "" -c:v libx264 -preset veryslow -tune film -crf 20 -pix_fmt yuv420p -movflags +faststart "$OUT/walk-720.mp4"
  # The same loop as animated images, for browsers that refuse autoplaying video
  # (iPhone Low Power Mode): AVIF first, WebP for older phones.
  loop "out/walk/*.png" "$dur" "" -pix_fmt yuv420p -c:v libaom-av1 -crf 26 -cpu-used 3 -row-mt 1 -f avif "$OUT/walk-720.avif"
  loop "out/walk/*.png" "$dur" "scale=540:960:flags=lanczos," -c:v libwebp_anim -quality 45 -loop 0 -preset picture "$OUT/walk-540.webp"

  # Ambient loop: the whole clip, graded, no audio.
  local amb; amb="$(echo "$(printf '%.0f' "$(echo "$FULL * 24" | bc)") / 24" | bc -l)"
  loop out/ambient-master.mp4 "$amb" "" -c:v libvpx-vp9 -b:v 0 -crf 42 -row-mt 1 "$OUT/ambient.webm"
  loop out/ambient-master.mp4 "$amb" "" -c:v libx264 -preset slow -crf 30 -pix_fmt yuv420p -movflags +faststart "$OUT/ambient.mp4"
  loop out/ambient-master.mp4 "$amb" "scale=540:-2," -c:v libx264 -preset slow -crf 31 -pix_fmt yuv420p -movflags +faststart "$OUT/ambient-540.mp4"

  du -h "$OUT"/*.* | sort -k2
}

case "$STAGE" in
  render) render ;;
  encode) encode ;;
  all) render; encode ;;
  *) echo "unknown stage $STAGE"; exit 1 ;;
esac
