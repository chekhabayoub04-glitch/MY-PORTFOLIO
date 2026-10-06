(() => {
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const coarsePointer = window.matchMedia('(hover: none), (pointer: coarse)');
  if (motionPreference.matches || coarsePointer.matches) return;

  const bat = document.createElement('div');
  bat.className = 'bat-companion';
  bat.setAttribute('aria-hidden', 'true');
  bat.innerHTML = `
    <svg viewBox="0 0 160 100" xmlns="http://www.w3.org/2000/svg" focusable="false">
      <defs>
        <linearGradient id="batMetal" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff2b0"/><stop offset=".22" stop-color="#ffd342"/><stop offset=".52" stop-color="#9a5700"/><stop offset=".78" stop-color="#ffce35"/><stop offset="1" stop-color="#fff0a2"/></linearGradient>
        <linearGradient id="batMembrane" x1=".15" y1="0" x2=".8" y2="1"><stop stop-color="#282116"/><stop offset=".55" stop-color="#08090b"/><stop offset="1" stop-color="#35240c"/></linearGradient>
        <radialGradient id="batEye"><stop stop-color="#fffbd0"/><stop offset=".28" stop-color="#ffd536"/><stop offset="1" stop-color="#ff9500"/></radialGradient>
      </defs>
      <g class="companion-wing companion-wing-left">
        <path class="bat-membrane" d="M77 46C67 40 57 23 48 8c-2 10-5 17-12 23-2-7-6-13-14-18 3 12 1 20-7 27-4-3-8-4-13-4 8 10 16 16 27 18-4 5-6 11-5 19 10-3 18-6 27-8 3 9 11 17 22 24-2-11 0-20 5-27Z"/>
        <path class="bat-edge" d="M76 45C63 36 55 19 48 8c-2 10-5 17-12 23-2-7-6-13-14-18 3 12 1 20-7 27-4-3-8-4-13-4 8 10 16 16 27 18-4 5-6 11-5 19 10-3 18-6 27-8 3 9 11 17 22 24"/>
        <path class="bat-vein" d="M74 51 48 8M72 53 36 31M68 57 16 40M65 61 24 72M64 57 22 13"/>
        <path class="bat-panel" d="m48 8 10 36-22-13M36 31l32 26-52-17M16 40l49 21-41 11"/>
      </g>
      <g class="companion-wing companion-wing-right"><g transform="translate(160 0) scale(-1 1)">
        <path class="bat-membrane" d="M77 46C67 40 57 23 48 8c-2 10-5 17-12 23-2-7-6-13-14-18 3 12 1 20-7 27-4-3-8-4-13-4 8 10 16 16 27 18-4 5-6 11-5 19 10-3 18-6 27-8 3 9 11 17 22 24-2-11 0-20 5-27Z"/>
        <path class="bat-edge" d="M76 45C63 36 55 19 48 8c-2 10-5 17-12 23-2-7-6-13-14-18 3 12 1 20-7 27-4-3-8-4-13-4 8 10 16 16 27 18-4 5-6 11-5 19 10-3 18-6 27-8 3 9 11 17 22 24"/>
        <path class="bat-vein" d="M74 51 48 8M72 53 36 31M68 57 16 40M65 61 24 72M64 57 22 13"/>
        <path class="bat-panel" d="m48 8 10 36-22-13M36 31l32 26-52-17M16 40l49 21-41 11"/>
      </g></g>
      <path class="bat-body" d="M80 31c-8 0-14 6-14 14 0 6 4 10 8 12l-4 17 10 12 10-12-4-17c4-2 8-6 8-12 0-8-6-14-14-14Z"/>
      <path class="bat-ears" d="m70 39-7-18 17 12 17-12-7 18"/>
      <path class="bat-face-line" d="M69 48c4-3 8-3 11 0 3-3 7-3 11 0M75 56l5 4 5-4M80 63v17"/>
      <ellipse class="bat-eye" cx="73" cy="48" rx="2.7" ry="1.7"/><ellipse class="bat-eye" cx="87" cy="48" rx="2.7" ry="1.7"/>
      <path class="bat-tail" d="m73 73 7 5 7-5-2 12-5 7-5-7Z"/>
      <path class="bat-core" d="M80 33v39"/>
    </svg>`;
  document.body.appendChild(bat);

  let pointerX = innerWidth * 0.5;
  let pointerY = innerHeight * 0.34;
  let pointerHeadingX = 1;
  let pointerHeadingY = 0;
  let lastPointerX = pointerX;
  let lastPointerY = pointerY;
  let lastPointerAt = -Infinity;
  let positionX = innerWidth * 0.28;
  let positionY = innerHeight * 0.36;
  let previousX = positionX;
  let previousY = positionY;
  let phase = Math.random() * Math.PI * 2;
  let previousFrame = 0;
  let frameRequest = 0;

  function onPointerMove(event) {
    const dx = event.clientX - lastPointerX;
    const dy = event.clientY - lastPointerY;
    const length = Math.hypot(dx, dy);
    if (length > 2) {
      pointerHeadingX = dx / length;
      pointerHeadingY = dy / length;
    }
    pointerX = event.clientX;
    pointerY = event.clientY;
    lastPointerX = pointerX;
    lastPointerY = pointerY;
    lastPointerAt = performance.now();
  }

  function animate(now) {
    frameRequest = 0;
    if (document.hidden) return;
    const dt = Math.min((now - (previousFrame || now)) / 1000, 0.05);
    previousFrame = now;
    const followingPointer = now - lastPointerAt < 1450;
    let targetX;
    let targetY;

    if (followingPointer) {
      targetX = pointerX - pointerHeadingX * 92;
      targetY = pointerY - pointerHeadingY * 54;
    } else {
      phase += dt * 0.36;
      targetX = innerWidth * 0.5 + Math.cos(phase) * innerWidth * 0.23;
      targetY = innerHeight * 0.43 + Math.sin(phase * 1.7) * innerHeight * 0.17;
    }

    const margin = 56;
    targetX = Math.max(margin, Math.min(innerWidth - margin, targetX));
    targetY = Math.max(margin, Math.min(innerHeight - margin, targetY));
    const smooth = 1 - Math.exp(-dt / (followingPointer ? 0.72 : 1.15));
    positionX += (targetX - positionX) * smooth;
    positionY += (targetY - positionY) * smooth;

    const dx = positionX - previousX;
    const dy = positionY - previousY;
    const speed = Math.hypot(dx, dy);
    const direction = dx < -0.5 ? -1 : 1;
    const tilt = Math.max(-13, Math.min(13, dy * 0.12));
    const opacity = followingPointer ? 0.9 : 0.76;
    bat.style.opacity = String(opacity);
    bat.style.transform = `translate3d(${positionX - 80}px, ${positionY - 50}px, 0) rotate(${tilt}deg) scaleX(${direction}) scale(${1 + Math.min(speed / 500, 0.07)})`;
    bat.classList.toggle('is-gliding', speed < 0.08);
    previousX = positionX;
    previousY = positionY;
    frameRequest = requestAnimationFrame(animate);
  }

  function start() {
    if (!frameRequest && !document.hidden && !motionPreference.matches && !coarsePointer.matches) {
      previousFrame = 0;
      frameRequest = requestAnimationFrame(animate);
      bat.classList.remove('is-paused');
      bat.classList.add('is-flying');
    }
  }

  function stop() {
    if (frameRequest) cancelAnimationFrame(frameRequest);
    frameRequest = 0;
    bat.classList.remove('is-flying');
    bat.classList.add('is-paused');
  }

  document.addEventListener('pointermove', onPointerMove, { passive: true });
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
  motionPreference.addEventListener?.('change', event => event.matches ? stop() : start());
  coarsePointer.addEventListener?.('change', event => event.matches ? stop() : start());
  start();
})();
