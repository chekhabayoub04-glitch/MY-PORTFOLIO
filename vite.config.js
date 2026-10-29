import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { WEB3FORMS_KEY } from './src/config.js';
import { createRenderer } from './src/site/render.mjs';
import { LANGS, SITE, carousel, loadProjects, portalBlocks, portalPath, portalVars, sitemap, todoReport } from './src/site/work.mjs';

const root = dirname(fileURLToPath(import.meta.url));
const r = (...p) => resolve(root, ...p);
const render = createRenderer(root);

// Generated pages (don't edit them, edit the sources):
//   src/pages/home.html + src/i18n/<lang>.json      → index.html, fr/, ar/
//   src/pages/work.html + src/data/projects.json    → work/<slug>/, fr/work/<slug>/, ar/work/<slug>/
//   sitemap.xml                                     → public/sitemap.xml

// Pages and folders that are published as they are (the subpages keep
// their own CSS/JS until they are restyled).
const STATIC = [
  'CNAME', 'archive', 'ai-videos.html', 'campaigns.html', 'editing.html',
  'graphic-design.html', 'logo-design.html', 'social-media.html', 'web-development.html',
  'css', 'js', 'images', 'videos',
];
const NOT_PUBLISHED = ['videos/source-originals', 'videos/film', 'images/film', 'images/sites/raw'];

const pages = [];
function writePage(file, html, banner) {
  mkdirSync(dirname(r(file)), { recursive: true });
  writeFileSync(r(file), html.replace(/^<!DOCTYPE html>\n/i, m => `${m}<!-- Generated from ${banner}. Edit those, not this file. -->\n`));
  pages.push(file);
}

function writePages() {
  pages.length = 0;
  const projects = loadProjects(root);
  for (const [lang, dir] of Object.entries(LANGS)) {
    const t = JSON.parse(readFileSync(r(`src/i18n/${lang}.json`), 'utf8'));
    const common = { lang, dir: lang === 'ar' ? 'rtl' : 'ltr', base: `/${dir}` };

    writePage(`${dir}index.html`, render('src/pages/home.html', {
      lang, t,
      vars: {
        ...common, url: SITE + dir, href_en: '/', href_fr: '/fr/', href_ar: '/ar/', href_de: '/de/',
        wa: `https://wa.me/213658030536?text=${encodeURIComponent(t.wa.text)}`,
        web3forms: WEB3FORMS_KEY,
      },
      blocks: { carousel: carousel(projects, lang, t) },
    }), `src/pages/home.html + src/i18n/${lang}.json`);

    projects.forEach((p, i) => {
      const next = projects[(i + 1) % projects.length];
      writePage(portalPath(p.slug, lang).slice(1) + 'index.html', render('src/pages/work.html', {
        lang, t,
        vars: { ...common, ...portalVars(p, lang, t) },
        blocks: portalBlocks(p, next, lang, t),
      }), `src/pages/work.html + src/data/projects.json (${p.slug}) + src/i18n/${lang}.json`);
    });
  }
  writeFileSync(r('public/sitemap.xml'), sitemap(projects));
  const todo = todoReport(projects);
  if (todo) console.log(`\nProjects still waiting for Ayoub's copy (blocks hidden):\n${todo}\n`);
}

const generatedPages = () => ({
  name: 'generated-pages',
  // every generated page is a build entry
  config() {
    writePages();
    const input = Object.fromEntries(pages.map(f => [f.replace(/index\.html$/, '') || 'home', r(f)]));
    return { build: { rollupOptions: { input } } };
  },
  configureServer(server) {
    const sources = /src\/(pages|partials|i18n|data|site)\/|public\/work\/[^/]+\/manifest\.json/;
    server.watcher.add([r('src/pages'), r('src/partials'), r('src/i18n'), r('src/data'), r('src/site')]);
    server.watcher.on('change', file => {
      if (!sources.test(file)) return;
      try { writePages(); } catch (err) { console.error(err.message); return; }
      server.ws.send({ type: 'full-reload' });
    });
  },
});

const copyStatic = () => ({
  name: 'copy-static',
  apply: 'build',
  closeBundle() {
    const out = r('dist');
    for (const item of STATIC) {
      if (!existsSync(r(item))) continue;
      cpSync(r(item), resolve(out, item), {
        recursive: true,
        filter: src => !NOT_PUBLISHED.some(p => src.startsWith(r(p))) && !src.endsWith('.DS_Store'),
      });
    }
    // The subpages load css/ and js/ by fixed names: version each one by its
    // content, so a browser never pairs a new page with an old file
    const hash = file => createHash('sha256').update(readFileSync(r(file))).digest('hex').slice(0, 8);
    for (const page of STATIC.filter(f => f.endsWith('.html')).concat('archive/index-v1.html')) {
      const file = resolve(out, page);
      if (!existsSync(file)) continue;
      writeFileSync(file, readFileSync(file, 'utf8').replace(/((?:href|src)="\/?)((?:css|js)\/[^"?#]+\.(?:css|js))"/g,
        (m, pre, path) => (existsSync(r(path)) ? `${pre}${path}?v=${hash(path)}"` : m)));
    }
  },
});

export default defineConfig({
  plugins: [generatedPages(), copyStatic()],
  build: { target: 'es2020' },
});
