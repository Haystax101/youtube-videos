
// ---------- APT: Kwan's flat in Manila. Desk of phones in front of a big window (day skyline), crew desk on the left,
// front door in the right wall (z 1.0..2.0), calendar + two clocks on the back wall ----------
const tileTex = canvasTex(512, 512, (x, w, h) => { const r = rng(21); for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) { x.fillStyle = `hsl(35,${18 + r() * 8}%,${70 + r() * 8}%)`; x.fillRect(i * 64, j * 64, 64, 64); } x.strokeStyle = 'rgba(90,70,50,.35)'; x.lineWidth = 3; for (let i = 0; i <= 8; i++) { x.beginPath(); x.moveTo(i * 64, 0); x.lineTo(i * 64, h); x.stroke(); x.beginPath(); x.moveTo(0, i * 64); x.lineTo(w, i * 64); x.stroke(); } }, true);
const paintTex = canvasTex(512, 512, (x, w, h) => { const r = rng(22); x.fillStyle = '#9cc7b4'; x.fillRect(0, 0, w, h); for (let i = 0; i < 1400; i++) { x.fillStyle = `rgba(${r() < 0.5 ? '40,70,60' : '255,255,255'},${0.03 + r() * 0.05})`; x.fillRect(r() * w, r() * h, 3 + r() * 5, 3 + r() * 5); } x.fillStyle = 'rgba(60,90,80,.35)'; x.fillRect(0, h - 36, w, 36); }, true);
const skylineTex = canvasTex(2048, 1024, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#5fb4f0'); g.addColorStop(0.6, '#bfe3f5'); g.addColorStop(1, '#f2e6c8'); x.fillStyle = g; x.fillRect(0, 0, w, h);
  x.fillStyle = '#fff6d0'; x.beginPath(); x.arc(1600, 220, 70, 0, 7); x.fill(); for (const [cx, cy, s] of [[260, 200, 1], [880, 140, 1.25], [1380, 330, 0.8], [1850, 170, 0.9]]) { x.fillStyle = 'rgba(255,255,255,.92)'; x.beginPath(); x.ellipse(cx, cy, 150 * s, 34 * s, 0, 0, 7); x.fill(); for (const [dx, dy, r] of [[-80, -18, 46], [-20, -40, 62], [50, -26, 50], [105, -10, 34]]) { x.beginPath(); x.ellipse(cx + dx * s, cy + dy * s, r * s * 1.25, r * s * 0.85, 0, 0, 7); x.fill(); } x.fillStyle = 'rgba(150,190,225,.35)'; x.beginPath(); x.ellipse(cx + 10 * s, cy + 12 * s, 130 * s, 16 * s, 0, 0, 7); x.fill(); }
  const r = rng(23); for (let layer = 0; layer < 3; layer++) { let u = -20; while (u < w) { const bw = 70 + r() * 140, bh = (200 + r() * 420) * (1 - layer * 0.25); const col = [['#9ab8d0', '#b8a8c8', '#a8c8c0'], ['#e0a878', '#7aa0c0', '#d88a6a', '#88b0a0'], ['#c8644a', '#3a6a8a', '#e8b860', '#5a8a6a', '#b85a6a']][layer][Math.floor(r() * (3 + layer))]; x.fillStyle = col; x.fillRect(u, h - bh - layer * 10, bw, bh + 20);
      x.fillStyle = layer === 2 ? 'rgba(255,240,200,.35)' : 'rgba(255,255,255,.18)'; for (let j = 0; j < bh / 34 - 1; j++) for (let i = 0; i < bw / 26 - 1; i++) if (r() < 0.7) x.fillRect(u + 10 + i * 26, h - bh - layer * 10 + 14 + j * 34, 12, 18); u += bw + 6; } } });
{ const G = APT, U = G.userData, x0 = -4, x1 = 4, z0 = -4, z1 = 4, h = 3;
  const wallM = toon('#ffffff', { map: paintTex }); wallM.map.repeat.set(2, 1);
  shell(G, { x0, x1, z0, z1, h, wall: wallM, floor: toon('#ffffff', { map: tileTex }), ceil: '#e8e0cc', skip: ['back', 'right'] });
  holeWall(G, x0, x1, h, [[-1.5, 1.5, 0.9, 2.5]], V(0, 0, z0 - 0.06), 0.12, '#9cc7b4');
  holeWall(G, z0, z1, h, [[1.0, 2.0, 0, 2.15]], V(x1 + 0.06, 0, 0), 0.12, '#9cc7b4', -Math.PI / 2);
  // window frame, bars, view
  for (const [w2, h2, x, y] of [[3.1, 0.1, 0, 0.9], [3.1, 0.1, 0, 2.5], [0.1, 1.7, -1.5, 1.7], [0.1, 1.7, 1.5, 1.7], [0.06, 1.6, 0, 1.7]]) mesh(rbox(w2, h2, 0.2, 0.01), '#f4efe4', x, y, z0, G, 3);
  for (let i = 1; i < 8; i++) mesh(cyl(0.012, 0.012, 1.6, 6), '#3a3e48', -1.5 + i * 0.375, 1.7, z0 + 0.12, G, 0);
  mesh(rbox(3.2, 0.06, 0.32, 0.01), '#f4efe4', 0, 0.88, z0 + 0.1, G, 3);
  { const p = new THREE.Mesh(new THREE.PlaneGeometry(26, 13), basic('#ffffff', { map: skylineTex, fog: false })); p.position.set(0, 3.4, -16); p.userData.noOutline = true; G.add(p); }
  for (let i = 0; i < 6; i++) { const bx = -7 + i * 2.8 + (i > 2 ? 3 : -3), bh = 6 + (i * 37 % 7), wt = windowsTex(['#c9b8a0', '#a8b8c8', '#d8c8b0'][i % 3], 'rgba(60,70,90,.8)', 60 + i); const b = mesh(rbox(2.2, bh, 2.2, 0.03), toon('#ffffff', { map: wt }), bx * 1.6, bh / 2 - 4, -18 - (i % 2) * 3, G, 4); b.material.map.repeat.set(1, bh / 4); }
  { const sl = new THREE.PointLight('#fff6d8', 4, 7, 1.2); sl.position.set(0, 1.9, -3.3); G.add(sl); }
  G.add(new THREE.HemisphereLight('#fff4e0', '#5a6a60', 1.05));
  const sun = new THREE.DirectionalLight('#fff2d8', 1.25); sun.position.set(3, 7, -9); sun.target.position.set(0, 0, 0); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 30 }); sun.shadow.bias = -0.0004; G.add(sun, sun.target);
  const fill = new THREE.DirectionalLight('#d8e8ff', 0.4); fill.position.set(-2, 4, 6); G.add(fill);
  // fluorescent tube + ceiling fan
  mesh(rbox(1.3, 0.05, 0.14, 0.01), '#f4efe4', -2.4, h - 0.03, 0.8, G, 2.5); mesh(cyl(0.03, 0.03, 1.2, 8).rotateZ(Math.PI / 2), basic('#ffffff'), -2.4, h - 0.08, 0.8, G, 0);
  { const f = new THREE.Group(); f.position.set(0.3, h - 0.35, -0.6); G.add(f); U.fan = f; mesh(cyl(0.02, 0.02, 0.35, 6), '#5a5e68', 0, 0.18, 0, f, 1.5); mesh(cyl(0.1, 0.12, 0.1, 14), '#e8e2d6', 0, 0, 0, f, 2.5); for (let i = 0; i < 4; i++) { const a = new THREE.Group(); a.rotation.y = i * Math.PI / 2; f.add(a); mesh(rbox(0.75, 0.015, 0.14, 0.01), '#8a5a3a', 0.45, 0, 0, a, 2); } }
  // clocks + calendar
  SCR.clkMNL = wallClock(G, -2.85, 2.05, z0 + 0.01, 0, 'MANILA'); SCR.clkNY = wallClock(G, -2.2, 2.05, z0 + 0.01, 0, 'NEW YORK'); SCR.clkMNL.update(15, 0); SCR.clkNY.update(2, 0);
  { const tc = textCanvas(320, 400, (c, w, hh, mon, yr) => { c.fillStyle = '#fbfaf6'; c.fillRect(0, 0, w, hh); c.fillStyle = '#d7263d'; c.fillRect(0, 0, w, 120); c.fillStyle = '#fff'; c.font = '900 56px Poppins'; c.textAlign = 'center'; c.fillText(mon, w / 2, 80);
      c.fillStyle = '#14121a'; c.font = '900 80px Poppins'; c.fillText(yr, w / 2, 210); c.fillStyle = '#9a9aa2'; for (let j = 0; j < 4; j++) for (let i = 0; i < 7; i++) c.fillRect(22 + i * 40, 250 + j * 36, 26, 22); }); tc.update('MAY', '2005'); SCR.cal = tc;
    const p = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.62), basic('#ffffff', { map: tc.t })); p.position.set(2.4, 1.85, z0 + 0.01); p.userData.noOutline = true; G.add(p); mesh(cyl(0.015, 0.015, 0.02, 6).rotateX(Math.PI / 2), '#14121a', 2.4, 2.18, z0 + 0.01, G, 0); }
  // Kwan's desk: three phones (the hero one has a live keypad), notebooks, a list of numbers, lamp
  { const kt = textCanvas(400, 220, (c, w, hh, lit, digits) => { c.fillStyle = '#d9dce6'; c.fillRect(0, 0, w, hh); c.fillStyle = '#9fd8a8'; c.fillRect(250, 18, 136, 50); c.fillStyle = '#14121a'; c.font = '700 26px monospace'; c.textAlign = 'right'; c.fillText(String(digits).slice(-8), 380, 52);
      const L = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#']; c.textAlign = 'center'; L.forEach((k, i) => { const bx = 30 + (i % 3) * 70, by = 14 + Math.floor(i / 3) * 52; c.fillStyle = lit === k ? '#ffcf3f' : '#f8f9fc'; c.beginPath(); c.roundRect(bx, by, 60, 44, 8); c.fill(); c.lineWidth = 3; c.strokeStyle = '#3a3e48'; c.stroke(); c.fillStyle = '#14121a'; c.font = '900 30px Poppins'; c.fillText(k, bx + 30, by + 33); });
      c.fillStyle = '#d7263d'; c.beginPath(); c.roundRect(258, 90, 120, 50, 10); c.fill(); c.fillStyle = '#fff'; c.font = '900 22px Poppins'; c.fillText('LINE 1', 318, 123); c.fillStyle = '#2f6fe0'; c.beginPath(); c.roundRect(258, 154, 120, 50, 10); c.fill(); c.fillStyle = '#fff'; c.fillText('REDIAL', 318, 187); });
    kt.update('', ''); SCR.key = kt;
    const d = new THREE.Group(); d.position.set(0.2, 0, -1.75); G.add(d); U.desk = d;
    mesh(rbox(2.6, 0.07, 0.95, 0.02), '#a8784a', 0, 0.76, 0, d, 4.5); mesh(rbox(2.5, 0.68, 0.06), '#8a5a3a', 0, 0.38, 0.42, d, 3.5); for (const s of [-1, 1]) mesh(rbox(0.06, 0.73, 0.9), '#8a5a3a', s * 1.25, 0.37, 0, d, 3.5);
    U.hero = deskPhone(d, 0.35, 0.795, 0.12, 0, '#3a3e48', kt.t); U.ph2 = deskPhone(d, -0.6, 0.795, 0.05, 0.25, '#d7d2c6'); U.ph3 = deskPhone(d, 1.0, 0.795, -0.05, -0.3, '#8a2f3a');
    // the open notebook (live page) + a stack of finished ones
    const nt = textCanvas(512, 360, (c, w, hh, n) => { c.fillStyle = '#fbfaf6'; c.fillRect(0, 0, w, hh); c.fillStyle = '#e8e2d6'; c.fillRect(w / 2 - 4, 0, 8, hh); c.strokeStyle = 'rgba(80,120,200,.35)'; c.lineWidth = 2; for (let y = 50; y < hh; y += 34) { c.beginPath(); c.moveTo(10, y); c.lineTo(w - 10, y); c.stroke(); }
      c.strokeStyle = 'rgba(215,38,61,.5)'; c.beginPath(); c.moveTo(40, 0); c.lineTo(40, hh); c.moveTo(w / 2 + 34, 0); c.lineTo(w / 2 + 34, hh); c.stroke();
      const rows = [['973-555-0142', '0000'], ['212-555-0187', '1234'], ['201-555-0110', '0000'], ['415-555-0163', '9999'], ['312-555-0129', '1111'], ['617-555-0175', '0000'], ['908-555-0154', '1234'], ['646-555-0191', '0000'], ['732-555-0138', '4321'], ['856-555-0102', '0000']];
      c.font = 'italic 700 25px serif'; c.fillStyle = '#1d3a8a'; rows.slice(0, Math.floor(n)).forEach(([a, b], i) => { const col = i < 9 ? 0 : 1; const L = i % 9; const xx = (i < 5 ? 50 : w / 2 + 40), yy = 44 + ((i < 5 ? i : i - 5)) * 34 + 34; c.fillText(a, xx, yy); c.fillStyle = '#d7263d'; c.fillText(b, xx + 160, yy); c.fillStyle = '#1d3a8a'; }); });
    nt.update(4); SCR.note = nt; const np = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.365), toon('#ffffff', { map: nt.t })); np.rotation.x = -Math.PI / 2; np.position.set(-0.15, 0.802, 0.2); np.rotation.z = 0.08; np.userData.noOutline = true; d.add(np); U.notePage = np;
    mesh(cyl(0.006, 0.006, 0.16, 6).rotateZ(Math.PI / 2 - 0.3), '#2f6fe0', 0.16, 0.81, 0.3, d, 0);
    U.books = []; for (let i = 0; i < 7; i++) { const b = mesh(rbox(0.24, 0.03, 0.32, 0.006), ['#d7263d', '#2f6fe0', '#ffcf3f', '#3f9a72', '#8b5cf6', '#e2572b', '#1d3a8a'][i], -1.0 + (i % 2) * 0.02, 0.81 + i * 0.032, 0.15, d, 2); b.rotation.y = (i % 3 - 1) * 0.1; U.books.push(b); }
    mesh(cyl(0.08, 0.1, 0.03, 12), '#14121a', 0.95, 0.8, -0.32, d, 2); mesh(cyl(0.012, 0.012, 0.4, 6), '#14121a', 0.95, 0.98, -0.32, d, 1); mesh(cyl(0.05, 0.12, 0.12, 14, 1, true), '#2f8a3a', 0.95, 1.2, -0.25, d, 2.5);
    mesh(cyl(0.04, 0.035, 0.11, 10), '#f4efe4', 0.62, 0.85, -0.25, d, 1.5); mesh(rbox(0.21, 0.004, 0.29), '#fbfaf6', 0.65, 0.8, 0.28, d, 0).rotation.y = -0.2;
    const chair = new THREE.Group(); chair.position.set(0.2, 0, -2.5); G.add(chair); mesh(rbox(0.5, 0.06, 0.5), '#2a2c38', 0, 0.48, 0, chair, 3); mesh(rbox(0.5, 0.6, 0.06), '#2a2c38', 0, 0.82, -0.25, chair, 3); mesh(cyl(0.03, 0.03, 0.45, 6), '#5a5e68', 0, 0.24, 0, chair, 2); }
  // the crew desk (left) with two more phones and a notebook stack
  { const d = new THREE.Group(); d.position.set(-2.55, 0, -0.9); d.rotation.y = 0.5; G.add(d); U.crewDesk = d;
    mesh(rbox(1.8, 0.07, 0.8, 0.02), '#c9a46a', 0, 0.74, 0, d, 4); for (const s of [-1, 1]) mesh(rbox(0.06, 0.71, 0.72), '#8a6a3a', s * 0.85, 0.36, 0, d, 3);
    U.cp1 = deskPhone(d, -0.4, 0.775, 0.1, 0.2, '#f4efe4'); U.cp2 = deskPhone(d, 0.45, 0.775, 0.1, -0.2, '#2a2c38');
    U.books2 = []; for (let i = 0; i < 5; i++) { const b = mesh(rbox(0.24, 0.03, 0.32, 0.006), ['#3f9a72', '#ffcf3f', '#d7263d', '#2f6fe0', '#e2572b'][i], 0.0, 0.79 + i * 0.032, -0.15, d, 2); b.rotation.y = (i % 3 - 1) * 0.12; U.books2.push(b); }
    mesh(rbox(0.36, 0.25, 0.04, 0.01), '#3a3e48', 0.05, 0.92, -0.3, d, 2); }
  // shelf of notebooks on the left wall, a sofa, a plant, a cork board
  { mesh(rbox(0.35, 1.6, 1.6, 0.02), '#8a5a3a', x0 + 0.2, 0.8, 1.6, G, 4); U.shelf = []; for (let j = 0; j < 3; j++) for (let i = 0; i < 9; i++) { const b = mesh(rbox(0.22, 0.32, 0.04, 0.005), ['#d7263d', '#2f6fe0', '#ffcf3f', '#3f9a72', '#8b5cf6'][(i + j) % 5], x0 + 0.22, 0.35 + j * 0.5, 0.95 + i * 0.15, G, 1.5); U.shelf.push(b); } }
  { const s = new THREE.Group(); s.position.set(-2.2, 0, 3.2); G.add(s); mesh(rbox(2.0, 0.42, 0.85, 0.08), '#c25a3a', 0, 0.3, 0, s, 4); mesh(rbox(2.0, 0.55, 0.22, 0.08), '#a84a2e', 0, 0.62, 0.35, s, 4); for (const e of [-1, 1]) mesh(rbox(0.2, 0.55, 0.85, 0.08), '#a84a2e', e * 0.95, 0.42, 0, s, 3.5); }
  mesh(cyl(0.2, 0.16, 0.4, 14), '#c96a3a', 3.4, 0.2, -3.4, G, 3); for (let i = 0; i < 6; i++) { const l = mesh(new THREE.ConeGeometry(0.12, 0.9, 5), i % 2 ? '#2f7a3a' : '#3f8a44', 3.4 + Math.sin(i) * 0.1, 0.8, -3.4 + Math.cos(i) * 0.1, G, 2.5); l.rotation.set(Math.cos(i * 1.7) * 0.4, 0, Math.sin(i * 1.7) * 0.4); }
  { const cb = mesh(rbox(1.3, 0.9, 0.04, 0.01), '#b8814a', x0 + 0.03, 1.7, -2.2, G, 3); cb.rotation.y = Math.PI / 2; for (let i = 0; i < 6; i++) { const p = mesh(new THREE.PlaneGeometry(0.22, 0.16), basic(['#fbfaf6', '#ffcf3f', '#fbfaf6', '#9fd8ff'][i % 4]), x0 + 0.06, 1.5 + (i % 2) * 0.35, -2.65 + Math.floor(i / 2) * 0.42, G, 0); p.rotation.y = Math.PI / 2; p.rotation.z = (i % 3 - 1) * 0.1; } }
  // front door (hinge at z 1.0 on the right wall, opens inward)
  { const dr = new THREE.Group(); dr.position.set(x1 - 0.02, 0, 1.0); G.add(dr); U.door = dr; mesh(rbox(0.06, 2.12, 1.0, 0.02), '#7a4e30', 0, 1.06, 0.5, dr, 4); mesh(sph(0.04, 10), '#d9a43a', -0.06, 1.0, 0.88, dr, 1.5);
    for (const [y, hh] of [[0.55, 0.7], [1.55, 0.7]]) mesh(rbox(0.02, hh, 0.7, 0.01), '#6a4228', -0.035, y, 0.5, dr, 1.5); }
  { const out = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), basic('#3a3e48')); out.position.set(x1 + 1.2, 1.5, 1.5); out.rotation.y = -Math.PI / 2; out.userData.noOutline = true; G.add(out); }
}
const ACARD = { kwan: makeCard(APT, 'kwan', 1.62), crewA: makeCard(APT, 'crewA', 1.55), crewB: makeCard(APT, 'crewB', 1.62), crewC: makeCard(APT, 'cowork2', 1.6), p1: makeCard(APT, 'pnp', 1.78), p2: makeCard(APT, 'pnp2', 1.72), p3: makeCard(APT, 'pnp', 1.74), fbi: makeCard(APT, 'agentM', 1.8), buyer: makeCard(APT, 'shopOwner', 1.7) };
