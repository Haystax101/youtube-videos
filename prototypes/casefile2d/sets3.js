// Case File sets, part 3: banks, offices, printers, the Fed, hacker dens, money graphics (long-form 002 Bangladesh Bank).
import { W, H, INK, YEL, RED, clamp, lerp, ease, easeOut, hash, rr, fillStroke, shade, textOutlined } from './engine.js';
import { glowSpot } from './sets.js';
import { room, windowFrame, wallClock, cabinet, plant, FLOOR } from './sets2.js';

// ---------- sky + distant skyline ----------
function sky(ctx, top, bot) { const g = ctx.createLinearGradient(0, -300, 0, FLOOR); g.addColorStop(0, top); g.addColorStop(1, bot); ctx.fillStyle = g; ctx.fillRect(-400, -400, W + 800, FLOOR + 400); }
function skyline(ctx, seed, base, col, lit = 0) {
  for (let i = 0; i < 24; i++) { const x = -380 + i * 115 + hash(seed + i) * 40, w = 90 + hash(seed + i * 3) * 70, h = 160 + hash(seed + i * 7) * 300;
    ctx.fillStyle = col; ctx.fillRect(x, base - h, w, h);
    for (let r = 0; r < h / 34 - 1; r++) for (let c = 0; c < w / 26 - 1; c++) { const on = hash(seed * 31 + i * 97 + r * 13 + c) < (lit || 0.25);
      ctx.fillStyle = lit ? (on ? 'rgba(255,214,120,.75)' : 'rgba(0,0,0,.18)') : 'rgba(255,255,255,.16)'; if (on || !lit) ctx.fillRect(x + 10 + c * 26, base - h + 14 + r * 34, 12, 16); } }
}
function tree(ctx, x, y, s = 1, t = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); rr(ctx, -12, -150, 24, 150, 6); fillStroke(ctx, '#6b4a34', INK, 3);
  const sw = Math.sin(t * 1.3 + x) * 3; [[-60, -190, 80], [50, -200, 85], [0, -260, 95], [-20, -170, 70]].forEach(([dx, dy, r]) => { ctx.beginPath(); ctx.arc(dx + sw, dy, r, 0, 7); fillStroke(ctx, '#5f8a4e', INK, 3); });
  ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.beginPath(); ctx.arc(-10 + sw, -290, 40, 0, 7); ctx.fill(); ctx.restore();
}
export function rickshaw(ctx, x, y, t, o = {}) {
  ctx.save(); ctx.translate(x, y); if (o.flip) ctx.scale(-1, 1);
  const sp = o.moving ? t * 6 : 0;
  [[-70, 0], [60, 0]].forEach(([wx]) => { ctx.beginPath(); ctx.arc(wx, -36, 36, 0, 7); fillStroke(ctx, '#2b2b30', INK, 4); ctx.strokeStyle = '#9a9a9a'; ctx.lineWidth = 2; for (let i = 0; i < 6; i++) { const a = sp + i * Math.PI / 3; ctx.beginPath(); ctx.moveTo(wx, -36); ctx.lineTo(wx + Math.cos(a) * 32, -36 + Math.sin(a) * 32); ctx.stroke(); } });
  rr(ctx, -120, -150, 120, 80, 10); fillStroke(ctx, o.color || '#d9483b', INK, 3);
  ctx.beginPath(); ctx.moveTo(-130, -150); ctx.quadraticCurveTo(-70, -250, -10, -150); fillStroke(ctx, o.hood || '#2f6a6a', INK, 3);
  ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(0, -80); ctx.lineTo(60, -36); ctx.moveTo(40, -110); ctx.lineTo(60, -36); ctx.stroke();
  rr(ctx, 20, -126, 50, 12, 4); fillStroke(ctx, '#3a3a3a', INK, 2);
  ctx.restore();
}

// ---------- the central bank tower, morning ----------
export function bankTower(ctx, t, o = {}) {
  sky(ctx, o.night ? '#0e1a33' : '#8fbad3', o.night ? '#283c5c' : '#f2dcae');
  if (!o.night) { glowSpot(ctx, 1600, 120, 380, 'rgba(255,240,200,.55)'); }
  skyline(ctx, 7, FLOOR - 40, o.night ? '#22304a' : '#a9b8c4', o.night ? 0.3 : 0);
  // tower
  const x0 = 620, x1 = 1300, top = -260;
  ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(x0 + 18, top, x1 - x0, FLOOR - 120 - top);
  ctx.beginPath(); ctx.rect(x0, top, x1 - x0, FLOOR - 120 - top); fillStroke(ctx, o.night ? '#8f96a3' : '#ece5d6', INK, 4);
  for (let y = top + 40; y < FLOOR - 170; y += 74) { const lit = o.night; ctx.fillStyle = lit ? '#1c2638' : '#5e7f99'; ctx.fillRect(x0 + 18, y, x1 - x0 - 36, 34);
    for (let c = 0; c < 14; c++) { const on = lit && hash(y * 3 + c) < 0.35; ctx.fillStyle = on ? 'rgba(255,214,120,.85)' : 'rgba(255,255,255,.18)'; ctx.fillRect(x0 + 24 + c * 46, y + 4, 36, on ? 26 : 8); } }
  ctx.fillStyle = 'rgba(0,0,0,.08)'; for (let x = x0 + 34; x < x1; x += 68) ctx.fillRect(x, top, 10, FLOOR - 120 - top);
  ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(x1 - 90, top, 90, FLOOR - 120 - top);
  // podium + entrance
  rr(ctx, x0 - 120, FLOOR - 190, x1 - x0 + 240, 190, 4); fillStroke(ctx, o.night ? '#7d828c' : '#d8cfbd', INK, 4);
  for (let i = 0; i < 9; i++) { const cx = x0 - 90 + i * ((x1 - x0 + 180) / 8); rr(ctx, cx - 14, FLOOR - 186, 28, 186, 3); fillStroke(ctx, o.night ? '#9aa0aa' : '#efe9dc', INK, 2.5); }
  rr(ctx, 860, FLOOR - 150, 200, 150, 4); fillStroke(ctx, o.night ? '#f2c66a' : '#3b5566', INK, 4);
  ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(960, FLOOR - 150); ctx.lineTo(960, FLOOR); ctx.stroke();
  rr(ctx, 760, FLOOR - 250, 400, 70, 6); fillStroke(ctx, '#2c3a35', INK, 4);
  ctx.fillStyle = '#f3d27a'; ctx.font = '44px "Lilita One"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('BANGLADESH BANK', 960, FLOOR - 214);
  if (o.clock != null) { ctx.save(); ctx.translate(1230, FLOOR - 330); ctx.beginPath(); ctx.arc(0, 0, 64, 0, 7); fillStroke(ctx, '#f6efdd', INK, 5);
    const hh = o.clock, mA = (hh % 1) * Math.PI * 2 - Math.PI / 2, hA = (hh % 12) / 12 * Math.PI * 2 - Math.PI / 2; ctx.strokeStyle = INK; ctx.lineCap = 'round';
    ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(hA) * 34, Math.sin(hA) * 34); ctx.stroke(); ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(mA) * 50, Math.sin(mA) * 50); ctx.stroke(); ctx.restore(); }
  // ground
  ctx.fillStyle = o.night ? '#3a3a40' : '#b9ae98'; ctx.fillRect(-400, FLOOR, W + 800, 70); ctx.fillStyle = o.night ? '#24252b' : '#55565c'; ctx.fillRect(-400, FLOOR + 70, W + 800, 400);
  ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-400, FLOOR); ctx.lineTo(W + 400, FLOOR); ctx.moveTo(-400, FLOOR + 70); ctx.lineTo(W + 400, FLOOR + 70); ctx.stroke();
  ctx.fillStyle = '#e8dcc0'; for (let x = -400; x < W + 400; x += 220) ctx.fillRect(x, FLOOR + 150, 120, 12);
  tree(ctx, 330, FLOOR + 4, 1, t); tree(ctx, 1610, FLOOR + 4, 1.1, t + 2);
  if (o.night) { ctx.fillStyle = 'rgba(10,16,34,.35)'; ctx.fillRect(-400, -400, W + 800, H + 800); }
}

// ---------- office floor with the printer ----------
export function printer(ctx, x, y, t, o = {}) {   // x = centre, y = floor line; o.error blink, o.paper 0..1 sheet out, o.shake
  const sx = o.shake ? Math.sin(t * 24) * 3 * o.shake : 0; ctx.save(); ctx.translate(x + sx, y);
  // stand
  rr(ctx, -130, -250, 260, 250, 4); fillStroke(ctx, '#8a8f96', INK, 3); rr(ctx, -118, -230, 236, 100, 4); fillStroke(ctx, '#9da2a9', INK, 2.5); rr(ctx, -118, -120, 236, 100, 4); fillStroke(ctx, '#9da2a9', INK, 2.5);
  // body
  rr(ctx, -150, -420, 300, 170, 14); fillStroke(ctx, '#e9e6df', INK, 4);
  rr(ctx, -150, -440, 300, 34, 10); fillStroke(ctx, '#d6d2c8', INK, 3);
  rr(ctx, -120, -330, 200, 22, 6); fillStroke(ctx, '#3b3d42', INK, 3);  // output slot
  // control panel
  rr(ctx, 90, -400, 46, 66, 6); fillStroke(ctx, '#3b3d42', INK, 2.5);
  const on = o.error ? Math.sin(t * 9) > 0 : true; ctx.beginPath(); ctx.arc(113, -380, 9, 0, 7); fillStroke(ctx, o.error ? (on ? '#ff4a3a' : '#5a2420') : '#5bd16a', INK, 2);
  if (o.error && on) glowSpot(ctx, 113, -380, 60, 'rgba(255,70,50,.45)');
  ctx.fillStyle = o.error ? '#ff8a7a' : '#9fe6a8'; ctx.font = '900 16px "Nunito"'; ctx.textAlign = 'center'; ctx.fillText(o.error ? 'ERR' : 'OK', 113, -348);
  // tray + sheet
  rr(ctx, -140, -318, 230, 14, 4); fillStroke(ctx, '#cfcac0', INK, 2.5);
  const p = clamp(o.paper || 0); if (p > 0) { ctx.save(); ctx.translate(-20, -318); ctx.rotate(o.jam ? -0.25 : 0); rr(ctx, -90, -14 - 150 * p * (o.jam ? 0.5 : 0), 160, 14 + 150 * p * (o.jam ? 0.5 : 0), 2);
    fillStroke(ctx, '#fbf7ec', INK, 2.5); if (o.jam) { ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-70, -40); ctx.lineTo(-40, -30); ctx.lineTo(-10, -48); ctx.lineTo(30, -34); ctx.stroke(); } ctx.restore(); }
  ctx.fillStyle = INK; ctx.font = '900 18px "Nunito"'; ctx.textAlign = 'left'; ctx.fillText('SWIFT', -130, -370);
  ctx.restore();
}
export function officeFloor(ctx, t, o = {}) {
  room(ctx, t, { wall: o.night ? '#6f7586' : '#dcd2ba', wainscot: 640, floor: '#5e6b6a', tiles: true, dark: o.dark || 0, items: (c) => {
    // two big windows onto the city
    [[180, 160], [1240, 160]].forEach(([wx, wy]) => { c.save(); c.beginPath(); c.rect(wx, wy, 520, 330); c.clip(); sky(c, o.night ? '#0e1a33' : '#9cc4d8', o.night ? '#263a5a' : '#f1dcae');
      c.save(); c.translate(wx - 200, wy + 330 - FLOOR + 40); c.scale(1, 1); skyline(c, 3 + wx, FLOOR, o.night ? '#22304a' : '#a6b4bf', o.night ? 0.35 : 0); c.restore(); c.restore();
      c.strokeStyle = INK; c.lineWidth = 6; c.strokeRect(wx, wy, 520, 330); c.lineWidth = 4; c.beginPath(); c.moveTo(wx + 260, wy); c.lineTo(wx + 260, wy + 330); c.moveTo(wx, wy + 165); c.lineTo(wx + 520, wy + 165); c.stroke();
      rr(c, wx - 14, wy + 330, 548, 18, 3); fillStroke(c, '#c9bea4', INK, 3); });
    wallClock(c, 960, 180, 70, t, o.hour ?? 8.75);
    rr(c, 820, 300, 280, 70, 6); fillStroke(c, '#2c3a35', INK, 3); c.fillStyle = '#f3d27a'; c.font = '34px "Lilita One"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('FLOOR 10', 960, 336);
    cabinet(c, 1780, FLOOR - 230); cabinet(c, 60, FLOOR - 230); plant(c, 1720, FLOOR, 1.1);
  } });
  // desks with monitors (behind people), printer
  (o.desks || []).forEach(dx => { rr(ctx, dx - 150, FLOOR - 150, 300, 22, 4); fillStroke(ctx, '#7a5638', INK, 3); rr(ctx, dx - 130, FLOOR - 128, 18, 128, 3); fillStroke(ctx, '#5e412b', INK, 2); rr(ctx, dx + 112, FLOOR - 128, 18, 128, 3); fillStroke(ctx, '#5e412b', INK, 2);
    rr(ctx, dx - 60, FLOOR - 270, 120, 90, 6); fillStroke(ctx, '#2b2f36', INK, 3); ctx.fillStyle = o.night ? '#5ad1ff' : '#9fd4e8'; ctx.fillRect(dx - 50, FLOOR - 262, 100, 72); rr(ctx, dx - 8, FLOOR - 180, 16, 30, 2); fillStroke(ctx, '#2b2f36', INK, 2); });
  if (o.printerX != null) printer(ctx, o.printerX, FLOOR, t, o.printer || {});
}

// ---------- a stream of transfer slips (what the printer should have printed) ----------
export function swiftSlips(ctx, t, L, o = {}) {
  ctx.fillStyle = '#2f2a26'; ctx.fillRect(-400, -400, W + 800, H + 800);
  rr(ctx, W / 2 - 360, 70, 720, 70, 10); fillStroke(ctx, '#d6d2c8', INK, 4); rr(ctx, W / 2 - 300, 120, 600, 14, 4); fillStroke(ctx, '#3b3d42', INK, 3);
  const n = Math.floor(L / (o.every || 0.4)) + 1, amts = o.amounts || ['$ 20,000,000', '$ 35,000,000', '$ 19,990,000', '$ 25,000,000', '$ 30,000,000', '$ 18,000,000', '$ 40,000,000'];
  for (let i = Math.max(0, n - 6); i < n; i++) { const age = L - i * (o.every || 0.4), p = easeOut(clamp(age / 0.5)), y = 130 + p * (230 + (n - 1 - i) * 26) , r = (hash(i * 7) - 0.5) * 0.12;
    ctx.save(); ctx.translate(W / 2 + (hash(i * 3) - 0.5) * 120, y); ctx.rotate(r * p); rr(ctx, -280, 0, 560, 300, 4); fillStroke(ctx, '#fbf7ec', INK, 3);
    ctx.fillStyle = INK; ctx.font = '30px "Special Elite"'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillText('SWIFT  ·  PAYMENT ORDER', -250, 50);
    ctx.fillRect(-250, 64, 500, 3); ctx.font = '26px "Special Elite"'; ctx.fillText('FROM: BANGLADESH BANK', -250, 110); ctx.fillText('TO:   ' + (o.to ? o.to[i % o.to.length] : 'ACCOUNT ' + (1000 + Math.floor(hash(i) * 9000))), -250, 150);
    ctx.font = '44px "Lilita One"'; ctx.fillStyle = o.red ? RED : '#2b4f8a'; ctx.fillText(amts[i % amts.length], -250, 220); ctx.restore(); }
}

// ---------- New York: a stone fortress of a bank, at night ----------
export function fedBuilding(ctx, t, o = {}) {
  sky(ctx, '#0b1430', '#2a3a5e'); for (let i = 0; i < 70; i++) { ctx.fillStyle = `rgba(255,255,240,${0.3 + hash(i) * 0.5})`; ctx.fillRect(hash(i * 3) * W, hash(i * 7) * 420, 2, 2); }
  skyline(ctx, 19, FLOOR - 60, '#1c2740', 0.3);
  const x0 = 360, x1 = 1560, top = 40;
  ctx.beginPath(); ctx.rect(x0, top, x1 - x0, FLOOR - top); fillStroke(ctx, '#a99d86', INK, 4);
  ctx.strokeStyle = 'rgba(40,30,20,.35)'; ctx.lineWidth = 2; for (let y = top + 30, r = 0; y < FLOOR; y += 44, r++) { ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); for (let x = x0 + (r % 2) * 50; x < x1; x += 100) { ctx.beginPath(); ctx.moveTo(x, y - 44); ctx.lineTo(x, y); ctx.stroke(); } }
  for (let r = 0; r < 3; r++) for (let c = 0; c < 9; c++) { const wx = x0 + 70 + c * 126, wy = top + 70 + r * 170, lit = hash(r * 11 + c) < 0.4;
    ctx.beginPath(); ctx.moveTo(wx, wy + 110); ctx.lineTo(wx, wy + 40); ctx.arc(wx + 35, wy + 40, 35, Math.PI, 0); ctx.lineTo(wx + 70, wy + 110); ctx.closePath(); fillStroke(ctx, lit ? '#f2c66a' : '#26303f', INK, 3);
    if (lit) glowSpot(ctx, wx + 35, wy + 70, 70, 'rgba(255,200,110,.25)'); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(wx + 35, wy + 5); ctx.lineTo(wx + 35, wy + 110); ctx.stroke(); }
  rr(ctx, x0 - 10, top - 30, x1 - x0 + 20, 40, 4); fillStroke(ctx, '#8f846f', INK, 4);
  ctx.beginPath(); ctx.moveTo(870, FLOOR); ctx.lineTo(870, FLOOR - 170); ctx.arc(960, FLOOR - 170, 90, Math.PI, 0); ctx.lineTo(1050, FLOOR); ctx.closePath(); fillStroke(ctx, '#3a2a20', INK, 4);
  ctx.strokeStyle = '#1e1612'; ctx.lineWidth = 3; for (let x = 890; x < 1050; x += 26) { ctx.beginPath(); ctx.moveTo(x, FLOOR); ctx.lineTo(x, FLOOR - 200); ctx.stroke(); }
  [820, 1100].forEach(lx => { ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(lx, FLOOR - 140); ctx.lineTo(lx, FLOOR - 200); ctx.stroke(); rr(ctx, lx - 18, FLOOR - 250, 36, 50, 6); fillStroke(ctx, '#f6d27a', INK, 3); glowSpot(ctx, lx, FLOOR - 225, 90, 'rgba(255,210,120,.45)'); });
  // flag
  ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(1500, top - 30); ctx.lineTo(1500, top - 260); ctx.stroke();
  ctx.save(); ctx.translate(1500, top - 255); const wv = Math.sin(t * 3) * 6; for (let i = 0; i < 7; i++) { ctx.fillStyle = i % 2 ? '#f2ece0' : '#b8322a'; ctx.beginPath(); ctx.moveTo(0, i * 14); ctx.quadraticCurveTo(70, i * 14 + wv, 150, i * 14); ctx.lineTo(150, i * 14 + 14); ctx.quadraticCurveTo(70, i * 14 + 14 + wv, 0, i * 14 + 14); ctx.fill(); }
  ctx.fillStyle = '#2b3d6b'; ctx.fillRect(0, 0, 64, 56); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.strokeRect(0, 0, 150, 98); ctx.restore();
  ctx.fillStyle = '#2a2a30'; ctx.fillRect(-400, FLOOR, W + 800, 400); ctx.fillStyle = '#4a4a52'; ctx.fillRect(-400, FLOOR, W + 800, 60); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-400, FLOOR); ctx.lineTo(W + 400, FLOOR); ctx.stroke();
  [120, 1800].forEach(lx => { ctx.strokeStyle = INK; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(lx, FLOOR); ctx.lineTo(lx, FLOOR - 420); ctx.stroke(); ctx.beginPath(); ctx.arc(lx, FLOOR - 430, 26, 0, 7); fillStroke(ctx, '#f6e3a6', INK, 3); glowSpot(ctx, lx, FLOOR - 420, 220, 'rgba(255,220,140,.35)'); });
}

// ---------- the hackers: faceless figures from behind at glowing screens ----------
export function hackerDen(ctx, t, o = {}) {
  ctx.fillStyle = '#121725'; ctx.fillRect(-400, -400, W + 800, H + 800);
  ctx.fillStyle = 'rgba(255,255,255,.03)'; for (let x = -400; x < W + 400; x += 90) ctx.fillRect(x, -400, 4, FLOOR + 400);
  ctx.fillStyle = '#1a2030'; ctx.fillRect(-400, FLOOR - 40, W + 800, 500);
  const xs = o.xs || [450, 960, 1470];
  xs.forEach((x, i) => {
    [-170, 0, 170].forEach((dx, j) => { const mx = x + dx, my = 400 + (j === 1 ? -20 : 0); rr(ctx, mx - 95, my, 190, 140, 8); fillStroke(ctx, '#1d2230', '#05070b', 4);
      ctx.fillStyle = j === 1 ? '#0f3a2a' : '#0e2a40'; ctx.fillRect(mx - 84, my + 11, 168, 118);
      ctx.fillStyle = j === 1 ? 'rgba(90,255,160,.9)' : 'rgba(110,200,255,.85)'; for (let l = 0; l < 8; l++) { const w = 30 + hash(i * 50 + j * 9 + l + Math.floor(t * 5 + l * 0.3)) * 120; ctx.fillRect(mx - 76, my + 20 + l * 13, w, 6); }
      rr(ctx, mx - 10, my + 140, 20, 40, 2); fillStroke(ctx, '#1d2230', '#05070b', 2);
      glowSpot(ctx, mx, my + 70, 260, j === 1 ? 'rgba(80,255,160,.22)' : 'rgba(90,180,255,.2)'); });
    rr(ctx, x - 300, 580, 600, 26, 4); fillStroke(ctx, '#2a3040', '#05070b', 3);
    const bob = Math.sin(t * 9 + i * 2) * 4; ctx.save(); ctx.translate(x, 760 + bob);
    ctx.beginPath(); ctx.moveTo(-170, 320); ctx.quadraticCurveTo(-160, 40, 0, 30); ctx.quadraticCurveTo(160, 40, 170, 320); ctx.closePath(); fillStroke(ctx, '#2a3042', '#05070b', 5);
    ctx.beginPath(); ctx.moveTo(-70, 60); ctx.quadraticCurveTo(0, 110, 70, 60); ctx.strokeStyle = '#3a4258'; ctx.lineWidth = 6; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, -30, 84, 92, 0, 0, 7); fillStroke(ctx, '#2f3649', '#05070b', 5);
    ctx.strokeStyle = i === 1 ? 'rgba(110,255,170,.75)' : 'rgba(130,210,255,.75)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(0, -30, 82, 90, 0, Math.PI * 1.12, Math.PI * 1.88); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-160, 120); ctx.quadraticCurveTo(-150, 50, -40, 34); ctx.stroke(); ctx.beginPath(); ctx.moveTo(160, 120); ctx.quadraticCurveTo(150, 50, 40, 34); ctx.stroke();
    ctx.restore();
  });
}

// ---------- three things the robbers never needed, crossed out ----------
export function iconsCrossed(ctx, t, L, at = [0.3, 0.8, 1.3], labels = ['DOOR', 'VAULT', 'GUN']) {
  ctx.fillStyle = '#e8dcc0'; ctx.fillRect(-400, -400, W + 800, H + 800); ctx.fillStyle = 'rgba(0,0,0,.05)'; for (let y = 0; y < H; y += 54) ctx.fillRect(0, y, W, 2);
  const icon = [
    (c) => { rr(c, -90, -150, 180, 300, 6); fillStroke(c, '#8a5a3a', INK, 5); rr(c, -66, -126, 132, 110, 4); fillStroke(c, '#a06a46', INK, 3); rr(c, -66, 4, 132, 110, 4); fillStroke(c, '#a06a46', INK, 3); c.beginPath(); c.arc(56, 10, 12, 0, 7); fillStroke(c, YEL, INK, 3); },
    (c) => { rr(c, -150, -130, 300, 260, 16); fillStroke(c, '#7f8a96', INK, 5); c.beginPath(); c.arc(0, 0, 78, 0, 7); fillStroke(c, '#a9b2bc', INK, 5); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + L; c.strokeStyle = INK; c.lineWidth = 6; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * 60, Math.sin(a) * 60); c.stroke(); } c.beginPath(); c.arc(0, 0, 16, 0, 7); fillStroke(c, '#5b646e', INK, 3); },
    (c) => { c.save(); c.rotate(-0.1); rr(c, -150, -60, 260, 70, 10); fillStroke(c, '#4a4d55', INK, 5); c.beginPath(); c.moveTo(60, 0); c.lineTo(110, 0); c.lineTo(140, 120); c.lineTo(80, 130); c.closePath(); fillStroke(c, '#6b4a34', INK, 5); c.beginPath(); c.arc(40, 30, 30, 0, Math.PI); c.strokeStyle = INK; c.lineWidth = 6; c.stroke(); c.restore(); },
  ];
  [480, 960, 1440].forEach((x, i) => { const p = easeOut(clamp((L - Math.min(at[i] - 0.5, 0.1 + i * 0.3)) / 0.3)); ctx.save(); ctx.translate(x, 500); ctx.scale(0.7 + 0.3 * p, 0.7 + 0.3 * p); ctx.globalAlpha = clamp(p * 2);
    rr(ctx, -200, -240, 400, 480, 14); fillStroke(ctx, '#f6efdd', INK, 4); icon[i](ctx);
    ctx.fillStyle = INK; ctx.font = '900 44px "Nunito"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(labels[i], 0, 200);
    const cx = clamp((L - at[i]) / 0.25); if (cx > 0) { ctx.strokeStyle = RED; ctx.lineWidth = 22; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-150, -170); ctx.lineTo(-150 + 300 * Math.min(1, cx * 2), -170 + 300 * Math.min(1, cx * 2)); ctx.stroke();
      if (cx > 0.5) { const y = (cx - 0.5) * 2; ctx.beginPath(); ctx.moveTo(150, -170); ctx.lineTo(150 - 300 * y, -170 + 300 * y); ctx.stroke(); } }
    ctx.restore(); });
}

// ---------- big money counter ----------
export function moneyCounter(ctx, t, L, o = {}) {
  ctx.fillStyle = o.bg || '#2f2a26'; ctx.fillRect(-400, -400, W + 800, H + 800);
  const p = easeOut(clamp((L - (o.at || 0)) / (o.dur || 2))), v = Math.round((o.to || 0) * p / 1e6) * 1e6;
  // a stack of notes growing
  const n = Math.floor(p * 18); for (let i = 0; i < n; i++) { const x = W / 2 - 330 + (i % 6) * 110, y = 880 - Math.floor(i / 6) * 70; ctx.save(); ctx.translate(x, y); ctx.rotate((hash(i) - 0.5) * 0.1); rr(ctx, -50, -30, 100, 60, 6); fillStroke(ctx, '#7fa36a', INK, 3); ctx.fillStyle = '#5c7f4c'; ctx.fillRect(-36, -18, 72, 36); ctx.fillStyle = '#e9f2d8'; ctx.font = '28px "Lilita One"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('$', 0, 2); ctx.restore(); }
  textOutlined(ctx, '$' + v.toLocaleString('en-US'), W / 2, 420, { size: 150, fill: o.color || YEL, lw: 16 });
  if (o.label) textOutlined(ctx, o.label, W / 2, 230, { size: 64, fill: '#f6efdd', lw: 10 });
}

// ---------- a thought / speech bubble ----------
export function bubble(ctx, x, y, text, k, o = {}) {
  const p = easeOut(clamp(k / 0.25)); if (p <= 0 || (o.dur && k > o.dur)) return; ctx.save(); ctx.translate(x, y); ctx.scale(p, p);
  ctx.font = `${o.size || 40}px "Lilita One"`; const w = Math.max(160, ctx.measureText(text).width + 70), h = (o.size || 40) + 50;
  if (o.think) { [[-w * 0.3, h * 0.75, 14], [-w * 0.38, h * 1.05, 9]].forEach(([a, b, r]) => { ctx.beginPath(); ctx.arc(a, b, r, 0, 7); fillStroke(ctx, '#fbf7ec', INK, 3); }); }
  else { ctx.beginPath(); ctx.moveTo(-w * 0.2, h / 2 - 4); ctx.lineTo(-w * 0.32, h / 2 + 40); ctx.lineTo(-w * 0.05, h / 2 - 4); fillStroke(ctx, '#fbf7ec', INK, 3); }
  rr(ctx, -w / 2, -h / 2, w, h, h / 2); fillStroke(ctx, '#fbf7ec', INK, 4);
  ctx.fillStyle = o.color || INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 0, 3); ctx.restore();
}

// ---------- wall calendar card ----------
export function calendarCard(ctx, t, L, month, big, o = {}) {
  ctx.fillStyle = o.bg || '#2f2a26'; ctx.fillRect(-400, -400, W + 800, H + 800);
  const p = easeOut(clamp(L / 0.4)); ctx.save(); ctx.translate(W / 2, H / 2 + (1 - p) * 60); ctx.globalAlpha = p;
  rr(ctx, -250, -300, 500, 600, 8); fillStroke(ctx, '#efe6d2', INK, 4); rr(ctx, -250, -300, 500, 130, 8); fillStroke(ctx, RED, INK, 4);
  rr(ctx, -260, -330, 520, 40, 6); fillStroke(ctx, '#5a3f2c', INK, 3); [-120, 120].forEach(x => { rr(ctx, x - 8, -350, 16, 60, 6); fillStroke(ctx, '#b9b2a0', INK, 3); });
  ctx.fillStyle = '#f6efdd'; ctx.font = (month.length > 10 ? '58px' : '74px') + ' "Lilita One"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(month, 0, -232);
  ctx.fillStyle = INK; ctx.font = (big.length > 4 ? '110px' : '150px') + ' "Lilita One"'; ctx.fillText(big, 0, -50);
  if (o.sub) { ctx.font = '900 40px "Nunito"'; ctx.fillStyle = '#5a5048'; ctx.fillText(o.sub, 0, 60); }
  if (o.stamp && L > o.stamp.at) { const s = clamp((L - o.stamp.at) / 0.18); ctx.save(); ctx.translate(0, 170); ctx.rotate(-0.18); ctx.scale(2 - s, 2 - s); ctx.globalAlpha = s;
    rr(ctx, -200, -55, 400, 110, 10); ctx.strokeStyle = RED; ctx.lineWidth = 10; ctx.stroke(); ctx.fillStyle = RED; ctx.font = '76px "Lilita One"'; ctx.fillText(o.stamp.text, 0, 4); ctx.restore(); }
  if (o.cross) { const n = Math.floor(L * (o.cross || 8)); for (let i = 0; i < Math.min(n, 24); i++) { const r = Math.floor(i / 6), c = i % 6; ctx.strokeStyle = RED; ctx.lineWidth = 5; const x = -210 + c * 72, y = 100 + r * 46; ctx.beginPath(); ctx.moveTo(x + 8, y + 6); ctx.lineTo(x + 52, y + 34); ctx.moveTo(x + 52, y + 6); ctx.lineTo(x + 8, y + 34); ctx.stroke(); } }
  ctx.restore();
}
