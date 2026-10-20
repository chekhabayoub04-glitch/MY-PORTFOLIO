# Ayoub Chekhab — Portfolio Website 🦇

**Shadow & Light** — a black & gold, Batman-themed portfolio. The home page opens on a gold
halftone hero where the portrait waits as a silhouette; your cursor is a liquid light that
reveals the real photo (WebGL/GLSL metaball shader, CSS-mask fallback). Every image on the
page follows the same rule: it stays in shadow until you light it.

Home page sections: Ignition (loader) · Shadow Reveal hero (pinned: scrolling sends a light beam
across the screen that flips day → night and reveals the services beside Ayoub's silhouette and the
bat-signal) · Manifesto · Arsenal (the work in four chapters: stacked sticky cards — a browser frame where
pointer x switches between three live sites and pointer y scrolls them, poster trios, AI-film reels
with sound, a logo wall) · Case Files (pinned horizontal archive) · Origin (education + numbers) · Protocol (process) ·
The Emblem (real-time Three.js gold bat emblem, lazy-loaded) · Signal (contact). The previous home page is kept as `index-v1.html`.

### Hero asset pipeline (Python)

`tools/build_hero.py` turns `images/hero/ayoub-source.png` (white studio background) into
`ayoub-cutout.webp` (the light) and `ayoub-shadow.webp` (the silhouette):

```bash
python3 -m venv .venv-tools && .venv-tools/bin/pip install pillow numpy
.venv-tools/bin/python tools/build_hero.py
.venv-tools/bin/python tools/optimize_images.py   # responsive WebP copies → images/opt/ (9.4 MB → 1.4 MB)
```

Re-run `optimize_images.py` after replacing any home-page image. To refresh the website screenshots
in the browser frame, run `node tools/capture_sites.mjs` (needs `puppeteer-core` and Chrome), then the
optimiser again.

The link-preview image (`images/og-cover.jpg`, used by WhatsApp, Facebook, LinkedIn and X) is
designed in `tools/og-card.html`; re-render it with `node tools/render_og.mjs`.

## 📁 Project Structure

```
ayoub-portfolio/
│
├── index.html          ← Main portfolio and contact form
├── web-development.html ← Website project gallery
├── logo-design.html    ← Logo and brand identity gallery
├── graphic-design.html ← Combined campaign and graphic design gallery
├── social-media.html   ← Redirect to the combined visual gallery
├── campaigns.html      ← Advertising campaign case studies
├── editing.html        ← Photo and video editing samples
├── ai-videos.html      ← AI video and brand identity library
│
├── css/
│   ├── noir.css        ← New home page styles (Shadow & Light)
│   └── style.css       ← Service pages + legacy home page styles
│
├── js/
│   ├── noir/           ← New home page: hero-reveal.js (WebGL), emblem3d.js (Three.js), app.js
│   ├── three-bg.js     ← Three.js 3D background (legacy home page)
│   ├── main.js         ← Shared UI interactions
│   ├── service-ui.js   ← Shared service page UI
│   └── portfolio-gallery.js ← Searchable, filterable project galleries
│
├── images/             ← Put all your images here (see list below)
│   ├── batman-logo.png
│   ├── avatar.jpg
│   ├── university.jpg
│   ├── service-web.png
│   ├── service-logo.jpg
│   ├── service-social.jpg
│   ├── project-drbadis.jpg
│   ├── project-dr213.jpg
│   ├── project-deutsch.jpg
│   ├── project-coffee.jpg
│   ├── logo1.jpg → logo13.jpg
│   └── graphic1.jpg → graphic7.jpg
│
├── videos/
│   ├── brand-identity/ ← AI brand films
│   └── editing/        ← Edited video samples
│
└── README.md
```

## 🖼️ Images

Portfolio images are stored in the `images/` folder. Keep the filenames used by the pages when replacing assets.

| File | Description |
|------|-------------|
| `batman-logo.png` | Batman logo (navbar + footer) |
| `avatar.jpg` | Your face photo (circle) |
| `university.jpg` | Université Alger 2 photo |
| `service-web.png` | Web development service artwork |
| `graphic-campaigns-cover.png` | Graphic design and campaign service card cover |
| `service-logo.jpg` | Logo design service image |
| `service-social.jpg` | Social media service image |
| `project-drbadis.jpg` | Dr. Badis project thumbnail |
| `project-dr213.jpg` | Dr. 213 thumbnail |
| `project-deutsch.jpg` | Deutsch project thumbnail |
| `project-coffee.jpg` | Coffee Break DZ thumbnail |
| `logo1.jpg` – `logo13.jpg` | Logo design gallery |
| `graphic1.jpg` – `graphic7.jpg` | Social media graphic gallery |

The website, logo, graphic design, campaign, and image galleries share a responsive portfolio layout with category filters, search, image previews, and keyboard-accessible navigation.

## 🚀 Run Locally

1. Open the folder in **VS Code**
2. Install the **Live Server** extension
3. Right-click `index.html` → **Open with Live Server**

The home page should be opened through a local server rather than `file://` — WebGL can't read image textures from `file://`, so the hero would drop to its simpler CSS fallback. The other pages are static HTML and can also be served from the same local server.

The contact form opens a prefilled message in the visitor's email application; the site does not send or store messages on a server.

## 🎬 Add videos

The AI brand-film page presents a four-video cinematic carousel. The published clips are optimized 720p `.m4v` web copies, with poster images in `videos/posters/`. Full-resolution `.MOV` sources are kept locally in `videos/source-originals/` and excluded from GitHub Pages. To add another web-ready MP4, M4V, or WebM film, add it to `videos/brand-identity/` and add its title, category, video path, and poster path to the `brandFilms` list in `ai-videos.html`. Editing samples can be added to `videos/editing/` for a future gallery.

## 🌐 Deploy to GitHub Pages

```bash
# 1. Create a new repo on github.com named: ayoub-portfolio

# 2. In your project folder, open terminal and run:
git init
git add .
git commit -m "Initial portfolio"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ayoub-portfolio.git
git push -u origin main

# 3. On GitHub: Settings → Pages → Source: main branch → Save
# Your site will be live at: https://YOUR_USERNAME.github.io/ayoub-portfolio
```

## 🛠️ Technologies Used

| Tech | Role |
|------|------|
| HTML5 | Structure, speculation-rules prefetch |
| CSS | `@property`, masks, view transitions, clip-path, responsive |
| JavaScript (ES2022) | Lens cursor, spotlight surfaces, pinned scroll, counters |
| WebGL / GLSL | Shadow Reveal hero shader (metaball light, noise edge, gold rim) |
| Three.js r170 (ES module) | The Emblem: extruded PBR gold/obsidian bat, env-map reflections, pointer torch, gold dust |
| Python (Pillow + NumPy) | Hero cut-out, silhouette, responsive WebP pipeline |
| Three.js (r128) | 3D background on the legacy home page (`index-v1.html`) |
| Google Fonts | Bebas Neue, Black Ops One, Outfit |
| Font Awesome 6 | Icons |
