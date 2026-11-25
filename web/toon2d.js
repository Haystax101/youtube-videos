// "toon2d" style for Gary Tries It long-form (landscape 1920x1080): outlined 2D TV-cartoon scenes
// drawn with Canvas2D in parallax layers, a 2D-rigged Gary (two-bone IK limbs, expressive face),
// cartoon dinosaurs, and the flat infographic inserts from web/diorama-inserts.js.
// Same page contract as the other styles: window.renderFrame(t), window.DURATION, window.READY.
// Everything is a pure function of t (no per-frame state), so render workers can split the video.
//
// Script vocabulary (same as diorama, so scripts move between the two):
//   scene: tanis (Cretaceous riverbank), burrow (cutaway of an underground den), today (badlands dig)
//   phase (tanis): calm, shake, surge, glassrain, glow, fires, dark, cold, recovery
//   gary: { pose, expr }  pose: stand, point, lookup, shelter, wobble, run, cold, wave, critter (Gary as a tiny mammal)
//                         expr: happy, neutral, worried, shocked, sick
//   camera: wide, push, face, low, orbit, crane, crane_up, dolly, truck (2D pans/zooms with parallax)
//   dinos: true -> herd on the far bank (also shown in calm/shake/surge/glassrain/glow phases)
//   insert: spring, map, scale, gills, debate (step 1|2), foodchain, extinction, timeline  (full-frame flat graphics)
//   card: { title, subtitle }  chapter card over a blurred wide shot
//   sfx: rumble | boom (pipeline/mix.py)
import { drawInsert } from './diorama-inserts.js';

const W = 1920, H = 1080, CX = W / 2, CY = H / 2;
const QS = new URLSearchParams(location.search);
const ep = QS.get('ep');
const script = await (await fetch(`/episodes/${ep}/script.json`)).json();
const timeline = await (await fetch(`/episodes/${ep}/timeline.json`)).json();

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => { t = clamp(t); return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };
const easeOut = t => 1 - Math.pow(1 - clamp(t), 3);
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const hashf = (i, s = 1) => { const r = rng(i * 7919 + s * 104729); r(); return r(); };
const mix = (a, b, t) => { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); const A = p(a), B = p(b); return '#' + A.map((v, i) => Math.round(lerp(v, B[i], t)).toString(16).padStart(2, '0')).join(''); };

const canvas = document.getElementById('c');
const g = canvas.getContext('2d');
const INK = '#1d1a2b';
let LWS = 1; // outline scale for the current layer (thinner when zoomed in, so close-ups don't get chunky)

// ---------- drawing helpers ----------
function S(path, fill, lw = 6) {
  g.beginPath(); path();
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (lw) { g.lineWidth = lw * LWS; g.strokeStyle = INK; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); }
}
function poly(pts, close = true) { pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); if (close) g.closePath(); }
function limb(pts, w, col, lw = 7) {
  g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); poly(pts, false); g.strokeStyle = INK; g.lineWidth = w + 2 * lw * LWS; g.stroke();
  g.beginPath(); poly(pts, false); g.strokeStyle = col; g.lineWidth = w; g.stroke();
}
function ik(S0, T, l1, l2, side) { // two-bone IK; returns the joint, bending towards `side` (+1 right, -1 left)
  let dx = T[0] - S0[0], dy = T[1] - S0[1]; let d = Math.hypot(dx, dy); const dm = Math.min(d, l1 + l2 - 0.5); if (d < 1e-3) d = 1e-3;
  const tx = S0[0] + dx / d * dm, ty = S0[1] + dy / d * dm;
  const a = Math.acos(clamp((l1 * l1 + dm * dm - l2 * l2) / (2 * l1 * dm), -1, 1)), base = Math.atan2(ty - S0[1], tx - S0[0]);
  const j1 = [S0[0] + Math.cos(base + a) * l1, S0[1] + Math.sin(base + a) * l1], j2 = [S0[0] + Math.cos(base - a) * l1, S0[1] + Math.sin(base - a) * l1];
  const j = (j1[0] - j2[0]) * side >= 0 ? j1 : j2; return [j, [tx, ty]];
}

// ======================================================================
// Gary (rig units: feet at 0, up is negative; ~610 units tall)
// ======================================================================
const SKIN = '#f2c09a', HAIR = '#4a2c1a', TOP = '#f08a24', TOP2 = '#d9741a', PANTS = '#2f3a66', SHOE = '#f4f1ea';
function garyPose(pose, t, k) {
  const br = Math.sin(t * 2.2) * 4; // breathing
  const P = { c: 0, tilt: 0, dx: 0, hands: [[-118, -180 + br], [118, -180 + br]], feet: [[-42, -14], [42, -14]], look: [0, 0], shade: false, shiver: 0, bob: 0 };
  switch (pose) {
    case 'point': P.hands[1] = [235, -470 + Math.sin(t * 2) * 6]; P.look = [0.8, -0.35]; break;
    case 'lookup': P.hands[1] = [62, -548]; P.shade = true; P.look = [0.15, -1]; P.hands[0] = [-122, -190 + br]; break;
    case 'shelter': P.c = 95 + Math.sin(t * 9) * 3; P.hands = [[-58, -585], [58, -585]]; P.feet = [[-70, -14], [70, -14]]; P.look = [0.6, -0.6]; P.shiver = 2; break;
    case 'wobble': P.tilt = Math.sin(t * 5.5) * 0.12; P.hands = [[-250 + Math.sin(t * 9) * 25, -360 + Math.cos(t * 7) * 40], [250 + Math.cos(t * 8) * 25, -370 + Math.sin(t * 9) * 40]]; P.feet = [[-70, -14], [70, -14]]; P.look = [Math.sin(t * 3) * 0.7, -0.2]; break;
    case 'run': { const ph = t * 11; P.bob = Math.abs(Math.sin(ph)) * -18; P.feet = [[-40 + Math.sin(ph) * 26, -14 - Math.max(0, Math.sin(ph)) * 60], [40 - Math.sin(ph) * 26, -14 - Math.max(0, -Math.sin(ph)) * 60]];
      P.hands = [[-120, -250 - Math.sin(ph) * 60], [120, -250 + Math.sin(ph) * 60]]; P.tilt = 0.06; P.look = [1, 0]; P.dx = 0; break; }
    case 'cold': P.hands = [[52, -300], [-52, -300]]; P.shiver = 5; P.feet = [[-26, -14], [26, -14]]; P.look = [0, 0.2]; break;
    case 'wave': P.hands[1] = [205 + Math.sin(t * 9) * 45, -560]; P.look = [0, 0]; break;
    default: break;
  }
  return P;
}
const BROWS = {
  happy: [[-64, -540, -40, -556, -14, -546], [14, -546, 40, -556, 64, -540]],
  neutral: [[-62, -542, -40, -548, -16, -544], [16, -544, 40, -548, 62, -542]],
  worried: [[-64, -532, -40, -540, -16, -556], [16, -556, 40, -540, 64, -532]],
  shocked: [[-64, -560, -40, -578, -14, -566], [14, -566, 40, -578, 64, -560]],
  sick: [[-62, -536, -40, -532, -16, -540], [16, -540, 40, -532, 62, -536]],
};
function drawGary(x, y, sc, pose, expr, t, k) {
  const P = garyPose(pose, t, k);
  g.save(); g.translate(x + Math.sin(t * 47) * P.shiver * sc, y); g.scale(sc, sc); g.rotate(P.tilt); g.translate(0, P.bob);
  const lw = 8, c = P.c;
  // shadow
  g.fillStyle = 'rgba(29,26,43,0.22)'; g.beginPath(); g.ellipse(0, 6, 150, 24, 0, 0, 7); g.fill();
  // legs
  for (const s of [-1, 1]) { const hip = [s * 36, -175 + c], foot = P.feet[s < 0 ? 0 : 1]; const [knee, ank] = ik(hip, foot, 82, 82, s); limb([hip, knee, ank], 50, PANTS, lw);
    S(() => g.ellipse(ank[0] + s * 8, ank[1] + 12, 48, 24, 0, 0, 7), SHOE, lw); }
  // hood (behind head)
  S(() => g.ellipse(0, -392 + c, 92, 46, 0, 0, 7), TOP2, lw);
  // torso
  S(() => { g.moveTo(-96, -160 + c); g.quadraticCurveTo(-112, -380 + c, 0, -392 + c); g.quadraticCurveTo(112, -380 + c, 96, -160 + c); g.quadraticCurveTo(0, -142 + c, -96, -160 + c); }, TOP, lw);
  S(() => g.roundRect(-56, -252 + c, 112, 58, 24), TOP2, lw * 0.7);
  g.strokeStyle = INK; g.lineWidth = 5 * LWS; g.beginPath(); g.moveTo(-18, -372 + c); g.lineTo(-22, -306 + c); g.moveTo(18, -372 + c); g.lineTo(22, -306 + c); g.stroke();
  // head
  const hy = -480 + c, sick = expr === 'sick';
  g.save(); g.translate(0, hy); g.rotate(P.look[0] * 0.08);
  S(() => g.ellipse(0, 0, 106, 112, 0, 0, 7), sick ? '#d9cf9a' : SKIN, lw);
  S(() => { g.moveTo(-108, -10); g.quadraticCurveTo(-112, -132, 0, -127); g.quadraticCurveTo(102, -132, 113, -25); g.quadraticCurveTo(62, -80, -8, -66); g.quadraticCurveTo(-60, -80, -108, -10); }, HAIR, lw);
  // ears
  for (const s of [-1, 1]) S(() => g.ellipse(s * 106, 6, 16, 24, 0, 0, 7), sick ? '#d9cf9a' : SKIN, lw * 0.8);
  g.translate(0, 480);
  // eyes
  const blink = (t % 3.9) < 0.11 || expr === 'sick' && (t % 2.3) < 0.2;
  for (const ex of [-38, 38]) {
    if (blink) { g.strokeStyle = INK; g.lineWidth = 6 * LWS; g.beginPath(); g.moveTo(ex - 24, -490); g.quadraticCurveTo(ex, -480, ex + 24, -490); g.stroke(); continue; }
    const big = expr === 'shocked' ? 1.15 : 1;
    S(() => g.ellipse(ex, -490, 28 * big, 36 * big, 0, 0, 7), '#fff', 5);
    const px = ex + P.look[0] * 11, py = -490 + P.look[1] * 15;
    g.fillStyle = INK; g.beginPath(); g.arc(px, py, expr === 'shocked' ? 10 : 13, 0, 7); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(px + 4, py - 5, 4.5, 0, 7); g.fill();
    if (sick) { g.fillStyle = 'rgba(120,130,60,0.35)'; g.beginPath(); g.ellipse(ex, -470, 26, 10, 0, 0, 7); g.fill(); }
  }
  // brows
  g.strokeStyle = INK; g.lineWidth = 8 * LWS; g.lineCap = 'round';
  for (const [a, b2, c2, d, e, f] of BROWS[expr] || BROWS.neutral) { g.beginPath(); g.moveTo(a, b2); g.quadraticCurveTo(c2, d, e, f); g.stroke(); }
  // mouth
  const my = -418;
  if (expr === 'happy') { S(() => { g.moveTo(-36, my - 8); g.quadraticCurveTo(0, my + 44, 36, my - 8); g.quadraticCurveTo(0, my + 4, -36, my - 8); }, '#7a2230', 5);
    g.fillStyle = '#e86a7a'; g.beginPath(); g.ellipse(0, my + 14, 13, 7, 0, 0, 7); g.fill(); }
  else if (expr === 'shocked') { S(() => g.ellipse(0, my, 22, 30, 0, 0, 7), '#7a2230', 5); g.fillStyle = '#e86a7a'; g.beginPath(); g.ellipse(0, my + 14, 12, 8, 0, 0, 7); g.fill(); }
  else if (expr === 'worried') { g.lineWidth = 7 * LWS; g.beginPath(); g.moveTo(-30, my + 10); g.quadraticCurveTo(-15, my - 4, 0, my + 4); g.quadraticCurveTo(15, my - 4, 30, my + 8); g.stroke(); }
  else if (sick) { g.lineWidth = 7 * LWS; g.beginPath(); g.moveTo(-30, my + 4); for (let i = 1; i <= 6; i++) g.lineTo(-30 + i * 10, my + 4 + (i % 2 ? -7 : 5)); g.stroke(); }
  else { g.lineWidth = 7 * LWS; g.beginPath(); g.moveTo(-22, my); g.quadraticCurveTo(0, my + 10, 22, my); g.stroke(); }
  // cheeks
  g.fillStyle = sick ? 'rgba(130,160,70,0.45)' : 'rgba(230,110,110,0.42)'; g.beginPath(); g.ellipse(-72, -450, 18, 11, 0, 0, 7); g.ellipse(72, -450, 18, 11, 0, 0, 7); g.fill();
  g.restore();
  // arms (in front)
  for (const s of [-1, 1]) { const sh = [s * 80, -348 + c], hand = P.hands[s < 0 ? 0 : 1]; const [el, wr] = ik(sh, hand, 100, 96, pose === 'cold' ? -s : s);
    limb([sh, el, wr], 50, TOP, lw); S(() => g.ellipse(wr[0], wr[1] + 2, 34, 10, Math.atan2(wr[1] - el[1], wr[0] - el[0]) + Math.PI / 2, 0, 7), TOP2, lw * 0.7);
    if (P.shade && s > 0) S(() => g.ellipse(wr[0] + 22, wr[1] + 4, 56, 26, -0.3, 0, 7), SKIN, lw);
    else S(() => g.arc(wr[0], wr[1] + 10, 27, 0, 7), SKIN, lw); }
  g.restore();
}

// Gary as a tiny burrowing mammal (faces right; rig units, ~210 tall)
function drawCritter(x, y, sc, expr, t, flip = false) {
  g.save(); g.translate(x, y); g.scale(flip ? -sc : sc, sc);
  const br = Math.sin(t * 3) * 3, lw = 7;
  g.fillStyle = 'rgba(29,26,43,0.22)'; g.beginPath(); g.ellipse(0, 4, 130, 18, 0, 0, 7); g.fill();
  // tail
  g.lineCap = 'round'; g.strokeStyle = INK; g.lineWidth = 22 + 2 * lw * LWS; g.beginPath(); g.moveTo(-80, -50); g.quadraticCurveTo(-170, -40 + Math.sin(t * 2) * 10, -190, -110 + Math.sin(t * 2.5) * 12); g.stroke();
  g.strokeStyle = '#c98f7a'; g.lineWidth = 22; g.stroke();
  // back feet
  for (const fx of [-50, 40]) S(() => g.ellipse(fx, -6, 30, 14, 0, 0, 7), '#7a5236', lw);
  // body
  S(() => g.ellipse(0, -70 + br * 0.3, 100, 66 + br, 0, 0, 7), '#8a6244', lw);
  S(() => g.ellipse(30, -56, 58, 40, 0, 0, 7), '#d9b08a', 0);
  // hoodie on the body
  S(() => { g.moveTo(-60, -120); g.quadraticCurveTo(10, -150, 70, -110); g.quadraticCurveTo(100, -60, 70, -20); g.quadraticCurveTo(0, -6, -70, -30); g.quadraticCurveTo(-90, -80, -60, -120); }, TOP, lw);
  S(() => g.roundRect(-10, -70, 54, 30, 12), TOP2, lw * 0.6);
  // head
  g.save(); g.translate(80, -128 + br * 0.4); g.rotate(Math.sin(t * 1.3) * 0.06);
  for (const [ex, ey] of [[-40, -46], [10, -56]]) { S(() => g.ellipse(ex, ey, 26, 30, 0, 0, 7), '#8a6244', lw); g.fillStyle = '#e8a0a0'; g.beginPath(); g.ellipse(ex, ey + 2, 14, 17, 0, 0, 7); g.fill(); }
  S(() => { g.ellipse(0, 0, 62, 54, 0, 0, 7); }, '#8a6244', lw);
  S(() => { g.moveTo(20, -18); g.quadraticCurveTo(96, -6, 98, 14); g.quadraticCurveTo(70, 36, 20, 30); }, '#a87a58', lw);
  const tw = Math.sin(t * 14) * 2;
  S(() => g.arc(98 + tw, 10, 11, 0, 7), '#3a2220', lw * 0.6);
  // whiskers
  g.strokeStyle = INK; g.lineWidth = 3 * LWS; for (const a of [-0.2, 0, 0.2]) { g.beginPath(); g.moveTo(80, 18); g.lineTo(80 + Math.cos(a) * 46, 18 + Math.sin(a) * 30); g.stroke(); }
  const blink = (t % 3.3) < 0.1;
  for (const ex of [-6, 30]) { if (blink) { g.lineWidth = 5 * LWS; g.beginPath(); g.moveTo(ex - 10, -12); g.lineTo(ex + 10, -12); g.stroke(); continue; }
    S(() => g.ellipse(ex, -12, 13, 16, 0, 0, 7), '#fff', 4); g.fillStyle = INK; g.beginPath(); g.arc(ex + 4, -12, 7, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(ex + 6, -15, 2.5, 0, 7); g.fill(); }
  g.strokeStyle = INK; g.lineWidth = 5 * LWS;
  if (expr === 'happy') { g.beginPath(); g.moveTo(44, 30); g.quadraticCurveTo(58, 44, 72, 30); g.stroke(); }
  else if (expr === 'worried') { g.beginPath(); g.moveTo(44, 38); g.quadraticCurveTo(58, 28, 72, 38); g.stroke(); g.beginPath(); g.moveTo(-18, -34); g.lineTo(0, -40); g.moveTo(22, -40); g.lineTo(40, -34); g.stroke(); }
  else { g.beginPath(); g.moveTo(46, 34); g.lineTo(70, 34); g.stroke(); }
  g.restore();
  // front paws
  for (const fx of [60, 92]) S(() => g.ellipse(fx, -8, 20, 12, 0, 0, 7), '#7a5236', lw);
  g.restore();
}

// ======================================================================
// dinosaurs (face right unless flipped; feet at 0)
// ======================================================================
function drawTrike(x, y, s, flip, t, alarm, col = '#8a6f9e') {
  g.save(); g.translate(x, y); g.scale(flip ? -s : s, s);
  const bob = alarm ? Math.sin(t * 9 + x) * 6 : Math.max(0, Math.sin(t * 0.8 + x)) * 14, lw = 6;
  for (const lx of [-80, 40]) S(() => g.roundRect(lx - 18, -40, 36, 40, 14), mix(col, '#000000', 0.15), lw);
  S(() => { g.moveTo(-130, -80); g.quadraticCurveTo(-230, -60, -255, -40); g.quadraticCurveTo(-200, -45, -125, -50); }, col, lw);
  S(() => g.ellipse(0, -80, 140, 72, 0, 0, 7), col, lw);
  S(() => g.ellipse(-10, -52, 100, 28, 0, 0, 7), mix(col, '#ffffff', 0.25), 0);
  for (const lx of [-30, 90]) S(() => g.roundRect(lx - 18, -40, 36, 42, 14), col, lw);
  g.save(); g.translate(130, -90); g.rotate(alarm ? -0.25 : bob * 0.012);
  S(() => g.ellipse(20, -10, 58, 92, 0.5, 0, 7), '#e9c27a', lw);
  S(() => g.ellipse(45, 30, 70, 44, 0.15, 0, 7), col, lw);
  S(() => { g.moveTo(40, -2); g.lineTo(122, -62); g.lineTo(58, 14); }, '#fff4dc', 5);
  S(() => { g.moveTo(88, 26); g.lineTo(132, 6); g.lineTo(98, 42); }, '#fff4dc', 5);
  S(() => g.arc(56, 14, 11, 0, 7), '#fff', 4); g.fillStyle = INK; g.beginPath(); g.arc(60, alarm ? 10 : 12, 5.5, 0, 7); g.fill();
  g.restore(); g.restore();
}
function drawEdmo(x, y, s, flip, t, alarm, col = '#6f9a9a') {
  g.save(); g.translate(x, y); g.scale(flip ? -s : s, s); const lw = 6;
  S(() => { g.moveTo(-90, -120); g.quadraticCurveTo(-240, -110, -300, -150); g.quadraticCurveTo(-220, -80, -90, -80); }, col, lw);
  S(() => g.roundRect(-60, -70, 40, 72, 16), mix(col, '#000000', 0.15), lw);
  S(() => g.ellipse(0, -120, 120, 62, -0.1, 0, 7), col, lw);
  S(() => g.ellipse(0, -96, 84, 24, -0.1, 0, 7), mix(col, '#ffffff', 0.3), 0);
  S(() => g.roundRect(-20, -80, 44, 82, 18), col, lw);
  S(() => g.roundRect(70, -70, 26, 70, 12), col, lw);
  const nod = alarm ? -0.5 : Math.sin(t * 0.9 + x) * 0.12;
  g.save(); g.translate(90, -150); g.rotate(nod);
  S(() => { g.moveTo(-20, 20); g.quadraticCurveTo(10, -70, 40, -110); g.lineTo(80, -100); g.quadraticCurveTo(40, -40, 30, 30); }, col, lw);
  S(() => g.ellipse(70, -118, 50, 30, 0.1, 0, 7), col, lw);
  S(() => { g.ellipse(118, -108, 30, 16, 0.2, 0, 7); }, '#e9c27a', lw);
  S(() => g.arc(66, -128, 10, 0, 7), '#fff', 4); g.fillStyle = INK; g.beginPath(); g.arc(70, -130, 5, 0, 7); g.fill();
  g.restore(); g.restore();
}
function drawRex(x, y, s, flip, t, alarm, col = '#7d6a55') {
  g.save(); g.translate(x, y); g.scale(flip ? -s : s, s); const lw = 6; const st = Math.sin(t * 1.1 + x) * 0.05;
  S(() => { g.moveTo(-60, -200); g.quadraticCurveTo(-220, -200, -330, -150); g.quadraticCurveTo(-200, -150, -60, -150); }, col, lw);
  S(() => { g.moveTo(-40, -150); g.lineTo(-56, -6); g.lineTo(-10, -6); g.lineTo(0, -130); }, mix(col, '#000000', 0.15), lw);
  S(() => g.ellipse(0, -200, 110, 70, -0.25 + st, 0, 7), col, lw);
  S(() => { g.moveTo(10, -150); g.lineTo(30, -6); g.lineTo(80, -6); g.lineTo(60, -150); }, col, lw);
  g.save(); g.translate(90, -260); g.rotate(alarm ? -0.3 : st * 2);
  S(() => { g.moveTo(-30, 0); g.quadraticCurveTo(40, -70, 130, -40); g.quadraticCurveTo(150, -10, 120, 20); g.lineTo(20, 40); g.closePath(); }, col, lw);
  g.strokeStyle = INK; g.lineWidth = 5 * LWS; g.beginPath(); g.moveTo(20, 10); g.lineTo(128, 0); g.stroke();
  g.fillStyle = '#fff'; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(34 + i * 16, 8); g.lineTo(41 + i * 16, 18); g.lineTo(48 + i * 16, 6); g.fill(); }
  S(() => g.arc(64, -30, 11, 0, 7), '#ffe08a', 4); g.fillStyle = INK; g.beginPath(); g.arc(68, -30, 5, 0, 7); g.fill();
  g.restore();
  limb([[70, -190], [96, -170], [104, -150]], 12, col, 5);
  g.restore();
}

// ======================================================================
// scenery pieces
// ======================================================================
function conifer(x, y, h, col, burnt, snow) {
  const w = h * 0.3;
  if (burnt) { S(() => { g.moveTo(x - 9, y); g.lineTo(x - 4, y - h * 0.85); g.lineTo(x + 4, y - h * 0.85); g.lineTo(x + 9, y); }, '#2a2420', 4);
    for (let k = 0; k < 3; k++) { const yy = y - h * (0.35 + k * 0.17), d = k % 2 ? 1 : -1; limb([[x, yy], [x + d * w * 0.5, yy - 24]], 5, '#2a2420', 3); }
    if (snow) S(() => g.ellipse(x, y - h * 0.85, 9, 5, 0, 0, 7), '#ffffff', 2);
    return; }
  S(() => g.rect(x - 7, y - h * 0.25, 14, h * 0.25), '#4a2f26', 4);
  for (let k = 0; k < 4; k++) { const yy = y - h * 0.18 - k * h * 0.19, ww = w * (1 - k * 0.2);
    S(() => { g.moveTo(x, yy - h * 0.3); g.lineTo(x + ww, yy); g.quadraticCurveTo(x, yy + 14, x - ww, yy); g.closePath(); }, col, 5); }
}
function cycad(x, y, h, col, burnt, t) {
  S(() => { g.moveTo(x - 12, y); g.lineTo(x - 8, y - h); g.lineTo(x + 8, y - h); g.lineTo(x + 12, y); }, burnt ? '#2a2420' : '#8a5a3a', 4);
  if (burnt) return;
  g.strokeStyle = INK; g.lineWidth = 2.5 * LWS; for (let i = 1; i < 6; i++) { const yy = y - h * i / 6; g.beginPath(); g.moveTo(x - 9, yy); g.lineTo(x + 9, yy - 8); g.stroke(); }
  for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.45 + Math.sin(t * 0.8 + x + i) * 0.04; const L = h * 0.55;
    S(() => { g.moveTo(x, y - h); g.quadraticCurveTo(x + Math.cos(a - 0.2) * L * 0.6, y - h + Math.sin(a - 0.2) * L * 0.6 - 20, x + Math.cos(a) * L, y - h + Math.sin(a) * L + L * 0.35 * Math.abs(Math.cos(a)));
      g.quadraticCurveTo(x + Math.cos(a + 0.2) * L * 0.5, y - h + Math.sin(a + 0.2) * L * 0.5, x, y - h); }, col, 4); }
}
function fern(x, y, s, col, t = 0) {
  g.save(); g.translate(x, y); g.scale(s, s); g.rotate(Math.sin(t * 1.1 + x) * 0.025);
  for (let i = -3; i <= 3; i++) { g.save(); g.rotate(i * 0.32); S(() => { g.moveTo(0, 0); g.quadraticCurveTo(-30, -90, 0, -170); g.quadraticCurveTo(30, -90, 0, 0); }, col, 5); g.restore(); }
  g.restore();
}
function shrub(x, y, s, col, flowers) {
  g.save(); g.translate(x, y); g.scale(s, s);
  S(() => { g.moveTo(-70, 0); g.arc(-40, -40, 42, Math.PI * 0.8, Math.PI * 1.6); g.arc(10, -70, 48, Math.PI * 1.1, Math.PI * 1.95); g.arc(52, -32, 38, Math.PI * 1.4, Math.PI * 2.2); g.closePath(); }, col, 5);
  if (flowers) for (let i = 0; i < 7; i++) { const fx = -50 + hashf(i, 31) * 100, fy = -20 - hashf(i, 32) * 80; S(() => g.arc(fx, fy, 9, 0, 7), flowers, 3); g.fillStyle = '#ffe08a'; g.beginPath(); g.arc(fx, fy, 3.5, 0, 7); g.fill(); }
  g.restore();
}
function cloud(x, y, s, col) { g.save(); g.translate(x, y); g.scale(s, s); S(() => { g.moveTo(-120, 0); g.arc(-70, -10, 50, Math.PI, Math.PI * 1.7); g.arc(0, -40, 70, Math.PI * 1.15, Math.PI * 1.9); g.arc(80, -10, 50, Math.PI * 1.3, 0); g.closePath(); }, col, 5); g.restore(); }
function flame(x, y, s, t, i) {
  const fl = 0.8 + 0.2 * Math.sin(t * 13 + i * 2.1) * Math.sin(t * 7.3 + i);
  g.save(); g.translate(x, y); g.scale(s, s * fl);
  S(() => { g.moveTo(-40, 0); g.quadraticCurveTo(-50, -60, -8, -120 - Math.sin(t * 9 + i) * 10); g.quadraticCurveTo(0, -80, 18, -96); g.quadraticCurveTo(52, -50, 40, 0); g.closePath(); }, '#ff7a2a', 5);
  S(() => { g.moveTo(-20, 0); g.quadraticCurveTo(-24, -40, 0, -70); g.quadraticCurveTo(26, -36, 20, 0); g.closePath(); }, '#ffd35a', 0);
  g.restore();
}

// static layouts
const R = rng(42);
const TREES = []; for (let i = 0; i < 26; i++) TREES.push({ x: -900 + i * 150 + R() * 70, h: 180 + R() * 120, kind: R() < 0.35 ? 'cycad' : 'conifer', shade: R() });
const HILLS = [0, 1].map(j => Array.from({ length: 70 }, (_, i) => { const x = -1400 + i * 80; return [x, (j ? 640 : 590) - Math.sin(x / (j ? 330 : 250) + j) * (j ? 36 : 52) - Math.sin(x / 90 + j * 2) * 10]; }));
const FERNS_NEAR = [[-560, 1100, 1.3], [-260, 1110, 1.0], [80, 1120, 1.4], [1230, 1110, 0.9], [1560, 1100, 1.3], [1880, 1130, 1.5], [2200, 1110, 1.2], [2500, 1100, 1.1], [700, 1140, 0.8]];
const GRASS = Array.from({ length: 60 }, (_, i) => [-700 + i * 60 + hashf(i, 3) * 40, 900 + hashf(i, 4) * 220]);
const CARPET = Array.from({ length: 140 }, (_, i) => [-900 + hashf(i, 41) * 3800, 870 + hashf(i, 42) * 420, 0.25 + hashf(i, 43) * 0.3]).sort((a, b) => a[1] - b[1]);

// ---------- palettes ----------
const PAL = {
  calm: { sky: ['#5fb4ea', '#b5e2f6', '#fff1d0'], sun: '#fff6d8', hills: ['#93c27c', '#72a86a'], tree: ['#3f8a52', '#2f6f45'], bank: '#7fbf4f', near: '#8fcc55', river: '#4fa9d9', clouds: '#ffffff', fern: '#3f8a3a', shrub: '#4f9a4a', flower: '#ffb0c8' },
  glassrain: { sky: ['#4b2a6a', '#e2573a', '#ffb35c'], sun: '#fff0c0', hills: ['#9c4a4a', '#7a3d48'], tree: ['#5d3a45', '#4e3040'], bank: '#6f8a3a', near: '#6f8a3a', river: '#f29a5c', clouds: null, fern: '#3f7a3a', shrub: '#4a7a3a', flower: '#ffb0c8' },
  glow: { sky: ['#3a0d14', '#b3261e', '#ff8a3a'], sun: null, hills: ['#7a2a26', '#5e2024'], tree: ['#4a1e22', '#3e181c'], bank: '#8a5a2a', near: '#9a6a32', river: '#d0603a', clouds: null, fern: '#6a5a2a', shrub: '#6a4a2a', flower: '#ff9a6a' },
  fires: { sky: ['#140c10', '#3e1a1a', '#8a3a22'], sun: null, hills: ['#2a1a1c', '#221418'], tree: ['#2a1a18', '#24161a'], bank: '#4a3a2a', near: '#4e3e2c', river: '#3a3a44', clouds: null, fern: '#4a3a24', shrub: '#3a2a20', flower: null },
  dark: { sky: ['#2a2a2e', '#4a4744', '#6a645c'], sun: null, hills: ['#4a4644', '#3e3a38'], tree: null, bank: '#625a52', near: '#6a6058', river: '#4a5258', clouds: null, fern: '#5a5248', shrub: null, flower: null },
  cold: { sky: ['#3a4450', '#7a8794', '#aab4bc'], sun: null, hills: ['#c8d2da', '#b0bcc6'], tree: null, bank: '#dfe7ec', near: '#e6edf2', river: '#9ab4c4', clouds: null, fern: null, shrub: null, flower: null, snow: true },
  recovery: { sky: ['#6cb6e8', '#c4e6f4', '#f4ecd4'], sun: '#fff6d8', hills: ['#8fb87a', '#76a46a'], tree: null, bank: '#78b84c', near: '#6fb04a', river: '#4fa9d9', clouds: '#ffffff', fern: '#3f9a3a', shrub: null, flower: null, carpet: true },
  today: { sky: ['#3f8fe0', '#b8dcf4', '#f2e6d0'], sun: '#fffaf0', clouds: '#ffffff' },
};
PAL.shake = PAL.calm; PAL.surge = { ...PAL.calm, river: '#7a8a6a' };

// ======================================================================
// camera: focus F (base coords) and zoom z; layer with parallax f uses zl = 1+(z-1)f
// ======================================================================
let CAM = { fx: CX, fy: CY, z: 1, sx: 0, sy: 0 };
function layer(f, draw) {
  const zl = 1 + (CAM.z - 1) * f, fx = CX + (CAM.fx - CX) * f, fy = CY + (CAM.fy - CY) * f;
  g.save(); g.translate(CX + CAM.sx * f, CY + CAM.sy * f); g.scale(zl, zl); g.translate(-fx, -fy); LWS = 1 / Math.sqrt(zl);
  draw(); g.restore(); LWS = 1;
}
const MOVES = {
  wide: (k, H, s) => ({ fx: lerp(900, 1020, k), fy: CY, z: lerp(1.0, 1.06, k) }),
  push: (k, H, s) => ({ fx: lerp((H[0] + CX) / 2, H[0], k), fy: lerp((H[1] + CY) / 2, H[1] + 70 * s, k), z: lerp(1.25, 1.8, k) / s }),
  face: (k, H, s) => ({ fx: H[0] + 20 * s, fy: H[1] + 40 * s, z: lerp(2.3, 2.55, k) / s }),
  low: (k, H, s) => ({ fx: H[0] - lerp(90, 40, k) * s, fy: H[1] + 170 * s, z: lerp(1.4, 1.5, k) / s }),
  orbit: (k, H, s) => ({ fx: H[0] + lerp(-240, 240, k) * s, fy: H[1] + 60 * s, z: 1.55 / s }),
  crane: (k, H, s) => ({ fx: H[0] + 30 * s, fy: lerp(H[1] - 330 * s, H[1] + 50 * s, k), z: lerp(1.2, 1.7, k) / s }),
  crane_up: (k, H, s) => ({ fx: H[0] + 20 * s, fy: lerp(H[1] + 50 * s, H[1] - 330 * s, k), z: lerp(1.75, 1.15, k) / s }),
  dolly: (k, H, s) => ({ fx: H[0], fy: H[1] + 60 * s, z: lerp(1.2, 2.05, k) / s }),
  truck: (k, H, s) => ({ fx: H[0] + lerp(-300, 300, k) * s, fy: H[1] + 70 * s, z: 1.45 / s }),
};

// ======================================================================
// sets
// ======================================================================
function sky(p, t, phase) {
  const sk = g.createLinearGradient(0, 0, 0, 760); sk.addColorStop(0, p.sky[0]); sk.addColorStop(0.5, p.sky[1]); sk.addColorStop(1, p.sky[2]);
  g.fillStyle = sk; g.fillRect(-50, -50, W + 100, H + 100);
  if (p.sun) { const rg = g.createRadialGradient(1500, 300, 10, 1500, 300, 520); rg.addColorStop(0, 'rgba(255,250,225,0.9)'); rg.addColorStop(1, 'rgba(255,240,200,0)'); g.fillStyle = rg; g.fillRect(0, 0, W, H);
    if (phase !== 'glassrain') S(() => g.arc(1500, 300, 60, 0, 7), p.sun, 0); }
  if (phase === 'glassrain') { const rg = g.createRadialGradient(1500, 600, 10, 1500, 600, 760); rg.addColorStop(0, 'rgba(255,240,190,.85)'); rg.addColorStop(1, 'rgba(255,200,120,0)'); g.fillStyle = rg; g.fillRect(0, 0, W, H); }
  if (phase === 'glow') { const pu = 0.75 + 0.25 * Math.sin(t * 2.3); const rg = g.createLinearGradient(0, 200, 0, 800); rg.addColorStop(0, 'rgba(255,120,40,0)'); rg.addColorStop(1, `rgba(255,170,60,${0.55 * pu})`); g.fillStyle = rg; g.fillRect(0, 0, W, H); }
  if (phase === 'fires') { const rg = g.createLinearGradient(0, 350, 0, 760); rg.addColorStop(0, 'rgba(255,90,30,0)'); rg.addColorStop(1, `rgba(255,110,40,${0.45 + 0.1 * Math.sin(t * 3)})`); g.fillStyle = rg; g.fillRect(0, 0, W, H); }
}
function clouds(p, t) { if (!p.clouds) return; layer(0.1, () => { for (let i = 0; i < 5; i++) { const x = ((i * 520 + t * 12) % 2900) - 500; cloud(x, 150 + (i % 3) * 60, 0.8 + (i % 2) * 0.4, p.clouds); } }); }

function drawTanis(phase, t, lt, dur, b) {
  const p = PAL[phase] || PAL.calm;
  const burnt = ['dark', 'cold', 'recovery'].includes(phase);
  layer(0, () => sky(p, t, phase));
  clouds(p, t);
  // far hills
  layer(0.2, () => { HILLS.forEach((pts, j) => S(() => { poly(pts, false); g.lineTo(4200, 1600); g.lineTo(-1400, 1600); g.closePath(); }, p.hills[j], 0)); });
  // tree line
  layer(0.45, () => {
    g.fillStyle = p.tree ? p.tree[1] : p.hills[1]; g.fillRect(-1400, 690, 5000, 900);
    TREES.forEach((tr, i) => { if (burnt && i % 2) return; const col = p.tree ? (tr.shade > 0.5 ? p.tree[0] : p.tree[1]) : '#2a2420';
      if (tr.kind === 'cycad') cycad(tr.x, 700, tr.h * 0.75, col, burnt, t); else conifer(tr.x, 700, tr.h, col, burnt, phase === 'cold'); });
    if (phase === 'fires') { TREES.forEach((tr, i) => { if (i % 3) return; flame(tr.x, 700 - tr.h * 0.35, 0.8 + hashf(i, 5) * 0.5, t, i); });
      for (let i = 0; i < 9; i++) { const ph = (t * 0.12 + i / 9) % 1, x = -400 + i * 380 + ph * 120, y = 560 - ph * 600; g.fillStyle = `rgba(60,48,46,${0.3 * Math.sin(ph * Math.PI)})`; g.beginPath(); g.arc(x, y, 60 + ph * 160, 0, 7); g.fill(); } }
  });
  // far bank + dinosaurs
  const alarm = phase === 'shake' || phase === 'surge';
  layer(0.6, () => {
    S(() => { g.moveTo(-1400, 712); g.bezierCurveTo(200, 690, 1600, 725, 3400, 700); g.lineTo(3400, 900); g.lineTo(-1400, 900); g.closePath(); }, p.bank, 6);
    if (p.shrub) [[-200, 735], [560, 730], [1180, 738], [2050, 732]].forEach(([x, y], i) => shrub(x, y, 0.7, p.shrub, p.flower));
    const dinosOn = ['calm', 'shake', 'surge', 'glassrain', 'glow'].includes(phase) || b.dinos;
    if (dinosOn) { const fl = phase === 'surge' ? lerp(0, 260, ease(lt / dur)) : 0;
      drawRex(-60 - fl, 755, 0.62, false, t, alarm); drawEdmo(520 - fl * 0.6, 758, 0.62, false, t, alarm); drawTrike(1360 + fl, 762, 0.78, false, t, alarm); drawTrike(1680 + fl, 756, 0.48, true, t, alarm, '#9a80ae'); }
  });
  // river
  const surge = phase === 'surge' ? ease(clamp(lt / 2.5)) : 0;
  layer(0.75, () => {
    const top = 790 - surge * 70, col = p.river;
    S(() => { g.moveTo(-1400, top); g.bezierCurveTo(300, top - 20, 1500, top + 25, 3400, top - 10); g.lineTo(3400, 1100); g.lineTo(-1400, 1100); g.closePath(); }, col, 6);
    const dir = phase === 'surge' ? -1 : 1, sp = phase === 'surge' ? 420 : 30;
    g.strokeStyle = phase === 'cold' ? 'rgba(255,255,255,.7)' : 'rgba(255,255,255,.55)'; g.lineWidth = 5 * LWS; g.lineCap = 'round';
    for (let i = 0; i < 26; i++) { const x = ((hashf(i, 51) * 4400 + dir * t * sp) % 4400 + 4400) % 4400 - 1300, y = top + 24 + hashf(i, 52) * 60; if (phase === 'cold') continue; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 60 + hashf(i, 53) * 60, y - 3); g.stroke(); }
    if (phase === 'cold') { g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 3 * LWS; for (let i = 0; i < 14; i++) { const x = -1000 + i * 300, y = top + 30 + hashf(i, 9) * 40; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 40, y + 20); g.lineTo(x + 90, y + 6); g.stroke(); } }
    if (surge > 0.01) { // foam and debris rushing upstream
      for (let i = 0; i < 40; i++) { const x = ((hashf(i, 61) * 4400 - t * 520) % 4400 + 4400) % 4400 - 1300, y = top + 10 + hashf(i, 62) * 70; S(() => g.ellipse(x, y, 26 + hashf(i, 63) * 30, 10, 0, 0, 7), '#f2f6f7', 3); }
      for (let i = 0; i < 9; i++) { const x = ((hashf(i, 71) * 4400 - t * 460) % 4400 + 4400) % 4400 - 1300, y = top + 30 + hashf(i, 72) * 40; g.save(); g.translate(x, y); g.rotate(Math.sin(t * 2 + i) * 0.3);
        if (i % 3 === 0) { S(() => { g.ellipse(0, 0, 34, 14, 0, 0, 7); }, '#9aa6b0', 4); S(() => { g.moveTo(30, 0); g.lineTo(52, -14); g.lineTo(52, 14); g.closePath(); }, '#9aa6b0', 4); }
        else S(() => g.roundRect(-70, -9, 140, 18, 9), '#6b4a31', 4); g.restore(); }
    }
  });
  // near bank
  layer(1, () => {
    const nb = 872 - surge * 18;
    S(() => { g.moveTo(-1400, nb); g.bezierCurveTo(300, nb - 30, 1300, nb + 25, 3400, nb - 15); g.lineTo(3400, 1700); g.lineTo(-1400, 1700); g.closePath(); }, p.near, 6);
    if (surge > 0.01) for (let i = 0; i < 26; i++) { const ph = (t * 1.3 + hashf(i, 81)) % 1, x = -400 + hashf(i, 82) * 2800, y = nb - Math.sin(ph * Math.PI) * 90 * surge; g.fillStyle = 'rgba(230,240,245,0.9)'; g.beginPath(); g.arc(x, y, 7, 0, 7); g.fill(); }
    if (p.carpet) CARPET.forEach(([x, y, s], i) => fern(x, y, s, i % 3 ? '#3f9a3a' : '#5ab04a', t));
    else if (!p.snow) { g.strokeStyle = mix(p.near, '#000000', 0.25); g.lineWidth = 4 * LWS; GRASS.forEach(([x, y]) => { g.beginPath(); g.moveTo(x, y); g.lineTo(x - 8, y - 22); g.moveTo(x, y); g.lineTo(x + 6, y - 26); g.moveTo(x, y); g.lineTo(x + 14, y - 16); g.stroke(); }); }
    else { g.fillStyle = 'rgba(200,214,226,0.9)'; GRASS.forEach(([x, y]) => { g.beginPath(); g.ellipse(x, y, 30, 7, 0, 0, 7); g.fill(); }); }
    if (p.shrub) { shrub(-380, 905, 0.9, p.shrub, p.flower); shrub(1720, 915, 1.0, p.shrub, p.flower); shrub(2400, 905, 0.9, p.shrub, p.flower); }
    else if (burnt) [[-380, 905], [1720, 915]].forEach(([x, y]) => { for (let k = -2; k <= 2; k++) limb([[x, y], [x + k * 22, y - 60 - Math.abs(k) * -8]], 5, '#2a2420', 3); });
  });
}
function shelterProps(phase) {
  const burnt = ['dark', 'cold', 'recovery', 'fires'].includes(phase);
  layer(1, () => {
    S(() => { g.moveTo(130, 985); g.quadraticCurveTo(110, 780, 200, 690); g.quadraticCurveTo(300, 650, 330, 760); g.quadraticCurveTo(360, 900, 330, 985); g.closePath(); }, '#9c8d7c', 6);
    g.strokeStyle = INK; g.lineWidth = 4 * LWS; g.beginPath(); g.moveTo(200, 760); g.lineTo(240, 800); g.lineTo(230, 860); g.stroke();
    S(() => g.rect(600, 688, 70, 297), burnt ? '#3a2c24' : '#7a5236', 6);
    S(() => g.ellipse(635, 688, 35, 12, 0, 0, 7), '#c99a6a', 5);
  });
}
function shelterLog(phase) {
  const burnt = ['dark', 'cold', 'recovery', 'fires'].includes(phase);
  layer(1, () => {
    S(() => g.roundRect(150, 628, 560, 66, 33), burnt ? '#3a2c24' : '#8a5a3a', 6);
    g.strokeStyle = INK; g.lineWidth = 3.5 * LWS; for (const x of [260, 380, 520]) { g.beginPath(); g.moveTo(x, 640); g.quadraticCurveTo(x + 30, 660, x + 70, 646); g.stroke(); }
    S(() => g.ellipse(690, 661, 18, 31, 0, 0, 7), '#c99a6a', 5);
    if (phase === 'cold') S(() => g.roundRect(160, 618, 540, 18, 9), '#ffffff', 3);
  });
}
function foreground(phase, t, camName) {
  const p = PAL[phase] || PAL.calm; const col = p.fern || (phase === 'cold' ? '#b8c6d0' : '#4a4038');
  layer(1.35, () => { FERNS_NEAR.forEach(([x, y, s], i) => { if (camName !== 'low' && i === 8) return; if (phase === 'cold' && i % 2) return; fern(x, y, s * (camName === 'low' ? 1.25 : 1), col, t); }); });
}

// burrow cutaway: surface at y = 330
const SOIL = (() => { const r = rng(7), bands = []; let y = 330; while (y < 1800) { const h = 50 + r() * 90; bands.push({ y, h, c: ['#5a3d2b', '#6b4a33', '#4a3224', '#7a5638', '#55392a'][Math.floor(r() * 5)], w: r() * 6 }); y += h; } return bands; })();
const STONES = Array.from({ length: 30 }, (_, i) => [-800 + hashf(i, 91) * 3600, 420 + hashf(i, 92) * 1100, 10 + hashf(i, 93) * 22]);
function drawBurrow(phase, t, critterExpr, showCritter) {
  const p = PAL.dark;
  layer(0, () => sky(p, t, 'dark'));
  layer(0.4, () => { for (let i = 0; i < 14; i++) conifer(-600 + i * 240 + hashf(i, 3) * 80, 340, 200 + hashf(i, 4) * 120, null, true, false); });
  layer(1, () => {
    S(() => { g.rect(-1400, 330, 5000, 1500); }, '#4a3224', 6);
    SOIL.forEach(bd => { g.fillStyle = bd.c; g.beginPath(); g.moveTo(-1400, bd.y); for (let x = -1400; x <= 3600; x += 200) g.lineTo(x, bd.y + Math.sin(x / 300 + bd.w) * 14); g.lineTo(3600, bd.y + bd.h + 20); g.lineTo(-1400, bd.y + bd.h + 20); g.closePath(); g.fill(); });
    S(() => g.rect(-1400, 318, 5000, 24), '#7a726a', 5);
    STONES.forEach(([x, y, r]) => S(() => g.ellipse(x, y, r * 1.3, r, 0, 0, 7), '#8a7a6a', 4));
    // roots
    for (let i = 0; i < 6; i++) { const x = -300 + i * 520; limb([[x, 340], [x + 30, 440], [x - 20, 540], [x + 10, 620]], 7, '#3a2a20', 3); }
    // tunnel
    limb([[520, 300], [560, 450], [650, 600], [800, 720], [880, 790]], 120, '#2a1c14', 6);
    // den
    S(() => g.ellipse(1060, 860, 330, 175, 0, 0, 7), '#2a1c14', 6);
    const lg = g.createRadialGradient(1060, 880, 20, 1060, 880, 330); lg.addColorStop(0, 'rgba(255,200,130,0.55)'); lg.addColorStop(1, 'rgba(255,200,130,0)'); g.fillStyle = lg; g.beginPath(); g.ellipse(1060, 860, 324, 170, 0, 0, 7); g.fill();
    // nest + seeds
    S(() => g.ellipse(1060, 1010, 250, 32, 0, 0, 7), '#b08a52', 5);
    for (let i = 0; i < 18; i++) S(() => g.ellipse(1250 + (hashf(i, 95) - 0.5) * 90, 990 - hashf(i, 96) * 30, 11, 7, hashf(i, 97) * 3, 0, 7), i % 3 ? '#d9b06a' : '#b88a4a', 3);
    // worm
    const wx = 1560, wy = 700; limb(Array.from({ length: 8 }, (_, i) => [wx + i * 22, wy + Math.sin(t * 3 + i * 0.9) * 14]), 18, '#e08a8a', 4);
    // a beetle in the tunnel wall
    S(() => g.ellipse(420, 820, 26, 18, 0, 0, 7), '#3a4a6a', 4);
    if (showCritter) drawCritter(1040, 1010, 1.25, critterExpr, t);
  });
}
function drawToday(t) {
  const p = PAL.today;
  layer(0, () => sky(p, t, 'today'));
  clouds(p, t);
  layer(0.3, () => {
    const bands = ['#c9866a', '#e2b48a', '#a86a58', '#d9c0a0', '#8a5a4a'];
    S(() => { g.moveTo(-200, 720); g.lineTo(120, 420); g.lineTo(700, 400); g.lineTo(900, 520); g.lineTo(1300, 470); g.lineTo(1700, 430); g.lineTo(2100, 720); g.closePath(); }, bands[0], 6);
    g.save(); g.beginPath(); g.moveTo(-200, 720); g.lineTo(120, 420); g.lineTo(700, 400); g.lineTo(900, 520); g.lineTo(1300, 470); g.lineTo(1700, 430); g.lineTo(2100, 720); g.closePath(); g.clip();
    bands.forEach((c, i) => { g.fillStyle = c; g.fillRect(-300, 440 + i * 56, 2600, 30); }); g.restore();
  });
  layer(0.6, () => { S(() => { g.moveTo(-1400, 730); g.bezierCurveTo(300, 710, 1500, 745, 3400, 720); g.lineTo(3400, 1500); g.lineTo(-1400, 1500); g.closePath(); }, '#b8b06a', 6);
    for (let i = 0; i < 30; i++) { const x = -800 + i * 140, y = 760 + hashf(i, 7) * 80; g.strokeStyle = '#8a8a4a'; g.lineWidth = 4 * LWS; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 6, y - 18); g.moveTo(x, y); g.lineTo(x + 8, y - 20); g.stroke(); } });
  layer(1, () => {
    S(() => { g.moveTo(-1400, 870); g.bezierCurveTo(300, 850, 1300, 890, 3400, 860); g.lineTo(3400, 1700); g.lineTo(-1400, 1700); g.closePath(); }, '#d6bd86', 6);
    // dig pit with string grid and a Triceratops skull
    S(() => { g.moveTo(1120, 930); g.lineTo(1640, 930); g.lineTo(1700, 1040); g.lineTo(1060, 1040); g.closePath(); }, '#b0905e', 6);
    g.save(); g.translate(1380, 990); g.scale(0.55, 0.55);
    S(() => g.ellipse(-60, -30, 110, 90, 0.4, 0, 7), '#efe2c4', 6); S(() => g.ellipse(60, 10, 120, 60, 0.1, 0, 7), '#efe2c4', 6);
    S(() => { g.moveTo(40, -20); g.lineTo(170, -110); g.lineTo(70, 6); }, '#efe2c4', 5); S(() => { g.moveTo(130, 10); g.lineTo(200, -20); g.lineTo(150, 36); }, '#efe2c4', 5);
    S(() => g.arc(60, -4, 14, 0, 7), '#8a7458', 4); g.restore();
    g.strokeStyle = '#e04f4f'; g.lineWidth = 3 * LWS; for (let i = 1; i < 4; i++) { const x = lerp(1120, 1640, i / 4); g.beginPath(); g.moveTo(x, 930); g.lineTo(lerp(1060, 1700, i / 4), 1040); g.stroke(); } g.beginPath(); g.moveTo(1090, 985); g.lineTo(1670, 985); g.stroke();
    for (const [x, y] of [[1120, 930], [1640, 930], [1060, 1040], [1700, 1040]]) S(() => g.rect(x - 5, y - 30, 10, 34), '#c98a3d', 3);
    // brush + bucket
    g.save(); g.translate(1760, 1000); g.rotate(-0.4); S(() => g.roundRect(-6, -70, 12, 70, 5), '#c98a3d', 4); S(() => g.roundRect(-12, -96, 24, 30, 6), '#3a3a3a', 4); g.restore();
    S(() => { g.moveTo(1830, 960); g.lineTo(1910, 960); g.lineTo(1896, 1040); g.lineTo(1844, 1040); g.closePath(); }, '#e2513a', 5);
    // little flag
    S(() => g.rect(1000, 860, 6, 80), '#ddd', 3); S(() => { g.moveTo(1006, 862); g.lineTo(1050, 876); g.lineTo(1006, 890); g.closePath(); }, '#ffd35a', 3);
  });
}

// ---------- particles ----------
function beads(amount, t) {
  if (amount <= 0) return; const n = Math.floor(150 * amount);
  layer(1.1, () => { g.lineCap = 'round';
    for (let i = 0; i < n; i++) { const L = 60 + hashf(i, 11) * 90, x = -500 + hashf(i, 12) * 2900 + ((t * 230) % 400), y = ((hashf(i, 13) * 1500 + t * 950) % 1500) - 250;
      g.strokeStyle = 'rgba(255,210,140,.35)'; g.lineWidth = 13; g.beginPath(); g.moveTo(x - L * 0.25, y - L); g.lineTo(x, y); g.stroke();
      g.strokeStyle = '#fff3c4'; g.lineWidth = 5; g.beginPath(); g.moveTo(x - L * 0.25, y - L); g.lineTo(x, y); g.stroke();
      g.fillStyle = '#ffffff'; g.beginPath(); g.arc(x, y, 6, 0, 7); g.fill(); }
    // sparks where they land
    for (let i = 0; i < Math.floor(14 * amount); i++) { const ph = (t * 1.7 + hashf(i, 14)) % 1; if (ph > 0.35) continue; const x = -200 + hashf(i + Math.floor(t * 1.7 + hashf(i, 14)) * 31, 15) * 2400, y = 900 + hashf(i, 16) * 180;
      g.strokeStyle = '#ffe08a'; g.lineWidth = 5; for (let k2 = 0; k2 < 5; k2++) { const a = -Math.PI * (0.15 + k2 * 0.17), r2 = 34 * (ph / 0.35); g.beginPath(); g.moveTo(x + Math.cos(a) * r2 * 0.4, y + Math.sin(a) * r2 * 0.4); g.lineTo(x + Math.cos(a) * r2, y + Math.sin(a) * r2); g.stroke(); } }
  });
}
function ash(amount, t, snow, maxY = 2000) {
  if (amount <= 0) return; const n = Math.floor(220 * amount);
  layer(1.05, () => { for (let i = 0; i < n; i++) { const sp = 40 + hashf(i, 21) * 50, y = ((hashf(i, 22) * 1500 + t * sp) % 1500) - 200; if (y > maxY) continue; const x = -400 + hashf(i, 23) * 2800 + Math.sin(t * 0.7 + i) * 30;
    g.fillStyle = snow ? '#ffffff' : '#c8c0b6'; g.beginPath(); if (snow) g.arc(x, y, 5 + hashf(i, 24) * 4, 0, 7); else { g.save(); g.translate(x, y); g.rotate(t + i); g.fillRect(-6, -4, 12, 8); g.restore(); } g.fill(); } });
}

// ======================================================================
// overlays: captions, label, cards, inserts (same as diorama)
// ======================================================================
const $ = id => document.getElementById(id);
const labelEl = $('label'), subEl = $('sub').firstElementChild, cardEl = $('card'), fadeEl = $('fade'), titleEl = $('title');
const insCanvas = $('ins'), insCtx = insCanvas.getContext('2d');
const beats = script.beats.map((b, i) => ({ ...b, ...timeline.beats[i] }));
window.DURATION = timeline.duration;
const groups = [];
beats.forEach((b, bi) => { let cur = null; b.words.forEach(w => {
  if (!cur || cur.words.length >= 8 || cur.chars + w.w.length > 46) { cur = { words: [], chars: 0, s: w.s, bi }; groups.push(cur); }
  cur.words.push(w.w); cur.chars += w.w.length + 1; cur.e = w.e; if (/[.!?;:,]$/.test(w.w) && cur.chars > 18) cur = null; }); });
function subAt(t) { for (let i = 0; i < groups.length; i++) { const gg = groups[i], n = groups[i + 1]; if (t >= gg.s - 0.05 && t < Math.min(n ? n.s : Infinity, gg.e + 0.5)) return gg; } return null; }
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
let lastSub = null, lastLabel = null;

// ======================================================================
// frame
// ======================================================================
window.renderFrame = (t) => {
  let bi = beats.findIndex((b, i) => t < (beats[i + 1] ? beats[i + 1].start : Infinity)); if (bi < 0) bi = beats.length - 1;
  const b = beats[bi], dur = (beats[bi + 1] ? beats[bi + 1].start : timeline.duration) - b.start, lt = t - b.start, k = clamp(lt / dur);

  const isInsert = !!b.insert;
  insCanvas.style.opacity = isInsert ? 1 : 0;
  if (isInsert) drawInsert(insCtx, b.insert, { t, lt, k, dur, step: b.step || 1, W, H });

  if (!isInsert) {
    const sceneName = b.scene || 'tanis', phase = b.phase || (sceneName === 'today' ? 'today' : 'calm');
    const pose = b.card ? null : (b.gary?.pose || 'stand'), expr = b.gary?.expr || 'neutral';
    const isCritter = pose === 'critter';
    // subject position (feet) + head (camera target) in base coords, and subject scale
    let X = 960, Y = 985, sc = 0.62, Hd, s = 1;
    if (sceneName === 'today') X = 820;
    if (pose === 'shelter' && sceneName === 'tanis') X = 425;
    if (pose === 'run') X = lerp(700, 1180, k);
    if (isCritter || sceneName === 'burrow') { s = sceneName === 'burrow' ? 0.8 : 0.6; if (sceneName === 'burrow') { X = 1040; Y = 1010; Hd = [1140, 870]; } else { X = 900; Y = 990; sc = 0.85; Hd = [X + 80 * sc, Y - 150 * sc]; } }
    else Hd = [X, Y - (pose === 'shelter' ? 385 : 480) * sc];
    const camName = b.card ? 'wide' : (b.camera || 'push');
    const mv = (MOVES[camName] || MOVES.push)(ease(k), Hd, s);
    const shake = (phase === 'shake' ? 1 : phase === 'surge' ? 0.45 : 0) * (0.6 + 0.4 * Math.sin(t * 1.7));
    CAM = { fx: mv.fx + Math.sin(t * 0.9) * 4, fy: mv.fy + Math.sin(t * 1.3) * 3, z: Math.max(1, mv.z), sx: Math.sin(t * 31) * 9 * shake, sy: Math.sin(t * 43) * 6 * shake };

    g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#1d1a2b'; g.fillRect(0, 0, W, H);
    if (sceneName === 'burrow') {
      drawBurrow(phase, t, isCritter ? expr : 'neutral', true);
      ash(0.6, t, false, 300);
    } else if (sceneName === 'today') {
      drawToday(t);
      if (pose) layer(1, () => drawGary(X, Y, sc, pose, expr, t, k));
      foreground('calm', t, camName);
    } else {
      drawTanis(phase, t, lt, dur, b);
      const shelterOn = ['surge', 'glassrain', 'glow'].includes(phase);
      if (shelterOn) shelterProps(phase);
      if (pose && !isCritter) layer(1, () => drawGary(X, Y, sc, pose, expr, t, k));
      if (isCritter) layer(1, () => drawCritter(X, Y, sc, expr, t));
      if (shelterOn) shelterLog(phase);
      foreground(phase, t, camName);
      beads(phase === 'glassrain' ? 1 : phase === 'glow' ? 0.4 : 0, t);
      ash(phase === 'dark' || phase === 'cold' ? 1 : phase === 'fires' ? 0.5 : 0, t, phase === 'cold');
      if (phase === 'glow') { g.fillStyle = `rgba(255,90,30,${0.12 + 0.05 * Math.sin(t * 2.3)})`; g.fillRect(0, 0, W, H); }
      if (phase === 'dark') { g.fillStyle = 'rgba(40,36,34,0.18)'; g.fillRect(0, 0, W, H); }
    }
    canvas.style.filter = b.card ? 'blur(7px)' : 'none';
  }

  // ----- overlays -----
  const lab = b.card ? '' : (b.label || '');
  if (lab !== lastLabel) { labelEl.innerHTML = esc(lab).replace(/\*(.+?)\*/g, '<span class="hot">$1</span>'); lastLabel = lab; }
  labelEl.style.display = lab ? 'block' : 'none';
  const lk = clamp(lt / 0.35); labelEl.style.transform = `rotate(-2deg) scale(${lab && (bi === 0 || beats[bi - 1].label !== b.label) ? 0.6 + 0.4 * easeOut(lk) + Math.sin(lk * Math.PI) * 0.08 : 1})`;
  if (b.card) { cardEl.firstElementChild.textContent = b.card.title; cardEl.children[1].textContent = b.card.subtitle;
    const ck = Math.min(clamp(lt / 0.4), clamp((dur - lt) / 0.35)); cardEl.style.opacity = ck; cardEl.children[1].style.transform = `translateY(${(1 - easeOut(clamp(lt / 0.6))) * 30}px) rotate(-1.5deg)`; cardEl.children[2].style.transform = `scaleX(${easeOut(clamp((lt - 0.2) / 0.6))})`; }
  else cardEl.style.opacity = 0;
  if (b.hook) { titleEl.textContent = 'THE DAY THE DINOSAURS DIED'; titleEl.style.opacity = clamp((lt - 0.3) / 0.4) * clamp((3.6 - lt) / 0.4); } else titleEl.style.opacity = 0;
  const gsub = script.captions === false || b.card ? null : subAt(t);
  if (gsub !== lastSub) { subEl.innerHTML = gsub ? esc(gsub.words.join(' ')) : ''; subEl.style.display = gsub ? 'inline-block' : 'none'; lastSub = gsub; }
  fadeEl.style.opacity = bi > 0 ? 0.55 * (1 - clamp(lt / 0.22)) : clamp(1 - t / 0.5);
};

await document.fonts.ready;
window.renderFrame(0.01);
window.READY = true;
