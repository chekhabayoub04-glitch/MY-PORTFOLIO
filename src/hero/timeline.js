// Scroll choreography for the desktop hero: the hero is pinned (CSS sticky,
// 250vh) while three beats replace each other, the tool ring orbits beat 1
// and the light widens; then it scrolls away as one piece. (The walk itself
// plays on its own when the page opens: see index.js.)
// Layout is measured only on ScrollTrigger refresh; ticks do math only.

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };

// Scroll ranges (fractions of the pin) for each beat
const BEATS = [[.08, .30], [.33, .55], [.58, 1.01]];

export function createTimeline({ gsap, ScrollTrigger, hero, pin, slot, sub, beats }) {
  const state = { p: 0 };
  const geo = { rest: { x: 0, y: 0, w: 1, h: 1 }, heroEnd: 0 };

  function measure() {
    const pinBox = pin.getBoundingClientRect();
    const s = slot.getBoundingClientRect();
    // the slot's position inside the sticky box = its viewport rect while pinned
    geo.rest = { x: s.left - pinBox.left, y: s.top - pinBox.top, w: s.width, h: s.height };
    geo.heroEnd = hero.offsetTop + hero.offsetHeight - innerHeight;
  }
  ScrollTrigger.addEventListener('refreshInit', measure);
  measure();

  // One scrubbed timeline drives the scene's progress and the beats
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom bottom', scrub: .6, invalidateOnRefresh: true },
  });
  tl.to(state, { p: 1, duration: 1 }, 0);
  tl.to(sub, { autoAlpha: 0, y: -24, duration: .04, ease: 'power1.in' }, BEATS[0][0] - .04);
  beats.forEach((el, i) => {
    const [a, b] = BEATS[i];
    tl.fromTo(el, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: .05, ease: 'power2.out', immediateRender: false }, a);
    if (b <= 1) tl.to(el, { autoAlpha: 0, y: -24, duration: .04, ease: 'power1.in' }, b - .04);
  });

  return {
    state, geo,
    get open() { return smooth(.1, .8, state.p); },
    /** Beat 1's visibility, for the tool ring (0..1), and how far it has turned. */
    get ring() { return { vis: smooth(.08, .13, state.p) * (1 - smooth(.25, .30, state.p)), turn: clamp((state.p - .06) / .26) }; },
    /** Where the film panel is right now (viewport px): still while pinned, then it scrolls away with the hero. */
    stageRect(scroll) {
      const { rest } = geo;
      return { ...rest, y: rest.y - Math.max(0, scroll - geo.heroEnd) };
    },
  };
}

// The 3D tool ring around the film during beat 1: a tilted ellipse, scale and
// opacity by depth, front icons above the film and back icons behind it.
export function createRing(items) {
  const n = items.length;
  let hidden = true;
  return {
    update(vis, turn, rest) {
      if (vis < .002) {
        if (!hidden) { items.forEach(el => { el.style.opacity = 0; el.style.pointerEvents = 'none'; }); hidden = true; }
        return;
      }
      hidden = false;
      const cx = rest.x + rest.w / 2, cy = rest.y + rest.h * .58;
      // wide enough to clear his shoulders, never past the screen edge
      const rx = Math.min(rest.w * .62, cx - 40, innerWidth - cx - 56), ry = rx * .27, tilt = -.17;
      const cos = Math.cos(tilt), sin = Math.sin(tilt);
      items.forEach((el, i) => {
        const a = turn * Math.PI * 1.15 + (i / n) * Math.PI * 2 - Math.PI / 2;
        const ex = Math.cos(a) * rx, ey = Math.sin(a) * ry;
        const z = Math.sin(a);                    // > 0: in front of him
        const x = cx + ex * cos - ey * sin, y = cy + ex * sin + ey * cos;
        const depth = (z + 1) / 2;
        el.style.transform = `translate3d(${(x - 26).toFixed(1)}px, ${(y - 26).toFixed(1)}px, 0) scale(${(.74 + .36 * depth).toFixed(3)})`;
        el.style.opacity = (vis * (.32 + .68 * depth)).toFixed(3);
        el.style.pointerEvents = vis > .5 ? 'auto' : 'none';
        el.classList.toggle('is-front', z > 0);
      });
    },
  };
}
