// "storybook" style for Gary Tries It: painted backgrounds generated per episode
// (pipeline/backgrounds.py -> EP/bg/<key>.jpg) with hand-drawn 2D costumed characters
// acting in front of them. Same page contract as the other renderers:
// window.renderFrame(t), window.DURATION, window.READY. Loaded when script.json has
// "style": "storybook".
//
// Script vocabulary for this style (per beat):
//   bg: key of script.backgrounds (image file EP/bg/<key>.jpg)
//   cast: [{ id, who, x (0..1), s (scale), pose, expr, flip, hold, enter: "left"|"right", ghost }]
//     who:   a WARDROBE entry below (add new ones freely; Gary is always the "you" character)
//     pose:  idle, hold, point, shrug, panic, hips, whisper, wave, bow, axe (raised; swings at the death)
//     expr:  happy, neutral, worried, shocked, smug, angry, sick, dead
//     hold:  cloth, purse, axe, scroll, goblet, camera
//   cast.jump: true -> the character leaps and drops out of frame during the beat
//   props: [{ type: "stool"|"block"|"throne", x, s }]   fx: "coins" (gold rain), "shake"
//   camera: wide, push, close (on `focus` cast id), pan
//   death: true + deathOf: cast id -> that character falls; red flash
//   lines[].speaker = a cast id; give each speaking id a voice in script.voices
const W = 1080, H = 1920;
const ep = new URLSearchParams(location.search).get('ep');
const script = await (await fetch(`/episodes/${ep}/script.json`)).json();
const timeline = await (await fetch(`/episodes/${ep}/timeline.json`)).json();
await document.fonts.load('900 100px Poppins');
await document.fonts.load('800 100px Poppins');

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => { t = clamp(t); return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };
const easeOut = t => 1 - Math.pow(1 - clamp(t), 3);
const backOut = t => { t = clamp(t); const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
const rad = d => d * Math.PI / 180;
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const INK = '#22180f';

// ---------- backgrounds ----------
const bgs = {};
await Promise.all(Object.keys(script.backgrounds || {}).map(k => new Promise(res => {
  const im = new Image(); im.onload = () => { bgs[k] = im; res(); }; im.onerror = () => res(); im.src = `/episodes/${ep}/bg/${k}.jpg`;
})));

// ---------- wardrobe (plain data: add characters freely) ----------
const WARDROBE = {
  gary:        { skin: '#ffe3cc', hair: 'tuft', hairColor: '#6b4226', body: 'doublet', color: '#f29a2e', trim: '#ffd27a', legs: '#384062' },
  gary_tudor:  { skin: '#ffe3cc', hair: 'tuft', hairColor: '#6b4226', body: 'doublet', color: '#3f6fb5', trim: '#f2d27a', legs: '#e9e2d0', hat: 'tudor_cap', hatColor: '#1e1e28' },
  king_henry:  { skin: '#ffd9bd', hair: 'short', hairColor: '#c7662b', beard: '#c7662b', body: 'robe', color: '#b3202c', trim: '#f4c542', fur: true, legs: '#f2ead8', hat: 'crown', size: 1.12, belly: 1 },
  lord:        { skin: '#ffe0c4', hair: 'short', hairColor: '#2a1d14', mustache: '#2a1d14', body: 'doublet', color: '#2e7d4f', trim: '#e8c35a', legs: '#2e2e3a', hat: 'feather_hat', hatColor: '#2e7d4f' },
  anne:        { skin: '#ffe6d3', hair: 'long', hairColor: '#2a1a12', body: 'dress', color: '#7a1f3d', trim: '#f2d27a', hat: 'french_hood', hatColor: '#151318', necklace: true },
  gary_tailor: { skin: '#ffe3cc', hair: 'tuft', hairColor: '#6b4226', mustache: '#6b4226', body: 'doublet', color: '#6d5a48', trim: '#d9c6a5', legs: '#3b3430', hat: 'flat_cap', hatColor: '#4a3e34' },
  gary_chute:  { skin: '#ffe3cc', hair: 'tuft', hairColor: '#6b4226', mustache: '#6b4226', body: 'doublet', color: '#5b4d3f', trim: '#d9c6a5', legs: '#3b3430', cape: '#8c7a63', hat: 'leather_cap', hatColor: '#5a3b22' },
  gendarme:    { skin: '#ffdcc2', hair: 'short', hairColor: '#2a1d14', mustache: '#2a1d14', body: 'doublet', color: '#22356b', trim: '#d9b44a', legs: '#b8282e', hat: 'kepi', hatColor: '#22356b' },
  reporter:    { skin: '#f3c9a6', hair: 'short', hairColor: '#3a2a1c', body: 'doublet', color: '#7b6f5e', trim: '#2b2b2b', legs: '#3d3d46', hat: 'flat_cap', hatColor: '#5b5248' },
  executioner: { skin: '#ffd9bd', body: 'tunic', color: '#2a2a2e', trim: '#4a4a52', legs: '#2a2a2e', hat: 'hood', size: 1.1, belly: 0.5 },
};

// ---------- drawing helpers ----------
const cv = document.getElementById('cv'); const g = cv.getContext('2d');
function path(pts, close = true) { g.beginPath(); g.moveTo(...pts[0]); for (const p of pts.slice(1)) g.lineTo(...p); if (close) g.closePath(); }
function fillStroke(fill, lw = 8) { if (fill) { g.fillStyle = fill; g.fill(); } g.lineWidth = lw; g.strokeStyle = INK; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); }
function ell(x, y, rx, ry, rot = 0) { g.beginPath(); g.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, Math.PI * 2); }

// arm angles in degrees from straight down; positive = away from the body. [upper, forearm(relative)]
const POSES = {
  idle: { L: [10, 6], R: [10, 6] },
  hold: { L: [10, 6], R: [-30, -75] },
  point: { L: [10, 6], R: [80, 8] },
  shrug: { L: [55, -95], R: [55, -95] },
  panic: { L: [150, 15], R: [150, 15] },
  hips: { L: [42, -120], R: [42, -120] },
  whisper: { L: [10, 6], R: [-15, -150] },
  wave: { L: [10, 6], R: [140, 35] },
  bow: { L: [-10, -20], R: [-10, -20], lean: 14 },
  axe: { L: [165, 0], R: [165, 0] },
};
function drawArm(side, sx, sy, upper, fore, len, sleeve, skin, wobble) {
  const s = side === 'L' ? -1 : 1;
  const a1 = rad(upper + wobble) * s, a2 = a1 + rad(fore) * s;
  const ex = sx + Math.sin(a1) * len, ey = sy + Math.cos(a1) * len;
  const hx = ex + Math.sin(a2) * len * 0.95, hy = ey + Math.cos(a2) * len * 0.95;
  g.lineCap = 'round';
  g.strokeStyle = INK; g.lineWidth = 34; g.beginPath(); g.moveTo(sx, sy); g.lineTo(ex, ey); g.stroke();
  g.strokeStyle = sleeve; g.lineWidth = 20; g.beginPath(); g.moveTo(sx, sy); g.lineTo(ex, ey); g.stroke();
  g.strokeStyle = INK; g.lineWidth = 15; g.beginPath(); g.moveTo(ex, ey); g.lineTo(hx, hy); g.stroke();
  ell(hx, hy, 17, 17); fillStroke(skin, 6);
  return { hx, hy, ang: a2 };
}
function drawHeld(kind, hx, hy, ang, swing) {
  g.save(); g.translate(hx, hy);
  if (kind === 'cloth') { g.rotate(0.2); path([[-10, 0], [40, -8], [48, 40], [6, 52], [-6, 30]]); fillStroke('#fbfbf5', 6); g.strokeStyle = 'rgba(0,0,0,0.15)'; g.lineWidth = 3; g.beginPath(); g.moveTo(8, 12); g.lineTo(36, 8); g.moveTo(10, 30); g.lineTo(38, 26); g.stroke(); }
  if (kind === 'purse') { ell(0, 34, 34, 30); fillStroke('#8a5a2c', 6); path([[-14, 6], [14, 6]], false); fillStroke(null, 6); g.fillStyle = '#ffd34d'; g.font = '900 34px Poppins'; g.textAlign = 'center'; g.fillText('£', 0, 48); }
  if (kind === 'scroll') { g.rotate(-0.3); g.fillStyle = '#f3e2b8'; g.fillRect(-8, -50, 60, 100); g.lineWidth = 6; g.strokeStyle = INK; g.strokeRect(-8, -50, 60, 100); ell(22, -52, 34, 10); fillStroke('#e6cf98', 6); ell(22, 52, 34, 10); fillStroke('#e6cf98', 6); }
  if (kind === 'camera') { g.fillStyle = INK; g.fillRect(-50, -70, 90, 70); g.fillStyle = '#4a4a52'; g.fillRect(-44, -64, 78, 58); ell(40, -36, 20, 20); fillStroke('#9fb7c9', 6); g.strokeStyle = INK; g.lineWidth = 8; g.beginPath(); g.moveTo(-30, -70); g.lineTo(-30, -96); g.stroke(); }
  if (kind === 'goblet') { path([[-22, -40], [22, -40], [10, 0], [-10, 0]]); fillStroke('#f4c542', 6); g.fillStyle = INK; g.fillRect(-4, 0, 8, 26); ell(0, 28, 20, 6); fillStroke('#f4c542', 5); }
  if (kind === 'axe') {
    g.rotate(ang + Math.PI + (swing || 0));
    g.strokeStyle = INK; g.lineWidth = 18; g.beginPath(); g.moveTo(0, -60); g.lineTo(0, 240); g.stroke();
    g.strokeStyle = '#8a5a2c'; g.lineWidth = 10; g.beginPath(); g.moveTo(0, -60); g.lineTo(0, 240); g.stroke();
    path([[0, 190], [90, 160], [110, 230], [90, 290], [0, 250]]); fillStroke('#b9c2cc', 7);
    g.strokeStyle = '#eef3f7'; g.lineWidth = 5; g.beginPath(); g.moveTo(100, 175); g.lineTo(104, 280); g.stroke();
  }
  g.restore();
}

function drawHead(o, st, t, idSeed) {
  const hy = -560, r = 108;
  // hair behind (long)
  if (o.hair === 'long') { ell(0, hy + 30, r + 18, r + 60); fillStroke(o.hairColor, 8); }
  if (o.hat === 'french_hood') { ell(0, hy - 10, r + 34, r + 40); fillStroke(o.hatColor, 8); }
  // head
  ell(0, hy, r, r * 1.02); fillStroke(st.ghost ? '#eef4ff' : o.skin, 8);
  if (o.hat === 'hood') { // executioner hood covers the head
    g.save(); ell(0, hy, r, r * 1.02); g.clip(); g.fillStyle = '#17171b'; g.fillRect(-r - 5, hy - r - 5, 2 * r + 10, 2 * r + 30); g.restore();
    ell(0, hy, r, r * 1.02); fillStroke(null, 8);
    path([[0, hy - r - 2], [-24, hy - r - 50], [26, hy - r - 40]]); fillStroke('#17171b', 8);
    for (const s of [-1, 1]) { ell(s * 36, hy - 8, 26, 18); fillStroke(o.skin, 5); ell(s * 36, hy - 8, 8, 10); g.fillStyle = INK; g.fill(); }
    return;
  }
  // cheeks
  if (!st.ghost && st.expr !== 'dead') { g.fillStyle = 'rgba(240,110,110,0.35)'; for (const s of [-1, 1]) { ell(s * 62, hy + 28, 20, 12); g.fill(); } }
  // beard
  if (o.beard) {
    g.beginPath(); g.moveTo(-r + 6, hy + 4); g.quadraticCurveTo(-r + 4, hy + r + 40, 0, hy + r + 46); g.quadraticCurveTo(r - 4, hy + r + 40, r - 6, hy + 4);
    g.quadraticCurveTo(r - 30, hy + 60, 0, hy + 62); g.quadraticCurveTo(-r + 30, hy + 60, -r + 6, hy + 4); g.closePath(); fillStroke(o.beard, 7);
  }
  // eyes
  const blink = ((t + idSeed * 0.37) % 3.3) < 0.11;
  const ex = 36, ey = hy - 8;
  for (const s of [-1, 1]) {
    if (st.expr === 'dead') { g.strokeStyle = INK; g.lineWidth = 9; g.beginPath(); g.moveTo(s * ex - 14, ey - 14); g.lineTo(s * ex + 14, ey + 14); g.moveTo(s * ex + 14, ey - 14); g.lineTo(s * ex - 14, ey + 14); g.stroke(); continue; }
    if (st.expr === 'shocked') { ell(s * ex, ey, 22, 24); fillStroke('#fff', 6); ell(s * ex, ey + 2, 8, 9); g.fillStyle = INK; g.fill(); continue; }
    if (blink) { g.strokeStyle = INK; g.lineWidth = 7; g.beginPath(); g.moveTo(s * ex - 12, ey); g.lineTo(s * ex + 12, ey); g.stroke(); continue; }
    ell(s * ex, ey, 10, st.expr === 'smug' ? 6 : 14); g.fillStyle = INK; g.fill();
    ell(s * ex + 3, ey - 5, 3.5, 3.5); g.fillStyle = '#fff'; g.fill();
  }
  // brows
  g.strokeStyle = o.hairColor || INK; g.lineWidth = 9; g.lineCap = 'round';
  const bro = { worried: [10, -14], angry: [-16, 12], smug: [-6, 6], shocked: [0, -14], sick: [8, -6] }[st.expr] || [0, 0];
  for (const s of [-1, 1]) { g.beginPath(); g.moveTo(s * (ex - 18), ey - 30 + bro[1] * 0.3 - (s > 0 ? 0 : 0) + (bro[0] > 0 ? -bro[0] * 0.6 : 0)); g.lineTo(s * (ex + 16), ey - 30 + bro[1] * 0.3 + bro[0] * 0.6); g.stroke(); }
  // mustache
  if (o.mustache) { for (const s of [-1, 1]) { g.beginPath(); g.moveTo(0, hy + 36); g.quadraticCurveTo(s * 30, hy + 22, s * 52, hy + 44); g.quadraticCurveTo(s * 28, hy + 40, 0, hy + 44); g.closePath(); fillStroke(o.mustache, 5); } }
  // mouth
  const my = hy + 56;
  g.strokeStyle = INK; g.lineWidth = 8;
  if (st.talk > 0.05) { ell(0, my, 20, 6 + st.talk * 20); fillStroke('#7a2430', 6); }
  else if (st.expr === 'happy' || st.expr === 'smug') { g.beginPath(); g.arc(st.expr === 'smug' ? 10 : 0, my - 14, 26, 0.35, Math.PI - 0.35); g.stroke(); }
  else if (st.expr === 'shocked') { ell(0, my + 4, 16, 22); fillStroke('#7a2430', 6); }
  else if (st.expr === 'worried' || st.expr === 'sick') { g.beginPath(); g.moveTo(-24, my + 4); for (let i = 0; i <= 8; i++) g.lineTo(-24 + i * 6, my + 4 + (i % 2 ? -5 : 5)); g.stroke(); }
  else if (st.expr === 'angry' || st.expr === 'dead') { g.beginPath(); g.arc(0, my + 22, 24, Math.PI + 0.5, -0.5); g.stroke(); }
  else { g.beginPath(); g.moveTo(-18, my); g.lineTo(18, my); g.stroke(); }
  if (st.expr === 'worried' || st.expr === 'sick') { g.beginPath(); g.moveTo(r - 18, hy - 60); g.quadraticCurveTo(r + 2, hy - 28, r - 12, hy - 20); g.arc(r - 20, hy - 26, 9, 0.3, Math.PI + 0.6); g.closePath(); fillStroke('#8fd3ff', 5); }
  // hair on top
  if (o.hair === 'tuft') { g.beginPath(); g.moveTo(-r + 4, hy - 26); g.quadraticCurveTo(-r + 10, hy - r - 14, 0, hy - r - 10); g.quadraticCurveTo(r - 6, hy - r - 14, r - 4, hy - 26);
    for (let i = 0; i < 6; i++) g.lineTo(r - 4 - (i + 1) * (2 * r - 8) / 6, hy - 26 + (i % 2 ? 0 : 22)); g.closePath(); fillStroke(o.hairColor, 7);
    g.beginPath(); g.moveTo(-6, hy - r - 8); g.bezierCurveTo(-10, hy - r - 60, 40, hy - r - 60, 28, hy - r - 30); g.lineWidth = 8; g.strokeStyle = INK; g.stroke(); }
  if (o.hair === 'short') { g.beginPath(); g.moveTo(-r + 2, hy - 10); g.quadraticCurveTo(-r, hy - r - 10, 0, hy - r - 6); g.quadraticCurveTo(r, hy - r - 10, r - 2, hy - 10); g.quadraticCurveTo(r - 30, hy - 60, 0, hy - 70); g.quadraticCurveTo(-r + 30, hy - 60, -r + 2, hy - 10); g.closePath(); fillStroke(o.hairColor, 7); }
  // hats
  if (o.hat === 'tudor_cap') { ell(-8, hy - r + 6, r + 18, 30, -0.12); fillStroke(o.hatColor, 7); ell(-10, hy - r - 10, 62, 24, -0.12); fillStroke(o.hatColor, 7); g.beginPath(); g.moveTo(40, hy - r - 14); g.quadraticCurveTo(120, hy - r - 70, 150, hy - r - 20); g.quadraticCurveTo(110, hy - r - 30, 46, hy - r - 2); fillStroke('#fbfbf5', 5); }
  if (o.hat === 'flat_cap') { g.beginPath(); g.moveTo(-r + 4, hy - 40); g.quadraticCurveTo(-r + 10, hy - r - 30, 10, hy - r - 24); g.quadraticCurveTo(r + 10, hy - r - 20, r + 40, hy - 50); g.quadraticCurveTo(r - 20, hy - 30, -r + 4, hy - 40); g.closePath(); fillStroke(o.hatColor, 7); }
  if (o.hat === 'leather_cap') { g.beginPath(); g.arc(0, hy - 6, r + 6, Math.PI + 0.25, -0.25); g.closePath(); fillStroke(o.hatColor, 7); for (const s of [-1, 1]) { ell(s * (r - 4), hy + 10, 22, 40); fillStroke(o.hatColor, 6); } ell(0, hy - r + 30, 74, 22); fillStroke('#7fb3c9', 6); }
  if (o.hat === 'kepi') { path([[-70, hy - r + 30], [70, hy - r + 30], [60, hy - r - 60], [-60, hy - r - 60]]); fillStroke(o.hatColor, 7); ell(0, hy - r - 60, 60, 14); fillStroke('#b8282e', 6); g.fillStyle = o.trim; g.fillRect(-70, hy - r + 4, 140, 12); path([[-74, hy - r + 30], [74, hy - r + 30], [60, hy - r + 52], [-60, hy - r + 52]]); fillStroke(INK, 4); }
  if (o.hat === 'crown') { const y0 = hy - r + 22; path([[-74, y0], [-82, y0 - 70], [-42, y0 - 34], [0, y0 - 86], [42, y0 - 34], [82, y0 - 70], [74, y0]]); fillStroke('#f4c542', 7); for (const [x, c] of [[-44, '#d7263d'], [0, '#2a6fdb'], [44, '#d7263d']]) { ell(x, y0 - 16, 9, 9); fillStroke(c, 4); } }
  if (o.hat === 'feather_hat') { ell(0, hy - r + 10, r + 44, 26); fillStroke(o.hatColor, 7); g.beginPath(); g.moveTo(-60, hy - r + 4); g.quadraticCurveTo(-56, hy - r - 66, 0, hy - r - 70); g.quadraticCurveTo(56, hy - r - 66, 60, hy - r + 4); g.closePath(); fillStroke(o.hatColor, 7); g.beginPath(); g.moveTo(40, hy - r - 50); g.bezierCurveTo(120, hy - r - 150, 170, hy - r - 60, 150, hy - r - 20); g.bezierCurveTo(120, hy - r - 70, 90, hy - r - 60, 48, hy - r - 36); fillStroke('#f2ead8', 5); }
  if (o.hat === 'french_hood') { g.beginPath(); g.arc(0, hy + 6, r + 10, Math.PI + 0.15, -0.15); g.lineWidth = 22; g.strokeStyle = INK; g.stroke(); g.lineWidth = 12; g.strokeStyle = o.trim || '#f2d27a'; g.stroke(); }
  if (st.ghost) { ell(0, hy - r - 40, 70, 16); g.lineWidth = 12; g.strokeStyle = '#ffd34d'; g.stroke(); }
}

function drawBody(o, st, t) {
  const top = -440, waist = -250;
  const sw = o.body === 'robe' ? 112 : o.body === 'dress' ? 78 : 84;
  const lp = o.legs || '#333';
  // cape / parachute canopy (behind everything)
  if (o.cape) { g.beginPath(); g.moveTo(-sw + 6, top + 10); g.quadraticCurveTo(-sw - 150, -260, -sw - 90, -40); for (let i = 0; i <= 8; i++) g.lineTo(lerp(-sw - 90, sw + 90, i / 8), -40 + (i % 2 ? 22 : 0)); g.quadraticCurveTo(sw + 150, -260, sw - 6, top + 10); g.closePath(); fillStroke(o.cape, 8);
    g.strokeStyle = 'rgba(0,0,0,0.18)'; g.lineWidth = 5; for (let i = 1; i < 8; i++) { g.beginPath(); g.moveTo(lerp(-sw, sw, i / 8), top + 30); g.lineTo(lerp(-sw - 90, sw + 90, i / 8), -40); g.stroke(); } }
  // legs
  if (o.body !== 'dress') {
    const ly = o.body === 'robe' ? -110 : waist + 20;
    for (const s of [-1, 1]) {
      const fx = s * 40 + (st.walk ? Math.sin(t * 9 + (s > 0 ? Math.PI : 0)) * 22 : 0);
      g.strokeStyle = INK; g.lineWidth = 30; g.lineCap = 'round'; g.beginPath(); g.moveTo(s * 34, ly); g.lineTo(fx, -16); g.stroke();
      g.strokeStyle = lp; g.lineWidth = 18; g.beginPath(); g.moveTo(s * 34, ly); g.lineTo(fx, -16); g.stroke();
      ell(fx + s * 12, -10, 32, 16); fillStroke('#2b1d12', 6);
    }
  }
  if (o.body === 'robe') {
    path([[-sw, top + 10], [sw, top + 10], [sw + 60, -100], [-sw - 60, -100]]); fillStroke(o.color, 8);
    ell(0, -260, 120 + 30 * (o.belly || 0), 140 + 20 * (o.belly || 0)); fillStroke(o.color, 8);
    g.fillStyle = o.trim; g.fillRect(-14, top + 30, 28, 330); g.strokeStyle = INK; g.lineWidth = 6; g.strokeRect(-14, top + 30, 28, 330);
    if (o.fur) { for (const s of [-1, 1]) { path([[s * 30, top + 6], [s * (sw + 22), top + 2], [s * (sw + 70), -110], [s * (sw + 30), -110]]); fillStroke('#fbf7ee', 7); g.fillStyle = INK; for (let i = 0; i < 6; i++) { ell(s * (sw + 18 + i * 7), top + 50 + i * 50, 4, 7); g.fill(); } } }
  } else if (o.body === 'dress') {
    g.beginPath(); g.moveTo(-60, waist - 50); g.quadraticCurveTo(-200, -120, -190, -8); g.lineTo(190, -8); g.quadraticCurveTo(200, -120, 60, waist - 50); g.closePath(); fillStroke(o.color, 8);
    path([[-sw, top + 10], [sw, top + 10], [62, waist - 40], [-62, waist - 40]]); fillStroke(o.color, 8);
    path([[-40, waist - 46], [40, waist - 46], [0, 0 - 20]]); fillStroke(o.trim, 6);
    g.beginPath(); g.moveTo(-sw + 10, top + 14); g.quadraticCurveTo(0, top + 70, sw - 10, top + 14); g.lineWidth = 10; g.strokeStyle = o.trim; g.stroke();
  } else {
    const belly = (o.belly || 0) * 30;
    g.beginPath(); g.moveTo(-sw, top + 10); g.lineTo(sw, top + 10); g.quadraticCurveTo(sw + 18 + belly, -330, sw + 10, waist); g.lineTo(sw + 34, waist + 46); g.lineTo(-sw - 34, waist + 46); g.lineTo(-sw - 10, waist); g.quadraticCurveTo(-sw - 18 - belly, -330, -sw, top + 10); g.closePath(); fillStroke(o.color, 8);
    g.fillStyle = o.trim; g.fillRect(-sw - 8, waist - 8, 2 * sw + 16, 20); g.strokeStyle = INK; g.lineWidth = 5; g.strokeRect(-sw - 8, waist - 8, 2 * sw + 16, 20);
    if (o.body === 'doublet') for (let i = 0; i < 4; i++) { ell(0, top + 50 + i * 36, 7, 7); fillStroke(o.trim, 4); }
  }
  if (o.necklace) { g.beginPath(); g.arc(0, top + 6, 46, 0.4, Math.PI - 0.4); g.lineWidth = 6; g.strokeStyle = '#f4f0e6'; g.stroke(); g.fillStyle = '#f4c542'; g.font = '900 40px Poppins'; g.textAlign = 'center'; g.fillText('B', 0, top + 70); }
  return { sw, top };
}

function drawPerson(c, st, t, idSeed) {
  const o = WARDROBE[c.who] || WARDROBE.gary;
  const pose = POSES[st.pose] || POSES.idle;
  g.save();
  g.globalAlpha = st.ghost ? 0.82 : 1;
  const wob = Math.sin(t * 2.2 + idSeed) * 2.5;
  const { sw, top } = drawBody(st.ghost ? { ...o, color: '#e6eeff', trim: '#cfdcff', legs: '#dfe8ff', fur: false, cape: o.cape && '#dfe8ff' } : o, st, t);
  // arms (behind the head)
  let L = pose.L, R = pose.R; let swing = 0;
  if (st.pose === 'axe' && st.swing != null) { const k = st.swing; L = [lerp(165, 70, k), 0]; R = [lerp(165, 70, k), 0]; swing = 0; }
  const sleeve = st.ghost ? '#e6eeff' : o.color;
  const armLen = 118;
  const al = drawArm('L', -sw + 8, top + 34, L[0], L[1], armLen, sleeve, o.skin, wob);
  const ar = drawArm('R', sw - 8, top + 34, R[0], R[1], armLen, sleeve, o.skin, -wob);
  if (st.hold) drawHeld(st.hold, ar.hx, ar.hy, ar.ang, swing);
  // head (with a little talk bob)
  g.save(); g.translate(0, st.talk * -6); g.rotate(rad(st.headTilt || 0));
  drawHead(st.ghost ? { ...o, hatColor: '#dfe8ff', hairColor: '#cfdcff' } : o, st, t, idSeed);
  g.restore();
  g.restore();
}

// ---------- scene props ----------
function drawProp(p) {
  g.save(); g.translate(p.x * W, p.y ?? GROUND); g.scale(p.s || 1, p.s || 1);
  if (p.type === 'stool') { // Tudor close stool: padded box toilet
    g.fillStyle = '#6b3f22'; path([[-120, 0], [120, 0], [110, -170], [-110, -170]]); fillStroke('#7a4a28', 8);
    ell(0, -180, 128, 34); fillStroke('#b3202c', 8); ell(0, -184, 70, 16); fillStroke('#3a0d12', 6);
    for (const x of [-70, 0, 70]) { ell(x, -80, 10, 10); fillStroke('#f4c542', 4); }
  }
  if (p.type === 'block') { path([[-120, 0], [120, 0], [100, -110], [-100, -110]]); fillStroke('#8a5a2c', 8); ell(0, -112, 102, 24); fillStroke('#a87444', 7); g.fillStyle = 'rgba(40,20,10,0.4)'; g.fillRect(-30, -120, 60, 8); }
  if (p.type === 'throne') { path([[-150, 0], [150, 0], [150, -260], [120, -560], [-120, -560], [-150, -260]]); fillStroke('#b3202c', 8); path([[-170, -240], [170, -240], [170, -200], [-170, -200]]); fillStroke('#f4c542', 7); }
  g.restore();
}

// ---------- captions ----------
const $ = id => document.getElementById(id);
const capEl = $('caption'), labelEl = $('label'), flashEl = $('flash'), redEl = $('redflash');
const KEY = new RegExp('^(' + ['die', 'died', 'king', 'rich', 'axe', 'worst', 'day', 'month', 'year', 'never', ...(script.keywords || [])].join('|') + ')', 'i');
const groups = [];
timeline.beats.forEach(b => {
  let cur = null;
  b.words.forEach(w => {
    if (!cur || cur.words.length >= 3 || cur.speaker !== w.speaker || cur.chars + w.w.length > 15) { cur = { words: [], speaker: w.speaker, chars: 0, s: w.s }; groups.push(cur); }
    cur.words.push(w.w); cur.chars += w.w.length + 1; cur.e = w.e;
    if (/[.,!?;:]$/.test(w.w)) cur = null;
  });
});
function captionAt(t) { for (let i = 0; i < groups.length; i++) { const q = groups[i], n = groups[i + 1]; if (t >= q.s - 0.04 && t < Math.min(n ? n.s : Infinity, q.e + 0.35)) return q; } return null; }
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

// ---------- main ----------
const GROUND = script.ground || 1620;
const beats = script.beats.map((b, i) => ({ ...b, ...timeline.beats[i] }));
window.DURATION = timeline.duration;
const coins = Array.from({ length: 40 }, (_, i) => { const r = rng(i + 11); return { x: r() * W, d: r() * 1.5, sp: 700 + r() * 500, rot: r() * 6 }; });

window.renderFrame = (t) => {
  let bi = beats.findIndex(b => t < b.end); if (bi < 0) bi = beats.length - 1;
  const b = beats[bi]; const lt = t - b.start; const dur = b.end - b.start; const p = clamp(lt / dur);
  const cast = b.cast || [];
  // camera
  let z0 = 1.0, z1 = 1.06, cx = W / 2, cy = 1150, panX = 0;
  const focus = cast.find(c => c.id === b.focus) || cast[0];
  if (b.camera === 'wide') { z0 = 1.06; z1 = 1.0; }
  if (b.camera === 'close' && focus) { z0 = 1.32; z1 = 1.42; cx = focus.x * W; cy = GROUND - 520 * (focus.s || 1) * ((WARDROBE[focus.who] || {}).size || 1); }
  if (b.camera === 'pan') { panX = lerp(-50, 50, ease(p)); }
  let z = lerp(z0, z1, ease(p));
  let shake = b.fx === 'shake' ? 6 : 0;
  if (b.deathAt != null && t >= b.deathAt) shake = 22 * Math.exp(-(t - b.deathAt) * 5);
  const sx = Math.sin(t * 83) * shake, sy = Math.cos(t * 71) * shake;
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#1b1410'; g.fillRect(0, 0, W, H);
  // background with gentle parallax zoom
  const im = bgs[b.bg];
  if (im) {
    const base = Math.max(W / im.width, H / im.height); const bz = base * (1 + (z - 1) * 0.6) * 1.02;
    const bw = im.width * bz, bh = im.height * bz;
    const bx = W / 2 - bw / 2 + (W / 2 - cx) * (z - 1) * 0.6 + panX * 0.6 + sx, by = H / 2 - bh / 2 + (H / 2 - cy) * (z - 1) * 0.4 + sy;
    g.drawImage(im, bx, by, bw, bh);
  }
  // world transform for characters and props
  g.setTransform(z, 0, 0, z, (1 - z) * cx + panX + sx, (1 - z) * cy + sy);
  // soft ground shadow band so feet sit in the picture
  for (const pr of b.props || []) drawProp(pr);
  cast.forEach((c, i) => {
    const o = WARDROBE[c.who] || WARDROBE.gary;
    const s = (c.s || 1) * (o.size || 1) * 0.95;
    let x = c.x * W;
    if (c.enter) { const k = easeOut(lt / 0.45); x += (c.enter === 'left' ? -1 : 1) * (1 - k) * 700; }
    const talking = b.words.find(w => w.speaker === c.id && t >= w.s && t <= w.e);
    const st = { pose: c.pose || 'idle', expr: c.expr || 'neutral', hold: c.hold, ghost: c.ghost, talk: talking ? Math.abs(Math.sin(t * 26)) : 0, walk: !!c.enter && lt < 0.45 };
    let fall = 0, y = GROUND;
    if (c.ghost) y -= 60 + 25 * Math.sin(t * 2.1);
    let jumpRot = 0;
    if (c.jump) { const j0 = b.deathAt != null ? b.deathAt - 1.2 : b.start + dur * 0.55; const k = clamp((t - j0) / 1.1); if (k > 0) { y += -260 * Math.sin(Math.min(k, 0.25) / 0.25 * Math.PI / 2) * (1 - k) + 2600 * k * k; jumpRot = 40 * k; } }
    if (st.pose === 'axe' && b.deathAt != null) st.swing = ease(clamp((t - (b.deathAt - 0.35)) / 0.3));
    if (b.death && b.deathOf === c.id && b.deathAt != null) {
      if (t >= b.deathAt - 0.5 && t < b.deathAt) st.expr = 'shocked';
      if (t >= b.deathAt) { st.expr = 'dead'; fall = backOut((t - b.deathAt) / 0.45); st.pose = 'idle'; st.hold = null; }
    }
    // ground shadow
    g.fillStyle = 'rgba(20,10,5,0.28)'; ell(x, y + 4, 130 * s, 22 * s); g.fill();
    g.save(); g.translate(x, y); g.scale(c.flip ? -s : s, s);
    g.rotate(rad(jumpRot) + rad(-88 * fall * (c.flip ? -1 : 1) * (c.jump ? 0 : 1)) + (POSES[st.pose]?.lean ? rad(POSES[st.pose].lean) : 0) + Math.sin(t * 1.7 + i) * 0.012);
    const bob = Math.abs(Math.sin(t * 2.4 + i)) * 6 + st.talk * 4;
    g.translate(0, -bob);
    drawPerson(c, st, t, i + 1);
    g.restore();
  });
  // fx: coin rain
  if (b.fx === 'coins') coins.forEach(cn => { const yy = ((lt - cn.d) * cn.sp) % (H + 200) - 100; if (lt < cn.d) return; g.save(); g.translate(cn.x, yy); g.scale(Math.cos(t * 6 + cn.rot), 1); ell(0, 0, 30, 30); fillStroke('#ffcf3a', 6); g.fillStyle = '#e0a800'; g.font = '900 34px Poppins'; g.textAlign = 'center'; g.fillText('£', 0, 12); g.restore(); });
  g.setTransform(1, 0, 0, 1, 0, 0);

  // overlays
  flashEl.style.opacity = bi > 0 && lt < 0.1 ? 0.45 * (1 - lt / 0.1) : 0;
  const since = b.deathAt != null ? t - b.deathAt : -1;
  redEl.style.opacity = since >= 0 && since < 1.3 ? 0.95 * (1 - since / 1.3) : 0;
  if (b.label) {
    labelEl.className = b.hook ? 'hook' : '';
    labelEl.innerHTML = `<span class="chip">${esc(b.label).replace(/\*([^*]+)\*/g, '<span class="hot">$1</span>')}</span>`;
    labelEl.style.opacity = clamp(lt / 0.08);
    labelEl.style.transform = `translateY(${lerp(-50, 0, easeOut(lt / 0.3))}px) scale(${lerp(0.6, 1, backOut(lt / 0.32)) * (b.hook ? 1 + 0.025 * Math.sin(t * 7) : 1)}) rotate(${b.hook ? 0 : -2}deg)`;
  } else labelEl.style.opacity = 0;
  const q = captionAt(t);
  if (q) {
    const who = q.speaker !== 'narrator' ? (script.names || {})[q.speaker] : '';
    capEl.innerHTML = (who ? `<span class="who">${esc(who)}</span>` : '') + q.words.map(w => KEY.test(w) || /\d/.test(w) ? `<span class="k">${esc(w)}</span>` : esc(w)).join(' ');
    capEl.style.transform = `translateY(${lerp(26, 0, easeOut((t - q.s) / 0.14))}px) scale(${lerp(0.86, 1, backOut((t - q.s) / 0.18))})`;
    capEl.style.opacity = clamp((t - q.s + 0.04) / 0.06);
  } else capEl.style.opacity = 0;
};
window.READY = true;
