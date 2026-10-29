// Shared by every page: remember the language the visitor picks
// (the head script on / reads it on the next visit).
export function rememberLanguage() {
  document.querySelectorAll('.lang-switch a').forEach(a => a.addEventListener('click', () => {
    try { localStorage.setItem('lang', a.dataset.lang); } catch {}
  }));
}
