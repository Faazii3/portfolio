// Halo orbit: work cards circle the portrait on a tilted ring.
// One scene, two transparent renderers split by the world plane z = 0:
//   back canvas  (below the name + portrait) draws everything with z < 0
//   front canvas (above the portrait)        draws everything with z > 0
// so cards pass behind Fazil's head and back out in front of him.
import * as THREE from 'three';
import { makeCardTexture } from './card-textures.js';
import { cardHeights } from '../data/content.js';

const FOV = 30;
const CAM_Z = 12;

export async function createOrbit({ backCanvas, frontCanvas, cards, lowPower = false }) {
  const dpr = Math.min(window.devicePixelRatio || 1, lowPower ? 1.5 : 2);

  const makeRenderer = (canvas, normalZ) => {
    const r = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
    r.setPixelRatio(dpr);
    r.setClearColor(0x000000, 0);
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.clippingPlanes = [new THREE.Plane(new THREE.Vector3(0, 0, normalZ), 0)];
    return r;
  };
  const back = makeRenderer(backCanvas, -1);
  const front = makeRenderer(frontCanvas, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
  camera.position.set(0, 0, CAM_Z);

  const root = new THREE.Group();
  const tilt = new THREE.Group();
  const spin = new THREE.Group();
  scene.add(root); root.add(tilt); tilt.add(spin);

  // --- rings
  const ringPts = new THREE.EllipseCurve(0, 0, 1, 1, 0, Math.PI * 2).getPoints(240).map((p) => new THREE.Vector3(p.x, 0, p.y));
  const ringGeo = new THREE.BufferGeometry().setFromPoints(ringPts);
  const ringMat = new THREE.LineBasicMaterial({ color: 0xeec072, transparent: true, opacity: 0.5 });
  const ring = new THREE.LineLoop(ringGeo, ringMat);
  const dashMat = new THREE.LineDashedMaterial({ color: 0xe9e7e5, transparent: true, opacity: 0.22, dashSize: 0.02, gapSize: 0.035 });
  const ringOuter = new THREE.LineLoop(ringGeo, dashMat);
  ringOuter.computeLineDistances();
  const ringInner = new THREE.LineLoop(ringGeo, new THREE.LineBasicMaterial({ color: 0xe9e7e5, transparent: true, opacity: 0.08 }));
  tilt.add(ring); spin.add(ringOuter); tilt.add(ringInner);

  // --- dust
  const dustCount = lowPower ? 80 : 180;
  const dustPos = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    const a = Math.random() * Math.PI * 2;
    const rr = 0.78 + Math.random() * 0.55;
    dustPos.set([Math.cos(a) * rr, (Math.random() - 0.5) * 0.12, Math.sin(a) * rr], i * 3);
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dotCanvas = document.createElement('canvas');
  dotCanvas.width = dotCanvas.height = 64;
  const dctx = dotCanvas.getContext('2d');
  const dg = dctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  dg.addColorStop(0, 'rgba(255,255,255,1)'); dg.addColorStop(0.4, 'rgba(255,255,255,.6)'); dg.addColorStop(1, 'rgba(255,255,255,0)');
  dctx.fillStyle = dg; dctx.fillRect(0, 0, 64, 64);
  const dustMat = new THREE.PointsMaterial({
    color: 0xeec072, size: 0.05, map: new THREE.CanvasTexture(dotCanvas),
    transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const dust = new THREE.Points(dustGeo, dustMat);
  spin.add(dust);

  // --- cards
  const aniso = Math.min(8, back.capabilities.getMaxAnisotropy());
  const textures = await Promise.all(cards.map((c) => makeCardTexture(c, { scale: lowPower ? 1 : 1.5, maxAnisotropy: aniso })));
  const meshes = cards.map((card, i) => {
    const { texture, aspect } = textures[i];
    const mat = new THREE.MeshBasicMaterial({
      map: texture, transparent: true, side: THREE.DoubleSide, depthWrite: false, toneMapped: false,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(aspect, 1), mat);
    mesh.userData = { angle: (i / cards.length) * Math.PI * 2, bob: i * 1.7, h: cardHeights[card.kind] ?? 0.8 };
    spin.add(mesh);
    return mesh;
  });

  // --- state
  let W = 1, H = 1, upp = 1; // world units per CSS px at z = 0
  let angle = 0;
  const tmp = new THREE.Vector3();

  function resize(width, height) {
    W = width; H = height;
    back.setSize(W, H, false);
    front.setSize(W, H, false);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    upp = (2 * CAM_Z * Math.tan(THREE.MathUtils.degToRad(FOV / 2))) / H;
  }

  /**
   * @param {object} p  screen-space params from hero.js
   *   x, y   orbit centre in stage px     r      disc radius px
   *   spread 0..1 scroll release          tiltX  roll  speed  alpha  time  dt
   */
  function render(p) {
    const R = p.r * p.radiusMul * upp;
    root.position.set((p.x - W / 2) * upp, -(p.y - H / 2) * upp, 0);
    tilt.rotation.set(p.tiltX, 0, p.roll);
    angle += p.dt * p.speed;
    spin.rotation.y = angle;

    ring.scale.setScalar(R);
    ringOuter.scale.setScalar(R * 1.16);
    ringInner.scale.setScalar(R * 0.84);
    dust.scale.setScalar(R);
    ringMat.opacity = 0.5 * p.alpha;
    dashMat.opacity = 0.22 * p.alpha;
    ringInner.material.opacity = 0.08 * p.alpha;
    dustMat.opacity = 0.8 * p.alpha;

    const cardH = p.r * p.cardMul * upp;
    scene.updateMatrixWorld();
    for (const m of meshes) {
      const { angle: a, bob, h } = m.userData;
      m.position.set(Math.cos(a) * R, Math.sin(p.time * 0.9 + bob) * 0.035 * R, Math.sin(a) * R);
      m.scale.setScalar(cardH * h);
      m.updateMatrixWorld();
      m.lookAt(camera.position);
      m.getWorldPosition(tmp);
      m.rotateY(-((tmp.x - root.position.x) / R) * 0.42);
      m.material.opacity = p.alpha;
    }

    back.render(scene, camera);
    front.render(scene, camera);
  }

  function dispose() {
    [back, front].forEach((r) => r.dispose());
    textures.forEach((t) => t.texture.dispose());
  }

  return { resize, render, dispose };
}
