// The sections below the hero, carried over from js/noir/app.js until they
// are rebuilt: drawer, stacked cards, browser frames, reels, tilt, counters,
// contact beam and form. Smooth scroll now belongs to the hero (Lenis on the
// GSAP ticker); the preloader and the glass cursor are gone. Every visible
// word comes from the page (and so from its language), never from here.

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

let lenis = null;
export const setLenis = l => {
  lenis = l;
  // In-page links glide with Lenis
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.getAttribute('href').length < 2) return;
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    lenis.scrollTo(target, { offset: a.getAttribute('href') === '#top' ? 0 : -24, duration: 1.4 });
  });
};

export function initSections() {
  const body = document.body;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  // Nav drawer (phones and tablets)
  const burger = $('#burger');
  const drawer = $('#drawer');
  function setDrawer(open) {
    burger.setAttribute('aria-expanded', String(open));
    if (open) drawer.hidden = false;
    requestAnimationFrame(() => drawer.classList.toggle('is-open', open));
    body.style.overflow = open ? 'hidden' : '';
    if (!open) setTimeout(() => { if (burger.getAttribute('aria-expanded') === 'false') drawer.hidden = true; }, 700);
  }
  burger.addEventListener('click', () => setDrawer(burger.getAttribute('aria-expanded') !== 'true'));
  $$('a', drawer).forEach(a => a.addEventListener('click', () => setDrawer(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape' && !drawer.hidden) setDrawer(false); });

  // Stacked cards: the card being covered shrinks and dims (--cover 0→1)
  const stackCards = $$('.stack-card');
  const liveStacks = new Set();
  const stackIO = new IntersectionObserver(entries => entries.forEach(e => (e.isIntersecting ? liveStacks.add(e.target) : liveStacks.delete(e.target))));
  $$('.stack').forEach(st => stackIO.observe(st));
  function coverStacks() {
    stackCards.forEach(card => {
      if (!liveStacks.has(card.parentElement)) return;
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
    frame.addEventListener('pointerleave', () => { hovering = false; shot.style.setProperty('--scroll', 0); });
    new IntersectionObserver(([e]) => { inView = e.isIntersecting; }, { threshold: .3 }).observe(frame);
    setInterval(() => {
      if (!inView || hovering || document.hidden || reducedMotion) return;
      down = !down;
      shot.style.setProperty('--pan', '7s');
      shot.style.setProperty('--scroll', down ? Math.round(maxScroll() * .7) : 0);
    }, 7500);
  });

  // Reels: hover previews muted, the button plays with sound
  $$('[data-reel]').forEach(reel => {
    const video = $('video', reel), btn = $('.reel-sound', reel);   // the timecode is written at build (src/site/counts.mjs)
    // the poster and metadata load only as the reel comes near (keeps the hero's bandwidth free)
    new IntersectionObserver(([e], io) => {
      if (!e.isIntersecting) return;
      video.poster = video.dataset.poster;
      video.preload = 'metadata';
      io.disconnect();
    }, { rootMargin: '300px' }).observe(reel);
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
        btn.setAttribute('aria-label', btn.dataset.off);
      } else {
        btn.setAttribute('aria-label', btn.dataset.on);
      }
    });
  });

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; coverStacks(); });
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll, { passive: true });
  onScroll();

  // Spotlight surfaces
  document.addEventListener('pointermove', e => {
    const el = e.target.closest?.('[data-spot]');
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--x', `${e.clientX - r.left}px`);
    el.style.setProperty('--y', `${e.clientY - r.top}px`);
  }, { passive: true });

  // 3D tilt + glare
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

  // Counters & rise-in
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
        num.textContent = Math.max(1, Math.round(end * (1 - Math.pow(1 - k, 4))));   // never shows 0
        if (k < 1) requestAnimationFrame(tick);
      })(t0);
    }
  }), { threshold: .18 });
  $$('.rise, [data-spot]').forEach(el => io.observe(el));

  // Contact beam
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

  // Contact form → Web3Forms as JSON, so the visitor stays on the page.
  // Messages come from the form's data-* attributes, in the page's language.
  const form = $('#signalForm');
  const status = $('#formStatus');
  const send = $('button[type="submit"]', form);
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    if (data.botcheck) return;   // the honeypot was filled: a bot
    send.disabled = true;
    status.className = 'form-status';
    status.textContent = form.dataset.sending;
    try {
      const res = await fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ...data, subject: `${data.mission}: ${data.name}` }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.message || res.status);
      form.reset();
      status.classList.add('is-ok');
      status.textContent = form.dataset.sent;
    } catch {
      status.classList.add('is-error');
      status.textContent = `${form.dataset.failed} `;
      const wa = Object.assign(document.createElement('a'), { href: form.dataset.wa, target: '_blank', rel: 'noopener', textContent: form.dataset.waLabel });
      status.append(wa);
    } finally {
      send.disabled = false;
    }
  });

  $('#year').textContent = new Date().getFullYear();
}
