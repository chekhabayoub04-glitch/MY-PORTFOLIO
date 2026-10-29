// Hero entry: pick a path for this device, then run everything from one
// GSAP ticker (light, ring, shader, Lenis). On every path but "still", the
// walk is a muted video that starts when the page opens, loops for as long
// as the hero is on screen, and pauses when it isn't.
//   cinema  ≥1024px, mouse, motion OK: the light follows the cursor and opens
//           with each walk; scrolling pins the hero for the beats (2D, then WebGL)
//   lite    phones, tablets, touch screens: drifting light, no pin
//   still   reduced motion: poster in full light, everything static
import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { createAmbient } from './ambient.js';
import { applyLight, createSpotlight } from './spotlight.js';

gsap.registerPlugin(SplitText);

const root = document.documentElement;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const rtl = root.dir === 'rtl';
const CINEMA = '(min-width: 1024px) and (hover: hover) and (pointer: fine)';
const FRAMES = 120;   // the walk as graded (scripts/prepare-film.sh), for the depth maps
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

// The walk: graded, 5.5 s, crossfaded into itself at the loop point. It plays
// from the first moment, loops, and pauses only while the hero is off screen
// or the tab is hidden. The poster stays underneath until the first frame.
function heroVideo(stage, watch) {
  const video = Object.assign(document.createElement('video'), {
    className: 'stage-video', muted: true, loop: true, playsInline: true, autoplay: true,
    preload: 'auto', src: '/hero/walk-720.mp4',
  });
  video.setAttribute('aria-hidden', 'true');
  video.setAttribute('disablepictureinpicture', '');
  video.addEventListener('playing', () => stage.classList.add('has-video'), { once: true });
  $('.stage-media', stage).append(video);

  let inView = true;
  const sync = () => (inView && !document.hidden ? video.play().catch(() => {}) : video.pause());
  new IntersectionObserver(([e]) => { inView = e.isIntersecting; sync(); }).observe(watch);
  document.addEventListener('visibilitychange', sync);
  sync();
  return video;
}

// Where the loop is in the walk, 0 (far, in the dark) → 1 (the smile).
// The file starts .5 s into the 6 s walk and its last .5 s fades back to it.
const walkPhase = video => Math.min(1, (video.currentTime + .5) / 6);

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
  const blurCtx = blur.getContext('2d', { alpha: false });
  const progress = $('.hero-progress', hero);
  stage.classList.add('has-light');

  const video = heroVideo(stage, hero);
  const light = createSpotlight({ mode: 'cursor', rtl });
  const ring = createRing($$('.tool', hero));
  const tl = createTimeline({
    gsap, ScrollTrigger, hero,
    pin: $('.hero-pin', hero), slot: $('.hero-stage-slot', hero),
    sub: $('.hero-sub', hero), beats: $$('.beat', hero),
  });
  createAmbient({ hero, still: saveData });

  let gl = null, visible = null, open = 0, tick = 0;

  function layout() {
    const { rest } = tl.geo;
    blur.width = 54; blur.height = 96;
    hero.style.setProperty('--stage-w', `${rest.w}px`);
    hero.style.setProperty('--blur-x', `${rest.x + rest.w / 2}px`);
    gl?.resize(rest.w, rest.h);
  }
  ScrollTrigger.addEventListener('refresh', layout);
  layout();

  gsap.ticker.add((time, deltaMs) => {
    const dt = Math.min(deltaMs, 100) / 1000;
    const r = tl.stageRect(lenis.scroll);

    // The film panel: still while pinned, then it leaves with the hero
    const nowVisible = r.y < innerHeight + 40 && r.y + r.h > -40;
    if (nowVisible !== visible) {
      visible = nowVisible;
      stage.classList.toggle('is-off', !visible);
    }
    if (!visible) return;

    // The light follows the cursor and opens as he walks into it, every loop
    const s = light.update(time * 1000, dt, r);
    const phase = video.readyState >= 2 ? walkPhase(video) : 0;
    const target = Math.max(tl.open, easeInOut(Math.min(1, phase / .9)));
    open += (target - open) * (1 - Math.pow(1 - .08, dt * 60));
    const rest = tl.geo.rest;

    if (gl) {
      gl.render(phase * (FRAMES - 1), s, open, time);
    } else {
      applyLight(stage, s, rest, open);
    }
    // the blurred copy around the panel, a few times a second is plenty
    if (video.readyState >= 2 && (tick++ & 3) === 0) blurCtx.drawImage(video, 0, 0, 54, 96);

    // Beat 1's tool ring, and the scene's progress line
    const { vis, turn } = tl.ring;
    ring.update(vis, turn, rest);
    progress.style.setProperty('--p', tl.state.p.toFixed(4));
    progress.style.setProperty('--pv', tl.state.p >= .999 ? 0 : 1);
  });

  // WebGL (depth parallax) once the page is up, on capable machines
  if (!saveData) afterLoad(() => import('./webgl.js').then(async ({ webglCapable, createGL }) => {
    if (!webglCapable()) return;
    try {
      const g = await createGL(media, video);
      g.resize(tl.geo.rest.w, tl.geo.rest.h);
      gl = g;
      stage.classList.remove('has-light');
      stage.classList.add('is-gl');
      root.classList.add('is-webgl');
    } catch (err) {
      console.warn('Hero: staying on the 2D path.', err);
    }
  }));

  // Fonts change line heights → re-measure once they land
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}

// ── Phones, tablets, touch: the lite scene ──────────────────
function startLite({ hero, saveData }) {
  root.classList.add('is-lite');
  const stage = $('#stage');
  const torch = $('.stage-torch', stage);
  stage.classList.add('has-torch');
  const light = createSpotlight({ mode: 'drift', rtl });
  createAmbient({ hero, still: saveData, small: innerWidth < 768 });
  heroVideo(stage, stage);

  // The light is a fixed-size gradient layer that only translates: sized once
  // here (one repaint), then every frame is a compositor-only transform.
  let rect = { x: 0, y: 0, w: 1, h: 1 }, half = 0, inView = true;
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
  new IntersectionObserver(([e]) => { inView = e.isIntersecting; }).observe(stage);

  gsap.ticker.add((time, deltaMs) => {
    if (!inView) return;
    const vrect = { ...rect, y: rect.y - scrollY };
    const s = light.update(time * 1000, Math.min(deltaMs, 100) / 1000, vrect);
    torch.style.transform = `translate3d(${(s.x * rect.w - half).toFixed(1)}px, ${(s.y * rect.h - half).toFixed(1)}px, 0)`;
  });
}
