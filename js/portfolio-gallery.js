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
  let activeIndex = 0;
  let lastFocus = null;

  grid.classList.add('portfolio-3d-stage');
  const controls = document.createElement('div');
  controls.className = 'portfolio-3d-controls';
  controls.innerHTML = `
    <button class="portfolio-3d-arrow previous" type="button" aria-label="Previous project"><i class="fas fa-arrow-left" aria-hidden="true"></i></button>
    <p class="portfolio-3d-status" aria-live="polite"></p>
    <button class="portfolio-3d-arrow next" type="button" aria-label="Next project"><i class="fas fa-arrow-right" aria-hidden="true"></i></button>`;
  grid.insertAdjacentElement('afterend', controls);
  const carouselStatus = controls.querySelector('.portfolio-3d-status');

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
    selectCard(position);
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
    activeIndex = 0;
    count.textContent = `${String(visible.length).padStart(2, '0')} PROJECT${visible.length === 1 ? '' : 'S'}`;
    empty.hidden = visible.length > 0;

    visible.forEach(({ item, index }, displayIndex) => {
      const card = document.createElement('article');
      card.className = 'portfolio-3d-card';
      card.dataset.kind = type;

      const preview = document.createElement('button');
      preview.type = 'button';
      preview.className = 'portfolio-3d-face';
      preview.setAttribute('aria-label', `Select ${item.title}`);
      const image = document.createElement('img');
      image.src = item.image;
      image.alt = item.title;
      image.loading = 'lazy';
      image.decoding = 'async';
      preview.append(image);
      const shade = document.createElement('span');
      shade.className = 'portfolio-3d-shade';
      shade.setAttribute('aria-hidden', 'true');
      const copy = document.createElement('span');
      copy.className = 'portfolio-3d-copy';
      const category = document.createElement('span');
      category.className = 'portfolio-3d-category';
      category.textContent = item.category || 'Selected work';
      const heading = document.createElement('span');
      heading.className = 'portfolio-3d-title';
      heading.textContent = item.title;
      const description = document.createElement('span');
      description.className = 'portfolio-3d-description';
      description.textContent = item.description || '';
      copy.append(category, heading, description);
      const zoom = document.createElement('span');
      zoom.className = 'portfolio-3d-zoom';
      zoom.innerHTML = '<i class="fas fa-arrow-up-right-from-square" aria-hidden="true"></i>';
      preview.append(shade, copy, zoom);
      preview.addEventListener('click', () => {
        if (displayIndex !== activeIndex) selectCard(displayIndex);
        else openViewer(index, preview);
      });

      card.append(preview);
      const pocket = document.createElement('div');
      pocket.className = 'portfolio-3d-pocket';
      pocket.setAttribute('aria-hidden', 'true');
      pocket.innerHTML = '<span class="portfolio-pocket-tab"></span><span class="portfolio-pocket-mark"><i class="fas fa-folder-open" aria-hidden="true"></i> PROJECT FILE</span><strong></strong><span class="portfolio-pocket-index"></span>';
      pocket.querySelector('strong').textContent = item.title;
      pocket.querySelector('.portfolio-pocket-index').textContent = `${String(displayIndex + 1).padStart(2, '0')} / ${String(visible.length).padStart(2, '0')}`;
      card.append(pocket);
      let action;
      if (item.url) {
        action = document.createElement('a');
        action.href = item.url;
        action.target = '_blank';
        action.rel = 'noopener noreferrer';
        action.innerHTML = 'Open live project <i class="fas fa-arrow-up-right-from-square" aria-hidden="true"></i>';
      } else {
        action = document.createElement('button');
        action.type = 'button';
        action.innerHTML = 'View full artwork <i class="fas fa-expand" aria-hidden="true"></i>';
        action.addEventListener('click', () => openViewer(index, action));
      }
      action.className = 'portfolio-3d-action';
      action.setAttribute('aria-label', `${item.url ? 'Open' : 'View'} ${item.title}`);
      card.append(action);
      grid.append(card);
    });
    selectCard(0);
  }

  function selectCard(nextIndex) {
    const cards = [...grid.querySelectorAll('.portfolio-3d-card')];
    if (!cards.length) {
      carouselStatus.textContent = '';
      controls.hidden = true;
      return;
    }
    controls.hidden = false;
    activeIndex = (nextIndex + cards.length) % cards.length;
    const step = Math.min(230, Math.max(88, window.innerWidth * 0.18));
    const entries = visibleItems();

    cards.forEach((card, index) => {
      const raw = index - activeIndex;
      const position = ((raw + cards.length / 2) % cards.length + cards.length) % cards.length - cards.length / 2;
      const distance = Math.abs(position);
      const preview = card.querySelector('.portfolio-3d-face');
      const action = card.querySelector('.portfolio-3d-action');
      const isVisible = distance <= 2;
      card.hidden = !isVisible;
      card.style.zIndex = String(10 - Math.round(distance * 2));
      card.style.opacity = isVisible ? String(distance === 0 ? 1 : distance === 1 ? .76 : .42) : '0';
      card.style.filter = distance > 1 ? 'saturate(.74) brightness(.68)' : 'none';
      card.style.transform = `translate3d(calc(-50% + ${position * step}px), calc(-50% + ${distance * 7}px), ${distance === 0 ? 80 : distance === 1 ? -30 : -180}px) scale(${distance === 0 ? 1 : distance === 1 ? .88 : .74}) rotateY(${position * -15}deg) rotateZ(${position * 5}deg)`;
      card.setAttribute('aria-current', String(distance === 0));
      card.setAttribute('aria-label', `${index + 1} of ${cards.length}: ${entries[index].item.title}`);
      preview.tabIndex = isVisible ? 0 : -1;
      preview.setAttribute('aria-label', `${distance === 0 ? 'Open' : 'Select'} ${entries[index].item.title}`);
      action.tabIndex = distance === 0 ? 0 : -1;
      action.setAttribute('aria-hidden', String(distance !== 0));
    });

    const current = entries[activeIndex]?.item;
    carouselStatus.textContent = `${String(activeIndex + 1).padStart(2, '0')} / ${String(cards.length).padStart(2, '0')}  ·  ${current?.title || ''}`;
    controls.querySelector('.previous').disabled = cards.length < 2;
    controls.querySelector('.next').disabled = cards.length < 2;
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
  controls.querySelector('.previous').addEventListener('click', () => selectCard(activeIndex - 1));
  controls.querySelector('.next').addEventListener('click', () => selectCard(activeIndex + 1));
  grid.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); selectCard(activeIndex - 1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); selectCard(activeIndex + 1); }
  });
  window.addEventListener('resize', () => selectCard(activeIndex));
  modal.querySelector('.portfolio-lightbox-close').addEventListener('click', closeViewer);
  modal.querySelector('.portfolio-lightbox-arrow.previous').addEventListener('click', () => { activeIndex -= 1; selectCard(activeIndex); showViewerItem(); });
  modal.querySelector('.portfolio-lightbox-arrow.next').addEventListener('click', () => { activeIndex += 1; selectCard(activeIndex); showViewerItem(); });
  modal.addEventListener('click', event => { if (event.target === modal) closeViewer(); });
  document.addEventListener('keydown', event => {
    if (!modal.classList.contains('is-open')) return;
    if (event.key === 'Escape') closeViewer();
    if (event.key === 'ArrowLeft') { activeIndex -= 1; selectCard(activeIndex); showViewerItem(); }
    if (event.key === 'ArrowRight') { activeIndex += 1; selectCard(activeIndex); showViewerItem(); }
    if (event.key === 'Tab') {
      const focusable = [...modal.querySelectorAll('button')];
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });

  renderCards();
})();
