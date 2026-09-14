// PRESENTER — a saffron spotlight finds the headline (cursor on desktop,
// drifting on touch), the teleprompter advances with scroll, then the house
// lights come up.
import { env, lerp, range, smooth } from '../core/env.js';

const { gsap, ScrollTrigger } = window;

export function initPresenter() {
  const section = document.querySelector('.presenter');
  const pin = section.querySelector('.presenter__pin');
  const stage = section.querySelector('.presenter__stage');
  const title = stage.querySelector('.presenter__title');
  const list = stage.querySelector('.prompter__lines');
  const lines = [...list.children];

  const spot = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
  const box = { l: 0, t: 0, w: 1, h: 1 };
  let progress = 0;
  let active = false;
  let usingPointer = false;
  let lastIdx = -1;

  const measure = () => {
    const s = stage.getBoundingClientRect();
    const t = title.getBoundingClientRect();
    Object.assign(box, { l: t.left - s.left, t: t.top - s.top, w: t.width, h: t.height });
  };
  measure();
  ScrollTrigger.addEventListener('refresh', measure);
  new ResizeObserver(measure).observe(title);

  if (env.finePointer) {
    stage.addEventListener('pointermove', (e) => {
      const s = stage.getBoundingClientRect();
      spot.tx = (e.clientX - s.left - box.l) / box.w;
      spot.ty = (e.clientY - s.top - box.t) / box.h;
      usingPointer = true;
    });
    stage.addEventListener('pointerleave', () => { usingPointer = false; });
  }

  ScrollTrigger.create({
    trigger: pin, start: 'top top', end: 'bottom bottom',
    onUpdate: (self) => { progress = self.progress; },
  });
  ScrollTrigger.create({
    trigger: pin, start: 'top bottom', end: 'bottom top',
    onToggle: (self) => { active = self.isActive; if (active) measure(); },
  });

  gsap.ticker.add((time) => {
    if (!active) return;
    if (!usingPointer) {
      spot.tx = 0.5 + Math.sin(time * 0.55) * 0.34;
      spot.ty = 0.5 + Math.sin(time * 1.05) * 0.24;
    }
    spot.x += (spot.tx - spot.x) * 0.08;
    spot.y += (spot.ty - spot.y) * 0.08;

    const lights = smooth(progress, 0.7, 0.9);
    const base = Math.max(box.h * 0.36, 140);
    const r = lerp(base, Math.hypot(box.w, box.h) * 1.1, lights);
    const sx = lerp(spot.x * box.w, box.w / 2, lights);
    const sy = lerp(spot.y * box.h, box.h / 2, lights);
    title.style.setProperty('--sx', `${sx}px`);
    title.style.setProperty('--sy', `${sy}px`);
    title.style.setProperty('--sr', `${r}px`);
    stage.style.setProperty('--gx', `${box.l + sx}px`);
    stage.style.setProperty('--gy', `${box.t + sy}px`);
    stage.style.setProperty('--lights', lights);

    const idx = Math.min(lines.length - 1, Math.floor(range(progress, 0.04, 0.86) * lines.length));
    if (idx !== lastIdx) {
      lastIdx = idx;
      lines.forEach((l, i) => l.classList.toggle('is-on', i === idx));
      list.style.setProperty('--prompt-y', `${(1 - idx) * 1.8}em`);
    }
  });

  gsap.from(stage.querySelectorAll('.viewfinder i'), {
    scale: 1.8, autoAlpha: 0, duration: 1.2, ease: 'expo.out', stagger: 0.05,
    scrollTrigger: { trigger: pin, start: 'top 60%', once: true },
  });
}
