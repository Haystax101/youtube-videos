// Flat 2D cartoon people (copy of walk-circles/people2d.js + the 'pill' body, trucker cap and walrus
// moustache for the reference-look test, 26 Nov). Original notes: flat 2D cartoon people for the 3D castle test: big pale round heads, heavy-lidded eyes, thick even ink,
// thin black stick limbs, detailed costumes. Drawn into a canvas each frame (pose + expression + time),
// then shown as camera-facing cards in the three.js set.
const INK = '#16121a', LW = 7;
let g, BLIND = false, BACK = false;
function P(path, fill, lw = LW) { g.beginPath(); path(); if (fill) { g.fillStyle = fill; g.fill(); } if (lw) { g.lineWidth = lw; g.strokeStyle = INK; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); } }
function clipShade(path, fn) { g.save(); g.beginPath(); path(); g.clip(); fn(); g.restore(); }
function stick(a, m, b, w = 13) { g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = INK; g.lineWidth = w; g.beginPath(); g.moveTo(...a); g.quadraticCurveTo(...m, ...b); g.stroke(); }
const lerp = (a, b, k) => a + (b - a) * k;
const L2 = (p, q, k) => [lerp(p[0], q[0], k), lerp(p[1], q[1], k)];

export const KINDS = {
  scientist: { head: '#f5efe4', headS: '#e0d3c0', cloth: '#f4f4f2', clothS: '#cfd3d8', trim: '#3c6fb4', emblem: 'none', hat: 'bald', tache: 'none', glasses: true, coat: true },
  scientist2: { head: '#f5efe4', headS: '#e0d3c0', cloth: '#f4f4f2', clothS: '#cfd3d8', trim: '#c0392b', emblem: 'none', hat: 'none', tache: 'brush', glasses: true, coat: true },
  hiker: { head: '#f5efe4', headS: '#e0d3c0', cloth: '#3f7d4e', clothS: '#2c5a37', trim: '#e8a33a', emblem: 'none', hat: 'beanie', tache: 'none', pack: true },
  walker: { head: '#f5efe4', headS: '#e0d3c0', cloth: '#d7dde6', clothS: '#a9b2c0', trim: '#3c6fb4', emblem: 'none', hat: 'none', tache: 'none' },
  walker2: { head: '#f5efe4', headS: '#e0d3c0', cloth: '#e0a33f', clothS: '#b57f27', trim: '#3c6fb4', emblem: 'none', hat: 'none', tache: 'brush' },
  baron: { head: '#f5efe4', headS: '#e0d3c0', cloth: '#2f5aa8', clothS: '#21407a', trim: '#e2b23e', emblem: 'lion', hat: 'plume', tache: 'curl', fur: true },
  crew: { head: '#f5efe4', headS: '#e0d3c0', cloth: '#9a4a2c', clothS: '#6e321d', trim: '#d9c08a', emblem: 'none', hat: 'kettle', tache: 'none' },
  crew2: { head: '#f5efe4', headS: '#e0d3c0', cloth: '#2f5aa8', clothS: '#21407a', trim: '#e2b23e', emblem: 'bar', hat: 'kettle', tache: 'brush' },
  guard: { head: '#f5efe4', headS: '#e0d3c0', cloth: '#3f8a4a', clothS: '#2b6434', trim: '#f4f0e6', emblem: 'cross', hat: 'helm', tache: 'brush' },
  guard2: { head: '#f5efe4', headS: '#e0d3c0', cloth: '#3f8a4a', clothS: '#2b6434', trim: '#f4f0e6', emblem: 'cross', hat: 'helm', tache: 'none' },
  knight: { head: '#f5efe4', headS: '#e0d3c0', cloth: '#b9c0c9', clothS: '#8b93a0', trim: '#2f5aa8', emblem: 'bar', hat: 'bascinet', tache: 'curl', armour: true },
  sailor: { head: '#f5efe4', headS: '#e0d3c0', cloth: '#d8c49a', clothS: '#b29d70', trim: '#a8452e', emblem: 'none', hat: 'headband', tache: 'none' },
  roman: { head: '#f5efe4', headS: '#e0d3c0', cloth: '#b8322a', clothS: '#8a231d', trim: '#e2b23e', emblem: 'bar', hat: 'galea', tache: 'none' },
  roman2: { head: '#f5efe4', headS: '#e0d3c0', cloth: '#b8322a', clothS: '#8a231d', trim: '#e2b23e', emblem: 'bar', hat: 'galea', tache: 'brush' },
  marcellus: { head: '#f5efe4', headS: '#e0d3c0', cloth: '#9c2a24', clothS: '#701c18', trim: '#e2b23e', emblem: 'lion', hat: 'galeaBig', tache: 'none', cape: '#c8372d' },
  archimedes: { head: '#f5efe4', headS: '#e0d3c0', cloth: '#f1ece0', clothS: '#cfc6b3', trim: '#3c6fb4', emblem: 'none', hat: 'bald', tache: 'none', beard: true, sash: '#3c6fb4' },
  greek: { head: '#f5efe4', headS: '#e0d3c0', cloth: '#3c6fb4', clothS: '#2a5088', trim: '#f4f0e6', emblem: 'none', hat: 'corinth', tache: 'none' },
  greek2: { head: '#f5efe4', headS: '#e0d3c0', cloth: '#3c6fb4', clothS: '#2a5088', trim: '#f4f0e6', emblem: 'none', hat: 'corinth', tache: 'brush' },
  // reference-look test: chunky pill-bodied farmer (own design: plaid shirt, denim bib, mustard trucker cap)
  farmer: { head: '#f7f2ea', headS: '#e3d8c8', body: 'pill', cloth: '#d8463a', clothS: '#a93229', check: '#8e2620', bib: '#3d6fb0', bibS: '#2c5288', hat: 'trucker', cap: '#f0b43a', capS: '#c98d1f', tache: 'walrus', tacheC: '#7a4a2a' },
  farmhand: { head: '#f7f2ea', headS: '#e3d8c8', body: 'pill', cloth: '#3f9a5a', clothS: '#2d7443', check: null, bib: null, hat: 'none', tache: 'none' },
  soldier: { head: '#f5efe4', headS: '#e0d3c0', cloth: '#2f5aa8', clothS: '#21407a', trim: '#e2b23e', emblem: 'bar', hat: 'kettle', tache: 'none' },
};

const FACES = {
  talk: { lid: 0.15, brows: [[-62, -62, -20, -70], [20, -70, 62, -62]], mouth: 'shout', look: [4, -2] },
  talksmug: { lid: 0.45, brows: [[-62, -52, -20, -60], [20, -66, 62, -54]], mouth: 'shout', look: [3, 2] },
  smug: { lid: 0.5, brows: [[-62, -52, -20, -60], [20, -66, 62, -54]], mouth: 'smirk', look: [3, 2] },
  shout: { lid: 0.2, brows: [[-62, -70, -20, -58], [20, -58, 62, -70]], mouth: 'shout', look: [4, 0] },
  watch: { lid: 0.3, brows: [[-62, -58, -20, -64], [20, -64, 62, -58]], mouth: 'flat', look: [0, -10] },
  worried: { lid: 0.12, brows: [[-64, -50, -22, -64], [22, -64, 64, -50]], mouth: 'grit', look: [0, -8], sweat: true },
  shocked: { lid: 0, brows: [[-62, -66, -20, -74], [20, -74, 62, -66]], mouth: 'o', look: [0, -6] },
  joy: { happy: true, brows: [[-62, -66, -20, -74], [20, -74, 62, -66]], mouth: 'grin' },
  angry: { lid: 0.35, brows: [[-64, -70, -18, -48], [18, -48, 64, -70]], mouth: 'grit', look: [0, 0], vein: true },
  deadpan: { lid: 0.52, brows: [[-66, -46, -16, -46], [18, -50, 66, -50]], mouth: 'flat', look: [2, 2], flatBrows: true },
  glum: { lid: 0.55, brows: [[-62, -50, -20, -62], [20, -62, 62, -50]], mouth: 'frown', look: [-2, 4] },
};

function sweatDrop(x, y, s, a) { g.save(); g.translate(x, y); g.rotate(a); g.scale(s, s); P(() => { g.moveTo(0, -26); g.quadraticCurveTo(16, -2, 14, 8); g.arc(0, 8, 14, 0, Math.PI); g.quadraticCurveTo(-16, -2, 0, -26); }, '#bfe6ff', 4); g.restore(); }

function head(K, expr, t, turn, blink) {
  const F = FACES[expr] || FACES.smug;
  const h = () => g.ellipse(0, 0, 122, 126, 0, 0, 7);
  P(h, K.head); clipShade(h, () => { g.fillStyle = K.headS; g.beginPath(); g.ellipse(-turn * 2 + 112, 22, 70, 132, 0, 0, 7); g.fill(); }); P(h, null, 8);
  if (BACK) { P(() => g.ellipse(-118, 6, 16, 26, 0, 0, 7), K.head, 6); P(() => g.ellipse(118, 6, 16, 26, 0, 0, 7), K.head, 6); return; } // back of the head: just ears
  g.save(); g.translate(turn, 0);
  for (const d of [-1, 1]) { const ex = d * 40;
    if (F.happy) { P(() => { g.moveTo(ex - 22, -4); g.quadraticCurveTo(ex, -34, ex + 22, -4); }, null, 8); continue; }
    P(() => g.ellipse(ex, -8, 24, 28, 0, 0, 7), '#fff', 5);
    g.fillStyle = INK; g.beginPath(); g.ellipse(ex + (F.look?.[0] || 0), -4 + (F.look?.[1] || 0), 9, 11, 0, 0, 7); g.fill();
    const lid = blink ? 1 : F.lid;
    if (lid) { clipShade(() => g.ellipse(ex, -8, 24, 28, 0, 0, 7), () => { g.fillStyle = K.head; g.fillRect(ex - 28, -40, 56, 58 * lid); }); P(() => { g.moveTo(ex - 25, -36 + 56 * lid); g.lineTo(ex + 25, -36 + 56 * lid); }, null, 6); P(() => g.ellipse(ex, -8, 24, 28, 0, 0, 7), null, 5); }
  }
  for (const [a, b, c2, d] of F.brows) P(() => { g.moveTo(a, b); if (F.flatBrows) g.lineTo(c2, d); else g.quadraticCurveTo((a + c2) / 2, Math.min(b, d) - 8, c2, d); }, null, F.flatBrows ? 12 : 9);
  P(() => { g.moveTo(-2, 22); g.quadraticCurveTo(12, 34, -2, 42); }, null, 4);
  // moustache sits over the mouth
  const m = F.mouth, walrus = K.tache === 'walrus';
  if (walrus) g.translate(0, 26);
  if (m === 'smirk') P(() => { g.moveTo(-26, 70); g.quadraticCurveTo(10, 82, 36, 60); }, null, 6.5);
  if (m === 'flat') P(() => { g.moveTo(-20, 72); g.lineTo(20, 70); }, null, 6);
  if (m === 'frown') P(() => { g.moveTo(-26, 80); g.quadraticCurveTo(0, 60, 26, 80); }, null, 6.5);
  if (m === 'o') P(() => g.ellipse(0, 74, 16, 22, 0, 0, 7), '#5e1822', 5);
  if (m === 'shout' || m === 'grin') { const open = m === 'shout' ? 0.75 + 0.25 * Math.sin(t * 22) : 1; const mp = () => { g.moveTo(-40, 58); g.quadraticCurveTo(0, 50, 40, 58); g.quadraticCurveTo(30, 58 + 52 * open, 0, 60 + 56 * open); g.quadraticCurveTo(-30, 58 + 52 * open, -40, 58); g.closePath(); }; P(mp, '#5e1822', 5); clipShade(mp, () => { g.fillStyle = '#fff'; g.fillRect(-44, 48, 88, 16); g.fillStyle = '#e0607a'; g.beginPath(); g.ellipse(0, 64 + 52 * open, 22, 14, 0, 0, 7); g.fill(); }); P(mp, null, 5); }
  if (m === 'grit') { P(() => g.roundRect(-36, 58, 72, 28, 10), '#fff', 5); P(() => { g.moveTo(-36, 72); g.lineTo(36, 72); for (const xx of [-18, 0, 18]) { g.moveTo(xx, 58); g.lineTo(xx, 86); } }, null, 3); }
  if (walrus) { g.translate(0, -26); const tc = () => { g.moveTo(0, 40); g.bezierCurveTo(-30, 30, -70, 34, -84, 58); g.bezierCurveTo(-96, 80, -98, 104, -92, 118); g.bezierCurveTo(-74, 100, -60, 86, -40, 82); g.quadraticCurveTo(-18, 80, 0, 74); g.quadraticCurveTo(18, 80, 40, 82); g.bezierCurveTo(60, 86, 74, 100, 92, 118); g.bezierCurveTo(98, 104, 96, 80, 84, 58); g.bezierCurveTo(70, 34, 30, 30, 0, 40); g.closePath(); };
    P(tc, K.tacheC || '#4a2e1e', 6); clipShade(tc, () => { g.strokeStyle = 'rgba(255,255,255,.22)'; g.lineWidth = 3.5; for (let x = -80; x <= 80; x += 13) { g.beginPath(); g.moveTo(x * 0.55, 46); g.quadraticCurveTo(x * 0.9, 70, x * 1.05, 96 + Math.abs(x) * 0.18); g.stroke(); } g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(-100, 84, 200, 40); }); P(tc, null, 6); }
  if (K.tache === 'curl') P(() => { g.moveTo(0, 44); g.bezierCurveTo(-30, 30, -70, 50, -78, 34); g.bezierCurveTo(-84, 22, -96, 30, -88, 42); g.bezierCurveTo(-70, 70, -30, 62, 0, 54); g.bezierCurveTo(30, 62, 70, 70, 88, 42); g.bezierCurveTo(96, 30, 84, 22, 78, 34); g.bezierCurveTo(70, 50, 30, 30, 0, 44); g.closePath(); }, '#4a2e1e', 5);
  if (K.beard) P(() => { g.moveTo(-96, 30); g.quadraticCurveTo(-90, 100, -40, 150); g.quadraticCurveTo(-10, 200, 0, 230); g.quadraticCurveTo(10, 200, 40, 150); g.quadraticCurveTo(90, 100, 96, 30); g.quadraticCurveTo(70, 70, 40, 96); g.quadraticCurveTo(0, 110, -40, 96); g.quadraticCurveTo(-70, 70, -96, 30); g.closePath(); }, '#ece8e0', 6);
  if (K.beard) P(() => { g.moveTo(-50, 52); g.quadraticCurveTo(-20, 40, 0, 50); g.quadraticCurveTo(20, 40, 50, 52); g.quadraticCurveTo(20, 62, 0, 58); g.quadraticCurveTo(-20, 62, -50, 52); g.closePath(); }, '#ece8e0', 5);
  if (K.tache === 'brush') P(() => { g.moveTo(-40, 50); g.quadraticCurveTo(0, 30, 40, 50); g.quadraticCurveTo(0, 62, -40, 50); g.closePath(); }, '#6b4426', 5);
  if (F.vein) { g.save(); g.translate(64, -86); P(() => { for (const a of [0, 1.57, 3.14, 4.71]) { g.moveTo(Math.cos(a) * 6, Math.sin(a) * 6); g.lineTo(Math.cos(a + 0.4) * 20, Math.sin(a + 0.4) * 20); } }, null, 6); g.strokeStyle = '#d23b2e'; g.lineWidth = 3; g.stroke(); g.restore(); }
  if (BLIND) { P(() => { g.moveTo(-126, -40); g.quadraticCurveTo(0, -60, 126, -40); g.lineTo(126, 12); g.quadraticCurveTo(0, -8, -126, 12); g.closePath(); }, '#2b2b36', 7); P(() => { g.moveTo(118, -20); g.quadraticCurveTo(150, 0, 160, 40); g.moveTo(118, -10); g.quadraticCurveTo(140, 20, 136, 60); }, null, 9); }
  g.restore();
  if (F.sweat) { sweatDrop(100, -50, 0.9, 0.2); sweatDrop(-108, -20, 0.7, -0.2); }
}

function hat(K, t) {
  if (K.hat === 'beanie') { // orange knit beanie with a turned-up cuff and a bobble
    P(() => { g.moveTo(-124, -46); g.bezierCurveTo(-128, -150, -60, -190, 0, -190); g.bezierCurveTo(60, -190, 128, -150, 124, -46); g.closePath(); }, '#e8742e', 7);
    g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 5; for (let x = -90; x <= 90; x += 30) { g.beginPath(); g.moveTo(x, -70); g.quadraticCurveTo(x * 1.05, -130, x * 0.7, -178); g.stroke(); }
    P(() => g.roundRect(-130, -78, 260, 40, 16), '#c95c22', 7);
    P(() => g.arc(0, -200, 30, 0, 7), '#f3e3c8', 6); }
  const steel = '#c9ced6', steelS = '#9aa1ad';
  if (K.hat === 'plume') { // velvet cap, gold band, big white plume
    const plume = () => { g.moveTo(40, -110); g.bezierCurveTo(60, -250, 190, -250, 210, -170 + Math.sin(t * 3) * 6); g.bezierCurveTo(160, -200, 120, -170, 70, -100); g.closePath(); };
    P(plume, '#f7f4ee', 6); g.strokeStyle = INK; g.lineWidth = 3; for (const k of [0.3, 0.5, 0.7]) { g.beginPath(); g.moveTo(60, -120); g.quadraticCurveTo(110, -200 + k * 30, 180 * k + 40, -190 + k * 20); g.stroke(); }
    const cap = () => { g.moveTo(-118, -54); g.bezierCurveTo(-120, -170, 120, -170, 118, -54); g.closePath(); };
    P(cap, '#b0302a'); clipShade(cap, () => { g.fillStyle = '#86221d'; g.beginPath(); g.ellipse(90, -90, 50, 90, 0, 0, 7); g.fill(); }); P(cap, null);
    P(() => g.roundRect(-128, -72, 256, 34, 12), K.trim, 6);
    for (const x of [-80, -30, 20, 70]) P(() => g.arc(x, -55, 7, 0, 7), '#b0302a', 3);
  }
  if (K.hat === 'kettle') { // wide-brimmed kettle helmet
    const dome = () => { g.moveTo(-104, -50); g.bezierCurveTo(-110, -175, 110, -175, 104, -50); g.closePath(); };
    P(dome, steel); clipShade(dome, () => { g.fillStyle = steelS; g.beginPath(); g.ellipse(80, -90, 44, 100, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.ellipse(-50, -120, 12, 26, 0.5, 0, 7); g.fill(); }); P(dome, null);
    P(() => g.ellipse(0, -48, 170, 30, 0, 0, 7), steel, 6); clipShade(() => g.ellipse(0, -48, 170, 30, 0, 0, 7), () => { g.fillStyle = steelS; g.fillRect(-180, -46, 360, 40); }); P(() => g.ellipse(0, -48, 170, 30, 0, 0, 7), null, 6);
    P(() => { g.moveTo(0, -160); g.lineTo(0, -52); }, null, 4);
  }
  if (K.hat === 'helm') { // round steel cap with a rim and a green crest
    const dome = () => { g.moveTo(-118, -40); g.bezierCurveTo(-122, -180, 122, -180, 118, -40); g.closePath(); };
    P(dome, steel); clipShade(dome, () => { g.fillStyle = steelS; g.beginPath(); g.ellipse(90, -80, 50, 110, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.ellipse(-56, -110, 12, 28, 0.5, 0, 7); g.fill(); }); P(dome, null);
    P(() => g.roundRect(-126, -58, 252, 28, 10), steelS, 6);
    for (const x of [-90, -45, 0, 45, 90]) { g.fillStyle = INK; g.beginPath(); g.arc(x, -44, 4.5, 0, 7); g.fill(); }
    P(() => { g.moveTo(-14, -150); g.quadraticCurveTo(0, -210, 30, -214); g.quadraticCurveTo(24, -180, 14, -150); g.closePath(); }, '#3f8a4a', 5);
  }
  const bronze = '#d9a441', bronzeS = '#a8772a';
  if (K.hat === 'galea' || K.hat === 'galeaBig') { // Roman bronze helmet, cheek guards, red crest
    const big = K.hat === 'galeaBig';
    const crest = () => { g.moveTo(-70, -150); g.bezierCurveTo(-60, big ? -300 : -250, 60, big ? -300 : -250, 70, -150); g.closePath(); };
    P(crest, '#c8372d', 6); g.strokeStyle = INK; g.lineWidth = 3; for (let x = -50; x <= 50; x += 20) { g.beginPath(); g.moveTo(x, -160); g.lineTo(x * 1.1, big ? -270 : -225); g.stroke(); }
    const dome = () => { g.moveTo(-118, -30); g.bezierCurveTo(-122, -180, 122, -180, 118, -30); g.closePath(); };
    P(dome, bronze); clipShade(dome, () => { g.fillStyle = bronzeS; g.beginPath(); g.ellipse(90, -80, 50, 110, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.ellipse(-56, -110, 12, 28, 0.5, 0, 7); g.fill(); }); P(dome, null);
    P(() => g.roundRect(-128, -46, 256, 24, 10), bronzeS, 6);
    for (const d of [-1, 1]) P(() => { g.moveTo(d * 118, -30); g.lineTo(d * 126, 60); g.quadraticCurveTo(d * 110, 80, d * 92, 60); g.lineTo(d * 94, -26); g.closePath(); }, bronze, 5);
  }
  if (K.hat === 'corinth') { // Greek helmet with a tall dark crest
    const crest = () => { g.moveTo(-20, -150); g.bezierCurveTo(-150, -230, -60, -300, 40, -290); g.bezierCurveTo(140, -280, 150, -200, 60, -150); g.closePath(); };
    P(crest, '#2a3550', 6);
    const dome = () => { g.moveTo(-120, -10); g.bezierCurveTo(-124, -185, 124, -185, 120, -10); g.closePath(); };
    P(dome, bronze); clipShade(dome, () => { g.fillStyle = bronzeS; g.beginPath(); g.ellipse(90, -80, 50, 110, 0, 0, 7); g.fill(); }); P(dome, null);
    P(() => g.roundRect(-126, -50, 252, 22, 10), bronzeS, 6);
  }
  if (K.hat === 'headband') { P(() => { g.moveTo(-120, -64); g.quadraticCurveTo(0, -110, 120, -64); g.lineTo(118, -40); g.quadraticCurveTo(0, -86, -118, -40); g.closePath(); }, '#a8452e', 5); P(() => { g.moveTo(110, -56); g.quadraticCurveTo(150, -40, 160, 0); g.quadraticCurveTo(140, -20, 120, -30); }, '#a8452e', 5);
    P(() => { g.moveTo(-100, -86); g.quadraticCurveTo(-60, -150, 0, -140); g.quadraticCurveTo(70, -150, 104, -84); g.quadraticCurveTo(40, -110, -100, -86); g.closePath(); }, '#5a3a22', 5); }
  if (K.hat === 'trucker') { // mesh-back trucker cap, pushed back a little, with a sprout badge
    const crown = () => { g.moveTo(-132, -30); g.bezierCurveTo(-138, -236, 138, -236, 132, -30); g.quadraticCurveTo(0, -62, -132, -30); g.closePath(); };
    P(crown, '#f3eee2'); clipShade(crown, () => { g.strokeStyle = 'rgba(70,60,50,.55)'; g.lineWidth = 3; for (let k = -340; k < 340; k += 22) { g.beginPath(); g.moveTo(k, -220); g.lineTo(k + 200, -20); g.moveTo(k + 200, -220); g.lineTo(k, -20); g.stroke(); }
      g.fillStyle = 'rgba(120,100,80,.18)'; g.beginPath(); g.ellipse(110, -100, 60, 120, 0, 0, 7); g.fill(); }); P(crown, null);
    const panel = () => { g.moveTo(-84, -56); g.bezierCurveTo(-92, -150, -46, -168, 0, -168); g.bezierCurveTo(46, -168, 92, -150, 84, -56); g.quadraticCurveTo(0, -70, -84, -56); g.closePath(); };
    P(panel, K.cap); clipShade(panel, () => { g.fillStyle = K.capS; g.beginPath(); g.ellipse(86, -100, 40, 100, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.3)'; g.beginPath(); g.ellipse(-46, -134, 10, 20, 0.6, 0, 7); g.fill(); }); P(panel, null);
    P(() => g.arc(0, -196, 10, 0, 7), K.cap, 4);
    P(() => g.ellipse(0, -112, 40, 25, 0, 0, 7), '#fbf7ee', 5);
    P(() => { g.moveTo(0, -94); g.quadraticCurveTo(2, -110, 0, -124); }, null, 4);
    P(() => { g.moveTo(0, -110); g.bezierCurveTo(-8, -124, -24, -126, -28, -118); g.bezierCurveTo(-20, -108, -8, -106, 0, -110); g.closePath(); }, '#4caf50', 3.5);
    P(() => { g.moveTo(0, -116); g.bezierCurveTo(8, -130, 24, -132, 28, -124); g.bezierCurveTo(20, -114, 8, -112, 0, -116); g.closePath(); }, '#4caf50', 3.5);
    const brim = () => { g.moveTo(-112, -56); g.quadraticCurveTo(0, -84, 112, -56); g.quadraticCurveTo(124, -40, 108, -30); g.quadraticCurveTo(0, -48, -108, -30); g.quadraticCurveTo(-124, -40, -112, -56); g.closePath(); };
    P(brim, K.capS); clipShade(brim, () => { g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(-160, -46, 320, 30); }); P(brim, null);
  }
  if (K.hat === 'bald') { // shiny dome with grey tufts over the ears
    for (const d of [-1, 1]) P(() => { g.moveTo(d * 118, -10); g.quadraticCurveTo(d * 150, -40, d * 130, -70); g.quadraticCurveTo(d * 160, -60, d * 150, -20); g.quadraticCurveTo(d * 156, 20, d * 120, 30); g.closePath(); }, '#ece8e0', 5);
    g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.ellipse(-40, -70, 26, 12, -0.4, 0, 7); g.fill();
  }
  if (K.hat === 'bascinet') { // pointed knight's helmet with the visor flipped up
    const dome = () => { g.moveTo(-126, 20); g.lineTo(-122, -70); g.bezierCurveTo(-110, -170, -30, -200, 10, -236); g.bezierCurveTo(60, -180, 124, -150, 122, -70); g.lineTo(126, 20); g.quadraticCurveTo(140, 90, 100, 120); g.lineTo(90, 30); g.quadraticCurveTo(0, -40, -90, 30); g.lineTo(-100, 120); g.quadraticCurveTo(-140, 90, -126, 20); g.closePath(); };
    P(dome, steel); clipShade(dome, () => { g.fillStyle = steelS; g.fillRect(70, -240, 80, 400); g.fillStyle = 'rgba(255,255,255,.75)'; g.beginPath(); g.ellipse(-60, -100, 12, 34, 0.4, 0, 7); g.fill(); }); P(dome, null);
    // visor up on the brow
    P(() => { g.moveTo(-100, -70); g.quadraticCurveTo(0, -150, 100, -70); g.quadraticCurveTo(80, -40, 0, -46); g.quadraticCurveTo(-80, -40, -100, -70); g.closePath(); }, steelS, 6);
    g.fillStyle = INK; for (const x of [-50, -20, 10, 40]) g.fillRect(x, -82, 18, 6);
    P(() => { g.moveTo(10, -236); g.quadraticCurveTo(70, -290, 80 + Math.sin(t * 4) * 8, -250); }, null, 0); g.strokeStyle = '#2f5aa8'; g.lineWidth = 14; g.stroke(); g.strokeStyle = INK; g.lineWidth = 3;
  }
}

function emblem(K) {
  if (K.emblem === 'cross') { P(() => { g.rect(-14, -330, 28, 120); g.rect(-50, -300, 100, 28); }, K.trim, 4); }
  if (K.emblem === 'bar') { P(() => g.rect(-100, -300, 200, 30), K.trim, 4); }
  if (K.emblem === 'lion') { P(() => { g.moveTo(0, -340); g.lineTo(44, -320); g.lineTo(40, -260); g.quadraticCurveTo(0, -224, -40, -260); g.lineTo(-44, -320); g.closePath(); }, K.trim, 5);
    P(() => { g.moveTo(-18, -300); g.lineTo(0, -276); g.lineTo(18, -300); }, null, 5); }
}

function bodyBlock(K) {
  const tunic = () => { g.moveTo(-98, -372); g.quadraticCurveTo(0, -394, 98, -372); g.lineTo(118, -150); g.quadraticCurveTo(0, -130, -118, -150); g.closePath(); };
  if (K.armour) { // mail skirt under the plate
    P(() => g.roundRect(-112, -190, 224, 70, 14), '#8b93a0', 6);
    g.strokeStyle = INK; g.lineWidth = 2.5; for (let y = -180; y < -126; y += 12) for (let x = -104; x < 104; x += 16) { g.beginPath(); g.arc(x + (y / 12 % 2) * 8, y, 6, 0, Math.PI); g.stroke(); }
  }
  if (K.cape) P(() => { g.moveTo(-104, -380); g.lineTo(104, -380); g.lineTo(150, -60); g.quadraticCurveTo(0, -30, -150, -60); g.closePath(); }, K.cape, 6);
  P(tunic, K.cloth); clipShade(tunic, () => { g.fillStyle = K.clothS; g.fillRect(56, -400, 90, 280); g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(-118, -400, 24, 280); }); P(tunic, null);
  if (K.armour) { P(() => { g.moveTo(-70, -360); g.quadraticCurveTo(0, -380, 70, -360); g.lineTo(74, -240); g.quadraticCurveTo(0, -214, -74, -240); g.closePath(); }, '#d5dae1', 6); P(() => { g.moveTo(0, -370); g.lineTo(0, -226); }, null, 4); }
  else emblem(K);
  if (K.sash) { g.save(); g.beginPath(); tunic(); g.clip(); g.strokeStyle = INK; g.lineWidth = 40; g.beginPath(); g.moveTo(-100, -390); g.lineTo(120, -150); g.stroke(); g.strokeStyle = K.sash; g.lineWidth = 28; g.stroke(); g.restore(); }
  // trim along the hem
  P(() => { g.moveTo(-118, -150); g.quadraticCurveTo(0, -130, 118, -150); }, null, 0); g.strokeStyle = K.trim; g.lineWidth = 10; g.stroke(); g.strokeStyle = INK; g.lineWidth = 4;
  // belt
  P(() => g.rect(-112, -218, 224, 24), '#5a3a22', 5); P(() => g.roundRect(-16, -224, 32, 34, 5), '#e0b04a', 4);
  if (K.fur) { P(() => { g.moveTo(-104, -384); for (let i = 0; i <= 10; i++) { const x = -104 + i * 20.8; g.quadraticCurveTo(x - 10, -334 - (i % 2) * 8, x, -350 + (i % 2) * 6); } g.lineTo(104, -392); g.quadraticCurveTo(0, -420, -104, -384); g.closePath(); }, '#f2ead8', 5); }
  else P(() => { g.moveTo(-60, -392); g.quadraticCurveTo(0, -366, 60, -392); }, null, 5);
}
function boot(x, flip, lift = 0, rot = 0) { g.save(); g.translate(x, -lift); g.rotate(rot); g.scale(flip, 1);
  P(() => { g.moveTo(-24, -60); g.lineTo(16, -60); g.lineTo(20, -24); g.quadraticCurveTo(54, -22, 58, -2); g.lineTo(-28, -2); g.closePath(); }, '#5a3a22', 6);
  P(() => g.roundRect(-30, -10, 92, 12, 6), '#3e2716', 5); g.restore(); }

// pose → limb targets in figure units (feet at 0,0; shoulders at ±104,-360)
function pose(name, t, seed) {
  const s = Math.sin(t * 2.2 + seed), s2 = Math.sin(t * 1.3 + seed * 2);
  const base = { bob: s * 4, lean: s2 * 0.02, jump: 0, lf: 0, rf: 0, turn: 0,
    l: [[-138, -200 + s * 4], [-150, -280]], r: [[138, -200 - s * 4], [150, -280]] };
  if (name === 'walk' || name === 'march') { const f = name === 'march' ? 9 : 6.5, ph = t * f + seed, a = Math.sin(ph), up = Math.abs(Math.cos(ph));
    base.lf = Math.max(0, a) * 42; base.rf = Math.max(0, -a) * 42; base.bob = -up * 10; base.lean = name === 'march' ? 0.06 : 0.02;
    base.l = [[-150 + a * 40, -200], [-150, -290]]; base.r = [[150 - a * 40, -200], [150, -290]];
    if (name === 'march') { base.l = [[-130 + a * 50, -230 - Math.max(0, a) * 90], [-160, -300]]; base.r = [[130 - a * 50, -230 - Math.max(0, -a) * 90], [160, -300]]; } }
  if (name === 'hips') { base.l = [[-112, -214], [-190, -268]]; base.r = [[112, -214], [190, -268]]; }
  if (name === 'point') { const k = Math.min(1, Math.max(0, t)); base.l = [[-112, -214], [-190, -268]]; base.r = [L2([138, -200], [250, -520], k), L2([150, -280], [210, -400], k)]; base.lean = -0.05; }
  if (name === 'lever') { const pull = 0.5 + 0.5 * Math.sin(t * 6); base.l = [[-60, -260 + pull * 40], [-150, -300]]; base.r = [[60, -260 + pull * 40], [150, -300]]; base.lean = 0.05 * pull; }
  if (name === 'cheer') { const j = Math.abs(Math.sin(t * 7 + seed)); base.jump = j * 70; base.l = [[-190, -640 + j * 30], [-180, -490]]; base.r = [[190, -640 + j * 30], [180, -490]]; base.lf = j * 20; base.rf = j * 20; base.bob = 0; }
  if (name === 'pump') { const j = Math.abs(Math.sin(t * 8 + seed)); base.jump = j * 30; base.l = [[-112, -214], [-190, -268]]; base.r = [[170, -560 - j * 80], [210, -420]]; }
  if (name === 'cower') { base.l = [[-60, -560], [-170, -420]]; base.r = [[60, -560], [170, -420]]; base.bob = 10 + s * 3; }
  if (name === 'shake') { const j = Math.sin(t * 26 + seed); const st = Math.max(0, Math.sin(t * 5 + seed)); base.l = [[-150, -430 + j * 14], [-190, -330]]; base.r = [[150, -430 - j * 14], [190, -330]]; base.lf = st * 40; base.bob = st * -6; }
  if (name === 'spear') { base.r = [[150, -300 + s * 4], [190, -250]]; base.spear = true; }
  if (name === 'row') { const k = 0.5 + 0.5 * Math.sin(t * 4 + seed * 0.3); base.l = [[-50 + k * 20, -230 - k * 60], [-150, -290]]; base.r = [[50 - k * 20, -230 - k * 60], [150, -290]]; base.lean = (k - 0.5) * 0.12; base.oar = k; }
  if (name === 'cup') { base.l = [[-112, -214], [-190, -268]]; const k = 0.5 + 0.5 * Math.sin(t * 2); base.r = [[190, -470 - k * 30], [210, -350]]; base.cup = true; }
  if (name === 'flail') { const j = Math.sin(t * 18 + seed); base.l = [[-220, -600 + j * 60], [-170, -460]]; base.r = [[220, -600 - j * 60], [170, -460]]; base.lf = 40 + j * 30; base.rf = 40 - j * 30; }
  if (name === 'draw') { base.l = [[-112, -214], [-190, -268]]; base.r = [[200, -150 + Math.sin(t * 3) * 20], [190, -300]]; base.stick = true; base.lean = 0.12; }
  if (name === 'sword') { const k = Math.min(1, Math.max(0, t)); base.r = [L2([138, -200], [150, -640], k), L2([150, -280], [210, -470], k)]; base.sword = true; }
  if (name === 'thumb') { base.l = [[-138, -200], [-150, -280]]; base.r = [[200, -470], [220, -330]]; base.thumb = true; }
  if (name === 'lookup') { base.l = [[-60, -560], [-170, -440]]; base.r = [[138, -200], [150, -280]]; }
  return base;
}

export function drawPerson(ctx, W, H, kindName, poseName, expr, t, seed = 0, opts = {}) {
  g = ctx; const K = KINDS[kindName]; BLIND = !!opts.blind; BACK = !!opts.back;
  g.clearRect(0, 0, W, H);
  const p = pose(poseName, t, seed); if (opts.turn != null) p.turn = opts.turn;
  const S = H / 1000;
  g.save(); g.translate(W / 2, H - 14 * S); g.scale(S * (opts.flip ? -1 : 1), S);
  // speed lines / joy marks behind a celebrating figure
  if (opts.lines) { g.strokeStyle = 'rgba(255,255,255,.95)'; g.lineCap = 'round'; for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (i - 4) * 0.33, r0 = 470 + ((t * 600 + i * 97) % 120), r1 = r0 + 90; g.lineWidth = 10; g.beginPath(); g.moveTo(Math.cos(a) * r0, -420 + Math.sin(a) * r0 * 0.9); g.lineTo(Math.cos(a) * r1, -420 + Math.sin(a) * r1 * 0.9); g.stroke(); } }
  g.translate(0, -p.jump);
  // legs
  stick([-36, -130 + p.bob], [-40, -80], [-40, -60 - p.lf]); stick([36, -130 + p.bob], [40, -80], [40, -60 - p.rf]);
  boot(-42, -1, p.lf); boot(42, 1, p.rf);
  g.save(); g.translate(0, p.bob); g.rotate(p.lean);
  if (p.spear) { g.strokeStyle = INK; g.lineWidth = 18; g.beginPath(); g.moveTo(150, 40); g.lineTo(150, -860); g.stroke(); g.strokeStyle = '#8f5e36'; g.lineWidth = 9; g.stroke(); P(() => { g.moveTo(150, -950); g.lineTo(176, -860); g.lineTo(124, -860); g.closePath(); }, '#c9ced6', 5); }
  if (K.pack && !BACK) P(() => g.roundRect(-150, -400, 300, 280, 40), '#8a5a2e', 7);
  bodyBlock(K);
  if (K.pack && BACK) { P(() => g.roundRect(-128, -420, 256, 300, 44), '#8a5a2e', 7); P(() => g.roundRect(-96, -300, 192, 120, 26), '#6b4422', 6); P(() => { g.moveTo(-60, -240); g.lineTo(60, -240); }, null, 6); P(() => g.roundRect(-112, -150, 224, 46, 20), '#3f6b8a', 6); }
  if (K.pack && !BACK) { P(() => g.roundRect(-74, -372, 22, 220, 8), '#6b4422', 5); P(() => g.roundRect(52, -372, 22, 220, 8), '#6b4422', 5); }
  if (p.cup) { P(() => { g.moveTo(170, -520 - 40); g.lineTo(230, -560); g.quadraticCurveTo(226, -500, 200, -490); g.lineTo(200, -460); g.lineTo(220, -450); g.lineTo(180, -450); g.lineTo(200, -460); g.lineTo(200, -490); g.quadraticCurveTo(174, -500, 170, -560); g.closePath(); }, '#e0b04a', 5); }
  if (p.stick) { g.strokeStyle = INK; g.lineWidth = 12; g.beginPath(); g.moveTo(200, -150); g.lineTo(260, 0); g.stroke(); g.strokeStyle = '#8f5e36'; g.lineWidth = 6; g.stroke(); }
  // arms
  for (const [side, d] of [[p.l, -1], [p.r, 1]]) {
    const sh = [d * 104, -356];
    P(() => g.roundRect(sh[0] - 26, sh[1] - 14, 52, 60, 16), d > 0 ? K.clothS : K.cloth, 6);
    stick([sh[0], sh[1] + 30], side[1], side[0]);
    P(() => g.arc(side[0][0], side[0][1], 16, 0, 7), K.armour ? '#c9ced6' : '#f5efe4', 5);
  }
  if (p.sword) { const [hx, hy] = p.r[0]; P(() => { g.moveTo(hx - 12, hy - 20); g.lineTo(hx - 8, hy - 220); g.lineTo(hx, hy - 250); g.lineTo(hx + 8, hy - 220); g.lineTo(hx + 12, hy - 20); g.closePath(); }, '#dfe3ea', 5); P(() => g.rect(hx - 40, hy - 26, 80, 14), '#e0b04a', 4); }
  if (p.thumb) { const [hx, hy] = p.r[0]; P(() => g.roundRect(hx - 6, hy - 60, 18, 50, 9), '#f5efe4', 5); }
  {
  }
  g.restore();
  // head + hat
  const blink = ((t + seed * 0.71) % 3.1) < 0.12;
  g.save(); g.translate(0, -520 + p.bob * 1.2); g.rotate(p.lean * 2 + Math.sin(t * 1.7 + seed) * 0.03);
  head(K, expr, t, p.turn, blink);
  if (K.glasses && !BACK) { g.save(); g.translate(p.turn, 0); P(() => { g.arc(-40, -8, 34, 0, 7); }, 'rgba(220,240,255,.35)', 7); P(() => { g.arc(40, -8, 34, 0, 7); }, 'rgba(220,240,255,.35)', 7); P(() => { g.moveTo(-6, -10); g.quadraticCurveTo(0, -18, 6, -10); }, null, 6); g.restore(); }
  g.translate(0, -22); hat(K, t);
  g.restore();
  g.restore();
}

// ---- 'pill' body: a chunky capsule torso with buttons, thin ink arms and round hands (reference-look test) ----
// Figure units: seat (or feet) at y=0, body ±104 wide up to -300, head centre at -400.
function pillBody(K, opts) {
  const top = -310, bot = 0, w = 104;
  const body = () => { g.moveTo(-w, top + 60); g.quadraticCurveTo(-w, top, -w + 60, top); g.lineTo(w - 60, top); g.quadraticCurveTo(w, top, w, top + 60); g.lineTo(w, bot - 46); g.quadraticCurveTo(w, bot, w - 46, bot); g.lineTo(-w + 46, bot); g.quadraticCurveTo(-w, bot, -w, bot - 46); g.closePath(); };
  P(body, K.cloth);
  clipShade(body, () => {
    if (K.check) { // plaid shirt: two crossing band sets plus thin lines
      g.fillStyle = K.check; g.globalAlpha = 0.55; for (let x = -w - 20; x < w; x += 58) g.fillRect(x, top, 20, 400); for (let y = top; y < 0; y += 58) g.fillRect(-w, y, 2 * w, 20); g.globalAlpha = 1;
      g.strokeStyle = 'rgba(255,230,190,.5)'; g.lineWidth = 3; for (let x = -w + 18; x < w; x += 58) { g.beginPath(); g.moveTo(x, top); g.lineTo(x, 0); g.stroke(); } for (let y = top + 18; y < 0; y += 58) { g.beginPath(); g.moveTo(-w, y); g.lineTo(w, y); g.stroke(); } }
    if (K.bib) { // denim dungarees: bib, straps, pocket, two brass buttons
      const bib = () => { g.moveTo(-104, -120); g.lineTo(-58, -120); g.lineTo(-58, -196); g.lineTo(58, -196); g.lineTo(58, -120); g.lineTo(104, -150); g.lineTo(104, 10); g.lineTo(-104, 10); g.closePath(); };
      P(bib, K.bib, 6); clipShade(bib, () => { g.fillStyle = K.bibS; g.fillRect(70, -126, 50, 150); }); P(bib, null, 6);
      g.setLineDash([9, 8]); g.strokeStyle = 'rgba(255,220,150,.85)'; g.lineWidth = 3; g.beginPath(); g.rect(-38, -186, 76, 50); g.stroke(); g.setLineDash([]);
      P(() => g.rect(-38, -186, 76, 50), null, 4);
      for (const d of [-1, 1]) { P(() => { g.moveTo(d * 46, -192); g.lineTo(d * 60, top - 10); g.lineTo(d * 84, top - 10); g.lineTo(d * 70, -192); g.closePath(); }, K.bib, 5); P(() => g.arc(d * 46, -184, 10, 0, 7), '#e6b84a', 4); }
    } else { for (const y of [-220, -150, -80]) P(() => g.arc(0, y, 10, 0, 7), 'rgba(255,255,255,.85)', 0); }
    g.fillStyle = 'rgba(0,0,0,.16)'; g.fillRect(w - 34, top, 40, 400);       // side shade strip
    g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(-w, top, 22, 400);
    g.fillStyle = 'rgba(0,0,0,.12)'; g.beginPath(); g.ellipse(0, top - 10, 150, 60, 0, 0, 7); g.fill(); // shadow under the head
  });
  P(body, null, 8);
}
function pillArm(sh, elbow, hand) { stick(sh, elbow, hand, 9); P(() => g.arc(hand[0], hand[1], 24, 0, 7), '#f7f2ea', 6); }
function pillPose(name, t, seed) {
  const s = Math.sin(t * 2.2 + seed);
  const b = { bob: s * 3, lean: Math.sin(t * 1.3 + seed) * 0.015, l: [[-150, -150], [-132, -96 + s * 2]], r: [[150, -150], [132, -96 - s * 2]] };
  if (name === 'wheel') { const st = Math.sin(t * 1.6 + seed) * 10; b.l = [[-120, -120], [-70 + st, -128 - st * 0.4]]; b.r = [[120, -120], [70 + st, -128 + st * 0.4]]; b.front = true; }
  if (name === 'gesture') { const k = 0.5 + 0.5 * Math.sin(t * 5 + seed); b.r = [[170, -200], [168 + k * 14, -250 - k * 30]]; }
  if (name === 'wave') { const k = Math.sin(t * 9 + seed); b.r = [[190, -260], [200 + k * 26, -380]]; }
  return b;
}
export function drawPill(ctx, W, H, kindName, poseName, expr, t, seed = 0, opts = {}) {
  g = ctx; const K = KINDS[kindName]; BLIND = false; BACK = !!opts.back;
  g.clearRect(0, 0, W, H);
  const p = pillPose(poseName, t, seed), S = H / 720;
  g.save(); g.translate(W / 2, H - 10 * S); g.scale(S * (opts.flip ? -1 : 1), S);
  const sh = d => [d * 96, -250];
  if (!p.front) for (const [side, d] of [[p.l, -1], [p.r, 1]]) pillArm(sh(d), side[0], side[1]);
  g.save(); g.translate(0, p.bob); g.rotate(p.lean); pillBody(K, opts); g.restore();
  if (p.front) for (const [side, d] of [[p.l, -1], [p.r, 1]]) pillArm(sh(d), side[0], side[1]);
  const blink = ((t + seed * 0.71) % 3.4) < 0.12;
  g.save(); g.translate(0, -400 + p.bob * 1.2); g.rotate(p.lean * 2 + Math.sin(t * 1.7 + seed) * 0.02);
  head(K, expr, t, opts.turn || 0, blink); g.translate(0, -22); hat(K, t);
  g.restore(); g.restore();
}
