// "diorama" style for Gary Tries It long-form (landscape 1920x1080). Soft, warmly lit miniature
// island sets (physically based materials, image-based light, soft shadows), depth of field and
// bloom, a smoother rigged Gary, plus flat 2D infographic inserts (web/diorama-inserts.js).
// Same page contract as the other styles: window.renderFrame(t), window.DURATION, window.READY.
// Everything is a pure function of t (no per-frame state), so render workers can split the video.
//
// Script vocabulary for this style:
//   scene: tanis (Cretaceous riverbank island), burrow (cutaway of an underground den), today (badlands dig)
//   phase (tanis): calm, shake, surge, glassrain, glow, fires, dark, cold, recovery
//   gary: { pose, expr }  pose: stand, point, lookup, shelter, wobble, run, cold, wave, critter (Gary as a tiny mammal)
//                         expr: happy, neutral, worried, shocked, sick
//   camera: wide, push, face, low, orbit, crane, crane_up, dolly, truck
//   dinos: true -> herd on the far bank (also shown in calm/shake/surge/glassrain/glow phases)
//   insert: spring, map, scale, gills, debate (step 1|2), foodchain, extinction, timeline  (full-frame flat graphics)
//   card: { title, subtitle }  chapter card over a blurred wide shot
//   sfx: rumble | boom (pipeline/mix.py)
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { drawInsert } from './diorama-inserts.js';

const W = 1920, H = 1080;
const QS = new URLSearchParams(location.search);
const ep = QS.get('ep');
const script = await (await fetch(`/episodes/${ep}/script.json`)).json();
const timeline = await (await fetch(`/episodes/${ep}/timeline.json`)).json();
await Promise.all(['600 40px Poppins', '800 40px Poppins', '600 40px Fredoka'].map(f => document.fonts.load(f)));

// ---------- utilities ----------
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => { t = clamp(t); return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };
const easeOut = t => 1 - Math.pow(1 - clamp(t), 3);
const V = (x, y, z) => new THREE.Vector3(x, y, z);
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const hashf = (i, s = 1) => { const r = rng(i * 7919 + s * 104729); r(); return r(); };
const at = (o, x, y, z, rx = 0, ry = 0, rz = 0, s = 1) => { o.position.set(x, y, z); o.rotation.set(rx, ry, rz); if (typeof s === 'number') o.scale.setScalar(s); else o.scale.set(...s); return o; };
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const radialTex = (inner, outer) => canvasTex(128, 128, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, inner); gr.addColorStop(1, outer); g.fillStyle = gr; g.fillRect(0, 0, w, h); });

// ---------- renderer ----------
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setSize(W, H, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
const camera = new THREE.PerspectiveCamera(35, W / H, 0.05, 400);

// materials: soft clay-like physical shading. Shared per colour; vegetation/ground are tinted by phase.
const MATS = new Map();
function M(color, o = {}) {
  const key = color + JSON.stringify(o);
  if (!MATS.has(key)) {
    const m = new THREE.MeshPhysicalMaterial({ color, roughness: 0.6, clearcoat: 0.12, clearcoatRoughness: 0.5, sheen: 0.35, sheenColor: new THREE.Color('#fff0dc'), ...o });
    m.userData.base = new THREE.Color(color); MATS.set(key, m);
  }
  return MATS.get(key);
}
const tintable = { veg: new Set(), ground: new Set() };
const VM = (c, o) => { const m = M(c, o); tintable.veg.add(m); return m; };
const GM = (c, o) => { const m = M(c, o); tintable.ground.add(m); return m; };
function mesh(geo, mat) { const m = new THREE.Mesh(geo, typeof mat === 'string' ? M(mat) : mat); m.castShadow = m.receiveShadow = true; return m; }
const sph = (r, c, ws = 32, hs = 24) => mesh(new THREE.SphereGeometry(r, ws, hs), c);
const cap = (r, len, c) => mesh(new THREE.CapsuleGeometry(r, len, 8, 20), c);
const cyl = (rt, rb, h, c, seg = 24) => mesh(new THREE.CylinderGeometry(rt, rb, h, seg), c);
const cone = (r, h, c, seg = 20) => mesh(new THREE.ConeGeometry(r, h, seg), c);
function hang(geo, len) { geo.translate(0, -len / 2, 0); return geo; } // pivot at the top

// ======================================================================
// Gary v2: smooth, rigged (hips > spine > chest > neck > head; shoulders > elbows; hips > knees)
// ======================================================================
const SKIN = '#f1c19a', HAIR = '#5a3a22', TOP = '#f29a2e', TOP2 = '#d9821f', BOTTOM = '#384062', SHOE = '#f6f4f0';
function makeGary() {
  const j = {}, G = () => new THREE.Group();
  const root = G();
  j.hips = G(); j.hips.position.y = 0.86; root.add(j.hips);
  j.hips.add(at(mesh(new THREE.SphereGeometry(0.19, 32, 20), BOTTOM), 0, 0.02, 0, 0, 0, 0, [1, 0.7, 0.85]));
  // legs
  for (const s of [-1, 1]) {
    const th = G(); th.position.set(s * 0.1, 0, 0); j.hips.add(th); j['thigh' + s] = th;
    th.add(mesh(hang(new THREE.CapsuleGeometry(0.085, 0.3, 8, 20), 0.38), BOTTOM));
    const sh = G(); sh.position.y = -0.4; th.add(sh); j['shin' + s] = sh;
    sh.add(mesh(hang(new THREE.CapsuleGeometry(0.075, 0.3, 8, 20), 0.36), BOTTOM));
    const ft = G(); ft.position.y = -0.4; sh.add(ft);
    ft.add(at(mesh(new THREE.SphereGeometry(0.1, 28, 18), SHOE), 0, -0.02, 0.05, 0, 0, 0, [0.95, 0.55, 1.55]));
    ft.add(at(mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.03, 24), '#c9c2b8'), 0, -0.065, 0.05, 0, 0, 0, [1, 1, 1.6]));
  }
  // torso (hoodie)
  j.spine = G(); j.spine.position.y = 0.08; j.hips.add(j.spine);
  j.spine.add(at(mesh(new THREE.CapsuleGeometry(0.205, 0.26, 10, 32), TOP), 0, 0.2, 0, 0, 0, 0, [1, 1, 0.82]));
  j.spine.add(at(mesh(new THREE.TorusGeometry(0.19, 0.035, 12, 40), TOP2), 0, 0.0, 0, Math.PI / 2, 0, 0, [1, 0.82, 1])); // hem
  j.spine.add(at(mesh(new THREE.BoxGeometry(0.24, 0.1, 0.03), TOP2), 0, 0.12, 0.165, -0.12)); // pocket
  j.chest = G(); j.chest.position.y = 0.4; j.spine.add(j.chest);
  j.chest.add(at(mesh(new THREE.TorusGeometry(0.11, 0.055, 14, 32), TOP), 0, 0.04, -0.06, Math.PI / 2 - 0.45, 0, 0)); // hood
  for (const s of [-1, 1]) j.chest.add(at(cyl(0.008, 0.008, 0.14, '#fff6e6', 8), s * 0.045, -0.04, 0.16, 0.2)); // drawstrings
  // arms
  for (const s of [-1, 1]) {
    const sh = G(); sh.position.set(s * 0.25, 0.0, 0); j.chest.add(sh); j['arm' + s] = sh;
    sh.add(sph(0.08, TOP));
    sh.add(mesh(hang(new THREE.CapsuleGeometry(0.065, 0.2, 8, 20), 0.27), TOP));
    const el = G(); el.position.y = -0.28; sh.add(el); j['elbow' + s] = el;
    el.add(mesh(hang(new THREE.CapsuleGeometry(0.06, 0.18, 8, 20), 0.25), TOP));
    el.add(at(mesh(new THREE.TorusGeometry(0.055, 0.02, 10, 24), TOP2), 0, -0.24, 0, Math.PI / 2));
    const hand = sph(0.062, SKIN); hand.position.y = -0.3; hand.scale.set(0.9, 1.1, 0.8); el.add(hand);
    const thumb = cap(0.022, 0.04, SKIN); thumb.position.set(-s * 0.05, -0.28, 0.03); thumb.rotation.z = s * 0.6; el.add(thumb);
  }
  // head
  j.neck = G(); j.neck.position.y = 0.08; j.chest.add(j.neck);
  j.neck.add(cyl(0.07, 0.08, 0.12, SKIN));
  j.head = G(); j.head.position.y = 0.3; j.neck.add(j.head);
  const R = 0.255;
  j.head.add(at(sph(R, SKIN, 48, 36), 0, 0, 0, 0, 0, 0, [1, 1.03, 0.97]));
  j.head.add(at(sph(R * 0.33, SKIN), 0, -R * 0.55, R * 0.42, 0, 0, 0, [1.5, 0.9, 1])); // jaw/cheeks fill
  for (const s of [-1, 1]) { const ear = sph(R * 0.2, SKIN); ear.position.set(s * R * 0.98, -0.01, 0); ear.scale.set(0.5, 1, 0.8); j.head.add(ear); }
  const nose = sph(R * 0.13, '#eaa982'); nose.position.set(0, -R * 0.12, R * 0.98); nose.scale.set(1, 0.9, 0.9); j.head.add(nose);
  // hair: smooth cap + swoopy fringe tufts
  const hairM = M(HAIR, { roughness: 0.45, clearcoat: 0.35, sheen: 0.2 });
  j.head.add(at(mesh(new THREE.SphereGeometry(R * 1.06, 48, 24, 0, Math.PI * 2, 0, Math.PI * 0.5), hairM), 0, R * 0.08, -R * 0.06, -0.38));
  [[-0.55, 0.78, 0.55, 0.5], [-0.2, 0.88, 0.62, 0.3], [0.18, 0.86, 0.6, -0.2], [0.52, 0.76, 0.52, -0.5], [0, 0.98, 0.1, 0], [-0.4, 0.9, -0.2, 0.4], [0.4, 0.9, -0.2, -0.4]]
    .forEach(([x, y, z, rz]) => { const tuft = mesh(new THREE.SphereGeometry(R * 0.32, 24, 16), hairM); tuft.position.set(x * R, y * R, z * R); tuft.scale.set(1, 0.55, 0.9); tuft.rotation.z = rz; j.head.add(tuft); });
  // eyes (white, iris, pupil, glint), lids, brows
  j.eyes = []; j.lids = []; j.brows = [];
  for (const s of [-1, 1]) {
    const eg = G(); eg.position.set(s * R * 0.36, R * 0.1, R * 0.83); j.head.add(eg);
    eg.add(at(mesh(new THREE.SphereGeometry(R * 0.21, 32, 24), M('#ffffff', { roughness: 0.25, clearcoat: 0.6 })), 0, 0, 0, 0, 0, 0, [0.88, 1.12, 0.55]));
    const iris = new THREE.Group(); eg.add(iris); j.eyes.push(iris);
    iris.add(at(mesh(new THREE.SphereGeometry(R * 0.115, 24, 18), M('#4a2e1c', { roughness: 0.3, clearcoat: 1 })), 0, 0, R * 0.09, 0, 0, 0, [1, 1.1, 0.45]));
    iris.add(at(mesh(new THREE.SphereGeometry(R * 0.06, 16, 12), M('#120c0a', { roughness: 0.2, clearcoat: 1 })), 0, 0, R * 0.13, 0, 0, 0, [1, 1.1, 0.4]));
    iris.add(at(new THREE.Mesh(new THREE.SphereGeometry(R * 0.025, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffffff' })), R * 0.04, R * 0.05, R * 0.16));
    const lid = mesh(new THREE.SphereGeometry(R * 0.225, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), SKIN); lid.scale.set(0.9, 1.15, 0.6); eg.add(lid); j.lids.push(lid);
    const brow = cap(R * 0.035, R * 0.22, HAIR); brow.rotation.z = Math.PI / 2; brow.position.set(s * R * 0.36, R * 0.42, R * 0.86); j.head.add(brow); j.brows.push(brow);
  }
  // mouths
  const mouthDark = M('#5a1f2b', { roughness: 0.5, sheen: 0 });
  j.mouth = {};
  const smile = mesh(new THREE.TorusGeometry(R * 0.2, R * 0.035, 10, 32, Math.PI), mouthDark); smile.rotation.z = Math.PI; smile.position.set(0, -R * 0.3, R * 0.93); smile.scale.set(1, 0.8, 1); j.head.add(smile); j.mouth.smile = smile;
  const grin = new THREE.Group(); grin.position.set(0, -R * 0.32, R * 0.92); j.head.add(grin); j.mouth.grin = grin;
  grin.add(at(mesh(new THREE.SphereGeometry(R * 0.2, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mouthDark), 0, R * 0.04, 0, 0, 0, 0, [1.1, 0.9, 0.4]));
  grin.add(at(mesh(new THREE.BoxGeometry(R * 0.3, R * 0.06, R * 0.05), '#ffffff'), 0, R * 0.01, R * 0.05));
  const oh = new THREE.Group(); oh.position.set(0, -R * 0.36, R * 0.92); j.head.add(oh); j.mouth.oh = oh;
  oh.add(at(mesh(new THREE.SphereGeometry(R * 0.13, 24, 16), mouthDark), 0, 0, 0, 0, 0, 0, [0.85, 1.2, 0.4]));
  oh.add(at(mesh(new THREE.SphereGeometry(R * 0.07, 16, 12), '#e0606e'), 0, -R * 0.06, R * 0.03, 0, 0, 0, [1.1, 0.6, 0.4]));
  const frown = mesh(new THREE.TorusGeometry(R * 0.14, R * 0.03, 10, 24, Math.PI), mouthDark); frown.position.set(0, -R * 0.42, R * 0.92); j.head.add(frown); j.mouth.frown = frown;
  const flat = cap(R * 0.025, R * 0.16, mouthDark); flat.rotation.z = Math.PI / 2; flat.position.set(0, -R * 0.36, R * 0.95); j.head.add(flat); j.mouth.flat = flat;
  j.cheeks = [];
  for (const s of [-1, 1]) { const ch = new THREE.Mesh(new THREE.SphereGeometry(R * 0.12, 16, 12), new THREE.MeshBasicMaterial({ color: '#ff8f8f', transparent: true, opacity: 0.35, depthWrite: false })); ch.position.set(s * R * 0.55, -R * 0.15, R * 0.78); ch.scale.set(1, 0.6, 0.4); j.head.add(ch); j.cheeks.push(ch); }
  root.traverse(o => { if (o.isMesh && o.material.isMeshPhysicalMaterial) o.castShadow = true; });
  return { root, j };
}

// pose library: joint angles (radians). arm: [x, z] at shoulder; elbow: forward bend; thigh: x; shin: knee bend
const POSES = {
  stand: { hipsY: 0.86, lean: 0.02, head: [0.04, 0], armL: [0.05, -0.14], armR: [0.05, 0.14], elL: 0.25, elR: 0.25, thL: 0, thR: 0, shL: 0.02, shR: 0.02 },
  point: { hipsY: 0.86, lean: 0, head: [-0.15, -0.35], armL: [0.05, -0.14], armR: [-1.7, 0.35], elL: 0.25, elR: 0.05, thL: 0, thR: 0, shL: 0.02, shR: 0.02, rootY: 0.35 },
  lookup: { hipsY: 0.86, lean: -0.08, head: [-0.55, 0.1], armL: [0.1, -0.35], armR: [-2.5, 0.3], elL: 0.4, elR: 0.15, thL: 0, thR: 0, shL: 0.02, shR: 0.02 },
  shelter: { hipsY: 0.46, lean: 0.55, head: [0.15, 0], armL: [-2.5, -0.5], armR: [-2.5, 0.5], elL: 1.9, elR: 1.9, thL: -1.5, thR: -1.3, shL: 1.9, shR: 1.7 },
  wobble: { hipsY: 0.76, lean: 0.1, head: [0, 0], armL: [-0.2, -1.25], armR: [-0.2, 1.25], elL: 0.3, elR: 0.3, thL: -0.35, thR: -0.25, shL: 0.55, shR: 0.45 },
  run: { hipsY: 0.82, lean: 0.28, head: [-0.1, 0], armL: [0, -0.2], armR: [0, 0.2], elL: 1.4, elR: 1.4, thL: 0, thR: 0, shL: 0.4, shR: 0.4 },
  cold: { hipsY: 0.84, lean: 0.12, head: [0.2, 0], armL: [-0.75, 0.35], armR: [-0.75, -0.35], elL: 2.2, elR: 2.2, thL: 0, thR: 0, shL: 0.05, shR: 0.05 },
  wave: { hipsY: 0.86, lean: 0, head: [0.0, 0.1], armL: [0.05, -0.14], armR: [-0.2, 2.5], elL: 0.25, elR: 0.6, thL: 0, thR: 0, shL: 0.02, shR: 0.02 },
};
const EXPR = {
  happy: { mouth: 'grin', brow: 0.18, browTilt: -0.1, lid: 0.0, cheeks: 1, gaze: [0, 0] },
  neutral: { mouth: 'flat', brow: 0, browTilt: 0, lid: 0.15, cheeks: 0.3, gaze: [0, 0] },
  worried: { mouth: 'frown', brow: 0.08, browTilt: 0.35, lid: 0.1, cheeks: 0.2, gaze: [0, -0.01] },
  shocked: { mouth: 'oh', brow: 0.35, browTilt: 0.1, lid: -0.1, cheeks: 0.2, gaze: [0, 0] },
  sick: { mouth: 'flat', brow: -0.04, browTilt: 0.25, lid: 0.45, cheeks: 0, gaze: [0, -0.02] },
};
function poseGary(g, pose, expr, t, k) {
  const p = POSES[pose] || POSES.stand, e = EXPR[expr] || EXPR.neutral, j = g.j;
  const breath = Math.sin(t * 2.2) * 0.015;
  j.hips.position.y = p.hipsY + breath * 0.3;
  j.spine.rotation.set(p.lean + breath, 0, 0);
  j.chest.rotation.set(breath * 0.5, 0, 0);
  j.head.rotation.set(p.head[0] + Math.sin(t * 0.9) * 0.03, p.head[1] + Math.sin(t * 0.6) * 0.05, 0);
  j.arm1.rotation.set(p.armR[0], 0, p.armR[1]);
  j['arm-1'].rotation.set(p.armL[0], 0, p.armL[1]);
  j.elbow1.rotation.set(-p.elR, 0, 0); j['elbow-1'].rotation.set(-p.elL, 0, 0);
  j.thigh1.rotation.set(p.thR, 0, 0); j['thigh-1'].rotation.set(p.thL, 0, 0);
  j.shin1.rotation.set(p.shR, 0, 0); j['shin-1'].rotation.set(p.shL, 0, 0);
  g.root.rotation.set(0, p.rootY || 0, 0);
  if (pose === 'run') {
    const ph = t * 10;
    j.thigh1.rotation.x = Math.sin(ph) * 0.85; j['thigh-1'].rotation.x = -Math.sin(ph) * 0.85;
    j.shin1.rotation.x = 0.5 + Math.max(0, -Math.cos(ph)) * 1.1; j['shin-1'].rotation.x = 0.5 + Math.max(0, Math.cos(ph)) * 1.1;
    j.arm1.rotation.x = -Math.sin(ph) * 0.8; j['arm-1'].rotation.x = Math.sin(ph) * 0.8;
    j.hips.position.y = p.hipsY + Math.abs(Math.sin(ph)) * 0.06;
  }
  if (pose === 'wobble') g.root.rotation.z = Math.sin(t * 7) * 0.08;
  if (pose === 'cold') { g.root.position.x += Math.sin(t * 47) * 0.006; j.head.rotation.z = Math.sin(t * 31) * 0.03; }
  if (pose === 'wave') j.elbow1.rotation.z = Math.sin(t * 9) * 0.45;
  if (pose === 'point') j.arm1.rotation.x += Math.sin(t * 3) * 0.05;
  // face
  for (const [name, m] of Object.entries(j.mouth)) m.visible = name === e.mouth;
  j.brows.forEach((b, i) => { const s = i ? 1 : -1; b.position.y = 0.255 * (0.42 + e.brow * 0.3); b.rotation.z = Math.PI / 2 - s * e.browTilt; });
  const blink = ((t + 0.7) % 3.9) < 0.13 ? 1 : 0;
  j.lids.forEach(l => { const c = blink ? 1 : clamp(e.lid, 0, 1); l.visible = c > 0.02; l.rotation.x = lerp(-1.75, -0.05, c) ; });
  const gy = (pose === 'lookup' ? 0.025 : e.gaze[1]) + Math.sin(t * 0.7) * 0.004, gx = e.gaze[0] + Math.sin(t * 0.45) * 0.006;
  j.eyes.forEach(i => i.position.set(gx, gy, 0));
  j.cheeks.forEach(c => c.material.opacity = 0.35 * e.cheeks);
}

// ======================================================================
// Gary as a tiny furry mammal (the survivors), still in his orange hoodie
// ======================================================================
function makeCritter() {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const fur = M('#8a6146', { roughness: 0.8, sheen: 1, sheenColor: new THREE.Color('#e8c9a8'), sheenRoughness: 0.5 });
  body.add(at(mesh(new THREE.SphereGeometry(0.12, 32, 24), fur), 0, 0.1, 0, 0, 0, 0, [1, 0.85, 1.35]));
  body.add(at(mesh(new THREE.SphereGeometry(0.1, 32, 24), M(TOP)), 0, 0.105, 0.02, 0, 0, 0, [1.08, 0.92, 0.75])); // hoodie
  body.add(at(mesh(new THREE.TorusGeometry(0.07, 0.022, 10, 24), M(TOP2)), 0, 0.14, 0.1, 1.2)); // hood ring
  const head = new THREE.Group(); head.position.set(0, 0.16, 0.15); body.add(head);
  head.add(at(mesh(new THREE.SphereGeometry(0.075, 32, 24), fur), 0, 0, 0, 0, 0, 0, [1, 0.95, 1.1]));
  head.add(at(mesh(new THREE.ConeGeometry(0.045, 0.1, 24), fur), 0, -0.015, 0.09, Math.PI / 2));
  head.add(at(sph(0.016, '#e58aa0'), 0, -0.012, 0.14));
  for (const s of [-1, 1]) {
    head.add(at(mesh(new THREE.SphereGeometry(0.03, 20, 14), fur), s * 0.05, 0.06, -0.01, 0, 0, 0, [1, 1, 0.45]));
    head.add(at(mesh(new THREE.SphereGeometry(0.018, 16, 12), '#f0a8a8'), s * 0.05, 0.06, 0.003, 0, 0, 0, [0.8, 0.8, 0.3]));
    head.add(at(mesh(new THREE.SphereGeometry(0.018, 20, 14), M('#140d0a', { roughness: 0.15, clearcoat: 1 })), s * 0.042, 0.018, 0.055));
    head.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.005, 8, 6), new THREE.MeshBasicMaterial({ color: '#fff' })), s * 0.042 + 0.005, 0.025, 0.072));
    for (let w = 0; w < 3; w++) { const wh = cyl(0.0015, 0.0015, 0.07, '#f4eee6', 4); wh.position.set(s * 0.035, -0.012 + w * 0.006, 0.11); wh.rotation.z = s * (Math.PI / 2 - 0.2 + w * 0.15); head.add(wh); }
  }
  for (const [x, z] of [[-0.06, 0.1], [0.06, 0.1], [-0.07, -0.1], [0.07, -0.1]]) body.add(at(sph(0.025, '#e8b6a0'), x, 0.015, z, 0, 0, 0, [1, 0.6, 1.3]));
  const tail = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(0, 0.08, -0.15), V(0, 0.06, -0.26), V(0.04, 0.1, -0.36), V(0.02, 0.16, -0.42)]), 20, 0.012, 8), '#d9a08a'); body.add(tail);
  root.userData = { head, body, tail };
  return root;
}
function poseCritter(c, t, expr) {
  const { head, body, tail } = c.userData;
  head.rotation.set(Math.sin(t * 5) * 0.12 - 0.05, Math.sin(t * 1.3) * 0.3, 0);
  head.position.y = 0.16 + Math.abs(Math.sin(t * 5)) * 0.008;
  body.position.y = Math.sin(t * 2.4) * 0.004;
  tail.rotation.y = Math.sin(t * 2) * 0.25;
}

// ======================================================================
// dinosaurs (soft, toy-like but anatomically plausible)
// ======================================================================
function tube(points, r, mat, seg = 24, rs = 14) { return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => V(...p))), seg, r, rs), mat); }
function taper(points, r0, r1, mat) { // tube that narrows: chain of spheres + tubes
  const g = new THREE.Group(), n = points.length;
  for (let i = 0; i < n - 1; i++) { const a = V(...points[i]), b = V(...points[i + 1]); const ra = lerp(r0, r1, i / (n - 1)), rb = lerp(r0, r1, (i + 1) / (n - 1));
    const len = a.distanceTo(b); const c = mesh(new THREE.CylinderGeometry(rb, ra, len, 20), mat); c.position.copy(a).add(b).multiplyScalar(0.5); c.quaternion.setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize()); g.add(c);
    const s = mesh(new THREE.SphereGeometry(rb, 20, 14), mat); s.position.copy(b); g.add(s); }
  return g;
}
function makeTriceratops(col = '#8f9a63', belly = '#c9c08e') {
  const g = new THREE.Group(), m = M(col), mb = M(belly), horn = M('#efe2c4', { roughness: 0.4 });
  g.add(at(mesh(new THREE.SphereGeometry(1, 40, 28), m), 0, 1.45, 0, 0, 0, 0, [1.9, 0.95, 1.05]));
  g.add(at(mesh(new THREE.SphereGeometry(1, 32, 20), mb), 0, 1.15, 0, 0, 0, 0, [1.7, 0.6, 0.9]));
  g.add(taper([[-1.6, 1.5, 0], [-2.4, 1.3, 0], [-3.2, 0.95, 0], [-3.9, 0.7, 0]], 0.55, 0.08, m));
  const head = new THREE.Group(); head.position.set(1.95, 1.55, 0); g.add(head); g.userData.head = head;
  head.add(at(mesh(new THREE.SphereGeometry(0.55, 32, 24), m), 0.25, -0.05, 0, 0, 0, 0, [1.3, 0.9, 0.85]));
  head.add(at(mesh(new THREE.CylinderGeometry(1.05, 1.05, 0.12, 40), M('#b46a52')), -0.15, 0.45, 0, 0, 0, Math.PI / 2 + 0.55)); // frill
  head.add(at(mesh(new THREE.TorusGeometry(1.05, 0.08, 10, 40), M('#7a5040')), -0.15, 0.45, 0, 0, Math.PI / 2, 0.55, [1, 1, 1]));
  head.add(at(mesh(new THREE.ConeGeometry(0.2, 0.45, 20), mb), 0.95, -0.25, 0, 0, 0, -Math.PI / 2 - 0.35)); // beak
  for (const s of [-1, 1]) {
    head.add(at(mesh(new THREE.ConeGeometry(0.1, 1.0, 20), horn), 0.55, 0.55, s * 0.28, s * 0.15, 0, -0.55));
    head.add(at(sph(0.075, '#1a1410'), 0.45, 0.15, s * 0.38));
  }
  head.add(at(mesh(new THREE.ConeGeometry(0.08, 0.32, 16), horn), 1.05, 0.12, 0, 0, 0, -0.3));
  for (const [x, z] of [[1.0, 0.6], [1.0, -0.6], [-1.0, 0.62], [-1.0, -0.62]]) g.add(at(cap(0.32, 0.75, m), x, 0.55, z));
  return g;
}
function makeEdmontosaurus(col = '#6f8a8a') {
  const g = new THREE.Group(), m = M(col), mb = M('#c4c9b0');
  g.add(at(mesh(new THREE.SphereGeometry(1, 40, 28), m), 0, 1.9, 0, 0, 0, -0.15, [1.7, 0.85, 0.75]));
  g.add(taper([[-1.4, 2.1, 0], [-2.5, 2.0, 0], [-3.6, 1.7, 0], [-4.5, 1.5, 0]], 0.5, 0.06, m));
  g.add(taper([[1.3, 2.3, 0], [1.9, 2.8, 0], [2.3, 3.1, 0]], 0.42, 0.24, m));
  const head = new THREE.Group(); head.position.set(2.45, 3.1, 0); g.add(head); g.userData.head = head;
  head.add(at(mesh(new THREE.SphereGeometry(0.4, 28, 20), m), 0.15, 0, 0, 0, 0, 0, [1.3, 0.8, 0.75]));
  head.add(at(mesh(new THREE.SphereGeometry(0.3, 24, 16), mb), 0.6, -0.12, 0, 0, 0, -0.2, [1.1, 0.4, 0.8])); // duck bill
  for (const s of [-1, 1]) head.add(at(sph(0.06, '#1a1410'), 0.25, 0.12, s * 0.26));
  for (const s of [-1, 1]) { g.add(at(cap(0.32, 1.2, m), -0.3, 0.95, s * 0.45, 0, 0, 0.1)); g.add(at(cap(0.14, 0.9, m), 1.0, 1.0, s * 0.35, 0, 0, -0.25)); }
  return g;
}
function makeRex(col = '#7d6a55') {
  const g = new THREE.Group(), m = M(col);
  g.add(at(mesh(new THREE.SphereGeometry(1, 36, 24), m), 0, 2.6, 0, 0, 0, 0.25, [1.5, 0.85, 0.8]));
  g.add(taper([[-1.2, 2.3, 0], [-2.4, 2.0, 0], [-3.6, 1.8, 0]], 0.55, 0.05, m));
  const head = new THREE.Group(); head.position.set(1.65, 3.45, 0); g.add(head); g.userData.head = head;
  head.add(at(mesh(new THREE.SphereGeometry(0.6, 28, 20), m), 0.2, 0, 0, 0, 0, 0, [1.5, 0.85, 0.8]));
  head.add(at(mesh(new THREE.BoxGeometry(0.9, 0.12, 0.6), M('#efe2c4')), 0.55, -0.32, 0));
  head.add(at(sph(0.07, '#ffcc33'), 0.35, 0.18, 0.4));
  for (const s of [-1, 1]) { g.add(at(cap(0.33, 1.3, m), -0.2, 1.25, s * 0.42, 0, 0, 0.15)); g.add(at(cap(0.05, 0.22, m), 1.1, 2.4, s * 0.3, 0, 0, -0.9)); }
  return g;
}

// ======================================================================
// vegetation and props
// ======================================================================
const fernGeo = (() => { const parts = []; for (let i = 0; i < 9; i++) { const g = new THREE.ConeGeometry(0.09, 1.05, 6); g.translate(0, 0.52, 0); g.scale(1, 1, 0.28); g.rotateX(0.95 + (i % 3) * 0.12); g.rotateY((i / 9) * Math.PI * 2); parts.push(g); } return mergeGeometries(parts); })();
function fern(col, s = 1) { const m = mesh(fernGeo, VM(col)); m.scale.setScalar(s); return m; }
function cycad(h = 2.2, seed = 1) {
  const g = new THREE.Group(), r = rng(seed);
  const trunk = cyl(0.14, 0.22, h, VM('#8a6440'), 14); trunk.position.y = h / 2; g.add(trunk);
  for (let i = 0; i < 4; i++) g.add(at(mesh(new THREE.TorusGeometry(0.19, 0.035, 8, 18), VM('#6f4f32')), 0, h * (0.2 + i * 0.2), 0, Math.PI / 2));
  for (let i = 0; i < 11; i++) { const lg = new THREE.ConeGeometry(0.16, 1.8, 6); lg.translate(0, 0.9, 0); lg.scale(1, 1, 0.22); const l = mesh(lg, VM(i % 2 ? '#4f8f3e' : '#5d9c46')); l.position.y = h; l.rotation.set(1.1 + r() * 0.35, (i / 11) * Math.PI * 2 + r() * 0.2, 0, 'YXZ'); g.add(l); }
  return g;
}
function conifer(h = 4, seed = 2) {
  const g = new THREE.Group(); const trunk = cyl(0.12, 0.2, h * 0.5, VM('#6b4a31'), 12); trunk.position.y = h * 0.25; g.add(trunk);
  for (let i = 0; i < 4; i++) { const c = cone(0.9 - i * 0.18, h * 0.38, VM(['#3f6f45', '#467a4b', '#3a6a41', '#4b8150'][i]), 20); c.position.y = h * (0.42 + i * 0.16); g.add(c); }
  return g;
}
function magnolia(seed = 3) { // flowering shrub: the new kid on the block in the Cretaceous
  const g = new THREE.Group(), r = rng(seed);
  for (let i = 0; i < 5; i++) { const b = sph(0.45 + r() * 0.2, VM('#4e8a47')); b.position.set((r() - 0.5) * 0.9, 0.45 + r() * 0.4, (r() - 0.5) * 0.9); b.scale.y = 0.8; g.add(b); }
  for (let i = 0; i < 14; i++) { const f = sph(0.08, VM(i % 3 ? '#f5b8c8' : '#fff0f4')); const a = r() * Math.PI * 2, e = r() * 1.2; f.position.set(Math.cos(a) * 0.6, 0.6 + Math.sin(e) * 0.45, Math.sin(a) * 0.6); f.scale.set(1, 0.6, 1); g.add(f); }
  return g;
}
function rock(s = 0.3, seed = 1, col = '#a99a8a') { const geo = new THREE.DodecahedronGeometry(s, 1); const p = geo.attributes.position, r = rng(seed); for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) * (0.85 + r() * 0.3), p.getY(i) * (0.7 + r() * 0.2), p.getZ(i) * (0.85 + r() * 0.3)); geo.computeVertexNormals(); return mesh(geo, GM(col)); }
function cloud(seed) { const g = new THREE.Group(), r = rng(seed); for (let i = 0; i < 7; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), M('#ffffff', { roughness: 0.9, sheen: 0.6 })); b.position.set((i - 3) * 0.9, Math.sin(i * 1.3) * 0.35 + (r() - 0.5) * 0.3, (r() - 0.5) * 0.8); b.scale.setScalar(0.8 + r() * 0.7); g.add(b); } return g; }

// island base: layered soil like a cake, the diorama signature
function islandBase(radius, layers = [['#7a4e33', 0.7], ['#93603e', 0.5], ['#6b4430', 0.9], ['#a5794f', 0.35], ['#5e3c2a', 1.0]]) {
  const g = new THREE.Group(); let y = 0, r = radius;
  for (const [c, h] of layers) { const r2 = r * 0.955; const m = cyl(r, r2, h, GM(c), 96); m.position.y = y - h / 2; g.add(m); y -= h; r = r2; }
  const bottom = cone(r, 1.6, GM('#4a2f22'), 96); bottom.rotation.x = Math.PI; bottom.position.y = y - 0.8; g.add(bottom);
  return g;
}

// ======================================================================
// sky
// ======================================================================
const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: { top: { value: new THREE.Color() }, mid: { value: new THREE.Color() }, bot: { value: new THREE.Color() }, sunDir: { value: V(0.4, 0.5, -0.7).normalize() }, sunCol: { value: new THREE.Color() }, sunAmt: { value: 1 } },
  vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform vec3 top, mid, bot, sunCol, sunDir; uniform float sunAmt; varying vec3 vDir;
    void main(){ float h = vDir.y; vec3 c = h > 0.0 ? mix(mid, top, smoothstep(0.0, 0.7, h)) : mix(mid, bot, smoothstep(0.0, 0.5, -h));
      float s = max(dot(normalize(vDir), normalize(sunDir)), 0.0); c += sunCol * (pow(s, 600.0) * 3.0 + pow(s, 12.0) * 0.35) * sunAmt;
      gl_FragColor = vec4(c, 1.0); }`,
});
const sky = new THREE.Mesh(new THREE.SphereGeometry(200, 48, 24), skyMat); scene.add(sky);

// ======================================================================
// SET: tanis (Cretaceous river, North Dakota, 66 Myr ago)
// ======================================================================
const sets = {};
const tanis = new THREE.Group(); scene.add(tanis); sets.tanis = tanis;
const IR = 10; // island radius
tanis.add(islandBase(IR));
const groundMat = GM('#86ad5c', { roughness: 0.85, sheen: 0.5, sheenColor: new THREE.Color('#d8f0a0') });
const ground = mesh(new THREE.CylinderGeometry(IR, IR, 0.3, 128), groundMat); ground.position.y = -0.135; tanis.add(ground);
// mud banks along the river
const bankMat = GM('#8c7356', { roughness: 0.9 });
for (const z of [-1.95, -4.65]) { const b = mesh(new THREE.BoxGeometry(2 * IR, 0.06, 0.7), bankMat); b.position.set(0, 0.0, z); tanis.add(b); }
// river: a strip clipped to the island circle in the shader, with a flowing ripple texture
const rippleTex = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#808080'; g.fillRect(0, 0, w, h); const r = rng(5); for (let i = 0; i < 70; i++) { g.strokeStyle = `rgba(255,255,255,${0.15 + r() * 0.35})`; g.lineWidth = 1 + r() * 3; const x = r() * w, y = r() * h, l = 20 + r() * 60; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + l / 2, y + (r() - 0.5) * 10, x + l, y); g.stroke(); } });
rippleTex.wrapS = rippleTex.wrapT = THREE.RepeatWrapping; rippleTex.repeat.set(6, 1);
const waterMat = new THREE.MeshPhysicalMaterial({ color: '#3f86ad', roughness: 0.12, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05, map: rippleTex, transparent: true, opacity: 0.92 });
waterMat.onBeforeCompile = sh => { sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWp;').replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWp = (modelMatrix * vec4(transformed, 1.0)).xyz;');
  sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWp;').replace('void main() {', 'void main() {\n if (length(vWp.xz) > ' + (IR - 0.05).toFixed(2) + ') discard;'); };
const river = new THREE.Mesh(new THREE.PlaneGeometry(2 * IR, 2.9, 1, 1), waterMat); river.rotation.x = -Math.PI / 2; river.position.set(0, 0.03, -3.3); river.receiveShadow = true; tanis.add(river);
const riverbed = mesh(new THREE.BoxGeometry(2 * IR - 0.4, 0.02, 2.8), GM('#5b4a39')); riverbed.position.set(0, 0.005, -3.3); tanis.add(riverbed);
// waterfall off the island edge (diorama charm)
for (const s of [-1, 1]) { const wf = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 3.2), new THREE.MeshPhysicalMaterial({ color: '#6fb1d6', roughness: 0.2, clearcoat: 1, map: rippleTex, transparent: true, opacity: 0.85, side: THREE.DoubleSide })); wf.position.set(s * (IR * 0.94 - 0.1), -1.5, -3.3); wf.rotation.y = Math.PI / 2; tanis.add(wf); tanis.userData['wf' + s] = wf; }
// foam/debris for the surge (instanced)
const foamMat = new THREE.MeshPhysicalMaterial({ color: '#f2f6f7', roughness: 0.6 });
const foam = new THREE.InstancedMesh(new THREE.SphereGeometry(0.07, 8, 6), foamMat, 160); foam.visible = false; tanis.add(foam);
const debrisMat = M('#6b4a31');
const debris = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.05, 0.06, 1, 8), debrisMat, 14); debris.castShadow = true; debris.visible = false; tanis.add(debris);

// vegetation
const trees = [];
const treeSpots = [[-6.5, -7.5, 'conifer', 5.2], [-3.8, -8.2, 'conifer', 4.4], [4.8, -7.6, 'conifer', 5.6], [7.2, -5.6, 'cycad', 2.6], [-7.6, -5.4, 'cycad', 2.2], [1.2, -8.4, 'cycad', 2.8],
  [-7.4, 1.6, 'conifer', 4.8], [7.6, 1.2, 'conifer', 4.2], [-5.6, 4.6, 'cycad', 2.4], [6.0, 4.8, 'cycad', 2.0], [3.6, 1.0, 'cycad', 2.6], [-4.2, -0.6, 'cycad', 2.0], [8.4, -2.0, 'cycad', 1.8]];
treeSpots.forEach(([x, z, kind, h], i) => { const t = kind === 'conifer' ? conifer(h, i) : cycad(h, i); t.position.set(x, 0, z); t.rotation.y = i * 1.3; tanis.add(t); trees.push(t); });
const shrubs = [[-7.4, 4.4], [5.4, 3.9], [-6.6, -1.4], [5.2, -1.2], [-1.4, -6.6], [3.0, -6.2], [6.6, 6.6], [-3.4, 7.4]].map(([x, z], i) => { const s = magnolia(i + 4); s.position.set(x, 0, z); s.scale.setScalar(0.85); tanis.add(s); return s; });
const ferns = [[2.2, 0.4, 0.8], [-1.6, 0.2, 0.7], [2.7, -0.6, 0.9], [-3.1, 1.5, 0.9], [0.4, -0.9, 0.6], [4.4, 2.6, 0.8], [-4.4, 3.0, 0.8], [5.6, -3.0, 0.9], [-5.8, 6.2, 0.9], [4.6, 7.0, 1], [-1.8, -7.6, 0.9], [6.4, -7.8, 0.9], [-8.2, -2.4, 0.8]]
  .map(([x, z, s], i) => { const f = fern(i % 2 ? '#3f7d3a' : '#4d8a42', s); f.position.set(x, 0, z); f.rotation.y = i; tanis.add(f); return f; });
for (let i = 0; i < 14; i++) { const r = rng(i + 50); const a = r() * Math.PI * 2, d = 2.5 + r() * 6.5; if (Math.abs(Math.sin(a) * d + 3.3) < 1.8) continue; const rk = rock(0.12 + r() * 0.25, i, i % 3 ? '#a99a8a' : '#8f8172'); rk.position.set(Math.cos(a) * d, 0.04, Math.sin(a) * d); tanis.add(rk); }
// the shelter: a fallen trunk resting on a boulder and a stump; Gary crouches under it
const SHELTER = V(-5.0, 0, 0.75);
const log = mesh(new THREE.CylinderGeometry(0.3, 0.36, 3.4, 24), VM('#7a5a3c')); log.rotation.z = Math.PI / 2 - 0.08; log.position.set(-5.1, 1.28, 0.4); tanis.add(log);
for (const s of [-1, 1]) tanis.add(at(mesh(new THREE.CircleGeometry(0.33, 24), VM('#c79e6d')), -5.1 + s * 1.7, 1.28 + s * 0.13, 0.4, 0, s * Math.PI / 2, 0));
const boulder = rock(0.75, 9, '#9c8d7c'); boulder.position.set(-6.65, 0.4, 0.4); tanis.add(boulder);
const stump = cyl(0.3, 0.38, 1.0, VM('#6b4a31')); stump.position.set(-3.5, 0.5, 0.4); tanis.add(stump);
// dinosaurs
const herd = new THREE.Group(); tanis.add(herd);
const trike = makeTriceratops(); at(trike, -3.2, 0, -7.0, 0, 0.25, 0, 0.62); herd.add(trike);
const trikeJr = makeTriceratops('#9aa56e'); at(trikeJr, -0.6, 0, -7.4, 0, -0.2, 0, 0.38); herd.add(trikeJr);
const edmo = makeEdmontosaurus(); at(edmo, 4.2, -0.35, -3.4, 0, Math.PI - 0.5, 0, 0.6); herd.add(edmo);
const rex = makeRex(); at(rex, 6.4, 0, -8.6, 0, 2.5, 0, 0.7); herd.add(rex);
// burnt trunks + recovery ferns (instanced carpet)
const burnt = new THREE.Group(); tanis.add(burnt);
treeSpots.forEach(([x, z, k, h], i) => { const b = cyl(0.12, 0.2, h * 0.45, M('#2f2a27', { roughness: 0.95 }), 10); b.position.set(x, h * 0.22, z); b.rotation.z = (hashf(i) - 0.5) * 0.25; burnt.add(b); });
const carpet = new THREE.InstancedMesh(fernGeo, VM('#5aa04a'), 260); carpet.castShadow = true; carpet.receiveShadow = true; tanis.add(carpet);
{ const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), r = rng(77); let n = 0; while (n < 260) { const a = r() * Math.PI * 2, d = Math.sqrt(r()) * (IR - 0.6); const x = Math.cos(a) * d, z = Math.sin(a) * d; if (Math.abs(z + 3.3) < 1.7) continue; if (Math.abs(x) < 3.2 && z > 0.6) continue; q.setFromEuler(new THREE.Euler(0, r() * 6, 0)); const s = 0.45 + r() * 0.6; m4.compose(V(x, 0, z), q, V(s, s, s)); carpet.setMatrixAt(n++, m4); } }
// clouds around the island
const clouds = new THREE.Group(); tanis.add(clouds);
[[-16, 9, -14, 1.6], [14, 11, -18, 2], [20, 6, 4, 1.4], [-20, 7, 6, 1.5], [2, 14, -24, 2.2]].forEach(([x, y, z, s], i) => clouds.add(at(cloud(i + 3), x, y, z, 0, 0, 0, s)));
const sunSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTex('rgba(255,250,235,1)', 'rgba(255,220,160,0)'), blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));

// particles: glass beads, ash/snow, embers, smoke (all closed-form in t)
const N_BEADS = 900;
const beadMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(4.0, 2.6, 1.3), toneMapped: true });
const beads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.022, 8, 6), beadMat, N_BEADS); beads.frustumCulled = false; scene.add(beads);
const N_ASH = 700;
const ashMat = new THREE.MeshStandardMaterial({ color: '#cfcac4', roughness: 1 });
const ash = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.06, 0.06), ashMat, N_ASH); ash.frustumCulled = false; scene.add(ash);
const flames = [], smokes = [];
const flameTex = radialTex('rgba(255,230,160,1)', 'rgba(255,90,20,0)');
const smokeTex = radialTex('rgba(70,62,58,0.85)', 'rgba(70,62,58,0)');
const burning = [0, 2, 3, 6, 9, 11];
burning.forEach(i => { const [x, z, k, h] = treeSpots[i];
  for (let f = 0; f < 4; f++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: flameTex, color: new THREE.Color(3, 1.6, 0.6), blending: THREE.AdditiveBlending, depthWrite: false })); s.userData = { x, z, h, f }; tanis.add(s); flames.push(s); }
  for (let f = 0; f < 6; f++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, transparent: true, depthWrite: false })); s.userData = { x, z, h, f }; tanis.add(s); smokes.push(s); } });

// ======================================================================
// SET: burrow (cutaway of the ground with a den; ash world above)
// ======================================================================
const burrow = new THREE.Group(); scene.add(burrow); sets.burrow = burrow;
const BW = 7, BD = 4.5, BH = 3.2, FZ = BD / 2;
const soilTex = canvasTex(512, 256, (g, w, h) => { const bands = ['#3d2a20', '#5a3d2b', '#4a3224', '#6b4a33', '#55392a', '#7a5638']; let y = 0; const r = rng(3); while (y < h) { const bh = 18 + r() * 40; g.fillStyle = bands[Math.floor(r() * bands.length)]; g.fillRect(0, y, w, bh); y += bh; }
  g.fillStyle = 'rgba(0,0,0,0.0)'; for (let i = 0; i < 180; i++) { g.fillStyle = `rgba(${r() > 0.5 ? '200,180,150' : '30,20,15'},${0.15 + r() * 0.25})`; g.beginPath(); g.arc(r() * w, r() * h, 1 + r() * 4, 0, 7); g.fill(); }
  g.fillStyle = '#9a948c'; g.fillRect(0, 0, w, 10); });
const soilMat = new THREE.MeshPhysicalMaterial({ map: soilTex, roughness: 0.95, sheen: 0.2 });
// front face with holes: the den and the tunnel to the surface
const den = { x: 0.2, y: -1.85, rx: 1.15, ry: 0.62 };
const face = new THREE.Shape(); face.moveTo(-BW / 2, -BH); face.lineTo(BW / 2, -BH); face.lineTo(BW / 2, 0); face.lineTo(-BW / 2, 0); face.lineTo(-BW / 2, -BH);
const holeDen = new THREE.Path(); holeDen.absellipse(den.x, den.y, den.rx, den.ry, 0, Math.PI * 2, true); face.holes.push(holeDen);
const tunnelPts = [[-2.3, 0.02], [-2.0, -0.5], [-1.5, -1.1], [-0.95, -1.6]];
const holeT = new THREE.Path(); holeT.moveTo(-2.55, 0.0); tunnelPts.forEach(([x, y]) => holeT.lineTo(x - 0.18, y - 0.02)); for (let i = tunnelPts.length - 1; i >= 0; i--) { const [x, y] = tunnelPts[i]; holeT.lineTo(x + 0.2, y + 0.22); } holeT.lineTo(-2.05, 0.0); face.holes.push(holeT);
const faceGeo = new THREE.ShapeGeometry(face, 32); { const uv = faceGeo.attributes.uv, p = faceGeo.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, (p.getX(i) + BW / 2) / BW, 1 + p.getY(i) / BH); }
const faceM = new THREE.Mesh(faceGeo, soilMat); faceM.position.z = FZ; faceM.receiveShadow = true; burrow.add(faceM);
const denInner = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32, 0, Math.PI * 2, 0, Math.PI), new THREE.MeshPhysicalMaterial({ color: '#4a3324', roughness: 1, side: THREE.BackSide }));
denInner.scale.set(den.rx, den.ry, 0.9); denInner.position.set(den.x, den.y, FZ); denInner.receiveShadow = true; burrow.add(denInner);
{ const pts = tunnelPts.map(([x, y]) => V(x + 0.02, y + 0.1, FZ - 0.25)); const tg = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, 0.24, 16), new THREE.MeshPhysicalMaterial({ color: '#3d2a1e', roughness: 1, side: THREE.BackSide })); burrow.add(tg); }
for (const [x, w] of [[-BW / 2, 1], [BW / 2, -1]]) { const side = new THREE.Mesh(new THREE.PlaneGeometry(BD, BH), soilMat); side.rotation.y = w * Math.PI / 2; side.position.set(x, -BH / 2, 0); burrow.add(side); }
const top = mesh(new THREE.BoxGeometry(BW, 0.12, BD), GM('#8f8a83', { roughness: 0.95 })); top.position.y = -0.06; burrow.add(top);
const bottomB = mesh(new THREE.BoxGeometry(BW, 0.3, BD), soilMat); bottomB.position.y = -BH - 0.15; burrow.add(bottomB);
for (let i = 0; i < 4; i++) { const st = cyl(0.12, 0.18, 1.2 + i * 0.4, M('#2f2a27', { roughness: 0.95 }), 10); st.position.set(-1.5 + i * 1.3, 0.6 + i * 0.2, -1.4 + (i % 2) * 0.8); st.rotation.z = (i - 1.5) * 0.12; burrow.add(st); }
// den contents: seed pile, a worm, a beetle, a sleeping frog in a side pocket
const seeds = new THREE.Group(); for (let i = 0; i < 26; i++) { const r = rng(i + 400); const s = sph(0.025, i % 3 ? '#c9a36a' : '#a7834d', 10, 8); s.position.set(den.x + 0.5 + (r() - 0.5) * 0.3, den.y - den.ry * 0.72 + r() * 0.06, FZ - 0.2 - r() * 0.25); s.scale.set(1, 0.7, 1.3); seeds.add(s); } burrow.add(seeds);
const worm = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(1.9, -2.6, FZ - 0.05), V(2.1, -2.5, FZ - 0.05), V(2.3, -2.62, FZ - 0.05), V(2.5, -2.55, FZ - 0.05)]), 20, 0.03, 8), '#d98a8a'); burrow.add(worm);
const critter = makeCritter(); critter.scale.setScalar(1.4); burrow.add(critter);
const CRITTER_BURROW = V(den.x - 0.15, den.y - den.ry * 0.78, FZ - 0.25);

// ======================================================================
// SET: today (badlands with a fossil dig; same spot, 66 million years later)
// ======================================================================
const today = new THREE.Group(); scene.add(today); sets.today = today;
today.add(islandBase(IR, [['#a88a62', 0.6], ['#c9b08a', 0.4], ['#8c7a66', 0.6], ['#b59672', 0.5], ['#7a6552', 1.0]]));
const prairie = mesh(new THREE.CylinderGeometry(IR, IR, 0.3, 128), GM('#8f9a4e', { roughness: 0.95, sheen: 0.3 })); prairie.position.y = -0.135; today.add(prairie);
// layered butte with the thin pale boundary clay
const butte = new THREE.Group(); today.add(butte); butte.position.set(-1.5, 0, -6.6); butte.scale.setScalar(0.8);
[['#b89a74', 1.0, 5.2], ['#d0bd9c', 0.6, 4.8], ['#8d7a6b', 0.7, 4.4], ['#efe8da', 0.08, 4.05], ['#5a4a42', 0.5, 4.0], ['#c3a37a', 0.7, 3.6], ['#a88d6c', 0.6, 3.1]].reduce((y, [c, h, r]) => { const m = cyl(r, r * 0.97, h, GM(c), 64); m.position.y = y + h / 2; m.scale.z = 0.55; butte.add(m); return y + h; }, 0);
// grass blades (instanced)
{ const bladeGeo = new THREE.ConeGeometry(0.025, 0.4, 3); bladeGeo.translate(0, 0.2, 0); const grass = new THREE.InstancedMesh(bladeGeo, M('#7f8f3e', { roughness: 0.9 }), 1400); const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), r = rng(91);
  for (let i = 0; i < 1400; i++) { const a = r() * Math.PI * 2, d = Math.sqrt(r()) * (IR - 0.3); const x = Math.cos(a) * d, z = Math.sin(a) * d; const s = 0.6 + r() * 0.9; q.setFromEuler(new THREE.Euler((r() - 0.5) * 0.4, r() * 6, (r() - 0.5) * 0.4)); m4.compose(V(x, 0, z), q, V(s, s, s)); if (Math.hypot(x - 1.6, z - 0.2) < 1.3 || (Math.abs(x + 1) < 4.5 && z < -3)) m4.compose(V(0, -5, 0), q, V(0, 0, 0)); grass.setMatrixAt(i, m4); }
  grass.receiveShadow = true; today.add(grass); }
// dig pit with a Triceratops skull
const pit = mesh(new THREE.BoxGeometry(2.0, 0.05, 1.6), GM('#9c8466')); pit.position.set(1.6, 0.0, 0.2); today.add(pit);
const bone = M('#e9dcc0', { roughness: 0.55 });
const skull = new THREE.Group(); at(skull, 1.6, 0.12, 0.2, 0, -0.5, 0, 0.42); today.add(skull);
skull.add(at(mesh(new THREE.CylinderGeometry(1.05, 1.05, 0.1, 40), bone), -0.2, 0.3, 0, 0, 0, Math.PI / 2 + 1.0));
skull.add(at(mesh(new THREE.SphereGeometry(0.5, 24, 16), bone), 0.35, 0.05, 0, 0, 0, 0, [1.3, 0.7, 0.8]));
for (const s of [-1, 1]) skull.add(at(mesh(new THREE.ConeGeometry(0.09, 0.95, 16), bone), 0.6, 0.35, s * 0.25, s * 0.2, 0, -1.0));
for (const [x, z] of [[0.6, -0.6], [2.6, -0.6], [0.6, 1.0], [2.6, 1.0]]) { const p = cyl(0.02, 0.02, 0.4, '#d9c7a4', 8); p.position.set(x, 0.2, z); today.add(p); }
const stringMat = new THREE.LineBasicMaterial({ color: '#e04f4f' });
today.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([V(0.6, 0.38, -0.6), V(2.6, 0.38, -0.6), V(2.6, 0.38, 1.0), V(0.6, 0.38, 1.0), V(0.6, 0.38, -0.6)]), stringMat));
const brush = new THREE.Group(); brush.add(at(cyl(0.02, 0.02, 0.3, '#c98a3d', 8), 0, 0.15, 0)); brush.add(at(cyl(0.04, 0.03, 0.08, '#2b2b2b', 8), 0, 0.32, 0)); at(brush, 2.4, 0.05, 1.2, 1.3, 0.4, 0); today.add(brush);
const todayClouds = new THREE.Group(); today.add(todayClouds);
[[-14, 10, -16, 1.8], [12, 12, -20, 2.1], [18, 7, 2, 1.4], [-19, 8, 4, 1.5]].forEach(([x, y, z, s], i) => todayClouds.add(at(cloud(i + 11), x, y, z, 0, 0, 0, s)));
for (const [x, z, s] of [[5.5, -2, 0.5], [-6, 2, 0.6], [6.5, 4.5, 0.45]]) { const r = rock(s, x * 10 | 0, '#b8a184'); r.position.set(x, 0.1, z); today.add(r); }

// Gary
const gary = makeGary(); scene.add(gary.root);
const garyCritter = makeCritter(); garyCritter.scale.setScalar(1.6); scene.add(garyCritter);

// ======================================================================
// lights
// ======================================================================
const hemi = new THREE.HemisphereLight('#ffe8cc', '#5a4a6a', 0.7); scene.add(hemi);
const key = new THREE.DirectionalLight('#ffd2a0', 3); key.castShadow = true;
key.shadow.mapSize.set(4096, 4096); key.shadow.bias = -0.0015; key.shadow.normalBias = 0.06;
Object.assign(key.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 60 }); scene.add(key); scene.add(key.target);
const fill = new THREE.DirectionalLight('#a8c0ff', 0.6); fill.position.set(-8, 5, 10); scene.add(fill);
const glowLight = new THREE.PointLight('#ff7a3a', 0, 30, 1.5); glowLight.position.set(0, 9, 0); scene.add(glowLight);
const denLight = new THREE.PointLight('#ffcf8a', 0, 4, 1.6); denLight.position.set(den.x + 0.3, den.y + 0.2, FZ + 0.6); burrow.add(denLight);

// phase looks: sky (top, mid, bottom), sun, hemi, key, env, exposure, veg/ground tint
const PHASES = {
  calm: { sky: ['#5fa3dc', '#bfe0f2', '#f4dcc0'], sun: '#fff2d6', sunAmt: 1, hemi: ['#ffeedd', '#6a5a72', 0.75], key: ['#ffe2b8', 3.2], keyPos: [7, 11, 6], env: 0.45, exp: 1.0, veg: null, ground: null, glow: 0, clouds: 1 },
  shake: 'calm', surge: { base: 'calm', sky: ['#5f8fc0', '#b7cfdf', '#e6d4bf'] },
  glassrain: { sky: ['#4a3b6b', '#e0876a', '#ffd3a0'], sun: '#ffd0a0', sunAmt: 0.5, hemi: ['#ffd8b8', '#5a3a50', 0.7], key: ['#ffb98a', 2.6], keyPos: [6, 10, 5], env: 0.4, exp: 1.0, veg: null, ground: null, glow: 0.5, clouds: 1 },
  glow: { sky: ['#4a1212', '#c43a25', '#ffa04a'], sun: '#ff8a40', sunAmt: 0, hemi: ['#ff9f70', '#4a1a20', 0.95], key: ['#ff7a45', 2.4], keyPos: [2, 14, 3], env: 0.35, exp: 1.05, veg: ['#c86a3a', 0.3], ground: ['#c0703a', 0.25], glow: 3.5, clouds: 0 },
  fires: { sky: ['#1e1418', '#5a2a22', '#b05a30'], sun: '#000000', sunAmt: 0, hemi: ['#a07060', '#201418', 0.45], key: ['#ff8a50', 1.2], keyPos: [-6, 8, 4], env: 0.18, exp: 1.1, veg: ['#3a2c22', 0.45], ground: ['#5a4a3a', 0.4], glow: 1.5, clouds: 0 },
  dark: { sky: ['#232226', '#4a4744', '#5e5750'], sun: '#000000', sunAmt: 0, hemi: ['#9a9590', '#2a2624', 0.5], key: ['#b8b2aa', 0.9], keyPos: [4, 12, 6], env: 0.2, exp: 1.15, veg: ['#4a4038', 0.7], ground: ['#6a645c', 0.7], glow: 0, clouds: 0 },
  cold: { sky: ['#2a3038', '#6a7480', '#9aa2aa'], sun: '#000000', sunAmt: 0, hemi: ['#c8d4e0', '#3a4048', 0.6], key: ['#cfe0f0', 1.1], keyPos: [4, 12, 6], env: 0.25, exp: 1.1, veg: ['#6a6e70', 0.75], ground: ['#d6dde2', 0.75], glow: 0, clouds: 0 },
  recovery: { sky: ['#6aa8d8', '#c8e4ee', '#eee4cc'], sun: '#fff6e0', sunAmt: 1, hemi: ['#f4ffe8', '#5a6a5a', 0.8], key: ['#fff0cc', 3.0], keyPos: [-6, 11, 7], env: 0.45, exp: 1.0, veg: null, ground: ['#7aa84e', 0.4], glow: 0, clouds: 1 },
  today: { sky: ['#3f8fe0', '#b8dcf4', '#f2e6d0'], sun: '#fffaf0', sunAmt: 1, hemi: ['#fff4e6', '#6a5a4a', 0.6], key: ['#fff2dc', 2.6], keyPos: [8, 12, 5], env: 0.35, exp: 0.9, veg: null, ground: null, glow: 0, clouds: 1 },
};
function phaseOf(name) { let p = PHASES[name] || PHASES.calm; if (typeof p === 'string') p = PHASES[p]; if (p.base) p = { ...PHASES[p.base], ...p }; return p; }
const tmpC = new THREE.Color();
function applyPhase(name) {
  const p = phaseOf(name);
  skyMat.uniforms.top.value.set(p.sky[0]); skyMat.uniforms.mid.value.set(p.sky[1]); skyMat.uniforms.bot.value.set(p.sky[2]);
  skyMat.uniforms.sunCol.value.set(p.sun); skyMat.uniforms.sunAmt.value = p.sunAmt;
  hemi.color.set(p.hemi[0]); hemi.groundColor.set(p.hemi[1]); hemi.intensity = p.hemi[2];
  key.color.set(p.key[0]); key.intensity = p.key[1]; key.position.set(...p.keyPos);
  scene.environmentIntensity = p.env; renderer.toneMappingExposure = p.exp;
  glowLight.intensity = p.glow * 40;
  for (const m of tintable.veg) m.color.copy(m.userData.base).lerp(tmpC.set(p.veg ? p.veg[0] : '#000'), p.veg ? p.veg[1] : 0);
  for (const m of tintable.ground) m.color.copy(m.userData.base).lerp(tmpC.set(p.ground ? p.ground[0] : '#000'), p.ground ? p.ground[1] : 0);
  return p;
}

// ======================================================================
// post: depth of field (miniature feel) + bloom
// ======================================================================
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bokeh = new BokehPass(scene, camera, { focus: 8, aperture: 0.001, maxblur: 0.006 }); composer.addPass(bokeh);
const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.45, 0.55, 0.9); composer.addPass(bloom);
composer.addPass(new OutputPass());

// ======================================================================
// cameras (relative to the subject: P = feet, Hd = head, s = subject scale)
// ======================================================================
const MOVES = {
  wide: (k, P, Hd, s, set) => { const a = lerp(0.55, 0.72, k); const r = set === 'burrow' ? 9.5 : 21; return { pos: V(Math.sin(a) * r, set === 'burrow' ? 1.2 : 10.5, Math.cos(a) * r), look: V(0, set === 'burrow' ? -1.2 : 0.2, set === 'burrow' ? 0 : -1.2), fov: 32, wide: true }; },
  push: (k, P, Hd, s) => ({ pos: Hd.clone().add(V(lerp(1.4, 0.7, k), lerp(0.25, 0.1, k), lerp(4.6, 2.6, k)).multiplyScalar(s)), look: Hd.clone().add(V(0, -0.25 * s, 0)), fov: 34 }),
  face: (k, P, Hd, s) => ({ pos: Hd.clone().add(V(lerp(0.55, 0.35, k), 0.05, lerp(1.7, 1.35, k)).multiplyScalar(s)), look: Hd.clone().add(V(0, -0.05 * s, 0)), fov: 34 }),
  low: (k, P, Hd, s) => ({ pos: P.clone().add(V(lerp(-1.6, -1.1, k), 0.35, lerp(3.6, 3.0, k)).multiplyScalar(s)), look: Hd.clone().add(V(0, -0.2 * s, -1.5 * s)), fov: 40 }),
  orbit: (k, P, Hd, s) => { const a = lerp(-0.8, 0.5, k), r = 4.2 * s; return { pos: Hd.clone().add(V(Math.sin(a) * r, 0.6 * s, Math.cos(a) * r)), look: Hd.clone().add(V(0, -0.45 * s, 0)), fov: 36 }; },
  crane: (k, P, Hd, s) => ({ pos: Hd.clone().add(V(lerp(1.5, 0.6, k), lerp(3.2, 0.4, k), lerp(5.0, 3.0, k)).multiplyScalar(s)), look: Hd.clone().add(V(0, lerp(-1.0, -0.3, k) * s, 0)), fov: 36 }),
  crane_up: (k, P, Hd, s) => ({ pos: Hd.clone().add(V(lerp(0.6, 2.4, k), lerp(0.1, 4.5, k), lerp(3.0, 8.5, k)).multiplyScalar(s)), look: P.clone().add(V(0, lerp(0.9, 0.3, k) * s, lerp(0, -1.5, k) * s)), fov: 36 }),
  dolly: (k, P, Hd, s) => ({ pos: Hd.clone().add(V(lerp(0.9, 0.3, k), lerp(0.2, 0.05, k), lerp(6.0, 2.6, k)).multiplyScalar(s)), look: Hd.clone().add(V(0, -0.3 * s, 0)), fov: 34 }),
  truck: (k, P, Hd, s) => ({ pos: Hd.clone().add(V(lerp(-2.2, 1.6, k), 0.4, 4.6).multiplyScalar(s)), look: Hd.clone().add(V(lerp(-0.6, 0.4, k) * s, -0.4 * s, -1.0 * s)), fov: 36 }),
};

// ======================================================================
// overlays: captions, label, cards, inserts
// ======================================================================
const $ = id => document.getElementById(id);
const labelEl = $('label'), subEl = $('sub').firstElementChild, cardEl = $('card'), fadeEl = $('fade'), titleEl = $('title');
const insCanvas = $('ins'), insCtx = insCanvas.getContext('2d');
const beats = script.beats.map((b, i) => ({ ...b, ...timeline.beats[i] }));
window.DURATION = timeline.duration;
// subtitle groups: up to ~8 words / 46 chars, breaking at punctuation
const groups = [];
beats.forEach((b, bi) => { let cur = null; b.words.forEach(w => {
  if (!cur || cur.words.length >= 8 || cur.chars + w.w.length > 46) { cur = { words: [], chars: 0, s: w.s, bi }; groups.push(cur); }
  cur.words.push(w.w); cur.chars += w.w.length + 1; cur.e = w.e; if (/[.!?;:,]$/.test(w.w) && cur.chars > 18) cur = null; }); });
function subAt(t) { for (let i = 0; i < groups.length; i++) { const g = groups[i], n = groups[i + 1]; if (t >= g.s - 0.05 && t < Math.min(n ? n.s : Infinity, g.e + 0.5)) return g; } return null; }
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
let lastSub = null, lastLabel = null;

// ======================================================================
// frame
// ======================================================================
const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e4 = new THREE.Euler();
window.renderFrame = (t) => {
  let bi = beats.findIndex((b, i) => t < (beats[i + 1] ? beats[i + 1].start : Infinity)); if (bi < 0) bi = beats.length - 1;
  const b = beats[bi], dur = (beats[bi + 1] ? beats[bi + 1].start : timeline.duration) - b.start, lt = t - b.start, k = clamp(lt / dur);

  // ----- insert beats: flat graphics only -----
  const isInsert = !!b.insert;
  insCanvas.style.opacity = isInsert ? 1 : 0;
  if (isInsert) drawInsert(insCtx, b.insert, { t, lt, k, dur, step: b.step || 1, W, H });

  // ----- 3D -----
  if (!isInsert) {
    // card beats borrow the scene of the next real beat for their background
    const sceneName = b.scene || 'tanis', phase = b.phase || (sceneName === 'today' ? 'today' : 'calm');
    for (const [n, g] of Object.entries(sets)) g.visible = n === sceneName;
    const p = applyPhase(phase);
    // per-phase set dressing
    const dinoPhase = ['calm', 'shake', 'surge', 'glassrain', 'glow'].includes(phase);
    herd.visible = sceneName === 'tanis' && !!(dinoPhase || b.dinos);
    const dead = ['fires', 'dark', 'cold', 'recovery'].includes(phase);
    trees.forEach(tr => tr.visible = !(phase === 'dark' || phase === 'cold' || phase === 'recovery'));
    burnt.visible = phase === 'dark' || phase === 'cold' || phase === 'recovery';
    shrubs.forEach(s => s.visible = !dead);
    ferns.forEach(f => f.visible = phase !== 'cold');
    carpet.visible = phase === 'recovery';
    clouds.visible = !!p.clouds;
    // dino idle
    for (const d of [trike, trikeJr, edmo, rex]) { const h = d.userData.head; if (h) { h.rotation.z = Math.sin(t * 0.8 + d.position.x) * 0.08 - (d === trike || d === trikeJr ? 0.12 + Math.max(0, Math.sin(t * 0.4 + d.position.x)) * 0.2 : 0); h.rotation.y = Math.sin(t * 0.5 + d.position.z) * 0.15; } }
    // river: flow (backwards during the surge), level rise
    const surge = phase === 'surge' ? ease(clamp(lt / 2.5)) : 0;
    rippleTex.offset.x = (phase === 'surge' ? -1 : 1) * t * (phase === 'surge' ? 0.6 : 0.05);
    river.position.y = 0.03 + surge * 0.38; river.scale.y = 1 + surge * 1.35; river.position.z = -3.3 + surge * 1.4;
    waterMat.color.set(phase === 'surge' ? '#6a7a6a' : dead ? '#4a5a62' : '#3f86ad');
    foam.visible = debris.visible = surge > 0.01;
    if (foam.visible) {
      for (let i = 0; i < 160; i++) { const sp = 2 + hashf(i, 3) * 3; const x = ((hashf(i) * 2 * IR + t * sp) % (2 * IR)) - IR; const z = -3.3 + surge * 1.4 + (hashf(i, 2) - 0.5) * 2.9 * (1 + surge * 1.35); const s = 0.6 + hashf(i, 4) * 1.4;
        m4.compose(V(-x, river.position.y + 0.03, z), q4.identity(), V(s, 0.5 * s, s)); foam.setMatrixAt(i, m4); }
      foam.instanceMatrix.needsUpdate = true;
      for (let i = 0; i < 14; i++) { const x = ((hashf(i, 7) * 2 * IR + t * 2.4) % (2 * IR)) - IR; const z = -3.3 + surge * 1.4 + (hashf(i, 8) - 0.5) * 3; e4.set(Math.PI / 2, hashf(i, 9) * 3, Math.PI / 2 + Math.sin(t + i) * 0.2); q4.setFromEuler(e4);
        m4.compose(V(-x, river.position.y + 0.05, z), q4, V(1, 0.8 + hashf(i) * 1.5, 1)); debris.setMatrixAt(i, m4); }
      debris.instanceMatrix.needsUpdate = true;
    }
    // shaking: whole set jitters
    const shake = (phase === 'shake' ? 1 : phase === 'surge' ? 0.4 : 0) * (0.6 + 0.4 * Math.sin(t * 1.7));
    tanis.position.set(Math.sin(t * 31) * 0.035 * shake, Math.sin(t * 43) * 0.02 * shake, Math.cos(t * 37) * 0.03 * shake);
    // fire + smoke
    const fireOn = phase === 'fires';
    flames.forEach(s => { s.visible = fireOn; if (!fireOn) return; const { x, z, h, f } = s.userData; const fl = 0.75 + 0.25 * Math.sin(t * 13 + f * 2.1 + x) * Math.sin(t * 7.3 + f);
      s.position.set(x + Math.sin(f * 2) * 0.35, h * (0.35 + f * 0.13) + Math.sin(t * 9 + f) * 0.05, z + Math.cos(f * 2) * 0.35); s.scale.set(1.3 * fl, 2.0 * fl, 1); });
    smokes.forEach(s => { s.visible = fireOn; if (!fireOn) return; const { x, z, h, f } = s.userData; const ph = ((t * 0.18 + f / 6) % 1); s.position.set(x + ph * 2.5, h + ph * 9, z - ph * 1.5); s.scale.setScalar(1.2 + ph * 4.5); s.material.opacity = 0.75 * Math.sin(ph * Math.PI); });
    // sun position in sky
    skyMat.uniforms.sunDir.value.copy(key.position).normalize();

    // subject
    const pose = b.gary?.pose || (b.card ? null : 'stand'), expr = b.gary?.expr || 'neutral';
    const isCritter = pose === 'critter';
    gary.root.visible = !!pose && !isCritter && !b.card;
    garyCritter.visible = isCritter && !b.card;
    critter.visible = sceneName === 'burrow' && !isCritter;
    let P, Hd, s = 1;
    if (isCritter) {
      const at0 = sceneName === 'burrow' ? CRITTER_BURROW : V(0.4, 0, 1.6);
      garyCritter.position.copy(at0); garyCritter.rotation.set(0, sceneName === 'burrow' ? 0.5 : 0.3 + Math.sin(t * 0.4) * 0.3, 0); poseCritter(garyCritter, t, expr);
      s = 0.32; P = at0.clone(); Hd = at0.clone().add(V(0, 0.3, 0.22));
    } else {
      const base = pose === 'shelter' && sceneName === 'tanis' ? SHELTER : sceneName === 'today' ? V(0, 0, 0.6) : V(0, 0, 1.2);
      gary.root.position.copy(base); if (pose === 'run') gary.root.position.x += lerp(-1.2, 1.4, k);
      gary.root.rotation.set(0, 0, 0);
      poseGary(gary, pose || 'stand', expr, t, k);
      if (sceneName === 'today') gary.root.rotation.y += -0.35;
      gary.root.updateMatrixWorld(true);
      P = gary.root.position.clone(); Hd = new THREE.Vector3(); gary.j.head.getWorldPosition(Hd);
    }
    if (sceneName === 'burrow' && !isCritter) { P = CRITTER_BURROW.clone(); Hd = P.clone().add(V(0, 0.3, 0.2)); s = 0.32; critter.position.copy(CRITTER_BURROW); critter.rotation.y = 0.5; poseCritter(critter, t); }
    denLight.intensity = sceneName === 'burrow' ? 6 : 0;

    // camera
    const camName = b.card ? 'wide' : (b.camera || 'push');
    const mv = (MOVES[camName] || MOVES.push)(ease(k), P, Hd, s, sceneName);
    camera.position.copy(mv.pos); camera.fov = mv.fov; camera.updateProjectionMatrix();
    const hand = V(Math.sin(t * 0.9) * 0.02, Math.sin(t * 1.3) * 0.015, 0).multiplyScalar(mv.wide ? 3 : s);
    camera.position.add(hand); camera.lookAt(mv.look.clone().add(V(shake * Math.sin(t * 29) * 0.04, shake * Math.sin(t * 23) * 0.03, 0)));
    // glass beads
    const beadOn = phase === 'glassrain' ? 1 : phase === 'glow' ? 0.45 : 0;
    beads.visible = beadOn > 0 && sceneName === 'tanis';
    if (beads.visible) { const n = Math.floor(N_BEADS * beadOn); for (let i = 0; i < N_BEADS; i++) { if (i >= n) { m4.makeScale(0, 0, 0); beads.setMatrixAt(i, m4); continue; }
      const x = (hashf(i, 11) - 0.5) * 2 * IR, z = (hashf(i, 12) - 0.5) * 2 * IR; const y = 12 - ((t * 7.5 + hashf(i, 13) * 12) % 12);
      const pv = V(x + tanis.position.x, y, z); if (pv.distanceToSquared(camera.position) < 7) m4.makeScale(0, 0, 0); else m4.compose(pv, q4.identity(), V(1, 5, 1)); beads.setMatrixAt(i, m4); } beads.instanceMatrix.needsUpdate = true; }
    // ash / snow
    const ashOn = phase === 'dark' ? 1 : phase === 'cold' ? 1 : phase === 'fires' ? 0.5 : (sceneName === 'burrow' ? 0.6 : 0);
    ash.visible = ashOn > 0; ashMat.color.set(phase === 'cold' ? '#f2f6fa' : '#b8b0a6');
    if (ash.visible) { const n = Math.floor(N_ASH * ashOn); for (let i = 0; i < N_ASH; i++) { if (i >= n) { m4.makeScale(0, 0, 0); ash.setMatrixAt(i, m4); continue; }
      const sp = 0.5 + hashf(i, 21) * 0.5; const y = 10 - ((t * sp + hashf(i, 22) * 10) % 10); const x = (hashf(i, 23) - 0.5) * 2 * IR + Math.sin(t * 0.7 + i) * 0.4, z = (hashf(i, 24) - 0.5) * 2 * IR + Math.cos(t * 0.5 + i) * 0.4;
      e4.set(t * 1.3 + i, t * 0.9 + i * 2, 0); q4.setFromEuler(e4); const pv = V(x, sceneName === 'burrow' ? y * 0.6 : y, sceneName === 'burrow' ? (hashf(i, 25) - 0.5) * BD : z); if (pv.distanceToSquared(camera.position) < (sceneName === 'burrow' ? 0.5 : 3)) m4.makeScale(0, 0, 0); else m4.compose(pv, q4, V(1, 1, 1)); ash.setMatrixAt(i, m4); } ash.instanceMatrix.needsUpdate = true; }
    // key light follows the set so shadows stay crisp around the subject
    key.target.position.set(0, 0, sceneName === 'burrow' ? 0 : -1); key.target.updateMatrixWorld();
    if (sceneName === 'burrow') key.position.set(3, 9, 9);
    // depth of field: focus on the subject (tilt-shift on wide shots)
    const fd = camera.position.distanceTo(mv.wide ? V(0, 0, sceneName === 'burrow' ? 1 : -0.5) : Hd);
    bokeh.uniforms.focus.value = fd; bokeh.uniforms.aperture.value = mv.wide ? 0.0011 : 0.0016 / s; bokeh.uniforms.maxblur.value = b.card ? 0.012 : 0.007;
    composer.render();
  }

  // ----- overlays -----
  const lab = b.card ? '' : (b.label || '');
  if (lab !== lastLabel) { labelEl.innerHTML = esc(lab).replace(/\*(.+?)\*/g, '<span class="hot">$1</span>'); lastLabel = lab; }
  labelEl.style.display = lab ? 'block' : 'none';
  const lk = clamp(lt / 0.35); labelEl.style.transform = `scale(${lab && (bi === 0 || beats[bi - 1].label !== b.label) ? 0.6 + 0.4 * easeOut(lk) + Math.sin(lk * Math.PI) * 0.08 : 1})`;
  // chapter card
  if (b.card) { cardEl.firstElementChild.textContent = b.card.title; cardEl.children[1].textContent = b.card.subtitle;
    const ck = Math.min(clamp(lt / 0.4), clamp((dur - lt) / 0.35)); cardEl.style.opacity = ck; cardEl.children[1].style.transform = `translateY(${(1 - easeOut(clamp(lt / 0.6))) * 30}px)`; cardEl.children[2].style.transform = `scaleX(${easeOut(clamp((lt - 0.2) / 0.6))})`; }
  else cardEl.style.opacity = 0;
  // hook title
  if (b.hook) { titleEl.textContent = 'THE DAY THE DINOSAURS DIED'; titleEl.style.opacity = clamp((lt - 0.3) / 0.4) * clamp((3.6 - lt) / 0.4); } else titleEl.style.opacity = 0;
  // subtitles
  const g = script.captions === false || b.card ? null : subAt(t);
  if (g !== lastSub) { subEl.innerHTML = g ? esc(g.words.join(' ')) : ''; subEl.style.display = g ? 'inline-block' : 'none'; lastSub = g; }
  // cut dip
  fadeEl.style.opacity = bi > 0 ? 0.55 * (1 - clamp(lt / 0.22)) : clamp(1 - t / 0.5);
};

window.renderFrame(0.01);
window.READY = true;
