// Numbers on the home page that must always match what is shown (runs in Node,
// at build): chapter counts and "01 / 07" labels are counted from the rendered
// markup, reel timecodes are read from the video files themselves.
import { closeSync, openSync, readSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const count = (html, re) => (html.match(re) || []).length;
const pad = n => String(n).padStart(2, '0');

// One chapter of the rendered page, from its id to the next chapter
const chapter = (html, id) => {
  const start = html.indexOf(`id="${id}"`);
  if (start < 0) throw new Error(`counts: no chapter #${id}`);
  const end = html.indexOf('class="chapter"', start + 1);
  return [start, end < 0 ? html.length : end];
};

// "{n} identities" in the right plural form for the language
const plural = (lang, forms, n) => (forms[new Intl.PluralRules(lang).select(n)] ?? forms.other).replace('{n}', n);

// An MP4's duration from its movie header (mvhd), without ffprobe
export function mp4Duration(file) {
  const fd = openSync(file, 'r');
  try {
    const size = statSync(file).size, head = Buffer.alloc(16);
    let at = 0;
    while (at < size) {
      readSync(fd, head, 0, 16, at);
      let len = head.readUInt32BE(0), hdr = 8;
      const type = head.toString('latin1', 4, 8);
      if (len === 1) { len = Number(head.readBigUInt64BE(8)); hdr = 16; }
      if (len === 0) len = size - at;
      if (type === 'moov') { at += hdr; continue; }   // step inside
      if (type === 'mvhd') {
        const b = Buffer.alloc(32);
        readSync(fd, b, 0, 32, at + hdr);
        return b[0] === 1
          ? Number(b.readBigUInt64BE(24)) / b.readUInt32BE(20)
          : b.readUInt32BE(16) / b.readUInt32BE(12);
      }
      at += len;
    }
  } finally { closeSync(fd); }
  throw new Error(`counts: no duration in ${file}`);
}
const timecode = s => `${Math.floor(Math.round(s) / 60)}:${pad(Math.round(s) % 60)}`;

export function fillCounts(html, { lang, t, root }) {
  const forms = t.sections.counts;
  const numbered = ([a, b]) => {
    const part = html.slice(a, b);
    const total = count(part, /class="stack-num"/g);
    let i = 0;
    html = html.slice(0, a) + part.replace(/(class="stack-num">)[^<]*/g, (_, open) => `${open}${pad(++i)} / ${pad(total)}`) + html.slice(b);
  };

  const [da, db] = chapter(html, 'ch-design');
  const design = html.slice(da, db);
  html = html.replace('{collections}', plural(lang, forms.collections, count(design, /class="stack-card"/g)))
    .replace('{visuals}', plural(lang, forms.visuals, count(design, /class="poster"/g)));
  numbered(chapter(html, 'ch-design'));

  const [ma, mb] = chapter(html, 'ch-marks');
  const grid = html.slice(ma, mb).match(/class="mark-grid"[\s\S]*?<\/a>/)?.[0] ?? '';
  html = html.replace('{identities}', plural(lang, forms.identities, count(grid, /<img\b/g)));
  numbered(chapter(html, 'ch-marks'));

  // Reel timecodes: the real length of each film
  html = html.replace(/(<video\b[^>]*?\ssrc="(\/videos\/[^"]+)"[^>]*><\/video>[\s\S]*?<span class="reel-time">)[^<]*/g,
    (_, before, src) => before + timecode(mp4Duration(resolve(root, src.slice(1)))));

  if (/\{(collections|visuals|identities)\}|class="reel-time">0:00</.test(html)) throw new Error('counts: a count was left unfilled');
  return html;
}
