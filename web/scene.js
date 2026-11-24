// Gary Tries It: deterministic three.js renderer.
// The page exposes window.renderFrame(t) which draws the frame at time t (seconds).
import * as THREE from 'three';

let W = 1080, H = 1920;
const ep = new URLSearchParams(location.search).get('ep');
const script = await (await fetch(`/episodes/${ep}/script.json`)).json();
const timeline = await (await fetch(`/episodes/${ep}/timeline.json`)).json();
await document.fonts.load('700 100px Fredoka');
await document.fonts.load('600 100px Fredoka');
const LANDSCAPE = script.format === 'landscape';
if (LANDSCAPE) {
  W = 1920; H = 1080;
  document.body.classList.add('landscape');
  const st = document.getElementById('stage'); st.style.width = W + 'px'; st.style.height = H + 'px';
  const cv = document.getElementById('gl'); cv.width = W; cv.height = H;
}
// The "times died" counter is off by default (george, 2026-11-24: clutter); hud.counter: true brings it back.
const HUD = { counter: false, ...(script.hud || {}) };
// Visual style: "cartoon" (default), "noir" (b&w film, grain, blinds, typewriter captions),
// "news" (breaking-news lower third, ticker, karaoke word captions).
const STYLE = script.style || 'cartoon';
document.body.classList.add('style-' + STYLE);
if (STYLE === 'noir') await document.fonts.load('400 100px "Special Elite"');
if (STYLE === 'news') await document.fonts.load('400 100px Anton');
if (!HUD.counter) document.getElementById('counter').style.display = 'none';

// ---------- utilities ----------
const INK = '#1a1a1a';
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => { t = clamp(t); return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };
const easeOut = t => 1 - Math.pow(1 - clamp(t), 3);
const backOut = t => { t = clamp(t); const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}
function shade(hex, amt) {
  const c = new THREE.Color(hex); const hsl = {}; c.getHSL(hsl);
  c.setHSL(hsl.h, hsl.s, clamp(hsl.l + amt)); return '#' + c.getHexString();
}
function plaster(color, seed = 1) {
  return canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = color; g.fillRect(0, 0, w, h); const r = rng(seed);
    for (let i = 0; i < 900; i++) {
      const x = r() * w, y = r() * h, s = 4 + r() * 22;
      g.fillStyle = r() < 0.5 ? 'rgba(0,0,0,0.028)' : 'rgba(255,255,255,0.05)';
      g.beginPath(); g.ellipse(x, y, s, s * (0.6 + r() * 0.6), r() * 3, 0, 7); g.fill();
    }
  }, [2, 1.4]);
}
function planks(color, seed = 2) {
  return canvasTex(512, 512, (g, w, h) => {
    const r = rng(seed); const n = 6;
    for (let i = 0; i < n; i++) {
      g.fillStyle = shade(color, (r() - 0.5) * 0.06); g.fillRect(0, i * h / n, w, h / n);
      for (let k = 0; k < 14; k++) { g.strokeStyle = 'rgba(0,0,0,0.05)'; g.lineWidth = 2; g.beginPath(); const y = i * h / n + r() * h / n; g.moveTo(0, y); g.bezierCurveTo(w * .3, y + 4, w * .6, y - 4, w, y); g.stroke(); }
      g.fillStyle = 'rgba(40,20,5,0.55)'; g.fillRect(0, i * h / n, w, 3);
      const off = r() * w; g.fillRect(off, i * h / n, 3, h / n);
    }
  }, [3, 4]);
}
function tiles(a, b, n = 8, repeat = [3, 2]) {
  return canvasTex(512, 512, (g, w, h) => {
    const s = w / n; g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { g.fillStyle = (b && (i + j) % 2) ? b : a; g.fillRect(i * s + 3, j * s + 3, s - 6, s - 6); }
  }, repeat);
}

// ---------- renderer / scene ----------
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gl'), antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(LANDSCAPE ? 42 : 58, W / H, 0.05, 100);
const hemi = new THREE.HemisphereLight(0xffffff, 0xd9c7a8, STYLE === 'noir' ? 0.75 : 2.1); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff3e0, STYLE === 'noir' ? 3.4 : 1.9);
if (STYLE === 'noir') sun.position.set(6, 5, 3); else sun.position.set(2.5, 6, 6); sun.target.position.set(0, 0.5, -1.5);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.radius = 6; sun.shadow.bias = -0.0005;
Object.assign(sun.shadow.camera, { left: -5, right: 5, top: 5, bottom: -3, near: 1, far: 20 });
scene.add(sun, sun.target);

const OUT = 0.028;
const outlineMat = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide });
const mat = (color, map) => new THREE.MeshLambertMaterial({ color: map ? 0xffffff : color, map });
function solid(geo, outGeo, color, map) {
  const g = new THREE.Group();
  const m = new THREE.Mesh(geo, mat(color, map)); m.castShadow = m.receiveShadow = true;
  g.add(m, new THREE.Mesh(outGeo, outlineMat)); return g;
}
const box = (w, h, d, c, map) => solid(new THREE.BoxGeometry(w, h, d), new THREE.BoxGeometry(w + 2 * OUT, h + 2 * OUT, d + 2 * OUT), c, map);
const cyl = (rt, rb, h, c, seg = 40) => solid(new THREE.CylinderGeometry(rt, rb, h, seg), new THREE.CylinderGeometry(rt + OUT, rb + OUT, h + 2 * OUT, seg), c);
const ball = (r, c) => solid(new THREE.SphereGeometry(r, 32, 20), new THREE.SphereGeometry(r + OUT, 32, 20), c);
const at = (o, x, y, z, ry = 0) => { o.position.set(x, y, z); o.rotation.y = ry; return o; };
function flat(w, h, tex, opts = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.02, ...opts }));
  return m;
}
function framed(w, h, tex, frameColor = '#8a5a35') {
  const g = new THREE.Group();
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshLambertMaterial({ map: tex })); p.position.z = 0.03; g.add(p);
  const t = 0.09;
  g.add(at(box(w + 2 * t, t, 0.08, frameColor), 0, h / 2 + t / 2, 0.02));
  g.add(at(box(w + 2 * t, t, 0.08, frameColor), 0, -h / 2 - t / 2, 0.02));
  g.add(at(box(t, h, 0.08, frameColor), -w / 2 - t / 2, 0, 0.02));
  g.add(at(box(t, h, 0.08, frameColor), w / 2 + t / 2, 0, 0.02));
  return g;
}
const outsideTex = canvasTex(512, 512, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#7cc4f2'); gr.addColorStop(0.6, '#cdeefc'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(255,255,255,0.9)'; [[120, 110, 60], [170, 100, 45], [380, 160, 50], [420, 150, 35]].forEach(([x, y, r]) => { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); });
  g.lineWidth = 6; g.strokeStyle = INK;
  g.fillStyle = '#5aa84a'; g.beginPath(); g.moveTo(0, 330); g.bezierCurveTo(150, 260, 300, 300, 512, 340); g.lineTo(512, 512); g.lineTo(0, 512); g.fill(); g.stroke();
  g.fillStyle = '#7cc35c'; g.beginPath(); g.moveTo(0, 420); g.bezierCurveTo(200, 360, 360, 430, 512, 400); g.lineTo(512, 512); g.lineTo(0, 512); g.fill(); g.stroke();
  [[350, 300], [395, 310]].forEach(([x, y]) => { g.fillStyle = '#3f8a3a'; g.beginPath(); g.ellipse(x, y - 60, 16, 70, 0, 0, 7); g.fill(); g.stroke(); });
});
function windowOn(w = 1.6, h = 1.4) {
  const g = framed(w, h, outsideTex, '#7a4b2a');
  g.add(at(box(w, 0.06, 0.08, '#7a4b2a'), 0, 0, 0.03));
  g.add(at(box(w + 0.45, 0.1, 0.3, '#7a4b2a'), 0, -h / 2 - 0.14, 0.12));
  return g;
}

// ---------- rooms ----------
function shell({ wallTex, floorTex, skirting = '#7a4b2a' }) {
  const g = new THREE.Group();
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 10), mat(0, floorTex)); floor.rotation.x = -Math.PI / 2; floor.position.z = 2; floor.receiveShadow = true; g.add(floor);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 4.4), mat(0, wallTex)); back.position.set(0, 2.2, -3); back.receiveShadow = true; g.add(back);
  for (const s of [-1, 1]) {
    const side = new THREE.Mesh(new THREE.PlaneGeometry(10, 4.4), mat(0, wallTex)); side.position.set(3.2 * s, 2.2, 2); side.rotation.y = -s * Math.PI / 2; side.receiveShadow = true; g.add(side);
    g.add(at(box(0.05, 0.2, 10, skirting), 3.17 * s, 0.1, 2));
    g.add(at(box(0.035, 4.4, 0.035, INK), 3.2 * s, 2.2, -3));
  }
  g.add(at(box(6.4, 0.2, 0.05, skirting), 0, 0.1, -2.97));
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 10), mat('#f4f1ea')); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, 4.4, 2); g.add(ceil);
  g.add(at(box(6.4, 0.08, 0.08, '#ffffff'), 0, 4.36, -2.96));
  return g;
}
function table() {
  const g = new THREE.Group();
  g.add(at(cyl(0.07, 0.1, 0.84, '#8a5a35'), 0, 0.42, 0));
  g.add(at(cyl(0.98, 0.98, 0.09, '#e39a5b'), 0, 0.86, 0));
  g.add(at(cyl(0.82, 0.82, 0.02, '#f3ead8'), 0, 0.915, 0));
  return at(g, 0, 0, 0.35);
}
const rooms = {
  bedroom() {
    const g = shell({ wallTex: plaster('#efe6d6', 3), floorTex: planks('#c98d55') });
    const bed = new THREE.Group();
    bed.add(at(box(1.8, 0.45, 3, '#8a5a35'), 0, 0.225, 0));
    bed.add(at(box(1.7, 0.25, 2.9, '#f7f4ee'), 0, 0.575, 0));
    bed.add(at(box(1.76, 0.1, 1.9, '#5b8fd6'), 0, 0.74, 0.5));
    bed.add(at(box(1.1, 0.2, 0.5, '#ffffff'), 0, 0.8, -1.1));
    bed.add(at(box(1.8, 1.3, 0.12, '#8a5a35'), 0, 0.65, -1.5));
    g.add(at(bed, -2.25, 0, -1.4));
    g.add(at(windowOn(), 3.18, 2.25, -0.6, -Math.PI / 2));
    const plant = new THREE.Group();
    plant.add(at(cyl(0.3, 0.22, 0.55, '#d0643c'), 0, 0.275, 0));
    [[0, 0.85, 0, 0.32], [-0.2, 1.1, 0.05, 0.25], [0.22, 1.05, -0.05, 0.27], [0, 1.35, 0, 0.22]].forEach(([x, y, z, r]) => plant.add(at(ball(r, '#4e9e48'), x, y, z)));
    g.add(at(plant, 2.4, 0, -2.3));
    const pic = canvasTex(256, 200, (c, w, h) => { c.fillStyle = '#fbe3a2'; c.fillRect(0, 0, w, h); c.fillStyle = '#e8774a'; c.beginPath(); c.arc(180, 60, 30, 0, 7); c.fill(); c.fillStyle = '#6aa65a'; c.strokeStyle = INK; c.lineWidth = 5; c.beginPath(); c.moveTo(0, h); c.lineTo(80, 70); c.lineTo(150, 150); c.lineTo(200, 110); c.lineTo(w, h); c.fill(); c.stroke(); });
    g.add(at(framed(1.0, 0.78, pic), 0.9, 2.55, -2.95));
    return g;
  },
  bathroom() {
    const g = shell({ wallTex: tiles('#bfe3ea', null, 8, [4, 3]), floorTex: tiles('#ffffff', '#5aa9c9', 8, [2, 3]), skirting: '#8fc6d3' });
    const mirrorTex = canvasTex(256, 320, (c, w, h) => { const gr = c.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#e9f7fb'); gr.addColorStop(1, '#a9d3e0'); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = 14; c.beginPath(); c.moveTo(60, 120); c.lineTo(120, 60); c.moveTo(70, 170); c.lineTo(150, 90); c.stroke(); });
    g.add(at(framed(1.2, 1.5, mirrorTex, '#e6e6e6'), -1.4, 2.35, -2.95));
    const sink = new THREE.Group();
    sink.add(at(box(1.3, 0.9, 0.6, '#ffffff'), 0, 0.45, 0));
    sink.add(at(cyl(0.38, 0.3, 0.12, '#f2f2f2'), 0, 0.96, 0.05));
    sink.add(at(cyl(0.04, 0.04, 0.3, '#b9c2c7'), 0, 1.1, -0.2));
    g.add(at(sink, -1.4, 0, -2.6));
    g.add(at(box(0.7, 1.0, 0.06, '#e05a5a'), 2.2, 2.0, -2.94));
    g.add(at(box(0.9, 0.06, 0.12, '#b9c2c7'), 2.2, 2.52, -2.92));
    return g;
  },
  kitchen() {
    const g = shell({ wallTex: plaster('#f5e5ad', 5), floorTex: tiles('#f4efe6', '#d65a4a', 6, [3, 5]) });
    const fridge = new THREE.Group();
    fridge.add(at(box(1.1, 2.5, 0.9, '#f3f6f7'), 0, 1.25, 0));
    fridge.add(at(box(1.12, 0.03, 0.03, INK), 0, 1.7, 0.47));
    fridge.add(at(box(0.06, 0.45, 0.08, '#b9c2c7'), 0.4, 2.05, 0.48));
    fridge.add(at(box(0.06, 0.45, 0.08, '#b9c2c7'), 0.4, 1.3, 0.48));
    g.add(at(fridge, -2.5, 0, -2.4));
    const counter = new THREE.Group();
    counter.add(at(box(2.6, 0.95, 0.7, '#6fa0c8'), 0, 0.475, 0));
    counter.add(at(box(2.7, 0.08, 0.78, '#f0ebe2'), 0, 0.99, 0));
    counter.add(at(cyl(0.22, 0.18, 0.3, '#d65a4a'), 0.6, 1.18, 0));
    g.add(at(counter, 1.6, 0, -2.6));
    g.add(at(windowOn(1.5, 1.1), 1.6, 2.45, -2.95));
    g.add(table());
    return g;
  },
  dentist() {
    const g = shell({ wallTex: plaster('#d4efe3', 7), floorTex: tiles('#d9dee2', '#c4cbd1', 6, [3, 5]), skirting: '#9ab3a9' });
    const chair = new THREE.Group();
    chair.add(at(box(1.5, 2.0, 0.2, '#2f9c95'), 0, 1.0, 0));
    chair.add(at(box(0.9, 0.5, 0.25, '#2f9c95'), 0, 2.2, 0.03));
    g.add(at(chair, 0, 0, -1.25));
    const lamp = new THREE.Group();
    lamp.add(at(cyl(0.03, 0.03, 1.4, '#b9c2c7'), 0, 0.7, 0));
    const head = cyl(0.32, 0.22, 0.18, '#f3f6f7'); head.rotation.x = Math.PI / 2.6; lamp.add(at(head, 0, 0, 0.12));
    const glow = new THREE.Mesh(new THREE.CircleGeometry(0.24, 32), new THREE.MeshBasicMaterial({ color: '#fff6c2' })); glow.rotation.x = Math.PI / 2.6 - Math.PI / 2; glow.position.set(0, -0.09, 0.2); lamp.add(glow);
    g.add(at(lamp, 0.9, 2.9, -0.3, -0.4));
    const tooth = canvasTex(256, 320, (c, w, h) => {
      c.fillStyle = '#fff8e8'; c.fillRect(0, 0, w, h); c.lineWidth = 8; c.strokeStyle = INK; c.fillStyle = '#ffffff';
      c.beginPath(); c.moveTo(60, 70); c.bezierCurveTo(60, 20, 120, 30, 128, 55); c.bezierCurveTo(136, 30, 196, 20, 196, 70); c.bezierCurveTo(200, 140, 175, 150, 170, 250); c.bezierCurveTo(165, 280, 140, 270, 135, 220); c.lineTo(121, 220); c.bezierCurveTo(116, 270, 91, 280, 86, 250); c.bezierCurveTo(81, 150, 56, 140, 60, 70); c.fill(); c.stroke();
      c.fillStyle = INK; c.beginPath(); c.arc(105, 100, 9, 0, 7); c.arc(151, 100, 9, 0, 7); c.fill(); c.beginPath(); c.lineWidth = 6; c.arc(128, 125, 20, 0.2, Math.PI - 0.2); c.stroke();
      c.font = '700 40px Fredoka'; c.textAlign = 'center'; c.fillStyle = '#2f9c95'; c.fillText('FLOSS!', 128, 310);
    });
    g.add(at(framed(0.85, 1.06, tooth, '#2f9c95'), -1.6, 2.45, -2.95));
    g.add(at(box(0.7, 0.05, 0.45, '#b9c2c7'), 1.5, 1.05, -1.6));
    g.add(at(cyl(0.03, 0.03, 1.05, '#b9c2c7'), 1.5, 0.52, -1.6));
    return g;
  },
  outdoor() {
    const g = new THREE.Group();
    const grass = canvasTex(256, 256, (c, w, h) => { c.fillStyle = '#7cc35c'; c.fillRect(0, 0, w, h); const r = rng(11); for (let i = 0; i < 500; i++) { c.fillStyle = r() < 0.5 ? 'rgba(0,60,0,0.08)' : 'rgba(255,255,200,0.08)'; c.fillRect(r() * w, r() * h, 3, 7); } }, [10, 10]);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), mat(0, grass)); grass.repeat.set(40, 40); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; g.add(ground);
    const path = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 60), mat('#e6d2a8')); path.rotation.x = -Math.PI / 2; path.position.set(0, 0.005, 0); path.receiveShadow = true; g.add(path);
    const r = rng(12);
    for (let i = 0; i < 18; i++) {
      const side = i % 2 ? 1 : -1, x = side * (2.5 + r() * 6), z = -2 - r() * 18;
      const tree = new THREE.Group();
      tree.add(at(cyl(0.12, 0.16, 1.4, '#8a5a35', 12), 0, 0.7, 0));
      tree.add(at(ball(0.8 + r() * 0.4, r() < 0.5 ? '#4e9e48' : '#5fb354'), 0, 1.9, 0));
      g.add(at(tree, x, 0, z));
    }
    const bench = new THREE.Group();
    bench.add(at(box(1.6, 0.08, 0.5, '#b0773f'), 0, 0.5, 0)); bench.add(at(box(1.6, 0.4, 0.08, '#b0773f'), 0, 0.8, -0.24));
    for (const x of [-0.7, 0.7]) bench.add(at(box(0.08, 0.5, 0.45, '#444'), x, 0.25, 0));
    g.add(at(bench, -1.9, 0, -1.6, 0.3));
    const house = new THREE.Group();
    house.add(at(box(3.4, 2.6, 2.4, '#f0d9b5'), 0, 1.3, 0));
    const roof = cyl(0.01, 2.5, 1.4, '#c4573f', 4); roof.rotation.y = Math.PI / 4; house.add(at(roof, 0, 3.3, 0));
    house.add(at(box(0.8, 1.4, 0.05, '#7a4b2a'), 0, 0.7, 1.22));
    g.add(at(house, 3.2, 0, -6));
    return g;
  },
  space() {
    const g = new THREE.Group();
    const rock = canvasTex(256, 256, (c, w, h) => { c.fillStyle = '#b57ad6'; c.fillRect(0, 0, w, h); const r = rng(21); for (let i = 0; i < 14; i++) { const x = r() * w, y = r() * h, s = 6 + r() * 20; c.fillStyle = 'rgba(60,20,90,0.25)'; c.beginPath(); c.ellipse(x, y, s, s * 0.6, 0, 0, 7); c.fill(); c.strokeStyle = 'rgba(30,10,50,0.5)'; c.lineWidth = 3; c.stroke(); } }, [8, 8]);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), mat(0, rock)); rock.repeat.set(30, 30); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; g.add(ground);
    const r = rng(22);
    for (let i = 0; i < 10; i++) { const k = ball(0.3 + r() * 0.7, '#9a62bd'); k.scale.y = 0.5; g.add(at(k, (r() - 0.5) * 14, 0, -3 - r() * 12)); }
    const planet = ball(2.2, '#5aa9e6'); g.add(at(planet, -6, 4.2, -20));
    const moon = ball(0.8, '#f2e6c9'); g.add(at(moon, 5, 3.6, -16));
    return g;
  },
  nightstreet() {
    const g = new THREE.Group();
    const tarmac = canvasTex(256, 256, (c, w, h) => { c.fillStyle = '#3b3d42'; c.fillRect(0, 0, w, h); const r = rng(41); for (let i = 0; i < 700; i++) { c.fillStyle = r() < 0.5 ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.06)'; c.fillRect(r() * w, r() * h, 2, 2); } }, [12, 12]);
    const road = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), mat(0, tarmac)); road.rotation.x = -Math.PI / 2; road.receiveShadow = true; g.add(road);
    for (let z = -20; z < 8; z += 2.2) { const d = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 1.1), mat('#f2f2f2')); d.rotation.x = -Math.PI / 2; d.position.set(0.9, 0.01, z); g.add(d); }
    const kerb = box(0.3, 0.18, 40, '#9a9a9a'); g.add(at(kerb, -2.6, 0.09, -6));
    const pave = new THREE.Mesh(new THREE.PlaneGeometry(4, 40), mat('#77787c')); pave.rotation.x = -Math.PI / 2; pave.position.set(-4.7, 0.18, -6); g.add(pave);
    const brick = canvasTex(512, 512, (c, w, h) => { c.fillStyle = '#5a2e26'; c.fillRect(0, 0, w, h); const r = rng(43); const bh = 32, bw = 96; for (let y = 0; y < h; y += bh) for (let x = -((y / bh) % 2) * bw / 2; x < w; x += bw) { c.fillStyle = shade('#8a4a3a', (r() - 0.5) * 0.12); c.fillRect(x + 3, y + 3, bw - 6, bh - 6); } }, [6, 3]);
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(40, 9), mat(0, brick)); wall.position.set(0, 4.5, -9); wall.receiveShadow = true; g.add(wall);
    const lamp = new THREE.Group();
    lamp.add(at(cyl(0.07, 0.1, 4.2, '#2a2a2a', 16), 0, 2.1, 0));
    lamp.add(at(box(0.9, 0.08, 0.08, '#2a2a2a'), 0.42, 4.15, 0));
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 12), new THREE.MeshBasicMaterial({ color: '#fff6d0' })); bulb.position.set(0.8, 3.98, 0); lamp.add(bulb);
    g.add(at(lamp, -2.9, 0, -2.2));
    const pool = new THREE.Mesh(new THREE.CircleGeometry(2.2, 40), new THREE.MeshBasicMaterial({ color: '#fff3c4', transparent: true, opacity: 0.22, depthWrite: false })); pool.rotation.x = -Math.PI / 2; pool.position.set(-2.1, 0.02, -2.2); g.add(pool);
    const puddle = new THREE.Mesh(new THREE.CircleGeometry(0.9, 32), new THREE.MeshBasicMaterial({ color: '#9fb0c0', transparent: true, opacity: 0.35, depthWrite: false })); puddle.scale.y = 0.45; puddle.rotation.x = -Math.PI / 2; puddle.position.set(1.4, 0.015, 0.8); g.add(puddle);
    return g;
  },
  void() {
    const g = new THREE.Group();
    const r = rng(9);
    for (let i = 0; i < 14; i++) {
      const cx = (r() - 0.5) * 10, cz = -5 + r() * 7;
      for (let j = 0; j < 4; j++) { const c = ball(0.3 + r() * 0.3, '#ffffff'); c.scale.y = 0.7; g.add(at(c, cx + (j - 1.5) * 0.4, -0.15 + (j % 2) * 0.15, cz + (r() - 0.5) * 0.3)); }
    }
    return g;
  },
};
const skyTex = canvasTex(64, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#7ec8f5'); gr.addColorStop(1, '#fde7c4'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
const starTex = canvasTex(1024, 1024, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0b0b2a'); gr.addColorStop(1, '#3a1f5c'); g.fillStyle = gr; g.fillRect(0, 0, w, h); const r = rng(31); for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(255,255,255,${0.4 + r() * 0.6})`; g.beginPath(); g.arc(r() * w, r() * h * 0.8, r() * 2.2, 0, 7); g.fill(); } });
const outdoorSky = canvasTex(64, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#6fbdf0'); gr.addColorStop(1, '#d8f1fd'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
const builtRooms = {};
function room(name) {
  if (!builtRooms[name]) { builtRooms[name] = (rooms[name] || rooms.bedroom)(); scene.add(builtRooms[name]); }
  for (const k in builtRooms) builtRooms[k].visible = k === name;
  scene.background = name === 'void' ? skyTex : name === 'space' || name === 'nightstreet' ? starTex : name === 'outdoor' ? outdoorSky : new THREE.Color('#222');
}

// ---------- Gary ----------
function drawGary(g, s) {
  const acc = new Set(s.acc || []);
  g.clearRect(0, 0, 512, 640);
  g.lineJoin = g.lineCap = 'round'; g.strokeStyle = INK;
  const skin = s.expr === 'sick' ? '#e3e2a8' : s.ghost ? '#f4f1ff' : '#fbd7b5';
  const hoodie = s.ghost ? '#e9e6ff' : '#f2a93b';
  // legs
  g.lineWidth = 10;
  for (const x of [205, 307]) { g.fillStyle = '#3b3f58'; g.beginPath(); g.roundRect(x - 22, 540, 44, 70, 12); g.fill(); g.stroke(); g.fillStyle = INK; g.beginPath(); g.ellipse(x + (x < 256 ? -8 : 8), 615, 34, 16, 0, 0, 7); g.fill(); }
  // arms
  for (const sgn of [-1, 1]) {
    const sx = 256 + sgn * 118, ex = 256 + sgn * 150;
    g.lineWidth = 46; g.strokeStyle = INK; g.beginPath(); g.moveTo(sx, 450); g.quadraticCurveTo(ex + sgn * 10, 500, ex, 545); g.stroke();
    g.lineWidth = 30; g.strokeStyle = hoodie; g.stroke();
    g.fillStyle = skin; g.strokeStyle = INK; g.lineWidth = 9; g.beginPath(); g.arc(ex, 555, 20, 0, 7); g.fill(); g.stroke();
  }
  // body
  g.fillStyle = hoodie; g.lineWidth = 11; g.strokeStyle = INK;
  g.beginPath(); g.moveTo(150, 570); g.bezierCurveTo(140, 470, 170, 420, 256, 415); g.bezierCurveTo(342, 420, 372, 470, 362, 570); g.quadraticCurveTo(256, 590, 150, 570); g.closePath(); g.fill(); g.stroke();
  g.lineWidth = 6; g.beginPath(); g.moveTo(232, 425); g.lineTo(226, 480); g.moveTo(280, 425); g.lineTo(286, 480); g.stroke();
  g.fillStyle = shade(hoodie, -0.1); g.beginPath(); g.roundRect(205, 500, 102, 46, 14); g.fill(); g.lineWidth = 6; g.stroke();
  // ears + head
  const hx = 256, hy = 265, hr = 150;
  g.lineWidth = 11; g.fillStyle = skin;
  for (const sgn of [-1, 1]) { g.beginPath(); g.arc(hx + sgn * 146, hy + 18, 26, 0, 7); g.fill(); g.stroke(); }
  g.beginPath(); g.arc(hx, hy, hr, 0, 7); g.fill(); g.stroke();
  // hair: messy brown cap with a cowlick
  g.fillStyle = s.ghost ? '#cfc8ef' : '#5a3a22';
  g.beginPath(); g.arc(hx, hy, hr, Math.PI * 1.06, Math.PI * 1.94);
  const zz = [[392, 205], [360, 188], [338, 212], [300, 176], [270, 205], [236, 172], [206, 204], [172, 182], [150, 214], [120, 205]];
  zz.forEach(([x, y]) => g.lineTo(x, y)); g.closePath(); g.fill(); g.lineWidth = 11; g.stroke();
  g.beginPath(); g.moveTo(250, 117); g.bezierCurveTo(240, 70, 290, 60, 285, 95); g.lineWidth = 11; g.stroke();
  // cheeks
  if (!acc.has('mask') && !acc.has('mask_dirty') && !s.ghost) { g.fillStyle = 'rgba(240,110,110,0.45)'; for (const x of [172, 340]) { g.beginPath(); g.ellipse(x, 315, 24, 15, 0, 0, 7); g.fill(); } }
  // eyes + brows
  const E = [[200, 262], [312, 262]];
  g.fillStyle = INK; g.strokeStyle = INK; g.lineWidth = 10;
  const expr = s.blink && ['neutral', 'worried', 'sick', 'happy'].includes(s.expr) ? 'blink' : s.expr;
  for (const [i, [x, y]] of E.entries()) {
    const sgn = i ? 1 : -1;
    g.beginPath();
    if (expr === 'happy') { g.arc(x, y + 8, 20, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }
    else if (expr === 'blink') { g.moveTo(x - 18, y); g.lineTo(x + 18, y); g.stroke(); }
    else if (expr === 'dead') { g.moveTo(x - 18, y - 18); g.lineTo(x + 18, y + 18); g.moveTo(x + 18, y - 18); g.lineTo(x - 18, y + 18); g.stroke(); }
    else if (expr === 'shocked') { g.fillStyle = '#fff'; g.arc(x, y, 30, 0, 7); g.fill(); g.lineWidth = 8; g.stroke(); g.fillStyle = INK; g.beginPath(); g.arc(x, y + 2, 9, 0, 7); g.fill(); g.lineWidth = 9; g.beginPath(); g.moveTo(x - 24, y - 56); g.quadraticCurveTo(x, y - 70, x + 24, y - 56); g.stroke(); }
    else if (expr === 'sick') { g.ellipse(x, y + 4, 13, 14, 0, 0, Math.PI); g.fill(); g.beginPath(); g.moveTo(x - 20, y + 2); g.lineTo(x + 20, y + 2); g.stroke(); }
    else { g.ellipse(x, y, 13, 19, 0, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(x + 4, y - 7, 5, 0, 7); g.fill(); g.fillStyle = INK; }
    if (expr === 'worried') { g.lineWidth = 9; g.beginPath(); g.moveTo(x - sgn * 22, y - 34); g.lineTo(x + sgn * 22, y - 48 + 28 * (i ? 0 : 0)); g.stroke(); }
  }
  if (expr === 'worried') { g.fillStyle = '#7cc8f0'; g.lineWidth = 6; g.beginPath(); g.moveTo(385, 170); g.quadraticCurveTo(405, 205, 395, 215); g.arc(385, 210, 12, 0.3, Math.PI + 0.6); g.closePath(); g.fill(); g.stroke(); }
  // mouth (only if no mask)
  const masked = acc.has('mask') || acc.has('mask_dirty');
  if (!masked) {
    g.lineWidth = 9; g.beginPath();
    if (s.mouth > 0.1) { g.fillStyle = '#7a2a2a'; g.ellipse(hx, 345, 26, 10 + 18 * s.mouth, 0, 0, 7); g.fill(); g.stroke(); }
    else if (expr === 'happy') { g.arc(hx, 320, 38, 0.25, Math.PI - 0.25); g.stroke(); }
    else if (expr === 'shocked') { g.fillStyle = '#7a2a2a'; g.ellipse(hx, 350, 20, 26, 0, 0, 7); g.fill(); g.stroke(); }
    else if (expr === 'dead') { g.moveTo(hx - 30, 350); g.quadraticCurveTo(hx, 335, hx + 30, 350); g.stroke(); g.fillStyle = '#e66a7a'; g.beginPath(); g.ellipse(hx + 12, 362, 12, 16, 0, 0, 7); g.fill(); g.lineWidth = 6; g.stroke(); }
    else { g.moveTo(hx - 22, 345); g.lineTo(hx + 22, 345); g.stroke(); }
  }
  // spots
  if (acc.has('spots')) {
    g.fillStyle = '#e04848';
    [[170, 225], [340, 215], [300, 190], [140, 300], [372, 300], [230, 205], [160, 330], [356, 330]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 8, 0, 7); g.fill(); });
  }
  // mask
  if (masked) {
    const dirty = acc.has('mask_dirty');
    g.strokeStyle = INK; g.lineWidth = 6; g.beginPath(); g.moveTo(140, 300); g.quadraticCurveTo(115, 300, 112, 285); g.moveTo(372, 300); g.quadraticCurveTo(397, 300, 400, 285);
    g.moveTo(140, 380); g.quadraticCurveTo(110, 370, 110, 300); g.moveTo(372, 380); g.quadraticCurveTo(402, 370, 402, 300); g.stroke();
    g.fillStyle = dirty ? '#a8a467' : '#9ad8f2'; g.lineWidth = 10;
    g.beginPath(); g.moveTo(140, 298); g.quadraticCurveTo(256, 280, 372, 298); g.quadraticCurveTo(380, 360, 360, 392); g.quadraticCurveTo(256, 420, 152, 392); g.quadraticCurveTo(132, 360, 140, 298); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = dirty ? '#7d7840' : '#5fb6db'; g.lineWidth = 6;
    for (const y of [325, 350, 375]) { g.beginPath(); g.moveTo(150, y); g.quadraticCurveTo(256, y - 12, 362, y); g.stroke(); }
    if (dirty) { const r = rng(4); for (let i = 0; i < 14; i++) { g.fillStyle = r() < 0.5 ? 'rgba(90,70,30,0.6)' : 'rgba(80,150,60,0.7)'; g.beginPath(); g.arc(160 + r() * 190, 305 + r() * 90, 5 + r() * 9, 0, 7); g.fill(); } }
  }
  if (s.ghost) { g.strokeStyle = '#f2c230'; g.lineWidth = 14; g.beginPath(); g.ellipse(hx, 70, 95, 22, 0, 0, 7); g.stroke(); g.strokeStyle = INK; g.lineWidth = 4; g.beginPath(); g.ellipse(hx, 70, 104, 30, 0, 0, 7); g.stroke(); }
  if (expr === 'sick') { g.fillStyle = 'rgba(120,180,60,0.18)'; g.beginPath(); g.arc(hx, hy, hr - 6, 0, 7); g.fill(); }
}
const garyCanvas = document.createElement('canvas'); garyCanvas.width = 512; garyCanvas.height = 640;
const garyTex = new THREE.CanvasTexture(garyCanvas); garyTex.colorSpace = THREE.SRGBColorSpace; garyTex.anisotropy = 8;
const garyGeo = new THREE.PlaneGeometry(2.0, 2.5); garyGeo.translate(0, 1.25, 0);
const garyMat = new THREE.MeshBasicMaterial({ map: garyTex, transparent: true, alphaTest: 0.05 });
const gary = new THREE.Mesh(garyGeo, garyMat);
gary.castShadow = true;
gary.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: garyTex, alphaTest: 0.5 });
const garyRoot = new THREE.Group(); garyRoot.add(gary); scene.add(garyRoot);
const blob = new THREE.Mesh(new THREE.CircleGeometry(0.6, 32), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.18, depthWrite: false }));
blob.rotation.x = -Math.PI / 2; blob.scale.y = 0.45; blob.position.y = 0.005; scene.add(blob);
let garyKey = '';
function setGary(state) {
  const key = JSON.stringify(state);
  if (key === garyKey) return;
  garyKey = key; drawGary(garyCanvas.getContext('2d'), state); garyTex.needsUpdate = true;
}
const GARY_Z = -0.8;
const MOUTH = new THREE.Vector3(0, 2.5 * (1 - 350 / 640), GARY_Z);

// ---------- props & fx ----------
const props = new THREE.Group(); scene.add(props);
function soup() {
  const g = new THREE.Group();
  g.add(at(cyl(0.34, 0.22, 0.2, '#ffffff'), 0, 0.1, 0));
  g.add(at(cyl(0.31, 0.31, 0.01, '#e8913a'), 0, 0.19, 0));
  const a = new THREE.Vector3(0.08, 0.15, 0), b = new THREE.Vector3(0, MOUTH.y - 0.94, GARY_Z - 0.35 + 0.05);
  const len = a.distanceTo(b); const straw = cyl(0.025, 0.025, len, '#f25c8a', 12);
  straw.position.copy(a.clone().add(b).multiplyScalar(0.5));
  straw.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  g.add(straw);
  return at(g, 0, 0.94, 0.35);
}
const sandwichTex = canvasTex(256, 200, (c) => {
  c.lineJoin = 'round'; c.strokeStyle = INK; c.lineWidth = 8;
  const layer = (y, col, h) => { c.fillStyle = col; c.beginPath(); c.roundRect(20, y, 216, h, 18); c.fill(); c.stroke(); };
  layer(120, '#e8b96a', 50); c.fillStyle = '#6cc04a'; c.beginPath(); for (let x = 20; x <= 236; x += 24) c.lineTo(x, 112 + (x / 24 % 2) * 14); c.lineTo(236, 125); c.lineTo(20, 125); c.fill(); c.stroke();
  layer(92, '#e85a4a', 24); layer(78, '#f6d34a', 18); layer(26, '#e8b96a', 54);
});
const waterTex = canvasTex(160, 240, (c, w, h) => {
  c.lineWidth = 8; c.strokeStyle = INK; c.lineJoin = 'round';
  c.fillStyle = 'rgba(210,240,255,0.55)'; c.beginPath(); c.moveTo(20, 20); c.lineTo(140, 20); c.lineTo(122, 225); c.lineTo(38, 225); c.closePath(); c.fill();
  c.fillStyle = '#5cc0f2'; c.beginPath(); c.moveTo(29, 80); c.lineTo(131, 80); c.lineTo(122, 225); c.lineTo(38, 225); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(20, 20); c.lineTo(140, 20); c.lineTo(122, 225); c.lineTo(38, 225); c.closePath(); c.stroke();
  c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineWidth = 10; c.beginPath(); c.moveTo(48, 100); c.lineTo(54, 190); c.stroke();
});
function water() { const m = flat(0.32, 0.48, waterTex); m.position.set(0.62, 1.05, GARY_Z + 0.3); return m; }
function sandwich() { const m = flat(0.75, 0.59, sandwichTex); m.position.set(0.15, 1.24, 0.35); return m; }
function textSprite(txt, color, size = 0.32) {
  const t = canvasTex(256, 128, (c, w, h) => { c.font = '700 84px Fredoka'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 16; c.strokeStyle = INK; c.lineJoin = 'round'; c.strokeText(txt, w / 2, h / 2); c.fillStyle = color; c.fillText(txt, w / 2, h / 2); });
  return flat(size * 2, size, t, { depthTest: false });
}
const fx = new THREE.Group(); scene.add(fx);
const co2 = []; for (let i = 0; i < 4; i++) { const m = textSprite(i % 2 ? 'CO₂' : 'O₂', i % 2 ? '#e0e0e0' : '#7cd0ff', 0.45); m.renderOrder = 5; co2.push(m); fx.add(m); }
const flyTex = canvasTex(64, 64, (c) => { c.fillStyle = 'rgba(220,240,255,0.9)'; c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.ellipse(22, 20, 12, 8, -0.5, 0, 7); c.fill(); c.stroke(); c.beginPath(); c.ellipse(42, 20, 12, 8, 0.5, 0, 7); c.fill(); c.stroke(); c.fillStyle = INK; c.beginPath(); c.arc(32, 36, 11, 0, 7); c.fill(); });
const flies = []; for (let i = 0; i < 5; i++) { const m = flat(0.16, 0.16, flyTex); flies.push(m); fx.add(m); }
const stinkTex = canvasTex(64, 128, (c) => { c.strokeStyle = '#8fbf3f'; c.lineWidth = 8; c.lineCap = 'round'; c.beginPath(); c.moveTo(32, 120); for (let y = 120; y > 10; y -= 4) c.lineTo(32 + Math.sin(y / 14) * 14, y); c.stroke(); });
const stinks = []; for (let i = 0; i < 3; i++) { const m = flat(0.18, 0.36, stinkTex, { opacity: 0.8 }); stinks.push(m); fx.add(m); }

// ---------- captions ----------
const $ = id => document.getElementById(id);
const cardEl = $('card'), cardTitle = $('cardTitle'), cardSub = $('cardSub');
const capEl = $('caption'), labelEl = $('label'), deathsEl = $('deaths'), counterEl = $('counter'), flashEl = $('flash'), redEl = $('redflash');
const groups = [];
timeline.beats.forEach(b => {
  let cur = null;
  b.words.forEach((w, i) => {
    const [maxW, maxC] = STYLE === 'noir' ? [5, 24] : [3, 13];
    if (!cur || cur.words.length >= maxW || cur.speaker !== w.speaker || cur.chars + w.w.length > maxC) { cur = { words: [], times: [], speaker: w.speaker, chars: 0, s: w.s }; groups.push(cur); }
    cur.words.push(w.w); cur.times.push([w.s, w.e]); cur.chars += w.w.length + 1; cur.e = w.e;
    if (/[.,!?;:]$/.test(w.w)) cur = null;
  });
});
function captionAt(t) {
  for (let i = 0; i < groups.length; i++) {
    const g = groups[i], next = groups[i + 1];
    const end = Math.min(next ? next.s : Infinity, g.e + 0.35);
    if (t >= g.s - 0.04 && t < end) return g;
  }
  return null;
}

// ---------- camera paths ----------
const CAMS = {
  push: [[0, 1.95, 6.2], [0, 1.75, 4.5], [0, 1.25, -1]],
  face: [[0.35, 1.7, 2.3], [0.05, 1.6, 1.75], [0, 1.4, GARY_Z]],
  table: [[0.5, 1.95, 3.3], [0.1, 1.8, 2.6], [0, 1.3, GARY_Z]],
  pan: [[-1.3, 1.85, 4.6], [1.0, 1.75, 4.1], [0, 1.2, GARY_Z]],
  wide: [[0, 1.6, 6.4], [0, 1.6, 5.6], [0, 1.4, -1]],
  orbit: [[-3.5, 2.2, 4.5], [3.5, 2.0, 4.5], [0, 1.2, GARY_Z]],
  low: [[0.6, 0.6, 3.6], [0.2, 0.7, 2.8], [0, 1.5, GARY_Z]],
};

// ---------- main ----------
const beats = script.beats.map((b, i) => ({ ...b, ...timeline.beats[i] }));
const totalDeaths = t => (script.deathsBefore || 0) + beats.filter(b => b.deathAt != null && t >= b.deathAt).length;

window.DURATION = timeline.duration;
window.renderFrame = (t) => {
  let bi = beats.findIndex(b => t < b.end); if (bi < 0) bi = beats.length - 1;
  const b = beats[bi]; const lt = t - b.start; const dur = b.end - b.start; const p = clamp(lt / dur);
  room(b.scene);

  // gary state
  const st = { expr: b.gary?.expr || 'neutral', acc: b.gary?.acc || [], ghost: b.gary?.pose === 'ghost', blink: false, mouth: 0 };
  st.blink = (t % 3.1) < 0.12;
  const speaking = b.words.find(w => w.speaker === 'gary' && t >= w.s && t <= w.e);
  if (speaking) st.mouth = 0.5 + 0.5 * Math.sin(t * 38);
  let tilt = 0, shake = 0;
  if (b.deathAt != null && t >= b.deathAt - 0.55) {
    if (t < b.deathAt) { st.expr = 'shocked'; shake = 0.04; }
    else { st.expr = 'dead'; tilt = -0.42 * backOut((t - b.deathAt) / 0.35); }
  }
  setGary(st);
  const bob = st.ghost ? 0.12 * Math.sin(t * 2.2) + 0.35 : 0;
  garyRoot.position.set(Math.sin(t * 60) * shake, bob, GARY_Z);
  garyRoot.rotation.z = tilt + (st.ghost ? 0.05 * Math.sin(t * 1.7) : 0.02 * Math.sin(t * 2.1));
  gary.scale.set(1, 1 + 0.018 * Math.sin(t * 4.2) + (speaking ? 0.03 * Math.sin(t * 30) : 0), 1);
  garyMat.opacity = st.ghost ? 0.85 : 1; garyMat.transparent = true;
  blob.visible = !st.ghost; blob.position.set(0, 0.005, GARY_Z + 0.05);

  // props
  props.clear();
  for (const pr of b.props || []) {
    if (pr.type === 'soup') props.add(soup());
    if (pr.type === 'water') { const m = water(); m.position.y += 0.03 * Math.sin(t * 3); props.add(m); }
    if (pr.type === 'sandwich') {
      const m = sandwich(); const lastE = b.words[b.words.length - 1].e; const k = ease((t - (b.start + (lastE - b.start) * 0.55)) / ((lastE - b.start) * 0.45));
      m.position.lerp(new THREE.Vector3(0.02, MOUTH.y - 0.05, GARY_Z + 0.25), k); m.rotation.z = -0.25 * k; props.add(m);
    }
  }

  // fx
  const showCo2 = b.fx === 'co2';
  co2.forEach((m, i) => {
    m.visible = showCo2; if (!showCo2) return;
    const ph = ((lt * 0.55 + i / co2.length) % 1); const out = i % 2 === 1; const k = out ? ph : 1 - ph;
    const ang = [0.5, 2.6, -0.4, 3.6][i];
    m.position.set(MOUTH.x + Math.cos(ang) * (0.35 + k * 1.2), MOUTH.y + Math.sin(ang) * 0.5 * k + 0.05, GARY_Z + 0.5 + k * 0.4);
    m.material.opacity = Math.sin(ph * Math.PI); m.quaternion.copy(camera.quaternion);
  });
  const fl = (b.gary?.acc || []).includes('flies');
  flies.forEach((m, i) => { m.visible = fl; if (!fl) return; const a = t * (2.2 + i * 0.4) + i * 1.3; m.position.set(Math.cos(a) * (0.75 + 0.1 * i), 1.55 + Math.sin(a * 1.7) * 0.4, GARY_Z + Math.sin(a) * 0.35 + 0.2); m.quaternion.copy(camera.quaternion); });
  stinks.forEach((m, i) => { m.visible = fl; if (!fl) return; const ph = (t * 0.6 + i / 3) % 1; m.position.set(-0.45 + i * 0.45, 1.3 + ph * 0.9, GARY_Z + 0.2); m.material.opacity = Math.sin(ph * Math.PI) * 0.85; m.quaternion.copy(camera.quaternion); });

  // camera
  const [a, c, look] = CAMS[b.camera] || CAMS.push;
  const k = ease(p);
  camera.position.set(lerp(a[0], c[0], k) + 0.03 * Math.sin(t * 0.9), lerp(a[1], c[1], k) + 0.02 * Math.sin(t * 1.3), lerp(a[2], c[2], k));
  if (b.deathAt != null && t >= b.deathAt) { const s = 0.06 * Math.exp(-(t - b.deathAt) * 6); camera.position.x += Math.sin(t * 90) * s; camera.position.y += Math.cos(t * 77) * s; }
  camera.lookAt(look[0], look[1] + (st.ghost ? 0.3 : 0), look[2]);
  gary.rotation.y = Math.atan2(camera.position.x, camera.position.z - GARY_Z) * 0.6;

  // HUD
  const d = totalDeaths(t); deathsEl.textContent = d;
  const lastDeath = beats.filter(x => x.deathAt != null && t >= x.deathAt).map(x => x.deathAt).pop();
  const since = lastDeath != null ? t - lastDeath : 99;
  const cs = since < 0.5 ? 1 + 0.45 * Math.sin(clamp(since / 0.5) * Math.PI) : 1;
  const finalBoost = b.scene === 'void' ? 1.25 : 1;
  counterEl.style.transform = LANDSCAPE ? `scale(${cs})` : `translateX(-50%) scale(${cs * finalBoost})`;
  redEl.style.opacity = since < 0.6 ? 0.45 * (1 - since / 0.6) : 0;
  flashEl.style.opacity = bi > 0 && lt < 0.12 ? 0.55 * (1 - lt / 0.12) : 0;

  const lowerTxt = document.querySelector('#lower .txt');
  if (STYLE === 'news') {
    const lab = b.hook ? '' : (b.label || '');
    const lowerEl = $('lower');
    lowerEl.style.opacity = lab ? 1 : 0;
    lowerTxt.innerHTML = lab.replace(/\*([^*]+)\*/g, '<span class="hot">$1</span>');
    lowerEl.style.transform = `scaleX(${lerp(0.2, 1, backOut(lt / 0.3))})`;
    const tk = $('ticker').firstChild; tk.textContent = (script.ticker || '') + '     ' + (script.ticker || '');
    const tw = tk.scrollWidth / 2 || 1; tk.style.transform = `translateX(${-((t * 230) % tw)}px)`;
    $('live').style.opacity = (t % 1.2) < 0.85 ? 1 : 0.55;
  }
  if (STYLE === 'noir') {
    const gc = $('grain'), gx = gc.getContext('2d'); const id = gx.createImageData(gc.width, gc.height); const r = rng(Math.floor(t * 30) + 1);
    for (let i = 0; i < id.data.length; i += 4) { const v = r() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
    gx.putImageData(id, 0, 0);
    const fr = rng(Math.floor(t * 12) + 7)(); $('gl').style.opacity = 0.93 + 0.07 * fr;
  }
  if (b.label) {
    labelEl.innerHTML = b.label.replace(/\*([^*]+)\*/g, '<span class="hot">$1</span>');
    labelEl.className = 'outlined' + (b.hook ? ' hook' : '');
    const pop = backOut(lt / 0.3);
    const shrink = b.hook ? 0 : ease((lt - 1.1) / 0.35);
    labelEl.style.opacity = clamp(lt / 0.08);
    labelEl.style.transform = `translateY(${lerp(0, -40, shrink)}px) scale(${lerp(1.5, 1, pop) * lerp(1, 0.55, shrink) * (b.hook ? 1 + 0.03 * Math.sin(t * 7) : 1)})`;
  } else labelEl.style.opacity = 0;

  if (b.card) {
    cardTitle.textContent = b.card.title || ''; cardSub.textContent = b.card.subtitle || '';
    const fadeIn = clamp(lt / 0.25), fadeOut = clamp((dur - lt) / 0.25);
    cardEl.style.opacity = Math.min(fadeIn, fadeOut);
    cardTitle.style.transform = `scale(${lerp(1.3, 1, backOut(lt / 0.4))})`;
  } else cardEl.style.opacity = 0;

  const g = captionAt(t);
  if (g) {
    capEl.className = 'outlined' + (g.speaker === 'gary' ? ' gary' : '');
    if (STYLE === 'noir') {
      // typewriter: letters appear across the first 60% of the group's spoken time
      const full = g.words.join(' '); const n = Math.ceil(full.length * clamp((t - g.s) / Math.max(0.2, (g.e - g.s) * 0.6)));
      capEl.innerHTML = '<span class="box">' + full.slice(0, Math.max(1, n)).replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</span>';
      capEl.style.transform = 'none';
    } else if (STYLE === 'news') {
      capEl.innerHTML = g.words.map((w, i) => `<span class="w${t >= g.times[i][0] - 0.03 && (i === g.words.length - 1 || t < g.times[i + 1][0] - 0.03) ? ' on' : ''}">${w.replace(/</g, '&lt;')}</span>`).join(' ');
      capEl.style.transform = `scale(${lerp(1.12, 1, easeOut((t - g.s) / 0.1))})`;
    } else {
      capEl.textContent = g.words.join(' ');
      capEl.style.transform = `scale(${lerp(1.22, 1, easeOut((t - g.s) / 0.12))})`;
    }
    capEl.style.opacity = 1;
  } else capEl.style.opacity = 0;

  renderer.render(scene, camera);
};
// warm up every room once so first frames of each beat do not stall
for (const b of beats) room(b.scene);
window.READY = true;
