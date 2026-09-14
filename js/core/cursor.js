import { env } from './env.js';

const { gsap } = window;

export function initCursor() {
  if (!env.finePointer || env.reduced) return;

  const cursor = document.querySelector('.cursor');
  const label = cursor.querySelector('.cursor__label');
  const xTo = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3' });
  const yTo = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3' });
  let shown = false;

  window.addEventListener('pointermove', (e) => {
    if (!shown) {
      shown = true;
      gsap.set(cursor, { x: e.clientX, y: e.clientY });
      document.documentElement.classList.add('has-cursor');
    }
    xTo(e.clientX);
    yTo(e.clientY);
  }, { passive: true });

  document.addEventListener('pointerover', (e) => {
    const labelled = e.target.closest('[data-cursor]');
    const interactive = e.target.closest('a, button, [role="button"]');
    cursor.classList.toggle('is-label', Boolean(labelled));
    cursor.classList.toggle('is-hover', Boolean(interactive) && !labelled);
    label.textContent = labelled ? labelled.dataset.cursor : '';
  });
  document.documentElement.addEventListener('pointerleave', () => gsap.to(cursor, { autoAlpha: 0, duration: 0.2 }));
  document.documentElement.addEventListener('pointerenter', () => gsap.to(cursor, { autoAlpha: 1, duration: 0.2 }));

  // magnetic buttons
  document.querySelectorAll('[data-magnetic]').forEach((el) => {
    const mx = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3' });
    const my = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      mx((e.clientX - r.left - r.width / 2) * 0.28);
      my((e.clientY - r.top - r.height / 2) * 0.35);
    });
    el.addEventListener('pointerleave', () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.4)' });
    });
  });
}
