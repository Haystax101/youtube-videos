// =====================================================================================================
// OPS: a dark analysis room. A big glowing map table (dots of infection spread across the world), a wall of
// screens, angled acoustic panels with light strips, and the secret "Olympic Games" folder for beat 10.
// Map: lon -180..180 -> x -3..3, lat 80..-60 -> z -1.5..1.5, table top at y 0.92.
// =====================================================================================================
const CONT = [
  [[-168, 66], [-162, 70], [-140, 70], [-120, 72], [-95, 72], [-80, 73], [-62, 66], [-55, 52], [-66, 45], [-70, 42], [-76, 35], [-81, 31], [-80, 26], [-82, 29], [-90, 30], [-97, 27], [-97, 22], [-92, 18], [-87, 21], [-88, 15], [-83, 9], [-78, 8], [-85, 12], [-92, 15], [-105, 20], [-110, 24], [-114, 31], [-117, 33], [-122, 37], [-124, 42], [-124, 48], [-130, 55], [-140, 60], [-152, 59], [-165, 62]],
  [[-50, 60], [-42, 60], [-20, 70], [-20, 80], [-40, 83], [-60, 80], [-70, 76], [-55, 70]],
  [[-78, 8], [-72, 12], [-62, 10], [-50, 0], [-35, -5], [-38, -13], [-40, -22], [-48, -26], [-58, -35], [-65, -40], [-68, -50], [-72, -53], [-75, -48], [-73, -38], [-71, -30], [-70, -18], [-76, -14], [-81, -5], [-80, 0]],
  [[-10, 36], [-9, 43], [-2, 44], [-5, 48], [2, 51], [8, 54], [10, 57], [5, 58], [8, 63], [15, 68], [25, 71], [40, 68], [45, 60], [50, 47], [40, 45], [30, 46], [28, 41], [23, 37], [20, 40], [19, 42], [16, 41], [18, 40], [16, 38], [15, 40], [12, 42], [10, 44], [8, 44], [3, 43], [-2, 37]],
  [[-17, 15], [-17, 21], [-10, 30], [-6, 35], [10, 37], [20, 32], [32, 31], [35, 28], [43, 12], [51, 12], [44, 0], [40, -10], [40, -16], [35, -24], [32, -29], [20, -35], [18, -30], [12, -18], [13, -8], [9, -1], [9, 4], [0, 5], [-8, 4], [-13, 8]],
  [[28, 41], [36, 36], [35, 32], [43, 12], [52, 16], [58, 22], [62, 25], [67, 24], [72, 20], [77, 8], [80, 15], [88, 22], [92, 22], [98, 16], [100, 13], [103, 1], [104, 10], [109, 12], [108, 21], [117, 23], [122, 30], [121, 40], [126, 38], [129, 35], [130, 43], [142, 47], [140, 54], [156, 58], [163, 62], [180, 66], [180, 71], [140, 73], [110, 77], [80, 73], [68, 69], [55, 68], [45, 68], [40, 68], [45, 60], [50, 47], [40, 45]],
  [[130, 31], [135, 34], [140, 36], [142, 40], [141, 45], [144, 44], [140, 40], [136, 36], [131, 34]],
  [[120, 18], [122, 18.5], [122.5, 14], [124, 12.5], [126, 7.5], [125.5, 6], [122, 7], [121, 10], [120, 14]],
  [[109, 1], [117, 7], [119, 1], [116, -4], [110, -3]], [[95, 5], [98, 4], [106, -6], [104, -5], [100, -1]],
  [[114, -22], [122, -18], [130, -12], [137, -12], [142, -11], [146, -19], [153, -26], [150, -37], [141, -38], [135, -35], [130, -32], [115, -35], [113, -26]],
  [[-6, 50], [1, 51], [2, 53], [-3, 56], [-2, 58], [-6, 58], [-5, 55], [-3, 54], [-5, 52]], [[-10, 52], [-6, 52], [-6, 55], [-9, 54]], [[44, -25], [50, -15], [49, -12], [44, -17]], [[167, -46], [174, -41], [178, -38], [172, -35], [171, -44]]];
// Iran, drawn on top in red when it lights up
const IRAN = [[44, 39.5], [48, 38.5], [49, 37.5], [53, 37], [56, 38], [61, 36.5], [61, 31.5], [63, 29.5], [61.5, 25.2], [57, 25.6], [54, 26.6], [51, 27.8], [50, 30], [48.5, 30], [47.5, 31.5], [46, 33], [45.5, 35.5], [44, 37]];
const PL = { minsk: [27.6, 53.9], iran: [52, 32.5], natanz: [51.9, 33.7], finland: [25, 61], taiwan: [121, 24], dc: [-77, 38.9], israel: [35, 31.5] };
const MAPW = 2048, MAPH = 1024, mx = lo => (lo + 180) / 360 * MAPW, my = la => (80 - la) / 140 * MAPH;
const LL = (lon, lat, y = 0.93) => V(lon / 180 * 3, y, (80 - lat) / 140 * 3 - 1.5);
const MAPBASE = (() => { const c = document.createElement('canvas'); c.width = MAPW; c.height = MAPH; const x = c.getContext('2d');
  const g = x.createRadialGradient(MAPW / 2, MAPH / 2, 50, MAPW / 2, MAPH / 2, MAPW * 0.6); g.addColorStop(0, '#16386a'); g.addColorStop(1, '#0a1630'); x.fillStyle = g; x.fillRect(0, 0, MAPW, MAPH);
  x.strokeStyle = 'rgba(95,208,255,.14)'; x.lineWidth = 2; for (let lo = -180; lo <= 180; lo += 15) { x.beginPath(); x.moveTo(mx(lo), 0); x.lineTo(mx(lo), MAPH); x.stroke(); } for (let la = -60; la <= 80; la += 15) { x.beginPath(); x.moveTo(0, my(la)); x.lineTo(MAPW, my(la)); x.stroke(); }
  for (const poly of CONT) { x.beginPath(); poly.forEach(([lo, la], i) => i ? x.lineTo(mx(lo), my(la)) : x.moveTo(mx(lo), my(la))); x.closePath(); x.fillStyle = '#2a7aa8'; x.fill(); x.lineWidth = 6; x.strokeStyle = '#8fe4ff'; x.stroke(); }
  x.fillStyle = 'rgba(255,255,255,.05)'; for (let y = 0; y < MAPH; y += 6) x.fillRect(0, y, MAPW, 2); return c; })();
// infection dots: a fixed random set over land, weighted ~60% in Iran (the dossier's share)
const INF = (() => { const r = rng(77), out = [], c = document.createElement('canvas').getContext('2d'); const inPoly = (poly, lo, la) => { c.beginPath(); poly.forEach(([a, b], i) => i ? c.lineTo(a, b) : c.moveTo(a, b)); c.closePath(); return c.isPointInPath(lo, la); };
  while (out.length < 340) { const iran = out.length < 204; let lo, la; if (iran) { lo = 44 + r() * 18; la = 25 + r() * 14; if (!inPoly(IRAN, lo, la)) continue; } else { lo = -170 + r() * 340; la = -50 + r() * 120; if (!CONT.some(p => inPoly(p, lo, la)) || inPoly(IRAN, lo, la)) continue; const w = [[110, 0, 0.9], [75, 22, 0.95], [10, 48, 0.6], [-95, 38, 0.6]].some(([a, b, k]) => Math.hypot(lo - a, la - b) < 20 && r() < k); if (!w && r() < 0.55) continue; }
    out.push({ lo, la, iran, t: r() }); } out.sort((a, b) => a.t - b.t); return out; })();
{ const G = OPS, U = G.userData, x0 = -6, x1 = 6, z0 = -5, z1 = 5, h = 3.4;
  const panelT = canvasTex(512, 512, (x, w, hh) => { x.fillStyle = '#1c2340'; x.fillRect(0, 0, w, hh); x.fillStyle = '#242c50'; for (let i = 0; i < 4; i++) x.fillRect(i * 128 + 6, 6, 116, hh - 12); const r = rng(5); for (let i = 0; i < 1200; i++) { x.fillStyle = `rgba(255,255,255,${r() * 0.03})`; x.fillRect(r() * w, r() * hh, 2, 2); } }, true);
  shell(G, { x0, x1, z0, z1, h, wall: toon('#ffffff', { map: panelT, roughness: 0.8 }), floor: toon('#ffffff', { map: canvasTex(256, 256, (x, w, hh) => { const r = rng(15); x.fillStyle = '#2a3150'; x.fillRect(0, 0, w, hh); for (let i = 0; i < 2500; i++) { x.fillStyle = `rgba(255,255,255,${r() * 0.04})`; x.fillRect(r() * w, r() * hh, 2, 2); } }, true) }), ceil: '#141a30' });
  // angled acoustic panels + magenta/cyan light strips on the side walls
  for (const s of [-1, 1]) for (let z = -4; z <= 4; z += 1.6) { const p = mesh(rbox(0.12, 2.2, 1.3, 0.02), s < 0 ? '#2c3a6a' : '#3a2c6a', s * (x1 - 0.25), 1.6, z, G, 0); p.rotation.y = s * 0.35; mesh(rbox(0.04, 2.4, 0.05), basic(s < 0 ? '#3ff0ff' : '#ff4fd8'), s * (x1 - 0.12), 1.6, z + 0.75, G, 0); glow(G, s * (x1 - 0.3), 1.6, z + 0.75, s < 0 ? '#3ff0ff' : '#ff4fd8', 1.4, 0.18); }
  for (let x = -5; x <= 5; x += 2.5) { const b = mesh(rbox(0.5, 0.3, 10, 0.02), '#202848', x, h - 0.15, 0, G, 0); }
  // the map table
  mesh(rbox(6.6, 0.84, 3.6, 0.06), '#1a1f38', 0, 0.42, 0, G, 0); mesh(rbox(6.8, 0.07, 3.8, 0.03), '#c9a46a', 0, 0.875, 0, G, 0);
  const mapC = textCanvas(MAPW, MAPH, () => {}); SCR.map = mapC; const mp = new THREE.Mesh(new THREE.PlaneGeometry(6, 3), basic('#ffffff', { map: mapC.t, toneMapped: false })); mp.rotation.x = -Math.PI / 2; mp.position.y = 0.915; mp.userData.noOutline = true; G.add(mp);
  U.tableGlow = glow(G, 0, 1.3, 0, '#5fd0ff', 7, 0.12);
  // the wall of screens at the back: 3 x 2, the middle one big
  { mesh(rbox(9.2, 2.5, 0.1, 0.02), '#0a0c18', 0, 1.95, z0 + 0.06, G, 0); const wl = textCanvas(1024, 512, () => {}); SCR.opswall = wl; plane(G, 4.4, 2.2, basic('#ffffff', { map: wl.t }), 0, 1.95, z0 + 0.12).userData.noOutline = true;
    const side = textCanvas(512, 512, () => {}); SCR.side = side; for (const s of [-1, 1]) for (const yy of [1.4, 2.5]) { plane(G, 2.1, 1.0, basic('#ffffff', { map: side.t }), s * 3.35, yy, z0 + 0.12).userData.noOutline = true; } }
  // chairs around the table + lights
  for (const [cx, cz, r] of [[-2.2, 2.4, Math.PI], [0, 2.5, Math.PI], [2.2, 2.4, Math.PI], [-3.9, 0, -Math.PI / 2], [3.9, 0, Math.PI / 2]]) chair(G, cx, cz, r, '#2f4f6e');
  G.add(new THREE.HemisphereLight('#8fb0ff', '#1a1430', 0.9)); const key = new THREE.PointLight('#bfe8ff', 10, 10, 1.3); key.position.set(0, 3.0, 1.2); G.add(key);
  const spot = new THREE.SpotLight('#fff2dc', 30, 12, 0.6, 0.5, 1.2); spot.position.set(0, h - 0.1, 0.5); spot.target.position.set(0, 0.9, 0); spot.castShadow = true; G.add(spot, spot.target);
  // pins + arcs on the map (moved per frame), the folder
  U.pins = {}; for (const [k, col] of [['minsk', '#ffcf3f'], ['natanz', '#ff3b4a'], ['finland', '#3ff07a'], ['taiwan', '#c58aff'], ['dc', '#ffffff'], ['israel', '#ffffff']]) { const pg = new THREE.Group(); pg.position.copy(LL(...PL[k])); G.add(pg); mesh(cyl(0.012, 0.012, 0.3, 8), '#e8e2d6', 0, 0.15, 0, pg, 0); mesh(sph(0.045, 14), toon(col, { emissive: col, emissiveIntensity: 0.4 }), 0, 0.31, 0, pg, 0); glow(pg, 0, 0.31, 0, col, 0.35, 0.6); pg.visible = false; U.pins[k] = pg; }
  { const fg = new THREE.Group(); G.add(fg); U.folder = fg; const ft = canvasTex(512, 380, (x, w, hh) => { x.fillStyle = '#d9b46a'; x.fillRect(0, 0, w, hh); x.fillStyle = '#c99e52'; x.fillRect(0, 0, w, 30); x.strokeStyle = '#d7263d'; x.lineWidth = 10; x.strokeRect(70, 70, w - 140, 90); x.fillStyle = '#d7263d'; x.font = '900 60px Poppins'; x.textAlign = 'center'; x.fillText('TOP SECRET', w / 2, 136); x.fillStyle = '#14121a'; x.font = '900 52px Poppins'; x.fillText('OLYMPIC GAMES', w / 2, 260); x.font = '700 28px Poppins'; x.fillText('CODE NAME', w / 2, 300); });
    mesh(rbox(0.62, 0.02, 0.46, 0.005), '#c99e52', 0, 0, 0, fg, 0); plane(fg, 0.6, 0.445, toon('#ffffff', { map: ft }), 0, 0.011, 0, -Math.PI / 2).userData.noOutline = true; fg.position.set(0.9, -10, 0.9); fg.rotation.y = -0.25; }
}
const OCARD = { off1: makeCard(OPS, 'official1', 1.76), off2: makeCard(OPS, 'official2', 1.72), an: makeCard(OPS, 'labmate', 1.66), an2: makeCard(OPS, 'operator2', 1.72) };
