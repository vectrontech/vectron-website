(() => {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  const stage = hero.querySelector('.hero-stage');
  const landscape = hero.querySelector('.hero-landscape');
  const video = hero.querySelector('.hero-video');
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
  let stickTop = 64;
  let targetX = 0;
  let targetY = 0;
  let pointerX = 0;
  let pointerY = 0;

  function syncVideoPlayback() {
    if (!video) return;
    if (reducedMotion.matches || !visible || document.hidden) {
      video.pause();
      return;
    }
    // Defer the video download until motion is allowed and the hero is visible.
    if (!video.getAttribute('src')) video.src = video.dataset.src;
    video.muted = true;
    video.play().catch(() => {
      // The poster remains visible if the browser blocks autoplay.
    });
  }

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
    // The flight runs from the top of the page until the stage lets go. A stage
    // taller than the screen sticks by its bottom edge (stickTop below the
    // header), so that extra scroll is part of the flight too.
    const travel = Math.max(1, bounds.height - stageHeight + headerHeight - stickTop);
    const progress = clamp((headerHeight - bounds.top) / travel, 0, 1);
    pointerX += (targetX - pointerX) * 0.075;
    pointerY += (targetY - pointerY) * 0.075;
    const x = pointerX;
    const y = pointerY;
    const small = mobile.matches;
    const flight = 1 - Math.pow(1 - progress, 1.35);
    const sweep = bounds.width * (small ? 0.5 : 0.27);
    const bank = Math.sin(flight * Math.PI);
    // The aircraft starts clear of the headline and climbs a little as it
    // leaves, so the lower wing never drops onto the text.
    const climb = flight * (small ? 14 : 34);

    // Keep camera depth steady so the flyby reads left to right, with a shallow bank for depth.
    landscape.style.transform = `translate3d(${-flight * Math.min(bounds.width * 0.045, 90) - x * 24}px, ${-y * 12}px, 0) scale(${1.02 + flight * 0.1})`;
    aircraft.style.transform = `translate3d(${flight * sweep + x * 60}px, ${bank * (small ? 4 : 8) - climb + y * 8}px, 80px) rotateX(${-y * 3}deg) rotateY(${-flight * 3 + x * 5}deg) rotateZ(${bank * 2 + x * 1.5}deg) scale(${1 + flight * 0.04})`;
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
    const top = parseFloat(getComputedStyle(stage).top);
    stickTop = Number.isFinite(top) ? Math.min(top, headerHeight) : headerHeight;
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
    syncVideoPlayback();
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
  document.addEventListener('visibilitychange', () => {
    requestRender();
    syncVideoPlayback();
  });
  reducedMotion.addEventListener('change', setMotionPreference);
  finePointer.addEventListener('change', resetPointer);

  new ResizeObserver(measure).observe(stage);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    // Pauses the tower lights (CSS animation) off screen.
    hero.classList.toggle('is-offscreen', !visible);
    syncVideoPlayback();
    if (visible) requestRender();
    else {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  }).observe(hero);

  setMotionPreference();
})();
