// =====================================================================================================
// OFFICE: an ordinary company at night, the moment ransomware hits. Open-plan floor, two benches of desks with
// monitors facing the camera side, a wall of windows onto the city, a server rack, kitchen corner, plants.
// Monitors flip from the blue desktop to the red ransom screen one by one (OFFICE.userData.mons).
// =====================================================================================================
const DESK_TEX = canvasTex(512, 320, (x, w, h) => { const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#2f7fe0'); g.addColorStop(1, '#5fd0ff'); x.fillStyle = g; x.fillRect(0, 0, w, h);
  x.fillStyle = 'rgba(255,255,255,.9)'; for (let k = 0; k < 4; k++) { x.fillRect(22, 24 + k * 58, 44, 36); } x.fillStyle = '#ffffff'; x.beginPath(); x.roundRect(110, 40, 360, 220, 12); x.fill(); x.fillStyle = '#2f6fe0'; x.fillRect(110, 40, 360, 30);
  x.fillStyle = '#c9ccd6'; for (let k = 0; k < 6; k++) x.fillRect(130, 90 + k * 26, 300 - (k * 53 % 120), 12); x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(0, h - 26, w, 26); });
SCR.ransom = textCanvas(512, 320, () => {});
const DESK_MAT = basic('#ffffff', { map: DESK_TEX, toneMapped: false }), RANSOM_MAT = basic('#ffffff', { map: SCR.ransom.t, toneMapped: false });
{ const G = OFFICE, U = G.userData, x0 = -7, x1 = 7, z0 = -5, z1 = 6, h = 3.2;
  const carpet = canvasTex(512, 512, (x, w, hh) => { const r = rng(15); x.fillStyle = '#3d4a66'; x.fillRect(0, 0, w, hh); for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) { x.fillStyle = `hsl(222,${20 + r() * 6}%,${30 + r() * 5}%)`; x.fillRect(i * 64 + 1, j * 64 + 1, 62, 62); } for (let i = 0; i < 3000; i++) { x.fillStyle = `rgba(255,255,255,${r() * 0.04})`; x.fillRect(r() * w, r() * hh, 2, 2); } }, true);
  const wallM = toon('#ffffff', { map: canvasTex(512, 512, (x, w, hh) => { x.fillStyle = '#e6e1d6'; x.fillRect(0, 0, w, hh); x.fillStyle = '#d0c9ba'; x.fillRect(0, hh * 0.72, w, hh * 0.28); x.fillStyle = '#b8b09e'; x.fillRect(0, hh * 0.71, w, 6); const r = rng(9); for (let i = 0; i < 1500; i++) { x.fillStyle = `rgba(0,0,0,${r() * 0.04})`; x.fillRect(r() * w, r() * hh, 2, 2); } }, true) });
  shell(G, { x0, x1, z0, z1, h, wall: wallM, floor: toon('#ffffff', { map: carpet, roughness: 0.95 }), ceil: '#d8d6d0', skip: ['back'] });
  // window wall: x -6.2..6.2, sill 0.8, head 2.75, mullions every 1.55 m
  windowWallX(G, wallM, x0, x1, z0, h, -6.2, 6.2, 0.8, 2.75);
  { const fr = toon('#2a2e3a', { roughness: 0.45, metalness: 0.3 }); mesh(rbox(12.5, 0.08, 0.14), fr, 0, 0.78, z0, G, 0); mesh(rbox(12.5, 0.08, 0.14), fr, 0, 2.77, z0, G, 0);
    for (let k = 0; k <= 8; k++) mesh(rbox(0.07, 2.0, 0.14), fr, -6.2 + k * 1.55, 1.78, z0, G, 0); mesh(rbox(12.5, 0.04, 0.35), '#c9c2b2', 0, 0.76, z0 + 0.18, G, 0);
    // blinds half down on two windows
    for (const bx of [-4.65, 3.1]) for (let k = 0; k < 9; k++) mesh(rbox(1.48, 0.012, 0.05, 0.004), '#e8e4da', bx + 0.775, 2.7 - k * 0.07, z0 + 0.1, G, 0).rotation.x = 0.6; }
  // outside: the city at night
  { const O = new THREE.Group(); O.position.set(0, 0, z0); G.add(O);
    const sky = new THREE.Mesh(new THREE.SphereGeometry(90, 32, 16, Math.PI * 0.75, Math.PI * 1.5), basic('#ffffff', { map: canvasTex(1024, 512, (x, w, hh) => { const g = x.createLinearGradient(0, 0, 0, hh); g.addColorStop(0, '#0a0f2e'); g.addColorStop(0.36, '#1f2a6a'); g.addColorStop(0.47, '#5a3f8a'); g.addColorStop(0.52, '#c86a7a'); g.addColorStop(0.6, '#2a2a4a'); g.addColorStop(1, '#1a1a2a'); x.fillStyle = g; x.fillRect(0, 0, w, hh); const r = rng(3); for (let i = 0; i < 160; i++) { x.fillStyle = `rgba(255,255,255,${r() * 0.8})`; x.fillRect(r() * w, r() * hh * 0.4, 2, 2); } }), side: THREE.BackSide, fog: false }));
    sky.userData.noOutline = true; O.add(sky);
    plane(O, 200, 100, toon('#1c1e2a'), 0, -0.6, -50, -Math.PI / 2);
    const cols = ['#3a4466', '#4a3f66', '#2f4a5e', '#55506e', '#3f5a6e'];
    [[-16, -18, 10, 30, 8], [-5, -24, 12, 44, 9], [8, -20, 9, 26, 8], [18, -26, 12, 50, 10], [-28, -30, 14, 38, 10], [30, -34, 14, 34, 10], [0, -40, 16, 60, 12], [-14, -46, 12, 52, 10], [14, -48, 12, 42, 10]].forEach(([bx, bz, w, hh, d], i) => block(O, bx, bz, w, hh, d, cols[i % 5], 20 + i, i % 3 ? '#ffd27a' : '#9fd8ff'));
    for (const [bx, bz, hh] of [[-5, -24, 44], [18, -26, 50], [0, -40, 60]]) { const l = glow(O, bx, hh + 1.2, bz, '#ff3b4a', 2.2, 0.9); l.userData.blink = true; }
    O.add(new THREE.HemisphereLight('#6a7ad8', '#20203a', 0.8)); U.outside = O; }
  // ceiling: light panels, a couple of air vents
  for (const lx of [-4.5, 0, 4.5]) for (const lz of [-2.5, 1, 4]) { mesh(rbox(1.2, 0.04, 0.6, 0.01), '#d9dce4', lx, h - 0.03, lz, G, 0); const p = mesh(new THREE.PlaneGeometry(1.1, 0.5), basic('#fff7e6'), lx, h - 0.055, lz, G, 0); p.rotation.x = Math.PI / 2; p.userData.noOutline = true; }
  for (const [lx, lz] of [[-3.5, -1.5], [3.5, -1.5], [0, 3]]) { const p = new THREE.PointLight('#fff0dc', 7, 9, 1.4); p.position.set(lx, h - 0.4, lz); G.add(p); }
  G.add(new THREE.HemisphereLight('#c8d0ff', '#3a3048', 0.75));
  const key = new THREE.DirectionalLight('#dfe6ff', 0.9); key.position.set(4, 6, 6); key.target.position.set(0, 0, 0); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 30 }); key.shadow.bias = -0.0004; G.add(key, key.target);
  U.redLight = new THREE.PointLight('#ff2a3a', 0, 12, 1.2); U.redLight.position.set(0, 1.8, 0.5); G.add(U.redLight);
  // two benches of desks (desk tops y 0.74); monitors face +z
  U.mons = []; U.chairs = []; const deskCols = ['#d9c4a0', '#e2cfae'];
  for (const [bz, row] of [[-2.2, 0], [1.2, 1]]) {
    mesh(rbox(10.4, 0.05, 1.5, 0.02), deskCols[row], 0, 0.74, bz, G, 0); for (const lx of [-5.1, -1.7, 1.7, 5.1]) for (const s of [-1, 1]) mesh(rbox(0.05, 0.72, 0.05, 0.01), '#4a4f5c', lx, 0.36, bz + s * 0.68, G, 0);
    mesh(rbox(10.4, 0.36, 0.03, 0.01), '#8fa3c0', 0, 0.94, bz, G, 0); // privacy screen down the middle
    for (let k = 0; k < 6; k++) { const mx0 = -4.3 + k * 1.72;
      for (const side of [1, -1]) { // each bench has desks on both sides of the screen
        const mz = bz + side * 0.38, m = monitor(G, mx0 - 0.12, 0.765, mz - side * 0.12, side > 0 ? 0 : Math.PI, 0.56, 0.34, DESK_MAT); m.userData.idx = U.mons.length; m.userData.side = side; U.mons.push(m);
        if (side > 0 || row === 1) { mesh(rbox(0.42, 0.015, 0.15, 0.005), '#2a2c36', mx0 - 0.12, 0.775, mz + side * 0.2, G, 0); mesh(rbox(0.07, 0.02, 0.1, 0.01), '#2a2c36', mx0 + 0.25, 0.775, mz + side * 0.2, G, 0); }
        const r = rng(k * 7 + row * 3 + (side > 0 ? 1 : 2)); if (r() < 0.6) mesh(cyl(0.04, 0.035, 0.1, 12), ['#ffffff', '#d7263d', '#2f7fe0', '#ffcf3f'][Math.floor(r() * 4)], mx0 + 0.45, 0.815, mz, G, 0);
        if (r() < 0.5) for (let q = 0; q < 3; q++) mesh(rbox(0.22, 0.006, 0.3), '#f4efe4', mx0 + 0.5, 0.77 + q * 0.007, mz - side * 0.1, G, 0);
        if (r() < 0.3) pottedPlant(G, mx0 + 0.55, mz - side * 0.2, 0.3, '#3fae5a').position.y = 0.765; } }
    // chairs pushed back on the camera side of the front bench, both sides of the back bench (empty: everyone is up)
    for (let k = 0; k < 6; k++) for (const side of [1, -1]) { if (row === 0 && side < 0) continue; const c = chair(G, -4.3 + k * 1.72 + (k % 2 ? 0.15 : -0.1), bz + side * 1.25, side > 0 ? Math.PI + (k % 3 - 1) * 0.5 : (k % 3 - 1) * 0.4, ['#2f4f6e', '#3a3550', '#1d1a26'][k % 3]); U.chairs.push(c); } }
  // server rack on the right wall (red LEDs once it hits), filing cabinets, a whiteboard, the company sign, a clock
  U.rack = rack(G, 6.4, -3.6, -Math.PI / 2); rack(G, 6.4, -2.7, -Math.PI / 2);
  for (const z of [3.8, 4.4, 5.0]) filingCab(G, 6.6, z, -Math.PI / 2, '#8a909e');
  { const wb = new THREE.Group(); wb.position.set(x0 + 0.04, 1.6, 2.6); wb.rotation.y = Math.PI / 2; G.add(wb); mesh(rbox(2.4, 1.2, 0.04, 0.01), '#c9ccd6', 0, 0, 0, wb, 0);
    painted(wb, 2.3, 1.1, 512, 256, (c, w, hh) => { c.fillStyle = '#fbfbf8'; c.fillRect(0, 0, w, hh); c.strokeStyle = '#2f6fe0'; c.lineWidth = 5; c.font = '700 30px Poppins'; c.fillStyle = '#2f6fe0'; c.fillText('Q4 SHIPMENTS', 24, 46); c.beginPath(); c.moveTo(30, 220); c.lineTo(140, 160); c.lineTo(250, 180); c.lineTo(380, 90); c.lineTo(480, 70); c.stroke(); c.fillStyle = '#d7263d'; c.fillText('DEADLINE FRI!', 280, 230); }, 0, 0, 0.025); }
  painted(G, 3.2, 0.7, 1024, 224, (c, w, hh) => { c.clearRect(0, 0, w, hh); c.fillStyle = '#2f6f74'; c.font = '900 120px Poppins'; c.textAlign = 'center'; c.fillText('NORTHGATE', w / 2 - 80, 140); c.fillStyle = '#e07a4a'; c.font = '800 56px Poppins'; c.fillText('FREIGHT CO.', w / 2 + 300, 200); c.fillStyle = '#e07a4a'; c.beginPath(); c.moveTo(70, 40); c.lineTo(150, 100); c.lineTo(70, 160); c.fill(); }, x0 + 0.03, 2.55, -1.6, Math.PI / 2, { alpha: true });
  U.clock = wallClock(G, x1 - 0.04, 2.5, 0.4, -Math.PI / 2);
  // kitchen corner front-left: counter, coffee machine, fridge
  mesh(rbox(0.65, 0.9, 2.2, 0.03), '#f4f1ea', x0 + 0.35, 0.45, 4.6, G, 0); mesh(rbox(0.7, 0.04, 2.25, 0.01), '#4a4f5c', x0 + 0.35, 0.92, 4.6, G, 0); mesh(rbox(0.3, 0.38, 0.3, 0.03), '#14121a', x0 + 0.35, 1.13, 4.1, G, 0); mesh(rbox(0.7, 1.9, 0.7, 0.04), '#d9dce4', x0 + 0.37, 0.95, 3.1, G, 0);
  waterCooler(G, 6.5, 2.0); pottedPlant(G, -6.4, -4.4, 1.1); pottedPlant(G, 6.3, -4.4, 1.0, '#3a6fb0'); pottedPlant(G, -6.4, 0.2, 0.9, '#e07a4a');
  printer(G, 6.5, 0.9, 1.0, -Math.PI / 2); mesh(rbox(0.6, 0.9, 0.7, 0.03), '#c9ccd6', 6.55, 0.45, 1.0, G, 0);
}
const FCARD_O = {}; // filled in i_states (cards are made there so all kinds are in one place)
