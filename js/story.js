/* Landing scroll story: one sticky stage per project; scroll distance picks the scene.
   Scenes only fade/slide in and out. Nothing is scaled, panned or zoomed. */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  document.querySelectorAll('[data-story]').forEach((root) => {
    const N = +root.dataset.steps;
    root.style.setProperty('--steps', N);
    if (reduce) return;
    const stage = root.querySelector('.story__stage');
    const texts = [...root.querySelectorAll('[data-step-text]')];
    const medias = [...root.querySelectorAll('[data-step-media]')];
    const dots = [...root.querySelectorAll('[data-dot]')];
    const bar = root.querySelector('.story__bar');
    let last = -1, raf = 0;

    const update = () => {
      raf = 0;
      const r = root.getBoundingClientRect();
      const p = clamp(-r.top / Math.max(1, r.height - stage.offsetHeight), 0, 1);
      const idx = Math.min(N - 1, Math.floor(p * N));
      if (idx !== last) {
        last = idx;
        texts.forEach((t, i) => { t.classList.toggle('is-on', i === idx); t.classList.toggle('is-past', i < idx); });
        medias.forEach((m, i) => m.classList.toggle('is-on', i === idx));
        dots.forEach((d, i) => d.classList.toggle('is-on', i === idx));
      }
      if (bar) bar.style.setProperty('--p', p.toFixed(4));
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(update); };
    addEventListener('scroll', kick, { passive: true });
    addEventListener('resize', kick);
    update();
  });
})();
