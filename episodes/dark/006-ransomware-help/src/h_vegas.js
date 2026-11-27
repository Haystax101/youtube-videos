// =====================================================================================================
// VEGAS: a Las Vegas street at night (the arrest). Road along x, a sidewalk and casino/hotel frontages at z < -3
// with neon signs and marquee bulbs (made-up names), palms, towers behind, an unmarked FBI SUV with a flashing
// red/blue light bar on the road. Agents walk the cuffed CTO to the SUV.
// =====================================================================================================
{ const G = VEGAS, U = G.userData;
  skyDome(G, (x, w, hh) => { const g = x.createLinearGradient(0, 0, 0, hh); g.addColorStop(0, '#07061a'); g.addColorStop(0.4, '#1a0f3a'); g.addColorStop(0.5, '#6a2a6a'); g.addColorStop(0.56, '#2a1a3a'); g.addColorStop(1, '#100c1a'); x.fillStyle = g; x.fillRect(0, 0, w, hh); const r = rng(8); for (let i = 0; i < 200; i++) { x.fillStyle = `rgba(255,255,255,${r() * 0.7})`; x.fillRect(r() * w, r() * hh * 0.42, 2, 2); } }, 150);
  const road = roadTex.clone(); road.needsUpdate = true; road.repeat.set(8, 1); plane(G, 120, 9, toon('#ffffff', { map: road, roughness: 0.35, metalness: 0.1 }), 0, 0, 2.5, -Math.PI / 2);
  const pave = paveTex.clone(); pave.needsUpdate = true; pave.repeat.set(60, 2); plane(G, 120, 5, toon('#ffffff', { map: pave, roughness: 0.6 }), 0, 0.02, -4.5, -Math.PI / 2); mesh(rbox(120, 0.06, 0.25, 0.02), '#c9ccd6', 0, 0.03, -2.0, G, 0);
  plane(G, 120, 30, toon('#2a2438'), 0, 0.1, 22, -Math.PI / 2);
  // frontages: three casinos and a hotel, each a lit box with a big neon sign and a canopy of bulbs
  U.bulbs = []; U.neon = [];
  const fronts = [[-15, 9, 14, '#3a1f4a', 'LUCKY STAR', '#ff4fd8'], [-4, 11, 18, '#1f2a4a', 'GOLDEN PALMS', '#ffcf3f'], [8, 10, 12, '#2a1a2a', 'CASINO', '#3ff0ff'], [19, 10, 22, '#1a2a3a', 'HOTEL', '#ff6a4a']];
  for (const [fx, fw, fh, col, name, ncol] of fronts) { const b = new THREE.Group(); b.position.set(fx, 0, -9); G.add(b); mesh(rbox(fw, fh, 6, 0.1), col, 0, fh / 2, 0, b, 0);
    const wt = windowTex(Math.round(fx + 40), col, '#ffd27a', Math.round(fw / 1.2), Math.round(fh / 1.3)); plane(b, fw - 1, fh - 5, basic('#ffffff', { map: wt }), 0, fh / 2 + 2.2, 3.03).userData.noOutline = true;
    // glass entrance
    plane(b, fw * 0.6, 2.6, basic('#ffe7b0'), 0, 1.4, 3.03).userData.noOutline = true; for (let k = -3; k <= 3; k++) mesh(rbox(0.06, 2.6, 0.08), '#c9a46a', k * fw * 0.1, 1.4, 3.05, b, 0);
    // canopy with chasing bulbs
    mesh(rbox(fw * 0.8, 0.35, 2.2, 0.04), '#14121a', 0, 3.2, 3.9, b, 0); for (let k = 0; k < Math.round(fw * 3); k++) { const bb = mesh(sph(0.055, 8), basic('#fff2b0'), -fw * 0.4 + 0.1 + k * (fw * 0.8 - 0.2) / Math.round(fw * 3), 3.02, 5.0, b, 0); bb.userData.k = k; U.bulbs.push(bb); }
    const sign = neonSign(b, name, ncol, 0, Math.min(fh - 1.5, 6.2), 3.4, 0, 1.4); U.neon.push(sign); glow(b, 0, 3.0, 5.2, ncol, fw * 0.7, 0.18); }
  // towers far behind
  for (const [bx, bz, w, hh, col] of [[-30, -40, 14, 60, '#2a2048'], [-6, -50, 18, 80, '#1f2a4a'], [18, -44, 14, 66, '#3a2048'], [40, -46, 16, 54, '#1a2a3a']]) block(G, bx, bz, w, hh, 10, col, Math.round(bx + 99), '#ffd27a');
  // palms along the kerb, street lamps
  for (const [px, s] of [[-20, 11], [-9.5, 12], [2, 13], [13.5, 14], [25, 15]]) palm(G, px, -2.6, 7.5, 0.18, s);
  for (const lx of [-14, -3, 8, 19]) { mesh(cyl(0.07, 0.09, 5.6, 8), '#3a3a44', lx, 2.8, -2.3, G, 0); mesh(rbox(0.9, 0.1, 0.25), '#3a3a44', lx, 5.6, -1.9, G, 0); glow(G, lx, 5.5, -1.5, '#ffe0a0', 2.2, 0.7); }
  // the SUV (dark, unmarked) parked on the road facing +x; light bar on the dash/roof
  { const suv = profileCar(G, [[-2.4, 0.38], [2.4, 0.38], [2.45, 0.95], [1.9, 1.08], [1.4, 1.85], [-2.2, 1.9], [-2.45, 1.7], [-2.5, 0.9]], 4.9, 1.9, '#14161e', { wheels: [[1.5, 0.92], [1.5, -0.92], [-1.5, 0.92], [-1.5, -0.92]], wr: 0.4, rim: '#5a5e6a' }); suv.root.position.set(1.4, 0, 0.6); U.suv = suv;
    const gl = toon('#3a4a6a', { roughness: 0.1, metalness: 0.4 }); for (const s of [-1, 1]) { const w = plane(suv.root, 3.4, 0.6, gl, -0.4, 1.5, s * 0.96); w.rotation.y = s > 0 ? 0 : Math.PI; } const fw = plane(suv.root, 0.7, 1.6, gl, 1.66, 1.48, 0); fw.rotation.set(0, Math.PI / 2, 0.6);
    const bar = new THREE.Group(); bar.position.set(-0.6, 1.95, 0); suv.root.add(bar); mesh(rbox(0.3, 0.1, 1.3, 0.03), '#14121a', 0, 0, 0, bar, 0); U.lr = mesh(rbox(0.25, 0.09, 0.55, 0.02), basic('#ff2a3a'), 0, 0.02, 0.32, bar, 0); U.lb = mesh(rbox(0.25, 0.09, 0.55, 0.02), basic('#2a6aff'), 0, 0.02, -0.32, bar, 0);
    U.gr = glow(bar, 0, 0.1, 0.4, '#ff2a3a', 3.0, 0.7); U.gb = glow(bar, 0, 0.1, -0.4, '#2a6aff', 3.0, 0.7); for (const s of [-1, 1]) glow(suv.root, 2.45, 0.8, s * 0.7, '#fff6d0', 1.0, 0.8); }
  G.add(new THREE.HemisphereLight('#a08aff', '#3a2a3a', 1.4)); for (const lx of [-14, -3, 8, 19]) { const p = new THREE.PointLight('#ffd9a0', 9, 11, 1.3); p.position.set(lx, 5.2, -1.6); G.add(p); } { const m = new THREE.DirectionalLight('#c8b8ff', 0.8); m.position.set(6, 10, 10); m.target.position.set(0, 0, -2); m.castShadow = true; m.shadow.mapSize.set(2048, 2048); Object.assign(m.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 40 }); m.shadow.bias = -0.0005; G.add(m, m.target); }
  U.pr = new THREE.PointLight('#ff2a3a', 0, 10, 1.2); U.pr.position.set(0.8, 2.4, 0.6); U.pb = new THREE.PointLight('#2a6aff', 0, 10, 1.2); U.pb.position.set(0.8, 2.4, 0.6); G.add(U.pr, U.pb);
  for (const [lx, col] of [[-15, '#ff4fd8'], [-4, '#ffcf3f'], [8, '#3ff0ff']]) { const p = new THREE.PointLight(col, 6, 12, 1.3); p.position.set(lx, 3.5, -4.5); G.add(p); }
}
