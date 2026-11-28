// Case File sets, part 5 (long-form 003 WannaCry / NotPetya): ransom screen, hospital front + ambulance,
// car factory, departure board, phone-company office, seaside bedroom, domain shop, kill-switch diagram,
// spy HQ, weapons locker, auction card, update popup, DDoS swarm, airport gate, accounting-software update,
// Chernobyl, container port, power-cut office, airliner.
import { W, H, INK, YEL, RED, clamp, lerp, ease, easeOut, pop, hash, rr, fillStroke, shade, textOutlined } from './engine.js';
import { glowSpot } from './sets.js';
import { FLOOR, room, windowFrame, plant, serverRack, bookshelf, cabinet } from './sets2.js';

const PAPER = '#f6efdd';
const T = (ctx, s, x, y, font, color = INK, align = 'center') => { ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillText(s, x, y); };
const sky = (ctx, top, bot, y1 = FLOOR) => { const g = ctx.createLinearGradient(0, -400, 0, y1); g.addColorStop(0, top); g.addColorStop(1, bot); ctx.fillStyle = g; ctx.fillRect(-400, -400, W + 800, y1 + 400); };
const ground = (ctx, col, y = FLOOR) => { ctx.fillStyle = col; ctx.fillRect(-400, y, W + 800, H - y + 400); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-400, y); ctx.lineTo(W + 400, y); ctx.stroke(); };
function padlock(ctx, x, y, s = 1, col = YEL) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.strokeStyle = INK; ctx.lineWidth = 16; ctx.beginPath(); ctx.arc(0, -30, 34, Math.PI, 0); ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = 9; ctx.stroke(); rr(ctx, -52, -32, 104, 84, 10); fillStroke(ctx, col, INK, 4); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(0, 0, 10, 0, 7); ctx.fill(); ctx.fillRect(-4, 0, 8, 22); ctx.restore(); }

// ---------- the ransom screen (our own design): padlock, message, price, countdown ----------
// o.at: local time it appears (glitch-in), o.small: draw inside a monitor rect [x,y,w,h]
export function ransomScreen(ctx, t, L, o = {}) {
  const [x, y, w, h] = o.rect || [-400, -400, W + 800, H + 800], k = clamp((L - (o.at || 0)) / 0.25);
  if (!o.rect) { ctx.fillStyle = '#1a1f2a'; ctx.fillRect(x, y, w, h); }
  if (k <= 0) return;
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#b0201a'); g.addColorStop(1, '#6e0f0c'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  // scanline glitch while it appears
  if (k < 1) for (let i = 0; i < 8; i++) { ctx.fillStyle = `rgba(255,255,255,${0.2 * (1 - k)})`; ctx.fillRect(x, y + hash(i + Math.floor(t * 30)) * h, w, 6 + hash(i * 3) * 18); }
  const s = o.rect ? Math.min(w / 1920, h / 1080) * 1.0 : 1, cx = o.rect ? x + w / 2 : W / 2, cy = o.rect ? y + h / 2 : H / 2;
  ctx.translate(cx, cy); ctx.scale(s, s);
  glowSpot(ctx, -520, -40, 320, 'rgba(255,200,80,.25)');
  padlock(ctx, -520, -20, 2.4 * (0.8 + 0.2 * pop(k)));
  T(ctx, 'OOPS! YOUR FILES', 140, -250, '96px "Lilita One"', '#fff');
  T(ctx, 'HAVE BEEN ENCRYPTED', 140, -150, '96px "Lilita One"', '#fff');
  rr(ctx, -160, -60, 620, 130, 12); fillStroke(ctx, '#2a0b0a', '#ffd166', 5);
  T(ctx, 'PAY $300 IN BITCOIN', 150, 5, '62px "Lilita One"', '#ffd166');
  const left = Math.max(0, (o.clock ?? 259200) - L * (o.tick || 1)), hh = Math.floor(left / 3600), mm = Math.floor(left % 3600 / 60), ss = Math.floor(left % 60);
  T(ctx, 'TIME LEFT', 150, 140, '900 40px "Nunito"', '#ffb3a8');
  T(ctx, `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`, 150, 220, '96px "Lilita One"', '#fff');
  ctx.fillStyle = 'rgba(255,255,255,.08)'; for (let i = 0; i < 9; i++) ctx.fillRect(-900, -480 + i * 120, 1800, 3);
  ctx.restore();
}

// ---------- a monitor on a desk showing a screen fn ----------
export function monitor(ctx, x, y, w, h, drawScreen) {
  rr(ctx, x - 14, y - 14, w + 28, h + 28, 12); fillStroke(ctx, '#2b3038', INK, 5);
  drawScreen([x, y, w, h]);
  ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.strokeRect(x, y, w, h);
  rr(ctx, x + w / 2 - 26, y + h + 14, 52, 60, 4); fillStroke(ctx, '#4a515c', INK, 3); rr(ctx, x + w / 2 - 110, y + h + 70, 220, 22, 6); fillStroke(ctx, '#4a515c', INK, 3);
}

// ---------- UK ambulance (yellow/green squares), side view; o.lights, o.face ----------
export function ambulance(ctx, x, y, t, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale((o.face || 1) * (o.s || 1), o.s || 1);
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(0, 4, 300, 20, 0, 0, 7); ctx.fill();
  rr(ctx, -280, -300, 400, 250, 14); fillStroke(ctx, '#f4f1e6', INK, 5);
  ctx.beginPath(); ctx.moveTo(120, -250); ctx.lineTo(220, -250); ctx.lineTo(285, -150); ctx.lineTo(285, -50); ctx.lineTo(120, -50); ctx.closePath(); fillStroke(ctx, '#f4f1e6', INK, 5);
  ctx.beginPath(); ctx.moveTo(140, -235); ctx.lineTo(210, -235); ctx.lineTo(258, -160); ctx.lineTo(140, -160); ctx.closePath(); fillStroke(ctx, '#8fc3dc', INK, 3);
  ctx.save(); ctx.beginPath(); ctx.rect(-280, -140, 565, 60); ctx.clip(); for (let i = 0; i < 20; i++) { ctx.fillStyle = i % 2 ? '#2f8f4e' : '#f2d23a'; ctx.fillRect(-280 + i * 30, -140 + (i % 2 ? 0 : 0), 30, 30); ctx.fillStyle = i % 2 ? '#f2d23a' : '#2f8f4e'; ctx.fillRect(-280 + i * 30, -110, 30, 30); } ctx.restore();
  ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.strokeRect(-280, -140, 565, 60);
  ctx.save(); ctx.translate(-80, -200); ctx.scale(o.face || 1, 1); ctx.fillStyle = '#2b5fae'; ctx.font = '40px "Lilita One"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('AMBULANCE', 0, 0); ctx.restore();
  const on = o.lights && Math.floor(t * 6) % 2; rr(ctx, -60, -326, 120, 26, 6); fillStroke(ctx, on ? '#5fb6ff' : '#2a5aa8', INK, 3);
  if (o.lights) glowSpot(ctx, 0, -320, 160, on ? 'rgba(90,170,255,.6)' : 'rgba(90,170,255,.2)');
  [-180, 180].forEach(wx => { ctx.beginPath(); ctx.arc(wx, -40, 46, 0, 7); fillStroke(ctx, '#2a2a2e', INK, 4); ctx.beginPath(); ctx.arc(wx, -40, 20, 0, 7); fillStroke(ctx, '#9aa3ad', INK, 3); });
  ctx.restore();
}

// ---------- hospital front (modern blocks, A&E entrance), ambulances coming / turned away ----------
export function hospitalFront(ctx, t, L, o = {}) {
  sky(ctx, '#7fb6dd', '#d8ecf2'); glowSpot(ctx, 1600, 60, 400, 'rgba(255,240,200,.5)');
  // background blocks
  [[-200, 180, 520, '#c9d3dc'], [1500, 120, 620, '#bfcad6']].forEach(([x, y, w, c]) => { rr(ctx, x, y, w, FLOOR - y, 4); fillStroke(ctx, c, INK, 4); for (let r = 0; r < 10; r++) for (let q = 0; q < 6; q++) { rr(ctx, x + 30 + q * (w - 60) / 6, y + 30 + r * 60, (w - 60) / 6 - 16, 36, 3); fillStroke(ctx, '#7fa9c6', 'rgba(0,0,0,.4)', 2); } });
  // main building: blue glass with white bands
  rr(ctx, 260, 200, 1300, FLOOR - 200, 6); fillStroke(ctx, '#f1f3f4', INK, 5);
  for (let r = 0; r < 7; r++) { ctx.fillStyle = r % 2 ? '#3b78b4' : '#4f8cc6'; ctx.fillRect(280, 230 + r * 62, 1260, 40); for (let q = 0; q < 18; q++) { ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(290 + q * 70, 232 + r * 62, 8, 36); } }
  ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.strokeRect(280, 230, 1260, 7 * 62 - 22);
  // sign
  rr(ctx, 640, 120, 540, 100, 10); fillStroke(ctx, '#005eb8', INK, 5); T(ctx, o.name || 'ROYAL LONDON HOSPITAL', 910, 172, '44px "Lilita One"', '#fff');
  // A&E canopy + doors
  ctx.beginPath(); ctx.moveTo(700, 700); ctx.lineTo(1200, 700); ctx.lineTo(1240, 760); ctx.lineTo(660, 760); ctx.closePath(); fillStroke(ctx, '#e33b2e', INK, 5);
  T(ctx, 'EMERGENCY', 950, 731, '40px "Lilita One"', '#fff');
  rr(ctx, 780, 760, 340, FLOOR - 760, 4); fillStroke(ctx, '#a9cfe0', INK, 4); ctx.beginPath(); ctx.moveTo(950, 760); ctx.lineTo(950, FLOOR); ctx.stroke();
  if (o.alarm) { const on = Math.floor(t * 4) % 2; glowSpot(ctx, 950, 700, 300, on ? 'rgba(255,60,40,.35)' : 'rgba(255,60,40,.1)'); }
  ground(ctx, '#7f8a8f'); ctx.fillStyle = '#e8e2c8'; for (let x = -400; x < W + 400; x += 140) ctx.fillRect(x, FLOOR + 90, 80, 10);
}

// ---------- car factory: assembly line of car bodies, robot arms; o.stop at local time -> line halts, red screens ----------
export function carFactory(ctx, t, L, o = {}) {
  const stopped = L > (o.stop ?? 99), run = stopped ? (o.stop ?? 0) : L;
  room(ctx, t, { wall: '#c9d1d6', wall2: '#9aa6ad', wainscot: 520, floor: '#5b6367', tiles: true, items: c => {
    for (let i = 0; i < 6; i++) { rr(c, 60 + i * 330, 80, 260, 120, 4); fillStroke(c, '#9fd0e6', INK, 3); }
    rr(c, 1420, 300, 360, 150, 6); fillStroke(c, '#2b3038', INK, 4);
    if (stopped) ransomScreen(c, t, L - (o.stop || 0), { rect: [1432, 312, 336, 126] }); else { c.fillStyle = '#3a8a5a'; c.fillRect(1432, 312, 336, 126); T(c, 'LINE RUNNING', 1600, 375, '40px "Lilita One"', '#e8ffe8'); }
  } });
  // warning beacon
  const on = stopped && Math.floor(t * 5) % 2; rr(ctx, 1180, 120, 24, 60, 3); fillStroke(ctx, '#6b6f75', INK, 3); ctx.beginPath(); ctx.arc(1192, 120, 40, Math.PI, 0); ctx.closePath(); fillStroke(ctx, on ? '#ff7a2a' : '#b5542a', INK, 4); if (on) glowSpot(ctx, 1192, 110, 320, 'rgba(255,120,40,.5)');
  // conveyor
  rr(ctx, -400, FLOOR - 140, W + 800, 60, 6); fillStroke(ctx, '#3a3f46', INK, 4);
  for (let i = -10; i < 40; i++) { const x = ((i * 70 + run * 120) % 2800) - 400; ctx.fillStyle = '#23272c'; ctx.fillRect(x, FLOOR - 132, 10, 44); }
  // car bodies moving along
  for (let i = 0; i < 4; i++) { const x = ((i * 620 + run * 120) % 2480) - 300; const col = ['#d33a2c', '#2f6fb3', '#e7e7e7', '#f0b429'][i];
    ctx.save(); ctx.translate(x, FLOOR - 140); rr(ctx, -200, -110, 400, 90, 26); fillStroke(ctx, col, INK, 4); ctx.beginPath(); ctx.moveTo(-110, -110); ctx.lineTo(-60, -190); ctx.lineTo(90, -190); ctx.lineTo(150, -110); ctx.closePath(); fillStroke(ctx, col, INK, 4);
    ctx.beginPath(); ctx.moveTo(-80, -115); ctx.lineTo(-48, -170); ctx.lineTo(10, -170); ctx.lineTo(10, -115); ctx.closePath(); fillStroke(ctx, '#bfe0ee', INK, 3); ctx.beginPath(); ctx.moveTo(30, -115); ctx.lineTo(30, -170); ctx.lineTo(80, -170); ctx.lineTo(120, -115); ctx.closePath(); fillStroke(ctx, '#bfe0ee', INK, 3);
    [-120, 120].forEach(wx => { ctx.beginPath(); ctx.arc(wx, -20, 36, 0, 7); fillStroke(ctx, '#2a2a2e', INK, 4); }); ctx.restore(); }
  // overhead gantry with welding arms hanging down to the cars
  rr(ctx, -400, 230, W + 800, 46, 4); fillStroke(ctx, '#e0a43a', INK, 4); for (let x = -380; x < W + 400; x += 80) { ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, 236); ctx.lineTo(x + 40, 270); ctx.stroke(); }
  [380, 960, 1540].forEach((rx, j) => { const a = stopped ? 0.15 : Math.sin(run * 3 + j * 2) * 0.35; ctx.save(); ctx.translate(rx, 276); rr(ctx, -46, 0, 92, 50, 8); fillStroke(ctx, '#f0a020', INK, 4);
    ctx.translate(0, 40); ctx.rotate(a); rr(ctx, -18, 0, 36, 240, 12); fillStroke(ctx, '#f0a020', INK, 4); ctx.translate(0, 240); ctx.beginPath(); ctx.arc(0, 0, 22, 0, 7); fillStroke(ctx, '#6b6f75', INK, 4);
    ctx.rotate(-a * 2 + 0.5); rr(ctx, -14, 0, 28, 170, 10); fillStroke(ctx, '#f0a020', INK, 4); ctx.translate(0, 170); rr(ctx, -16, 0, 32, 40, 4); fillStroke(ctx, '#3a3f46', INK, 3);
    if (!stopped && Math.floor(t * 10 + j) % 3 === 0) { glowSpot(ctx, 0, 46, 90, 'rgba(255,240,180,.95)'); for (let k = 0; k < 6; k++) { ctx.strokeStyle = '#ffd27a'; ctx.lineWidth = 3; const an = hash(k + Math.floor(t * 20)) * 6.28; ctx.beginPath(); ctx.moveTo(0, 46); ctx.lineTo(Math.cos(an) * 40, 46 + Math.sin(an) * 40); ctx.stroke(); } }
    ctx.restore(); });
  if (o.label) textOutlined(ctx, o.label, 300, 80, { size: 52, fill: '#fff', lw: 9 });
}

// ---------- station departure board (split-flap) that flips to the ransom screen ----------
export function departureBoard(ctx, t, L, o = {}) {
  room(ctx, t, { wall: '#d8cdb3', wall2: '#a99c7f', wainscot: 700, floor: '#8a8072', items: c => {
    // station roof arches
    c.strokeStyle = 'rgba(60,50,40,.35)'; c.lineWidth = 10; for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(240 + i * 480, 600, 300, Math.PI, 0); c.stroke(); }
  } });
  const bx = 360, by = 170, bw = 1200, bh = 520, at = o.at ?? 1.2;
  rr(ctx, bx - 24, by - 24, bw + 48, bh + 48, 12); fillStroke(ctx, '#23272c', INK, 6);
  if (L > at) return ransomScreen(ctx, t, L - at, { rect: [bx, by, bw, bh] });
  ctx.fillStyle = '#10141b'; ctx.fillRect(bx, by, bw, bh);
  T(ctx, o.title || 'ABFAHRT', bx + 40, by + 50, '44px "Lilita One"', '#ffd84a', 'left');
  (o.rows || [['10:42', 'BERLIN HBF', '7'], ['10:48', 'HAMBURG', '12'], ['10:55', 'MÜNCHEN', '3'], ['11:03', 'KÖLN', '9'], ['11:10', 'FRANKFURT', '5']]).forEach((r, i) => {
    const y = by + 130 + i * 80, flip = L > at - 0.5 ? Math.floor(t * 20 + i) % 3 : -1;
    [[r[0], 40, 220], [r[1], 300, 640], [r[2], 1000, 120]].forEach(([s, dx, w]) => { for (let j = 0; j < s.length; j++) { const cx = bx + dx + j * 38; rr(ctx, cx, y - 30, 34, 60, 3); ctx.fillStyle = '#1f2630'; ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(cx, y - 1, 34, 2);
      T(ctx, flip >= 0 && hash(j + i * 7 + flip) > 0.5 ? String.fromCharCode(65 + Math.floor(hash(j * 3 + flip + i) * 26)) : s[j], cx + 17, y, '40px "Lilita One"', '#f6f1e0'); } }); });
}

// ---------- phone-company office: rows of desks, lights cut one bank at a time; o.at ----------
export function phoneOffice(ctx, t, L, o = {}) {
  const at = o.at ?? 0.8;
  room(ctx, t, { wall: '#e4e1da', wall2: '#bfb9ad', wainscot: 620, floor: '#4f5a6b', tiles: true, items: c => {
    rr(c, 660, 90, 600, 120, 10); fillStroke(c, '#1d5fa8', INK, 5); T(c, o.name || 'TELECOM HQ', 960, 150, '60px "Lilita One"', '#fff');
    for (let i = 0; i < 5; i++) { rr(c, 80 + i * 370, 260, 300, 200, 4); fillStroke(c, '#a9d4ea', INK, 3); }
  } });
  for (let row = 0; row < 2; row++) for (let i = 0; i < 6; i++) { const x = 180 + i * 315, y = FLOOR - 40 - row * 160, s = 1 - row * 0.15, dead = L > at + (i + row * 6) * 0.08;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); rr(ctx, -130, -100, 260, 22, 4); fillStroke(ctx, '#d0b892', INK, 3);
    rr(ctx, -10, -128, 20, 28, 2); fillStroke(ctx, '#4a515c', INK, 2); rr(ctx, -70, -230, 140, 104, 6); fillStroke(ctx, '#2b3038', INK, 3); ctx.fillStyle = dead ? '#a8231c' : '#7cc6ea'; ctx.fillRect(-60, -220, 120, 84);
    if (dead) padlock(ctx, 0, -175, 0.42); ctx.restore(); }
  const dark = clamp((L - at - 0.6) / 0.6) * 0.45; if (dark > 0) { ctx.fillStyle = `rgba(10,14,30,${dark})`; ctx.fillRect(-400, -400, W + 800, H + 800); }
}

// ---------- seaside bedroom in Devon: bed, posters, desk with monitors; window onto the sea ----------
export function seaBedroom(ctx, t, o = {}) {
  room(ctx, t, { wall: '#9fc0cf', wall2: '#7d9fae', wainscot: 820, floor: '#7a5a42', items: c => {
    windowFrame(c, 120, 150, 520, 360, t, {});
    c.save(); c.beginPath(); c.rect(126, 156, 508, 348); c.clip(); const g = c.createLinearGradient(0, 156, 0, 504); g.addColorStop(0, '#9fd3f0'); g.addColorStop(1, '#e8f4f6'); c.fillStyle = g; c.fillRect(126, 156, 508, 348);
    c.fillStyle = '#3a86b8'; c.fillRect(126, 380, 508, 130); c.fillStyle = 'rgba(255,255,255,.5)'; for (let i = 0; i < 8; i++) c.fillRect(140 + ((i * 90 + t * 20) % 520), 400 + (i % 3) * 30, 50, 4);
    c.fillStyle = '#5c8f4e'; c.beginPath(); c.moveTo(126, 380); c.quadraticCurveTo(300, 300, 470, 380); c.closePath(); c.fill(); c.fillStyle = '#efe7d6'; for (let i = 0; i < 6; i++) c.fillRect(170 + i * 45, 345 + (i % 2) * 10, 30, 26); c.restore();
    c.strokeStyle = INK; c.lineWidth = 6; c.strokeRect(120, 150, 520, 360);
    // posters
    [[760, 170, '#f3c34a'], [1000, 200, '#d9483b']].forEach(([x, y, col], i) => { c.save(); c.translate(x, y); c.rotate((i ? 0.04 : -0.03)); rr(c, 0, 0, 200, 270, 4); fillStroke(c, col, INK, 3); c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.arc(100, 120, 60, 0, 7); c.fill(); c.restore(); });
    bookshelf(c, 1240, 180, 260, 300, 7);
  } });
  // bed (left) and desk with two monitors (right)
  rr(ctx, -40, FLOOR - 170, 560, 120, 12); fillStroke(ctx, '#e7e1d2', INK, 4); rr(ctx, -40, FLOOR - 200, 560, 50, 14); fillStroke(ctx, '#3f6fa3', INK, 4); rr(ctx, -40, FLOOR - 270, 40, 270, 6); fillStroke(ctx, '#8a6446', INK, 4);
  rr(ctx, 1180, FLOOR - 200, 640, 24, 4); fillStroke(ctx, '#d9c3a0', INK, 4); rr(ctx, 1200, FLOOR - 176, 22, 176, 3); fillStroke(ctx, '#a68a63', INK, 3); rr(ctx, 1776, FLOOR - 176, 22, 176, 3); fillStroke(ctx, '#a68a63', INK, 3);
  [[1300, '#0f1a2a'], [1560, '#0f1a2a']].forEach(([x, c], i) => { rr(ctx, x - 110, FLOOR - 420, 220, 150, 8); fillStroke(ctx, '#2b3038', INK, 4); ctx.fillStyle = c; ctx.fillRect(x - 98, FLOOR - 408, 196, 126);
    ctx.fillStyle = i ? '#ff6a50' : '#7fe0a0'; for (let r = 0; r < 6; r++) ctx.fillRect(x - 88, FLOOR - 398 + r * 19, 40 + hash(r + i * 9 + Math.floor(t * 3)) * 130, 7);
    rr(ctx, x - 14, FLOOR - 272, 28, 72, 3); fillStroke(ctx, '#4a515c', INK, 3); glowSpot(ctx, x, FLOOR - 340, 200, i ? 'rgba(255,90,60,.2)' : 'rgba(110,230,170,.2)'); });
  if (o.dark) { ctx.fillStyle = `rgba(14,20,38,${o.dark})`; ctx.fillRect(-400, -400, W + 800, H + 800); }
}

// ---------- web domain shop: search box, AVAILABLE $10.69, BUY click, REGISTERED stamp ----------
export function domainShop(ctx, t, L, o = {}) {
  ctx.fillStyle = '#2a3140'; ctx.fillRect(-400, -400, W + 800, H + 800);
  rr(ctx, 160, 110, 1600, 860, 18); fillStroke(ctx, '#f4f6f8', INK, 6); rr(ctx, 160, 110, 1600, 70, 18); fillStroke(ctx, '#d7dde4', INK, 4);
  [200, 240, 280].forEach((x, i) => { ctx.beginPath(); ctx.arc(x, 145, 12, 0, 7); fillStroke(ctx, ['#ef6a5a', '#f3c34a', '#6cc070'][i], INK, 2); });
  T(ctx, 'BUY A DOMAIN', 960, 250, '72px "Lilita One"', '#1d4e89');
  const dom = o.domain || 'iuqerfsodp9ifjaposdfjhgosurijfaewrwergwea.com', n = Math.floor(clamp(L / (o.type || 1.4)) * dom.length);
  rr(ctx, 260, 330, 1400, 110, 14); fillStroke(ctx, '#fff', INK, 4); T(ctx, dom.slice(0, n) + (Math.floor(t * 3) % 2 ? '|' : ''), 290, 386, '40px "Nunito"', INK, 'left');
  const k = clamp((L - (o.type || 1.4) - 0.2) / 0.3); if (k <= 0) return;
  ctx.save(); ctx.globalAlpha = k;
  rr(ctx, 360, 500, 1200, 150, 14); fillStroke(ctx, '#e6f6e6', INK, 4); T(ctx, '✓  AVAILABLE', 420, 575, '64px "Lilita One"', '#2f8a4a', 'left'); T(ctx, '$10.69', 1500, 575, '84px "Lilita One"', INK, 'right');
  const click = (o.type || 1.4) + (o.clickAfter ?? 1.2), down = L > click && L < click + 0.15;
  rr(ctx, 760, 700, 400, 120, 16); fillStroke(ctx, down ? '#1f8f4a' : '#2fb35e', INK, 5); T(ctx, 'BUY', 960, 762, '72px "Lilita One"', '#fff');
  if (L > click - 0.6) { const m = clamp((L - click + 0.6) / 0.5); const px = lerp(1300, 990, ease(m)), py = lerp(940, 780, ease(m)); ctx.save(); ctx.translate(px, py); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 52); ctx.lineTo(14, 40); ctx.lineTo(24, 62); ctx.lineTo(34, 57); ctx.lineTo(24, 36); ctx.lineTo(42, 36); ctx.closePath(); fillStroke(ctx, '#fff', INK, 3); ctx.restore(); }
  ctx.restore();
  const st = clamp((L - click - 0.3) / 0.25); if (st > 0) { ctx.save(); ctx.translate(1380, 860); ctx.rotate(-0.12); ctx.scale(2 - st, 2 - st); ctx.globalAlpha = st; rr(ctx, -260, -70, 520, 140, 12); ctx.strokeStyle = '#c7342a'; ctx.lineWidth = 12; ctx.stroke(); T(ctx, 'REGISTERED', 0, 4, '84px "Lilita One"', '#c7342a'); ctx.restore(); }
}

// ---------- kill switch diagram: worm asks "does the website exist?" -> NO: lock files / YES: stop ----------
export function killSwitch(ctx, t, L, o = {}) {
  ctx.fillStyle = '#efe6d2'; ctx.fillRect(-400, -400, W + 800, H + 800);
  ctx.strokeStyle = 'rgba(80,120,160,.18)'; ctx.lineWidth = 2; for (let x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); } for (let y = 0; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  const yes = o.yes ? L > o.yes : false;
  // worm
  ctx.save(); ctx.translate(300, 520); const wig = Math.sin(t * 6) * 8; for (let i = 5; i >= 0; i--) { ctx.beginPath(); ctx.arc(i * -44, Math.sin(t * 6 + i) * 10, 38 - i * 3, 0, 7); fillStroke(ctx, '#c7342a', INK, 4); }
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(12, -10 + wig * 0.2, 10, 0, 7); ctx.fill(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(15, -10 + wig * 0.2, 5, 0, 7); ctx.fill(); ctx.restore();
  textOutlined(ctx, 'WANNA CRY', 200, 400, { size: 44, fill: '#fff', lw: 8 });
  // question diamond
  const q = clamp((L - 0.3) / 0.4); if (q > 0) { ctx.save(); ctx.globalAlpha = q; ctx.translate(820, 520); ctx.rotate(Math.PI / 4); rr(ctx, -150, -150, 300, 300, 16); fillStroke(ctx, YEL, INK, 5); ctx.restore(); T(ctx, 'DOES THE', 820, 485, '40px "Lilita One"'); T(ctx, 'WEBSITE', 820, 530, '40px "Lilita One"'); T(ctx, 'EXIST?', 820, 575, '40px "Lilita One"');
    ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(430, 520); ctx.lineTo(600, 520); ctx.stroke(); }
  // branches
  const br = (y, label, col, text, act) => { ctx.save(); ctx.globalAlpha = q * (act ? 1 : 0.35); ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(1030, 520); ctx.lineTo(1150, y); ctx.lineTo(1260, y); ctx.stroke(); T(ctx, label, 1130, y - 40, '44px "Lilita One"', col);
    rr(ctx, 1260, y - 80, 520, 160, 14); fillStroke(ctx, col, INK, 5); T(ctx, text, 1520, y, '54px "Lilita One"', '#fff'); if (act) glowSpot(ctx, 1520, y, 300, col === '#2f8a4a' ? 'rgba(90,220,120,.35)' : 'rgba(255,60,40,.35)'); ctx.restore(); };
  br(300, 'NO', '#c7342a', 'LOCK THE FILES', !yes); br(740, 'YES', '#2f8a4a', 'SHUT DOWN', yes);
}

// ---------- spy agency HQ: a huge black-glass block behind a fence, flag, satellite dishes ----------
export function spyHQ(ctx, t, o = {}) {
  sky(ctx, o.night ? '#0e1a33' : '#6f9fc8', o.night ? '#33476e' : '#dbe6ec'); glowSpot(ctx, 1500, 100, 400, o.night ? 'rgba(180,200,255,.15)' : 'rgba(255,240,200,.45)');
  ctx.fillStyle = '#4c6b45'; ctx.fillRect(-400, 760, W + 800, 200);
  rr(ctx, 420, 220, 1080, 560, 6); fillStroke(ctx, '#1d232c', INK, 6);
  for (let r = 0; r < 9; r++) for (let q = 0; q < 16; q++) { const lit = o.night && hash(r * 31 + q) > 0.75; ctx.fillStyle = lit ? 'rgba(255,220,140,.7)' : `rgba(120,160,200,${0.18 + hash(r * 7 + q) * 0.12})`; ctx.fillRect(440 + q * 66, 240 + r * 58, 56, 46); }
  [[300, 640], [1600, 600]].forEach(([x, y]) => { ctx.save(); ctx.translate(x, y); ctx.rotate(-0.5); ctx.beginPath(); ctx.ellipse(0, 0, 70, 30, 0, 0, Math.PI); fillStroke(ctx, '#e8ecef', INK, 4); ctx.restore(); rr(ctx, x - 8, y, 16, 120, 3); fillStroke(ctx, '#9aa3ad', INK, 3); });
  ground(ctx, '#6c7a5e', 900);
  // fence
  ctx.strokeStyle = 'rgba(40,40,40,.8)'; ctx.lineWidth = 3; for (let x = -400; x < W + 400; x += 40) { ctx.beginPath(); ctx.moveTo(x, 780); ctx.lineTo(x + 30, 900); ctx.moveTo(x + 30, 780); ctx.lineTo(x, 900); ctx.stroke(); }
  for (let x = -400; x < W + 400; x += 240) { rr(ctx, x, 760, 14, 150, 2); fillStroke(ctx, '#6b6f75', INK, 2); }
  ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-400, 780); ctx.lineTo(W + 400, 780); ctx.stroke();
  if (o.label) { rr(ctx, 760, 830, 400, 80, 8); fillStroke(ctx, '#2a2f3a', INK, 4); T(ctx, o.label, 960, 872, '46px "Lilita One"', '#f3c34a'); }
}

// ---------- the cyber-weapons locker: tools on hooks with labels; o.glow names the hero tool, o.take = local time it is lifted away ----------
export function weaponsLocker(ctx, t, L, o = {}) {
  ctx.fillStyle = '#1b2230'; ctx.fillRect(-400, -400, W + 800, H + 800);
  rr(ctx, 260, 120, 1400, 820, 14); fillStroke(ctx, '#3a4350', INK, 6); rr(ctx, 290, 150, 1340, 760, 8); fillStroke(ctx, '#2a313c', INK, 3);
  for (let i = 0; i < 40; i++) { ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.beginPath(); ctx.arc(330 + (i % 10) * 140, 190 + Math.floor(i / 10) * 200, 6, 0, 7); ctx.fill(); }
  const names = o.names || ['ETERNAL ROMANCE', 'ETERNAL SYNERGY', 'ETERNAL BLUE', 'EMERALD THREAD', 'ERRATIC GOPHER', 'EDUCATED SCHOLAR'];
  names.forEach((n, i) => { const x = 470 + (i % 3) * 490, y = 330 + Math.floor(i / 3) * 360, hero = n === o.glow; let dy = 0, a = 1;
    if (hero && o.take != null) { const k = clamp((L - o.take) / 0.8); dy = -ease(k) * 700; a = 1 - k * 0.6; if (k >= 1) return; }
    ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y + dy);
    if (hero) glowSpot(ctx, 0, 40, 260, 'rgba(80,170,255,.55)');
    rr(ctx, -150, 0, 300, 110, 12); fillStroke(ctx, hero ? '#2f7fd8' : '#7d8794', INK, 5); rr(ctx, -110, -50, 220, 60, 10); fillStroke(ctx, shade(hero ? '#2f7fd8' : '#7d8794', 0.75), INK, 4);
    ctx.strokeStyle = hero ? '#bfe3ff' : '#c7cdd4'; ctx.lineWidth = 4; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(-110, 30 + k * 26); ctx.lineTo(110, 30 + k * 26); ctx.stroke(); }
    rr(ctx, -150, 140, 300, 56, 6); fillStroke(ctx, PAPER, INK, 3); T(ctx, n, 0, 169, `${n.length > 13 ? 30 : 34}px "Lilita One"`, hero ? '#1d4e89' : INK); ctx.restore(); });
  if (o.label) textOutlined(ctx, o.label, 960, 80, { size: 60, fill: YEL, lw: 10 });
}

// ---------- auction card: lot, price, bids counter stuck near zero ----------
export function auctionCard(ctx, t, L, o = {}) {
  ctx.fillStyle = '#2b2622'; ctx.fillRect(-400, -400, W + 800, H + 800);
  ctx.save(); ctx.translate(960, 540); ctx.rotate(-0.02); rr(ctx, -620, -380, 1240, 760, 14); fillStroke(ctx, PAPER, INK, 6);
  T(ctx, 'AUCTION', 0, -300, '96px "Lilita One"', '#1d4e89'); T(ctx, 'SPY AGENCY HACKING TOOLS', 0, -200, '52px "Lilita One"');
  rr(ctx, -500, -130, 1000, 160, 12); fillStroke(ctx, '#fff', INK, 4); T(ctx, 'ASKING PRICE', -460, -50, '900 36px "Nunito"', '#6b625a', 'left'); T(ctx, o.price || '1,000,000 BITCOIN', 460, -50, '58px "Lilita One"', '#c7342a', 'right');
  rr(ctx, -500, 70, 1000, 160, 12); fillStroke(ctx, '#fff', INK, 4); T(ctx, 'BIDS SO FAR', -460, 150, '900 36px "Nunito"', '#6b625a', 'left');
  const n = L > 0.9 ? Math.min(o.bids ?? 3, Math.floor((L - 0.9) * 3)) : 0; T(ctx, String(n), 460, 150, '84px "Lilita One"', INK, 'right');
  ctx.restore();
  const k = clamp((L - (o.flop ?? 2)) / 0.3); if (k > 0) { ctx.save(); ctx.translate(1340, 900); ctx.rotate(-0.12); ctx.scale(2 - k, 2 - k); ctx.globalAlpha = k; rr(ctx, -220, -60, 440, 120, 10); ctx.strokeStyle = '#c7342a'; ctx.lineWidth = 10; ctx.stroke(); T(ctx, o.stamp || 'NO SALE', 0, 4, '72px "Lilita One"', '#c7342a'); ctx.restore(); }
}

// ---------- system update popup (generic, our own UI): title, text, two buttons; o.click: 'later'|'now' at o.clickAt ----------
export function updatePopup(ctx, t, L, o = {}) {
  if (!o.noBg) { const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#2f6fb3'); g.addColorStop(1, '#173b66'); ctx.fillStyle = g; ctx.fillRect(-400, -400, W + 800, H + 800);
    for (let i = 0; i < 6; i++) { rr(ctx, 80, 80 + i * 150, 110, 110, 14); ctx.fillStyle = 'rgba(255,255,255,.15)'; ctx.fill(); } }
  const k = easeOut(clamp(L / 0.35)); ctx.save(); ctx.translate(960, 540 + (1 - k) * 80); ctx.globalAlpha = k;
  ctx.fillStyle = 'rgba(0,0,0,.35)'; rr(ctx, -560 + 12, -300 + 16, 1120, 600, 16); ctx.fill();
  rr(ctx, -560, -300, 1120, 600, 16); fillStroke(ctx, '#f4f6f8', INK, 5); rr(ctx, -560, -300, 1120, 90, 16); fillStroke(ctx, '#dfe5ec', INK, 4);
  T(ctx, o.title || 'SECURITY UPDATE', -500, -255, '48px "Lilita One"', '#1d4e89', 'left');
  ctx.save(); ctx.translate(-380, 20); ctx.beginPath(); ctx.moveTo(0, -120); ctx.lineTo(110, -80); ctx.lineTo(100, 40); ctx.quadraticCurveTo(60, 110, 0, 140); ctx.quadraticCurveTo(-60, 110, -100, 40); ctx.lineTo(-110, -80); ctx.closePath(); fillStroke(ctx, '#2fb35e', INK, 5);
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(-44, 10); ctx.lineTo(-8, 46); ctx.lineTo(56, -30); ctx.stroke(); ctx.restore();
  (o.lines || ['A critical security fix', 'is ready to install.']).forEach((s, i) => T(ctx, s, -200, -100 + i * 64, '900 46px "Nunito"', INK, 'left'));
  const btn = (x, label, main, pressed) => { rr(ctx, x, 150, 380, 100, 14); fillStroke(ctx, pressed ? shade(main ? '#2f6fb3' : '#d7dde4', 0.8) : main ? '#2f6fb3' : '#d7dde4', INK, 4); T(ctx, label, x + 190, 200, '40px "Lilita One"', main ? '#fff' : INK); };
  const pr = o.clickAt != null && L > o.clickAt && L < o.clickAt + 0.2;
  btn(-480, o.later || 'REMIND ME LATER', false, pr && o.click === 'later'); btn(80, o.now || 'INSTALL NOW', true, pr && o.click === 'now');
  if (o.clickAt != null) { const m = clamp((L - o.clickAt + 0.7) / 0.6), tx = o.click === 'later' ? -290 : 270; ctx.save(); ctx.translate(lerp(500, tx, ease(m)), lerp(420, 210, ease(m))); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 52); ctx.lineTo(14, 40); ctx.lineTo(24, 62); ctx.lineTo(34, 57); ctx.lineTo(24, 36); ctx.lineTo(42, 36); ctx.closePath(); fillStroke(ctx, '#fff', INK, 3); ctx.restore(); }
  ctx.restore();
}

// ---------- DDoS: hundreds of hijacked cameras and routers firing packets at one website ----------
function camIcon(ctx, x, y, s) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); rr(ctx, -30, -16, 52, 32, 6); fillStroke(ctx, '#e8ecef', INK, 3); ctx.beginPath(); ctx.arc(22, 0, 12, 0, 7); fillStroke(ctx, '#2b3038', INK, 3); ctx.fillStyle = '#d9483b'; ctx.beginPath(); ctx.arc(-18, -6, 4, 0, 7); ctx.fill(); rr(ctx, -6, 16, 8, 18, 2); fillStroke(ctx, '#9aa3ad', INK, 2); ctx.restore(); }
function routerIcon(ctx, x, y, s) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); rr(ctx, -34, -12, 68, 26, 6); fillStroke(ctx, '#3a4350', INK, 3); ctx.strokeStyle = INK; ctx.lineWidth = 4; [-20, 20].forEach(a => { ctx.beginPath(); ctx.moveTo(a, -12); ctx.lineTo(a * 1.2, -40); ctx.stroke(); }); ctx.fillStyle = '#7fe0a0'; for (let i = 0; i < 4; i++) ctx.fillRect(-24 + i * 12, -2, 6, 6); ctx.restore(); }
export function ddosSwarm(ctx, t, L, o = {}) {
  ctx.fillStyle = '#16202e'; ctx.fillRect(-400, -400, W + 800, H + 800);
  const sx = 1500, sy = 540, hit = clamp((L - 0.6) / 2);
  // the website (server + page)
  const sh = hit > 0 ? Math.sin(t * 40) * 6 * hit : 0;
  ctx.save(); ctx.translate(sx + sh, sy); glowSpot(ctx, 0, 0, 360, `rgba(255,80,60,${0.15 + 0.35 * hit})`);
  rr(ctx, -180, -220, 360, 440, 14); fillStroke(ctx, '#cfd6de', INK, 5); for (let i = 0; i < 5; i++) { rr(ctx, -150, -190 + i * 80, 300, 60, 6); fillStroke(ctx, '#3a4350', INK, 3); ctx.fillStyle = hit > 0.3 && hash(i + Math.floor(t * 8)) > 0.4 ? '#ff6a50' : '#7fe0a0'; ctx.beginPath(); ctx.arc(110, -160 + i * 80, 9, 0, 7); ctx.fill(); }
  ctx.restore(); textOutlined(ctx, o.label || 'KILL SWITCH WEBSITE', sx, sy - 290, { size: 46, fill: '#fff', lw: 8 });
  // devices
  const N = 70; for (let i = 0; i < N; i++) { const a = hash(i * 1.3), b = hash(i * 7.7); const x = 80 + a * 900, y = 90 + b * 900, s = 0.7 + hash(i * 3.1) * 0.6, on = L > 0.2 + hash(i * 5.3) * 1.2;
    if (on) { ctx.strokeStyle = `rgba(255,${120 + Math.floor(hash(i) * 80)},80,.35)`; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(sx - 180, sy + (b - 0.5) * 300); ctx.stroke();
      const p = (t * (1.2 + hash(i * 9) * 0.8) + hash(i * 2)) % 1; ctx.fillStyle = '#ffb04a'; ctx.beginPath(); ctx.arc(lerp(x, sx - 180, p), lerp(y, sy + (b - 0.5) * 300, p), 6, 0, 7); ctx.fill(); }
    (i % 3 === 0 ? routerIcon : camIcon)(ctx, x, y, s * (on ? 1 : 0.9)); }
}

// ---------- airport departure gate at night: window onto a plane, seats, a gate sign ----------
export function airportGate(ctx, t, o = {}) {
  room(ctx, t, { wall: '#3a4558', wall2: '#2c3546', wainscot: 860, floor: '#6b6f78', tiles: true, items: c => {
    c.save(); c.beginPath(); c.rect(80, 120, 1760, 600); c.clip(); const g = c.createLinearGradient(0, 120, 0, 720); g.addColorStop(0, '#0f1a33'); g.addColorStop(1, '#3a3f66'); c.fillStyle = g; c.fillRect(80, 120, 1760, 600);
    c.fillStyle = '#1e2433'; c.fillRect(80, 620, 1760, 100); for (let i = 0; i < 20; i++) { c.fillStyle = i % 2 ? '#ffd27a' : '#7fc6ff'; c.beginPath(); c.arc(100 + i * 92, 640, 4, 0, 7); c.fill(); }
    // airliner
    c.save(); c.translate(1100, 560); rr(c, -600, -70, 1100, 140, 70); fillStroke(c, '#e9edf2', INK, 5); c.beginPath(); c.moveTo(-500, -60); c.lineTo(-580, -230); c.lineTo(-470, -230); c.lineTo(-380, -60); c.closePath(); fillStroke(c, '#c7342a', INK, 4);
    for (let i = 0; i < 16; i++) { c.fillStyle = '#7fb6e6'; c.beginPath(); c.arc(-420 + i * 50, -20, 10, 0, 7); c.fill(); } c.restore(); c.restore();
    c.strokeStyle = INK; c.lineWidth = 8; c.strokeRect(80, 120, 1760, 600); for (let x = 80; x < 1840; x += 440) { c.beginPath(); c.moveTo(x, 120); c.lineTo(x, 720); c.stroke(); }
    rr(c, 120, 40, 420, 70, 8); fillStroke(c, '#1d2430', INK, 4); T(c, o.gate || 'GATE 14 · LONDON', 330, 76, '38px "Lilita One"', '#ffd84a');
  } });
  for (let i = 0; i < 5; i++) { const x = 980 + i * 170; rr(ctx, x - 70, FLOOR - 120, 140, 70, 10); fillStroke(ctx, '#2f5f9a', INK, 4); rr(ctx, x - 70, FLOOR - 200, 140, 90, 10); fillStroke(ctx, '#3a6fae', INK, 4); rr(ctx, x - 8, FLOOR - 50, 16, 50, 3); fillStroke(ctx, '#6b6f75', INK, 3); }
}

// ---------- accounting-software update window with a hidden bug riding along ----------
export function softwareUpdate(ctx, t, L, o = {}) {
  ctx.fillStyle = '#2a3140'; ctx.fillRect(-400, -400, W + 800, H + 800);
  rr(ctx, 260, 160, 1400, 760, 18); fillStroke(ctx, '#f4f6f8', INK, 6); rr(ctx, 260, 160, 1400, 90, 18); fillStroke(ctx, '#e7b23a', INK, 4);
  T(ctx, o.title || 'M.E.DOC  ·  UPDATE', 310, 205, '50px "Lilita One"', INK, 'left');
  // ledger icon
  ctx.save(); ctx.translate(520, 520); rr(ctx, -160, -200, 320, 400, 12); fillStroke(ctx, '#fff', INK, 5); ctx.fillStyle = '#e7b23a'; ctx.fillRect(-160, -200, 320, 70); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.strokeRect(-160, -200, 320, 70);
  for (let r = 0; r < 7; r++) { ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.moveTo(-130, -100 + r * 42); ctx.lineTo(130, -100 + r * 42); ctx.stroke(); T(ctx, ['₴', '1', '7', '4', '2', '9', '3'][r], 100, -120 + r * 42, '28px "Nunito"', '#556'); } ctx.restore();
  T(ctx, o.text || 'A new version is ready', 800, 400, '900 54px "Nunito"', INK, 'left');
  const p = clamp(L / (o.dur || 3)); rr(ctx, 800, 480, 760, 70, 35); fillStroke(ctx, '#dfe5ec', INK, 4); rr(ctx, 806, 486, Math.max(60, 748 * p), 58, 29); ctx.fillStyle = '#2fb35e'; ctx.fill();
  T(ctx, Math.round(p * 100) + '%', 1180, 517, '40px "Lilita One"', INK);
  // the hidden passenger: a red worm in the download stream
  if (o.bug && L > (o.bug ?? 0)) { const k = clamp((L - o.bug) / 0.5); ctx.save(); ctx.translate(800 + 748 * p - 40, 515); ctx.scale(k, k); for (let i = 3; i >= 0; i--) { ctx.beginPath(); ctx.arc(-i * 26, Math.sin(t * 8 + i) * 6, 22 - i * 2, 0, 7); fillStroke(ctx, '#c7342a', INK, 3); } ctx.restore();
    if (L > o.bug + 0.6) { ctx.save(); ctx.globalAlpha = clamp((L - o.bug - 0.6) / 0.3); textOutlined(ctx, 'HIDDEN INSIDE', 1180, 660, { size: 64, fill: '#ff6a50', lw: 10 }); ctx.restore(); } }
}

// ---------- Chernobyl: the giant arch over the old reactor, a worker with a clipboard and handheld meter ----------
export function chernobyl(ctx, t, o = {}) {
  sky(ctx, '#8fa9b8', '#e3e0d2'); ctx.fillStyle = '#6f7d5a'; ctx.fillRect(-400, 700, W + 800, 300);
  // the arch (New Safe Confinement)
  ctx.save(); ctx.translate(1100, 760); ctx.beginPath(); ctx.moveTo(-620, 0); ctx.bezierCurveTo(-600, -560, 600, -560, 620, 0); ctx.closePath(); fillStroke(ctx, '#cfd6de', INK, 6);
  ctx.strokeStyle = 'rgba(60,70,80,.45)'; ctx.lineWidth = 4; for (let i = 1; i < 10; i++) { const x = -620 + i * 124; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x * 0.92, -420 + Math.abs(x) * 0.25); ctx.stroke(); } ctx.restore();
  rr(ctx, 1640, 420, 60, 340, 4); fillStroke(ctx, '#b8584a', INK, 4); for (let i = 0; i < 5; i++) { ctx.fillStyle = i % 2 ? '#e9e2d0' : '#b8584a'; ctx.fillRect(1642, 430 + i * 60, 56, 30); }
  ground(ctx, '#8a8670');
  if (o.sign) { rr(ctx, 160, 520, 520, 150, 8); fillStroke(ctx, YEL, INK, 5); ctx.save(); ctx.translate(250, 595); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(0, 0, 16, 0, 7); ctx.fill(); for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 56, i * 2.094 - 0.5, i * 2.094 + 0.5); ctx.closePath(); ctx.fill(); } ctx.restore(); T(ctx, 'RADIATION', 470, 570, '48px "Lilita One"'); T(ctx, 'CHECKS: BY HAND', 470, 625, '900 32px "Nunito"'); rr(ctx, 400, 670, 18, 80, 3); fillStroke(ctx, '#6b6f75', INK, 3); }
}

// ---------- container port: cranes, colourful stacks, a ship; o.stopped -> cranes still, lorries queue, red lights ----------
export function containerPort(ctx, t, L, o = {}) {
  sky(ctx, '#7fb6dd', '#f3e2bd', 640); glowSpot(ctx, 300, 120, 400, 'rgba(255,240,200,.5)');
  ctx.fillStyle = '#2f6f9f'; ctx.fillRect(-400, 560, W + 800, 120);
  // ship
  ctx.save(); ctx.translate(1240, 600); ctx.beginPath(); ctx.moveTo(-620, -40); ctx.lineTo(620, -40); ctx.lineTo(560, 60); ctx.lineTo(-580, 60); ctx.closePath(); fillStroke(ctx, '#2a4a7a', INK, 5); ctx.fillStyle = '#b33a2c'; ctx.fillRect(-590, 30, 1160, 30);
  const cols = ['#5aa6d6', '#d9483b', '#f3c34a', '#4f9a5f', '#e07a3a', '#7a5ab3']; for (let r = 0; r < 3; r++) for (let q = 0; q < 14; q++) { rr(ctx, -560 + q * 80, -100 - r * 56, 76, 54, 3); fillStroke(ctx, cols[Math.floor(hash(r * 17 + q) * 6)], INK, 2.5); }
  rr(ctx, 450, -280, 120, 240, 6); fillStroke(ctx, '#eef1f4', INK, 4); ctx.restore();
  // cranes
  [[500, 0.2], [1000, 1.4]].forEach(([x, ph]) => { const sw = o.stopped ? 0 : Math.sin(L * 0.8 + ph) * 120; ctx.save(); ctx.translate(x, 680);
    ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.fillStyle = '#3b6fb6'; [[-80, 0], [80, 0]].forEach(([lx]) => { rr(ctx, lx - 14, -520, 28, 520, 3); fillStroke(ctx, '#3b6fb6', INK, 4); });
    rr(ctx, -200, -560, 760, 40, 4); fillStroke(ctx, '#3b6fb6', INK, 4); ctx.beginPath(); ctx.moveTo(200 + sw, -520); ctx.lineTo(200 + sw, -300); ctx.stroke(); rr(ctx, 160 + sw, -300, 80, 56, 3); fillStroke(ctx, cols[(x / 500) | 0], INK, 3);
    if (o.stopped) { const on = Math.floor(t * 3) % 2; ctx.fillStyle = on ? '#ff4a3a' : '#7a1a14'; ctx.beginPath(); ctx.arc(0, -580, 14, 0, 7); ctx.fill(); if (on) glowSpot(ctx, 0, -580, 80, 'rgba(255,60,40,.6)'); }
    ctx.restore(); });
  // yard stacks
  ground(ctx, '#9a9486', 680); for (let s = 0; s < 6; s++) for (let r = 0; r < 3; r++) { rr(ctx, -200 + s * 330, 780 - r * 60, 300, 58, 3); fillStroke(ctx, cols[Math.floor(hash(s * 9 + r) * 6)], INK, 3); ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 2; for (let k = 1; k < 10; k++) { ctx.beginPath(); ctx.moveTo(-200 + s * 330 + k * 30, 782 - r * 60); ctx.lineTo(-200 + s * 330 + k * 30, 836 - r * 60); ctx.stroke(); } }
  // lorries
  const nq = o.stopped ? 6 : 2; for (let i = 0; i < nq; i++) { const x = (o.stopped ? 1700 - i * 290 : ((L * 160 + i * 900) % 2600) - 400); ctx.save(); ctx.translate(x, 990); rr(ctx, -130, -100, 70, 80, 8); fillStroke(ctx, ['#d9483b', '#2f6fb3', '#f3c34a'][i % 3], INK, 4); rr(ctx, -60, -120, 200, 100, 3); fillStroke(ctx, cols[(i + 2) % 6], INK, 4);
    [-100, 0, 100].forEach(wx => { ctx.beginPath(); ctx.arc(wx, -18, 20, 0, 7); fillStroke(ctx, '#2a2a2e', INK, 3); }); ctx.restore(); }
  if (o.gate) { rr(ctx, 1500, 860, 360, 60, 6); fillStroke(ctx, '#c7342a', INK, 4); T(ctx, 'GATES CLOSED', 1680, 891, '36px "Lilita One"', '#fff'); }
}

// ---------- a small office at night; o.power 0 (blackout) .. 1, one server rack in the corner ----------
export function powerCutOffice(ctx, t, L, o = {}) {
  const on = o.power ?? 1;
  room(ctx, t, { wall: '#d9c7a4', wall2: '#b39f7a', wainscot: 640, floor: '#6b4a34', items: c => {
    windowFrame(c, 160, 150, 460, 320, t, {}); c.save(); c.beginPath(); c.rect(166, 156, 448, 308); c.clip(); c.fillStyle = '#0e1a33'; c.fillRect(166, 156, 448, 308); for (let i = 0; i < 14; i++) { c.fillStyle = on > 0.5 ? 'rgba(255,220,140,.8)' : 'rgba(80,90,120,.4)'; c.fillRect(190 + hash(i) * 400, 300 + hash(i * 3) * 140, 10, 14); } c.restore(); c.strokeStyle = INK; c.lineWidth = 6; c.strokeRect(160, 150, 460, 320);
    rr(c, 760, 120, 420, 90, 8); fillStroke(c, '#2a4a7a', INK, 4); T(c, o.sign || 'WEST AFRICA OFFICE', 970, 166, '38px "Lilita One"', '#fff');
    plant(c, 700, FLOOR, 1);
  } });
  serverRack(ctx, 1480, FLOOR, 240, 520, on > 0.5 ? t : 0, 3);
  if (on < 0.5) { ctx.fillStyle = 'rgba(8,10,20,.62)'; ctx.fillRect(-400, -400, W + 800, H + 800); }
  // ceiling light
  ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(960, -400); ctx.lineTo(960, 40); ctx.stroke(); ctx.beginPath(); ctx.moveTo(900, 80); ctx.quadraticCurveTo(960, 20, 1020, 80); ctx.closePath(); fillStroke(ctx, '#3b3f3a', INK, 3);
  if (on > 0.5) glowSpot(ctx, 960, 120, 520, 'rgba(255,236,180,.35)');
}

// ---------- airliner across a sky; p 0..1 ----------
export function airliner(ctx, x, y, s = 1, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s * (o.face || 1), s); ctx.rotate(o.tilt || -0.06);
  rr(ctx, -300, -40, 600, 80, 40); fillStroke(ctx, '#eef1f4', INK, 5); ctx.beginPath(); ctx.moveTo(300, -30); ctx.quadraticCurveTo(380, 0, 300, 36); ctx.closePath(); fillStroke(ctx, '#eef1f4', INK, 4);
  ctx.beginPath(); ctx.moveTo(-260, -30); ctx.lineTo(-310, -150); ctx.lineTo(-230, -150); ctx.lineTo(-170, -30); ctx.closePath(); fillStroke(ctx, o.tail || '#2f6fb3', INK, 4);
  ctx.beginPath(); ctx.moveTo(-40, 10); ctx.lineTo(-140, 140); ctx.lineTo(-60, 140); ctx.lineTo(80, 10); ctx.closePath(); fillStroke(ctx, '#d7dde4', INK, 4);
  for (let i = 0; i < 9; i++) { ctx.fillStyle = '#5a8fc6'; ctx.beginPath(); ctx.arc(-200 + i * 50, -8, 8, 0, 7); ctx.fill(); }
  ctx.restore();
}
