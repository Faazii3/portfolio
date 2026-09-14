// TOOLKIT — two marquee rows that drift on their own, react to scroll velocity,
// and can be grabbed and flung (mouse or touch; vertical swipes still scroll).
import { env } from '../core/env.js';

const { gsap, ScrollTrigger } = window;

export function initToolkit() {
  const marquee = document.querySelector('.marquee');
  if (!marquee) return;

  const rows = [...marquee.querySelectorAll('.marquee__row')].map((row) => {
    // seamless loop: append a copy that assistive tech skips
    [...row.children].forEach((item) => {
      const clone = item.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      row.append(clone);
    });
    return { row, x: 0, dir: Number(row.dataset.dir) || 1, half: 0 };
  });
  const measure = () => rows.forEach((r) => { r.half = r.row.scrollWidth / 2; });
  measure();
  ScrollTrigger.addEventListener('refresh', measure);

  let velocity = 0;
  let active = false;
  ScrollTrigger.create({
    trigger: marquee, start: 'top bottom', end: 'bottom top',
    onToggle: (self) => { active = self.isActive; },
    // a jump is not a fling: it would read as thousands of px/s
    onUpdate: (self) => { velocity = env.jumping ? 0 : self.getVelocity(); },
  });

  // ---- drag / fling
  let drag = null;   // { id, x, t }
  let fling = 0;     // px per second, decays after release
  marquee.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    drag = { id: e.pointerId, x: e.clientX, t: e.timeStamp };
    fling = 0;
    marquee.setPointerCapture(e.pointerId);
    marquee.classList.add('is-dragging');
  });
  marquee.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x;
    const dt = Math.max(1, e.timeStamp - drag.t);
    rows.forEach((r) => { r.x += dx; });
    fling = fling * 0.6 + (dx / dt) * 1000 * 0.4;
    drag.x = e.clientX;
    drag.t = e.timeStamp;
  });
  const release = (e) => {
    if (!drag || (e && e.pointerId !== drag.id)) return;
    // only fling if the pointer was still moving when it let go
    if (!e || e.type !== 'pointerup' || e.timeStamp - drag.t > 80) fling = 0;
    fling = gsap.utils.clamp(-4000, 4000, fling);
    drag = null;
    marquee.classList.remove('is-dragging');
  };
  marquee.addEventListener('pointerup', release);
  marquee.addEventListener('pointercancel', release);
  marquee.addEventListener('lostpointercapture', release);
  marquee.addEventListener('dragstart', (e) => e.preventDefault());

  gsap.ticker.add((time, deltaMs) => {
    if (!active && !drag) return;
    const dt = Math.min(deltaMs, 50) / 1000;
    velocity *= 0.9;
    const v = gsap.utils.clamp(-4000, 4000, velocity);
    const speed = (env.reduced ? 0 : 70) + Math.abs(v) * 0.18;
    const heading = v < -50 ? -1 : 1;
    const skew = env.reduced || drag ? 0 : gsap.utils.clamp(-10, 10, -v * 0.004);
    if (!drag) fling *= Math.pow(0.02, dt); // ~98% of the fling gone after a second

    rows.forEach((r) => {
      if (!r.half) return;
      if (!drag) r.x += fling * dt - r.dir * heading * speed * dt;
      r.x = gsap.utils.wrap(-r.half, 0, r.x);
      r.row.style.transform = `translate3d(${r.x}px,0,0) skewX(${skew}deg)`;
    });
  });
}
