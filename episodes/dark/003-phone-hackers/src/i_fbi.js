
// ---------- FBI: the Newark field office. Big wall screen (SCR.wall), an evidence board on the right wall (SCR.board),
// desks, flags, the seal ----------
{ const G = FBI, U = G.userData, x0 = -4, x1 = 4, z0 = -4, z1 = 4, h = 3.2;
  const wallM = toon('#ffffff', { map: canvasTex(512, 512, (x, w, h2) => { x.fillStyle = '#3a4258'; x.fillRect(0, 0, w, h2); x.fillStyle = '#323a4f'; x.fillRect(0, h2 * 0.62, w, h2 * 0.38); x.fillStyle = '#272d3e'; x.fillRect(0, h2 * 0.6, w, 10); for (let i = 0; i < 4; i++) { x.fillStyle = 'rgba(255,255,255,.04)'; x.fillRect(i * 128 + 2, 0, 3, h2); } }, true) });
  shell(G, { x0, x1, z0, z1, h, wall: wallM, floor: toon('#ffffff', { map: carpetTex }), ceil: '#20243a' });
  G.add(new THREE.HemisphereLight('#9fb0ff', '#2a2030', 0.9));
  const top = new THREE.DirectionalLight('#dfe6ff', 1.2); top.position.set(2, 8, 4); top.target.position.set(0, 0, -1); top.castShadow = true; top.shadow.mapSize.set(1536, 1536); Object.assign(top.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 20 }); top.shadow.bias = -0.0004; G.add(top, top.target);
  const scrL = new THREE.PointLight('#5fd0ff', 6, 7, 1.4); scrL.position.set(0, 1.9, -3.0); G.add(scrL);
  for (const lz of [-2, 1.5]) { mesh(rbox(2.6, 0.05, 0.35, 0.01), '#cfd6e6', 0, h - 0.03, lz, G, 3); mesh(new THREE.PlaneGeometry(2.5, 0.28), basic('#f4f8ff'), 0, h - 0.06, lz, G, 0).rotation.x = Math.PI / 2; }
  { const tc = textCanvas(1024, 585, () => {}); SCR.wall = tc; mesh(rbox(4.5, 2.6, 0.12, 0.03), '#14121a', 0, 1.85, z0 + 0.07, G, 4.5); const p = new THREE.Mesh(new THREE.PlaneGeometry(4.3, 2.45), basic('#ffffff', { map: tc.t })); p.position.set(0, 1.85, z0 + 0.135); p.userData.noOutline = true; G.add(p); glow(G, 0, 1.85, z0 + 0.6, '#5fd0ff', 6, 0.18); }
  { const tc = textCanvas(512, 512, (x, w, h2) => { x.clearRect(0, 0, w, h2); x.fillStyle = '#14213d'; x.beginPath(); x.arc(256, 230, 200, 0, 7); x.fill(); x.lineWidth = 16; x.strokeStyle = '#e8c35a'; x.stroke(); x.fillStyle = '#e8c35a'; x.textAlign = 'center'; x.font = '900 130px Poppins'; x.fillText('FBI', 256, 260); x.font = '800 32px Poppins'; x.fillText('NEWARK DIVISION', 256, 320); }); tc.update();
    const p = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.0), basic('#ffffff', { map: tc.t, transparent: true })); p.position.set(-3.1, 2.1, z0 + 0.02); p.userData.noOutline = true; G.add(p); }
  { const bl = new THREE.PointLight('#fff0d8', 4, 4, 1.4); bl.position.set(2.6, 2.5, -0.4); G.add(bl); const tc = textCanvas(1024, 640, () => {}); SCR.board = tc; const g = new THREE.Group(); g.position.set(x1 - 0.04, 1.7, -0.4); g.rotation.y = -Math.PI / 2; G.add(g);
    mesh(rbox(3.4, 2.1, 0.06, 0.02), '#6a4a2a', 0, 0, -0.03, g, 4); const p = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.0), toon('#ffffff', { map: tc.t })); p.position.z = 0.005; p.userData.noOutline = true; g.add(p); }
  { const tc = textCanvas(512, 320, () => {}); SCR.desk = tc;
    for (const [dx, dz] of [[-2.3, -1.6], [2.0, -1.6], [-1.0, 1.4]]) { const d = new THREE.Group(); d.position.set(dx, 0, dz); G.add(d);
      mesh(rbox(1.5, 0.06, 0.8, 0.02), '#4a4f63', 0, 0.75, 0, d, 4.5); for (const s of [-1, 1]) mesh(rbox(0.06, 0.73, 0.7), '#2e3242', s * 0.7, 0.37, 0, d, 3.5);
      mesh(rbox(0.62, 0.38, 0.04, 0.01), '#14121a', 0, 1.12, -0.22, d, 3); mesh(rbox(0.05, 0.2, 0.05), '#14121a', 0, 0.86, -0.24, d, 2);
      const p = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 0.34), basic('#ffffff', { map: tc.t })); p.position.set(0, 1.12, -0.198); p.userData.noOutline = true; d.add(p);
      deskPhone(d, 0.5, 0.78, 0.1, -0.3, '#2a2c38'); for (let k = 0; k < 3; k++) mesh(rbox(0.22, 0.004, 0.3), '#f4efe4', -0.45, 0.785 + k * 0.006, 0.1, d, 0); } }
  for (const fx of [-3.6, -3.0]) { mesh(rbox(0.55, 1.3, 0.6, 0.02), '#5a6070', fx, 0.65, 3.4, G, 4); for (let k = 0; k < 3; k++) mesh(rbox(0.2, 0.03, 0.03), '#c9ccd6', fx, 1.1 - k * 0.4, 3.08, G, 1.5); }
  mesh(cyl(0.04, 0.04, 2.6, 8), '#d9a43a', 3.4, 1.3, -3.6, G, 2.5); { const g = new THREE.PlaneGeometry(1.0, 0.65, 10, 1); const pos = g.attributes.position; for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.sin((pos.getX(i) + 0.5) * 4) * 0.05 * (pos.getX(i) + 0.5)); g.computeVertexNormals();
    const ft = canvasTex(512, 320, (x, w, hh) => { for (let i = 0; i < 13; i++) { x.fillStyle = i % 2 ? '#f4f6fb' : '#c8102e'; x.fillRect(0, i * hh / 13, w, hh / 13 + 1); } x.fillStyle = '#1d2a6a'; x.fillRect(0, 0, w * 0.42, hh * 7 / 13); });
    const m = new THREE.Mesh(g, toon('#ffffff', { map: ft, side: THREE.DoubleSide })); m.position.set(2.88, 2.2, -3.6); m.userData.noOutline = true; G.add(m); }
}
const FCARD = { agentM: makeCard(FBI, 'agentM', 1.8), agentF: makeCard(FBI, 'agentF', 1.7), pros: makeCard(FBI, 'lawyer', 1.76) };
