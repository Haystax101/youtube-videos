
// ---------- MAP: the war-room table. An 8 x 4 m world map (lon -180..180 -> x -4..4, lat 80..-60 -> z -2..2) at y 0.9,
// glowing pins and call arcs that grow, coins that fly back along an arc ----------
const LL = (lon, lat) => V(lon / 180 * 4, 0.92, (80 - lat) / 140 * 4 - 2);
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
const PLACES = { manila: [121, 14.6], ny: [-74, 40.7], nj: [-74.4, 40.2], la: [-118, 34], chi: [-87.6, 41.9], tor: [-79.4, 43.7], van: [-123, 49.3], syd: [151, -33.9], mel: [145, -37.8], lon: [-0.1, 51.5], bre: [10.2, 45.5], ber: [13.4, 52.5], par: [2.3, 48.9], mad: [-3.7, 40.4], hou: [-95.4, 29.8], prem: [20, -5], mum: [72.9, 19.1], dal: [-96.8, 32.8], atl: [-84.4, 33.7] };
{ const G = MAP, U = G.userData;
  const mt = canvasTex(2048, 1024, (x, w, h) => { const g = x.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, w * 0.6); g.addColorStop(0, '#13305a'); g.addColorStop(1, '#081428'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.strokeStyle = 'rgba(95,208,255,.14)'; x.lineWidth = 2; for (let lo = -180; lo <= 180; lo += 15) { const px = (lo + 180) / 360 * w; x.beginPath(); x.moveTo(px, 0); x.lineTo(px, h); x.stroke(); } for (let la = -60; la <= 80; la += 15) { const py = (80 - la) / 140 * h; x.beginPath(); x.moveTo(0, py); x.lineTo(w, py); x.stroke(); }
    for (const poly of CONT) { x.beginPath(); poly.forEach(([lo, la], i) => { const px = (lo + 180) / 360 * w, py = (80 - la) / 140 * h; i ? x.lineTo(px, py) : x.moveTo(px, py); }); x.closePath(); x.fillStyle = '#2a7aa8'; x.fill(); x.lineWidth = 6; x.strokeStyle = '#8fe4ff'; x.stroke(); }
    { const r = rng(91); for (const poly of CONT) { const xs = poly.map(q => q[0]), ys = poly.map(q => q[1]); for (let i = 0; i < 40; i++) { const lo = Math.min(...xs) + r() * (Math.max(...xs) - Math.min(...xs)), la = Math.min(...ys) + r() * (Math.max(...ys) - Math.min(...ys)); const px = (lo + 180) / 360 * w, py = (80 - la) / 140 * h; x.beginPath(); poly.forEach(([a, b], j) => { const qx = (a + 180) / 360 * w, qy = (80 - b) / 140 * h; j ? x.lineTo(qx, qy) : x.moveTo(qx, qy); }); x.closePath(); if (!x.isPointInPath(px, py)) continue; x.fillStyle = r() < 0.3 ? 'rgba(255,214,120,.95)' : 'rgba(190,240,255,.8)'; x.beginPath(); x.arc(px, py, 2 + r() * 3, 0, 7); x.fill(); } } }
    x.fillStyle = 'rgba(255,255,255,.05)'; for (let y = 0; y < h; y += 6) x.fillRect(0, y, w, 2); });
  const tbl = mesh(rbox(8.6, 0.8, 4.6, 0.02), '#1a1d2e', 0, 0.45, 0, G, 5); mesh(rbox(8.8, 0.06, 4.8, 0.01), '#3a3e58', 0, 0.87, 0, G, 3);
  const mp = new THREE.Mesh(new THREE.PlaneGeometry(8, 4), basic('#ffffff', { map: mt })); mp.rotation.x = -Math.PI / 2; mp.position.y = 0.905; mp.userData.noOutline = true; G.add(mp);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), toon('#ffffff', { map: gridTex })); fl.material.map.repeat.set(10, 10); fl.rotation.x = -Math.PI / 2; fl.userData.noHull = true; fl.receiveShadow = true; G.add(fl);
  G.add(new THREE.HemisphereLight('#5f8aff', '#0a0a18', 0.9)); const key = new THREE.PointLight('#7fd8ff', 10, 12, 1.2); key.position.set(0, 4, 1); G.add(key);
  const rim = new THREE.DirectionalLight('#ff5fa8', 0.5); rim.position.set(-6, 3, -6); G.add(rim);
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; mesh(rbox(1.2, 2.2, 0.1, 0.02), '#14121a', Math.sin(a) * 9, 1.6, Math.cos(a) * 9 - 3, G, 3).rotation.y = a; }
  { const sky = new THREE.Mesh(new THREE.SphereGeometry(60, 24, 16), basic('#05040c', { side: THREE.BackSide, fog: false })); sky.userData.noOutline = true; G.add(sky); }
  U.pins = {}; for (const [k, [lo, la]] of Object.entries(PLACES)) { const p = new THREE.Group(); p.position.copy(LL(lo, la)); G.add(p); const col = k === 'manila' ? '#ff3b4a' : k === 'bre' ? '#3ff07a' : k === 'prem' ? '#ffcf3f' : k === 'mum' ? '#ff8a3a' : '#5fd0ff';
    mesh(new THREE.ConeGeometry(0.05, 0.16, 10).rotateX(Math.PI), col, 0, 0.1, 0, p, 1.5); mesh(sph(0.055, 12), col, 0, 0.2, 0, p, 1.5); const gl = glow(p, 0, 0.12, 0, col, 0.6, 0.6); p.scale.setScalar(0.001); U.pins[k] = p; }
  // arcs
  U.arcs = {}; const arc = (key, a, b, col, hgt = 0.5) => { const A = LL(...PLACES[a]), Bp = LL(...PLACES[b]); const mid = A.clone().lerp(Bp, 0.5); mid.y += hgt + A.distanceTo(Bp) * 0.22;
    const curve = new THREE.QuadraticBezierCurve3(A.clone().setY(1.0), mid, Bp.clone().setY(1.0)); const geo = new THREE.TubeGeometry(curve, 80, 0.026, 6); const m = new THREE.Mesh(geo, basic(col)); m.userData.noOutline = true; G.add(m); geo.setDrawRange(0, 0); U.arcs[key] = { m, geo, curve }; };
  arc('mnl_ny', 'manila', 'ny', '#ff3b4a', 0.6); arc('mnl_nj', 'manila', 'nj', '#ff3b4a', 0.3); arc('mnl_la', 'manila', 'la', '#ff3b4a', 0.2); arc('mnl_chi', 'manila', 'chi', '#ff3b4a', 0.4);
  arc('bre_ny', 'bre', 'ny', '#3ff07a', 0.3); arc('ny_mnl2', 'ny', 'manila', '#ffcf3f', 0.9); arc('ny_world', 'ny', 'syd', '#ffcf3f', 0.4); arc('ny_lon', 'ny', 'lon', '#ffcf3f', 0.2);
  arc('ny_prem', 'ny', 'prem', '#ffcf3f', 0.4); arc('prem_mnl', 'prem', 'manila', '#ffcf3f', 0.3); arc('mnl_mum', 'manila', 'mum', '#ff8a3a', 0.25);
  U.coins = []; for (let i = 0; i < 10; i++) { const c = mesh(cyl(0.07, 0.07, 0.02, 16).rotateX(Math.PI / 2), '#ffcf3f', 0, -5, 0, G, 2); U.coins.push(c); }
  // label tiles that float above key pins
  U.tags = {}; for (const [k, txt, col] of [['manila', 'MANILA', '#ff3b4a'], ['bre', 'BRESCIA', '#3ff07a'], ['ny', 'USA', '#5fd0ff'], ['prem', 'PREMIUM LINES', '#ffcf3f']]) { const tc = textCanvas(512, 128, (c, w, hh) => { c.fillStyle = 'rgba(8,6,16,.88)'; c.beginPath(); c.roundRect(4, 4, w - 8, hh - 8, 24); c.fill(); c.lineWidth = 8; c.strokeStyle = col; c.stroke(); c.fillStyle = '#fff'; c.font = '900 64px Poppins'; c.textAlign = 'center'; c.fillText(txt, w / 2, 88); }); tc.update();
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tc.t, depthTest: false, sizeAttenuation: false })); s.scale.set(0.2, 0.05, 1); s.position.copy(LL(...PLACES[k])).add(V(0, 0.42, 0)); s.userData.noOutline = true; s.renderOrder = 5; G.add(s); s.visible = false; U.tags[k] = s; }
}
