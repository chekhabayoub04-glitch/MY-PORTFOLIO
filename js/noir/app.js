/* ============================================================
   SHADOW & LIGHT — app.js
   1. Ignition (preloader)   6. Spotlight surfaces
   2. Lens (cursor)          8. Counters & rise-in
   3. Nav & drawer           9. Signal beam & form
   The cinematic hero lives in film.js.
============================================================ */
(() => {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const body = document.body;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  // ── 0. SMOOTH SCROLL (Lenis, mouse/trackpad only — phones keep native momentum)
  let lenis = null;
  if (window.Lenis && finePointer && !reducedMotion) {
    lenis = new Lenis({ lerp: .1, smoothWheel: true, wheelMultiplier: 1 });
    if (body.classList.contains('is-loading')) lenis.stop();
    (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(performance.now());
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href^="#"]');
      if (!a || a.getAttribute('href').length < 2) return;
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: a.getAttribute('href') === '#top' ? 0 : -70, duration: 1.4 });
    });
  }

  // ── 1. IGNITION ────────────────────────────────────────────
  const count = $('#ignitionCount');
  const started = performance.now();
  const minTime = reducedMotion ? 0 : 1300;
  let loaded = document.readyState === 'complete';
  addEventListener('load', () => { loaded = true; }, { once: true });

  (function charge(now) {
    const t = clamp((now - started) / minTime);
    const shown = loaded ? t : Math.min(t, .9);
    count.textContent = String(Math.round(shown * 100)).padStart(3, '0');
    if (shown >= 1 || (reducedMotion && loaded)) {
      body.classList.add('is-ready');
      body.classList.remove('is-loading');
      lenis?.start();
      return;
    }
    requestAnimationFrame(charge);
  })(started);
  // Never trap the visitor behind a slow asset
  setTimeout(() => { loaded = true; }, 4000);

  // ── 2. LENS · liquid glass cursor ──────────────────────────
  // Spring-follows the pointer; velocity stretches the droplet along its
  // direction of travel and three glass beads trail behind it.
  if (finePointer && !reducedMotion) {
    const lens = $('#lens'), glass = $('#lensGlass'), label = $('#lensLabel');
    const beads = $$('.lens-bead').map((el, i) => ({ el, x: 0, y: 0, k: .3 - i * .07 }));
    let mx = innerWidth / 2, my = innerHeight / 2, lx = mx, ly = my, vx = 0, vy = 0, stretch = 0, angle = 0;
    body.classList.add('has-lens');

    addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; }, { passive: true });
    document.addEventListener('pointerover', e => {
      const text = e.target.closest('[data-lens]')?.dataset.lens || '';
      const reveal = text === 'Reveal';
      lens.classList.toggle('is-reveal', reveal);
      lens.classList.toggle('is-labelled', !!text && !reveal);
      label.textContent = reveal ? '' : text;
    });
    document.addEventListener('pointerleave', () => body.classList.remove('has-lens'));
    document.addEventListener('pointerenter', () => body.classList.add('has-lens'));

    (function follow() {
      requestAnimationFrame(follow);
      // critically-damped spring → a liquid, slightly elastic follow
      vx = (vx + (mx - lx) * .22) * .62;
      vy = (vy + (my - ly) * .22) * .62;
      lx += vx; ly += vy;
      const speed = Math.hypot(vx, vy);
      stretch += (Math.min(speed / 60, .55) - stretch) * .2;
      if (speed > .4) angle = Math.atan2(vy, vx) * 180 / Math.PI;
      lens.style.setProperty('--x', `${lx}px`);
      lens.style.setProperty('--y', `${ly}px`);
      glass.style.setProperty('--a', `${angle.toFixed(1)}deg`);
      glass.style.setProperty('--s', (lens.classList.contains('is-labelled') ? stretch * .3 : stretch).toFixed(3));
      let px = lx, py = ly;
      beads.forEach(b => {
        b.x += (px - b.x) * b.k; b.y += (py - b.y) * b.k;
        b.el.style.setProperty('--x', `${b.x}px`);
        b.el.style.setProperty('--y', `${b.y}px`);
        px = b.x; py = b.y;
      });
    })();
  }

  // ── 3. NAV & DRAWER ────────────────────────────────────────
  const burger = $('#burger');
  const drawer = $('#drawer');

  function setDrawer(open) {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (open) drawer.hidden = false;
    requestAnimationFrame(() => drawer.classList.toggle('is-open', open));
    body.style.overflow = open ? 'hidden' : '';
    if (lenis) open ? lenis.stop() : lenis.start();
    if (!open) setTimeout(() => { if (burger.getAttribute('aria-expanded') === 'false') drawer.hidden = true; }, 700);
  }
  burger.addEventListener('click', () => setDrawer(burger.getAttribute('aria-expanded') !== 'true'));
  $$('a', drawer).forEach(a => a.addEventListener('click', () => setDrawer(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape' && !drawer.hidden) setDrawer(false); });

  // ── 6b. ARSENAL · chapters ─────────────────────────────────
  // Stacked cards: the card being covered shrinks and dims (--cover 0→1)
  const stackCards = $$('.stack-card');
  function coverStacks() {
    stackCards.forEach(card => {
      const next = card.nextElementSibling;
      if (!next || reducedMotion) return;
      const gap = next.getBoundingClientRect().top - card.getBoundingClientRect().top;
      card.style.setProperty('--cover', clamp(1 - gap / card.offsetHeight).toFixed(3));
    });
  }

  // Browser frames: pointer y scrolls the site; idle frames pan slowly on their own
  $$('[data-browser]').forEach(frame => {
    const view = $('.browser-view', frame);
    const shot = $('.browser-shot', frame);
    let hovering = false, inView = false, down = false;
    const maxScroll = () => Math.max(0, shot.offsetHeight - view.offsetHeight);

    frame.addEventListener('pointermove', e => {
      const r = view.getBoundingClientRect();
      hovering = true;
      shot.style.setProperty('--pan', '.9s');
      shot.style.setProperty('--scroll', Math.round(clamp((e.clientY - r.top) / r.height) * maxScroll()));
    }, { passive: true });
    frame.addEventListener('pointerleave', () => {
      hovering = false;
      shot.style.setProperty('--scroll', 0);
    });
    new IntersectionObserver(([e]) => { inView = e.isIntersecting; }, { threshold: .3 }).observe(frame);
    // Nobody steering (or a touch screen): glide down the page and back like a demo
    setInterval(() => {
      if (!inView || hovering || document.hidden || reducedMotion) return;
      down = !down;
      shot.style.setProperty('--pan', '7s');
      shot.style.setProperty('--scroll', down ? Math.round(maxScroll() * .7) : 0);
    }, 7500);
  });

  // Reels: hover previews muted, the button plays with sound
  const fmt = t => `${Math.floor(t / 60)}:${String(Math.round(t % 60)).padStart(2, '0')}`;
  $$('[data-reel]').forEach(reel => {
    const video = $('video', reel), btn = $('.reel-sound', reel), time = $('.reel-time', reel);
    video.addEventListener('loadedmetadata', () => { time.textContent = fmt(video.duration); });
    new IntersectionObserver(([e]) => { if (e.isIntersecting && video.preload === 'none') video.preload = 'metadata'; }, { rootMargin: '300px' }).observe(reel);
    if (finePointer) {
      reel.addEventListener('pointerenter', () => { if (!reel.classList.contains('is-loud')) video.play().catch(() => {}); });
      reel.addEventListener('pointerleave', () => { if (!reel.classList.contains('is-loud')) video.pause(); });
    }
    btn.addEventListener('click', () => {
      const loud = !reel.classList.contains('is-loud');
      $$('[data-reel].is-loud').forEach(r => {
        r.classList.remove('is-loud'); const v = $('video', r); v.muted = true; v.pause();
        $('.reel-sound i', r).className = 'fas fa-play';
      });
      if (loud) {
        reel.classList.add('is-loud');
        video.muted = false; video.currentTime = 0; video.play().catch(() => {});
        btn.querySelector('i').className = 'fas fa-volume-high';
        btn.setAttribute('aria-label', 'Mute');
      } else {
        btn.setAttribute('aria-label', 'Play with sound');
      }
    });
  });

  // ── Scroll loop ────────────────────────────────────────────
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; coverStacks(); });
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll, { passive: true });
  onScroll();

  // ── 6. SPOTLIGHT SURFACES ──────────────────────────────────
  document.addEventListener('pointermove', e => {
    const el = e.target.closest?.('[data-spot]');
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--x', `${e.clientX - r.left}px`);
    el.style.setProperty('--y', `${e.clientY - r.top}px`);
  }, { passive: true });

  // 3D tilt + glare: pointer position → rotateX/Y, smoothed by CSS transition
  if (finePointer && !reducedMotion) {
    $$('.origin-card').forEach(el => el.classList.add('tilt-body'));
    const MAX = 9;
    document.addEventListener('pointermove', e => {
      const el = e.target.closest?.('[data-tilt]');
      if (!el) return;
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      el.classList.add('is-tilting');
      el.style.setProperty('--ry', `${((px - .5) * MAX * 2).toFixed(2)}deg`);
      el.style.setProperty('--rx', `${((.5 - py) * MAX * 2).toFixed(2)}deg`);
      el.style.setProperty('--gx', `${(px * 100).toFixed(1)}%`);
      el.style.setProperty('--gy', `${(py * 100).toFixed(1)}%`);
      el.style.setProperty('--lift', '20');
    }, { passive: true });
    document.addEventListener('pointerout', e => {
      const el = e.target.closest?.('[data-tilt]');
      if (!el || el.contains(e.relatedTarget)) return;
      el.classList.remove('is-tilting');
      ['--rx', '--ry', '--lift'].forEach(v => el.style.removeProperty(v));
    });
  }

  // ── 8. COUNTERS & RISE-IN ──────────────────────────────────
  $$('.section-head, .service, .intel-cell, .toolkit, .signal-copy, .signal-form').forEach(el => el.classList.add('rise'));

  const io = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    el.classList.add('is-inview');
    io.unobserve(el);
    const num = el.querySelector?.('[data-count]') || (el.dataset.count ? el : null);
    if (num) {
      const end = +num.dataset.count, t0 = performance.now(), dur = reducedMotion ? 1 : 1600;
      (function tick(now) {
        const k = clamp((now - t0) / dur);
        num.textContent = Math.round(end * (1 - Math.pow(1 - k, 4)));
        if (k < 1) requestAnimationFrame(tick);
      })(t0);
    }
  }), { threshold: .18 });
  $$('.rise, [data-spot]').forEach(el => io.observe(el));

  // ── 9. SIGNAL BEAM & FORM ──────────────────────────────────
  const signal = $('#signal');
  let sx = .7, sy = .3, tsx = sx, tsy = sy, signalVisible = false;
  new IntersectionObserver(([e]) => { signalVisible = e.isIntersecting; }).observe(signal);
  signal.addEventListener('pointermove', e => {
    const r = signal.getBoundingClientRect();
    tsx = (e.clientX - r.left) / r.width;
    tsy = (e.clientY - r.top) / r.height;
  }, { passive: true });
  (function sweep(t) {
    requestAnimationFrame(sweep);
    if (!signalVisible) return;
    if (!finePointer && !reducedMotion) { tsx = .5 + Math.sin(t * .0005) * .3; tsy = .3 + Math.cos(t * .0007) * .15; }
    sx += (tsx - sx) * .06; sy += (tsy - sy) * .06;
    signal.style.setProperty('--sx', `${(sx * 100).toFixed(2)}%`);
    signal.style.setProperty('--sy', `${(sy * 100).toFixed(2)}%`);
  })(0);

  $('#signalForm').addEventListener('submit', e => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const mission = String(data.get('subject') || 'Project');
    const subject = `${mission} — signal from ${data.get('name')}`;
    const text = [`Name: ${data.get('name')}`, `Email: ${data.get('email')}`, `Mission: ${mission}`, '', String(data.get('message') || '')].join('\n');
    location.href = `mailto:CHEKHABAYOUB04@GMAIL.COM?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
  });

  $('#year').textContent = new Date().getFullYear();
})();
