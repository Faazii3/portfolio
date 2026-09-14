// Procedural placeholder artwork for the orbit cards, painted on 2D canvases
// in the portrait palette. Swap for real work by giving a card an `image`.
import * as THREE from 'three';

const C = {
  ink: '#040303', ink1: '#0b0a09', ink2: '#131211', charcoal: '#282628', graphite: '#303133',
  ash: '#858384', silver: '#c1bfc0', bone: '#e9e7e5',
  saffron: '#eec072', saffronHi: '#f6d9a3', saffronLo: '#d9a24e', ember: '#9a6526',
};
const SERIF = '"Instrument Serif", Georgia, serif';
const SANS = '"Inter Tight", system-ui, sans-serif';
const MONO = '"JetBrains Mono", ui-monospace, monospace';

const SIZES = { reel: [400, 711], post: [440, 550], square: [460, 460] };

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function mono(ctx, text, x, y, color, size = 17, align = 'left') {
  ctx.font = `500 ${size}px ${MONO}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${size * 0.06}px`;
  ctx.fillText(text.toUpperCase(), x, y);
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
}

function serif(ctx, text, x, y, size, color, italic = false, align = 'left') {
  ctx.font = `${italic ? 'italic ' : ''}400 ${size}px ${SERIF}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, x, y);
}

function disc(ctx, x, y, r, stops) {
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r);
  stops.forEach(([o, c]) => g.addColorStop(o, c));
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
}

function footer(ctx, w, h, card, color) {
  ctx.fillStyle = color; ctx.globalAlpha = 0.18; ctx.fillRect(28, h - 64, w - 56, 1); ctx.globalAlpha = 1;
  mono(ctx, card.client, 28, h - 30, color, 15);
}

const painters = {
  'reel-food'(ctx, w, h, card) {
    const bg = ctx.createRadialGradient(w / 2, h * 1.05, 10, w / 2, h * 0.9, h * 0.9);
    bg.addColorStop(0, '#5a3d14'); bg.addColorStop(0.45, '#1a1209'); bg.addColorStop(1, C.ink1);
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    disc(ctx, w * 0.5, h * 0.72, w * 0.42, [[0, C.saffronHi], [0.5, C.saffron], [1, C.ember]]);
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i === 0 ? C.bone : 'rgba(233,231,229,.25)';
      roundRect(ctx, 28 + i * ((w - 56) / 3), 26, (w - 56) / 3 - 6, 3, 2); ctx.fill();
    }
    ctx.fillStyle = C.saffron; ctx.beginPath(); ctx.arc(36, 62, 6, 0, Math.PI * 2); ctx.fill();
    mono(ctx, 'Rec 00:15', 50, 68, C.bone, 15);
    card.lines.forEach((l, i) => serif(ctx, l, 28, 170 + i * 76, 86, i === 1 ? C.saffron : C.bone, i === 1));
    footer(ctx, w, h, card, C.bone);
    mono(ctx, card.tag, w - 28, h - 30, C.bone, 15, 'right');
  },

  carousel(ctx, w, h, card) {
    ctx.fillStyle = C.bone; ctx.fillRect(0, 0, w, h);
    mono(ctx, card.client, 28, 50, C.ink, 15);
    ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(w - 50, 44, 14, 0, Math.PI * 2); ctx.stroke();
    serif(ctx, card.lines[0], 28, 200, 70, C.ink);
    serif(ctx, card.lines[1], 28, 262, 70, C.ember, true);
    serif(ctx, card.lines[2], 28, 324, 70, C.ink);
    for (let i = 0; i < 5; i++) { ctx.fillStyle = i === 0 ? C.ink : 'rgba(4,3,3,.2)'; ctx.beginPath(); ctx.arc(34 + i * 16, h - 90, 4, 0, Math.PI * 2); ctx.fill(); }
    footer(ctx, w, h, { client: card.tag }, C.ink);
    mono(ctx, 'Swipe →', w - 28, h - 30, C.ink, 15, 'right');
  },

  poster(ctx, w, h, card) {
    ctx.fillStyle = C.saffron; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(4,3,3,.85)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(w * 0.62, h * 0.36, w * 0.3, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(w * 0.62, h * 0.36, w * 0.44, w * 0.1, -0.25, 0, Math.PI * 2); ctx.stroke();
    mono(ctx, card.tag, 28, 50, C.ink, 15);
    serif(ctx, card.lines[0], 28, h - 150, 92, C.ink);
    serif(ctx, card.lines[1], 28, h - 80, 92, C.ink, true);
    ctx.fillStyle = C.ink; ctx.fillRect(28, h - 52, w - 56, 1);
    mono(ctx, card.client, 28, h - 22, C.ink, 14);
  },

  adcopy(ctx, w, h, card) {
    ctx.fillStyle = C.ink2; ctx.fillRect(0, 0, w, h);
    mono(ctx, card.tag, 28, 50, C.ash, 15);
    card.lines.forEach((l, i) => serif(ctx, l, 28, 150 + i * 72, 74, i === 1 ? C.saffron : C.bone, i === 1));
    mono(ctx, 'Students · Graduates · Switchers', 28, h - 86, C.ash, 12);
    footer(ctx, w, h, card, C.silver);
  },

  film(ctx, w, h, card) {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, h * 0.2, 0, h * 0.8);
    g.addColorStop(0, '#2b2013'); g.addColorStop(0.55, '#6b4a1c'); g.addColorStop(1, '#1a1209');
    ctx.fillStyle = g; ctx.fillRect(0, h * 0.18, w, h * 0.64);
    disc(ctx, w * 0.32, h * 0.5, w * 0.16, [[0, C.saffronHi], [1, C.saffronLo]]);
    ctx.fillStyle = 'rgba(4,3,3,.75)'; ctx.fillRect(w * 0.52, h * 0.34, w * 0.2, h * 0.48);
    ctx.beginPath(); ctx.arc(w * 0.62, h * 0.31, w * 0.075, 0, Math.PI * 2); ctx.fill();
    for (let y = 30; y < h; y += 44) { ctx.fillStyle = 'rgba(233,231,229,.12)'; roundRect(ctx, 10, y, 14, 22, 3); ctx.fill(); roundRect(ctx, w - 24, y, 14, 22, 3); ctx.fill(); }
    mono(ctx, 'Scene 01 · Take 03', 40, h * 0.12, C.ash, 14);
    serif(ctx, card.lines[0], w / 2, h * 0.9, 40, C.bone, true, 'center');
    serif(ctx, card.lines[1], w / 2, h * 0.9 + 42, 40, C.bone, true, 'center');
  },

  ga4(ctx, w, h, card) {
    ctx.fillStyle = C.ink1; ctx.fillRect(0, 0, w, h);
    mono(ctx, card.client, 28, 50, C.ash, 15);
    serif(ctx, card.lines[0], 28, 150, 96, C.bone);
    serif(ctx, card.lines[1], 28, 236, 96, C.saffron, true);
    const bars = [0.3, 0.52, 0.42, 0.7, 0.95];
    bars.forEach((b, i) => {
      const bw = (w - 56 - 4 * 14) / 5, bh = 150 * b;
      ctx.fillStyle = i === 4 ? C.saffron : C.graphite;
      roundRect(ctx, 28 + i * (bw + 14), h - 90 - bh, bw, bh, 6); ctx.fill();
    });
    footer(ctx, w, h, { client: card.tag }, C.silver);
  },

  code(ctx, w, h, card) {
    ctx.fillStyle = C.ink1; ctx.fillRect(0, 0, w, h);
    ['#3a3839', '#3a3839', '#3a3839'].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(34 + i * 18, 40, 5, 0, Math.PI * 2); ctx.fill(); });
    const rows = [
      [['<article ', C.saffron], ['class=', C.ash], ['"slide"', C.saffronHi], ['>', C.saffron]],
      [['  <h2>', C.saffron], ['Fresh.', C.bone]],
      [['  <h2>', C.saffron], ['Flaky.', C.bone]],
      [['  <h2>', C.saffron], ['Festive.', C.bone]],
      [['</article>', C.saffron]],
    ];
    ctx.font = `500 19px ${MONO}`; ctx.textAlign = 'left';
    rows.forEach((row, i) => { let x = 30; row.forEach(([t, c]) => { ctx.fillStyle = c; ctx.fillText(t, x, 100 + i * 34); x += ctx.measureText(t).width; }); });
    ctx.fillStyle = C.saffron; roundRect(ctx, 28, h - 132, w - 56, 58, 12); ctx.fill();
    ctx.font = `500 18px ${MONO}`; ctx.fillStyle = C.ink; ctx.fillText('→ slide-01.png  ✓', 46, h - 96);
    mono(ctx, card.client, 28, h - 30, C.ash, 14);
  },

  ai(ctx, w, h, card) {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#1b140c'); g.addColorStop(1, '#5a3c16');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    for (let i = 7; i > 0; i--) {
      ctx.strokeStyle = `rgba(238,192,114,${0.08 + i * 0.05})`; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(w * 0.55, h * 0.4, i * 26, 0, Math.PI * 2); ctx.stroke();
    }
    disc(ctx, w * 0.55, h * 0.4, 44, [[0, '#fff3dc'], [1, C.saffron]]);
    let s = 7;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 90; i++) { ctx.fillStyle = `rgba(233,231,229,${rnd() * 0.5})`; ctx.fillRect(rnd() * w, rnd() * h, 2, 2); }
    mono(ctx, card.tag, 28, 50, C.bone, 15);
    serif(ctx, card.lines[0], 28, h - 130, 70, C.bone);
    serif(ctx, card.lines[1], 28, h - 72, 70, C.saffron, true);
    mono(ctx, card.client, 28, h - 30, C.silver, 13);
  },

  seo(ctx, w, h, card) {
    ctx.fillStyle = C.bone; ctx.fillRect(0, 0, w, h);
    mono(ctx, card.tag + ' · On-page', 28, 50, C.ink, 15);
    ctx.strokeStyle = C.ink; ctx.lineWidth = 2; roundRect(ctx, 28, 80, w - 56, 58, 29); ctx.stroke();
    ctx.beginPath(); ctx.arc(62, 108, 10, 0, Math.PI * 2); ctx.moveTo(69, 115); ctx.lineTo(78, 124); ctx.stroke();
    ctx.font = `400 21px ${SANS}`; ctx.fillStyle = C.ink; ctx.textAlign = 'left'; ctx.fillText(card.lines[0], 92, 116);
    [0.92, 0.7, 0.55, 0.38].forEach((v, i) => {
      ctx.fillStyle = i === 0 ? C.saffron : 'rgba(4,3,3,.14)';
      roundRect(ctx, 28, 172 + i * 46, (w - 56) * v, 28, 8); ctx.fill();
      mono(ctx, `#${i + 1}`, w - 28, 192 + i * 46, C.ink, 13, 'right');
    });
    footer(ctx, w, h, card, C.ink);
  },

  live(ctx, w, h, card) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#1d1b1a'); g.addColorStop(1, C.ink);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    disc(ctx, w * 0.5, h * 0.36, w * 0.3, [[0, C.saffronHi], [0.6, C.saffron], [1, C.saffronLo]]);
    // mic
    ctx.fillStyle = C.ink; roundRect(ctx, w * 0.5 - 26, h * 0.24, 52, 96, 26); ctx.fill();
    ctx.strokeStyle = C.ink; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(w * 0.5, h * 0.24 + 60, 42, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(w * 0.5, h * 0.24 + 102); ctx.lineTo(w * 0.5, h * 0.24 + 136); ctx.stroke();
    ctx.fillStyle = C.saffron; roundRect(ctx, 28, 30, 88, 34, 17); ctx.fill();
    ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(46, 47, 5, 0, Math.PI * 2); ctx.fill();
    mono(ctx, 'Live', 58, 53, C.ink, 15);
    serif(ctx, card.lines[0], 28, h - 170, 84, C.bone);
    serif(ctx, card.lines[1], 28, h - 96, 84, C.saffron, true);
    footer(ctx, w, h, card, C.silver);
  },
};

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function makeCardTexture(card, { scale = 1, maxAnisotropy = 4 } = {}) {
  const [bw, bh] = SIZES[card.kind];
  const w = Math.round(bw * scale), h = Math.round(bh * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  const radius = 26 * scale;

  ctx.save();
  roundRect(ctx, 0, 0, w, h, radius);
  ctx.clip();
  if (card.image) {
    try {
      const img = await loadImage(card.image);
      const s = Math.max(w / img.width, h / img.height);
      ctx.drawImage(img, (w - img.width * s) / 2, (h - img.height * s) / 2, img.width * s, img.height * s);
    } catch { (painters[card.theme] || painters.carousel)(ctx, w, h, card); }
  } else {
    ctx.scale(scale, scale);
    (painters[card.theme] || painters.carousel)(ctx, bw, bh, card);
  }
  ctx.restore();

  // hairline edge so dark cards still read against the ink backdrop
  roundRect(ctx, 0.75, 0.75, w - 1.5, h - 1.5, radius);
  ctx.strokeStyle = 'rgba(233,231,229,.16)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  return { texture: tex, aspect: w / h };
}
