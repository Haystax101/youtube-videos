// Big-head 2.5D characters for the "smol" look (george's reference, 26 Nov): a 3D toon-shaded ball head with a
// drawn face decal that turns toward the camera, a small peg body in cloth, thin arms, stubby legs, simple hats.
// Shared by World of How and the dark-story channel. No outlines on the 3D parts; ink only in the face.
//
//   import { makeBighead } from '../smol-look/bighead.js';
//   const guy = makeBighead(THREE, { skin: '#f4e3cf', scalp: '#e9b9a6', cloth: '#d9772f', hat: 'none', brows: 'thick' });
//   scene.add(guy.root);  guy.root.position.set(x, 0, z);
//   each frame: guy.pose('walk', t); guy.face('smug'); guy.look(camera);   // head yaw follows the camera (clamped)
//   guy.hand('r') is a Group at the right hand: add props to it (bowl, cigarette, wire).
//
// Units: about 1.3 tall (head 0.64 across). Scale root for adults vs kids. Expressions and poses are listed below.

const TOON = {};
function toonGrad(THREE) {
  if (TOON.g) return TOON.g;
  const d = new Uint8Array([135, 135, 135, 255, 200, 200, 200, 255, 245, 245, 245, 255, 255, 255, 255, 255]);   // soft cel: flat fill, gentle shadow
  const t = new THREE.DataTexture(d, 4, 1, THREE.RGBAFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true;
  return (TOON.g = t);
}
// Ink outline (inverted hull): a dark back-face shell pushed out along the normals, like the reference's drawn linework.
const INKM = {};
export function inkMaterial(THREE, width = 0.011, px = 3.2) {
  const key = width + '|' + px; if (INKM[key]) return INKM[key];
  // a small world-space push (seals the hull) plus a screen-space push so the line stays ~px pixels wide at any
  // distance (sized for a 1080x1920 frame), like hand-drawn linework
  const m = new THREE.MeshBasicMaterial({ color: '#1c1417', side: THREE.BackSide, toneMapped: false });
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>\n  transformed += normalize(normal) * ${width.toFixed(5)};`)
      .replace('#include <project_vertex>', `#include <project_vertex>
  { vec3 nv = normalize(normalMatrix * normal); vec2 d = nv.xy; float l = length(d); if (l > 1e-4) d /= l;
    gl_Position.xy += d * vec2(${(2 * px / 1080).toFixed(5)}, ${(2 * px / 1920).toFixed(5)}) * gl_Position.w; }`);
  };
  m.customProgramCacheKey = () => 'ink' + key;
  return (INKM[key] = m);
}
export function addInk(THREE, root, width = 0.011, skip = new Set()) {
  const meshes = []; root.traverse((o) => { if (o.isMesh && !skip.has(o) && !o.userData.noInk && !(o.material && o.material.transparent)) meshes.push(o); });
  for (const m of meshes) { const sh = new THREE.Mesh(m.geometry, inkMaterial(THREE, width)); sh.castShadow = false; sh.receiveShadow = false; sh.userData.noInk = true; sh.userData.ink = true; m.add(sh); }
}
export function toon(THREE, color, extra = {}) { return new THREE.MeshToonMaterial({ color, gradientMap: toonGrad(THREE), ...extra }); }

const INK = '#1d1416';
export const EXPRS = ['neutral', 'smug', 'happy', 'grin', 'worried', 'shock', 'sad', 'angry', 'focus', 'sleepy', 'pain', 'kind', 'surprised'];
const FACE = {
  neutral: { eyes: 'dot', brows: [-0.05, 0.05], mouth: 'small' },
  smug: { eyes: 'half', brows: [0.22, -0.05], mouth: 'smirk' },
  happy: { eyes: 'arc', brows: [-0.1, 0.1], mouth: 'smile' },
  grin: { eyes: 'arc', brows: [-0.12, 0.12], mouth: 'grin' },
  worried: { eyes: 'dot', brows: [-0.35, 0.35], mouth: 'wobble', sweat: true },
  shock: { eyes: 'wide', brows: [-0.15, 0.15], mouth: 'o', lift: 14 },
  surprised: { eyes: 'wide', brows: [-0.1, 0.1], mouth: 'small', lift: 10 },
  sad: { eyes: 'dot', brows: [-0.4, 0.4], mouth: 'frown' },
  angry: { eyes: 'dot', brows: [0.45, -0.45], mouth: 'frown' },
  focus: { eyes: 'half', brows: [0.3, -0.3], mouth: 'flat' },
  sleepy: { eyes: 'closed', brows: [0, 0], mouth: 'flat' },
  pain: { eyes: 'squeeze', brows: [-0.45, 0.45], mouth: 'grit' },
  kind: { eyes: 'arc', brows: [-0.25, 0.25], mouth: 'smile' },
};

function drawFace(x, S, spec, expr, t) {
  const F = FACE[expr] || FACE.neutral; x.clearRect(0, 0, S, S);
  const cx = S / 2, ey = S * 0.56 - (F.lift || 0) * 0.3, k = S / 512; x.lineCap = 'round'; x.lineJoin = 'round';
  // the crease on the crown (the reference's signature line)
  x.strokeStyle = 'rgba(120,70,60,.55)'; x.lineWidth = 5 * k; x.beginPath(); x.moveTo(cx, S * 0.06); x.lineTo(cx, S * 0.2); x.stroke();
  const blink = (t % 3.7) < 0.09 && F.eyes !== 'closed' && F.eyes !== 'arc';
  for (const d of [-1, 1]) {
    const ex = cx + d * 62 * k;
    x.fillStyle = INK; x.strokeStyle = INK;
    const e = blink ? 'closed' : F.eyes;
    if (e === 'dot') { x.beginPath(); x.ellipse(ex, ey, 11 * k, 15 * k, 0, 0, 7); x.fill(); x.fillStyle = 'rgba(255,255,255,.85)'; x.beginPath(); x.arc(ex + 3 * k, ey - 5 * k, 3.5 * k, 0, 7); x.fill(); }
    else if (e === 'half') { x.lineWidth = 9 * k; x.beginPath(); x.moveTo(ex - 20 * k, ey - 2 * k); x.lineTo(ex + 20 * k, ey - 2 * k); x.stroke(); x.beginPath(); x.ellipse(ex + 4 * k, ey + 4 * k, 9 * k, 7 * k, 0, 0, Math.PI); x.fill(); }
    else if (e === 'arc') { x.lineWidth = 8 * k; x.beginPath(); x.arc(ex, ey + 6 * k, 17 * k, Math.PI * 1.1, Math.PI * 1.9); x.stroke(); }
    else if (e === 'closed') { x.lineWidth = 7 * k; x.beginPath(); x.moveTo(ex - 17 * k, ey + 2 * k); x.quadraticCurveTo(ex, ey + 10 * k, ex + 17 * k, ey + 2 * k); x.stroke(); }
    else if (e === 'squeeze') { x.lineWidth = 7 * k; x.beginPath(); x.moveTo(ex - d * 18 * k, ey - 10 * k); x.lineTo(ex + d * 10 * k, ey); x.lineTo(ex - d * 18 * k, ey + 10 * k); x.stroke(); }
    else if (e === 'wide') { x.fillStyle = '#fff'; x.lineWidth = 5 * k; x.beginPath(); x.arc(ex, ey, 24 * k, 0, 7); x.fill(); x.stroke(); x.fillStyle = INK; x.beginPath(); x.arc(ex, ey + 2 * k, 8 * k, 0, 7); x.fill(); }
    // brows: thick rounded bars, tilt per expression
    const tilt = F.brows[d < 0 ? 0 : 1], by = ey - (42 + (F.lift || 0)) * k;
    x.save(); x.translate(ex, by); x.rotate(tilt * d * -1 * -1); x.lineWidth = (spec.brows === 'thin' ? 7 : 13) * k; x.strokeStyle = spec.browC || INK;
    x.beginPath(); x.moveTo(-22 * k, 0); x.lineTo(22 * k, 0); x.stroke(); x.restore();
  }
  if (spec.glasses) { x.strokeStyle = '#3a2a1e'; x.lineWidth = 5 * k; for (const d of [-1, 1]) { x.beginPath(); x.arc(cx + d * 62 * k, ey, 30 * k, 0, 7); x.stroke(); } x.beginPath(); x.moveTo(cx - 32 * k, ey); x.lineTo(cx + 32 * k, ey); x.stroke(); }
  const my = ey + 78 * k; x.strokeStyle = INK; x.fillStyle = INK; x.lineWidth = 7 * k;
  if (spec.stubble) { x.fillStyle = 'rgba(60,40,40,.13)'; x.beginPath(); x.ellipse(cx, my + 10 * k, 120 * k, 70 * k, 0, 0, 7); x.fill(); x.fillStyle = INK; }
  const m = F.mouth;
  if (m === 'small') { x.beginPath(); x.moveTo(cx - 14 * k, my); x.quadraticCurveTo(cx, my + 8 * k, cx + 14 * k, my); x.stroke(); }
  if (m === 'smile') { x.beginPath(); x.moveTo(cx - 26 * k, my - 4 * k); x.quadraticCurveTo(cx, my + 18 * k, cx + 26 * k, my - 4 * k); x.stroke(); }
  if (m === 'smirk') { x.beginPath(); x.moveTo(cx - 24 * k, my + 2 * k); x.quadraticCurveTo(cx + 4 * k, my + 14 * k, cx + 28 * k, my - 8 * k); x.stroke(); }
  if (m === 'flat') { x.beginPath(); x.moveTo(cx - 16 * k, my + 4 * k); x.lineTo(cx + 16 * k, my + 4 * k); x.stroke(); }
  if (m === 'frown') { x.beginPath(); x.moveTo(cx - 20 * k, my + 10 * k); x.quadraticCurveTo(cx, my - 6 * k, cx + 20 * k, my + 10 * k); x.stroke(); }
  if (m === 'wobble') { x.beginPath(); x.moveTo(cx - 22 * k, my + 6 * k); for (let i = 1; i <= 4; i++) x.lineTo(cx - 22 * k + i * 11 * k, my + (i % 2 ? 0 : 6) * k); x.stroke(); }
  if (m === 'o') { x.fillStyle = '#5a1f24'; x.beginPath(); x.ellipse(cx, my + 8 * k, 14 * k, 19 * k, 0, 0, 7); x.fill(); x.stroke(); }
  if (m === 'grin') { x.fillStyle = '#5a1f24'; x.beginPath(); x.moveTo(cx - 30 * k, my - 4 * k); x.quadraticCurveTo(cx, my + 40 * k, cx + 30 * k, my - 4 * k); x.closePath(); x.fill(); x.stroke(); x.fillStyle = '#e98a8a'; x.beginPath(); x.ellipse(cx, my + 16 * k, 12 * k, 6 * k, 0, 0, 7); x.fill(); }
  if (m === 'grit') { x.fillStyle = '#fff'; x.beginPath(); x.roundRect(cx - 24 * k, my - 4 * k, 48 * k, 18 * k, 6 * k); x.fill(); x.stroke(); x.lineWidth = 3 * k; for (const xx of [-8, 8]) { x.beginPath(); x.moveTo(cx + xx * k, my - 4 * k); x.lineTo(cx + xx * k, my + 14 * k); x.stroke(); } }
  if (spec.tache) { x.fillStyle = spec.tacheC || '#3b2a22'; x.beginPath(); x.moveTo(cx, my - 22 * k); x.bezierCurveTo(cx - 30 * k, my - 34 * k, cx - 62 * k, my - 20 * k, cx - 64 * k, my - 2 * k); x.bezierCurveTo(cx - 40 * k, my - 10 * k, cx - 20 * k, my - 8 * k, cx, my - 12 * k); x.bezierCurveTo(cx + 20 * k, my - 8 * k, cx + 40 * k, my - 10 * k, cx + 64 * k, my - 2 * k); x.bezierCurveTo(cx + 62 * k, my - 20 * k, cx + 30 * k, my - 34 * k, cx, my - 22 * k); x.fill(); }
  if (F.sweat) { const sy = ey - 70 * k + ((t * 40) % 30) * k; x.fillStyle = '#9fd3f5'; x.strokeStyle = '#2b6a9a'; x.lineWidth = 3 * k; x.beginPath(); x.moveTo(cx + 140 * k, sy - 22 * k); x.quadraticCurveTo(cx + 156 * k, sy, cx + 140 * k, sy + 8 * k); x.quadraticCurveTo(cx + 124 * k, sy, cx + 140 * k, sy - 22 * k); x.fill(); x.stroke(); }
  if (spec.cheeks !== false) { x.fillStyle = 'rgba(232,120,110,.18)'; for (const d of [-1, 1]) { x.beginPath(); x.ellipse(cx + d * 104 * k, ey + 44 * k, 24 * k, 14 * k, 0, 0, 7); x.fill(); } }
}

function clothTex(THREE, spec) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256; const x = c.getContext('2d');
  x.fillStyle = spec.cloth; x.fillRect(0, 0, 256, 256);
  if (spec.stripes) { x.fillStyle = spec.stripes; for (let y = 8; y < 256; y += 40) x.fillRect(0, y, 256, 18); }
  if (spec.pattern === 'weave') { for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(0,0,0,${0.03 + Math.random() * 0.04})`; x.fillRect(Math.random() * 256, Math.random() * 256, 3, 1); } }
  if (spec.buttons) { x.fillStyle = spec.buttons; for (let y = 60; y < 230; y += 50) { x.beginPath(); x.arc(128, y, 9, 0, 7); x.fill(); } }
  if (spec.belt) { x.fillStyle = spec.belt; x.fillRect(0, 196, 256, 22); }
  if (spec.collar) { x.fillStyle = spec.collar; x.beginPath(); x.moveTo(92, 0); x.lineTo(128, 52); x.lineTo(164, 0); x.fill(); }
  if (spec.lapels) { x.fillStyle = spec.lapels; x.beginPath(); x.moveTo(76, 0); x.lineTo(124, 120); x.lineTo(104, 0); x.fill(); x.beginPath(); x.moveTo(180, 0); x.lineTo(132, 120); x.lineTo(152, 0); x.fill(); }
  if (spec.tie) { x.fillStyle = spec.tie; x.beginPath(); x.moveTo(121, 30); x.lineTo(135, 30); x.lineTo(140, 120); x.lineTo(128, 138); x.lineTo(116, 120); x.fill(); x.fillRect(120, 22, 16, 12); }
  if (spec.wrap) { x.strokeStyle = spec.wrap; x.lineWidth = 16; x.beginPath(); x.moveTo(90, 0); x.lineTo(150, 190); x.stroke(); } // kimono-style cross-over
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

export function makeBighead(THREE, spec = {}) {
  spec = { skin: '#f6e6d2', scalp: '#ecc0ab', cloth: '#5a6e8c', limb: '#f1dcc6', shoe: '#2c2422', trousers: null, hat: 'none', ...spec };
  const root = new THREE.Group(), hips = new THREE.Group(); root.add(hips);
  const R = 0.32, add = (m, x, y, z, p = hips) => { m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; p.add(m); return m; };
  const clothM = toon(THREE, '#ffffff', { map: clothTex(THREE, spec) });
  const legM = toon(THREE, spec.trousers || spec.cloth), shoeM = toon(THREE, spec.shoe), skinM = toon(THREE, spec.limb), armM = toon(THREE, spec.sleeve || spec.cloth);
  // body: a peg / bell lathe
  const prof = []; for (let i = 0; i <= 12; i++) { const v = i / 12; prof.push(new THREE.Vector2(0.115 + 0.065 * Math.sin(v * Math.PI * 0.85) + (1 - v) * 0.045, 0.2 + v * 0.46)); } prof.push(new THREE.Vector2(0.001, 0.66)); prof.unshift(new THREE.Vector2(0.001, 0.2));
  const body = add(new THREE.Mesh(new THREE.LatheGeometry(prof, 28), clothM), 0, 0, 0); body.rotation.y = Math.PI;   // texture seam at the back
  const legs = [-1, 1].map((s) => { const g = new THREE.Group(); g.position.set(s * 0.07, 0.24, 0); hips.add(g);
    add(new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.12, 4, 10), legM), 0, -0.1, 0, g); add(new THREE.Mesh(new THREE.SphereGeometry(0.07, 14, 10).scale(1, 0.6, 1.5), shoeM), 0, -0.21, 0.03, g); return g; });
  // head
  const head = new THREE.Group(); head.position.set(0, 0.66 + R * 0.86, 0); hips.add(head);
  const hg = new THREE.SphereGeometry(R, 48, 32), col = []; const cs = new THREE.Color(spec.skin), cp = new THREE.Color(spec.scalp);
  for (let i = 0; i < hg.attributes.position.count; i++) { const y = hg.attributes.position.getY(i) / R; const k = THREE.MathUtils.smoothstep(y, 0.35, 0.62); const c = cs.clone().lerp(cp, k * (spec.hair || spec.hat !== 'none' ? 0 : 1)); col.push(c.r, c.g, c.b); }
  hg.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  add(new THREE.Mesh(hg, toon(THREE, '#ffffff', { vertexColors: true })), 0, 0, 0, head);
  if (spec.hair) add(new THREE.Mesh(new THREE.SphereGeometry(R * 1.045, 40, 20, 0, Math.PI * 2, 0, Math.PI * 0.36), toon(THREE, spec.hair)), 0, 0, -0.03, head).rotation.x = -0.42;
  if (spec.ears !== false) for (const s of [-1, 1]) add(new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8).scale(0.5, 1, 0.8), toon(THREE, spec.skin)), s * R * 0.98, -0.02, 0, head);
  const FS = 512, fc = document.createElement('canvas'); fc.width = fc.height = FS; const fx = fc.getContext('2d');
  const ftex = new THREE.CanvasTexture(fc); ftex.colorSpace = THREE.SRGBColorSpace; ftex.anisotropy = 8;
  const decal = add(new THREE.Mesh(new THREE.SphereGeometry(R * 1.004, 40, 30, Math.PI / 2 - 1.05, 2.1, 0.02, Math.PI * 0.78),
    new THREE.MeshBasicMaterial({ map: ftex, transparent: true, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2 })), 0, 0, 0, head);
  decal.castShadow = false; decal.renderOrder = 2;
  // hats
  const hatM = toon(THREE, spec.hatC || '#7a2a2a');
  if (spec.hat === 'beanie') { add(new THREE.Mesh(new THREE.SphereGeometry(R * 1.05, 36, 18, 0, Math.PI * 2, 0, Math.PI * 0.45), hatM), 0, 0.02, 0, head); add(new THREE.Mesh(new THREE.TorusGeometry(R * 0.97, 0.035, 10, 40).rotateX(Math.PI / 2), hatM), 0, R * 0.32, 0, head); }
  if (spec.hat === 'police' || spec.hat === 'cap') { const top = add(new THREE.Mesh(new THREE.CylinderGeometry(R * 0.95, R * 0.86, 0.14, 32), hatM), 0, R * 0.78, -0.02, head); top.rotation.x = -0.12;
    add(new THREE.Mesh(new THREE.CylinderGeometry(R * 0.88, R * 0.88, 0.05, 32), toon(THREE, spec.bandC || '#1c1c22')), 0, R * 0.68, -0.01, head);
    add(new THREE.Mesh(new THREE.CylinderGeometry(R * 0.55, R * 0.55, 0.02, 24, 1, false, -Math.PI / 2, Math.PI).scale(1, 1, 0.9), toon(THREE, '#18181c')), 0, R * 0.62, 0.12, head).rotation.x = 0.35;
    if (spec.badge) add(new THREE.Mesh(new THREE.CircleGeometry(0.04, 16), toon(THREE, spec.badge, { emissive: spec.badge, emissiveIntensity: 0.2 })), 0, R * 0.8, R * 0.84, head).rotation.x = -0.15; }
  // period hats (Roosevelt Short, 27 Nov): bowler, straw boater, top hat, flat cap
  if (spec.hat === 'bowler') { add(new THREE.Mesh(new THREE.SphereGeometry(R * 0.86, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5), hatM), 0, R * 0.5, -0.01, head);
    add(new THREE.Mesh(new THREE.CylinderGeometry(R * 1.12, R * 1.12, 0.025, 36), hatM), 0, R * 0.5, -0.01, head);
    add(new THREE.Mesh(new THREE.CylinderGeometry(R * 0.87, R * 0.87, 0.04, 32), toon(THREE, spec.bandC || '#1a1416')), 0, R * 0.54, -0.01, head); }
  if (spec.hat === 'boater') { add(new THREE.Mesh(new THREE.CylinderGeometry(R * 0.8, R * 0.82, 0.16, 32), hatM), 0, R * 0.66, -0.01, head);
    add(new THREE.Mesh(new THREE.CylinderGeometry(R * 1.25, R * 1.25, 0.02, 36), hatM), 0, R * 0.58, -0.01, head);
    add(new THREE.Mesh(new THREE.CylinderGeometry(R * 0.825, R * 0.825, 0.06, 32), toon(THREE, spec.bandC || '#2a3a7a')), 0, R * 0.62, -0.01, head); }
  if (spec.hat === 'top') { add(new THREE.Mesh(new THREE.CylinderGeometry(R * 0.72, R * 0.7, 0.42, 32), hatM), 0, R * 0.62 + 0.21, -0.01, head);
    add(new THREE.Mesh(new THREE.CylinderGeometry(R * 1.1, R * 1.1, 0.025, 36), hatM), 0, R * 0.62, -0.01, head);
    add(new THREE.Mesh(new THREE.CylinderGeometry(R * 0.715, R * 0.715, 0.07, 32), toon(THREE, spec.bandC || '#3a1a22')), 0, R * 0.62 + 0.05, -0.01, head); }
  if (spec.hat === 'flatcap') { const c = add(new THREE.Mesh(new THREE.SphereGeometry(R * 1.04, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.32), hatM), 0, 0.02, -0.02, head); c.scale.set(1, 0.9, 1.08); c.rotation.x = 0.18;
    add(new THREE.Mesh(new THREE.CylinderGeometry(R * 0.6, R * 0.6, 0.02, 24, 1, false, -Math.PI / 2, Math.PI).scale(1, 1, 0.8), hatM), 0, R * 0.62, 0.14, head).rotation.x = 0.3; }
  // arms: upper + fore capsules re-aimed every frame, round hands with a Group for props
  const arms = {}; for (const s of ['l', 'r']) { const sg = s === 'l' ? -1 : 1, up = add(new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.04, 1, 10), armM), 0, 0, 0), lo = add(new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.036, 1, 10), armM), 0, 0, 0);
    const hand = add(new THREE.Mesh(new THREE.SphereGeometry(0.058, 14, 10), skinM), 0, 0, 0), grip = new THREE.Group(); hand.add(grip); const elb = add(new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), armM), 0, 0, 0);
    arms[s] = { up, lo, hand, grip, elb, sh: new THREE.Vector3(sg * 0.16, 0.6, 0.02) }; }
  const Y = new THREE.Vector3(0, 1, 0), tmp = new THREE.Vector3();
  function bone(m, a, b) { tmp.subVectors(b, a); const L = tmp.length(); m.position.copy(a).addScaledVector(tmp, 0.5); m.scale.set(1, Math.max(0.01, L), 1); m.quaternion.setFromUnitVectors(Y, tmp.normalize()); }
  function arm(s, elbow, hand) { const A = arms[s]; const e = new THREE.Vector3(...elbow), h = new THREE.Vector3(...hand); bone(A.up, A.sh, e); bone(A.lo, e, h); A.hand.position.copy(h); A.elb.position.copy(e); }
  if (spec.ink !== false) addInk(THREE, root, spec.ink || 0.006, new Set([decal]));
  let lastExpr = '', lastT = -1;
  const api = {
    root, head, hips, decal, arms, legs, spec,
    hand: (s) => arms[s].grip,
    face(expr, t = 0) { const key = expr + '|' + Math.floor(t * 15); if (key === lastExpr) return; lastExpr = key; drawFace(fx, FS, spec, expr, t); ftex.needsUpdate = true; },
    look(cam, max = 0.8) { root.updateMatrixWorld(true); const p = new THREE.Vector3(); head.getWorldPosition(p); const local = root.worldToLocal(cam.position.clone()); const ang = Math.atan2(local.x, local.z);
      head.rotation.y = THREE.MathUtils.clamp(ang, -max, max) * 0.9; head.rotation.x = THREE.MathUtils.clamp(-Math.atan2(local.y - head.position.y, Math.hypot(local.x, local.z)) * 0.35, -0.25, 0.25); },
    // poses: t is seconds; each sets arms, legs and a body bob. Positions are in the root's local space (+z = facing).
    pose(name, t = 0, o = {}) {
      const s = Math.sin(t * 2.4), bob = 0.008 * s; hips.position.set(0, bob, 0); hips.rotation.set(0, 0, 0); body.scale.set(1, 1, 1); head.position.y = 0.66 + R * 0.86;
      legs.forEach((l) => { l.rotation.x = 0; l.position.y = 0.24; });
      const rest = () => { arm('l', [-0.24, 0.44, 0.02], [-0.25, 0.29, 0.05]); arm('r', [0.24, 0.44, 0.02], [0.25, 0.29, 0.05]); };
      rest();
      if (name === 'walk' || name === 'run') { const f = name === 'run' ? 11 : 7, a = Math.sin(t * f) * (name === 'run' ? 0.7 : 0.45); legs[0].rotation.x = a; legs[1].rotation.x = -a; hips.position.y = Math.abs(Math.cos(t * f)) * 0.03;
        arm('l', [-0.24, 0.42, -a * 0.12], [-0.24, 0.27, -a * 0.28]); arm('r', [0.24, 0.42, a * 0.12], [0.24, 0.27, a * 0.28]); }
      if (name === 'point') arm('r', [0.3, 0.6, 0.12], [0.42, 0.66, 0.34]);
      if (name === 'wave') arm('r', [0.32, 0.66, 0.06], [0.36 + Math.sin(t * 9) * 0.06, 0.9, 0.08]);
      if (name === 'shrug') { arm('l', [-0.3, 0.5, 0.08], [-0.36, 0.62, 0.16]); arm('r', [0.3, 0.5, 0.08], [0.36, 0.62, 0.16]); }
      if (name === 'cuffed') { arm('l', [-0.2, 0.42, 0.12], [-0.04, 0.36, 0.22]); arm('r', [0.2, 0.42, 0.12], [0.04, 0.36, 0.22]); }
      if (name === 'hold') { arm('l', [-0.2, 0.44, 0.14], [-0.07, 0.44, 0.26]); arm('r', [0.2, 0.44, 0.14], [0.07, 0.44, 0.26]); }   // something held in both hands in front
      if (name === 'pour') { const k = o.k ?? 0.5; arm('l', [-0.2, 0.44, 0.14], [-0.06, 0.46, 0.27]); arm('r', [0.2, 0.46, 0.16], [0.06, 0.5 + k * 0.04, 0.3]); }
      if (name === 'offer') arm('r', [0.24, 0.48, 0.16], [0.2, 0.52, 0.36]);
      if (name === 'smoke') { arm('r', [0.24, 0.44, 0.16], [0.1, 0.72 + Math.sin(t * 1.2) * 0.04, 0.3]); }
      if (name === 'pick') { const j = Math.sin(t * 14) * 0.02; arm('l', [-0.2, 0.46, 0.16], [-0.05, 0.5, 0.3]); arm('r', [0.2, 0.46, 0.16], [0.06 + j, 0.52, 0.3]); }
      if (name === 'climb') { const a = Math.sin(t * 6); arm('l', [-0.3, 0.8, 0.06], [-0.3, 1.05 + a * 0.08, 0.1]); arm('r', [0.3, 0.8, 0.06], [0.3, 1.05 - a * 0.08, 0.1]); legs[0].rotation.x = 0.6 + a * 0.3; legs[1].rotation.x = 0.6 - a * 0.3; }
      if (name === 'reach') { arm('l', [-0.28, 0.78, 0.08], [-0.24, 1.05, 0.14]); arm('r', [0.28, 0.78, 0.08], [0.24, 1.05, 0.14]); }
      if (name === 'squeeze') { const k = o.k ?? 1; body.scale.set(1 - 0.35 * k, 1, 1 - 0.2 * k); arm('l', [-0.08, 0.7, 0.2], [-0.04, 0.82, 0.42]); arm('r', [0.08, 0.7, 0.2], [0.04, 0.82, 0.42]); }
      if (name === 'dig') { const a = Math.sin(t * 8); hips.rotation.x = 0.35; arm('l', [-0.18, 0.4, 0.24], [-0.08, 0.2 + a * 0.06, 0.4 + a * 0.05]); arm('r', [0.18, 0.4, 0.24], [0.08, 0.2 + a * 0.06, 0.42 + a * 0.05]); }
      if (name === 'kneel') { hips.position.y = -0.16; legs.forEach((l) => { l.rotation.x = -1.3; }); }
      if (name === 'sit') { hips.position.y = -0.12; legs.forEach((l) => { l.rotation.x = -1.45; }); }
      if (name === 'hands_hips') { arm('l', [-0.3, 0.46, -0.02], [-0.18, 0.34, 0.05]); arm('r', [0.3, 0.46, -0.02], [0.18, 0.34, 0.05]); }
      // Roosevelt Short (27 Nov): cough into a hand, clutch the chest, hold pages up high, orate, cheer, aim
      if (name === 'cough') { const j = Math.sin(t * 18) * 0.012; arm('r', [0.2, 0.5, 0.18], [0.04, 0.86 + j, 0.34]); hips.rotation.x = 0.08 + Math.max(0, Math.sin(t * 9)) * 0.05; }
      if (name === 'palm') arm('r', [0.22, 0.48, 0.18], [0.1, 0.66, 0.36]);
      if (name === 'clutch') { arm('r', [0.22, 0.44, 0.14], [0.06, 0.5, 0.2]); arm('l', [-0.3, 0.5, 0.06], [-0.4, 0.62, 0.1]); hips.rotation.x = -0.12; }
      if (name === 'hold_up') { arm('r', [0.28, 0.76, 0.1], [0.3, 1.04, 0.16]); arm('l', [-0.26, 0.5, 0.12], [-0.16, 0.56, 0.26]); }
      if (name === 'orate') { const a = Math.sin(t * 3.1); arm('r', [0.28, 0.56, 0.14], [0.3 + a * 0.04, 0.7 + Math.max(0, a) * 0.16, 0.3]); arm('l', [-0.24, 0.46, 0.12], [-0.14, 0.4, 0.26]); hips.rotation.x = 0.04 * a; }
      if (name === 'cheer') { const a = Math.sin(t * 7 + (o.ph || 0)); arm('l', [-0.3, 0.78, 0.04], [-0.34, 1.04 + a * 0.05, 0.1]); arm('r', [0.3, 0.78, 0.04], [0.34, 1.04 - a * 0.05, 0.1]); hips.position.y = Math.max(0, a) * 0.03; }
      if (name === 'clap') { const a = Math.abs(Math.sin(t * 8 + (o.ph || 0))); arm('l', [-0.2, 0.48, 0.16], [-0.02 - a * 0.07, 0.56, 0.3]); arm('r', [0.2, 0.48, 0.16], [0.02 + a * 0.07, 0.56, 0.3]); }
      if (name === 'aim') { arm('r', [0.2, 0.6, 0.2], [0.16, 0.64, 0.46]); arm('l', [-0.2, 0.46, 0.14], [-0.12, 0.42, 0.24]); }
      if (name === 'grab') { arm('l', [-0.2, 0.56, 0.2], [-0.12, 0.62, 0.42]); arm('r', [0.2, 0.56, 0.2], [0.12, 0.6, 0.42]); hips.rotation.x = 0.15; }
      if (name === 'thumb') arm('r', [0.28, 0.5, 0.12], [0.26, 0.64, 0.24]);
    },
  };
  api.face('neutral'); api.pose('idle');
  return api;
}
