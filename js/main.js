// Boot sequence: libraries → smooth scroll → sections → preloader handoff.
// Three.js modules are imported dynamically inside sections so a CDN failure
// degrades to the flat layout instead of breaking the whole page.
import { env, setScrollEngine } from './core/env.js';
import { initSmoothScroll } from './core/smooth-scroll.js';
import { initNav } from './core/nav.js';
import { initCursor } from './core/cursor.js';
import { initProgress } from './core/progress.js';
import { initReveals } from './core/reveals.js';
import { runPreloader } from './core/preloader.js';
import { initHero } from './sections/hero.js';
import { initAbout } from './sections/about.js';
import { initReels } from './sections/reels.js';
import { initWork } from './sections/work.js';
import { initPresenter } from './sections/presenter.js';
import { initToolkit } from './sections/toolkit.js';
import { initExpertise } from './sections/expertise.js';
import { initJourney } from './sections/journey.js';
import { initContact } from './sections/contact.js';

const { gsap, ScrollTrigger, SplitText } = window;

// The head script's fallback waits for this: the module graph loaded and is running.
// If it already gave up (a very slow network), stay on the static layout it showed.
const tooLate = Boolean(window.__folioFailed);
window.__folioStarted = true;

function failOpen(err) {
  console.error('[folio] boot failed, showing static layout', err);
  document.documentElement.classList.remove('js');
  document.querySelector('.preloader')?.remove();
}

const timeout = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function boot() {
  if (!gsap || !ScrollTrigger) throw new Error('GSAP did not load');
  gsap.registerPlugin(ScrollTrigger, SplitText);
  ScrollTrigger.config({ ignoreMobileResize: true });
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  const lenis = initSmoothScroll();
  setScrollEngine(lenis);
  lenis?.stop();

  const fontsReady = document.fonts?.ready ?? Promise.resolve();
  const portrait = document.querySelector('.hero__portrait');
  const portraitReady = portrait.decode ? portrait.decode().catch(() => {}) : Promise.resolve();

  // a stalled font request mustn't hold the whole page back
  await Promise.race([fontsReady, timeout(3000)]);

  const hero = await initHero();
  initAbout(lenis);
  initReels();
  initWork(lenis);
  initPresenter();
  initToolkit();
  initExpertise();
  initJourney();
  initContact();
  initNav();
  initCursor();
  initProgress();
  initReveals();

  await runPreloader({
    tasks: [portraitReady, hero.ready],
    discScreen: hero.discScreen,
    onReveal: hero.intro,
  });

  lenis?.start();
  ScrollTrigger.refresh();
}

if (!tooLate) boot().catch(failOpen);

// expose for run-2 tooling / debugging
window.__folio = { env };
