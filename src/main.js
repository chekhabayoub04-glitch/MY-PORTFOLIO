import './styles/tokens.css';
import './styles/hero.css';
import { initHero } from './hero/index.js';
import { initSections, setLenis } from './legacy/sections.js';

// The language choice is remembered (the head script reads it on /)
document.querySelectorAll('.lang-switch a').forEach(a => a.addEventListener('click', () => {
  try { localStorage.setItem('lang', a.dataset.lang); } catch {}
}));

initSections();
initHero({ onLenis: setLenis });
