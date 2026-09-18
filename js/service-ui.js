// service-ui.js — shared UI for 3D carousel and lightbox
(function(){
  // Render 3D carousel for projects
  function initCarousel(containerSelector, items, options = {}){
    const container = document.querySelector(containerSelector);
    if(!container) return;
    container.classList.add('carousel-3d');
    const radius = options.radius || 340;
    const theta = 360 / items.length;

    // create items
    items.forEach((it, i) => {
      const el = document.createElement('button');
      el.className = 'carousel-item';
      el.setAttribute('data-url', it.url || '#');
      el.setAttribute('data-index', i);
      el.innerHTML = `
        <div class="card-inner">
          <div class="card-media" style="background-image:url('${it.img.replace(/"/g,'\\"')}')"></div>
          <div class="card-meta"><h3>${it.title}</h3><p>${it.desc}</p></div>
        </div>`;
      const angle = theta * i;
      el.style.transform = `rotateY(${angle}deg) translateZ(${radius}px)`;
      // click will be handled, but suppressed if user dragged
      // store URL explicitly on element to avoid closure/mapping issues
      if(it.url) el.setAttribute('data-url', it.url);
      el.addEventListener('click', (e)=>{
        if(el.__wasDragged) { e.preventDefault(); e.stopImmediatePropagation(); el.__wasDragged = false; return; }
        const url = el.getAttribute('data-url') || '#';
        if(url && url !== '#') {
          // open in new tab for reliability
          window.open(url, '_blank');
        }
      });
      // keyboard support
      el.addEventListener('keydown', (e)=>{ if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); const url=el.getAttribute('data-url'); if(url) window.open(url,'_blank'); } });
      container.appendChild(el);
    });

    // rotation state (index-based for deterministic rotation)
    let currentRotation = 0; // degrees
    let currentIndex = 0;
    let isDragging = false;
    let startX = 0;
    let startRotation = 0;
    const sensitivity = options.sensitivity || 0.35; // degrees per px
    const autoDelay = options.delay || 3500; // ms between auto-advances
    let autoTimer = null;

    function applyRotation(rot){
      currentRotation = rot;
      container.style.transform = `translateZ(-100px) rotateY(${currentRotation}deg)`;
    }

    function angleForIndex(i){ return -i * theta; }

    function animateTo(target, duration = 420){
      const start = currentRotation;
      const t0 = performance.now();
      function step(t){
        const p = Math.min(1, (t - t0) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        applyRotation(start + (target - start) * eased);
        if(p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    function goToIndex(i){
      const n = items.length; i = ((i % n) + n) % n; currentIndex = i; const target = angleForIndex(i); animateTo(target); restartAuto(); }
    function next(){ goToIndex(currentIndex + 1); }
    function prev(){ goToIndex(currentIndex - 1); }

    function stopAuto(){ if(autoTimer) { clearInterval(autoTimer); autoTimer = null; } }
    function restartAuto(){ stopAuto(); if(options.autoPlay !== false) autoTimer = setInterval(()=> next(), autoDelay); }

    // initial position
    applyRotation(angleForIndex(currentIndex));
    restartAuto();

    // expose controls for debugging and external triggers
    try{ window.ServiceUI._currentControls = { goToIndex, next, prev, getIndex: ()=> currentIndex }; }catch(e){}

    // pointer controls: drag to rotate, snap to nearest index on up
    container.style.touchAction = 'pan-y';
    container.addEventListener('pointerdown', (ev)=>{
      isDragging = true; startX = ev.clientX; startRotation = currentRotation; stopAuto();
      try{ container.setPointerCapture(ev.pointerId); }catch(e){}
    });
    container.addEventListener('pointermove', (ev)=>{
      if(!isDragging) return;
      const dx = ev.clientX - startX;
      const newRot = startRotation + dx * sensitivity;
      applyRotation(newRot);
      // mark dragged to suppress click
      container.querySelectorAll('.carousel-item').forEach(it=>{ it.__wasDragged = Math.abs(dx) > 6; });
    });
    container.addEventListener('pointerup', (ev)=>{
      if(!isDragging) return; isDragging = false; try{ container.releasePointerCapture(ev.pointerId); }catch(e){}
      // snap to nearest index
      const raw = -currentRotation / theta; let nearest = Math.round(raw); goToIndex(nearest);
    });

    // wheel support (desktop) -> advance one by one
    container.addEventListener('wheel', (e)=>{
      e.preventDefault(); if(e.deltaY > 0) next(); else prev();
    }, {passive:false});
  }

  // Simple lightbox with swipe
  function createLightbox(){
    const lb = document.createElement('div'); lb.id='serviceLightbox'; lb.className='service-lightbox'; lb.innerHTML = `
      <div class="lb-inner">
        <button class="lb-close">✕</button>
        <button class="lb-prev">‹</button>
        <div class="lb-stage"><img src="" alt=""></div>
        <button class="lb-next">›</button>
      </div>`;
    document.body.appendChild(lb);
    const img = lb.querySelector('.lb-stage img');
    let list = [], idx = 0;
    function show(i){ idx = (i+list.length)%list.length; img.src = list[idx]; lb.classList.add('open'); }
    lb.querySelector('.lb-close').onclick = ()=> lb.classList.remove('open');
    lb.querySelector('.lb-prev').onclick = ()=> show(idx-1);
    lb.querySelector('.lb-next').onclick = ()=> show(idx+1);
    // touch
    let startX=0;
    img.addEventListener('touchstart', (e)=> startX = e.touches[0].clientX);
    img.addEventListener('touchend', (e)=> { const dx = (e.changedTouches[0].clientX - startX); if(dx>40) show(idx-1); else if(dx<-40) show(idx+1); });
    return {open(listIn, i=0){ list = listIn; show(i); }};
  }

  // attach galleries to items with data-gallery attribute
  function initGalleries(){
    const lb = createLightbox();
    document.querySelectorAll('[data-gallery]').forEach(el=>{
      el.addEventListener('click', ()=>{
        const imgs = JSON.parse(el.getAttribute('data-gallery'));
        lb.open(imgs, 0);
      });
    });
  }

  // expose
  window.ServiceUI = { initCarousel, initGalleries };
  // iframe embed modal
  function openEmbedded(url){
    let modal = document.getElementById('serviceEmbedModal');
    if(!modal){
      modal = document.createElement('div'); modal.id='serviceEmbedModal'; modal.className='service-embed';
      modal.innerHTML = `
        <div class="embed-inner">
          <button class="embed-close">✕</button>
          <div class="embed-toolbar"><a class="embed-newtab" target="_blank">Open in new tab</a></div>
          <div class="embed-stage"><iframe src="" frameborder="0" sandbox="allow-scripts allow-forms allow-same-origin allow-popups"></iframe></div>
        </div>`;
      document.body.appendChild(modal);
      modal.querySelector('.embed-close').onclick = ()=> modal.classList.remove('open');
      modal.querySelector('.embed-newtab').onclick = ()=>{};
    }
    const iframe = modal.querySelector('iframe');
    modal.querySelector('.embed-newtab').setAttribute('href', url);
    // set src and open modal
    iframe.src = url;
    modal.classList.add('open');
    // if site blocks framing, user can use "Open in new tab" button
  }
  // auto init if containers exist
  document.addEventListener('DOMContentLoaded', ()=>{
    if(document.querySelector('#projectsList.carousel-3d')) return;
    // no-op auto
  });
})();
