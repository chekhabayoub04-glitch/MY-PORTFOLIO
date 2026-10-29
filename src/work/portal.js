// Project portal: device switch, auto-scrolling previews, "Try it live" in
// the phone, and the gallery lightbox. Vanilla, no animation library.

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const afterLoad = fn => (document.readyState === 'complete' ? fn() : addEventListener('load', fn, { once: true }));

export function initPortal() {
  const devices = $('#devices');
  if (!devices) return;
  const phone = $('.phone--portal', devices);

  // Desktop / Mobile / Both (Both on wide screens, Mobile on phones)
  const buttons = $$('.device-switch button');
  const setView = view => {
    devices.dataset.view = view;
    buttons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === view)));
  };
  buttons.forEach(b => b.addEventListener('click', () => setView(b.dataset.view)));
  if (matchMedia('(max-width: 767px)').matches) setView('mobile');

  // Auto-scroll previews: the full page loads after the first screen, then glides
  if (!reduce) afterLoad(() => $$('.scroll-shot', devices).forEach(shot => {
    const full = new Image();
    full.className = 'full';
    full.alt = '';
    full.decoding = 'async';
    full.src = shot.dataset.full;
    full.decode().then(() => {
      // longer pages scroll for longer, 14–60 s each way
      const ratio = shot.dataset.h / shot.dataset.w;
      shot.style.setProperty('--dur', `${Math.min(60, Math.max(14, ratio * 6)).toFixed(1)}s`);
      shot.append(full);
      requestAnimationFrame(() => shot.classList.add('is-scrolling'));
    }, () => {});
  }));

  // Try it live: the real site in the phone, only after the click
  const live = $('.try-live');
  const failed = $('.live-failed');
  let frame = null, timer = 0;
  const fit = () => {
    if (!frame) return;
    const screen = $('.phone-screen', phone);
    const k = screen.clientWidth / 390;
    frame.style.transform = `scale(${k})`;
    frame.style.height = `${screen.clientHeight / k}px`;
  };
  const closeLive = () => {
    clearTimeout(timer);
    frame?.remove(); frame = null;
    phone.classList.remove('is-live');
    live.setAttribute('aria-pressed', 'false');
    live.textContent = live.dataset.on;
  };
  live?.addEventListener('click', () => {
    if (frame) return closeLive();
    if (devices.dataset.view === 'desktop') setView('both');
    failed.hidden = true;
    frame = Object.assign(document.createElement('iframe'), {
      src: live.dataset.live, width: 390, title: live.dataset.on,
      referrerPolicy: 'no-referrer',
    });
    frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox');
    let loaded = false;
    frame.addEventListener('load', () => { loaded = true; clearTimeout(timer); });
    timer = setTimeout(() => { if (!loaded) { closeLive(); failed.hidden = false; } }, 10000);
    $('.phone-screen', phone).append(frame);
    phone.classList.add('is-live');
    fit();
    live.setAttribute('aria-pressed', 'true');
    live.textContent = live.dataset.off;
  });
  addEventListener('resize', fit, { passive: true });

  // Gallery lightbox (without JS the links just open the image)
  const box = $('#lightbox');
  if (box) {
    const links = $$('.gallery a');
    const img = $('img', box);
    let at = 0;
    const show = i => {
      at = (i + links.length) % links.length;
      img.src = links[at].getAttribute('href');
      img.alt = $('img', links[at]).alt;
    };
    links.forEach((a, i) => a.addEventListener('click', e => { e.preventDefault(); show(i); box.showModal(); }));
    $$('[data-step]', box).forEach(b => b.addEventListener('click', () => show(at + Number(b.dataset.step))));
    $('[data-close]', box).addEventListener('click', () => box.close());
    box.addEventListener('click', e => { if (e.target === box) box.close(); });
    box.addEventListener('keydown', e => {
      const rtl = document.documentElement.dir === 'rtl';
      if (e.key === 'ArrowRight') show(at + (rtl ? -1 : 1));
      if (e.key === 'ArrowLeft') show(at + (rtl ? 1 : -1));
    });
  }
}
