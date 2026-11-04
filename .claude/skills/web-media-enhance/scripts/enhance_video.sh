#!/usr/bin/env bash
# Clean up a low-quality clip and export web-ready versions + a poster.
#
# Usage: enhance_video.sh <input> [out_dir] [height]
#   out_dir  default: videos/web
#   height   target height in px, default 1080 (use 720 for background/hero loops)
# Env:
#   KEEP_AUDIO=1   keep the audio track (default: removed, for muted autoplay loops)
#   CRF=22         H.264 quality (lower = better/larger)
#   AV1=1          also write an AV1 .webm (smaller, slower to encode)
#   DENOISE=2      hqdn3d strength 0..6 (0 = off)
#
# Filters: hqdn3d (denoise compression noise) -> lanczos scale -> unsharp (restore
# edges) -> eq (slight contrast/saturation lift). Never overwrites the input.
set -euo pipefail
IN="$1"; OUT_DIR="${2:-videos/web}"; HEIGHT="${3:-1080}"
CRF="${CRF:-22}"; DN="${DENOISE:-2}"
mkdir -p "$OUT_DIR"
NAME="$(basename "${IN%.*}" | tr '[:upper:] ' '[:lower:]-')"

VF="scale=-2:${HEIGHT}:flags=lanczos,unsharp=5:5:0.6:5:5:0.0,eq=contrast=1.04:saturation=1.06,format=yuv420p"
[ "$DN" != "0" ] && VF="hqdn3d=${DN}:${DN}:$((DN*3)):$((DN*3)),${VF}"
AUDIO=(-an); [ "${KEEP_AUDIO:-0}" = "1" ] && AUDIO=(-c:a aac -b:a 128k)

echo ">> H.264 MP4 (${HEIGHT}p, crf ${CRF})"
ffmpeg -hide_banner -loglevel error -y -i "$IN" -vf "$VF" \
  -c:v libx264 -preset slow -crf "$CRF" -profile:v high -movflags +faststart "${AUDIO[@]}" \
  "$OUT_DIR/$NAME.mp4"

if [ "${AV1:-0}" = "1" ]; then
  echo ">> AV1 WebM"
  SVT_LOG=1 ffmpeg -hide_banner -loglevel error -y -i "$IN" -vf "$VF" \
    -c:v libsvtav1 -preset 6 -crf 34 "${AUDIO[@]/aac/libopus}" "$OUT_DIR/$NAME.webm"
fi

echo ">> poster"
ffmpeg -hide_banner -loglevel error -y -ss 1 -i "$IN" -frames:v 1 -vf "$VF" -c:v libwebp -quality 82 \
  "$OUT_DIR/$NAME-poster.webp"

ls -la "$OUT_DIR" | grep "$NAME"
cat <<EOF

<video autoplay muted loop playsinline preload="metadata" poster="$OUT_DIR/$NAME-poster.webp">
$( [ "${AV1:-0}" = "1" ] && echo "  <source src=\"$OUT_DIR/$NAME.webm\" type=\"video/webm; codecs=av01.0.08M.08\">")
  <source src="$OUT_DIR/$NAME.mp4" type="video/mp4">
</video>
EOF
