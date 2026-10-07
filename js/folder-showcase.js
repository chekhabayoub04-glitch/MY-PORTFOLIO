(() => {
  const collections = {
    'web-development.html': [
      'images/project-drbadis.jpg', 'images/project-dr213.jpg', 'images/titangym.jpg',
      'images/project-deutsch.jpg', 'images/project-coffee.jpg'
    ],
    'graphic-design.html': [
      'images/april3.png', 'images/april4.png', 'images/graphic-campaigns-cover.png',
      'images/aprilll.jpg', 'images/rozan6.jpg'
    ],
    'logo-design.html': [
      'images/logo2.jpg', 'images/logo3.jpg', 'images/logo4.jpg',
      'images/logo6.jpg', 'images/logo9.jpg'
    ],
    'ai-videos.html': [
      'videos/posters/01-clothing-brand.png', 'videos/posters/02-glass-brand.png',
      'videos/posters/03-villa-home-brand.png', 'videos/posters/04-car-brand.png'
    ],
    'campaigns.html': [
      'images/april3.png', 'images/april4.png', 'images/april5.png',
      'images/aprilll.jpg', 'images/april1.jpg'
    ],
    'editing.html': [
      'videos/posters/01-clothing-brand.png', 'videos/posters/02-glass-brand.png',
      'videos/posters/03-villa-home-brand.png', 'videos/posters/04-car-brand.png'
    ]
  };

  document.querySelectorAll('.services-showcase-grid .service-card, #work .service-card').forEach(card => {
    const destination = new URL(card.href, window.location.href).pathname.split('/').pop();
    const images = collections[destination];
    if (!images) return;
    const heading = card.querySelector('.service-body h3');
    const titleText = heading?.textContent.trim() || 'Selected Work';
    card.setAttribute('aria-label', titleText);
    let stage = card.querySelector('.service-img-wrap, .service-visual-art');
    if (!stage) {
      stage = document.createElement('div');
      stage.className = 'folder-showcase folder-showcase--compact';
      card.prepend(stage);
    }

    stage.classList.add('folder-showcase');
    if (card.closest('#work')) stage.classList.add('folder-showcase--compact');
    stage.setAttribute('aria-hidden', 'true');
    const deck = document.createElement('span');
    deck.className = 'folder-deck';
    images.forEach((source, index) => {
      const leaf = document.createElement('span');
      leaf.className = 'folder-leaf';
      leaf.style.setProperty('--leaf-index', index);
      const image = document.createElement('img');
      image.src = source;
      image.alt = '';
      image.loading = 'lazy';
      image.decoding = 'async';
      leaf.append(image);
      deck.append(leaf);
    });

    const pocket = document.createElement('span');
    pocket.className = 'folder-pocket';
    const title = document.createElement('strong');
    title.className = 'folder-pocket-title';
    title.textContent = titleText;
    pocket.append(title);
    stage.append(deck, pocket);
  });
})();
