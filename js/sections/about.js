// ABOUT — the hero's saffron flood becomes a manifesto page, then contracts
// into a two-sided coin that flips from Content Creator to Brand Presenter.
import { env, lerp, requestSaffronNav, isKeyboardFocus } from '../core/env.js';

const { gsap, ScrollTrigger, SplitText } = window;

export function initAbout(lenis) {
  const section = document.querySelector('.about');
  const stage = section.querySelector('.about__stage');
  const field = stage.querySelector('.about__field');
  const manifesto = stage.querySelector('.about__manifesto');
  const statement = stage.querySelector('.about__statement');
  const ctaWrap = stage.querySelector('.about__cta');
  const cta = ctaWrap.querySelectorAll('.btn');
  const roles = stage.querySelector('.roles');
  const coinCanvas = roles.querySelector('.roles__coin');
  const titleWords = roles.querySelectorAll('.roles__title span');
  const creator = roles.querySelector('[data-side="creator"]');
  const presenter = roles.querySelector('[data-side="presenter"]');

  const S = { field: 0, coinIn: 0, flip: 0, px: 0, py: 0 };
  const G = { W: 1, H: 1, cx: 0, cy: 0, cr: 0 };
  const pointer = { x: 0, y: 0 };

  const measure = () => {
    const s = stage.getBoundingClientRect();
    const c = coinCanvas.getBoundingClientRect();
    Object.assign(G, {
      W: s.width, H: s.height,
      cx: c.left - s.left + c.width / 2,
      cy: c.top - s.top + c.height / 2,
      cr: c.width * 0.35,
    });
  };
  measure();
  ScrollTrigger.addEventListener('refreshInit', measure);

  // ---- coin (optional WebGL)
  let coin = null;
  import('../three/coin.js')
    .then(({ createCoin }) => {
      coin = createCoin(coinCanvas, { lowPower: env.mobile });
      const fit = () => { const r = coinCanvas.getBoundingClientRect(); coin.resize(r.width, r.height); };
      fit();
      new ResizeObserver(fit).observe(coinCanvas);
    })
    .catch((err) => console.warn('[about] coin unavailable', err));

  // ---- manifesto words
  const split = SplitText.create(statement, { type: 'words' });
  gsap.set(split.words, { opacity: 0.13 });

  if (env.finePointer) {
    window.addEventListener('pointermove', (e) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });
  }

  // the CTA buttons are revealed between 0.24 and 0.31 and fade with the manifesto from 0.38 to 0.45
  const CTA_SHOWN = 0.34;
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    // buttons take clicks only while they're drawn: rendered progress, so scrub lag counts
    onUpdate() {
      const p = this.progress();
      ctaWrap.classList.toggle('is-live', p >= 0.265 && p < 0.445);
    },
    scrollTrigger: { trigger: section, start: 'top top', end: 'bottom bottom', scrub: 0.6 },
  })
    .to(split.words, { opacity: 1, duration: 0.02, stagger: { amount: 0.28 } }, 0.02)
    .from(cta, { yPercent: 60, opacity: 0, duration: 0.05, stagger: 0.02 }, 0.24)
    // opacity, not autoAlpha: hidden buttons stay in the Tab order (.is-live blocks clicks)
    .to(manifesto, { yPercent: -12, opacity: 0, duration: 0.07, ease: 'power1.in' }, 0.38)
    .to(S, { field: 1, duration: 0.12, ease: 'power3.inOut' }, 0.43)
    .fromTo(roles, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.02 }, 0.5)
    .from(titleWords, { yPercent: 80, opacity: 0, duration: 0.05, stagger: 0.015 }, 0.5)
    .to(S, { coinIn: 1, duration: 0.04 }, 0.53)
    .to(field, { opacity: 0, duration: 0.04 }, 0.565)
    .from([creator, presenter], { y: 30, opacity: 0, duration: 0.06, stagger: 0.02 }, 0.56)
    .to(S, { flip: 1, duration: 0.3, ease: 'power2.inOut' }, 0.66)
    .to({}, { duration: 0.04 });

  // ink-on-saffron nav while the saffron field fills the screen. Starts 1px before the
  // hero scene ends, so the hand-over never leaves a position where neither claims it.
  ScrollTrigger.create({
    trigger: section,
    start: 'top bottom+=1',
    end: () => { const st = tl.scrollTrigger; return st.start + (st.end - st.start) * 0.47; },
    onToggle: (self) => requestSaffronNav('about', self.isActive),
  });

  // keyboard users tabbing onto a hidden button are scrolled to where it is revealed
  ctaWrap.addEventListener('focusin', (e) => {
    const st = tl.scrollTrigger;
    if (!st || !isKeyboardFocus(e.target)) return;
    const p = tl.progress();
    if (p >= 0.31 && p <= 0.37) return;
    const y = st.start + (st.end - st.start) * CTA_SHOWN;
    if (lenis) lenis.scrollTo(y, { immediate: true });
    else window.scrollTo(0, y);
  });

  // ---- render loop (only while on screen)
  let active = false;
  ScrollTrigger.create({ trigger: section, start: 'top bottom', end: 'bottom top', onToggle: (self) => { active = self.isActive; } });

  gsap.ticker.add((time) => {
    if (!active) return;
    S.px += (pointer.x - S.px) * 0.05;
    S.py += (pointer.y - S.py) * 0.05;

    const k = S.field;
    const cover = Math.hypot(G.W, G.H) / 2 + 20;
    const r = lerp(cover, G.cr, k);
    const x = lerp(G.W / 2, G.cx, k);
    const y = lerp(G.H / 2, G.cy, k);
    field.style.clipPath = `circle(${r}px at ${x}px ${y}px)`;

    coinCanvas.style.opacity = String(S.coinIn);
    if (coin && S.coinIn > 0.001) coin.render({ flip: S.flip, time, px: S.px, py: S.py });

    const onB = S.flip > 0.5;
    creator.classList.toggle('is-dim', onB);
    presenter.classList.toggle('is-dim', !onB);
  });
}
