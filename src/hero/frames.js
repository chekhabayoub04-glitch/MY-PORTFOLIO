// Progressive frame loader + canvas drawer for the scroll-scrubbed walk.
// Order: first and last frame, then every 8th, every 4th, every 2nd, all.
// Scrubbing works as soon as the coarse pass is in and sharpens as the rest
// arrive; a missing frame is drawn as its nearest loaded neighbour, so the
// canvas is never blank.

export const FRAME_COUNT = 120;
const src = i => `/hero/frames/f_${String(i + 1).padStart(3, '0')}.webp`;

export function createFrames(count = FRAME_COUNT) {
  const images = new Array(count);
  const ready = new Uint8Array(count);
  let loaded = 0;
  let onLoad = () => {};

  const order = [];
  const queued = new Uint8Array(count);
  const push = i => { if (!queued[i]) { queued[i] = 1; order.push(i); } };
  push(0); push(count - 1);
  for (const step of [8, 4, 2, 1]) for (let i = 0; i < count; i += step) push(i);

  function load(i) {
    const img = new Image();
    img.decoding = 'async';
    img.fetchPriority = 'low';
    img.src = src(i);
    return img.decode().then(() => {
      images[i] = img; ready[i] = 1; loaded++;
      onLoad(i);
    }, () => {});
  }

  return {
    count,
    get loaded() { return loaded; },
    set onLoad(fn) { onLoad = fn; },
    /** Start fetching, 6 at a time. Call only after the poster (LCP) has painted. */
    start() {
      let next = 0;
      const worker = () => (next < order.length ? load(order[next++]).then(worker) : null);
      for (let k = 0; k < 6; k++) worker();
    },
    /** The frame closest to i that has loaded (or null before the first one). */
    nearest(i) {
      i = Math.max(0, Math.min(count - 1, Math.round(i)));
      for (let d = 0; d < count; d++) {
        if (ready[i - d]) return images[i - d];
        if (ready[i + d]) return images[i + d];
      }
      return null;
    },
  };
}

// Draws an image into a canvas with object-fit: cover math, sized to the
// canvas' CSS box × devicePixelRatio (capped at 2).
export function createDrawer(canvas, { dprCap = 2 } = {}) {
  const ctx = canvas.getContext('2d', { alpha: false });
  let last = null;
  return {
    resize(w, h) {
      const dpr = Math.min(devicePixelRatio || 1, dprCap);
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      last = null;
    },
    draw(img) {
      if (!img || img === last) return false;
      const cw = canvas.width, ch = canvas.height;
      const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
      const w = img.naturalWidth * s, h = img.naturalHeight * s;
      ctx.drawImage(img, (cw - w) / 2, (ch - h) * .3, w, h);
      last = img;
      return true;
    },
  };
}
