(() => {
  const root = document.querySelector('[data-work-exhibition]');
  if (!root) return;

  const projects = [
    { type: 'web', title: 'Titan Gym', category: 'Website · Fitness', description: 'A bold digital home for a modern training space.', image: 'images/titangym.jpg', url: 'https://chekhabayoub04-glitch.github.io/titan-gym/', detail: 'web-development.html' },
    { type: 'web', title: 'Dr. Badis Clinic', category: 'Website · Healthcare', description: 'A welcoming clinic website built around patient trust.', image: 'images/project-drbadis.jpg', url: 'https://chekhabayoub11-ops.github.io/dr.badis/', detail: 'web-development.html' },
    { type: 'web', title: 'We Can Speak Deutsch', category: 'Website · Education', description: 'A friendly online home for German language learning.', image: 'images/project-deutsch.jpg', url: 'https://chekhabayoub11-ops.github.io/we-can-speak-deutsch/', detail: 'web-development.html' },
    { type: 'image', title: 'Souq Al Sayarat', category: 'Campaign · Automotive', description: 'A social campaign concept for an Arabic car marketplace.', image: 'images/april3.png', detail: 'graphic-design.html' },
    { type: 'image', title: 'Rely — Built for the Journey', category: 'Campaign · Automotive', description: 'A cinematic automotive visual with a warm desert palette.', image: 'images/aprilll.jpg', detail: 'graphic-design.html' },
    { type: 'logo', title: 'Strength & Form', category: 'Logo · Fitness', description: 'A strong emblem shaped around power and athletic movement.', image: 'images/logo3.jpg', detail: 'logo-design.html' },
    { type: 'logo', title: 'Brew Bean', category: 'Logo · Hospitality', description: 'A memorable coffee identity with a playful wordmark.', image: 'images/logo4.jpg', detail: 'logo-design.html' },
    { type: 'video', title: 'Clothing Brand Film', category: 'AI Film · Fashion', description: 'A cinematic fashion identity in motion.', image: 'videos/posters/01-clothing-brand.png', video: 'videos/brand-identity/01-clothing-brand.m4v', detail: 'ai-videos.html' },
    { type: 'video', title: 'Glass Brand Film', category: 'AI Film · Product', description: 'A polished product story for a contemporary glass brand.', image: 'videos/posters/02-glass-brand.png', video: 'videos/brand-identity/02-glass-brand.m4v', detail: 'ai-videos.html' }
  ];

  const viewport = root.querySelector('.work-exhibition-viewport');
  const track = root.querySelector('.work-exhibition-track');
  const dots = root.querySelector('.exhibition-dots');
  const status = root.querySelector('.exhibition-status');
  const announcement = root.querySelector('.exhibition-announcement');
  const toggle = root.querySelector('.exhibition-toggle');
  let activeIndex = 0;
  let manuallyPaused = false;
  let hoverPaused = false;
  let focusPaused = false;
  let videoPlaying = false;
  let exhibitionVisible = false;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) toggle.hidden = true;
  let animationFrame = 0;

  const viewer = document.createElement('div');
  viewer.className = 'exhibition-lightbox';
  viewer.setAttribute('role', 'dialog');
  viewer.setAttribute('aria-modal', 'true');
  viewer.setAttribute('aria-label', 'Artwork viewer');
  viewer.innerHTML = '<button type="button" class="exhibition-viewer-close" aria-label="Close image"><i class="fas fa-xmark" aria-hidden="true"></i></button><img alt="">';
  document.body.append(viewer);
  const viewerImage = viewer.querySelector('img');
  let viewerReturnFocus = null;

  function openImage(project, target) {
    viewerImage.src = project.image;
    viewerImage.alt = project.title;
    viewerReturnFocus = target;
    viewer.classList.add('is-open');
    document.body.classList.add('has-portfolio-lightbox');
    viewer.querySelector('button').focus();
  }

  function closeImage() {
    viewer.classList.remove('is-open');
    document.body.classList.remove('has-portfolio-lightbox');
    viewerImage.removeAttribute('src');
    viewerReturnFocus?.focus();
  }

  projects.forEach((project, index) => {
    const card = document.createElement('article');
    card.className = `exhibition-card exhibition-card--${project.type}`;
    card.setAttribute('aria-label', `${project.title}, ${project.category}`);

    const media = document.createElement('div');
    media.className = 'exhibition-media';
    if (project.type === 'web') {
      const device = document.createElement('a');
      device.className = 'exhibition-phone';
      device.href = project.url;
      device.target = '_blank';
      device.rel = 'noopener noreferrer';
      device.setAttribute('aria-label', `Open ${project.title} website in a new tab`);
      const screen = document.createElement('img');
      screen.src = project.image;
      screen.alt = `${project.title} website preview`;
      screen.loading = 'lazy';
      screen.decoding = 'async';
      device.append(screen);
      media.append(device);
    } else if (project.type === 'video') {
      const device = document.createElement('div');
      device.className = 'exhibition-phone exhibition-phone--video';
      const video = document.createElement('video');
      video.controls = true;
      video.playsInline = true;
      video.preload = 'none';
      video.poster = project.image;
      video.setAttribute('aria-label', project.title);
      const source = document.createElement('source');
      source.src = project.video;
      source.type = 'video/mp4';
      video.append(source);
      video.addEventListener('play', () => { videoPlaying = true; updateToggle(); });
      video.addEventListener('pause', () => { videoPlaying = [...root.querySelectorAll('video')].some(entry => !entry.paused); updateToggle(); });
      device.append(video);
      media.append(device);
    } else {
      const artwork = document.createElement('button');
      artwork.type = 'button';
      artwork.className = 'exhibition-artwork';
      artwork.setAttribute('aria-label', `Open ${project.title} image`);
      const image = document.createElement('img');
      image.src = project.image;
      image.alt = project.title;
      image.loading = 'lazy';
      image.decoding = 'async';
      const zoom = document.createElement('span');
      zoom.className = 'exhibition-zoom';
      zoom.innerHTML = '<i class="fas fa-expand" aria-hidden="true"></i>';
      artwork.append(image, zoom);
      artwork.addEventListener('click', () => openImage(project, artwork));
      media.append(artwork);
    }
    card.append(media);

    const body = document.createElement('div');
    body.className = 'exhibition-card-body';
    const category = document.createElement('span');
    category.className = 'exhibition-category';
    category.textContent = project.category;
    const title = document.createElement('h3');
    title.textContent = project.title;
    const description = document.createElement('p');
    description.textContent = project.description;
    const link = document.createElement('a');
    link.className = 'exhibition-project-link';
    link.href = project.type === 'web' ? project.url : project.detail;
    if (project.type === 'web') { link.target = '_blank'; link.rel = 'noopener noreferrer'; }
    link.innerHTML = project.type === 'web'
      ? 'Open website <i class="fas fa-arrow-up-right-from-square" aria-hidden="true"></i>'
      : project.type === 'video'
        ? 'View all films <i class="fas fa-arrow-right" aria-hidden="true"></i>'
        : project.type === 'logo'
          ? 'Explore logos <i class="fas fa-arrow-right" aria-hidden="true"></i>'
          : 'Explore visual work <i class="fas fa-arrow-right" aria-hidden="true"></i>';
    body.append(category, title, description, link);
    card.append(body);
    track.append(card);

    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'exhibition-dot';
    dot.setAttribute('aria-label', `Show project ${index + 1}: ${project.title}`);
    dot.addEventListener('click', () => goTo(index));
    dots.append(dot);
  });

  const cards = [...track.children];
  const dotButtons = [...dots.children];

  function updateActive(index, announce = false) {
    activeIndex = (index + cards.length) % cards.length;
    cards.forEach((card, cardIndex) => card.setAttribute('aria-current', String(cardIndex === activeIndex)));
    dotButtons.forEach((dot, dotIndex) => dot.setAttribute('aria-current', String(dotIndex === activeIndex)));
    status.textContent = `${String(activeIndex + 1).padStart(2, '0')} / ${String(cards.length).padStart(2, '0')}`;
    if (announce) announcement.textContent = `${projects[activeIndex].title}, ${activeIndex + 1} of ${cards.length}`;
  }

  function goTo(index) {
    const next = (index + cards.length) % cards.length;
    updateActive(next, true);
    const card = cards[next];
    const centeredLeft = card.offsetLeft - track.offsetLeft - (viewport.clientWidth - card.offsetWidth) / 2;
    viewport.scrollTo({ left: centeredLeft, behavior: 'smooth' });
  }

  function updateToggle() {
    const paused = manuallyPaused || hoverPaused || focusPaused || videoPlaying;
    toggle.setAttribute('aria-pressed', String(manuallyPaused));
    toggle.setAttribute('aria-label', manuallyPaused ? 'Resume automatic gallery movement' : 'Pause automatic gallery movement');
    toggle.innerHTML = paused
      ? '<i class="fas fa-play" aria-hidden="true"></i><span>Play</span>'
      : '<i class="fas fa-pause" aria-hidden="true"></i><span>Pause</span>';
  }

  root.querySelector('.exhibition-arrow.previous').addEventListener('click', () => goTo(activeIndex - 1));
  root.querySelector('.exhibition-arrow.next').addEventListener('click', () => goTo(activeIndex + 1));
  toggle.addEventListener('click', () => { manuallyPaused = !manuallyPaused; updateToggle(); });
  root.addEventListener('mouseenter', () => { hoverPaused = true; updateToggle(); });
  root.addEventListener('mouseleave', () => { hoverPaused = false; updateToggle(); });
  root.addEventListener('focusin', () => { focusPaused = true; updateToggle(); });
  root.addEventListener('focusout', event => {
    if (!root.contains(event.relatedTarget)) { focusPaused = false; updateToggle(); }
  });
  viewport.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); goTo(activeIndex - 1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); goTo(activeIndex + 1); }
  });
  viewport.addEventListener('scroll', () => {
    if (animationFrame) cancelAnimationFrame(animationFrame);
    animationFrame = requestAnimationFrame(() => {
      const center = viewport.scrollLeft + viewport.clientWidth / 2;
      let nearest = 0, nearestDistance = Infinity;
      cards.forEach((card, index) => {
        const cardCenter = card.offsetLeft - track.offsetLeft + card.offsetWidth / 2;
        const distance = Math.abs(center - cardCenter);
        if (distance < nearestDistance) { nearestDistance = distance; nearest = index; }
      });
      updateActive(nearest);
    });
  }, { passive: true });

  viewer.querySelector('button').addEventListener('click', closeImage);
  viewer.addEventListener('click', event => { if (event.target === viewer) closeImage(); });
  document.addEventListener('keydown', event => {
    if (!viewer.classList.contains('is-open')) return;
    if (event.key === 'Escape') closeImage();
    if (event.key === 'Tab') { event.preventDefault(); viewer.querySelector('button').focus(); }
  });

  updateActive(0);
  updateToggle();
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => { exhibitionVisible = entries[0].isIntersecting; }, { threshold: 0.12 });
    observer.observe(root);
  } else exhibitionVisible = true;
  const rotation = reducedMotion ? null : window.setInterval(() => {
    if (exhibitionVisible && !manuallyPaused && !hoverPaused && !focusPaused && !document.hidden && !videoPlaying) goTo(activeIndex + 1);
  }, 5600);
  window.addEventListener('pagehide', () => { if (rotation) window.clearInterval(rotation); }, { once: true });
})();
