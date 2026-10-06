(() => {
  const root = document.querySelector('[data-portfolio-gallery]');
  if (!root) return;

  const items = Array.isArray(window.PORTFOLIO_ITEMS) ? window.PORTFOLIO_ITEMS : [];
  const type = window.PORTFOLIO_TYPE || 'image';
  const grid = root.querySelector('.portfolio-grid');
  const filters = root.querySelector('.portfolio-filters');
  const search = root.querySelector('.portfolio-search');
  const count = root.querySelector('.portfolio-count');
  const empty = root.querySelector('.portfolio-empty');
  const categories = ['All work', ...new Set(items.map(item => item.category).filter(Boolean))];
  let activeCategory = 'All work';
  let activeIndex = -1;
  let lastFocus = null;

  const modal = document.createElement('div');
  modal.className = 'portfolio-lightbox';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-label', 'Project image viewer');
  modal.innerHTML = `
    <div class="portfolio-lightbox-panel">
      <div class="portfolio-lightbox-top">
        <p class="portfolio-lightbox-caption"></p>
        <button class="portfolio-lightbox-close" type="button" aria-label="Close viewer"><i class="fas fa-xmark" aria-hidden="true"></i></button>
      </div>
      <div class="portfolio-lightbox-stage">
        <button class="portfolio-lightbox-arrow previous" type="button" aria-label="Previous project"><i class="fas fa-arrow-left" aria-hidden="true"></i></button>
        <img alt="">
        <button class="portfolio-lightbox-arrow next" type="button" aria-label="Next project"><i class="fas fa-arrow-right" aria-hidden="true"></i></button>
      </div>
      <p class="portfolio-lightbox-count" aria-live="polite"></p>
    </div>`;
  document.body.appendChild(modal);

  const modalImage = modal.querySelector('img');
  const modalCaption = modal.querySelector('.portfolio-lightbox-caption');
  const modalCount = modal.querySelector('.portfolio-lightbox-count');

  function visibleItems() {
    const query = (search?.value || '').trim().toLocaleLowerCase();
    return items.map((item, index) => ({ item, index })).filter(({ item }) => {
      const matchesCategory = activeCategory === 'All work' || item.category === activeCategory;
      const text = `${item.title} ${item.description || ''} ${item.category || ''}`.toLocaleLowerCase();
      return matchesCategory && (!query || text.includes(query));
    });
  }

  function openViewer(index, focusTarget) {
    const visible = visibleItems();
    const position = visible.findIndex(entry => entry.index === index);
    if (position < 0) return;
    activeIndex = position;
    lastFocus = focusTarget;
    modal.classList.add('is-open');
    document.body.classList.add('has-portfolio-lightbox');
    showViewerItem();
    modal.querySelector('.portfolio-lightbox-close').focus();
  }

  function showViewerItem() {
    const visible = visibleItems();
    if (!visible.length) return closeViewer();
    activeIndex = (activeIndex + visible.length) % visible.length;
    const { item } = visible[activeIndex];
    modalImage.src = item.image;
    modalImage.alt = item.title;
    modalCaption.textContent = item.title;
    modalCount.textContent = `${String(activeIndex + 1).padStart(2, '0')} / ${String(visible.length).padStart(2, '0')}`;
  }

  function closeViewer() {
    modal.classList.remove('is-open');
    document.body.classList.remove('has-portfolio-lightbox');
    modalImage.removeAttribute('src');
    lastFocus?.focus();
  }

  function renderCards() {
    const visible = visibleItems();
    grid.replaceChildren();
    count.textContent = `${String(visible.length).padStart(2, '0')} PROJECT${visible.length === 1 ? '' : 'S'}`;
    empty.hidden = visible.length > 0;

    visible.forEach(({ item, index }, displayIndex) => {
      const card = document.createElement('article');
      card.className = 'portfolio-card';
      card.style.setProperty('--card-index', displayIndex);
      card.dataset.kind = type;

      const media = document.createElement('div');
      media.className = 'portfolio-card-media';
      if (type !== 'web') media.classList.add('is-artwork');

      const preview = document.createElement('button');
      preview.type = 'button';
      preview.className = 'portfolio-card-preview';
      preview.setAttribute('aria-label', `View ${item.title} image`);
      const image = document.createElement('img');
      image.src = item.image;
      image.alt = item.title;
      image.loading = 'lazy';
      image.decoding = 'async';
      preview.append(image);
      const zoom = document.createElement('span');
      zoom.className = 'portfolio-zoom';
      zoom.innerHTML = '<i class="fas fa-arrow-up-right-from-square" aria-hidden="true"></i>';
      preview.append(zoom);
      preview.addEventListener('click', () => openViewer(index, preview));
      media.append(preview);

      const body = document.createElement('div');
      body.className = 'portfolio-card-body';
      const meta = document.createElement('div');
      meta.className = 'portfolio-card-meta';
      const category = document.createElement('span');
      category.className = 'portfolio-category';
      category.textContent = item.category || 'Selected work';
      const number = document.createElement('span');
      number.className = 'portfolio-number';
      number.textContent = String(index + 1).padStart(2, '0');
      meta.append(category, number);
      const heading = document.createElement('h3');
      heading.textContent = item.title;
      const description = document.createElement('p');
      description.textContent = item.description || '';
      body.append(meta, heading, description);

      if (item.url) {
        const link = document.createElement('a');
        link.className = 'portfolio-card-link';
        link.href = item.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.innerHTML = 'Visit live project <i class="fas fa-arrow-up-right-from-square" aria-hidden="true"></i>';
        body.append(link);
      }
      card.append(media, body);
      grid.append(card);
    });
  }

  categories.forEach((label, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'portfolio-filter';
    button.textContent = label;
    button.setAttribute('aria-pressed', String(index === 0));
    button.addEventListener('click', () => {
      activeCategory = label;
      filters.querySelectorAll('.portfolio-filter').forEach(filter => filter.setAttribute('aria-pressed', String(filter === button)));
      renderCards();
    });
    filters.append(button);
  });

  search?.addEventListener('input', renderCards);
  modal.querySelector('.portfolio-lightbox-close').addEventListener('click', closeViewer);
  modal.querySelector('.portfolio-lightbox-arrow.previous').addEventListener('click', () => { activeIndex -= 1; showViewerItem(); });
  modal.querySelector('.portfolio-lightbox-arrow.next').addEventListener('click', () => { activeIndex += 1; showViewerItem(); });
  modal.addEventListener('click', event => { if (event.target === modal) closeViewer(); });
  document.addEventListener('keydown', event => {
    if (!modal.classList.contains('is-open')) return;
    if (event.key === 'Escape') closeViewer();
    if (event.key === 'ArrowLeft') { activeIndex -= 1; showViewerItem(); }
    if (event.key === 'ArrowRight') { activeIndex += 1; showViewerItem(); }
    if (event.key === 'Tab') {
      const focusable = [...modal.querySelectorAll('button')];
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });

  renderCards();
})();
