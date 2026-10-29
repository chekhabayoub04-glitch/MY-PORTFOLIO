// Hero entry: pick a path for this device, then run everything from one
// GSAP ticker (light, frame draw, ring, shader, Lenis).
//   cinema  ≥1024px, mouse, motion OK: the walk plays on its own, then holds on
//           the smile; scrolling pins the hero for the beats (2D, then WebGL if capable)
//   lite    phones, tablets, touch screens: muted loop + drifting light, no pin
//   still   reduced motion: poster in full light, everything static
import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { createAmbient } from './ambient.js';
import { createDrawer, createFrames } from './frames.js';
import { applyLight, createSpotlight } from './spotlight.js';

gsap.registerPlugin(SplitText);

const root = document.documentElement;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const rtl = root.dir === 'rtl';
const CINEMA = '(min-width: 1024px) and (hover: hover) and (pointer: fine)';
const WALK_MS = 6000;   // the walk, from the dark street to the smile
const easeInOut = t => (t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

// After the poster (LCP) has painted and the main thread is quiet
const afterLoad = fn => {
  const go = () => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 200));
  document.readyState === 'complete' ? go() : addEventListener('load', go, { once: true });
};

export function initHero({ onLenis } = {}) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = !!navigator.connection?.saveData;
  const hero = $('#top');

  revealHeadline(reduce);

  // Crossing the desktop breakpoint swaps the whole scene: reload into the right one
  const mq = matchMedia(CINEMA);
  mq.addEventListener('change', () => location.reload());

  if (reduce) {
    root.classList.add('is-still');
    createAmbient({ hero, still: true, small: !mq.matches });
    return;
  }
  if (mq.matches) startCinema({ hero, saveData, onLenis });
  else startLite({ hero, saveData });
}

function revealHeadline(reduce) {
  // The headline is real text from the first paint. The line reveal is only a
  // flourish: skipped if motion is reduced or the page took long to boot.
  const h1 = $('.hero-h1');
  if (reduce || performance.now() > 1500) return;
  const split = SplitText.create(h1, { type: 'lines', mask: 'lines' });
  gsap.from(split.lines, {
    yPercent: 105, duration: .55, stagger: .05, ease: 'power3.out',
    onComplete: () => split.revert(),
  });
}

// ── Desktop: the cinema ─────────────────────────────────────
async function startCinema({ hero, saveData, onLenis }) {
  const [{ ScrollTrigger }, { default: Lenis }, { createTimeline, createRing }] = await Promise.all([
    import('gsap/ScrollTrigger'), import('lenis'), import('./timeline.js'),
  ]);
  gsap.registerPlugin(ScrollTrigger);

  const lenis = new Lenis({ lerp: .1, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  onLenis?.(lenis);

  root.classList.add('is-cinema');
  const stage = $('#stage');
  const media = $('.stage-media', stage);
  const blur = $('.hero-blur', hero);
  const progress = $('.hero-progress', hero);
  stage.classList.add('has-light');

  const frames = createFrames();
  const drawer = createDrawer($('.stage-canvas', stage));
  const blurDrawer = createDrawer(blur, { dprCap: 1 });
  const light = createSpotlight({ mode: 'cursor', rtl });
  const ring = createRing($$('.tool', hero));
  const tl = createTimeline({
    gsap, ScrollTrigger, hero,
    pin: $('.hero-pin', hero), slot: $('.hero-stage-slot', hero),
    sub: $('.hero-sub', hero), beats: $$('.beat', hero),
  });
  createAmbient({ hero, still: saveData });

  let gl = null, lastFrame = -1, dirty = true, visible = null, playFrom = 0;
  // The walk starts by itself once a quarter of the frames are in (every 4th),
  // so it never stutters; the missing ones fill in while it plays.
  frames.onLoad = () => {
    dirty = true;
    if (!playFrom && frames.loaded >= Math.ceil(frames.count / 4)) playFrom = performance.now();
  };

  function layout() {
    const { rest } = tl.geo;
    drawer.resize(rest.w, rest.h);
    blur.width = 54; blur.height = 96;
    hero.style.setProperty('--stage-w', `${rest.w}px`);
    hero.style.setProperty('--blur-x', `${rest.x + rest.w / 2}px`);
    gl?.resize(rest.w, rest.h);
    dirty = true;
  }
  ScrollTrigger.addEventListener('refresh', layout);
  layout();

  gsap.ticker.add((time, deltaMs) => {
    const dt = Math.min(deltaMs, 100) / 1000;
    const scroll = lenis.scroll;
    const r = tl.stageRect(scroll);

    // The film panel: still while pinned, then it leaves with the hero
    const nowVisible = r.y < innerHeight + 40 && r.y + r.h > -40;
    if (nowVisible !== visible) {
      visible = nowVisible;
      stage.style.visibility = visible ? 'visible' : 'hidden';
      stage.classList.toggle('is-off', !visible);
    }
    if (!visible) return;

    // The light, in the panel's coordinates
    const s = light.update(time * 1000, dt, { x: r.x, y: r.y, w: r.w, h: r.h });
    // The walk plays once and holds on the smile; the light opens as he comes
    const walk = playFrom ? Math.min(1, (performance.now() - playFrom) / WALK_MS) : 0;
    const open = Math.max(tl.open, easeInOut(walk));
    const rest = tl.geo.rest;
    const f = walk * (frames.count - 1);
    const img = frames.nearest(f);
    if (gl) {
      gl.render(img, f, s, open, time);
    } else {
      applyLight(stage, s, rest, open);
      if (img && (Math.round(f) !== lastFrame || dirty)) {
        if (drawer.draw(img)) stage.classList.add('has-canvas');
        blurDrawer.draw(img);
        lastFrame = Math.round(f); dirty = false;
      }
    }

    // Beat 1's tool ring, and the scene's progress line
    const { vis, turn } = tl.ring;
    ring.update(vis, turn, rest);
    progress.style.setProperty('--p', tl.state.p.toFixed(4));
    progress.style.setProperty('--pv', tl.state.p >= .999 ? 0 : 1);
  });

  // Frames only after the poster has painted; WebGL after the coarse pass
  afterLoad(() => {
    frames.start();
    if (saveData) return;
    import('./webgl.js').then(async ({ webglCapable, createGL }) => {
      if (!webglCapable()) return;
      try {
        const g = await createGL(media);
        g.resize(tl.geo.rest.w, tl.geo.rest.h);
        gl = g;
        stage.classList.remove('has-light', 'has-canvas');
        stage.classList.add('is-gl');
        root.classList.add('is-webgl');
      } catch (err) {
        console.warn('Hero: staying on the 2D path.', err);
      }
    });
  });

  // Fonts change line heights → re-measure once they land
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}

// ── Phones, tablets, touch: the lite scene ──────────────────
function startLite({ hero, saveData }) {
  root.classList.add('is-lite');
  const stage = $('#stage');
  const media = $('.stage-media', stage);
  const torch = $('.stage-torch', stage);
  stage.classList.add('has-torch');
  const light = createSpotlight({ mode: 'drift', rtl });
  createAmbient({ hero, still: saveData, small: innerWidth < 768 });

  // The light is a fixed-size gradient layer that only translates: sized once
  // here (one repaint), then every frame is a compositor-only transform.
  let rect = { x: 0, y: 0, w: 1, h: 1 }, half = 0;
  const measure = () => {
    const b = stage.getBoundingClientRect();
    rect = { x: b.left, y: b.top + scrollY, w: b.width, h: b.height };
    const size = Math.ceil(2 * (b.width + b.height));
    half = size / 2;
    torch.style.setProperty('--torch', `${size}px`);
    torch.style.setProperty('--r', `${Math.round(Math.max(b.width * .82, 260))}px`);
  };
  measure();
  addEventListener('resize', measure, { passive: true });

  let inView = true, video = null;
  new IntersectionObserver(([e]) => {
    inView = e.isIntersecting;
    if (video) inView && !document.hidden ? video.play().catch(() => {}) : video.pause();
  }).observe(stage);
  document.addEventListener('visibilitychange', () => {
    if (video) !document.hidden && inView ? video.play().catch(() => {}) : video.pause();
  });

  if (!saveData) afterLoad(() => {
    video = Object.assign(document.createElement('video'), {
      className: 'stage-video', muted: true, loop: true, playsInline: true, autoplay: true,
      preload: 'auto', src: '/hero/walk-720.mp4',
    });
    video.setAttribute('aria-hidden', 'true');
    video.addEventListener('playing', () => stage.classList.add('has-video'), { once: true });
    media.append(video);
    video.play().catch(() => {});
  });

  gsap.ticker.add((time, deltaMs) => {
    if (!inView) return;
    const vrect = { ...rect, y: rect.y - scrollY };
    const s = light.update(time * 1000, Math.min(deltaMs, 100) / 1000, vrect);
    torch.style.transform = `translate3d(${(s.x * rect.w - half).toFixed(1)}px, ${(s.y * rect.h - half).toFixed(1)}px, 0)`;
  });
}
