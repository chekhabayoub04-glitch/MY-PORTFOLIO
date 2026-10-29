import './styles/tokens.css';
import './styles/chrome.css';
import './styles/hero.css';
import './styles/work.css';
import { rememberLanguage } from './common.js';
import { initHero } from './hero/index.js';
import { initSections, setLenis } from './legacy/sections.js';
import { initCarousel } from './work/carousel.js';

rememberLanguage();
initSections();
initCarousel();
initHero({ onLenis: setLenis });
