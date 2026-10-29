// Captures every project in src/data/projects.json for the Work carousel and
// the portal pages:
//   npm run capture                 all projects
//   npm run capture -- dr-213 ...   only these
// Writes public/work/<slug>/:
//   desktop-first, desktop-full (1440×900 @2x, max 1600 px wide)
//   mobile-first,  mobile-full  (390×844 @2x, max 780 px wide)
//   (full pages are WebP only, cropped to the first 6000 px: they only feed the
//    auto-scroll preview; everything else is AVIF + WebP)
//   gallery-N                    sections from the project's "capture" list
//   og.jpg                       1200×630 share image
//   manifest.json                every file with its size (for width/height attributes)
// Images are .webp (q80); first screens, gallery shots and OG also get .avif.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const { projects } = JSON.parse(readFileSync(resolve(root, 'src/data/projects.json'), 'utf8'));
const only = process.argv.slice(2);
const wait = ms => new Promise(r => setTimeout(r, ms));

const VIEWPORTS = {
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, maxWidth: 1600 },
  mobile: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, maxWidth: 780 },
};
const FULL_MAX = 6000;      // full-page previews stop here (output px)

// Freeze motion, show scroll-revealed content, hide cookie banners and chat bubbles
const CLEAN_CSS = `
  *, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important;
    transition: none !important; scroll-behavior: auto !important; caret-color: transparent !important; }
  [data-aos], .reveal, .reveal-up, .fade-in, .fade-up, .animate-on-scroll, [class*="reveal"] {
    opacity: 1 !important; transform: none !important; visibility: visible !important; }
  [id*="cookie" i], [class*="cookie" i], [id*="consent" i], [class*="consent" i],
  [class*="wa-float" i], [class*="whatsapp-float" i], [class*="float-badge" i], [class*="chat-widget" i],
  iframe[src*="tawk"], iframe[src*="crisp"], iframe[src*="intercom"] { display: none !important; }
`;

async function prepare(page, url, mobile) {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 90000 });
  await page.addStyleTag({ content: CLEAN_CSS + (mobile ? 'html, body { overflow-x: clip !important; }' : '') });
  await page.evaluate(() => document.fonts?.ready);
  // Intros and preloaders: full-screen fixed layers on top of the page
  await wait(1500);
  await page.evaluate(() => {
    for (const el of document.querySelectorAll('body *')) {
      const cs = getComputedStyle(el);
      if (cs.position !== 'fixed') continue;
      const r = el.getBoundingClientRect();
      if (r.width >= innerWidth * .9 && r.height >= innerHeight * .9 && !el.matches('header, nav, header *, nav *')) el.remove();
    }
    document.documentElement.style.overflow = document.body.style.overflow = '';
  });
  // Walk down the page so lazy images and reveals load, then come back up
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += 600) {
    await page.evaluate(y => scrollTo(0, y), y);
    await wait(120);
  }
  await page.evaluate(() => scrollTo(0, 0));
  // Images still loading get 5 s (a hidden lazy image may never load)
  await page.evaluate(() => Promise.race([
    Promise.all([...document.images].filter(i => !i.complete).map(i => new Promise(r => { i.onload = i.onerror = r; }))),
    new Promise(r => setTimeout(r, 5000)),
  ]));
  await wait(800);
}

// Finds a section by meaning when the project has no selector for it
async function autoTarget(page, kind) {
  return page.evaluate(kind => {
    const pick = sel => [...document.querySelectorAll(sel)].find(el => el.getBoundingClientRect().height > 120);
    const tag = el => { el.setAttribute('data-capture', kind); return '[data-capture="' + kind + '"]'; };
    if (kind === 'menu') {
      const b = [...document.querySelectorAll('button, [role="button"], .menu, [class*="burger" i], [class*="toggle" i], [class*="menu-btn" i]')]
        .find(el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.width < 80 && r.top < 120; });
      return b ? tag(b) : null;
    }
    const map = { services: '[id*="service" i], [class*="service" i]', contact: '[id*="contact" i], [id*="book" i], [id*="rdv" i], form' };
    const el = pick(map[kind] || `#${kind}`);
    return el ? tag(el.closest('section') || el) : null;
  }, kind);
}

async function encode(img, out) {
  await img.clone().webp({ quality: 80, effort: 5 }).toFile(`${out}.webp`);
  await img.clone().avif({ quality: 55, effort: 4 }).toFile(`${out}.avif`);
}

async function save(buffer, out, maxWidth, manifest, key, { full = false } = {}) {
  const meta = await sharp(buffer, { limitInputPixels: false }).metadata();
  const w = Math.min(maxWidth, meta.width);
  let h = Math.round(meta.height * w / meta.width);
  let img = sharp(buffer, { limitInputPixels: false }).resize(w, h);
  if (full) {
    // Preview only: full width, top 6000 px, WebP
    if (h > FULL_MAX) {
      img = sharp(await img.png().toBuffer(), { limitInputPixels: false }).extract({ left: 0, top: 0, width: w, height: FULL_MAX });
      h = FULL_MAX;
    }
    await img.webp({ quality: 80, effort: 5 }).toFile(`${out}.webp`);
  } else {
    await encode(img, out);
  }
  manifest[key] = { w, h };
}

async function og(browser, dir, project) {
  const data = f => `data:image/webp;base64,${readFileSync(`${dir}/${f}.webp`).toString('base64')}`;
  const font = f => `data:font/woff2;base64,${readFileSync(resolve(root, 'public/fonts', f)).toString('base64')}`;
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.setContent(`<!doctype html><html><head><style>
    @font-face { font-family: D; src: url(${font('big-shoulders-display-latin.woff2')}); font-weight: 600 800; }
    @font-face { font-family: B; src: url(${font('readex-pro-latin.woff2')}); font-weight: 300 600; }
    html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; background: #000; }
    body { position: relative; font-family: B; color: #ECEAE5;
      background: radial-gradient(60% 80% at 68% 40%, rgba(255,210,63,.22), rgba(242,163,58,.06) 45%, transparent 70%), #000; }
    .laptop { position: absolute; left: 400px; top: 70px; width: 700px; }
    .screen { border: 12px solid #15171B; border-bottom-width: 18px; border-radius: 16px 16px 0 0; overflow: hidden; aspect-ratio: 16/10; background: #15171B; }
    .screen img, .phone img { width: 100%; height: 100%; object-fit: cover; object-position: top; display: block; }
    .base { height: 16px; margin: 0 -40px; border-radius: 0 0 14px 14px; background: linear-gradient(#2a2d33, #15171B); }
    .phone { position: absolute; left: 960px; top: 210px; width: 190px; aspect-ratio: 390/844; border: 9px solid #15171B; border-radius: 32px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,.6); background: #15171B; }
    h1 { position: absolute; left: 56px; bottom: 120px; margin: 0; width: 330px; font: 800 64px/.95 D; }
    p { position: absolute; left: 56px; bottom: 76px; margin: 0; color: #8C9096; font-size: 22px; }
    .site { position: absolute; left: 56px; top: 56px; font-size: 18px; color: #FFD23F; }
  </style></head><body>
    <div class="site">ayoubchekhab-dev.is-a.dev</div>
    <h1>${project.name.en}</h1><p>${project.type.en}</p>
    <div class="laptop"><div class="screen"><img src="${data('desktop-first')}"></div><div class="base"></div></div>
    <div class="phone"><img src="${data('mobile-first')}"></div>
  </body></html>`);
  await page.evaluate(() => document.fonts.ready);
  await sharp(await page.screenshot({ type: 'png' })).jpeg({ quality: 86, mozjpeg: true }).toFile(`${dir}/og.jpg`);
  await page.close();
}

const browser = await chromium.launch({ executablePath: CHROME });
for (const project of projects) {
  if (only.length && !only.includes(project.slug)) continue;
  const dir = resolve(root, 'public/work', project.slug);
  mkdirSync(dir, { recursive: true });
  const manifest = { url: project.url, captured: new Date().toISOString().slice(0, 10), images: {}, gallery: [] };
  let n = 0;
  try {
    for (const [vp, opts] of Object.entries(VIEWPORTS)) {
      const ctx = await browser.newContext({ ...opts, reducedMotion: 'reduce' });
      const page = await ctx.newPage();
      await prepare(page, project.url, vp === 'mobile');
      await save(await page.screenshot(), `${dir}/${vp}-first`, opts.maxWidth, manifest.images, `${vp}-first`);
      await save(await page.screenshot({ fullPage: true }), `${dir}/${vp}-full`, opts.maxWidth, manifest.images, `${vp}-full`, { full: true });

      for (const shot of project.capture || []) {
        if ((shot.viewport || 'mobile') !== vp) continue;
        try {
          await page.evaluate(() => scrollTo(0, 0));
          const target = shot.auto ? await autoTarget(page, shot.auto) : (shot.scrollTo || shot.click);
          if (!target) { console.warn(`  ${project.slug}: no ${shot.kind} found`); continue; }
          let buffer;
          if (shot.click || shot.auto === 'menu') {
            // a click from script, so a covering layer can't swallow it
            await page.locator(target).first().evaluate(el => el.click());
            await wait(700);
            buffer = await page.screenshot();
            await page.locator(target).first().evaluate(el => el.click()).catch(() => {});
          } else {
            const el = page.locator(target).first();
            await el.scrollIntoViewIfNeeded({ timeout: 5000 });
            await wait(500);
            const box = await el.boundingBox();
            buffer = box && box.height <= opts.viewport.height * 1.8
              ? await el.screenshot()
              : await page.screenshot();   // a long section: its first screen
          }
          const key = `gallery-${++n}`;
          await save(buffer, `${dir}/${key}`, opts.maxWidth, manifest.images, key);
          manifest.gallery.push({ file: key, kind: shot.kind, viewport: vp });
        } catch (err) {
          console.warn(`  ${project.slug}: ${shot.kind} (${vp}) skipped: ${err.message.split('\n')[0]}`);
        }
      }
      await ctx.close();
    }
    await og(browser, dir, project);
    writeFileSync(`${dir}/manifest.json`, `${JSON.stringify(manifest, null, 2)}\n`);
    console.log(`✓ ${project.slug}: ${Object.keys(manifest.images).length} images, ${manifest.gallery.length} gallery`);
  } catch (err) {
    console.error(`✗ ${project.slug}: ${err.message.split('\n')[0]}`);
  }
}
await browser.close();
