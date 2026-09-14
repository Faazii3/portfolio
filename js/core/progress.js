const { ScrollTrigger } = window;

export function initProgress() {
  const root = document.querySelector('.progress');
  const fill = root.querySelector('.progress__fill');
  const label = root.querySelector('.progress__label');

  // step aside for the footer's own back-to-top link
  ScrollTrigger.create({
    trigger: '.footer',
    start: 'top bottom',
    onToggle: (self) => root.classList.toggle('is-away', self.isActive),
  });

  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => { fill.style.strokeDashoffset = String(1 - self.progress); },
  });

  document.querySelectorAll('main > section[data-label]').forEach((section) => {
    ScrollTrigger.create({
      trigger: section,
      start: 'top 50%',
      end: 'bottom 50%',
      onToggle: (self) => { if (self.isActive) label.textContent = section.dataset.label; },
    });
  });
}
