import { env } from './env.js';

const { gsap, ScrollTrigger, Lenis } = window;

export function initSmoothScroll() {
  let lenis = null;

  if (!env.reduced && Lenis) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true, syncTouch: false });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // In-page anchors cut instead of gliding (a glide played every pinned scene on the way):
  // the veil covers the page, the page teleports, whatever the jump set in motion is
  // finished on the spot, and the veil lifts on a settled section.
  const root = document.documentElement;
  const veil = document.querySelector('.veil');
  let cut = null;       // veil timeline of the jump in flight
  let cutTarget = null;
  let settle = null;    // lifts .is-jumping once the landing has been styled

  const teleport = (target) => {
    settle?.kill();
    env.jumping = true;
    root.classList.add('is-jumping');
    // anything starting from now on was set off by the jump (1 ms slack: GSAP rounds start times)
    const since = gsap.globalTimeline.time() - 0.001;
    // both honour the target's CSS scroll-margin-top (#reels uses it to land below the nav)
    if (lenis) lenis.scrollTo(target === document.body ? 0 : target, { immediate: true });
    else target.scrollIntoView();
    ScrollTrigger.update();
    // scrub catch-ups, once-only reveals (passed or landed on), milestone swaps. Finishing one
    // can start another (the journey sun swaps its milestone copy), so repeat until quiet.
    for (let pass = 0; pass < 4; pass++) {
      const started = gsap.globalTimeline.getChildren(false, true, true, since).filter((a) => a.progress() < 1);
      if (!started.length) break;
      started.forEach((a) => a.progress(1));
    }
    env.jumping = false;
    settle = gsap.delayedCall(0.1, () => root.classList.remove('is-jumping'));
    // move keyboard focus with the jump (skip link, menu links)
    if (target !== document.body) {
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }
  };

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const hash = link.getAttribute('href');
    // bare "#" is a placeholder link (a button whose destination isn't decided yet)
    if (hash === '#') { e.preventDefault(); return; }
    const target = hash === '#top' ? document.body : document.querySelector(hash);
    if (!target) return;
    e.preventDefault();
    if (lenis?.isStopped) return; // preloader still running, or an overlay holds the page
    if (cut && target === cutTarget) return; // a double click doesn't restart the cut
    if (cut) { cut.kill(); cut = null; }

    // No veil for reduced motion, or from the open mobile menu: it already covers the page,
    // and its closing circle reveals the landing.
    if (env.reduced || link.closest('.menu')) {
      gsap.set(veil, { autoAlpha: 0 });
      teleport(target);
      return;
    }
    cutTarget = target;
    cut = gsap.timeline({ onComplete: () => { cut = null; } })
      .to(veil, { autoAlpha: 1, duration: 0.15, ease: 'power1.out' })
      .add(() => teleport(target))
      .to(veil, { autoAlpha: 0, duration: 0.3, ease: 'power2.out' });
  });

  return lenis;
}
