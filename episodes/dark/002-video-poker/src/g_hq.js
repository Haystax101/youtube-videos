
// ---------- HQ: the Gaming Control Board lab (beat 6) that doubles as the FBI room (hook, beat 8) ----------
const pcbTex = canvasTex(512, 512, (x, w, h) => { x.fillStyle = '#1f6a3a'; x.fillRect(0, 0, w, h); const r = rng(77); x.strokeStyle = '#c9a43a'; x.lineWidth = 3;
  for (let i = 0; i < 70; i++) { x.beginPath(); let px = r() * w, py = r() * h; x.moveTo(px, py); for (let k = 0; k < 3; k++) { if (r() < 0.5) px += (r() - 0.5) * 160; else py += (r() - 0.5) * 160; x.lineTo(px, py); } x.stroke(); x.fillStyle = '#e8c35a'; x.beginPath(); x.arc(px, py, 4, 0, 7); x.fill(); }
  for (let i = 0; i < 14; i++) { x.fillStyle = '#14121a'; const cw = 30 + r() * 60, ch = 20 + r() * 40; x.fillRect(r() * (w - cw), r() * (h - ch), cw, ch); } });
{ const G = HQ, x0 = -4, x1 = 4, z0 = -4, z1 = 4, h = 3.2;
  const wallM = toon('#ffffff', { map: canvasTex(512, 512, (x, w, h2) => { x.fillStyle = '#3a4258'; x.fillRect(0, 0, w, h2); x.fillStyle = '#323a4f'; x.fillRect(0, h2 * 0.62, w, h2 * 0.38); x.fillStyle = '#272d3e'; x.fillRect(0, h2 * 0.6, w, 10); const r = rng(71); for (let i = 0; i < 1500; i++) { x.fillStyle = `rgba(0,0,0,${r() * 0.07})`; x.fillRect(r() * w, r() * h2, 2, 2); } }, true) });
  shell(G, { x0, x1, z0, z1, h, wall: wallM, floor: toon('#ffffff', { map: carpetTex }), ceil: '#20243a' });
  G.add(new THREE.HemisphereLight('#9fb0ff', '#2a2030', 0.9));
  const top = new THREE.DirectionalLight('#dfe6ff', 1.2); top.position.set(2, 8, 4); top.target.position.set(0, 0, -1); top.castShadow = true; top.shadow.mapSize.set(1536, 1536); Object.assign(top.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 20 }); top.shadow.bias = -0.0004; G.add(top, top.target);
  const scrL = new THREE.PointLight('#5fd0ff', 6, 7, 1.4); scrL.position.set(0, 1.9, -3.0); G.add(scrL);
  const benchL = new THREE.PointLight('#fff0d8', 5, 5, 1.4); benchL.position.set(0, 2.7, 1.6); G.add(benchL);
  const chipL = new THREE.PointLight('#3ff07a', 0, 2.2, 1.5); chipL.position.set(0.2, 1.3, 1.1); G.add(chipL); G.userData.chipL = chipL;
  for (const lz of [-2, 1]) { mesh(rbox(2.6, 0.05, 0.35, 0.01), '#cfd6e6', 0, h - 0.03, lz, G, 3); mesh(new THREE.PlaneGeometry(2.5, 0.28), basic('#f4f8ff'), 0, h - 0.06, lz, G, 0).rotation.x = Math.PI / 2; }
  { const tc = textCanvas(1024, 585, () => {}); SCR.wall = tc; mesh(rbox(4.5, 2.6, 0.12, 0.03), '#14121a', 0, 1.85, z0 + 0.07, G, 4.5); const p = new THREE.Mesh(new THREE.PlaneGeometry(4.3, 2.45), basic('#ffffff', { map: tc.t })); p.position.set(0, 1.85, z0 + 0.135); p.userData.noOutline = true; G.add(p); glow(G, 0, 1.85, z0 + 0.6, '#5fd0ff', 6, 0.18); }
  { const tc = textCanvas(512, 512, (x, w, h2, which) => { x.clearRect(0, 0, w, h2); x.fillStyle = which === 'gcb' ? '#1f3a5a' : '#14213d'; x.beginPath(); x.arc(256, 230, 200, 0, 7); x.fill(); x.lineWidth = 16; x.strokeStyle = '#e8c35a'; x.stroke(); x.fillStyle = '#e8c35a'; x.textAlign = 'center';
      if (which === 'gcb') { x.font = '900 70px Poppins'; x.fillText('NEVADA', 256, 200); x.font = '800 34px Poppins'; x.fillText('GAMING CONTROL', 256, 252); x.fillText('BOARD', 256, 294); x.fillStyle = '#ffffff'; x.font = '800 36px Poppins'; x.fillText('ENFORCEMENT LAB', 256, 490); }
      else { x.font = '900 130px Poppins'; x.fillText('FBI', 256, 260); x.font = '800 30px Poppins'; x.fillText('LAS VEGAS DIVISION', 256, 320); x.fillStyle = '#ffffff'; x.font = '800 40px Poppins'; x.fillText('CASE FILE', 256, 490); } }); tc.update('fbi'); SCR.emblem = tc;
    const p = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.1), basic('#ffffff', { map: tc.t, transparent: true })); p.position.set(-3.1, 2.0, z0 + 0.02); p.userData.noOutline = true; G.add(p); }
  { const bl = new THREE.PointLight('#fff0d8', 4, 4, 1.4); bl.position.set(2.6, 2.5, -0.4); G.add(bl); const tc = textCanvas(1024, 640, () => {}); SCR.board = tc; const g = new THREE.Group(); g.position.set(x1 - 0.04, 1.7, -0.4); g.rotation.y = -Math.PI / 2; G.add(g);
    mesh(rbox(3.4, 2.1, 0.06, 0.02), '#6a4a2a', 0, 0, -0.03, g, 4); const p = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.0), toon('#ffffff', { map: tc.t })); p.position.z = 0.005; p.userData.noOutline = true; g.add(p); }
  // two desks at the back
  { const tc = textCanvas(512, 320, () => {}); SCR.desk = tc;
    for (const [dx, dz] of [[-2.3, -2.0], [2.3, -2.0]]) { const d = new THREE.Group(); d.position.set(dx, 0, dz); G.add(d);
      mesh(rbox(1.5, 0.06, 0.8, 0.02), '#4a4f63', 0, 0.75, 0, d, 4.5); for (const s of [-1, 1]) mesh(rbox(0.06, 0.73, 0.7), '#2e3242', s * 0.7, 0.37, 0, d, 3.5);
      mesh(rbox(0.62, 0.38, 0.04, 0.01), '#14121a', 0, 1.12, -0.22, d, 3); mesh(rbox(0.05, 0.2, 0.05), '#14121a', 0, 0.86, -0.24, d, 2);
      const p = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 0.34), basic('#ffffff', { map: tc.t })); p.position.set(0, 1.12, -0.198); p.userData.noOutline = true; d.add(p);
      mesh(rbox(0.4, 0.02, 0.14), '#2a2a30', 0, 0.79, 0.12, d, 2); for (let k = 0; k < 3; k++) mesh(rbox(0.22, 0.004, 0.3), '#f4efe4', -0.5, 0.785 + k * 0.006, 0.1, d, 0); } }
  // the workbench with the opened Game King
  { const b = new THREE.Group(); b.position.set(0, 0, 0.9); G.add(b); G.userData.bench = b;
    mesh(rbox(2.8, 0.08, 1.0, 0.02), '#8a8f9e', 0, 0.9, 0, b, 4.5); for (const sx of [-1.3, 1.3]) for (const sz of [-0.42, 0.42]) mesh(rbox(0.07, 0.88, 0.07), '#3a3e4a', sx, 0.44, sz, b, 3);
    mesh(rbox(2.6, 0.04, 0.8), '#4a4f63', 0, 0.25, 0, b, 3);
    // cabinet standing at the left end of the bench, door swung open
    const cab = new THREE.Group(); cab.position.set(-0.85, 0.94, -0.1); b.add(cab); mesh(rbox(0.62, 1.3, 0.04, 0.01), '#2a2f6a', 0, 0.65, -0.23, cab, 4); for (const sx of [-0.29, 0.29]) mesh(rbox(0.04, 1.3, 0.5, 0.01), '#2a2f6a', sx, 0.65, 0, cab, 4); for (const sy of [0.02, 1.28]) mesh(rbox(0.62, 0.04, 0.5, 0.01), '#2a2f6a', 0, sy, 0, cab, 4); mesh(new THREE.PlaneGeometry(0.54, 1.22), toon('#4a5068'), 0, 0.65, -0.205, cab, 0); const cl = new THREE.PointLight('#9fe0ff', 2.5, 1.6, 1.5); cl.position.set(0, 0.7, 0.5); cab.add(cl);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.33), basic('#ffffff', { map: SCR.vp.t })); scr.position.set(0, 0.95, 0.26); scr.userData.noOutline = true;
    const door = new THREE.Group(); door.position.set(-0.31, 0, 0.26); cab.add(door); mesh(rbox(0.62, 1.3, 0.05, 0.02), '#2a2f6a', 0.31, 0.65, 0, door, 4); scr.position.set(0.31, 0.95, 0.03); door.add(scr); G.userData.door = door;
    for (let i = 0; i < 4; i++) { mesh(rbox(0.44, 0.04, 0.3), ['#5a6070', '#8a8f9e'][i % 2], 0, 0.3 + i * 0.25, 0.1, cab, 2); mesh(rbox(0.3, 0.12, 0.02), i % 2 ? '#1f6a3a' : '#2f6fe0', 0, 0.38 + i * 0.25, 0.24, cab, 1.5); }
    // logic tray pulled out onto the bench, the memory chip glowing
    const tray = new THREE.Group(); tray.position.set(0.25, 0.94, 0.05); b.add(tray); G.userData.tray = tray; mesh(rbox(0.9, 0.05, 0.6, 0.01), '#9aa0ae', 0, 0.025, 0, tray, 3);
    const pcb = new THREE.Mesh(new THREE.PlaneGeometry(0.82, 0.52), toon('#ffffff', { map: pcbTex })); pcb.rotation.x = -Math.PI / 2; pcb.position.y = 0.054; pcb.userData.noOutline = true; tray.add(pcb);
    const chip = mesh(rbox(0.16, 0.035, 0.07, 0.006), '#14121a', 0.12, 0.07, 0.08, tray, 2.5); G.userData.chip = chip; for (let i = 0; i < 8; i++) for (const s of [-1, 1]) mesh(rbox(0.008, 0.01, 0.02), '#c9ccd6', 0.12 - 0.07 + i * 0.02, 0.06, 0.08 + s * 0.045, tray, 0);
    { const tc = textCanvas(256, 96, (x, w, hh) => { x.fillStyle = '#f4efe4'; x.fillRect(0, 0, w, hh); x.fillStyle = '#14121a'; x.font = '900 40px monospace'; x.textAlign = 'center'; x.fillText('GAME', w / 2, 42); x.fillText('CODE', w / 2, 84); }); tc.update(); const lb = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 0.034), basic('#ffffff', { map: tc.t })); lb.rotation.x = -Math.PI / 2; lb.position.set(0.12, 0.089, 0.08); lb.userData.noOutline = true; tray.add(lb); }
    G.userData.chipGlow = glow(tray, 0.12, 0.12, 0.08, '#3ff07a', 0.5, 0);
    // chip reader + laptop with the hex dump
    mesh(rbox(0.3, 0.08, 0.2, 0.02), '#2a2a30', 0.85, 0.98, 0.2, b, 2.5); mesh(cyl(0.008, 0.008, 0.5, 4).rotateZ(1.2), '#14121a', 0.62, 0.99, 0.16, b, 0);
    const lap = new THREE.Group(); lap.position.set(0.95, 0.94, -0.12); lap.rotation.y = -0.35; b.add(lap); mesh(rbox(0.6, 0.025, 0.4, 0.01), '#3a3e48', 0, 0.012, 0, lap, 3); const lid = new THREE.Group(); lid.position.set(0, 0.025, -0.2); lid.rotation.x = -0.25; lap.add(lid); mesh(rbox(0.6, 0.4, 0.02, 0.01), '#3a3e48', 0, 0.2, 0, lid, 3);
    const tc = textCanvas(640, 420, () => {}); SCR.lap = tc; const lp = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.36), basic('#ffffff', { map: tc.t })); lp.position.set(0, 0.2, 0.012); lp.userData.noOutline = true; lid.add(lp);
    for (let i = 0; i < 6; i++) mesh(rbox(0.05, 0.02, 0.02), ['#d7263d', '#ffcf3f', '#2f6fe0'][i % 3], -0.3 + i * 0.07, 0.96, 0.38, b, 1); mesh(rbox(0.2, 0.04, 0.12), '#ffcf3f', -0.2, 0.96, 0.35, b, 2);
  }
  for (const fx of [-3.6, -3.0]) { mesh(rbox(0.55, 1.3, 0.6, 0.02), '#5a6070', fx, 0.65, 3.4, G, 4); for (let k = 0; k < 3; k++) mesh(rbox(0.2, 0.03, 0.03), '#c9ccd6', fx, 1.1 - k * 0.4, 3.08, G, 1.5); }
  mesh(rbox(0.35, 1.0, 0.35), '#e8eef8', x0 + 0.3, 0.5, 2.6, G, 3.5); mesh(cyl(0.16, 0.16, 0.45, 14), toon('#7fc8ff', { transparent: true, opacity: 0.8 }), x0 + 0.3, 1.24, 2.6, G, 3);
}
const HCARD = { eng1: makeCard(HQ, 'engineer', 1.74), eng2: makeCard(HQ, 'engineer2', 1.66), agentM: makeCard(HQ, 'agentM'), agentF: makeCard(HQ, 'agentF') };
