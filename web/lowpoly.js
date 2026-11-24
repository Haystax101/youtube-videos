// "lowpoly" style for Gary Tries It: faceted, flat-shaded 3D people in floating diorama rooms.
// Separate renderer from web/scene.js (the cartoon/noir/news styles); same page contract:
// window.renderFrame(t), window.DURATION, window.READY. Loaded by pipeline/render.mjs when
// script.json has "style": "lowpoly".
//
// Script vocabulary for this style:
//   scene: livingroom, office, car, hospital, gaming, garden (lawn, fence, beehive), void
//   gary: { pose, expr, build, welts }  welts: true -> red sting bumps on the face   pose: stand, sit, type, hunch, sofa, slouch, drive, bedsit, game, clipboard, ghost
//                                 expr: happy, neutral, worried, tired, shocked, sick, dead
//                                 build: 0 (default) .. 1 (much heavier), for weight-gain arcs
//   cast: [{ who: "doctor", pose }]  extra people placed at the scene's cast spot; a line with
//                                 "speaker": "doctor" animates that person's mouth
//   props: ["pizza"]   fx: "clot" (glowing clot in the calf), "clot_move" (clot travels to the lungs),
//                      "bees" (a full swarm around Gary), "bees_few" (a handful)
//   camera: push, face, wide, side, low, front, two, legs
//   death: true -> clutch chest, then slump; red pulse. No deaths counter in this style.
import * as THREE from 'three';

const W = 1080, H = 1920;
const ep = new URLSearchParams(location.search).get('ep');
const script = await (await fetch(`/episodes/${ep}/script.json`)).json();
const timeline = await (await fetch(`/episodes/${ep}/timeline.json`)).json();
await document.fonts.load('900 100px Poppins');
await document.fonts.load('800 100px Poppins');

// ---------- utilities ----------
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => { t = clamp(t); return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };
const easeOut = t => 1 - Math.pow(1 - clamp(t), 3);
const backOut = t => { t = clamp(t); const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hash3(x, y, z, s) { let h = Math.imul(Math.round(x * 997) ^ Math.imul(Math.round(y * 991), 31) ^ Math.imul(Math.round(z * 983), 17) ^ s, 0x9E3779B1); h ^= h >>> 15; h = Math.imul(h, 0x85EBCA77); h ^= h >>> 13; return ((h >>> 0) % 10000) / 5000 - 1; }
// move every vertex a little (same amount for vertices that share a position) -> organic facets
function jitter(geo, amt, seed = 1) {
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    p.setXYZ(i, x + hash3(x, y, z, seed) * amt, y + hash3(y, z, x, seed + 1) * amt, z + hash3(z, x, y, seed + 2) * amt);
  }
  geo.computeVertexNormals(); return geo;
}
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.userData.canvas = c; return t;
}
function gradient(top, bottom) { return canvasTex(16, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, top); gr.addColorStop(1, bottom); g.fillStyle = gr; g.fillRect(0, 0, w, h); }); }

// ---------- renderer ----------
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gl'), antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, W / H, 0.05, 120);
const hemi = new THREE.HemisphereLight(0xffffff, 0xb59b86, 1.5); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff1dc, 2.6);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.radius = 4; sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.02;
Object.assign(sun.shadow.camera, { left: -4.5, right: 4.5, top: 4.5, bottom: -4.5, near: 0.5, far: 30 });
scene.add(sun, sun.target);
const screenLight = new THREE.PointLight(0x7fb8ff, 0, 6, 1.5); scene.add(screenLight);

const matCache = {};
const M = (color, extra) => {
  const key = color + JSON.stringify(extra || {});
  return matCache[key] || (matCache[key] = new THREE.MeshLambertMaterial({ color, flatShading: true, ...extra }));
};
const glow = (color) => new THREE.MeshBasicMaterial({ color });
function mesh(geo, material) { const m = new THREE.Mesh(geo, typeof material === 'string' ? M(material) : material); m.castShadow = m.receiveShadow = true; return m; }
const at = (o, x, y, z, rx = 0, ry = 0, rz = 0) => { o.position.set(x, y, z); o.rotation.set(rx, ry, rz); return o; };
const box = (w, h, d, c, j = 0) => mesh(j ? jitter(new THREE.BoxGeometry(w, h, d, 1, 1, 1), j) : new THREE.BoxGeometry(w, h, d), c);
const cyl = (rt, rb, h, c, seg = 7, j = 0) => mesh(j ? jitter(new THREE.CylinderGeometry(rt, rb, h, seg), j) : new THREE.CylinderGeometry(rt, rb, h, seg), c);
const ico = (r, c, detail = 0, j = 0, seed = 1) => mesh(j ? jitter(new THREE.IcosahedronGeometry(r, detail), j, seed) : new THREE.IcosahedronGeometry(r, detail), c);
const cone = (r, h, c, seg = 6) => mesh(new THREE.ConeGeometry(r, h, seg), c);
// limb: cylinder whose top sits at the parent joint and hangs down -y
function limb(rt, rb, len, c, seg = 6) { const g = new THREE.CylinderGeometry(rt, rb, len, seg); g.translate(0, -len / 2, 0); return mesh(g, c); }

// ---------- people ----------
const PEOPLE = {
  gary: { skin: '#f1c19a', hair: '#5a3a22', hairStyle: 'messy', top: '#f29a2e', bottom: '#384062', shoes: '#f4f4f4', hood: true },
  doctor: { skin: '#9a6544', hair: '#1d1713', hairStyle: 'bun', top: '#2a9d8f', bottom: '#2a9d8f', shoes: '#ffffff', coat: '#f7f7f2', glasses: true, steth: true },
  ghost: { skin: '#e8f1ff', hair: '#cfdcff', hairStyle: 'messy', top: '#dfe9ff', bottom: '#c9d6f7', shoes: '#ffffff', hood: true, ghost: true },
};
function makeHuman(o) {
  const mats = {};
  const ghostMat = c => new THREE.MeshLambertMaterial({ color: c, flatShading: true, transparent: true, opacity: 0.9, emissive: new THREE.Color('#8fb0ff'), emissiveIntensity: 0.35 });
  const C = (c) => o.ghost ? (mats[c] ||= ghostMat(c)) : M(c);
  const skinMat = o.ghost ? C(o.skin) : new THREE.MeshLambertMaterial({ color: o.skin, flatShading: true });
  const part = (geo, c) => { const m = new THREE.Mesh(geo, c === 'skin' ? skinMat : C(c)); m.castShadow = !o.ghost; m.receiveShadow = true; return m; };
  const L = (rt, rb, len, c, seg = 6) => { const g = new THREE.CylinderGeometry(rt, rb, len, seg); g.translate(0, -len / 2, 0); return part(g, c); };
  const G = () => new THREE.Group();
  const j = {};
  const root = G();
  j.hips = G(); j.hips.position.y = 0.95; root.add(j.hips);
  j.hips.add(at(part(jitter(new THREE.CylinderGeometry(0.15, 0.14, 0.17, 7), 0.006), o.bottom), 0, 0, 0));
  j.spine = G(); j.spine.position.y = 0.07; j.hips.add(j.spine);
  const belly = part(jitter(new THREE.IcosahedronGeometry(0.15, 1), 0.008, 3), o.top); belly.position.set(0, 0.07, 0.02); j.spine.add(belly);
  j.chest = G(); j.chest.position.y = 0.19; j.spine.add(j.chest);
  const torso = part(jitter(new THREE.CylinderGeometry(0.2, 0.155, 0.38, 7), 0.008, 4), o.top); torso.position.y = -0.02; j.chest.add(torso);
  const shoulders = part(jitter(new THREE.CylinderGeometry(0.13, 0.2, 0.08, 7), 0.006, 5), o.top); shoulders.position.y = 0.2; j.chest.add(shoulders);
  if (o.hood) { const hood = part(new THREE.TorusGeometry(0.105, 0.045, 4, 8), o.top); hood.rotation.x = Math.PI / 2 - 0.35; hood.position.set(0, 0.22, -0.03); j.chest.add(hood); }
  if (o.coat) {
    const coat = part(jitter(new THREE.CylinderGeometry(0.215, 0.2, 0.44, 7, 1, true), 0.006, 6), o.coat); coat.material.side = THREE.DoubleSide; coat.position.y = 0; j.chest.add(coat);
    const skirt = part(new THREE.CylinderGeometry(0.2, 0.25, 0.55, 7, 1, true), o.coat); skirt.material.side = THREE.DoubleSide; skirt.position.y = -0.3; j.hips.add(skirt);
    const lapel = part(new THREE.BoxGeometry(0.12, 0.3, 0.02), o.top); lapel.position.set(0, 0.04, 0.17); j.chest.add(lapel);
  }
  j.neck = G(); j.neck.position.y = 0.22; j.chest.add(j.neck);
  const neckM = part(new THREE.CylinderGeometry(0.052, 0.058, 0.11, 6), 'skin'); neckM.position.y = 0.04; j.neck.add(neckM);
  if (o.steth) { const s = part(new THREE.TorusGeometry(0.085, 0.012, 4, 10, Math.PI * 1.4), '#30343f'); s.rotation.set(Math.PI / 2 + 0.3, 0, -Math.PI * 0.2 - Math.PI / 2); s.position.set(0, 0.0, 0.03); j.neck.add(s); }
  j.head = G(); j.head.position.y = 0.09; j.neck.add(j.head);
  const skull = part(jitter(new THREE.IcosahedronGeometry(0.125, 1), 0.006, 7), 'skin'); skull.scale.set(0.92, 1.06, 0.98); skull.position.y = 0.11; j.head.add(skull);
  const jaw = part(jitter(new THREE.CylinderGeometry(0.085, 0.06, 0.07, 6), 0.004, 8), 'skin'); jaw.position.set(0, 0.035, 0.015); j.head.add(jaw);
  const nose = part(new THREE.ConeGeometry(0.022, 0.05, 4), 'skin'); nose.rotation.x = Math.PI / 2; nose.position.set(0, 0.095, 0.125); j.head.add(nose);
  for (const s of [-1, 1]) { const ear = part(new THREE.IcosahedronGeometry(0.03, 0), 'skin'); ear.scale.set(0.45, 1, 0.8); ear.position.set(s * 0.113, 0.1, -0.005); j.head.add(ear); }
  const face = { eyes: [], brows: [], xs: [], mouthSeg: [] };
  const eyeMat = o.ghost ? C('#5a6a99') : M('#1c1b26');
  for (const s of [-1, 1]) {
    const e = new THREE.Mesh(new THREE.IcosahedronGeometry(0.018, 1), eyeMat); e.position.set(s * 0.045, 0.125, 0.107); j.head.add(e); face.eyes.push(e);
    const shine = new THREE.Mesh(new THREE.IcosahedronGeometry(0.006, 0), glow('#ffffff')); shine.position.set(0.006, 0.007, 0.014); e.add(shine);
    const b = part(new THREE.BoxGeometry(0.056, 0.015, 0.018), o.hair); b.position.set(s * 0.047, 0.168, 0.104); j.head.add(b); face.brows.push(b);
    const x = G(); x.position.copy(e.position);
    for (const r of [0.8, -0.8]) { const bar = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.01, 0.01), eyeMat); bar.rotation.z = r; x.add(bar); }
    x.visible = false; j.head.add(x); face.xs.push(x);
  }
  face.mouth = G(); face.mouth.position.set(0, 0.052, 0.112); j.head.add(face.mouth);
  for (let i = -1; i <= 1; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.008, 0.012), M('#7a3b3b')); m.position.x = i * 0.025; face.mouth.add(m); face.mouthSeg.push(m); }
  face.open = new THREE.Mesh(new THREE.IcosahedronGeometry(0.022, 1), M('#5b1f24')); face.open.scale.set(1, 0.6, 0.45); face.mouth.add(face.open);
  // hair
  const hair = G(); hair.position.y = 0.11; j.head.add(hair);
  const cap = part(jitter(new THREE.SphereGeometry(0.134, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.52), 0.007, 9), o.hair); cap.scale.set(0.95, 1.08, 1.02); cap.rotation.x = -0.32; cap.position.set(0, 0.008, -0.008); hair.add(cap);
  if (o.hairStyle === 'messy') {
    const r = rng(17);
    for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2, tuft = part(new THREE.TetrahedronGeometry(0.05 + r() * 0.02, 0), o.hair); tuft.position.set(Math.cos(a) * 0.08, 0.1 + r() * 0.03, Math.sin(a) * 0.08 - 0.01); tuft.rotation.set(r() * 3, r() * 3, r() * 3); hair.add(tuft); }
    const fringe = part(new THREE.TetrahedronGeometry(0.06, 0), o.hair); fringe.position.set(0.03, 0.085, 0.085); fringe.rotation.set(0.3, 0.6, 0.2); hair.add(fringe);
    const lick = part(new THREE.ConeGeometry(0.025, 0.09, 4), o.hair); lick.position.set(-0.01, 0.16, -0.02); lick.rotation.set(-0.5, 0, 0.3); hair.add(lick);
  } else if (o.hairStyle === 'bun') {
    const bun = part(jitter(new THREE.IcosahedronGeometry(0.06, 1), 0.005, 10), o.hair); bun.position.set(0, 0.11, -0.09); hair.add(bun);
    for (const s of [-1, 1]) { const side = part(new THREE.BoxGeometry(0.03, 0.12, 0.12), o.hair); side.position.set(s * 0.115, -0.02, -0.02); hair.add(side); }
  }
  if (o.glasses) {
    for (const s of [-1, 1]) { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.028, 0.005, 4, 8), M('#26262e')); ring.position.set(s * 0.046, 0.125, 0.118); j.head.add(ring); }
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.006, 0.006), M('#26262e')); bridge.position.set(0, 0.128, 0.12); j.head.add(bridge);
  }
  if (o.ghost) { const halo = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.016, 5, 14), glow('#ffd166')); halo.rotation.x = Math.PI / 2; halo.position.y = 0.33; j.head.add(halo); }
  // arms + legs
  const sleeve = o.coat || o.top;
  const limbs = {};
  for (const [s, k] of [[1, 'L'], [-1, 'R']]) {
    const sh = G(); sh.position.set(s * 0.2, 0.16, 0); j.chest.add(sh); j['sh' + k] = sh;
    sh.add(at(part(new THREE.IcosahedronGeometry(0.062, 0), sleeve), 0, 0, 0));
    const ua = L(0.055, 0.047, 0.28, sleeve); sh.add(ua);
    const el = G(); el.position.y = -0.28; sh.add(el); j['el' + k] = el;
    const fa = L(0.047, 0.04, 0.25, o.coat ? o.coat : o.top); el.add(fa);
    const ha = G(); ha.position.y = -0.25; el.add(ha); j['ha' + k] = ha;
    const hand = part(jitter(new THREE.BoxGeometry(0.065, 0.095, 0.035), 0.006, 11 + s), 'skin'); hand.position.y = -0.045; ha.add(hand);
    const thumb = part(new THREE.BoxGeometry(0.02, 0.045, 0.022), 'skin'); thumb.position.set(-s * 0.035, -0.03, 0.02); thumb.rotation.z = s * 0.4; ha.add(thumb);
    const hip = G(); hip.position.set(s * 0.085, -0.04, 0); j.hips.add(hip); j['hip' + k] = hip;
    const th = L(0.078, 0.06, 0.43, o.bottom); hip.add(th);
    const kn = G(); kn.position.y = -0.43; hip.add(kn); j['kn' + k] = kn;
    const sn = L(0.058, 0.046, 0.41, o.bottom); kn.add(sn);
    const an = G(); an.position.y = -0.42; kn.add(an); j['an' + k] = an;
    const shoe = part(jitter(new THREE.BoxGeometry(0.1, 0.075, 0.23), 0.006, 13 + s), o.shoes); shoe.position.set(0, -0.025, 0.045); an.add(shoe);
    const sole = part(new THREE.BoxGeometry(0.104, 0.02, 0.235), '#3a3a44'); sole.position.set(0, -0.06, 0.045); an.add(sole);
    limbs[k] = { ua, fa, th, sn };
  }
  return { root, j, face, belly, torso, shoulders, skinMat, limbs, opts: o, neckM };
}

// pose library: joint -> [x, y, z] euler. Arm/leg values are for the left side; right side mirrors (x, -y, -z).
const SYM = ['sh', 'el', 'ha', 'hip', 'kn', 'an'];
const BASE = { hipsY: 0.95, hipsZ: 0, hips: [0, 0, 0], spine: [0, 0, 0], chest: [0, 0, 0], neck: [0, 0, 0], head: [0, 0, 0],
  sh: [0.05, 0, 0.1], el: [-0.2, 0, 0], ha: [0, 0, 0], hip: [0, 0, 0.02], kn: [0, 0, 0], an: [0, 0, 0] };
const SIT = { hipsY: 0.53, hip: [-1.5, 0, 0.06], kn: [1.48, 0, 0], an: [0.02, 0, 0], sh: [-0.45, 0, 0.1], el: [-0.75, 0, -0.15] };
const POSES = {
  stand: {},
  sit: SIT,
  type: { ...SIT, spine: [0.08, 0, 0], neck: [0.12, 0, 0], head: [0.12, 0, 0], sh: [-0.6, 0, 0.14], el: [-1.05, 0, -0.5], ha: [-0.3, 0, 0] },
  hunch: { ...SIT, spine: [0.32, 0, 0], chest: [0.2, 0, 0], neck: [0.22, 0, 0], head: [-0.05, 0, 0], sh: [-0.25, 0, 0.16], el: [-1.25, 0, -0.55], ha: [-0.3, 0, 0] },
  sofa: { ...SIT, hipsY: 0.5, spine: [-0.14, 0, 0], neck: [0.06, 0, 0], head: [0.06, 0, 0], hip: [-1.38, 0, 0.12], kn: [1.32, 0, 0], sh: [-0.35, 0, 0.32], el: [-0.85, 0, -0.35] },
  slouch: { ...SIT, hipsY: 0.43, hipsZ: 0.16, spine: [-0.42, 0, 0], chest: [-0.12, 0, 0], neck: [0.32, 0, 0], head: [0.22, 0, 0], hip: [-1.12, 0, 0.18], kn: [1.05, 0, 0],
    shL: [-0.15, 0, 0.3], elL: [-1.2, 0, -0.9], shR: [-0.85, 0, -0.25], elR: [-1.35, 0, 0.35] },
  drive: { ...SIT, sh: [-1.0, 0, 0.12], el: [-0.55, 0, -0.38], ha: [-0.2, 0, 0], neck: [0.05, 0, 0] },
  bedsit: { ...SIT, hipsY: 0.7, hip: [-1.45, 0, 0.08], kn: [1.25, 0, 0], sh: [-0.55, 0, 0.12], el: [-0.55, 0, -0.1], neck: [0.15, 0, 0], head: [0.1, 0, 0] },
  game: { ...SIT, spine: [0.16, 0, 0], neck: [0.15, 0, 0], head: [-0.05, 0, 0], sh: [-0.5, 0, 0.12], el: [-1.45, 0, -0.75], ha: [-0.4, 0, 0] },
  clipboard: { shR: [-0.55, 0, -0.12], elR: [-1.25, 0, 0.55], haR: [0, 0, 0], shL: [-0.45, 0, 0.12], elL: [-1.35, 0, -0.75], head: [0.08, 0, 0] },
  ghost: { hipsY: 1.0, hip: [-0.35, 0, 0.06], kn: [0.7, 0, 0], an: [0.5, 0, 0], sh: [-0.15, 0, 0.55], el: [-0.35, 0, 0] },
  clutch: { ...SIT, spine: [0.05, 0, 0], chest: [-0.1, 0, 0], neck: [-0.15, 0, 0], head: [-0.15, 0, 0], sh: [-0.95, 0, 0.28], el: [-1.95, 0, -1.0], ha: [0, 0, 0] },
  slump: { ...SIT, hipsZ: 0.08, spine: [0.35, 0, 0.12], chest: [0.2, 0, 0.05], neck: [0.2, 0, 0], head: [0.05, 0.35, 0.55], sh: [0.15, 0, 0.12], el: [-0.12, 0, 0], ha: [0, 0, 0],
    hipL: [-1.4, 0, 0.2], hipR: [-1.5, 0, -0.02], knL: [1.2, 0, 0] },
};
function resolvePose(name) {
  const p = { ...BASE, ...(POSES[name] || {}) }, out = { hipsY: p.hipsY, hipsZ: p.hipsZ };
  for (const k of ['hips', 'spine', 'chest', 'neck', 'head']) out[k] = p[k];
  for (const s of SYM) {
    const l = p[s + 'L'] || p[s], r = p[s + 'R'] || [p[s][0], -p[s][1], -p[s][2]];
    out[s + 'L'] = l; out[s + 'R'] = r;
  }
  return out;
}
function blendPose(a, b, k) {
  const o = {};
  for (const key in a) o[key] = Array.isArray(a[key]) ? a[key].map((v, i) => lerp(v, b[key][i], k)) : lerp(a[key], b[key], k);
  return o;
}
function applyPose(h, p) {
  h.j.hips.position.set(0, p.hipsY, p.hipsZ);
  for (const key in p) if (Array.isArray(p[key]) && h.j[key]) h.j[key].rotation.set(...p[key]);
}
function setBuild(h, b) {
  const s = 1 + 0.32 * b;
  h.belly.scale.set(0.95 + 0.35 * b, 0.95 + 0.2 * b, 0.85 + 0.5 * b);
  h.torso.scale.set(1 + 0.18 * b, 1, 1 + 0.3 * b);
  h.shoulders.scale.set(1 + 0.12 * b, 1, 1 + 0.2 * b);
  for (const k of ['L', 'R']) { const l = h.limbs[k]; l.ua.scale.set(1 + 0.25 * b, 1, 1 + 0.25 * b); l.fa.scale.set(1 + 0.18 * b, 1, 1 + 0.18 * b); l.th.scale.set(s, 1, s); l.sn.scale.set(1 + 0.15 * b, 1, 1 + 0.15 * b); }
  h.j.shL.position.x = 0.2 + 0.03 * b; h.j.shR.position.x = -0.2 - 0.03 * b;
  h.j.hipL.position.x = 0.085 + 0.02 * b; h.j.hipR.position.x = -0.085 - 0.02 * b;
  h.neckM.scale.set(1 + 0.4 * b, 1, 1 + 0.4 * b);
}
const SKIN_SICK = new THREE.Color('#c9c99a');
function setFace(h, expr, { blink = false, mouth = 0, t = 0 } = {}) {
  const f = h.face; const dead = expr === 'dead';
  let ey = 1.2, es = 1, browY = 0.168, browRot = 0, curve = 0, open = 0;
  if (expr === 'happy') { ey = 0.55; curve = 1; browY = 0.172; }
  if (expr === 'worried') { browRot = 0.38; curve = -0.6; browY = 0.172; }
  if (expr === 'tired') { ey = 0.45; browRot = 0.12; browY = 0.162; curve = -0.3; }
  if (expr === 'sick') { ey = 0.6; browRot = 0.3; curve = -0.8; }
  if (expr === 'shocked') { ey = 1.55; es = 1.35; browY = 0.186; open = 0.9 + 0.1 * Math.sin(t * 9); }
  if (blink && !dead && expr !== 'shocked') ey = 0.12;
  f.eyes.forEach((e, i) => { e.visible = !dead; e.scale.set(es, ey * es, 0.6); });
  f.xs.forEach(x => { x.visible = dead; });
  f.brows.forEach((b, i) => { const s = i ? 1 : -1; b.position.y = browY; b.rotation.z = -s * browRot * -1 * (s > 0 ? -1 : 1) * (s > 0 ? 1 : 1); });
  // inner ends up for worried: brow at +x rotates negative z, brow at -x positive z
  f.brows[0].rotation.z = browRot; f.brows[1].rotation.z = -browRot;
  open = Math.max(open, mouth);
  if (dead) { curve = -0.3; open = 0; }
  f.open.visible = open > 0.05; f.open.scale.set(1 + 0.3 * open, 0.25 + 1.1 * open, 0.45);
  f.mouthSeg.forEach((m, i) => { m.visible = open < 0.5; const side = i - 1; m.position.y = Math.abs(side) * curve * 0.009; m.rotation.z = side * curve * 0.4; });
  if (!h.opts.ghost) h.skinMat.color.set(h.opts.skin).lerp(SKIN_SICK, expr === 'sick' || expr === 'tired' ? 0.25 : 0);
}

const gary = makeHuman(PEOPLE.gary); scene.add(gary.root);
const ghost = makeHuman(PEOPLE.ghost); scene.add(ghost.root);
const doctor = makeHuman(PEOPLE.doctor); scene.add(doctor.root);
const CAST = { doctor };

// held items
const controller = new THREE.Group();
controller.add(at(box(0.17, 0.035, 0.075, '#25252e'), 0, 0, 0));
for (const s of [-1, 1]) controller.add(at(box(0.05, 0.04, 0.09, '#25252e'), s * 0.075, -0.012, -0.02, 0, s * 0.3, 0));
controller.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.006, 0.02), glow('#36e0ff')), 0, 0.02, 0.02));
const clipboard = new THREE.Group();
clipboard.add(at(box(0.24, 0.32, 0.015, '#a0703f'), 0, 0, 0));
clipboard.add(at(box(0.21, 0.27, 0.005, '#ffffff'), 0, -0.01, 0.01));
for (let i = 0; i < 5; i++) clipboard.add(at(box(0.15, 0.008, 0.002, '#9aa3b5'), 0, 0.07 - i * 0.04, 0.014));
const slice = new THREE.Group();
{ const g = new THREE.CylinderGeometry(0.13, 0.13, 0.02, 3, 1, false, 0, Math.PI / 3.2); slice.add(mesh(g, '#f4b942')); slice.add(at(cyl(0.012, 0.012, 0.13, '#c97b32', 5), 0.06, 0.012, 0.11, 0, 0, Math.PI / 2)); }

// ---------- rooms (floating dioramas) ----------
function diorama({ w = 5.6, d = 5, wallH = 3.1, floor, edge, back, left, trim = '#ffffff' }) {
  const g = new THREE.Group();
  g.add(at(box(w, 0.32, d, edge), 0, -0.16, 0));
  const top = box(w, 0.02, d, floor); top.position.y = -0.005; g.add(top);
  g.add(at(box(w, wallH, 0.18, back), 0, wallH / 2, -d / 2 - 0.09));
  g.add(at(box(0.18, wallH, d + 0.18, left), -w / 2 - 0.09, wallH / 2, -0.09));
  g.add(at(box(w, 0.12, 0.05, trim), 0, 0.06, -d / 2 + 0.02));
  g.add(at(box(0.05, 0.12, d, trim), -w / 2 + 0.02, 0.06, 0));
  g.add(at(box(w + 0.18, 0.08, 0.2, shadeHex(back, -0.12)), -0.09, wallH, -d / 2 - 0.09));
  g.add(at(box(0.2, 0.08, d + 0.2, shadeHex(left, -0.12)), -w / 2 - 0.09, wallH, -0.1));
  return g;
}
function shadeHex(hex, amt) { const c = new THREE.Color(hex), hsl = {}; c.getHSL(hsl); c.setHSL(hsl.h, hsl.s, clamp(hsl.l + amt)); return '#' + c.getHexString(); }
function windowPane(w, h, glass = '#bfe6ff', frame = '#ffffff', emissive = 0.4) {
  const g = new THREE.Group();
  const gm = new THREE.MeshLambertMaterial({ color: glass, emissive: new THREE.Color(glass), emissiveIntensity: emissive, flatShading: true });
  g.add(at(new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.03), gm), 0, 0, 0));
  for (const [x, y, bw, bh] of [[0, h / 2, w + 0.1, 0.07], [0, -h / 2, w + 0.1, 0.07], [-w / 2, 0, 0.07, h], [w / 2, 0, 0.07, h], [0, 0, 0.05, h], [0, 0, w, 0.05]]) g.add(at(box(bw, bh, 0.08, frame), x, y, 0.02));
  g.add(at(box(w + 0.25, 0.06, 0.18, frame), 0, -h / 2 - 0.06, 0.07));
  return g;
}
function plant(scale = 1, seed = 3) {
  const g = new THREE.Group(); const r = rng(seed);
  g.add(at(cyl(0.2, 0.15, 0.36, '#d9774f', 7), 0, 0.18, 0));
  g.add(at(cyl(0.21, 0.21, 0.05, '#c9653e', 7), 0, 0.36, 0));
  for (let i = 0; i < 6; i++) { const lf = ico(0.16 + r() * 0.08, i % 2 ? '#3f9d5b' : '#57b46c', 0, 0.02, seed + i); lf.position.set((r() - 0.5) * 0.3, 0.55 + r() * 0.45, (r() - 0.5) * 0.3); lf.scale.y = 1.3; g.add(lf); }
  g.scale.setScalar(scale); return g;
}
function lowTree(seed, h = 1) {
  const g = new THREE.Group(); const r = rng(seed);
  g.add(at(cyl(0.07, 0.1, 0.7 * h, '#8a5a3c', 5), 0, 0.35 * h, 0));
  const kind = r();
  if (kind < 0.5) { for (let i = 0; i < 3; i++) g.add(at(cone(0.55 - i * 0.12, 0.7, i % 2 ? '#3d8b4f' : '#4fa35d', 6), 0, (0.85 + i * 0.38) * h, 0)); }
  else g.add(at(ico(0.55, '#5bb05f', 0, 0.06, seed), 0, 1.1 * h, 0));
  return g;
}
function chairOffice(color = '#3a4a6b') {
  const g = new THREE.Group();
  g.add(at(box(0.5, 0.08, 0.48, color, 0.004), 0, 0.46, 0));
  g.add(at(box(0.46, 0.62, 0.07, color, 0.004), 0, 0.85, -0.27, -0.12));
  g.add(at(cyl(0.03, 0.03, 0.36, '#8d96a6', 6), 0, 0.26, 0));
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; const leg = box(0.3, 0.04, 0.05, '#2c2f38'); leg.position.set(Math.cos(a) * 0.15, 0.07, Math.sin(a) * 0.15); leg.rotation.y = -a; g.add(leg); g.add(at(ico(0.035, '#1e2027'), Math.cos(a) * 0.29, 0.035, Math.sin(a) * 0.29)); }
  return g;
}
function laptop() {
  const g = new THREE.Group();
  g.add(at(box(0.46, 0.025, 0.32, '#c9ced8'), 0, 0.012, 0));
  const lid = new THREE.Group(); lid.position.set(0, 0.025, 0.16); lid.rotation.x = 0.35 - Math.PI / 2 - 0.2;
  lid.add(at(box(0.46, 0.31, 0.02, '#c9ced8'), 0, 0.155, 0));
  lid.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.27, 0.005), glow('#9bd3ff')), 0, 0.155, -0.012));
  lid.add(at(new THREE.Mesh(new THREE.CircleGeometry(0.03, 6), glow('#ffffff')), 0, 0.16, 0.012));
  g.add(lid);
  return g;
}
function mug(c = '#ef476f') { const g = new THREE.Group(); g.add(at(cyl(0.05, 0.045, 0.11, c, 7), 0, 0.055, 0)); const hnd = mesh(new THREE.TorusGeometry(0.03, 0.01, 4, 6), c); hnd.position.set(0.055, 0.06, 0); g.add(hnd); return g; }
function books(n, seed) { const g = new THREE.Group(), r = rng(seed); let x = 0; const cols = ['#ef476f', '#ffd166', '#06d6a0', '#118ab2', '#8338ec', '#f78c6b']; for (let i = 0; i < n; i++) { const w = 0.05 + r() * 0.04, h = 0.22 + r() * 0.1; g.add(at(box(w, h, 0.18, cols[Math.floor(r() * cols.length)]), x, h / 2, 0, 0, 0, i === n - 1 ? 0.25 : 0)); x += w + 0.01; } return g; }
function frameArt(w, h, colors, seed) {
  const g = new THREE.Group(); const r = rng(seed);
  g.add(at(box(w + 0.08, h + 0.08, 0.04, '#2b2350'), 0, 0, 0));
  g.add(at(box(w, h, 0.045, colors[0]), 0, 0, 0.003));
  for (let i = 1; i < colors.length; i++) { const s = 0.15 + r() * 0.2; g.add(at(new THREE.Mesh(new THREE.IcosahedronGeometry(s * Math.min(w, h), 0), M(colors[i])), (r() - 0.5) * w * 0.5, (r() - 0.5) * h * 0.5, 0.03)); }
  return g;
}

const clockHands = [];
const ecg = canvasTex(256, 160, () => {});
const rgbStrips = [];
let roadMovers = [];
const wheels = [];
const ROOMS = {
  livingroom() {
    const g = diorama({ floor: '#c58b5c', edge: '#7f5638', back: '#f2d4a7', left: '#e7bf8d' });
    const rug = cyl(1.6, 1.6, 0.02, '#6c63c9', 10); rug.scale.z = 0.62; rug.position.set(0.2, 0.02, 0.7); g.add(rug);
    const sofa = new THREE.Group(); const sc = '#2a9d8f';
    sofa.add(at(box(2.3, 0.32, 0.9, shadeHex(sc, -0.06), 0.01), 0, 0.2, 0));
    for (const x of [-0.55, 0.55]) sofa.add(at(box(1.08, 0.14, 0.78, sc, 0.012), x, 0.42, 0.04));
    sofa.add(at(box(2.3, 0.6, 0.24, sc, 0.012), 0, 0.68, -0.36, -0.12));
    for (const x of [-1.22, 1.22]) sofa.add(at(box(0.22, 0.52, 0.9, shadeHex(sc, -0.04), 0.01), x, 0.42, 0));
    sofa.add(at(box(0.36, 0.32, 0.12, '#ffd166', 0.02), -0.82, 0.62, -0.2, -0.3, 0.2, 0.1));
    g.add(at(sofa, 0, 0, -0.22));
    const tableT = new THREE.Group(); tableT.add(at(box(1.1, 0.06, 0.6, '#8a5a3c'), 0, 0.4, 0)); for (const [x, z] of [[-0.48, -0.24], [0.48, -0.24], [-0.48, 0.24], [0.48, 0.24]]) tableT.add(at(box(0.05, 0.38, 0.05, '#6d452c'), x, 0.19, z));
    g.add(at(tableT, 0.25, 0, 1.05));
    const lamp = new THREE.Group(); lamp.add(at(cyl(0.16, 0.18, 0.04, '#2b2350'), 0, 0.02, 0)); lamp.add(at(cyl(0.02, 0.02, 1.5, '#2b2350', 5), 0, 0.77, 0)); lamp.add(at(cyl(0.16, 0.26, 0.3, '#fff3c4', 7), 0, 1.6, 0));
    const lampGlow = new THREE.PointLight(0xffd59a, 1.2, 3, 2); lampGlow.position.y = 1.5; lamp.add(lampGlow);
    g.add(at(lamp, -1.9, 0, -1.6));
    g.add(at(windowPane(1.5, 1.2), 0.6, 1.85, -2.48));
    g.add(at(plant(1.15, 5), 2.25, 0, -1.9));
    g.add(at(frameArt(0.7, 0.9, ['#ffd166', '#ef476f', '#118ab2'], 4), -2.7, 1.8, -0.6, 0, Math.PI / 2, 0));
    g.add(at(books(6, 8), -2.0, 0, 1.4, 0, Math.PI / 2, 0));
    const pizza = new THREE.Group(); pizza.name = 'pizza';
    pizza.add(at(box(0.5, 0.03, 0.5, '#e0b47c'), 0, 0.445, 0));
    const pz = cyl(0.21, 0.21, 0.025, '#f4b942', 8); pz.position.y = 0.47; pizza.add(pz);
    for (let i = 0; i < 6; i++) { const a = i * 1.05; pizza.add(at(cyl(0.03, 0.03, 0.012, '#c0392b', 6), Math.cos(a) * 0.12, 0.488, Math.sin(a) * 0.12)); }
    
    pizza.visible = false; g.add(at(pizza, 0.35, 0, 1.05)); g.userData.pizza = pizza;
    return { g, bg: ['#ffcfa3', '#f78fb3'], spot: [0, 0, 0], sun: [3, 6, 4], hemi: ['#fff5e8', '#a07b62', 1.5] };
  },
  office() {
    const g = diorama({ floor: '#a7b3c9', edge: '#5d6987', back: '#dfe8f5', left: '#c7d4ea' });
    const desk = new THREE.Group();
    desk.add(at(box(1.8, 0.06, 0.8, '#f2efe9', 0.004), 0, 0.72, 0));
    for (const x of [-0.85, 0.85]) desk.add(at(box(0.06, 0.7, 0.72, '#6f7a92'), x, 0.36, 0));
    desk.add(at(laptop(), 0, 0.75, 0.05, 0, Math.PI, 0));
    desk.add(at(mug(), 0.55, 0.75, -0.05));
    const dl = new THREE.Group(); dl.add(at(cyl(0.08, 0.09, 0.02, '#2b2350'), 0, 0.01, 0)); dl.add(at(cyl(0.012, 0.012, 0.4, '#2b2350', 5), 0, 0.2, 0, 0, 0, 0.3)); dl.add(at(cone(0.08, 0.12, '#ffd166'), -0.12, 0.4, 0, 0, 0, 2.2));
    desk.add(at(dl, -0.7, 0.75, 0.1));
    desk.add(at(books(4, 3), -0.5, 0.75, 0.2, 0, Math.PI / 2, 0));
    g.add(at(desk, 0.05, 0, 0.62));
    g.add(at(chairOffice(), 0, 0, 0.02));
    const shelf = new THREE.Group(); for (const y of [0, 0.55]) { shelf.add(at(box(1.3, 0.04, 0.26, '#8a5a3c'), 0, y, 0)); shelf.add(at(books(9, 11 + y * 10), -0.55, y + 0.02, 0)); }
    g.add(at(shelf, -0.9, 1.45, -2.35));
    const clock = new THREE.Group(); clock.add(at(cyl(0.3, 0.3, 0.05, '#ffffff', 12), 0, 0, 0, Math.PI / 2)); clock.add(at(cyl(0.33, 0.33, 0.04, '#2b2350', 12), 0, 0, -0.01, Math.PI / 2));
    for (const [len, wd] of [[0.2, 0.025], [0.27, 0.014]]) { const hnd = new THREE.Group(); hnd.add(at(box(wd, len, 0.01, '#2b2350'), 0, len / 2, 0)); hnd.position.z = 0.04; clock.add(hnd); clockHands.push(hnd); }
    g.add(at(clock, 1.2, 2.2, -2.45));
    g.add(at(windowPane(1.3, 1.3), -2.7, 1.7, 0.3, 0, Math.PI / 2, 0));
    g.add(at(plant(1.2, 9), 2.25, 0, -1.8));
    const cab = new THREE.Group(); cab.add(at(box(0.6, 1.1, 0.55, '#8d99b3', 0.004), 0, 0.55, 0)); for (const y of [0.3, 0.7]) cab.add(at(box(0.2, 0.04, 0.03, '#2b2350'), 0, y, 0.29));
    g.add(at(cab, 2.2, 0, 0.1));
    return { g, bg: ['#a5d8ff', '#748ffc'], spot: [0, 0, 0], sun: [3.5, 6, 4], hemi: ['#f2f6ff', '#7f8db0', 1.6] };
  },
  car() {
    const g = new THREE.Group();
    g.add(at(box(7, 0.4, 14, '#5a8f4e'), 0, -0.2, -2));
    g.add(at(box(2.8, 0.03, 14, '#4b4f5c'), 0, 0.01, -2));
    for (const x of [-1.45, 1.45]) g.add(at(box(0.12, 0.06, 14, '#d9d9d9'), x, 0.03, -2));
    roadMovers = [];
    for (let i = 0; i < 7; i++) { const d = box(0.12, 0.035, 0.9, '#ffffff'); d.position.set(0, 0.02, -8 + i * 2); d.userData.base = -8 + i * 2; d.userData.span = 14; g.add(d); roadMovers.push(d); }
    for (let i = 0; i < 10; i++) { const side = i % 2 ? 1 : -1; const tr = lowTree(40 + i, 1.2 + (i % 3) * 0.2); tr.position.set(side * (2.1 + (i % 3) * 0.7), 0, -8 + i * 1.4); tr.userData.base = -8 + i * 1.4; tr.userData.span = 14; g.add(tr); roadMovers.push(tr); }
    // convertible
    const car = new THREE.Group(); const red = '#e63946';
    car.add(at(box(1.6, 0.42, 3.4, red, 0.01), 0, 0.5, 0));
    car.add(at(box(1.5, 0.2, 1.2, shadeHex(red, 0.05), 0.01), 0, 0.78, 1.0, 0.06));
    car.add(at(box(1.5, 0.22, 0.9, shadeHex(red, 0.05), 0.01), 0, 0.8, -1.25));
    car.add(at(box(1.62, 0.12, 3.42, '#2b2d42'), 0, 0.3, 0));
    const glass = new THREE.MeshLambertMaterial({ color: '#cdefff', transparent: true, opacity: 0.32, flatShading: true });
    const ws = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.28, 0.03), glass); ws.position.set(0, 1.0, 0.4); ws.rotation.x = -0.6; car.add(ws);
    for (const x of [-0.35, 0.35]) { car.add(at(box(0.5, 0.12, 0.5, '#f1e3c8', 0.01), x, 0.66, -0.12)); car.add(at(box(0.5, 0.65, 0.12, '#f1e3c8', 0.01), x, 0.95, -0.42, -0.15)); }
    for (const x of [-0.55, 0.55]) { const hl = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.05, 8), glow('#fff6c2')); hl.rotation.x = Math.PI / 2; hl.position.set(x, 0.58, 1.71); car.add(hl); }
    car.add(at(box(0.9, 0.1, 0.04, '#adb5bd'), 0, 0.42, 1.72));
    for (const [x, z] of [[-0.78, 1.1], [0.78, 1.1], [-0.78, -1.1], [0.78, -1.1]]) { const wh = new THREE.Group(); wh.add(at(cyl(0.3, 0.3, 0.22, '#22222a', 9), 0, 0, 0, 0, 0, Math.PI / 2)); wh.add(at(cyl(0.14, 0.14, 0.24, '#c9ced8', 6), 0, 0, 0, 0, 0, Math.PI / 2)); wh.position.set(x, 0.3, z); car.add(wh); wheels.push(wh); }
    const wheel = mesh(new THREE.TorusGeometry(0.16, 0.025, 4, 10), '#2b2d42'); wheel.position.set(-0.35, 1.0, 0.25); wheel.rotation.x = -0.7; car.add(wheel);
    car.add(at(cyl(0.02, 0.02, 0.3, '#2b2d42', 5), -0.35, 0.92, 0.33, -0.7 + Math.PI / 2));
    g.add(at(car, 0.35, 0, 0)); g.userData.car = car;
    return { g, bg: ['#8ecae6', '#ffe8d6'], spot: [0, 0.14, -0.1], sun: [4, 7, 3], hemi: ['#e8f6ff', '#6b8f5a', 1.6] };
  },
  hospital() {
    const g = diorama({ floor: '#d9e2e7', edge: '#8197a3', back: '#cdeee6', left: '#b7e1d6' });
    const bed = new THREE.Group();
    bed.add(at(box(2.1, 0.08, 0.95, '#9aa6b2'), 0, 0.45, 0));
    bed.add(at(box(2.0, 0.18, 0.88, '#ffffff', 0.006), 0, 0.57, 0));
    bed.add(at(box(0.5, 0.12, 0.6, '#ffffff', 0.01), -0.75, 0.72, 0, 0, 0, 0.15));
    bed.add(at(box(1.0, 0.04, 0.9, '#7ec4cf'), 0.45, 0.67, 0));
    bed.add(at(box(0.06, 0.8, 0.95, '#9aa6b2'), -1.05, 0.6, 0));
    for (const [x, z] of [[-0.95, -0.4], [0.95, -0.4], [-0.95, 0.4], [0.95, 0.4]]) { bed.add(at(cyl(0.025, 0.025, 0.42, '#9aa6b2', 5), x, 0.22, z)); bed.add(at(ico(0.04, '#2b2d42'), x, 0.04, z)); }
    g.add(at(bed, -0.25, 0, -0.42));
    const mon = new THREE.Group(); mon.add(at(cyl(0.02, 0.02, 1.4, '#9aa6b2', 5), 0, 0.7, 0)); mon.add(at(cyl(0.18, 0.2, 0.04, '#9aa6b2', 6), 0, 0.02, 0));
    mon.add(at(box(0.5, 0.36, 0.12, '#3d4451'), 0, 1.5, 0));
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.3), new THREE.MeshBasicMaterial({ map: ecg })); scr.position.set(0, 1.5, 0.065); mon.add(scr);
    g.add(at(mon, -1.65, 0, 0.35, 0, 0.5, 0));
    const iv = new THREE.Group(); iv.add(at(cyl(0.015, 0.015, 1.8, '#c9ced8', 5), 0, 0.9, 0)); iv.add(at(box(0.3, 0.02, 0.02, '#c9ced8'), 0, 1.8, 0)); iv.add(at(box(0.12, 0.2, 0.05, '#e3f6ff', 0.01), 0.1, 1.66, 0));
    g.add(at(iv, 1.15, 0, -1.4));
    const blinds = new THREE.Group(); for (let i = 0; i < 9; i++) blinds.add(at(box(1.3, 0.05, 0.03, '#f6f6f6'), 0, i * 0.13, 0, 0.4));
    g.add(at(windowPane(1.3, 1.2, '#cfeaff'), 0.7, 1.8, -2.48)); g.add(at(blinds, 0.7, 1.28, -2.4));
    const cross = new THREE.Group(); cross.add(at(box(0.36, 0.11, 0.03, '#ef476f'), 0, 0, 0)); cross.add(at(box(0.11, 0.36, 0.03, '#ef476f'), 0, 0, 0));
    g.add(at(cross, -1.2, 2.3, -2.48));
    g.add(at(plant(0.9, 13), 2.3, 0, -1.9));
    const chart = new THREE.Group(); chart.add(at(box(0.5, 0.7, 0.02, '#ffffff'), 0, 0, 0)); for (let i = 0; i < 6; i++) chart.add(at(box(0.36, 0.02, 0.005, i % 2 ? '#7ec4cf' : '#ef476f'), 0, 0.22 - i * 0.09, 0.012));
    g.add(at(chart, -2.68, 1.7, -0.5, 0, Math.PI / 2, 0));
    return { g, bg: ['#c3f0ff', '#89c2d9'], spot: [0, 0, 0.12], cast: [1.0, 0, 0.62, -1.15], sun: [3, 6, 5], hemi: ['#f4fffd', '#8aa3a8', 1.7] };
  },
  gaming() {
    const g = diorama({ floor: '#3a3566', edge: '#211d40', back: '#2e2a57', left: '#272350', trim: '#5a52a8' });
    const chair = new THREE.Group(); const cr = '#e63946', cb = '#1f1f2b';
    chair.add(at(box(0.56, 0.12, 0.52, cb, 0.006), 0, 0.46, 0));
    chair.add(at(box(0.58, 1.0, 0.12, cb, 0.006), 0, 0.98, -0.3, -0.12));
    chair.add(at(box(0.22, 0.9, 0.13, cr, 0.006), 0, 0.98, -0.29, -0.12));
    for (const s of [-1, 1]) { chair.add(at(box(0.08, 0.7, 0.16, cr, 0.006), s * 0.3, 1.05, -0.26, -0.12)); chair.add(at(box(0.08, 0.05, 0.4, cb), s * 0.33, 0.66, 0)); }
    chair.add(at(cyl(0.035, 0.035, 0.36, '#8d96a6', 6), 0, 0.26, 0));
    for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; const leg = box(0.32, 0.04, 0.05, '#111118'); leg.position.set(Math.cos(a) * 0.16, 0.07, Math.sin(a) * 0.16); leg.rotation.y = -a; chair.add(leg); }
    g.add(at(chair, 0, 0, 0.02));
    // RGB strips + posters
    for (const [x, y, z, w, ry, c] of [[0, 2.9, -2.4, 5.4, 0, '#ff3cac'], [-2.7, 2.9, 0, 4.8, Math.PI / 2, '#2bd2ff']]) { const s = new THREE.Mesh(new THREE.BoxGeometry(w, 0.05, 0.05), new THREE.MeshBasicMaterial({ color: c })); s.position.set(x, y, z); s.rotation.y = ry; g.add(s); rgbStrips.push(s); }
    const poster = (c1, c2, seed) => frameArt(0.8, 1.1, ['#1b1838', c1, c2], seed);
    g.add(at(poster('#ff3cac', '#2bd2ff', 7), -1.2, 1.8, -2.46)); g.add(at(poster('#ffd166', '#06d6a0', 8), 1.4, 1.9, -2.46));
    g.add(at(windowPane(1.1, 1.1, '#2c3e7a', '#4a4590', 0.6), -2.7, 1.8, 1.0, 0, Math.PI / 2, 0));
    const moon = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 1), glow('#fff4c9')); moon.position.set(-2.69, 2.0, 0.85); g.add(moon);
    const side = new THREE.Group(); side.add(at(box(0.6, 0.55, 0.5, '#4a4590', 0.004), 0, 0.275, 0));
    const r = rng(5); for (let i = 0; i < 4; i++) side.add(at(cyl(0.04, 0.04, 0.13, ['#06d6a0', '#ffd166', '#ef476f', '#2bd2ff'][i], 7), -0.2 + i * 0.12, 0.62, (r() - 0.5) * 0.2));
    side.add(at(new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.025, 4, 10, Math.PI), M('#111118')), 0.15, 0.7, 0.1));
    g.add(at(side, 0.95, 0, 0.0));
    for (let i = 0; i < 7; i++) { const c = cyl(0.04, 0.04, 0.13, ['#06d6a0', '#ffd166', '#ef476f', '#2bd2ff'][i % 4], 7); if (i % 2) { c.rotation.z = Math.PI / 2; c.position.y = 0.04; } else c.position.y = 0.065; c.position.x = -1.6 + r() * 1.2; c.position.z = 0.4 + r() * 1.2; g.add(c); }
    const bag = box(0.3, 0.05, 0.4, '#ffd166', 0.02); bag.position.set(-0.8, 0.03, 1.2); bag.rotation.y = 0.5; g.add(bag);
    const fridge = new THREE.Group(); fridge.add(at(box(0.55, 0.75, 0.5, '#e9ecef', 0.004), 0, 0.375, 0)); fridge.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.3, 0.02), glow('#2bd2ff')), 0.2, 0.45, 0.26));
    g.add(at(fridge, 2.2, 0, -1.9));
    return { g, bg: ['#3a0ca3', '#f72585'], spot: [0, 0, 0], sun: [3, 6, 4], hemi: ['#b9a8ff', '#3b2a5f', 1.0], sunI: 1.4, screen: 1.6 };
  },
  garden() {
    const g = diorama({ floor: '#7cc36a', edge: '#6b4a2e', back: '#9fd88a', left: '#8fcf7a', wallH: 0.01 });
    g.children.slice(2).forEach(c => c.visible = false); // lawn only: hide the walls/trim
    const r = rng(61);
    for (let i = 0; i < 9; i++) { const x = -2.6 + i * 0.65; g.add(at(box(0.1, 0.75, 0.06, '#f2e6cf', 0.004), x, 0.38, -2.3)); }
    g.add(at(box(5.4, 0.07, 0.05, '#e6d6b8'), 0, 0.55, -2.27)); g.add(at(box(5.4, 0.07, 0.05, '#e6d6b8'), 0, 0.25, -2.27));
    g.add(at(lowTree(62, 1.3), -2.1, 0, -1.7)); g.add(at(lowTree(63, 1.0), 2.3, 0, -1.9));
    for (let i = 0; i < 14; i++) { const f = ico(0.06, ['#ff6b9a', '#ffd166', '#ffffff', '#c77dff'][i % 4], 0, 0.01, i); f.position.set((r() - 0.5) * 5, 0.06, 1.2 + r() * 1.1); g.add(f); }
    const hive = new THREE.Group();
    hive.add(at(box(0.55, 0.5, 0.05, '#8a5a3c'), 0, 0.25, 0));
    for (const [x, z] of [[-0.22, -0.18], [0.22, -0.18], [-0.22, 0.18], [0.22, 0.18]]) hive.add(at(box(0.05, 0.5, 0.05, '#6d452c'), x, 0.25, z));
    for (let i = 0; i < 3; i++) hive.add(at(box(0.62, 0.26, 0.52, i % 2 ? '#ffd166' : '#f4b942', 0.004), 0, 0.64 + i * 0.27, 0));
    hive.add(at(box(0.72, 0.06, 0.62, '#ef476f'), 0, 1.45, 0));
    hive.add(at(box(0.2, 0.04, 0.02, '#2b2350'), 0, 0.56, 0.27));
    g.add(at(hive, 1.35, 0, -0.9, 0, -0.4, 0));
    return { g, bg: ['#bde0fe', '#fff1c1'], spot: [0, 0, 0.2], sun: [3, 6, 4], hemi: ['#fffbe8', '#6b8f5a', 1.6] };
  },
  void() {
    const g = new THREE.Group(); const r = rng(9);
    for (let i = 0; i < 22; i++) {
      const cl = new THREE.Group(); const n = 3 + Math.floor(r() * 3);
      for (let k = 0; k < n; k++) { const b = ico(0.35 + r() * 0.35, '#ffffff', 1, 0.05, i * 10 + k); b.position.set((k - n / 2) * 0.45, r() * 0.2, (r() - 0.5) * 0.3); b.scale.y = 0.65; b.castShadow = false; cl.add(b); }
      const ang = r() * Math.PI * 2, rad = 1.6 + r() * 5;
      cl.position.set(Math.cos(ang) * rad, -0.6 + r() * 3.6 - (i < 6 ? 0.6 : 0), -2 - r() * 6 + (i < 6 ? 2.5 : 0)); g.add(cl);
    }
    const gate = new THREE.Group(); for (const x of [-0.9, 0.9]) gate.add(at(cyl(0.12, 0.14, 2.6, '#fff3c4', 7), x, 1.3, 0)); gate.add(at(box(2.2, 0.18, 0.22, '#ffd166'), 0, 2.65, 0));
    g.add(at(gate, -0.9, -0.4, -4));
    return { g, bg: ['#bde0fe', '#ffd6e8'], spot: [0, 0.2, 0], sun: [2, 6, 5], hemi: ['#ffffff', '#ffd6e8', 2.0], noShadowFloor: true };
  },
};
const built = {};
function room(name) {
  if (!built[name]) { const r = (ROOMS[name] || ROOMS.livingroom)(); r.bgTex = gradient(...r.bg); scene.add(r.g); built[name] = r; }
  for (const k in built) built[k].g.visible = k === name;
  const r = built[name];
  scene.background = r.bgTex;
  hemi.color.set(r.hemi[0]); hemi.groundColor.set(r.hemi[1]); hemi.intensity = r.hemi[2];
  sun.position.set(...r.sun); sun.target.position.set(0, 0.6, 0); sun.intensity = r.sunI ?? 2.6;
  screenLight.intensity = r.screen || 0;
  return r;
}

// ---------- fx ----------
const glowTex = canvasTex(128, 128, (g, w, h) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,240,240,1)'); gr.addColorStop(0.25, 'rgba(255,40,60,0.95)'); gr.addColorStop(1, 'rgba(255,0,30,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
const clot = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, depthTest: false, transparent: true, blending: THREE.AdditiveBlending }));
clot.renderOrder = 10; scene.add(clot);
const ringTex = canvasTex(128, 128, (g) => { g.strokeStyle = 'rgba(255,80,100,0.9)'; g.lineWidth = 6; g.beginPath(); g.arc(64, 64, 56, 0, 7); g.stroke(); });
const ring = new THREE.Sprite(new THREE.SpriteMaterial({ map: ringTex, depthTest: false, transparent: true })); ring.renderOrder = 11; scene.add(ring);
const trail = []; for (let i = 0; i < 6; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, depthTest: false, transparent: true, blending: THREE.AdditiveBlending })); s.renderOrder = 9; trail.push(s); scene.add(s); }
// welts: red sting bumps on the face/skull (gary.welts: true)
const welts = new THREE.Group();
{ const r = rng(77); for (let i = 0; i < 16; i++) {
  let d; do { d = new THREE.Vector3(r() - 0.5, r() - 0.35, r() * 0.9 + 0.1).normalize(); } while (Math.abs(d.y - 0.12) < 0.14 && Math.abs(d.x) < 0.5 && d.z > 0.75);
  const w = new THREE.Mesh(new THREE.IcosahedronGeometry(0.011 + r() * 0.008, 0), M('#e0505a')); w.position.set(d.x * 0.115, 0.11 + d.y * 0.13, d.z * 0.12); welts.add(w);
} }
// bees: low-poly bodies with stripes and wings, orbiting Gary's head and torso
const bees = [];
for (let i = 0; i < 70; i++) {
  const b = new THREE.Group();
  const body = ico(0.035, '#ffc93c', 0, 0, i); body.scale.set(1, 0.85, 1.45); b.add(body);
  const band = cyl(0.033, 0.033, 0.016, '#1d1713', 6); band.rotation.x = Math.PI / 2; band.position.z = -0.012; b.add(band);
  const tail = cone(0.018, 0.03, '#1d1713', 5); tail.rotation.x = -Math.PI / 2; tail.position.z = -0.055; b.add(tail);
  const wm = new THREE.MeshBasicMaterial({ color: '#eaf6ff', transparent: true, opacity: 0.75, side: THREE.DoubleSide });
  for (const sgn of [-1, 1]) { const w = new THREE.Mesh(new THREE.CircleGeometry(0.03, 5), wm); w.position.set(sgn * 0.03, 0.03, 0); w.rotation.set(-1.2, 0, sgn * 0.5); b.add(w); b.userData['w' + sgn] = w; }
  b.visible = false; scene.add(b); bees.push(b);
}
function drawEcg(t, bpm = 96) {
  const c = ecg.userData.canvas, g = c.getContext('2d'); const w = c.width, h = c.height;
  g.fillStyle = '#0d1b1e'; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(80,255,170,0.12)'; g.lineWidth = 1; for (let x = 0; x < w; x += 16) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
  g.strokeStyle = '#4dffb0'; g.lineWidth = 4; g.beginPath();
  const period = 60 / bpm;
  for (let x = 0; x <= w; x += 2) {
    const tt = t - (w - x) / w * 2.2; const ph = ((tt % period) + period) % period / period;
    let y = 0; if (ph > 0.1 && ph < 0.14) y = -10; else if (ph > 0.2 && ph < 0.23) y = 12; else if (ph >= 0.23 && ph < 0.27) y = -60 * (1 - Math.abs(ph - 0.25) / 0.02); else if (ph > 0.27 && ph < 0.3) y = 16; else if (ph > 0.42 && ph < 0.52) y = -14 * Math.sin((ph - 0.42) / 0.1 * Math.PI);
    x ? g.lineTo(x, h * 0.6 + y) : g.moveTo(x, h * 0.6 + y);
  }
  g.stroke(); g.fillStyle = '#ff6b6b'; g.font = '800 34px Poppins'; g.fillText('BP 168/104', 12, 38);
  ecg.needsUpdate = true;
}

// ---------- captions ----------
const $ = id => document.getElementById(id);
const capEl = $('caption'), labelEl = $('label'), flashEl = $('flash'), redEl = $('redflash');
const KEY = new RegExp('^(' + ['thirty', 'twelve', 'twelve-hour', 'zero', 'sugar', 'risk', 'smoking', 'lungs', 'clots', 'die', 'died', 'blood', 'calf', 'walk', 'second', 'minute', 'hour', 'day', 'week', 'month', 'year', ...(script.keywords || [])].join('|') + ')', 'i'); // highlighted caption words; script.keywords adds more
const groups = [];
timeline.beats.forEach(b => {
  let cur = null;
  b.words.forEach(w => {
    if (!cur || cur.words.length >= 3 || cur.speaker !== w.speaker || cur.chars + w.w.length > 14) { cur = { words: [], speaker: w.speaker, chars: 0, s: w.s }; groups.push(cur); }
    cur.words.push(w.w); cur.chars += w.w.length + 1; cur.e = w.e;
    if (/[.,!?;:]$/.test(w.w)) cur = null;
  });
});
function captionAt(t) {
  for (let i = 0; i < groups.length; i++) { const g = groups[i], next = groups[i + 1]; if (t >= g.s - 0.04 && t < Math.min(next ? next.s : Infinity, g.e + 0.35)) return g; }
  return null;
}
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

// ---------- cameras (relative to Gary: P = feet, Hd = head) ----------
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const CAMS = {
  push: { from: (P, Hd) => Hd.clone().add(V(0.45, 0.2, 2.7)), to: (P, Hd) => Hd.clone().add(V(0.15, 0.05, 1.65)), look: (P, Hd) => Hd.clone().add(V(0, -0.18, 0)), fov: 42 },
  face: { from: (P, Hd) => Hd.clone().add(V(0.3, 0.06, 1.05)), to: (P, Hd) => Hd.clone().add(V(0.1, 0.02, 0.8)), look: (P, Hd) => Hd.clone().add(V(0, 0.0, 0)), fov: 40 },
  wide: { from: P => P.clone().add(V(4.2, 3.9, 6.4)), to: P => P.clone().add(V(3.0, 3.4, 6.6)), look: P => P.clone().add(V(-0.1, 0.8, 0)), fov: 36 },
  side: { from: (P, Hd) => Hd.clone().add(V(2.6, 0.45, 2.2)), to: (P, Hd) => Hd.clone().add(V(2.1, 0.3, 1.8)), look: (P, Hd) => Hd.clone().add(V(0, -0.35, 0.1)), fov: 42 },
  low: { from: P => P.clone().add(V(-1.0, 0.45, 2.9)), to: P => P.clone().add(V(-0.7, 0.5, 2.3)), look: (P, Hd) => Hd.clone().add(V(0, -0.12, 0)), fov: 46 },
  front: { from: (P, Hd) => Hd.clone().add(V(1.1, 0.9, 4.6)), to: (P, Hd) => Hd.clone().add(V(0.7, 0.7, 3.6)), look: (P, Hd) => Hd.clone().add(V(0.2, -0.4, 0)), fov: 42 },
  two: { from: P => P.clone().add(V(1.2, 1.5, 3.9)), to: P => P.clone().add(V(0.8, 1.4, 3.2)), look: P => P.clone().add(V(0.5, 1.05, 0.25)), fov: 44 },
  legs: { from: (P, Hd, calf) => calf.clone().add(V(1.5, 0.75, 2.3)), to: (P, Hd, calf) => calf.clone().add(V(1.1, 0.6, 1.8)), look: (P, Hd, calf) => calf.clone().add(V(0, 0.4, 0)), fov: 44 },
};

// ---------- main ----------
const beats = script.beats.map((b, i) => ({ ...b, ...timeline.beats[i] }));
window.DURATION = timeline.duration;
const tmpV = new THREE.Vector3();
window.renderFrame = (t) => {
  let bi = beats.findIndex(b => t < b.end); if (bi < 0) bi = beats.length - 1;
  const b = beats[bi]; const lt = t - b.start; const dur = b.end - b.start; const p = clamp(lt / dur);
  const R = room(b.scene);
  const gs = b.gary || {};
  const isGhost = gs.pose === 'ghost';
  const H = isGhost ? ghost : gary;
  gary.root.visible = !isGhost; ghost.root.visible = isGhost;

  // pose (+ death: clutch chest, then slump)
  let pose = resolvePose(gs.pose || 'stand');
  let expr = gs.expr || 'neutral';
  if (b.deathAt != null) {
    const kc = ease((t - (b.deathAt - 1.5)) / 0.45);
    if (kc > 0) pose = blendPose(pose, resolvePose('clutch'), kc);
    if (t >= b.deathAt) { pose = blendPose(pose, resolvePose('slump'), backOut((t - b.deathAt) / 0.5)); expr = 'dead'; }
    else if (t >= b.deathAt - 1.5) expr = 'shocked';
  }
  // idle life: breathing, typing, thumbs
  pose.chest = [pose.chest[0] + 0.015 * Math.sin(t * 2.4), pose.chest[1], pose.chest[2]];
  pose.head = [pose.head[0] + 0.02 * Math.sin(t * 1.3), pose.head[1] + 0.05 * Math.sin(t * 0.7), pose.head[2]];
  if (gs.pose === 'type' || gs.pose === 'hunch') { pose.haL = [pose.haL[0] + 0.15 * Math.sin(t * 19), 0, 0]; pose.haR = [pose.haR[0] + 0.15 * Math.sin(t * 17 + 1), 0, 0]; }
  if (gs.pose === 'game' && b.deathAt == null) { pose.elL = [pose.elL[0] + 0.05 * Math.sin(t * 13), pose.elL[1], pose.elL[2]]; pose.spine = [pose.spine[0] + 0.03 * Math.sin(t * 3.1), pose.spine[1], pose.spine[2] + 0.04 * Math.sin(t * 1.9)]; }
  if (gs.pose === 'drive') { pose.spine = [pose.spine[0], pose.spine[1], 0.03 * Math.sin(t * 1.4)]; }
  if (isGhost) { pose.shL = [pose.shL[0], 0, pose.shL[2] + 0.1 * Math.sin(t * 2)]; pose.shR = [pose.shR[0], 0, pose.shR[2] - 0.1 * Math.sin(t * 2)]; }
  applyPose(H, pose);
  setBuild(H, gs.build || 0);
  const blink = (t % 3.3) < 0.11;
  setFace(H, expr, { blink, t });
  const [sx, sy, sz] = R.spot;
  H.root.position.set(sx, sy + (isGhost ? 0.25 + 0.12 * Math.sin(t * 2) : 0), sz);
  H.root.rotation.set(0, isGhost ? 0.15 * Math.sin(t * 0.8) : 0, 0);
  if (b.scene === 'car') { H.root.position.x = sx; }

  // cast
  for (const k in CAST) CAST[k].root.visible = false;
  for (const c of b.cast || []) {
    const h = CAST[c.who]; if (!h) continue; h.root.visible = true;
    const cs = R.cast || [1.2, 0, 0.5, -1.2];
    h.root.position.set(cs[0], cs[1], cs[2]); h.root.rotation.set(0, cs[3], 0);
    const cp = resolvePose(c.pose || 'stand'); cp.head = [cp.head[0] + 0.03 * Math.sin(t * 1.7), cp.head[1] + 0.12, cp.head[2]];
    applyPose(h, cp); setBuild(h, 0);
    const talking = b.words.some(w => w.speaker === c.who && t >= w.s && t <= w.e);
    setFace(h, c.expr || 'neutral', { blink: ((t + 1.3) % 2.9) < 0.11, mouth: talking ? 0.35 + 0.35 * Math.abs(Math.sin(t * 16)) : 0, t });
  }
  // held items
  controller.removeFromParent(); clipboard.removeFromParent(); slice.removeFromParent();
  if (gs.pose === 'game') { H.j.haR.add(controller); controller.position.set(0.075, -0.07, 0.03); controller.rotation.set(0.2, 0, 0); if (b.deathAt != null && t > b.deathAt) { scene.add(controller); controller.position.set(0.12, 0.05, 0.45); controller.rotation.set(0, 0.6, 0); } }
  if ((b.cast || []).some(c => c.pose === 'clipboard')) { doctor.j.haR.add(clipboard); clipboard.position.set(-0.06, -0.08, 0.05); clipboard.rotation.set(-1.2, 0, 0.3); }
  const props = b.props || [];
  if (R.g.userData.pizza) R.g.userData.pizza.visible = props.includes('pizza');
  if (props.includes('pizza')) { H.j.haR.add(slice); slice.position.set(0, -0.1, 0.05); slice.rotation.set(0.3, 0.5, 1.4); }

  // room animation
  clockHands.forEach((hnd, i) => { hnd.rotation.z = -t * (i ? 3.0 : 0.25); });
  if (b.scene === 'car') {
    for (const m of roadMovers) { const span = m.userData.span; m.position.z = -8 + ((m.userData.base + 8 + t * 6) % span + span) % span; }
    wheels.forEach(w => w.rotation.x = t * 20);
    R.g.userData.car.position.y = 0.01 * Math.sin(t * 11);
  }
  if (b.scene === 'hospital') drawEcg(t);
  rgbStrips.forEach((s, i) => s.material.color.setHSL(((t * 0.15) + i * 0.5) % 1, 0.9, 0.6));
  if (R.screen) { screenLight.position.set(0, 1.25, 1.7); screenLight.intensity = R.screen * (0.85 + 0.15 * Math.sin(t * 7) * Math.sin(t * 3.3)); screenLight.color.setHSL(0.55 + 0.08 * Math.sin(t * 0.9), 0.8, 0.65); }

  // fx: clot
  scene.updateMatrixWorld(true);
  const calf = H.j.knL.localToWorld(V(0, -0.17, 0.05));
  const lungs = H.j.chest.localToWorld(V(0.06, 0.08, 0.1));
  clot.visible = ring.visible = false; trail.forEach(s => s.visible = false);
  if (b.fx === 'clot' || b.fx === 'clot_move') {
    clot.visible = true;
    let pos = calf.clone(), size = 0.16 + 0.04 * Math.sin(t * 9);
    if (b.fx === 'clot_move') {
      const end = (b.deathAt ?? b.end) - 1.6; const k = ease(clamp((t - b.start - 0.3) / Math.max(0.5, end - b.start - 0.3)));
      const knee = H.j.knL.localToWorld(V(0, 0, 0.06)), hip = H.j.hipL.localToWorld(V(0, -0.05, 0.12));
      const path = [calf, knee, hip, lungs];
      const seg = Math.min(2, Math.floor(k * 3)), f = k * 3 - seg;
      pos = path[seg].clone().lerp(path[seg + 1], f);
      trail.forEach((s, i) => { const kk = clamp(k - (i + 1) * 0.04); const sg = Math.min(2, Math.floor(kk * 3)); const ff = kk * 3 - sg; s.visible = k > 0.02 && k < 0.999; s.position.copy(path[sg].clone().lerp(path[sg + 1], ff)); s.scale.setScalar(0.1 * (1 - i / 7)); s.material.opacity = 0.6 * (1 - i / 6); });
      if (b.deathAt != null && t > b.deathAt - 1.6) { pos = lungs; size = 0.2 + 0.12 * Math.abs(Math.sin(t * 6)); }
      if (b.deathAt != null && t > b.deathAt) { const q = clamp((t - b.deathAt) / 0.8); size = lerp(0.35, 0.0, q); }
    } else { ring.visible = true; const ph = (lt * 0.9) % 1; ring.position.copy(calf); ring.scale.setScalar(0.18 + ph * 0.35); ring.material.opacity = 1 - ph; }
    clot.position.copy(pos); clot.scale.setScalar(size);
  }

  if (gs.welts) { if (welts.parent !== H.j.head) H.j.head.add(welts); welts.visible = true; } else welts.visible = false;
  // fx: bees
  const nBees = b.fx === 'bees' ? bees.length : b.fx === 'bees_few' ? 10 : 0;
  const beeC = H.j.chest.localToWorld(V(0, 0.12, 0.05));
  bees.forEach((bee, i) => {
    bee.visible = i < nBees; if (!bee.visible) return;
    const r = rng(i * 7 + 3); const a0 = r() * 6.28, sp = (0.9 + r() * 1.6) * (r() < 0.5 ? -1 : 1), rad = 0.28 + r() * 0.45, yo = (r() - 0.4) * 0.9, tilt = (r() - 0.5) * 1.2;
    const a = a0 + t * sp; const prev = a - 0.05 * Math.sign(sp);
    const pos = (ang) => beeC.clone().add(V(Math.cos(ang) * rad, yo + Math.sin(ang * 2.3 + i) * 0.08 + Math.sin(ang) * tilt * 0.2, Math.sin(ang) * rad * 0.8));
    bee.position.copy(pos(a)); bee.lookAt(bee.position.clone().multiplyScalar(2).sub(pos(prev)));
    const flap = Math.sin(t * 90 + i) * 0.7; bee.userData['w-1'].rotation.z = -0.5 - flap; bee.userData.w1.rotation.z = 0.5 + flap;
  });

  // camera
  const P = H.root.position.clone(); P.y = R.spot[1];
  const Hd = H.j.head.localToWorld(V(0, 0.11, 0));
  const C = CAMS[b.camera] || CAMS.push;
  const k = ease(p);
  let from = C.from(P, Hd, calf), to = C.to(P, Hd, calf), look = C.look(P, Hd, calf);
  if (b.scene === 'void' && b.camera === 'wide') { from = Hd.clone().add(V(0.8, 0.35, 4.4)); to = Hd.clone().add(V(0.35, 0.15, 3.5)); look = Hd.clone().add(V(0, -0.35, 0)); }
  if (b.deathAt != null && t > b.deathAt - 1.6) { const kk = ease((t - (b.deathAt - 1.6)) / 1.2); to = to.clone().lerp(Hd.clone().add(V(0.35, 0.1, 1.9)), kk * 0.5); }
  camera.position.copy(from).lerp(to, k);
  camera.position.x += 0.02 * Math.sin(t * 0.9); camera.position.y += 0.015 * Math.sin(t * 1.3);
  if (b.deathAt != null && t >= b.deathAt) { const s = 0.07 * Math.exp(-(t - b.deathAt) * 5); camera.position.x += Math.sin(t * 90) * s; camera.position.y += Math.cos(t * 77) * s; }
  camera.fov = C.fov; camera.updateProjectionMatrix();
  camera.lookAt(look);
  clot.material.opacity = 1;

  // HUD: flash on cuts, red pulse on death. (No deaths counter in this style.)
  flashEl.style.opacity = bi > 0 && lt < 0.12 ? 0.5 * (1 - lt / 0.12) : 0;
  const since = b.deathAt != null ? t - b.deathAt : -1;
  redEl.style.opacity = since >= 0 && since < 1.2 ? 0.9 * (1 - since / 1.2) : (b.fx === 'clot' ? 0.12 + 0.1 * Math.sin(t * 6) : 0);

  if (b.label) {
    labelEl.className = b.hook ? 'hook' : '';
    labelEl.innerHTML = `<span class="chip">${esc(b.label).replace(/\*([^*]+)\*/g, '<span class="hot">$1</span>')}</span>`;
    const pop = backOut(lt / 0.32);
    labelEl.style.opacity = clamp(lt / 0.08);
    labelEl.style.transform = `translateY(${lerp(-60, 0, easeOut(lt / 0.3))}px) scale(${lerp(0.6, 1, pop) * (b.hook ? 1 + 0.025 * Math.sin(t * 7) : 1)})`;
  } else labelEl.style.opacity = 0;

  const g = captionAt(t);
  if (g) {
    capEl.className = 'ext' + (g.speaker === 'doctor' ? ' doctor' : '');
    capEl.innerHTML = g.words.map(w => KEY.test(w) || /\d/.test(w) ? `<span class="k">${esc(w)}</span>` : esc(w)).join(' ');
    const q = easeOut((t - g.s) / 0.14);
    capEl.style.transform = `translateY(${lerp(30, 0, q)}px) scale(${lerp(0.85, 1, backOut((t - g.s) / 0.18))})`;
    capEl.style.opacity = clamp((t - g.s + 0.04) / 0.06);
  } else capEl.style.opacity = 0;

  renderer.render(scene, camera);
};
for (const b of beats) room(b.scene);
drawEcg(0);
window.READY = true;
