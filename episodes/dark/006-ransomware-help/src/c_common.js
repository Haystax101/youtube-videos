// =====================================================================================================
// SETS: the victim office at night (ransomware hit), the Florida recovery firm, the FBI sting room, and a
// Las Vegas street at night (the arrest). Each set lives in its own group far apart.
// =====================================================================================================
const OFFICE = ROOT;
const FIRM = new THREE.Group(); FIRM.position.set(120, 0, 0); scene.add(FIRM);
const FBI = new THREE.Group(); FBI.position.set(260, 0, 0); scene.add(FBI);
const VEGAS = new THREE.Group(); VEGAS.position.set(400, 0, 0); scene.add(VEGAS);
const SETS = { office: OFFICE, firm: FIRM, fbi: FBI, vegas: VEGAS };

// a wall along x at z = zw with a window hole (xa..xb, ya..yb)
function windowWallX(G, mat, x0, x1, zw, h, xa, xb, ya, yb, ry = 0) { const pc = (a, b, y0, y1) => { const mt = mat.clone(); mt.map = mat.map.clone(); mt.map.needsUpdate = true; mt.map.repeat.set((b - a) / 2, (y1 - y0) / 2); plane(G, b - a, y1 - y0, mt, (a + b) / 2, (y0 + y1) / 2, zw, 0, ry); };
  pc(x0, xa, 0, h); pc(xb, x1, 0, h); pc(xa, xb, 0, ya); pc(xa, xb, yb, h); }

// the USB stick: red rubber body, steel plug with the two square holes, a key ring, a status LED
function usbStick(G, s = 1) { const u = new THREE.Group(); G.add(u); u.scale.setScalar(s);
  mesh(rbox(0.062, 0.02, 0.024, 0.008), toon('#d7263d', { roughness: 0.55 }), 0, 0, 0, u, 0);
  mesh(rbox(0.004, 0.012, 0.016, 0.002), '#a8261e', -0.031, 0, 0, u, 0);
  const plug = mesh(rbox(0.024, 0.0045, 0.014, 0.001), toon('#d9dde3', { roughness: 0.2, metalness: 0.9 }), 0.043, 0, 0, u, 0);
  for (const dz of [-0.003, 0.003]) mesh(new THREE.BoxGeometry(0.0035, 0.0012, 0.0035), basic('#1a1a20'), 0.047, 0.0023, dz, u, 0);
  mesh(new THREE.TorusGeometry(0.007, 0.0016, 6, 16), toon('#c9ccd6', { metalness: 0.8, roughness: 0.3 }), -0.039, 0, 0, u, 0).rotation.x = Math.PI / 2;
  const led = mesh(new THREE.BoxGeometry(0.004, 0.0012, 0.004), basic('#5fd0ff'), 0.018, 0.0101, 0, u, 0);
  const lbl = canvasTex(128, 48, (x, w, h) => { x.fillStyle = '#f4efe4'; x.fillRect(0, 0, w, h); x.fillStyle = '#14121a'; x.font = '900 30px Poppins'; x.textAlign = 'center'; x.fillText('8 GB', w / 2, 36); });
  const lp = plane(u, 0.026, 0.01, basic('#ffffff', { map: lbl }), -0.008, 0.01015, 0, -Math.PI / 2); lp.userData.noOutline = true;
  u.userData.led = led; u.userData.glow = glow(u, 0.018, 0.012, 0, '#5fd0ff', 0.03, 0.6); return u; }

// a potted plant from painted leaf cards (never spheres)
const plantTex = canvasTex(256, 384, (x, w, h) => { const r = rng(44);
  for (let i = 0; i < 26; i++) { const a = -1.25 + r() * 2.5, L = 120 + r() * 200, base = [128 + (r() - 0.5) * 20, 380]; x.save(); x.translate(...base); x.rotate(a * 0.6);
    x.strokeStyle = '#2f5a22'; x.lineWidth = 4; x.beginPath(); x.moveTo(0, 0); x.lineTo(0, -L * 0.55); x.stroke(); x.translate(0, -L * 0.55); x.rotate(a * 0.3);
    const lw = 26 + r() * 16, ll = 70 + r() * 70, gr = x.createLinearGradient(0, 0, 0, -ll); gr.addColorStop(0, '#2f7a24'); gr.addColorStop(1, i % 2 ? '#7fd34e' : '#5fbf3a'); x.fillStyle = gr;
    x.beginPath(); x.moveTo(0, 0); x.bezierCurveTo(-lw, -ll * 0.3, -lw * 0.8, -ll * 0.85, 0, -ll); x.bezierCurveTo(lw * 0.8, -ll * 0.85, lw, -ll * 0.3, 0, 0); x.fill();
    x.strokeStyle = 'rgba(220,255,190,.5)'; x.lineWidth = 2.5; x.beginPath(); x.moveTo(0, -4); x.lineTo(0, -ll * 0.9); x.stroke(); x.restore(); } });
const plantMat = new THREE.MeshStandardMaterial({ map: plantTex, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.75 });
function pottedPlant(G, x, z, s = 1, pot = '#c8643a') { const p = new THREE.Group(); p.position.set(x, 0, z); p.scale.setScalar(s); G.add(p);
  mesh(cyl(0.2, 0.15, 0.36, 18), pot, 0, 0.18, 0, p, 0); mesh(cyl(0.21, 0.21, 0.05, 18), pot, 0, 0.36, 0, p, 0); mesh(cyl(0.18, 0.18, 0.02, 18), '#4a3424', 0, 0.37, 0, p, 0);
  for (const a of [0, 1.05, 2.1]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 1.12).translate(0, 0.56 + 0.34, 0), plantMat); m.rotation.y = a; m.userData.noOutline = true; p.add(m); }
  return p; }

// painted sky with clouds for daylight sets
const cloudTex = canvasTex(256, 128, (x, w, h) => { const r = rng(6); for (let i = 0; i < 30; i++) { const cx = 40 + r() * 176, cy = 56 + r() * 34 - Math.abs(cx - 128) * 0.12, rad = 16 + r() * 30; const g = x.createRadialGradient(cx, cy - rad * 0.3, 2, cx, cy, rad); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.8, 'rgba(246,250,255,1)'); g.addColorStop(0.93, 'rgba(232,240,252,.9)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); } });
function clouds(G, n, rMin, rMax, yMin, yMax, seed, tint = '#ffffff') { const r = rng(seed); for (let i = 0; i < n; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTex, color: tint, transparent: true, fog: false, depthWrite: false })); const a = r() * 6.283, d = rMin + r() * (rMax - rMin);
  s.position.set(Math.cos(a) * d, yMin + r() * (yMax - yMin), Math.sin(a) * d); s.scale.set(d * 0.22 * (0.8 + r() * 0.6), d * 0.1 * (0.8 + r() * 0.4), 1); s.userData.noOutline = true; G.add(s); } }
// mountain ranges (aerial perspective in layers)
function range(G, radius, count, hMin, hMax, color, seed, a0 = 0, a1 = 6.283, cz = 0) { const r = rng(seed), geo = new THREE.ConeGeometry(1, 1, 7, 4); const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y > -0.49 && y < 0.49) { p.setX(i, p.getX(i) * (1 + (r() - 0.5) * 0.3)); p.setZ(i, p.getZ(i) * (1 + (r() - 0.5) * 0.3)); } } geo.computeVertexNormals(); geo.translate(0, 0.5, 0);
  const mat = new THREE.MeshLambertMaterial({ color, fog: false }); const m = new THREE.InstancedMesh(geo, mat, count); const d = new THREE.Object3D();
  for (let i = 0; i < count; i++) { const a = a0 + r() * (a1 - a0), h = hMin + r() * (hMax - hMin), rr = radius + r() * radius * 0.12; d.position.set(Math.cos(a) * rr, -1, Math.sin(a) * rr + cz); d.scale.set(h * (1.3 + r() * 0.7), h, h * (1.2 + r() * 0.6)); d.rotation.y = a * 3; d.updateMatrix(); m.setMatrixAt(i, d.matrix); }
  m.userData.noOutline = true; G.add(m); return m; }
// small reusable bits
const STEEL = toon('#b9c0cc', { roughness: 0.35, metalness: 0.6 }), DSTEEL = toon('#5a6272', { roughness: 0.5, metalness: 0.4 });
function snowSprites(G, n, box) { return Array.from({ length: n }, () => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#ffffff', transparent: true, opacity: 0.9, depthWrite: false })); s.scale.setScalar(0.06); s.userData = { noOutline: true, a: Math.random(), b: Math.random(), c: Math.random(), box }; G.add(s); return s; }); }
function snowFall(list, t) { list.forEach(s => { const u = s.userData, [x0, x1, y0, y1, z0, z1] = u.box, kk = (u.a + t * (0.06 + u.c * 0.05)) % 1; s.position.set(x0 + u.b * (x1 - x0) + Math.sin(t + u.a * 9) * 0.25, y1 - kk * (y1 - y0), z0 + u.c * (z1 - z0)); }); }
