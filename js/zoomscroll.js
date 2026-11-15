/* Scroll-driven zoom for the tablet walkthrough (section 09).
   Each .zc chapter is a tall scroll track with a sticky stage. Scroll position (0-1) picks a camera
   (centre x/y in 1180x820 screen px + zoom) interpolated between keyframes; the text block follows. */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  document.querySelectorAll('.zc').forEach(init);

  function init(root) {
    let cfg;
    try { cfg = JSON.parse(root.querySelector('script[type="application/json"]').textContent); } catch (e) { return; }
    const stage = root.querySelector('.zc__stage');
    const screen = root.querySelector('.zc__screen');
    const world = root.querySelector('.zc__world');
    const layers = [...root.querySelectorAll('.zc__layer')];
    const ring = root.querySelector('.zc__ring');
    const texts = [...root.querySelectorAll('.zc__t')];
    const caps = [...root.querySelectorAll('.zc__cap span')];
    const dots = [...root.querySelectorAll('.zc__dots i')];
    const hint = root.querySelector('.zc__hint');
    const K = cfg.kfs, n = K.length, SW = cfg.w, WH = cfg.worldH;
    let target = 0, cur = 0, raf = 0, live = false, lastNear = -1;

    if (reduce) { root.classList.add('is-static'); }

    const progress = () => {
      const r = root.getBoundingClientRect();
      const stickyTop = parseFloat(getComputedStyle(stage).top) || 0;
      const total = Math.max(1, r.height - stage.offsetHeight);
      return clamp((stickyTop - r.top) / total, 0, 1);
    };

    function camera(p) {
      const x = p * (n - 1);
      const i = Math.min(n - 2, Math.floor(x));
      const u = x - i;
      const a = ease(clamp((u - 0.22) / 0.56, 0, 1));
      const A = K[i], B = K[i + 1];
      let hl = null, hlo = 0;
      if (A.hl && B.hl) { hl = A.hl.map((v, j) => lerp(v, B.hl[j], a)); hlo = 1; }
      else if (A.hl) { hl = A.hl; hlo = 1 - a; }
      else if (B.hl) { hl = B.hl; hlo = a; }
      return { cx: lerp(A.cx, B.cx, a), cy: lerp(A.cy, B.cy, a), s: lerp(A.s, B.s, a), a, A, B, near: u < 0.5 ? i : i + 1, hl, hlo };
    }

    function render() {
      const W = screen.clientWidth, H = screen.clientHeight;
      if (!W) return;
      const k = W / SW;
      const c = camera(cur);
      const S = c.s * k;
      let tx = W / 2 - c.cx * S, ty = H / 2 - c.cy * S;
      tx = clamp(tx, Math.min(0, W - SW * S), 0);
      ty = clamp(ty, Math.min(0, H - WH * S), 0);
      world.style.transform = `translate(${tx.toFixed(2)}px,${ty.toFixed(2)}px) scale(${S.toFixed(4)})`;
      layers.forEach((l, j) => {
        const o = (c.A.img === j ? 1 - c.a : 0) + (c.B.img === j ? c.a : 0);
        l.style.opacity = clamp(o, 0, 1).toFixed(3);
      });
      if (c.hl) {
        const bw = 3 / S;
        ring.style.cssText = `left:${c.hl[0] - 8 * 1}px;top:${c.hl[1] - 8}px;width:${c.hl[2] + 16}px;height:${c.hl[3] + 16}px;opacity:${c.hlo.toFixed(3)};border-width:${(3.2 / S * k * 1).toFixed(3)}px;border-radius:${(14 / S * k * 1.0).toFixed(2)}px;box-shadow:0 0 0 ${(5 / S * k).toFixed(2)}px rgba(46,91,255,.2)`;
      } else {
        ring.style.opacity = 0;
      }
      if (c.near !== lastNear) {
        lastNear = c.near;
        const ti = cfg.textFor[c.near];
        texts.forEach((t, j) => t.classList.toggle('on', j === ti));
        caps.forEach((t, j) => t.classList.toggle('on', j === c.near));
        dots.forEach((t, j) => t.classList.toggle('on', j <= c.near));
      }
      if (hint) hint.style.opacity = cur < 0.03 ? 1 : 0;
    }

    function tick() {
      raf = 0;
      target = progress();
      const d = target - cur;
      cur = Math.abs(d) < 0.0004 ? target : cur + d * 0.16;
      render();
      if (live && cur !== target) raf = requestAnimationFrame(tick);
    }
    const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };

    if (reduce) { cur = 0; render(); return; }

    const io = new IntersectionObserver((es) => {
      live = es[0].isIntersecting;
      if (live) { cur = progress(); render(); kick(); }
    }, { rootMargin: '20% 0px' });
    io.observe(root);
    window.addEventListener('scroll', () => { if (live) kick(); }, { passive: true });
    window.addEventListener('resize', () => { render(); kick(); });
    cur = target = progress();
    render();
  }
})();
