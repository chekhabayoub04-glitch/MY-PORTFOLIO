// Scroll choreography for the desktop hero.
//   Act 2  the hero is pinned (CSS sticky, 250vh): the walk scrubs, the light
//          widens, three beats replace each other, the tool ring orbits beat 1.
//   Act 3  after the pin, the film panel flies into the reel card at the top
//          of the Work section and then rides along with it.
// Layout is measured only on ScrollTrigger refresh; ticks do math only.

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const easeInOut = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// Scroll ranges (fractions of the pin) for each beat
const BEATS = [[.08, .30], [.33, .55], [.58, 1.01]];
const WALK_END = .86;   // the walk ends here; the rest holds the smile in full light

export function createTimeline({ gsap, ScrollTrigger, hero, pin, slot, card, sub, beats }) {
  const state = { p: 0, t: 0 };
  const geo = { rest: { x: 0, y: 0, w: 1, h: 1 }, card: { x: 0, y: 0, w: 1, h: 1 }, vh: innerHeight, heroEnd: 0 };

  function measure() {
    const pinBox = pin.getBoundingClientRect();
    const s = slot.getBoundingClientRect();
    // the slot's position inside the sticky box = its viewport rect while pinned
    geo.rest = { x: s.left - pinBox.left, y: s.top - pinBox.top, w: s.width, h: s.height };
    const c = card.getBoundingClientRect();
    geo.card = { x: c.left, y: c.top + scrollY, w: c.width, h: c.height };
    geo.vh = innerHeight;
    geo.heroEnd = hero.offsetTop + hero.offsetHeight - innerHeight;
  }
  ScrollTrigger.addEventListener('refreshInit', measure);
  measure();

  // Act 2: one scrubbed timeline drives the walk progress and the beats
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

  // Act 3: from the end of the pin until the card sits in the middle of the screen
  gsap.to(state, {
    t: 1, ease: 'none',
    scrollTrigger: {
      trigger: hero, start: 'bottom bottom',
      end: () => Math.max(geo.heroEnd + 1, geo.card.y - Math.max((geo.vh - geo.card.h) / 2, 96)),
      scrub: .6, invalidateOnRefresh: true,
    },
  });

  return {
    state, geo,
    get walk() { return clamp(state.p / WALK_END); },
    get open() { return smooth(.1, .8, state.p); },
    /** Beat 1's visibility, for the tool ring (0..1), and how far it has turned. */
    get ring() { return { vis: smooth(.08, .13, state.p) * (1 - smooth(.25, .30, state.p)), turn: clamp((state.p - .06) / .26) }; },
    /** Where the film panel is right now (viewport px), plus how card-like it is. */
    stageRect(scroll) {
      const e = easeInOut(state.t);
      const { rest, card: c } = geo;
      const cy = c.y - scroll;
      return {
        x: rest.x + (c.x - rest.x) * e,
        y: rest.y + (cy - rest.y) * e,
        w: rest.w + (c.w - rest.w) * e,
        h: rest.h + (c.h - rest.h) * e,
        e,
      };
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
