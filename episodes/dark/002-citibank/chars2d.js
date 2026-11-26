// Flat, face-to-camera cartoon characters for the office-toon look. Round bean bodies, big round heads,
// thick ink outlines, simple cel shadow on one side. Our own designs.
// drawChar(ctx, kind, pose, t) draws into a 512 x 768 canvas; feet stand on y = 750.
// pose: { sit, walk (phase, 0 = still), armL/armR: [shoulder, elbow] radians (0 = hanging down, + = outward/up),
//         expr: neutral|happy|delighted|shocked|angry|sleep|annoyed|smug, talk 0..1, blink, lean (rad), tip (hat tip 0..1),
//         sweat, zzz }
const INK = '#16121f';
export const KINDS = {
  darwin: { skin: '#f7c9a2', coat: '#2e2b3d', coat2: '#46425a', vest: '#c9a45c', shirt: '#fffaf0', legs: '#5d5a6b', shoe: '#1d1a26', hair: '#6b3e22', brows: '#5a321b', neck: 'cravat', hairStyle: 'darwin' },
  office: { skin: '#ffc49a', coat: '#fbf7ee', coat2: '#e3ddd0', shirt: '#fbf7ee', legs: '#2c3576', shoe: '#4a2c1c', hair: '#e2572b', brows: '#8a3414', neck: 'tie', tie: '#e3342f', hairStyle: 'quiff', glasses: true, shortSleeve: true },
  warren: { skin: '#f3c095', coat: '#8a4b25', coat2: '#a45d30', vest: '#e8c25a', shirt: '#fffaf0', legs: '#c8b79a', check: true, shoe: '#2a1a12', hair: '#3a2416', brows: '#3a2416', neck: 'bow', bow: '#d7263d', hairStyle: 'short', hat: 'stovepipe', beard: 'chin' },
  critic: { skin: '#f9bfa0', coat: '#5b3b8c', coat2: '#7450ab', vest: '#f2d15c', shirt: '#fffaf0', legs: '#3a3550', shoe: '#1d1a26', hair: '#eeeeee', brows: '#dddddd', neck: 'cravat', hairStyle: 'none', chops: '#f0f0f0', hat: 'tophat', hatCol: '#3b3b48', tache: 'walrus', monocle: true, cheeks: '#ff7d7d' },
  gent: { skin: '#f3c095', coat: '#2f7a5a', coat2: '#3f9a72', vest: '#d9d0bd', shirt: '#fffaf0', legs: '#6a5a48', shoe: '#2a1a12', hair: '#c2562a', brows: '#a8441f', neck: 'cravat', hairStyle: 'short', hat: 'bowler', beard: 'full' },
  lady: { skin: '#f6c8a5', dress: '#3c6fd1', dress2: '#5b8ae6', shawl: '#f2d15c', hair: '#5a321b', brows: '#5a321b', hairStyle: 'parted', bonnet: '#f4efe4', bonnetRibbon: '#d7263d', shoe: '#1d1a26' },
  lady2: { skin: '#c98a5e', dress: '#9b3a5a', dress2: '#bf4f74', shawl: '#fffaf0', hair: '#2a1a12', brows: '#2a1a12', hairStyle: 'parted', bonnet: '#f2d15c', bonnetRibbon: '#3c6fd1', shoe: '#1d1a26' },
  cowork1: { skin: '#c98a5e', coat: '#8b5cf6', coat2: '#a17cff', shirt: '#fffaf0', legs: '#2a2537', shoe: '#1d1a26', hair: '#2a1a12', brows: '#2a1a12', neck: 'none', hairStyle: 'bun', earrings: true },
  cazes: { skin: '#f2c39c', coat: '#2a2c38', coat2: '#3a3d4d', shirt: '#2a2c38', legs: '#1f2a44', shoe: '#e8e2d6', hair: '#2b1d16', brows: '#2b1d16', neck: 'hoodie', hairStyle: 'spiky', stubble: true },
  cazesRich: { skin: '#e9b48c', coat: '#f4efe4', coat2: '#ffffff', shirt: '#f4efe4', legs: '#c9b48e', shoe: '#5a3a22', hair: '#2b1d16', brows: '#2b1d16', neck: 'chain', hairStyle: 'spiky', stubble: true, shades: true, shortSleeve: true },
  agentM: { skin: '#e9b48c', coat: '#1d2a4a', coat2: '#2a3b66', shirt: '#1d2a4a', legs: '#2a2b33', shoe: '#14121a', hair: '#3a2a20', brows: '#3a2a20', neck: 'none', hairStyle: 'buzz', cap: '#1d2a4a', capText: 'FBI', vestText: 'FBI', jaw: true },
  agentF: { skin: '#c98a5e', coat: '#1d2a4a', coat2: '#2a3b66', shirt: '#1d2a4a', legs: '#2a2b33', shoe: '#14121a', hair: '#1a1418', brows: '#1a1418', neck: 'none', hairStyle: 'bun', vestText: 'FBI' },
  analyst: { skin: '#f3c095', coat: '#e7e1d4', coat2: '#ffffff', shirt: '#9fb8e8', legs: '#3a3550', shoe: '#2a1a12', hair: '#b8742e', brows: '#8a4a1a', neck: 'tie', tie: '#2f4f9e', hairStyle: 'short', glasses: true, shortSleeve: true },
  thaiCop: { skin: '#c48a5c', coat: '#7b5a32', coat2: '#93703f', shirt: '#7b5a32', legs: '#5e4424', shoe: '#14121a', hair: '#141016', brows: '#141016', neck: 'none', hairStyle: 'buzz', cap: '#3a2a1a', capText: '', badge: true },
  dutchCop: { skin: '#f6caa6', coat: '#1f2f5a', coat2: '#2c4180', shirt: '#1f2f5a', legs: '#1a1f33', shoe: '#14121a', hair: '#d9b25a', brows: '#a8822e', neck: 'none', hairStyle: 'short', cap: '#1f2f5a', capText: 'POLITIE', badge: true, stripe: '#f2a81d' },
  dutchCop2: { skin: '#a8714a', coat: '#1f2f5a', coat2: '#2c4180', shirt: '#1f2f5a', legs: '#1a1f33', shoe: '#14121a', hair: '#1a1418', brows: '#1a1418', neck: 'none', hairStyle: 'bun', badge: true, stripe: '#f2a81d', glasses: true },
  hoodA: { skin: '#d9a57f', coat: '#2b2540', coat2: '#3b3358', shirt: '#2b2540', legs: '#1a1824', shoe: '#2d2d36', hair: '#1a1418', brows: '#1a1418', neck: 'none', hairStyle: 'none', hood: true },
  hoodB: { skin: '#8d5a3b', coat: '#1f3a3a', coat2: '#2c5050', shirt: '#1f3a3a', legs: '#1a1824', shoe: '#e8e2d6', hair: '#1a1418', brows: '#1a1418', neck: 'none', hairStyle: 'none', hood: true, mask: '#e3342f' },
  hoodC: { skin: '#f2c39c', coat: '#4a1f3a', coat2: '#66294f', shirt: '#4a1f3a', legs: '#1a1824', shoe: '#2d2d36', hair: '#1a1418', brows: '#1a1418', neck: 'none', hairStyle: 'none', hood: true, shades: true },
  hoodCop: { skin: '#f6caa6', coat: '#2b2540', coat2: '#3b3358', shirt: '#2b2540', legs: '#1a1824', shoe: '#14121a', hair: '#d9b25a', brows: '#a8822e', neck: 'none', hairStyle: 'none', hood: true, cap: '#1f2f5a', capText: 'POLITIE' },
  admin: { skin: '#f6d0b0', coat: '#5a5f6e', coat2: '#6d7385', shirt: '#5a5f6e', legs: '#2a2b33', shoe: '#2d2d36', hair: '#7a5a3a', brows: '#5a3a22', neck: 'none', hairStyle: 'short', glasses: true },
  admin2: { skin: '#f2c39c', coat: '#3f5a3a', coat2: '#4f6f49', shirt: '#3f5a3a', legs: '#2a2b33', shoe: '#2d2d36', hair: '#c9a46a', brows: '#a8822e', neck: 'none', hairStyle: 'buzz', beard: 'short' },
  cowork2: { skin: '#8d5a3b', coat: '#1f9e8f', coat2: '#2cb8a6', shirt: '#1f9e8f', legs: '#3a3550', shoe: '#e8e2d6', hair: '#1a1418', brows: '#1a1418', neck: 'none', hairStyle: 'buzz', beard: 'short', shortSleeve: true },
  levin: { skin: '#f0c4a0', coat: '#5e4b3a', coat2: '#735d48', shirt: '#d9d4c4', legs: '#2e3346', shoe: '#2a1a12', hair: '#3a2a1e', brows: '#3a2a1e', neck: 'none', hairStyle: 'short', glasses: true },
  banker: { skin: '#f3c095', coat: '#2a2f45', coat2: '#3a4060', shirt: '#fffaf0', legs: '#2a2f45', shoe: '#14121a', hair: '#9a9aa2', brows: '#7a7a82', neck: 'tie', tie: '#c0302a', hairStyle: 'short' },
  banker2: { skin: '#c98a5e', coat: '#4a2f4a', coat2: '#5e3b5e', shirt: '#fffaf0', legs: '#2a2537', shoe: '#14121a', hair: '#1a1418', brows: '#1a1418', neck: 'none', hairStyle: 'bun', glasses: true, earrings: true },
  teller: { skin: '#f6caa6', coat: '#fbf7ee', coat2: '#e3ddd0', shirt: '#fbf7ee', legs: '#2c3576', shoe: '#2a1a12', hair: '#b8742e', brows: '#8a4a1a', neck: 'tie', tie: '#2f4f9e', hairStyle: 'quiff', shortSleeve: true },
  guard: { skin: '#a8714a', coat: '#3a4258', coat2: '#4a5470', shirt: '#3a4258', legs: '#23283a', shoe: '#14121a', hair: '#1a1418', brows: '#1a1418', neck: 'none', hairStyle: 'buzz', cap: '#23283a', capText: 'BANK', badge: true },
  courier: { skin: '#f2c39c', coat: '#9b2f3a', coat2: '#b8414c', shirt: '#9b2f3a', legs: '#2a2537', shoe: '#14121a', hair: '#d9b25a', brows: '#a8822e', neck: 'none', hairStyle: 'bun', earrings: true, shades: true },
  husband: { skin: '#f0c4a0', coat: '#3f4a3a', coat2: '#4f5c49', shirt: '#3f4a3a', legs: '#2a2b33', shoe: '#2a1a12', hair: '#5a3a22', brows: '#5a3a22', neck: 'none', hairStyle: 'short', beard: 'short' },
  agentM2: { skin: '#f3c095', coat: '#1d2a4a', coat2: '#2a3b66', shirt: '#1d2a4a', legs: '#2a2b33', shoe: '#14121a', hair: '#b8742e', brows: '#8a4a1a', neck: 'none', hairStyle: 'short', vestText: 'FBI', jaw: true },
  ruCop: { skin: '#f0c4a0', coat: '#4a5866', coat2: '#5a6a7a', shirt: '#4a5866', legs: '#2e3846', shoe: '#14121a', hair: '#6a4a2a', brows: '#5a3a22', neck: 'none', hairStyle: 'buzz', cap: '#3a4654', capText: '', badge: true, stripe: '#c0302a' },
  ruCop2: { skin: '#f6d0b0', coat: '#4a5866', coat2: '#5a6a7a', shirt: '#4a5866', legs: '#2e3846', shoe: '#14121a', hair: '#c9a46a', brows: '#a8822e', neck: 'none', hairStyle: 'short', badge: true, stripe: '#c0302a', tache: 'walrus' },
  det1: { skin: '#f6caa6', coat: '#8a7a5a', coat2: '#9c8b68', shirt: '#fffaf0', legs: '#3a3550', shoe: '#2a1a12', hair: '#7a5a3a', brows: '#5a3a22', neck: 'tie', tie: '#2a2a40', hairStyle: 'short' },
  det2: { skin: '#8d5a3b', coat: '#3a3a44', coat2: '#4a4a56', shirt: '#fffaf0', legs: '#2a2b33', shoe: '#14121a', hair: '#1a1418', brows: '#1a1418', neck: 'tie', tie: '#7a1f2b', hairStyle: 'buzz', glasses: true },
  judge: { skin: '#f3c095', coat: '#16141c', coat2: '#24222c', shirt: '#fffaf0', legs: '#16141c', shoe: '#14121a', hair: '#d8d8dc', brows: '#c8c8cc', neck: 'none', hairStyle: 'short', glasses: true },
  lord: { skin: '#f6d0b0', coat: '#7a1f2b', coat2: '#93303c', shirt: '#fffaf0', legs: '#16141c', shoe: '#14121a', hair: '#eeeeee', brows: '#dddddd', neck: 'cravat', hairStyle: 'none', chops: '#f0f0f0' },
  lawyer: { skin: '#e9b48c', coat: '#3a3550', coat2: '#4a4466', shirt: '#fffaf0', legs: '#3a3550', shoe: '#14121a', hair: '#2a1a12', brows: '#2a1a12', neck: 'tie', tie: '#2f6fe0', hairStyle: 'parted' },
  hacker1: { skin: '#f2c39c', coat: '#2a2420', coat2: '#3a322c', shirt: '#7a1f2b', legs: '#1f2a44', shoe: '#2d2d36', hair: '#1a1418', brows: '#1a1418', neck: 'none', hairStyle: 'spiky', stubble: true },
  hacker2: { skin: '#f6d0b0', coat: '#3a4a5a', coat2: '#4a5c6e', shirt: '#3a4a5a', legs: '#2a2b33', shoe: '#2d2d36', hair: '#c9a46a', brows: '#a8822e', neck: 'none', hairStyle: 'buzz', beard: 'full', glasses: true },
};

function oval(x, cx, cy, rx, ry, fill, lw = 10) { x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); if (fill) { x.fillStyle = fill; x.fill(); } if (lw) { x.lineWidth = lw; x.strokeStyle = INK; x.stroke(); } }
function limb(x, pts, w, col) { x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); x.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) x.lineTo(p[0], p[1]); x.strokeStyle = INK; x.lineWidth = w + 14; x.stroke(); x.strokeStyle = col; x.lineWidth = w; x.stroke(); }
function shade(x, path, col) { x.save(); path(); x.clip(); x.fillStyle = col; x.beginPath(); x.ellipse(...arguments[3]); x.fill(); x.restore(); }

// george (26 Nov): stylised pearly-white faces for everyone (set PEARL = false for natural skin tones)
export let PEARL = true; const PEARL_SKIN = '#f6f3ef';
export function drawChar(x, kind, P, t) {
  const K = PEARL ? { ...KINDS[kind], skin: PEARL_SKIN } : KINDS[kind], W = 512, cx = 256; x.clearRect(0, 0, W, 768);
  const sit = !!P.sit, lady = !!K.dress;
  const bob = P.walk ? Math.abs(Math.sin(P.walk * Math.PI)) * 10 : 0;
  const hipY = sit ? 535 : 545 - bob, bodyCy = sit ? 440 : 440 - bob, bodyRy = 120, bodyRx = 108;
  const headCy = bodyCy - 205 + (P.bounce || 0), headR = 118;
  x.save(); x.translate(cx, 750); x.rotate(P.lean || 0); x.translate(-cx, -750);
  // ---------- legs ----------
  if (!lady) {
    for (const s of [-1, 1]) {
      let hip = [cx + s * 46, hipY], knee, foot;
      if (sit) { knee = [cx + s * 70, hipY + 30]; foot = [cx + s * 78, 735]; }
      else { const sw = P.walk ? Math.sin(P.walk * Math.PI + (s > 0 ? Math.PI : 0)) * 26 : 0; knee = [cx + s * 50 + sw * 0.5, (hipY + 740) / 2]; foot = [cx + s * 54 + sw, 735 - (P.walk ? Math.max(0, Math.cos(P.walk * Math.PI + (s > 0 ? Math.PI : 0))) * 14 : 0)]; }
      limb(x, [hip, knee, foot], 40, K.legs);
      if (K.check) { x.save(); x.strokeStyle = 'rgba(120,70,40,.35)'; x.lineWidth = 3; for (let k = 0; k < 5; k++) { const yy = hip[1] + (foot[1] - hip[1]) * (k + 0.5) / 5; x.beginPath(); x.moveTo(foot[0] - 18, yy); x.lineTo(foot[0] + 18, yy); x.stroke(); } x.restore(); }
      oval(x, foot[0] + s * 14, foot[1] + 4, 34, 18, K.shoe, 9);
      x.fillStyle = 'rgba(255,255,255,.35)'; x.beginPath(); x.ellipse(foot[0] + s * 14 - 8, foot[1] - 4, 12, 5, 0, 0, 7); x.fill();
    }
  } else {
    for (const s of [-1, 1]) oval(x, cx + s * 40, 742, 26, 14, K.shoe, 8);
  }
  // ---------- body ----------
  if (lady) {
    const top = bodyCy - 110, bot = sit ? 700 : 735;
    x.beginPath(); x.moveTo(cx - 70, top + 40); x.quadraticCurveTo(cx - 70, top - 10, cx, top - 10); x.quadraticCurveTo(cx + 70, top - 10, cx + 70, top + 40);
    x.bezierCurveTo(cx + 95, top + 160, cx + 175, bot - 70, cx + 170, bot); x.quadraticCurveTo(cx, bot + 22, cx - 170, bot); x.bezierCurveTo(cx - 175, bot - 70, cx - 95, top + 160, cx - 70, top + 40); x.closePath();
    x.fillStyle = K.dress; x.fill(); x.save(); x.clip(); x.fillStyle = K.dress2; x.fillRect(cx - 200, top, 120, 900); x.fillStyle = 'rgba(0,0,0,.14)'; x.beginPath(); x.ellipse(cx + 150, bot, 90, 300, 0, 0, 7); x.fill();
    x.strokeStyle = 'rgba(0,0,0,.18)'; x.lineWidth = 5; for (const k of [-90, -30, 30, 90]) { x.beginPath(); x.moveTo(cx + k * 0.35, top + 140); x.quadraticCurveTo(cx + k * 0.8, top + 300, cx + k * 1.6, bot); x.stroke(); } x.restore();
    x.lineWidth = 10; x.strokeStyle = INK; x.stroke();
    // shawl
    x.beginPath(); x.moveTo(cx - 92, top + 40); x.quadraticCurveTo(cx, top + 150, cx + 92, top + 40); x.quadraticCurveTo(cx, top - 25, cx - 92, top + 40); x.fillStyle = K.shawl; x.fill(); x.lineWidth = 8; x.stroke();
  } else {
    const coat = K.coat;
    x.beginPath(); x.ellipse(cx, bodyCy, bodyRx, bodyRy, 0, 0, Math.PI * 2); x.fillStyle = coat; x.fill();
    x.save(); x.clip();
    if (K.vest) { x.fillStyle = K.vest; x.beginPath(); x.moveTo(cx - 40, bodyCy - 120); x.lineTo(cx + 40, bodyCy - 120); x.lineTo(cx + 34, bodyCy + 60); x.lineTo(cx, bodyCy + 80); x.lineTo(cx - 34, bodyCy + 60); x.fill();
      x.fillStyle = INK; for (let k = 0; k < 3; k++) { x.beginPath(); x.arc(cx, bodyCy - 40 + k * 32, 5, 0, 7); x.fill(); }
      x.strokeStyle = 'rgba(0,0,0,.35)'; x.lineWidth = 6; x.beginPath(); x.moveTo(cx - 40, bodyCy - 118); x.lineTo(cx - 52, bodyCy + 40); x.moveTo(cx + 40, bodyCy - 118); x.lineTo(cx + 52, bodyCy + 40); x.stroke(); }
    if (K.shirt && K.neck !== 'none' && kind !== 'office') { x.fillStyle = K.shirt; x.beginPath(); x.moveTo(cx - 26, bodyCy - 125); x.lineTo(cx + 26, bodyCy - 125); x.lineTo(cx, bodyCy - 70); x.fill(); }
    if (kind === 'office') { x.fillStyle = '#e6e0d2'; x.fillRect(cx + 34, bodyCy - 40, 34, 36); x.strokeStyle = INK; x.lineWidth = 4; x.strokeRect(cx + 34, bodyCy - 40, 34, 36); x.fillStyle = '#2f6fe0'; x.fillRect(cx + 42, bodyCy - 54, 6, 30); }
    if (K.coat2) { x.fillStyle = K.coat2; x.globalAlpha = 0.7; x.beginPath(); x.ellipse(cx - 46, bodyCy - 40, 40, 60, -0.4, 0, 7); x.fill(); x.globalAlpha = 1; }
    if (K.stripe) { x.fillStyle = K.stripe; x.fillRect(cx - bodyRx, bodyCy + 10, bodyRx * 2, 22); x.fillStyle = '#ffffff'; for (let k = -6; k < 6; k++) x.fillRect(cx + k * 22, bodyCy + 10, 11, 22); }
    if (K.vestText) { x.fillStyle = '#ffd23a'; x.font = '900 52px sans-serif'; x.textAlign = 'center'; x.fillText(K.vestText, cx, bodyCy + 6); x.textAlign = 'left'; }
    if (K.badge) { x.fillStyle = '#e8c35a'; x.beginPath(); for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2 - Math.PI / 2, r2 = k % 2 ? 9 : 20; x.lineTo(cx - 50 + Math.cos(a) * r2, bodyCy - 50 + Math.sin(a) * r2); } x.closePath(); x.fill(); x.lineWidth = 4; x.strokeStyle = INK; x.stroke(); }
    if (K.neck === 'hoodie') { x.fillStyle = 'rgba(255,255,255,.08)'; x.beginPath(); x.roundRect(cx - 60, bodyCy + 20, 120, 60, 14); x.fill(); x.strokeStyle = 'rgba(0,0,0,.35)'; x.lineWidth = 5; x.stroke(); x.strokeStyle = '#e8e2d6'; x.lineWidth = 5; for (const s2 of [-1, 1]) { x.beginPath(); x.moveTo(cx + s2 * 18, bodyCy - 110); x.lineTo(cx + s2 * 22, bodyCy - 40); x.stroke(); } }
    if (K.neck === 'chain') { x.strokeStyle = '#ffcf3f'; x.lineWidth = 9; x.beginPath(); x.moveTo(cx - 42, bodyCy - 118); x.quadraticCurveTo(cx, bodyCy - 30, cx + 42, bodyCy - 118); x.stroke(); x.fillStyle = '#ffcf3f'; x.beginPath(); x.arc(cx, bodyCy - 66, 14, 0, 7); x.fill(); x.lineWidth = 4; x.strokeStyle = INK; x.stroke();
      x.strokeStyle = 'rgba(0,0,0,.25)'; x.lineWidth = 4; for (let k = 0; k < 5; k++) { x.beginPath(); x.moveTo(cx - 80 + k * 40, bodyCy - 60); x.lineTo(cx - 70 + k * 40, bodyCy + 100); x.stroke(); } }
    x.fillStyle = 'rgba(20,10,40,.22)'; x.beginPath(); x.ellipse(cx + bodyRx * 0.9, bodyCy + 20, bodyRx * 0.55, bodyRy * 1.2, 0, 0, 7); x.fill();
    x.restore();
    x.beginPath(); x.ellipse(cx, bodyCy, bodyRx, bodyRy, 0, 0, Math.PI * 2); x.lineWidth = 10; x.strokeStyle = INK; x.stroke();
    if (sit && !lady) { // belt / waist line
      x.strokeStyle = 'rgba(0,0,0,.25)'; x.lineWidth = 5; x.beginPath(); x.ellipse(cx, bodyCy + 70, 90, 26, 0, 0.1, Math.PI - 0.1); x.stroke(); }
  }
  // neckwear
  const ny = bodyCy - bodyRy + 6;
  if (K.neck === 'tie') { x.fillStyle = '#fbf7ee'; x.beginPath(); x.moveTo(cx - 34, ny - 6); x.lineTo(cx, ny + 22); x.lineTo(cx - 10, ny - 10); x.fill(); x.beginPath(); x.moveTo(cx + 34, ny - 6); x.lineTo(cx, ny + 22); x.lineTo(cx + 10, ny - 10); x.fill(); x.lineWidth = 4; x.strokeStyle = INK; x.stroke();
    x.beginPath(); x.moveTo(cx - 10, ny + 4); x.lineTo(cx + 10, ny + 4); x.lineTo(cx + 16, ny + 130); x.lineTo(cx, ny + 152); x.lineTo(cx - 16, ny + 130); x.closePath(); x.fillStyle = K.tie; x.fill(); x.lineWidth = 5; x.stroke(); }
  if (K.neck === 'cravat') { x.beginPath(); x.ellipse(cx, ny + 8, 34, 16, 0, 0, 7); x.fillStyle = INK; x.fill(); x.beginPath(); x.moveTo(cx - 12, ny + 10); x.lineTo(cx - 20, ny + 50); x.lineTo(cx, ny + 36); x.lineTo(cx + 20, ny + 50); x.lineTo(cx + 12, ny + 10); x.fill(); }
  if (K.neck === 'bow') { x.fillStyle = K.bow; x.beginPath(); x.moveTo(cx, ny + 8); x.lineTo(cx - 36, ny - 10); x.lineTo(cx - 36, ny + 26); x.closePath(); x.moveTo(cx, ny + 8); x.lineTo(cx + 36, ny - 10); x.lineTo(cx + 36, ny + 26); x.closePath(); x.fill(); x.lineWidth = 5; x.strokeStyle = INK; x.stroke(); oval(x, cx, ny + 8, 9, 9, K.bow, 5); }
  // ---------- arms ----------
  const armCol = K.shortSleeve ? K.skin : (lady ? K.dress : K.coat);
  for (const s of [-1, 1]) {
    if (P.cuffed) { oval(x, cx + s * (bodyRx - 10), bodyCy + 10, 22, 50, armCol, 8); continue; }
    const a = (s < 0 ? P.armL : P.armR) || [0.25, 0.1];
    const sh = [cx + s * (lady ? 66 : bodyRx - 22), bodyCy - (lady ? 70 : bodyRy - 48)];
    const a1 = a[0], a2 = a[0] + a[1], L1 = 84, L2 = 80;
    const el = [sh[0] + s * Math.sin(a1) * L1, sh[1] + Math.cos(a1) * L1];
    const hd = [el[0] + s * Math.sin(a2) * L2, el[1] + Math.cos(a2) * L2];
    if (K.shortSleeve) { limb(x, [sh, el, hd], 26, K.skin); oval(x, sh[0] + s * 4, sh[1] + 6, 34, 30, kind === 'office' ? '#fbf7ee' : K.coat, 8); }
    else { limb(x, [sh, el, hd], 34, armCol); if (!lady) { x.fillStyle = K.shirt || '#fff'; } }
    oval(x, hd[0], hd[1], 25, 23, K.skin, 8);
    oval(x, hd[0] - s * 18, hd[1] - 8, 10, 12, K.skin, 6);
    if (P.holdHat && s > 0 && K.hat) P._hatHand = hd;
  }
  // ---------- head ----------
  const hy = headCy, hx = cx;
  // back hair / bonnet back
  if (K.hairStyle === 'bun') oval(x, hx, hy - headR + 4, 50, 44, K.hair, 9);
  if (K.hairStyle === 'parted') { oval(x, hx, hy + 6, headR + 10, headR + 6, K.hair, 10); }
  if (K.neck === 'hoodie') { oval(x, hx, hy + headR * 0.85, headR * 0.95, 46, K.coat2, 10); }
  if (K.hood) { oval(x, hx, hy + 4, headR + 34, headR + 30, K.coat, 11); }
  // ears
  if (!K.hood) for (const s of [-1, 1]) { oval(x, hx + s * (headR - 4), hy + 12, 22, 28, K.skin, 8); }
  oval(x, hx, hy, headR, headR * 0.98, K.skin, 11);
  x.save(); x.beginPath(); x.ellipse(hx, hy, headR, headR * 0.98, 0, 0, 7); x.clip(); x.fillStyle = 'rgba(160,60,40,.16)'; x.beginPath(); x.ellipse(hx + headR * 0.95, hy + 30, headR * 0.5, headR * 1.3, 0, 0, 7); x.fill(); x.restore();
  if (K.stubble) { x.save(); x.beginPath(); x.ellipse(hx, hy, headR, headR * 0.98, 0, 0, 7); x.clip(); x.fillStyle = 'rgba(40,30,30,.16)'; x.beginPath(); x.ellipse(hx, hy + headR * 0.75, headR * 0.85, headR * 0.5, 0, 0, 7); x.fill(); x.restore(); }
  if (K.earrings) for (const s of [-1, 1]) oval(x, hx + s * (headR + 2), hy + 46, 7, 7, '#ffcf3f', 4);
  // hair
  x.lineJoin = 'round';
  if (K.hairStyle === 'darwin' || K.chops) { // side hair from the temples + big side whiskers down to the jaw
    const col = K.chops || K.hair;
    for (const s of [-1, 1]) { x.beginPath(); x.moveTo(hx + s * 78, hy - 78); x.quadraticCurveTo(hx + s * (headR + 14), hy - 60, hx + s * (headR + 8), hy + 10); x.quadraticCurveTo(hx + s * (headR + 2), hy + 92, hx + s * 76, hy + 104); x.quadraticCurveTo(hx + s * 60, hy + 70, hx + s * 84, hy + 40); x.quadraticCurveTo(hx + s * 96, hy - 20, hx + s * 78, hy - 78); x.closePath(); x.fillStyle = col; x.fill(); x.lineWidth = 9; x.strokeStyle = INK; x.stroke();
      x.strokeStyle = 'rgba(255,255,255,.28)'; x.lineWidth = 4; x.beginPath(); x.moveTo(hx + s * 96, hy - 40); x.quadraticCurveTo(hx + s * 112, hy + 10, hx + s * 100, hy + 70); x.stroke(); }
    if (K.hairStyle === 'darwin') { x.beginPath(); x.moveTo(hx - 50, hy - headR + 14); x.quadraticCurveTo(hx - 10, hy - headR - 8, hx + 40, hy - headR + 10); x.quadraticCurveTo(hx + 10, hy - headR + 26, hx - 50, hy - headR + 14); x.fillStyle = K.hair; x.fill(); x.lineWidth = 6; x.strokeStyle = INK; x.stroke();
      x.strokeStyle = 'rgba(255,255,255,.45)'; x.lineWidth = 8; x.beginPath(); x.arc(hx - 34, hy - 64, 34, Math.PI * 1.15, Math.PI * 1.55); x.stroke(); } }
  if (K.hairStyle === 'quiff') { x.beginPath(); x.moveTo(hx - headR + 6, hy - 20); x.quadraticCurveTo(hx - headR - 6, hy - headR - 10, hx - 20, hy - headR - 36); x.quadraticCurveTo(hx + 60, hy - headR - 70, hx + 104, hy - headR + 4); x.quadraticCurveTo(hx + headR + 10, hy - 50, hx + headR - 4, hy - 10); x.quadraticCurveTo(hx + 70, hy - 82, hx - 10, hy - 74); x.quadraticCurveTo(hx - 70, hy - 70, hx - headR + 6, hy - 20); x.fillStyle = K.hair; x.fill(); x.lineWidth = 10; x.strokeStyle = INK; x.stroke();
    x.strokeStyle = 'rgba(255,220,180,.5)'; x.lineWidth = 6; x.beginPath(); x.moveTo(hx - 50, hy - headR - 16); x.quadraticCurveTo(hx + 20, hy - headR - 44, hx + 70, hy - headR - 14); x.stroke(); }
  if (K.hairStyle === 'short' && !K.hat) { x.beginPath(); x.arc(hx, hy, headR + 2, Math.PI * 1.08, Math.PI * 1.92); x.quadraticCurveTo(hx, hy - 60, hx - headR + 6, hy - 40); x.fillStyle = K.hair; x.fill(); x.lineWidth = 9; x.strokeStyle = INK; x.stroke(); }
  if (K.hairStyle === 'short' && K.hat) for (const s of [-1, 1]) { x.beginPath(); x.ellipse(hx + s * (headR - 14), hy - 30, 22, 44, 0, 0, 7); x.fillStyle = K.hair; x.fill(); x.lineWidth = 8; x.strokeStyle = INK; x.stroke(); }
  if (K.hairStyle === 'bun' || K.hairStyle === 'parted') { x.beginPath(); x.arc(hx, hy, headR + 3, Math.PI * 1.02, Math.PI * 1.98); x.quadraticCurveTo(hx + 50, hy - 64, hx + 4, hy - 80); x.quadraticCurveTo(hx - 50, hy - 64, hx - headR - 3, hy - 8); x.fillStyle = K.hair; x.fill(); x.lineWidth = 9; x.strokeStyle = INK; x.stroke(); }
  if (K.hairStyle === 'spiky') { x.beginPath(); x.moveTo(hx - headR + 2, hy - 18); for (let k = 0; k <= 7; k++) { const a = Math.PI * (1.04 + k * 0.13), r2 = k % 2 ? headR + 34 : headR + 4; x.lineTo(hx + Math.cos(a) * r2, hy - 10 + Math.sin(a) * r2); } x.lineTo(hx + headR - 2, hy - 18); x.quadraticCurveTo(hx, hy - 70, hx - headR + 2, hy - 18); x.fillStyle = K.hair; x.fill(); x.lineWidth = 9; x.strokeStyle = INK; x.stroke(); }
  if (K.hairStyle === 'buzz') { x.beginPath(); x.arc(hx, hy, headR + 2, Math.PI * 1.1, Math.PI * 1.9); x.quadraticCurveTo(hx, hy - 76, hx - headR + 8, hy - 36); x.fillStyle = K.hair; x.fill(); x.lineWidth = 8; x.strokeStyle = INK; x.stroke(); }
  // beards
  if (K.beard === 'chin' || K.beard === 'full' || K.beard === 'short') { const full = K.beard === 'full', sh = K.beard === 'short';
    x.beginPath(); x.moveTo(hx - (full ? headR - 8 : sh ? 80 : 60), hy + (full ? 0 : 40)); x.quadraticCurveTo(hx - 70, hy + headR + (sh ? 10 : 40), hx, hy + headR + (sh ? 16 : 52)); x.quadraticCurveTo(hx + 70, hy + headR + (sh ? 10 : 40), hx + (full ? headR - 8 : sh ? 80 : 60), hy + (full ? 0 : 40));
    x.quadraticCurveTo(hx + 50, hy + 90, hx, hy + 88); x.quadraticCurveTo(hx - 50, hy + 90, hx - (full ? headR - 8 : sh ? 80 : 60), hy + (full ? 0 : 40)); x.fillStyle = K.hair; x.fill(); x.lineWidth = 9; x.strokeStyle = INK; x.stroke(); }
  // ---------- face ----------
  const ex = 40, ey = hy + 6, E = P.expr || 'neutral', blink = P.blink;
  const brow = { neutral: [0, 0], happy: [-4, 0.05], delighted: [-10, 0.15], shocked: [-22, 0.1], angry: [6, -0.45], sleep: [4, 0.1], annoyed: [2, -0.25], smug: [-4, -0.15] }[E] || [0, 0];
  if (E === 'happy' || E === 'delighted' || E === 'smug' && false) {
    for (const s of [-1, 1]) { x.beginPath(); x.arc(hx + s * ex, ey + 6, 16, Math.PI * 1.1, Math.PI * 1.9); x.lineWidth = 9; x.lineCap = 'round'; x.strokeStyle = INK; x.stroke(); }
  } else if (E === 'sleep' || blink) {
    for (const s of [-1, 1]) { x.beginPath(); x.arc(hx + s * ex, ey - 4, 15, Math.PI * 0.1, Math.PI * 0.9); x.lineWidth = 8; x.lineCap = 'round'; x.strokeStyle = INK; x.stroke(); }
  } else {
    const big = E === 'shocked' ? 1.35 : 1, sq = E === 'angry' || E === 'annoyed' || E === 'smug' ? 0.72 : 1;
    for (const s of [-1, 1]) { if (E === 'shocked') oval(x, hx + s * ex, ey, 24, 28, '#ffffff', 6);
      x.beginPath(); x.ellipse(hx + s * ex, ey, 12 * big, 17 * big * sq, 0, 0, 7); x.fillStyle = INK; x.fill();
      x.beginPath(); x.arc(hx + s * ex + 4, ey - 6 * sq, 4.5, 0, 7); x.fillStyle = '#fff'; x.fill(); }
    if (E === 'smug' || E === 'annoyed') for (const s of [-1, 1]) { x.fillStyle = K.skin; x.fillRect(hx + s * ex - 18, ey - 26, 36, 14); x.beginPath(); x.moveTo(hx + s * ex - 18, ey - 10); x.lineTo(hx + s * ex + 18, ey - 10); x.lineWidth = 6; x.strokeStyle = INK; x.stroke(); }
  }
  if (K.glasses) { for (const s of [-1, 1]) { x.beginPath(); x.arc(hx + s * ex, ey, 31, 0, 7); x.lineWidth = 8; x.strokeStyle = INK; x.stroke(); } x.beginPath(); x.moveTo(hx - 10, ey - 4); x.lineTo(hx + 10, ey - 4); x.stroke(); for (const s of [-1, 1]) { x.beginPath(); x.moveTo(hx + s * 71, ey - 6); x.lineTo(hx + s * (headR - 6), ey - 12); x.stroke(); } }
  if (K.shades) { x.fillStyle = '#0d0b14'; for (const s of [-1, 1]) { x.beginPath(); x.roundRect(hx + s * ex - 30, ey - 20, 60, 38, 12); x.fill(); x.lineWidth = 6; x.strokeStyle = INK; x.stroke(); x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(hx + s * ex - 20, ey - 12, 14, 6); x.fillStyle = '#0d0b14'; } x.lineWidth = 7; x.beginPath(); x.moveTo(hx - 10, ey - 6); x.lineTo(hx + 10, ey - 6); x.stroke(); }
  if (K.monocle) { x.beginPath(); x.arc(hx + ex + (P.monoclePop || 0) * 20, ey + (P.monoclePop || 0) * 60, 28, 0, 7); x.lineWidth = 7; x.strokeStyle = '#d9a82a'; x.stroke(); x.lineWidth = 3; x.strokeStyle = INK; x.stroke();
    x.beginPath(); x.moveTo(hx + ex + 28, ey + 6 + (P.monoclePop || 0) * 60); x.quadraticCurveTo(hx + 100, ey + 90, hx + 70, hy + headR + 30); x.lineWidth = 3; x.strokeStyle = '#d9a82a'; x.stroke(); }
  // brows
  const bc = K.brows; x.lineCap = 'round';
  for (const s of [-1, 1]) { const bx = hx + s * ex, by = ey - 36 + brow[0] - (K.glasses ? 4 : 0), r = s * brow[1];
    x.save(); x.translate(bx, by); x.rotate(-r); x.beginPath(); x.moveTo(-20, 3); x.quadraticCurveTo(0, -7, 20, 3); x.lineWidth = kind === 'darwin' || kind === 'critic' ? 15 : 11; x.strokeStyle = INK; x.stroke(); x.lineWidth -= 6; x.strokeStyle = bc; x.stroke(); x.restore(); }
  // cheeks + nose
  x.fillStyle = K.cheeks || 'rgba(255,120,120,.38)'; if (K.cheeks) x.globalAlpha = 0.55; for (const s of [-1, 1]) { x.beginPath(); x.ellipse(hx + s * 72, ey + 40, 18, 12, 0, 0, 7); x.fill(); } x.globalAlpha = 1;
  x.beginPath(); x.arc(hx + 4, ey + 30, 11, Math.PI * 0.15, Math.PI * 1.05); x.lineWidth = 6; x.strokeStyle = INK; x.stroke();
  // moustache
  if (K.tache === 'walrus') { x.beginPath(); x.moveTo(hx - 62, ey + 70); x.quadraticCurveTo(hx - 30, ey + 28, hx, ey + 46); x.quadraticCurveTo(hx + 30, ey + 28, hx + 62, ey + 70); x.quadraticCurveTo(hx + 30, ey + 60, hx, ey + 62); x.quadraticCurveTo(hx - 30, ey + 60, hx - 62, ey + 70); x.fillStyle = K.hair; x.fill(); x.lineWidth = 6; x.strokeStyle = INK; x.stroke(); }
  // mouth
  const my = ey + (K.tache ? 76 : 62), talk = P.talk || 0;
  x.lineWidth = 8; x.strokeStyle = INK; x.lineCap = 'round';
  if (E === 'shocked') { oval(x, hx, my + 6, 20, 24 + talk * 6, '#7a1f2b', 7); }
  else if (talk > 0.08 || E === 'delighted') { const o = Math.max(talk, E === 'delighted' ? 0.7 : 0), w = E === 'angry' ? 30 : 38;
    x.beginPath(); x.moveTo(hx - w, my); x.quadraticCurveTo(hx, my + (E === 'angry' ? -6 : 8), hx + w, my); x.quadraticCurveTo(hx, my + 14 + o * 46, hx - w, my); x.closePath(); x.fillStyle = '#7a1f2b'; x.fill(); x.save(); x.clip(); x.fillStyle = '#ff7a8a'; x.beginPath(); x.ellipse(hx, my + 12 + o * 46, 24, 16, 0, 0, 7); x.fill(); x.fillStyle = '#fff'; x.fillRect(hx - w, my - 4, w * 2, 10); x.restore(); x.stroke(); }
  else if (E === 'angry' || E === 'annoyed') { x.beginPath(); x.moveTo(hx - 26, my + 10); x.quadraticCurveTo(hx, my - 6, hx + 26, my + 10); x.stroke(); }
  else if (E === 'sleep') { oval(x, hx, my + 4, 9, 11, '#7a1f2b', 6); }
  else if (E === 'smug') { x.beginPath(); x.moveTo(hx - 26, my + 2); x.quadraticCurveTo(hx + 4, my + 16, hx + 30, my - 8); x.stroke(); }
  else { const c = E === 'happy' ? 18 : 10; x.beginPath(); x.moveTo(hx - 30, my); x.quadraticCurveTo(hx, my + c, hx + 30, my); x.stroke(); }
  // ---------- hats / bonnet front ----------
  let hatY = hy - headR + 18 - (P.tip || 0) * 70, hatX = hx + (P.tip || 0) * 70, hatR = (P.tip || 0) * 0.5;
  if (K.hat) { x.save(); x.translate(hatX, hatY); x.rotate(hatR);
    if (K.hat === 'stovepipe' || K.hat === 'tophat') { const h = K.hat === 'stovepipe' ? 170 : 120, c = K.hatCol || '#1d1a26';
      x.beginPath(); x.moveTo(-74, 0); x.lineTo(-64, -h); x.quadraticCurveTo(0, -h - 16, 64, -h); x.lineTo(74, 0); x.closePath(); x.fillStyle = c; x.fill(); x.lineWidth = 9; x.strokeStyle = INK; x.stroke();
      x.fillStyle = K.hat === 'stovepipe' ? '#d7263d' : '#1d1a26'; x.fillRect(-72, -28, 144, 20); x.strokeRect(-72, -28, 144, 20);
      x.fillStyle = 'rgba(255,255,255,.18)'; x.fillRect(-50, -h + 10, 18, h - 44);
      oval(x, 0, 2, 118, 20, c, 9); }
    if (K.hat === 'bowler') { x.beginPath(); x.moveTo(-86, 0); x.quadraticCurveTo(-86, -110, 0, -110); x.quadraticCurveTo(86, -110, 86, 0); x.closePath(); x.fillStyle = '#6b4a2a'; x.fill(); x.lineWidth = 9; x.strokeStyle = INK; x.stroke(); oval(x, 0, 2, 116, 18, '#6b4a2a', 9); x.fillStyle = '#3a2416'; x.fillRect(-84, -24, 168, 14); }
    x.restore(); }
  if (K.bonnet) { x.beginPath(); x.arc(hx, hy - 6, headR + 34, Math.PI * 1.0, Math.PI * 2.0); x.quadraticCurveTo(hx + headR + 10, hy - 40, hx + headR - 6, hy - 50); x.quadraticCurveTo(hx, hy - headR - 10, hx - headR + 6, hy - 50); x.quadraticCurveTo(hx - headR - 10, hy - 40, hx - headR - 34, hy - 6); x.fillStyle = K.bonnet; x.fill(); x.lineWidth = 10; x.strokeStyle = INK; x.stroke();
    x.fillStyle = K.bonnetRibbon; x.fillRect(hx - headR - 30, hy - 34, 34, 20); x.fillRect(hx + headR - 4, hy - 34, 34, 20);
    x.beginPath(); x.moveTo(hx - headR + 6, hy + 30); x.quadraticCurveTo(hx - 60, hy + headR + 20, hx - 10, hy + headR + 24); x.moveTo(hx + headR - 6, hy + 30); x.quadraticCurveTo(hx + 60, hy + headR + 20, hx + 10, hy + headR + 24); x.lineWidth = 12; x.strokeStyle = K.bonnetRibbon; x.stroke(); }
  if (K.mask) { x.beginPath(); x.moveTo(hx - headR + 8, ey + 18); x.quadraticCurveTo(hx, ey + 4, hx + headR - 8, ey + 18); x.quadraticCurveTo(hx + headR - 20, hy + headR - 6, hx, hy + headR + 4); x.quadraticCurveTo(hx - headR + 20, hy + headR - 6, hx - headR + 8, ey + 18); x.fillStyle = K.mask; x.fill(); x.lineWidth = 8; x.strokeStyle = INK; x.stroke(); x.fillStyle = 'rgba(255,255,255,.5)'; for (const [a, b] of [[-40, 60], [20, 80], [50, 50]]) { x.beginPath(); x.arc(hx + a, ey + b, 5, 0, 7); x.fill(); } }
  if (K.hood) { x.save(); x.beginPath(); x.ellipse(hx, hy, headR, headR * 0.98, 0, 0, 7); x.clip(); const g = x.createLinearGradient(0, hy - headR, 0, hy + 20); g.addColorStop(0, 'rgba(10,6,20,.55)'); g.addColorStop(1, 'rgba(10,6,20,0)'); x.fillStyle = g; x.fillRect(hx - headR, hy - headR, headR * 2, headR + 20); x.restore();
    x.beginPath(); x.moveTo(hx - headR - 30, hy + 50); x.quadraticCurveTo(hx - headR - 30, hy - headR - 40, hx, hy - headR - 36); x.quadraticCurveTo(hx + headR + 30, hy - headR - 40, hx + headR + 30, hy + 50); x.lineTo(hx + headR - 6, hy + 30); x.quadraticCurveTo(hx + headR - 4, hy - headR + 10, hx, hy - headR + 6); x.quadraticCurveTo(hx - headR + 4, hy - headR + 10, hx - headR + 6, hy + 30); x.closePath(); x.fillStyle = K.coat; x.fill(); x.lineWidth = 10; x.strokeStyle = INK; x.stroke();
    x.fillStyle = 'rgba(255,255,255,.12)'; x.beginPath(); x.ellipse(hx - 60, hy - headR - 6, 40, 12, -0.4, 0, 7); x.fill(); }
  if (K.cap) { const cy2 = hy - headR + 30; x.beginPath(); x.moveTo(hx - headR + 2, cy2); x.quadraticCurveTo(hx - headR + 10, hy - headR - 44, hx, hy - headR - 46); x.quadraticCurveTo(hx + headR - 10, hy - headR - 44, hx + headR - 2, cy2); x.closePath(); x.fillStyle = K.cap; x.fill(); x.lineWidth = 9; x.strokeStyle = INK; x.stroke();
    x.beginPath(); x.ellipse(hx + 30, cy2 + 2, headR - 6, 20, 0, Math.PI * 0.95, Math.PI * 2.05); x.fillStyle = K.cap; x.fill(); x.stroke();
    if (K.capText) { x.fillStyle = K.capText === 'FBI' ? '#ffd23a' : '#ffffff'; x.font = `900 ${K.capText.length > 4 ? 30 : 46}px sans-serif`; x.textAlign = 'center'; x.fillText(K.capText, hx, cy2 - 18); x.textAlign = 'left'; }
    else { x.fillStyle = '#d9b25a'; x.beginPath(); x.arc(hx, cy2 - 26, 13, 0, 7); x.fill(); x.lineWidth = 4; x.stroke(); } }
  // sweat / zzz
  if (P.sweat) { x.globalAlpha = P.sweat; for (const [dx, dy, r] of [[-headR - 6, -30, 1], [headR + 6, -50, 0.8]]) { x.beginPath(); x.moveTo(hx + dx, hy + dy - 22 * r); x.quadraticCurveTo(hx + dx + 14 * r, hy + dy, hx + dx, hy + dy + 8 * r); x.quadraticCurveTo(hx + dx - 14 * r, hy + dy, hx + dx, hy + dy - 22 * r); x.fillStyle = '#8fd8ff'; x.fill(); x.lineWidth = 4; x.strokeStyle = INK; x.stroke(); } x.globalAlpha = 1; }
  if (P.zzz) { x.font = '900 58px sans-serif'; x.lineWidth = 9; x.strokeStyle = INK; x.fillStyle = '#ffffff'; for (let k = 0; k < 3; k++) { const ph = (t * 0.7 + k / 3) % 1; x.globalAlpha = Math.sin(ph * Math.PI); x.font = `900 ${34 + ph * 40}px sans-serif`; const X = hx + 70 + ph * 90, Y = hy - headR - ph * 120 + 60; x.strokeText('Z', X, Y); x.fillText('Z', X, Y); } x.globalAlpha = 1; }
  x.restore();
}
