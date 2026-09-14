const { gsap, SplitText } = window;

// Generic line-mask reveals for display headings, and soft fades for eyebrows.
export function initReveals() {
  document.querySelectorAll('[data-reveal-lines]').forEach((el) => {
    SplitText.create(el, {
      type: 'lines',
      mask: 'lines',
      linesClass: 'split', // masks become .split-mask (base.css), which leaves room for descenders
      autoSplit: true,
      // 130%, not 110%: the taller masks would otherwise show the tops of the letters early
      onSplit: (self) => gsap.from(self.lines, {
        yPercent: 130,
        duration: 1.3,
        ease: 'expo.out',
        stagger: 0.09,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      }),
    });
  });

  gsap.utils.toArray('.section-head .eyebrow, .contact .eyebrow').forEach((el) => {
    gsap.from(el, {
      autoAlpha: 0,
      y: 16,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 92%', once: true },
    });
  });
}
