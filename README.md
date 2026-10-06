# Ayoub Chekhab — Portfolio Website 🦇

A Batman-themed personal portfolio with 3D background, bat explosion intro, and multi-section layout.

## 📁 Project Structure

```
ayoub-portfolio/
│
├── index.html          ← Main portfolio and contact form
├── web-development.html ← Website project gallery
├── logo-design.html    ← Logo gallery and preview manager
├── social-media.html   ← Social media graphics gallery
├── campaigns.html      ← Advertising campaign case studies
├── editing.html        ← Photo and video editing samples
├── ai-videos.html      ← AI video and brand identity library
│
├── css/
│   └── style.css       ← All styles (variables, layout, components, responsive)
│
├── js/
│   ├── three-bg.js     ← Three.js 3D background (home page)
│   ├── main.js         ← Shared UI interactions
│   └── service-ui.js   ← Reusable service page galleries and lightbox
│
├── images/             ← Put all your images here (see list below)
│   ├── batman-logo.png
│   ├── avatar.jpg
│   ├── university.jpg
│   ├── service-web.jpg
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
| `service-web.jpg` | Web dev service image |
| `service-logo.jpg` | Logo design service image |
| `service-social.jpg` | Social media service image |
| `project-drbadis.jpg` | Dr. Badis project thumbnail |
| `project-dr213.jpg` | Dr. 213 thumbnail |
| `project-deutsch.jpg` | Deutsch project thumbnail |
| `project-coffee.jpg` | Coffee Break DZ thumbnail |
| `logo1.jpg` – `logo13.jpg` | Logo design gallery |
| `graphic1.jpg` – `graphic7.jpg` | Social media graphic gallery |

## 🚀 Run Locally

1. Open the folder in **VS Code**
2. Install the **Live Server** extension
3. Right-click `index.html` → **Open with Live Server**

The home page uses an import map for Three.js and should be opened through a local server rather than `file://`. The other pages are static HTML and can also be served from the same local server.

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
| HTML5 | Structure |
| CSS3 | Styling, animations, responsive |
| JavaScript (ES6+) | Interactivity, cursor, scroll effects |
| Three.js (r128) | 3D background, flying bats, particles |
| Google Fonts | Bebas Neue, Black Ops One, Outfit |
| Font Awesome 6 | Icons |
