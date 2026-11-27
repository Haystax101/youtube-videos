// ================= THE MOON: Deimos, a small lumpy moon (radius 30 here) with its top at the origin =================
const RM = 30, MOONC = V(0, -RM, 0);
const gy = (x, z) => Math.sqrt(Math.max(0, RM * RM - x * x - z * z)) - RM;   // surface height near the top
const surf = (x, z) => V(x, gy(x, z), z);
const T_REG = tex((x, w, h) => { x.fillStyle = '#c9a27e'; x.fillRect(0, 0, w, h); const r = rng(21);
  for (let i = 0; i < 1400; i++) { x.fillStyle = `rgba(${r() < 0.5 ? '150,110,80' : '240,214,182'},${0.08 + r() * 0.12})`; x.beginPath(); x.ellipse(r() * w, r() * h, 2 + r() * 10, 2 + r() * 7, r() * 3, 0, 7); x.fill(); }
  for (let i = 0; i < 26; i++) { const cx = r() * w, cy = r() * h, rr = 6 + r() * 26; x.fillStyle = 'rgba(120,84,60,.35)'; x.beginPath(); x.arc(cx, cy, rr, 0, 7); x.fill(); x.strokeStyle = 'rgba(250,226,196,.55)'; x.lineWidth = 2 + rr * 0.12; x.beginPath(); x.arc(cx - 1, cy - 1, rr, Math.PI * 0.9, Math.PI * 1.9); x.stroke(); } }, 512, 512, 10, 5);
const T_MARS = tex((x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#f2e2d2'); g.addColorStop(0.08, '#e8884a'); g.addColorStop(0.5, '#d2602e'); g.addColorStop(0.92, '#c45a30'); g.addColorStop(1, '#f2e8de'); x.fillStyle = g; x.fillRect(0, 0, w, h);
  const r = rng(8); for (let i = 0; i < 90; i++) { x.fillStyle = `rgba(${r() < 0.5 ? '120,50,30' : '250,170,110'},${0.12 + r() * 0.18})`; x.beginPath(); x.ellipse(r() * w, h * 0.15 + r() * h * 0.7, 20 + r() * 90, 8 + r() * 30, r() * 0.4, 0, 7); x.fill(); }
  x.strokeStyle = 'rgba(110,40,24,.6)'; x.lineWidth = 9; x.beginPath(); x.moveTo(w * 0.3, h * 0.52); x.bezierCurveTo(w * 0.4, h * 0.5, w * 0.48, h * 0.56, w * 0.58, h * 0.53); x.stroke(); }, 1024, 512);
const M = { reg: std('#ffffff', { map: T_REG, roughness: 0.95 }), rock: std('#a98468', { roughness: 0.95, flatShading: true }), rockL: std('#d6b08c', { roughness: 0.95, flatShading: true }),
  white: std('#f6f6f2', { roughness: 0.5 }), orange: std('#ff7a2a', { roughness: 0.5 }), gold: std('#f0b83a', { roughness: 0.25, metalness: 0.75 }), steel: std('#c8d0da', { roughness: 0.3, metalness: 0.6 }),
  dark: std('#26282e', { roughness: 0.5 }), blue: std('#2a6ad8', { roughness: 0.4 }), red: std('#e8382a', { roughness: 0.35, metalness: 0.2 }), tyre: std('#22222a', { roughness: 0.9 }), lamp: new THREE.MeshBasicMaterial({ color: '#ffe8a8' }) };
const MOON = add(new THREE.Mesh(new THREE.SphereGeometry(RM, 128, 96), M.reg), MOONC.x, MOONC.y, MOONC.z); MOON.castShadow = false; MOON.name = 'moon';
{ // gentle lumps: displace the sphere a little, then rims of craters and boulders near the top
  const pa = MOON.geometry.attributes.position, v = V(0, 0, 0), r = rng(4);
  const bumps = [...Array(40)].map(() => [V(r() - 0.5, r() - 0.5, r() - 0.5).normalize(), 0.15 + r() * 0.35, 0.8 + r() * 1.6]);
  for (let i = 0; i < pa.count; i++) { v.fromBufferAttribute(pa, i); const n = v.clone().normalize(); let k = 0; for (const [d, w, a] of bumps) k += a * Math.exp(-(1 - n.dot(d)) / (w * w * 0.2));
    if (n.y > 0.93) k *= Math.max(0, (1 - n.y) / 0.07) ** 2; v.copy(n).multiplyScalar(RM + k); pa.setXYZ(i, v.x, v.y, v.z); } MOON.geometry.computeVertexNormals(); }
const SURF = new THREE.Group(); scene.add(SURF);
{ const r = rng(12);
  for (const [cx, cz, cr] of [[-6, -5, 1.8], [5, -9, 2.6], [-9, 3, 1.3], [8, 4, 1.6], [-3, -12, 3.2], [2, 7, 1.0]]) { const p = surf(cx, cz); const rim = add(new THREE.Mesh(new THREE.TorusGeometry(cr, cr * 0.16, 10, 36), M.rockL), p.x, p.y + 0.02, p.z, SURF); rim.rotation.x = Math.PI / 2; rim.scale.set(1, 1, 0.5); rim.lookAt(p.clone().sub(MOONC).add(p)); rim.userData.noCheck = true;
    const floor = add(new THREE.Mesh(new THREE.CircleGeometry(cr * 0.95, 28), std('#a07c5c', { roughness: 1 })), p.x, p.y + 0.01, p.z, SURF); floor.lookAt(p.clone().sub(MOONC).add(p)); floor.userData.noCheck = true; floor.castShadow = false; }
  for (let i = 0; i < 70; i++) { const a = r() * Math.PI * 2, d = 2.2 + r() * 14; const x = Math.cos(a) * d, z = Math.sin(a) * d; if (Math.hypot(x - 3, z + 2) < 2.8 || Math.hypot(x + 4, z - 2) < 2.4 || Math.abs(x) < 1.2 && z > -1 && z < 8) continue;
    const s = 0.08 + r() ** 3 * 0.7; const b = add(new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), r() < 0.5 ? M.rock : M.rockL), x, gy(x, z) + s * 0.4, z, SURF); b.rotation.set(r() * 3, r() * 3, r() * 3); b.scale.set(1, 0.7, 1.1); } }
// Mars, huge in the sky, the Sun, the stars
const MARS = add(new THREE.Mesh(new THREE.SphereGeometry(150, 96, 64), new THREE.MeshStandardMaterial({ map: T_MARS, roughness: 1, emissive: '#5a1e10', emissiveIntensity: 0.25 })), -110, 40, -430); MARS.castShadow = false; MARS.receiveShadow = false; MARS.rotation.set(0.25, 0.6, 0.2);
const ATM = add(new THREE.Mesh(new THREE.SphereGeometry(156, 64, 48), new THREE.MeshBasicMaterial({ color: '#ff9a6a', transparent: true, opacity: 0.16, side: THREE.BackSide, depthWrite: false })), -110, 40, -430); ATM.castShadow = false; ATM.userData.noCheck = true;
{ const g = new THREE.BufferGeometry(), N = 1600, pos = new Float32Array(N * 3), r = rng(3); for (let i = 0; i < N; i++) { const v = V(r() - 0.5, r() - 0.5, r() - 0.5).normalize().multiplyScalar(700); pos.set([v.x, v.y, v.z], i * 3); }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); const st = new THREE.Points(g, new THREE.PointsMaterial({ color: '#ffffff', size: 2.2, sizeAttenuation: false, fog: false })); st.frustumCulled = false; scene.add(st); }
const SUN = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex((x, w, h) => { const g = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); g.addColorStop(0, 'rgba(255,255,240,1)'); g.addColorStop(0.15, 'rgba(255,240,200,.9)'); g.addColorStop(1, 'rgba(255,200,120,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); }, 128, 128), fog: false, depthWrite: false }));
SUN.position.set(400, 300, 260); SUN.scale.setScalar(90); scene.add(SUN);
// the lander: white drum with gold foil, orange bands, legs with pads, a ladder, an antenna dish and a flag
const LANDP = surf(3, -2), LANDER = new THREE.Group(); LANDER.position.copy(LANDP); scene.add(LANDER);
{ cyl(0.95, 1.05, 1.1, M.white, 0, 1.55, 0, LANDER, 8); cyl(1.08, 1.08, 0.12, M.orange, 0, 1.0, 0, LANDER, 8); cyl(0.98, 0.98, 0.1, M.orange, 0, 2.06, 0, LANDER, 8);
  box(1.5, 0.7, 1.5, std('#f0c050', { roughness: 0.3, metalness: 0.6 }), 0, 0.72, 0, LANDER, 0.06); cyl(0.5, 0.75, 0.5, M.dark, 0, 0.28, 0, LANDER, 16);
  cyl(0.55, 0.9, 0.5, M.white, 0, 2.35, 0, LANDER, 8); cyl(0.12, 0.12, 0.5, M.steel, 0.3, 2.8, 0, LANDER, 8);
  const dish = add(new THREE.Mesh(new THREE.SphereGeometry(0.45, 20, 10, 0, Math.PI * 2, 0, 1.0), std('#f6f6f2', { side: THREE.DoubleSide, roughness: 0.4 })), 0.3, 3.15, 0, LANDER); dish.rotation.set(-0.6, 0, 0.4);
  for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4, lx = Math.cos(a), lz = Math.sin(a); const leg = cyl(0.05, 0.05, 1.5, M.steel, lx * 1.15, 0.6, lz * 1.15, LANDER, 8); leg.rotation.set(lz * 0.5, 0, -lx * 0.5);
    cyl(0.25, 0.28, 0.06, M.steel, lx * 1.5, 0.03, lz * 1.5, LANDER, 16); }
  for (const s of [-1, 1]) cyl(0.025, 0.025, 1.3, M.steel, s * 0.22, 0.65, 1.1, LANDER, 6); for (let k = 0; k < 5; k++) { const rg = cyl(0.02, 0.02, 0.44, M.steel, 0, 0.15 + k * 0.25, 1.1, LANDER, 6); rg.rotation.z = Math.PI / 2; }
  for (const [x, z, c] of [[0.6, 0.8, '#3a8ae8'], [-0.6, 0.8, '#e8382a']]) box(0.3, 0.3, 0.04, std(c, { emissive: c, emissiveIntensity: 0.4 }), x, 1.55, z + 0.18, LANDER, 0.02);
  const pole = cyl(0.025, 0.025, 2.0, M.steel, -1.9, 1.0, 1.0, LANDER, 8); const flag = plane(0.9, 0.55, std('#ffffff', { side: THREE.DoubleSide, map: tex((x, w, h) => { x.fillStyle = '#2a6ad8'; x.fillRect(0, 0, w, h); x.fillStyle = '#ffd23a'; x.beginPath(); x.arc(w * 0.5, h * 0.5, h * 0.3, 0, 7); x.fill(); x.fillStyle = '#ff7a2a'; x.fillRect(0, h * 0.82, w, h * 0.18); }, 128, 80) }), -1.45, 1.75, 1.0, LANDER); flag.userData.noCheck = true; }
// the pan balance (for "a slice of bread")
const BAL = new THREE.Group(), BALP = surf(-4.5, 2.5); BAL.position.copy(BALP); scene.add(BAL);
{ cyl(0.35, 0.45, 0.12, M.steel, 0, 0.06, 0, BAL, 20); cyl(0.06, 0.06, 1.6, M.gold, 0, 0.8, 0, BAL, 12); add(new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 12), M.gold), 0, 1.62, 0, BAL);
  const beam = new THREE.Group(); beam.position.y = 1.6; BAL.add(beam); box(3.2, 0.08, 0.1, M.gold, 0, 0, 0, beam, 0.03);
  const pans = [-1.5, 1.5].map((x) => { const g = new THREE.Group(); g.position.set(x, 0, 0); beam.add(g); for (let k = 0; k < 3; k++) { const a = k * Math.PI * 2 / 3, c = cyl(0.008, 0.008, 0.95, M.steel, Math.cos(a) * 0.3, -0.5, Math.sin(a) * 0.3, g, 4); c.rotation.set(Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3); }
    cyl(0.62, 0.55, 0.08, M.steel, 0, -1.0, 0, g, 28); return g; });
  BAL.userData = { beam, pans }; }
const BREAD = new THREE.Group(); { const crust = std('#c27a32', { roughness: 0.8 }), crumb = std('#f6e2b0', { roughness: 0.95 }); const shp = new THREE.Shape(); shp.moveTo(-0.22, -0.25); shp.lineTo(0.22, -0.25); shp.lineTo(0.22, 0.1); shp.absarc(0.12, 0.12, 0.12, 0, Math.PI / 2); shp.lineTo(-0.12, 0.24); shp.absarc(-0.12, 0.12, 0.12, Math.PI / 2, Math.PI); shp.lineTo(-0.22, -0.25);
  const g = new THREE.ExtrudeGeometry(shp, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.012, bevelSegments: 2 }); const m = add(new THREE.Mesh(g, [crumb, crust]), 0, 0, 0, BREAD); m.position.z = -0.03; }
// the bike: red frame, black tyres with orange rims, white saddle, spoked wheels, turning cranks
const BIKE = new THREE.Group(); scene.add(BIKE);
const WR = 0.24, WZ = 0.42;
{ const tube = (a, b, r = 0.022, m = M.red) => { const d = b.clone().sub(a), c = cyl(r, r, d.length(), m, 0, 0, 0, BIKE, 10); c.position.copy(a).add(b).multiplyScalar(0.5); c.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); return c; };
  const RA = V(0, WR, -WZ), FA = V(0, WR, WZ), BB = V(0, 0.2, 0), ST = V(0, 0.6, -0.12), HT = V(0, 0.6, 0.3), HB = V(0, 0.42, 0.36);
  tube(RA, BB); tube(BB, ST); tube(ST, HT); tube(BB, V(0, 0.44, 0.33)); tube(RA, ST, 0.018); tube(HT, FA, 0.02, M.steel); tube(ST, V(0, 0.68, -0.14), 0.016, M.steel); tube(HT, V(0, 0.72, 0.32), 0.018, M.steel);
  box(0.12, 0.04, 0.22, M.white, 0, 0.7, -0.15, BIKE, 0.02); const bar = cyl(0.016, 0.016, 0.38, M.steel, 0, 0.72, 0.34, BIKE, 8); bar.rotation.z = Math.PI / 2; for (const s of [-1, 1]) { const gr = cyl(0.024, 0.024, 0.08, M.dark, s * 0.17, 0.72, 0.34, BIKE, 8); gr.rotation.z = Math.PI / 2; }
  BIKE.userData.wheels = [RA, FA].map((p) => { const w = new THREE.Group(); w.position.copy(p); BIKE.add(w); const t = add(new THREE.Mesh(new THREE.TorusGeometry(WR - 0.03, 0.035, 10, 32), M.tyre), 0, 0, 0, w); t.rotation.y = Math.PI / 2;
    const rim = add(new THREE.Mesh(new THREE.TorusGeometry(WR - 0.06, 0.012, 6, 32), M.orange), 0, 0, 0, w); rim.rotation.y = Math.PI / 2; cyl(0.03, 0.03, 0.07, M.steel, 0, 0, 0, w, 10).rotation.z = Math.PI / 2;
    for (let k = 0; k < 8; k++) { const sp = cyl(0.004, 0.004, (WR - 0.06) * 2, M.steel, 0, 0, 0, w, 4); sp.rotation.x = k * Math.PI / 8; } return w; });
  const crank = new THREE.Group(); crank.position.copy(BB); BIKE.add(crank); add(new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.012, 6, 20), M.steel), 0.04, 0, 0, crank).rotation.y = Math.PI / 2;
  for (const s of [-1, 1]) { const arm = box(0.02, 0.15, 0.025, M.steel, s * 0.07, s * 0.065, 0, crank, 0.005); box(0.08, 0.02, 0.05, M.dark, s * 0.11, s * 0.13, 0, crank, 0.008); }
  BIKE.userData.crank = crank; BIKE.traverse(o => { if (o.isMesh) o.userData.bike = true; }); }
// dust puffs and a trail of dots for orbits
const puffTex = tex((x, w, h) => { const g = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); g.addColorStop(0, 'rgba(240,214,182,.85)'); g.addColorStop(1, 'rgba(240,214,182,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); }, 64, 64);
const puffs = []; for (let i = 0; i < 24; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex, transparent: true, depthWrite: false, opacity: 0 })); scene.add(s); puffs.push(s); }
const TRAIL = new THREE.Group(); scene.add(TRAIL); for (let i = 0; i < 70; i++) { const d = add(new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffd23a' })), 0, 0, 0, TRAIL); d.castShadow = false; d.userData.noCheck = true; } TRAIL.visible = false;
const RING = add(new THREE.Mesh(new THREE.TorusGeometry(1, 0.0025, 6, 160), new THREE.MeshBasicMaterial({ color: '#ffd23a', transparent: true, opacity: 0.8 })), 0, 0, 0); RING.castShadow = false; RING.visible = false;

// ---------- characters ----------
const YOU = makeBighead(THREE, { cloth: '#f4f4f0', belt: '#ff7a2a', buttons: '#2a6ad8', collar: '#ff7a2a', sleeve: '#f4f4f0', trousers: '#ecece6', shoe: '#5a5e68', limb: '#f4f4f0', hair: '#6a4630', brows: 'thick', skin: '#f6e6d4' });
{ const glass = add(new THREE.Mesh(new THREE.SphereGeometry(0.385, 36, 24), new THREE.MeshStandardMaterial({ color: '#cfe8ff', transparent: true, opacity: 0.16, roughness: 0.05, metalness: 0.1, depthWrite: false })), 0, 0.02, 0, YOU.head); glass.castShadow = false; glass.userData.noCheck = true; glass.renderOrder = 3;
  const hl = add(new THREE.Mesh(new THREE.SphereGeometry(0.386, 20, 12, 0.3, 0.6, 0.5, 0.5), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.35, depthWrite: false })), 0, 0.02, 0, YOU.head); hl.castShadow = false; hl.userData.noCheck = true; hl.renderOrder = 4;
  const ring = add(new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.045, 10, 32), M.orange), 0, -0.3, 0, YOU.head); ring.rotation.x = Math.PI / 2;
  box(0.3, 0.36, 0.16, M.white, 0, 0.5, -0.2, YOU.hips, 0.05); box(0.22, 0.08, 0.02, M.blue, 0, 0.58, -0.285, YOU.hips, 0.01); cyl(0.04, 0.04, 0.3, M.orange, 0.1, 0.5, -0.29, YOU.hips, 8); }
const CAST = [YOU]; CAST.forEach(c => scene.add(c.root));
const NAMES = ['you'];
CAST.forEach(c => c.head.traverse(o => { if (o.material && o.material.color && !o.material.transparent) o.material.color.multiplyScalar(0.93); }));

// ---------- shots ----------
const at = (b, x, y, z) => b.clone().add(V(x, y, z));
const D2R = Math.PI / 180, RIGHT = Math.PI / 2;
function frame(tg, width, yaw, elev = 8, fov = 38) { const hf = 2 * Math.atan(Math.tan(fov * D2R / 2) * W / H), d = width / 2 / Math.tan(hf / 2);
  const dir = V(Math.sin(yaw * D2R) * Math.cos(elev * D2R), Math.sin(elev * D2R), Math.cos(yaw * D2R) * Math.cos(elev * D2R)); return { p: tg.clone().addScaledVector(dir, d), l: tg.clone(), fov }; }
const mix = (A, B, k, dof) => ({ p: A.p.clone().lerp(B.p, k), l: A.l.clone().lerp(B.l, k), fov: lerp(A.fov, B.fov, k), dof });
const move = (A, B, dof = 0) => (u) => mix(A, B, ease(0, 1, u), dof);
function place(c, p, ry = 0, pose = 'idle', expr = 'neutral', t = 0, o) { c.root.visible = true; c.root.position.copy(p); c.root.rotation.set(0, ry, 0); c.pose(pose, t, o); c.face(expr, t); }
const S = [];
const shot = (t, env, camf, act, o = {}) => S.push({ t, env, camf, act, ...o });
// the bike on the moon: position along a great circle (angle a around the moon's x axis, heading -z then down the far side), height h above the ground
const RIDE_Y = 0.58;
function bikeAt(a, h = 0, side = 0) { const r = RM + h; const p = V(side, MOONC.y + Math.cos(a) * r, -Math.sin(a) * r); BIKE.position.copy(p); BIKE.rotation.set(-a, Math.PI, 0); BIKE.visible = true; return p; }
function ride(t, expr, rate = 6, hop = 0) { BIKE.updateMatrixWorld(true); const seat = BIKE.localToWorld(V(0, RIDE_Y + hop, -0.12)); YOU.root.visible = true; YOU.root.position.copy(seat); YOU.root.quaternion.copy(BIKE.quaternion); YOU.pose('ride', t, { rate }); YOU.face(expr, t);
  BIKE.userData.crank.rotation.x = -t * rate; BIKE.userData.wheels.forEach(w => w.rotation.x = -t * rate * 1.6); }
function bikeFree(p, q, t, expr, rate = 6) { BIKE.position.copy(p); BIKE.quaternion.copy(q); BIKE.visible = true; ride(t, expr, rate); }
function dust(src, t, n = 8, spread = 0.5, size = 0.3, op = 0.6, from = 0, dir = V(0, 0, 1)) { for (let i = 0; i < n; i++) { const p = puffs[from + i], u = ((t * 1.3 + i / n) % 1); p.visible = true; p.position.copy(src).addScaledVector(dir, u * spread * 2).add(V(Math.sin(i * 7.1) * spread * u, u * 0.35, Math.cos(i * 3.3) * spread * 0.3 * u)); p.scale.setScalar(size * (0.4 + u * 1.4)); p.material.opacity = op * (1 - u); } }
const LADDER = at(LANDP, 0, 0, 1.55), STAND = surf(0.6, 1.2), SPOT = surf(0, 3), TOP = surf(0, 0);
const qUp = new THREE.Quaternion();
// ---- HOOK (cold open): you, on a bike, flying off a tiny moon, Mars behind
const FLYQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.5, Math.PI - 0.5, 0.15));
shot(WT(0, 'Twenty'), 'space', move(frame(V(1.0, 6.4, -3.5), 2.3, -20, 14, 44), frame(V(1.3, 7.2, -4.2), 2.0, -10, 10, 44), 0.5),
  (u, t) => { bikeFree(V(1.0 + u * 0.3, 5.9 + u * 0.8, -3.5 - u * 0.7), FLYQ, t, 'grin', 9); }, { trail: (u) => [V(-2, 1, 3), V(1.0 + u * 0.3, 5.9 + u * 0.8, -3.5 - u * 0.7)] });
shot(WT(0, 'Ride'), 'space', (u) => { const a = 0.05 + u * 0.05; const p = V(0, MOONC.y + Math.cos(a) * RM, -Math.sin(a) * RM); const A = frame(at(p, 0, 0.8, 0), 2.2, 120 - u * 20, 6, 50); A.dof = 0.4; return A; },
  (u, t) => { bikeAt(0.05 + u * 0.05, 0.0); ride(t, 'grin', 11); dust(BIKE.localToWorld(V(0, 0.05, -0.5)), t, 10, 0.6, 0.35, 0.7, 0, V(0, 0.2, 1)); });
shot(WT(0, 'Mars'), 'space', move(frame(V(-20, 10, -120), 260, 10, 6, 40), frame(V(-20, 10, -120), 240, 4, 6, 40), 0), (u, t) => { bikeAt(0.3 + u * 0.05, 0.5); ride(t, 'grin', 10); }, { ring: 0 });
shot(WT(0, 'fly'), 'space', move(frame(V(0.5, 3, -6), 11, -40, 22, 50), frame(V(0.8, 5, -6.6), 11, -30, 18, 50), 0.15),
  (u, t) => { bikeFree(V(0.4 + u * 0.6, 1.2 + u * 5.6, -4 - u * 2.4), FLYQ, t, 'grin', 9); YOU.pose('ride', t, { rate: 9 }); }, { trail: (u) => [V(0, 0.2, 2), V(0.4 + u * 0.6, 1.2 + u * 5.6, -4 - u * 2.4)] });
// ---- SECOND 1: landing, weighing a slice of bread
shot(WT(1, 'On'), 'space', move(frame(at(LANDP, -0.6, 1.4, 0.8), 6.5, 30, 10, 50), frame(at(LANDP, -0.6, 1.3, 0.8), 5.5, 20, 8, 50), 0.15),
  (u, t) => { const k = ease(0, 0.6, u); const p = at(LANDER.position, 0, 0.9 - k * 0.9 + (k < 1 ? 0 : 0), 1.75 + k * 0.6); p.y = Math.max(p.y, gy(p.x, p.z)); place(YOU, p, 0.3, k < 1 ? 'climb' : 'wave', 'happy', t); });
shot(WT(1, 'weak'), 'space', move(frame(at(STAND, 0, 1.0, 0), 2.6, 20, 6, 46), frame(at(STAND, 0, 1.2, 0), 2.4, 12, 6, 46), 0.4),
  (u, t) => { const hop = Math.abs(Math.sin(u * Math.PI)) * 0.45; place(YOU, at(STAND, 0, hop, 0), 0.4, hop > 0.05 ? 'float' : 'idle', 'surprised', t); if (hop < 0.1) dust(at(STAND, 0, 0.05, 0), t, 6, 0.4, 0.25, 0.4); });
shot(WT(1, 'whole'), 'space', move(frame(at(BALP, 0, 1.0, 0), 4.6, 10, 8, 46), frame(at(BALP, 0, 1.0, 0), 4.0, 4, 8, 46), 0.2),
  (u, t) => { const k = ease(0.0, 0.5, u); balance(k, t, 'focus'); }, { bread: 1 });
shot(WT(1, 'slice'), 'space', move(frame(at(BALP, 1.5, 0.75, 0), 1.6, -16, 12, 40), frame(at(BALP, 1.5, 0.75, 0), 1.3, -8, 12, 40), 0.6), (u, t) => { balance(1, t, 'grin'); }, { bread: 1 });
shot(WT(1, 'bread'), 'space', move(frame(at(BALP, -1.5, 1.2, 0), 1.6, 20, 8, 40), frame(at(BALP, -1.5, 1.2, 0), 1.35, 12, 8, 40), 0.7), (u, t) => { balance(1, t, 'grin'); }, { bread: 1 });
function balance(k, t, expr) { const tilt = (1 - k) * -0.32; BAL.userData.beam.rotation.z = tilt; BAL.userData.pans.forEach(p => p.rotation.z = -tilt); BAL.updateMatrixWorld(true);
  const lp = BAL.userData.pans[0].localToWorld(V(0, -0.96, 0)), rp = BAL.userData.pans[1].localToWorld(V(0, -0.96, 0)); place(YOU, lp, 0.25, k < 1 ? 'idle' : 'shrug', expr, t);
  BREAD.visible = k > 0.02; BREAD.position.copy(rp).add(V(0, 0.25 + (1 - Math.min(1, k * 1.5)) * 0.8, 0)); BREAD.rotation.set(0, -0.3, 0); }
// ---- MINUTE 1: jump, two kilometres up, an hour in the air
shot(WT(2, 'Jump'), 'space', move(frame(at(SPOT, 0, 0.8, 0), 2.6, 30, 4, 46), frame(at(SPOT, 0, 1.4, 0), 3.0, 30, 0, 46), 0.3),
  (u, t) => { const k = ease(0.25, 1, u); const p = at(SPOT, 0, k * k * 2.0, 0); place(YOU, p, 0.4, u < 0.25 ? 'crouch' : 'reach', u < 0.25 ? 'focus' : 'grin', t); if (u > 0.2) dust(at(SPOT, 0, 0.05, 0), t, 10, 0.7, 0.4, 0.7 * (1 - u)); });
shot(WT(2, 'two'), 'space', (u) => { const y = 14 + u * 6; const A = frame(V(0, y, 2.6), 26, 34, -30, 56); A.dof = 0.05; return A; },
  (u, t) => { place(YOU, V(0, 14 + u * 6, 3), 0.4, 'float', 'grin', t); }, { pin: 1 });
shot(WT(2, 'land'), 'space', move(frame(V(0, 22.4, 3), 2.2, 20, -12, 44), frame(V(0, 22.6, 3), 1.9, 12, -12, 44), 0.5),
  (u, t) => { place(YOU, V(0, 21.8 + u * 0.15, 3), 0.3, 'float', 'sleepy', t); YOU.root.rotation.z = Math.sin(t * 0.6) * 0.15; });
// ---- HOUR 1: the tyres just spin
shot(WT(3, 'Try'), 'space', move(frame(at(TOP, 0, 0.7, 0), 2.4, 70, 6, 46), frame(at(TOP, 0, 0.7, 0), 2.1, 60, 6, 46), 0.4), (u, t) => { bikeAt(0); ride(t, 'focus', 2); });
shot(WT(3, 'spin'), 'space', move(frame(at(TOP, 0, 0.3, 0.45), 1.1, 100, 10, 40), frame(at(TOP, 0, 0.3, 0.45), 0.95, 92, 10, 40), 0.7),
  (u, t) => { bikeAt(0); ride(t, 'shock', 24); dust(BIKE.localToWorld(V(0, 0.03, -0.42)), t * 2, 12, 0.5, 0.25, 0.8, 0, V(0, 0.4, 1)); BIKE.userData.wheels[1].rotation.x = 0; });
shot(WT(3, 'light'), 'space', move(frame(at(TOP, 0, 0.9, 0), 2.0, 40, 8, 46), frame(at(TOP, 0, 0.9, 0), 1.7, 30, 8, 46), 0.5),
  (u, t) => { const hop = Math.abs(Math.sin(t * 3)) * 0.25; bikeAt(0, hop); ride(t, 'worried', 20); dust(BIKE.localToWorld(V(0, 0.03 - hop, -0.42)), t * 2, 10, 0.5, 0.25, 0.7, 0, V(0, 0.4, 1)); BIKE.userData.wheels[1].rotation.x = 0; });
// ---- HOUR 2: pedal gently, faster, the ground curves away: orbit
shot(WT(4, 'pedal'), 'space', (u) => { const a = 0.02 + u * 0.02; const p = V(0, MOONC.y + Math.cos(a) * RM, -Math.sin(a) * RM); const A = frame(at(p, 0, 0.8, 0), 2.3, 250 + u * 20, 6, 46); A.dof = 0.4; return A; },
  (u, t) => { bikeAt(0.02 + u * 0.02); ride(t, 'focus', 3); });
shot(WT(4, 'fourteen'), 'space', (u) => { const a = 0.6 + u * 0.12; const p = V(0, MOONC.y + Math.cos(a) * RM, -Math.sin(a) * RM); const n = p.clone().sub(MOONC).normalize(); const A = { p: p.clone().addScaledVector(n, 1.2).add(V(3.2, 0, 0)), l: p.clone().addScaledVector(n, 0.8), fov: 50, dof: 0.3 }; return A; },
  (u, t) => { bikeAt(0.6 + u * 0.12); ride(t, 'grin', 10); dust(BIKE.localToWorld(V(0, 0.05, -0.5)), t, 10, 0.7, 0.35, 0.6, 0, V(0, 0.2, 1)); });
shot(WT(4, 'ground'), 'space', move(frame(V(0, -6, -6), 50, 90, 10, 50), frame(V(0, -6, -6), 46, 96, 12, 50), 0.05),
  (u, t) => { const a = 1.0 + u * 0.35; bikeAt(a, 0.3 + u * 1.2); ride(t, 'surprised', 8); }, { trail: 'orbit', orbitFrom: 0.6 });
shot(WT(4, 'orbit'), 'space', (u) => { const ang = 1.6 + u * 0.5; return { p: V(Math.cos(ang) * 95, 25, Math.sin(ang) * 95).add(MOONC), l: MOONC.clone().add(V(0, 3, 0)), fov: 46, dof: 0 }; },
  (u, t) => { const a = 1.5 + u * 1.2; bikeAt(a, 1.8); ride(t, 'grin', 7); }, { trail: 'orbit', orbitFrom: 0.6, ringR: RM + 1.8 });
// ---- LIFTOFF: six more, leaving Deimos, a tiny moon of Mars
shot(WT(5, 'Six'), 'space', (u) => { const a = 3.0 + u * 0.1; const p = V(0, MOONC.y + Math.cos(a) * (RM + 1.8), -Math.sin(a) * (RM + 1.8)); const n = p.clone().sub(MOONC).normalize(); return { p: p.clone().addScaledVector(n, 1.0).add(V(-1.8, 0, 0)).addScaledVector(V(0, -Math.sin(a + 1.57), -Math.cos(a + 1.57)), 0), l: p.clone().addScaledVector(n, 0.75), fov: 50, dof: 0.5 }; },
  (u, t) => { bikeAt(3.0 + u * 0.1, 1.8); ride(t, 'angry', 14); });
shot(WT(5, 'leave'), 'space', move(frame(V(0, 20, -20), 60, -30, 10, 50), frame(V(0, 26, -26), 70, -24, 10, 50), 0.05),
  (u, t) => { const k = ease(0, 1, u); bikeFree(V(-4 - k * 6, 30 + k * 14, -34 - k * 14), new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.5, Math.PI - 0.6, 0)), t, 'grin', 10); YOU.root.scale.setScalar(1); }, { trail: (u) => [V(0, 30, -24), V(-4 - ease(0, 1, u) * 6, 30 + ease(0, 1, u) * 14, -34 - ease(0, 1, u) * 14)], bigBike: 3 });
shot(WT(5, 'tiny'), 'space', move(frame(V(-80, 20, -300), 520, 8, 4, 40), frame(V(-80, 20, -300), 470, 2, 4, 40), 0),
  (u, t) => { bikeFree(V(-20 - u * 4, 60, -110), FLYQ, t, 'grin', 8); }, { bigBike: 12, marsRing: 1 });
shot(WT(6, 'Follow'), 'space', move(frame(V(-22.6, 60.7, -110), 2.0, 40, 6, 42), frame(V(-23.0, 60.7, -110), 1.7, 30, 6, 42), 0.6),
  (u, t) => { bikeFree(V(-22.6 - u * 0.4, 60, -110), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0.6, 0.1)), t, 'grin', 5); YOU.pose('wave', t); YOU.hips.position.y = -0.12; YOU.legs.forEach(l => l.rotation.x = -1.1); });
