import { env, lockScroll } from './env.js';

const { ScrollTrigger } = window;

export function initNav() {
  const nav = document.querySelector('[data-nav]');
  const toggle = nav.querySelector('.nav__toggle');
  const menu = document.getElementById('menu');

  // hide on scroll down, reveal on scroll up; a jump always lands with the nav showing
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate(self) {
      const hide = !env.jumping && self.direction === 1 && self.scroll() > window.innerHeight * 0.6;
      if (!document.documentElement.classList.contains('menu-open')) nav.classList.toggle('is-hidden', hide);
    },
  });

  // active link per section
  nav.querySelectorAll('.nav__links a[href^="#"]:not(.btn)').forEach((link) => {
    const section = document.querySelector(link.getAttribute('href'));
    if (!section) return;
    ScrollTrigger.create({
      trigger: section,
      start: 'top 55%',
      end: 'bottom 55%',
      onToggle: (self) => link.classList.toggle('is-active', self.isActive),
    });
  });

  // mobile menu — circle reveal from the toggle
  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    document.documentElement.classList.toggle('menu-open', open);
    if (open) {
      menu.hidden = false;
      void menu.offsetWidth; // commit the closed clip-path so the reveal transition runs
      requestAnimationFrame(() => menu.classList.add('is-open'));
      lockScroll('menu', true);
    } else {
      menu.classList.remove('is-open');
      menu.addEventListener('transitionend', () => { if (!menu.classList.contains('is-open')) menu.hidden = true; }, { once: true });
      lockScroll('menu', false);
    }
  };
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) setOpen(false); });
}
