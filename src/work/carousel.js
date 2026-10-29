// The Selected work carousel. Native horizontal scroll with snap (touch,
// trackpad, Shift+wheel), plus mouse drag and arrow buttons on desktop.
// Each frame on the shared GSAP ticker: scale and opacity by distance from
// the centre, and the active phone's tilt. Card centres are measured on
// resize only; per frame we read the scroll offset and do math.
import gsap from 'gsap';

const KEY = 'work-slug';

export function initCarousel() {
  const root = document.getElementById('carousel');
  if (!root) return;
  const track = root.querySelector('.carousel-track');
  const cards = [...track.children];
  const [prevBtn, nextBtn] = root.querySelectorAll('.carousel-arrow');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const rtl = getComputedStyle(track).direction === 'rtl';

  let centers = [], half = 0, step = 1, last = NaN, visible = false, active = -1;
  // Content-space centres: visual centre = centre - scrollLeft (holds in LTR and RTL)
  function measure() {
    const box = track.getBoundingClientRect();
    half = track.clientWidth / 2;
    centers = cards.map(c => { const r = c.getBoundingClientRect(); return r.left + r.width / 2 - box.left + track.scrollLeft; });
    step = Math.abs(centers[1] - centers[0]) || 1;
    last = NaN;
  }
  const scrollFor = i => centers[i] - half;
  const go = (i, instant) => {
    i = Math.max(0, Math.min(cards.length - 1, i));
    track.scrollTo({ left: scrollFor(i), behavior: instant || reduce ? 'auto' : 'smooth' });
  };

  new ResizeObserver(measure).observe(track);
  measure();
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { rootMargin: '200px 0px' }).observe(root);

  // Back from a portal: the carousel opens on the project you came from
  try {
    const i = cards.findIndex(c => c.dataset.slug === sessionStorage.getItem(KEY));
    if (i >= 0) go(i, true);
  } catch {}
  cards.forEach(c => c.querySelector('a').addEventListener('click', () => {
    try { sessionStorage.setItem(KEY, c.dataset.slug); } catch {}
  }));

  // Arrows and keyboard
  prevBtn.addEventListener('click', () => go(active - 1));
  nextBtn.addEventListener('click', () => go(active + 1));
  track.addEventListener('focusin', e => {
    const i = cards.findIndex(c => c.contains(e.target));
    if (i >= 0 && i !== active) go(i);
  });
  track.addEventListener('keydown', e => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const forward = (e.key === 'ArrowRight') !== rtl;
    const i = cards.findIndex(c => c.contains(document.activeElement));
    const target = cards[Math.max(0, Math.min(cards.length - 1, i + (forward ? 1 : -1)))];
    target?.querySelector('a').focus();
    e.preventDefault();
  });

  // Mouse drag (touch keeps native scrolling)
  if (fine) {
    let startX = 0, startScroll = 0, dragging = false, down = false;
    track.addEventListener('dragstart', e => e.preventDefault());
    track.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      down = true; dragging = false; startX = e.clientX; startScroll = track.scrollLeft;
    });
    addEventListener('pointermove', e => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (!dragging && Math.abs(dx) > 5) { dragging = true; root.classList.add('is-dragging'); }
      if (dragging) track.scrollLeft = startScroll - dx;
    }, { passive: true });
    addEventListener('pointerup', () => {
      if (!down) return;
      down = false;
      if (!dragging) return;
      root.classList.remove('is-dragging');
      // settle on the nearest phone
      const sl = track.scrollLeft;
      let best = 0;
      centers.forEach((c, i) => { if (Math.abs(c - sl - half) < Math.abs(centers[best] - sl - half)) best = i; });
      go(best);
      // a drag is not a click
      track.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); }, { capture: true, once: true });
    });
  }

  // Tilt of the active phone, at most 6°
  let tx = 0, ty = 0, rx = 0, ry = 0;
  if (fine && !reduce) {
    track.addEventListener('pointermove', e => {
      const phone = cards[active]?.querySelector('.phone');
      if (!phone || !phone.contains(e.target)) { tx = ty = 0; return; }
      const r = phone.getBoundingClientRect();
      ty = ((e.clientX - r.left) / r.width - .5) * 12;
      tx = (.5 - (e.clientY - r.top) / r.height) * 12;
    }, { passive: true });
    track.addEventListener('pointerleave', () => { tx = ty = 0; });
  }

  gsap.ticker.add((time, deltaMs) => {
    if (!visible) return;
    const sl = track.scrollLeft;
    if (sl !== last) {
      last = sl;
      let best = 0, bestD = Infinity;
      cards.forEach((c, i) => {
        const d = (centers[i] - sl - half) / step;
        const a = Math.min(Math.abs(d), 1.6);
        c.style.transform = `scale(${(1.06 - a * .2).toFixed(3)})`;
        c.style.opacity = (1 - a * .42).toFixed(3);
        if (Math.abs(d) < bestD) { bestD = Math.abs(d); best = i; }
      });
      if (best !== active) {
        cards[active]?.classList.remove('is-active');
        cards[active]?.querySelector('.phone').style.removeProperty('--rx');
        cards[active]?.querySelector('.phone').style.removeProperty('--ry');
        cards[best].classList.add('is-active');
        active = best;
        prevBtn.disabled = active === 0;
        nextBtn.disabled = active === cards.length - 1;
      }
    }
    if (fine && !reduce && active >= 0) {
      const k = 1 - Math.pow(1 - .12, Math.min(deltaMs, 100) / 16.7);
      rx += (tx - rx) * k; ry += (ty - ry) * k;
      const phone = cards[active].querySelector('.phone');
      phone.style.setProperty('--rx', `${rx.toFixed(2)}deg`);
      phone.style.setProperty('--ry', `${ry.toFixed(2)}deg`);
    }
  });
}
