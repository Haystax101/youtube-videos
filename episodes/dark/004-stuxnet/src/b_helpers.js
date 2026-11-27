const basic = (color, o = {}) => new THREE.MeshBasicMaterial({ color, ...o });
const glowTex = canvasTex(64, 64, (x, w) => { const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, w); });
function glow(G, x, y, z, color, s = 0.5, op = 0.8) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending })); sp.position.set(x, y, z); sp.scale.setScalar(s); sp.userData.noOutline = true; G.add(sp); return sp; }
function textCanvas(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const x = c.getContext('2d'); return { c, x, t, update(...a) { draw(x, w, h, ...a); t.needsUpdate = true; } }; }
function neonSign(G, text, color, x, y, z, ry = 0, hgt = 0.7, font = 900) {
  const len = text.length, cw = Math.max(256, 120 * len + 80), tc = textCanvas(cw, 200, (cx, w, h, on = 1) => { cx.clearRect(0, 0, w, h);
    cx.fillStyle = 'rgba(8,6,16,.88)'; cx.beginPath(); cx.roundRect(6, 6, w - 12, h - 12, 26); cx.fill(); cx.lineWidth = 10; cx.strokeStyle = on ? color : '#333'; cx.stroke();
    cx.font = `${font} 130px Poppins, sans-serif`; cx.textAlign = 'center'; cx.textBaseline = 'middle';
    if (on) { cx.shadowColor = color; cx.shadowBlur = 30; } cx.fillStyle = on ? '#ffffff' : '#3a3a44'; cx.fillText(text, w / 2, h / 2 + 8); cx.shadowBlur = 0; });
  tc.update(1); const m = new THREE.Mesh(new THREE.PlaneGeometry(hgt * cw / 200, hgt), basic('#ffffff', { map: tc.t, transparent: true })); m.position.set(x, y, z); m.rotation.y = ry; m.userData.noOutline = true; G.add(m);
  const g = glow(G, x + 0.05 * Math.sin(ry), y, z + 0.05 * Math.cos(ry), color, hgt * cw / 200 * 1.3, 0.35); let st = 1; return { m, tc, g, set(on) { on = on ? 1 : 0; if (on !== st) { tc.update(on); st = on; } g.visible = !!on; } };
}
function skyDome(G, draw, r = 95) { const t = canvasTex(1024, 1024, draw); const m = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 20), basic('#ffffff', { map: t, side: THREE.BackSide, fog: false })); m.userData.noOutline = true; m.userData.noHull = true; G.add(m); return m; }
function plane(G, w, h, mat, x, y, z, rx = 0, ry = 0) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.position.set(x, y, z); m.rotation.set(rx, ry, 0); m.receiveShadow = true; m.userData.noHull = true; G.add(m); return m; }
function screenMesh(G, name, cw, ch, sw, shh, x, y, z, ry = 0, frame = true) { const tc = textCanvas(cw, ch, () => {}); const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; G.add(g);
  if (frame) mesh(rbox(sw + 0.08, shh + 0.08, 0.06, 0.01), '#14121a', 0, 0, -0.035, g, 3);
  const p = new THREE.Mesh(new THREE.PlaneGeometry(sw, shh), basic('#ffffff', { map: tc.t })); p.position.z = 0.002; p.userData.noOutline = true; g.add(p); SCR[name] = tc; return g; }
const SCR = {};

// ---------- painted textures ----------
const roadTex = canvasTex(1024, 512, (x, w, h) => { const r = rng(8); x.fillStyle = '#34323c'; x.fillRect(0, 0, w, h); for (let i = 0; i < 5000; i++) { x.fillStyle = `rgba(${r() < 0.5 ? 0 : 255},${r() < 0.5 ? 0 : 255},255,${r() * 0.05})`; x.fillRect(r() * w, r() * h, 2, 2); }
  x.fillStyle = '#e8e2d0'; for (let u = 0; u < w; u += 160) x.fillRect(u + 20, h / 2 - 5, 90, 10); x.fillStyle = '#e8e2d0'; for (let k = 0; k < 9; k++) x.fillRect(440 + k * 22, 30, 12, h - 60); }, true);
const paveTex = canvasTex(512, 512, (x, w, h) => { const r = rng(11); x.fillStyle = '#7d7a84'; x.fillRect(0, 0, w, h); const s = 64; for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) { x.fillStyle = `hsl(250,6%,${44 + r() * 8}%)`; x.fillRect(i * s + 2, j * s + 2, s - 4, s - 4); } }, true);
const carpetTex = canvasTex(256, 256, (x, w, h) => { const r = rng(15); x.fillStyle = '#3a4256'; x.fillRect(0, 0, w, h); for (let i = 0; i < 2500; i++) { x.fillStyle = `rgba(255,255,255,${r() * 0.05})`; x.fillRect(r() * w, r() * h, 2, 2); } }, true);
const officeWallTex = canvasTex(512, 512, (x, w, h) => { x.fillStyle = '#d9d6cf'; x.fillRect(0, 0, w, h); x.fillStyle = '#c9c5bc'; x.fillRect(0, h * 0.66, w, h * 0.34); x.fillStyle = '#a9a49a'; x.fillRect(0, h * 0.64, w, 8); const r = rng(71); for (let i = 0; i < 1500; i++) { x.fillStyle = `rgba(0,0,0,${r() * 0.05})`; x.fillRect(r() * w, r() * h, 2, 2); } }, true);
const darkWallTex = canvasTex(512, 512, (x, w, h) => { const r = rng(5); x.fillStyle = '#2a2e48'; x.fillRect(0, 0, w, h); for (let i = 0; i < 1500; i++) { x.fillStyle = `rgba(0,0,0,${r() * 0.08})`; x.fillRect(r() * w, r() * h, 2, 2); } }, true);
const plankTex = canvasTex(512, 512, (x, w, h) => { const r = rng(6); for (let i = 0; i < 8; i++) { x.fillStyle = `hsl(28,${34 + r() * 10}%,${30 + r() * 8}%)`; x.fillRect(0, i * 64, w, 62); x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(0, i * 64 + 62, w, 2); x.fillRect(r() * w, i * 64, 2, 62); } }, true);
const concreteTex = canvasTex(512, 512, (x, w, h) => { const r = rng(19); x.fillStyle = '#5a5e68'; x.fillRect(0, 0, w, h); for (let i = 0; i < 3000; i++) { x.fillStyle = `rgba(${r() < 0.5 ? 0 : 255},${r() < 0.5 ? 0 : 255},${r() < 0.5 ? 0 : 255},${r() * 0.06})`; x.fillRect(r() * w, r() * h, 3, 3); }
  x.strokeStyle = 'rgba(0,0,0,.25)'; x.lineWidth = 3; for (let j = 0; j < 4; j++) { x.beginPath(); x.moveTo(0, j * 128); x.lineTo(w, j * 128); x.stroke(); } }, true);
const gridTex = canvasTex(512, 512, (x, w, h) => { x.fillStyle = '#0a0818'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(255,190,60,.55)'; x.lineWidth = 3; for (let i = 0; i <= 4; i++) { x.beginPath(); x.moveTo(i * 128, 0); x.lineTo(i * 128, h); x.stroke(); x.beginPath(); x.moveTo(0, i * 128); x.lineTo(w, i * 128); x.stroke(); }
  x.strokeStyle = 'rgba(80,220,255,.18)'; x.lineWidth = 1.5; for (let i = 0; i < 16; i++) { x.beginPath(); x.moveTo(i * 32, 0); x.lineTo(i * 32, h); x.stroke(); x.beginPath(); x.moveTo(0, i * 32); x.lineTo(w, i * 32); x.stroke(); } }, true);
const sandTex = canvasTex(512, 512, (x, w, h) => { const r = rng(23); x.fillStyle = '#e9d3a4'; x.fillRect(0, 0, w, h); for (let i = 0; i < 6000; i++) { x.fillStyle = r() < 0.5 ? 'rgba(160,120,70,.18)' : 'rgba(255,250,230,.35)'; x.fillRect(r() * w, r() * h, 2, 2); } }, true);
const stuccoTex = canvasTex(512, 512, (x, w, h) => { const r = rng(3); x.fillStyle = '#f4f1ea'; x.fillRect(0, 0, w, h); for (let i = 0; i < 1800; i++) { x.fillStyle = `rgba(120,110,100,${r() * 0.08})`; x.fillRect(r() * w, r() * h, 3, 3); } }, true);
const coinTex = canvasTex(128, 128, (x, w) => { x.fillStyle = '#ffcf3f'; x.beginPath(); x.arc(64, 64, 62, 0, 7); x.fill(); x.lineWidth = 8; x.strokeStyle = '#c9932a'; x.beginPath(); x.arc(64, 64, 50, 0, 7); x.stroke(); x.fillStyle = '#c9932a'; x.font = '900 70px Poppins'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('B', 66, 68); x.fillRect(52, 24, 6, 14); x.fillRect(66, 24, 6, 14); x.fillRect(52, 98, 6, 14); x.fillRect(66, 98, 6, 14); });
const coinMats = [toon('#c9932a'), toon('#ffffff', { map: coinTex }), toon('#ffffff', { map: coinTex })];
const coinGeo = cyl(0.11, 0.11, 0.025, 18);
function coin(G, s = 1) { const m = mesh(coinGeo, coinMats, 0, -9, 0, G, 2.5); m.scale.setScalar(s); return m; }
const windowTex = (seed, base = '#2a2840', lit = '#ffd27a', cols = 8, rows = 30) => canvasTex(256, 512, (x, w, h) => { const r = rng(seed); x.fillStyle = base; x.fillRect(0, 0, w, h); for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { x.fillStyle = r() < 0.42 ? (r() < 0.15 ? '#9fd8ff' : lit) : 'rgba(0,0,0,.35)'; x.fillRect(6 + i * (w - 12) / cols + 3, 6 + j * (h - 12) / rows + 3, (w - 12) / cols - 8, (h - 12) / rows - 7); } });
function shell(G, o) { const { x0, x1, z0, z1, h, wall, floor, ceil = '#1a1d2e', skip = [] } = o, out = {};
  const P = (w, hh, mat, rep) => { const mt = mat.clone(); if (mt.map) { mt.map = mat.map.clone(); mt.map.needsUpdate = true; mt.map.repeat.set(...rep); } const m = new THREE.Mesh(new THREE.PlaneGeometry(w, hh), mt); m.receiveShadow = true; m.userData.noHull = true; G.add(m); return m; };
  out.floor = P(x1 - x0, z1 - z0, floor, [(x1 - x0) / 2, (z1 - z0) / 2]); out.floor.rotation.x = -Math.PI / 2; out.floor.position.set((x0 + x1) / 2, 0, (z0 + z1) / 2);
  if (!skip.includes('back')) { out.back = P(x1 - x0, h, wall, [(x1 - x0) / 2, h / 2]); out.back.position.set((x0 + x1) / 2, h / 2, z0); }
  if (!skip.includes('right')) { out.right = P(z1 - z0, h, wall, [(z1 - z0) / 2, h / 2]); out.right.rotation.y = -Math.PI / 2; out.right.position.set(x1, h / 2, (z0 + z1) / 2); }
  if (!skip.includes('left')) { out.left = P(z1 - z0, h, wall, [(z1 - z0) / 2, h / 2]); out.left.rotation.y = Math.PI / 2; out.left.position.set(x0, h / 2, (z0 + z1) / 2); }
  if (!skip.includes('front')) { out.front = P(x1 - x0, h, wall, [(x1 - x0) / 2, h / 2]); out.front.rotation.y = Math.PI; out.front.position.set((x0 + x1) / 2, h / 2, z1); }
  out.ceil = P(x1 - x0, z1 - z0, toon(ceil), [1, 1]); out.ceil.rotation.x = Math.PI / 2; out.ceil.position.set((x0 + x1) / 2, h, (z0 + z1) / 2);
  return out; }
// a wall along x at z = zw with a door hole (xa..xb, 0..dh); returns nothing. faceSign: +1 faces +z
function wallWithHoleX(G, mat, x0, x1, zw, h, xa, xb, dh, ry = 0) { const pc = (a, b, ya, yb) => { const mt = mat.clone(); mt.map = mat.map.clone(); mt.map.needsUpdate = true; mt.map.repeat.set((b - a) / 2, (yb - ya) / 2); plane(G, b - a, yb - ya, mt, (a + b) / 2, (ya + yb) / 2, zw, 0, ry); };
  pc(x0, xa, 0, h); pc(xb, x1, 0, h); pc(xa, xb, dh, h); }
function wallWithHoleZ(G, mat, z0, z1, xw, h, za, zb, ya, yb, ry = Math.PI / 2) { const pc = (a, b, y0, y1) => { const mt = mat.clone(); mt.map = mat.map.clone(); mt.map.needsUpdate = true; mt.map.repeat.set((b - a) / 2, (y1 - y0) / 2); plane(G, b - a, y1 - y0, mt, xw, (y0 + y1) / 2, (a + b) / 2, 0, ry); };
  pc(z0, za, 0, h); pc(zb, z1, 0, h); pc(za, zb, 0, ya); pc(za, zb, yb, h); }
function desk(G, x, z, ry = 0, col = '#4a4f63', screenCol = '#5fd0ff') { const d = new THREE.Group(); d.position.set(x, 0, z); d.rotation.y = ry; G.add(d);
  mesh(rbox(1.6, 0.06, 0.75, 0.02), col, 0, 0.75, 0, d, 4.5); for (const s of [-1, 1]) mesh(rbox(0.06, 0.73, 0.66), '#2e3242', s * 0.76, 0.37, 0, d, 3.5);
  // monitor faces -z (toward the person sitting behind the desk), its back to the camera side
  mesh(rbox(0.42, 0.02, 0.3, 0.008), '#b9bcc8', 0, 0.79, -0.02, d, 3); const lid = new THREE.Group(); lid.position.set(0, 0.8, 0.13); lid.rotation.x = 0.28; d.add(lid); mesh(rbox(0.42, 0.28, 0.015, 0.008), '#b9bcc8', 0, 0.14, 0, lid, 3);
  const scr = mesh(new THREE.PlaneGeometry(0.38, 0.24), basic(screenCol), 0, 0.14, -0.009, lid, 0); scr.rotation.y = Math.PI; glow(d, 0, 0.95, -0.15, screenCol, 0.8, 0.25);
  mesh(cyl(0.045, 0.04, 0.1, 12), '#ffffff', 0.55, 0.83, -0.1, d, 2.5);
  for (let k = 0; k < 3; k++) mesh(rbox(0.22, 0.004, 0.3), '#f4efe4', -0.55, 0.785 + k * 0.006, 0.05, d, 0);
  return d; }
function chair(G, x, z, ry = 0, col = '#1d1a26') { const c = new THREE.Group(); c.position.set(x, 0, z); c.rotation.y = ry; G.add(c); mesh(cyl(0.28, 0.28, 0.05, 5), col, 0, 0.06, 0, c, 3); mesh(cyl(0.03, 0.03, 0.38, 6), '#3a3a44', 0, 0.27, 0, c, 2);
  mesh(rbox(0.5, 0.08, 0.48, 0.03), col, 0, 0.48, 0, c, 3); mesh(rbox(0.5, 0.42, 0.07, 0.03), col, 0, 0.74, -0.24, c, 3); return c; }

