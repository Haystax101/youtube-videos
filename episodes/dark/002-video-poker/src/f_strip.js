
// ---------- STRIP: Las Vegas at night. Casino facades face +z across a road; THE MEADOWS sits apart at x 40 ----------
function palm(G, x, z, h = 5.5, s = 1) { const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); G.add(g);
  for (let i = 0; i < 7; i++) { const y = i * h / 7, lean = Math.sin(i * 0.4) * 0.12; mesh(cyl(0.13 - i * 0.008, 0.16 - i * 0.008, h / 7 + 0.02, 8), i % 2 ? '#7a5a3a' : '#6a4a2e', lean, y + h / 14, 0, g, 3); }
  for (let a = 0; a < 8; a++) { const an = a / 8 * Math.PI * 2, f = new THREE.Group(); f.position.set(0.1, h, 0); f.rotation.y = an; g.add(f);
    const leaf = mesh(new THREE.ConeGeometry(0.28, 2.2, 4).rotateZ(-Math.PI / 2).scale(1, 0.18, 1), a % 2 ? '#2f7a3a' : '#3f8a44', 1.1, -0.25, 0, f, 3); leaf.rotation.z = -0.45; }
  return g; }
function pine(G, x, z, h = 4) { mesh(cyl(0.1, 0.14, 1, 6), '#5a3a22', x, 0.5, z, G, 3); for (let i = 0; i < 3; i++) mesh(new THREE.ConeGeometry(1.2 - i * 0.3, 1.6, 7), i % 2 ? '#1f4a2e' : '#24583a', x, 1.3 + i * 0.9 * h / 4, z, G, 3.5); }
const windowsTex = (base, lit, seed) => canvasTex(512, 512, (x, w, h) => { const r = rng(seed); x.fillStyle = base; x.fillRect(0, 0, w, h);
  for (let j = 0; j < 12; j++) for (let i = 0; i < 10; i++) { x.fillStyle = r() < 0.55 ? lit : 'rgba(10,8,20,.75)'; x.fillRect(i * 51 + 10, j * 42 + 10, 32, 24); } x.fillStyle = 'rgba(0,0,0,.18)'; for (let i = 0; i < 10; i++) x.fillRect(i * 51 + 46, 0, 4, h); }, true);
{ const G = STRIP;
  skyDome(G, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#05030e'); g.addColorStop(0.38, '#160c34'); g.addColorStop(0.5, '#5a2266'); g.addColorStop(0.53, '#2a1240'); g.addColorStop(1, '#0a0614'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    const r = rng(41); for (let i = 0; i < 500; i++) { x.fillStyle = `rgba(255,255,255,${0.3 + r() * 0.7})`; x.fillRect(r() * w, r() * h * 0.42, 1.5 + r() * 1.5, 1.5 + r() * 1.5); }
    x.fillStyle = '#1a1028'; x.beginPath(); x.moveTo(0, h * 0.52); for (let u = 0; u <= w; u += 16) x.lineTo(u, h * 0.5 - (Math.sin(u * 0.013) * 0.5 + 0.5) * 34 - (Math.sin(u * 0.041 + 2) * 0.5 + 0.5) * 16); x.lineTo(w, h * 0.56); x.lineTo(0, h * 0.56); x.fill(); });
  const plane = (w, d, mat, x, z, y = 0, rep = [1, 1]) => { const mt = mat.clone(); if (mt.map) { mt.map = mat.map.clone(); mt.map.needsUpdate = true; mt.map.repeat.set(...rep); } const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mt); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.receiveShadow = true; m.userData.noHull = true; G.add(m); return m; };
  plane(110, 6, toon('#ffffff', { map: roadTex }), 8, 4, 0, [14, 1]);
  plane(110, 2.6, toon('#ffffff', { map: paveTex }), 8, -0.3, 0.06, [40, 1]); plane(110, 2.6, toon('#ffffff', { map: paveTex }), 8, 8.3, 0.06, [40, 1]);
  mesh(rbox(110, 0.12, 0.2, 0.02), '#8a8a94', 8, 0.06, 1.0, G, 2.5); mesh(rbox(110, 0.12, 0.2, 0.02), '#8a8a94', 8, 0.06, 7.0, G, 2.5);
  plane(120, 60, toon('#1a1420'), 8, -30, -0.01); plane(120, 40, toon('#1a1420'), 8, 29.6, -0.01);
  G.add(new THREE.HemisphereLight('#9a8aff', '#2a1430', 0.75));
  const moon = new THREE.DirectionalLight('#b0b8ff', 0.9); moon.position.set(-10, 20, 18); moon.target.position.set(0, 0, 0); moon.castShadow = true; moon.shadow.mapSize.set(2048, 2048); Object.assign(moon.shadow.camera, { left: -40, right: 40, top: 30, bottom: -30, near: 1, far: 80 }); moon.shadow.bias = -0.0005; G.add(moon, moon.target);
  const CAS = [['RIO', -26, 11, 9, '#6a2a5a', '#ff3fa8', 'rgba(255,170,220,.9)'], ['WYNN', -13, 11, 12, '#7a5a3a', '#fff2c8', 'rgba(255,230,170,.9)'], ['GOLDEN NUGGET', 0, 12.5, 8, '#8a6a2a', '#ffb03f', 'rgba(255,210,120,.9)'], ['SILVERTON', 13.5, 11, 9, '#2f3f5f', '#3ff0ff', 'rgba(170,230,255,.9)'], ['THE MEADOWS', 40, 13, 6, '#4a3a2e', '#3ff07a', 'rgba(255,220,160,.85)']];
  const U = G.userData; U.signs = {}; U.bulbs = [];
  CAS.forEach(([name, cx, w, h, col, neon, lit], ci) => { const wt = windowsTex(col, lit, 50 + ci);
    const b = mesh(rbox(w, h, 7, 0.06), toon('#ffffff', { map: wt }), cx, h / 2, -5.2, G, 5); b.material.map.repeat.set(w / 6, h / 6);
    const tw = mesh(rbox(w * 0.55, h * 1.9, 5, 0.06), toon('#ffffff', { map: wt.clone() }), cx + (ci % 2 ? 2 : -2), h * 0.95, -13, G, 5); tw.material.map.needsUpdate = true; tw.material.map.repeat.set(w / 10, h / 5);
    mesh(rbox(w + 0.3, 0.35, 7.3, 0.04), neon === '#fff2c8' ? '#d9a43a' : '#14121a', cx, h, -5.2, G, 3);
    const can = new THREE.Group(); can.position.set(cx, 3.3, -0.7); G.add(can); mesh(rbox(w * 0.62, 0.3, 2.4, 0.05), '#14121a', 0, 0, 0, can, 4); mesh(rbox(w * 0.64, 0.08, 2.46, 0.02), '#d9a43a', 0, -0.17, 0, can, 2);
    for (const s of [-1, 1]) mesh(cyl(0.09, 0.09, 3.3, 10), '#d9a43a', s * w * 0.29, -1.65, 1.0, can, 3);
    const nb = Math.floor(w * 2.4); for (let i = 0; i < nb; i++) { const bl = mesh(sph(0.055, 6), basic('#fff2c8'), -w * 0.31 + i * (w * 0.62) / (nb - 1), -0.2, 1.24, can, 0); bl.userData.i = i; U.bulbs.push(bl); }
    mesh(new THREE.PlaneGeometry(w * 0.5, 2.9), basic('#2a3a7a'), cx, 1.45, -1.69, G, 0); glow(G, cx, 1.6, -1.2, neon, 4, 0.35);
    U.signs[name] = neonSign(G, name, neon, cx, h - 1.7, -1.65, 0, name.length > 10 ? 1.5 : 1.9);
    const pl = new THREE.PointLight(neon, 14, 13, 1.6); pl.position.set(cx, 3.0, 1.2); G.add(pl); });
  // highway sign by the Meadows
  { const tc = textCanvas(640, 300, (x, w, h) => { x.fillStyle = '#1f6a3a'; x.beginPath(); x.roundRect(4, 4, w - 8, h - 8, 26); x.fill(); x.lineWidth = 8; x.strokeStyle = '#ffffff'; x.stroke(); x.fillStyle = '#fff'; x.font = '900 70px Poppins'; x.textAlign = 'center'; x.fillText('PITTSBURGH', w / 2, 120); x.font = '800 56px Poppins'; x.fillText('25 mi  →', w / 2, 220); }); tc.update();
    const g = new THREE.Group(); g.position.set(30.5, 0, 8.4); G.add(g); for (const s of [-1, 1]) mesh(cyl(0.06, 0.06, 3.2, 8), '#9a9aa2', s * 1.2, 1.6, 0, g, 2.5); const p = new THREE.Mesh(new THREE.PlaneGeometry(3, 1.4), basic('#ffffff', { map: tc.t })); p.position.set(0, 3.0, 0.05); p.userData.noOutline = true; g.add(p); mesh(rbox(3.1, 1.5, 0.06), '#1f6a3a', 0, 3.0, 0.0, g, 3); }
  // palms (Vegas) and pines (Pennsylvania), lamps
  for (let x = -34; x <= 22; x += 6.5) { palm(G, x, 8.6, 5.2 + (x % 3), 1); if (Math.abs((x + 6.5) % 13) < 1) palm(G, x + 3.2, 0.25, 4.6, 0.9); }
  for (const x of [26, 28.5, 46, 49, 52]) pine(G, x, 9.5 + (x % 2), 4);
  for (let x = -32; x <= 52; x += 9) { if (x === 40) continue; mesh(cyl(0.06, 0.08, 5, 8), '#2a2a34', x, 2.5, 0.7, G, 2.5); mesh(rbox(0.9, 0.12, 0.3, 0.04), '#2a2a34', x, 5.0, 1.05, G, 2.5); mesh(rbox(0.5, 0.06, 0.22, 0.02), basic('#fff2c8'), x, 4.92, 1.2, G, 0); glow(G, x, 4.85, 1.25, '#ffd890', 2.4, 0.5); }
  // taxis + a limo; pedestrians
  U.cars = [['#f2c13a', 2.6, 1, 0], ['#f2c13a', 5.4, -1, 0.35], ['#14121a', 2.6, 1, 0.62], ['#c9ccd6', 5.4, -1, 0.8]].map(([col, z, dir, ph]) => { const c = profileCar(G, [[-2.1, 0.25], [2.1, 0.25], [2.15, 0.75], [1.2, 0.85], [0.6, 1.35], [-0.9, 1.38], [-1.5, 0.9], [-2.15, 0.8]], 4.2, 1.7, col, { wheels: [[1.35, 0.8], [1.35, -0.8], [-1.35, 0.8], [-1.35, -0.8]], wr: 0.33 });
    if (col === '#f2c13a') { mesh(rbox(0.7, 0.18, 0.3, 0.04), '#ffffff', -0.15, 1.5, 0, c.root, 2); } glow(c.root, 2.2 * dir > 0 ? 2.2 : 2.2, 0.6, 0, '#fff2c8', 1.0, 0.6); c.z = z; c.dir = dir; c.ph = ph; return c; });
}
const STRIPPEOPLE = ['gent', 'lady', 'cowork1', 'lady2', 'office', 'admin2'].map((k, i) => { const c = makeCard(STRIP, k, 1.62 + (i % 3) * 0.06); c.base = { x0: -34 + i * 11, z: -0.7 + (i % 3) * 0.6, dir: i % 2 ? 1 : -1, ph: i * 1.7 }; return c; });
