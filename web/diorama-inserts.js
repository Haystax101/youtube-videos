// Flat 2D infographic inserts for the "diorama" style (drawn on a canvas over the 3D view).
// Palette matches the diorama sets: deep navy night, cream text, warm orange accents.
// drawInsert(ctx, name, { t, lt, k, dur, step, W, H }) draws one full frame; pure function of its inputs.
const C = { bg0: '#171c38', bg1: '#2b2452', cream: '#fff4e3', dim: '#9aa0c4', orange: '#ffa25a', red: '#ef5a4a', teal: '#5cc6b4', pink: '#f08aa0', land: '#41507e', landHi: '#5a6a9a', sea: '#1f2a52', green: '#7cc36a', tan: '#d9b47a', grey: '#5d6078' };
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const easeOut = t => 1 - Math.pow(1 - clamp(t), 3);
const ease = t => { t = clamp(t); return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };
const back = t => { t = clamp(t); const c = 1.6; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
const ramp = (lt, a, d = 0.5) => easeOut((lt - a) / d);

function txt(g, s, x, y, { size = 40, color = C.cream, align = 'left', font = 'Poppins', weight = 600, alpha = 1, spacing = 0 } = {}) {
  g.save(); g.globalAlpha *= alpha; g.fillStyle = color; g.textAlign = align; g.textBaseline = 'middle'; g.font = `${weight} ${size}px ${font}`;
  if (spacing) g.letterSpacing = spacing + 'px'; g.fillText(s, x, y); g.restore();
}
function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function glow(g, x, y, r, col, a = 1) { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.save(); g.globalAlpha *= a; g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); g.restore(); }
function background(g, W, H, t) {
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, C.bg0); gr.addColorStop(1, C.bg1); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.save(); g.globalAlpha = 0.5; for (let i = 0; i < 90; i++) { const x = (i * 337.7) % W, y = (i * 211.3 + Math.sin(i) * 50) % H; const tw = 0.5 + 0.5 * Math.sin(t * 1.5 + i); g.fillStyle = `rgba(255,255,255,${0.15 + 0.35 * tw})`; g.fillRect(x, y, 2, 2); } g.restore();
}
function source(g, s, W) { txt(g, s, W - 70, 70, { size: 22, color: C.dim, align: 'right' }); }
function heading(g, s, x, y, a = 1) { txt(g, s, x, y, { size: 30, color: C.orange, weight: 600, spacing: 6, alpha: a }); }

// ---------- spring: the fish-bone calendar ----------
function spring(g, o) {
  const { lt, k, W, H, t } = o;
  heading(g, 'HOW DO WE KNOW THE SEASON?', 160, 200, ramp(lt, 0));
  // paddlefish silhouette
  g.save(); g.translate(680, 560); g.scale(0.85, 0.85); g.globalAlpha = ramp(lt, 0.2, 0.6); const sw = Math.sin(t * 2) * 0.04; g.rotate(sw);
  g.fillStyle = C.landHi; g.beginPath(); g.moveTo(-330, 0); g.quadraticCurveTo(-200, -70, -20, -60); g.quadraticCurveTo(170, -50, 240, -10); g.lineTo(330, -70); g.lineTo(300, 0); g.lineTo(330, 60); g.lineTo(240, 15); g.quadraticCurveTo(120, 60, -20, 55); g.quadraticCurveTo(-200, 55, -330, 0); g.fill();
  g.beginPath(); g.moveTo(-320, -6); g.lineTo(-560, -18); g.quadraticCurveTo(-590, 0, -560, 18); g.lineTo(-320, 8); g.fill(); // paddle
  g.fillStyle = C.cream; g.beginPath(); g.arc(-260, -12, 9, 0, 7); g.fill();
  g.strokeStyle = C.orange; g.lineWidth = 5; g.setLineDash([12, 10]); g.beginPath(); g.arc(-150, 10, 60, 0, 7); g.stroke(); g.setLineDash([]);
  g.restore();
  // zoom line
  const zk = ramp(lt, 0.8, 0.6);
  g.save(); g.globalAlpha = zk; g.strokeStyle = C.orange; g.lineWidth = 3; g.beginPath(); g.moveTo(600, 540); g.lineTo(1090, 400); g.moveTo(600, 600); g.lineTo(1090, 800); g.stroke(); g.restore();
  // bone cross-section rings
  const cx = 1340, cy = 560, R = 230 * back(zk);
  if (R > 1) {
    g.save(); g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fillStyle = '#e9d9b8'; g.fill(); g.clip();
    const years = 6; for (let y = 0; y < years; y++) { const r0 = 40 + y * 33, r1 = r0 + 26; g.beginPath(); g.arc(cx, cy, r1, 0, 7); g.lineWidth = 3; g.strokeStyle = '#a57d4f'; g.stroke(); }
    g.fillStyle = '#7a5a3a'; g.beginPath(); g.arc(cx, cy, 34, 0, 7); g.fill();
    // last, unfinished layer
    const lk = ramp(lt, 1.6, 1.4); g.beginPath(); g.arc(cx, cy, 40 + years * 33 + 6, -Math.PI / 2, -Math.PI / 2 + lk * Math.PI * 1.15); g.lineWidth = 16; g.strokeStyle = C.orange; g.lineCap = 'round'; g.stroke();
    g.restore();
    g.beginPath(); g.arc(cx, cy, R, 0, 7); g.lineWidth = 6; g.strokeStyle = C.cream; g.stroke();
    txt(g, 'one layer = one year', cx, cy + R + 50, { size: 30, color: C.dim, align: 'center', alpha: zk });
    txt(g, 'last layer: growing fast', cx, cy - R - 40, { size: 32, color: C.orange, align: 'center', alpha: ramp(lt, 2.6) });
  }
  // season dial
  const dk = ramp(lt, 3.2, 0.6); if (dk > 0) {
    const dx = 600, dy = 870; g.save(); g.globalAlpha = dk;
    const seasons = [['WINTER', '#8fb8e8'], ['SPRING', C.green], ['SUMMER', C.orange], ['AUTUMN', '#d9824a']];
    seasons.forEach(([n, col], i) => { const x = dx - 420 + i * 220; rr(g, x, dy - 34, 200, 68, 34); g.fillStyle = i === 1 && lt > 4 ? col : 'rgba(255,255,255,0.08)'; g.fill(); txt(g, n, x + 100, dy + 2, { size: 28, align: 'center', color: i === 1 && lt > 4 ? '#14301a' : C.dim }); });
    g.restore();
  }
  source(g, 'During et al., Nature 2022', W);
}

// ---------- map: impact at Chicxulub, 3,000 km from you ----------
const NA = [[-125, 49], [-124, 46], [-124, 42], [-123, 38], [-120, 34], [-117, 32.5], [-114.5, 30], [-112, 27], [-110, 23.5], [-106, 22], [-105, 20], [-103, 18.5], [-98, 16], [-94, 16], [-92, 14.5], [-88, 13.5], [-86, 12], [-84, 10], [-83, 8.5], [-82, 9.5], [-83.5, 11], [-83.5, 15], [-86, 16], [-88.3, 16.2], [-88, 18.5], [-87, 21.5], [-90, 21.4], [-91, 19], [-94, 18.3], [-96, 19.5], [-97.5, 22], [-97.5, 25], [-97, 27.5], [-94, 29.5], [-90, 29.2], [-89, 30.3], [-86, 30.4], [-84, 30], [-83, 29], [-82.5, 27.5], [-81.5, 25.2], [-80, 25.5], [-80.5, 28], [-81.3, 30.5], [-79, 33.5], [-76, 35], [-76, 37], [-74, 39.5], [-72, 41], [-70, 41.7], [-70.5, 43], [-67, 44.5], [-65, 44], [-61, 45.5], [-60, 47], [-65, 49], [-70, 48], [-75, 51], [-80, 56], [-131, 56], [-131, 50]];
const CUBA = [[-85, 21.9], [-82, 23.1], [-77, 21.8], [-74.2, 20.2], [-77.5, 19.9], [-81, 21.5], [-85, 21.9]];
function map(g, o) {
  const { lt, k, W, H, t } = o;
  const px = lon => 300 + (lon + 128) * 19.5, py = lat => 70 + (55 - lat) * 20;
  g.fillStyle = C.sea; g.fillRect(0, 0, W, H);
  g.save(); g.strokeStyle = 'rgba(255,255,255,0.05)'; g.lineWidth = 1; for (let lon = -130; lon <= -55; lon += 10) { g.beginPath(); g.moveTo(px(lon), 0); g.lineTo(px(lon), H); g.stroke(); } for (let lat = 10; lat <= 60; lat += 10) { g.beginPath(); g.moveTo(0, py(lat)); g.lineTo(W, py(lat)); g.stroke(); } g.restore();
  for (const poly of [NA, CUBA]) { g.beginPath(); poly.forEach(([lo, la], i) => i ? g.lineTo(px(lo), py(la)) : g.moveTo(px(lo), py(la))); g.closePath(); g.fillStyle = C.land; g.fill(); g.lineWidth = 3; g.strokeStyle = C.landHi; g.stroke(); }
  const ix = px(-89.5), iy = py(21.3), yx = px(-103.5), yy = py(46.2);
  // you are here
  const pk = ramp(lt, 0.2, 0.5);
  if (pk > 0) { g.save(); g.translate(yx, yy - 30 * (1 - back(pk))); g.globalAlpha = pk; g.fillStyle = C.teal; g.beginPath(); g.arc(0, -34, 20, 0, 7); g.fill(); g.beginPath(); g.moveTo(-13, -22); g.lineTo(0, 0); g.lineTo(13, -22); g.fill(); g.fillStyle = C.bg0; g.beginPath(); g.arc(0, -34, 8, 0, 7); g.fill(); g.restore();
    txt(g, 'YOU', yx + 34, yy - 40, { size: 34, color: C.teal, alpha: pk }); txt(g, 'Tanis, North Dakota', yx + 34, yy - 4, { size: 24, color: C.dim, alpha: pk }); }
  // incoming rock
  const hitAt = 1.6;
  if (lt < hitAt) { const a = clamp(lt / hitAt); const sx = lerp(ix + 700, ix, ease(a)), sy = lerp(iy - 620, iy, ease(a));
    g.save(); g.strokeStyle = 'rgba(255,170,90,0.9)'; g.lineWidth = 10; g.lineCap = 'round'; const gr = g.createLinearGradient(sx + 260, sy - 230, sx, sy); gr.addColorStop(0, 'rgba(255,150,80,0)'); gr.addColorStop(1, 'rgba(255,220,170,1)'); g.strokeStyle = gr; g.beginPath(); g.moveTo(sx + 260, sy - 230); g.lineTo(sx, sy); g.stroke(); g.restore();
    glow(g, sx, sy, 60, 'rgba(255,230,190,1)'); }
  else { const e = lt - hitAt; glow(g, ix, iy, 120 + 60 * Math.exp(-e * 2), 'rgba(255,200,140,1)', Math.max(0.35, Math.exp(-e * 1.5)));
    for (let r = 0; r < 4; r++) { const rad = ((e * 220 + r * 160) % 900); g.beginPath(); g.arc(ix, iy, rad, 0, 7); g.lineWidth = 4; g.strokeStyle = `rgba(255,160,90,${0.6 * (1 - rad / 900)})`; g.stroke(); }
    g.fillStyle = C.cream; g.beginPath(); g.arc(ix, iy, 9, 0, 7); g.fill(); }
  txt(g, 'Chicxulub, Mexico', ix + 26, iy + 40, { size: 30, alpha: ramp(lt, hitAt) });
  // distance line
  const dk = ramp(lt, hitAt + 1.2, 1.4);
  if (dk > 0) { g.save(); g.setLineDash([14, 12]); g.strokeStyle = C.cream; g.lineWidth = 4; g.beginPath(); g.moveTo(ix, iy); g.lineTo(lerp(ix, yx, dk), lerp(iy, yy, dk)); g.stroke(); g.restore();
    const mx = (ix + yx) / 2, my = (iy + yy) / 2; rr(g, mx - 160, my - 34, 220, 68, 34); g.globalAlpha = ramp(lt, hitAt + 2.4); g.fillStyle = C.cream; g.fill(); txt(g, '≈ 3,000 km', mx - 50, my + 2, { size: 34, color: C.bg0, align: 'center' }); g.globalAlpha = 1; }
  // fact chips
  const ck = ramp(lt, hitAt + 0.6, 0.6);
  if (ck > 0) { g.save(); g.globalAlpha = ck; rr(g, 120, 640, 520, 190, 24); g.fillStyle = 'rgba(15,18,40,0.8)'; g.fill(); txt(g, 'THE ROCK', 160, 685, { size: 26, color: C.orange, spacing: 4 }); txt(g, '~10 km wide', 160, 732, { size: 40 }); txt(g, '~20 km per second', 160, 784, { size: 40 }); g.restore(); }
  source(g, 'Schulte et al., Science 2010 · DePalma et al., PNAS 2019', W);
}

// ---------- scale: the rock vs Everest vs a jet ----------
function scale(g, o) {
  const { lt, k, W, H, t } = o;
  const G = 800, km = 50;
  g.fillStyle = '#2f3a64'; g.fillRect(0, G, W, H - G);
  g.strokeStyle = C.landHi; g.lineWidth = 3; g.beginPath(); g.moveTo(0, G); g.lineTo(W, G); g.stroke();
  // jet line
  const jk = ramp(lt, 1.4, 0.6);
  g.save(); g.globalAlpha = jk; g.setLineDash([10, 12]); g.strokeStyle = C.dim; g.lineWidth = 3; g.beginPath(); g.moveTo(120, G - 10.7 * km); g.lineTo(W - 120, G - 10.7 * km); g.stroke(); g.setLineDash([]);
  const jx = 200 + ((lt * 120) % 1400); g.fillStyle = C.cream; g.beginPath(); g.ellipse(jx, G - 10.7 * km, 34, 8, 0, 0, 7); g.fill(); g.beginPath(); g.moveTo(jx - 6, G - 10.7 * km); g.lineTo(jx - 20, G - 10.7 * km + 22); g.lineTo(jx + 6, G - 10.7 * km); g.fill();
  txt(g, 'cruising jet, ~11 km', 140, G - 10.7 * km - 30, { size: 28, color: C.dim }); g.restore();
  // Everest
  const ek = ramp(lt, 0.2, 0.8); const eh = 8.85 * km * ek;
  g.fillStyle = '#6c7aa8'; g.beginPath(); g.moveTo(260, G); g.lineTo(560, G - eh); g.lineTo(640, G - eh * 0.86); g.lineTo(900, G); g.fill();
  g.fillStyle = '#eef2ff'; g.beginPath(); g.moveTo(560, G - eh); g.lineTo(510, G - eh * 0.82); g.lineTo(560, G - eh * 0.86); g.lineTo(600, G - eh * 0.8); g.lineTo(640, G - eh * 0.86); g.fill();
  txt(g, 'Mount Everest', 580, G + 50, { size: 34, align: 'center', alpha: ek }); txt(g, '8.8 km', 580, G + 92, { size: 30, align: 'center', color: C.dim, alpha: ek });
  // the rock
  const rk = ramp(lt, 0.8, 0.9); const r = 5 * km * back(rk);
  if (r > 1) { const cx = 1320, cy = G - 5 * km; const gr = g.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r); gr.addColorStop(0, '#8a7f76'); gr.addColorStop(1, '#4b4440'); g.fillStyle = gr; g.beginPath(); for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI * 2, rr2 = r * (1 + Math.sin(a * 5) * 0.03 + Math.sin(a * 3 + 1) * 0.04); g.lineTo(cx + Math.cos(a) * rr2, cy + Math.sin(a) * rr2); } g.fill();
    g.fillStyle = 'rgba(0,0,0,0.18)'; for (const [dx, dy, cr] of [[-0.3, -0.2, 0.14], [0.25, 0.15, 0.1], [0.05, -0.45, 0.08], [-0.2, 0.4, 0.09]]) { g.beginPath(); g.arc(cx + dx * r, cy + dy * r, cr * r, 0, 7); g.fill(); }
    txt(g, 'The asteroid', cx, G + 50, { size: 34, align: 'center', alpha: rk }); txt(g, '~10 km', cx, G + 92, { size: 30, align: 'center', color: C.dim, alpha: rk });
    g.save(); g.globalAlpha = rk; g.strokeStyle = C.orange; g.lineWidth = 3; g.beginPath(); g.moveTo(cx + r + 40, G); g.lineTo(cx + r + 40, G - 10 * km); g.moveTo(cx + r + 28, G); g.lineTo(cx + r + 52, G); g.moveTo(cx + r + 28, G - 10 * km); g.lineTo(cx + r + 52, G - 10 * km); g.stroke(); g.restore(); }
  // energy counter
  const ck = ramp(lt, 4.2, 0.5);
  if (ck > 0) { const n = Math.floor(Math.pow(10, 9 * clamp((lt - 4.2) / 2.5))); g.save(); g.globalAlpha = ck; rr(g, 560, 120, 800, 120, 30); g.fillStyle = 'rgba(15,18,40,0.85)'; g.fill();
    txt(g, '≈ ' + n.toLocaleString('en-GB') + ' ×', 960, 160, { size: 46, align: 'center', color: C.orange }); txt(g, 'the Hiroshima bomb', 960, 210, { size: 30, align: 'center', color: C.dim }); g.restore(); }
  source(g, 'Schulte et al., Science 2010', W);
}

// ---------- gills: impact glass in fossil fish ----------
function gills(g, o) {
  const { lt, t, W, H } = o;
  heading(g, 'TANIS FOSSIL FISH', 160, 200, ramp(lt, 0));
  g.save(); g.translate(560, 580); g.globalAlpha = ramp(lt, 0.1, 0.6); g.rotate(Math.sin(t) * 0.02);
  g.fillStyle = '#c9b48a'; g.beginPath(); g.moveTo(-360, 0); g.quadraticCurveTo(-240, -110, 0, -100); g.quadraticCurveTo(220, -90, 300, -20); g.lineTo(420, -110); g.lineTo(390, 0); g.lineTo(420, 110); g.lineTo(300, 20); g.quadraticCurveTo(220, 90, 0, 95); g.quadraticCurveTo(-240, 100, -360, 0); g.fill();
  g.strokeStyle = '#8f7a55'; g.lineWidth = 4; for (let i = 0; i < 14; i++) { g.beginPath(); g.moveTo(-80 + i * 26, -70); g.lineTo(-60 + i * 26, 70); g.stroke(); }
  g.strokeStyle = '#6b5838'; g.lineWidth = 6; g.beginPath(); g.arc(-230, 0, 70, -1.2, 1.2); g.stroke();
  g.fillStyle = '#3a2c20'; g.beginPath(); g.arc(-300, -25, 12, 0, 7); g.fill();
  g.strokeStyle = C.orange; g.lineWidth = 5; g.setLineDash([12, 10]); g.beginPath(); g.arc(-210, 0, 85, 0, 7); g.stroke(); g.setLineDash([]);
  g.restore();
  const zk = ramp(lt, 0.9, 0.6);
  g.save(); g.globalAlpha = zk; g.strokeStyle = C.orange; g.lineWidth = 3; g.beginPath(); g.moveTo(400, 520); g.lineTo(1040, 340); g.moveTo(400, 640); g.lineTo(1040, 860); g.stroke(); g.restore();
  const cx = 1340, cy = 600, R = 270 * back(zk);
  if (R > 1) { g.save(); g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fillStyle = '#3a2f2a'; g.fill(); g.clip();
    for (let i = 0; i < 16; i++) { const x = cx - R + 40 + i * 34; g.strokeStyle = '#d9c39a'; g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, cy - R); g.quadraticCurveTo(x + 30, cy, x, cy + R); g.stroke(); }
    const n = Math.floor(clamp((lt - 1.6) / 3) * 26); for (let i = 0; i < n; i++) { const a = i * 2.39996, d = 30 + (i * 37) % (R - 60); const bx = cx + Math.cos(a) * d, by = cy + Math.sin(a) * d; glow(g, bx, by, 34, 'rgba(255,190,110,0.9)'); g.fillStyle = '#fff1d6'; g.beginPath(); g.arc(bx, by, 8, 0, 7); g.fill(); }
    g.restore(); g.beginPath(); g.arc(cx, cy, R, 0, 7); g.lineWidth = 6; g.strokeStyle = C.cream; g.stroke();
    txt(g, 'gill rakers', cx - R + 10, cy - R - 30, { size: 30, color: C.dim, alpha: zk }); txt(g, 'tiny beads of impact glass', cx, cy + R + 50, { size: 34, color: C.orange, align: 'center', alpha: ramp(lt, 2.4) }); }
  source(g, 'DePalma et al., PNAS 2019', W);
}

// ---------- debate: were they cooked? ----------
function debate(g, o) {
  const { lt, step, t, W, H } = o;
  const cards = [{ x: 170, title: '2013 STUDY', head: 'Hours of heat', lines: ['The sky glows like a grill', 'Forests burn worldwide'], col: C.red },
    { x: 1000, title: 'LATER STUDIES', head: '~25 minutes', lines: ['Falling beads shade the ground', 'Living plants are hard to ignite', 'Fires only in some places'], col: C.teal }];
  cards.forEach((c, i) => {
    const show = i === 0 ? ramp(lt, 0, 0.5) * (step === 2 ? 1 : 1) : (step === 2 ? ramp(lt, 0.3, 0.6) : 0.25);
    const dim = step === 2 && i === 0 ? 0.55 : 1;
    g.save(); g.globalAlpha = Math.max(show, i === 1 ? 0.25 : 0) * dim; g.translate(0, (1 - easeOut(show)) * 30);
    rr(g, c.x, 220, 750, 600, 36); g.fillStyle = 'rgba(15,18,40,0.85)'; g.fill(); g.lineWidth = 4; g.strokeStyle = c.col; g.stroke();
    if (i === 1 && step !== 2) { txt(g, '?', c.x + 375, 520, { size: 200, color: C.dim, align: 'center', font: 'Fredoka' }); g.restore(); return; }
    txt(g, c.title, c.x + 60, 290, { size: 28, color: c.col, spacing: 5 });
    // icon
    const ix = c.x + 600, iy = 330;
    if (i === 0) { for (let f = 0; f < 3; f++) { const fl = Math.sin(t * 8 + f) * 6; g.fillStyle = [C.red, C.orange, '#ffd27a'][f]; g.beginPath(); g.moveTo(ix - 40 + f * 10, iy + 50); g.quadraticCurveTo(ix - 50 + f * 12, iy - 10 + fl, ix + f * 4, iy - 60 + f * 22 + fl); g.quadraticCurveTo(ix + 50 - f * 12, iy - 10 + fl, ix + 40 - f * 10, iy + 50); g.fill(); } }
    else { g.fillStyle = C.teal; g.beginPath(); g.arc(ix, iy + 10, 60, Math.PI, 0); g.fill(); g.strokeStyle = C.cream; g.lineWidth = 5; g.beginPath(); g.moveTo(ix, iy + 10); g.lineTo(ix, iy + 80); g.arc(ix - 12, iy + 80, 12, 0, Math.PI); g.stroke(); }
    txt(g, c.head, c.x + 60, 400, { size: 64, font: 'Fredoka' });
    c.lines.forEach((l, li) => txt(g, '• ' + l, c.x + 60, 500 + li * 62, { size: 34, alpha: i === 0 ? ramp(lt, 0.6 + li * 0.5) : ramp(lt, 1.0 + li * 0.7) }));
    g.restore();
  });
  if (step === 2) { const vk = ramp(lt, Math.max(4, o.dur - 3.5), 0.4); if (vk > 0) { g.save(); g.translate(960, 900); g.rotate(-0.04); g.scale(0.7 + 0.3 * back(vk), 0.7 + 0.3 * back(vk)); g.globalAlpha = vk; rr(g, -330, -48, 660, 96, 20); g.fillStyle = C.orange; g.fill(); txt(g, 'VERDICT: STILL DEBATED', 0, 2, { size: 44, color: C.bg0, align: 'center' }); g.restore(); } }
  source(g, step === 2 ? 'Goldin & Melosh, Geology 2009 · Belcher et al., J. Geol. Soc. 2015' : 'Robertson et al., JGR Biogeosciences 2013', W);
}

// ---------- food chain collapse ----------
function foodchain(g, o) {
  const { lt, k, t, W, H } = o;
  // the dimming sun
  const sunA = 1 - clamp(lt / 3); glow(g, 330, 300, 260, `rgba(255,220,140,${0.2 + 0.8 * sunA})`); g.fillStyle = `rgba(255,230,160,${0.15 + 0.85 * sunA})`; g.beginPath(); g.arc(330, 300, 90, 0, 7); g.fill();
  txt(g, 'SUNLIGHT', 330, 450, { size: 30, color: C.dim, align: 'center', spacing: 4 });
  // dust veil
  g.save(); g.globalAlpha = clamp(lt / 3) * 0.7; g.fillStyle = '#5d5a62'; for (let i = 0; i < 40; i++) { g.beginPath(); g.arc((i * 97) % 700 + 20, 200 + Math.sin(i * 2 + t * 0.5) * 40 + (i % 5) * 30, 40 + (i % 4) * 14, 0, 7); g.fill(); } g.restore();
  const layers = [['PLANTS', C.green, 0], ['PLANT EATERS', C.tan, 1], ['MEAT EATERS', C.red, 2]];
  const base = 900, h = 170, cx = 1250;
  layers.forEach(([n, col, i]) => {
    const fallAt = 2.8 + i * 2.3, f = clamp((lt - fallAt) / 1.2), w0 = 900 - i * 260, w1 = w0 - 260, y = base - (i + 1) * h;
    g.save(); g.translate(cx, y + h / 2 + f * f * 500); g.rotate(f * (i % 2 ? -0.35 : 0.3)); g.globalAlpha = 1 - f * 0.9;
    g.fillStyle = col; g.beginPath(); g.moveTo(-w0 / 2, h / 2); g.lineTo(w0 / 2, h / 2); g.lineTo(w1 / 2, -h / 2); g.lineTo(-w1 / 2, -h / 2); g.closePath(); g.fill();
    if (f > 0) { g.strokeStyle = C.bg0; g.lineWidth = 5; g.beginPath(); g.moveTo(-40, -h / 2); g.lineTo(10, 0); g.lineTo(-20, h / 2); g.stroke(); }
    txt(g, n, 0, 4, { size: 40, color: C.bg0, align: 'center', weight: 800 }); g.restore();
  });
  txt(g, 'collapsing from the bottom up', cx, 140, { size: 36, color: C.orange, align: 'center', alpha: ramp(lt, 2.4) });
  source(g, 'Bardeen et al., PNAS 2017 · Senel et al., Nature Geoscience 2023', W);
}

// ---------- extinction: three quarters gone ----------
function extinction(g, o) {
  const { lt, t, W, H } = o;
  const cols = 10, size = 62, gx = 170, gy = 220;
  const gone = Math.floor(75 * clamp((lt - 0.6) / 3.2));
  const order = Array.from({ length: 100 }, (_, i) => i).sort((a, b) => ((a * 7919) % 101) - ((b * 7919) % 101));
  const dead = new Set(order.slice(0, gone));
  for (let i = 0; i < 100; i++) { const x = gx + (i % cols) * (size + 10), y = gy + Math.floor(i / cols) * (size + 10); const d = dead.has(i);
    g.fillStyle = d ? 'rgba(255,255,255,0.08)' : [C.teal, C.green, C.tan, C.pink, C.orange][i % 5]; g.beginPath();
    const kind = i % 4; if (kind === 0) g.arc(x + size / 2, y + size / 2, size * 0.4, 0, 7); else if (kind === 1) rr(g, x + 8, y + 12, size - 16, size - 24, 12); else if (kind === 2) { g.moveTo(x + size / 2, y + 6); g.lineTo(x + size - 6, y + size - 8); g.lineTo(x + 6, y + size - 8); } else g.ellipse(x + size / 2, y + size / 2, size * 0.42, size * 0.26, 0.4, 0, 7); g.fill(); }
  txt(g, gone + '%', 1180, 360, { size: 150, font: 'Fredoka', color: C.orange });
  txt(g, 'of species die out', 1180, 460, { size: 42 });
  const sk = ramp(lt, 4.4, 0.6);
  if (sk > 0) { g.save(); g.globalAlpha = sk; rr(g, 1160, 560, 620, 280, 30); g.fillStyle = 'rgba(15,18,40,0.85)'; g.fill();
    txt(g, 'OVER ~25 KG ON LAND?', 1200, 610, { size: 28, color: C.orange, spacing: 4 }); txt(g, 'almost none survive', 1200, 670, { size: 42 });
    // big dino crossed, small mammal ticked
    g.fillStyle = C.grey; g.beginPath(); g.ellipse(1300, 770, 70, 34, 0, 0, 7); g.fill(); g.fillRect(1330, 700, 22, 60); g.beginPath(); g.ellipse(1360, 698, 30, 16, 0, 0, 7); g.fill();
    g.strokeStyle = C.red; g.lineWidth = 8; g.beginPath(); g.moveTo(1230, 710); g.lineTo(1400, 820); g.moveTo(1400, 710); g.lineTo(1230, 820); g.stroke();
    g.fillStyle = C.tan; g.beginPath(); g.ellipse(1620, 790, 36, 22, 0, 0, 7); g.fill(); g.beginPath(); g.arc(1655, 778, 15, 0, 7); g.fill();
    g.strokeStyle = C.green; g.lineWidth = 8; g.beginPath(); g.moveTo(1690, 740); g.lineTo(1710, 760); g.lineTo(1750, 715); g.stroke(); g.restore(); }
  source(g, 'Schulte et al., Science 2010 · Longrich et al. 2016', W);
}

// ---------- timeline: mammals grow ----------
function timeline(g, o) {
  const { lt, t, W, H } = o;
  const x0 = 200, x1 = 1720, y = 720;
  g.strokeStyle = C.dim; g.lineWidth = 4; g.beginPath(); g.moveTo(x0, y); g.lineTo(lerp(x0, x1, ramp(lt, 0, 1.2)), y); g.stroke();
  const marks = [[0, 'IMPACT', '66 million years ago'], [0.17, 'FERNS', 'the first plants back'], [0.36, 'WORMS', 'a few thousand years'], [1, 'DOG-SIZED MAMMALS', '~700,000 years later']];
  marks.forEach(([f, a, b], i) => { const x = lerp(x0, x1, f), mk = ramp(lt, 0.4 + i * 0.9); g.fillStyle = C.orange; g.globalAlpha = mk; g.beginPath(); g.arc(x, y, 12, 0, 7); g.fill(); if (i % 2) { g.fillRect(x - 1.5, y - 190, 3, 180); } g.globalAlpha = 1;
    txt(g, a, x, y + (i % 2 ? -250 : 60), { size: 28, color: C.orange, align: f === 1 ? 'right' : 'left', spacing: 3, alpha: mk }); txt(g, b, x, y + (i % 2 ? -210 : 100), { size: 26, color: C.dim, align: f === 1 ? 'right' : 'left', alpha: mk }); });
  // growing mammals along the line
  const n = 4; for (let i = 0; i < n; i++) { const f = 0.47 + i * 0.15, x = lerp(x0, x1, f), s = 0.35 + i * 0.42, mk = ramp(lt, 1.6 + i * 0.6, 0.6); if (mk <= 0) continue;
    g.save(); g.translate(x, y - 10); g.scale(s * back(mk), s * back(mk)); g.fillStyle = C.tan;
    g.beginPath(); g.ellipse(0, -60, 90, 50, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(85, -95, 42, 32, -0.3, 0, 7); g.fill(); g.beginPath(); g.moveTo(115, -95); g.lineTo(150, -85); g.lineTo(115, -78); g.fill();
    g.beginPath(); g.arc(70, -128, 14, 0, 7); g.fill(); g.fillStyle = C.bg0; g.beginPath(); g.arc(98, -102, 6, 0, 7); g.fill(); g.fillStyle = C.tan;
    for (const lx of [-50, -20, 30, 55]) g.fillRect(lx, -20, 16, 30); g.strokeStyle = C.tan; g.lineWidth = 10; g.beginPath(); g.moveTo(-85, -65); g.quadraticCurveTo(-150, -70, -170, -20); g.stroke(); g.restore(); }
  const wk = ramp(lt, 4.2, 0.6); if (wk > 0) { g.save(); g.globalAlpha = wk; rr(g, 1180, 150, 560, 150, 28); g.fillStyle = 'rgba(15,18,40,0.85)'; g.fill(); txt(g, '~45 kg (100 lb)', 1460, 205, { size: 48, align: 'center', font: 'Fredoka', color: C.orange }); txt(g, 'within a million years', 1460, 260, { size: 30, align: 'center', color: C.dim }); g.restore(); }
  source(g, 'Lyson et al., Science 2019 · Chin et al., PLOS ONE 2013 · Vajda et al., Science 2001', W);
}

const INSERTS = { spring, map, scale, gills, debate, foodchain, extinction, timeline };
export function drawInsert(g, name, o) {
  g.clearRect(0, 0, o.W, o.H);
  background(g, o.W, o.H, o.t);
  (INSERTS[name] || (() => txt(g, 'missing insert: ' + name, 960, 540, { align: 'center' })))(g, o);
  // fade in from the previous shot
  const a = clamp(1 - o.lt / 0.3); if (a > 0) { g.save(); g.globalAlpha = a; g.fillStyle = '#0e0f1c'; g.fillRect(0, 0, o.W, o.H); g.restore(); }
}
