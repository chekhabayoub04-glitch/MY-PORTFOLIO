"""
Depth map for the hero's WebGL parallax (Depth Anything V2 Small, MPS on Apple Silicon).

  .venv-tools/bin/python scripts/depth.py <image> <out.webp>

Writes a grayscale WebP the same size as the image: white = near (Ayoub),
black = far (the street). The first run downloads the model (~100 MB) into
the Hugging Face cache.
"""
import sys

import numpy as np
import torch
from PIL import Image, ImageFilter
from transformers import pipeline


def main() -> None:
    src, out = sys.argv[1], sys.argv[2]
    device = "mps" if torch.backends.mps.is_available() else "cpu"
    estimate = pipeline("depth-estimation", model="depth-anything/Depth-Anything-V2-Small-hf", device=device)
    img = Image.open(src).convert("RGB")
    depth = np.asarray(estimate(img)["predicted_depth"].squeeze().cpu(), dtype=np.float32)
    lo, hi = np.percentile(depth, [1, 99])
    depth = np.clip((depth - lo) / (hi - lo), 0, 1)
    gray = Image.fromarray((depth * 255).astype(np.uint8)).resize(img.size, Image.BICUBIC)
    # A light blur stops the shader from tearing at hard silhouette edges.
    gray.filter(ImageFilter.GaussianBlur(2)).save(out, "WEBP", quality=80)
    print(f"{out}: {gray.size[0]}x{gray.size[1]} on {device}")


if __name__ == "__main__":
    main()
