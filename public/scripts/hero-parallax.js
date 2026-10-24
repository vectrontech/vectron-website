(() => {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  const stage = hero.querySelector('.hero-stage');
  const landscape = hero.querySelector('.hero-landscape');
  const aircraft = hero.querySelector('.hero-aircraft');
  const atmosphere = hero.querySelector('.hero-atmosphere');
  const content = hero.querySelector('.hero-content');
  const progressBar = hero.querySelector('.hero-progress span');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const mobile = window.matchMedia('(max-width: 767px)');
  const header = document.querySelector('.site-header');
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  let frame = 0;
  let visible = true;
  let headerHeight = 64;
  let stageHeight = 0;
  let targetX = 0;
  let targetY = 0;
  let pointerX = 0;
  let pointerY = 0;

  function requestRender() {
    if (!frame && visible && !document.hidden && !reducedMotion.matches) {
      frame = requestAnimationFrame(render);
    }
  }

  function render() {
    frame = 0;
    if (reducedMotion.matches || !visible || document.hidden) return;

    // Read layout once, then move the layers with compositor transforms only.
    const bounds = hero.getBoundingClientRect();
    const travel = Math.max(1, bounds.height - stageHeight);
    const progress = clamp((headerHeight - bounds.top) / travel, 0, 1);
    pointerX += (targetX - pointerX) * 0.075;
    pointerY += (targetY - pointerY) * 0.075;
    const x = pointerX;
    const y = pointerY;
    const small = mobile.matches;
    const flight = 1 - Math.pow(1 - progress, 1.35);
    const sweep = bounds.width * (small ? 0.6 : 0.5);
    const bank = Math.sin(flight * Math.PI);

    // Keep altitude and camera depth steady so the flyby reads left to right.
    // A slight dip and shallow bank add depth without climbing out of frame.
    landscape.style.transform = `translate3d(${-flight * Math.min(bounds.width * 0.045, 90) - x * 24}px, ${-y * 12}px, 0) scale(${1.02 + flight * 0.1})`;
    aircraft.style.transform = `translate3d(${flight * sweep + x * 150}px, ${bank * (small ? 6 : 12) + y * 12}px, 80px) rotateX(${-y * 3}deg) rotateY(${-flight * 3 + x * 6}deg) rotateZ(${bank * 2 + x * 2}deg) scale(${1 + flight * 0.04})`;
    atmosphere.style.transform = `translate3d(${-flight * 32 + x * 32}px, ${-y * 8}px, 0) scale(${1 + flight * 0.08})`;
    content.style.transform = `translate3d(0, ${flight * -18}px, 0)`;
    progressBar.style.transform = `scaleX(${progress})`;

    // No permanent animation loop: stop when the pointer has settled.
    if (Math.abs(targetX - x) > 0.001 || Math.abs(targetY - y) > 0.001) requestRender();
  }

  function measure() {
    headerHeight = header?.getBoundingClientRect().height || 64;
    stageHeight = stage.getBoundingClientRect().height;
    hero.style.setProperty('--hero-stage-height', `${stageHeight}px`);
    requestRender();
  }

  function resetPointer() {
    targetX = 0;
    targetY = 0;
    requestRender();
  }

  function setMotionPreference() {
    cancelAnimationFrame(frame);
    frame = 0;
    targetX = targetY = pointerX = pointerY = 0;
    hero.classList.toggle('hero--motion', !reducedMotion.matches);
    for (const layer of [landscape, aircraft, atmosphere, content, progressBar]) {
      layer.style.removeProperty('transform');
    }
    measure();
  }

  stage.addEventListener('pointermove', (event) => {
    if (!finePointer.matches || reducedMotion.matches || event.pointerType === 'touch') return;
    const bounds = stage.getBoundingClientRect();
    targetX = clamp((event.clientX - bounds.left) / bounds.width * 2 - 1, -1, 1);
    targetY = clamp((event.clientY - bounds.top) / bounds.height * 2 - 1, -1, 1);
    requestRender();
  }, { passive: true });
  stage.addEventListener('pointerleave', resetPointer);
  window.addEventListener('scroll', requestRender, { passive: true });
  window.addEventListener('resize', measure, { passive: true });
  window.addEventListener('pageshow', measure);
  document.addEventListener('visibilitychange', requestRender);
  reducedMotion.addEventListener('change', setMotionPreference);
  finePointer.addEventListener('change', resetPointer);

  new ResizeObserver(measure).observe(stage);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) requestRender();
    else {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  }).observe(hero);

  setMotionPreference();
})();
