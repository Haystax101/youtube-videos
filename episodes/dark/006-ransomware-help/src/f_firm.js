// =====================================================================================================
// FIRM: the ransomware "recovery" firm in Florida, a bright afternoon. A glass wall onto palms, beach and sea,
// a slatted feature wall with the company sign, the "99%" poster, the CTO's standing desk with two monitors
// facing him (left: the victim's chat, right: the gang's chat), a printer for the invoice, a couch, a fan.
// CTO stands at (0, -2.05) facing +z; the window is behind him at z = -5.
// =====================================================================================================
SCR.client = textCanvas(640, 400, () => {}); SCR.gang = textCanvas(640, 400, () => {});
{ const G = FIRM, U = G.userData, x0 = -6, x1 = 6, z0 = -5, z1 = 5, h = 3.3;
  const floorT = canvasTex(512, 512, (x, w, hh) => { const r = rng(6); for (let i = 0; i < 8; i++) { x.fillStyle = `hsl(32,${30 + r() * 8}%,${62 + r() * 8}%)`; x.fillRect(0, i * 64, w, 62); x.fillStyle = 'rgba(90,60,30,.25)'; x.fillRect(0, i * 64 + 62, w, 2); x.fillRect(r() * w, i * 64, 2, 62); } }, true);
  const wallM = toon('#ffffff', { map: canvasTex(512, 512, (x, w, hh) => { x.fillStyle = '#f6f2ea'; x.fillRect(0, 0, w, hh); const r = rng(3); for (let i = 0; i < 1500; i++) { x.fillStyle = `rgba(120,110,100,${r() * 0.05})`; x.fillRect(r() * w, r() * hh, 2, 2); } }, true) });
  shell(G, { x0, x1, z0, z1, h, wall: wallM, floor: toon('#ffffff', { map: floorT, roughness: 0.5 }), ceil: '#fbf8f2', skip: ['back'] });
  windowWallX(G, wallM, x0, x1, z0, h, -5.4, 5.4, 0.35, 3.0);
  { const fr = toon('#f4f4f0', { roughness: 0.4 }); mesh(rbox(10.9, 0.08, 0.12), fr, 0, 0.33, z0, G, 0); mesh(rbox(10.9, 0.08, 0.12), fr, 0, 3.02, z0, G, 0); for (let k = 0; k <= 6; k++) mesh(rbox(0.06, 2.7, 0.12), fr, -5.4 + k * 1.8, 1.67, z0, G, 0); }
  // outside: sky, sea, beach, palms, pastel apartments
  { const O = new THREE.Group(); O.position.set(0, 0, z0); G.add(O);
    const sky = new THREE.Mesh(new THREE.SphereGeometry(110, 32, 16, Math.PI * 0.75, Math.PI * 1.5), basic('#ffffff', { map: canvasTex(1024, 512, (x, w, hh) => { const g = x.createLinearGradient(0, 0, 0, hh); g.addColorStop(0, '#2f7fe0'); g.addColorStop(0.42, '#7fc4ff'); g.addColorStop(0.5, '#d8f0ff'); g.addColorStop(1, '#d8f0ff'); x.fillStyle = g; x.fillRect(0, 0, w, hh); }), side: THREE.BackSide, fog: false }));
    sky.userData.noOutline = true; O.add(sky); clouds(O, 16, 70, 95, 12, 30, 5);
    const seaT = canvasTex(512, 512, (x, w, hh) => { const r = rng(2); x.fillStyle = '#1f9ec8'; x.fillRect(0, 0, w, hh); for (let i = 0; i < 900; i++) { x.fillStyle = r() < 0.5 ? 'rgba(255,255,255,.35)' : 'rgba(10,90,140,.35)'; x.fillRect(r() * w, r() * hh, 8 + r() * 26, 2); } }, true); seaT.repeat.set(30, 12);
    U.sea = plane(O, 300, 120, toon('#ffffff', { map: seaT, roughness: 0.25 }), 0, -0.3, -100, -Math.PI / 2);
    const sandT = sandTex.clone(); sandT.needsUpdate = true; sandT.repeat.set(20, 4); plane(O, 300, 40, toon('#ffffff', { map: sandT }), 0, -0.25, -24, -Math.PI / 2);
    plane(O, 300, 6, toon('#ffffff', { color: '#f4fbff' }), 0, -0.28, -42.5, -Math.PI / 2); // surf line
    plane(O, 300, 20, toon('#4f9a3a'), 0, -0.2, -6, -Math.PI / 2); // lawn below the office
    plane(O, 300, 3, toon('#c9ccd6'), 0, -0.19, -9, -Math.PI / 2); // promenade
    for (const [px, pz, hh, s] of [[-7, -6, 7.5, 1], [-2.5, -8, 6.5, 2], [3.5, -7, 8, 3], [8, -6.5, 7, 4], [-11, -10, 8.5, 5], [12, -10, 9, 6], [0, -16, 7, 7], [-6, -18, 8, 8], [7, -19, 7.5, 9]]) palm(O, px, pz, hh, 0.25, s);
    for (const [bx, bz, w, hh, col] of [[-26, -18, 12, 14, '#f6c8d8'], [-38, -26, 10, 22, '#fff0b8'], [24, -16, 12, 12, '#bfeee6'], [36, -28, 12, 24, '#ffd2b0']]) block(O, bx, bz, w, hh, 8, col, Math.round(bx), '#7fc4ff', col);
    for (const [ux, uz, col] of [[-4, -30, '#ff6a4a'], [2, -32, '#ffcf3f'], [6, -29, '#3fae5a']]) { mesh(cyl(0.03, 0.03, 2.4, 6), '#e8e2d6', ux, 0.9, uz, O, 0); mesh(new THREE.ConeGeometry(1.3, 0.6, 12), col, ux, 2.2, uz, O, 0); }
    O.add(new THREE.HemisphereLight('#dff2ff', '#f0d8a8', 1.0)); }
  const sun = new THREE.DirectionalLight('#fff0d0', 2.0); sun.position.set(-4, 9, -10); sun.target.position.set(0, 0, 1); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 1, far: 34 }); sun.shadow.bias = -0.0004; G.add(sun, sun.target);
  G.add(new THREE.HemisphereLight('#fff6ea', '#a08a70', 0.85)); for (const [lx, lz] of [[-2.5, 0.5], [2.5, 0.5], [0, 3]]) { const p = new THREE.PointLight('#fff4e6', 4, 8, 1.5); p.position.set(lx, h - 0.4, lz); G.add(p); }
  // the feature wall on the left: wooden slats + the sign
  for (let k = 0; k < 34; k++) mesh(rbox(0.05, h - 0.2, 0.1, 0.01), k % 2 ? '#b88a5a' : '#a87a4a', x0 + 0.06, h / 2, -4.6 + k * 0.28, G, 0);
  U.sign = painted(G, 2.7, 1.9, 768, 540, (c, w, hh) => { c.clearRect(0, 0, w, hh); c.fillStyle = '#ffffff'; c.beginPath(); c.roundRect(10, 10, w - 20, hh - 20, 40); c.fill(); c.lineWidth = 12; c.strokeStyle = '#14a39a'; c.stroke();
    c.fillStyle = '#14a39a'; c.beginPath(); c.arc(w / 2, 130, 86, 0, 7); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 18; c.beginPath(); c.arc(w / 2, 110, 32, Math.PI, 0); c.stroke(); c.fillStyle = '#fff'; c.fillRect(w / 2 - 44, 110, 88, 66);
    c.textAlign = 'center'; c.fillStyle = '#14121a'; c.font = '900 104px Poppins'; c.fillText('RANSOMWARE', w / 2, 328); c.fillStyle = '#14a39a'; c.font = '900 116px Poppins'; c.fillText('HELP', w / 2, 440); c.fillStyle = '#5a5e70'; c.font = '700 34px Poppins'; c.fillText('DATA RECOVERY SPECIALISTS', w / 2, 500); }, x0 + 0.13, 1.75, -0.6, Math.PI / 2, { alpha: true });
  // right wall: the 99% poster and framed certificates
  U.poster = painted(G, 1.4, 1.9, 384, 520, (c, w, hh) => { const g = c.createLinearGradient(0, 0, 0, hh); g.addColorStop(0, '#14a39a'); g.addColorStop(1, '#0e6f8a'); c.fillStyle = g; c.fillRect(0, 0, w, hh); c.fillStyle = '#fff'; c.textAlign = 'center'; c.font = '900 120px Poppins'; c.fillText('99%', w / 2, 200); c.font = '800 34px Poppins'; c.fillText('SUCCESS', w / 2, 260); c.fillText('RATE*', w / 2, 300);
    c.strokeStyle = '#ffcf3f'; c.lineWidth = 10; c.beginPath(); c.arc(w / 2, 400, 56, 0, 7); c.stroke(); c.beginPath(); c.moveTo(w / 2 - 26, 400); c.lineTo(w / 2 - 6, 422); c.lineTo(w / 2 + 30, 378); c.stroke(); c.font = '600 18px Poppins'; c.fillText('*as advertised', w / 2, 500); }, x1 - 0.05, 1.65, -2.4, -Math.PI / 2);
  mesh(rbox(0.03, 1.98, 1.48, 0.01), '#14121a', x1 - 0.015, 1.65, -2.4, G, 0);
  for (const [fz, fy] of [[-0.6, 1.9], [0.3, 1.9], [-0.15, 1.2]]) { mesh(rbox(0.04, 0.5, 0.66, 0.01), '#c9a46a', x1 - 0.02, fy, fz, G, 0); painted(G, 0.58, 0.42, 128, 96, (c, w, hh) => { c.fillStyle = '#fbf8ee'; c.fillRect(0, 0, w, hh); c.fillStyle = '#c9932a'; c.beginPath(); c.arc(w / 2, 62, 14, 0, 7); c.fill(); c.fillStyle = '#5a5e70'; c.fillRect(20, 18, 88, 6); c.fillRect(30, 32, 68, 4); }, x1 - 0.045, fy, fz, -Math.PI / 2); }
  // the CTO's standing desk (top y 1.05) with two monitors facing him (-z), keyboard, mug, phone, a stack of coins
  { const d = new THREE.Group(); d.position.set(0, 0, -1.5); G.add(d); U.desk = d;
    mesh(rbox(2.0, 0.06, 0.85, 0.02), '#f4f1ea', 0, 1.05, 0, d, 0); mesh(rbox(1.9, 0.62, 0.03, 0.01), '#14a39a', 0, 0.7, 0.36, d, 0); for (const s of [-1, 1]) { mesh(rbox(0.08, 1.0, 0.08, 0.02), '#3a3e4a', s * 0.85, 0.5, 0, d, 0); mesh(rbox(0.1, 0.04, 0.7, 0.02), '#3a3e4a', s * 0.85, 0.02, 0, d, 0); }
    U.monL = monitor(d, -0.62, 1.08, -0.05, Math.PI + 0.25, 0.56, 0.35, SCR.client.t, '#e8eaf0'); U.monR = monitor(d, 0.62, 1.08, -0.05, Math.PI - 0.25, 0.56, 0.35, SCR.gang.t, '#1d1f28');
    mesh(rbox(0.46, 0.02, 0.15, 0.006), '#e8eaf0', 0, 1.09, -0.32, d, 0); mesh(rbox(0.08, 0.025, 0.11, 0.012), '#e8eaf0', 0.36, 1.09, -0.32, d, 0);
    mesh(cyl(0.045, 0.04, 0.11, 14), '#14a39a', -0.78, 1.135, -0.2, d, 0); mesh(rbox(0.09, 0.012, 0.17, 0.01), '#14121a', 0.75, 1.087, -0.25, d, 0);
    U.coins = []; for (let k = 0; k < 6; k++) { const c = coin(d, 0.55); c.position.set(0.25 + (k % 2) * 0.02, 1.095 + k * 0.015, 0.2); U.coins.push(c); }
    glow(d, -0.62, 1.4, -0.3, '#9fd8ff', 1.0, 0.18); U.gangGlow = glow(d, 0.62, 1.4, -0.3, '#ff3b4a', 1.0, 0.22); }
  // printer on a cabinet by the window (the invoice comes out here)
  mesh(rbox(0.9, 0.85, 0.55, 0.03), '#e8eaf0', 3.6, 0.425, -3.9, G, 0); U.printer = printer(G, 3.6, 0.85, -3.9, 0);
  // a second desk on the right with a staffer, a couch area front-left, a ceiling fan, plants, a cooler
  { const d2 = new THREE.Group(); d2.position.set(3.4, 0, 0.6); d2.rotation.y = -0.5; G.add(d2); mesh(rbox(1.5, 0.05, 0.75, 0.02), '#f4f1ea', 0, 0.74, 0, d2, 0); for (const s of [-1, 1]) mesh(rbox(0.05, 0.72, 0.65, 0.01), '#d0d4dc', s * 0.7, 0.36, 0, d2, 0); monitor(d2, 0, 0.765, -0.15, 0, 0.56, 0.34, DESK_MAT, '#e8eaf0'); U.chair2 = chair(G, 3.15, 1.35, Math.PI - 0.5, '#14a39a'); }
  couch(G, -3.6, 3.4, Math.PI / 2 + 0.2); mesh(rbox(0.9, 0.36, 0.6, 0.06), '#f4f1ea', -2.4, 0.2, 3.3, G, 0); mesh(cyl(0.12, 0.1, 0.16, 12), '#14a39a', -2.3, 0.46, 3.3, G, 0);
  { const f = new THREE.Group(); f.position.set(0, h - 0.4, 1.6); G.add(f); mesh(cyl(0.03, 0.03, 0.4, 8), '#f4f4f0', 0, 0.2, 0, f, 0); mesh(cyl(0.16, 0.16, 0.14, 16), '#f4f4f0', 0, 0, 0, f, 0); const bl = new THREE.Group(); f.add(bl); for (let k = 0; k < 4; k++) { const b = mesh(rbox(0.75, 0.015, 0.16, 0.01), '#b88a5a', 0.45, -0.04, 0, bl, 0); const q = new THREE.Group(); q.rotation.y = k * Math.PI / 2; bl.add(q); q.add(b); } U.fan = bl; }
  pottedPlant(G, -5.4, -4.3, 1.2, '#f4f1ea'); pottedPlant(G, 5.3, -4.3, 1.1, '#14a39a'); pottedPlant(G, 5.4, 4.3, 1.0, '#e07a4a'); waterCooler(G, -5.5, 1.4);
  mesh(new THREE.CircleGeometry(1.6, 40).rotateX(-Math.PI / 2), toon('#e8d8c0', { roughness: 0.95 }), -3.0, 0.006, 3.2, G, 0);
}
