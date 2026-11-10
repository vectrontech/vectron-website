/* Vectron Technologies: homepage behaviour (2026-11 refresh).
   Menu, section tracking in the nav, reveal on scroll, deep links into the
   publication groups, and the live array-factor plot. No dependencies. */
(() => {
  const doc = document.documentElement;
  doc.classList.add('js');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Menu ---------- */
  const menu = document.querySelector('.vx-menu');
  const nav = document.querySelector('.vx-nav');
  if (menu && nav) {
    nav.addEventListener('click', (event) => {
      if (event.target.closest('a')) menu.open = false;
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && menu.open) {
        menu.open = false;
        menu.querySelector('summary')?.focus();
      }
    });
    window.matchMedia('(min-width: 1180px)').addEventListener('change', () => { menu.open = false; });
  }

  /* ---------- Current section in the nav ---------- */
  const links = new Map();
  document.querySelectorAll('.vx-nav a[href^="#"]').forEach((link) => {
    const section = document.getElementById(link.getAttribute('href').slice(1));
    if (section) links.set(section, link);
  });
  if (links.size && 'IntersectionObserver' in window) {
    // Watch every section, so the marker clears over ones that have no nav link.
    const spy = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        links.forEach((link) => link.removeAttribute('aria-current'));
        links.get(entry.target)?.setAttribute('aria-current', 'true');
      }
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('main > section').forEach((section) => spy.observe(section));
  }

  /* ---------- Reveal on scroll ---------- */
  const reveals = document.querySelectorAll('.rv');
  if (reveals.length && 'IntersectionObserver' in window && !reducedMotion.matches) {
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('is-in'));
  }

  /* ---------- Deep links open the publication group they point into ---------- */
  function openHashTarget() {
    if (location.hash.length < 2) return;
    let target = null;
    try { target = document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch { return; }
    const group = target?.closest('details');
    if (group && !group.open) {
      group.open = true;
      target.scrollIntoView();
    }
  }
  window.addEventListener('hashchange', openHashTarget);
  openHashTarget();

  /* ---------- Live array factor ----------
     Uniform linear array of N isotropic elements at half-wavelength spacing:
       AF(theta) = sin(N psi / 2) / (N sin(psi / 2)),  psi = pi (sin theta - sin theta0)
     Plotted in dB on a half-plane polar grid with a -40 dB floor. */
  const af = document.querySelector('[data-af]');
  if (af) {
    const CX = 260, CY = 262, R = 240, FLOOR = -40, STEP = 0.25, MAX_STEER = 60;
    const stage = af.querySelector('.af-stage');
    const svg = af.querySelector('svg');
    const path = af.querySelector('[data-af-path]');
    const fill = af.querySelector('[data-af-fill]');
    const beam = af.querySelector('[data-af-beam]');
    const beamDot = af.querySelector('[data-af-beam-dot]');
    const elements = af.querySelector('[data-af-elements]');
    const outN = af.querySelector('[data-af-n]');
    const outSteer = af.querySelector('[data-af-steer]');
    const outHpbw = af.querySelector('[data-af-hpbw]');
    const outSll = af.querySelector('[data-af-sll]');
    const buttons = af.querySelectorAll('.af-n button');
    const samples = Math.round(180 / STEP) + 1;
    const db = new Float32Array(samples);
    const rad = Math.PI / 180;

    let n = 16;
    let steer = 20;
    let target = 20;
    let auto = !reducedMotion.matches;
    let inView = false;
    let frame = 0;
    let idleTimer = 0;

    const fmt = (value, digits = 1) => `${value < 0 ? '−' : value > 0 ? '+' : ''}${Math.abs(value).toFixed(digits)}`;

    function pattern(thetaDeg) {
      const psi = Math.PI * (Math.sin(thetaDeg * rad) - Math.sin(steer * rad));
      const denominator = Math.sin(psi / 2);
      if (Math.abs(denominator) < 1e-9) return 1;
      return Math.abs(Math.sin(n * psi / 2) / (n * denominator));
    }

    function drawElements() {
      const shown = Math.min(n, 32);
      const pitch = Math.min(12, 300 / shown);
      let markup = '';
      for (let i = 0; i < shown; i++) {
        const x = CX + (i - (shown - 1) / 2) * pitch;
        markup += `<rect class="af-el" x="${(x - 1.5).toFixed(1)}" y="${CY + 7}" width="3" height="7"/>`;
      }
      elements.innerHTML = markup;
    }

    function draw() {
      let d = '';
      for (let i = 0; i < samples; i++) {
        const theta = -90 + i * STEP;
        const level = Math.max(FLOOR, 20 * Math.log10(Math.max(pattern(theta), 1e-6)));
        db[i] = level;
        const r = R * (level - FLOOR) / -FLOOR;
        const x = CX + r * Math.sin(theta * rad);
        const y = CY - r * Math.cos(theta * rad);
        d += `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
      }
      path.setAttribute('d', d);
      fill.setAttribute('d', `${d}L${CX} ${CY}Z`);

      const bx = CX + R * Math.sin(steer * rad);
      const by = CY - R * Math.cos(steer * rad);
      beam.setAttribute('x2', bx.toFixed(1));
      beam.setAttribute('y2', by.toFixed(1));
      beamDot.setAttribute('cx', bx.toFixed(1));
      beamDot.setAttribute('cy', by.toFixed(1));

      // Half-power beamwidth: walk out from the peak to the -3.01 dB crossings.
      const peak = Math.round((steer + 90) / STEP);
      const half = -3.0103;
      const crossing = (dir) => {
        let i = peak;
        while (i + dir >= 0 && i + dir < samples && db[i + dir] > half) i += dir;
        const j = i + dir;
        if (j < 0 || j >= samples) return -90 + i * STEP;
        const t = (db[i] - half) / (db[i] - db[j] || 1);
        return -90 + (i + dir * t) * STEP;
      };
      const hpbw = crossing(1) - crossing(-1);

      // Peak sidelobe: highest level outside the main lobe's first nulls.
      const firstNull = (dir) => {
        let i = peak;
        while (i + dir >= 0 && i + dir < samples && db[i + dir] <= db[i]) i += dir;
        return i;
      };
      const left = firstNull(-1);
      const right = firstNull(1);
      let sll = FLOOR;
      for (let i = 0; i < samples; i++) if ((i < left || i > right) && db[i] > sll) sll = db[i];

      outSteer.textContent = `${fmt(steer)}°`;
      outHpbw.textContent = `${hpbw.toFixed(1)}°`;
      outSll.textContent = `${fmt(sll)} dB`;
      stage.setAttribute('aria-valuenow', steer.toFixed(0));
      stage.setAttribute('aria-valuetext', `${steer.toFixed(0)} degrees`);
    }

    function tick(time) {
      frame = 0;
      if (auto) target = 34 * Math.sin(time * 0.00032);
      const delta = target - steer;
      steer = Math.abs(delta) < 0.02 ? target : steer + delta * 0.14;
      draw();
      if (inView && !document.hidden && (auto || steer !== target)) request();
    }
    function request() {
      if (!frame) frame = requestAnimationFrame(tick);
    }
    function hold() {
      auto = false;
      clearTimeout(idleTimer);
      if (!reducedMotion.matches) idleTimer = setTimeout(() => { auto = true; request(); }, 4500);
    }
    function steerTo(value) {
      target = Math.max(-MAX_STEER, Math.min(MAX_STEER, value));
      hold();
      if (reducedMotion.matches) { steer = target; draw(); } else request();
    }

    stage.addEventListener('pointermove', (event) => {
      const bounds = svg.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width * 2 - 1;
      steerTo(x * MAX_STEER * 1.08);
    }, { passive: true });
    stage.addEventListener('keydown', (event) => {
      const step = { ArrowLeft: -2, ArrowDown: -2, ArrowRight: 2, ArrowUp: 2, PageDown: -10, PageUp: 10 }[event.key];
      if (event.key === 'Home') { event.preventDefault(); steerTo(0); return; }
      if (!step) return;
      event.preventDefault();
      steerTo(Math.round(target) + step);
    });
    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        n = Number(button.dataset.n);
        buttons.forEach((other) => other.setAttribute('aria-pressed', String(other === button)));
        outN.textContent = String(n);
        drawElements();
        draw();
        request();
      });
    });
    reducedMotion.addEventListener('change', () => { auto = !reducedMotion.matches; request(); });
    document.addEventListener('visibilitychange', request);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; if (inView) request(); }).observe(af);
    } else {
      inView = true;
    }

    drawElements();
    draw();
    request();
  }
})();
