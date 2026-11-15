/* Landing scroll story: one sticky stage per project, scroll distance = scenes.
   The active scene fades/slides in; its picture zooms (or pans) as you scroll through it, and back out when you scroll up. */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  /* ---- story (work 01) ---- */
  document.querySelectorAll('[data-story]').forEach((root) => {
    const N = +root.dataset.steps;
    root.style.setProperty('--steps', N);
    if (reduce) return;
    const stage = root.querySelector('.story__stage');
    const texts = [...root.querySelectorAll('[data-step-text]')];
    const medias = [...root.querySelectorAll('[data-step-media]')];
    const dots = [...root.querySelectorAll('[data-dot]')];
    const bar = root.querySelector('.story__bar');
    const cfg = medias.map((m) => {
      const z = (m.dataset.zoom || '1,1').split(',').map(Number);
      const pan = m.dataset.pan ? m.dataset.pan.split(',').map(Number) : null;
      return { z, pan, el: m.querySelector('img'), org: m.dataset.org };
    });
    cfg.forEach((c) => { if (c.el && c.org) c.el.style.transformOrigin = c.org; });

    let target = 0, cur = 0, raf = 0, live = false, lastIdx = -1, lastT = 0;
    const progress = () => {
      const r = root.getBoundingClientRect();
      const total = Math.max(1, r.height - stage.offsetHeight);
      return clamp(-r.top / total, 0, 1);
    };
    const apply = (p) => {
      const x = clamp(p * N, 0, N - 0.0001);
      const idx = Math.floor(x), u = x - idx;
      if (idx !== lastIdx) {
        lastIdx = idx;
        texts.forEach((t, i) => { t.classList.toggle('is-on', i === idx); t.classList.toggle('is-past', i < idx); });
        medias.forEach((m, i) => m.classList.toggle('is-on', i === idx));
        dots.forEach((d, i) => d.classList.toggle('is-on', i === idx));
      }
      const c = cfg[idx];
      if (c && c.el) {
        const e = ease(clamp(u * 1.15, 0, 1));
        const s = lerp(c.z[0], c.z[1], e);
        let ty = '';
        if (c.pan) {
          const w = c.el.parentElement.clientWidth, imgH = c.el.naturalHeight && c.el.naturalWidth ? w * c.el.naturalHeight / c.el.naturalWidth : 0;
          const hostH = c.el.parentElement.clientHeight, room = Math.max(0, imgH - hostH);
          ty = `translateY(${(-(lerp(c.pan[0], c.pan[1], e) / 100) * room).toFixed(1)}px) `;
        }
        c.el.style.transform = `${ty}scale(${s.toFixed(4)})`;
      }
      if (bar) bar.style.setProperty('--p', p.toFixed(4));
    };
    const tick = (t) => {
      raf = 0;
      const dt = Math.min(0.05, ((t || 0) - lastT) / 1000 || 0.016); lastT = t || 0;
      target = progress();
      const d = target - cur;
      cur = Math.abs(d) < 0.0002 ? target : cur + d * (1 - Math.exp(-dt * 10));
      apply(cur);
      if (live && cur !== target) raf = requestAnimationFrame(tick);
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
    new IntersectionObserver((es) => { live = es[0].isIntersecting; if (live) { cur = target = progress(); apply(cur); kick(); } }, { rootMargin: '30% 0px' }).observe(root);
    addEventListener('scroll', () => { if (live) kick(); }, { passive: true });
    addEventListener('resize', () => { apply(cur); kick(); });
    cur = target = progress(); apply(cur);
  });

  /* ---- teasers: picture eases from zoomed-in to rest as it crosses the screen ---- */
  const teasers = [...document.querySelectorAll('[data-teaser]')];
  if (teasers.length && !reduce) {
    const upd = () => {
      teasers.forEach((t) => {
        const r = t.getBoundingClientRect(), vh = innerHeight;
        const p = clamp(1 - (r.top + r.height * 0.4) / vh, 0, 1);
        t.style.setProperty('--s', (1.16 - 0.16 * ease(p)).toFixed(3));
      });
    };
    addEventListener('scroll', () => requestAnimationFrame(upd), { passive: true });
    addEventListener('resize', upd); upd();
  }
})();
