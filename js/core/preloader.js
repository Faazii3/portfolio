const { gsap } = window;

// Ring counts up around the exact spot the hero disc will occupy, then hands
// off: the ring dissolves and the disc grows out of it.
export async function runPreloader({ tasks, discScreen, onReveal }) {
  const el = document.querySelector('.preloader');
  if (!el) { onReveal?.(); return; }
  const fill = el.querySelector('.preloader__fill');
  const count = el.querySelector('.preloader__count');

  const place = () => {
    const { x, y, r } = discScreen();
    el.style.setProperty('--pl-x', `${x}px`);
    el.style.setProperty('--pl-y', `${y}px`);
    el.style.setProperty('--pl-d', `${Math.max(120, r * 0.6)}px`);
  };
  place();

  const state = { v: 0 };
  const render = () => {
    count.textContent = String(Math.round(state.v)).padStart(3, '0');
    fill.style.strokeDashoffset = String(1 - state.v / 100);
  };

  const creep = gsap.to(state, { v: 88, duration: 2.2, ease: 'power2.out', onUpdate: render });
  // at least 900 ms, at most 6 s: a stalled CDN (the orbit's three.js) mustn't hold the page
  // hostage — whatever is still loading pops in when it arrives
  await Promise.race([
    Promise.all([...tasks, new Promise((r) => setTimeout(r, 900))]),
    new Promise((r) => setTimeout(r, 6000)),
  ]);
  creep.kill();
  await gsap.to(state, { v: 100, duration: 0.45, ease: 'power2.inOut', onUpdate: render });

  const tl = gsap.timeline();
  tl.to(count, { autoAlpha: 0, duration: 0.3 }, 0)
    .to(el.querySelector('.preloader__label'), { autoAlpha: 0, duration: 0.3 }, 0)
    .to(el.querySelector('.preloader__ring'), { scale: 1.6, autoAlpha: 0, duration: 0.9, ease: 'expo.out' }, 0.1)
    .to(el, { backgroundColor: 'rgba(4,3,3,0)', duration: 0.7, ease: 'power2.out' }, 0.15)
    .add(() => onReveal?.(), 0.1)
    .set(el, { display: 'none' });
  await tl;
}
