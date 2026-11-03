(() => {
  const root = document.documentElement;
  const header = document.querySelector('.site-header');
  const progress = document.querySelector('.progress');
  const toggle = document.querySelector('.nav__toggle, .menu-btn');
  const links = document.getElementById('nav-links');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Keep --header-h in sync with the real header height (sub-nav sticks below it) */
  if (header) {
    const syncHeader = () => root.style.setProperty('--header-h', `${header.offsetHeight}px`);
    syncHeader();
    window.addEventListener('resize', syncHeader);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(syncHeader);
  }

  /* Section sub-nav + dot nav (built from [data-section]) with scroll-spy */
  const sections = [...document.querySelectorAll('[data-section]')];
  let spyLinks = [];
  let setActive = () => {};
  if (sections.length > 1) {
    const first = sections[0];
    const subnav = document.createElement('nav');
    subnav.className = 'subnav';
    subnav.setAttribute('aria-label', 'Case study sections');
    subnav.innerHTML = '<div class="container subnav__list"></div>';
    first.after(subnav);
    const dots = document.createElement('nav');
    dots.className = 'dotnav';
    dots.setAttribute('aria-label', 'Section dots');
    document.body.appendChild(dots);
    const list = subnav.firstElementChild;
    sections.forEach((s) => {
      const label = s.dataset.section;
      const tab = document.createElement('a');
      tab.className = 'subnav__link t-label';
      tab.href = `#${s.id}`;
      tab.textContent = label;
      list.appendChild(tab);
      const dot = document.createElement('a');
      dot.href = `#${s.id}`;
      dot.dataset.label = label;
      dot.setAttribute('aria-label', label);
      dots.appendChild(dot);
      spyLinks.push([tab, dot]);
    });
    let current = -1;
    setActive = () => {
      const line = parseFloat(getComputedStyle(root).getPropertyValue('--header-h')) + 49 + 24;
      let idx = 0;
      sections.forEach((s, i) => { if (s.getBoundingClientRect().top <= line) idx = i; });
      if (window.innerHeight + window.scrollY >= root.scrollHeight - 4) idx = sections.length - 1;
      if (idx === current) return;
      current = idx;
      spyLinks.forEach(([tab, dot], i) => {
        tab.classList.toggle('is-active', i === idx);
        dot.classList.toggle('is-active', i === idx);
        if (i === idx) { tab.setAttribute('aria-current', 'true'); } else { tab.removeAttribute('aria-current'); }
      });
      const tab = spyLinks[idx][0];
      list.scrollTo({ left: tab.offsetLeft - list.clientWidth / 2 + tab.offsetWidth / 2, behavior: reduceMotion ? 'auto' : 'smooth' });
    };
  }

  /* Scroll progress + header border (one rAF-throttled listener) */
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const max = root.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      if (progress) progress.style.transform = `scaleX(${ratio})`;
      if (header) header.classList.toggle('is-scrolled', window.scrollY > 8);
      root.classList.toggle('past-hero', window.scrollY > 240);
      setActive();
      ticking = false;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* Reveal on scroll */
  const items = document.querySelectorAll('[data-reveal]');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-visible'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach((el) => io.observe(el));
  }

  /* Home card fan: cards rise into the fan once, then follow the mouse a little (depth per card) */
  const pile = document.querySelector('[data-pile]');
  if (pile) {
    if (reduceMotion) { pile.classList.remove('pre', 'intro'); }
    else {
      requestAnimationFrame(() => requestAnimationFrame(() => pile.classList.remove('pre')));
      setTimeout(() => pile.classList.remove('intro'), root.classList.contains('from-work') ? 3200 : 1600);

      /* Pile = link to the case-study loop: black arrow chip follows the cursor, page slides out on click */
      const chip = document.createElement('div');
      chip.className = 'pile-cursor';
      chip.setAttribute('aria-hidden', 'true');
      chip.innerHTML = '<span>→</span>';
      document.body.appendChild(chip);
      pile.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') chip.classList.add('is-on'); });
      pile.addEventListener('pointerleave', () => chip.classList.remove('is-on'));
      pile.addEventListener('pointermove', (e) => {
        if (e.pointerType !== 'mouse') return;
        chip.style.setProperty('--cx', `${e.clientX}px`);
        chip.style.setProperty('--cy', `${e.clientY}px`);
      });
      let going = false;
      pile.addEventListener('click', (e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0 || going) return;
        e.preventDefault();
        going = true;
        document.body.classList.add('is-leaving');
        setTimeout(() => { window.location.href = pile.href; }, 900);
      });
      window.addEventListener('pageshow', (e) => { if (e.persisted) { going = false; document.body.classList.remove('is-leaving'); } });
      const hero = pile.closest('.home-hero2') || pile;
      let tx = 0, ty = 0, cx = 0, cy = 0, running = false;
      const tick = () => {
        cx += (tx - cx) * 0.08;
        cy += (ty - cy) * 0.08;
        pile.style.setProperty('--mx', cx.toFixed(3));
        pile.style.setProperty('--my', cy.toFixed(3));
        if (Math.abs(tx - cx) > 0.002 || Math.abs(ty - cy) > 0.002) requestAnimationFrame(tick); else running = false;
      };
      const kick = () => { if (!running) { running = true; requestAnimationFrame(tick); } };
      hero.addEventListener('pointermove', (e) => {
        if (e.pointerType !== 'mouse') return;
        const r = hero.getBoundingClientRect();
        tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
        ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
        kick();
      });
      hero.addEventListener('pointerleave', () => { tx = 0; ty = 0; kick(); });
    }
  }

  /* About statement: each word flies in from its own direction and lands as scroll progresses */
  const asm = document.querySelector('[data-assemble]');
  if (asm && !reduceMotion) {
    const textEl = asm.querySelector('[data-assemble-text]');
    const sub = asm.querySelector('[data-assemble-sub]');
    const sticky = asm.querySelector('.assemble__sticky');
    const words = textEl.textContent.trim().split(/\s+/);
    textEl.setAttribute('aria-label', words.join(' '));
    textEl.textContent = '';
    let seed = 7;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const spans = words.map((w, i) => {
      const s = document.createElement('span');
      s.className = 'w';
      s.setAttribute('aria-hidden', 'true');
      s.textContent = w + (i < words.length - 1 ? ' ' : '');
      const a = rnd() * Math.PI * 2;
      s.dataset.dx = String(Math.cos(a));
      s.dataset.dy = String(Math.sin(a));
      s.dataset.r = String((rnd() - 0.5) * 60);
      textEl.appendChild(s);
      return s;
    });
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    const update = () => {
      const r = asm.getBoundingClientRect();
      const span = r.height - sticky.offsetHeight;
      const p = span > 0 ? Math.max(0, Math.min(1, -r.top / span)) : 1;
      const W = window.innerWidth * 0.7, H = window.innerHeight * 0.6;
      spans.forEach((s, i) => {
        const start = (i / spans.length) * 0.4;
        const e = ease(Math.max(0, Math.min(1, (p - start) / 0.4)));
        const k = 1 - e;
        s.style.opacity = String(Math.min(1, e * 1.6));
        s.style.transform = k === 0 ? 'none' : `translate3d(${(s.dataset.dx * W * k).toFixed(1)}px, ${(s.dataset.dy * H * k).toFixed(1)}px, 0) rotate(${(s.dataset.r * k).toFixed(1)}deg)`;
      });
      sub.style.opacity = String(Math.max(0, Math.min(1, (p - 0.75) / 0.2)));
    };
    let busy = false;
    const onAsm = () => { if (busy) return; busy = true; requestAnimationFrame(() => { update(); busy = false; }); };
    window.addEventListener('scroll', onAsm, { passive: true });
    window.addEventListener('resize', onAsm);
    update();
  }

  /* Case-study cards: each card sinks back slightly as the next one slides over it */
  const stack = document.querySelector('[data-stack]');
  if (stack && !reduceMotion) {
    const items = [...stack.querySelectorAll('.stack__item')];
    const upd = () => {
      items.forEach((it, i) => {
        const card = it.firstElementChild;
        const next = items[i + 1];
        if (!next) { card.style.transform = 'none'; return; }
        const stickyTop = parseFloat(getComputedStyle(next).top) || 0;
        const top = next.getBoundingClientRect().top;
        const p = Math.max(0, Math.min(1, (window.innerHeight - top) / (window.innerHeight - stickyTop)));
        card.style.transform = `scale(${(1 - 0.06 * p).toFixed(4)})`;
        card.style.filter = `brightness(${(1 - 0.08 * p).toFixed(3)})`;
      });
    };
    let busy2 = false;
    const onStack = () => { if (busy2) return; busy2 = true; requestAnimationFrame(() => { upd(); busy2 = false; }); };
    window.addEventListener('scroll', onStack, { passive: true });
    window.addEventListener('resize', onStack);
    upd();
  }

  /* Home intro scenes: pinned stage, scroll picks the scene; mouse + scroll parallax on the drifting post-its */
  const scenes = document.querySelector('[data-scenes]');
  if (scenes && !reduceMotion) {
    const words = [...scenes.querySelectorAll('.sword')];
    const caps = [...scenes.querySelectorAll('.scap')];
    const floatLayer = scenes.querySelector('.scenes__float');
    const count = scenes.querySelector('[data-sc-count]');
    const total = words.length;
    let scene = -1, mx = 0, my = 0, cmx = 0, cmy = 0, running = false;
    const apply = () => {
      const r = scenes.getBoundingClientRect();
      const span = r.height - scenes.querySelector('.scenes__sticky').offsetHeight;
      const p = span > 0 ? Math.max(0, Math.min(1, -r.top / span)) : 0;
      scenes.style.setProperty('--p', p.toFixed(3));
      floatLayer.style.setProperty('--sp', p.toFixed(3));
      const next = Math.min(total - 1, Math.floor(p * total));
      if (next !== scene) {
        scene = next;
        scenes.dataset.scene = String(scene);
        words.forEach((w, i) => { w.classList.toggle('is-active', i === scene); w.classList.toggle('is-past', i < scene); });
        caps.forEach((c, i) => c.classList.toggle('is-active', i === scene));
        count.textContent = `${String(scene + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
      }
    };
    const frame = () => {
      cmx += (mx - cmx) * 0.07;
      cmy += (my - cmy) * 0.07;
      floatLayer.style.setProperty('--mx', cmx.toFixed(3));
      floatLayer.style.setProperty('--my', cmy.toFixed(3));
      if (Math.abs(mx - cmx) > 0.002 || Math.abs(my - cmy) > 0.002) requestAnimationFrame(frame); else running = false;
    };
    const kick = () => { if (!running) { running = true; requestAnimationFrame(frame); } };
    scenes.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      mx = (e.clientX / window.innerWidth - 0.5) * 2;
      my = (e.clientY / window.innerHeight - 0.5) * 2;
      kick();
    });
    window.addEventListener('scroll', apply, { passive: true });
    window.addEventListener('resize', apply);
    apply();
  }

  /* 3D project carousel */
  const car = document.querySelector('[data-carousel]');
  if (car) {
    const cards = [...car.querySelectorAll('.ccard')];
    const prev = car.querySelector('[data-prev]');
    const next = car.querySelector('[data-next]');
    const count = car.querySelector('[data-count]');
    const stage = car.querySelector('.carousel__stage');
    let active = 0;
    const pad = (n) => String(n).padStart(2, '0');
    const render = () => {
      cards.forEach((c, i) => {
        const o = i - active;
        c.style.setProperty('--o', o);
        c.style.setProperty('--a', Math.min(Math.abs(o), 2));
        c.classList.toggle('is-active', o === 0);
        c.tabIndex = o === 0 ? 0 : -1;
        c.setAttribute('aria-hidden', o === 0 ? 'false' : 'true');
      });
      prev.disabled = active === 0;
      next.disabled = active === cards.length - 1;
      count.textContent = `${pad(active + 1)} / ${pad(cards.length)}`;
    };
    const go = (i) => { active = Math.max(0, Math.min(cards.length - 1, i)); render(); };
    prev.addEventListener('click', () => go(active - 1));
    next.addEventListener('click', () => go(active + 1));
    cards.forEach((c, i) => c.addEventListener('click', (e) => { if (i !== active) { e.preventDefault(); go(i); } }));
    car.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') go(active - 1);
      if (e.key === 'ArrowRight') go(active + 1);
    });
    let startX = null;
    let dragged = false;
    stage.addEventListener('pointerdown', (e) => { startX = e.clientX; dragged = false; });
    stage.addEventListener('pointermove', (e) => { if (startX !== null && Math.abs(e.clientX - startX) > 8) dragged = true; });
    stage.addEventListener('pointerup', (e) => {
      if (startX === null) return;
      const dx = e.clientX - startX;
      startX = null;
      if (Math.abs(dx) > 50) go(active + (dx < 0 ? 1 : -1));
    });
    stage.addEventListener('pointercancel', () => { startX = null; });
    stage.addEventListener('click', (e) => { if (dragged) { e.preventDefault(); e.stopPropagation(); dragged = false; } }, true);
    stage.addEventListener('dragstart', (e) => e.preventDefault());
    render();

    /* Intro (once per session): cards fly in from depth when the section first scrolls into view */
    let seen = false;
    try { seen = sessionStorage.getItem('carousel-intro') === '1'; } catch (e) { /* storage blocked */ }
    if (!reduceMotion && !seen && 'IntersectionObserver' in window) {
      car.classList.add('will-intro');
      const io = new IntersectionObserver((entries) => {
        if (!entries.some((en) => en.isIntersecting)) return;
        io.disconnect();
        car.classList.remove('will-intro');
        car.classList.add('is-intro');
        try { sessionStorage.setItem('carousel-intro', '1'); } catch (e) { /* ignore */ }
        const skipEvents = ['wheel', 'keydown', 'pointerdown'];
        let done = false;
        const end = () => {
          if (done) return;
          done = true;
          car.classList.remove('is-intro');
          skipEvents.forEach((n) => window.removeEventListener(n, end));
        };
        skipEvents.forEach((n) => window.addEventListener(n, end, { passive: true }));
        setTimeout(end, 1700);
      }, { threshold: 0.4 });
      io.observe(stage);
    }

    /* Depth: pointer tilt (mouse only) + scroll-linked push/tilt of the whole card world */
    const world = car.querySelector('.carousel__world');
    if (world && !reduceMotion) {
      let tx = 0, ty = 0, cx = 0, cy = 0, sd = 0, csd = 0, running = false;
      const frame = () => {
        cx += (tx - cx) * 0.08;
        cy += (ty - cy) * 0.08;
        csd += (sd - csd) * 0.12;
        world.style.setProperty('--ry', `${cx.toFixed(2)}deg`);
        world.style.setProperty('--rx', `${(cy + csd * 6).toFixed(2)}deg`);
        world.style.setProperty('--sz', `${(-Math.abs(csd) * 160).toFixed(1)}px`);
        if (Math.abs(tx - cx) > 0.01 || Math.abs(ty - cy) > 0.01 || Math.abs(sd - csd) > 0.002) requestAnimationFrame(frame);
        else running = false;
      };
      const kick = () => { if (!running) { running = true; requestAnimationFrame(frame); } };
      stage.addEventListener('pointermove', (e) => {
        if (e.pointerType !== 'mouse') return;
        const r = stage.getBoundingClientRect();
        tx = ((e.clientX - r.left) / r.width - 0.5) * 8;
        ty = -((e.clientY - r.top) / r.height - 0.5) * 5;
        kick();
      });
      stage.addEventListener('pointerleave', () => { tx = 0; ty = 0; kick(); });
      const onStageScroll = () => {
        const r = stage.getBoundingClientRect();
        const p = (window.innerHeight - r.top) / (window.innerHeight + r.height);
        sd = Math.max(-1, Math.min(1, (p - 0.5) * 2));
        kick();
      };
      window.addEventListener('scroll', onStageScroll, { passive: true });
      onStageScroll();
    }
  }

  /* Project list: floating hover preview */
  const plist = document.querySelector('[data-plist]');
  if (plist && window.matchMedia('(hover: hover)').matches) {
    const card = document.createElement('div');
    card.className = 'preview';
    card.setAttribute('aria-hidden', 'true');
    card.innerHTML = '<span class="badge t-overline-sm"></span><h3 class="preview__title t-card"></h3><p class="preview__text t-body-sm"></p><ul class="chips preview__tags"></ul><span class="preview__cta t-label"></span>';
    document.body.appendChild(card);
    const q = (s) => card.querySelector(s);
    let tx = 0, ty = 0, x = 0, y = 0, raf = 0, shown = false;
    const place = () => {
      const w = card.offsetWidth, h = card.offsetHeight;
      let px = tx + 28;
      if (px + w > window.innerWidth - 16) px = tx - w - 28;
      const py = Math.max(16, Math.min(window.innerHeight - h - 16, ty - h / 2));
      return [px, py];
    };
    const tick = () => {
      const [px, py] = place();
      x += (px - x) * (reduceMotion ? 1 : 0.18);
      y += (py - y) * (reduceMotion ? 1 : 0.18);
      card.style.transform = `translate(${x}px, ${y}px)`;
      raf = shown ? requestAnimationFrame(tick) : 0;
    };
    const show = (row) => {
      const d = row.dataset;
      q('.badge').textContent = d.previewBadge || '';
      q('.preview__title').textContent = d.previewTitle || '';
      q('.preview__text').textContent = d.previewText || '';
      const tags = q('.preview__tags');
      tags.replaceChildren(...(d.previewTags ? d.previewTags.split(' · ') : []).map((t) => {
        const li = document.createElement('li');
        li.className = 'chip t-chip';
        li.textContent = t;
        return li;
      }));
      const cta = q('.preview__cta');
      cta.textContent = d.previewCta || '';
      cta.hidden = !d.previewCta;
      if (!shown) { const [px, py] = place(); x = px; y = py; }
      shown = true;
      card.classList.add('is-on');
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const hide = () => { shown = false; card.classList.remove('is-on'); };
    plist.addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; });
    plist.querySelectorAll('.plist__row').forEach((row) => {
      row.addEventListener('pointerenter', (e) => { tx = e.clientX; ty = e.clientY; show(row); });
    });
    plist.addEventListener('pointerleave', hide);
    window.addEventListener('scroll', hide, { passive: true });
  }

  /* Mobile menu */
  if (toggle && links) {
    const setOpen = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      links.classList.toggle('is-open', open);
    };
    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
    links.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
    window.matchMedia('(min-width: 721px)').addEventListener('change', () => setOpen(false));
  }
})();
