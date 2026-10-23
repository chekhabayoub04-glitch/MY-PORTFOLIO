/* ============================================================
   FILM — the cinematic hero
   The scroll scrubs Ayoub's walk-in film (frames made by
   tools/build_film.py) and drives the layers on top of it.
   With the film (cues match the clip: the gold PORTFOLIO neon
   lights at ~33%, the glasses come off at ~70%, the smile ends it):
     0.06 → 0.33  tools and languages fly in and orbit him,
                  then scatter as the neon lights up
     0.38 → 0.66  his websites slide in beside him
     0.88 → 1     the smile, the name and the way in
   Without frames the portrait stands in, and our own gold
   PORTFOLIO title plays the neon's part (STILL timeline).
   A vertical clip on a wide screen becomes a tall centre panel
   over a blurred, ambient copy of itself (.is-panel).
============================================================ */
(() => {
  const film = document.getElementById('top');
  if (!film) return;
  const $$ = (s) => [...film.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = t => 1 - Math.pow(1 - t, 3);
  const span = (p, a, b) => ease(clamp((p - a) / (b - a)));

  const canvas = document.getElementById('filmCanvas');
  const ctx = canvas.getContext('2d');
  const ambient = document.getElementById('filmAmbient');
  const actx = ambient.getContext('2d');
  const letters = $$('.film-title span');
  const title = film.querySelector('.film-title');
  const tools = $$('.film-tools li');
  const sites = $$('.film-site');
  const caption = document.getElementById('filmCaption');
  const timecode = document.getElementById('filmTime');
  const small = () => innerWidth <= 820;

  const STILL = { tools: [.36, .58], cap: [.42, .58], sites: [.64, .8], end: .88 };
  const FILM = { tools: [.06, .28], cap: [.1, .27], sites: [.38, .6], end: .88 };
  let T = STILL;

  // ── Frames ────────────────────────────────────────────────
  let frames = [], meta = null, current = -1, wanted = 0, shown = 0, gliding = 0;
  fetch('images/film/film.json', { cache: 'no-cache' })
    .then(r => (r.ok ? r.json() : Promise.reject()))
    .then(m => {
      meta = m;
      const set = m.sets?.[small() && innerHeight > innerWidth ? 'mobile' : 'desktop'] || 'desktop';
      frames = Array.from({ length: m.frames }, () => null);
      // Load the first frame, then a coarse pass, then fill the gaps: scrubbing works early
      const order = [];
      for (const step of [Math.ceil(m.frames / 8), 4, 1])
        for (let i = 0; i < m.frames; i += step) if (!order.includes(i)) order.push(i);
      let next = 0;
      const pump = () => {
        if (next >= order.length) return;
        const i = order[next++], img = new Image();
        img.decoding = 'async';
        img.onload = () => {
          frames[i] = img;
          if (i === 0) { T = FILM; film.classList.add('has-frames'); layout(); update(); }
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
    // A vertical film on a wide screen stands as a tall panel in the middle
    const panel = !!meta?.portrait && innerWidth / innerHeight > .8;
    film.classList.toggle('is-panel', panel);
    const dpr = Math.min(devicePixelRatio || 1, 3);   // phones at 3× keep the HD frames crisp
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    ambient.width = 48; ambient.height = 27;
    current = -1; draw();
  }
  function draw() {
    if (!frames.length) return;
    // nearest loaded frame to the one we want to show
    const target = Math.round(shown);
    let i = target, d = 0;
    while (!frames[i]) {
      d++;
      if (frames[target - d]) { i = target - d; break; }
      if (frames[target + d]) { i = target + d; break; }
      if (d > frames.length) return;
    }
    if (i === current) return;
    current = i;
    const img = frames[i], cw = canvas.width, ch = canvas.height;
    const s = Math.max(cw / img.width, ch / img.height);
    const w = img.width * s, h = img.height * s;
    ctx.drawImage(img, (cw - w) / 2, (ch - h) * .35, w, h);
    if (film.classList.contains('is-panel')) {
      const a = Math.max(48 / img.width, 27 / img.height);
      actx.drawImage(img, (48 - img.width * a) / 2, (27 - img.height * a) / 2, img.width * a, img.height * a);
    }
    if (meta) {
      const t = i / Math.max(1, frames.length - 1) * meta.duration;
      timecode.textContent = `00:${String(Math.floor(t)).padStart(2, '0')}:${String(Math.floor((t % 1) * 24)).padStart(2, '0')}`;
    }
  }
  // The film eases towards the scroll position instead of jumping: it glides
  function glide() {
    shown += (wanted - shown) * .22;
    if (Math.abs(wanted - shown) < .3) shown = wanted;
    draw();
    gliding = shown !== wanted ? requestAnimationFrame(glide) : 0;
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
    set(film, '--intro', 1 - span(p, 0, .05));
    set(film, '--lit', span(p, .8, .95));

    letters.forEach((l, i) => set(l, '--k', span(p, .06 + i * .012, .14 + i * .012)));
    set(title, '--out', span(p, .3, .38));

    const [ti, to] = T.tools;
    const turn = (p - (ti + to) / 2) * .5;   // both arcs drift, mirrored, while on screen
    tools.forEach((li, i) => {
      const { a, rx, ry, dir } = orbit[i];
      const tin = span(p, ti + i * .005, ti + .08 + i * .005);
      const tout = span(p, to + i * .002, to + .06);
      const ang = a + turn * dir;
      const reach = 1 + (1 - tin) * 1.6 + tout * .9;
      const x = Math.cos(ang) * rx * reach, y = Math.sin(ang) * ry * reach;
      const z = (1 - tin) * -600 + tout * 500;
      li.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${z.toFixed(1)}px)`;
      li.style.opacity = (tin * (1 - tout)).toFixed(3);
    });
    set(caption, '--cap', span(p, T.cap[0], T.cap[0] + .06) * (1 - span(p, T.cap[1], T.cap[1] + .05)));

    const [si, so] = T.sites;
    sites.forEach((el, j) => {
      const tin = span(p, si + j * .03, si + .07 + j * .03);
      const tout = span(p, so, so + .06);
      // two per side: top pair first, then the lower pair
      const side = j % 2 ? 1 : -1, low = j > 1;
      const lift = small() ? 0 : (low ? 34 : -40);
      const x = side * ((1 - tin) * 70 + tout * 40);
      el.style.transform = `translate(${x.toFixed(2)}vw, ${small() ? `${(j * -9).toFixed(0)}%` : `calc(-50% + ${lift}%)`}) rotate(${(side * (1 - tin) * 8 + side * (low ? 4 : -3)).toFixed(2)}deg)`;
      el.style.opacity = (tin * (1 - tout)).toFixed(3);
    });

    const end = span(p, T.end, T.end + .07);
    set(film, '--end', end);
    film.classList.toggle('is-end', end > .5);

    if (frames.length) {
      wanted = p * (frames.length - 1);
      if (!gliding) gliding = requestAnimationFrame(glide);
    }
  }
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => { layout(); onScroll(); }, { passive: true });
  layout();
  update();
})();
