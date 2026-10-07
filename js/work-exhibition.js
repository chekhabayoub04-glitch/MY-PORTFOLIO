(() => {
  const root = document.querySelector('[data-work-exhibition]');
  if (!root) return;

  const projects = [
    { type: 'web', title: 'Titan Gym', category: 'Website · Fitness', description: 'Bold digital presence for a modern training space.', image: 'images/titangym.jpg', url: 'https://chekhabayoub04-glitch.github.io/titan-gym/', detail: 'web-development.html' },
    { type: 'web', title: 'Dr. Badis Clinic', category: 'Website · Healthcare', description: 'A welcoming clinic experience built around patient trust.', image: 'images/project-drbadis.jpg', url: 'https://chekhabayoub11-ops.github.io/dr.badis/', detail: 'web-development.html' },
    { type: 'web', title: 'Dr. 213', category: 'Website · Healthcare', description: 'A focused medical platform with clear service pathways.', image: 'images/project-dr213.jpg', url: 'https://chekhabayoub11-ops.github.io/dr.213/', detail: 'web-development.html' },
    { type: 'web', title: 'We Can Speak Deutsch', category: 'Website · Education', description: 'A friendly digital home for German language learning.', image: 'images/project-deutsch.jpg', url: 'https://chekhabayoub11-ops.github.io/we-can-speak-deutsch/', detail: 'web-development.html' },
    { type: 'web', title: 'Coffee Break DZ', category: 'Website · Hospitality', description: 'A warm café identity presented through a simple web experience.', image: 'images/project-coffee.jpg', url: 'https://sites.google.com/view/coffebreakdz/home', detail: 'web-development.html' },
    { type: 'web', title: 'Saïda Real Estate', category: 'Website · Architecture', description: 'An architectural project presented as a polished promotional story.', image: 'images/Modern promotional website.jpg', url: 'https://chekhabayoub04-glitch.github.io/new-vession-promition-/', detail: 'web-development.html' },
    { type: 'image', title: 'Souq Al Sayarat — Buyer Guide', category: 'Campaign · Automotive', description: 'A clear Arabic campaign visual explaining the car-buying journey.', image: 'images/april3.png', detail: 'graphic-design.html' },
    { type: 'image', title: 'Souq Al Sayarat — Book a Test Drive', category: 'Campaign · Automotive', description: 'A desert-toned promotional story inviting customers to book a drive.', image: 'images/april4.png', detail: 'graphic-design.html' },
    { type: 'image', title: 'Souq Al Sayarat — Find Your Car', category: 'Campaign · Automotive', description: 'A social-first marketplace visual designed to make discovery simple.', image: 'images/april5.png', detail: 'graphic-design.html' },
    { type: 'image', title: 'Rely — Built for the Journey', category: 'Campaign · Automotive', description: 'A cinematic automotive campaign with a warm outdoor palette.', image: 'images/aprilll.jpg', detail: 'graphic-design.html' },
    { type: 'image', title: 'Online Window Quote', category: 'Campaign · Home Services', description: 'A service campaign focused on a quick, stress-free online estimate.', image: 'images/april1.jpg', detail: 'graphic-design.html' },
    { type: 'image', title: 'Breathe Better', category: 'Campaign · Home Services', description: 'A clean product message for replacement glazing and home comfort.', image: 'images/april2.jpg', detail: 'graphic-design.html' },
    { type: 'image', title: 'Lozan — Care for Every Journey', category: 'Campaign · Automotive', description: 'A premium maintenance visual built around a confident red palette.', image: 'images/lozan1.jpg', detail: 'graphic-design.html' },
    { type: 'image', title: 'Service Reminder', category: 'Campaign · Automotive', description: 'A direct maintenance reminder designed for mobile social feeds.', image: 'images/loazan3.jpg', detail: 'graphic-design.html' },
    { type: 'image', title: 'Auto Service — 5 Reasons', category: 'Campaign · Automotive', description: 'An informative post presenting key reasons to book a service visit.', image: 'images/rozan4.jpg', detail: 'graphic-design.html' },
    { type: 'image', title: 'Gel Cream — Botanical Care', category: 'Campaign · Beauty & Product', description: 'A product-focused skincare visual with a fresh green art direction.', image: 'images/rozan5.jpg', detail: 'graphic-design.html' },
    { type: 'image', title: 'Scent in Check', category: 'Campaign · Beauty & Product', description: 'A dramatic fragrance concept using contrast, texture, and reflection.', image: 'images/rozan6.jpg', detail: 'graphic-design.html' },
    { type: 'image', title: 'A Note of Summer', category: 'Campaign · Beauty & Product', description: 'A playful perfume visual with a bright, sunlit color story.', image: 'images/rozan7.jpg', detail: 'graphic-design.html' },
    { type: 'image', title: 'Arabian Nights', category: 'Campaign · Beauty & Product', description: 'A cinematic fragrance campaign with rich tones and tactile detail.', image: 'images/rozan8.jpg', detail: 'graphic-design.html' },
    { type: 'image', title: 'A Natural Blend', category: 'Campaign · Beauty & Product', description: 'A minimal product story arranged around ingredients and texture.', image: 'images/rozan9.jpg', detail: 'graphic-design.html' },
    { type: 'image', title: 'Restaurant Menu Collection', category: 'Graphic Design · Food & Hospitality', description: 'Rich menu artwork created to bring food photography and offers together.', image: 'images/graphic1.jpg', detail: 'graphic-design.html' },
    { type: 'image', title: 'Burger Brand Campaign', category: 'Graphic Design · Food & Hospitality', description: 'A bold promotional system for a fast-moving food brand.', image: 'images/graphic2.jpg', detail: 'graphic-design.html' },
    { type: 'image', title: 'New Dishes & Drinks', category: 'Graphic Design · Food & Hospitality', description: 'A high-impact menu feature built around clear hierarchy and appetite appeal.', image: 'images/graphic3.jpg', detail: 'graphic-design.html' },
    { type: 'image', title: 'Automotive Campaign System', category: 'Graphic Design · Automotive', description: 'A coordinated visual campaign with a striking black and yellow palette.', image: 'images/graphic4.jpg', detail: 'graphic-design.html' },
    { type: 'image', title: 'Electronics Product Showcase', category: 'Graphic Design · Product Advertising', description: 'A product-led campaign layout balancing feature callouts and imagery.', image: 'images/graphic5.jpg', detail: 'graphic-design.html' },
    { type: 'image', title: 'Match Day Poster', category: 'Graphic Design · Sports & Culture', description: 'An energetic sports graphic using layered portraits and collage.', image: 'images/graphic6.jpg', detail: 'graphic-design.html' },
    { type: 'image', title: 'Streetwear Visual Campaign', category: 'Graphic Design · Sports & Culture', description: 'A bold editorial composition for footwear and streetwear promotion.', image: 'images/graphic7.jpg', detail: 'graphic-design.html' },
    { type: 'logo', title: 'Kristina Afonina', category: 'Logo · Beauty', description: 'A refined signature mark presented as a luminous storefront identity.', image: 'images/logo2.jpg', detail: 'logo-design.html' },
    { type: 'logo', title: 'Strength & Form', category: 'Logo · Fitness', description: 'A bold emblem built around power, motion, and athletic character.', image: 'images/logo3.jpg', detail: 'logo-design.html' },
    { type: 'logo', title: 'Brew Bean', category: 'Logo · Hospitality', description: 'A playful coffee identity with a compact, memorable wordmark.', image: 'images/logo4.jpg', detail: 'logo-design.html' },
    { type: 'logo', title: 'Bakery Collection', category: 'Logo · Food & Drink', description: 'A set of warm, approachable marks for a family of food brands.', image: 'images/logo5.jpg', detail: 'logo-design.html' },
    { type: 'logo', title: 'Chic B’Lounge', category: 'Logo · Beauty', description: 'A purple visual identity extended across product and packaging touchpoints.', image: 'images/logo6.jpg', detail: 'logo-design.html' },
    { type: 'logo', title: 'The Yummy', category: 'Logo · Food & Drink', description: 'A friendly hand-lettered mark for a bright food brand.', image: 'images/logo7.jpg', detail: 'logo-design.html' },
    { type: 'logo', title: 'Design System', category: 'Logo · Brand Systems', description: 'A monochrome identity board exploring logo, stationery, and pattern.', image: 'images/logo8.jpg', detail: 'logo-design.html' },
    { type: 'logo', title: 'Roast & Ritual', category: 'Logo · Hospitality', description: 'A warm coffee-inspired emblem set against a richly textured surface.', image: 'images/logo9.jpg', detail: 'logo-design.html' },
    { type: 'logo', title: 'Coffee Energy', category: 'Logo · Hospitality', description: 'A bold café symbol paired with a clean, easy-to-read wordmark.', image: 'images/logo10.jpg', detail: 'logo-design.html' },
    { type: 'logo', title: 'Restaurant Marks', category: 'Logo · Food & Drink', description: 'A collection of colorful identity directions for food businesses.', image: 'images/logo11.jpg', detail: 'logo-design.html' },
    { type: 'logo', title: 'Logo Explorations', category: 'Logo · Brand Systems', description: 'A curated sheet of varied marks across several brand categories.', image: 'images/logo12.jpg', detail: 'logo-design.html' },
    { type: 'logo', title: 'Ruch', category: 'Logo · Food & Drink', description: 'A character-led identity designed for a playful food brand.', image: 'images/logo13.jpg', detail: 'logo-design.html' },
    { type: 'video', title: 'Clothing Brand Film', category: 'AI Film · Fashion', description: 'A cinematic fashion identity in motion.', image: 'videos/posters/01-clothing-brand.png', video: 'videos/brand-identity/01-clothing-brand.m4v', detail: 'ai-videos.html' },
    { type: 'video', title: 'Glass Brand Film', category: 'AI Film · Product', description: 'A polished product story for a contemporary glass brand.', image: 'videos/posters/02-glass-brand.png', video: 'videos/brand-identity/02-glass-brand.m4v', detail: 'ai-videos.html' },
    { type: 'video', title: 'Villa & Home Film', category: 'AI Film · Interior', description: 'A cinematic brand story shaped around modern living.', image: 'videos/posters/03-villa-home-brand.png', video: 'videos/brand-identity/03-villa-home-brand.m4v', detail: 'ai-videos.html' },
    { type: 'video', title: 'Car Brand Film', category: 'AI Film · Automotive', description: 'An atmospheric automotive identity film.', image: 'videos/posters/04-car-brand.png', video: 'videos/brand-identity/04-car-brand.m4v', detail: 'ai-videos.html' }
  ];

  const viewport = root.querySelector('.work-exhibition-viewport');
  const track = root.querySelector('.work-exhibition-track');
  const dots = root.querySelector('.exhibition-dots');
  const status = root.querySelector('.exhibition-status');
  const announcement = root.querySelector('.exhibition-announcement');
  const toggle = root.querySelector('.exhibition-toggle');
  let activeIndex = 0;
  let manuallyPaused = false;
  let videoPlaying = false;
  let exhibitionVisible = false;
  let viewerOpen = false;
  let interactionPausedUntil = 0;
  let lastTogglePaused = null;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) toggle.hidden = true;
  let scrollUpdateFrame = 0;
  let movementFrame = 0;

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
    viewerOpen = true;
    updateToggle();
    viewer.classList.add('is-open');
    document.body.classList.add('has-portfolio-lightbox');
    viewer.querySelector('button').focus();
  }

  function closeImage() {
    viewer.classList.remove('is-open');
    document.body.classList.remove('has-portfolio-lightbox');
    viewerOpen = false;
    updateToggle();
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

  function makeLoopCopy(sourceCards, className) {
    const fragment = document.createDocumentFragment();
    const copies = sourceCards.map(source => {
      const copy = source.cloneNode(true);
      copy.classList.add('is-loop-copy', className);
      copy.setAttribute('aria-hidden', 'true');
      copy.removeAttribute('aria-current');
      copy.inert = true;
      copy.querySelectorAll('a,button,video').forEach(control => {
        control.tabIndex = -1;
        if (control instanceof HTMLVideoElement) control.controls = false;
      });
      fragment.append(copy);
      return copy;
    });
    return { fragment, copies };
  }

  const leadingSet = makeLoopCopy(cards, 'loop-before');
  track.prepend(leadingSet.fragment);
  const trailingSet = makeLoopCopy(cards, 'loop-after');
  track.append(trailingSet.fragment);
  let loopStart = 0;
  let loopEnd = 0;

  function updateActive(index, announce = false) {
    activeIndex = (index + cards.length) % cards.length;
    cards.forEach((card, cardIndex) => card.setAttribute('aria-current', String(cardIndex === activeIndex)));
    dotButtons.forEach((dot, dotIndex) => dot.setAttribute('aria-current', String(dotIndex === activeIndex)));
    status.textContent = `${String(activeIndex + 1).padStart(2, '0')} / ${String(cards.length).padStart(2, '0')}`;
    if (announce) announcement.textContent = `${projects[activeIndex].title}, ${activeIndex + 1} of ${cards.length}`;
  }

  function goTo(index) {
    const next = (index + cards.length) % cards.length;
    const previous = activeIndex;
    updateActive(next, true);
    let card = cards[next];
    if (previous === 0 && next === cards.length - 1) card = leadingSet.copies[next];
    else if (previous === cards.length - 1 && next === 0) card = trailingSet.copies[next];
    const centeredLeft = card.offsetLeft - track.offsetLeft - (viewport.clientWidth - card.offsetWidth) / 2;
    viewport.scrollTo({ left: centeredLeft, behavior: 'smooth' });
    interactionPausedUntil = performance.now() + 900;
    updateToggle();
  }

  function updateToggle() {
    const paused = manuallyPaused || videoPlaying || viewerOpen || performance.now() < interactionPausedUntil;
    toggle.setAttribute('aria-pressed', String(manuallyPaused));
    toggle.setAttribute('aria-label', paused ? 'Resume automatic gallery movement' : 'Pause automatic gallery movement');
    if (lastTogglePaused === paused) return;
    lastTogglePaused = paused;
    toggle.innerHTML = paused
      ? '<i class="fas fa-play" aria-hidden="true"></i><span>Play</span>'
      : '<i class="fas fa-pause" aria-hidden="true"></i><span>Pause</span>';
  }

  root.querySelector('.exhibition-arrow.previous').addEventListener('click', () => goTo(activeIndex - 1));
  root.querySelector('.exhibition-arrow.next').addEventListener('click', () => goTo(activeIndex + 1));
  toggle.addEventListener('click', () => { manuallyPaused = !manuallyPaused; updateToggle(); });
  viewport.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); goTo(activeIndex - 1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); goTo(activeIndex + 1); }
  });
  viewport.addEventListener('pointerdown', () => { interactionPausedUntil = performance.now() + 5000; updateToggle(); }, { passive: true });
  const resumeAfterGesture = () => { interactionPausedUntil = performance.now() + 450; updateToggle(); };
  viewport.addEventListener('pointerup', resumeAfterGesture, { passive: true });
  viewport.addEventListener('pointercancel', resumeAfterGesture, { passive: true });
  viewport.addEventListener('wheel', () => { interactionPausedUntil = performance.now() + 450; updateToggle(); }, { passive: true });
  viewport.addEventListener('scroll', () => {
    if (scrollUpdateFrame) cancelAnimationFrame(scrollUpdateFrame);
    scrollUpdateFrame = requestAnimationFrame(() => {
      const center = viewport.scrollLeft + viewport.clientWidth / 2;
      let nearest = 0, nearestDistance = Infinity;
      cards.forEach((card, index) => {
        const cardCenter = card.offsetLeft - track.offsetLeft + card.offsetWidth / 2;
        const distance = Math.abs(center - cardCenter);
        if (distance < nearestDistance) { nearestDistance = distance; nearest = index; }
      });
      if (nearest !== activeIndex) updateActive(nearest);
      updateToggle();
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
  function alignLoop() {
    const leadingCard = cards[0];
    const trailingFirst = trailingSet.copies[0];
    const centerOffset = (viewport.clientWidth - leadingCard.offsetWidth) / 2;
    loopStart = leadingCard.offsetLeft - track.offsetLeft - centerOffset;
    loopEnd = loopStart + trailingFirst.offsetLeft - leadingCard.offsetLeft;
    viewport.scrollLeft = loopStart;
  }
  alignLoop();
  window.addEventListener('resize', alignLoop, { passive: true });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => { exhibitionVisible = entries[0].isIntersecting; }, { threshold: 0.12 });
    observer.observe(root);
  } else exhibitionVisible = true;
  let previousTime = 0;
  function moveGallery(time) {
    const canMove = exhibitionVisible && !manuallyPaused && !videoPlaying && !viewerOpen && performance.now() >= interactionPausedUntil && !document.hidden;
    if (canMove && previousTime) {
      const span = Math.max(1, loopEnd - loopStart);
      const cinematicSpeed = 60;
      const nextLeft = viewport.scrollLeft + cinematicSpeed * Math.min(40, time - previousTime) / 1000;
      viewport.scrollLeft = nextLeft >= loopEnd ? loopStart + (nextLeft - loopEnd) : nextLeft;
    }
    previousTime = canMove ? time : 0;
    movementFrame = requestAnimationFrame(moveGallery);
  }
  if (!reducedMotion) movementFrame = requestAnimationFrame(moveGallery);
  window.addEventListener('pagehide', () => {
    if (movementFrame) cancelAnimationFrame(movementFrame);
    if (scrollUpdateFrame) cancelAnimationFrame(scrollUpdateFrame);
  }, { once: true });
})();
