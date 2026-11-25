// PROTOTYPE "cel" style for Gary Tries It (george, 2026-11-25): full 3D sets you can move a
// camera through, cel (toon) shading with ink outlines, and a clean blue "studio" set in a soft
// clay look. Same page contract as web/lowpoly.js: window.renderFrame(t), DURATION, READY.
// Gary's rig is copied from web/lowpoly.js (makeHuman/POSES/setFace) so the daily style is untouched.
//
// Script vocabulary (per beat):
//   set: studio (blue cyclorama, clay look) | kitchen (full room, cel) | street (houses, road, sky, cel)
//   look (optional per beat): cel | clay  -> overrides the set's default look
//   gary: { pose: stand|hold|eat|shrug|walk|wave, expr, build }
//   props: banana (in hand), pile (banana mountain), peels
//   fx: glow (radioactive glow on the bananas), glow_small, atoms (potassium atoms leave the body)
//   camera: crane, crane_up, dolly, orbit, truck, low, face
//   big: "50,000,000" -> giant number pops in mid-screen
import * as THREE from 'three';

const W = 1080, H = 1920;
const ep = new URLSearchParams(location.search).get('ep');
const script = await (await fetch(`/episodes/${ep}/script.json`)).json();
const timeline = await (await fetch(`/episodes/${ep}/timeline.json`)).json();
await document.fonts.load('900 100px Poppins');
await document.fonts.load('800 100px Poppins');

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => { t = clamp(t); return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };
const easeOut = t => 1 - Math.pow(1 - clamp(t), 3);
const backOut = t => { t = clamp(t); const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hash3(x, y, z, s) { let h = Math.imul(Math.round(x * 997) ^ Math.imul(Math.round(y * 991), 31) ^ Math.imul(Math.round(z * 983), 17) ^ s, 0x9E3779B1); h ^= h >>> 15; h = Math.imul(h, 0x85EBCA77); h ^= h >>> 13; return ((h >>> 0) % 10000) / 5000 - 1; }
function jitter(geo, amt, seed = 1) {
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); p.setXYZ(i, x + hash3(x, y, z, seed) * amt * 0.5, y + hash3(y, z, x, seed + 1) * amt * 0.5, z + hash3(z, x, y, seed + 2) * amt * 0.5); }
  geo.computeVertexNormals(); return geo;
}
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }

// ---------- renderer ----------
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gl'), antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, W / H, 0.05, 200);
const hemi = new THREE.HemisphereLight(0xffffff, 0x8a7a70, 1.2); scene.add(hemi);
const key = new THREE.DirectionalLight(0xfff0dd, 2.4);
key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0005; key.shadow.normalBias = 0.03;
Object.assign(key.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 0.5, far: 40 });
scene.add(key, key.target);
const rim = new THREE.DirectionalLight(0xbfe0ff, 1.4); scene.add(rim, rim.target);

// toon ramp: 3 hard bands (shadow / mid / lit) -> the cel look
const RAMP = (() => { const d = new Uint8Array([90, 170, 255]); const t = new THREE.DataTexture(d, 3, 1, THREE.RedFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
const toonMat = (o = {}) => { const { flatShading, ...rest } = o; return new THREE.MeshToonMaterial({ ...rest, gradientMap: RAMP }); };
const matCache = {};
const M = (color, extra) => { const k = color + JSON.stringify(extra || {}); return matCache[k] || (matCache[k] = toonMat({ color, ...extra })); };
const glow = (color) => new THREE.MeshBasicMaterial({ color });
function mesh(geo, material) { const m = new THREE.Mesh(geo, typeof material === 'string' ? M(material) : material); m.castShadow = m.receiveShadow = true; return m; }
const at = (o, x, y, z, rx = 0, ry = 0, rz = 0) => { o.position.set(x, y, z); o.rotation.set(rx, ry, rz); return o; };
const box = (w, h, d, c) => mesh(new THREE.BoxGeometry(w, h, d), c);
const cyl = (rt, rb, h, c, seg = 16) => mesh(new THREE.CylinderGeometry(rt, rb, h, seg), c);
const sph = (r, c, ws = 16, hs = 12) => mesh(new THREE.SphereGeometry(r, ws, hs), c);
const cone = (r, h, c, seg = 12) => mesh(new THREE.ConeGeometry(r, h, seg), c);

// ---------- people (rig copied from web/lowpoly.js) ----------
const PEOPLE = {
  gary: { skin: '#f1c19a', hair: '#5a3a22', hairStyle: 'messy', top: '#f29a2e', bottom: '#384062', shoes: '#f4f4f4', hood: true },
  doctor: { skin: '#9a6544', hair: '#1d1713', hairStyle: 'bun', top: '#2a9d8f', bottom: '#2a9d8f', shoes: '#ffffff', coat: '#f7f7f2', glasses: true, steth: true },
  ghost: { skin: '#e8f1ff', hair: '#cfdcff', hairStyle: 'messy', top: '#dfe9ff', bottom: '#c9d6f7', shoes: '#ffffff', hood: true, ghost: true },
};
function makeHuman(o) {
  const mats = {};
  const ghostMat = c => toonMat({ color: c, flatShading: true, transparent: true, opacity: 0.9, emissive: new THREE.Color('#8fb0ff'), emissiveIntensity: 0.35 });
  const C = (c) => o.ghost ? (mats[c] ||= ghostMat(c)) : M(c);
  const skinMat = o.ghost ? C(o.skin) : toonMat({ color: o.skin, flatShading: true });
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

// extra poses for this prototype (right-arm values are given explicitly)
Object.assign(POSES, {
  hold: { shR: [-0.55, 0, -0.18], elR: [-1.35, 0, 0.35], haR: [0, 0, 0], neck: [0.12, 0, 0], head: [0.18, -0.15, 0] },
  eat: { shR: [-1.15, 0, 0.3], elR: [-2.25, 0, 0.1], haR: [-0.7, 0, 0], head: [-0.08, 0, 0] },
  shrug: { sh: [-0.25, 0, 0.45], el: [-1.35, 0.4, 0], ha: [0, 0, 0], chest: [0, 0, 0], neck: [-0.05, 0, 0], head: [-0.08, 0, 0.1] },
  walk: {},
  wave: { shL: [-0.15, 0, 2.55], elL: [0, 0, 0.55], head: [0, 0.1, 0.05] },
});

const gary = makeHuman(PEOPLE.gary); scene.add(gary.root);

// ---------- props ----------
function makeBanana(len = 0.2, r0 = 0.024) {
  const g = new THREE.Group();
  const path = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(len * 0.5, len * 0.28, 0), new THREE.Vector3(len, 0.02, 0));
  const TS = 16, RS = 6;
  const geo = new THREE.TubeGeometry(path, TS, r0, RS, false);
  const p = geo.attributes.position;
  for (let i = 0; i <= TS; i++) {
    const u = i / TS, c = path.getPointAt(u), taper = 0.35 + 0.65 * Math.sin(Math.PI * clamp(u * 0.92 + 0.04));
    for (let j = 0; j <= RS; j++) { const k = i * (RS + 1) + j; p.setXYZ(k, c.x + (p.getX(k) - c.x) * taper, c.y + (p.getY(k) - c.y) * taper, c.z + (p.getZ(k) - c.z) * taper); }
  }
  geo.computeVertexNormals();
  g.add(mesh(geo, '#ffd23f'));
  const stem = cyl(0.008, 0.011, 0.04, '#6b8e23', 6); stem.position.set(-0.012, -0.006, 0); stem.rotation.z = Math.PI / 2 + 0.5; g.add(stem);
  const tip = sph(0.008, '#3b2a1a', 6, 4); tip.position.set(len, 0.02, 0); g.add(tip);
  return g;
}
const heldBanana = makeBanana(0.2); heldBanana.scale.setScalar(1.6);
const heldOrange = new THREE.Group();
{ heldOrange.add(sph(0.06, '#ff8c1a', 14, 10)); const leaf = sph(0.02, '#3f9e47', 6, 4); leaf.scale.set(1.6, 0.4, 0.8); leaf.position.set(0.015, 0.06, 0); heldOrange.add(leaf); }
// a cut on the back: 'cut' = thin line with plasters (healing), 'wound' = open, pulsing red
const cut = new THREE.Group();
{ const line = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.22, 0.01), new THREE.MeshBasicMaterial({ color: '#b3122a' })); cut.add(line); cut.userData.line = line;
  const plasters = new THREE.Group(); for (const y of [-0.07, 0, 0.07]) plasters.add(at(box(0.07, 0.022, 0.006, '#f2d2b0'), 0, y, 0.004)); cut.add(plasters); cut.userData.plasters = plasters;
  const glowW = new THREE.Sprite(new THREE.SpriteMaterial({ map: null, color: '#ff2040', transparent: true, opacity: 0.0, depthWrite: false, blending: THREE.AdditiveBlending })); glowW.scale.set(0.12, 0.3, 1); cut.add(glowW); cut.userData.glow = glowW; }
const pile = new THREE.Group();
{ const r = rng(5); for (let i = 0; i < 140; i++) { const b = makeBanana(0.2 + r() * 0.05); const a = r() * 6.28, d = 0.55 + Math.pow(r(), 0.7) * 1.7; b.position.set(Math.cos(a) * d, 0.03 + Math.max(0, 1.75 - d) * 0.28 * r(), Math.sin(a) * d - 0.2); b.rotation.set(r() * 0.6, r() * 6.28, r() * 0.8); b.scale.setScalar(1.6); pile.add(b); } }
const peels = new THREE.Group();
{ const r = rng(9); for (let i = 0; i < 9; i++) { const pg = new THREE.Group(); for (let f = 0; f < 4; f++) { const flap = box(0.03, 0.006, 0.12, f % 2 ? '#f2c230' : '#e0b020'); flap.geometry.translate(0, 0, 0.06); flap.rotation.y = f * Math.PI / 2 + 0.3; pg.add(flap); } pg.position.set((r() - 0.5) * 2.0, 0.01, 0.4 + r() * 1.2); pg.rotation.y = r() * 6; pg.scale.setScalar(1.4); peels.add(pg); } }
const glowTex = canvasTex(128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(230,255,200,1)'); gr.addColorStop(0.3, 'rgba(120,255,90,0.7)'); gr.addColorStop(1, 'rgba(60,255,60,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
cut.userData.glow.material.map = glowTex; cut.userData.glow.material.color.set('#ff3040');
const glows = []; for (let i = 0; i < 30; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); s.visible = false; scene.add(s); glows.push(s); }
const atoms = []; for (let i = 0; i < 26; i++) { const a = new THREE.Group(); a.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.035, 1), new THREE.MeshBasicMaterial({ color: '#7dff6a' }))); const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); s.scale.setScalar(0.12); a.add(s); a.visible = false; scene.add(a); atoms.push(a); }

// ---------- sets ----------
function skyDome(top, mid, bottom) {
  const tex = canvasTex(8, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, top); gr.addColorStop(0.5, mid); gr.addColorStop(1, bottom); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  const m = new THREE.Mesh(new THREE.SphereGeometry(120, 32, 16), new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false, depthWrite: false }));
  m.userData.noOutline = true; return m;
}
function tree(h = 1, seed = 1) {
  const g = new THREE.Group(), r = rng(seed);
  g.add(at(cyl(0.09 * h, 0.13 * h, 1.4 * h, '#7a5236', 8), 0, 0.7 * h, 0));
  const greens = ['#4caf50', '#5cc25e', '#3f9e47'];
  for (let i = 0; i < 4; i++) { const b = sph((0.55 + r() * 0.25) * h, greens[i % 3], 10, 8); b.position.set((r() - 0.5) * 0.7 * h, (1.7 + r() * 0.6) * h, (r() - 0.5) * 0.6 * h); g.add(b); }
  return g;
}
function windowFrame(w, h, frame = '#ffffff') {
  const g = new THREE.Group();
  for (const [x, y, bw, bh] of [[0, h / 2, w + 0.12, 0.08], [0, -h / 2, w + 0.12, 0.08], [-w / 2, 0, 0.08, h], [w / 2, 0, 0.08, h], [0, 0, 0.05, h]]) g.add(at(box(bw, bh, 0.1, frame), x, y, 0));
  return g;
}
const SETS = {};
// clean blue cyclorama studio: floor curving up into an endless backdrop
SETS.studio = (() => {
  const g = new THREE.Group(); const blue = '#3d8bff';
  const cycMat = new THREE.MeshStandardMaterial({ color: blue, roughness: 0.9 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 30), cycMat); floor.rotation.x = -Math.PI / 2; floor.position.z = 9; floor.receiveShadow = true; g.add(floor);
  const cove = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 60, 32, 1, true, Math.PI, Math.PI / 2), cycMat); cove.rotation.z = Math.PI / 2; cove.position.set(0, 4, -6); cove.receiveShadow = true;
  cove.material = cycMat; cove.geometry.rotateY(0); g.add(cove);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), cycMat); wall.position.set(0, 24, -10); g.add(wall);
  const plinth = cyl(0.75, 0.8, 0.18, '#f4f6ff', 40); plinth.position.y = 0.09; g.add(plinth);
  for (const m of [floor, cove, wall]) m.userData.noOutline = true;
  return { g, spot: [0, 0.18, 0], look: 'clay', bg: '#3d8bff', fog: ['#3d8bff', 14, 40], keyPos: [-3, 6, 5], rimPos: [3, 4, -4], hemi: [0xdfeaff, 0x3050a0, 1.4], keyI: 2.2, rimI: 2.2 };
})();
// full kitchen: walls beyond the frame, window with a garden outside, table, fridge, lamp
SETS.kitchen = (() => {
  const g = new THREE.Group();
  const tiles = canvasTex(512, 512, (c, w, h) => { for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { c.fillStyle = (i + j) % 2 ? '#f3e9dc' : '#cdb79e'; c.fillRect(i * 64, j * 64, 64, 64); } });
  tiles.wrapS = tiles.wrapT = THREE.RepeatWrapping; tiles.repeat.set(10, 10);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), toonMat({ map: tiles })); floor.rotation.x = -Math.PI / 2; floor.position.z = 1.5; floor.receiveShadow = true; g.add(floor);
  const wallC = '#9ed8c8', H2 = 2.8;
  // back wall with a window hole (x -0.4..1.6, y 1.2..2.2)
  for (const [x, y, w, h] of [[-3, H2 / 2, 5.2, H2], [3.3, H2 / 2, 3.4, H2], [0.6, 0.6, 2.0, 1.2], [0.6, 2.5, 2.0, 0.6]]) g.add(at(box(w, h, 0.15, wallC), x, y, -2.3));
  g.add(at(windowFrame(2.0, 1.0), 0.6, 1.7, -2.24));
  g.add(at(box(0.15, H2, 10, '#f6c28b'), -4.2, H2 / 2, 1.5));
  g.add(at(box(0.15, H2, 10, '#f6c28b'), 4.6, H2 / 2, 1.5));
  const ceil = box(10, 0.1, 10, '#fff7ec'); ceil.position.set(0, H2 + 0.05, 1.5); g.add(ceil);
  // counter + cabinets along the back wall
  g.add(at(box(6, 0.9, 0.65, '#ffffff'), -0.3, 0.45, -1.9));
  g.add(at(box(6.1, 0.06, 0.7, '#4a4e69'), -0.3, 0.93, -1.9));
  for (let i = 0; i < 6; i++) { g.add(at(box(0.9, 0.75, 0.03, '#f2f2f2'), -2.8 + i * 1.0, 0.45, -1.56)); g.add(at(box(0.18, 0.03, 0.04, '#888'), -2.8 + i * 1.0, 0.72, -1.53)); }
  for (const x of [-2.6, -1.6, 2.3]) { g.add(at(box(0.95, 0.8, 0.4, '#ffffff'), x, 2.1, -2.0)); g.add(at(box(0.16, 0.03, 0.04, '#888'), x, 1.78, -1.79)); }
  g.add(at(box(0.7, 0.05, 0.45, '#b8c0cc'), 0.6, 0.97, -1.9)); // sink
  const tap = new THREE.Group(); tap.add(at(cyl(0.025, 0.025, 0.3, '#c0c6d0', 8), 0, 0.15, 0)); tap.add(at(cyl(0.02, 0.02, 0.2, '#c0c6d0', 8), 0, 0.3, 0.08, Math.PI / 2, 0, 0)); g.add(at(tap, 0.6, 0.96, -2.1));
  // fruit bowl of bananas on the counter
  const bowl = new THREE.Group(); bowl.add(at(cyl(0.22, 0.14, 0.1, '#ef476f', 20), 0, 0.05, 0)); for (let i = 0; i < 4; i++) { const b = makeBanana(0.2); b.position.set(-0.1 + i * 0.05, 0.12, (i % 2) * 0.04); b.rotation.set(0, 0.3 * i, 0.2); bowl.add(b); } g.add(at(bowl, -1.4, 0.96, -1.85));
  // fridge
  g.add(at(box(0.85, 2.0, 0.75, '#e8edf3'), -3.6, 1.0, -1.7)); g.add(at(box(0.05, 0.6, 0.05, '#9aa'), -3.25, 1.3, -1.3));
  // table + chairs
  const table = new THREE.Group(); table.add(at(cyl(0.65, 0.65, 0.06, '#c98b55', 28), 0, 0.76, 0)); table.add(at(cyl(0.06, 0.1, 0.74, '#8d5a34', 10), 0, 0.37, 0));
  for (const a of [0.5, 2.6, 4.2]) { const ch = new THREE.Group(); ch.add(at(box(0.42, 0.05, 0.42, '#ffd166'), 0, 0.46, 0)); ch.add(at(box(0.42, 0.5, 0.05, '#ffd166'), 0, 0.72, -0.2)); for (const [x, z] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) ch.add(at(cyl(0.02, 0.02, 0.46, '#c98b55', 6), x, 0.23, z)); ch.position.set(Math.sin(a) * 0.9, 0, Math.cos(a) * 0.9); ch.rotation.y = a + Math.PI; table.add(ch); }
  g.add(at(table, -1.9, 0, 1.0));
  // pendant lamp
  g.add(at(cyl(0.008, 0.008, 1.0, '#333', 4), -1.9, H2 - 0.5, 1.0)); const shade = cone(0.25, 0.22, '#ef476f', 20); shade.position.set(-1.9, H2 - 1.0, 1.0); g.add(shade);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), glow('#fff3c4')); bulb.position.set(-1.9, H2 - 1.1, 1.0); g.add(bulb);
  // outside the window: garden, fence, trees, sky
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), toonMat({ color: '#7ccf6a' })); grass.rotation.x = -Math.PI / 2; grass.position.set(0, -0.3, -18); g.add(grass);
  for (let i = 0; i < 6; i++) g.add(at(tree(1.1 + (i % 3) * 0.3, i + 3), -6 + i * 2.6, -0.3, -6 - (i % 2) * 2.5));
  for (let i = 0; i < 18; i++) g.add(at(box(0.12, 0.9, 0.05, '#ffffff'), -5 + i * 0.6, 0.15, -4.2));
  const sky = skyDome('#5fb4ff', '#a9dcff', '#e9f7ff'); g.add(sky);
  // wall clock + picture
  const clock = new THREE.Group(); clock.add(at(cyl(0.22, 0.22, 0.05, '#ffffff', 24), 0, 0, 0, Math.PI / 2, 0, 0)); clock.add(at(cyl(0.24, 0.24, 0.04, '#4a4e69', 24), 0, 0, -0.02, Math.PI / 2, 0, 0)); g.add(at(clock, 2.7, 2.15, -2.2));
  return { g, spot: [0.6, 0, -0.6], look: 'cel', bg: '#a9dcff', fog: null, keyPos: [3, 6, 4], rimPos: [-3, 3, -3], hemi: [0xffffff, 0xb59b86, 1.3], keyI: 2.0, rimI: 0.8 };
})();
// street: pavement, road, a row of houses, trees and lamp posts under a big sky
SETS.street = (() => {
  const g = new THREE.Group();
  const road = new THREE.Mesh(new THREE.PlaneGeometry(120, 8), toonMat({ color: '#565a6e' })); road.rotation.x = -Math.PI / 2; road.position.set(0, -0.02, 5.5); road.receiveShadow = true; g.add(road);
  for (let i = 0; i < 40; i++) g.add(at(box(1.2, 0.01, 0.15, '#ffffff'), -60 + i * 3, 0, 5.5));
  const pave = box(120, 0.15, 2.2, '#d9d4cc'); pave.position.set(0, 0.0, 0.6); g.add(pave);
  g.add(at(box(120, 0.18, 0.2, '#b8b2a8'), 0, 0.02, 1.75));
  const lawn = new THREE.Mesh(new THREE.PlaneGeometry(120, 30), toonMat({ color: '#86d36f' })); lawn.rotation.x = -Math.PI / 2; lawn.position.set(0, 0.0, -15); g.add(lawn);
  const cols = ['#ff9f7a', '#ffd166', '#a0c4ff', '#cdb4db', '#f4a261', '#90e0ef'], roofs = ['#6d597a', '#b5654c', '#355070', '#8d5a34'];
  for (let i = 0; i < 16; i++) {
    const h = new THREE.Group(), x = -32 + i * 4.2, c = cols[i % cols.length], wd = 3.4, hh = 3.2 + (i % 3) * 0.5;
    h.add(at(box(wd, hh, 3, c), 0, hh / 2, 0));
    const roof = mesh(new THREE.CylinderGeometry(0.01, 2.3, 1.6, 4, 1), roofs[i % roofs.length]); roof.rotation.y = Math.PI / 4; roof.scale.set(1.05, 1, 0.95); roof.position.y = hh + 0.8; h.add(roof);
    h.add(at(box(0.8, 1.5, 0.08, '#5a3a22'), -0.8, 0.75, 1.52));
    for (const [wx, wy] of [[0.7, 1.1], [-0.8, hh - 0.8], [0.7, hh - 0.8]]) { h.add(at(box(0.8, 0.7, 0.05, '#cfeeff'), wx, wy, 1.52)); h.add(at(windowFrame(0.8, 0.7), wx, wy, 1.55)); }
    h.add(at(box(0.25, 0.8, 0.25, '#8a8a8a'), 1.0, hh + 0.9, -0.4));
    g.add(at(h, x, 0, -4));
    g.add(at(box(4.1, 0.5, 0.15, '#ffffff'), x, 0.25, -0.4));
    if (i % 2) g.add(at(tree(1.0 + (i % 3) * 0.2, i), x + 1.6, 0, -1.4));
  }
  for (let i = 0; i < 12; i++) { const lp = new THREE.Group(); lp.add(at(cyl(0.05, 0.07, 3.4, '#2b2d42', 8), 0, 1.7, 0)); lp.add(at(box(0.5, 0.08, 0.15, '#2b2d42'), 0.2, 3.4, 0)); lp.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), glow('#fff3c4')), 0.4, 3.32, 0)); g.add(at(lp, -30 + i * 6, 0, 1.55)); }
  for (let i = 0; i < 7; i++) { const hill = mesh(new THREE.SphereGeometry(14 + (i % 3) * 4, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), i % 2 ? '#6cbf5b' : '#5aa94e'); hill.position.set(-60 + i * 22, -2, -45 - (i % 2) * 10); hill.scale.y = 0.45; hill.castShadow = false; g.add(hill); }
  g.add(skyDome('#3f9bff', '#9fd4ff', '#fff1d6'));
  return { g, spot: [3, 0.075, 0.6], look: 'cel', bg: '#9fd4ff', fog: ['#cfe8ff', 25, 90], keyPos: [4, 8, 6], rimPos: [-4, 4, -5], hemi: [0xffffff, 0x88aa77, 1.3], keyI: 2.2, rimI: 1.0 };
})();
for (const k in SETS) { SETS[k].g.visible = false; scene.add(SETS[k].g); }

// ---------- looks: cel (toon + ink) vs clay (soft standard shading, no ink) ----------
const clayTwin = new Map();
function twin(m) {
  if (!m.isMeshToonMaterial) return m;
  let c = clayTwin.get(m);
  if (!c) { c = new THREE.MeshStandardMaterial({ color: m.color, map: m.map, roughness: 0.55, metalness: 0.0, emissive: m.emissive, emissiveIntensity: m.emissiveIntensity, transparent: m.transparent, opacity: m.opacity, side: m.side }); clayTwin.set(m, c); }
  c.color.copy(m.color); return c;
}
function applyLook(look) {
  scene.traverse(o => { if (!o.isMesh) return; if (!o.userData.base) o.userData.base = o.material; o.material = look === 'clay' ? twin(o.userData.base) : o.userData.base; });
}

// ---------- ink outlines: depth + normal edge detection as a post pass ----------
const rtColor = new THREE.WebGLRenderTarget(W, H, { samples: 4, type: THREE.HalfFloatType });
const rtNormal = new THREE.WebGLRenderTarget(W, H); rtNormal.depthTexture = new THREE.DepthTexture(W, H);
const normalMat = new THREE.MeshNormalMaterial();
const post = new THREE.ShaderMaterial({
  uniforms: { tColor: { value: rtColor.texture }, tNormal: { value: rtNormal.texture }, tDepth: { value: rtNormal.depthTexture }, ink: { value: 1 }, near: { value: 0.05 }, far: { value: 200 }, px: { value: new THREE.Vector2(1 / W, 1 / H) }, inkColor: { value: new THREE.Color('#1d1a2e') } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
  fragmentShader: `
    uniform sampler2D tColor, tNormal, tDepth; uniform float ink, near, far; uniform vec2 px; uniform vec3 inkColor; varying vec2 vUv;
    float lin(vec2 uv){ float d = texture2D(tDepth, uv).x; float z = d * 2.0 - 1.0; return (2.0 * near * far) / (far + near - z * (far - near)); }
    vec3 nrm(vec2 uv){ return texture2D(tNormal, uv).xyz * 2.0 - 1.0; }
    void main(){
      vec4 col = texture2D(tColor, vUv);
      if (ink > 0.5) {
        float dc = lin(vUv); vec3 nc = nrm(vUv); float e = 0.0;
        vec2 o[8]; o[0]=vec2(2.2,0.); o[1]=vec2(-2.2,0.); o[2]=vec2(0.,2.2); o[3]=vec2(0.,-2.2); o[4]=vec2(1.6,1.6); o[5]=vec2(-1.6,1.6); o[6]=vec2(1.6,-1.6); o[7]=vec2(-1.6,-1.6);
        for (int i = 0; i < 8; i++) { vec2 uv = vUv + o[i] * px; float dn = lin(uv); e = max(e, smoothstep(0.03, 0.06, (dn - dc) / dc));
          e = max(e, smoothstep(0.55, 0.8, 1.0 - dot(nc, nrm(uv))) * step(dc, 30.0)); }
        col.rgb = mix(col.rgb, inkColor, e * 0.92);
      }
      gl_FragColor = col;
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
  depthTest: false, depthWrite: false,
});
const postScene = new THREE.Scene(); const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), post));
function draw(look) {
  const inked = look !== 'clay';
  if (inked) {
    const hidden = []; scene.traverse(o => { if ((o.isSprite || o.userData.noOutline) && o.visible) { hidden.push(o); o.visible = false; } });
    scene.overrideMaterial = normalMat; const bg = scene.background; scene.background = null; renderer.setClearColor(0x8080ff, 1);
    renderer.setRenderTarget(rtNormal); renderer.clear(); renderer.render(scene, camera);
    scene.overrideMaterial = null; scene.background = bg; hidden.forEach(o => o.visible = true);
  }
  renderer.setRenderTarget(rtColor); renderer.clear(); renderer.render(scene, camera);
  post.uniforms.ink.value = inked ? 1 : 0;
  renderer.setRenderTarget(null); renderer.render(postScene, postCam);
}

// ---------- captions (as in lowpoly) ----------
const $ = id => document.getElementById(id);
const capEl = $('caption'), labelEl = $('label'), flashEl = $('flash'), bigEl = $('big');
const KEY = new RegExp('^(' + ['die', 'died', 'day', 'week', 'month', 'year', ...(script.keywords || [])].join('|') + ')', 'i');
const groups = [];
timeline.beats.forEach(b => { let cur = null; b.words.forEach(w => { if (!cur || cur.words.length >= 3 || cur.chars + w.w.length > 14) { cur = { words: [], chars: 0, s: w.s }; groups.push(cur); } cur.words.push(w.w); cur.chars += w.w.length + 1; cur.e = w.e; if (/[.,!?;:]$/.test(w.w)) cur = null; }); });
const captionAt = t => { for (let i = 0; i < groups.length; i++) { const g = groups[i], n = groups[i + 1]; if (t >= g.s - 0.04 && t < Math.min(n ? n.s : Infinity, g.e + 0.35)) return g; } return null; };
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

// ---------- cameras: k = 0..1 through the beat; P = Gary's feet, Hd = Gary's head ----------
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const CAMS = {
  crane: (k, P, Hd) => ({ pos: Hd.clone().add(V(lerp(1.0, 0.35, k), lerp(1.8, 0.05, k), lerp(3.6, 2.1, k))), look: Hd.clone().add(V(0, lerp(-0.9, -0.3, k), 0)), fov: 42 }),
  crane_up: (k, P, Hd) => ({ pos: Hd.clone().add(V(lerp(0.3, 1.2, k), lerp(0.0, 2.8, k), lerp(2.2, 5.2, k))), look: P.clone().add(V(0, lerp(1.3, 0.7, k), 0)), fov: 42 }),
  dolly: (k, P, Hd) => ({ pos: Hd.clone().add(V(lerp(0.5, 0.2, k), -0.1, lerp(3.8, 1.5, k))), look: Hd.clone().add(V(0, -0.35, 0)), fov: 40 }),
  orbit: (k, P, Hd) => { const a = lerp(-0.7, 0.55, k), r = 2.3; return { pos: Hd.clone().add(V(Math.sin(a) * r, 0.15, Math.cos(a) * r)), look: Hd.clone().add(V(0, -0.35, 0)), fov: 42 }; },
  truck: (k, P, Hd) => ({ pos: Hd.clone().add(V(lerp(-1.3, 1.0, k), -0.15, 2.9)), look: Hd.clone().add(V(lerp(-0.4, 0.3, k), -0.45, 0)), fov: 42 }),
  low: (k, P, Hd) => ({ pos: P.clone().add(V(lerp(0.7, 0.35, k), 0.3, lerp(2.6, 1.9, k))), look: Hd.clone().add(V(0, 0.15, 0)), fov: 50 }),
  back: (k, P, Hd) => { const a = lerp(Math.PI - 0.5, Math.PI + 0.35, k), r = lerp(2.6, 2.0, k); return { pos: Hd.clone().add(V(Math.sin(a) * r, -0.3, Math.cos(a) * r)), look: Hd.clone().add(V(0, -0.62, 0)), fov: 42 }; },
  face: (k, P, Hd) => ({ pos: Hd.clone().add(V(lerp(0.3, 0.1, k), 0.04, lerp(1.1, 0.8, k))), look: Hd.clone(), fov: 40 }),
};

// ---------- main ----------
const beats = script.beats.map((b, i) => ({ ...b, ...timeline.beats[i] }));
window.DURATION = timeline.duration;
let lastSet = null, lastLook = null;
window.renderFrame = (t) => {
  let bi = beats.findIndex(b => t < b.end); if (bi < 0) bi = beats.length - 1;
  const b = beats[bi], lt = t - b.start, dur = b.end - b.start, p = clamp(lt / dur);
  const S = SETS[b.set] || SETS.studio, look = new URLSearchParams(location.search).get('look') || b.look || S.look;
  if (b.set !== lastSet) {
    for (const k in SETS) SETS[k].g.visible = SETS[k] === S;
    scene.background = new THREE.Color(S.bg); scene.fog = S.fog ? new THREE.Fog(S.fog[0], S.fog[1], S.fog[2]) : null;
    hemi.color.set(S.hemi[0]); hemi.groundColor.set(S.hemi[1]); hemi.intensity = S.hemi[2];
    key.intensity = S.keyI; rim.intensity = S.rimI; lastSet = b.set;
  }
  if (look !== lastLook) { applyLook(look); lastLook = look; }
  renderer.toneMapping = look === 'clay' ? THREE.ACESFilmicToneMapping : THREE.NoToneMapping; renderer.toneMappingExposure = 1.1;

  // Gary
  const gs = b.gary || {};
  let pose = resolvePose(gs.pose || 'stand');
  const [sx, sy, sz] = S.spot;
  let gx = sx;
  const running = gs.pose === 'run'; if (running) pose = resolvePose('walk');
  const fallK = b.collapse ? ease((p - 0.62) / 0.22) : 0;
  if (gs.pose === 'walk' || running) {
    const w = (running ? 12 : 7.5) * (b.collapse ? Math.min(t, b.start + dur * 0.62) : t), s = Math.sin(w);
    pose.hipL = [0.5 * s, 0, 0.02]; pose.hipR = [-0.5 * s, 0, -0.02];
    pose.knL = [0.7 * Math.max(0, -Math.cos(w)), 0, 0]; pose.knR = [0.7 * Math.max(0, Math.cos(w)), 0, 0];
    pose.shL = [-0.4 * s, 0, 0.1]; pose.elL = [-0.35, 0, 0];
    pose.shR = [-0.5, 0, -0.18]; pose.elR = [-1.3, 0, 0.3];
    pose.hipsY += 0.025 * Math.abs(Math.cos(w));
    gx = sx - 1.4 + (b.collapse ? Math.min(lt, dur * 0.62) : lt) * (running ? 1.8 : 0.9);
  }
  if (gs.pose === 'wave') pose.elL = [0, 0, 0.5 + 0.45 * Math.sin(t * 9)];
  pose.chest = [pose.chest[0] + 0.015 * Math.sin(t * 2.4), pose.chest[1], pose.chest[2]];
  pose.head = [pose.head[0] + 0.02 * Math.sin(t * 1.3), pose.head[1] + 0.05 * Math.sin(t * 0.7), pose.head[2]];
  if (gs.pose === 'eat') pose.head = [pose.head[0] + 0.06 * Math.sin(t * 10), pose.head[1], pose.head[2]];
  applyPose(gary, pose); setBuild(gary, gs.build || 0);
  const chewing = gs.pose === 'eat' ? 0.25 + 0.25 * Math.abs(Math.sin(t * 10)) : 0;
  setFace(gary, gs.expr || 'neutral', { blink: (t % 3.3) < 0.11, mouth: chewing, t });
  gary.root.position.set(gx, sy, sz);
  gary.root.rotation.set(0, (gs.pose === 'walk' || running) ? Math.PI / 2 - 0.25 : (b.set === 'kitchen' ? -0.25 : 0), 0);
  if (fallK > 0) { gary.root.rotation.z = -1.42 * fallK; gary.root.rotation.order = 'YXZ'; }

  // props
  const props = b.props || [];
  heldBanana.removeFromParent(); heldOrange.removeFromParent(); pile.removeFromParent(); peels.removeFromParent(); cut.removeFromParent();
  if (props.includes('orange')) { gary.j.haR.add(heldOrange); heldOrange.position.set(0, -0.1, 0.05); }
  if (b.fx === 'cut' || b.fx === 'wound' || gs.wound) { const open = b.fx === 'wound' || gs.wound === 'open'; gary.j.chest.add(cut); cut.position.set(0.07, -0.02, -0.215); cut.rotation.set(0, Math.PI, 0.15);
    cut.userData.line.scale.set(open ? 3.2 : 1, 1, 1); cut.userData.plasters.visible = !open; cut.userData.glow.material.opacity = open ? 0.45 + 0.35 * Math.sin(t * 7) : 0; }
  if (props.includes('banana')) { gary.j.haR.add(heldBanana); heldBanana.position.set(0.02, -0.09, 0.05); heldBanana.rotation.set(0, -1.4, 1.6); }
  if (props.includes('pile')) { scene.add(pile); pile.position.set(sx, 0, sz); }
  if (props.includes('peels')) { scene.add(peels); peels.position.set(sx, 0, sz); }
  scene.updateMatrixWorld(true);
  const Hd = gary.j.head.localToWorld(V(0, 0.11, 0)), P = gary.root.position.clone();
  // fx: radioactive glow on bananas
  glows.forEach(s => s.visible = false);
  if (b.fx === 'glow' || b.fx === 'glow_small') {
    const pts = b.fx === 'glow' ? pile.children.slice(0, glows.length).map(c => c.getWorldPosition(V(0, 0, 0))) : [heldBanana.getWorldPosition(V(0, 0, 0))];
    pts.forEach((q, i) => { const s = glows[i]; s.visible = true; s.position.copy(q); s.scale.setScalar((b.fx === 'glow' ? 0.55 : 0.35) * (0.8 + 0.25 * Math.sin(t * 6 + i))); s.material.opacity = 0.55; });
  }
  // fx: potassium atoms orbit the body, then leave
  atoms.forEach(a => a.visible = false);
  if (b.fx === 'atoms') {
    const C = gary.j.chest.localToWorld(V(0, 0, 0));
    atoms.forEach((a, i) => { const r = rng(i * 13 + 1); const a0 = r() * 6.28, sp = 1.5 + r(), rad = 0.35 + r() * 0.2, out = clamp((p - 0.35 - r() * 0.2) / 0.4);
      const ang = a0 + t * sp; a.visible = out < 1; a.position.set(C.x + Math.cos(ang) * (rad + out * 3), C.y + (r() - 0.5) * 0.9 + out * 1.5, C.z + Math.sin(ang) * (rad + out * 3)); a.scale.setScalar(1 - out * 0.6); });
  }

  // camera
  key.position.set(P.x + S.keyPos[0], S.keyPos[1], P.z + S.keyPos[2]); key.target.position.copy(P);
  rim.position.set(P.x + S.rimPos[0], S.rimPos[1], P.z + S.rimPos[2]); rim.target.position.copy(P);
  const cam = (CAMS[b.camera] || CAMS.dolly)(ease(p), P, Hd);
  camera.position.copy(cam.pos); camera.position.x += 0.015 * Math.sin(t * 0.9); camera.position.y += 0.012 * Math.sin(t * 1.3);
  camera.fov = cam.fov; camera.updateProjectionMatrix(); camera.lookAt(cam.look);

  // HUD
  flashEl.style.opacity = bi > 0 && lt < 0.1 ? 0.35 * (1 - lt / 0.1) : 0;
  if (b.label) {
    labelEl.className = b.hook ? 'hook' : '';
    labelEl.innerHTML = `<span class="chip">${esc(b.label).replace(/\*([^*]+)\*/g, '<span class="hot">$1</span>')}</span>`;
    labelEl.style.opacity = clamp(lt / 0.08);
    labelEl.style.transform = `translateY(${lerp(-60, 0, easeOut(lt / 0.3))}px) scale(${lerp(0.6, 1, backOut(lt / 0.32)) * (b.hook ? 1 + 0.025 * Math.sin(t * 7) : 1)})`;
  } else labelEl.style.opacity = 0;
  if (b.big) { const q = clamp((lt - 0.9) / 0.3); bigEl.textContent = b.big; bigEl.style.fontSize = b.big.length > 10 ? '112px' : '150px'; bigEl.style.opacity = q; bigEl.style.transform = `scale(${lerp(0.4, 1, backOut(q))})`; } else bigEl.style.opacity = 0;
  const g = captionAt(t);
  if (g) {
    capEl.innerHTML = g.words.map(w => KEY.test(w) || /\d/.test(w) ? `<span class="k">${esc(w)}</span>` : esc(w)).join(' ');
    capEl.style.transform = `translateY(${lerp(30, 0, easeOut((t - g.s) / 0.14))}px) scale(${lerp(0.85, 1, backOut((t - g.s) / 0.18))})`;
    capEl.style.opacity = clamp((t - g.s + 0.04) / 0.06);
  } else capEl.style.opacity = 0;

  draw(look);
};
window.READY = true;
