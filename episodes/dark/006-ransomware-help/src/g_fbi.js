// =====================================================================================================
// FBI: the sting room. Two high desks under hanging signs, "THE VICTIM" (left, blue, a fake company's laptop and
// mug) and "THE GANG" (right, red light, a hooded undercover agent, a skull on the laptop), a supervisor between
// them, a big wall screen that shows both chats meeting in one room, evidence board, cabinets, coffee station.
// =====================================================================================================
SCR.fbiwall = textCanvas(1280, 640, () => {}); SCR.vict = textCanvas(640, 400, () => {}); SCR.gangl = textCanvas(640, 400, () => {});
{ const G = FBI, U = G.userData, x0 = -7, x1 = 7, z0 = -5, z1 = 5.5, h = 3.5;
  const panelT = canvasTex(512, 512, (x, w, hh) => { x.fillStyle = '#1f2a4a'; x.fillRect(0, 0, w, hh); x.fillStyle = '#26335a'; for (let i = 0; i < 4; i++) x.fillRect(i * 128 + 5, 5, 118, hh - 10); x.fillStyle = '#18213c'; x.fillRect(0, hh * 0.74, w, hh * 0.26); const r = rng(5); for (let i = 0; i < 1200; i++) { x.fillStyle = `rgba(255,255,255,${r() * 0.03})`; x.fillRect(r() * w, r() * hh, 2, 2); } }, true);
  const floorT = canvasTex(512, 512, (x, w, hh) => { const r = rng(12); for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) { x.fillStyle = `hsl(220,${10 + r() * 4}%,${26 + r() * 5}%)`; x.fillRect(i * 64 + 1, j * 64 + 1, 62, 62); } }, true);
  shell(G, { x0, x1, z0, z1, h, wall: toon('#ffffff', { map: panelT, roughness: 0.8 }), floor: toon('#ffffff', { map: floorT, roughness: 0.7 }), ceil: '#141a30' });
  // the wall screen + emblem
  mesh(rbox(5.6, 2.5, 0.1, 0.02), '#0a0c18', 0, 1.85, z0 + 0.06, G, 0); { const p = plane(G, 5.3, 2.25, basic('#ffffff', { map: SCR.fbiwall.t, toneMapped: false }), 0, 1.85, z0 + 0.12); p.userData.noOutline = true; } U.wallGlow = glow(G, 0, 1.85, z0 + 0.6, '#5fd0ff', 6, 0.12);
  painted(G, 0.8, 0.8, 256, 256, (c, w) => { c.fillStyle = '#e8c35a'; c.beginPath(); c.arc(128, 128, 124, 0, 7); c.fill(); c.fillStyle = '#1d2a4a'; c.beginPath(); c.arc(128, 128, 104, 0, 7); c.fill(); c.strokeStyle = '#e8c35a'; c.lineWidth = 6; c.beginPath(); c.arc(128, 128, 88, 0, 7); c.stroke(); c.fillStyle = '#ffffff'; c.font = '900 66px Poppins'; c.textAlign = 'center'; c.fillText('FBI', 128, 130); c.font = '800 20px Poppins'; c.fillStyle = '#e8c35a'; c.fillText('CYBER SQUAD', 128, 168); for (let k = 0; k < 5; k++) { c.beginPath(); c.arc(78 + k * 25, 72, 5, 0, 7); c.fill(); } }, -3.6, 2.55, z0 + 0.03, 0, { alpha: true });
  for (const [cx, txt] of [[3.6, 'OPERATION: BOTH SIDES']]) painted(G, 2.6, 0.32, 768, 96, (c, w, hh) => { c.clearRect(0, 0, w, hh); c.fillStyle = '#e8c35a'; c.font = '900 54px Poppins'; c.textAlign = 'center'; c.fillText(txt, w / 2, 66); }, cx, 2.6, z0 + 0.03, 0, { alpha: true });
  // light strips and ceiling beams
  for (let x = -6; x <= 6; x += 3) { mesh(rbox(0.4, 0.25, 10.5, 0.02), '#1a2240', x, h - 0.13, 0.25, G, 0); const s = mesh(rbox(0.12, 0.02, 9, 0.005), basic('#e6f0ff'), x, h - 0.26, 0.25, G, 0); s.userData.noOutline = true; }
  G.add(new THREE.HemisphereLight('#b8c8ff', '#2a2440', 1.35)); { const key = new THREE.SpotLight('#fff2dc', 40, 16, 0.85, 0.5, 1.2); key.position.set(0, h - 0.1, 3); key.target.position.set(0, 0.8, -0.5); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0004; G.add(key, key.target); }
  for (const [lx, lz, col, k] of [[-3.4, 1.2, '#a8d4ff', 14], [3.4, 1.2, '#ff3a4a', 12], [0, 3.5, '#fff0dc', 10], [-3.4, 3.2, '#fff0dc', 6], [3.4, 3.2, '#fff0dc', 6]]) { const p = new THREE.PointLight(col, k, 7, 1.3); p.position.set(lx, 2.3, lz); G.add(p); if (col === '#ff3a4a') U.redP = p; }
  // the two pods: high desks (top y 1.02) with laptops facing the agents (who stand at +z), hanging signs above
  const pod = (px, col, deskCol, scr, label) => { const d = new THREE.Group(); d.position.set(px, 0, -0.4); G.add(d); mesh(rbox(2.2, 0.06, 0.9, 0.02), deskCol, 0, 1.02, 0, d, 0);
    for (const s of [-1, 1]) mesh(rbox(0.07, 1.0, 0.75, 0.02), '#2a2e3a', s * 1.0, 0.5, 0, d, 0); mesh(rbox(2.0, 0.6, 0.03, 0.01), deskCol, 0, 0.62, -0.38, d, 0);
    const lt = laptop(d, -0.35, 1.05, 0.0, 0, scr); const m2 = monitor(d, 0.45, 1.05, -0.2, -0.15, 0.6, 0.36, scr);
    d.userData.sign = hangSign(G, label, col, px, 2.75, -0.4, 2.2); return { d, lt, m2 }; };
  U.vpod = pod(-3.4, '#5fd0ff', '#c9d2de', SCR.vict.t, 'THE VICTIM'); U.gpod = pod(3.4, '#ff3b4a', '#2a2430', SCR.gangl.t, 'THE GANG');
  // victim desk dressing: company mug, a printed ransom note, a fake company badge
  mesh(cyl(0.045, 0.04, 0.11, 14), '#e07a4a', -1.0 + -3.4 + 3.4 - 0.0, 1.105, 0.25, U.vpod.d, 0).position.set(-0.85, 1.105, 0.2);
  painted(U.vpod.d, 0.24, 0.32, 128, 170, (c, w, hh) => { c.fillStyle = '#fbf8ee'; c.fillRect(0, 0, w, hh); c.fillStyle = '#d7263d'; c.font = '900 20px Poppins'; c.textAlign = 'center'; c.fillText('YOUR FILES', w / 2, 34); c.fillText('ARE LOCKED', w / 2, 58); c.fillStyle = '#5a5e70'; for (let k = 0; k < 5; k++) c.fillRect(16, 80 + k * 16, 96 - (k * 23 % 30), 6); }, 0.75, 1.052, 0.2, 0).rotation.set(-Math.PI / 2, 0, 0.3);
  // gang desk dressing: red LED strip, skull sticker on the monitor back, energy drink cans, a hoodie-dark chair
  { const strip = mesh(rbox(2.0, 0.02, 0.02, 0.005), basic('#ff3b4a'), 0, 0.99, 0.46, U.gpod.d, 0); strip.userData.noOutline = true; glow(U.gpod.d, 0, 1.0, 0.5, '#ff3b4a', 2.2, 0.25);
    for (let k = 0; k < 3; k++) mesh(cyl(0.033, 0.033, 0.12, 12), ['#3ff07a', '#14121a', '#ff3b4a'][k], -0.9 + k * 0.08, 1.11, 0.25, U.gpod.d, 0);
    painted(U.gpod.d, 0.2, 0.2, 128, 128, (c, w) => { c.fillStyle = '#f4efe4'; c.beginPath(); c.arc(64, 56, 40, 0, 7); c.fill(); c.fillRect(42, 80, 44, 26); c.fillStyle = '#14121a'; c.beginPath(); c.arc(48, 56, 11, 0, 7); c.arc(80, 56, 11, 0, 7); c.fill(); for (let k = 0; k < 3; k++) c.fillRect(48 + k * 12, 88, 6, 16); }, -0.35, 1.2, -0.16, Math.PI, { alpha: true }); }
  // supervisor's spot: a small round table between the pods with a phone and coffee
  
  // left wall: the evidence board; right wall: cabinets + coffee station; back corners: flags of light, plants
  { const b = new THREE.Group(); b.position.set(x0 + 0.05, 1.7, 2.0); b.rotation.y = Math.PI / 2; G.add(b); mesh(rbox(3.2, 1.6, 0.05, 0.01), '#6a4a2a', 0, 0, 0, b, 0);
    painted(b, 3.05, 1.45, 768, 366, (c, w, hh) => { c.fillStyle = '#c9a46a'; c.fillRect(0, 0, w, hh); const r = rng(4); const pts = []; for (let k = 0; k < 9; k++) { const px = 60 + (k % 5) * 150 + r() * 30, py = 50 + Math.floor(k / 5) * 170 + r() * 30; pts.push([px + 50, py + 40]); c.save(); c.translate(px, py); c.rotate((r() - 0.5) * 0.2); c.fillStyle = k % 3 ? '#fbf8ee' : '#f4e27a'; c.fillRect(0, 0, 100, 110); c.fillStyle = '#5a5e70'; for (let q = 0; q < 5; q++) c.fillRect(10, 18 + q * 16, 80 - (q * 17 % 30), 6); c.restore(); }
      c.strokeStyle = '#d7263d'; c.lineWidth = 4; c.beginPath(); for (let k = 0; k < pts.length; k++) { const [a, b2] = pts[k], [c2, d2] = pts[(k * 3 + 2) % pts.length]; c.moveTo(a, b2); c.lineTo(c2, d2); } c.stroke(); for (const [a, b2] of pts) { c.fillStyle = '#d7263d'; c.beginPath(); c.arc(a, b2 - 40, 7, 0, 7); c.fill(); } }, 0, 0, 0.03); }
  for (const z of [-3.6, -3.0, 3.6, 4.2]) filingCab(G, x1 - 0.35, z, -Math.PI / 2, '#3a4260');
  mesh(rbox(0.6, 0.9, 1.6, 0.03), '#2a2e3a', x1 - 0.32, 0.45, 0.6, G, 0); mesh(rbox(0.3, 0.4, 0.3, 0.03), '#14121a', x1 - 0.32, 1.1, 0.3, G, 0); for (let k = 0; k < 4; k++) mesh(cyl(0.04, 0.035, 0.1, 12), '#ffffff', x1 - 0.3, 0.95, 0.75 + k * 0.12, G, 0);
  pottedPlant(G, -6.3, -4.4, 1.0, '#2a2e3a'); pottedPlant(G, 6.3, -4.4, 1.0, '#2a2e3a');
  U.clock = wallClock(G, 3.6, 2.05, z0 + 0.04, 0);
}
