/* About page: EN / KO toggle (remembers the choice) */
(() => {
  const btn = document.querySelector('[data-lang-toggle]');
  if (!btn) return;
  const root = document.documentElement;
  let lang = 'en';
  try { lang = localStorage.getItem('lang') === 'ko' ? 'ko' : 'en'; } catch (e) { /* storage blocked */ }
  const apply = () => {
    document.querySelectorAll('[data-en]').forEach((el) => {
      const v = el.dataset[lang];
      if (v) el.textContent = v;
    });
    root.lang = lang;
    btn.textContent = lang === 'en' ? 'KO' : 'EN';
    btn.setAttribute('aria-label', lang === 'en' ? '한국어로 보기' : 'Switch to English');
  };
  btn.addEventListener('click', () => {
    lang = lang === 'en' ? 'ko' : 'en';
    try { localStorage.setItem('lang', lang); } catch (e) { /* ignore */ }
    apply();
  });
  apply();
})();
