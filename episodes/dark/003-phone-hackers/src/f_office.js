
// ---------- OFFICE: an American company at night. Open-plan desks with phones, a window wall onto the city,
// the PBX rack (the phone system) in the back-right corner. setDay(1) turns it into the morning the bill arrives ----------
const cityTex = night => canvasTex(2048, 1024, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); if (night) { g.addColorStop(0, '#070a1e'); g.addColorStop(0.7, '#1a1a40'); g.addColorStop(1, '#3a2a50'); } else { g.addColorStop(0, '#8ac8f0'); g.addColorStop(1, '#e8f0f4'); } x.fillStyle = g; x.fillRect(0, 0, w, h);
  const r = rng(night ? 31 : 32); if (night) for (let i = 0; i < 200; i++) { x.fillStyle = `rgba(255,255,255,${r() * 0.8})`; x.fillRect(r() * w, r() * h * 0.4, 2, 2); }
  const rr = rng(33); for (let layer = 0; layer < 2; layer++) { let u = -10; while (u < w) { const bw = 80 + rr() * 160, bh = 300 + rr() * 500 - layer * 120; x.fillStyle = night ? ['#141a34', '#0c1026'][layer] : ['#9aa8b8', '#7a8898'][layer]; x.fillRect(u, h - bh, bw, bh);
      for (let j = 0; j < bh / 30 - 1; j++) for (let i = 0; i < bw / 22 - 1; i++) { const v = rr(); x.fillStyle = night ? (v < 0.25 ? 'rgba(255,220,150,.85)' : 'rgba(40,50,90,.6)') : 'rgba(255,255,255,.25)'; x.fillRect(u + 8 + i * 22, h - bh + 12 + j * 30, 11, 16); } u += bw + 8; } } });
const CITY_N = cityTex(true), CITY_D = cityTex(false);
{ const G = OFFICE, U = G.userData, x0 = -6, x1 = 6, z0 = -6, z1 = 5, h = 3;
  const wallM = toon('#ffffff', { map: canvasTex(512, 512, (x, w, h2) => { x.fillStyle = '#cfd2da'; x.fillRect(0, 0, w, h2); x.fillStyle = '#b8bcc8'; x.fillRect(0, h2 * 0.9, w, h2 * 0.1); const r = rng(41); for (let i = 0; i < 1200; i++) { x.fillStyle = `rgba(0,0,0,${r() * 0.05})`; x.fillRect(r() * w, r() * h2, 2, 2); } }, true) });
  shell(G, { x0, x1, z0, z1, h, wall: wallM, floor: toon('#ffffff', { map: carpetTex }), ceil: '#d8dae2', skip: ['back'] });
  holeWall(G, x0, x1, h, [[-5.6, 5.6, 0.7, 2.7]], V(0, 0, z0 - 0.06), 0.12, '#b8bcc8');
  for (let i = 0; i <= 8; i++) mesh(rbox(0.08, 2.0, 0.14, 0.01), '#3a3e48', -5.6 + i * 1.4, 1.7, z0, G, 2.5);
  const city = new THREE.Mesh(new THREE.PlaneGeometry(40, 20), basic('#ffffff', { map: CITY_N, fog: false })); city.position.set(0, 3, -24); city.userData.noOutline = true; G.add(city); U.city = city;
  for (let i = 0; i < 7; i++) { const bx = -12 + i * 4, bh = 10 + (i * 29 % 9); const b = mesh(rbox(3, bh, 3, 0.03), toon('#ffffff', { map: windowsTex('#1a2040', 'rgba(255,220,150,.85)', 70 + i) }), bx, bh / 2 - 4, -12 - (i % 2) * 3, G, 4); b.material.map.repeat.set(1.2, bh / 5); }
  U.hemi = new THREE.HemisphereLight('#8a9ae0', '#30305a', 0.95); for (const [lx, lz] of [[-3, -1.2], [1.5, -1.2], [-2.8, 2.2], [1.5, 2.2]]) { const pl = new THREE.PointLight('#b8c8f0', 1.8, 6, 1.3); pl.position.set(lx, 2.4, lz); G.add(pl); } G.add(U.hemi);
  U.moon = new THREE.DirectionalLight('#9ab0ff', 0.8); U.moon.position.set(-4, 8, -12); U.moon.target.position.set(0, 0, 0); U.moon.castShadow = true; U.moon.shadow.mapSize.set(2048, 2048); Object.assign(U.moon.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 1, far: 40 }); U.moon.shadow.bias = -0.0004; G.add(U.moon, U.moon.target);
  U.panels = []; for (const lx of [-3.5, 0, 3.5]) for (const lz of [-3, 1]) { mesh(rbox(1.2, 0.04, 0.6, 0.01), '#e8eaf0', lx, h - 0.02, lz, G, 2.5); const p = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.5), basic('#5a5e70')); p.rotation.x = Math.PI / 2; p.position.set(lx, h - 0.045, lz); p.userData.noOutline = true; G.add(p); U.panels.push(p); }
  U.dayL = new THREE.PointLight('#fff4e0', 0, 14, 1.0); U.dayL.position.set(0, 2.6, -0.5); G.add(U.dayL);
  // desks: 3 x 2, each with a phone, a monitor, a chair
  U.leds = []; U.deskPhones = [];
  for (const dz of [-2.8, 0.4]) for (const dx of [-4.2, -1.4, 1.4]) { const d = new THREE.Group(); d.position.set(dx, 0, dz); G.add(d);
    mesh(rbox(2.0, 0.06, 0.9, 0.02), '#e8e2d6', 0, 0.74, 0, d, 4); for (const s of [-1, 1]) mesh(rbox(0.06, 0.72, 0.8), '#8a8f9e', s * 0.95, 0.36, 0, d, 3);
    mesh(rbox(2.0, 0.55, 0.05, 0.01), '#5a7aa8', 0, 1.02, -0.47, d, 3); mesh(rbox(0.6, 0.38, 0.04, 0.01), '#14121a', -0.35, 1.08, -0.25, d, 3); mesh(rbox(0.05, 0.2, 0.05), '#14121a', -0.35, 0.86, -0.27, d, 1.5); mesh(new THREE.PlaneGeometry(0.55, 0.33), basic('#3a5ab0'), -0.35, 1.08, -0.228, d, 0);
    const ph = deskPhone(d, 0.55, 0.77, 0.05, -0.2, '#2a2c38'); U.leds.push(ph.led); U.deskPhones.push(ph);
    const ch = new THREE.Group(); ch.position.set(0, 0, 0.75); d.add(ch); mesh(rbox(0.5, 0.06, 0.5), '#2a2c38', 0, 0.48, 0, ch, 3); mesh(rbox(0.5, 0.6, 0.06), '#2a2c38', 0, 0.82, 0.25, ch, 3); mesh(cyl(0.03, 0.03, 0.45, 6), '#5a5e68', 0, 0.24, 0, ch, 2);
    for (let k = 0; k < 2; k++) mesh(rbox(0.22, 0.004, 0.3), '#f4efe4', 0.2 - k * 0.08, 0.775 + k * 0.004, 0.15, d, 0); }
  // the PBX rack, back-right corner
  { const r = new THREE.Group(); r.position.set(4.4, 0, -4.6); G.add(r); U.rack = r;
    mesh(rbox(1.0, 2.1, 0.8, 0.02), '#2a2c38', 0, 1.05, 0, r, 4.5); mesh(rbox(0.9, 2.0, 0.04), '#14121a', 0, 1.05, 0.39, r, 2);
    const lt = textCanvas(256, 512, (c, w, hh, t, hot) => { c.fillStyle = '#14121a'; c.fillRect(0, 0, w, hh); const rr = rng(5);
      for (let u = 0; u < 8; u++) { const y0 = 6 + u * 63; c.fillStyle = '#2a2c38'; c.fillRect(6, y0, w - 12, 56); c.fillStyle = '#3a3e48'; c.fillRect(10, y0 + 4, 40, 48);
        for (let i = 0; i < 12; i++) { const on = Math.sin(t * (3 + rr() * 9) + rr() * 9) > (hot ? -0.4 : 0.4); c.fillStyle = on ? (hot && i % 3 === 0 ? '#ff3b4a' : '#3ff07a') : '#1f3a2a'; c.fillRect(60 + i * 15, y0 + 10, 9, 9); c.fillStyle = on && i % 4 === 0 ? '#ffcf3f' : '#3a2a10'; c.fillRect(60 + i * 15, y0 + 32, 9, 9); } } });
    lt.update(0, 0); SCR.leds = lt; const lp = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.6), basic('#ffffff', { map: lt.t })); lp.position.set(0, 0.88, 0.42); lp.userData.noOutline = true; r.add(lp);
    const pt = textCanvas(512, 300, () => {}); SCR.pbx = pt; mesh(rbox(0.66, 0.42, 0.05, 0.01), '#3a3e48', 0, 1.86, 0.42, r, 2.5); const pp = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.35), basic('#ffffff', { map: pt.t })); pp.position.set(0, 1.86, 0.447); pp.userData.noOutline = true; r.add(pp);
    { const tc = textCanvas(512, 96, c => { c.fillStyle = '#e8c35a'; c.fillRect(0, 0, 512, 96); c.fillStyle = '#14121a'; c.font = '900 56px Poppins'; c.textAlign = 'center'; c.fillText('PBX', 256, 70); }); tc.update(); const p = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.094), basic('#ffffff', { map: tc.t })); p.position.set(0, 2.15, 0.41); p.rotation.x = -0.2; p.userData.noOutline = true; r.add(p); }
    for (let i = 0; i < 5; i++) mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(-0.3 + i * 0.12, 2.1, 0), V(-0.3 + i * 0.12, 2.6, -0.1), V(-0.1 + i * 0.1, 2.95, -0.6)]), 16, 0.02, 6), ['#2f6fe0', '#ffcf3f', '#d7263d', '#3ff07a', '#e8e2d6'][i], 0, 0, 0, r, 0);
    U.rackL = new THREE.PointLight('#3ff07a', 3, 3.5, 1.5); U.rackL.position.set(0, 1.2, 1.0); r.add(U.rackL); glow(r, 0, 1.0, 0.6, '#3ff07a', 1.4, 0.25); }
  SCR.clkOff = wallClock(G, x0 + 0.02, 2.2, -1.2, Math.PI / 2, null); SCR.clkOff.update(2, 4);
  { const tc = textCanvas(256, 96, c => { c.fillStyle = '#1f8a3a'; c.fillRect(0, 0, 256, 96); c.fillStyle = '#fff'; c.font = '900 60px Poppins'; c.textAlign = 'center'; c.fillText('EXIT', 128, 72); }); tc.update(); const p = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.19), basic('#ffffff', { map: tc.t })); p.position.set(-2, 2.7, z1 - 0.01); p.rotation.y = Math.PI; p.userData.noOutline = true; G.add(p); }
  mesh(cyl(0.2, 0.16, 0.4, 14), '#e8e2d6', -5.4, 0.2, -5.3, G, 3); for (let i = 0; i < 6; i++) { const l = mesh(new THREE.ConeGeometry(0.14, 1.0, 5), i % 2 ? '#2f7a3a' : '#3f8a44', -5.4 + Math.sin(i) * 0.1, 0.85, -5.3 + Math.cos(i) * 0.1, G, 2.5); l.rotation.set(Math.cos(i * 1.7) * 0.4, 0, Math.sin(i * 1.7) * 0.4); }
  mesh(rbox(0.35, 1.0, 0.35), '#e8eef8', x0 + 0.4, 0.5, 3.2, G, 3.5); mesh(cyl(0.16, 0.16, 0.45, 14), toon('#7fc8ff', { transparent: true, opacity: 0.8 }), x0 + 0.4, 1.24, 3.2, G, 3);
  U.setDay = on => { U.city.material.map = on ? CITY_D : CITY_N; U.hemi.color.set(on ? '#fff4e0' : '#8a9ae0'); U.hemi.intensity = on ? 1.2 : 0.95; U.moon.color.set(on ? '#fff2d8' : '#9ab0ff'); U.moon.intensity = on ? 1.1 : 1.0; U.dayL.intensity = on ? 5 : 0; U.panels.forEach(p => p.material.color.set(on ? '#ffffff' : '#5a5e70')); };
}
const OCARD = { boss: makeCard(OFFICE, 'analyst', 1.76), staff: makeCard(OFFICE, 'cowork1', 1.62) };
