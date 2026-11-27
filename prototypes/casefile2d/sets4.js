// Case File sets, part 4: phishing email, network spread, a Manila branch, fake IDs, tanker, city clocks,
// casino, wanted poster, ransom screens, checklist (long-form 002 Bangladesh Bank).
import { W, H, INK, YEL, RED, clamp, lerp, ease, easeOut, hash, rr, fillStroke, shade, textOutlined } from './engine.js';
import { glowSpot } from './sets.js';
import { FLOOR } from './sets2.js';

const PAPER = '#f6efdd';
const T = (ctx, s, x, y, font, color = INK, align = 'center') => { ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillText(s, x, y); };
function deskBg(ctx, col = '#2f2a26') {
  ctx.fillStyle = col; ctx.fillRect(-400, -400, W + 800, H + 800);
  for (let i = 0; i < 22; i++) { ctx.strokeStyle = `rgba(0,0,0,${0.1 + hash(i) * 0.1})`; ctx.lineWidth = 2 + hash(i * 3) * 3; ctx.beginPath(); const y = -100 + i * 60 + hash(i) * 20; ctx.moveTo(-400, y); ctx.bezierCurveTo(600, y + 20, 1300, y - 20, W + 400, y + 10); ctx.stroke(); }
}
function cursor(ctx, x, y, down = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(1 - down * 0.15, 1 - down * 0.15); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 52); ctx.lineTo(14, 40); ctx.lineTo(24, 62); ctx.lineTo(34, 57); ctx.lineTo(24, 36); ctx.lineTo(42, 36); ctx.closePath(); fillStroke(ctx, '#fff', INK, 3.5); ctx.restore();
}
export function bug(ctx, x, y, s, t, col = '#c7342a') {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.strokeStyle = INK; ctx.lineWidth = 3;
  for (let i = -1; i <= 1; i++) { const w = Math.sin(t * 14 + i) * 4; ctx.beginPath(); ctx.moveTo(-6, i * 9); ctx.lineTo(-22, i * 12 + w); ctx.moveTo(6, i * 9); ctx.lineTo(22, i * 12 - w); ctx.stroke(); }
  ctx.beginPath(); ctx.ellipse(0, 0, 13, 18, 0, 0, 7); fillStroke(ctx, col, INK, 3); ctx.beginPath(); ctx.arc(0, -20, 8, 0, 7); fillStroke(ctx, shade(col, 0.7), INK, 3); ctx.restore();
}

// ---------- a job application email on a monitor; o.click = local time of the click ----------
export function emailWindow(ctx, t, L, o = {}) {
  deskBg(ctx, '#26303a'); glowSpot(ctx, W / 2, H / 2, 900, 'rgba(120,170,220,.18)');
  const x = 330, y = 120, w = 1260, h = 780;
  rr(ctx, x - 30, y - 30, w + 60, h + 60, 26); fillStroke(ctx, '#1d2228', INK, 5);
  rr(ctx, x, y, w, h, 6); fillStroke(ctx, '#f4f6f8', INK, 3);
  ctx.fillStyle = '#2b4f8a'; ctx.fillRect(x, y, w, 64); T(ctx, 'Inbox  ·  1 new message', x + 30, y + 33, '800 28px "Nunito"', '#fff', 'left');
  [['#e06a5a', 0], ['#e8c25a', 1], ['#6ab06a', 2]].forEach(([c, i]) => { ctx.beginPath(); ctx.arc(x + w - 110 + i * 34, y + 32, 10, 0, 7); fillStroke(ctx, c, INK, 2); });
  const row = (lab, val, yy) => { T(ctx, lab, x + 50, yy, '800 30px "Nunito"', '#6b7480', 'left'); T(ctx, val, x + 200, yy, '800 34px "Nunito"', INK, 'left'); };
  row('From:', o.from || 'Rasel Ahlam', y + 120); row('Subject:', o.subject || 'Job application', y + 175);
  ctx.fillStyle = '#dfe4ea'; ctx.fillRect(x + 40, y + 215, w - 80, 3);
  const body = o.body || ['Dear Sir,', 'I would love to work at your bank.', 'Please find my CV and cover letter attached.', 'Kind regards, Rasel'];
  body.forEach((ln, i) => { const n = Math.floor(clamp((L - 0.3 - i * 0.35) / 0.5) * ln.length); T(ctx, ln.slice(0, n), x + 50, y + 280 + i * 58, '600 34px "Nunito"', '#2b2f36', 'left'); });
  // attachment chip
  const ax = x + 50, ay = y + 560, clicked = o.click != null && L > o.click, inf = o.click != null ? clamp((L - o.click - 0.3) / 1.2) : 0;
  rr(ctx, ax, ay, 420, 110, 12); fillStroke(ctx, clicked ? '#fbe1dc' : '#eef2f6', INK, 3);
  rr(ctx, ax + 24, ay + 18, 60, 74, 6); fillStroke(ctx, '#2b5797', INK, 3); T(ctx, 'W', ax + 54, ay + 56, '40px "Lilita One"', '#fff');
  T(ctx, o.file || 'CV_Rasel.doc', ax + 110, ay + 42, '800 32px "Nunito"', INK, 'left'); T(ctx, 'Click to download', ax + 110, ay + 80, '600 24px "Nunito"', '#6b7480', 'left');
  if (inf > 0) { for (let i = 0; i < 9; i++) { const a = hash(i * 7) * Math.PI * 2, d = inf * (180 + hash(i) * 380); bug(ctx, ax + 210 + Math.cos(a) * d * 1.6, ay + 55 + Math.sin(a) * d * 0.7, 0.9, t + i); }
    glowSpot(ctx, ax + 210, ay + 55, 300 * inf, 'rgba(220,40,30,.22)'); }
  if (o.click != null) { const p = ease(clamp((L - (o.click - 1.2)) / 1.1)); cursor(ctx, lerp(x + w - 200, ax + 300, p), lerp(y + 300, ay + 60, p), clicked && L < o.click + 0.2 ? 1 : 0);
    if (clicked && L < o.click + 0.5) { const r = (L - o.click) * 200; ctx.strokeStyle = 'rgba(43,79,138,.8)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(ax + 300, ay + 60, r, 0, 7); ctx.stroke(); } }
}

// ---------- computers on a network turning red one by one, ending at the SWIFT terminal ----------
export function networkSpread(ctx, t, L, o = {}) {
  deskBg(ctx, '#1b2230'); const cols = 6, rows = 3, dur = o.dur || 6, path = [0, 1, 7, 8, 14, 15, 9, 10, 16, 17, 11];
  const pos = (i) => [330 + (i % cols) * 252, 330 + Math.floor(i / cols) * 230];
  ctx.strokeStyle = 'rgba(160,190,220,.35)'; ctx.lineWidth = 4;
  for (let i = 0; i < cols * rows; i++) { const [x, y] = pos(i); if (i % cols < cols - 1) { const [x2] = pos(i + 1); ctx.beginPath(); ctx.moveTo(x + 70, y); ctx.lineTo(x2 - 70, y); ctx.stroke(); } if (i + cols < cols * rows) { ctx.beginPath(); ctx.moveTo(x, y + 70); ctx.lineTo(x, y + 160); ctx.stroke(); } }
  const reached = clamp(L / dur) * (path.length - 1);
  for (let k = 0; k < path.length - 1; k++) { const p = clamp(reached - k); if (p <= 0) break; const [x0, y0] = pos(path[k]), [x1, y1] = pos(path[k + 1]); ctx.strokeStyle = RED; ctx.lineWidth = 8; ctx.setLineDash([18, 12]); ctx.lineDashOffset = -t * 40; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(lerp(x0, x1, p), lerp(y0, y1, p)); ctx.stroke(); ctx.setLineDash([]); }
  for (let i = 0; i < cols * rows; i++) { const [x, y] = pos(i), k = path.indexOf(i), on = k >= 0 && reached >= k - 0.02, swift = i === path[path.length - 1];
    if (swift) glowSpot(ctx, x, y, 220, on ? 'rgba(255,60,40,.4)' : 'rgba(255,210,90,.35)');
    rr(ctx, x - 70, y - 56, 140, 96, 8); fillStroke(ctx, swift ? '#e8c25a' : '#cfd6de', INK, 4); rr(ctx, x - 58, y - 46, 116, 74, 4); fillStroke(ctx, on ? '#5a1a18' : '#24344a', INK, 2.5);
    if (on) { ctx.fillStyle = '#ff6a50'; for (let r = 0; r < 4; r++) ctx.fillRect(x - 48, y - 36 + r * 16, 40 + hash(i * 9 + r) * 50, 7); } else { ctx.fillStyle = 'rgba(140,200,255,.5)'; for (let r = 0; r < 3; r++) ctx.fillRect(x - 48, y - 34 + r * 18, 30 + hash(i + r) * 60, 6); }
    rr(ctx, x - 14, y + 40, 28, 22, 3); fillStroke(ctx, '#9aa3ad', INK, 3); rr(ctx, x - 50, y + 60, 100, 14, 4); fillStroke(ctx, '#9aa3ad', INK, 3);
    if (swift) textOutlined(ctx, 'SWIFT', x, y - 100, { size: 46, fill: YEL, lw: 8 }); }
}

// ---------- a bank branch on a Manila street ----------
export function branchFront(ctx, t, o = {}) {
  const night = !!o.night, g = ctx.createLinearGradient(0, -300, 0, FLOOR); g.addColorStop(0, night ? '#0f1a30' : '#7fc0d8'); g.addColorStop(1, night ? '#2c3a58' : '#f6e1b0'); ctx.fillStyle = g; ctx.fillRect(-400, -400, W + 800, FLOOR + 400);
  if (!night) glowSpot(ctx, 300, 60, 340, 'rgba(255,240,200,.6)');
  // neighbours
  [[-300, 360, '#d98b6a'], [1480, 420, '#8fb39a']].forEach(([x, w, c], j) => { ctx.beginPath(); ctx.rect(x, FLOOR - 520 - j * 40, w, 520 + j * 40); fillStroke(ctx, night ? shade(c, 0.5) : c, INK, 4);
    for (let r = 0; r < 4; r++) for (let q = 0; q < 3; q++) { rr(ctx, x + 40 + q * (w - 80) / 3, FLOOR - 470 - j * 40 + r * 110, (w - 140) / 3, 70, 4); fillStroke(ctx, night ? (hash(r * 3 + q + j) < 0.4 ? '#f2c66a' : '#1c2638') : '#9fc4d6', INK, 2.5); } });
  // palms
  [[200, 1.0], [1640, 1.1]].forEach(([x, s], i) => { ctx.save(); ctx.translate(x, FLOOR + 4); ctx.scale(s, s); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-14, 0); ctx.quadraticCurveTo(-30, -200, 6, -380); ctx.lineTo(22, -380); ctx.quadraticCurveTo(-8, -200, 14, 0); ctx.closePath(); ctx.fillStyle = '#8a6a48'; ctx.fill(); ctx.stroke();
    for (let k = 0; k < 7; k++) { const a = -Math.PI / 2 + (k - 3) * 0.5 + Math.sin(t * 1.2 + k + i) * 0.04; ctx.beginPath(); ctx.moveTo(14, -380); ctx.quadraticCurveTo(14 + Math.cos(a - 0.4) * 140, -380 + Math.sin(a - 0.4) * 140, 14 + Math.cos(a) * 220, -380 + Math.sin(a) * 160 + 60); ctx.quadraticCurveTo(14 + Math.cos(a) * 120, -380 + Math.sin(a) * 90, 14, -380); fillStroke(ctx, '#4f8a4a', INK, 3); } ctx.restore(); });
  // the branch
  const x0 = 470, x1 = 1450; ctx.beginPath(); ctx.rect(x0, FLOOR - 560, x1 - x0, 560); fillStroke(ctx, night ? '#6b6f7a' : '#efe6d2', INK, 4);
  ctx.fillStyle = 'rgba(0,0,0,.08)'; for (let y = FLOOR - 540; y < FLOOR; y += 40) ctx.fillRect(x0, y, x1 - x0, 3);
  rr(ctx, x0 + 60, FLOOR - 520, x1 - x0 - 120, 110, 8); fillStroke(ctx, '#2c3e6b', INK, 4);
  T(ctx, o.name || 'BANK BRANCH', (x0 + x1) / 2, FLOOR - 465, '64px "Lilita One"', '#f3d27a');
  [[x0 + 70, 260], [x1 - 330, 260]].forEach(([x, w]) => { rr(ctx, x, FLOOR - 360, w, 200, 6); fillStroke(ctx, night ? '#2a3446' : '#a8cfe0', INK, 4); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.moveTo(x + 20, FLOOR - 340); ctx.lineTo(x + 80, FLOOR - 340); ctx.lineTo(x + 30, FLOOR - 180); ctx.lineTo(x + 10, FLOOR - 180); ctx.fill(); });
  rr(ctx, 860, FLOOR - 320, 200, 320, 6); fillStroke(ctx, night ? '#1c2638' : '#3b5566', INK, 4); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(960, FLOOR - 320); ctx.lineTo(960, FLOOR); ctx.stroke();
  if (o.closed) { const p = easeOut(clamp(o.closed / 0.35)); ctx.save(); ctx.translate(960, FLOOR - 210); ctx.rotate(Math.sin(t * 2) * 0.03); ctx.scale(p, p); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-50, -60); ctx.lineTo(0, -100); ctx.lineTo(50, -60); ctx.stroke(); rr(ctx, -90, -60, 180, 80, 8); fillStroke(ctx, RED, INK, 3); T(ctx, 'CLOSED', 0, -20, '40px "Lilita One"', '#fff'); ctx.restore(); }
  // street sign
  ctx.save(); ctx.translate(o.signX ?? 1380, FLOOR); rr(ctx, -8, -430, 16, 430, 4); fillStroke(ctx, '#5b646e', INK, 3);
  const sp = o.signGlow ? 0.5 + 0.5 * Math.sin(t * 6) : 0; if (o.signGlow) glowSpot(ctx, 0, -420, 260, `rgba(255,60,40,${0.25 + sp * 0.25})`);
  rr(ctx, -190, -470, 380, 84, 10); fillStroke(ctx, '#2f7a4a', INK, 4); rr(ctx, -178, -460, 356, 64, 6); ctx.strokeStyle = '#e9f2d8'; ctx.lineWidth = 3; ctx.stroke(); T(ctx, o.street || 'JUPITER ST', 0, -426, '46px "Lilita One"', '#fff'); ctx.restore();
  // pavement and road
  ctx.fillStyle = night ? '#3a3a40' : '#c9bca2'; ctx.fillRect(-400, FLOOR, W + 800, 70); ctx.fillStyle = night ? '#24252b' : '#55565c'; ctx.fillRect(-400, FLOOR + 70, W + 800, 400);
  ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-400, FLOOR); ctx.lineTo(W + 400, FLOOR); ctx.moveTo(-400, FLOOR + 70); ctx.lineTo(W + 400, FLOOR + 70); ctx.stroke();
  ctx.fillStyle = '#e8dcc0'; for (let x = -400; x < W + 400; x += 220) ctx.fillRect(x, FLOOR + 150, 120, 12);
  if (night) { ctx.fillStyle = 'rgba(10,16,34,.3)'; ctx.fillRect(-400, -400, W + 800, H + 800); }
}

// ---------- a colourful Manila jeepney ----------
export function jeepney(ctx, x, y, t, o = {}) {
  ctx.save(); ctx.translate(x, y); if (o.flip) ctx.scale(-1, 1); const b = Math.abs(Math.sin(t * 9)) * 3;
  ctx.translate(0, -b); rr(ctx, -260, -210, 470, 150, 14); fillStroke(ctx, '#e9eef2', INK, 4); rr(ctx, -260, -232, 470, 30, 10); fillStroke(ctx, '#d9483b', INK, 3);
  for (let i = 0; i < 5; i++) { rr(ctx, -240 + i * 80, -196, 62, 56, 6); fillStroke(ctx, '#2a3446', INK, 3); }
  ctx.fillStyle = '#2f7a72'; ctx.fillRect(-258, -122, 466, 16); ctx.fillStyle = YEL; ctx.fillRect(-258, -104, 466, 10);
  rr(ctx, 210, -170, 110, 110, 12); fillStroke(ctx, '#d9483b', INK, 4); rr(ctx, 232, -160, 60, 46, 6); fillStroke(ctx, '#9fc4d6', INK, 3);
  ctx.beginPath(); ctx.moveTo(250, -232); ctx.lineTo(262, -262); ctx.lineTo(276, -232); fillStroke(ctx, '#c9c9c9', INK, 2.5);
  ctx.translate(0, b); [[-170], [230]].forEach(([wx]) => { ctx.beginPath(); ctx.arc(wx, -40, 42, 0, 7); fillStroke(ctx, '#2b2b30', INK, 4); ctx.beginPath(); ctx.arc(wx, -40, 16, 0, 7); fillStroke(ctx, '#9a9a9a', INK, 3); });
  ctx.restore();
}

// ---------- four driving licences, then a FAKE stamp ----------
export function licences(ctx, t, L, o = {}) {
  deskBg(ctx); const faces = o.faces || [];
  [0, 1, 2, 3].forEach(i => { const p = easeOut(clamp((L - 0.15 - i * 0.25) / 0.35)); if (p <= 0) return; const x = 330 + i * 420, y = 470 + (i % 2) * 70;
    ctx.save(); ctx.translate(x, y + (1 - p) * 80); ctx.rotate((hash(i * 5) - 0.5) * 0.12); ctx.globalAlpha = p;
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(-170, -100, 360, 230); rr(ctx, -180, -115, 360, 230, 14); fillStroke(ctx, '#e3ecf2', INK, 4);
    rr(ctx, -180, -115, 360, 48, 14); fillStroke(ctx, '#2c5a8a', INK, 3); T(ctx, "DRIVER'S LICENCE", 0, -90, '900 24px "Nunito"', '#fff');
    rr(ctx, -158, -50, 120, 150, 6); fillStroke(ctx, '#c9d6e0', INK, 3); ctx.save(); ctx.beginPath(); ctx.rect(-158, -50, 120, 150); ctx.clip(); ctx.translate(-98, 20); ctx.scale(0.52, 0.52); if (faces[i]) faces[i](ctx, t); ctx.restore();
    ctx.fillStyle = '#7a8a98'; for (let r = 0; r < 4; r++) ctx.fillRect(-14, -36 + r * 34, 150 - r * 18, 12);
    if (o.stamp != null && L > o.stamp + i * 0.12) { const s = clamp((L - o.stamp - i * 0.12) / 0.15); ctx.save(); ctx.rotate(-0.25); ctx.scale(2 - s, 2 - s); ctx.globalAlpha = s; rr(ctx, -130, -44, 260, 88, 10); ctx.strokeStyle = RED; ctx.lineWidth = 9; ctx.stroke(); T(ctx, 'FAKE', 0, 4, '70px "Lilita One"', RED); ctx.restore(); }
    ctx.restore(); });
  if (o.cash != null) { const p = easeOut(clamp((L - o.cash) / 0.4)); if (p > 0) { textOutlined(ctx, '$500 EACH', W / 2, 860 + (1 - p) * 40, { size: 70, fill: '#9fd37f', lw: 10 }); } }
}

// ---------- an oil tanker at sea ----------
export function tanker(ctx, t, L, o = {}) {
  const g = ctx.createLinearGradient(0, -300, 0, 640); g.addColorStop(0, '#6fa8c8'); g.addColorStop(1, '#e8d8b4'); ctx.fillStyle = g; ctx.fillRect(-400, -400, W + 800, 1100);
  glowSpot(ctx, 1500, 160, 360, 'rgba(255,240,200,.5)');
  [[200, 140, 1], [700, 90, 0.8], [1250, 170, 0.9]].forEach(([x, y, s], i) => { const dx = (t * 8 + i * 300) % 2400 - 400; ctx.save(); ctx.translate(x + dx * 0.3, y); ctx.scale(s, s); ctx.fillStyle = 'rgba(255,255,255,.85)'; [[0, 0, 50], [50, -15, 60], [110, 0, 45]].forEach(([a, b, r]) => { ctx.beginPath(); ctx.arc(a, b, r, 0, 7); ctx.fill(); }); ctx.restore(); });
  const sea = 640, bob = Math.sin(t * 1.2) * 6, x = lerp(1100, 860, ease(clamp(L / 6)));
  ctx.save(); ctx.translate(x, sea + bob); ctx.rotate(Math.sin(t * 0.9) * 0.008);
  ctx.beginPath(); ctx.moveTo(-620, -120); ctx.lineTo(560, -120); ctx.lineTo(640, -200); ctx.lineTo(680, -200); ctx.lineTo(600, 60); ctx.lineTo(-560, 60); ctx.closePath(); fillStroke(ctx, '#2b3440', INK, 5);
  ctx.beginPath(); ctx.moveTo(-600, -40); ctx.lineTo(620, -40); ctx.lineTo(600, 60); ctx.lineTo(-560, 60); ctx.closePath(); fillStroke(ctx, '#a8342a', INK, 4);
  ctx.fillStyle = '#efe6d2'; ctx.font = '72px "Lilita One"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(o.name || 'JUPITER', 40, -82);
  rr(ctx, -560, -330, 220, 210, 6); fillStroke(ctx, '#efe6d2', INK, 4); for (let i = 0; i < 4; i++) { rr(ctx, -540 + i * 50, -300, 34, 30, 3); fillStroke(ctx, '#2a3446', INK, 2.5); }
  rr(ctx, -480, -420, 40, 90, 4); fillStroke(ctx, '#a8342a', INK, 4);
  for (let i = 0; i < 6; i++) { rr(ctx, -280 + i * 140, -150, 90, 30, 6); fillStroke(ctx, '#5b646e', INK, 3); }
  ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-300, -150); ctx.lineTo(560, -150); ctx.stroke();
  ctx.restore();
  // smoke
  for (let i = 0; i < 6; i++) { const k = ((t * 0.4 + i / 6) % 1); ctx.fillStyle = `rgba(90,90,100,${0.35 * (1 - k)})`; ctx.beginPath(); ctx.arc(x - 460 - k * 200, sea - 440 + bob - k * 220, 26 + k * 50, 0, 7); ctx.fill(); }
  // sea
  ctx.fillStyle = '#2f6f8f'; ctx.fillRect(-400, sea + 10, W + 800, 800); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-400, sea + 10); ctx.lineTo(W + 400, sea + 10); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 4; for (let r = 0; r < 8; r++) for (let c = 0; c < 9; c++) { const xx = -300 + c * 270 + ((t * 30 + r * 90) % 270), yy = sea + 60 + r * 60; ctx.beginPath(); ctx.moveTo(xx, yy); ctx.quadraticCurveTo(xx + 30, yy - 12, xx + 60, yy); ctx.stroke(); }
  if (o.stamp != null && L > o.stamp) { const s = clamp((L - o.stamp) / 0.18); ctx.save(); ctx.translate(W / 2 + 300, 300); ctx.rotate(-0.15); ctx.scale(2 - s, 2 - s); ctx.globalAlpha = s; rr(ctx, -260, -60, 520, 120, 12); ctx.fillStyle = 'rgba(246,239,221,.85)'; ctx.fill(); ctx.strokeStyle = RED; ctx.lineWidth = 10; ctx.stroke(); T(ctx, o.stampText || 'SANCTIONED', 0, 4, '74px "Lilita One"', RED); ctx.restore(); }
}

// ---------- three cities side by side: clock, day, and a CLOSED sign each ----------
export function cityClocks(ctx, t, L, o = {}) {
  deskBg(ctx, '#2a2420'); const cities = o.cities || [];
  cities.forEach((c, i) => { const x = W / 2 + (i - (cities.length - 1) / 2) * 600, p = easeOut(clamp((L - (c.at ?? i * 0.3)) / 0.35)); if (p <= 0) return;
    ctx.save(); ctx.translate(x, 560 + (1 - p) * 60); ctx.globalAlpha = p;
    rr(ctx, -250, -400, 500, 780, 16); fillStroke(ctx, c.night ? '#24304a' : '#efe6d2', INK, 4);
    rr(ctx, -250, -400, 500, 100, 16); fillStroke(ctx, c.color || '#2c3e6b', INK, 4); T(ctx, c.name, 0, -350, '60px "Lilita One"', '#f6efdd');
    ctx.save(); ctx.translate(0, -130); ctx.beginPath(); ctx.arc(0, 0, 120, 0, 7); fillStroke(ctx, PAPER, INK, 6); for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; ctx.fillStyle = INK; ctx.fillRect(Math.cos(a) * 100 - 4, Math.sin(a) * 100 - 4, 8, 8); }
    const hh = (c.hour ?? 9) + (c.spin ? L * c.spin : 0), mA = (hh % 1) * Math.PI * 2 - Math.PI / 2, hA = (hh % 12) / 12 * Math.PI * 2 - Math.PI / 2; ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(hA) * 60, Math.sin(hA) * 60); ctx.stroke(); ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(mA) * 92, Math.sin(mA) * 92); ctx.stroke(); ctx.restore();
    T(ctx, c.day || '', 0, 90, '70px "Lilita One"', c.night ? '#f6efdd' : INK); if (c.sub) T(ctx, c.sub, 0, 160, '900 34px "Nunito"', c.night ? '#b9c4d6' : '#6b5a4a');
    if (c.closed != null && L > c.closed) { const s = clamp((L - c.closed) / 0.18); ctx.save(); ctx.translate(0, 270); ctx.rotate(-0.12); ctx.scale(2 - s, 2 - s); ctx.globalAlpha = s; rr(ctx, -200, -55, 400, 110, 10); ctx.fillStyle = 'rgba(246,239,221,.9)'; ctx.fill(); ctx.strokeStyle = RED; ctx.lineWidth = 9; ctx.stroke(); T(ctx, c.closedText || 'CLOSED', 0, 4, '68px "Lilita One"', RED); ctx.restore(); }
    ctx.restore(); });
}

// ---------- a casino floor ----------
export function casino(ctx, t, o = {}) {
  const g = ctx.createLinearGradient(0, -300, 0, FLOOR); g.addColorStop(0, '#3a0f1a'); g.addColorStop(1, '#6b1f2a'); ctx.fillStyle = g; ctx.fillRect(-400, -400, W + 800, FLOOR + 400);
  ctx.fillStyle = 'rgba(255,200,120,.08)'; for (let x = -400; x < W + 400; x += 120) ctx.fillRect(x, -400, 50, FLOOR + 400);
  // chandeliers
  [480, 1440].forEach((x, i) => { glowSpot(ctx, x, 120, 300, 'rgba(255,214,140,.35)'); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, -300); ctx.lineTo(x, 60); ctx.stroke(); ctx.beginPath(); ctx.ellipse(x, 100, 140, 40, 0, 0, 7); fillStroke(ctx, '#d9b25a', INK, 4);
    for (let k = 0; k < 7; k++) { const cx = x - 120 + k * 40, tw = 0.6 + 0.4 * Math.sin(t * 5 + k + i); ctx.fillStyle = `rgba(255,240,190,${tw})`; ctx.beginPath(); ctx.arc(cx, 150, 10, 0, 7); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke(); } });
  // slot machines along the back
  for (let i = 0; i < 8; i++) { const x = 40 + i * 250, y = FLOOR - 40; rr(ctx, x - 80, y - 380, 160, 380, 14); fillStroke(ctx, i % 2 ? '#2c3e6b' : '#7a2b6b', INK, 4);
    rr(ctx, x - 64, y - 360, 128, 60, 8); fillStroke(ctx, '#f3d27a', INK, 3); const lt = Math.sin(t * 6 + i) > 0; T(ctx, lt ? '777' : 'WIN', x, y - 330, '34px "Lilita One"', RED);
    rr(ctx, x - 64, y - 280, 128, 100, 6); fillStroke(ctx, '#f6efdd', INK, 3); for (let r = 0; r < 3; r++) { const sym = ['7', '$', '♦', '★'][Math.floor(t * 8 + r * 3 + i) % 4]; T(ctx, sym, x - 40 + r * 40, y - 230, '36px "Lilita One"', r === 1 ? RED : INK); }
    rr(ctx, x - 54, y - 150, 108, 30, 6); fillStroke(ctx, '#d9b25a', INK, 3); glowSpot(ctx, x, y - 330, 90, `rgba(255,200,80,${lt ? 0.35 : 0.12})`); }
  // carpet
  ctx.fillStyle = '#4a1420'; ctx.fillRect(-400, FLOOR, W + 800, 500); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-400, FLOOR); ctx.lineTo(W + 400, FLOOR); ctx.stroke();
  ctx.fillStyle = 'rgba(217,178,90,.25)'; for (let r = 0; r < 4; r++) for (let c = 0; c < 20; c++) { ctx.save(); ctx.translate(-380 + c * 140 + (r % 2) * 70, FLOOR + 40 + r * 70); ctx.rotate(Math.PI / 4); ctx.fillRect(-12, -12, 24, 24); ctx.restore(); }
  // the table up front
  if (o.table !== false) { ctx.save(); ctx.translate(W / 2, FLOOR + 160); ctx.beginPath(); ctx.ellipse(0, 0, 640, 130, 0, 0, 7); fillStroke(ctx, '#6b4a34', INK, 5); ctx.beginPath(); ctx.ellipse(0, -10, 600, 110, 0, 0, 7); fillStroke(ctx, '#2f7a4a', INK, 4);
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, -10, 440, 70, 0, 0, 7); ctx.stroke();
    const n = o.chips ?? 6; for (let s = 0; s < n; s++) { const cx = -420 + s * 170, h = 6 + Math.floor(hash(s) * 8); for (let k = 0; k < h; k++) { ctx.beginPath(); ctx.ellipse(cx, -30 - k * 10, 44, 16, 0, 0, 7); fillStroke(ctx, ['#c7342a', '#2c3e6b', '#e9eef2', '#2f2a26', '#d9b25a'][(s + k) % 5], INK, 2.5); } }
    ctx.restore(); }
}

// ---------- money flow: dollars -> pesos -> chips -> ? ----------
export function moneyFlow(ctx, t, L, o = {}) {
  deskBg(ctx); const steps = o.steps || [['$', 'DOLLARS', '#7fa36a'], ['₱', 'PESOS', '#6a8ab0'], ['◉', 'CASINO CHIPS', '#c7342a'], ['?', 'GONE', '#5a5048']];
  steps.forEach(([sym, lab, col], i) => { const at = (o.at || [])[i] ?? i * 0.8, p = easeOut(clamp((L - at) / 0.35)); if (p <= 0) return; const x = 300 + i * 440, y = 500;
    if (i > 0) { const q = clamp((L - at + 0.3) / 0.4); ctx.strokeStyle = YEL; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - 330, y); ctx.lineTo(x - 330 + 210 * q, y); ctx.stroke(); if (q > 0.9) { ctx.beginPath(); ctx.moveTo(x - 135, y - 22); ctx.lineTo(x - 112, y); ctx.lineTo(x - 135, y + 22); ctx.stroke(); } }
    ctx.save(); ctx.translate(x, y); ctx.scale(p, p); ctx.beginPath(); ctx.arc(0, 0, 140, 0, 7); fillStroke(ctx, col, INK, 6); ctx.beginPath(); ctx.arc(0, 0, 112, 0, 7); ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 5; ctx.setLineDash(i === 2 ? [20, 14] : []); ctx.stroke(); ctx.setLineDash([]);
    textOutlined(ctx, sym, 0, 8, { size: 130, fill: '#f6efdd', lw: 10 }); ctx.restore(); textOutlined(ctx, lab, x, y + 210, { size: 48, fill: YEL, lw: 8 }); });
}

// ---------- WANTED poster on a wall ----------
export function wantedPoster(ctx, t, L, o = {}) {
  ctx.fillStyle = '#5a4a3c'; ctx.fillRect(-400, -400, W + 800, H + 800); ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = 3; for (let y = -400, r = 0; y < H + 400; y += 60, r++) { ctx.beginPath(); ctx.moveTo(-400, y); ctx.lineTo(W + 400, y); ctx.stroke(); for (let x = -400 + (r % 2) * 90; x < W + 400; x += 180) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 60); ctx.stroke(); } }
  const p = easeOut(clamp(L / 0.4)); ctx.save(); ctx.translate(W / 2, H / 2 + (1 - p) * 50); ctx.rotate(-0.02); ctx.globalAlpha = p;
  ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(-330, -450, 680, 920); rr(ctx, -340, -460, 680, 920, 4); fillStroke(ctx, '#f2ead8', INK, 4);
  T(ctx, 'WANTED', 0, -380, '120px "Lilita One"', RED); T(ctx, o.by || 'BY THE FBI', 0, -295, '900 40px "Nunito"', INK);
  rr(ctx, -200, -250, 400, 400, 6); fillStroke(ctx, '#c9d0d6', INK, 4); ctx.save(); ctx.beginPath(); ctx.rect(-200, -250, 400, 400); ctx.clip(); ctx.translate(0, 120); ctx.scale(1.5, 1.5); if (o.face) o.face(ctx, t); ctx.restore();
  T(ctx, o.name || '', 0, 220, '64px "Lilita One"', INK); T(ctx, o.sub || '', 0, 290, '900 32px "Nunito"', '#5a5048');
  ctx.fillStyle = '#7a6a58'; for (let r = 0; r < 3; r++) ctx.fillRect(-250, 340 + r * 32, 500 - r * 80, 12);
  [[-310, -430], [310, -430], [-310, 430], [310, 430]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 10, 0, 7); fillStroke(ctx, '#b9b2a0', INK, 2.5); });
  if (o.stamp != null && L > o.stamp) { const s = clamp((L - o.stamp) / 0.18); ctx.save(); ctx.translate(0, 0); ctx.rotate(-0.2); ctx.scale(2 - s, 2 - s); ctx.globalAlpha = s; rr(ctx, -300, -70, 600, 140, 12); ctx.fillStyle = 'rgba(246,239,221,.85)'; ctx.fill(); ctx.strokeStyle = RED; ctx.lineWidth = 11; ctx.stroke(); T(ctx, o.stampText || 'NEVER ARRESTED', 0, 4, '70px "Lilita One"', RED); ctx.restore(); }
  ctx.restore();
}

// ---------- a hospital ward of computers showing a ransom screen ----------
export function ransomWard(ctx, t, L, o = {}) {
  const g = ctx.createLinearGradient(0, -300, 0, FLOOR); g.addColorStop(0, '#cfe3e0'); g.addColorStop(1, '#9fc2bf'); ctx.fillStyle = g; ctx.fillRect(-400, -400, W + 800, FLOOR + 400);
  ctx.fillStyle = '#e9f2f0'; ctx.fillRect(-400, 560, W + 800, FLOOR - 560); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-400, 560); ctx.lineTo(W + 400, 560); ctx.stroke();
  // hospital sign + cross
  rr(ctx, 760, 70, 400, 90, 10); fillStroke(ctx, '#2c5a8a', INK, 4); T(ctx, 'HOSPITAL', 960, 117, '58px "Lilita One"', '#fff');
  ctx.save(); ctx.translate(380, 200); rr(ctx, -60, -60, 120, 120, 12); fillStroke(ctx, '#fff', INK, 4); ctx.fillStyle = '#c7342a'; ctx.fillRect(-14, -44, 28, 88); ctx.fillRect(-44, -14, 88, 28); ctx.restore();
  // beds in the back
  [1450, 1720].forEach(x => { rr(ctx, x - 120, FLOOR - 170, 240, 60, 8); fillStroke(ctx, '#f6f6f6', INK, 3); rr(ctx, x - 120, FLOOR - 220, 30, 110, 4); fillStroke(ctx, '#9aa3ad', INK, 3); ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x - 100, FLOOR - 110); ctx.lineTo(x - 100, FLOOR); ctx.moveTo(x + 100, FLOOR - 110); ctx.lineTo(x + 100, FLOOR); ctx.stroke(); });
  // desks with screens
  for (let i = 0; i < 3; i++) { const x = 330 + i * 380, red = L > (o.at || 0) + i * 0.4; rr(ctx, x - 160, FLOOR - 230, 320, 24, 4); fillStroke(ctx, '#c9b48c', INK, 3); ctx.fillStyle = '#8a6a48'; ctx.fillRect(x - 150, FLOOR - 206, 16, 206); ctx.fillRect(x + 134, FLOOR - 206, 16, 206);
    if (red) glowSpot(ctx, x, FLOOR - 340, 200, 'rgba(255,40,30,.28)');
    rr(ctx, x - 120, FLOOR - 440, 240, 170, 10); fillStroke(ctx, '#2b3440', INK, 4); rr(ctx, x - 106, FLOOR - 426, 212, 142, 4); fillStroke(ctx, red ? '#a8231c' : '#2a4a6a', INK, 2);
    if (red) { ctx.save(); ctx.translate(x, FLOOR - 375); rr(ctx, -22, -6, 44, 36, 5); fillStroke(ctx, YEL, INK, 3); ctx.strokeStyle = YEL; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(0, -8, 15, Math.PI, 0); ctx.stroke(); ctx.restore(); ctx.fillStyle = '#fff'; ctx.fillRect(x - 80, FLOOR - 326, 160, 8); ctx.fillRect(x - 60, FLOOR - 310, 120, 8); }
    rr(ctx, x - 16, FLOOR - 272, 32, 42, 3); fillStroke(ctx, '#5b646e', INK, 3); }
  ctx.fillStyle = '#b9c9c6'; ctx.fillRect(-400, FLOOR, W + 800, 500); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-400, FLOOR); ctx.lineTo(W + 400, FLOOR); ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,.12)'; for (let x = -400; x < W + 400; x += 120) { ctx.beginPath(); ctx.moveTo(x, FLOOR); ctx.lineTo(x - 60, H + 100); ctx.stroke(); }
}

// ---------- checklist card: items tick on at given local times ----------
export function checklist(ctx, t, L, o = {}) {
  deskBg(ctx); const items = o.items || [], p = easeOut(clamp(L / 0.35)); ctx.save(); ctx.translate(W / 2, H / 2 + (1 - p) * 50); ctx.globalAlpha = p;
  ctx.font = '64px "Lilita One"'; const tw = o.title ? ctx.measureText(o.title).width : 0; ctx.font = '60px "Lilita One"'; const iw = Math.max(0, ...items.map(it => ctx.measureText(it.text).width)) + 200;
  const hw = Math.min(900, Math.max(470, tw / 2 + 70, iw / 2 + 60)), h = 200 + items.length * 130; rr(ctx, -hw, -h / 2, hw * 2, h, 10); fillStroke(ctx, '#f2ead8', INK, 4); if (o.title) T(ctx, o.title, 0, -h / 2 + 80, '64px "Lilita One"', INK);
  ctx.translate(-hw + 470, 0);
  items.forEach((it, i) => { const y = -h / 2 + 200 + i * 130, q = clamp((L - it.at) / 0.25); rr(ctx, -400, y - 40, 80, 80, 10); fillStroke(ctx, '#fff', INK, 4);
    T(ctx, it.text, -280, y, '60px "Lilita One"', INK, 'left');
    if (q > 0) { ctx.strokeStyle = it.no ? RED : '#2f8a4a'; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.beginPath();
      if (it.no) { ctx.moveTo(-385, y - 25); ctx.lineTo(-385 + 50 * q, y - 25 + 50 * q); if (q > 0.5) { ctx.moveTo(-335, y - 25); ctx.lineTo(-335 - 50 * (q - 0.5) * 2, y - 25 + 50 * (q - 0.5) * 2); } }
      else { ctx.moveTo(-385, y); ctx.lineTo(-365, y + 22 * Math.min(1, q * 2)); if (q > 0.5) ctx.lineTo(-365 + 50 * (q - 0.5) * 2, y + 22 - 60 * (q - 0.5) * 2); }
      ctx.stroke(); } });
  ctx.restore();
}

// ---------- a desk phone ringing ----------
export function deskPhone(ctx, x, y, t, o = {}) {
  const ring = o.ring ? Math.sin(t * 40) * 0.08 : 0; ctx.save(); ctx.translate(x, y);
  rr(ctx, -90, -60, 180, 60, 12); fillStroke(ctx, o.color || '#3a3f46', INK, 4); for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) { rr(ctx, -40 + c * 28, -52 + r * 22, 20, 14, 3); fillStroke(ctx, '#d9e2ea', INK, 1.5); }
  ctx.save(); ctx.translate(0, -66); ctx.rotate(ring); rr(ctx, -100, -20, 200, 30, 14); fillStroke(ctx, o.color || '#3a3f46', INK, 4); ctx.restore();
  if (o.ring && Math.sin(t * 6) > -0.3) { ctx.strokeStyle = YEL; ctx.lineWidth = 6; ctx.lineCap = 'round'; [-1, 1].forEach(s => { for (let k = 0; k < 2; k++) { ctx.beginPath(); ctx.arc(0, -70, 120 + k * 30, s > 0 ? -0.5 : Math.PI - 0.1, s > 0 ? 0.1 : Math.PI + 0.5); ctx.stroke(); } }); }
  ctx.restore();
}
