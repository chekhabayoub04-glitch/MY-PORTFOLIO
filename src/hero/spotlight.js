// The visitor's light. On a mouse it follows the cursor; on touch screens it
// drifts on a slow Lissajous path and a tap moves it there for a moment.
// Positions are in stage-normalised units (0..1); the stage is the film panel.
// Nothing here reads layout: the caller passes the stage rect it already has.

const lerp = (a, b, k) => a + (b - a) * k;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export function createSpotlight({ mode = 'cursor', rtl = false } = {}) {
  // Default: on his face. The film is not mirrored in RTL, the default light is.
  const home = { x: rtl ? .48 : .52, y: .27 };
  const s = { x: home.x, y: home.y, tx: home.x, ty: home.y, on: 0, mx: 0, my: 0, tmx: 0, tmy: 0 };
  let pointer = null;           // last pointer position in viewport px
  let tapUntil = 0;
  const born = performance.now();

  const onMove = e => {
    if (e.pointerType === 'touch') return;
    pointer = { x: e.clientX, y: e.clientY };
    s.tmx = (e.clientX / innerWidth) * 2 - 1;
    s.tmy = (e.clientY / innerHeight) * 2 - 1;
  };
  const onTap = e => {
    if (e.pointerType !== 'touch') return;
    pointer = { x: e.clientX, y: e.clientY };
    tapUntil = performance.now() + 3200;
  };
  addEventListener('pointermove', onMove, { passive: true });
  addEventListener('pointerdown', onTap, { passive: true });

  return {
    state: s,
    /**
     * @param {number} now   ms
     * @param {number} dt    seconds since last tick
     * @param {{x,y,w,h}} rect the stage in viewport px
     */
    update(now, dt, rect) {
      const k = 1 - Math.pow(1 - .12, dt * 60);   // ~0.12 per 60 fps frame
      const followPointer = mode === 'cursor' ? !!pointer : now < tapUntil;
      if (followPointer && rect.w) {
        s.tx = clamp((pointer.x - rect.x) / rect.w, -.1, 1.1);
        s.ty = clamp((pointer.y - rect.y) / rect.h, .04, .96);
      } else if (mode === 'drift') {
        const t = now - born;
        s.tx = home.x + Math.sin(t * .00031) * .26;
        s.ty = .36 + Math.sin(t * .00047 + 1.3) * .2;
      }
      s.x = lerp(s.x, s.tx, k);
      s.y = lerp(s.y, s.ty, k);
      s.mx = lerp(s.mx, s.tmx, k * .6);
      s.my = lerp(s.my, s.tmy, k * .6);
      // Act 0: the light fades in over the first second
      s.on = clamp((now - born) / 1000, 0, 1);
      return s;
    },
    destroy() {
      removeEventListener('pointermove', onMove);
      removeEventListener('pointerdown', onTap);
    },
  };
}

// Writes the light into CSS custom properties for the 2D mask path.
// `open` 0..1 widens the cone to full light; values only change when they move.
export function applyLight(el, s, rect, open) {
  const base = rect.w * .62;
  const r = base + open * (Math.hypot(rect.w, rect.h) * 1.1 - base);
  const floor = .07 + open * .93;
  const v = [
    (s.x * rect.w).toFixed(1), (s.y * rect.h).toFixed(1), (r * (.25 + .75 * s.on)).toFixed(1),
    floor.toFixed(3), (1 - open).toFixed(3),
  ];
  const prev = el._light || [];
  if (v.every((x, i) => x === prev[i])) return;
  el._light = v;
  el.style.setProperty('--lx', `${v[0]}px`);
  el.style.setProperty('--ly', `${v[1]}px`);
  el.style.setProperty('--lr', `${v[2]}px`);
  el.style.setProperty('--floor', v[3]);
  el.style.setProperty('--sod', v[4]);
}
