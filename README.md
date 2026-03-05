# Ayoub Chekhab — Portfolio Website 🦇

A Batman-themed personal portfolio with 3D background, bat explosion intro, and multi-section layout.

## 📁 Project Structure

```
ayoub-portfolio/
│
├── index.html          ← Main HTML (structure only)
│
├── css/
│   └── style.css       ← All styles (variables, layout, components, responsive)
│
├── js/
│   ├── three-bg.js     ← Three.js 3D background (bats + particles + shapes)
│   └── main.js         ← UI logic (cursor, navbar, reveal, counters, bat explosion)
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
│   ├── logo1.jpg → logo12.jpg
│   └── graphic1.jpg → graphic7.jpg
│
└── README.md
```

## 🖼️ Images to Add

Place these images in the `images/` folder:

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
| `logo1.jpg` – `logo12.jpg` | Logo design gallery |
| `graphic1.jpg` – `graphic7.jpg` | Social media graphic gallery |

## 🚀 Run Locally

1. Open the folder in **VS Code**
2. Install the **Live Server** extension
3. Right-click `index.html` → **Open with Live Server**

> ⚠️ Must be opened via a server (not direct file open) because of the Three.js import map.

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
