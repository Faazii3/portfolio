// The two-resume coin: Side A "Content Creator", Side B "Brand Presenter".
// A saffron metal coin lit by a procedural room environment; the About scene
// scrubs its flip from one face to the other.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const SERIF = '"Instrument Serif", Georgia, serif';
const MONO = '"JetBrains Mono", ui-monospace, monospace';

function drawFace(ctx, size, side, pass) {
  const m = size / 2;
  const colour = pass === 'color';
  const base = colour ? '#eec072' : '#9a9a9a';
  const cut = colour ? '#b07a34' : '#2a2a2a';    // engraved (low)
  const lift = colour ? '#f7dca8' : '#ffffff';   // embossed (high)

  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  // concentric guilloché
  ctx.strokeStyle = cut;
  for (let i = 0; i < 18; i++) {
    ctx.globalAlpha = colour ? 0.08 : 0.18;
    ctx.lineWidth = size * 0.002;
    ctx.beginPath(); ctx.arc(m, m, size * (0.12 + i * 0.013), 0, Math.PI * 2); ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // rim bands
  ctx.lineWidth = size * 0.01;
  ctx.beginPath(); ctx.arc(m, m, size * 0.465, 0, Math.PI * 2); ctx.stroke();
  ctx.lineWidth = size * 0.005;
  ctx.beginPath(); ctx.arc(m, m, size * 0.385, 0, Math.PI * 2); ctx.stroke();

  // circular legend
  const legend = side === 'A'
    ? 'CONTENT CREATOR · REELS · CAROUSELS · COPY · VIDEO · '
    : 'BRAND PRESENTER · VOICE · STORY · CAMERA · COMMUNITY · ';
  ctx.font = `500 ${size * 0.036}px ${MONO}`;
  ctx.fillStyle = cut;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const radius = size * 0.425;
  const chars = [...legend];
  const step = (Math.PI * 2) / chars.length;
  chars.forEach((ch, i) => {
    const a = -Math.PI / 2 + i * step;
    ctx.save();
    ctx.translate(m + Math.cos(a) * radius, m + Math.sin(a) * radius);
    ctx.rotate(a + Math.PI / 2);
    ctx.fillText(ch, 0, 0);
    ctx.restore();
  });

  // centre emblem
  ctx.fillStyle = lift;
  ctx.strokeStyle = cut;
  if (side === 'A') {
    // play button inside a ring
    ctx.lineWidth = size * 0.008;
    ctx.beginPath(); ctx.arc(m, m - size * 0.13, size * 0.075, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = cut;
    ctx.beginPath();
    ctx.moveTo(m - size * 0.024, m - size * 0.17);
    ctx.lineTo(m + size * 0.04, m - size * 0.13);
    ctx.lineTo(m - size * 0.024, m - size * 0.09);
    ctx.closePath(); ctx.fill();
  } else {
    // microphone
    ctx.fillStyle = cut;
    const w = size * 0.05, h = size * 0.1, x = m - w / 2, y = m - size * 0.215;
    ctx.beginPath(); ctx.roundRect(x, y, w, h, w / 2); ctx.fill();
    ctx.lineWidth = size * 0.008;
    ctx.beginPath(); ctx.arc(m, y + h * 0.62, size * 0.045, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(m, y + h * 0.62 + size * 0.045); ctx.lineTo(m, y + h + size * 0.03); ctx.stroke();
  }

  ctx.fillStyle = cut;
  ctx.font = `400 ${size * 0.095}px ${SERIF}`;
  ctx.fillText(side === 'A' ? 'Content' : 'Brand', m, m + size * 0.03);
  ctx.font = `italic 400 ${size * 0.12}px ${SERIF}`;
  ctx.fillText(side === 'A' ? 'Creator' : 'Presenter', m, m + size * 0.13);
  ctx.font = `500 ${size * 0.03}px ${MONO}`;
  ctx.fillText(side === 'A' ? 'SIDE A' : 'SIDE B', m, m + size * 0.235);
}

function faceTextures(side, size) {
  const make = (pass) => {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    drawFace(c.getContext('2d'), size, side, pass);
    const t = new THREE.CanvasTexture(c);
    if (pass === 'color') t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  };
  return { map: make('color'), bumpMap: make('bump') };
}

function ridgeTexture() {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 8;
  const ctx = c.getContext('2d');
  for (let x = 0; x < 1024; x += 8) {
    ctx.fillStyle = '#fff'; ctx.fillRect(x, 0, 4, 8);
    ctx.fillStyle = '#333'; ctx.fillRect(x + 4, 0, 4, 8);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  return t;
}

export function createCoin(canvas, { lowPower = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowPower ? 1.5 : 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 0.92;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 0, 10);

  const key = new THREE.DirectionalLight(0xfff1dc, 1.1);
  key.position.set(3, 4, 6);
  const warm = new THREE.DirectionalLight(0xeec072, 1.1);
  warm.position.set(-5, -2, 3);
  scene.add(key, warm);

  // radius so the face fills 70% of the canvas (matches the About field hand-off)
  const R = Math.tan(THREE.MathUtils.degToRad(15)) * 10 * 0.7;
  const T = R * 0.09;
  const size = lowPower ? 1024 : 2048;

  const faceMat = (side) => {
    const { map, bumpMap } = faceTextures(side, size);
    return new THREE.MeshStandardMaterial({ map, bumpMap, bumpScale: 2.2, metalness: 0.7, roughness: 0.38, envMapIntensity: 0.55 });
  };

  const coin = new THREE.Group();
  const front = new THREE.Mesh(new THREE.CircleGeometry(R, 160), faceMat('A'));
  front.position.z = T / 2;
  const back = new THREE.Mesh(new THREE.CircleGeometry(R, 160), faceMat('B'));
  back.rotation.y = Math.PI;
  back.position.z = -T / 2;

  const ridges = ridgeTexture();
  ridges.repeat.set(6, 1);
  const edgeMat = new THREE.MeshStandardMaterial({ color: 0xd9a24e, metalness: 0.75, roughness: 0.3, bumpMap: ridges, bumpScale: 1.5 });
  const edge = new THREE.Mesh(new THREE.CylinderGeometry(R, R, T, 160, 1, true), edgeMat);
  edge.rotation.x = Math.PI / 2;

  const rimMat = new THREE.MeshStandardMaterial({ color: 0xf0c47a, metalness: 0.8, roughness: 0.22 });
  const rimF = new THREE.Mesh(new THREE.TorusGeometry(R * 0.985, T * 0.22, 12, 160), rimMat);
  rimF.position.z = T / 2;
  const rimB = rimF.clone();
  rimB.position.z = -T / 2;

  coin.add(front, back, edge, rimF, rimB);
  scene.add(coin);

  function resize(w, h) {
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function render({ flip, time, px = 0, py = 0 }) {
    coin.rotation.y = flip * Math.PI + Math.sin(time * 0.7) * 0.07 + px * 0.28;
    coin.rotation.x = -0.1 + py * 0.2 + Math.sin(time * 0.5) * 0.05;
    coin.position.y = Math.sin(time * 1.1) * 0.05;
    renderer.render(scene, camera);
  }

  return { resize, render, radiusFraction: 0.35 };
}
