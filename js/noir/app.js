/* ============================================================
   SHADOW & LIGHT — app.js
   1. Ignition (preloader)   6. Spotlight surfaces
   2. Lens (cursor)          7. Case Files (pinned scroll)
   3. Nav & drawer           8. Counters & rise-in
   4. Hero scroll            9. Signal beam & form
   5. Manifesto words
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

  // ── 2. LENS ────────────────────────────────────────────────
  if (finePointer) {
    const lens = $('#lens'), dot = $('#lensDot'), label = $('#lensLabel');
    const hero = $('#top');
    let mx = innerWidth / 2, my = innerHeight / 2, lx = mx, ly = my;
    body.classList.add('has-lens');

    addEventListener('pointermove', e => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
    }, { passive: true });

    document.addEventListener('pointerover', e => {
      const target = e.target.closest('[data-lens]');
      const text = target?.dataset.lens || '';
      const reveal = text === 'Reveal';
      lens.classList.toggle('is-reveal', reveal);
      lens.classList.toggle('is-labelled', !!text && !reveal);
      label.textContent = reveal ? '' : text;
    });

    (function follow() {
      lx += (mx - lx) * .18; ly += (my - ly) * .18;
      lens.style.transform = `translate3d(${lx}px, ${ly}px, 0)`;
      lens.classList.toggle('on-gold', body.classList.contains('is-day'));
      requestAnimationFrame(follow);
    })();
  }

  // ── 3. NAV & DRAWER ────────────────────────────────────────
  const nav = $('#nav');
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

  // ── 4. HERO SCROLL ─────────────────────────────────────────
  const heroSection = $('#top');
  const heroStage = $('#heroStage');
  const heroNight = $('#heroNight');
  const heroBeam = $('#heroBeam');
  const nightItems = $$('.night-list li');

  // ── 5. MANIFESTO WORDS ─────────────────────────────────────
  const manifesto = $('[data-words]');
  const goldWords = new Set(['attention.', 'switched', 'on', 'look', 'away']);
  manifesto.innerHTML = manifesto.textContent.trim().split(/\s+/)
    .map(w => `<span class="w${goldWords.has(w) ? ' is-gold-word' : ''}">${w}</span>`).join(' ');
  const words = $$('.w', manifesto);

  // Responsive WebP copies made by tools/optimize_images.py
  const opt = (src, w) => `images/opt/${src.split('/').pop().replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${w}.webp`;
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

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

  // ── 7. CASE FILES ──────────────────────────────────────────
  const cases = [
    { type: 'Website', title: 'Titan Gym', cat: 'Fitness', text: 'Bold digital presence for a modern training space.', img: 'images/titangym.jpg', url: 'https://chekhabayoub04-glitch.github.io/titan-gym/', external: true },
    { type: 'Campaign', title: 'Souq Al Sayarat', cat: 'Automotive', text: 'A desert-toned story inviting customers to book a test drive.', img: 'images/april4.png', url: 'graphic-design.html' },
    { type: 'Website', title: 'Dr. Badis Clinic', cat: 'Healthcare', text: 'A welcoming clinic experience built around patient trust.', img: 'images/project-drbadis.jpg', url: 'https://chekhabayoub11-ops.github.io/dr.badis/', external: true },
    { type: 'Campaign', title: 'Scent in Check', cat: 'Beauty & Product', text: 'A dramatic fragrance concept of contrast, texture and reflection.', img: 'images/rozan6.jpg', url: 'graphic-design.html' },
    { type: 'AI Film', title: 'Car Brand Film', cat: 'Automotive', text: 'An atmospheric automotive identity, in motion.', img: 'videos/posters/04-car-brand.png', video: 'videos/brand-identity/04-car-brand.m4v', url: 'ai-videos.html' },
    { type: 'Website', title: 'Saïda Real Estate', cat: 'Architecture', text: 'An architectural project told as a polished promotional story.', img: 'images/Modern promotional website.jpg', url: 'https://chekhabayoub04-glitch.github.io/new-vession-promition-/', external: true },
    { type: 'Brand Mark', title: 'Strength & Form', cat: 'Fitness', text: 'A bold emblem built around power, motion and athletic character.', img: 'images/logo3.jpg', url: 'logo-design.html' },
    { type: 'Graphic', title: 'Automotive System', cat: 'Black & Gold', text: 'A coordinated campaign in a striking black and yellow palette.', img: 'images/graphic4.jpg', url: 'graphic-design.html' },
    { type: 'AI Film', title: 'Clothing Brand Film', cat: 'Fashion', text: 'A cinematic fashion identity, in motion.', img: 'videos/posters/01-clothing-brand.png', video: 'videos/brand-identity/01-clothing-brand.m4v', url: 'ai-videos.html' }
  ];
  const track = $('#caseTrack');
  track.innerHTML = cases.map((c, i) => `
    <li class="case">
      <a href="${esc(c.url)}" data-tilt data-lens="${c.video ? 'Play' : c.external ? 'Live' : 'Open'}"${c.external ? ' target="_blank" rel="noopener noreferrer"' : ''}>
        <div class="case-media">
          <span class="case-type">${esc(c.type)}</span>
          <img src="${opt(c.img, 800)}" srcset="${opt(c.img, 800)} 800w, ${opt(c.img, 1600)} 1600w" sizes="(max-width: 820px) 80vw, 26vw" alt="${esc(c.title)}" loading="lazy" decoding="async">
          ${c.video ? `<video src="${esc(c.video)}" muted loop playsinline preload="none" aria-hidden="true"></video>` : ''}
          <span class="case-index">${String(i + 1).padStart(2, '0')}</span>
        </div>
        <span class="case-cat">${esc(c.cat)}</span>
        <h3>${esc(c.title)}</h3>
        <p>${esc(c.text)}</p>
      </a>
    </li>`).join('') + `
    <li class="case case--archive">
      <a href="graphic-design.html" data-lens="Enter">
        <div class="case-media">
          <svg class="bat" viewBox="0 0 200 100" aria-hidden="true"><use href="#bat"/></svg>
          <strong>The full<br>archive</strong>
          <span>Web Experiences <i class="fas fa-arrow-right" aria-hidden="true"></i></span>
          <span>Campaign Visuals <i class="fas fa-arrow-right" aria-hidden="true"></i></span>
          <span>Brand Marks <i class="fas fa-arrow-right" aria-hidden="true"></i></span>
          <span>AI Brand Films <i class="fas fa-arrow-right" aria-hidden="true"></i></span>
        </div>
        <span class="case-cat">40+ files</span>
        <h3>Open the vault</h3>
        <p>Every project, filterable by discipline.</p>
      </a>
    </li>`;

  const caseSection = $('#case-files');
  const caseViewport = $('#caseViewport');
  const caseBar = $('#caseBar');
  const pinQuery = matchMedia('(min-width: 1101px) and (hover: hover)');
  let pinDistance = 0;

  function layoutCases() {
    const pinned = pinQuery.matches && !reducedMotion;
    caseSection.classList.toggle('is-pinned', pinned);
    if (!pinned) { caseSection.style.removeProperty('--pin-h'); track.style.removeProperty('--tx'); return; }
    pinDistance = Math.max(0, track.scrollWidth - caseViewport.clientWidth);
    caseSection.style.setProperty('--pin-h', `${innerHeight + pinDistance}px`);
  }
  layoutCases();
  pinQuery.addEventListener('change', layoutCases);
  addEventListener('resize', layoutCases, { passive: true });
  addEventListener('load', layoutCases, { once: true });
  caseViewport.addEventListener('scroll', () => {
    const max = caseViewport.scrollWidth - caseViewport.clientWidth;
    caseBar.style.transform = `scaleX(${max ? caseViewport.scrollLeft / max : 0})`;
  }, { passive: true });

  const emblem = $('#emblem');

  // ── Scroll loop (hero, manifesto, emblem, case pin) ────────
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const vh = innerHeight;

      // Hero timeline: day → light beam wipe → night scene with services
      const hp = clamp(scrollY / Math.max(1, heroSection.offsetHeight - vh));
      const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const b = ease(clamp((hp - .06) / .42));
      const n = clamp((hp - .4) / .34);
      const slope = innerWidth <= 820 ? .40 : .22;
      heroStage.style.setProperty('--p', (reducedMotion ? 0 : hp).toFixed(4));
      heroStage.dataset.covered = b >= 1 ? '1' : '';
      heroNight.style.setProperty('--wipe', (-30 + b * (130 + slope * 100)).toFixed(2));
      heroNight.style.setProperty('--n', n.toFixed(3));
      heroBeam.style.setProperty('--wipe', (-30 + b * (130 + slope * 100)).toFixed(2));
      heroBeam.style.setProperty('--beam', Math.min(1, Math.sin(b * Math.PI) * 3).toFixed(3));
      heroBeam.style.setProperty('--skew', `${-Math.atan(slope * innerWidth / vh) * 180 / Math.PI}deg`);
      heroSection.style.setProperty('--p', hp.toFixed(4));
      nightItems.forEach((li, i) => li.classList.toggle('is-on', n > .12 + i * .14));

      const day = scrollY < heroSection.offsetHeight - vh * .5 && b < .3;
      body.classList.toggle('is-day', day);
      nav.classList.toggle('is-night', !day);

      const mr = manifesto.getBoundingClientRect();
      const mp = clamp((vh * .82 - mr.top) / (mr.height + vh * .3));
      const lit = Math.round(mp * words.length);
      words.forEach((w, i) => {
        w.classList.toggle('is-lit', i < lit);
        w.classList.toggle('is-gold', i < lit && w.classList.contains('is-gold-word'));
      });

      coverStacks();

      const er = emblem.getBoundingClientRect();
      const ep = clamp(-er.top / Math.max(1, er.height - vh));
      emblem.style.setProperty('--ep', ep.toFixed(4));
      emblem.dataset.progress = ep.toFixed(4);

      if (caseSection.classList.contains('is-pinned')) {
        const r = caseSection.getBoundingClientRect();
        const cp = clamp(-r.top / (r.height - vh));
        track.style.setProperty('--tx', `${-cp * pinDistance}px`);
        caseBar.style.transform = `scaleX(${cp})`;
      }
    });
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
    $$('.step, .origin-card').forEach(el => el.classList.add('tilt-body'));
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

  // Hover-to-play films (Arsenal + Case Files)
  $$('.gadget, .case').forEach(card => {
    const video = $('video', card);
    if (!video || !finePointer) return;
    card.addEventListener('pointerenter', () => { video.play().then(() => card.classList.add('is-playing')).catch(() => {}); });
    card.addEventListener('pointerleave', () => { video.pause(); card.classList.remove('is-playing'); });
  });

  // ── 8. COUNTERS & RISE-IN ──────────────────────────────────
  $$('.section-head, .gadget, .intel-cell, .signal-copy, .signal-form, .manifesto-sign').forEach(el => el.classList.add('rise'));

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
