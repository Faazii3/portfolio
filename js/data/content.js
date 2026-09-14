// Halo-orbit cards. Every card maps to a line in the resumes; the artwork is
// drawn procedurally as a placeholder. In run 2, add `image: 'assets/work/…'`
// to any card and card-textures.js will use the real file instead.
export const orbitCards = [
  { theme: 'reel-food',   kind: 'reel',   tag: 'Reel',           client: 'CB Food Products',      lines: ['Fresh.', 'Flaky.', 'Festive.'] },
  { theme: 'carousel',    kind: 'post',   tag: 'Carousel',       client: 'thedigi.verse',         lines: ['Performance', 'vs.', 'Traditional'] },
  { theme: 'poster',      kind: 'post',   tag: 'Seasonal poster', client: 'CB Food Products',     lines: ['Festival', 'specials.'] },
  { theme: 'adcopy',      kind: 'square', tag: 'Ad copy',        client: 'Dotin Digital Academy', lines: ['Flexible.', 'Accessible.', 'Affordable.'] },
  { theme: 'film',        kind: 'reel',   tag: 'Brand story',    client: 'CB Food Products',      lines: ['A dialogue-style', 'brand story'] },
  { theme: 'ga4',         kind: 'post',   tag: 'Carousel',       client: 'thedigi.verse',         lines: ['GA4,', 'decoded.'] },
  { theme: 'code',        kind: 'square', tag: 'Pipeline',       client: 'HTML → image',          lines: [] },
  { theme: 'ai',          kind: 'post',   tag: 'AI visual',      client: 'Midjourney · DALL·E',   lines: ['Concept', 'visual'] },
  { theme: 'seo',         kind: 'square', tag: 'SEO',            client: 'Dotcom Creativez',      lines: ['keyword research'] },
  { theme: 'live',        kind: 'reel',   tag: 'On camera',      client: 'Brand presenter',       lines: ['Say it', 'clearly.'] },
];

// relative on-orbit height per format
export const cardHeights = { reel: 1, post: 0.82, square: 0.68 };
