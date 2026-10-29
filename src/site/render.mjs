// The tiny template engine behind every generated page (runs in Node, at build).
//   {{> name}}       includes src/partials/name.html
//   {{@name}}        a block of HTML built in JS (blocks[name])
//   {{=name}}        a page variable, escaped
//   {{json:key}}     an i18n string as a JSON literal (for <script> blocks)
//   {{#ar}}…{{/ar}}  only on that language (en, fr, ar, de)
//   {{key.path}}     an i18n string, escaped
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const escape = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function createRenderer(root) {
  const read = p => readFileSync(resolve(root, p), 'utf8');
  return function render(template, { lang, t, vars = {}, blocks = {} }) {
    const get = key => key.split('.').reduce((o, k) => o?.[k], t);
    let html = read(template);
    for (let i = 0; i < 3; i++) html = html.replace(/\{\{>\s*([\w-]+)\s*\}\}/g, (_, n) => read(`src/partials/${n}.html`));
    return html
      // /images/ and /videos/ are published as they are: don't let Vite hash copies of them
      .replace(/<(img|video|source|link)\b(?=[^>]*="\/(?:images|videos)\/)/g, '<$1 vite-ignore')
      .replace(/\{\{@([\w-]+)\}\}/g, (_, k) => {
        if (!(k in blocks)) throw new Error(`${template}: no block "${k}"`);
        return blocks[k];
      })
      .replace(/\{\{=(\w+)\}\}/g, (_, k) => {
        if (!(k in vars)) throw new Error(`${template}: no variable "${k}"`);
        return escape(vars[k]);
      })
      .replace(/\{\{json:([\w.]+)\}\}/g, (_, k) => JSON.stringify(get(k)).replace(/</g, '\\u003c'))
      .replace(/\{\{#(en|fr|ar|de)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (_, l, body) => (l === lang ? body : ''))
      .replace(/\{\{([\w.]+)\}\}/g, (m, k) => {
        const v = get(k);
        if (v == null) throw new Error(`Missing "${k}" in src/i18n/${lang}.json`);
        return escape(v);
      });
  };
}
