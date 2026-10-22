---
name: pro-portfolio
description: Build, change or review any section of Ayoub Chekhab's portfolio site to a professional (Awwwards-level), smooth, mobile-first standard, then test and deploy it. Use for any design, layout, animation, content or deploy request on this project, e.g. "make the services like Islam's site", "fix it on the phone", "make it smoother", "publish the changes".
---

# Professional portfolio — Ayoub Chekhab

The live site is https://ayoubchekhab-dev.is-a.dev. It is served from GitHub Pages: repo `chekhabayoub04-glitch/MY-PORTFOLIO`, branch `main`, custom domain in `CNAME`.
Quality bar: https://islamhamma.com. Match its calm editorial rhythm and its stacked project cards, but in Ayoub's identity.

## 1. Identity (never change without being asked)
- Colours: black `#000`, coal `#111110`, gold `#FFD700` (amber `#F5B400`, ember `#D98300`), cream `#FFF6DA`. The tokens live in `css/noir.css :root`.
- Type: Bebas Neue (display), Instrument Serif *italic* for the accent words in gold, Outfit (body), Black Ops One (small numerals).
- Motif: shadow and light, plus the vector bat `<symbol id="bat">`. The raster Batman logo is only for the loader and the favicon, never in link previews.
- Copy voice: short, confident, English. Page order (simplified Oct 2026 at the user's request, "too much design, not organised"): Film hero → Services → Work (Arsenal chapters) → About (Origin + toolkit) → Contact (Signal). Keep it that lean; don't re-add Manifesto, Showreel, Case Files or Protocol unless asked.
- The user writes in Arabic: reply in Arabic, but keep all site copy in English.

## 2. Where things live
| Area | Files |
|---|---|
| Home page | `index.html`, `css/noir.css`, `js/noir/app.js` |
| Cinematic film hero | `js/noir/film.js` + `.film` styles; frames from `tools/build_film.py` (video dropped in `videos/film/`, see its README) → `images/film/{desktop,mobile}/NNN.webp` + `film.json` |
| Tool logos | `images/tools/*.svg` (from svgl.app), used by the film orbit and the About toolkit |
| Service pages | `*.html` + `css/style.css` + `js/portfolio-gallery.js` |
| Assets pipeline | `tools/build_hero.py`, `tools/optimize_images.py` → `images/opt/*-{800,1600}.webp`, `tools/capture_sites.mjs` → `images/sites/*.webp`, `tools/og-card.html` + `tools/render_og.mjs` → `images/og-cover.jpg` |

## 3. Section patterns that work (reuse them)
- **Stacked project cards** (Islam style): `.stack > .stack-card`. They are sticky, and the card being covered gets `--cover` 0→1 from `coverStacks()` (it scales and dims).
  - Desktop: info on the left (tag, `01 / 03`, title, meta, text, CTA), media on the right.
  - Phones keep the stack too: compact cards at most ~560px tall, `top` offsets 76/128/180px so each header peeks above the next. Never turn stacking off on mobile.
- **Browser frame** `[data-browser]`: a real full-page screenshot inside it. Pointer y scrolls the screenshot; when idle it pans by itself (this also covers touch). The URL bar shows the real live URL.
- **Design collections**: the Graphic Design chapter has 7 stacked cards (Automotive, Car Care, Beauty & Fragrance, Food & Hospitality, Tech & Digital, Home Services, Sports & Streetwear). Each card sets `--i` (stack order), and its poster stage sets `--ar` (the images' real ratio) and `--n` (2–3 posters). A new design goes in the matching card and also in `graphic-design.html`.
- **Poster stage**: three 9:16 visuals on a warm radial light pool. They fan out in 3D on hover.
- **Reels** `[data-reel]`: 9:16 videos with the time read from the video's metadata. Hover previews them muted; the button plays with sound, and only one plays loud at a time.
- **Film hero** `#top.film` (520vh desktop, 440vh phones): the scroll scrubs Ayoub's walk-in film drawn on a canvas (cover-fit, frames loaded coarse-to-fine). Layers on top, by scroll progress: gold PORTFOLIO letters (.06–.38), tool logos flying into two arcs either side of him (.36–.66, his face stays clear), his three websites sliding in (.64–.86), then the last frame (his smile) with the name and CTAs (.88–1). Until frames exist, the shadow/cutout portrait stands in and lights up. The current film (Oct 2026) is a vertical AI clip with its own gold PORTFOLIO neon, so with frames our overlay title is hidden and the FILM timeline in film.js is cued to the clip (tools .06–.33, neon at ~.33, sites .38–.66, smile .88+). On wide screens a vertical clip becomes a centre panel over a blurred ambient copy (`.is-panel`). Letterbox bars, grain and a timecode HUD complete the cinema look. The source clip is gitignored; only frames are published.
- **Liquid glass cursor** `#lens`: a `backdrop-filter` droplet on a spring that stretches with velocity, with three trailing beads. `data-lens="Word"` grows it into a labelled gold disc.
- **Spotlight surfaces / tilt**: `[data-spot]`, `[data-tilt]`. Use them sparingly; images must stay clearly visible. Darkened "shadow" overlays on project images were rejected.

## 4. Smoothness and performance rules
- Smooth scroll: Lenis 1.1.13 (CDN) runs only on fine pointers without reduced motion; phones keep native momentum. Links to `#id` go through `lenis.scrollTo`.
- Animate only `transform`, `opacity`, `filter` and CSS variables. Batch scroll work into one rAF (`onScroll`).
- WebGL and three.js render only while visible (IntersectionObserver), with DPR capped at 1.75–2.
- Every new image goes through `tools/optimize_images.py`, uses `loading="lazy" decoding="async"`, and has a `srcset` where it is large. Videos use `preload="none"`.
- Respect `prefers-reduced-motion` everywhere.
- No horizontal overflow: `html { overflow-x: clip }`, plus a check in tests.

## 5. Definition of done (do all of it before saying "done")
1. Serve locally: `python3 tools/serve.py .` from the project root. Plain `http.server` drops connections under load and fakes broken images.
   - In headless tests, use software GL (`--use-angle=swiftshader`) only on desktop. On a mobile viewport it can freeze the page.
2. Drive real Chrome with puppeteer-core (`/Applications/Google Chrome.app/...`). Test at **1440×900 and 390×844 (isMobile, hasTouch)**:
   - no `pageerror` events or 4xx responses;
   - `scrollWidth - clientWidth === 0`;
   - screenshots of every section you touched, looked at, not assumed.
3. Phone check: the stack cards must stick and peek; text must not overlap buttons; nothing should depend on hover alone.
4. Compare against islamhamma.com at the same viewport when the request references it.

## 6. Deploy
```bash
git add -A && git commit -m "<what changed>"   # end the message with the Co-Authored-By line
git push origin main
```
- Wait for the "pages build and deployment" run: `api.github.com/repos/chekhabayoub04-glitch/MY-PORTFOLIO/actions/runs`. Then verify the live HTML with a cache-busting query, because the CDN caches for about 10 minutes.
- Never delete `CNAME`.
- Bump the `?v=` on `css/noir.css` and the `js/noir/*.js` tags in `index.html` with every deploy. Otherwise phones keep the cached old CSS/JS while the HTML is new.
- After changing the preview image, bump `?v=` on the `og:image` URLs in every page. Then tell the user to re-scrape in the Facebook Sharing Debugger and to share with `?v=N` on WhatsApp.
