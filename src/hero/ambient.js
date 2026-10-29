// The film keeps walking, faint and blurred, behind everything after the hero.
// Off over the hero (it has its own film) and over client work, so the work
// reads clean. Paused when the tab is hidden; a still frame for reduced motion
// and Save-Data.

export function createAmbient({ hero, still = false, small = false }) {
  const el = document.getElementById('ambient');
  const video = el.querySelector('video');
  let overHero = true, overWork = false, sourced = false;

  if (still) {
    video.poster = '/hero/poster-540.webp';
  }

  function source() {
    if (sourced || still) return;
    sourced = true;
    if (small) video.src = '/hero/ambient-540.mp4';
    else video.src = video.canPlayType('video/webm; codecs="vp9"') ? '/hero/ambient.webm' : '/hero/ambient.mp4';
  }

  function sync() {
    const on = !overHero && !overWork;
    el.classList.toggle('is-on', on);
    if (still) return;
    if (on && !document.hidden) { source(); video.play().catch(() => {}); }
    else video.pause();
  }

  // Over the hero: until its last screen has mostly scrolled away
  new IntersectionObserver(([e]) => { overHero = e.isIntersecting; sync(); }, { rootMargin: '0px 0px -55% 0px' }).observe(hero);

  // Over client work: any chapter crossing the middle band of the screen
  const busy = new Set();
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => (e.isIntersecting ? busy.add(e.target) : busy.delete(e.target)));
    overWork = busy.size > 0;
    sync();
  }, { rootMargin: '-30% 0px -30% 0px' });
  document.querySelectorAll('[data-ambient="off"], .chapter').forEach(c => io.observe(c));

  document.addEventListener('visibilitychange', sync);
  return { sync };
}
