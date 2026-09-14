// EXPERTISE — each card rises in as it reaches the viewport, draws its line icon,
// then its list items follow. Cards sharing a row keep a left-to-right stagger.
const { gsap } = window;

export function initExpertise() {
  const section = document.querySelector('.expertise');
  if (!section) return;
  const cards = [...section.querySelectorAll('.skill')];
  const rowTop = cards[0]?.offsetTop ?? 0;

  cards.forEach((card, i) => {
    const delay = card.offsetTop === rowTop ? i * 0.12 : 0;
    card.style.setProperty('--draw-delay', `${delay + 0.1}s`);
    const trigger = { trigger: card, start: 'top 85%', once: true };

    gsap.from(card, {
      y: 90, rotationX: -14, opacity: 0, transformOrigin: '50% 100%',
      duration: 1.3, ease: 'expo.out', delay,
      scrollTrigger: { ...trigger, onEnter: () => card.classList.add('is-in') },
    });
    gsap.from(card.querySelectorAll('.skill__list li'), {
      x: -18, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.05, delay: delay + 0.35,
      scrollTrigger: trigger,
    });
  });
}
