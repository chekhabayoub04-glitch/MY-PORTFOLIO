// Renders tools/og-card.html → images/og-cover.jpg (the link-preview image).
// Run from the project root (needs puppeteer-core + Chrome): node tools/render_og.mjs
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--allow-file-access-from-files'] });
const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(resolve('tools/og-card.html')).href, { waitUntil: 'networkidle0' });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: 'images/og-cover.jpg', type: 'jpeg', quality: 90 });
await browser.close();
console.log('✓ images/og-cover.jpg');
