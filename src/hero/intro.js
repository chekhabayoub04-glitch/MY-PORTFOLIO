// Opening screen: the bat and the name over black while the walk loads, a gold
// bar filling underneath, then the screen lifts and the walk starts from its
// first frame. At least MIN ms (so it reads as an intro, not a flash), at most
// MAX ms (a slow network never holds the site). Skipped when arriving from a
// project page (the door transition plays instead) and for reduced motion.
const MIN = 1800;
const MAX = 4500;

export function runIntro(getVideo) {
  const root = document.documentElement;
  const el = document.getElementById('intro');
  if (!el) return Promise.resolve();
  const skip = root.classList.contains('is-arriving') || matchMedia('(prefers-reduced-motion: reduce)').matches
    || performance.getEntriesByType('navigation')[0]?.type === 'back_forward';
  if (skip) { el.remove(); return Promise.resolve(); }

  root.classList.add('is-intro');
  const bar = el.querySelector('.intro-bar i');
  const t0 = performance.now();

  // How much of the walk is in: enough to play through counts as all of it
  const loaded = () => {
    const video = getVideo();
    if (!video) return 0;
    if (video.readyState >= 4) return 1;
    const { buffered, duration } = video;
    return buffered.length && duration ? Math.min(1, buffered.end(buffered.length - 1) / duration) : 0;
  };

  return new Promise(resolve => {
    let shown = 0;
    const frame = now => {
      const t = now - t0;
      const ready = loaded() >= 1 || (getVideo()?.readyState ?? 0) >= 3;
      // time alone fills to 80%, the video carries it the rest of the way
      const target = (t >= MIN && ready) || t >= MAX ? 1 : Math.max(Math.min(.8, t / MAX), Math.min(.95, loaded()));
      shown += (target - shown) * .12;
      bar.style.setProperty('--p', shown.toFixed(3));
      if (target === 1 && shown > .985) {
        bar.style.setProperty('--p', 1);
        setTimeout(() => {
          el.classList.add('is-done');
          root.classList.remove('is-intro');
          resolve();
          setTimeout(() => el.remove(), 900);
        }, 180);
        return;
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  });
}
