// More Case File sets: a generic side-on room builder with props, plus extra paper inserts.
import { W, H, INK, YEL, RED, PAPER, rr, fillStroke, shade, mix, clamp, lerp, ease, easeOut, hash, rng, textOutlined, cached } from './engine.js';
import { glowSpot } from './sets.js';
export const FLOOR = 840;

// ---------- props ----------
export function windowFrame(ctx, x, y, w, h, t, o = {}) {
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, o.sky0 || '#9fc3d6'); g.addColorStop(1, o.sky1 || '#e3e6d8'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  if (o.city) { const r = rng(o.seed || 3); let xx = x - 20; while (xx < x + w) { const bw = 40 + r() * 70, bh = 40 + r() * h * 0.6; ctx.fillStyle = o.cityCol || 'rgba(90,110,130,.55)'; ctx.fillRect(xx, y + h - bh, bw, bh); xx += bw + 6; } }
  if (o.trees) { ctx.fillStyle = 'rgba(70,110,80,.7)'; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(x + w * (0.15 + i * 0.25), y + h * 0.85, w * 0.14, 0, 7); ctx.fill(); } }
  if (o.night) { ctx.fillStyle = 'rgba(15,22,45,.55)'; ctx.fillRect(x, y, w, h); }
  ctx.restore();
  ctx.lineWidth = 12; ctx.strokeStyle = o.frame || '#e9e1cf'; ctx.strokeRect(x, y, w, h); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.strokeRect(x - 6, y - 6, w + 12, h + 12);
  ctx.lineWidth = 7; ctx.strokeStyle = o.frame || '#e9e1cf'; ctx.beginPath(); ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w / 2, y + h); ctx.moveTo(x, y + h / 2); ctx.lineTo(x + w, y + h / 2); ctx.stroke();
  ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.stroke();
  rr(ctx, x - 20, y + h + 4, w + 40, 16, 3); fillStroke(ctx, o.frame || '#e9e1cf', INK, 2.5);
  if (o.light) glowSpot(ctx, x + w / 2, y + h / 2, w, o.light, 0.6);
}
export function door(ctx, x, y, w, h, o = {}) {
  rr(ctx, x - 10, y - 10, w + 20, h + 10, 3); fillStroke(ctx, o.frame || '#d8cdb6', INK, 3);
  rr(ctx, x, y, w, h, 2); fillStroke(ctx, o.color || '#7a5136', INK, 3);
  ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = 3; rr(ctx, x + 18, y + 20, w - 36, h * 0.38, 3); ctx.stroke(); rr(ctx, x + 18, y + h * 0.48, w - 36, h * 0.44, 3); ctx.stroke();
  ctx.beginPath(); ctx.arc(x + w - 22, y + h * 0.52, 7, 0, 7); fillStroke(ctx, '#d4b45a', INK, 2);
  if (o.sign) { rr(ctx, x + w / 2 - 50, y + 30, 100, 34, 3); fillStroke(ctx, '#efe6d2', INK, 2); ctx.fillStyle = INK; ctx.font = '900 20px "Nunito"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(o.sign, x + w / 2, y + 48); }
}
export function bookshelf(ctx, x, y, w, h, seed = 1) {
  rr(ctx, x, y, w, h, 3); fillStroke(ctx, '#5a3f2c', INK, 3);
  const r = rng(seed), cols = ['#8c3b2e', '#2f4f6b', '#3e6b4a', '#c79a3c', '#6b4a7a', '#b5672f', '#e0d4b8', '#2b2b2b'];
  const sh = Math.floor((h - 20) / 92);
  for (let s = 0; s < sh; s++) {
    const sy = y + 14 + s * 92; ctx.fillStyle = '#3f2b1e'; ctx.fillRect(x + 10, sy, w - 20, 80);
    let bx = x + 14; while (bx < x + w - 30) { const bw = 12 + r() * 14, bh = 52 + r() * 24, lean = r() > 0.92 ? 0.12 : 0;
      ctx.save(); ctx.translate(bx, sy + 80); ctx.rotate(lean); rr(ctx, 0, -bh, bw, bh, 2); fillStroke(ctx, cols[Math.floor(r() * cols.length)], INK, 1.8);
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(2, -bh + 10, bw - 4, 3); ctx.restore(); bx += bw + 1 + (lean ? 6 : 0); }
    ctx.fillStyle = '#6b4b34'; ctx.fillRect(x + 6, sy + 80, w - 12, 10); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.strokeRect(x + 6, sy + 80, w - 12, 10);
  }
}
export function wallClock(ctx, x, y, r, t, hour = 10) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, 7); fillStroke(ctx, '#f3ecdc', INK, 4); ctx.beginPath(); ctx.arc(x, y, r - 7, 0, 7); ctx.lineWidth = 2; ctx.stroke();
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; ctx.beginPath(); ctx.moveTo(x + Math.sin(a) * (r - 14), y - Math.cos(a) * (r - 14)); ctx.lineTo(x + Math.sin(a) * (r - 20), y - Math.cos(a) * (r - 20)); ctx.lineWidth = 3; ctx.stroke(); }
  const m = (t / 60) * Math.PI * 2 * 6, hA = (hour / 12) * Math.PI * 2 + m / 12;
  ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.sin(hA) * r * 0.5, y - Math.cos(hA) * r * 0.5); ctx.stroke();
  ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.sin(m) * r * 0.75, y - Math.cos(m) * r * 0.75); ctx.stroke();
}
export function frameArt(ctx, x, y, w, h, kind = 'land') {
  rr(ctx, x - 12, y - 12, w + 24, h + 24, 3); fillStroke(ctx, '#8a6a3c', INK, 3);
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  if (kind === 'land') { ctx.fillStyle = '#b9d0d6'; ctx.fillRect(x, y, w, h); ctx.fillStyle = '#7e9b6e'; ctx.beginPath(); ctx.moveTo(x, y + h); ctx.quadraticCurveTo(x + w * 0.3, y + h * 0.4, x + w * 0.6, y + h * 0.7); ctx.quadraticCurveTo(x + w * 0.8, y + h * 0.5, x + w, y + h * 0.6); ctx.lineTo(x + w, y + h); ctx.fill(); }
  else if (kind === 'seal') { ctx.fillStyle = '#26345a'; ctx.fillRect(x, y, w, h); ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, Math.min(w, h) * 0.36, 0, 7); fillStroke(ctx, '#d8b65a', INK, 3); ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, Math.min(w, h) * 0.24, 0, 7); fillStroke(ctx, '#26345a', '#d8b65a', 3); }
  else if (kind === 'car') { ctx.fillStyle = '#2a2a33'; ctx.fillRect(x, y, w, h); ctx.fillStyle = '#e9b23a'; ctx.beginPath(); ctx.moveTo(x + w * .1, y + h * .7); ctx.lineTo(x + w * .3, y + h * .45); ctx.lineTo(x + w * .7, y + h * .42); ctx.lineTo(x + w * .92, y + h * .62); ctx.lineTo(x + w * .92, y + h * .72); ctx.closePath(); ctx.fill(); }
  ctx.restore();
}
export function plant(ctx, x, y, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.33; ctx.save(); ctx.rotate(a + Math.PI / 2); ctx.beginPath(); ctx.ellipse(0, -60, 16, 58, 0, 0, 7); fillStroke(ctx, i % 2 ? '#3f6b47' : '#4f7f55', INK, 2.5); ctx.restore(); }
  ctx.beginPath(); ctx.moveTo(-38, -60); ctx.lineTo(38, -60); ctx.lineTo(28, 0); ctx.lineTo(-28, 0); ctx.closePath(); fillStroke(ctx, '#b4653d', INK, 3);
  ctx.restore();
}
export function cabinet(ctx, x, y, w = 110, h = 230) {
  rr(ctx, x, y - h, w, h, 4); fillStroke(ctx, '#8b949a', INK, 3);
  for (let i = 0; i < 4; i++) { rr(ctx, x + 10, y - h + 10 + i * (h - 20) / 4, w - 20, (h - 20) / 4 - 8, 3); fillStroke(ctx, '#9da6ac', INK, 2); rr(ctx, x + w / 2 - 16, y - h + 26 + i * (h - 20) / 4, 32, 8, 3); fillStroke(ctx, '#5b6266', INK, 1.5); }
}
export function serverRack(ctx, x, y, w, h, t, seed = 1) {
  rr(ctx, x, y - h, w, h, 6); fillStroke(ctx, '#1c2328', INK, 3);
  const n = Math.floor((h - 20) / 44);
  for (let i = 0; i < n; i++) { rr(ctx, x + 12, y - h + 12 + i * 44, w - 24, 34, 3); fillStroke(ctx, '#283138', INK, 2);
    for (let j = 0; j < 5; j++) { const on = hash(seed * 17 + i * 9 + j + Math.floor(t * (2 + j))) > .45; ctx.fillStyle = on ? (j % 2 ? '#5fe08a' : '#ffb347') : '#3a4448'; ctx.fillRect(x + 24 + j * 13, y - h + 25 + i * 44, 7, 7); }
    ctx.strokeStyle = 'rgba(255,255,255,.08)'; ctx.lineWidth = 2; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.moveTo(x + w - 70 + k * 8, y - h + 18 + i * 44); ctx.lineTo(x + w - 70 + k * 8, y - h + 40 + i * 44); ctx.stroke(); }
  }
}
export function tableSide(ctx, x, w, top = 700, color = '#7a5638') {   // side-on table: top + two legs, drawn in FRONT of people
  rr(ctx, x, top, w, 22, 4); fillStroke(ctx, color, INK, 3.5);
  rr(ctx, x + 20, top + 22, 20, FLOOR - top - 22, 3); fillStroke(ctx, shade(color, .8), INK, 3); rr(ctx, x + w - 40, top + 22, 20, FLOOR - top - 22, 3); fillStroke(ctx, shade(color, .8), INK, 3);
}
export function laptopSide(ctx, x, top, t, o = {}) {   // seen from the side: screen faces left (o.face=-1) or right
  const f = o.face || -1;
  rr(ctx, x - 70, top - 8, 140, 8, 3); fillStroke(ctx, '#8a9198', INK, 2.5);
  ctx.beginPath(); ctx.moveTo(x + f * -66, top - 6); ctx.lineTo(x + f * -50, top - 6); ctx.lineTo(x + f * -84, top - 128); ctx.lineTo(x + f * -98, top - 126); ctx.closePath(); fillStroke(ctx, '#9aa1a8', INK, 3);
  if (o.glow !== false) glowSpot(ctx, x + f * 10, top - 70, 140, 'rgba(110,220,255,.35)');
}
export function bars(ctx, x0, x1, y0, y1, color = '#3a3f46') {
  for (let x = x0; x <= x1; x += 46) { rr(ctx, x - 6, y0, 12, y1 - y0, 5); fillStroke(ctx, color, INK, 2.5); }
  [y0 + 20, (y0 + y1) / 2, y1 - 30].forEach(y => { rr(ctx, x0 - 12, y - 8, x1 - x0 + 24, 16, 4); fillStroke(ctx, color, INK, 2.5); });
}
export function flag(ctx, x, y, kind = 'us') {
  ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.fillStyle = '#c9a65a'; ctx.fillRect(x - 4, y, 8, FLOOR - y); ctx.strokeRect(x - 4, y, 8, FLOOR - y);
  ctx.save(); ctx.translate(x + 4, y + 10); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(60, -10, 120, 0); ctx.lineTo(120, 80); ctx.quadraticCurveTo(60, 70, 0, 80); ctx.closePath(); ctx.save(); ctx.clip();
  if (kind === 'us') { for (let i = 0; i < 7; i++) { ctx.fillStyle = i % 2 ? '#efe6d2' : '#b3392e'; ctx.fillRect(0, i * 12 - 6, 130, 12); } ctx.fillStyle = '#2b3d6b'; ctx.fillRect(0, -10, 54, 48); }
  else if (kind === 'nl') { ['#b3392e', '#efe6d2', '#2b4f8a'].forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(0, -10 + i * 30, 130, 30); }); }
  else if (kind === 'th') { ['#b3392e', '#efe6d2', '#2b3d6b', '#efe6d2', '#b3392e'].forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(0, -10 + [0, 16, 32, 56, 72][i], 130, [16, 16, 24, 16, 20][i]); }); }
  ctx.restore(); ctx.stroke(); ctx.restore();
}

// ---------- generic room ----------
// o: { wall, wall2 (lower), floor, trim, dark (0..1), light: [x,y,r,color], items: fn(ctx,t) drawn on the back wall }
export function room(ctx, t, o = {}) {
  const wall = o.wall || '#d9c7a4', wall2 = o.wall2 || shade(wall, 0.8), floor = o.floor || '#6b4a34';
  ctx.fillStyle = wall; ctx.fillRect(-400, -400, W + 800, FLOOR + 400);
  if (o.stripes) { ctx.fillStyle = 'rgba(0,0,0,.05)'; for (let x = -400; x < W + 400; x += 60) ctx.fillRect(x, -400, 30, FLOOR + 400); }
  if (o.bricks) { ctx.save(); ctx.strokeStyle = 'rgba(0,0,0,.14)'; ctx.lineWidth = 2; for (let y = -400, r = 0; y < FLOOR; y += 34, r++) { ctx.beginPath(); ctx.moveTo(-400, y); ctx.lineTo(W + 400, y); ctx.stroke(); for (let x = -400 + (r % 2) * 40; x < W + 400; x += 80) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 34); ctx.stroke(); } } ctx.restore(); }
  const wy = o.wainscot ?? 600;
  if (wy < FLOOR) { ctx.fillStyle = wall2; ctx.fillRect(-400, wy, W + 800, FLOOR - wy); ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = 3;
    for (let x = -360; x < W + 400; x += 210) { rr(ctx, x, wy + 22, 170, FLOOR - wy - 44, 4); ctx.stroke(); }
    rr(ctx, -400, wy - 8, W + 800, 14, 2); fillStroke(ctx, o.trim || shade(wall2, 1.25), INK, 2.5); }
  if (o.items) o.items(ctx, t);
  ctx.fillStyle = floor; ctx.fillRect(-400, FLOOR, W + 800, 500);
  ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-400, FLOOR); ctx.lineTo(W + 400, FLOOR); ctx.stroke();
  if (o.tiles) { ctx.strokeStyle = 'rgba(0,0,0,.22)'; ctx.lineWidth = 2; for (let x = -400; x < W + 400; x += 110) { ctx.beginPath(); ctx.moveTo(x, FLOOR); ctx.lineTo(x - 60, H + 100); ctx.stroke(); } for (let y = FLOOR + 50; y < H + 100; y += 60) { ctx.beginPath(); ctx.moveTo(-400, y); ctx.lineTo(W + 400, y); ctx.stroke(); } }
  else { ctx.strokeStyle = 'rgba(0,0,0,.28)'; ctx.lineWidth = 2; for (let y = FLOOR + 36; y < H + 100; y += 38) { ctx.beginPath(); ctx.moveTo(-400, y); ctx.lineTo(W + 400, y); ctx.stroke(); } }
  ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(-400, FLOOR, W + 800, 18);
  if (o.lamps) o.lamps.forEach(([x, y]) => { ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, -400); ctx.lineTo(x, y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x - 46, y + 34); ctx.quadraticCurveTo(x, y - 14, x + 46, y + 34); ctx.closePath(); fillStroke(ctx, '#3b3f3a', INK, 3); glowSpot(ctx, x, y + 50, 220, 'rgba(255,214,150,.45)'); ctx.fillStyle = '#ffe9b8'; ctx.beginPath(); ctx.ellipse(x, y + 34, 24, 7, 0, 0, 7); ctx.fill(); });
  if (o.dark) { ctx.fillStyle = `rgba(14,20,38,${o.dark})`; ctx.fillRect(-400, -400, W + 800, H + 800); }
  if (o.glow) o.glow.forEach(([x, y, r, c]) => glowSpot(ctx, x, y, r, c));
}

// ---------- exterior street (San Francisco / generic city) ----------
export function cityStreet(ctx, t, o = {}) {
  const g = ctx.createLinearGradient(0, -200, 0, FLOOR); g.addColorStop(0, o.sky0 || '#8fb3c9'); g.addColorStop(1, o.sky1 || '#e9dcc0'); ctx.fillStyle = g; ctx.fillRect(-400, -400, W + 800, FLOOR + 400);
  // far hills
  ctx.fillStyle = 'rgba(110,140,130,.55)'; ctx.beginPath(); ctx.moveTo(-400, 520); for (let x = -400; x <= W + 400; x += 100) ctx.lineTo(x, 470 + Math.sin(x * 0.006) * 50 + Math.sin(x * 0.017) * 20); ctx.lineTo(W + 400, 900); ctx.lineTo(-400, 900); ctx.fill();
  // row houses (Victorian, coloured)
  const cols = o.cols || ['#c9765b', '#7f9db0', '#e2c27a', '#8fae8a', '#c79bb0', '#d9d2bf'];
  let x = -360, i = 0;
  while (x < W + 360) {
    const w = 300, h = 420 + (i % 3) * 30, c = cols[i % cols.length], top = FLOOR - h;
    ctx.fillStyle = c; ctx.fillRect(x, top, w, h); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.strokeRect(x, top, w, h);
    ctx.beginPath(); ctx.moveTo(x - 14, top); ctx.lineTo(x + w / 2, top - 70); ctx.lineTo(x + w + 14, top); ctx.closePath(); fillStroke(ctx, shade(c, .75), INK, 3);
    rr(ctx, x - 10, top - 6, w + 20, 16, 2); fillStroke(ctx, '#efe6d2', INK, 2);
    // bay window
    ctx.beginPath(); ctx.moveTo(x + 40, top + 60); ctx.lineTo(x + 180, top + 60); ctx.lineTo(x + 200, top + 80); ctx.lineTo(x + 200, top + 220); ctx.lineTo(x + 20, top + 220); ctx.lineTo(x + 20, top + 80); ctx.closePath(); fillStroke(ctx, shade(c, 1.15), INK, 3);
    [[40, 90], [100, 90], [150, 90]].forEach(([wx, wy]) => { rr(ctx, x + wx, top + wy, 40, 100, 2); fillStroke(ctx, o.night ? '#f2c77a' : '#5b7f95', INK, 2.5); });
    door(ctx, x + 210, FLOOR - 190, 70, 190, { color: shade(c, .6), frame: '#efe6d2' });
    rr(ctx, x + 30, FLOOR - 160, 150, 110, 2); fillStroke(ctx, o.night ? '#f2c77a' : '#5b7f95', INK, 2.5);
    ctx.strokeStyle = 'rgba(0,0,0,.12)'; ctx.lineWidth = 2; for (let yy = top + 240; yy < FLOOR - 170; yy += 20) { ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + w, yy); ctx.stroke(); }
    x += w + 6; i++;
  }
  ctx.fillStyle = '#9a958a'; ctx.fillRect(-400, FLOOR, W + 800, 46); ctx.fillStyle = '#4a4b50'; ctx.fillRect(-400, FLOOR + 46, W + 800, 400);
  ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-400, FLOOR); ctx.lineTo(W + 400, FLOOR); ctx.moveTo(-400, FLOOR + 46); ctx.lineTo(W + 400, FLOOR + 46); ctx.stroke();
  ctx.fillStyle = 'rgba(240,220,160,.5)'; for (let xx = -300; xx < W + 300; xx += 220) ctx.fillRect(xx, FLOOR + 150, 110, 10);
  if (o.night) { ctx.fillStyle = 'rgba(14,20,42,.45)'; ctx.fillRect(-400, -400, W + 800, H + 800); }
}

// ---------- prison wall exterior (gate, morning) ----------
export function prisonGate(ctx, t, o = {}) {
  const g = ctx.createLinearGradient(0, -200, 0, FLOOR); g.addColorStop(0, '#a9c6d6'); g.addColorStop(1, '#efe2c4'); ctx.fillStyle = g; ctx.fillRect(-400, -400, W + 800, FLOOR + 400);
  ctx.fillStyle = '#c8bda6'; ctx.fillRect(-400, 330, W + 800, FLOOR - 330); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.strokeRect(-400, 330, W + 800, FLOOR - 330);
  ctx.strokeStyle = 'rgba(0,0,0,.12)'; for (let x = -400; x < W + 400; x += 120) { ctx.beginPath(); ctx.moveTo(x, 330); ctx.lineTo(x, FLOOR); ctx.stroke(); }
  // razor wire
  ctx.strokeStyle = '#59606a'; ctx.lineWidth = 2.5; for (let x = -400; x < W + 400; x += 34) { ctx.beginPath(); ctx.arc(x, 312, 17, 0, 7); ctx.stroke(); }
  // watch tower
  rr(ctx, 1500, 120, 60, 220, 2); fillStroke(ctx, '#b0a58e', INK, 3); rr(ctx, 1460, 70, 140, 70, 3); fillStroke(ctx, '#d8cdb6', INK, 3); ctx.beginPath(); ctx.moveTo(1450, 70); ctx.lineTo(1530, 30); ctx.lineTo(1610, 70); ctx.closePath(); fillStroke(ctx, '#5b6266', INK, 3);
  // gate
  const gx = 760, gw = 400, open = o.open || 0;
  rr(ctx, gx - 40, 380, gw + 80, FLOOR - 380, 3); fillStroke(ctx, '#a99d86', INK, 3);
  ctx.fillStyle = '#e8e0cc'; ctx.fillRect(gx, 420, gw, FLOOR - 420);
  ctx.save(); ctx.beginPath(); ctx.rect(gx, 420, gw, FLOOR - 420); ctx.clip(); bars(ctx, gx + 20 + open * gw, gx + gw + open * gw, 420, FLOOR, '#4b5058'); ctx.restore();
  rr(ctx, gx + 80, 390, gw - 160, 28, 3); fillStroke(ctx, '#2b3a55', INK, 2.5); ctx.fillStyle = '#efe6d2'; ctx.font = '900 20px "Nunito"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('FEDERAL CORRECTIONAL', gx + gw / 2, 405);
  ctx.fillStyle = '#8a8478'; ctx.fillRect(-400, FLOOR, W + 800, 400); ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(-400, FLOOR); ctx.lineTo(W + 400, FLOOR); ctx.stroke();
}

// ---------- jail cell (dark, one window) ----------
export function cell(ctx, t, o = {}) {
  room(ctx, t, { wall: '#5d6466', wall2: '#4c5355', wainscot: 650, floor: '#3d3f41', tiles: true, bricks: true });
  ctx.save(); ctx.fillStyle = '#26303a'; ctx.fillRect(900, 200, 140, 120); ctx.restore();
  bars(ctx, 910, 1030, 200, 320, '#2f3438'); glowSpot(ctx, 970, 260, 160, 'rgba(255,236,190,.55)');
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = 'rgba(255,236,190,.10)'; ctx.beginPath(); ctx.moveTo(900, 320); ctx.lineTo(1040, 320); ctx.lineTo(1300, FLOOR); ctx.lineTo(1000, FLOOR); ctx.closePath(); ctx.fill(); ctx.restore();
  rr(ctx, 300, 700, 420, 40, 4); fillStroke(ctx, '#6e7376', INK, 3); rr(ctx, 310, 680, 400, 22, 8); fillStroke(ctx, '#b9b2a0', INK, 2.5);
  rr(ctx, 320, 740, 20, 100, 2); fillStroke(ctx, '#4c5355', INK, 2.5); rr(ctx, 680, 740, 20, 100, 2); fillStroke(ctx, '#4c5355', INK, 2.5);
  ctx.fillStyle = 'rgba(10,14,24,.28)'; ctx.fillRect(-400, -400, W + 800, H + 800);
  glowSpot(ctx, 1120, 620, 320, 'rgba(255,230,180,.22)');
}

// ---------- courtroom ----------
export function courtroom(ctx, t) {
  room(ctx, t, { wall: '#c9b48c', wall2: '#6b4a32', trim: '#8a6a48', floor: '#4a3426', wainscot: 520, stripes: true,
    items: (c) => { frameArt(c, 900, 120, 140, 140, 'seal'); flag(c, 640, 260, 'us'); wallClock(c, 1500, 200, 46, t, 2); } });
  // judge's bench (high, centre)
  rr(ctx, 720, 470, 480, 70, 4); fillStroke(ctx, '#5a3d29', INK, 3.5); rr(ctx, 700, 540, 520, 300, 4); fillStroke(ctx, '#6b4a32', INK, 3.5);
  ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = 3; [740, 900, 1060].forEach(x => { rr(ctx, x, 570, 120, 240, 4); ctx.stroke(); });
}

// ---------- big subscribe button set (our own) ----------
export function subscribeSet(ctx, t, o = {}) {
  room(ctx, t, { wall: '#d8c9a8', wall2: '#a58a64', floor: '#5d4330', wainscot: 640 });
  const pressed = o.press || 0, x = 1180, y = FLOOR;
  rr(ctx, x - 90, y - 240, 180, 240, 6); fillStroke(ctx, '#3a3f46', INK, 3.5);
  ctx.fillStyle = '#efe6d2'; ctx.font = '900 26px "Nunito"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('SUBSCRIBE', x, y - 110);
  ctx.beginPath(); ctx.ellipse(x, y - 250 + pressed * 10, 70, 22, 0, 0, 7); fillStroke(ctx, '#c7342a', INK, 3.5);
  ctx.beginPath(); ctx.rect(x - 70, y - 270 + pressed * 10, 140, 20); ctx.fillStyle = '#c7342a'; ctx.fill(); ctx.beginPath(); ctx.ellipse(x, y - 270 + pressed * 10, 70, 22, 0, 0, 7); fillStroke(ctx, '#e04a3c', INK, 3.5);
  if (o.thumb) { const k = o.thumb; ctx.save(); ctx.translate(1500, 420 - easeOut(k) * 30); ctx.globalAlpha = clamp(k * 3); ctx.scale(0.6 + 0.4 * easeOut(k), 0.6 + 0.4 * easeOut(k));
    rr(ctx, -50, -10, 100, 90, 18); fillStroke(ctx, YEL, INK, 4); rr(ctx, -28, -80, 44, 90, 18); fillStroke(ctx, YEL, INK, 4); rr(ctx, -90, -6, 40, 92, 8); fillStroke(ctx, '#3b4a63', INK, 4); ctx.restore(); }
}

// ---------- INSERTS ----------
// newspaper front page: headline + photo box with a silhouette
export function newspaper(ctx, t, o = {}) {
  const k = o.local || 0; ctx.fillStyle = '#3b2a21'; ctx.fillRect(-400, -400, W + 800, H + 800);
  const sp = easeOut(clamp(k / 0.6)); ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(lerp(-0.6, -0.03, sp)); ctx.scale(lerp(0.3, 1, sp), lerp(0.3, 1, sp));
  const w = 1000, h = 900, x = -w / 2, y = -h / 2;
  ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(x + 16, y + 20, w, h); ctx.beginPath(); ctx.rect(x, y, w, h); fillStroke(ctx, '#ede4cf', INK, 3);
  ctx.fillStyle = INK; ctx.font = '64px "Special Elite"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(o.paper || 'THE DAILY RECORD', 0, y + 70);
  ctx.fillRect(x + 40, y + 112, w - 80, 4); ctx.fillRect(x + 40, y + 122, w - 80, 2);
  ctx.font = '22px "Special Elite"'; ctx.fillText(o.date || '', 0, y + 145);
  ctx.font = '76px "Lilita One"'; (o.headline || '').split('\n').forEach((l, i) => ctx.fillText(l, 0, y + 230 + i * 84));
  const py = y + 250 + (o.headline || '').split('\n').length * 84;
  ctx.fillStyle = '#c9bfa8'; ctx.fillRect(x + 60, py, 430, 330); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.strokeRect(x + 60, py, 430, 330);
  if (o.photo) o.photo(ctx, x + 275, py + 330);
  ctx.fillStyle = 'rgba(40,35,30,.55)'; for (let i = 0; i < 12; i++) { ctx.fillRect(x + 520, py + i * 27, 420 - (i % 4 === 3 ? 140 : 0), 9); }
  for (let i = 0; i < 4; i++) ctx.fillRect(x + 60, py + 350 + i * 24, 880 - (i === 3 ? 300 : 0), 8);
  ctx.restore();
}
// stat bars: [{label, value, color}] growing over time; o.max
export function statBars(ctx, t, o = {}) {
  const k = o.local || 0; ctx.fillStyle = '#e8dcc0'; ctx.fillRect(-400, -400, W + 800, H + 800);
  ctx.fillStyle = 'rgba(0,0,0,.05)'; for (let y = 0; y < H; y += 54) ctx.fillRect(0, y, W, 2);
  if (o.title) textOutlined(ctx, o.title, W / 2, 140, { size: 74, fill: o.titleColor || RED, lw: 10 });
  const n = o.bars.length, bw = 240, gap = 160, x0 = W / 2 - (n * bw + (n - 1) * gap) / 2, base = 880;
  if (n) { ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x0 - 60, base); ctx.lineTo(x0 + n * bw + (n - 1) * gap + 60, base); ctx.stroke(); }
  o.bars.forEach((b, i) => { const p = easeOut(clamp((k - (b.at || 0)) / 1.0)), hgt = (b.value / o.max) * 560 * p, x = x0 + i * (bw + gap);
    rr(ctx, x, base - hgt, bw, hgt, 6); fillStroke(ctx, b.color || YEL, INK, 4);
    if (p > 0.05) textOutlined(ctx, b.show ? b.show(p) : String(Math.round(b.value * p)), x + bw / 2, base - hgt - 50, { size: 60, fill: '#f6efdd', lw: 10 });
    ctx.fillStyle = INK; ctx.font = '900 34px "Nunito"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(b.label, x + bw / 2, base + 44); });
}
// a parcel opened on a table with ID cards fanning out
export function idParcel(ctx, t, o = {}) {
  const k = o.local || 0; ctx.fillStyle = '#58606a'; ctx.fillRect(-400, -400, W + 800, H + 800);
  ctx.fillStyle = 'rgba(0,0,0,.12)'; for (let x = -400; x < W + 400; x += 80) ctx.fillRect(x, -400, 2, H + 800);
  // box
  ctx.save(); ctx.translate(560, 600); ctx.rotate(-0.06); ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(-250, -150, 520, 330); rr(ctx, -260, -170, 520, 330, 6); fillStroke(ctx, '#c49a62', INK, 4);
  ctx.fillStyle = '#a87e4b'; ctx.fillRect(-260, -40, 520, 40); rr(ctx, -120, -120, 240, 70, 3); fillStroke(ctx, '#efe6d2', INK, 2.5);
  ctx.fillStyle = INK; ctx.font = '22px "Special Elite"'; ctx.textAlign = 'left'; ctx.fillText('FROM: CANADA', -100, -96); ctx.fillText('TO: SAN FRANCISCO', -100, -66);
  ctx.restore();
  const N = o.n || 9;
  for (let i = 0; i < N; i++) { const p = easeOut(clamp((k - 0.4 - i * 0.18) / 0.5)); if (p <= 0) continue;
    const tx = 1000 + (i % 3) * 270, ty = 300 + Math.floor(i / 3) * 210, x = lerp(600, tx, p), y = lerp(600, ty, p), r = lerp(0, (hash(i) - .5) * 0.2, p);
    ctx.save(); ctx.translate(x, y); ctx.rotate(r); ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(-110, -66, 230, 146);
    rr(ctx, -115, -72, 230, 144, 10); fillStroke(ctx, ['#dfe9ef', '#efe2c9', '#e5efd9'][i % 3], INK, 3);
    ctx.fillStyle = ['#2f5a7a', '#8a3b2e', '#3e6b4a'][i % 3]; ctx.fillRect(-113, -70, 226, 26);
    ctx.fillStyle = '#efe6d2'; ctx.font = '900 16px "Nunito"'; ctx.textAlign = 'center'; ctx.fillText('DRIVER LICENSE', 0, -52);
    ctx.save(); ctx.translate(-62, 20); ctx.scale(0.36, 0.36); if (o.face) o.face(ctx, t); ctx.restore();
    ctx.fillStyle = 'rgba(40,35,30,.6)'; for (let j = 0; j < 4; j++) ctx.fillRect(-10, -20 + j * 20, 100 - j * 12, 7);
    ctx.restore(); }
}
// a mock web shop page drawn on paper (no real UI, icons only)
export function shopCard(ctx, t, o = {}) {
  const k = o.local || 0; ctx.fillStyle = '#2a2523'; ctx.fillRect(-400, -400, W + 800, H + 800);
  const w = 1300, h = 760, x = W / 2 - w / 2, y = H / 2 - h / 2;
  ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(x + 16, y + 20, w, h); rr(ctx, x, y, w, h, 14); fillStroke(ctx, '#ece3cc', INK, 4);
  rr(ctx, x, y, w, 80, 14); fillStroke(ctx, o.barColor || '#3e6b4a', INK, 4); ctx.fillStyle = '#efe6d2'; ctx.font = '50px "Lilita One"'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(o.title || 'SILK ROAD', x + 110, y + 42);
  ctx.beginPath(); ctx.arc(x + 60, y + 40, 24, 0, 7); fillStroke(ctx, '#efe6d2', INK, 3); ctx.fillStyle = o.barColor || '#3e6b4a'; ctx.font = '34px "Lilita One"'; ctx.textAlign = 'center'; ctx.fillText(o.logo || '~', x + 60, y + 43);
  const items = o.items || 8;
  for (let i = 0; i < items; i++) { const p = easeOut(clamp((k - 0.2 - i * 0.12) / 0.4)); if (p <= 0) continue; const cx = x + 60 + (i % 4) * 305, cy = y + 120 + Math.floor(i / 4) * 310;
    ctx.save(); ctx.globalAlpha = p; ctx.translate(0, (1 - p) * 30); rr(ctx, cx, cy, 270, 280, 10); fillStroke(ctx, '#f6f0e0', INK, 3);
    ctx.fillStyle = '#d6ccb4'; ctx.fillRect(cx + 14, cy + 14, 242, 140); ctx.strokeRect(cx + 14, cy + 14, 242, 140);
    const ic = i % 4; ctx.save(); ctx.translate(cx + 135, cy + 84);
    if (ic === 0) { rr(ctx, -50, -30, 100, 60, 8); fillStroke(ctx, '#c49a62', INK, 3); ctx.beginPath(); ctx.moveTo(-50, -10); ctx.lineTo(50, -10); ctx.stroke(); }
    else if (ic === 1) { for (let j = 0; j < 3; j++) { ctx.save(); ctx.rotate(j * 0.5 - 0.5); rr(ctx, -12, -34, 24, 68, 12); fillStroke(ctx, ['#d95b4a', '#e9c46a', '#7fa3c0'][j], INK, 3); ctx.restore(); } }
    else if (ic === 2) { ctx.beginPath(); ctx.moveTo(-34, 30); ctx.lineTo(-24, -40); ctx.lineTo(24, -40); ctx.lineTo(34, 30); ctx.closePath(); fillStroke(ctx, '#e9e2cf', INK, 3); ctx.fillStyle = '#8fbf8a'; ctx.fillRect(-26, -6, 52, 30); }
    else { rr(ctx, -60, -36, 120, 72, 6); fillStroke(ctx, '#dfe9ef', INK, 3); ctx.fillStyle = '#2f5a7a'; ctx.fillRect(-58, -34, 116, 16); }
    ctx.restore();
    ctx.fillStyle = YEL; for (let s = 0; s < 5; s++) { ctx.beginPath(); const sx = cx + 30 + s * 30, sy = cy + 190; for (let j = 0; j < 10; j++) { const a = j * Math.PI / 5 - Math.PI / 2, r = j % 2 ? 6 : 13; ctx.lineTo(sx + Math.cos(a) * r, sy + Math.sin(a) * r); } ctx.closePath(); fillStroke(ctx, s < 4 + (i % 2) ? YEL : '#d6ccb4', INK, 1.5); }
    ctx.fillStyle = INK; ctx.font = '900 30px "Nunito"'; ctx.textAlign = 'left'; ctx.fillText('₿ ' + (0.1 + hash(i) * 2).toFixed(2), cx + 22, cy + 245);
    ctx.restore(); }
}
// a police seizure banner over a site
export function seizedNotice(ctx, t, o = {}) {
  const k = o.local || 0; shopCard(ctx, t, { local: 9, title: o.site || 'HANSA', barColor: o.barColor || '#5a3f7a', logo: o.logo || 'H' });
  const p = easeOut(clamp((k - 0.4) / 0.4)); if (p <= 0) return;
  ctx.fillStyle = `rgba(0,0,0,${0.55 * p})`; ctx.fillRect(-400, -400, W + 800, H + 800);
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(lerp(1.6, 1, p), lerp(1.6, 1, p)); ctx.globalAlpha = p;
  rr(ctx, -560, -260, 1120, 520, 14); fillStroke(ctx, '#f1ead8', INK, 5);
  ctx.beginPath(); ctx.arc(-370, -20, 130, 0, 7); fillStroke(ctx, '#2b4f8a', INK, 4); ctx.beginPath(); ctx.arc(-370, -20, 92, 0, 7); fillStroke(ctx, '#d8b65a', INK, 4);
  ctx.beginPath(); for (let j = 0; j < 10; j++) { const a = j * Math.PI / 5 - Math.PI / 2, r = j % 2 ? 26 : 60; ctx.lineTo(-370 + Math.cos(a) * r, -20 + Math.sin(a) * r); } ctx.closePath(); fillStroke(ctx, '#2b4f8a', INK, 3);
  ctx.fillStyle = INK; ctx.font = '88px "Lilita One"'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(o.head || 'THIS SITE', -200, -120); ctx.fillText(o.head2 || 'HAS BEEN SEIZED', -200, -20);
  ctx.font = '30px "Special Elite"'; ctx.fillStyle = '#4a4038'; (o.sub || '').split('\n').forEach((l, i) => ctx.fillText(l, -200, 70 + i * 40));
  ctx.restore();
}
