const easeInOutCubic = (progress) =>
  progress < 0.5
    ? 4 * progress * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 3) / 2;

let activeScrollFrame = null;

export const smoothScrollTo = (targetTop, { duration = 650 } = {}) => {
  if (typeof window === 'undefined') return;

  if (activeScrollFrame) {
    window.cancelAnimationFrame(activeScrollFrame);
    activeScrollFrame = null;
  }

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches;

  if (prefersReducedMotion) {
    window.scrollTo({ top: targetTop, left: 0, behavior: 'auto' });
    return;
  }

  const startTop = window.scrollY;
  const distance = targetTop - startTop;
  const startTime = performance.now();

  const animate = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easeInOutCubic(progress);

    window.scrollTo(0, startTop + distance * easedProgress);

    if (progress < 1) {
      activeScrollFrame = window.requestAnimationFrame(animate);
    } else {
      activeScrollFrame = null;
    }
  };

  activeScrollFrame = window.requestAnimationFrame(animate);
};

export const smoothScrollToElement = (
  element,
  { offset = 80, duration = 650 } = {},
) => {
  if (!element) return;

  const targetTop = Math.max(
    window.scrollY + element.getBoundingClientRect().top - offset,
    0,
  );
  smoothScrollTo(targetTop, { duration });
};
