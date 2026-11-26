
// ---------- video poker screens ----------
const SUITS = { S: '♠', H: '♥', D: '♦', C: '♣' };
function drawCard(x, cx, cy, cw, ch, card, held = false, back = false) {
  x.save(); x.translate(cx, cy);
  x.fillStyle = back ? '#2f3fae' : '#fbfaf6'; x.beginPath(); x.roundRect(-cw / 2, -ch / 2, cw, ch, 12); x.fill(); x.lineWidth = 5; x.strokeStyle = '#0e0b16'; x.stroke();
  if (back) { x.strokeStyle = '#ffcf3f'; x.lineWidth = 3; for (let i = -3; i <= 3; i++) { x.beginPath(); x.moveTo(-cw / 2 + 8, i * 18); x.lineTo(cw / 2 - 8, i * 18 + 30); x.stroke(); } }
  else { const r = card[0], su = card[1], red = su === 'H' || su === 'D'; x.fillStyle = red ? '#d7263d' : '#14121a'; x.textAlign = 'center';
    x.font = `900 ${ch * 0.3}px Poppins`; x.fillText(r === 'T' ? '10' : r, 0, -ch * 0.08); x.font = `900 ${ch * 0.32}px serif`; x.fillText(SUITS[su], 0, ch * 0.32);
    x.font = `900 ${ch * 0.14}px Poppins`; x.textAlign = 'left'; x.fillText(r === 'T' ? '10' : r, -cw / 2 + 8, -ch / 2 + ch * 0.16); }
  if (held) { x.fillStyle = '#ffcf3f'; x.font = `900 ${ch * 0.16}px Poppins`; x.textAlign = 'center'; x.fillText('HELD', 0, -ch / 2 - 10); }
  x.restore(); }
const HAND_820 = ['AS', 'AH', 'AD', 'AC', 'KS'];
const LOSE_HANDS = [['7C', '2H', 'JD', '9S', '4H'], ['QD', '3C', '8H', '5S', 'TC'], ['6H', 'KC', '2S', '9D', 'JH'], ['4D', '4S', '8C', 'QH', '3D']];
// mode: attract | lose | win820 | menu | draw | double | cash | denom | first | win8200 | jackpot | update
function drawVP(x, w, h, mode, t = 0, k = 1, o = {}) {
  const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#0a1a6a'); g.addColorStop(1, '#06103e'); x.fillStyle = g; x.fillRect(0, 0, w, h);
  const game = o.game || 'TRIPLE DOUBLE BONUS', denom = o.denom || '$1';
  x.fillStyle = '#ffcf3f'; x.font = '900 46px Poppins'; x.textAlign = 'center'; x.fillText(game, w / 2, 58);
  // pay table strip
  if (mode !== 'menu' && mode !== 'denom' && mode !== 'update') { x.fillStyle = 'rgba(255,255,255,.08)'; x.fillRect(30, 80, w - 60, 150); x.font = '700 22px Poppins'; x.textAlign = 'left';
    const rows = mode === 'draw' || mode === 'double' || mode === 'cash' ? [['ROYAL FLUSH', 4000], ['STRAIGHT FLUSH', 250], ['4 OF A KIND', 125], ['FULL HOUSE', 45], ['FLUSH', 30]] : [['4 ACES + 2-4', 4000], ['4 ACES', 800], ['4 2s-4s + A-4', 2000], ['STRAIGHT FLUSH', 250], ['FULL HOUSE', 45]];
    rows.forEach(([n, v], i) => { const hot = (mode === 'win820' || mode === 'first' || mode === 'win8200') && i === 1; x.fillStyle = hot ? '#ffcf3f' : '#bcd0ff'; x.fillText(n, 50, 110 + i * 27); x.textAlign = 'right'; x.fillText(String(v), w - 60, 110 + i * 27); x.textAlign = 'left'; }); }
  const cards = (hand, y = 400, held = []) => hand.forEach((c, i) => drawCard(x, 120 + i * 196, y, 170, 240, c, held.includes(i)));
  x.textAlign = 'center';
  if (mode === 'attract' || mode === 'lose') { const hi = Math.floor(t * (mode === 'lose' ? 1.6 : 0.8)) % LOSE_HANDS.length; cards(LOSE_HANDS[hi]);
    if (mode === 'attract') { x.fillStyle = Math.sin(t * 5) > 0 ? '#ff3b4a' : '#ffffff'; x.font = '900 54px Poppins'; x.fillText('PLAY 5 CREDITS', w / 2, 620); } else { x.fillStyle = '#ff8a8a'; x.font = '900 50px Poppins'; x.fillText('GAME OVER', w / 2, 620); } }
  if (mode === 'win820' || mode === 'first') { cards(HAND_820, 400, [0, 1, 2, 3]); const fl = Math.sin(t * 9) > -0.2; x.fillStyle = fl ? '#ffcf3f' : '#ffffff'; x.font = '900 96px Poppins'; x.fillText('WIN 820', w / 2, 650); }
  if (mode === 'win8200') { cards(HAND_820, 400, [0, 1, 2, 3]); x.fillStyle = '#ff3b4a'; x.fillRect(0, 560, w, 140); x.fillStyle = Math.sin(t * 12) > 0 ? '#ffffff' : '#ffcf3f'; x.font = '900 112px Poppins'; x.fillText('WIN 8,200', w / 2, 670); }
  if (mode === 'jackpot') { x.fillStyle = Math.sin(t * 14) > 0 ? '#ff3b4a' : '#ffcf3f'; x.fillRect(0, 250, w, 360); x.fillStyle = '#0e0b16'; x.font = '900 150px Poppins'; x.fillText('JACKPOT', w / 2, 440); x.font = '900 60px Poppins'; x.fillText('CALL ATTENDANT', w / 2, 540); }
  if (mode === 'menu') { const games = ['TRIPLE DOUBLE BONUS', 'DRAW POKER', 'DEUCES WILD', 'BONUS POKER', 'JOKER POKER']; const sel = Math.min(1, Math.floor(k * 2.2));
    games.forEach((gm, i) => { const y = 160 + i * 112; x.fillStyle = i === sel ? '#ffcf3f' : '#1f3aa0'; x.beginPath(); x.roundRect(110, y - 70, w - 220, 92, 18); x.fill(); x.lineWidth = 5; x.strokeStyle = '#0e0b16'; x.stroke(); x.fillStyle = i === sel ? '#0e0b16' : '#ffffff'; x.font = '900 46px Poppins'; x.fillText(gm, w / 2, y - 8); }); }
  if (mode === 'draw' || mode === 'double' || mode === 'cash') { cards(['9H', '9C', '3S', '9D', 'QC'], 400, [0, 1, 3]); x.fillStyle = '#ffffff'; x.font = '900 60px Poppins'; x.fillText('THREE OF A KIND', w / 2, 620);
    if (mode === 'double') { const pop = 1 + 0.06 * Math.sin(t * 10); x.save(); x.translate(w / 2, 400); x.scale(pop, pop); x.fillStyle = '#ff3b4a'; x.beginPath(); x.roundRect(-380, -120, 760, 240, 30); x.fill(); x.lineWidth = 10; x.strokeStyle = '#ffcf3f'; x.stroke();
      x.fillStyle = '#ffffff'; x.font = '900 90px Poppins'; x.fillText('DOUBLE UP?', 0, -6); x.font = '900 52px Poppins'; x.fillStyle = '#ffcf3f'; x.fillText('YES        NO', 0, 80); x.restore(); }
    if (mode === 'cash') { x.fillStyle = '#3ff07a'; x.font = '900 64px Poppins'; x.fillText('+ $100 INSERTED', w / 2, 260); } }
  if (mode === 'denom') { x.fillStyle = '#ffffff'; x.font = '900 60px Poppins'; x.fillText('SELECT DENOMINATION', w / 2, 170); const ds = ['$1', '$2', '$5', '$10'], sel = Math.min(3, Math.floor(k * 4.5));
    ds.forEach((d, i) => { const cx = 150 + i * 240, cy = 400, on = i === sel; x.fillStyle = on ? '#ffcf3f' : '#1f3aa0'; x.beginPath(); x.arc(cx, cy, 100, 0, 7); x.fill(); x.lineWidth = 8; x.strokeStyle = '#0e0b16'; x.stroke(); x.fillStyle = on ? '#0e0b16' : '#ffffff'; x.font = '900 70px Poppins'; x.fillText(d, cx, cy + 24); }); }
  if (mode === 'update') { x.fillStyle = '#ffffff'; x.font = '900 64px Poppins'; x.fillText('SOFTWARE UPDATE', w / 2, 260); x.fillStyle = '#1f3aa0'; x.fillRect(150, 360, w - 300, 70); x.fillStyle = '#3ff07a'; x.fillRect(150, 360, (w - 300) * clamp(k), 70); x.lineWidth = 6; x.strokeStyle = '#0e0b16'; x.strokeRect(150, 360, w - 300, 70);
    x.fillStyle = '#3ff07a'; x.font = '900 56px Poppins'; x.fillText(k >= 1 ? 'BUG FIXED ✓' : 'INSTALLING…', w / 2, 560); }
  // bottom bar
  x.fillStyle = '#04081e'; x.fillRect(0, h - 70, w, 70); x.font = '900 36px Poppins'; x.textAlign = 'left'; x.fillStyle = '#3ff07a'; x.fillText('CREDITS ' + String(o.credits ?? 120).padStart(5, '0'), 30, h - 22);
  x.textAlign = 'right'; x.fillStyle = '#ffcf3f'; x.fillText('BET 5  ' + denom, w - 30, h - 22); x.textAlign = 'left';
}

// ---------- casino floor ----------
const carpetCasino = canvasTex(512, 512, (x, w, h) => { x.fillStyle = '#4a1230'; x.fillRect(0, 0, w, h); const r = rng(23);
  for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { const cx = i * 128 + 64, cy = j * 128 + 64; x.strokeStyle = '#d9a43a'; x.lineWidth = 7; x.beginPath(); x.arc(cx, cy, 44, 0, 7); x.stroke(); x.strokeStyle = '#1fa39a'; x.lineWidth = 6; x.beginPath(); x.arc(cx, cy, 24, 0, 7); x.stroke();
    x.fillStyle = '#e85a3a'; x.beginPath(); for (let a = 0; a < 8; a++) { const an = a / 8 * Math.PI * 2; x.lineTo(cx + Math.cos(an) * (a % 2 ? 12 : 22), cy + Math.sin(an) * (a % 2 ? 12 : 22)); } x.fill();
    x.strokeStyle = 'rgba(217,164,58,.6)'; x.lineWidth = 4; x.beginPath(); x.moveTo(cx + 44, cy); x.quadraticCurveTo(cx + 64, cy - 40, cx + 84, cy); x.stroke(); x.beginPath(); x.moveTo(cx, cy + 44); x.quadraticCurveTo(cx + 40, cy + 64, cx, cy + 84); x.stroke(); }
  for (let i = 0; i < 2500; i++) { x.fillStyle = `rgba(0,0,0,${r() * 0.12})`; x.fillRect(r() * w, r() * h, 2, 2); } }, true);
const MACHINES = [];
{ const G = CASINO, x0 = -12, x1 = 12, z0 = -18, z1 = 8, h = 4.4;
  const wallM = toon('#ffffff', { map: canvasTex(512, 512, (x, w, hh) => { x.fillStyle = '#2a1430'; x.fillRect(0, 0, w, hh); for (let i = 0; i < 4; i++) { x.fillStyle = '#341a3c'; x.fillRect(i * 128 + 10, 40, 108, hh - 160); x.strokeStyle = '#d9a43a'; x.lineWidth = 5; x.strokeRect(i * 128 + 10, 40, 108, hh - 160); } x.fillStyle = '#1a0c20'; x.fillRect(0, hh - 110, w, 110); x.fillStyle = '#d9a43a'; x.fillRect(0, hh - 116, w, 8); }, true) });
  const sh = shell(G, { x0, x1, z0, z1, h, wall: wallM, floor: toon('#ffffff', { map: carpetCasino }), ceil: '#160a1c' }); sh.floor.material.map.repeat.set(6, 6.5);
  G.add(new THREE.HemisphereLight('#ffd2a8', '#3a1030', 1.05));
  const key = new THREE.DirectionalLight('#ffe0b0', 1.4); key.position.set(4, 10, 6); key.target.position.set(0, 0, -2); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 30 }); key.shadow.bias = -0.0004; key.shadow.normalBias = 0.03; G.add(key, key.target);
  const pl = new THREE.PointLight('#ff3fa8', 5, 9, 1.5); pl.position.set(-6, 3.2, -4); G.add(pl); const pl2 = new THREE.PointLight('#3ff0ff', 4, 9, 1.5); pl2.position.set(6, 3.2, -8); G.add(pl2);
  const heroL = new THREE.PointLight('#7fa0ff', 3, 3.5, 1.5); heroL.position.set(0, 1.4, 0.9); G.add(heroL); G.userData.heroL = heroL;
  // ceiling coffers + chandeliers
  for (let i = -2; i <= 2; i++) for (let j = 0; j < 5; j++) mesh(rbox(3.6, 0.12, 3.6, 0.03), '#2a1430', i * 4.6, h - 0.1, -15 + j * 4.6, G, 3);
  for (const [cx, cz] of [[-5, -3], [5, -3], [0, -9], [-5, -14], [5, -14]]) { const c = new THREE.Group(); c.position.set(cx, h - 0.9, cz); G.add(c); mesh(cyl(0.02, 0.02, 0.8, 6), '#d9a43a', 0, 0.45, 0, c, 0);
    mesh(cyl(0.55, 0.3, 0.25, 12), '#d9a43a', 0, 0, 0, c, 3); for (let a = 0; a < 10; a++) { const an = a / 10 * Math.PI * 2; mesh(sph(0.07, 8), basic('#fff2c8'), Math.cos(an) * 0.62, -0.08, Math.sin(an) * 0.62, c, 0); } for (let a = 0; a < 6; a++) { const an = a / 6 * Math.PI * 2; mesh(sph(0.05, 8), basic('#fff2c8'), Math.cos(an) * 0.35, -0.3, Math.sin(an) * 0.35, c, 0); } glow(c, 0, -0.1, 0, '#ffd890', 2.6, 0.55); }
  // pillars with gold rings
  for (const [px, pz] of [[-6.5, -2.6], [6.5, -2.6], [-6.5, -7.8], [6.5, -7.8], [-6.5, -13], [6.5, -13]]) { mesh(cyl(0.38, 0.38, h, 16), '#3a1a40', px, h / 2, pz, G, 4); for (const ry of [0.15, 1.2, 3.3, h - 0.15]) mesh(cyl(0.44, 0.44, 0.12, 16), '#d9a43a', px, ry, pz, G, 3); mesh(new THREE.PlaneGeometry(0.5, 1.6), basic('#9fc8ff', { transparent: true, opacity: 0.35 }), px, 2.2, pz + 0.39, G, 0); }
  // big neon casino-name sign on the back wall + a JACKPOT sign
  const nameTC = textCanvas(1600, 300, (x, w, hh, name, on = 1) => { x.clearRect(0, 0, w, hh); x.fillStyle = 'rgba(8,6,16,.9)'; x.beginPath(); x.roundRect(8, 8, w - 16, hh - 16, 40); x.fill(); x.lineWidth = 12; x.strokeStyle = '#ffcf3f'; x.stroke();
    for (let i = 0; i < 40; i++) { const u = i / 40; x.fillStyle = (i + Math.floor(on * 3)) % 3 ? '#fff2c8' : '#ffcf3f'; x.beginPath(); x.arc(30 + u * (w - 60), 26, 9, 0, 7); x.fill(); x.beginPath(); x.arc(30 + u * (w - 60), hh - 26, 9, 0, 7); x.fill(); }
    x.font = `900 ${name.length > 10 ? 130 : 170}px Poppins`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.shadowColor = '#ff3fa8'; x.shadowBlur = 40; x.fillStyle = '#ffffff'; x.fillText(name, w / 2, hh / 2 + 8); x.shadowBlur = 0; x.lineWidth = 6; x.strokeStyle = '#ff3fa8'; x.strokeText(name, w / 2, hh / 2 + 8); });
  nameTC.update('CASINO', 0); SCR.casName = nameTC; { const m = new THREE.Mesh(new THREE.PlaneGeometry(9.6, 1.8), basic('#ffffff', { map: nameTC.t, transparent: true })); m.position.set(0, 3.2, z0 + 0.05); m.userData.noOutline = true; G.add(m); glow(G, 0, 3.2, z0 + 0.5, '#ff3fa8', 12, 0.25); }
  G.userData.jack = neonSign(G, 'JACKPOT', '#ffcf3f', -8.5, 3.4, -10, Math.PI / 2, 0.9); G.userData.jack.m.position.x = x0 + 0.06; G.userData.jack.m.rotation.y = Math.PI / 2;
  // progressive meter hanging over the hero row
  { const tc = textCanvas(1024, 256, (x, w, hh, v) => { x.fillStyle = '#0a0410'; x.fillRect(0, 0, w, hh); x.strokeStyle = '#ff3b4a'; x.lineWidth = 10; x.strokeRect(5, 5, w - 10, hh - 10); x.fillStyle = '#ffcf3f'; x.font = '900 46px Poppins'; x.textAlign = 'center'; x.fillText('PROGRESSIVE JACKPOT', w / 2, 66); x.fillStyle = '#ff3b4a'; x.font = '900 120px monospace'; x.fillText('$' + v, w / 2, 200); }); SCR.prog = tc;
    const g = new THREE.Group(); g.position.set(x1 - 0.2, 3.5, -8.5); g.rotation.y = -Math.PI / 2; G.add(g); mesh(rbox(4.3, 1.15, 0.2, 0.04), '#14121a', 0, 0, -0.06, g, 4); const p = new THREE.Mesh(new THREE.PlaneGeometry(4.1, 1.02), basic('#ffffff', { map: tc.t })); p.position.z = 0.05; p.userData.noOutline = true; g.add(p); for (const s of [-1, 1]) mesh(cyl(0.015, 0.015, 1, 4), '#d9a43a', s * 1.8, 1.0, 0, g, 0); glow(g, 0, 0, 0.3, '#ff3b4a', 5, 0.2); }
  // shared screen canvases for the background machines
  const bgScr = [0, 1, 2].map(i => textCanvas(512, 384, (x, w, hh, tt) => { x.save(); x.scale(0.5, 0.5); drawVP(x, 1024, 768, i === 1 ? 'lose' : 'attract', tt + i * 3, 1, { game: ['DOUBLE BONUS', 'DEUCES WILD', 'JACKS OR BETTER'][i] }); x.restore(); })); SCR.bg = bgScr;
  const heroTC = textCanvas(1024, 768, () => {}); SCR.vp = heroTC;
  const topTC = textCanvas(512, 200, (x, w, hh, on) => { x.fillStyle = '#14121a'; x.fillRect(0, 0, w, hh); x.fillStyle = on ? '#ffcf3f' : '#c9a43a'; x.font = '900 66px Poppins'; x.textAlign = 'center'; x.fillText('GAME KING', w / 2, 92); x.fillStyle = '#ff3b4a'; x.font = '900 40px Poppins'; x.fillText('VIDEO POKER', w / 2, 160); }); topTC.update(1);
  const CAB_COL = [['#2a2f8a', '#141850'], ['#8a1f4a', '#40102a'], ['#1f6a6a', '#0c3030']];
  const CAB_FRONT = CAB_COL.map(([a, b]) => canvasTex(300, 420, (x, w, h) => { const g = x.createLinearGradient(0, 0, w, 0); g.addColorStop(0, b); g.addColorStop(0.5, a); g.addColorStop(1, b); x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.fillStyle = 'rgba(255,255,255,.08)'; x.fillRect(0, 0, w, 10); x.fillStyle = 'rgba(255,255,255,.12)'; for (let i = 0; i < 9; i++) { x.beginPath(); x.arc(40 + i * 28, 52, 5, 0, 7); x.fill(); } x.strokeStyle = '#d9a43a'; x.lineWidth = 6; x.strokeRect(18, 93, w - 36, 214); x.clearRect(21, 96, w - 42, 208);
    for (const sx of [22, w - 62]) { x.fillStyle = '#0e0b16'; x.beginPath(); x.roundRect(sx, 318, 40, 84, 12); x.fill(); x.fillStyle = 'rgba(200,200,220,.35)'; for (let j = 0; j < 7; j++) for (let i = 0; i < 3; i++) { x.beginPath(); x.arc(sx + 9 + i * 11, 328 + j * 11, 3, 0, 7); x.fill(); } }
    x.fillStyle = '#ff6a7a'; x.font = '900 24px Poppins'; x.textAlign = 'center'; x.fillText('MULTI-GAME', w / 2, 350); x.fillStyle = 'rgba(255,255,255,.6)'; x.font = '700 16px Poppins'; x.fillText('25¢ · $1 · $5 · $10', w / 2, 380); }));
  const BELLY = CAB_COL.map(([a, b], ci) => canvasTex(320, 300, (x, w, h) => { const g = x.createRadialGradient(w / 2, h * 0.45, 10, w / 2, h / 2, w * 0.75); g.addColorStop(0, a); g.addColorStop(1, '#07050c'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.strokeStyle = '#d9a43a'; x.lineWidth = 6; x.strokeRect(6, 6, w - 12, h - 12);
    const suits = ['♠', '♥', '♦', '♣', '♠']; for (let i = 0; i < 5; i++) { x.save(); x.translate(w / 2 + (i - 2) * 38, 175); x.rotate((i - 2) * 0.22); x.fillStyle = '#fbfaf6'; x.beginPath(); x.roundRect(-28, -92, 56, 84, 6); x.fill(); x.strokeStyle = '#14121a'; x.lineWidth = 2; x.stroke(); x.fillStyle = i % 3 === 1 ? '#d7263d' : '#14121a'; x.font = '900 26px serif'; x.textAlign = 'center'; x.fillText(['A', 'K', 'Q', 'J', '10'][i], 0, -60); x.fillText(suits[i], 0, -26); x.restore(); }
    x.fillStyle = '#ffcf3f'; x.font = '900 30px Poppins'; x.textAlign = 'center'; x.fillText(['DOUBLE BONUS', 'DEUCES WILD', 'JACKS OR BETTER'][ci], w / 2, 230); x.fillStyle = '#ff3b4a'; x.font = '900 26px Poppins'; x.fillText('ROYAL FLUSH · 4,000', w / 2, 268); }));
  const btnTex = (bg, fg, txt) => canvasTex(128, 96, (x, w, h) => { x.fillStyle = bg; x.fillRect(0, 0, w, h); x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(0, 0, w, 14); x.fillStyle = fg; x.font = '900 26px Poppins'; x.textAlign = 'center'; x.textBaseline = 'middle'; const L = txt.split(' '); L.forEach((l, i) => x.fillText(l, w / 2, h / 2 + (i - (L.length - 1) / 2) * 28)); });
  const BTN_T = { hold: btnTex('#ffcf3f', '#14121a', 'HOLD'), deal: btnTex('#3ff07a', '#0c2a14', 'DEAL DRAW'), bet: btnTex('#ff3b4a', '#ffffff', 'BET ONE'), max: btnTex('#2f6fe0', '#ffffff', 'MAX BET') };
  const BILL_T = canvasTex(256, 112, (x, w, h) => { x.fillStyle = '#cfe0c0'; x.fillRect(0, 0, w, h); x.strokeStyle = '#3a6a3a'; x.lineWidth = 6; x.strokeRect(6, 6, w - 12, h - 12); x.fillStyle = '#3a6a3a'; x.beginPath(); x.ellipse(w / 2, h / 2, 30, 38, 0, 0, 7); x.fill(); x.font = '900 34px Poppins'; x.fillText('100', 18, 44); x.textAlign = 'right'; x.fillText('100', w - 18, h - 16); });
  function machine(px, pz, face, hero = false, idx = 0) { const g = new THREE.Group(); g.position.set(px, 0, pz); g.rotation.y = face > 0 ? 0 : Math.PI; G.add(g);
    mesh(rbox(0.62, 0.92, 0.55, 0.03), '#1d1a26', 0, 0.46, 0, g, 4); mesh(rbox(0.6, 0.06, 0.53, 0.02), '#d9a43a', 0, 0.94, 0, g, 2);
    const up = mesh(rbox(0.62, 0.86, 0.42, 0.04), hero ? '#2a2f6a' : ['#2a2f6a', '#5a1f3a', '#1f4a4a'][idx % 3], 0, 1.4, -0.06, g, 4);
    { const col = hero ? 0 : idx % 3; const fp = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.84), basic('#ffffff', { map: CAB_FRONT[col], transparent: true, alphaTest: 0.5 })); fp.position.set(0, 1.4, 0.152); fp.userData.noOutline = true; g.add(fp);
      const bp = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.5), basic('#ffffff', { map: BELLY[col] })); bp.position.set(0, 0.5, 0.277); bp.userData.noOutline = true; g.add(bp);
      for (const sx of [-1, 1]) { mesh(rbox(0.025, 0.86, 0.44, 0.01), '#c9ccd6', sx * 0.315, 1.4, -0.06, g, 2); mesh(rbox(0.025, 0.92, 0.57, 0.01), '#c9ccd6', sx * 0.315, 0.46, 0, g, 2); } }
    const deck = mesh(rbox(0.62, 0.07, 0.3, 0.02), '#14121a', 0, 1.0, 0.33, g, 3); deck.rotation.x = 0.25; mesh(rbox(0.63, 0.02, 0.02, 0.005), '#d9a43a', 0, 0.99, 0.485, g, 1);
    const btn = []; for (let i = 0; i < 5; i++) { const b = mesh(rbox(0.08, 0.03, 0.06, 0.01), basic('#ffffff', { map: BTN_T.hold }), -0.2 + i * 0.1, 1.05, 0.3, g, 1.5); b.rotation.x = 0.25; btn.push(b); }
    for (const [k, bx] of [['deal', 0.22], ['bet', -0.22]]) { const b = mesh(rbox(0.1, 0.035, 0.07, 0.01), basic('#ffffff', { map: BTN_T[k] }), bx, 1.04, 0.4, g, 1.5); b.rotation.x = 0.25; btn.push(b); }
    { const b = mesh(rbox(0.1, 0.035, 0.07, 0.01), basic('#ffffff', { map: BTN_T.max }), 0, 1.04, 0.4, g, 1.5); b.rotation.x = 0.25; }
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.375), basic('#ffffff', { map: hero ? heroTC.t : bgScr[idx % 3].t })); scr.position.set(0, 1.42, 0.155); scr.rotation.x = -0.12; scr.userData.noOutline = true; g.add(scr);
    mesh(rbox(0.54, 0.42, 0.02, 0.01), '#0e0b16', 0, 1.42, 0.142, g, 0).rotation.x = -0.12;
    mesh(rbox(0.12, 0.05, 0.04, 0.01), '#0e0b16', 0.22, 1.12, 0.19, g, 1.5); // bill slot
    const top = mesh(rbox(0.62, 0.3, 0.32, 0.03), '#14121a', 0, 2.0, -0.08, g, 3); const tp = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 0.23), basic('#ffffff', { map: topTC.t })); tp.position.set(0, 2.0, 0.085); tp.userData.noOutline = true; g.add(tp);
    const candle = mesh(cyl(0.07, 0.07, 0.22, 12), basic(hero ? '#ff3b4a' : '#ffffff'), 0, 2.27, -0.08, g, 2); const cg = glow(g, 0, 2.3, -0.05, '#ff3b4a', 0.6, 0);
    const stool = new THREE.Group(); stool.position.set(0, 0, 0.85); g.add(stool); mesh(cyl(0.05, 0.05, 0.62, 8), '#d9a43a', 0, 0.31, 0, stool, 2); mesh(cyl(0.23, 0.23, 0.1, 16), '#7a1f3a', 0, 0.66, 0, stool, 3); mesh(cyl(0.2, 0.24, 0.04, 16), '#d9a43a', 0, 0.02, 0, stool, 2);
    const ticket = mesh(rbox(0.16, 0.005, 0.08, 0.002), '#f4efe4', 0.22, 1.2, 0.2, g, 1); ticket.visible = false;
    const bill = mesh(rbox(0.16, 0.004, 0.07, 0.002), basic('#ffffff', { map: BILL_T }), 0.22, 1.14, 0.3, g, 1); bill.visible = false;
    const M2 = { g, scr, candle, cg, ticket, bill, hero, btn, stool }; MACHINES.push(M2); return M2; }
  let n = 0; for (const [z, face] of [[0, 1], [-0.75, -1], [-5.2, 1], [-5.95, -1], [-10.4, 1], [-11.15, -1]]) for (let i = -5; i <= 5; i++) { const hero = z === 0 && i === 0; machine(i * 0.72, z, face, hero, n++); }
  G.userData.hero = MACHINES.find(m => m.hero);
  // end caps of each bank
  for (const z of [-0.38, -5.58, -10.78]) for (const s of [-1, 1]) { mesh(rbox(0.3, 1.6, 1.5, 0.05), '#3a1a40', s * 4.05, 0.8, z, G, 4); mesh(rbox(0.32, 0.1, 1.52, 0.02), '#d9a43a', s * 4.05, 1.62, z, G, 2); }
  // cashier cage on the left wall
  { const cg = new THREE.Group(); cg.position.set(x0 + 0.8, 0, -6); cg.rotation.y = Math.PI / 2; G.add(cg); mesh(rbox(5, 1.1, 0.8, 0.04), '#3a1a40', 0, 0.55, 0, cg, 4); mesh(rbox(5.1, 0.08, 0.9), '#d9a43a', 0, 1.12, 0, cg, 2);
    for (let i = 0; i < 26; i++) mesh(cyl(0.015, 0.015, 1.3, 4), '#d9a43a', -2.5 + i * 0.2, 1.8, 0.2, cg, 0); neonSign(cg, 'CASHIER', '#3ff07a', 0, 2.75, 0.25, 0, 0.55); }
  // blackjack tables on the right
  for (const tz of [-4, -12]) { const t = new THREE.Group(); t.position.set(9, 0, tz); G.add(t); mesh(cyl(1.3, 1.3, 0.12, 24, 1), '#1f7a4a', 0, 0.82, 0, t, 3); mesh(new THREE.TorusGeometry(1.3, 0.08, 8, 24), '#5a2a1a', 0, 0.86, 0, t, 3).rotation.x = Math.PI / 2; mesh(cyl(0.5, 0.6, 0.8, 12), '#2a1420', 0, 0.4, 0, t, 3);
    for (let i = 0; i < 5; i++) { const an = Math.PI * 0.15 + i * 0.18 * Math.PI; mesh(cyl(0.2, 0.2, 0.08, 12), '#7a1f3a', Math.cos(an) * 1.7, 0.66, Math.sin(an) * 1.7, t, 2); } }
  // coins for the hook
  G.userData.coins = Array.from({ length: 40 }, (_, i) => mesh(cyl(0.05, 0.05, 0.012, 14), '#ffcf3f', 0, -5, 0, G, 1.5));
}
const CCARD = { kane: makeCard(CASINO, 'kane', 1.72), nestor: makeCard(CASINO, 'nestor', 1.78), att: makeCard(CASINO, 'attendant', 1.66), g1: makeCard(CASINO, 'guard', 1.85), g2: makeCard(CASINO, 'guard2', 1.8) };
const PUNTERS = ['cowork1', 'admin', 'cowork2', 'office', 'admin2', 'analyst', 'lady', 'gent'].map((k, i) => makeCard(CASINO, k === 'lady' ? 'cowork1' : k === 'gent' ? 'admin2' : k, 1.62 + (i % 3) * 0.06));
