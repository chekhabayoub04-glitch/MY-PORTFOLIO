"""
Depth maps for the hero's WebGL parallax (Depth Anything V2 Small, MPS on Apple Silicon).

  .venv-tools/bin/python scripts/depth.py <image> <out.webp>
  .venv-tools/bin/python scripts/depth.py --atlas <out.webp> <frame> <frame> ... (16 frames)

White = near (Ayoub), black = far (the street). The single mode writes a map
the size of the image. The atlas mode packs 16 maps, 180x320 each, into one
4x4 sheet (720x1280) that the shader blends between as the scrub moves.
The first run downloads the model (~100 MB) into the Hugging Face cache.
"""
import sys

import numpy as np
import torch
from PIL import Image, ImageFilter
from transformers import pipeline

TILE = (180, 320)


def depth_map(estimate, path: str, size: tuple) -> Image.Image:
    img = Image.open(path).convert("RGB")
    depth = np.asarray(estimate(img)["predicted_depth"].squeeze().cpu(), dtype=np.float32)
    lo, hi = np.percentile(depth, [1, 99])
    depth = np.clip((depth - lo) / (hi - lo), 0, 1)
    gray = Image.fromarray((depth * 255).astype(np.uint8)).resize(size or img.size, Image.BICUBIC)
    # A light blur stops the shader from tearing at hard silhouette edges.
    return gray.filter(ImageFilter.GaussianBlur(2 if size is None else 1))


def main() -> None:
    device = "mps" if torch.backends.mps.is_available() else "cpu"
    estimate = pipeline("depth-estimation", model="depth-anything/Depth-Anything-V2-Small-hf", device=device)
    if sys.argv[1] == "--atlas":
        out, frames = sys.argv[2], sys.argv[3:]
        if len(frames) != 16:
            raise SystemExit("the atlas needs exactly 16 frames")
        sheet = Image.new("L", (TILE[0] * 4, TILE[1] * 4))
        for i, path in enumerate(frames):
            sheet.paste(depth_map(estimate, path, TILE), ((i % 4) * TILE[0], (i // 4) * TILE[1]))
        sheet.save(out, "WEBP", quality=80)
    else:
        out = sys.argv[2]
        depth_map(estimate, sys.argv[1], None).save(out, "WEBP", quality=80)
    print(f"{out} on {device}")


if __name__ == "__main__":
    main()
