
// ---------- HOUSE: Nestor's place near Pittsburgh at night. Front wall at z 0 (door x -0.5..0.5), room inside z -5..0 ----------
const sidingTex = canvasTex(512, 512, (x, w, h) => { x.fillStyle = '#7d8aa0'; x.fillRect(0, 0, w, h); for (let i = 0; i < 16; i++) { x.fillStyle = 'rgba(0,0,0,.22)'; x.fillRect(0, i * 32 + 28, w, 4); x.fillStyle = 'rgba(255,255,255,.07)'; x.fillRect(0, i * 32, w, 3); } }, true);
const wallpaperTex = canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#d9c9a8'; x.fillRect(0, 0, w, h); x.fillStyle = 'rgba(150,110,70,.22)'; for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { x.beginPath(); x.ellipse(i * 64 + (j % 2) * 32 + 16, j * 64 + 32, 8, 14, 0, 0, 7); x.fill(); } }, true);
{ const G = HOUSE, U = G.userData;
  skyDome(G, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#04030c'); g.addColorStop(0.45, '#141a3a'); g.addColorStop(0.52, '#2a2a4a'); g.addColorStop(1, '#0a0a14'); x.fillStyle = g; x.fillRect(0, 0, w, h); const r = rng(5); for (let i = 0; i < 300; i++) { x.fillStyle = `rgba(255,255,255,${0.3 + r() * 0.6})`; x.fillRect(r() * w, r() * h * 0.44, 2, 2); }
    x.fillStyle = '#0e1220'; x.beginPath(); x.moveTo(0, h * 0.53); for (let u = 0; u <= w; u += 12) x.lineTo(u, h * 0.51 - Math.abs(Math.sin(u * 0.07)) * 18 - (Math.sin(u * 0.011) * 0.5 + 0.5) * 22); x.lineTo(w, h * 0.56); x.lineTo(0, h * 0.56); x.fill(); }, 80);
  const flat = (w, d, mat, x, z, y = 0, rep) => { const mt = mat.clone(); if (mt.map) { mt.map = mat.map.clone(); mt.map.needsUpdate = true; mt.map.repeat.set(...rep); } const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mt); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.receiveShadow = true; m.userData.noHull = true; G.add(m); return m; };
  flat(80, 60, toon('#ffffff', { map: grassTex }), 0, -10, 0, [30, 22]); flat(80, 6, toon('#ffffff', { map: roadTex }), 0, 9.5, 0.01, [10, 1]); flat(80, 1.6, toon('#ffffff', { map: paveTex }), 0, 5.8, 0.02, [30, 1]); flat(1.4, 4.6, toon('#ffffff', { map: paveTex }), 0, 3.0, 0.02, [1, 3]);
  flat(8, 5, toon('#ffffff', { map: plankTex }), 0, -2.5, 0.03, [3, 2]);
  // walls: an outside skin (siding) and an inside skin (wallpaper), the front wall built around the door hole
  const sid = toon('#ffffff', { map: sidingTex }), pap = toon('#ffffff', { map: wallpaperTex }), H2 = 3.0;
  const slab = (mat, w, h, d, x, y, z, rep) => { const mt = mat.clone(); mt.map = mat.map.clone(); mt.map.needsUpdate = true; mt.map.repeat.set(...rep); return mesh(rbox(w, h, d, 0.01), mt, x, y, z, G, 3.5); };
  const wall = (xa, xb, ya, yb, z, both = true) => { const w = xb - xa, h = yb - ya; slab(sid, w, h, 0.1, (xa + xb) / 2, (ya + yb) / 2, z + 0.06, [w / 2, h / 2]); if (both) slab(pap, w, h, 0.06, (xa + xb) / 2, (ya + yb) / 2, z - 0.05, [w / 1.5, h / 1.5]); };
  wall(-4, -0.5, 0, H2, 0); wall(0.5, 4, 0, H2, 0); wall(-0.5, 0.5, 2.15, H2, 0);
  { const m = slab(sid, 0.1, H2, 5, -4.05, H2 / 2, -2.5, [2.5, 1.5]); const m2 = slab(pap, 0.06, H2, 5, -3.94, H2 / 2, -2.5, [3, 2]); const m3 = slab(sid, 0.1, H2, 5, 4.05, H2 / 2, -2.5, [2.5, 1.5]); const m4 = slab(pap, 0.06, H2, 5, 3.94, H2 / 2, -2.5, [3, 2]);
    slab(pap, 8, H2, 0.06, 0, H2 / 2, -5, [5, 2]); slab(sid, 8.2, H2, 0.1, 0, H2 / 2, -5.1, [4, 1.5]); }
  mesh(rbox(8.2, 0.08, 5.2), '#e8e2d6', 0, H2, -2.5, G, 2);
  // gabled roof
  { const sh = new THREE.Shape(); sh.moveTo(-4.6, 0); sh.lineTo(4.6, 0); sh.lineTo(0, 2.2); sh.closePath(); const g = new THREE.ExtrudeGeometry(sh, { depth: 6.0, bevelEnabled: false }); g.translate(0, 0, -6.0 + 0.5); mesh(g, '#3a2a2e', 0, H2, 0, G, 5); mesh(rbox(0.5, 1.6, 0.5), '#6a3a2a', 2.2, H2 + 1.4, -2.5, G, 3.5); }
  // front windows (lit from inside) with frames
  for (const s of [-1, 1]) { mesh(new THREE.PlaneGeometry(1.5, 1.0), basic('#ffcf7a'), s * 2.3, 1.55, 0.125, G, 0); mesh(rbox(1.65, 0.1, 0.06), '#f4efe4', s * 2.3, 2.08, 0.13, G, 2); mesh(rbox(1.65, 0.1, 0.06), '#f4efe4', s * 2.3, 1.02, 0.13, G, 2); mesh(rbox(0.08, 1.05, 0.06), '#f4efe4', s * 2.3, 1.55, 0.13, G, 2);
    glow(G, s * 2.3, 1.55, 0.4, '#ffcf7a', 2.6, 0.35); mesh(new THREE.PlaneGeometry(1.5, 1.0), toon('#8a3a3a'), s * 2.3, 1.55, -0.09, G, 0).rotation.y = Math.PI; }
  // porch, steps, posts, porch light
  mesh(rbox(3.2, 0.2, 1.6, 0.02), '#6a5a4e', 0, 0.1, 0.9, G, 4); mesh(rbox(1.4, 0.1, 0.4), '#6a5a4e', 0, 0.05, 1.9, G, 3); mesh(rbox(3.4, 0.12, 1.8), '#3a2a2e', 0, 2.55, 0.95, G, 4);
  for (const s of [-1, 1]) mesh(cyl(0.07, 0.07, 2.35, 10), '#f4efe4', s * 1.45, 1.37, 1.65, G, 3);
  mesh(sph(0.1, 10), basic('#fff2c8'), 0.85, 2.3, 0.2, G, 0); glow(G, 0.85, 2.3, 0.3, '#ffd890', 1.6, 0.6); const pl = new THREE.PointLight('#ffcf7a', 6, 6, 1.5); pl.position.set(0.85, 2.2, 0.8); G.add(pl);
  mesh(rbox(0.7, 0.03, 0.45), '#7a2a2a', 0, 0.215, 0.5, G, 2);
  // the front door on a hinge at x -0.5; it swings inward
  { const hinge = new THREE.Group(); hinge.position.set(-0.5, 0, 0.0); G.add(hinge); U.door = hinge; mesh(rbox(1.0, 2.15, 0.07, 0.02), '#7a1f2a', 0.5, 1.075, 0, hinge, 4); for (const y of [0.6, 1.5]) mesh(rbox(0.7, 0.6, 0.02), '#8a2a35', 0.5, y, 0.045, hinge, 2); mesh(sph(0.05, 8), '#d9a43a', 0.88, 1.05, 0.07, hinge, 1.5); }
  U.splinters = Array.from({ length: 14 }, (_, i) => mesh(rbox(0.05 + (i % 3) * 0.04, 0.02, 0.18), '#7a1f2a', 0, -5, 0, G, 1.5));
  // inside: sofa, TV, lamp, coffee table with cash
  { const lt = new THREE.PointLight('#ffcf7a', 7, 9, 1.4); lt.position.set(-1.5, 2.4, -2.5); G.add(lt); const lt2 = new THREE.PointLight('#5fa0ff', 3, 4, 1.5); lt2.position.set(2.5, 1.2, -3.5); G.add(lt2);
    mesh(rbox(2.4, 0.45, 0.9, 0.08), '#5a6a3a', -1.4, 0.32, -4.2, G, 4); mesh(rbox(2.4, 0.7, 0.25, 0.08), '#5a6a3a', -1.4, 0.75, -4.6, G, 4); for (const s of [-1, 1]) mesh(rbox(0.25, 0.6, 0.9, 0.08), '#4a5a2e', -1.4 + s * 1.2, 0.45, -4.2, G, 4);
    mesh(rbox(1.2, 0.06, 0.6), '#6a4a2a', -1.4, 0.42, -3.1, G, 3); for (const sx of [-0.5, 0.5]) for (const sz of [-0.22, 0.22]) mesh(cyl(0.025, 0.025, 0.4, 6), '#4a3020', -1.4 + sx, 0.2, -3.1 + sz, G, 0);
    for (let i = 0; i < 5; i++) mesh(rbox(0.16, 0.03, 0.07, 0.005), '#7fbf6a', -1.6 + (i % 3) * 0.18, 0.47 + Math.floor(i / 3) * 0.03, -3.1 + (i % 2) * 0.08, G, 1);
    mesh(rbox(1.4, 0.5, 0.4), '#3a2a20', 2.5, 0.25, -4.6, G, 3); mesh(rbox(1.2, 0.7, 0.06, 0.02), '#14121a', 2.5, 0.95, -4.62, G, 3); mesh(new THREE.PlaneGeometry(1.1, 0.6), basic('#3a6ac8'), 2.5, 0.95, -4.585, G, 0);
    mesh(cyl(0.03, 0.03, 1.5, 6), '#2a2a30', -3.3, 0.75, -4.3, G, 2); mesh(cyl(0.18, 0.28, 0.32, 14, 1, true), toon('#f4e2b8', { side: THREE.DoubleSide }), -3.3, 1.6, -4.3, G, 3); glow(G, -3.3, 1.55, -4.2, '#ffd890', 1.2, 0.5);
    mesh(rbox(0.9, 0.6, 0.05, 0.01), '#d9a43a', 0, 1.8, -4.95, G, 2); mesh(new THREE.PlaneGeometry(0.8, 0.5), toon('#4a7a9a'), 0, 1.8, -4.92, G, 0); }
  // police SUVs on the road, light bars flashing
  U.suvs = [[-3.2, 9.0, 0.15], [3.6, 9.8, -0.2]].map(([x, z, r]) => { const c = profileCar(G, [[-2.4, 0.35], [2.4, 0.35], [2.45, 1.0], [1.6, 1.15], [1.1, 1.85], [-2.35, 1.9], [-2.45, 1.0]], 4.8, 1.9, '#16141c', { wheels: [[1.55, 0.9], [1.55, -0.9], [-1.55, 0.9], [-1.55, -0.9]], wr: 0.4 }); c.root.position.set(x, 0, z); c.root.rotation.y = r;
    mesh(rbox(2.0, 0.5, 1.96), '#f4f6fb', -0.4, 1.1, 0, c.root, 0); const lr = mesh(rbox(0.5, 0.14, 0.9, 0.03), basic('#ff2a3a'), -0.15, 2.0, 0, c.root, 2); const lb = mesh(rbox(0.5, 0.14, 0.9, 0.03), basic('#2a6aff'), -0.75, 2.0, 0, c.root, 2);
    const gr = glow(c.root, -0.15, 2.1, 0, '#ff2a3a', 3.5, 0.6), gb = glow(c.root, -0.75, 2.1, 0, '#2a6aff', 3.5, 0.6); const pr = new THREE.PointLight('#ff2a3a', 0, 14, 1.4); pr.position.set(-0.15, 2.3, 0); c.root.add(pr); const pb = new THREE.PointLight('#2a6aff', 0, 14, 1.4); pb.position.set(-0.75, 2.3, 0); c.root.add(pb);
    return { ...c, lr, lb, gr, gb, pr, pb }; });
  mesh(cyl(0.05, 0.05, 1.1, 8), '#2a2a30', 4.6, 0.55, 5.2, G, 2.5); mesh(rbox(0.3, 0.22, 0.45, 0.04), '#2a2a30', 4.6, 1.2, 5.2, G, 2.5);
  for (const [x, z] of [[-6.5, -1], [6.8, -2], [-9, 2]]) { mesh(sph(1.1, 10), '#1f4a2e', x, 1.1, z, G, 4); mesh(sph(0.8, 10), '#24583a', x + 0.6, 1.6, z + 0.3, G, 3.5); }
  for (const x of [-15, 15]) { mesh(rbox(7, 3, 5), '#4a4e5e', x, 1.5, -2.5, G, 4); mesh(new THREE.PlaneGeometry(1.2, 0.8), basic(x < 0 ? '#3a3e5a' : '#ffcf7a'), x + 1.5, 1.6, 0.01, G, 0); }
}
const HOCARD = { nestor: makeCard(HOUSE, 'nestor', 1.78), s1: makeCard(HOUSE, 'swat', 1.84), s2: makeCard(HOUSE, 'swat2', 1.8), s3: makeCard(HOUSE, 'swat', 1.78) };
const RAM = (() => { const g = new THREE.Group(); HOUSE.add(g); mesh(cyl(0.11, 0.11, 0.9, 14).rotateZ(Math.PI / 2), '#2a2a30', 0, 0, 0, g, 3); mesh(cyl(0.13, 0.13, 0.12, 14).rotateZ(Math.PI / 2), '#d7263d', 0.45, 0, 0, g, 2); for (const s of [-0.18, 0.18]) mesh(new THREE.TorusGeometry(0.1, 0.02, 6, 12, Math.PI), '#9a9aa2', s, 0.11, 0, g, 1.5); g.position.set(0, -5, 0); return g; })();
