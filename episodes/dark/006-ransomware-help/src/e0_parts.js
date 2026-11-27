// =====================================================================================================
// shared props for 006: monitors with live canvas screens, wall signs, palms, office furniture
// =====================================================================================================
// a flat monitor on a stand; the screen shows `tex` (or a material) and faces local +z
function monitor(G, x, y, z, ry = 0, w = 0.56, h = 0.34, scr = null, col = '#1d1f28') { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; G.add(g);
  mesh(rbox(0.22, 0.02, 0.16, 0.008), col, 0, 0.01, 0, g, 0); mesh(rbox(0.04, 0.16, 0.03, 0.01), col, 0, 0.09, -0.02, g, 0);
  mesh(rbox(w + 0.04, h + 0.04, 0.035, 0.01), col, 0, 0.17 + h / 2, -0.01, g, 0);
  const s = new THREE.Mesh(new THREE.PlaneGeometry(w, h), scr && scr.isMaterial ? scr : basic('#ffffff', { map: scr, toneMapped: false })); s.position.set(0, 0.17 + h / 2, 0.009); s.userData.noOutline = true; g.add(s); g.userData.scr = s; return g; }
// a laptop open toward local +z (screen faces +z, keyboard toward +z)
function laptop(G, x, y, z, ry = 0, scr = null, col = '#c9ccd6') { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; G.add(g);
  mesh(rbox(0.36, 0.018, 0.25, 0.008), col, 0, 0.009, 0.06, g, 0); plane(g, 0.3, 0.14, toon('#2a2c36'), 0, 0.0185, 0.06, -Math.PI / 2);
  const lid = new THREE.Group(); lid.position.set(0, 0.018, -0.065); lid.rotation.x = -0.22; g.add(lid); mesh(rbox(0.36, 0.24, 0.012, 0.008), col, 0, 0.12, 0, lid, 0);
  const s = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.2), scr && scr.isMaterial ? scr : basic('#ffffff', { map: scr, toneMapped: false })); s.position.set(0, 0.12, 0.007); s.userData.noOutline = true; lid.add(s); g.userData.scr = s; return g; }
// text on a canvas plane (signs, posters). draw(x, w, h) paints it.
function painted(G, w, h, cw, ch, draw, x, y, z, ry = 0, opts = {}) { const t = canvasTex(cw, ch, draw); const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), opts.basic ? basic('#ffffff', { map: t, transparent: !!opts.alpha, toneMapped: false }) : toon('#ffffff', { map: t, transparent: !!opts.alpha, alphaTest: opts.alpha ? 0.4 : 0 }));
  m.position.set(x, y, z); m.rotation.y = ry; m.userData.noOutline = true; m.receiveShadow = true; G.add(m); return m; }
// a hanging sign on two cables
function hangSign(G, text, col, x, y, z, w = 1.9) { const g = new THREE.Group(); g.position.set(x, y, z); G.add(g);
  mesh(rbox(w, 0.42, 0.06, 0.03), '#14121a', 0, 0, 0, g, 0);
  for (const sgn of [1, -1]) painted(g, w - 0.08, 0.36, 512, 96, (c, cw, chh) => { c.fillStyle = '#0d0c14'; c.fillRect(0, 0, cw, chh); c.strokeStyle = col; c.lineWidth = 8; c.strokeRect(6, 6, cw - 12, chh - 12); c.fillStyle = col; c.font = '900 62px Poppins'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, cw / 2, chh / 2 + 4); }, 0, 0, sgn * 0.032, sgn > 0 ? 0 : Math.PI, { basic: true });
  for (const sx of [-w * 0.4, w * 0.4]) mesh(cyl(0.006, 0.006, 1.0, 4), '#2a2a32', sx, 0.7, 0, g, 0);
  glow(g, 0, 0, 0.2, col, w * 1.1, 0.25); return g; }
// palm tree: a curved trunk of rings + painted frond cards
const frondTex = canvasTex(512, 160, (x, w, h) => { x.strokeStyle = '#3d6a24'; x.lineWidth = 6; x.beginPath(); x.moveTo(6, h / 2); x.quadraticCurveTo(w / 2, h / 2 - 14, w - 6, h / 2 + 10); x.stroke();
  for (let i = 0; i < 46; i++) { const u = i / 46, px = 10 + u * (w - 20), py = h / 2 - 10 * Math.sin(u * 3) + u * 10, L = 70 * Math.sin(Math.PI * Math.min(1, u * 1.15 + 0.08)) + 8;
    for (const s of [-1, 1]) { x.strokeStyle = i % 3 ? '#4f9a2e' : '#6dbb3c'; x.lineWidth = 7; x.beginPath(); x.moveTo(px, py); x.lineTo(px + 22, py + s * L); x.stroke(); } } });
const frondMat = new THREE.MeshStandardMaterial({ map: frondTex, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.8 });
function palm(G, x, z, hgt = 6, lean = 0.25, seed = 1) { const g = new THREE.Group(); g.position.set(x, 0, z); G.add(g); const r = rng(seed); const dir = r() * 6.28;
  const N = 14; let top = V(0, 0, 0);
  for (let i = 0; i < N; i++) { const u = i / N, bend = lean * u * u * hgt; const p = V(Math.cos(dir) * bend, u * hgt, Math.sin(dir) * bend); const m = mesh(cyl(0.16 - u * 0.05, 0.19 - u * 0.05, hgt / N * 1.05, 10), i % 2 ? '#8a6a48' : '#9c7a54', p.x, p.y + hgt / N / 2, p.z, g, 0); m.rotation.z = -Math.cos(dir) * lean * u * 1.2; m.rotation.x = Math.sin(dir) * lean * u * 1.2; top = p; }
  top.y = hgt; mesh(sph(0.22, 10), '#6a4a2a', top.x, top.y, top.z, g, 0);
  for (let k = 0; k < 9; k++) { const a = k / 9 * 6.28 + r(), f = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.8).translate(1.3, 0, 0), frondMat); f.position.copy(top); f.rotation.set(0, -a, -0.35 - r() * 0.35, 'YZX'); f.rotateX(Math.PI / 2 * (r() * 0.6 + 0.7)); f.userData.noOutline = true; g.add(f); }
  return g; }
// office bits
function waterCooler(G, x, z) { const g = new THREE.Group(); g.position.set(x, 0, z); G.add(g); mesh(rbox(0.36, 1.0, 0.36, 0.04), '#e8eaf0', 0, 0.5, 0, g, 0); mesh(cyl(0.15, 0.15, 0.42, 20), toon('#7fc4ff', { transparent: true, opacity: 0.75, roughness: 0.1 }), 0, 1.22, 0, g, 0); mesh(rbox(0.06, 0.05, 0.05), '#3a7fd0', -0.07, 0.8, 0.19, g, 0); mesh(rbox(0.06, 0.05, 0.05), '#d7263d', 0.07, 0.8, 0.19, g, 0); return g; }
function printer(G, x, y, z, ry = 0) { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; G.add(g); mesh(rbox(0.5, 0.28, 0.42, 0.03), '#e9ebf0', 0, 0.14, 0, g, 0); mesh(rbox(0.46, 0.04, 0.2, 0.01), '#3a3e4a', 0, 0.29, -0.08, g, 0); mesh(rbox(0.4, 0.02, 0.12, 0.005), '#d0d4dc', 0, 0.12, 0.25, g, 0); glow(g, 0.18, 0.2, 0.22, '#3ff07a', 0.06, 0.8); mesh(rbox(0.06, 0.02, 0.02), basic('#3ff07a'), 0.18, 0.2, 0.215, g, 0);
  const sheet = new THREE.Group(); sheet.position.set(0, 0.14, 0.2); g.add(sheet); mesh(rbox(0.21, 0.003, 0.29, 0.001), '#ffffff', 0, 0, 0, sheet, 0);
  painted(sheet, 0.2, 0.28, 160, 224, (c, w, h) => { c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h); c.fillStyle = '#14a39a'; c.fillRect(0, 0, w, 34); c.fillStyle = '#fff'; c.font = '900 22px Poppins'; c.fillText('INVOICE', 12, 25); c.fillStyle = '#c9ccd6'; for (let k = 0; k < 4; k++) c.fillRect(12, 56 + k * 22, 90, 8); c.fillStyle = '#d7263d'; c.font = '900 26px Poppins'; c.fillText('$16,010', 12, 190); }, 0, 0.002, 0, 0).rotation.x = -Math.PI / 2; g.userData.sheet = sheet; return g; }
function rack(G, x, z, ry = 0) { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; G.add(g); mesh(rbox(0.7, 2.1, 0.9, 0.02), '#1a1c24', 0, 1.05, 0, g, 0); const leds = [];
  for (let k = 0; k < 12; k++) { mesh(rbox(0.6, 0.12, 0.02, 0.005), '#2a2e3a', 0, 0.3 + k * 0.14, 0.455, g, 0); for (let j = 0; j < 4; j++) { const l = mesh(new THREE.BoxGeometry(0.02, 0.02, 0.01), basic('#3ff07a'), -0.24 + j * 0.03, 0.3 + k * 0.14, 0.465, g, 0); l.userData.ph = k * 4 + j; leds.push(l); } }
  g.userData.leds = leds; return g; }
function filingCab(G, x, z, ry = 0, col = '#8a909e') { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; G.add(g); mesh(rbox(0.48, 1.3, 0.6, 0.02), col, 0, 0.65, 0, g, 0); for (let k = 0; k < 4; k++) { mesh(rbox(0.44, 0.28, 0.02, 0.01), col, 0, 0.18 + k * 0.31, 0.305, g, 0); mesh(rbox(0.14, 0.025, 0.03, 0.008), '#d0d4dc', 0, 0.26 + k * 0.31, 0.32, g, 0); } return g; }
function wallClock(G, x, y, z, ry = 0) { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; G.add(g); mesh(cyl(0.22, 0.22, 0.05, 32).rotateX(Math.PI / 2), '#14121a', 0, 0, 0, g, 0);
  painted(g, 0.4, 0.4, 128, 128, (c, w) => { c.fillStyle = '#f4f1ea'; c.beginPath(); c.arc(64, 64, 63, 0, 7); c.fill(); c.fillStyle = '#14121a'; for (let k = 0; k < 12; k++) { const a = k / 12 * 6.28; c.fillRect(64 + Math.cos(a) * 52 - 3, 64 + Math.sin(a) * 52 - 3, 6, 6); } }, 0, 0, 0.03, 0, { alpha: true });
  const hm = mesh(rbox(0.02, 0.12, 0.01), '#14121a', 0, 0.05, 0.035, g, 0), mm = mesh(rbox(0.015, 0.17, 0.01), '#14121a', 0, 0.075, 0.04, g, 0); g.userData.hands = [hm, mm]; return g; }
function couch(G, x, z, ry = 0, col = '#e07a4a') { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; G.add(g); mesh(rbox(2.0, 0.42, 0.85, 0.08), col, 0, 0.3, 0, g, 0); mesh(rbox(2.0, 0.5, 0.22, 0.08), col, 0, 0.7, -0.32, g, 0); for (const s of [-1, 1]) mesh(rbox(0.22, 0.6, 0.85, 0.08), col, s * 0.98, 0.38, 0, g, 0); for (const s of [-0.5, 0.5]) mesh(rbox(0.9, 0.12, 0.62, 0.06), '#f0a070', s, 0.56, 0.05, g, 0); return g; }
// a city block seen through a window at night/day
function block(G, x, z, w, hgt, d, col, seed, lit = '#ffd27a', base = null) { const b = new THREE.Group(); b.position.set(x, 0, z); G.add(b); mesh(rbox(w, hgt, d, 0.1), col, 0, hgt / 2, 0, b, 0);
  const t = windowTex(seed, base || col, lit, Math.max(2, Math.round(w / 1.3)), Math.max(3, Math.round(hgt / 1.4))); const f = plane(b, w - 0.5, hgt - 0.8, basic('#ffffff', { map: t }), 0, hgt / 2, d / 2 + 0.03); f.userData.noOutline = true; return b; }
// chat screen painter: msgs = [{from:'me'|'them', text, t0}], header, colours
function chat(x, w, h, t, o) { x.fillStyle = o.bg; x.fillRect(0, 0, w, h); x.fillStyle = o.bar; x.fillRect(0, 0, w, 64); x.fillStyle = '#fff'; x.font = '800 30px Poppins'; x.textAlign = 'left'; x.fillText(o.title, 22, 43);
  if (o.dot) { x.fillStyle = o.dot; x.beginPath(); x.arc(w - 34, 32, 11, 0, 7); x.fill(); }
  let y = 92; const shown = o.msgs.filter(m => t >= m.t0);
  for (const m of shown.slice(-5)) { const me = m.from === 'me', k = clamp((t - m.t0) / 0.18); x.font = '700 26px Poppins'; const lines = m.text.split('\n'); const tw = Math.max(...lines.map(l => x.measureText(l).width)) + 36, th = lines.length * 34 + 22;
    const bx = me ? w - tw - 18 : 18; x.globalAlpha = k; x.fillStyle = me ? o.me : o.them; x.beginPath(); x.roundRect(bx, y, tw, th, 16); x.fill(); x.fillStyle = me ? o.meText || '#fff' : o.themText || '#14121a'; lines.forEach((l, i) => x.fillText(l, bx + 18, y + 38 + i * 34)); x.globalAlpha = 1; y += th + 14; }
  if (o.typing && t > o.typing[0] && t < o.typing[1]) { x.fillStyle = o.them; x.beginPath(); x.roundRect(18, y, 96, 46, 16); x.fill(); for (let k = 0; k < 3; k++) { x.fillStyle = `rgba(20,18,26,${0.3 + 0.5 * (Math.floor(t * 6 + k) % 3 === 0)})`; x.beginPath(); x.arc(44 + k * 22, y + 23, 7, 0, 7); x.fill(); } }
  x.fillStyle = 'rgba(255,255,255,.03)'; for (let yy = 0; yy < h; yy += 4) x.fillRect(0, yy, w, 1); }
