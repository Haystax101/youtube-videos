
// =====================================================================================================
// SETS: Kwan's Manila flat, a US office at night (the PBX), an Italian call shop (street + inside),
// the world-map war room, the FBI room. Each set lives far apart; only the shot's set shows.
// =====================================================================================================
const APT = ROOT;
const OFFICE = new THREE.Group(); OFFICE.position.set(90, 0, 0); scene.add(OFFICE);
const SHOP = new THREE.Group(); SHOP.position.set(180, 0, 0); scene.add(SHOP);
const MAP = new THREE.Group(); MAP.position.set(270, 0, 0); scene.add(MAP);
const FBI = new THREE.Group(); FBI.position.set(360, 0, 0); scene.add(FBI);
const SETS = { apt: APT, office: OFFICE, shop: SHOP, map: MAP, fbi: FBI };
const SCR = {};
const windowsTex = (base, lit, seed) => canvasTex(512, 512, (x, w, h) => { const r = rng(seed); x.fillStyle = base; x.fillRect(0, 0, w, h);
  for (let j = 0; j < 12; j++) for (let i = 0; i < 10; i++) { x.fillStyle = r() < 0.55 ? lit : 'rgba(10,8,20,.75)'; x.fillRect(i * 51 + 10, j * 42 + 10, 32, 24); } x.fillStyle = 'rgba(0,0,0,.18)'; for (let i = 0; i < 10; i++) x.fillRect(i * 51 + 46, 0, 4, h); }, true);
// box wall with rectangular holes: segments along x (local), wall in the XY plane at z, thickness d
function holeWall(G, x0, x1, h, holes, pos, d, mat, ry = 0, px = 3) { const g = new THREE.Group(); g.position.copy(pos); g.rotation.y = ry; G.add(g); // holes: [hx0, hx1, hy0, hy1]
  const hs = [...holes].sort((a, b) => a[0] - b[0]); let cx = x0;
  for (const [a, b, y0, y1] of hs) { if (a > cx) mesh(rbox(a - cx, h, d, 0.01), mat, (cx + a) / 2, h / 2, 0, g, px); if (y0 > 0) mesh(rbox(b - a, y0, d, 0.01), mat, (a + b) / 2, y0 / 2, 0, g, px); mesh(rbox(b - a, h - y1, d, 0.01), mat, (a + b) / 2, (y1 + h) / 2, 0, g, px); cx = b; }
  if (x1 > cx) mesh(rbox(x1 - cx, h, d, 0.01), mat, (cx + x1) / 2, h / 2, 0, g, px); return g; }
// a desk phone: base, keypad, handset on the cradle, coiled cord. Returns handles.
function deskPhone(G, x, y, z, ry = 0, col = '#2a2c38', keyTex = null) { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; G.add(g);
  mesh(rbox(0.26, 0.07, 0.22, 0.02), col, 0, 0.035, 0, g, 2.5); const top = mesh(rbox(0.24, 0.03, 0.12, 0.01), col, 0, 0.075, 0.03, g, 2); top.rotation.x = 0.25;
  const kp = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.11), keyTex ? basic('#ffffff', { map: keyTex }) : toon('#c9ccd6')); kp.rotation.x = -Math.PI / 2 + 0.25; kp.position.set(0, 0.093, 0.035); kp.userData.noOutline = true; g.add(kp);
  if (!keyTex) for (let j = 0; j < 4; j++) for (let i = 0; i < 3; i++) mesh(rbox(0.035, 0.012, 0.018, 0.004), '#e8eef8', -0.05 + i * 0.05, 0.094 + (1.5 - j) * 0.006, 0.035 + (j - 1.5) * 0.024, g, 0);
  const hs = new THREE.Group(); hs.position.set(0, 0.1, -0.06); g.add(hs); mesh(rbox(0.3, 0.04, 0.06, 0.02), col, 0, 0, 0, hs, 2.5); for (const s of [-1, 1]) mesh(rbox(0.07, 0.05, 0.075, 0.02), col, s * 0.13, -0.01, 0, hs, 2);
  const pts = []; for (let i = 0; i <= 60; i++) { const k = i / 60, a = k * Math.PI * 2 * 9; pts.push(V(-0.14 - k * 0.1 + Math.cos(a) * 0.012, 0.08 - k * 0.07 + Math.sin(a) * 0.012, -0.06 + k * 0.12)); }
  mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 160, 0.004, 5), '#14121a', 0, 0, 0, g, 0);
  const led = mesh(sph(0.012, 8), basic('#3a1014'), 0.1, 0.075, 0.09, g, 0); return { g, hs, led }; }
function wallClock(G, x, y, z, ry, label) { const tc = textCanvas(256, 320, (c, w, h, hr, mn) => { c.clearRect(0, 0, w, h); c.fillStyle = '#f4efe4'; c.beginPath(); c.arc(128, 128, 118, 0, 7); c.fill(); c.lineWidth = 12; c.strokeStyle = '#14121a'; c.stroke();
    c.fillStyle = '#14121a'; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; c.fillRect(128 + Math.sin(a) * 96 - 4, 128 - Math.cos(a) * 96 - 4, 8, 8); }
    const ah = (hr % 12 + mn / 60) / 12 * Math.PI * 2, am = mn / 60 * Math.PI * 2; c.lineCap = 'round'; c.lineWidth = 12; c.beginPath(); c.moveTo(128, 128); c.lineTo(128 + Math.sin(ah) * 58, 128 - Math.cos(ah) * 58); c.stroke(); c.lineWidth = 7; c.beginPath(); c.moveTo(128, 128); c.lineTo(128 + Math.sin(am) * 88, 128 - Math.cos(am) * 88); c.stroke();
    c.fillStyle = '#d7263d'; c.beginPath(); c.arc(128, 128, 10, 0, 7); c.fill(); if (label) { c.fillStyle = '#14121a'; c.beginPath(); c.roundRect(8, 262, 240, 52, 12); c.fill(); c.fillStyle = '#ffffff'; c.font = '900 30px Poppins'; c.textAlign = 'center'; c.fillText(label, 128, 298); } });
  tc.update(3, 0); const p = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.625), basic('#ffffff', { map: tc.t, transparent: true })); p.position.set(x, y, z); p.rotation.y = ry; p.userData.noOutline = true; G.add(p); return tc; }
