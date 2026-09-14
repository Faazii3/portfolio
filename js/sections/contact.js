// CONTACT — the disc returns as a rising sun behind the footer.
const { gsap } = window;

export function initContact() {
  const section = document.querySelector('.contact');

  gsap.fromTo(section.querySelector('.contact__sun'), { '--rise': 0 }, {
    '--rise': 1, ease: 'none',
    scrollTrigger: { trigger: section, start: 'top 60%', end: 'bottom bottom', scrub: 0.8 },
  });

  // opacity, not autoAlpha: the links stay in the Tab order before they're revealed
  gsap.from(section.querySelectorAll('.contact__email, .contact__actions > *, .contact__meta > div'), {
    y: 30, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.06,
    scrollTrigger: { trigger: section.querySelector('.contact__email'), start: 'top 92%', once: true },
  });

  section.querySelector('[data-year]').textContent = String(new Date().getFullYear());
}
