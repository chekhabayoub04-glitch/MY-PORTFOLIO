import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const root = dirname(fileURLToPath(import.meta.url));
const r = (...p) => resolve(root, ...p);

// The home page exists in three languages. src/pages/home.html is rendered
// with src/i18n/<lang>.json into index.html (en), fr/index.html and
// ar/index.html; those generated files are what Vite builds.
const LANGS = { en: '', fr: 'fr/', ar: 'ar/' };
const SITE = 'https://ayoubchekhab-dev.is-a.dev/';

// Pages and folders that are published as they are (the subpages keep
// their own CSS/JS until they are restyled).
const STATIC = [
  'CNAME', 'index-v1.html', 'ai-videos.html', 'campaigns.html', 'editing.html',
  'graphic-design.html', 'logo-design.html', 'social-media.html', 'web-development.html',
  'css', 'js', 'images', 'videos',
];
const NOT_PUBLISHED = ['videos/source-originals', 'videos/film', 'images/film', 'images/sites/raw'];

const escape = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function render(lang) {
  const t = JSON.parse(readFileSync(r(`src/i18n/${lang}.json`), 'utf8'));
  const get = key => key.split('.').reduce((o, k) => o?.[k], t);
  let html = readFileSync(r('src/pages/home.html'), 'utf8');
  // {{> name}} includes src/partials/name.html
  for (let i = 0; i < 3; i++) html = html.replace(/\{\{>\s*([\w-]+)\s*\}\}/g, (_, n) => readFileSync(r(`src/partials/${n}.html`), 'utf8'));
  const vars = {
    lang, dir: lang === 'ar' ? 'rtl' : 'ltr', base: `/${LANGS[lang]}`, url: SITE + LANGS[lang],
    wa: `https://wa.me/213658030536?text=${encodeURIComponent(t.wa.text)}`,
  };
  return html
    // /images/ and /videos/ are published as they are (see STATIC): don't hash copies of them
    .replace(/<(img|video|source|link)\b(?=[^>]*="\/(?:images|videos)\/)/g, '<$1 vite-ignore')
    // {{icon:name}} inlines a monochrome tool icon
    .replace(/\{\{icon:([\w-]+)\}\}/g, (_, n) => readFileSync(r(`src/icons/${n}.svg`), 'utf8').trim())
    // {{=name}} is a page variable, {{json:key}} a JSON string for scripts
    .replace(/\{\{=(\w+)\}\}/g, (_, k) => escape(vars[k]))
    .replace(/\{\{json:([\w.]+)\}\}/g, (_, k) => JSON.stringify(get(k)).replace(/</g, '\\u003c'))
    // {{#ar}}…{{/ar}} only renders on that language; {{key.path}} is a translated string
    .replace(/\{\{#(en|fr|ar)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (_, l, body) => (l === lang ? body : ''))
    .replace(/\{\{([\w.]+)\}\}/g, (m, k) => {
      const v = get(k);
      if (v == null) throw new Error(`Missing "${k}" in src/i18n/${lang}.json`);
      return escape(v);
    });
}

function writePages() {
  for (const [lang, dir] of Object.entries(LANGS)) {
    if (dir) mkdirSync(r(dir), { recursive: true });
    const banner = `<!-- Generated from src/pages/home.html + src/i18n/${lang}.json. Edit those, not this file. -->\n`;
    writeFileSync(r(dir, 'index.html'), render(lang).replace(/^<!DOCTYPE html>\n/i, m => m + banner));
  }
}

const i18nPages = () => ({
  name: 'i18n-pages',
  config() { writePages(); },
  configureServer(server) {
    server.watcher.add([r('src/pages'), r('src/partials'), r('src/i18n'), r('src/icons')]);
    server.watcher.on('change', file => {
      if (/src\/(pages|partials|i18n|icons)\//.test(file)) {
        writePages();
        server.ws.send({ type: 'full-reload' });
      }
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
  },
});

export default defineConfig({
  plugins: [i18nPages(), copyStatic()],
  build: {
    target: 'es2020',
    rollupOptions: {
      input: Object.fromEntries(Object.entries(LANGS).map(([l, d]) => [l, r(d, 'index.html')])),
    },
  },
});
