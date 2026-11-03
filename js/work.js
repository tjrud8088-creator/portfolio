/* Case-study loop page: virtual endless scroll (wheel / touch / keys), letter-by-letter titles, exit back to Home */
(() => {
  const field = document.querySelector('[data-field]');
  if (!field) return;
  const root = document.documentElement;
  const body = document.body;
  const items = [...field.querySelectorAll('.witem')];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Titles: one span per letter so they can rise with a delay on hover */
  items.forEach((it) => {
    const t = it.querySelector('[data-split]');
    if (!t) return;
    const s = t.textContent;
    t.setAttribute('aria-label', s);
    t.textContent = '';
    [...s].forEach((c, i) => {
      const o = document.createElement('span');
      o.className = 'ch';
      o.setAttribute('aria-hidden', 'true');
      const inner = document.createElement('span');
      inner.textContent = c === ' ' ? ' ' : c;
      inner.style.transitionDelay = `${i * 45}ms`;
      o.appendChild(inner);
      t.appendChild(o);
    });
  });

  /* Leaving to Home: remember it so the landing page plays the "pile rises from below" return */
  let leaving = false;
  let target = 0;
  document.querySelectorAll('[data-exit]').forEach((a) => {
    a.addEventListener('click', (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0 || reduce) return;
      e.preventDefault();
      if (leaving) return;
      leaving = true;
      try { sessionStorage.setItem('from', 'work'); } catch (err) { /* storage blocked */ }
      body.classList.add('is-leaving');
      target += 150;
      setTimeout(() => { window.location.href = a.href; }, 850);
    });
  });
  window.addEventListener('pageshow', (e) => { if (e.persisted) { leaving = false; body.classList.remove('is-leaving'); } });

  if (reduce) { root.classList.add('work-static'); body.classList.add('work-static'); return; }

  /* Endless vertical loop. Units are vh; each slot is 55vh apart and wraps around. */
  const GAP = 55;
  const L = items.length * GAP;
  const mod = (a, n) => ((a % n) + n) % n;
  let pos = 0;
  const vh = () => window.innerHeight;
  const place = () => {
    items.forEach((it, i) => {
      const sp = parseFloat(it.style.getPropertyValue('--sp')) || 1;
      const y = mod(i * GAP - pos * sp, L) - 62;
      it.style.transform = `translate3d(0, ${y.toFixed(3)}vh, 0)`;
    });
  };
  const frame = () => {
    if (!leaving) target += 0.012; /* slow idle drift so the images float */
    pos += (target - pos) * 0.075;
    place();
    requestAnimationFrame(frame);
  };
  window.addEventListener('wheel', (e) => { if (leaving) return; target += (e.deltaY / vh()) * 100 * 0.9; }, { passive: true });
  let ty = null;
  window.addEventListener('touchstart', (e) => { ty = e.touches[0].clientY; }, { passive: true });
  window.addEventListener('touchmove', (e) => {
    if (ty === null || leaving) return;
    const y = e.touches[0].clientY;
    target += ((ty - y) / vh()) * 100 * 1.3;
    ty = y;
  }, { passive: true });
  window.addEventListener('touchend', () => { ty = null; });
  window.addEventListener('keydown', (e) => {
    if (leaving) return;
    if (['ArrowDown', 'PageDown', ' '].includes(e.key)) { target += 35; if (e.key === ' ') e.preventDefault(); }
    if (['ArrowUp', 'PageUp'].includes(e.key)) target -= 35;
  });
  place();
  requestAnimationFrame(frame);
})();
