
// ---------- SHOP: a call shop in Brescia. Street + facade at z 0 (facing +z), the shop inside (z -8..0):
// 4 booths on each side wall with live minute meters, the counter at the back ----------
const upperTex = canvasTex(1024, 1024, (x, w, h) => { const r = rng(51); x.fillStyle = '#e0a868'; x.fillRect(0, 0, w, h); for (let i = 0; i < 3000; i++) { x.fillStyle = `rgba(${r() < 0.5 ? '120,70,30' : '255,230,190'},${0.05 + r() * 0.06})`; x.fillRect(r() * w, r() * h, 3 + r() * 4, 3 + r() * 4); }
  for (let j = 0; j < 3; j++) for (let i = 0; i < 4; i++) { const ox = 70 + i * 240, oy = 70 + j * 320; x.fillStyle = '#f4efe4'; x.fillRect(ox - 16, oy - 16, 152, 252); x.fillStyle = '#2a3048'; x.fillRect(ox, oy, 120, 220);
    const open = r() < 0.5; x.fillStyle = '#2f6a4a'; if (open) { x.fillRect(ox - 70, oy, 60, 220); x.fillRect(ox + 130, oy, 60, 220); } else { x.fillRect(ox, oy, 58, 220); x.fillRect(ox + 62, oy, 58, 220); }
    x.strokeStyle = 'rgba(0,0,0,.3)'; x.lineWidth = 3; for (let k = 0; k < 10; k++) { const yy = oy + 10 + k * 21; if (open) { x.beginPath(); x.moveTo(ox - 70, yy); x.lineTo(ox - 10, yy); x.moveTo(ox + 130, yy); x.lineTo(ox + 190, yy); x.stroke(); } else { x.beginPath(); x.moveTo(ox, yy); x.lineTo(ox + 120, yy); x.stroke(); } }
    x.fillStyle = '#3a3e48'; x.fillRect(ox - 20, oy + 230, 160, 14); } });
const cobbleTex = canvasTex(512, 512, (x, w, h) => { const r = rng(52); x.fillStyle = '#5a5258'; x.fillRect(0, 0, w, h); for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) { x.fillStyle = `hsl(20,${6 + r() * 6}%,${34 + r() * 12}%)`; x.beginPath(); x.roundRect(i * 32 + 2 + (j % 2) * 16, j * 32 + 2, 28, 28, 7); x.fill(); } }, true);
{ const G = SHOP, U = G.userData;
  skyDome(G, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#1a1840'); g.addColorStop(0.35, '#4a3a7a'); g.addColorStop(0.48, '#e88a6a'); g.addColorStop(0.52, '#3a2a40'); g.addColorStop(1, '#1a1420'); x.fillStyle = g; x.fillRect(0, 0, w, h); });
  const plane = (w, d, mat, x, z, y = 0, rep = [1, 1]) => { const mt = mat.clone(); if (mt.map) { mt.map = mat.map.clone(); mt.map.needsUpdate = true; mt.map.repeat.set(...rep); } const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mt); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.receiveShadow = true; m.userData.noHull = true; G.add(m); return m; };
  plane(60, 7, toon('#ffffff', { map: cobbleTex }), 0, 6.5, 0, [20, 2.5]); plane(60, 3, toon('#ffffff', { map: paveTex }), 0, 1.5, 0.04, [24, 1.2]); mesh(rbox(60, 0.12, 0.2, 0.02), '#8a8a94', 0, 0.06, 3.0, G, 2.5);
  plane(60, 4, toon('#ffffff', { map: paveTex }), 0, 12, 0.04, [24, 1.6]);
  // facade: ground floor with door + two big windows, upper floors above
  holeWall(G, -6, 6, 3.4, [[-5.0, -1.4, 0.7, 2.6], [-0.6, 0.6, 0, 2.3], [1.4, 5.0, 0.7, 2.6]], V(0, 0, 0), 0.25, '#c98a4a');
  { const up = mesh(rbox(12, 6.6, 0.25, 0.02), toon('#ffffff', { map: upperTex }), 0, 3.4 + 3.3, 0, G, 4.5); up.material.map.repeat.set(1, 1); }
  mesh(rbox(12.3, 0.25, 0.5, 0.02), '#f4efe4', 0, 3.4, 0.12, G, 3); mesh(rbox(12.3, 0.3, 0.6, 0.02), '#a86a3a', 0, 10.1, 0.1, G, 3);
  for (const [bx, col] of [[-12, '#d8c8a0'], [12, '#c87a5a'], [-20, '#e8d0a0'], [20, '#a8b8a0']]) { const b = mesh(rbox(7.8, 9 + (bx % 3), 7, 0.03), toon('#ffffff', { map: upperTex }), bx, (9 + (bx % 3)) / 2, -3.5, G, 4.5); b.material = b.material.clone(); b.material.color.set(col); }
  for (const [bx, col] of [[-8, '#d8b890'], [0, '#e0a868'], [8, '#c8a080']]) { const b = mesh(rbox(7.8, 10, 4, 0.03), toon('#ffffff', { map: upperTex }), bx, 5, 16, G, 4.5); b.material = b.material.clone(); b.material.color.set(col); }
  const glass = toon('#9fd8ff', { transparent: true, opacity: 0.18 }); for (const gx of [-3.2, 3.2]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 1.9), glass); p.position.set(gx, 1.65, 0.02); p.userData.noOutline = true; G.add(p); }
  for (const gx of [-3.2, 3.2]) for (const [w2, h2, ox, oy] of [[3.7, 0.08, 0, 0.7], [3.7, 0.08, 0, 2.6], [0.08, 1.9, -1.8, 1.65], [0.08, 1.9, 1.8, 1.65], [0.06, 1.9, 0, 1.65]]) mesh(rbox(w2, h2, 0.1, 0.01), '#3a3e48', gx + ox, oy, 0.05, G, 2);
  // window stickers
  { const tc = textCanvas(1024, 256, (c, w, hh) => { c.clearRect(0, 0, w, hh); c.fillStyle = 'rgba(255,255,255,.92)'; c.beginPath(); c.roundRect(10, 10, w - 20, hh - 20, 30); c.fill(); c.fillStyle = '#d7263d'; c.font = '900 64px Poppins'; c.textAlign = 'center'; c.fillText('CHIAMATE INTERNAZIONALI', w / 2, 100); c.fillStyle = '#14121a'; c.font = '800 54px Poppins'; c.fillText('€0,10 / MIN', w / 2, 190);
      const fl = [['#009246', '#ffffff', '#ce2b37'], ['#0038a8', '#ce1126', '#fcd116'], ['#b22234', '#ffffff', '#3c3b6e']]; fl.forEach((f, i) => f.forEach((col, k) => { c.fillStyle = col; c.fillRect(60 + i * 0, 0, 0, 0); })); }); tc.update();
    for (const gx of [-3.2, 3.2]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.65), basic('#ffffff', { map: tc.t, transparent: true })); p.position.set(gx, 2.15, 0.06); p.userData.noOutline = true; G.add(p); } }
  U.sign = neonSign(G, 'PHONE CENTER', '#3ff0ff', 0, 3.0, 0.3, 0, 0.62);
  mesh(rbox(1.25, 2.35, 0.06, 0.01), '#3a3e48', 0, 1.17, -0.15, G, 0).visible = false;
  // street props: lamps, a scooter, a bin, bollards
  for (const lx of [-8, 8]) { mesh(cyl(0.06, 0.08, 4.2, 8), '#2a2a34', lx, 2.1, 2.7, G, 2.5); mesh(rbox(0.5, 0.35, 0.5, 0.06), '#2a2a34', lx, 4.3, 2.7, G, 2.5); mesh(rbox(0.36, 0.2, 0.36, 0.04), basic('#fff2c8'), lx, 4.12, 2.7, G, 0); glow(G, lx, 4.1, 2.7, '#ffd890', 2.4, 0.5); const pl = new THREE.PointLight('#ffd890', 8, 9, 1.5); pl.position.set(lx, 3.9, 2.9); G.add(pl); }
  { const s = new THREE.Group(); s.position.set(-4.2, 0, 2.2); s.rotation.y = 0.3; G.add(s); mesh(rbox(1.2, 0.35, 0.36, 0.12), '#d7263d', 0, 0.5, 0, s, 3.5); mesh(rbox(0.5, 0.12, 0.3, 0.05), '#14121a', -0.2, 0.75, 0, s, 2.5); mesh(rbox(0.14, 0.7, 0.3, 0.05), '#d7263d', 0.5, 0.75, 0, s, 3); mesh(cyl(0.02, 0.02, 0.5, 6).rotateX(Math.PI / 2), '#c9ccd6', 0.55, 1.12, 0, s, 1.5);
    for (const wx of [-0.45, 0.5]) mesh(cyl(0.18, 0.18, 0.12, 16).rotateX(Math.PI / 2), '#14121a', wx, 0.18, 0, s, 2.5); }
  mesh(cyl(0.25, 0.22, 0.8, 12), '#2f6a4a', 5.6, 0.4, 1.8, G, 3);
  // interior
  { const iw = toon('#ffffff', { map: canvasTex(512, 512, (x, w, h) => { x.fillStyle = '#efe8d8'; x.fillRect(0, 0, w, h); x.fillStyle = '#2f6fe0'; x.fillRect(0, h * 0.72, w, 14); const r = rng(53); for (let i = 0; i < 1000; i++) { x.fillStyle = `rgba(0,0,0,${r() * 0.05})`; x.fillRect(r() * w, r() * h, 2, 2); } }, true) });
    shell(G, { x0: -5.6, x1: 5.6, z0: -8, z1: -0.14, h: 3.4, wall: iw, floor: toon('#ffffff', { map: tileTex }), ceil: '#e8e0cc', skip: ['front'] });
    G.add(new THREE.HemisphereLight('#c8b8ff', '#3a2a40', 0.8));
    const key = new THREE.DirectionalLight('#ffd8b0', 1.0); key.position.set(6, 9, 10); key.target.position.set(0, 0, -2); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 40 }); key.shadow.bias = -0.0005; G.add(key, key.target);
    for (const lz of [-2, -5.5]) { mesh(rbox(1.6, 0.05, 0.3, 0.01), '#f4efe4', 0, 3.37, lz, G, 2.5); mesh(new THREE.PlaneGeometry(1.5, 0.22), basic('#ffffff'), 0, 3.34, lz, G, 0).rotation.x = Math.PI / 2; const pl = new THREE.PointLight('#f4f8ff', 6, 8, 1.2); pl.position.set(0, 3.0, lz); G.add(pl); }
    U.meters = []; U.booths = [];
    for (const side of [-1, 1]) for (let i = 0; i < 4; i++) { const bz = -1.6 - i * 1.4, n = side < 0 ? i + 1 : i + 5, bx = side * 4.6;
      for (const ez of [-0.68, 0.68]) mesh(rbox(1.0, 2.3, 0.06, 0.01), '#a86a3a', bx, 1.15, bz + ez, G, 3);
      mesh(rbox(1.0, 0.1, 1.4, 0.01), '#a86a3a', bx, 2.35, bz, G, 3);
      const gl = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.4), toon('#cfefff', { transparent: true, opacity: 0.16 })); gl.position.set(side * 4.1, 1.15, bz); gl.rotation.y = -side * Math.PI / 2; gl.userData.noOutline = true; G.add(gl);
      for (const ez of [-0.6, 0.6]) mesh(rbox(0.06, 2.3, 0.06), '#3a3e48', side * 4.1, 1.15, bz + ez, G, 2);
      const wp = new THREE.Group(); wp.position.set(side * 5.55, 1.45, bz); wp.rotation.y = -side * Math.PI / 2; G.add(wp); mesh(rbox(0.22, 0.3, 0.08, 0.02), '#2a2c38', 0, 0, 0, wp, 2.5); mesh(rbox(0.06, 0.24, 0.06, 0.02), '#14121a', -0.13, 0.02, 0.05, wp, 2);
      const tc = textCanvas(256, 140, (c, w, hh, sec, eur, on) => { c.fillStyle = '#14121a'; c.fillRect(0, 0, w, hh); c.fillStyle = on ? '#d7263d' : '#3a3e48'; c.fillRect(0, 0, w, 40); c.fillStyle = '#fff'; c.font = '900 28px Poppins'; c.textAlign = 'center'; c.fillText('CABINA ' + n, w / 2, 30);
        c.fillStyle = on ? '#3ff07a' : '#2a4a3a'; c.font = '700 44px monospace'; const m = Math.floor(sec / 60), s = Math.floor(sec % 60); c.fillText(String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0'), w / 2 - 40, 92); c.fillStyle = on ? '#ffcf3f' : '#4a4020'; c.font = '700 30px monospace'; c.fillText('€' + eur.toFixed(2), w / 2, 130); });
      tc.update(0, 0, 0); U.meters.push({ tc, n, ph: (n * 37) % 11 * 60 }); const mp = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.34), basic('#ffffff', { map: tc.t })); mp.position.set(side * 4.08, 2.62, bz); mp.rotation.y = -side * Math.PI / 2; mp.userData.noOutline = true; G.add(mp); mesh(rbox(0.06, 0.4, 0.68, 0.01), '#14121a', side * 4.12, 2.62, bz, G, 2);
      U.booths.push(V(side * 4.75, 0, bz)); }
    // counter + owner's corner + price board
    mesh(rbox(3.2, 1.05, 0.7, 0.03), '#a86a3a', 0, 0.52, -6.9, G, 4.5); mesh(rbox(3.3, 0.06, 0.8, 0.02), '#e8e2d6', 0, 1.07, -6.9, G, 3);
    mesh(rbox(0.5, 0.36, 0.04, 0.01), '#14121a', -0.8, 1.32, -6.85, G, 2.5); mesh(new THREE.PlaneGeometry(0.46, 0.3), basic('#2f6fe0'), -0.8, 1.32, -6.828, G, 0); mesh(rbox(0.4, 0.15, 0.35, 0.03), '#3a3e48', 0.9, 1.17, -6.9, G, 2.5);
    { const tc = textCanvas(1024, 640, (c, w, hh) => { c.fillStyle = '#14213d'; c.fillRect(0, 0, w, hh); c.fillStyle = '#ffcf3f'; c.font = '900 70px Poppins'; c.textAlign = 'center'; c.fillText('TARIFFE  €/MIN', w / 2, 90);
        const rows = [['AMERICA', '0,05'], ['EUROPA', '0,05'], ['ASIA', '0,10'], ['AFRICA', '0,15'], ['FILIPPINE', '0,10']]; c.font = '800 54px Poppins'; rows.forEach(([a, b], i) => { c.textAlign = 'left'; c.fillStyle = '#fff'; c.fillText(a, 120, 190 + i * 92); c.textAlign = 'right'; c.fillStyle = '#3ff07a'; c.fillText(b, w - 120, 190 + i * 92); }); }); tc.update();
      mesh(rbox(2.6, 1.65, 0.06, 0.02), '#3a3e48', 0, 2.35, -7.95, G, 3); const p = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 1.56), basic('#ffffff', { map: tc.t })); p.position.set(0, 2.35, -7.915); p.userData.noOutline = true; G.add(p); }
    for (let i = 0; i < 4; i++) mesh(rbox(0.5, 0.45, 0.06, 0.01), ['#ffcf3f', '#d7263d', '#2f6fe0', '#3f9a72'][i], -2.4 + i * 0.3 + (i > 1 ? 3.6 : 0), 2.4 - (i % 2) * 0.55, -7.96, G, 2);
    for (let k = 0; k < 3; k++) mesh(cyl(0.22, 0.22, 0.45, 14), '#3a3e48', -2.6 + k * 0.6, 0.22, -0.9, G, 2.5);
  }
}
const SCARD = { owner: makeCard(SHOP, 'shopOwner', 1.72), cops: ['polizia', 'polizia', 'polizia'].map(k => makeCard(SHOP, k, 1.78)), cust: ['gent', 'lady2', 'cowork1', 'admin2', 'lady', 'cowork2', 'office', 'crewB'].map((k, i) => makeCard(SHOP, k, 1.6 + (i % 3) * 0.05)), walkers: ['admin', 'lady', 'gent'].map(k => makeCard(SHOP, k, 1.65)) };
