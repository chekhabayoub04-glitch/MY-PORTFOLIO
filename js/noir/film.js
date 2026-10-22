/* ============================================================
   FILM — the cinematic hero
   The scroll scrubs Ayoub's walk-in film (frames made by
   tools/build_film.py) and drives the layers on top of it:
     0.06 → 0.38  PORTFOLIO, letter by letter, in gold
     0.36 → 0.66  tools and languages fly in and orbit him
     0.64 → 0.86  his websites slide in beside him
     0.88 → 1     the last frame (his smile), the name and the way in
   No frames yet → the portrait stands in and steps into the light.
============================================================ */
(() => {
  const film = document.getElementById('top');
  if (!film) return;
  const $$ = (s) => [...film.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = t => 1 - Math.pow(1 - t, 3);
  const span = (p, a, b) => ease(clamp((p - a) / (b - a)));

  const sticky = film.querySelector('.film-sticky');
  const canvas = document.getElementById('filmCanvas');
  const ctx = canvas.getContext('2d');
  const letters = $$('.film-title span');
  const title = film.querySelector('.film-title');
  const tools = $$('.film-tools li');
  const sites = $$('.film-site');
  const caption = document.getElementById('filmCaption');
  const small = () => innerWidth <= 820;

  // ── Frames ────────────────────────────────────────────────
  let frames = [], current = -1, wanted = 0;
  fetch('images/film/film.json', { cache: 'no-cache' })
    .then(r => (r.ok ? r.json() : Promise.reject()))
    .then(meta => {
      const set = small() && innerHeight > innerWidth ? 'mobile' : 'desktop';
      frames = Array.from({ length: meta.frames }, () => null);
      // Load the first frame, then a coarse pass, then fill the gaps: scrubbing works early
      const order = [];
      for (const step of [Math.ceil(meta.frames / 8), 4, 1])
        for (let i = 0; i < meta.frames; i += step) if (!order.includes(i)) order.push(i);
      let next = 0;
      const pump = () => {
        if (next >= order.length) return;
        const i = order[next++], img = new Image();
        img.decoding = 'async';
        img.onload = () => {
          frames[i] = img;
          if (i === 0) { film.classList.add('has-frames'); size(); }
          current = -1; draw();
          pump();
        };
        img.onerror = pump;
        img.src = `images/film/${set}/${String(i).padStart(3, '0')}.webp`;
      };
      for (let k = 0; k < 6; k++) pump();
    })
    .catch(() => {});   // no film yet: the stand-in portrait stays

  function size() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(sticky.clientWidth * dpr);
    canvas.height = Math.round(sticky.clientHeight * dpr);
    current = -1; draw();
  }
  function draw() {
    if (!frames.length) return;
    // nearest loaded frame to the one the scroll asks for
    let i = wanted, d = 0;
    while (!frames[i]) {
      d++;
      if (frames[wanted - d]) { i = wanted - d; break; }
      if (frames[wanted + d]) { i = wanted + d; break; }
      if (d > frames.length) return;
    }
    if (i === current) return;
    current = i;
    const img = frames[i], cw = canvas.width, ch = canvas.height;
    const s = Math.max(cw / img.width, ch / img.height);
    const w = img.width * s, h = img.height * s;
    ctx.drawImage(img, (cw - w) / 2, (ch - h) * .35, w, h);
  }

  // ── Orbit layout for the tools ────────────────────────────
  // Two arcs, one on each side of him, so his face and body stay clear
  let orbit = [];
  function layout() {
    const rx = small() ? innerWidth * .4 : Math.min(innerWidth * .38, 620);
    const ry = small() ? innerHeight * .3 : innerHeight * .34;
    const half = Math.ceil(tools.length / 2);
    orbit = tools.map((_, i) => {
      const k = i % half, right = i < half;
      const deg = -55 + k * (110 / (half - 1));
      const a = (right ? deg : 180 - deg) * Math.PI / 180;
      return { a, rx, ry, dir: right ? 1 : -1 };
    });
    if (frames.length) size();
  }

  // ── Timeline ──────────────────────────────────────────────
  let active = true, ticking = false;
  new IntersectionObserver(([e]) => { active = e.isIntersecting; if (active) update(); }).observe(film);

  function update() {
    ticking = false;
    if (!active) return;
    const r = film.getBoundingClientRect();
    const p = clamp(-r.top / Math.max(1, r.height - innerHeight));
    const set = (el, k, v) => el.style.setProperty(k, typeof v === 'number' ? v.toFixed(4) : v);

    set(film, '--p', p);
    set(film, '--intro', 1 - span(p, 0, .06));
    set(film, '--lit', span(p, .8, .95));

    letters.forEach((l, i) => set(l, '--k', span(p, .06 + i * .012, .14 + i * .012)));
    set(title, '--out', span(p, .3, .38));

    const turn = (p - .5) * .5;   // both arcs drift, mirrored, while on screen
    tools.forEach((li, i) => {
      const { a, rx, ry, dir } = orbit[i];
      const tin = span(p, .36 + i * .006, .44 + i * .006);
      const tout = span(p, .58 + i * .003, .66);
      const ang = a + turn * dir;
      const reach = 1 + (1 - tin) * 1.6 + tout * .9;
      const x = Math.cos(ang) * rx * reach, y = Math.sin(ang) * ry * reach;
      const z = (1 - tin) * -600 + tout * 500;
      li.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${z.toFixed(1)}px)`;
      li.style.opacity = (tin * (1 - tout)).toFixed(3);
    });
    set(caption, '--cap', span(p, .42, .48) * (1 - span(p, .58, .63)));

    sites.forEach((el, j) => {
      const tin = span(p, .64 + j * .03, .71 + j * .03);
      const tout = span(p, .8, .86);
      const side = j === 0 ? -1 : 1;
      const lift = small() ? 0 : (j === 2 ? 34 : j === 1 ? -40 : 0);
      const x = side * ((1 - tin) * 70 + tout * 40);
      el.style.transform = `translate(${x.toFixed(2)}vw, ${small() ? `${(j * -9).toFixed(0)}%` : `calc(-50% + ${lift}%)`}) rotate(${(side * (1 - tin) * 8 + side * (j === 2 ? 4 : -3)).toFixed(2)}deg)`;
      el.style.opacity = (tin * (1 - tout)).toFixed(3);
    });

    const end = span(p, .88, .95);
    set(film, '--end', end);
    film.classList.toggle('is-end', end > .5);

    if (frames.length) {
      wanted = Math.round(p * (frames.length - 1));
      draw();
    }
  }
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => { layout(); onScroll(); }, { passive: true });
  layout();
  update();
})();
