// Builds the Work carousel, the project portals' blocks, their JSON-LD and the
// sitemap from src/data/projects.json + public/work/<slug>/manifest.json.
// Runs in Node at build time. A value "TODO" means "not written yet": its block
// is left out and listed by todoReport().
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { escape } from './render.mjs';

export const SITE = 'https://ayoubchekhab-dev.is-a.dev/';
export const LANGS = { en: '', fr: 'fr/', ar: 'ar/' };

const isTodo = v => v == null || v === 'TODO' || (Array.isArray(v) && (v.length === 0 || v.every(isTodo)));
const fill = (s, map) => s.replace(/\{(\w+)\}/g, (_, k) => map[k] ?? '');
export const portalPath = (slug, lang) => `/${LANGS[lang]}work/${slug}/`;

export function loadProjects(root) {
  const { projects } = JSON.parse(readFileSync(resolve(root, 'src/data/projects.json'), 'utf8'));
  return projects.map(p => {
    const file = resolve(root, 'public/work', p.slug, 'manifest.json');
    if (!existsSync(file)) throw new Error(`No captures for ${p.slug}: run npm run capture -- ${p.slug}`);
    return { ...p, manifest: JSON.parse(readFileSync(file, 'utf8')) };
  });
}

export function todoReport(projects) {
  const fields = ['showClientName', 'city', 'year', 'deliveryTime', 'problem', 'solution', 'results', 'testimonial'];
  return projects.map(p => {
    const missing = fields.filter(f => {
      const v = p[f];
      if (f === 'solution') return !v?.some(s => !isTodo(s.title?.en));
      if (f === 'results') return !v?.length;
      if (v && typeof v === 'object' && !Array.isArray(v) && 'en' in v) return isTodo(v.en);
      return isTodo(v);
    });
    return missing.length ? `  ${p.slug}: ${missing.join(', ')}` : null;
  }).filter(Boolean).join('\n');
}

// <picture> with AVIF + WebP, the full image and its half-width copy
function picture(slug, file, img, { alt, sizes, eager = false, cls = '', style = '' }) {
  const base = `/work/${slug}/${file}`;
  const set = ext => (img.sm ? `${base}-sm.${ext} ${img.sm.w}w, ${base}.${ext} ${img.w}w` : `${base}.${ext} ${img.w}w`);
  return `<picture><source type="image/avif" srcset="${set('avif')}" sizes="${sizes}">`
    + `<img${cls ? ` class="${cls}"` : ''} src="${base}.webp" srcset="${set('webp')}" sizes="${sizes}" width="${img.w}" height="${img.h}" alt="${escape(alt)}"`
    + `${eager ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async"${style ? ` style="${style}"` : ''}></picture>`;
}

const shotAlt = (t, p, lang, what, where) => fill(t.portal.alt.shot, { name: p.name[lang], what, where: t.portal.alt[where] });

// ── Home: the phone carousel ─────────────────────────────────
export function carousel(projects, lang, t) {
  return projects.map((p, i) => {
    const img = p.manifest.images['mobile-first'];
    const city = isTodo(p.city[lang]) ? '' : `<span class="phone-city">${escape(p.city[lang])}</span>`;
    return `
          <li class="phone-card" data-slug="${p.slug}" style="--i:${i}">
            <a class="phone-link" href="${portalPath(p.slug, lang)}">
              <span class="phone"><span class="phone-screen">${picture(p.slug, 'mobile-first', img, {
                alt: shotAlt(t, p, lang, t.portal.alt.home, 'mobile'), sizes: '(min-width: 1024px) 280px, 64vw', cls: 'phone-shot',
              })}</span></span>
              <span class="phone-meta"><span class="phone-name">${escape(p.name[lang])}</span><span class="phone-type">${escape(p.type[lang])}</span>${city}</span>
            </a>
          </li>`;
  }).join('');
}

// ── Portal blocks ────────────────────────────────────────────
const ICONS = {
  calendar: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  phone: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
  language: '<path d="M4 5h9M8.5 3v2M6 5c.5 3.5 3 6.5 6 8M11 5c-.8 3.6-3.4 7-7 9"/><path d="M13 21l4-10 4 10M14.5 17.5h5"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M20.5 20.5 16 16"/>',
  map: '<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.3"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20Z"/>',
  chart: '<path d="M4 20h16M7 16v-5M12 16V7M17 16v-8"/>',
  building: '<path d="M5 20.5V4.5h9v16M14 9.5h5v11M3 20.5h18M8 8h3M8 11.5h3M8 15h3"/>',
  image: '<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="m4 18 5-5 4 4 2.5-2.5L20 19"/>',
};
const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ICONS.image}</svg>`;

export function portalBlocks(p, next, lang, t) {
  const P = t.portal;
  const im = p.manifest.images;
  const L = v => (v && typeof v === 'object' && !Array.isArray(v) ? v[lang] : v);

  const stage = `
      <div class="devices" id="devices" data-view="both">
        <div class="laptop">
          <div class="laptop-screen">
            <div class="scroll-shot" data-full="/work/${p.slug}/desktop-full.webp" data-w="${im['desktop-full'].w}" data-h="${im['desktop-full'].h}">
              ${picture(p.slug, 'desktop-first', im['desktop-first'], { alt: shotAlt(t, p, lang, P.alt.home, 'desktop'), sizes: '(min-width: 1024px) 60vw, 92vw', eager: true })}
            </div>
          </div>
          <div class="laptop-base" aria-hidden="true"></div>
        </div>
        <div class="phone phone--portal">
          <div class="phone-screen">
            <div class="scroll-shot" data-full="/work/${p.slug}/mobile-full.webp" data-w="${im['mobile-full'].w}" data-h="${im['mobile-full'].h}">
              ${picture(p.slug, 'mobile-first', im['mobile-first'], { alt: shotAlt(t, p, lang, P.alt.home, 'mobile'), sizes: '(min-width: 1024px) 260px, 46vw', cls: 'phone-shot', style: `view-transition-name: shot-${p.slug}` })}
            </div>
          </div>
        </div>
      </div>
      <div class="stage-controls">
        <div class="device-switch" role="group" aria-label="${escape(P.devices)}">
          <button type="button" data-view="desktop" aria-pressed="false">${escape(P.desktop)}</button>
          <button type="button" data-view="mobile" aria-pressed="false">${escape(P.mobile)}</button>
          <button type="button" data-view="both" aria-pressed="true">${escape(P.both)}</button>
        </div>
        <button class="btn btn--ghost btn--small try-live" type="button" aria-pressed="false" data-live="${escape(p.url)}" data-on="${escape(P.tryLive)}" data-off="${escape(P.backToPreview)}">${escape(P.tryLive)}</button>
        <a class="btn btn--ghost btn--small" href="${escape(p.url)}" target="_blank" rel="noopener">${escape(P.visit)}</a>
      </div>
      <p class="live-failed" role="status" hidden>${escape(P.liveFailed)}</p>`;

  const facts = [
    [P.facts.type, L(p.type)],
    [P.facts.city, L(p.city)],
    [P.facts.services, (p.services || []).map(s => P.services[s] || s).join(', ')],
    [P.facts.delivery, L(p.deliveryTime)],
    [P.facts.year, p.year],
  ].filter(([, v]) => !isTodo(v) && v !== '')
    .map(([k, v]) => `<div><dt>${escape(k)}</dt><dd>${escape(v)}</dd></div>`).join('');

  const problemItems = (p.problem?.[lang] || []).filter(x => !isTodo(x));
  const problem = problemItems.length ? `
    <section class="portal-block" aria-labelledby="problemTitle">
      <h2 id="problemTitle">${escape(P.problem)}</h2>
      <ul class="problem-list">${problemItems.map(x => `<li>${escape(x)}</li>`).join('')}</ul>
    </section>` : '';

  const builtItems = (p.solution || []).filter(s => !isTodo(s.title?.[lang]));
  const built = builtItems.length ? `
    <section class="portal-block" aria-labelledby="builtTitle">
      <h2 id="builtTitle">${escape(P.built)}</h2>
      <ul class="built-grid">${builtItems.map(s => `<li class="built-card">${icon(s.icon)}<h3>${escape(s.title[lang])}</h3>${isTodo(s.text?.[lang]) ? '' : `<p>${escape(s.text[lang])}</p>`}</li>`).join('')}</ul>
    </section>` : '';

  const results = p.results?.length ? `
    <section class="portal-block" aria-labelledby="resultsTitle">
      <h2 id="resultsTitle">${escape(P.results)}</h2>
      <ul class="results-grid">${p.results.map(r => `<li><strong>${escape(r.value)}</strong><span>${escape(L(r.label))}</span></li>`).join('')}</ul>
    </section>` : '';

  const q = p.testimonial;
  const testimonial = q && !isTodo(L(q.quote)) ? `
    <section class="portal-block" aria-labelledby="quoteTitle">
      <h2 id="quoteTitle" class="visually-hidden">${escape(P.testimonial)}</h2>
      <figure class="quote">
        <blockquote><p>${escape(L(q.quote))}</p></blockquote>
        <figcaption>${q.photo ? `<img src="${escape(q.photo)}" alt="" width="56" height="56" loading="lazy">` : ''}<span><strong>${escape(q.name)}</strong>${q.role ? `<span>${escape(L(q.role))}</span>` : ''}</span></figcaption>
      </figure>
    </section>` : '';

  const shots = p.manifest.gallery || [];
  const gallery = shots.length ? `
    <section class="portal-block" aria-labelledby="galleryTitle">
      <h2 id="galleryTitle">${escape(P.gallery)}</h2>
      <ul class="gallery">${shots.map((g, i) => {
        const alt = shotAlt(t, p, lang, P.alt.kinds[g.kind] || g.kind, g.viewport);
        return `<li class="gallery-item gallery-item--${g.viewport}"><a href="/work/${p.slug}/${g.file}.webp" data-index="${i}" aria-label="${escape(`${P.open}: ${alt}`)}">${picture(p.slug, g.file, im[g.file], { alt, sizes: g.viewport === 'desktop' ? '(min-width: 1024px) 50vw, 92vw' : '(min-width: 1024px) 22vw, 44vw' })}</a></li>`;
      }).join('')}</ul>
    </section>
    <dialog class="lightbox" id="lightbox" aria-label="${escape(P.gallery)}">
      <img alt="" decoding="async">
      <div class="lightbox-controls">
        <button class="btn btn--ghost btn--small" type="button" data-step="-1" aria-label="${escape(P.prevShot)}">‹</button>
        <button class="btn btn--ghost btn--small" type="button" data-close>${escape(P.close)}</button>
        <button class="btn btn--ghost btn--small" type="button" data-step="1" aria-label="${escape(P.nextShot)}">›</button>
      </div>
    </dialog>` : '';

  const nextImg = next.manifest.images['mobile-first'];
  const nextCard = `
    <a class="next-card" href="${portalPath(next.slug, lang)}" data-slug="${next.slug}">
      <span class="next-text"><span class="next-label">${escape(P.next)}</span><span class="next-name">${escape(next.name[lang])}</span><span class="next-type">${escape(next.type[lang])}</span></span>
      <span class="phone phone--next"><span class="phone-screen">${picture(next.slug, 'mobile-first', nextImg, { alt: '', sizes: '220px', cls: 'phone-shot' })}</span></span>
    </a>`;

  const url = SITE + portalPath(p.slug, lang).slice(1);
  const jsonld = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: `${p.name[lang]}, ${p.type[lang]}`,
    url,
    mainEntityOfPage: url,
    image: `${SITE}work/${p.slug}/og.jpg`,
    inLanguage: lang,
    genre: 'Website',
    about: p.type[lang],
    sameAs: p.url,
    creator: { '@type': 'Person', '@id': `${SITE}#ayoub`, name: 'Ayoub Chekhab', url: SITE },
    ...(isTodo(p.year) ? {} : { dateCreated: String(p.year) }),
  }).replace(/</g, '\\u003c');

  return { stage, facts, problem, built, results, testimonial, gallery, next: nextCard, jsonld };
}

export function portalVars(p, lang, t) {
  const P = t.portal;
  const type = lang === 'ar' ? p.type[lang] : p.type[lang].toLowerCase();
  const name = p.name[lang];
  const waText = fill(P.wa, { name });
  return {
    slug: p.slug, name, type: p.type[lang], city: isTodo(p.city[lang]) ? '' : p.city[lang],
    live: p.url,
    title: fill(P.metaTitle, { name, type }),
    description: fill(P.metaDesc, { name, type }),
    url: SITE + portalPath(p.slug, lang).slice(1),
    href_en: portalPath(p.slug, 'en'), href_fr: portalPath(p.slug, 'fr'), href_ar: portalPath(p.slug, 'ar'),
    og: `${SITE}work/${p.slug}/og.jpg`,
    preload: `/work/${p.slug}/desktop-first`,
    pw: p.manifest.images['desktop-first'].w, psw: p.manifest.images['desktop-first'].sm.w,
    cta: P.cta[p.audience] || P.cta.business,
    wa: `https://wa.me/213658030536?text=${encodeURIComponent(waText)}`,
  };
}

export function sitemap(projects) {
  const alt = path => Object.entries(LANGS).map(([l, d]) => `<xhtml:link rel="alternate" hreflang="${l}" href="${SITE}${d}${path}"/>`).join('')
    + `<xhtml:link rel="alternate" hreflang="x-default" href="${SITE}${path}"/>`;
  const urls = [];
  for (const d of Object.values(LANGS)) urls.push(`<url><loc>${SITE}${d}</loc>${alt('')}</url>`);
  for (const p of projects) {
    for (const d of Object.values(LANGS)) urls.push(`<url><loc>${SITE}${d}work/${p.slug}/</loc>${alt(`work/${p.slug}/`)}</url>`);
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`;
}
