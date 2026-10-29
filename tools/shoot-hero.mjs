// Screenshots of the hero's key states + basic health checks.
//   node tools/shoot-hero.mjs [baseURL] [outDir] [lang]
// Needs `npx vite preview` (default http://localhost:4173) and Google Chrome.
import { chromium } from 'playwright-core';

const BASE = process.argv[2] || 'http://localhost:4173';
const OUT = process.argv[3] || 'shots';
const LANG = process.argv[4] || 'en';
const PATH = LANG === 'en' ? '/' : `/${LANG}/`;
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = ms => new Promise(r => setTimeout(r, ms));

const report = [];

async function session(name, contextOpts, steps, launchArgs = []) {
  const browser = await chromium.launch({ executablePath: CHROME, args: launchArgs });
  const ctx = await browser.newContext({ ...contextOpts, locale: LANG === 'ar' ? 'ar' : LANG === 'fr' ? 'fr-FR' : 'en-US' });
  // Make sure the first-visit language redirect never fires during tests
  await ctx.addInitScript(lang => { try { localStorage.setItem('lang', lang); } catch {} }, LANG);
  const page = await ctx.newPage();
  const problems = [];
  page.on('pageerror', e => problems.push(`pageerror: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error') problems.push(`console: ${m.text()}`); });
  page.on('response', r => { if (r.status() >= 400) problems.push(`${r.status()} ${r.url()}`); });
  await page.goto(BASE + PATH, { waitUntil: 'networkidle' });
  await wait(1800);
  for (const [label, fn] of steps) {
    await fn(page);
    await page.screenshot({ path: `${OUT}/${name}-${label}.png` });
  }
  const info = await page.evaluate(() => ({
    overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    mode: ['is-cinema', 'is-lite', 'is-still', 'is-webgl'].filter(c => document.documentElement.classList.contains(c)),
    lcp: performance.getEntriesByType('largest-contentful-paint').at(-1)?.element?.className ?? null,
  }));
  report.push({ name, ...info, problems });
  await browser.close();
}

// Scroll to a fraction of the hero's pinned range (desktop) and let the scrub settle
const toPin = p => async page => {
  await page.evaluate(p => {
    const hero = document.getElementById('top');
    scrollTo(0, (hero.offsetHeight - innerHeight) * p);
  }, p);
  await wait(1600);
};
const toCard = async page => {
  await page.evaluate(() => {
    const c = document.querySelector('.reel-thumb').getBoundingClientRect();
    scrollTo(0, c.top + scrollY - (innerHeight - c.height) / 2);
  });
  await wait(2200);
};
const toEl = sel => async page => {
  await page.evaluate(sel => { const r = document.querySelector(sel).getBoundingClientRect(); scrollTo(0, r.top + scrollY - 90); }, sel);
  await wait(1200);
};

await session('1440', { viewport: { width: 1440, height: 900 } }, [
  ['1-start', async page => { await page.mouse.move(1020, 260); await wait(900); }],
  ['2-beat1-ring', toPin(.19)],
  ['3-beat3', toPin(.7)],
  ['4-reel-card', toCard],
], ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']);

await session('390', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }, [
  ['1-start', async () => wait(600)],
  ['2-beat1-tools', toEl('.beats')],
  ['3-beat3', toEl('.beat:nth-child(3)')],
  ['4-reel-card', toCard],
]);

console.log(JSON.stringify(report, null, 2));
