// =====================================================================================================
// HALL: the underground centrifuge hall at Natanz (stylised). Four cascades of tall white centrifuges under
// colour-coded header pipes, a bridge crane, the frequency-converter cabinets along the left wall, an
// engineering laptop on a cart, and the control room behind a glass wall at the front (z 6..11).
// =====================================================================================================
const CF = { rows: [], hero: [] }; // centrifuge instances: {x, z, ph, amp}
{ const G = HALL, U = G.userData, X0 = -13, X1 = 13, Z0 = -26, Z1 = 6, H = 7;
  const conc = canvasTex(512, 512, (x, w, h) => { const r = rng(19); x.fillStyle = '#c9c6bf'; x.fillRect(0, 0, w, h); for (let i = 0; i < 4000; i++) { x.fillStyle = `rgba(${r() < 0.5 ? 60 : 255},${r() < 0.5 ? 60 : 255},${r() < 0.5 ? 60 : 255},${r() * 0.06})`; x.fillRect(r() * w, r() * h, 3, 3); }
    x.strokeStyle = 'rgba(0,0,0,.12)'; x.lineWidth = 2; for (let j = 0; j <= 4; j++) { x.beginPath(); x.moveTo(0, j * 128); x.lineTo(w, j * 128); x.stroke(); } for (let i = 0; i <= 2; i++) { x.beginPath(); x.moveTo(i * 256, 0); x.lineTo(i * 256, h); x.stroke(); }
    x.fillStyle = 'rgba(0,0,0,.18)'; for (let j = 0; j < 4; j++) for (let i = 0; i < 2; i++) { x.beginPath(); x.arc(i * 256 + 30, j * 128 + 30, 4, 0, 7); x.fill(); } }, true);
  const wallM = toon('#ffffff', { map: conc, roughness: 0.9 });
  const floorT = canvasTex(1024, 1024, (x, w, h) => { const r = rng(3); x.fillStyle = '#7f93a8'; x.fillRect(0, 0, w, h); for (let i = 0; i < 6000; i++) { x.fillStyle = `rgba(255,255,255,${r() * 0.05})`; x.fillRect(r() * w, r() * h, 3, 3); } x.strokeStyle = 'rgba(30,40,60,.25)'; x.lineWidth = 3; for (let k = 0; k <= 8; k++) { x.beginPath(); x.moveTo(k * 128, 0); x.lineTo(k * 128, h); x.stroke(); x.beginPath(); x.moveTo(0, k * 128); x.lineTo(w, k * 128); x.stroke(); } }, true);
  const sh0 = shell(G, { x0: X0, x1: X1, z0: Z0, z1: Z1, h: H, wall: wallM, floor: toon('#ffffff', { map: floorT, roughness: 0.45 }), ceil: '#8a8d96', skip: ['front'] });
  sh0.floor.material.map.repeat.set(4, 5);
  // front wall (z = Z1) with the control-room window (x -5..5, y 1.0..2.7) and a door (x 6..7.2)
  windowWallX(G, wallM, X0, X1, Z1, H, -5, 5, 1.0, 2.7, Math.PI);
  { const fr = toon('#3a3e48', { roughness: 0.5 }); mesh(rbox(10.2, 0.14, 0.3), fr, 0, 0.95, Z1, G, 0); mesh(rbox(10.2, 0.14, 0.3), fr, 0, 2.75, Z1, G, 0); for (let fx = -5; fx <= 5.01; fx += 2.5) mesh(rbox(0.12, 1.9, 0.3), fr, fx, 1.85, Z1, G, 0);
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(10, 1.7), new THREE.MeshBasicMaterial({ color: '#bfe6ff', transparent: true, opacity: 0.1, depthWrite: false, side: THREE.DoubleSide })); glass.position.set(0, 1.85, Z1); glass.userData.noOutline = true; G.add(glass); }
  // pilasters and angular ceiling beams
  for (let z = Z0 + 2; z < Z1; z += 4) for (const s of [-1, 1]) { mesh(rbox(0.6, H, 0.7, 0.03), '#b9b6ae', s * (X1 - 0.3), H / 2, z, G, 0); }
  for (let z = Z0 + 2; z < Z1; z += 4) { mesh(rbox(26, 0.7, 0.6, 0.03), '#a8a59e', 0, H - 0.35, z, G, 0); for (const s of [-1, 1]) { const k = mesh(rbox(1.4, 0.2, 0.6), '#a8a59e', s * (X1 - 1.0), H - 0.95, z, G, 0); k.rotation.z = s * 0.6; } }
  // crane rails + yellow bridge crane with a hoist
  for (const s of [-1, 1]) mesh(rbox(0.4, 0.35, 32), '#5a6272', s * (X1 - 0.8), 5.6, -10, G, 0);
  { const cr = new THREE.Group(); cr.position.set(0, 5.95, -11); G.add(cr); U.crane = cr; const yel = toon('#f2b51d', { roughness: 0.45 });
    for (const dz of [-0.45, 0.45]) mesh(rbox(24.6, 0.7, 0.35, 0.03), yel, 0, 0, dz, cr, 0); for (let x = -11; x <= 11; x += 1.2) mesh(rbox(0.06, 0.6, 0.9), '#c98d10', x, 0, 0, cr, 0);
    const hst = mesh(rbox(1.2, 0.6, 1.3, 0.05), '#3a3e48', 3, -0.55, 0, cr, 0); mesh(cyl(0.02, 0.02, 2.4, 6), '#2a2a30', 3, -2.0, 0, cr, 0); mesh(rbox(0.3, 0.3, 0.2, 0.03), yel, 3, -3.2, 0, cr, 0); mesh(new THREE.TorusGeometry(0.14, 0.04, 8, 16, 4.4), '#3a3e48', 3, -3.45, 0, cr, 0);
    const stripes = canvasTex(256, 32, (x, w, h) => { for (let i = -2; i < 12; i++) { x.fillStyle = i % 2 ? '#14121a' : '#f2b51d'; x.beginPath(); x.moveTo(i * 32, h); x.lineTo(i * 32 + 32, 0); x.lineTo(i * 32 + 64, 0); x.lineTo(i * 32 + 32, h); x.fill(); } }, true); stripes.repeat.set(12, 1);
    plane(cr, 24, 0.16, basic('#ffffff', { map: stripes }), 0, -0.2, 0.63); }
  // lights: strip fixtures down each aisle, cool hemisphere + key lights
  G.add(new THREE.HemisphereLight('#eef4ff', '#5a6070', 1.0));
  const key = new THREE.DirectionalLight('#ffffff', 1.4); key.position.set(4, 14, 8); key.target.position.set(0, 0, -6); key.castShadow = true; key.shadow.mapSize.set(4096, 4096); Object.assign(key.shadow.camera, { left: -16, right: 16, top: 18, bottom: -18, near: 1, far: 40 }); key.shadow.bias = -0.0004; key.shadow.normalBias = 0.03; G.add(key, key.target);
  for (const lx of [-7.05, -2.3, 2.3, 7.05]) for (let z = Z0 + 3; z < Z1 - 1; z += 3.2) { mesh(rbox(0.25, 0.08, 2.4, 0.02), '#3a3e48', lx, 4.6, z, G, 0); mesh(new THREE.PlaneGeometry(0.18, 2.3), basic('#f4fbff'), lx, 4.555, z, G, 0).rotation.x = Math.PI / 2; for (const s of [-1, 1]) mesh(cyl(0.008, 0.008, 2.0, 4), '#2a2a30', lx, 5.6, z + s * 1.0, G, 0); }
  for (const [lx, lz, c, i] of [[-7, -2, '#f4f8ff', 8], [7, -2, '#f4f8ff', 8], [0, -14, '#f4f8ff', 8], [-7, -18, '#fff2dc', 6], [7, -18, '#fff2dc', 6], [0, 3, '#fff2dc', 6]]) { const p = new THREE.PointLight(c, i, 14, 1.3); p.position.set(lx, 4.2, lz); G.add(p); }
  // ---- the cascades: 4 cascades x 2 rows of centrifuges, instanced so they can all wobble
  const CASC = [-9.4, -4.6, 4.6, 9.4], ZS = []; for (let z = -24; z <= 3.3; z += 0.62) ZS.push(z);
  { const r = rng(5); for (const cx of CASC) for (const dx of [-0.42, 0.42]) for (const z of ZS) { const isHero = cx === -4.6 && dx === 0.42 && z > 2.6; if (isHero) continue; CF.rows.push({ x: cx + dx, z, ph: r() * 6.28, amp: 0.6 + r() * 0.8, w: 7 + r() * 5 }); } }
  const N = CF.rows.length;
  const casingMat = toon('#eef1f6', { roughness: 0.32, metalness: 0.35 }), bandMat = toon('#2f7fe0', { roughness: 0.4 }), capMat = toon('#4a5262', { roughness: 0.4, metalness: 0.5 });
  const parts = [[cyl(0.13, 0.13, 1.66, 20).translate(0, 0.06 + 0.83, 0), casingMat], [cyl(0.136, 0.136, 0.1, 20).translate(0, 1.5, 0), bandMat], [cyl(0.136, 0.136, 0.05, 20).translate(0, 0.32, 0), bandMat],
    [cyl(0.11, 0.13, 0.12, 20).translate(0, 1.78, 0), capMat], [cyl(0.025, 0.025, 0.4, 8).translate(0, 2.03, 0), capMat], [cyl(0.05, 0.05, 0.04, 10).translate(0, 1.88, 0), toon('#d7263d')]];
  U.cfMeshes = parts.map(([geo, mat]) => { const m = new THREE.InstancedMesh(geo, mat, N); m.castShadow = true; m.receiveShadow = true; m.userData.noOutline = true; G.add(m); return m; });
  { const base = new THREE.InstancedMesh(rbox(0.36, 0.06, 0.36, 0.01), DSTEEL, N); const d = new THREE.Object3D(); CF.rows.forEach((c, i) => { d.position.set(c.x, 0.03, c.z); d.updateMatrix(); base.setMatrixAt(i, d.matrix); }); base.receiveShadow = true; G.add(base); }
  // overhead frames + header pipes per cascade, painted floor bays
  const pipeCols = ['#f2b51d', '#2f7fe0', '#9aa2b0'];
  for (const cx of CASC) { const zA = -24.6, zB = 4.0, L = zB - zA, zc = (zA + zB) / 2;
    for (let z = zA; z <= zB + 0.01; z += 3.6) for (const s of [-1, 1]) mesh(rbox(0.1, 2.7, 0.1, 0.01), DSTEEL, cx + s * 0.95, 1.35, z, G, 0);
    for (const s of [-1, 1]) mesh(rbox(0.1, 0.12, L), DSTEEL, cx + s * 0.95, 2.7, zc, G, 0); for (let z = zA; z <= zB + 0.01; z += 3.6) mesh(rbox(2.0, 0.1, 0.1), DSTEEL, cx, 2.7, z, G, 0);
    pipeCols.forEach((col, k) => mesh(cyl(0.06, 0.06, L, 12).rotateX(Math.PI / 2), toon(col, { roughness: 0.4, metalness: 0.2 }), cx - 0.22 + k * 0.22, 2.38, zc, G, 0));
    for (let z = zA + 1.8; z < zB; z += 3.6) { const v = mesh(new THREE.TorusGeometry(0.1, 0.022, 6, 16), '#d7263d', cx - 0.22, 2.38, z, G, 0); v.rotation.y = Math.PI / 2; v.position.x -= 0.09; mesh(cyl(0.012, 0.012, 0.09, 6).rotateZ(Math.PI / 2), '#d7263d', cx - 0.27, 2.38, z, G, 0); }
    // floor bay: yellow border lines
    for (const s of [-1, 1]) plane(G, 0.08, L, basic('#f2b51d'), cx + s * 1.2, 0.006, zc, -Math.PI / 2);
    // cascade sign hanging from the frame
    const t = canvasTex(256, 96, (x, w, h) => { x.fillStyle = '#14213d'; x.fillRect(0, 0, w, h); x.strokeStyle = '#f2b51d'; x.lineWidth = 6; x.strokeRect(3, 3, w - 6, h - 6); x.fillStyle = '#fff'; x.font = '900 44px Poppins'; x.textAlign = 'center'; x.fillText('CASCADE ' + 'ABCD'[CASC.indexOf(cx)], w / 2, 64); });
    plane(G, 1.2, 0.45, basic('#ffffff', { map: t, side: THREE.DoubleSide }), cx, 3.1, zB, 0, 0).userData.noOutline = true; }
  { const conn = new THREE.InstancedMesh(cyl(0.018, 0.018, 0.36, 6), capMat, N); const d = new THREE.Object3D(); CF.rows.forEach((c, i) => { const cx = c.x < 0 ? (c.x < -7 ? -9.4 : -4.6) : (c.x > 7 ? 9.4 : 4.6); d.position.set(c.x + (cx - c.x) * 0.3, 2.3, c.z); d.rotation.set(0, 0, (c.x < cx ? -1 : 1) * 0.55); d.updateMatrix(); conn.setMatrixAt(i, d.matrix); }); G.add(conn); }
  // the hero centrifuge (front of cascade B): built from six casing shards so it can burst
  { const hg = new THREE.Group(); hg.position.set(-4.18, 0, 3.15); G.add(hg); U.hero = hg; mesh(rbox(0.36, 0.06, 0.36, 0.01), DSTEEL, 0, 0.03, 0, hg, 0);
    const rotor = mesh(cyl(0.085, 0.085, 1.6, 16), toon('#2a2e38', { metalness: 0.6, roughness: 0.35 }), 0, 0.92, 0, hg, 0); U.rotor = rotor;
    U.shards = []; for (let i = 0; i < 6; i++) { const sg = new THREE.Group(); sg.position.set(0, 0.89, 0); hg.add(sg); const geo = new THREE.CylinderGeometry(0.13, 0.13, 1.66, 6, 1, true, i * Math.PI / 3, Math.PI / 3); const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: '#eef1f6', roughness: 0.32, metalness: 0.35, side: THREE.DoubleSide })); sg.add(m);
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.137, 0.137, 0.1, 6, 1, true, i * Math.PI / 3, Math.PI / 3), new THREE.MeshStandardMaterial({ color: '#2f7fe0', side: THREE.DoubleSide })); b.position.y = 0.61; sg.add(b); U.shards.push(sg); }
    const cap = new THREE.Group(); cap.position.set(0, 1.78, 0); hg.add(cap); mesh(cyl(0.11, 0.13, 0.12, 20), capMat, 0, 0, 0, cap, 0); mesh(cyl(0.025, 0.025, 0.4, 8), capMat, 0, 0.25, 0, cap, 0); mesh(cyl(0.05, 0.05, 0.04, 10), '#d7263d', 0, 0.1, 0, cap, 0); U.cap = cap;
    U.sparks = Array.from({ length: 26 }, (_, i) => glow(G, 0, -20, 0, i % 3 ? '#ffcf3f' : '#ff7a14', 0.12, 0.95));
    U.smoke = Array.from({ length: 10 }, (_, i) => { const s = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 0), new THREE.MeshStandardMaterial({ color: i % 2 ? '#c4c9d4' : '#aeb4c2', flatShading: true, roughness: 0.9, transparent: true, opacity: 0, depthWrite: false })); s.rotation.set(i, i * 1.7, i * 0.4); s.userData.noOutline = true; G.add(s); return s; }); // faceted low-poly puffs, not soft sprites
    U.flash = new THREE.PointLight('#ffb060', 0, 8, 1.5); U.flash.position.set(-4.18, 1.4, 3.4); G.add(U.flash); }
  // ---- frequency-converter cabinets along the left wall, all showing the drive frequency
  { const drv = textCanvas(256, 128, () => {}); SCR.drive = drv; U.cabLeds = [];
    const vent = canvasTex(128, 256, (x, w, h) => { x.fillStyle = '#d4d8de'; x.fillRect(0, 0, w, h); x.fillStyle = '#9aa2b0'; for (let j = 0; j < 10; j++) x.fillRect(16, 150 + j * 10, w - 32, 5); x.fillStyle = '#e8ecf0'; x.fillRect(8, 8, w - 16, 120); });
    for (let z = -22; z <= 3.5; z += 1.25) { const c = new THREE.Group(); c.position.set(X0 + 0.45, 0, z); c.rotation.y = Math.PI / 2; G.add(c);
      mesh(rbox(1.15, 2.1, 0.6, 0.02), '#d4d8de', 0, 1.05, 0, c, 0); mesh(rbox(1.17, 0.12, 0.62), '#8a92a0', 0, 2.16, 0, c, 0); mesh(rbox(0.02, 1.9, 0.02), '#8a92a0', 0, 1.05, 0.31, c, 0);
      for (const s of [-1, 1]) { const f = plane(c, 0.52, 1.0, toon('#ffffff', { map: vent }), s * 0.29, 0.75, 0.302); f.userData.noOutline = true; mesh(rbox(0.04, 0.16, 0.03), '#3a3e48', s * 0.08, 1.3, 0.32, c, 0); }
      const d = plane(c, 0.34, 0.17, basic('#ffffff', { map: drv.t }), -0.29, 1.62, 0.305); d.userData.noOutline = true;
      for (let k = 0; k < 3; k++) { const l = mesh(sph(0.025, 8), basic(['#3ff07a', '#ffcf3f', '#d7263d'][k]), 0.18 + k * 0.08, 1.62, 0.31, c, 0); l.userData.k = k; U.cabLeds.push(l); }
      const lab = canvasTex(256, 48, (x, w, h) => { x.fillStyle = '#14213d'; x.fillRect(0, 0, w, h); x.fillStyle = '#fff'; x.font = '800 26px Poppins'; x.textAlign = 'center'; x.fillText('DRIVE ' + (Math.round((z + 22) / 1.25) + 1), w / 2, 34); }); plane(c, 0.4, 0.075, basic('#ffffff', { map: lab }), 0.29, 1.95, 0.305).userData.noOutline = true;
      mesh(cyl(0.05, 0.05, H - 2.2, 8), '#5a6272', 0.4, 2.2 + (H - 2.2) / 2, -0.1, c, 0); }
    // cable trays from the cabinets to the cascades, high on the wall
    mesh(rbox(0.6, 0.08, 27), '#8a92a0', X0 + 0.9, 3.8, -9, G, 0); for (let z = -22; z <= 4; z += 0.5) mesh(rbox(0.5, 0.06, 0.12), ['#2a2a30', '#d7263d', '#2f6fe0'][Math.abs(Math.round(z * 2)) % 3], X0 + 0.9, 3.86, z, G, 0); }
  // ---- the engineering laptop on a cart (with a USB stick in it), the PLC cabinet beside it
  { const cart = new THREE.Group(); cart.position.set(-10.4, 0, 4.3); cart.rotation.y = 0.5; G.add(cart); U.cart = cart;
    mesh(rbox(0.9, 0.05, 0.6, 0.02), '#3a3e48', 0, 0.9, 0, cart, 0); mesh(rbox(0.86, 0.04, 0.56, 0.02), '#3a3e48', 0, 0.25, 0, cart, 0); for (const [a, b] of [[-0.4, -0.25], [0.4, -0.25], [-0.4, 0.25], [0.4, 0.25]]) { mesh(cyl(0.02, 0.02, 0.85, 6), '#9aa2b0', a, 0.5, b, cart, 0); mesh(sph(0.04, 8), '#14121a', a, 0.04, b, cart, 0); }
    mesh(rbox(0.38, 0.02, 0.26, 0.01), '#2a2e38', 0, 0.935, 0.02, cart, 0); const lid = new THREE.Group(); lid.position.set(0, 0.945, -0.11); lid.rotation.x = -0.25; cart.add(lid); mesh(rbox(0.38, 0.26, 0.012, 0.01), '#2a2e38', 0, 0.13, 0, lid, 0);
    const lp = textCanvas(512, 340, () => {}); SCR.laptop = lp; const s = plane(lid, 0.35, 0.23, basic('#ffffff', { map: lp.t }), 0, 0.13, 0.008); s.userData.noOutline = true; glow(cart, 0, 1.1, 0.0, '#5fd0ff', 0.6, 0.25);
    U.cartStick = usbStick(cart, 1.3); U.cartStick.position.set(0.24, 0.94, 0.02); U.cartStick.rotation.y = 0;
    const plc = new THREE.Group(); plc.position.set(-12.3, 0, 5.2); plc.rotation.y = Math.PI / 2 - 0.4; G.add(plc); mesh(rbox(1.0, 2.0, 0.55, 0.02), '#c9ccd6', 0, 1.0, 0, plc, 0);
    const mod = canvasTex(512, 512, (x, w, h) => { x.fillStyle = '#2a2e38'; x.fillRect(0, 0, w, h); for (let j = 0; j < 3; j++) { x.fillStyle = '#9aa2b0'; x.fillRect(20, 30 + j * 160, w - 40, 8); for (let i = 0; i < 8; i++) { x.fillStyle = i === 0 ? '#2f9a5a' : '#5a6272'; x.fillRect(24 + i * 58, 46 + j * 160, 52, 120); x.fillStyle = i % 3 ? '#3ff07a' : '#ffcf3f'; x.fillRect(34 + i * 58, 56 + j * 160, 8, 8); x.fillStyle = '#d4d8de'; x.fillRect(34 + i * 58, 80 + j * 160, 32, 60); } } });
    plane(plc, 0.88, 1.6, basic('#ffffff', { map: mod }), 0, 1.05, 0.278).userData.noOutline = true; const door = new THREE.Group(); door.position.set(0.5, 0, 0.28); plc.add(door); door.rotation.y = 1.9; mesh(rbox(1.0, 1.95, 0.03, 0.01), '#c9ccd6', -0.5, 1.0, 0, door, 0); }
  // ---- wall dressing: radiation signs, a giant painted cascade map, fire point, piping along the back
  { const tre = canvasTex(256, 300, (x, w, h) => { x.fillStyle = '#f2c230'; x.beginPath(); x.moveTo(128, 10); x.lineTo(246, 220); x.lineTo(10, 220); x.closePath(); x.fill(); x.lineWidth = 10; x.strokeStyle = '#14121a'; x.stroke(); x.fillStyle = '#14121a'; x.beginPath(); x.arc(128, 150, 12, 0, 7); x.fill(); for (let k = 0; k < 3; k++) { const a = -Math.PI / 2 + k * 2.094; x.beginPath(); x.moveTo(128, 150); x.arc(128, 150, 52, a - 0.52, a + 0.52); x.closePath(); x.fill(); } x.fillStyle = '#fff'; x.fillRect(0, 236, w, 64); x.fillStyle = '#d7263d'; x.font = '900 40px Poppins'; x.textAlign = 'center'; x.fillText('DANGER', w / 2, 282); });
    for (const [x, z, ry] of [[X1 - 0.62, -6, -Math.PI / 2], [X1 - 0.62, -18, -Math.PI / 2], [-6.5, Z0 + 0.03, 0], [6.5, Z0 + 0.03, 0]]) plane(G, 0.7, 0.82, toon('#ffffff', { map: tre }), x, 3.2, z, 0, ry).userData.noOutline = true;
    for (let k = 0; k < 4; k++) mesh(cyl(0.12, 0.12, 26, 12).rotateZ(Math.PI / 2), toon(['#3fae5a', '#2f7fe0', '#f2b51d', '#d7263d'][k], { roughness: 0.45 }), 0, 4.4 + k * 0.32, Z0 + 0.4, G, 0);
    for (const s of [-1, 1]) { mesh(rbox(0.6, 0.9, 0.25, 0.03), '#d7263d', s * 11.5, 1.1, Z1 - 0.2, G, 0); }
    // big painted wall number at the back
    const num = canvasTex(512, 256, (x, w, h) => { x.fillStyle = '#14213d'; x.fillRect(0, 0, w, h); x.fillStyle = '#ffffff'; x.font = '900 150px Poppins'; x.textAlign = 'center'; x.fillText('A-24', w / 2, 180); x.fillStyle = '#f2b51d'; x.fillRect(0, 220, w, 36); });
    plane(G, 5, 2.5, toon('#ffffff', { map: num }), 0, 5.2, Z0 + 0.05).userData.noOutline = true; }
  // ---- workers' kit: a trolley for carrying broken centrifuges, tool chest, a step ladder
  { const tr = new THREE.Group(); G.add(tr); U.trolley = tr; mesh(rbox(0.7, 0.06, 2.0, 0.02), '#3a6fb0', 0, 0.35, 0, tr, 0); for (const [a, b] of [[-0.3, -0.85], [0.3, -0.85], [-0.3, 0.85], [0.3, 0.85]]) mesh(cyl(0.08, 0.08, 0.06, 12).rotateZ(Math.PI / 2), '#14121a', a, 0.09, b, tr, 0); for (const b of [-0.85, 0.85]) mesh(rbox(0.06, 0.25, 0.06), '#3a3e48', 0, 0.22, b, tr, 0);
    U.trolleyLoad = []; for (let k = 0; k < 2; k++) { const lg = new THREE.Group(); lg.position.set(-0.15 + k * 0.3, 0.52, 0); tr.add(lg); const m = mesh(cyl(0.13, 0.13, 1.5, 16).rotateX(Math.PI / 2), casingMat, 0, 0, 0, lg, 0); mesh(cyl(0.136, 0.136, 0.1, 16).rotateX(Math.PI / 2), bandMat, 0, 0, 0.55, lg, 0); const dent = mesh(new THREE.BoxGeometry(0.1, 0.06, 0.4), '#9aa2b0', 0.06, 0.1, -0.2, lg, 0); dent.rotation.z = 0.5; U.trolleyLoad.push(lg); }
    tr.position.set(0, -20, 0);
    const ch = mesh(rbox(0.8, 1.0, 0.5, 0.03), '#d7263d', 11.9, 0.5, 2.6, G, 0); for (let k = 0; k < 4; k++) mesh(rbox(0.7, 0.02, 0.02), '#f4efe4', 11.9 - 0.25, 0.2 + k * 0.22, 2.86, G, 0); }
}
// ---- CONTROL ROOM (behind the glass, z 6..11): consoles facing the hall, the cascade mimic screen
{ const G = HALL, U = G.userData, cx0 = -6.5, cx1 = 6.5, cz0 = 6, cz1 = 11.5, ch = 3.2;
  const panel = toon('#ffffff', { map: canvasTex(512, 512, (x, w, h) => { x.fillStyle = '#d9dde4'; x.fillRect(0, 0, w, h); x.fillStyle = '#c4c9d2'; for (let i = 0; i < 4; i++) x.fillRect(i * 128, 0, 3, h); x.fillStyle = '#2f6f8a'; x.fillRect(0, h * 0.72, w, h * 0.28); }, true) });
  const sh = shell(G, { x0: cx0, x1: cx1, z0: cz0 + 0.02, z1: cz1, h: ch, wall: panel, floor: toon('#ffffff', { map: carpetTex }), ceil: '#e8e8ec', skip: ['back'] });
  // the back of the window wall seen from inside (thin panels around the window)
  windowWallX(G, panel, cx0, cx1, cz0 + 0.18, ch, -5, 5, 1.0, 2.7, 0);
  for (const [lx, lz] of [[-3, 8.4], [3, 8.4], [0, 10.4]]) { const p = new THREE.PointLight('#fff2dc', 4.5, 7, 1.4); p.position.set(lx, 2.9, lz); G.add(p); mesh(rbox(1.4, 0.04, 0.5, 0.01), '#cfd6e6', lx, ch - 0.03, lz, G, 0); mesh(new THREE.PlaneGeometry(1.3, 0.4), basic('#fbfbff'), lx, ch - 0.06, lz, G, 0).rotation.x = Math.PI / 2; }
  // a long console desk under the window; operators sit at z 8.0 facing the glass (-z)
  const ctrl = textCanvas(640, 400, () => {}); SCR.ctrl = ctrl;
  mesh(rbox(10.4, 0.08, 0.95, 0.02), '#3a4256', 0, 0.78, 7.0, G, 0); mesh(rbox(10.4, 0.74, 0.08, 0.02), '#2a3040', 0, 0.38, 6.6, G, 0);
  for (let i = 0; i < 6; i++) { const mx = -4.4 + i * 1.76; const mg = new THREE.Group(); mg.position.set(mx, 0.82, 7.1); mg.rotation.x = 0.0; G.add(mg); mg.rotation.y = Math.PI; // screens face the operators (+z)
    mesh(rbox(0.66, 0.44, 0.04, 0.01), '#14121a', 0, 0.32, 0, mg, 0); mesh(cyl(0.02, 0.02, 0.12, 6), '#14121a', 0, 0.06, 0, mg, 0); const s = plane(mg, 0.62, 0.39, basic('#ffffff', { map: ctrl.t }), 0, 0.32, -0.022); s.rotation.y = Math.PI; s.userData.noOutline = true; }
  for (let i = 0; i < 4; i++) chair(G, -3.4 + i * 2.25, 8.0, 0, '#2f4f6e');
  // the big mimic screen on the right wall (cascade diagram, all green)
  { mesh(rbox(0.08, 1.5, 2.6, 0.02), '#14121a', cx1 - 0.05, 1.8, 9.0, G, 0); const mm = textCanvas(1024, 600, () => {}); SCR.mimic = mm; plane(G, 2.5, 1.42, basic('#ffffff', { map: mm.t }), cx1 - 0.1, 1.8, 9.0, 0, -Math.PI / 2).userData.noOutline = true; }
  // tea tray with tulip glasses, a wall clock, a door
  { mesh(rbox(0.5, 0.02, 0.32, 0.01), '#c9932a', -5.6, 0.83, 7.1, G, 0); for (let k = 0; k < 4; k++) { mesh(cyl(0.028, 0.02, 0.08, 10), toon('#c8501e', { transparent: true, opacity: 0.85 }), -5.75 + k * 0.1, 0.88, 7.1, G, 0); } }
  { const ct = canvasTex(128, 128, (x, w) => { x.fillStyle = '#fff'; x.beginPath(); x.arc(64, 64, 62, 0, 7); x.fill(); x.fillStyle = '#14121a'; for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; x.fillRect(64 + Math.cos(a) * 52 - 3, 64 + Math.sin(a) * 52 - 3, 6, 6); } x.lineWidth = 6; x.strokeStyle = '#14121a'; x.beginPath(); x.moveTo(64, 64); x.lineTo(40, 30); x.moveTo(64, 64); x.lineTo(100, 64); x.stroke(); });
    plane(G, 0.36, 0.36, basic('#ffffff', { map: ct, transparent: true }), cx0 + 0.03, 2.5, 9.0, 0, Math.PI / 2); }
  mesh(rbox(0.06, 2.1, 1.0, 0.01), '#7a5a3a', cx0 + 0.04, 1.05, 10.6, G, 0);
  pottedPlant(G, cx1 - 0.5, cz1 - 0.5, 0.9);
}
const HCARD = { t1: makeCard(HALL, 'tech1', 1.74), t2: makeCard(HALL, 'tech2', 1.7), t3: makeCard(HALL, 'tech1', 1.72), op1: makeCard(HALL, 'operator1', 1.72), op2: makeCard(HALL, 'operator2', 1.72), eng: makeCard(HALL, 'engineer', 1.74) };
HCARD.op1.face = V(0, 0, -1); HCARD.op2.face = V(0, 0, -1);
