// =====================================================================================================
// LAB: a small antivirus company in Minsk, June 2010, a white night outside. Ulasen's desk in front of a big
// window onto panel blocks, the analysis screen on the left wall, shelves, rack, whiteboard, calendar, phone.
// =====================================================================================================
{ const G = LAB, x0 = -4.5, x1 = 4.5, z0 = -3.5, z1 = 3.6, h = 3.0, U = G.userData;
  const wallM = toon('#ffffff', { map: canvasTex(512, 512, (x, w, hh) => { x.fillStyle = '#e9dfc9'; x.fillRect(0, 0, w, hh); x.fillStyle = '#3f8a8f'; x.fillRect(0, hh * 0.7, w, hh * 0.3); x.fillStyle = '#2f6f74'; x.fillRect(0, hh * 0.69, w, 8); const r = rng(71); for (let i = 0; i < 1500; i++) { x.fillStyle = `rgba(0,0,0,${r() * 0.04})`; x.fillRect(r() * w, r() * hh, 2, 2); } }, true) });
  const lino = canvasTex(512, 512, (x, w, hh) => { const s = 64; for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) { x.fillStyle = (i + j) % 2 ? '#c9b48e' : '#a8875a'; x.fillRect(i * s, j * s, s, s); } const r = rng(4); for (let i = 0; i < 3000; i++) { x.fillStyle = `rgba(${r() < 0.5 ? 0 : 255},${r() < 0.5 ? 0 : 255},${r() < 0.5 ? 0 : 255},${r() * 0.05})`; x.fillRect(r() * w, r() * hh, 2, 2); } }, true);
  shell(G, { x0, x1, z0, z1, h, wall: wallM, floor: toon('#ffffff', { map: lino, roughness: 0.55 }), ceil: '#e8e4da', skip: ['back'] });
  // back wall with a wide window (x -3.2..1.2, y 0.85..2.55)
  windowWallX(G, wallM, x0, x1, z0, h, -3.2, 1.2, 0.85, 2.55);
  { const fr = toon('#f4f4f0', { roughness: 0.5 }); mesh(rbox(4.5, 0.1, 0.16), fr, -1.0, 0.82, z0, G, 0); mesh(rbox(4.5, 0.1, 0.14), fr, -1.0, 2.58, z0, G, 0);
    for (const fx of [-3.22, -1.75, -0.28, 1.22]) mesh(rbox(0.09, 1.8, 0.14), fr, fx, 1.7, z0, G, 0); mesh(rbox(4.4, 0.06, 0.12), fr, -1.0, 2.1, z0, G, 0);
    mesh(rbox(4.6, 0.05, 0.36), fr, -1.0, 0.8, z0 + 0.16, G, 0); // sill
    // radiator: white ribbed panel under the window
    for (let i = 0; i < 22; i++) mesh(rbox(0.07, 0.5, 0.1, 0.02), '#f0efe8', -2.6 + i * 0.12, 0.42, z0 + 0.12, G, 0); mesh(cyl(0.02, 0.02, 2.7, 8).rotateZ(Math.PI / 2), '#dcdad2', -1.34, 0.17, z0 + 0.12, G, 0);
    // sill clutter: cactus, books, a little flag of paper
    pottedPlant(G, 0.6, z0 + 0.18, 0.45).position.y = 0.82; for (let k = 0; k < 4; k++) mesh(rbox(0.05, 0.22, 0.16), ['#d7263d', '#2f6fe0', '#ffcf3f', '#3fae5a'][k], -2.7 + k * 0.06, 0.94, z0 + 0.2, G, 0); }
  // outside: dusk sky over Minsk panel blocks, lit windows, snow-free June night, streetlights, trees
  { const O = new THREE.Group(); O.position.set(0, 0, z0); G.add(O);
    const sky = new THREE.Mesh(new THREE.SphereGeometry(70, 32, 16, Math.PI * 0.75, Math.PI * 1.5), basic('#ffffff', { map: canvasTex(1024, 512, (x, w, hh) => { const g = x.createLinearGradient(0, 0, 0, hh); g.addColorStop(0, '#1c2a6a'); g.addColorStop(0.32, '#4a52a8'); g.addColorStop(0.44, '#c87ab0'); g.addColorStop(0.5, '#ffb07a'); g.addColorStop(0.56, '#ffd9a0'); g.addColorStop(1, '#ffd9a0'); x.fillStyle = g; x.fillRect(0, 0, w, hh); }), side: THREE.BackSide, fog: false }));
    sky.userData.noOutline = true; O.add(sky); clouds(O, 14, 50, 62, 6, 20, 9, '#ffc7d8');
    plane(O, 140, 80, toon('#3a4a3a'), 0, 0.0, -40, -Math.PI / 2).position.y = -0.01;
    const blk = (x, z, w, hgt, d, col, seed, ry = 0) => { const b = new THREE.Group(); b.position.set(x, 0, z); b.rotation.y = ry; O.add(b); mesh(rbox(w, hgt, d, 0.08), col, 0, hgt / 2, 0, b, 0);
      const t = windowTex(seed, col, '#ffd27a', Math.round(w / 1.4), Math.round(hgt / 1.5)); const f = plane(b, w - 0.6, hgt - 1.2, basic('#ffffff', { map: t }), 0, hgt / 2 + 0.3, d / 2 + 0.02); f.userData.noOutline = true;
      for (let k = 1; k < Math.round(hgt / 3); k++) mesh(rbox(w + 0.1, 0.12, d + 0.1), '#e8e2d6', 0, k * 3, 0, b, 0); mesh(rbox(w * 0.3, 1.2, d * 0.4), '#6a6e7a', w * 0.2, hgt + 0.6, 0, b, 0); return b; };
    blk(-14, -22, 22, 27, 8, '#c9cfd8', 3); blk(10, -26, 16, 33, 8, '#d8c8a8', 5); blk(-2, -38, 30, 24, 8, '#b8c4d4', 7); blk(26, -36, 14, 40, 8, '#c8b8c8', 11); blk(-32, -34, 14, 36, 8, '#d0d4c0', 13);
    // street, lamps, birches (leaf-textured canopies), a parked car
    plane(O, 140, 6, toon('#4a4a52'), 0, 0.01, -9, -Math.PI / 2);
    for (const lx of [-12, -2, 8, 18]) { mesh(cyl(0.08, 0.1, 6, 8), '#3a3a44', lx, 3, -6.5, O, 0); mesh(rbox(1.0, 0.12, 0.3), '#3a3a44', lx + 0.4, 6, -6.5, O, 0); glow(O, lx + 0.8, 5.9, -6.5, '#ffe0a0', 2.4, 0.8); }
    const birchMat = toon('#ffffff', { map: leafTex('#5aa83c', '#3f8a2e', '#8fd350', 12), roughness: 0.9 });
    for (const [tx, tz, s] of [[-7, -5, 1.1], [4, -4.5, 1.0], [-17, -6, 1.2], [14, -5, 1.1]]) { mesh(cyl(0.12, 0.18, 4.2, 8), '#efeae0', tx, 2.1, tz, O, 0); for (let k = 0; k < 5; k++) mesh(new THREE.IcosahedronGeometry(1.1 * s, 3), birchMat, tx + Math.cos(k * 2.4) * 0.8, 4.6 + (k % 3) * 0.5, tz + Math.sin(k * 2.4) * 0.6, O, 0); }
    const car = profileCar(O, [[-2.1, 0.3], [2.1, 0.3], [2.15, 0.7], [1.2, 0.85], [0.5, 1.35], [-0.9, 1.38], [-1.6, 0.95], [-2.15, 0.9]], 4.2, 1.6, '#e8e2d6', { wheels: [[1.3, 0.78], [1.3, -0.78], [-1.3, 0.78], [-1.3, -0.78]], wr: 0.34 }); car.root.position.set(-3, 0, -10);
    O.add(new THREE.HemisphereLight('#ffd9b8', '#3a3a5a', 0.7)); }
  // lights: warm evening sun through the window, warm room fill, cool screen glow
  G.add(new THREE.HemisphereLight('#fff2e0', '#6a5a4a', 0.8));
  const sun = new THREE.DirectionalLight('#ffc890', 1.6); sun.position.set(-3, 5, -12); sun.target.position.set(0, 0, 1); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 1, far: 30 }); sun.shadow.bias = -0.0004; G.add(sun, sun.target);
  for (const [lx, lz] of [[-2, 0.5], [2.4, 1.4]]) { const p = new THREE.PointLight('#fff0d8', 5, 8, 1.4); p.position.set(lx, 2.7, lz); G.add(p); mesh(rbox(1.3, 0.05, 0.5, 0.01), '#d9dce4', lx, h - 0.03, lz, G, 0); mesh(new THREE.PlaneGeometry(1.2, 0.4), basic('#fffaf0'), lx, h - 0.06, lz, G, 0).rotation.x = Math.PI / 2; }
  // Ulasen's desk (he sits at z -0.1 facing +z, the window behind him) and his colleague's desk
  const d1 = desk(G, 0.1, 0.65, 0, '#c89a62', '#5fd0ff'); mesh(rbox(0.5, 0.32, 0.03, 0.01), '#8a8f9c', -0.5, 0.98, 0.15, d1, 0); mesh(cyl(0.02, 0.02, 0.16, 6), '#5a6272', -0.5, 0.86, 0.15, d1, 0); // second monitor (back)
  G.userData.kChair = chair(G, 0.1, -0.1, Math.PI, '#2f6f74');
  const d2 = desk(G, -2.9, 1.9, 0.5, '#c89a62', '#3ff07a'); chair(G, -3.25, 1.3, Math.PI + 0.5, '#c0503a');
  // keyboard + mouse + mug + papers on Ulasen's desk, the desk phone
  { const kb = canvasTex(256, 96, (x, w, hh) => { x.fillStyle = '#2a2a32'; x.fillRect(0, 0, w, hh); x.fillStyle = '#4a4a56'; for (let j = 0; j < 4; j++) for (let i = 0; i < 14; i++) x.fillRect(6 + i * 17.6, 6 + j * 22, 14, 18); });
    const k = mesh(rbox(0.46, 0.02, 0.16, 0.005), '#2a2a32', 0.1, 0.79, 0.45, G, 0); plane(G, 0.44, 0.15, basic('#ffffff', { map: kb }), 0.1, 0.801, 0.45, -Math.PI / 2); mesh(rbox(0.06, 0.02, 0.1, 0.01), '#2a2a32', 0.45, 0.79, 0.45, G, 0);
    mesh(cyl(0.045, 0.04, 0.1, 14), '#d7263d', -0.45, 0.83, 0.5, G, 0); }
  { const ph = new THREE.Group(); ph.position.set(0.7, 0.78, 0.86); ph.rotation.y = -0.3; G.add(ph); U.phone = ph;
    const body = toon('#3a3f4c', { roughness: 0.5 }), hmat = toon('#4a5060', { roughness: 0.45 });
    mesh(rbox(0.22, 0.05, 0.2, 0.015), body, 0, 0.025, 0, ph, 0);                                     // base
    const deck = mesh(rbox(0.13, 0.03, 0.12, 0.01), body, 0, 0.06, 0.03, ph, 0); deck.rotation.x = 0.22;   // sloped keypad deck
    for (let i = 0; i < 12; i++) mesh(rbox(0.026, 0.012, 0.02, 0.004), i === 9 || i === 11 ? '#c9cdd6' : '#eef0f4', -0.035 + (i % 3) * 0.035, 0.079 - Math.floor(i / 3) * 0.006, -0.005 + Math.floor(i / 3) * 0.027, ph, 0);
    mesh(rbox(0.1, 0.012, 0.035, 0.004), '#7fd0ff', 0, 0.06, -0.075, ph, 0);                           // little LCD
    const hs = new THREE.Group(); hs.position.set(0.075, 0.075, 0); hs.rotation.y = Math.PI / 2; ph.add(hs); U.handset = hs;   // handset lies along the side cradle
    mesh(rbox(0.2, 0.028, 0.04, 0.012), hmat, 0, 0.012, 0, hs, 0); for (const s of [-1, 1]) mesh(rbox(0.055, 0.034, 0.06, 0.014), hmat, s * 0.085, -0.004, 0, hs, 0);
    const cord = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(Array.from({ length: 40 }, (_, i) => { const u = i / 39; return V(0.11 + u * 0.06 + Math.cos(u * 60) * 0.008, 0.02 + Math.sin(u * 60) * 0.008, -0.05 + u * 0.1); })), 160, 0.003, 5), toon('#2a2e38')); cord.userData.noOutline = true; ph.add(cord);
    U.ringGlow = glow(ph, 0, 0.12, 0, '#ffcf3f', 0.6, 0);
    U.ringArcs = []; for (const s of [-1, 1]) for (let j = 0; j < 2; j++) { const a = new THREE.Mesh(new THREE.TorusGeometry(0.07 + j * 0.035, 0.005, 4, 18, 1.1), basic('#ffcf3f')); a.position.set(0.075, 0.1, 0); a.rotation.set(0, Math.PI / 2, s > 0 ? -0.55 : Math.PI - 0.55); a.userData.noOutline = true; a.visible = false; ph.add(a); U.ringArcs.push(a); } }
  // the hero USB stick on the desk
  U.stick = usbStick(G, 1); U.stick.position.set(0.32, 0.79, 0.62); U.stick.rotation.y = 0.5;
  // left wall: the big analysis screen
  { mesh(rbox(0.1, 1.62, 2.52, 0.03), '#14121a', x0 + 0.05, 1.72, 0.3, G, 0); screenMesh(G, 'lab', 1024, 650, 2.4, 1.52, x0 + 0.11, 1.72, 0.3, Math.PI / 2, false); glow(G, x0 + 0.6, 1.72, 0.3, '#5fd0ff', 3.5, 0.12); U.scrL = new THREE.PointLight('#5fd0ff', 3, 5, 1.4); U.scrL.position.set(x0 + 0.8, 1.7, 0.3); G.add(U.scrL); }
  // a calendar and a clock on the left wall
  { const t = canvasTex(256, 340, (x, w, hh) => { x.fillStyle = '#fffaf0'; x.fillRect(0, 0, w, hh); x.fillStyle = '#d7263d'; x.fillRect(0, 0, w, 90); x.fillStyle = '#fff'; x.font = '900 46px Poppins'; x.textAlign = 'center'; x.fillText('JUNE', w / 2, 52); x.font = '800 26px Poppins'; x.fillText('2010', w / 2, 80); x.fillStyle = '#14121a'; x.font = '700 22px Poppins';
      for (let d = 1; d <= 30; d++) { const c = (d + 1) % 7, r2 = Math.floor((d + 1) / 7); x.fillStyle = d === 17 ? '#d7263d' : '#14121a'; x.fillText(String(d), 22 + c * 35, 125 + r2 * 42); if (d === 17) { x.strokeStyle = '#d7263d'; x.lineWidth = 3; x.beginPath(); x.arc(22 + c * 35, 117 + r2 * 42, 17, 0, 7); x.stroke(); } } });
    plane(G, 0.5, 0.66, toon('#ffffff', { map: t }), x0 + 0.02, 1.85, 2.3, 0, Math.PI / 2);
    mesh(cyl(0.2, 0.2, 0.05, 28).rotateZ(Math.PI / 2), '#f4f4f0', x0 + 0.03, 2.55, -1.6, G, 0); const ct = canvasTex(128, 128, (x, w) => { x.fillStyle = '#fff'; x.fillRect(0, 0, w, w); x.fillStyle = '#14121a'; for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; x.fillRect(64 + Math.cos(a) * 52 - 3, 64 + Math.sin(a) * 52 - 3, 6, 6); } x.lineWidth = 6; x.strokeStyle = '#14121a'; x.beginPath(); x.moveTo(64, 64); x.lineTo(64, 24); x.moveTo(64, 64); x.lineTo(94, 74); x.stroke(); });
    plane(G, 0.36, 0.36, basic('#ffffff', { map: ct }), x0 + 0.06, 2.55, -1.6, 0, Math.PI / 2); }
  // right wall: shelves of colourful binders, a server rack, a whiteboard with the worm sketched on it
  { const sh2 = new THREE.Group(); sh2.position.set(x1 - 0.22, 0, -1.9); sh2.rotation.y = -Math.PI / 2; G.add(sh2); mesh(rbox(1.6, 2.2, 0.4, 0.02), '#8a6a48', 0, 1.1, -0.02, sh2, 0); mesh(rbox(1.5, 2.1, 0.02), '#5a4430', 0, 1.1, -0.2, sh2, 0);
    const r = rng(14); for (let j = 0; j < 4; j++) { mesh(rbox(1.5, 0.03, 0.36), '#a8865c', 0, 0.3 + j * 0.5, 0, sh2, 0); let u = -0.7; while (u < 0.66) { const bw = 0.05 + r() * 0.05, bh = 0.3 + r() * 0.12; mesh(rbox(bw, bh, 0.28, 0.01), ['#d7263d', '#2f6fe0', '#ffcf3f', '#3fae5a', '#8b5cf6', '#f4efe4', '#ff7a14'][Math.floor(r() * 7)], u + bw / 2, 0.315 + j * 0.5 + bh / 2, 0.02, sh2, 0).rotation.z = r() < 0.1 ? 0.15 : 0; u += bw + 0.008; } } }
  { const rack = new THREE.Group(); rack.position.set(x1 - 0.4, 0, 0.4); rack.rotation.y = -Math.PI / 2; G.add(rack); mesh(rbox(0.7, 1.9, 0.7, 0.03), '#16141c', 0, 0.95, 0, rack, 0);
    U.leds = []; for (let j = 0; j < 7; j++) { mesh(rbox(0.6, 0.18, 0.02), '#2a2832', 0, 0.3 + j * 0.22, 0.36, rack, 0); for (let i = 0; i < 4; i++) { const l = mesh(rbox(0.025, 0.025, 0.01), basic('#3ff07a'), 0.16 + i * 0.045, 0.3 + j * 0.22, 0.372, rack, 0); l.userData.ph = j * 1.7 + i * 0.9; U.leds.push(l); } } }
  { const t = canvasTex(640, 400, (x, w, hh) => { x.fillStyle = '#fbfbf8'; x.fillRect(0, 0, w, hh); x.lineWidth = 6; x.strokeStyle = '#2f6fe0'; x.fillStyle = '#2f6fe0'; x.font = '800 30px Poppins';
      const box = (bx, by, s) => { x.strokeRect(bx, by, 110, 70); x.fillText(s, bx + 14, by + 46); }; box(30, 60, 'USB'); box(250, 60, 'PC'); box(470, 60, 'PC'); box(250, 250, 'PC'); box(470, 250, '???');
      x.strokeStyle = '#d7263d'; x.beginPath(); x.moveTo(140, 95); x.lineTo(250, 95); x.moveTo(360, 95); x.lineTo(470, 95); x.moveTo(305, 130); x.lineTo(305, 250); x.moveTo(360, 285); x.lineTo(470, 285); x.stroke();
      x.fillStyle = '#d7263d'; x.font = '900 40px Poppins'; x.fillText('WHAT IS IT FOR?', 40, 380); });
    mesh(rbox(0.04, 1.06, 1.66), '#9a9aa4', x1 - 0.03, 1.65, 2.3, G, 0); plane(G, 1.6, 1.0, toon('#ffffff', { map: t }), x1 - 0.055, 1.65, 2.3, 0, -Math.PI / 2); }
  // plants, a water cooler, a coat stand, filing cabinet
  pottedPlant(G, -4.0, -3.0, 1.0); pottedPlant(G, 4.0, 3.1, 0.9, '#2f6fe0');
  mesh(rbox(0.5, 1.3, 0.6, 0.02), '#9aa2b0', -4.15, 0.65, -1.9, G, 0); for (let k = 0; k < 3; k++) mesh(rbox(0.4, 0.05, 0.02), '#5a6272', -4.15 + 0.31, 0.3 + k * 0.4, -1.9, G, 0).rotation.y = Math.PI / 2;
  mesh(rbox(0.34, 1.0, 0.34), '#e8eef8', 2.5, 0.5, -3.2, G, 0); mesh(cyl(0.15, 0.15, 0.42, 16), toon('#7fc8ff', { transparent: true, opacity: 0.8 }), 2.5, 1.22, -3.2, G, 0);
  // the dropped stick on the floor for the ending (beat 13)
  U.floorStick = usbStick(G, 1.6); U.floorStick.position.set(1.6, 0.017, 2.2); U.floorStick.rotation.y = 2.4;
}
const LCARD = { ul: makeCard(LAB, 'ulasen', 1.74), mate: makeCard(LAB, 'labmate', 1.66), finder: makeCard(LAB, 'finder', 1.72) };
