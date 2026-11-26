const basic = (color, o = {}) => new THREE.MeshBasicMaterial({ color, ...o });
const glowTex = canvasTex(64, 64, (x, w) => { const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, w); });
function glow(G, x, y, z, color, s = 0.5, op = 0.8) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending })); sp.position.set(x, y, z); sp.scale.setScalar(s); sp.userData.noOutline = true; G.add(sp); return sp; }
function textCanvas(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; const o = { c, x: c.getContext('2d'), t, w, h, draw, key: null }; o.update = (...a) => { const k = JSON.stringify(a); if (k === o.key) return; o.key = k; draw(o.x, w, h, ...a); t.needsUpdate = true; }; return o; }
function neonSign(G, text, color, x, y, z, ry = 0, hgt = 0.7, font = 900) {
  const len = text.length, cw = Math.max(256, 120 * len + 80), tc = textCanvas(cw, 200, (cx, w, h, on = 1) => { cx.clearRect(0, 0, w, h);
    cx.fillStyle = 'rgba(8,6,16,.88)'; cx.beginPath(); cx.roundRect(6, 6, w - 12, h - 12, 26); cx.fill(); cx.lineWidth = 10; cx.strokeStyle = on ? color : '#333'; cx.stroke();
    cx.font = `${font} 130px Poppins, sans-serif`; cx.textAlign = 'center'; cx.textBaseline = 'middle';
    if (on) { cx.shadowColor = color; cx.shadowBlur = 30; } cx.fillStyle = on ? '#ffffff' : '#3a3a44'; cx.fillText(text, w / 2, h / 2 + 8); cx.shadowBlur = 0; cx.lineWidth = 5; cx.strokeStyle = on ? color : '#222'; cx.strokeText(text, w / 2, h / 2 + 8); });
  tc.update(1); const m = new THREE.Mesh(new THREE.PlaneGeometry(hgt * cw / 200, hgt), basic('#ffffff', { map: tc.t, transparent: true })); m.position.set(x, y, z); m.rotation.y = ry; m.userData.noOutline = true; G.add(m);
  const g = glow(G, x, y, z - 0.05 * Math.cos(ry), color, hgt * cw / 200 * 1.3, 0.35); return { m, tc, g, set(on) { tc.update(on ? 1 : 0); g.visible = !!on; } };
}
function skyDome(G, draw, r = 95) { const t = canvasTex(1024, 1024, draw); const m = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 20), basic('#ffffff', { map: t, side: THREE.BackSide, fog: false })); m.userData.noOutline = true; G.add(m); return m; }

// ---------- painted textures ----------
const stuccoTex = canvasTex(512, 512, (x, w, h) => { const r = rng(3); x.fillStyle = '#ece3d2'; x.fillRect(0, 0, w, h); for (let i = 0; i < 1800; i++) { x.fillStyle = `rgba(${r() < 0.5 ? '120,100,80' : '255,255,255'},${0.04 + r() * 0.06})`; x.fillRect(r() * w, r() * h, 2 + r() * 4, 2 + r() * 4); }
  for (let i = 0; i < 6; i++) { x.strokeStyle = 'rgba(110,90,70,.18)'; x.lineWidth = 2; x.beginPath(); let px = r() * w, py = r() * h; x.moveTo(px, py); for (let k = 0; k < 5; k++) { px += (r() - 0.5) * 50; py += r() * 30; x.lineTo(px, py); } x.stroke(); }
  x.fillStyle = 'rgba(90,70,50,.22)'; x.fillRect(0, h - 40, w, 40); }, true);
const roadTex = canvasTex(1024, 512, (x, w, h) => { const r = rng(8); x.fillStyle = '#3d3a44'; x.fillRect(0, 0, w, h); for (let i = 0; i < 5000; i++) { x.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '255,255,255'},${r() * 0.07})`; x.fillRect(r() * w, r() * h, 2, 2); }
  x.fillStyle = '#e8c35a'; for (let u = 0; u < w; u += 160) x.fillRect(u + 20, h / 2 - 6, 90, 12); x.fillStyle = 'rgba(0,0,0,.25)'; for (let i = 0; i < 6; i++) { x.beginPath(); x.ellipse(r() * w, r() * h, 40 + r() * 60, 10 + r() * 20, 0, 0, 7); x.fill(); } }, true);
const paveTex = canvasTex(512, 512, (x, w, h) => { const r = rng(11); x.fillStyle = '#9c8f84'; x.fillRect(0, 0, w, h); const s = 64; for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) { x.fillStyle = `hsl(25,${8 + r() * 6}%,${52 + r() * 8}%)`; x.fillRect(i * s + 3 + (j % 2) * 32, j * s + 3, s - 6, s - 6); } }, true);
const grassTex = canvasTex(256, 256, (x, w, h) => { const r = rng(14); x.fillStyle = '#3f7a3a'; x.fillRect(0, 0, w, h); for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(${r() < 0.5 ? '120,180,80' : '20,60,30'},.35)`; x.fillRect(r() * w, r() * h, 2, 5); } }, true);
const poolTex = canvasTex(512, 512, (x, w, h) => { x.fillStyle = '#2bb6d9'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = 4; for (let i = 0; i < 26; i++) { x.beginPath(); const y = i * 22; for (let u = 0; u <= w; u += 16) x.lineTo(u, y + Math.sin(u * 0.05 + i) * 6); x.stroke(); } }, true);
const darkWallTex = canvasTex(512, 512, (x, w, h) => { const r = rng(5); x.fillStyle = '#232741'; x.fillRect(0, 0, w, h); for (let i = 0; i < 4; i++) { x.fillStyle = i % 2 ? '#262b47' : '#20243d'; x.fillRect(i * 128, 0, 128, h); x.fillStyle = 'rgba(255,255,255,.05)'; x.fillRect(i * 128 + 2, 0, 3, h); }
  for (let i = 0; i < 1500; i++) { x.fillStyle = `rgba(0,0,0,${r() * 0.08})`; x.fillRect(r() * w, r() * h, 2, 2); } }, true);
const plankTex = canvasTex(512, 512, (x, w, h) => { const r = rng(6); for (let i = 0; i < 8; i++) { x.fillStyle = `hsl(24,${30 + r() * 10}%,${20 + r() * 6}%)`; x.fillRect(0, i * 64, w, 64); x.fillStyle = 'rgba(0,0,0,.4)'; x.fillRect(0, i * 64, w, 3); x.fillRect(((i * 197) % w), i * 64, 3, 64);
  for (let k = 0; k < 8; k++) { x.strokeStyle = 'rgba(255,200,150,.07)'; x.lineWidth = 2; x.beginPath(); const y = i * 64 + 8 + r() * 48; x.moveTo(0, y); x.lineTo(w, y + (r() - 0.5) * 8); x.stroke(); } } }, true);
const carpetTex = canvasTex(256, 256, (x, w, h) => { const r = rng(15); x.fillStyle = '#2b3247'; x.fillRect(0, 0, w, h); for (let i = 0; i < 2500; i++) { x.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '160,170,210'},${r() * 0.12})`; x.fillRect(r() * w, r() * h, 2, 2); } x.strokeStyle = 'rgba(120,130,180,.18)'; x.lineWidth = 3; x.strokeRect(0, 0, w, h); }, true);
const concreteTex = canvasTex(512, 512, (x, w, h) => { const r = rng(19); x.fillStyle = '#5a5e68'; x.fillRect(0, 0, w, h); for (let i = 0; i < 3000; i++) { x.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '255,255,255'},${r() * 0.08})`; x.fillRect(r() * w, r() * h, 3, 3); }
  x.strokeStyle = 'rgba(0,0,0,.25)'; x.lineWidth = 3; for (let j = 0; j < 4; j++) { x.beginPath(); x.moveTo(0, j * 128); x.lineTo(w, j * 128); x.stroke(); } for (let i = 0; i < 3; i++) { x.fillStyle = 'rgba(40,30,20,.12)'; x.beginPath(); x.ellipse(r() * w, r() * h, 30 + r() * 60, 60 + r() * 90, 0, 0, 7); x.fill(); } }, true);
const gridTex = canvasTex(512, 512, (x, w, h) => { x.fillStyle = '#0c0818'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(80,220,255,.55)'; x.lineWidth = 3; for (let i = 0; i <= 4; i++) { x.beginPath(); x.moveTo(i * 128, 0); x.lineTo(i * 128, h); x.stroke(); x.beginPath(); x.moveTo(0, i * 128); x.lineTo(w, i * 128); x.stroke(); }
  x.strokeStyle = 'rgba(255,60,200,.18)'; x.lineWidth = 1.5; for (let i = 0; i < 16; i++) { x.beginPath(); x.moveTo(i * 32, 0); x.lineTo(i * 32, h); x.stroke(); x.beginPath(); x.moveTo(0, i * 32); x.lineTo(w, i * 32); x.stroke(); } }, true);

// ---------- generic room shell (floor, 4 walls, ceiling) ----------
function shell(G, o) { const { x0, x1, z0, z1, h, wall, floor, ceil = '#1a1d2e', skip = [] } = o, out = {};
  const P = (w, hh, mat, rep) => { const mt = mat.clone(); if (mt.map) { mt.map = mat.map.clone(); mt.map.needsUpdate = true; mt.map.repeat.set(...rep); } const m = new THREE.Mesh(new THREE.PlaneGeometry(w, hh), mt); m.receiveShadow = true; m.userData.noHull = true; G.add(m); return m; };
  out.floor = P(x1 - x0, z1 - z0, floor, [(x1 - x0) / 2, (z1 - z0) / 2]); out.floor.rotation.x = -Math.PI / 2; out.floor.position.set((x0 + x1) / 2, 0, (z0 + z1) / 2);
  if (!skip.includes('back')) { out.back = P(x1 - x0, h, wall, [(x1 - x0) / 2, h / 2]); out.back.position.set((x0 + x1) / 2, h / 2, z0); }
  if (!skip.includes('right')) { out.right = P(z1 - z0, h, wall, [(z1 - z0) / 2, h / 2]); out.right.rotation.y = -Math.PI / 2; out.right.position.set(x1, h / 2, (z0 + z1) / 2); }
  if (!skip.includes('left')) { out.left = P(z1 - z0, h, wall, [(z1 - z0) / 2, h / 2]); out.left.rotation.y = Math.PI / 2; out.left.position.set(x0, h / 2, (z0 + z1) / 2); }
  if (!skip.includes('front')) { out.front = P(x1 - x0, h, wall, [(x1 - x0) / 2, h / 2]); out.front.rotation.y = Math.PI; out.front.position.set((x0 + x1) / 2, h / 2, z1); }
  out.ceil = P(x1 - x0, z1 - z0, toon(ceil), [1, 1]); out.ceil.rotation.x = Math.PI / 2; out.ceil.position.set((x0 + x1) / 2, h, (z0 + z1) / 2);
  return out; }

// ---------- flat cards (from the office-toon engine) ----------
const cards = []; const _wp = V(0, 0, 0);
function makeCard(G, kind, h = 1.75) {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 768; const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const w = h * 512 / 768, geo = new THREE.PlaneGeometry(w, h).translate(0, h / 2, 0);
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, alphaTest: 0.45, side: THREE.DoubleSide })); m.userData.noOutline = true; G.add(m);
  const cmat = m.material, nmat = new THREE.ShaderMaterial({ uniforms: { map: { value: tex } }, side: THREE.DoubleSide,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform sampler2D map; varying vec2 vUv; void main(){ if (texture2D(map, vUv).a < 0.45) discard; gl_FragColor = vec4(0.5, 0.5, 1.0, 1.0); }' });
  const blob = new THREE.Mesh(new THREE.CircleGeometry(w * 0.33, 24), new THREE.MeshBasicMaterial({ color: '#05030a', transparent: true, opacity: 0.4, depthWrite: false })); blob.rotation.x = -Math.PI / 2; blob.scale.y = 0.55; blob.userData.noOutline = true; G.add(blob);
  const c = { kind, cv, ctx: cv.getContext('2d'), tex, m, blob, cmat, nmat, pose: {}, pos: V(0, -50, 0), spin: 0, key: '', G, on: true, tint: null }; cards.push(c); return c;
}
function updateCard(c, t) {
  c.m.visible = c.blob.visible = c.on && c.G.visible; if (!c.m.visible) return;
  const animated = c.pose.zzz || c.pose.walk || c.pose.talk; const key = c.kind + JSON.stringify(c.pose) + (animated ? t.toFixed(3) : '');
  if (key !== c.key) { drawChar(c.ctx, c.kind, c.pose, t); c.tex.needsUpdate = true; c.key = key; }
  c.cmat.color.set(c.tint || '#ffffff');
  c.m.position.copy(c.pos); c.m.updateMatrixWorld(); c.m.getWorldPosition(_wp);
  c.m.rotation.y = Math.atan2(camera.position.x - _wp.x, camera.position.z - _wp.z);
  const sx = Math.cos(c.spin || 0); c.m.scale.x = Math.sign(sx || 1) * Math.max(0.12, Math.abs(sx));
  c.blob.position.set(c.pos.x, 0.012, c.pos.z); c.blob.visible = c.m.visible && c.pos.y < 0.1;
}

// ---------- cars: extruded side profiles ----------
function profileCar(G, pts, len, width, col, o = {}) { // pts: side profile in (x along car, y up), extruded across width
  const sh = new THREE.Shape(); sh.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) sh.lineTo(p[0], p[1]); sh.closePath();
  const geo = new THREE.ExtrudeGeometry(sh, { depth: width, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 2 }); geo.translate(0, 0, -width / 2); geo.computeVertexNormals();
  const root = new THREE.Group(); G.add(root); const body = mesh(geo, toon(col), 0, 0, 0, root, 4.5); body.material.flatShading = false;
  const wheels = []; for (const [wx, wz] of o.wheels) { const wg = new THREE.Group(); wg.position.set(wx, o.wr, wz); root.add(wg); const w = mesh(cyl(o.wr, o.wr, 0.24, 20).rotateX(Math.PI / 2), '#16141c', 0, 0, 0, wg, 3.5); mesh(cyl(o.wr * 0.55, o.wr * 0.55, 0.26, 12).rotateX(Math.PI / 2), o.rim || '#b9bcc8', 0, 0, 0, wg, 2); wheels.push(wg); }
  return { root, body, wheels };
}

