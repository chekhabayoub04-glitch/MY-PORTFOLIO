// Captures the live websites for the home-page browser frame.
// Run from the project root (needs puppeteer-core + Chrome): node tools/capture_sites.mjs
// then: .venv-tools/bin/python tools/optimize_images.py

import { mkdirSync } from 'node:fs';
import puppeteer from 'puppeteer-core';
const sites = { 'titan-gym':'https://chekhabayoub04-glitch.github.io/titan-gym/', 'dr-badis':'https://chekhabayoub11-ops.github.io/dr.badis/', 'saida-real-estate':'https://chekhabayoub04-glitch.github.io/new-vession-promition-/', 'dr-213':'https://chekhabayoub11-ops.github.io/dr.213/', 'dr-sofian-clinic':'https://chekhabayoub11-ops.github.io/dr-sofian-clinic/' };
const only = process.argv.slice(2);   // optional: capture just these keys
mkdirSync('images/sites/raw', { recursive: true });
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
for (const [k,u] of Object.entries(sites)) {
  if (only.length && !only.includes(k)) continue;
  const p = await b.newPage(); await p.setViewport({width:1440,height:900,deviceScaleFactor:1.5});
  try { await p.goto(u,{waitUntil:'networkidle2',timeout:60000}); await new Promise(r=>setTimeout(r,2500));
    // trigger lazy/reveal content
    const H = await p.evaluate(()=>document.documentElement.scrollHeight);
    for (let y=0;y<Math.min(H,4000);y+=500){ await p.evaluate(y=>scrollTo(0,y),y); await new Promise(r=>setTimeout(r,250)); }
    await p.evaluate(()=>scrollTo(0,0)); await new Promise(r=>setTimeout(r,1200));
    await p.screenshot({path:`images/sites/raw/${k}.png`, clip:{x:0,y:0,width:1440,height:Math.min(H,3600)}, captureBeyondViewport:true});
    console.log(k,'ok',H);
  } catch(e){ console.log(k,'FAIL',e.message); }
  await p.close();
}
await b.close();
