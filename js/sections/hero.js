// HERO — eclipse layers + ambient halo orbit.
// All animation writes normalised channels on `S`; render() turns them into px
// from the current layout every frame, so resizes mid-scroll stay correct.
import { env, lerp, smooth, requestSaffronNav } from '../core/env.js';
import { orbitCards } from '../data/content.js';

const { gsap, ScrollTrigger, SplitText } = window;

// portrait frame + disc geometry measured by tools/make-cutout.ps1
const IMG_W = 896, IMG_H = 937;
const DISC_CX = 0.4971, DISC_CY = 0.5235, DISC_D = 0.73;

export async function initHero() {
  const hero = document.querySelector('.hero');
  const stage = hero.querySelector('.hero__stage');
  const disc = stage.querySelector('.hero__disc');
  const portrait = stage.querySelector('.hero__portrait');
  const nameWrap = stage.querySelector('.hero__name');
  const nameLayers = [...nameWrap.querySelectorAll('.hero__name-layer')];
  const ui = stage.querySelector('.hero__ui');
  const [backCanvas, frontCanvas] = stage.querySelectorAll('.hero__orbit');

  const S = {
    introR: 0.3, portraitIn: 0, orbitIn: 0, spinBoost: 0,
    release: 0, eclipse: 0, fadeUi: 0,
    px: 0, py: 0,
  };
  const L = { W: 1, H: 1, dx: 0, dy: 0, dr: 1 };
  const pointer = { x: 0, y: 0 };

  function layout() {
    const W = stage.clientWidth, H = stage.clientHeight;
    const mobile = W < 900;
    const figW = Math.min(H * 0.94 * (IMG_W / IMG_H), W * (mobile ? 1.3 : 1.28));
    const figH = figW * (IMG_H / IMG_W);
    const figLeft = (W - figW) / 2;
    const figTop = H - figH;
    Object.assign(L, {
      W, H,
      dx: figLeft + figW * DISC_CX,
      dy: figTop + figH * DISC_CY,
      dr: (figW * DISC_D) / 2,
    });
    const nameSize = Math.min(L.dr * 1.55, W * (mobile ? 0.56 : 0.4));
    const vars = {
      '--fig-w': `${figW}px`, '--fig-left': `${figLeft}px`, '--fig-top': `${figTop}px`,
      '--disc-x0': `${L.dx}px`, '--disc-y0': `${L.dy}px`, '--disc-r0': `${L.dr}px`,
      '--name-size': `${nameSize}px`, '--name-top': `${L.dy - L.dr * 0.98}px`,
    };
    for (const k in vars) stage.style.setProperty(k, vars[k]);
    orbit?.resize(W, H);
  }

  // ---- name: split both layers identically so the eclipse mask stays aligned
  const nameSplits = nameLayers.map((el) => SplitText.create(el, { type: 'chars', mask: 'chars', aria: 'none' }));
  gsap.set(nameSplits.flatMap((s) => s.chars), { yPercent: 105 });
  const uiParts = [...ui.querySelectorAll('.hero__intro > *, .hero__foot')];
  gsap.set(uiParts, { autoAlpha: 0, y: 28 });
  gsap.set(['.nav', '.progress'], { autoAlpha: 0 });

  // ---- orbit (Three.js) — optional enhancement
  let orbit = null;
  const ready = import('../three/orbit.js')
    .then(({ createOrbit }) => createOrbit({
      backCanvas, frontCanvas,
      cards: env.mobile ? orbitCards.slice(0, 7) : orbitCards,
      lowPower: env.mobile,
    }))
    .then((o) => { orbit = o; orbit.resize(L.W, L.H); })
    .catch((err) => console.warn('[hero] orbit unavailable', err));

  layout();
  new ResizeObserver(() => layout()).observe(stage);

  if (env.finePointer) {
    window.addEventListener('pointermove', (e) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });
  }

  // ---- per-frame render
  let active = true;

  function render(time, deltaMs) {
    if (!active) return;
    const dt = Math.min(deltaMs, 50) / 1000;
    const { W, H } = L;

    if (env.finePointer) {
      S.px += (pointer.x - S.px) * 0.05;
      S.py += (pointer.y - S.py) * 0.05;
    } else if (!env.reduced) {
      S.px = Math.sin(time * 0.35) * 0.3;
      S.py = Math.cos(time * 0.27) * 0.2;
    }

    const e = S.eclipse;
    const rel = S.release;
    const par = 1 - e;

    // disc — grows to cover the viewport and recentres
    const cx = lerp(L.dx, W / 2, e) - S.px * 12 * par;
    const cy = lerp(L.dy, H / 2, e) - S.py * 9 * par;
    const cover = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy)) + 6;
    const r = lerp(L.dr, cover, e * e) * S.introR;
    disc.style.transform = `translate3d(${cx - L.dx}px, ${cy - L.dy}px, 0) scale(${r / L.dr})`;

    // name — sits between disc and portrait, inverts where it crosses the disc
    const nx = -S.px * 24 * par;
    const ny = -S.py * 10 * par - rel * H * 0.05;
    nameWrap.style.transform = `translate3d(${nx}px, ${ny}px, 0)`;
    nameWrap.style.opacity = String(1 - smooth(e, 0.62, 0.92));
    nameWrap.style.setProperty('--hx', `${cx - nx}px`);
    nameWrap.style.setProperty('--hy', `${cy - ny}px`);
    nameWrap.style.setProperty('--hr', `${r}px`);

    // portrait
    const pScale = lerp(1, 0.9, smooth(e, 0.2, 1));
    const pY = (1 - S.portraitIn) * H * 0.1 + e * H * 0.05;
    portrait.style.transform = `translate3d(${S.px * 8 * par}px, ${pY}px, 0) scale(${pScale})`;
    portrait.style.opacity = String(S.portraitIn * (1 - smooth(e, 0.5, 0.9)));

    // ui
    ui.style.opacity = String(1 - S.fadeUi);
    ui.style.transform = `translate3d(0, ${-S.fadeUi * 48}px, 0)`;

    // orbit
    if (orbit) {
      orbit.render({
        x: cx, y: cy,
        r: L.dr * S.introR,
        // the halo opens outward and past the viewport as you scroll
        radiusMul: (W < 900 ? 1.22 : 1.32) * (1 + rel * rel * 1.5),
        cardMul: W < 900 ? 0.72 : 0.62,
        spread: rel,
        tiltX: lerp(0.4, 0.1, rel) + S.py * 0.07,
        roll: -0.16 + S.px * 0.06,
        speed: (env.reduced ? 0.04 : 0.17 + rel * 1.1) + S.spinBoost,
        alpha: S.orbitIn * (1 - smooth(e, 0.02, 0.35)),
        time, dt,
      });
    }
  }
  gsap.ticker.add(render);

  ScrollTrigger.create({
    trigger: hero, start: 'top bottom', end: 'bottom top',
    onToggle: (self) => { active = self.isActive; },
  });

  // ---- scroll scene: release the orbit → eclipse floods the screen
  gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: hero, start: 'top top', end: 'bottom bottom', scrub: 0.7,
      onUpdate: (self) => requestSaffronNav('hero', self.progress > 0.84),
      // About claims the saffron nav from here on (its last onUpdate reports progress 1)
      onLeave: () => requestSaffronNav('hero', false),
      onLeaveBack: () => requestSaffronNav('hero', false),
    },
  })
    .to(S, { fadeUi: 1, duration: 0.2, ease: 'power1.in' }, 0)
    .to(S, { release: 1, duration: 0.55, ease: 'power1.inOut' }, 0)
    .to(S, { eclipse: 1, duration: 0.5, ease: 'power2.inOut' }, 0.4)
    .to({}, { duration: 0.1 });

  // ---- intro, called by the preloader
  function intro() {
    const chars = nameSplits.map((s) => s.chars);
    const tl = gsap.timeline();
    tl.to(S, { introR: 1, duration: 1.9, ease: 'expo.out' }, 0)
      .to(S, { portraitIn: 1, duration: 1.7, ease: 'expo.out' }, 0.2)
      .fromTo(S, { spinBoost: 2.6 }, { spinBoost: 0, duration: 3, ease: 'power3.out' }, 0.35)
      .to(S, { orbitIn: 1, duration: 1.6, ease: 'power2.out' }, 0.35);
    chars.forEach((c) => tl.to(c, { yPercent: 0, duration: 1.5, ease: 'expo.out', stagger: 0.06 }, 0.3));
    tl.to(uiParts, { autoAlpha: 1, y: 0, duration: 1.3, ease: 'expo.out', stagger: 0.07 }, 0.65)
      .to(['.nav', '.progress'], { autoAlpha: 1, duration: 1, ease: 'power2.out' }, 0.9);
    return tl;
  }

  return {
    ready,
    intro,
    discScreen: () => ({ x: L.dx, y: L.dy, r: L.dr }),
  };
}
