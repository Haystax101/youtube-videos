// Sets and paper inserts for the Case File look. Every function draws in world space (1920x1080 at zoom 1),
// straight vector each frame so push-ins stay sharp. opts.k = shot progress 0..1, t = global time.
import { W, H, INK, YEL, RED, PAPER, PAPER_SH, rr, fillStroke, shade, mix, clamp, lerp, ease, easeOut, hash, rng, textOutlined, cached, noiseTile } from './engine.js';

const FLOOR = 840;   // feet line for characters in side-on sets

// ---------- shared pieces ----------
function sky(ctx, top, bot, y0 = 0, y1 = FLOOR) { const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, top); g.addColorStop(1, bot); ctx.fillStyle = g; ctx.fillRect(-400, y0 - 400, W + 800, y1 - y0 + 400); }
function stars(ctx, n, seed, maxY, t) { const r = rng(seed); for (let i = 0; i < n; i++) { const x = r() * (W + 400) - 200, y = r() * maxY, a = 0.3 + 0.5 * Math.abs(Math.sin(t * (0.5 + r()) + i)); ctx.fillStyle = `rgba(255,250,230,${a})`; ctx.fillRect(x, y, 2, 2); } }
export function glowSpot(ctx, x, y, r, color, a = 1) { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.save(); ctx.globalAlpha = a; ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore(); }
function palm(ctx, x, y, h, s = 1, sway = 0, col = '#1f3b33') {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(-9, 0); ctx.quadraticCurveTo(-4 + sway * 0.3, -h * 0.5, 6 + sway, -h); ctx.lineTo(16 + sway, -h); ctx.quadraticCurveTo(8 + sway * .3, -h * .5, 9, 0); ctx.closePath(); fillStroke(ctx, '#4a3b2e', INK, 3);
  for (let i = 0; i < 12; i++) { ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 2; ctx.beginPath(); const yy = -h * i / 12; ctx.moveTo(-7 + sway * i / 12, yy); ctx.lineTo(9 + sway * i / 12, yy - 4); ctx.stroke(); }
  ctx.translate(11 + sway, -h);
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI / 2 + (i - 3) * 0.5 + Math.sin(sway * 0.05 + i) * 0.04, L = 120 + (i % 2) * 30;
    ctx.save(); ctx.rotate(a);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(L * .5, -26, L, 18); ctx.quadraticCurveTo(L * .5, 6, 0, 0); fillStroke(ctx, i % 2 ? col : shade(col, 1.18), INK, 2.5);
    ctx.restore();
  }
  ctx.restore();
}
function streetLamp(ctx, x, y, h, t, on = 1) {
  ctx.fillStyle = '#2b2d31'; ctx.fillRect(x - 5, y - h, 10, h); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.strokeRect(x - 5, y - h, 10, h);
  ctx.beginPath(); ctx.moveTo(x, y - h); ctx.quadraticCurveTo(x + 10, y - h - 30, x + 60, y - h - 26); ctx.lineWidth = 8; ctx.strokeStyle = '#2b2d31'; ctx.stroke();
  rr(ctx, x + 40, y - h - 30, 50, 16, 5); fillStroke(ctx, '#3a3c40', INK, 2.5);
  if (on) {
    const fl = 0.92 + 0.08 * Math.sin(t * 23) * Math.sin(t * 7);
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    const cone = ctx.createLinearGradient(0, y - h, 0, y); cone.addColorStop(0, `rgba(255,190,110,${0.38 * fl})`); cone.addColorStop(1, 'rgba(255,170,90,0.04)');
    ctx.fillStyle = cone; ctx.beginPath(); ctx.moveTo(x + 45, y - h - 16); ctx.lineTo(x + 85, y - h - 16); ctx.lineTo(x + 230, y + 10); ctx.lineTo(x - 100, y + 10); ctx.closePath(); ctx.fill(); ctx.restore();
    glowSpot(ctx, x + 65, y - h - 18, 70, `rgba(255,210,140,${0.9 * fl})`);
    ctx.fillStyle = '#ffe2a8'; rr(ctx, x + 46, y - h - 18, 38, 6, 3); ctx.fill();
  }
}
function cityline(ctx, y, seed, col, winCol, t, scale = 1) {
  const r = rng(seed); let x = -300;
  while (x < W + 300) {
    const w = (80 + r() * 160) * scale, h = (120 + r() * 380) * scale;
    ctx.fillStyle = col; ctx.fillRect(x, y - h, w, h + 2);
    if (r() > 0.6) { ctx.fillRect(x + w * 0.4, y - h - 30 * scale, 4, 30 * scale); }
    for (let wy = y - h + 14 * scale; wy < y - 10; wy += 22 * scale) for (let wx = x + 10 * scale; wx < x + w - 12 * scale; wx += 20 * scale) {
      const hv = hash(wx * 0.37 + wy * 1.7 + seed); if (hv > 0.72) { ctx.fillStyle = hv > 0.93 ? 'rgba(160,220,255,.55)' : winCol; ctx.fillRect(wx, wy, 8 * scale, 10 * scale); }
    }
    x += w + r() * 20;
  }
}
function brickWall(ctx, x, y, w, h, base, seed = 3) {
  ctx.fillStyle = base; ctx.fillRect(x, y, w, h);
  const r = rng(seed); ctx.strokeStyle = 'rgba(0,0,0,.16)'; ctx.lineWidth = 2;
  for (let yy = y, row = 0; yy < y + h; yy += 26, row++) {
    ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + w, yy); ctx.stroke();
    for (let xx = x + (row % 2) * 30; xx < x + w; xx += 60) { ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx, yy + 26); ctx.stroke(); if (r() > .8) { ctx.fillStyle = 'rgba(0,0,0,.06)'; ctx.fillRect(xx, yy, 60, 26); } }
  }
}

// ---------- SET: Bangkok villa at night (exterior, gate) ----------
// opts: crash 0..1 (car into gate), gateOpen 0..1, dawn 0..1
export function villaNight(ctx, t, o = {}) {
  const dawn = o.dawn ?? 0.15;
  sky(ctx, mix('#0e1730', '#2a3150', dawn), mix('#24304d', '#a8786a', dawn));
  stars(ctx, 90, 7, 420, t);
  // far city (Bangkok towers)
  cityline(ctx, 560, 11, '#1b2440', 'rgba(255,200,120,.55)', t, 1.0);
  ctx.fillStyle = 'rgba(30,40,70,.35)'; ctx.fillRect(-400, 380, W + 800, 200);
  cityline(ctx, 600, 23, '#202a45', 'rgba(255,190,110,.6)', t, 0.7);
  // neighbour roofs and trees behind wall
  palm(ctx, 160, 640, 300, 1, Math.sin(t * .8) * 4, '#1a332c');
  palm(ctx, 1760, 640, 340, 1.1, Math.sin(t * .7 + 1) * 4, '#1a332c');
  // villa house behind the wall
  ctx.fillStyle = '#e9e0cf'; ctx.fillRect(560, 330, 840, 330); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.strokeRect(560, 330, 840, 330);
  ctx.fillStyle = 'rgba(20,30,60,.35)'; ctx.fillRect(560, 330, 840, 330);   // night tint
  // roof (Thai-style double pitch)
  ctx.beginPath(); ctx.moveTo(520, 340); ctx.lineTo(980, 190); ctx.lineTo(1440, 340); ctx.closePath(); fillStroke(ctx, '#7a3b2c', INK, 3);
  ctx.beginPath(); ctx.moveTo(760, 260); ctx.lineTo(980, 150); ctx.lineTo(1200, 260); ctx.closePath(); fillStroke(ctx, '#8d4532', INK, 3);
  ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 2; for (let i = 1; i < 8; i++) { ctx.beginPath(); ctx.moveTo(520 + i * 57, 340 - i * 0); ctx.lineTo(980, 190); ctx.stroke(); }
  // windows: one lit upstairs (his office)
  const win = (x, y, lit, glow = 'cyan') => {
    rr(ctx, x, y, 120, 150, 4); fillStroke(ctx, lit ? (glow === 'cyan' ? '#8fd6e8' : '#f6c77a') : '#2a3150', INK, 3);
    ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + 60, y); ctx.lineTo(x + 60, y + 150); ctx.moveTo(x, y + 75); ctx.lineTo(x + 120, y + 75); ctx.stroke();
    if (lit) glowSpot(ctx, x + 60, y + 75, 170, glow === 'cyan' ? 'rgba(120,210,240,.55)' : 'rgba(255,190,110,.5)', 0.8 + 0.2 * Math.sin(t * 9) * Math.sin(t * 3.3));
  };
  win(640, 370, false); win(860, 370, true, 'cyan'); win(1080, 370, false); win(1260, 370, true, 'warm');
  // front wall + gate
  const wallTop = 600;
  ctx.fillStyle = '#d8ccb4'; ctx.fillRect(-300, wallTop, 2520, FLOOR - wallTop); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.strokeRect(-300, wallTop, 2520, FLOOR - wallTop);
  ctx.fillStyle = 'rgba(18,26,52,.42)'; ctx.fillRect(-300, wallTop, 2520, FLOOR - wallTop);
  ctx.fillStyle = '#bfb196'; ctx.fillRect(-300, wallTop - 18, 2520, 18); ctx.strokeRect(-300, wallTop - 18, 2520, 18);
  for (let x = -300; x < 2220; x += 140) { ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.moveTo(x, wallTop); ctx.lineTo(x, FLOOR); ctx.stroke(); }
  // gate posts and sliding metal gate
  const gx0 = 760, gx1 = 1220, crash = o.crash ?? 0;
  [gx0 - 40, gx1].forEach(px => { rr(ctx, px, wallTop - 70, 40, FLOOR - wallTop + 70, 3); fillStroke(ctx, '#cbbfa6', INK, 3); ctx.fillStyle = 'rgba(18,26,52,.4)'; ctx.fillRect(px, wallTop - 70, 40, FLOOR - wallTop + 70); rr(ctx, px - 8, wallTop - 86, 56, 18, 3); fillStroke(ctx, '#bfb196', INK, 3); glowSpot(ctx, px + 20, wallTop - 100, 50, 'rgba(255,200,130,.7)'); ctx.fillStyle = '#ffe3b0'; ctx.beginPath(); ctx.arc(px + 20, wallTop - 98, 8, 0, 7); ctx.fill(); });
  const dent = ease(crash) * 26, gs = (o.gateOpen ?? 0) * 420;
  ctx.save(); ctx.beginPath(); ctx.rect(gx0, 0, gx1 - gx0, H); ctx.clip();
  ctx.fillStyle = '#2d3440';
  for (let x = gx0 + gs; x < gx1 + gs; x += 22) {
    const bendK = clamp(1 - Math.abs(x - gs - 900) / 120), y0 = wallTop - 40, dx = bendK * dent;
    ctx.beginPath(); ctx.moveTo(x, y0); ctx.quadraticCurveTo(x + dx * 1.4, (y0 + FLOOR) / 2 + 60, x + dx * .3, FLOOR - 6); ctx.lineWidth = 7; ctx.strokeStyle = '#2d3440'; ctx.stroke();
    ctx.lineWidth = 2; ctx.strokeStyle = INK; ctx.stroke();
  }
  ctx.lineWidth = 9; ctx.strokeStyle = '#2d3440'; [wallTop - 30, wallTop + 60, FLOOR - 30].forEach((y, i) => { ctx.beginPath(); ctx.moveTo(gx0 + gs, y); for (let x = gx0 + gs; x <= gx1 + gs; x += 20) { const bendK = clamp(1 - Math.abs(x - gs - 900) / 120); ctx.lineTo(x + bendK * dent * (i === 1 ? 1.2 : .6), y + bendK * dent * .2); } ctx.stroke(); });
  ctx.restore();
  // pavement + road
  ctx.fillStyle = '#5b5a5c'; ctx.fillRect(-300, FLOOR, 2520, 40); ctx.fillStyle = '#3c3d42'; ctx.fillRect(-300, FLOOR + 40, 2520, 400);
  ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-300, FLOOR); ctx.lineTo(2220, FLOOR); ctx.moveTo(-300, FLOOR + 40); ctx.lineTo(2220, FLOOR + 40); ctx.stroke();
  ctx.fillStyle = 'rgba(240,220,160,.5)'; for (let x = -200; x < 2200; x += 220) ctx.fillRect(x, FLOOR + 150, 110, 10);
  streetLamp(ctx, 380, FLOOR, 360, t);
  streetLamp(ctx, 1560, FLOOR, 360, t + 3);
  // little shrine (spirit house) at the corner: Thai detail
  const sx = 1420, sy = FLOOR;
  ctx.fillStyle = '#ccb37a'; ctx.fillRect(sx + 26, sy - 120, 10, 120); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.strokeRect(sx + 26, sy - 120, 10, 120);
  rr(ctx, sx - 4, sy - 170, 70, 52, 3); fillStroke(ctx, '#e6c46a', INK, 2.5);
  ctx.beginPath(); ctx.moveTo(sx - 14, sy - 168); ctx.lineTo(sx + 31, sy - 206); ctx.lineTo(sx + 76, sy - 168); ctx.closePath(); fillStroke(ctx, '#b2402e', INK, 2.5);
  glowSpot(ctx, sx + 31, sy - 140, 46, 'rgba(255,190,90,.8)');
}

// a car (side-on) — x = rear, faces right. opts.color, lights, crumple 0..1
export function car(ctx, x, y, t, o = {}) {
  const col = o.color || '#c9c3b6', cr = o.crumple || 0, L = 420 - cr * 26;
  ctx.save(); ctx.translate(x, y); if (o.flip) { ctx.translate(L, 0); ctx.scale(-1, 1); }
  if (o.sport) { sportCar(ctx, t, o); ctx.restore(); return; }
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(L / 2, 4, L / 2 + 20, 14, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.moveTo(10, -40); ctx.lineTo(0, -88); ctx.lineTo(30, -100); ctx.lineTo(110, -108); ctx.lineTo(160, -168); ctx.lineTo(300, -170); ctx.lineTo(350, -112);
  ctx.lineTo(L - 10, -100 + cr * 8); ctx.lineTo(L, -70 + cr * 10); ctx.lineTo(L - 6 - cr * 8, -36); ctx.closePath(); fillStroke(ctx, col, INK, 3.5);
  ctx.fillStyle = 'rgba(0,0,0,.14)'; ctx.fillRect(0, -70, L, 30);
  ctx.beginPath(); ctx.moveTo(170, -158); ctx.lineTo(228, -158); ctx.lineTo(228, -112); ctx.lineTo(128, -112); ctx.closePath(); fillStroke(ctx, '#3d5a6e', INK, 3);
  ctx.beginPath(); ctx.moveTo(240, -158); ctx.lineTo(296, -158); ctx.lineTo(334, -112); ctx.lineTo(240, -112); ctx.closePath(); fillStroke(ctx, '#3d5a6e', INK, 3);
  ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(186, -150); ctx.lineTo(160, -120); ctx.stroke();
  [90, L - 100].forEach(wx => { ctx.beginPath(); ctx.arc(wx, -34, 34, 0, 7); fillStroke(ctx, '#1c1c1e', INK, 3); ctx.beginPath(); ctx.arc(wx, -34, 15, 0, 7); fillStroke(ctx, '#8f8f95', INK, 2); });
  if (o.lights !== false) { ctx.fillStyle = '#fff1c4'; rr(ctx, L - 22, -96, 18, 16, 4); ctx.fill(); glowSpot(ctx, L, -88, 120, 'rgba(255,240,190,.55)'); }
  ctx.fillStyle = '#c3352b'; rr(ctx, 2, -92, 12, 16, 3); ctx.fill();
  if (cr > 0.2) { ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(L - 60, -98); ctx.lineTo(L - 44, -84); ctx.lineTo(L - 58, -70); ctx.lineTo(L - 40, -56); ctx.stroke(); }
  if (o.siren) { const on = Math.floor(t * 4) % 2; rr(ctx, 210, -186, 60, 16, 4); fillStroke(ctx, on ? '#e04a3c' : '#3b6fd6', INK, 2.5); glowSpot(ctx, 240, -180, 160, on ? 'rgba(230,70,60,.55)' : 'rgba(70,120,240,.55)'); }
  ctx.restore();
}

function sportCar(ctx, t, o) {
  const col = o.color || '#e9b23a';
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(220, 4, 240, 14, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(4, -78); ctx.lineTo(120, -96); ctx.lineTo(200, -138); ctx.lineTo(290, -136); ctx.lineTo(440, -70); ctx.lineTo(446, -34); ctx.closePath(); fillStroke(ctx, col, INK, 3.5);
  ctx.beginPath(); ctx.moveTo(206, -130); ctx.lineTo(282, -128); ctx.lineTo(350, -96); ctx.lineTo(150, -96); ctx.closePath(); fillStroke(ctx, '#2d3a44', INK, 3);
  ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(120, -60); ctx.lineTo(380, -60); ctx.stroke();
  ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(10, -54, 430, 22);
  [96, 352].forEach(wx => { ctx.beginPath(); ctx.arc(wx, -30, 32, 0, 7); fillStroke(ctx, '#1c1c1e', INK, 3); ctx.beginPath(); ctx.arc(wx, -30, 16, 0, 7); fillStroke(ctx, '#c9c9cf', INK, 2); });
  ctx.fillStyle = '#fff1c4'; rr(ctx, 420, -72, 20, 10, 4); ctx.fill();
}

// ---------- SET: the boss's room at night (laptop on a desk, screen glow) ----------
export function hackerRoom(ctx, t, o = {}) {
  // back wall: deep teal with cold falloff
  const g = ctx.createLinearGradient(0, 0, 0, FLOOR); g.addColorStop(0, '#1d2e3a'); g.addColorStop(1, '#2c4450'); ctx.fillStyle = g; ctx.fillRect(-300, -300, 2520, FLOOR + 300);
  // wainscot panels
  ctx.fillStyle = '#213640'; ctx.fillRect(-300, 600, 2520, FLOOR - 600); ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 3;
  for (let x = -260; x < 2200; x += 210) { rr(ctx, x, 625, 170, 190, 4); ctx.stroke(); }
  ctx.fillStyle = '#2c3c44'; ctx.fillRect(-300, 594, 2520, 12);
  // window with blinds, city lights behind
  const wx = 1240, wy = 170, ww = 470, wh = 360;
  ctx.save(); ctx.beginPath(); ctx.rect(wx, wy, ww, wh); ctx.clip();
  sky(ctx, '#0c1428', '#2d3557', wy, wy + wh); cityline(ctx, wy + wh + 10, 5, '#151d35', 'rgba(255,200,120,.7)', t, 0.8);
  for (let y = wy; y < wy + wh; y += 26) { ctx.fillStyle = 'rgba(190,200,210,.75)'; ctx.fillRect(wx, y, ww, 13); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(wx, y + 11, ww, 2); }
  ctx.restore();
  rr(ctx, wx - 14, wy - 14, ww + 28, wh + 28, 4); ctx.lineWidth = 14; ctx.strokeStyle = '#3a4a52'; ctx.stroke(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke(); ctx.strokeRect(wx, wy, ww, wh);
  ctx.fillStyle = '#3a4a52'; ctx.fillRect(wx - 30, wy + wh + 12, ww + 60, 18); ctx.strokeRect(wx - 30, wy + wh + 12, ww + 60, 18);
  // shelf with boxes and a server tower humming
  ctx.fillStyle = '#4a3a30'; ctx.fillRect(160, 300, 420, 16); ctx.strokeStyle = INK; ctx.strokeRect(160, 300, 420, 16);
  [[180, 70, '#6e5a44'], [262, 90, '#8a6b49'], [366, 60, '#c0a575'], [444, 110, '#2d4a5a']].forEach(([x, h, c]) => { rr(ctx, x, 300 - h, 70, h, 3); fillStroke(ctx, c, INK, 2.5); });
  // server rack (blinking leds)
  rr(ctx, 120, 470, 180, 370, 6); fillStroke(ctx, '#1c2328', INK, 3);
  for (let i = 0; i < 7; i++) { rr(ctx, 136, 490 + i * 48, 148, 36, 3); fillStroke(ctx, '#283138', INK, 2); for (let j = 0; j < 4; j++) { const on = hash(i * 9 + j + Math.floor(t * (3 + j))) > .45; ctx.fillStyle = on ? (j % 2 ? '#5fe08a' : '#ffb347') : '#3a4448'; ctx.fillRect(150 + j * 14, 504 + i * 48, 7, 7); } }
  glowSpot(ctx, 210, 640, 160, 'rgba(90,220,140,.12)');
  // poster (generic world map) on wall
  rr(ctx, 620, 150, 300, 200, 3); fillStroke(ctx, '#cfc3a5', INK, 3); ctx.fillStyle = 'rgba(20,30,50,.4)'; ctx.fillRect(620, 150, 300, 200);
  ctx.fillStyle = '#7d8f75'; [[650, 190, 80, 50], [740, 180, 60, 90], [820, 200, 70, 60], [850, 280, 40, 30]].forEach(([x, y, w, h]) => { rr(ctx, x, y, w, h, 18); ctx.fill(); });
  // floor
  ctx.fillStyle = '#2a2523'; ctx.fillRect(-300, FLOOR, 2520, 400); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-300, FLOOR); ctx.lineTo(2220, FLOOR); ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,.3)'; for (let x = -300; x < 2220; x += 120) { ctx.beginPath(); ctx.moveTo(x, FLOOR); ctx.lineTo(x - 80, H + 100); ctx.stroke(); }
  // warm desk lamp pool far right (so the room is not just blue)
  glowSpot(ctx, 1560, 640, 260, 'rgba(255,170,90,.22)');
}
// the desk drawn in front of the character (hides the legs, like a podium)
export function desk(ctx, x, t, o = {}) {
  const y = FLOOR, w = o.w || 520, top = y - 130;
  // laptop on desk (screen faces the character, we see its back + glow)
  const lx = x + (o.laptopX ?? 120);
  ctx.beginPath(); ctx.moveTo(lx - 6, top + 4); ctx.lineTo(lx + 8, top + 4); ctx.lineTo(lx + 40, top - 140); ctx.lineTo(lx + 26, top - 142); ctx.closePath(); fillStroke(ctx, '#9aa1a8', INK, 3);
  ctx.fillStyle = '#c7ccd1'; ctx.beginPath(); ctx.arc(lx + 22, top - 70, 7, 0, 7); ctx.fill();
  glowSpot(ctx, lx - 50, top - 70, 200, 'rgba(110,220,255,.45)', 0.85 + 0.15 * Math.sin(t * 11) * Math.sin(t * 2.3));
  rr(ctx, lx - 130, top - 4, 146, 8, 3); fillStroke(ctx, '#8a9198', INK, 2.5);
  // mug, papers, phone
  rr(ctx, x + 380, top - 40, 40, 40, 6); fillStroke(ctx, '#b2402e', INK, 3); ctx.beginPath(); ctx.arc(x + 424, top - 20, 11, -1.3, 1.3); ctx.lineWidth = 5; ctx.strokeStyle = '#b2402e'; ctx.stroke();
  rr(ctx, x + 440, top - 6, 50, 6, 2); fillStroke(ctx, '#1d1f22', INK, 2);
  rr(ctx, x + 290, top - 7, 80, 7, 1); fillStroke(ctx, '#eee6d4', INK, 2);
  // desk body
  rr(ctx, x, top, w, 26, 4); fillStroke(ctx, '#5a4334', INK, 3.5);
  rr(ctx, x + 20, top + 26, w - 40, 104, 4); fillStroke(ctx, '#4a372b', INK, 3.5);
  ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 3; rr(ctx, x + 50, top + 44, w - 100, 34, 4); ctx.stroke(); rr(ctx, x + 50, top + 86, w - 100, 34, 4); ctx.stroke();
  ctx.fillStyle = '#c9a65a'; [top + 61, top + 103].forEach(yy => { ctx.beginPath(); ctx.arc(x + w / 2, yy, 5, 0, 7); ctx.fill(); });
  // the screen glow also lights the desk top
  ctx.save(); ctx.globalCompositeOperation = 'screen'; const g = ctx.createRadialGradient(lx - 40, top, 0, lx - 40, top, 260); g.addColorStop(0, 'rgba(110,220,255,.25)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(x, top, w, 26); ctx.restore();
}

// ---------- INSERT: corkboard ----------
// cards: [{ x, y, w, h, kind: 'q'|'note'|'photo', title, sub, color, rot, at (seconds into shot when pinned), x0 }]
// strings: [[i, j, at]] red thread between cards
export function corkboard(ctx, t, o = {}) {
  const k = o.local || 0;
  ctx.fillStyle = '#3a2a22'; ctx.fillRect(-300, -300, 2520, 1680);
  rr(ctx, 40, 40, W - 80, H - 80, 10); fillStroke(ctx, '#5b3f2b', INK, 4);
  ctx.fillStyle = '#b08a5a'; ctx.fillRect(80, 80, W - 160, H - 160);
  // cork grain
  const r = rng(77); for (let i = 0; i < 2600; i++) { ctx.fillStyle = r() > .5 ? 'rgba(90,60,30,.25)' : 'rgba(230,200,150,.18)'; ctx.fillRect(80 + r() * (W - 160), 80 + r() * (H - 160), 2 + r() * 3, 2 + r() * 3); }
  ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.strokeRect(80, 80, W - 160, H - 160);
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(80, 80, W - 160, 14); ctx.fillRect(80, 80, 14, H - 160);
  if (o.title) pinPaper(ctx, W / 2, 175, 560, 110, -0.015, () => { ctx.fillStyle = INK; ctx.font = '62px "Caveat"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(o.title, 0, 6); });
  const cards = o.cards || [];
  // strings under pins
  (o.strings || []).forEach(([a, b, at]) => { const A = cards[a], B = cards[b]; if (!A || !B) return; const p = clamp((k - at) / 0.6); if (p <= 0) return;
    ctx.strokeStyle = '#b3261e'; ctx.lineWidth = 4; ctx.beginPath(); const x1 = A.x, y1 = A.y - A.h / 2 + 18, x2 = lerp(x1, B.x, p), y2 = lerp(y1, B.y - B.h / 2 + 18, p); ctx.moveTo(x1, y1); ctx.quadraticCurveTo((x1 + x2) / 2, Math.max(y1, y2) + 40, x2, y2); ctx.stroke(); });
  cards.forEach((c, i) => {
    const p = clamp((k - (c.at || 0)) / 0.35); if (p <= 0) return;
    const sc = 1.25 - 0.25 * easeOut(p), a = clamp(p * 2);
    ctx.save(); ctx.globalAlpha = a; ctx.translate(c.x, c.y); ctx.scale(sc, sc); ctx.translate(-c.x, -c.y);
    const flip = c.flipAt != null ? clamp((k - c.flipAt) / 0.4) : 0;
    pinPaper(ctx, c.x, c.y, c.w || 220, c.h || 240, c.rot || 0, () => drawCard(ctx, flip > 0.5 ? (c.back || c) : c, c.w || 220, c.h || 240, t), c.color || (c.kind === 'q' ? '#3f5878' : PAPER), Math.abs(Math.cos(flip * Math.PI)));
    if (c.stamp && k > c.stamp.at) { const sp = clamp((k - c.stamp.at) / 0.25); ctx.save(); ctx.translate(c.x + 10, c.y + 30); ctx.rotate(-0.18); ctx.scale(1.6 - .6 * sp, 1.6 - .6 * sp); ctx.globalAlpha = sp * .9; ctx.strokeStyle = RED; ctx.lineWidth = 6; rr(ctx, -95, -32, 190, 64, 6); ctx.stroke(); ctx.fillStyle = RED; ctx.font = '50px "Lilita One"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(c.stamp.text, 0, 3); ctx.restore(); }
    ctx.restore();
  });
}
function pinPaper(ctx, x, y, w, h, rot, inner, color = PAPER, sx = 1) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(Math.max(0.02, sx), 1);
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(-w / 2 + 8, -h / 2 + 10, w, h);
  ctx.beginPath(); ctx.rect(-w / 2, -h / 2, w, h); fillStroke(ctx, color, INK, 3);
  ctx.save(); ctx.beginPath(); ctx.rect(-w / 2, -h / 2, w, h); ctx.clip(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = .5; ctx.drawImage(cached('ppr', 256, 256, (g) => { g.fillStyle = '#fff'; g.fillRect(0, 0, 256, 256); const r = rng(5); for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(120,100,70,${r() * .12})`; g.fillRect(r() * 256, r() * 256, 2, 2); } }), -w / 2, -h / 2, w, h); ctx.restore();
  inner();
  ctx.restore();
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.beginPath(); ctx.arc(0, -h / 2 + 18, 11, 0, 7); fillStroke(ctx, '#c7342a', INK, 2.5); ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.arc(-3, -h / 2 + 15, 3.5, 0, 7); ctx.fill();
  ctx.restore();
}
function drawCard(ctx, c, w, h, t) {
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (c.kind === 'q') { textOutlined(ctx, '?', 0, 6, { size: 130, fill: '#efe6d2', stroke: 'rgba(0,0,0,0)', lw: 0, shadow: false }); return; }
  if (c.icon) c.icon(ctx, 0, -h * 0.12, t);
  ctx.fillStyle = INK; ctx.font = '700 40px "Caveat"'; (c.title || '').split('\n').forEach((ln, i, a) => ctx.fillText(ln, 0, h * 0.22 + (i - (a.length - 1) / 2) * 38));
  if (c.sub) { ctx.font = '30px "Caveat"'; ctx.fillStyle = '#6b5a4a'; ctx.fillText(c.sub, 0, h * 0.40); }
}

// ---------- INSERT: document on a desk ----------
// lines: [{ text, hl: [from, to] char range highlighted, at }], circle: { line, from, to, at }
export function documentInsert(ctx, t, o = {}) {
  const k = o.local || 0;
  // dark wood desk
  ctx.fillStyle = '#3b2a21'; ctx.fillRect(-300, -300, 2520, 1680);
  for (let i = 0; i < 26; i++) { ctx.strokeStyle = `rgba(0,0,0,${0.12 + hash(i) * .12})`; ctx.lineWidth = 2 + hash(i * 3) * 4; ctx.beginPath(); const y = i * 46 + hash(i) * 20; ctx.moveTo(-300, y); ctx.bezierCurveTo(400, y + 20, 1200, y - 25, 2220, y + 10); ctx.stroke(); }
  const w = o.w || 1100, h = o.h || 620, x = W / 2 - w / 2, y = H / 2 - h / 2 + 10;
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(o.rot ?? -0.012); ctx.translate(-W / 2, -H / 2);
  ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(x + 14, y + 18, w, h);
  ctx.beginPath(); ctx.rect(x, y, w, h); fillStroke(ctx, '#f2ead8', INK, 3);
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = .7; ctx.drawImage(cached('docp', 512, 300, (g) => { g.fillStyle = '#fff'; g.fillRect(0, 0, 512, 300); const r = rng(9); for (let i = 0; i < 60; i++) { const xx = r() * 512, yy = r() * 300, rad = 10 + r() * 60; const gr = g.createRadialGradient(xx, yy, 0, xx, yy, rad); gr.addColorStop(0, 'rgba(160,130,80,.12)'); gr.addColorStop(1, 'rgba(160,130,80,0)'); g.fillStyle = gr; g.fillRect(xx - rad, yy - rad, rad * 2, rad * 2); } }), x, y, w, h); ctx.restore();
  if (o.header) { ctx.fillStyle = '#7a6a58'; ctx.font = '30px "Special Elite"'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillText(o.header, x + 60, y + 70); ctx.fillRect(x + 60, y + 88, w - 120, 2); }
  (o.lines || []).forEach((L, i) => {
    const ly = y + 160 + i * 64, chars = L.text.length, shown = L.at == null ? chars : Math.floor(clamp((k - L.at) / (L.type ?? 0.9)) * chars);
    ctx.font = `${L.size || 38}px "Special Elite"`; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    if (L.hl) { const p = clamp((k - L.hl[2]) / 0.5); if (p > 0) { const a = ctx.measureText(L.text.slice(0, L.hl[0])).width, b = ctx.measureText(L.text.slice(0, L.hl[1])).width; ctx.fillStyle = 'rgba(255,214,60,.75)'; ctx.save(); ctx.translate(x + 60 + a, ly - 34); ctx.rotate(-0.006); rr(ctx, -6, 0, (b - a + 12) * easeOut(p), 46, 4); ctx.fill(); ctx.restore(); } }
    ctx.fillStyle = L.color || '#2b2622'; ctx.fillText(L.text.slice(0, shown), x + 60, ly);
    if (L.circle) { const p = clamp((k - L.circle[2]) / 0.6); if (p > 0) { const a = ctx.measureText(L.text.slice(0, L.circle[0])).width, b = ctx.measureText(L.text.slice(0, L.circle[1])).width, cx = x + 60 + (a + b) / 2, rx = (b - a) / 2 + 26; ctx.strokeStyle = RED; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(cx, ly - 12, rx, 38, -0.03, -1.7, -1.7 + p * Math.PI * 2.1); ctx.stroke(); } }
  });
  if (o.source) { ctx.fillStyle = '#7a6a58'; ctx.font = '22px "Special Elite"'; ctx.textAlign = 'right'; ctx.fillText(o.source, x + w - 40, y + h - 30); }
  ctx.restore();
  // red pencil lying on the desk
  ctx.save(); ctx.translate(1560, 940); ctx.rotate(-0.5); rr(ctx, 0, 0, 300, 18, 4); fillStroke(ctx, '#b2302a', INK, 2.5); ctx.beginPath(); ctx.moveTo(300, 0); ctx.lineTo(336, 9); ctx.lineTo(300, 18); ctx.closePath(); fillStroke(ctx, '#e6c79a', INK, 2.5); ctx.restore();
}

// ---------- INSERT: map ----------
let WORLD = null;
const VIVID = ['#f2c86b', '#e8936a', '#9fcf7a', '#f4e3a1', '#d9a3c7', '#86c5a8', '#f0b27a', '#c8d77a', '#e7a9a0'];
export async function loadWorld(url) {
  WORLD = await (await fetch(url)).json();
  // rings that cross the date line (Russia, Fiji) jump from +180 to -180 and draw a bar across the whole map:
  // unwrap them so they run past +180 instead (Antarctica is left alone; it sits below the -80 clamp)
  for (const f of WORLD) for (const poly of f.c) for (const ring of poly) {
    let jump = false; for (let i = 1; i < ring.length; i++) if (Math.abs(ring[i][0] - ring[i - 1][0]) > 180) jump = true;
    if (jump && Math.min(...ring.map(p => p[1])) > -60) for (const p of ring) if (p[0] < 0) p[0] += 360;
  }
  for (const f of WORLD) { let a = 1e9, b = 1e9, c = -1e9, d = -1e9; for (const poly of f.c) for (const ring of poly) for (const [x, y] of ring) { a = Math.min(a, x); b = Math.min(b, y); c = Math.max(c, x); d = Math.max(d, y); } f.bb = [a, b, c, d]; }
}
// view: { lon, lat, span (degrees of longitude across the screen) }, interpolated by caller.
// o.highlight: { 'Thailand': '#d98b4a' }, o.routes: [{ from:[lon,lat], to:[lon,lat], at, dur, color }], o.pins: [{ at:[lon,lat], label, t0 }]
export function mapInsert(ctx, t, o = {}) {
  const v = o.view, k = o.local || 0, s = W / v.span;
  const P = ([lon, lat]) => { const y = Math.log(Math.tan(Math.PI / 4 + clamp(lat, -80, 84) * Math.PI / 360)), y0 = Math.log(Math.tan(Math.PI / 4 + v.lat * Math.PI / 360)); return [W / 2 + (lon - v.lon) * s, H / 2 - (y - y0) * 180 / Math.PI * s]; };
  const VIV = o.vivid;   // vivid: bright sea, every country its own colour (george 28 Nov: Both Wars maps are more colourful)
  ctx.fillStyle = VIV ? '#3f8fbf' : '#7fa3a6'; ctx.fillRect(-300, -300, 2520, 1680);
  if (VIV) { const g = ctx.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, 1200); g.addColorStop(0, 'rgba(120,200,230,.35)'); g.addColorStop(1, 'rgba(10,40,80,.25)'); ctx.fillStyle = g; ctx.fillRect(-300, -300, 2520, 1680); }
  // ocean texture lines
  ctx.strokeStyle = VIV ? 'rgba(255,255,255,.08)' : 'rgba(255,255,255,.06)'; ctx.lineWidth = 2; for (let i = 0; i < 30; i++) { ctx.beginPath(); ctx.moveTo(-300, i * 40); ctx.lineTo(2220, i * 40 + 20); ctx.stroke(); }
  if (!WORLD) return;
  const hl = o.highlight || {};
  // land with a soft offset shadow first
  for (const pass of [0, 1]) {
    for (const f of WORLD) {
      // cull by bounding box (never by vertices: a big country can cover the view with none of its points on screen)
      // draw each country at whichever 360-degree copies are on screen (unwrapped Russia also shows west of Alaska)
      for (const off of [-360, 0, 360]) {
      const [ax, ay] = P([f.bb[0] + off, f.bb[3]]), [bx, by] = P([f.bb[2] + off, f.bb[1]]);
      if (bx < -200 || ax > W + 200 || by < -200 || ay > H + 200) continue;
      ctx.beginPath();
      for (const poly of f.c) for (const ring of poly) {
        ring.forEach((pt, i) => { const [x, y] = P([pt[0] + off, pt[1]]); if (i === 0) ctx.moveTo(x + (pass ? 0 : 6), y + (pass ? 0 : 8)); else ctx.lineTo(x + (pass ? 0 : 6), y + (pass ? 0 : 8)); }); ctx.closePath();
      }
      if (!pass) { ctx.fillStyle = 'rgba(30,50,55,.35)'; ctx.fill(); continue; }
      const hk = hl[f.n]; ctx.fillStyle = hk ? hk : (o.dim && o.dim !== f.n ? '#d9cdb0' : '#e3d6b6');
      if (o.dimAll && !hk) ctx.fillStyle = '#c9bea4';
      if (VIV && !hk) { let hsh = 0; for (const ch of f.n) hsh = (hsh * 31 + ch.charCodeAt(0)) >>> 0; ctx.fillStyle = VIVID[hsh % VIVID.length]; if (o.dimAll) ctx.globalAlpha = 0.75; }
      ctx.fill(); ctx.globalAlpha = 1; ctx.strokeStyle = VIV ? 'rgba(40,35,30,.7)' : 'rgba(60,50,40,.55)'; ctx.lineWidth = VIV ? 2 : 1.6; ctx.stroke();
      }
    }
  }
  // coast ink
  ctx.globalCompositeOperation = 'source-over';
  (o.routes || []).forEach(R => {
    const p = clamp((k - R.at) / (R.dur || 1.5)); if (p <= 0) return;
    const A = P(R.from), B = P(R.to), mx = (A[0] + B[0]) / 2, my = Math.min(A[1], B[1]) - Math.hypot(B[0] - A[0], B[1] - A[1]) * 0.25;
    ctx.strokeStyle = R.color || '#b3261e'; ctx.lineWidth = 6; ctx.setLineDash([18, 12]); ctx.beginPath();
    const N = 60, n = Math.floor(N * easeOut(p)); for (let i = 0; i <= n; i++) { const q = i / N, x = (1 - q) * (1 - q) * A[0] + 2 * (1 - q) * q * mx + q * q * B[0], y = (1 - q) * (1 - q) * A[1] + 2 * (1 - q) * q * my + q * q * B[1]; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke(); ctx.setLineDash([]);
  });
  (o.pins || []).forEach(pn => {
    const p = clamp((k - (pn.t0 || 0)) / 0.3); if (p <= 0) return; const [x, y] = P(pn.at), sc = pn.t0 != null ? 0.6 + 0.4 * easeOut(p) : 1;
    ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc); ctx.globalAlpha = clamp(p * 2);
    ctx.beginPath(); ctx.arc(0, 0, 12, 0, 7); fillStroke(ctx, pn.color || RED, INK, 3); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, 4, 0, 7); ctx.fill();
    if (pn.label) textOutlined(ctx, pn.label, pn.dx || 0, pn.dy ?? -42, { size: 40, fill: '#f6efdd', lw: 8, font: 'Lilita One' });
    ctx.restore();
  });
}
