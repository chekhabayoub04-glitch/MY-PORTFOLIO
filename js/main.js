// ============================================================
// main.js — UI interactions
// 1. Custom Cursor
// 2. Navbar scroll behaviour + active link
// 3. Mobile Menu
// 4. Scroll Reveal
// 5. Counter Animation
// 6. Bat Explosion on load
// ============================================================

// ── 1. CUSTOM CURSOR ─────────────────────────────────────────
const cursorDot  = document.getElementById('cursor');
const cursorRing = document.getElementById('cursorRing');
let mx = 0, my = 0, rx = 0, ry = 0;

document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  cursorDot.style.left = mx + 'px';
  cursorDot.style.top  = my + 'px';
});

(function animCursor() {
  rx += (mx - rx) * .12;
  ry += (my - ry) * .12;
  cursorRing.style.left = rx + 'px';
  cursorRing.style.top  = ry + 'px';
  requestAnimationFrame(animCursor);
})();

// Scale ring on hover over interactive elements
document.querySelectorAll('a, button, .project-card, .service-card, .masonry-item').forEach(el => {
  el.addEventListener('mouseenter', () => cursorRing.style.transform = 'translate(-50%,-50%) scale(1.8)');
  el.addEventListener('mouseleave', () => cursorRing.style.transform = 'translate(-50%,-50%) scale(1)');
});

// ── 2. NAVBAR SCROLL BEHAVIOUR ───────────────────────────────
const navbar   = document.getElementById('navbar');
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a, .mobile-menu a');

window.addEventListener('scroll', () => {
  // shrink on scroll
  navbar.classList.toggle('scrolled', scrollY > 60);

  // active link highlight
  let current = '';
  sections.forEach(sec => {
    if (scrollY >= sec.offsetTop - 100) current = sec.id;
  });
  navLinks.forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === '#' + current);
  });
});

// ── 3. MOBILE MENU ───────────────────────────────────────────
const hamburger  = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

hamburger.addEventListener('click', () => {
  const open = mobileMenu.classList.toggle('open');
  hamburger.setAttribute('aria-expanded', open);
  // animate bars → X
  const bars = hamburger.querySelectorAll('span');
  if (open) {
    bars[0].style.transform = 'translateY(7px) rotate(45deg)';
    bars[1].style.opacity   = '0';
    bars[2].style.transform = 'translateY(-7px) rotate(-45deg)';
  } else {
    bars[0].style.transform = '';
    bars[1].style.opacity   = '';
    bars[2].style.transform = '';
  }
});

function closeMobileMenu() {
  mobileMenu.classList.remove('open');
  hamburger.setAttribute('aria-expanded', false);
  const bars = hamburger.querySelectorAll('span');
  bars[0].style.transform = '';
  bars[1].style.opacity   = '';
  bars[2].style.transform = '';
}
window.closeMobileMenu = closeMobileMenu; // expose to inline onclick

// ── 4. SCROLL REVEAL ─────────────────────────────────────────
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1 });

document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

// ── 5. COUNTER ANIMATION ─────────────────────────────────────
const counterObs = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el     = entry.target;
    const target = parseInt(el.dataset.target, 10);
    let cur = 0;
    const step = target / 50;
    const timer = setInterval(() => {
      cur = Math.min(cur + step, target);
      el.textContent = Math.floor(cur) + '+';
      if (cur >= target) clearInterval(timer);
    }, 30);
    counterObs.unobserve(el);
  });
}, { threshold: 0.5 });

document.querySelectorAll('[data-target]').forEach(el => counterObs.observe(el));

// ── 6. BAT EXPLOSION ON PAGE LOAD ────────────────────────────
(function batExplosion() {
  const overlay  = document.getElementById('bat-explosion-overlay');
  const BAT_COUNT = 180;
  const cx = innerWidth  / 2;
  const cy = innerHeight / 2;
  const bats = [];

  // Build a small bat SVG as data URI for the explosion
  const batSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60">
    <path fill="COLOR" d="M50,10 C50,10 30,2 10,7 C15,17 20,22 28,24 C22,26 16,32 18,42
      C25,37 32,34 36,37 C38,32 42,28 50,28 C58,28 62,32 64,37
      C68,34 75,37 82,42 C84,32 78,26 72,24 C80,22 85,17 90,7
      C70,2 50,10 50,10Z"/>
  </svg>`;

  for (let i = 0; i < BAT_COUNT; i++) {
    const el = document.createElement('div');
    const size    = 28 + Math.random() * 75;
    const isGold  = Math.random() > .38;
    const color   = isGold ? '%23FFD700' : '%23111111';
    const svgData = batSVG.replace('COLOR', color.replace('#','%23'));
    const encoded = 'data:image/svg+xml,' + batSVG.replace('COLOR', isGold ? '%23FFD700' : '%23111');

    el.style.cssText = `
      position:absolute;
      width:${size}px; height:${size * .55}px;
      background:url("${encoded}") center/contain no-repeat;
      pointer-events:none;
      left:${cx}px; top:${cy}px;
      transform:translate(-50%,-50%);
      filter:${isGold ? 'drop-shadow(0 0 5px rgba(255,215,0,.8))' : 'brightness(.15)'};
      opacity:${isGold ? .9 : .7};
      will-change:transform,opacity;
    `;
    overlay.appendChild(el);

    const angle   = (Math.PI * 2 * i) / BAT_COUNT + (Math.random() - .5) * .45;
    const speed   = 350 + Math.random() * 700;
    const gravity = 180 + Math.random() * 200;
    const rotSpd  = (Math.random() - .5) * 720;
    const flapSpd = 3   + Math.random() * 6;
    const flapAmp = .18 + Math.random() * .3;

    bats.push({
      el, opacity: isGold ? .9 : .7,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      gravity, rotSpd,
      rot: Math.random() * 360,
      flapSpd, flapAmp,
    });
  }

  let start = null;
  const DURATION = 1800;

  function frame(ts) {
    if (!start) start = ts;
    const elapsed = ts - start;
    const t = elapsed / 1000;

    bats.forEach(b => {
      const x   = cx + b.vx * t;
      const y   = cy + b.vy * t + .5 * b.gravity * t * t;
      const rot = b.rot + b.rotSpd * t;
      const flap = .5 + b.flapAmp * Math.abs(Math.sin(t * b.flapSpd));
      let opacity = b.opacity;
      if (elapsed > DURATION - 400) opacity *= 1 - (elapsed - (DURATION - 400)) / 400;

      b.el.style.transform = `translate(${x - cx}px,${y - cy}px) translate(-50%,-50%) rotate(${rot}deg) scaleY(${flap})`;
      b.el.style.opacity   = Math.max(0, opacity);
    });

    if (elapsed < DURATION) {
      requestAnimationFrame(frame);
    } else {
      overlay.style.transition = 'opacity .3s';
      overlay.style.opacity    = '0';
      setTimeout(() => overlay.remove(), 350);
    }
  }

  // Small delay so page renders first, then BOOM 🦇
  setTimeout(() => requestAnimationFrame(frame), 250);
})();
