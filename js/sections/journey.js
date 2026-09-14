// JOURNEY — the disc rises along an arc from the horizon (2018) to its zenith (now).
// It glides continuously, easing as it passes each milestone, and the milestone
// copy below swaps one at a time (outgoing lifts away, then incoming rises in).
const { gsap } = window;
const NS = 'http://www.w3.org/2000/svg';

export function initJourney() {
  const section = document.querySelector('.journey');
  const stage = section.querySelector('.journey__stage');
  const svg = stage.querySelector('.journey__sky');
  const arc = stage.querySelector('.journey__arc');
  const sun = stage.querySelector('.journey__sun');
  const glow = stage.querySelector('.journey__glow');
  const ticksG = stage.querySelector('.journey__ticks');
  const items = [...stage.querySelectorAll('.journey__list li')];
  const n = items.length;
  const len = arc.getTotalLength();
  const centre = { x: 500, y: 500 };
  const segmentEase = gsap.parseEase('sine.inOut');

  // milestone dots + labels, placed along the arc with labels just outside it
  const marks = items.map((item, i) => {
    const pt = arc.getPointAtLength((i / (n - 1)) * len);
    const dot = document.createElementNS(NS, 'circle');
    dot.setAttribute('cx', pt.x);
    dot.setAttribute('cy', pt.y);
    dot.setAttribute('r', 5);

    const dx = pt.x - centre.x, dy = pt.y - centre.y, d = Math.hypot(dx, dy) || 1;
    const label = document.createElementNS(NS, 'text');
    label.setAttribute('x', pt.x + (dx / d) * 24);
    label.setAttribute('y', pt.y + (dy / d) * 24 + 4);
    label.setAttribute('text-anchor', dx / d < -0.35 ? 'end' : dx / d > 0.35 ? 'start' : 'middle');
    label.textContent = item.dataset.short || '';

    ticksG.append(dot, label);
    return { dot, label };
  });

  // phones: zoom the viewBox onto the rising quarter so the arc isn't a sliver
  const narrow = window.matchMedia('(max-width: 899px)');
  // (headroom above the arc keeps the NOW label and glow inside the box, clear of the copy above)
  const fitView = () => svg.setAttribute('viewBox', narrow.matches ? '-40 0 600 530' : '0 0 1000 520');
  fitView();
  narrow.addEventListener('change', fitView);

  // milestone copy — never two blocks on screen at once. Opacity only (no visibility),
  // so screen readers still get the whole list while the eye sees one milestone.
  gsap.set(items, { opacity: 0 });
  let current = -1;
  const show = (idx) => {
    if (idx === current) return;
    const dir = idx > current ? 1 : -1;
    // strictly sequential: the incoming block waits until the outgoing one has gone
    const OUT = 0.22;
    items.forEach((item, k) => {
      item.classList.toggle('is-current', k === idx);
      if (k === idx) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
      if (k === idx || k === current) return;
      // anything still mid-fade from a fast scroll is cleared at once
      if (parseFloat(getComputedStyle(item).opacity) > 0) gsap.to(item, { opacity: 0, duration: 0.12, overwrite: true });
    });
    const outgoing = items[current];
    if (outgoing) {
      gsap.to(outgoing, { opacity: 0, y: -16 * dir, duration: OUT, ease: 'power2.in', overwrite: true });
    }
    gsap.fromTo(items[idx],
      { opacity: 0, y: 20 * dir },
      { opacity: 1, y: 0, duration: 0.7, ease: 'expo.out', delay: outgoing ? OUT + 0.04 : 0, overwrite: true });
    marks.forEach((m, k) => {
      m.dot.classList.toggle('is-passed', k <= idx);
      m.label.classList.toggle('is-passed', k < idx);
      m.label.classList.toggle('is-active', k === idx);
    });
    current = idx;
  };

  const J = { p: 0 };
  const apply = () => {
    const seg = J.p * (n - 1);
    const i = Math.min(n - 2, Math.floor(seg));
    const along = (i + segmentEase(seg - i)) / (n - 1); // slows at milestones, never stops
    const pt = arc.getPointAtLength(along * len);
    sun.setAttribute('cx', pt.x);
    sun.setAttribute('cy', pt.y);
    glow.setAttribute('cx', pt.x);
    glow.setAttribute('cy', pt.y);
    arc.style.strokeDashoffset = String(1 - along);
    stage.style.setProperty('--dawn', along.toFixed(3));
    show(Math.round(along * (n - 1)));
  };
  apply();

  gsap.to(J, {
    p: 1, ease: 'none', onUpdate: apply,
    scrollTrigger: {
      trigger: section, start: 'top top', end: 'bottom bottom', scrub: 1,
      // a refresh renders the tween silently (and a breakpoint change can leave it paused
      // out of step), so line the sun and copy back up with the scroll position
      onRefresh: (self) => { self.animation?.progress(self.progress); apply(); },
    },
  });

  gsap.from(stage.querySelector('.journey__head'), {
    y: 40, autoAlpha: 0, duration: 1.2, ease: 'expo.out',
    scrollTrigger: { trigger: section, start: 'top 70%', once: true },
  });
}
