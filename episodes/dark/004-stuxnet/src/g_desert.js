// =====================================================================================================
// DESERT: the plain outside Natanz (stylised): bright sky, layered mountains, the perimeter fence and gate,
// a guard tower, gun emplacements, low halls, and the tunnel portal that leads down to the centrifuges.
// =====================================================================================================
{ const G = DESERT, U = G.userData;
  const sky = new THREE.Mesh(new THREE.SphereGeometry(380, 32, 16), basic('#ffffff', { map: canvasTex(4, 512, (x) => { const g = x.createLinearGradient(0, 0, 0, 512); g.addColorStop(0, '#2f7fe0'); g.addColorStop(0.4, '#6fb0f0'); g.addColorStop(0.5, '#d8ecf8'); g.addColorStop(1, '#f3e6cc'); x.fillStyle = g; x.fillRect(0, 0, 4, 512); }), side: THREE.BackSide, fog: false }));
  sky.userData.noOutline = true; G.add(sky); clouds(G, 26, 280, 340, 50, 120, 15);
  range(G, 300, 46, 50, 90, '#9fb0d8', 3, Math.PI * 1.0, Math.PI * 2.0); range(G, 210, 40, 28, 50, '#c8957a', 4, Math.PI * 1.05, Math.PI * 1.95); range(G, 150, 30, 14, 26, '#d9a77e', 6, Math.PI * 1.1, Math.PI * 1.9);
  G.add(new THREE.HemisphereLight('#dcecff', '#c8a070', 1.15));
  const sun = new THREE.DirectionalLight('#fff2d8', 2.6); sun.position.set(-20, 30, 18); sun.target.position.set(0, 0, -8); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); Object.assign(sun.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 1, far: 90 }); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.04; G.add(sun, sun.target);
  // ground: rolling sand with gravel speckle
  { const geo = new THREE.PlaneGeometry(700, 700, 175, 175).rotateX(-Math.PI / 2); const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); const flat = Math.abs(x) < 26 && z > -40 && z < 30 ? 0 : 1; p.setY(i, flat * (Math.sin(x * 0.07) * 0.9 + Math.cos(z * 0.05 + x * 0.02) * 1.2 + 1.0) * Math.min(1, (Math.abs(x) - 20) / 20 + (z < -40 ? 1 : 0))); } geo.computeVertexNormals();
    const st = sandTex.clone(); st.needsUpdate = true; st.repeat.set(110, 110); const g = new THREE.Mesh(geo, toon('#ffffff', { map: st, roughness: 0.95 })); g.receiveShadow = true; g.userData.noHull = true; G.add(g);
    const gr = canvasTex(512, 512, (x, w, h) => { const r = rng(9); x.fillStyle = '#d9b98a'; x.fillRect(0, 0, w, h); for (let i = 0; i < 9000; i++) { x.fillStyle = ['#c9a674', '#e8cfa2', '#b8946a', '#f2dcb4'][Math.floor(r() * 4)]; x.fillRect(r() * w, r() * h, 3, 3); } }, true); gr.repeat.set(10, 12);
    plane(G, 52, 70, toon('#ffffff', { map: gr, roughness: 0.95 }), 0, 0.01, -5, -Math.PI / 2); }
  // the access road with a centre line, and the gate
  { const rd = canvasTex(256, 1024, (x, w, h) => { x.fillStyle = '#4a4a52'; x.fillRect(0, 0, w, h); const r = rng(2); for (let i = 0; i < 4000; i++) { x.fillStyle = `rgba(255,255,255,${r() * 0.05})`; x.fillRect(r() * w, r() * h, 2, 2); } x.fillStyle = '#f2c230'; for (let y = 0; y < h; y += 80) x.fillRect(w / 2 - 4, y, 8, 46); x.fillStyle = '#e8e2d0'; x.fillRect(8, 0, 6, h); x.fillRect(w - 14, 0, 6, h); }, true); rd.repeat.set(1, 6);
    plane(G, 7, 120, toon('#ffffff', { map: rd, roughness: 0.8 }), 0, 0.03, 0, -Math.PI / 2); }
  // perimeter fence along z = 8 (gap for the road), barbed wire on top
  { const posts = []; for (let x = -60; x <= 60; x += 2.5) if (Math.abs(x) > 4.5) posts.push(x);
    const pm = new THREE.InstancedMesh(rbox(0.12, 3.0, 0.12, 0.02), DSTEEL, posts.length); const d = new THREE.Object3D(); posts.forEach((x, i) => { d.position.set(x, 1.5, 8); d.updateMatrix(); pm.setMatrixAt(i, d.matrix); }); pm.castShadow = true; G.add(pm);
    const mesh2 = canvasTex(256, 256, (x, w, h) => { x.clearRect(0, 0, w, h); x.strokeStyle = 'rgba(80,88,100,.95)'; x.lineWidth = 3; for (let i = -w; i < w * 2; i += 22) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + h, h); x.stroke(); x.beginPath(); x.moveTo(i, h); x.lineTo(i + h, 0); x.stroke(); } }, true); mesh2.repeat.set(24, 1.2);
    for (const s of [-1, 1]) { const f = new THREE.Mesh(new THREE.PlaneGeometry(55.5, 2.8), new THREE.MeshStandardMaterial({ map: mesh2, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, roughness: 0.6 })); f.position.set(s * 32.25, 1.45, 8); f.userData.noOutline = true; G.add(f);
      const pts = []; for (let i = 0; i <= 1800; i++) { const u = i / 1800, a = u * 140 * 6.283; pts.push(V(s * 32.25 - 27.7 + u * 55.4, 3.15 + Math.cos(a) * 0.2, 8 + Math.sin(a) * 0.2)); }
      mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 3000, 0.014, 4), toon('#8a92a0', { metalness: 0.6, roughness: 0.4 }), 0, 0, 0, G, 0); }
    // gate: booth, red-white barrier, signs, floodlights
    const booth = new THREE.Group(); booth.position.set(-5.4, 0, 9.5); G.add(booth); mesh(rbox(2.4, 2.6, 2.2, 0.05), '#efe8da', 0, 1.3, 0, booth, 0); mesh(rbox(2.7, 0.2, 2.5, 0.03), '#3f7a5a', 0, 2.7, 0, booth, 0); mesh(rbox(1.6, 0.9, 0.05), basic('#9fd0ee'), 0, 1.6, 1.11, booth, 0); mesh(rbox(0.05, 0.9, 1.4), basic('#9fd0ee'), 1.21, 1.6, 0, booth, 0);
    const bar = new THREE.Group(); bar.position.set(-3.8, 1.05, 8.3); G.add(bar); U.barrier = bar; mesh(rbox(0.35, 1.05, 0.35, 0.03), '#3a3e48', 0, -0.5, 0, bar, 0);
    const stripes = canvasTex(512, 32, (x, w, h) => { for (let i = 0; i < 16; i++) { x.fillStyle = i % 2 ? '#ffffff' : '#d7263d'; x.fillRect(i * 32, 0, 32, h); } }); const arm = new THREE.Group(); bar.add(arm); U.barArm = arm; const am = mesh(rbox(7.6, 0.12, 0.12, 0.03), toon('#ffffff', { map: stripes }), 3.8, 0.05, 0, arm, 0);
    for (const s of [-1, 1]) { mesh(cyl(0.08, 0.1, 6, 8), '#3a3e48', s * 6, 3, 9, G, 0); mesh(rbox(0.9, 0.4, 0.4, 0.04), '#3a3e48', s * 6, 6.0, 9, G, 0); mesh(rbox(0.7, 0.25, 0.05), basic('#fffbe8'), s * 6, 5.95, 8.78, G, 0); }
    const sg = canvasTex(512, 256, (x, w, h) => { x.fillStyle = '#f4efe4'; x.fillRect(0, 0, w, h); x.strokeStyle = '#d7263d'; x.lineWidth = 16; x.strokeRect(8, 8, w - 16, h - 16); x.fillStyle = '#d7263d'; x.font = '900 72px Poppins'; x.textAlign = 'center'; x.fillText('NO ENTRY', w / 2, 120); x.fillStyle = '#14121a'; x.font = '800 40px Poppins'; x.fillText('RESTRICTED AREA', w / 2, 190); });
    const sp = plane(G, 2.0, 1.0, toon('#ffffff', { map: sg }), 7.0, 1.9, 8.08, 0, 0); sp.userData.noOutline = true; mesh(rbox(2.1, 1.1, 0.05), '#3a3e48', 7.0, 1.9, 8.04, G, 0); }
  // guard tower
  { const tw = new THREE.Group(); tw.position.set(-10, 0, 9.5); G.add(tw); for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const l = mesh(rbox(0.16, 7.2, 0.16, 0.02), '#5a6272', a * 1.0, 3.6, b * 1.0, tw, 0); l.rotation.set(b * 0.06, 0, -a * 0.06); }
    for (let y = 1.5; y < 7; y += 1.8) for (const r of [0, Math.PI / 2]) { const br = mesh(rbox(2.2, 0.08, 0.08), '#5a6272', 0, y, 0, tw, 0); br.rotation.y = r; br.position.set(r ? 0 : 0, y, 0); }
    mesh(rbox(2.8, 0.2, 2.8, 0.03), '#5a6272', 0, 7.2, 0, tw, 0); mesh(rbox(2.6, 1.0, 2.6, 0.03), '#efe8da', 0, 7.8, 0, tw, 0); for (const s of [-1, 1]) { mesh(rbox(2.0, 0.6, 0.05), basic('#7fb8d8'), 0, 8.0, s * 1.31, tw, 0); mesh(rbox(0.05, 0.6, 2.0), basic('#7fb8d8'), s * 1.31, 8.0, 0, tw, 0); }
    const roof = mesh(new THREE.ConeGeometry(2.3, 0.9, 4), '#3f7a5a', 0, 8.75, 0, tw, 0); roof.rotation.y = Math.PI / 4; U.searchlight = mesh(cyl(0.22, 0.16, 0.4, 12).rotateX(Math.PI / 2), '#2a2e38', 1.2, 8.5, 1.2, tw, 0); }
  // low concrete halls with angular roofs (stucco)
  const hall = (x, z, w, d, hh, ry = 0, col = '#efe2c8') => { const b = new THREE.Group(); b.position.set(x, 0, z); b.rotation.y = ry; G.add(b); const st = stuccoTex.clone(); st.needsUpdate = true; st.repeat.set(w / 4, hh / 4); mesh(rbox(w, hh, d, 0.1), toon(col, { map: st }), 0, hh / 2, 0, b, 0);
    for (let k = -w / 2 + 2; k < w / 2 - 1; k += 3) { mesh(rbox(1.4, 1.0, 0.1), basic('#4a6a8a'), k + 0.7, hh * 0.62, d / 2 + 0.02, b, 0); mesh(rbox(1.6, 0.12, 0.25), '#d9cdb4', k + 0.7, hh * 0.62 - 0.6, d / 2 + 0.1, b, 0); }
    mesh(rbox(w + 0.4, 0.3, d + 0.4, 0.04), '#b8a888', 0, hh + 0.15, 0, b, 0); for (let k = -w / 2 + 3; k < w / 2; k += 6) { mesh(rbox(1.2, 0.8, 1.0, 0.04), '#9aa2b0', k, hh + 0.7, 0, b, 0); mesh(cyl(0.35, 0.35, 0.2, 14), '#5a6272', k, hh + 1.2, 0, b, 0); } return b; };
  hall(-17, -10, 18, 9, 6, 0.15); hall(18, -14, 22, 10, 7, -0.2, '#e8d7b8'); hall(-22, -28, 14, 8, 5, 0.4, '#f0e6d0'); hall(24, 0, 10, 7, 4.5, -0.6);
  // the tunnel portal into the hill: angular concrete headwall, hazard stripes, lamps, the ramp down
  { const hill = new THREE.Mesh(new THREE.ConeGeometry(34, 16, 9, 3), toon('#d8a878', { roughness: 0.95 })); hill.position.set(0, 7.2, -48); hill.scale.set(1.2, 1, 0.7); hill.userData.noHull = true; G.add(hill);
    const pw = new THREE.Group(); pw.position.set(0, 0, -30); G.add(pw); U.portal = pw; const cm = toon('#ffffff', { map: concreteTex, roughness: 0.9 }); cm.map = concreteTex.clone(); cm.map.needsUpdate = true; cm.map.repeat.set(4, 2); cm.color.set('#d8d4cc');
    mesh(rbox(14, 8, 2.0, 0.05), cm, 0, 4, -1.5, pw, 0); for (const s of [-1, 1]) { const wing = mesh(rbox(9, 5, 1.2, 0.05), cm, s * 9.8, 2.5, 1.4, pw, 0); wing.rotation.y = s * 0.55; }
    mesh(rbox(7.2, 5.6, 0.3), basic('#0a0a10'), 0, 2.8, -0.48, pw, 0); const str = canvasTex(512, 64, (x, w, h) => { for (let i = -2; i < 20; i++) { x.fillStyle = i % 2 ? '#14121a' : '#f2c230'; x.beginPath(); x.moveTo(i * 32, h); x.lineTo(i * 32 + 32, 0); x.lineTo(i * 32 + 64, 0); x.lineTo(i * 32 + 32, h); x.fill(); } }, true); str.repeat.set(3, 1);
    plane(pw, 8.4, 0.5, basic('#ffffff', { map: str }), 0, 5.9, -0.45).userData.noOutline = true; for (const s of [-1, 1]) { plane(pw, 0.5, 5.6, basic('#ffffff', { map: str }), s * 3.85, 2.8, -0.45, 0, 0).rotation.z = Math.PI / 2; mesh(rbox(0.5, 0.3, 0.3, 0.04), '#3a3e48', s * 4.6, 6.4, -0.4, pw, 0); glow(pw, s * 4.6, 6.3, -0.2, '#fff2c8', 1.6, 0.5); }
    for (let i = 0; i < 6; i++) glow(pw, 0, 4.8, -2 - i * 3, '#ffe0a0', 1.1, 0.55); // tunnel lights receding
    const tg = canvasTex(512, 128, (x, w, h) => { x.fillStyle = '#14213d'; x.fillRect(0, 0, w, h); x.fillStyle = '#ffffff'; x.font = '900 60px Poppins'; x.textAlign = 'center'; x.fillText('HALL A  ▼', w / 2, 86); }); plane(pw, 3.2, 0.8, basic('#ffffff', { map: tg }), 0, 6.6, -0.45).userData.noOutline = true;
    // the ramp (dark asphalt sloping into the portal) and kerbs
    plane(G, 7, 18, toon('#3a3a42', { roughness: 0.8 }), 0, 0.035, -21, -Math.PI / 2); for (const s of [-1, 1]) mesh(rbox(0.4, 0.5, 18), '#e8e2d6', s * 3.7, 0.25, -21, G, 0); }
  // gun emplacements: sandbag rings with an angular twin gun (stylised)
  { const bagT = canvasTex(256, 64, (x, w, h) => { x.fillStyle = '#b89a6a'; x.fillRect(0, 0, w, h); for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#c9ac7a' : '#a88a5a'; x.beginPath(); x.roundRect(i * 32 + 2, 4, 28, h - 8, 10); x.fill(); } }, true);
    for (const [gx, gz, ry] of [[14, -30, -0.5], [-15, -33, 0.6], [30, -22, -0.9]]) { const e = new THREE.Group(); e.position.set(gx, 0, gz); e.rotation.y = ry; G.add(e);
      for (let k = 0; k < 2; k++) { const t2 = bagT.clone(); t2.needsUpdate = true; t2.repeat.set(5, 1); mesh(new THREE.TorusGeometry(2.0, 0.32, 6, 18), toon('#ffffff', { map: t2 }), 0, 0.3 + k * 0.42, 0, e, 0).rotation.x = Math.PI / 2; }
      mesh(cyl(0.6, 0.8, 0.8, 8), '#6a7a5a', 0, 0.4, 0, e, 0); const gun = new THREE.Group(); gun.position.set(0, 1.1, 0); gun.rotation.z = 0; e.add(gun); mesh(rbox(1.2, 0.6, 1.0, 0.06), '#5f6f4f', 0, 0.1, 0, gun, 0);
      for (const s of [-0.22, 0.22]) { const b = mesh(cyl(0.07, 0.07, 3.0, 10), '#3a4030', 0, 0, 0, gun, 0); b.rotation.x = -1.0; b.position.set(s, 1.0, -0.9); } } }
  // trucks + palms + light poles for scale
  { const truck = profileCar(G, [[-2.8, 0.45], [2.8, 0.45], [2.8, 2.6], [1.1, 2.6], [1.1, 1.6], [-0.2, 1.6], [-0.2, 2.9], [-2.8, 2.9]], 5.6, 2.2, '#e8e2d6', { wheels: [[2.0, 1.0], [2.0, -1.0], [-2.0, 1.0], [-2.0, -1.0]], wr: 0.45 }); truck.root.position.set(-10, 0, -3); truck.root.rotation.y = 0.3;
    const palmT = canvasTex(256, 256, (x, w, h) => { for (let i = 0; i < 9; i++) { x.save(); x.translate(128, 128); x.rotate(i / 9 * 6.283); x.fillStyle = i % 2 ? '#3f8a2e' : '#5aa83c'; x.beginPath(); x.moveTo(0, 0); x.quadraticCurveTo(30, -60, 0, -125); x.quadraticCurveTo(-30, -60, 0, 0); x.fill(); x.strokeStyle = '#2f6d22'; x.lineWidth = 3; x.beginPath(); x.moveTo(0, 0); x.lineTo(0, -120); x.stroke(); x.restore(); } });
    const palmM = new THREE.MeshStandardMaterial({ map: palmT, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.8 });
    for (const [px, pz] of [[-8, 13], [8, 13], [-16, 14], [16, 12.5]]) { mesh(cyl(0.16, 0.24, 5.5, 8), '#8a6a48', px, 2.75, pz, G, 0); for (const r of [0, 1.0, 2.0]) { const f = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 3.6), palmM); f.position.set(px, 5.6, pz); f.rotation.set(-Math.PI / 2 + 0.35 * Math.sin(r * 3), r, 0); f.userData.noOutline = true; G.add(f); } } }
  // the engineer's car (beat 11): a white hatchback that drives out through the gate
  U.car = profileCar(G, [[-1.9, 0.3], [1.9, 0.3], [1.95, 0.72], [1.1, 0.86], [0.55, 1.4], [-1.5, 1.42], [-1.95, 0.95]], 3.9, 1.6, '#f2f2ee', { wheels: [[1.2, 0.78], [1.2, -0.78], [-1.2, 0.78], [-1.2, -0.78]], wr: 0.33 });
  for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.42), basic('#3a4a66')); w.position.set(-0.2, 1.12, s * 0.81); if (s < 0) w.rotation.y = Math.PI; w.userData.noOutline = true; U.car.root.add(w); }
  U.car.root.position.set(0, -50, 0);
}
const DCARD = { guard: makeCard(DESERT, 'tech2', 1.72), eng: makeCard(DESERT, 'engineer', 1.74) };
