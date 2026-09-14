// WORK — horizontal case track on desktop, stacked on mobile. Each case owns
// a small scroll-driven visual built from its resume bullet points.
import { lerp, range, isKeyboardFocus } from '../core/env.js';

const { gsap, ScrollTrigger } = window;

// small seeded PRNG so the "random" calendar is irregular but identical on every load
function mulberry32(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const visuals = {
  reel(el) {
    const phone = el.querySelector('.phone');
    const beats = [...el.querySelectorAll('.phone__beats span')];
    const bars = [...el.querySelectorAll('.phone__bars i')];
    const tc = el.querySelector('.phone__tc');
    const orb = el.querySelector('.phone__disc');
    const chips = [...el.querySelectorAll('.chip--float')];
    return (p) => {
      phone.style.setProperty('--ry', `${lerp(-32, 22, p)}deg`);
      phone.style.setProperty('--rx', `${lerp(10, -4, p)}deg`);
      const q = range(p, 0.2, 0.68);
      beats.forEach((b, i) => b.classList.toggle('is-on', q > i / 3 + 0.04));
      bars.forEach((b, i) => b.style.setProperty('--fill', range(q, i / 3, (i + 1) / 3)));
      tc.textContent = `00:${String(Math.floor(q * 15)).padStart(2, '0')} / 00:15`;
      orb.style.setProperty('--disc', lerp(0.55, 1.05, q));
      chips.forEach((c, i) => {
        const v = range(p, 0.32 + i * 0.09, 0.42 + i * 0.09);
        c.style.setProperty('--chip', v);
        c.style.translate = `0 ${(1 - v) * 24}px`;
      });
    };
  },

  // Dotin — the photo opens from an inset frame while the image settles, then its notes float in
  photo(el) {
    const fig = el.querySelector('.photo');
    const img = fig.querySelector('img');
    const chips = [...el.querySelectorAll('.chip--float')];
    const ease = gsap.parseEase('power2.out');
    return (p) => {
      // p runs from the photo entering the viewport (0) to sitting centred (1)
      const v = ease(range(p, 0, 0.75));
      const inset = (1 - v) * 16;
      fig.style.clipPath = `inset(${inset}% ${inset}% ${inset}% ${inset}% round 28px)`;
      // drift stays within the 2% overscan the settled 1.04 scale leaves on each edge
      img.style.transform = `translateY(${(0.5 - p) * 3.6}%) scale(${1.24 - v * 0.2})`;
      chips.forEach((c, i) => {
        const k = range(p, 0.5 + i * 0.12, 0.66 + i * 0.12);
        c.style.setProperty('--chip', k);
        c.style.translate = `0 ${(1 - k) * 24}px`;
      });
    };
  },

  // thedigi.verse — scroll fans the deck; tapping a card lifts it to the front
  deck(el) {
    const cards = [...el.querySelectorAll('.deck__card')];
    const ease = gsap.parseEase('power2.inOut');
    const mid = (cards.length - 1) / 2;
    const lift = cards.map(() => ({ v: 0 }));
    let spread = 0;
    let active = -1;

    const render = () => {
      cards.forEach((c, i) => {
        const k = i - mid;
        const stacked = 1 - spread;
        const L = lift[i].v;
        // depth leads the slide to centre, so a lifting card clears its neighbours first
        const Lz = Math.min(1, L * 2);
        const x = lerp(k * 36 * spread, 0, L);
        const y = lerp(Math.abs(k) * 4 * spread - i * 2.5 * stacked, -3, L);
        const z = lerp(-Math.abs(k) * 110 * spread - i * 22 * stacked, 170, Lz);
        const ry = lerp(-k * 22 * spread, 0, L);
        const rz = lerp(k * 2.5 * spread + (i - mid) * 2 * stacked, 0, L);
        c.style.transform =
          `translateX(${x}%) translateY(${y}%) translateZ(${z}px) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${1 + 0.05 * L})`;
      });
    };

    const select = (i) => {
      const next = active === i ? -1 : i;
      active = next;
      cards.forEach((c, j) => {
        const on = j === next;
        gsap.to(lift[j], {
          v: on ? 1 : 0,
          duration: on ? 0.85 : 0.6,
          ease: on ? 'expo.out' : 'power3.out',
          overwrite: true,
          onUpdate: render,
        });
        c.classList.toggle('is-front', on);
        c.setAttribute('aria-pressed', String(on));
      });
    };

    cards.forEach((c, i) => {
      c.addEventListener('click', () => select(i));
      c.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(i); }
      });
    });

    return (p) => { spread = ease(range(p, 0.14, 0.55)); render(); };
  },

  // Dotcom — an irregular month: random days, post types, heights and reveal order
  calendar(el) {
    const grid = el.querySelector('.calendar__grid');
    const rand = mulberry32(0x0c0ffee5);
    const pick = () => {
      const r = rand();
      if (r < 0.56) return 'organic';
      return r < 0.78 ? 'paid' : 'seo';
    };
    const posts = [];
    for (let d = 1; d <= 28; d++) {
      const day = document.createElement('div');
      day.className = 'day';
      day.textContent = String(d);
      if (rand() < 0.6) {
        const post = document.createElement('span');
        post.className = `post post--${pick()}`;
        post.style.setProperty('--h', String(Math.round(30 + rand() * 26)));
        day.append(post);
        posts.push(post);
      }
      grid.append(day);
    }
    // shuffled reveal order (Fisher–Yates on the same seed)
    const order = posts.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    return (p) => {
      const q = range(p, 0.12, 0.62);
      order.forEach((postIndex, rank) => posts[postIndex].style.setProperty('--p', q > rank / posts.length ? 1 : 0));
    };
  },

  site(el) {
    const browser = el.querySelector('.browser');
    const scroller = el.querySelector('.browser__scroll');
    return (p) => {
      scroller.style.setProperty('--p', range(p, 0.2, 0.8));
      browser.style.transform = `rotateX(${lerp(14, 3, p)}deg) rotateY(${lerp(-24, 10, p)}deg)`;
    };
  },

  // closing panel — the sun comes up behind "Your brand?"
  next(el) {
    const sun = el.querySelector('.case__sun');
    const ease = gsap.parseEase('power2.out');
    return (p) => sun.style.setProperty('--rise', ease(p).toFixed(4));
  },
};

export function initWork(lenis) {
  const section = document.querySelector('.work');
  const pin = section.querySelector('.work__pin');
  const track = section.querySelector('.work__track');
  const cases = [...track.querySelectorAll('.case')];
  const hud = section.querySelector('.work__hud');
  const hudCount = hud.querySelector('.work__hud-count b');
  const hudRail = hud.querySelector('.work__rail i');

  // build once, outside matchMedia so DOM isn't duplicated on breakpoint changes
  const updates = new Map();
  cases.forEach((el) => {
    const make = visuals[el.dataset.case];
    if (make) { const fn = make(el); updates.set(el, fn); fn(0); }
  });

  const mm = gsap.matchMedia();
  mm.add({ desktop: '(min-width: 900px)', mobile: '(max-width: 899px)' }, (ctx) => {
    const { desktop } = ctx.conditions;
    let move = null;
    let setHeight = null;
    let onFocus = null;

    if (desktop) {
      const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
      setHeight = () => pin.style.setProperty('--pin-h', `${distance() + window.innerHeight}px`);
      setHeight();
      ScrollTrigger.addEventListener('refreshInit', setHeight);

      // HUD: the rail follows the track, and the number turns over when another case takes the centre
      let shown = 0;
      const syncHud = () => {
        const x = -gsap.getProperty(track, 'x');
        hudRail.style.transform = `scaleX(${distance() ? x / distance() : 0})`;
        const mid = x + window.innerWidth / 2;
        let idx = cases.findIndex((c) => mid < c.offsetLeft + c.offsetWidth);
        if (idx < 0) idx = cases.length - 1;
        const closing = cases[idx].classList.contains('case--next');
        hud.classList.toggle('is-end', closing);
        if (closing || idx === shown) return;
        const dir = idx > shown ? 1 : -1;
        shown = idx;
        hudCount.textContent = String(idx + 1).padStart(2, '0');
        gsap.fromTo(hudCount, { yPercent: 100 * dir }, { yPercent: 0, duration: 0.55, ease: 'expo.out', overwrite: true });
      };

      move = gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        onUpdate: syncHud,
        scrollTrigger: { trigger: pin, start: 'top top', end: 'bottom bottom', scrub: true, invalidateOnRefresh: true },
      });

      // keyboard focus on something inside an off-screen case: bring that case into view
      // (scroll offset from the pin start maps 1:1 to horizontal track travel)
      onFocus = (e) => {
        const c = e.target.closest('.case');
        // a mouse press focuses deck cards too; scrolling then would swallow the click
        if (!c || !isKeyboardFocus(e.target)) return;
        const r = e.target.getBoundingClientRect();
        if (r.left >= 0 && r.right <= window.innerWidth) return;
        const y = move.scrollTrigger.start + Math.min(c.offsetLeft, distance());
        if (lenis) lenis.scrollTo(y, { immediate: true });
        else window.scrollTo(0, y);
      };
      track.addEventListener('focusin', onFocus);
    }

    cases.forEach((el, index) => {
      // Visuals are timed to their own visual block so they play while on screen:
      // from entering the viewport to sitting centred. The first desktop case is
      // already in place when the track pins, so it plays on the vertical approach
      // plus the first stretch of horizontal travel.
      // the element actually drawn (phone, photo, deck, calendar, browser), not its wider column
      const visual = el.querySelector('.case__visual > *') || el;
      let span;
      if (!desktop) span = { trigger: visual, start: 'top 95%', end: 'center 50%' };
      else if (index === 0) span = { trigger: pin, start: 'top 80%', end: () => `+=${window.innerHeight * 0.8 + el.offsetWidth * 0.3}` };
      else span = { trigger: visual, containerAnimation: move, start: 'left 100%', end: 'center 50%' };

      // --vp swells the sun behind the visual on the same timing
      const box = el.querySelector('.case__visual');
      const fn = updates.get(el);
      if (fn) {
        ScrollTrigger.create({
          ...span,
          onUpdate: (self) => { fn(self.progress); box?.style.setProperty('--vp', self.progress.toFixed(3)); },
        });
      }

      // the big case number drifts against its panel as the panel passes
      const num = el.querySelector('.case__num');
      if (num) {
        let drift;
        if (!desktop) drift = { trigger: el, start: 'top bottom', end: 'bottom top' };
        else if (index === 0) drift = { trigger: pin, start: 'top bottom', end: () => `+=${window.innerHeight + el.offsetWidth}` };
        else drift = { trigger: el, containerAnimation: move, start: 'left right', end: 'right left' };
        ScrollTrigger.create({
          ...drift,
          onUpdate: (self) => {
            const d = 0.5 - self.progress;
            num.style.translate = desktop ? `${d * 10}vw 0` : `0 ${d * 10}svh`;
          },
        });
      }

      // (not the number or the sun: GSAP folds a CSS translate into its own transform, which would
      // freeze their scroll-driven translate)
      const copy = el.querySelectorAll('.case__copy > *, :scope > *:not(.case__copy):not(.case__visual):not(.case__num):not(.case__sun)');
      let reveal;
      if (!desktop) reveal = { trigger: el, start: 'top 78%' };
      else if (index === 0) reveal = { trigger: pin, start: 'top 75%' };
      else reveal = { trigger: el, containerAnimation: move, start: 'left 70%' };
      // opacity, not autoAlpha: links waiting to be revealed must stay in the Tab order
      gsap.from(copy, {
        y: 40, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: 0.06,
        scrollTrigger: { ...reveal, once: true },
      });
    });

    return () => {
      if (setHeight) ScrollTrigger.removeEventListener('refreshInit', setHeight);
      if (onFocus) track.removeEventListener('focusin', onFocus);
      pin.style.removeProperty('--pin-h');
    };
  });
}
