const mq = (q) => window.matchMedia(q).matches;

export const env = {
  reduced: mq('(prefers-reduced-motion: reduce)'),
  finePointer: mq('(hover: hover) and (pointer: fine)'),
  jumping: false, // true while an in-page link teleports the page (smooth-scroll.js)
  get desktop() { return mq('(min-width: 900px)'); },
  get mobile() { return mq('(max-width: 899px)'); },
};

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const range = (v, a, b) => clamp((v - a) / (b - a));
export const smooth = (v, a, b) => { const t = range(v, a, b); return t * t * (3 - 2 * t); };

// True when focus arrived from the keyboard, not from a mouse press or tap (browsers
// focus links and [tabindex] elements on mousedown too).
export function isKeyboardFocus(el) {
  try { return el.matches(':focus-visible'); } catch { return true; }
}

// Scroll lock shared by overlays (mobile menu, reel player): the page only unlocks
// once every overlay has closed. Stops Lenis when present; the html class covers
// the reduced-motion case where Lenis isn't running.
const locks = new Set();
let lockLenis = null;
export function setScrollEngine(lenis) { lockLenis = lenis; }
export function lockScroll(key, on) {
  const wasLocked = locks.size > 0;
  if (on) locks.add(key); else locks.delete(key);
  const isLocked = locks.size > 0;
  if (wasLocked === isLocked) return;
  document.documentElement.classList.toggle('is-scroll-locked', isLocked);
  if (isLocked) lockLenis?.stop(); else lockLenis?.start();
}

// Nav tone: any section can request the ink-on-saffron nav while it owns the screen.
const toneRequests = new Map();
export function requestSaffronNav(key, on) {
  toneRequests.set(key, on);
  const any = [...toneRequests.values()].some(Boolean);
  document.querySelector('[data-nav]')?.classList.toggle('on-saffron', any);
}
