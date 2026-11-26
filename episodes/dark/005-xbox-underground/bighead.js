// Big-head 2.5D card characters (our own design, made for george's 26 Nov reference look):
// an oversized round pearly-white head on a small rounded body, thin ink limbs, round hands.
// drawBighead(ctx, W, H, spec, pose, expr, t) draws a full-height character; feet stand on y = H - 18.
// spec: { top, top2, topType: hoodie|tee|suit|uniform|jacket|sweater, legs, shoe, hair, hairStyle: none|short|messy|curly|bun|side|long,
//         hat: none|beanie|cap|police, hatCol, glasses, beard, tie, badge, hood (hood up), skin }
// pose: { walk (steps, 0 = still), sit 0..1, armL/armR: [shoulder, elbow] radians (0 = down, + = outward/up),
//         talk 0..1, blink, lean, look (-1..1 eyes left/right), carry (both hands forward), cuffed, bob, back (seen from behind) }
// expr: neutral|smug|happy|worried|shocked|angry|focused|sleepy|sad
const INK = '#1b1520';
const PEARL = '#f6f0e6', PEARL_S = '#e4d6c3', PEARL_R = '#ffd9cf';

function rr(x, cx, cy, w, h, r) { x.beginPath(); x.roundRect(cx - w / 2, cy - h / 2, w, h, r); }
function ell(x, cx, cy, rx, ry, fill, lw = 0, rot = 0) { x.beginPath(); x.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2); if (fill) { x.fillStyle = fill; x.fill(); } if (lw) { x.lineWidth = lw; x.strokeStyle = INK; x.stroke(); } }
function limb(x, pts, w, col) {
  x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); x.moveTo(pts[0][0], pts[0][1]);
  if (pts.length === 3) x.quadraticCurveTo(pts[1][0], pts[1][1], pts[2][0], pts[2][1]); else for (const p of pts.slice(1)) x.lineTo(p[0], p[1]);
  x.strokeStyle = INK; x.lineWidth = w + 9; x.stroke(); if (col) { x.strokeStyle = col; x.lineWidth = w; x.stroke(); }
}
function shoe(x, fx, fy, dir, col) { x.save(); x.translate(fx, fy); x.scale(dir, 1); rr(x, 8, -13, 50, 26, 13); x.fillStyle = col; x.fill(); x.lineWidth = 6; x.strokeStyle = INK; x.stroke();
  x.fillStyle = 'rgba(255,255,255,0.35)'; rr(x, 8, -4, 44, 6, 3); x.fill(); x.restore(); }

export function drawBighead(x, W, H, S, P = {}, expr = 'neutral', t = 0) {
  x.clearRect(0, 0, W, H);
  x.save(); x.scale(W / 512, H / 768);
  const skin = S.skin || PEARL;
  const walk = P.walk || 0, ph = walk * Math.PI, sw = walk ? Math.sin(ph) : 0, bob = walk ? Math.abs(Math.cos(ph)) * 8 : (P.bob || 0);
  const sit = P.sit || 0, back = !!P.back;
  const FEET = 750;
  const hipY = (sit ? 600 : 640) - bob, bodyTop = hipY - 175, cx = 256 + (P.lean || 0) * 40;
  const headR = 148, headCy = bodyTop - 118 + (P.nod || 0) * 10;
  x.translate(cx - 256, 0);
  // ---- legs
  const legC = S.legs || '#3a3f55', shoeC = S.shoe || '#22202a';
  if (sit) {
    for (const s of [-1, 1]) { const hx = 256 + s * 38; limb(x, [[hx, hipY - 8], [hx + s * 6, hipY + 50], [hx + s * 4, FEET - 30]], 24, legC); shoe(x, hx + s * 4, FEET - 6, s, shoeC); }
  } else {
    for (const s of [-1, 1]) { const hx = 256 + s * 36, a = s * sw * 0.42, fx = hx + Math.sin(a) * 115, fy = Math.min(FEET, hipY + Math.cos(a) * 115) - (walk && s * sw > 0.2 ? 10 * s * sw : 0);
      limb(x, [[hx, hipY - 10], [fx, fy - 18]], 26, legC); shoe(x, fx, fy, s, shoeC); }
  }
  // ---- arms (drawn behind the body when hanging, in front when carrying)
  const shY = bodyTop + 46, shX = 80;
  const arm = (s, ang) => { const a0 = ang ? ang[0] : 0.12, a1 = ang ? ang[1] : 0.1; const sx = 256 + s * shX;
    const ex = sx + s * Math.sin(a0) * 72, ey = shY + Math.cos(a0) * 72, hx = ex + s * Math.sin(a0 + a1) * 70, hy = ey + Math.cos(a0 + a1) * 70;
    return [[sx, shY], [ex, ey], [hx, hy]]; };
  let aL = P.armL, aR = P.armR; if (P.carry) { aL = [0.35, -1.2]; aR = [0.35, -1.2]; } if (P.cuffed) { aL = [0.05, -0.9]; aR = [0.05, -0.9]; }
  if (walk && !P.carry && !P.cuffed) { aL = aL || [0.1 + sw * 0.35, 0.15]; aR = aR || [0.1 - sw * 0.35, 0.15]; }
  const topC = S.top || '#3b6fd6', topC2 = S.top2 || shadeC(topC, -0.18);
  const armPts = { L: arm(-1, aL), R: arm(1, aR) };
  const front = P.carry || P.cuffed;
  const drawArm = (k) => { const p = armPts[k]; limb(x, p, 22, S.sleeveless ? skin : topC); ell(x, p[2][0], p[2][1], 22, 22, skin, 6); };
  if (!front) { drawArm('L'); drawArm('R'); }
  // ---- body: a rounded bean, wider at the hips
  x.beginPath(); const bw = 98, bwTop = 84;
  x.moveTo(256 - bwTop, bodyTop + 40); x.quadraticCurveTo(256 - bwTop, bodyTop, 256, bodyTop - 4); x.quadraticCurveTo(256 + bwTop, bodyTop, 256 + bwTop, bodyTop + 40);
  x.lineTo(256 + bw, hipY - 30); x.quadraticCurveTo(256 + bw, hipY + 8, 256 + bw - 34, hipY + 8); x.lineTo(256 - bw + 34, hipY + 8); x.quadraticCurveTo(256 - bw, hipY + 8, 256 - bw, hipY - 30); x.closePath();
  const bodyPath = new Path2D(); bodyPath.moveTo(0, 0);
  x.fillStyle = topC; x.fill(); x.save(); x.clip();
  x.fillStyle = topC2; x.beginPath(); x.ellipse(256 + 120, hipY - 60, 90, 220, 0, 0, 7); x.fill(); // side shade
  const ty = S.topType || 'tee';
  if (!back) {
    if (ty === 'hoodie') { x.fillStyle = topC2; rr(x, 256, hipY - 52, 120, 60, 18); x.fill(); x.strokeStyle = 'rgba(0,0,0,0.25)'; x.lineWidth = 4; x.stroke();
      x.strokeStyle = '#f2efe8'; x.lineWidth = 5; for (const s of [-1, 1]) { x.beginPath(); x.moveTo(256 + s * 18, bodyTop + 10); x.lineTo(256 + s * 22, bodyTop + 70); x.stroke(); } }
    if (ty === 'suit' || ty === 'uniform' || ty === 'jacket') { x.fillStyle = S.shirt || '#f4f1ea'; x.beginPath(); x.moveTo(256 - 36, bodyTop); x.lineTo(256, bodyTop + 92); x.lineTo(256 + 36, bodyTop); x.closePath(); x.fill();
      if (S.tie) { x.fillStyle = S.tie; x.beginPath(); x.moveTo(256 - 9, bodyTop + 8); x.lineTo(256 + 9, bodyTop + 8); x.lineTo(256 + 13, bodyTop + 74); x.lineTo(256, bodyTop + 90); x.lineTo(256 - 13, bodyTop + 74); x.closePath(); x.fill(); }
      x.strokeStyle = INK; x.lineWidth = 5; x.beginPath(); x.moveTo(256 - 38, bodyTop - 2); x.lineTo(256, bodyTop + 96); x.lineTo(256 + 38, bodyTop - 2); x.stroke();
      x.beginPath(); x.moveTo(256, bodyTop + 96); x.lineTo(256, hipY + 8); x.stroke();
      for (const yy of [bodyTop + 120, bodyTop + 150]) ell(x, 256 + 10, yy, 6, 6, '#1b1520'); }
    if (ty === 'uniform' && S.badge) { ell(x, 256 - 50, bodyTop + 58, 15, 17, '#f4c542', 4); }
    if (ty === 'uniform') { x.fillStyle = '#1b1520'; x.fillRect(256 - bw, hipY - 40, bw * 2, 16); x.fillStyle = '#c9a23a'; x.fillRect(256 - 12, hipY - 42, 24, 20); }
    if (ty === 'sweater') { x.strokeStyle = topC2; x.lineWidth = 8; for (let yy = bodyTop + 40; yy < hipY; yy += 34) { x.beginPath(); x.moveTo(256 - bw, yy); x.lineTo(256 + bw, yy); x.stroke(); } }
    if (ty === 'tee' && S.print) { ell(x, 256, bodyTop + 80, 34, 34, S.print); x.fillStyle = topC; x.font = '900 40px sans-serif'; x.textAlign = 'center'; x.fillText(S.printTxt || '', 256, bodyTop + 94); }
    if (S.lanyard) { x.strokeStyle = S.lanyard; x.lineWidth = 6; x.beginPath(); x.moveTo(256 - 30, bodyTop); x.lineTo(256, bodyTop + 80); x.lineTo(256 + 30, bodyTop); x.stroke(); x.fillStyle = '#ffffff'; rr(x, 256, bodyTop + 100, 40, 50, 6); x.fill(); x.lineWidth = 3; x.strokeStyle = INK; x.stroke(); x.fillStyle = '#3b6fd6'; x.fillRect(256 - 14, bodyTop + 84, 28, 14); }
  }
  x.restore();
  x.lineWidth = 7; x.strokeStyle = INK; x.beginPath();
  x.moveTo(256 - bwTop, bodyTop + 40); x.quadraticCurveTo(256 - bwTop, bodyTop, 256, bodyTop - 4); x.quadraticCurveTo(256 + bwTop, bodyTop, 256 + bwTop, bodyTop + 40);
  x.lineTo(256 + bw, hipY - 30); x.quadraticCurveTo(256 + bw, hipY + 8, 256 + bw - 34, hipY + 8); x.lineTo(256 - bw + 34, hipY + 8); x.quadraticCurveTo(256 - bw, hipY + 8, 256 - bw, hipY - 30); x.closePath(); x.stroke();
  if (front) { drawArm('L'); drawArm('R'); if (P.cuffed) { ell(x, 256, armPts.L[2][1], 34, 12, '#9aa3b5', 5); } }
  // ---- hood behind the head
  if (S.hood && !back) { ell(x, 256, headCy + 14, headR + 20, headR + 14, topC, 7); }
  // ---- head
  const hx = 256 + (P.tilt || 0) * 10, hy = headCy;
  const g = x.createRadialGradient(hx - 50, hy - 60, 20, hx, hy, headR * 1.05); g.addColorStop(0, '#fffdf8'); g.addColorStop(0.55, skin); g.addColorStop(1, PEARL_S);
  ell(x, hx, hy, headR, headR * 0.96, g, 7);
  if (back) { hair(x, S, hx, hy, headR, true); hat(x, S, hx, hy, headR); x.restore(); return; }
  if (S.hood) { x.save(); x.beginPath(); x.ellipse(hx, hy, headR, headR * 0.96, 0, 0, 7); x.clip(); x.strokeStyle = topC; x.lineWidth = 40; x.beginPath(); x.ellipse(hx, hy + 6, headR + 6, headR + 2, 0, 0, 7); x.stroke(); x.restore(); ell(x, hx, hy + 6, headR - 12, headR * 0.96 - 8, null, 5); }
  // cheeks
  ell(x, hx - 78, hy + 40, 24, 13, 'rgba(255,170,160,0.28)'); ell(x, hx + 78, hy + 40, 24, 13, 'rgba(255,170,160,0.28)');
  hair(x, S, hx, hy, headR, false);
  face(x, S, hx, hy, P, expr, t);
  hat(x, S, hx, hy, headR);
  x.restore();
}

function shadeC(hex, k) { const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255; const f = v => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k))); return `rgb(${f(r)},${f(g)},${f(b)})`; }

function hair(x, S, hx, hy, R, back) {
  const st = S.hairStyle || 'none', c = S.hair || '#3a2a20'; if (st === 'none') return;
  x.save(); x.beginPath(); x.ellipse(hx, hy, R, R * 0.96, 0, 0, 7); x.clip(); x.fillStyle = c;
  if (back) { x.fillRect(hx - R, hy - R, 2 * R, R * (st === 'long' ? 2 : 1.3)); }
  else if (st === 'short') { x.beginPath(); x.ellipse(hx, hy - R * 0.62, R * 1.05, R * 0.5, 0, 0, 7); x.fill(); x.beginPath(); x.ellipse(hx + R * 0.3, hy - R * 0.25, R * 0.55, R * 0.18, -0.25, 0, 7); x.fill(); }
  else if (st === 'messy') { for (let i = -5; i <= 5; i++) { x.beginPath(); x.ellipse(hx + i * R * 0.19, hy - R * 0.58 + Math.abs(i) * 3, R * 0.17, R * 0.34, i * 0.12, 0, 7); x.fill(); } x.beginPath(); x.ellipse(hx, hy - R * 0.72, R, R * 0.38, 0, 0, 7); x.fill(); }
  else if (st === 'curly') { for (let i = 0; i < 16; i++) { const a = Math.PI + i / 15 * Math.PI; x.beginPath(); x.arc(hx + Math.cos(a) * R * 0.95, hy + Math.sin(a) * R * 0.85 - 4, R * 0.2, 0, 7); x.fill(); } x.beginPath(); x.ellipse(hx, hy - R * 0.7, R * 0.95, R * 0.4, 0, 0, 7); x.fill(); }
  else if (st === 'side') { x.beginPath(); x.ellipse(hx - R * 0.1, hy - R * 0.66, R * 1.05, R * 0.45, 0.12, 0, 7); x.fill(); x.beginPath(); x.ellipse(hx - R * 0.55, hy - R * 0.3, R * 0.5, R * 0.2, 0.5, 0, 7); x.fill(); }
  else if (st === 'bun' || st === 'long') { x.beginPath(); x.ellipse(hx, hy - R * 0.62, R * 1.05, R * 0.5, 0, 0, 7); x.fill(); if (st === 'long') { x.fillRect(hx - R, hy - R * 0.5, R * 0.3, R * 1.5); x.fillRect(hx + R * 0.7, hy - R * 0.5, R * 0.3, R * 1.5); } }
  x.restore();
  if (st === 'bun' && !back) { ell(x, hx, hy - R * 1.02, R * 0.3, R * 0.24, c, 6); }
  // ink line under the hairline
  x.save(); x.beginPath(); x.ellipse(hx, hy, R, R * 0.96, 0, 0, 7); x.clip(); x.restore();
  ell(x, hx, hy, R, R * 0.96, null, 7);
}

function hat(x, S, hx, hy, R) {
  const h = S.hat || 'none', c = S.hatCol || '#c8323c'; if (h === 'none') return;
  if (h === 'beanie') { x.beginPath(); x.ellipse(hx, hy - R * 0.45, R * 1.02, R * 0.62, 0, Math.PI, 0); x.closePath(); x.fillStyle = c; x.fill(); x.lineWidth = 7; x.strokeStyle = INK; x.stroke();
    rr(x, hx, hy - R * 0.45, R * 2.1, 46, 20); x.fillStyle = shadeC(c, -0.15); x.fill(); x.stroke(); }
  if (h === 'cap' || h === 'police') { x.beginPath(); x.ellipse(hx, hy - R * 0.5, R * 0.98, R * 0.55, 0, Math.PI, 0); x.closePath(); x.fillStyle = c; x.fill(); x.lineWidth = 7; x.strokeStyle = INK; x.stroke();
    x.beginPath(); x.ellipse(hx + (h === 'cap' ? R * 0.35 : 0), hy - R * 0.48, R * (h === 'cap' ? 0.75 : 1.08), 20, 0, 0, Math.PI); x.fillStyle = h === 'police' ? '#16151c' : shadeC(c, -0.2); x.fill(); x.stroke();
    if (h === 'police') { ell(x, hx, hy - R * 0.72, 17, 19, '#f4c542', 4); } }
}

function face(x, S, hx, hy, P, expr, t) {
  const ey = hy + 6, ex = 52, look = (P.look || 0) * 9;
  const blink = P.blink || expr === 'sleepy';
  const lid = { smug: 0.5, focused: 0.38, sleepy: 0.9, angry: 0.3, sad: 0.25, worried: 0.1 }[expr] || 0;
  for (const s of [-1, 1]) {
    const cx = hx + s * ex;
    if (S.glasses) { ell(x, cx, ey, 38, 34, 'rgba(255,255,255,0.35)', 6); }
    if (blink) { x.strokeStyle = INK; x.lineWidth = 7; x.lineCap = 'round'; x.beginPath(); x.moveTo(cx - 16, ey + 2); x.quadraticCurveTo(cx, ey + 10, cx + 16, ey + 2); x.stroke(); }
    else {
      const ry = expr === 'shocked' ? 23 : 19, rx = expr === 'shocked' ? 15 : 13;
      if (expr === 'shocked' || expr === 'worried') ell(x, cx, ey, rx + 9, ry + 8, '#ffffff', 5);
      ell(x, cx + look, ey + 2, rx, ry, INK); ell(x, cx + look - 4, ey - 6, 4.5, 5.5, '#ffffff');
      if (lid > 0) { x.save(); x.beginPath(); x.ellipse(cx + look, ey + 2, rx + 3, ry + 3, 0, 0, 7); x.clip(); x.fillStyle = S.skin || PEARL; x.fillRect(cx - 30, ey - ry - 4, 60, (2 * ry + 6) * lid); x.restore();
        x.strokeStyle = INK; x.lineWidth = 6; x.lineCap = 'round'; const ly = ey - ry - 2 + (2 * ry + 6) * lid; x.beginPath(); x.moveTo(cx + look - rx - 4, ly + (expr === 'angry' ? -s * 4 : 0)); x.lineTo(cx + look + rx + 4, ly + (expr === 'angry' ? s * 4 : 0)); x.stroke(); }
    }
    // brows
    const bt = { angry: 0.45, worried: -0.4, sad: -0.35, shocked: -0.1, smug: s > 0 ? 0.15 : -0.15, focused: 0.25 }[expr] || 0;
    const by = ey - 44 - (expr === 'shocked' ? 12 : 0) - (expr === 'worried' ? 4 : 0);
    x.save(); x.translate(cx, by); x.rotate(s * bt); x.fillStyle = S.brow || S.hair && S.hairStyle !== 'none' ? (S.brow || S.hair) : '#6a5444'; rr(x, 0, 0, 44, 11, 6); x.fill(); x.restore();
  }
  // nose
  x.strokeStyle = 'rgba(90,60,50,0.55)'; x.lineWidth = 5; x.lineCap = 'round'; x.beginPath(); x.moveTo(hx + 2, ey + 22); x.quadraticCurveTo(hx + 12, ey + 34, hx + 2, ey + 40); x.stroke();
  // beard
  if (S.beard) { x.save(); x.beginPath(); x.ellipse(hx, hy, 148, 142, 0, 0, 7); x.clip(); x.fillStyle = S.beard; x.beginPath(); x.ellipse(hx, hy + 120, 120, 70, 0, 0, 7); x.fill(); x.restore(); }
  // mouth
  const my = ey + 64, talk = P.talk ? Math.max(0, Math.sin(t * 22) * 0.5 + 0.5) * P.talk : 0;
  x.strokeStyle = INK; x.lineWidth = 7; x.lineCap = 'round';
  if (expr === 'shocked' || talk > 0.15) { const o = expr === 'shocked' ? 1 : talk; ell(x, hx, my + 4, 16 + o * 4, 8 + o * 14, '#5a1f2a', 6); }
  else if (expr === 'happy') { x.beginPath(); x.moveTo(hx - 30, my - 4); x.quadraticCurveTo(hx, my + 26, hx + 30, my - 4); x.closePath(); x.fillStyle = '#5a1f2a'; x.fill(); x.stroke(); }
  else if (expr === 'smug') { x.beginPath(); x.moveTo(hx - 22, my + 4); x.quadraticCurveTo(hx + 4, my + 12, hx + 26, my - 6); x.stroke(); }
  else if (expr === 'worried' || expr === 'sad') { x.beginPath(); x.moveTo(hx - 22, my + 8); x.quadraticCurveTo(hx, my - 6, hx + 22, my + 8); x.stroke(); }
  else if (expr === 'angry') { x.beginPath(); x.moveTo(hx - 22, my + 6); x.lineTo(hx + 22, my + 6); x.stroke(); }
  else { x.beginPath(); x.moveTo(hx - 16, my + 2); x.quadraticCurveTo(hx, my + 8, hx + 16, my + 2); x.stroke(); }
}
