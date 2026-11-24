/* Landing scroll scenes + cursor + hover motion. No libraries. Native scrolling is never intercepted.
   Each scene reads its raw progress from the scroll position, eases it (frame-rate independent), then renders.
   Because the render is a pure function of the eased progress, scrolling back up plays everything in reverse. */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(pointer: fine)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (t) => t * t * (3 - 2 * t);
  const inOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const SMOOTH = 5.5; /* higher = snappier; lower = silkier */

  const prog = (root, stage) => {
    const r = root.getBoundingClientRect();
    return clamp(-r.top / Math.max(1, r.height - stage.offsetHeight));
  };

  /* ---------- scenes ---------- */
  const scenes = [];

  const wordsRoot = document.querySelector('[data-words]');
  if (wordsRoot) {
    const stage = wordsRoot.querySelector('.words__stage');
    const ws = [...wordsRoot.querySelectorAll('[data-w]')];
    const st = wordsRoot.querySelector('[data-w-statement]');
    const sub = wordsRoot.querySelector('[data-w-sub]');
    const n = ws.length;
    scenes.push({
      root: wordsRoot, stage, cur: 0,
      render(p) {
        ws.forEach((el, i) => {
          const s = i * 0.06, t = clamp((p - s) / 0.46);
          const e = inOut(t);
          const y = lerp(105, -45, e);
          const o = Math.min(smooth(clamp(t / 0.12)), 1 - smooth(clamp((t - 0.82) / 0.18)));
          el.style.transform = `translate3d(0,${y.toFixed(2)}vh,0)`;
          el.style.opacity = o.toFixed(3);
        });
        const a = smooth(clamp((p - 0.5) / 0.2)), b = smooth(clamp((p - 0.66) / 0.18));
        st.style.opacity = a.toFixed(3);
        st.style.transform = `translate3d(0,${((1 - a) * 48).toFixed(1)}px,0)`;
        sub.style.opacity = b.toFixed(3);
        sub.style.transform = `translate3d(0,${((1 - b) * 36).toFixed(1)}px,0)`;
      }
    });
  }

  const reelRoot = document.querySelector('[data-reel]');
  if (reelRoot) {
    const stage = reelRoot.querySelector('.reel__stage');
    const rows = [...reelRoot.querySelectorAll('[data-row]')];
    scenes.push({
      root: reelRoot, stage, cur: 0,
      render(p) {
        rows.forEach((row, i) => {
          const dir = +row.dataset.row, inner = row.firstElementChild;
          const range = inner.scrollWidth - row.clientWidth;
          const k = (i === 1 ? 1 : 0.7);
          const x = dir > 0 ? -p * range * k : -(1 - p) * range * k;
          inner.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`;
        });
        const slot = reelRoot.querySelector('.reel__slot');
        const w = lerp(26, 44, inOut(clamp(p / 0.45)));
        slot.style.setProperty('--slot-w', w.toFixed(2) + 'vw');
      }
    });
  }

  const svcRoot = document.querySelector('[data-svc]');
  if (svcRoot) {
    const stage = svcRoot.querySelector('.svc__stage');
    const items = [...svcRoot.querySelectorAll('[data-svc-i]')];
    const no = svcRoot.querySelector('[data-svc-no]');
    const line = svcRoot.querySelector('.svc__line');
    const N = items.length;
    let lastNo = -1;
    scenes.push({
      root: svcRoot, stage, cur: 0,
      render(p) {
        const x = clamp(p / 0.9) * (N - 1);
        items.forEach((el, i) => {
          const off = i - x;
          /* rolls up and fades out above, waits dimmed below, rises into place */
          const y = off * 64;
          let o = off < 0 ? 1 + off * 1.15 : off < 1 ? 1 - off * 0.55 : 0;
          if (off > 1) o = clamp(1 - (off - 1) * 2) * 0.45;
          o = clamp(o);
          el.style.transform = `translate3d(0,${y.toFixed(2)}vh,0)`;
          el.style.opacity = o.toFixed(3);
          el.classList.toggle('is-on', Math.abs(off) < 0.5);
        });
        const idx = clamp(Math.round(x), 0, N - 1);
        if (idx !== lastNo) { lastNo = idx; no.textContent = String(idx + 1).padStart(2, '0'); }
        line.style.setProperty('--p', p.toFixed(4));
      }
    });
  }

  /* ---------- cursor ---------- */
  let cx = -100, cy = -100, tx = -100, ty = -100, curEl = null, lbl = null, shown = false;
  if (fine && !reduce) {
    curEl = document.createElement('div');
    curEl.className = 'cur';
    curEl.setAttribute('aria-hidden', 'true');
    curEl.innerHTML = '<span class="cur__dot"></span>';
    document.body.appendChild(curEl);
    lbl = curEl.firstChild;
    const pile = document.querySelector('[data-pile]');
    if (pile) pile.setAttribute('data-cursor', 'arrow');
    const LABELS = { arrow: '→', play: '▶', view: 'View' };
    const setState = (t) => {
      const el = t && t.closest ? t.closest('[data-cursor]') : null;
      const kind = el ? el.getAttribute('data-cursor') : '';
      const link = !kind && t && t.closest && t.closest('a, button');
      curEl.classList.toggle('is-label', !!kind);
      curEl.classList.toggle('is-link', !!link);
      lbl.textContent = kind ? LABELS[kind] || '' : '';
    };
    addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      tx = e.clientX; ty = e.clientY;
      if (!shown) { shown = true; cx = tx; cy = ty; curEl.classList.add('is-on'); }
      setState(e.target);
    }, { passive: true });
    addEventListener('pointerdown', () => curEl.classList.add('is-down'));
    addEventListener('pointerup', () => curEl.classList.remove('is-down'));
    document.documentElement.addEventListener('pointerleave', () => { shown = false; curEl.classList.remove('is-on'); });
  }

  /* ---------- hover motion on project pictures ---------- */
  const tilts = fine && !reduce ? [...document.querySelectorAll('[data-tilt]')].map((el) => {
    const s = { el, tx: 0, ty: 0, x: 0, y: 0, hot: false };
    el.addEventListener('pointerenter', () => { s.hot = true; });
    el.addEventListener('pointerleave', () => { s.hot = false; s.tx = 0; s.ty = 0; });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      s.tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      s.ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
    });
    return s;
  }) : [];

  if (reduce) { scenes.forEach((s) => s.render(1)); return; }

  /* ---------- one loop ---------- */
  let last = performance.now();
  const loop = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const k = 1 - Math.exp(-dt * SMOOTH);
    const vh = window.innerHeight;
    scenes.forEach((s) => {
      const r = s.root.getBoundingClientRect();
      if (r.bottom < -vh * 0.5 || r.top > vh * 1.5) return; /* offscreen: skip work */
      const target = prog(s.root, s.stage);
      s.cur = Math.abs(target - s.cur) < 0.00005 ? target : lerp(s.cur, target, k);
      s.render(s.cur);
    });
    if (curEl) {
      const ck = 1 - Math.exp(-dt * 16);
      cx = lerp(cx, tx, ck); cy = lerp(cy, ty, ck);
      curEl.style.transform = `translate3d(${cx.toFixed(1)}px,${cy.toFixed(1)}px,0)`;
    }
    tilts.forEach((s) => {
      const tk = 1 - Math.exp(-dt * 9);
      s.x = lerp(s.x, s.tx, tk); s.y = lerp(s.y, s.ty, tk);
      s.el.style.setProperty('--rx', (-s.y * 5).toFixed(2) + 'deg');
      s.el.style.setProperty('--ry', (s.x * 6).toFixed(2) + 'deg');
      const img = s.el.firstElementChild;
      img.style.setProperty('--tx', (-s.x * 22).toFixed(1) + 'px');
      img.style.setProperty('--ty', (-s.y * 16).toFixed(1) + 'px');
    });
    requestAnimationFrame(loop);
  };
  /* start from the true scroll position so a reload mid-page doesn't animate in from zero */
  scenes.forEach((s) => { s.cur = prog(s.root, s.stage); s.render(s.cur); });
  requestAnimationFrame(loop);
})();
