// Gary Tries It: paper cut-out renderer (script.json "style": "paper").
// A separate look from web/scene.js: craft-paper sets in parallax layers, a jointed
// paper-puppet human as "you", stop-motion animation (12 fps holds with jitter),
// ransom-note time labels and torn-paper captions. Plain 2D canvas, no three.js.
// Same contract as scene.js: window.renderFrame(t), window.DURATION, window.READY.

const W = 1080, H = 1920;
const ep = new URLSearchParams(location.search).get('ep');
const script = await (await fetch(`/episodes/${ep}/script.json`)).json();
const timeline = await (await fetch(`/episodes/${ep}/timeline.json`)).json();
await Promise.all(['400 100px "Permanent Marker"', '400 100px "Patrick Hand"', '700 100px Fredoka', '400 100px Anton', '400 100px "Special Elite"']
  .map(f => document.fonts.load(f)));
const SF = script.stopFps || 12;               // stop-motion frame rate for everything except captions
const cv = document.getElementById('c');
const ctx = cv.getContext('2d');

// ---------- utilities ----------
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => { t = clamp(t); return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };
const backOut = t => { t = clamp(t); const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const hash = (...n) => rng(n.reduce((a, b) => Math.imul(a ^ (b * 2654435761 | 0), 16777619), 2166136261))();
const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

// ---------- paper texture: grain, fibres and blotches as translucent black/white, laid over every piece ----------
const TEX = (() => {
  const S = 512, c = canvas(S, S), x = c.getContext('2d'), r = rng(99);
  const id = x.createImageData(S, S);
  for (let i = 0; i < id.data.length; i += 4) { const g = r(); id.data[i] = id.data[i + 1] = id.data[i + 2] = g > 0.93 ? 255 : 0; id.data[i + 3] = g > 0.93 ? 40 : g * 20; }
  x.putImageData(id, 0, 0);
  for (let i = 0; i < 50; i++) {
    const cx = r() * S, cy = r() * S, rad = 20 + r() * 90, gr = x.createRadialGradient(cx, cy, 0, cx, cy, rad);
    gr.addColorStop(0, `rgba(0,0,0,${0.025 + r() * 0.03})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.fillRect(0, 0, S, S);
  }
  for (let i = 0; i < 1400; i++) {
    const x0 = r() * S, y0 = r() * S, a = r() * Math.PI * 2, L = 5 + r() * 24;
    x.strokeStyle = r() < 0.6 ? `rgba(255,255,255,${0.12 + r() * 0.16})` : `rgba(0,0,0,${0.04 + r() * 0.05})`;
    x.lineWidth = 0.5 + r() * 0.9; x.beginPath(); x.moveTo(x0, y0);
    x.quadraticCurveTo(x0 + Math.cos(a + 0.6) * L * 0.5, y0 + Math.sin(a + 0.6) * L * 0.5, x0 + Math.cos(a) * L, y0 + Math.sin(a) * L); x.stroke();
  }
  return c;
})();
const pats = new WeakMap();
const texFor = c => { if (!pats.has(c)) pats.set(c, c.createPattern(TEX, 'repeat')); return pats.get(c); };

// ---------- shapes (point lists) and hand-cut paths ----------
const R = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
const E = (cx, cy, rx, ry, n = 40, a0 = 0, a1 = Math.PI * 2) => {
  const full = Math.abs(a1 - a0) >= 6.28, o = [];
  for (let i = 0; i < (full ? n : n + 1); i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); }
  return o;
};
const RR = (x, y, w, h, r) => {
  r = Math.min(r, w / 2, h / 2); const o = [];
  const corner = (cx, cy, a0) => { for (let i = 0; i <= 6; i++) { const a = a0 + Math.PI / 2 * i / 6; o.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } };
  corner(x + w - r, y + r, -Math.PI / 2); corner(x + w - r, y + h - r, 0); corner(x + r, y + h - r, Math.PI / 2); corner(x + r, y + r, Math.PI);
  return o;
};
// wavy-topped band from x0 to x1, filled down to yb
const WAVE = (x0, x1, y, amp, freq, ph, yb) => { const o = []; for (let x = x0; x <= x1; x += 20) o.push([x, y + amp * Math.sin(x * freq + ph) + amp * 0.4 * Math.sin(x * freq * 2.7 + ph * 1.3)]); o.push([x1, yb], [x0, yb]); return o; };
const STAR = (cx, cy, r1, r2, n, rot = 0) => { const o = []; for (let i = 0; i < n * 2; i++) { const a = rot + i * Math.PI / n, r = i % 2 ? r2 : r1; o.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } return o; };

// Path2D with scissor-cut wobble: edges are subdivided and nudged by a seeded jitter (stable across frames)
function P(shapes, seed = 1, amp = 1.5, step = 14) {
  if (typeof shapes[0][0] === 'number') shapes = [shapes];
  const r = rng(seed * 7919 + 13), p = new Path2D();
  for (const pts of shapes) {
    const n = pts.length;
    for (let i = 0; i < n; i++) {
      const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % n];
      const k = Math.max(1, Math.round(Math.hypot(bx - ax, by - ay) / step));
      for (let j = 0; j < k; j++) {
        const u = j / k, x = ax + (bx - ax) * u + (r() - 0.5) * 2 * amp, y = ay + (by - ay) * u + (r() - 0.5) * 2 * amp;
        if (i === 0 && j === 0) p.moveTo(x, y); else p.lineTo(x, y);
      }
    }
    p.closePath();
  }
  return p;
}
const memo = new Map();
const M = (key, fn) => { if (!memo.has(key)) memo.set(key, fn()); return memo.get(key); };

// one piece of paper: optional white backing border, colour, drop shadow onto what is below, texture, cut edge
function _piece(c, path, color, o = {}) {
  c.save();
  if (o.alpha != null) c.globalAlpha *= o.alpha;
  const sh = o.shadow === false ? null : (o.shadow || c.__sh);
  if (sh) { c.shadowColor = sh[3] || 'rgba(45,28,12,0.34)'; c.shadowBlur = sh[2]; c.shadowOffsetX = sh[0]; c.shadowOffsetY = sh[1]; }
  const rule = o.rule || 'nonzero';
  if (o.border) {
    c.lineJoin = 'round'; c.strokeStyle = c.fillStyle = o.borderColor || '#fbf7ec'; c.lineWidth = o.border;
    c.stroke(path); c.fill(path, rule); c.shadowColor = 'transparent';
  }
  c.fillStyle = color; c.fill(path, rule);
  c.shadowColor = 'transparent';
  if (o.tex !== false) { c.fillStyle = texFor(c); c.fill(path, rule); }
  if (o.edge !== false) { c.lineWidth = o.edgeW || 1.6; c.strokeStyle = o.edgeColor || 'rgba(40,25,10,0.25)'; c.stroke(path); }
  c.restore();
}
// paper with printed/drawn text on it
function ink(c, txt, x, y, font, color = '#1b1b1b', align = 'center') { c.save(); c.font = font; c.fillStyle = color; c.textAlign = align; c.textBaseline = 'middle'; c.fillText(txt, x, y); c.restore(); }
function glow(c, x, y, r, color, a) { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, color.replace('A', a)); g.addColorStop(1, color.replace('A', 0)); c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fillRect(x - r, y - r, 2 * r, 2 * r); c.restore(); }
function stars(c, n, seed, x0, y0, w, h) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const x = x0 + r() * w, y = y0 + r() * h, s = 1.2 + r() * r() * 4.5;
    c.fillStyle = `rgba(255,250,225,${0.55 + r() * 0.45})`; c.beginPath(); c.arc(x, y, s, 0, 7); c.fill();
    if (s > 3.6) { c.fillStyle = 'rgba(255,250,225,0.12)'; c.beginPath(); c.arc(x, y, s * 3.2, 0, 7); c.fill(); }
  }
}

// ---------- world and layers ----------
// World coordinates equal screen pixels at the default camera (540, 960, zoom 1). Layers have a
// depth d: 0 = infinitely far (never moves), 1 = the puppet's plane, >1 = in front of the puppet.
const X0 = -420, Y0 = -340, WW = 1920, WH = 2600;
let cam = { x: 540, y: 960, z: 1 };
let jitterFrame = 0, shake = 0;
function xform(c, d, li = 0) {
  const z = 1 + (cam.z - 1) * d, cx = 540 + (cam.x - 540) * d, cy = 960 + (cam.y - 960) * d;
  const jx = (hash(jitterFrame, li, 1) - 0.5) * 3 + (hash(jitterFrame, 9) - 0.5) * shake * d;
  const jy = (hash(jitterFrame, li, 2) - 0.5) * 3 + (hash(jitterFrame, 8) - 0.5) * shake * d;
  c.setTransform(z, 0, 0, z, W / 2 - cx * z + jx, H / 2 - cy * z + jy);
}

const PAL = {
  skin: '#f0c39d', skinD: '#d99f78', hair: '#4a2f1f', shirt: '#2f9c95', trousers: '#2f3d5c', shoes: '#272727',
  cheek: 'rgba(230,110,110,0.38)', mouth: '#7a2630',
};

// ---------- scenes ----------
function house(c, x, y, w, h, wall, roof, seed, opt = {}) {
  piece(c, P(R(x, y, w, h), seed), wall, { border: 5 });
  piece(c, P([[x - 30, y + 4], [x + w / 2, y - h * 0.5], [x + w + 30, y + 4]], seed + 1), roof, { border: 5 });
  if (opt.snow) piece(c, P([[x - 34, y - 2], [x + w / 2, y - h * 0.5 - 8], [x + w + 34, y - 2], [x + w + 10, y + 16], [x + w / 2, y - h * 0.5 + 22], [x - 10, y + 16]], seed + 2, 3), '#f4f8fb', { border: 0 });
  const win = opt.win || '#f6e7a1', r = rng(seed);
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
    const wx = x + w * (0.18 + 0.44 * i), wy = y + h * (0.14 + 0.42 * j), ww = w * 0.22, wh = h * 0.24;
    if (i === 1 && j === 1 && opt.door !== false) continue;
    piece(c, P(R(wx, wy, ww, wh), seed + 10 + i * 2 + j), opt.lit && r() < 0.35 ? '#ffd86b' : win, { border: 7 });
    piece(c, P(R(wx + ww / 2 - 3, wy, 6, wh), seed + 20 + i, 0.5), '#fbf7ec', { shadow: false, edge: false });
  }
  if (opt.door !== false) piece(c, P(RR(x + w * 0.64, y + h * 0.58, w * 0.2, h * 0.42, 16), seed + 30), opt.doorColor || '#3f5f7a', { border: 5 });
}
function tree(c, x, y, s, seed, dead = false) {
  piece(c, P([[x - 22 * s, y], [x - 14 * s, y - 330 * s], [x + 14 * s, y - 330 * s], [x + 24 * s, y]], seed), '#7a5230');
  if (dead) {
    for (const [a, l, h] of [[-0.9, 150, 0.55], [0.8, 170, 0.7], [-0.5, 110, 0.85], [0.4, 120, 0.95]]) {
      const bx = x, by = y - 330 * s * h, ex = bx + Math.sin(a) * l * s, ey = by - Math.cos(a) * l * s;
      piece(c, P([[bx - 7 * s, by], [ex, ey], [bx + 7 * s, by - 6 * s]], seed + l), '#6b4a2c');
    }
    return;
  }
  const r = rng(seed); const blobs = [];
  for (let i = 0; i < 7; i++) blobs.push(E(x + (r() - 0.5) * 230 * s, y - 380 * s + (r() - 0.5) * 170 * s, (80 + r() * 50) * s, (75 + r() * 45) * s, 28));
  piece(c, P(blobs, seed + 3, 2), '#5f9e4f', { edge: false, border: 6, borderColor: '#4c8a3e' });
  for (let i = 0; i < 5; i++) piece(c, P(E(x + (r() - 0.5) * 200 * s, y - 380 * s + (r() - 0.5) * 140 * s, 16 * s, 16 * s, 12), seed + 40 + i), '#d9493b', { shadow: [2, 3, 3] });
}
function cloud(c, x, y, s, seed, color = '#fbfbf7') {
  const r = rng(seed), b = [];
  for (let i = 0; i < 5; i++) b.push(E(x + (i - 2) * 60 * s, y - (i === 2 ? 40 : i % 2 ? 22 : 0) * s, (55 + r() * 20) * s, (45 + r() * 15) * s, 26));
  b.push(RR(x - 160 * s, y - 10 * s, 320 * s, 55 * s, 26 * s));
  piece(c, P(b, seed, 1.8), color, { edge: false });
}
function snowGround(c, y, seed) {
  piece(c, P(WAVE(X0, X0 + WW, y, 16, 0.006, seed, Y0 + WH), seed, 3), '#e9f0f6', { border: 0 });
  piece(c, P(WAVE(X0, X0 + WW, y + 120, 22, 0.004, seed + 2, Y0 + WH), seed + 1, 3), '#f7fafc', { border: 0 });
}

const SCENES = {
  garden: {
    gary: () => ({ x: 540, y: 1590, s: 1 }),
    tint: v => v.dark ? 'rgba(10,16,44,0.68)' : null, charTint: v => v.dark ? 'rgba(10,16,44,0.36)' : null,
    layers: [
      { d: 0.04, noTint: true, draw(c, v) {
        if (v.dark) { c.fillStyle = '#0c1124'; c.fillRect(X0, Y0, WW, WH); stars(c, 420, 5, X0, Y0, WW, 1500); return; }
        const g = c.createLinearGradient(0, Y0, 0, 1300); g.addColorStop(0, '#76bfdc'); g.addColorStop(1, '#d4eef2');
        c.fillStyle = g; c.fillRect(X0, Y0, WW, WH); c.fillStyle = texFor(c); c.fillRect(X0, Y0, WW, WH);
        cloud(c, 160, 560, 0.9, 3); cloud(c, 960, 700, 0.7, 4); cloud(c, 560, 380, 0.55, 5);
      } },
      { d: 0.1, dyn: true, draw(c, v, tq, b, ctxB) {         // the sun (on a string) and a pale daytime moon
        const so = ctxB.sunout;                               // {pull: 0..1, dark: bool} or null
        if (v.dark && (!so || so.pull >= 1)) return;
        const pull = so ? so.pull : 0, sx = 860, sy = 600 - ease(pull) * 1100;
        c.save(); c.strokeStyle = 'rgba(60,40,20,0.7)'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(sx, sy - 110); c.lineTo(sx + 4, Y0); c.stroke(); c.restore();
        const rot = Math.floor(tq * SF) % 2 ? 0.03 : 0;
        piece(c, M('sunrays', () => P(STAR(0, 0, 175, 118, 14), 61, 2)), '#ffb52e', { shadow: [6, 9, 12] , ...xfp(c, sx, sy, rot) });
        piece(c, M('sun', () => P(E(0, 0, 118, 118, 48), 62, 1.5)), '#ffd84a', xfp(c, sx, sy, 0));
        if (!v.dark) piece(c, M('moon', () => P([...E(0, 0, 52, 52, 30, -1.9, 1.9), ...E(-26, 0, 44, 50, 30, 1.6, -1.6)], 63, 1)), '#f7f3e6', { alpha: 0.75, shadow: [2, 3, 6], ...xfp(c, 200, 470, 0) });
      } },
      { d: 0.25, draw(c) {
        piece(c, P(WAVE(X0, X0 + WW, 980, 70, 0.0035, 1, Y0 + WH), 11, 2.5), '#a9cf8c', { border: 7 });
        piece(c, P(WAVE(X0, X0 + WW, 1080, 55, 0.005, 4, Y0 + WH), 12, 2.5), '#8fbf73', { border: 7 });
      } },
      { d: 0.55, draw(c) {
        house(c, -120, 720, 430, 520, '#d9744f', '#5b4a6b', 21);
        tree(c, 900, 1240, 1.05, 31);
        for (let x = -400; x < 1500; x += 64) piece(c, P([[x, 1300], [x, 1150], [x + 21, 1124], [x + 42, 1150], [x + 42, 1300]], 40 + x, 1), '#f7f2e4', { shadow: [3, 5, 6] });
        piece(c, P(R(X0, 1180, WW, 22), 41, 1), '#efe7d2', { shadow: [3, 5, 6] });
      } },
      { d: 0.85, draw(c) {
        piece(c, P(WAVE(X0, X0 + WW, 1310, 14, 0.01, 2, Y0 + WH), 51, 2.5), '#7bb661', { border: 6, borderColor: '#9ccc7c' });
        const r = rng(52);
        for (let i = 0; i < 7; i++) piece(c, P(E(620 + i * 38 + r() * 20, 1420 + i * 70, 46 - i * 2, 20, 18), 53 + i), '#cbbfa6', { shadow: [2, 4, 4] });
      } },
      { d: 1.25, draw(c) {
        const r = rng(71);
        for (let i = 0; i < 16; i++) {
          const x = X0 + 80 + i * 120 + r() * 40, y = 2010 + r() * 40, h = 90 + r() * 70;
          piece(c, P([[x - 40, y], [x - 18, y - h], [x, y - 20], [x + 16, y - h * 1.1], [x + 40, y]], 72 + i), i % 2 ? '#5e9b4b' : '#6fae58');
          if (i % 3 === 0) { piece(c, P(STAR(x, y - h - 20, 30, 14, 6), 80 + i), ['#f3a6c0', '#ffe066', '#ffffff'][i % 3 ? 1 : 0]); piece(c, P(E(x, y - h - 20, 11, 11, 12), 90 + i, 0.6), '#f0a830', { shadow: [1, 2, 2] }); }
        }
      } },
    ],
  },

  space: {
    gary: (tq, b) => { const e = earthAt(tq, b); return { x: e.x, y: e.y - 192, s: 0.24 }; },
    layers: [
      { d: 0.03, draw(c) {
        c.fillStyle = '#0a0a17'; c.fillRect(X0, Y0, WW, WH); c.fillStyle = texFor(c); c.fillRect(X0, Y0, WW, WH);
        piece(c, P(E(900, 400, 420, 220, 40), 101, 12, 30), 'rgba(110,70,160,0.25)', { shadow: false, edge: false });
        piece(c, P(E(100, 1500, 380, 260, 40), 102, 12, 30), 'rgba(40,90,160,0.22)', { shadow: false, edge: false });
        stars(c, 650, 7, X0, Y0, WW, WH);
      } },
      { d: 1, dyn: true, draw(c, v, tq, b) {
        // dead sun: a charcoal disc with dull embers at the rim
        piece(c, M('deadsun', () => P(E(150, 640, 250, 250, 60), 111, 2.5)), '#3a3434', { border: 6, borderColor: '#5a2e22', shadow: [0, 0, 30, 'rgba(160,60,30,0.35)'] });
        for (const [x, y, r] of [[90, 560, 40], [210, 720, 55], [230, 560, 24], [80, 760, 30]]) piece(c, M('spot' + x, () => P(E(x, y, r, r * 0.8, 18), x)), '#2a2626', { shadow: false });
        c.save(); c.setLineDash([18, 22]); c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 5; c.beginPath(); c.ellipse(150, 640, 560, 560, 0, -0.4, 2.2); c.stroke(); c.restore();
        const e = earthAt(tq, b);
        piece(c, M('earth', () => P(E(0, 0, 190, 190, 60), 121, 1.5)), '#3d7cc9', { border: 6, ...xfp(c, e.x, e.y, 0) });
        piece(c, M('land', () => P([E(-70, -40, 80, 60, 20), E(60, 70, 70, 50, 20), E(90, -80, 40, 35, 16), E(-40, 110, 50, 30, 16)], 122, 3)), '#5aa457', xfp(c, e.x, e.y, tq * 0.15));
        piece(c, M('ice', () => P([E(0, -176, 70, 16, 16), E(0, 178, 60, 12, 16)], 123, 2)), '#f2f6fa', xfp(c, e.x, e.y, 0));
      } },
    ],
  },

  livingroom: {
    gary: () => ({ x: 430, y: 1615, s: 1 }),
    tint: v => v.mood === 'frozen' ? 'rgba(26,46,98,0.55)' : v.mood === 'cold' ? 'rgba(20,36,84,0.52)' : 'rgba(18,20,44,0.46)',
    charTint: v => v.mood ? 'rgba(26,46,98,0.24)' : 'rgba(18,20,44,0.18)',
    layers: [
      { d: 0.5, draw(c, v) {
        piece(c, P(R(X0, Y0, WW, 1700), 201), '#e4d9b8', { shadow: false });
        for (let x = X0; x < X0 + WW; x += 120) piece(c, P(R(x, Y0, 46, 1700), 202 + x, 0.8), '#d8c99f', { shadow: false, edge: false });
        // window onto the black, starry sky
        piece(c, P(R(600, 440, 420, 560), 210), '#f5f1e6', { border: 4 });
        c.save(); const gl = P(R(626, 466, 368, 508), 211, 1); c.clip(gl); c.fillStyle = '#0b1022'; c.fillRect(600, 440, 420, 560); stars(c, 60, 3, 626, 466, 368, 508);
        if (v.mood) { const r = rng(212); for (let i = 0; i < 26; i++) { const a = r() * 6.28, edge = i % 4; const fx = edge < 2 ? 626 + (edge ? 368 : 0) : 626 + r() * 368, fy = edge < 2 ? 466 + r() * 508 : 466 + (edge === 3 ? 508 : 0);
          piece(c, P(E(fx, fy, 50 + r() * 60 * (v.mood === 'frozen' ? 1.6 : 1), 40 + r() * 50, 18), 213 + i, 5), 'rgba(235,245,255,0.8)', { shadow: false, edge: false }); } }
        c.restore();
        piece(c, P(R(806, 466, 10, 508), 214, 0.5), '#f5f1e6', { shadow: [2, 3, 3] });
        piece(c, P(R(626, 712, 368, 10), 215, 0.5), '#f5f1e6', { shadow: [2, 3, 3] });
        piece(c, P(R(580, 1000, 460, 30), 216), '#efe9da');
        if (v.mood) for (let i = 0; i < 9; i++) piece(c, P([[612 + i * 46, 1028], [632 + i * 46, 1028], [622 + i * 46, 1070 + (i * 37 % 60)]], 217 + i, 1), '#e8f4ff', { shadow: [2, 3, 3] });
        // picture of a sunny day, now ironic
        piece(c, P(R(90, 520, 250, 200), 220), '#8a5a35', { border: 0 });
        piece(c, P(R(108, 538, 214, 164), 221), '#9fd4e6', { shadow: false });
        piece(c, P(E(250, 590, 32, 32, 20), 222), '#ffd84a', { shadow: [2, 3, 3] });
        piece(c, P(WAVE(108, 322, 650, 12, 0.03, 1, 702), 223), '#7bb661', { shadow: false });
        // radiator (cold now), skirting
        piece(c, P(RR(80, 1090, 330, 220, 14), 230), '#f1efe8');
        for (let i = 0; i < 6; i++) piece(c, P(RR(98 + i * 52, 1104, 36, 192, 14), 231 + i, 0.8), '#e3e0d6', { shadow: [2, 3, 3] });
        piece(c, P(R(X0, 1330, WW, 40), 240), '#8b5a3c');
      } },
      { d: 0.75, draw(c) {
        piece(c, P(R(X0, 1360, WW, 1000), 250), '#9c6b43', { shadow: false });
        for (let y = 1420; y < 2300; y += 90) piece(c, P(R(X0, y, WW, 6), 251 + y, 0.6), '#7f5534', { shadow: false, edge: false });
        // sofa on the right
        piece(c, P(RR(640, 1060, 520, 300, 40), 260), '#4f7397', { border: 0 });
        piece(c, P(RR(600, 1210, 600, 260, 40), 261), '#5d84ab');
        piece(c, P(RR(560, 1160, 120, 300, 40), 262), '#55799e');
        piece(c, P(RR(700, 1100, 170, 150, 30), 263), '#e3b23c');
      } },
      { d: 0.95, draw(c) { piece(c, P(E(470, 1640, 430, 110, 50), 270, 2), '#b5473a', { border: 0, shadow: [3, 6, 8] });
        piece(c, P(E(470, 1640, 360, 82, 50), 271, 2), '#c9634f', { shadow: false }); } },
      { d: 1, dyn: true, draw(c, v, tq, b) {                // little side table with the candle
        piece(c, M('stool', () => P([[800, 1700], [820, 1520], [980, 1520], [1000, 1700], [975, 1700], [960, 1550], [840, 1550], [825, 1700]], 280)), '#6b4a2c');
        piece(c, M('stooltop', () => P(RR(780, 1500, 240, 34, 10), 281)), '#8a5e38');
        const cand = (b.props || []).find(p => p.type === 'candle');
        if (!cand) return;
        piece(c, M('candle', () => P(RR(872, 1360, 56, 145, 10), 282, 1)), '#f6f0de');
        piece(c, M('wax', () => P([[872, 1370], [928, 1370], [928, 1400], [915, 1420], [905, 1395], [890, 1430], [872, 1395]], 283, 1)), '#ece3c8', { shadow: [1, 2, 2] });
        c.save(); c.fillStyle = '#222'; c.fillRect(898, 1336, 4, 26); c.restore();
        const f = Math.floor(tq * SF);
        if (!cand.out) {
          const s = 1 + 0.12 * (hash(f, 3) - 0.5);
          piece(c, M('flame', () => P([[0, -70], [22, -18], [16, 6], [0, 12], [-16, 6], [-22, -18]], 284, 1)), '#ffb52e', { shadow: false, ...xfp(c, 900, 1338, 0.06 * (hash(f, 4) - 0.5), s) });
          piece(c, M('flame2', () => P([[0, -40], [12, -10], [0, 6], [-12, -10]], 285, 0.6)), '#fff1a8', { shadow: false, edge: false, ...xfp(c, 900, 1338, 0, s) });
        } else for (let i = 0; i < 3; i++) { const ph = (tq * 0.5 + i / 3) % 1; piece(c, M('smoke', () => P(E(0, 0, 14, 10, 12), 286, 1)), 'rgba(200,205,215,0.6)', { shadow: false, alpha: 1 - ph, ...xfp(c, 900 + Math.sin(ph * 6 + i) * 18, 1320 - ph * 220, 0, 1 + ph) }); }
      } },
    ],
    glows(c, v, tq, b) {
      const cand = (b.props || []).find(p => p.type === 'candle');
      if (cand && !cand.out) { const f = Math.floor(tq * SF); glow(c, 900, 1320, 620, 'rgba(255,170,70,A)', 0.36 + 0.06 * hash(f, 5)); }
    },
  },

  street: {
    gary: () => ({ x: 300, y: 1620, s: 1 }),
    tint: () => 'rgba(12,18,46,0.34)', charTint: () => 'rgba(12,18,46,0.16)',
    layers: [
      { d: 0.04, noTint: true, draw(c) { c.fillStyle = '#121a33'; c.fillRect(X0, Y0, WW, WH); c.fillStyle = texFor(c); c.fillRect(X0, Y0, WW, WH); stars(c, 300, 9, X0, Y0, WW, 1100); } },
      { d: 0.3, draw(c) {
        const r = rng(301); let x = X0;
        while (x < X0 + WW) { const w = 120 + r() * 160, h = 260 + r() * 380; piece(c, P(R(x, 1150 - h, w, h + 400), 302 + x), '#2b3552', { border: 0, shadow: [3, 5, 8] });
          for (let k = 0; k < 6; k++) if (r() < 0.4) piece(c, P(R(x + 20 + r() * (w - 50), 1150 - h + 30 + r() * (h - 60), 22, 30), 303 + x + k, 0.6), '#f6d36b', { shadow: false, edge: false });
          x += w + 8; }
        snowGround(c, 1160, 4);
      } },
      { d: 0.6, draw(c) {
        house(c, -60, 820, 380, 470, '#b5523f', '#3b3046', 311, { snow: true, lit: true });
        // the shop: empty shelves, SOLD OUT sign
        piece(c, P(R(460, 760, 560, 560), 320), '#2f8c7a', { border: 5 });
        piece(c, P(R(430, 720, 620, 90), 321), '#f2e6c8', { border: 5 });
        ink(c, 'SUPERMARKET', 740, 768, '400 58px Anton', '#2f8c7a');
        piece(c, P(R(500, 850, 480, 330), 322), '#f6edd2', { border: 8, borderColor: '#e7dcc0' });
        for (let i = 0; i < 3; i++) piece(c, P(R(515, 930 + i * 90, 450, 14), 323 + i, 0.6), '#b9ac8c', { shadow: [2, 4, 4] });
        piece(c, P(R(528, 905, 30, 25), 330, 0.5), '#d24a3a', { shadow: [1, 2, 2] });
        c.save(); c.translate(740, 960); c.rotate(-0.12); piece(c, P(R(-150, -50, 300, 100), 331, 2), '#fff7b0', { shadow: [3, 5, 6] }); ink(c, 'SOLD OUT', 0, 4, '400 62px "Permanent Marker"', '#c62828'); c.restore();
        piece(c, P(R(780, 1180, 120, 140), 332), '#24584e', { border: 4 });
        piece(c, P([[430, 726], [740, 690], [1050, 726], [1050, 744], [430, 744]], 333, 3), '#f7fafc', { shadow: [2, 3, 4] });
        house(c, 1080, 860, 380, 440, '#c9a04a', '#4a3a55', 341, { snow: true, lit: true, doorColor: '#7b3b3b' });
        // street lamp
        piece(c, P(R(-196, 860, 22, 470), 350), '#2a2a2a');
        piece(c, P([[-230, 860], [-140, 860], [-160, 820], [-210, 820]], 351), '#2a2a2a');
        piece(c, P(R(-218, 860, 66, 26), 352, 0.6), '#ffe27a', { shadow: false });
      } },
      { d: 0.85, draw(c) {
        piece(c, P(R(X0, 1320, WW, 120), 360), '#5b6170', { shadow: false });
        snowGround(c, 1420, 7);
        piece(c, P(WAVE(X0, X0 + WW, 1330, 8, 0.02, 2, 1350), 361, 2), '#f4f8fb', { shadow: [2, 4, 6] });
      } },
      { d: 1.25, draw(c) {
        tree(c, 1020, 2060, 1.1, 371, true);
        piece(c, P(WAVE(X0, X0 + WW, 1960, 40, 0.006, 3, Y0 + WH), 372, 4), '#f7fafc', { border: 0, shadow: [4, -6, 12] });
      } },
    ],
    glows(c) { glow(c, -185, 880, 360, 'rgba(255,220,120,A)', 0.4); },
  },

  void: {
    gary: tq => ({ x: 540, y: 1480 + 26 * Math.sin(tq * 2.4), s: 0.95 }),
    layers: [
      { d: 0.05, dyn: true, draw(c, v, tq) {
        c.fillStyle = '#fdf0d2'; c.fillRect(X0, Y0, WW, WH);
        const rot = Math.floor(tq * SF) * 0.012;
        piece(c, M('rays', () => { const sh = []; for (let i = 0; i < 18; i++) { const a = i * Math.PI / 9; sh.push([[0, 0], [2600 * Math.cos(a - 0.08), 2600 * Math.sin(a - 0.08)], [2600 * Math.cos(a + 0.08), 2600 * Math.sin(a + 0.08)]]); } return P(sh, 401, 3, 60); }), '#f9dfa6', { shadow: false, ...xfp(c, 540, 820, rot) });
      } },
      { d: 0.5, draw(c) { cloud(c, 100, 1500, 1.6, 411, '#ffffff'); cloud(c, 980, 1420, 1.4, 412, '#ffffff'); cloud(c, 540, 1700, 2.2, 413, '#f7fbff'); cloud(c, 820, 420, 0.8, 414, '#ffffff'); cloud(c, 180, 620, 0.7, 415, '#ffffff'); } },
      { d: 1.2, draw(c) { cloud(c, 40, 2060, 2.4, 421, '#ffffff'); cloud(c, 1060, 2080, 2.4, 422, '#ffffff'); } },
    ],
  },
};
// helper: {at: [x, y, rot, scale]} makes piece() draw a cached path at a position
function xfp(c, x, y, rot = 0, s = 1) { return { at: [x, y, rot, s] }; }
function piece(c, path, color, o = {}) {
  if (!o.at) return _piece(c, path, color, o);
  const [x, y, rot, s] = o.at; c.save(); c.translate(x, y); if (rot) c.rotate(rot); if (s !== 1) c.scale(s, s); _piece(c, path, color, o); c.restore();
}
function earthAt(tq, b) { const a = lerp(0.62, 0.95, clamp((tq - b.start) / Math.max(1, b.end - b.start))); return { x: 150 + 560 * Math.cos(a), y: 640 + 560 * Math.sin(a) }; }

// ---------- the puppet ("you") ----------
const POSES = {
  idle: { lu: 0.14, lf: 0.06, ru: -0.14, rf: -0.06 },
  point: { lu: 0.14, lf: 0.1, ru: -2.62, rf: -0.12 },
  shrug: { lu: 0.85, lf: 1.75, ru: -0.85, rf: -1.75 },
  hug: { lu: -0.45, lf: -1.5, ru: 0.45, rf: 1.5 },
  ghost: { lu: 0.7, lf: 0.3, ru: -0.7, rf: -0.3 },
};
function puppet(c, st) {
  const pal = { ...PAL };
  if (st.cold) Object.assign(pal, { skin: '#d2dde8', skinD: '#e0605a', cheek: 'rgba(120,160,230,0.4)' });
  if (st.expr === 'sick') Object.assign(pal, { skin: '#c9d79a', skinD: '#a9b874' });
  if (st.ghost) Object.assign(pal, { skin: '#f4f7fb', skinD: '#dfe6ef', hair: '#e4ebf3', shirt: '#eef3f9', trousers: '#e6edf5', shoes: '#dbe3ec', cheek: 'rgba(160,190,230,0.3)', mouth: '#8aa0bd' });
  const acc = new Set(st.acc || []);
  const pose = { ...(POSES[st.pose] || POSES.idle) };
  const f = st.frame;
  if (!st.pose || st.pose === 'idle') { pose.lu += 0.05 * Math.sin(st.tq * 2); pose.ru -= 0.05 * Math.sin(st.tq * 2 + 1); }
  if (st.pose === 'ghost') { pose.lu += 0.25 * Math.sin(st.tq * 3); pose.ru -= 0.25 * Math.sin(st.tq * 3 + 0.6); }
  if (st.pose === 'point') pose.rf += 0.08 * Math.sin(st.tq * 5);
  const pc = (path, color, o) => piece(c, path, color, o);
  c.save();
  if (st.cold) c.translate((hash(f, 21) - 0.5) * 7, 0);            // shivering
  if (st.lie) { c.translate(-170 * st.lie, lerp(-450, -120, st.lie)); c.rotate(1.5 * st.lie); c.translate(0, 450); }
  const J = st.jumpers;
  const sleeve = acc.has('jumpers') ? '#3d6fb6' : pal.shirt;
  if (st.ghost) {   // wings behind
    for (const s of [-1, 1]) pc(M('wing' + s, () => P([[s * 60, -620], [s * 260, -760], [s * 300, -640], [s * 250, -560], [s * 200, -520], [s * 80, -520]], 500 + s)), '#ffffff', { alpha: 0.9 });
  }
  // legs
  for (const s of [-1, 1]) {
    c.save(); c.translate(s * 52, -335); c.rotate(st.pose === 'ghost' ? 0.1 * s * Math.sin(st.tq * 3) : 0);
    pc(M('leg', () => P(RR(-40, -10, 80, 305, 22), 501)), pal.trousers);
    pc(M('shoe' + s, () => P(E(s * 18, 300, 62, 28, 28), 502 + s)), pal.shoes);
    c.restore();
  }
  // torso and layers of clothing
  pc(M('torso', () => P([[-108, -320], [108, -320], [124, -640], [92, -672], [-92, -672], [-124, -640]], 510)), pal.shirt);
  pc(M('belt', () => P(R(-108, -350, 216, 30), 511, 0.8)), '#5a3d26');
  pc(M('collarL', () => P([[-48, -672], [0, -672], [-14, -628]], 512, 0.6)), '#fbf7ec', { shadow: [2, 3, 3] });
  pc(M('collarR', () => P([[48, -672], [0, -672], [14, -628]], 513, 0.6)), '#fbf7ec', { shadow: [2, 3, 3] });
  if (acc.has('jumpers')) {
    const cols = ['#c0392b', '#e5b23c', '#3d6fb6'];
    cols.forEach((col, i) => {
      const hem = -296 - i * 16, w = 132 + (2 - i) * 6 + i * 4;
      pc(M('jumper' + i, () => P([[-w + 6, hem], [w - 6, hem], [w + 8, -630], [70, -690], [-70, -690], [-w - 8, -630]], 520 + i, 2.2)), col);
      pc(M('hem' + i, () => P(R(-w + 4, hem - 24, 2 * w - 8, 24), 525 + i, 1.2)), shadeHex(col, -0.18), { shadow: [2, 3, 3] });
    });
    for (let k = 0; k < 4; k++) pc(M('knit' + k, () => P(R(-128, -560 + k * 60, 256, 14), 530 + k, 1.4)), '#5a86c8', { shadow: false, edge: false });
    pc(M('rollneck', () => P(RR(-66, -712, 132, 56, 22), 535, 1.5)), '#2f5c9e');
  }
  if (acc.has('blanket')) {
    pc(M('blanket', () => P([[-170, -690], [170, -690], [196, -220], [130, -190], [-130, -190], [-196, -220]], 540, 3)), '#8c6bb1');
    for (let k = 0; k < 5; k++) pc(M('tartV' + k, () => P(R(-150 + k * 70, -680, 16, 470), 541 + k, 1)), 'rgba(255,240,210,0.35)', { shadow: false, edge: false });
    for (let k = 0; k < 5; k++) pc(M('tartH' + k, () => P(R(-185, -630 + k * 95, 370, 14), 546 + k, 1)), 'rgba(60,30,90,0.35)', { shadow: false, edge: false });
  }
  // head
  c.save(); c.translate(0, -672); c.rotate(st.headTilt || 0); c.translate(0, 672);
  pc(M('neck', () => P(R(-26, -700, 52, 40), 550, 0.6)), pal.skin, { shadow: [2, 3, 3] });
  if (acc.has('scarf')) {
    pc(M('scarf', () => P(RR(-84, -712, 168, 52, 20), 551, 2)), '#e8c547');
    pc(M('scarfT', () => P([[30, -690], [86, -690], [96, -500], [40, -506]], 552, 2)), '#e8c547');
    for (let k = 0; k < 3; k++) pc(M('scarfS' + k, () => P(R(36 + k * 2, -620 + k * 40, 56, 12), 553 + k, 0.8)), '#d24a3a', { shadow: false });
  }
  for (const s of [-1, 1]) pc(M('ear' + s, () => P(E(s * 100, -790, 22, 32, 20), 560 + s, 0.8)), pal.skin);
  pc(M('head', () => P(E(0, -790, 102, 120, 50), 562, 1.2)), pal.skin);
  if (!acc.has('hat')) pc(M('hair', () => P([...E(0, -812, 112, 108, 30, Math.PI, Math.PI * 2), [112, -812], [84, -846], [52, -826], [20, -860], [-12, -834], [-46, -862], [-80, -838], [-112, -812]], 563, 1.2)), pal.hair);
  const ex = st.expr, blink = st.blink && ex !== 'dead' && ex !== 'sleep';
  for (const s of [-1, 1]) {
    const x = s * 40, y = -792;
    if (ex === 'dead') {
      c.save(); c.translate(x, y);
      for (const a of [0.78, -0.78]) { c.save(); c.rotate(a); pc(M('xeye', () => P(R(-22, -6, 44, 12), 570, 0.6)), '#1c1c1c', { shadow: [1, 2, 2] }); c.restore(); }
      c.restore();
    } else if (blink || ex === 'sleep') pc(M('lid' + s, () => P(RR(x - 22, y - 4, 44, 10, 5), 571 + s, 0.5)), '#1c1c1c', { shadow: [1, 2, 2] });
    else {
      const big = ex === 'shocked';
      pc(M('white' + big + s, () => P(E(x, y, big ? 27 : 23, big ? 32 : 27, 24), 573 + s, 0.6)), '#fbfbf6', { shadow: [2, 3, 3] });
      const lx = st.look || 0;
      pc(M('pupil' + big, () => P(E(0, 0, big ? 8 : 11, big ? 8 : 11, 14), 575, 0.4)), '#1c1c1c', { shadow: false, at: [x + lx, y + 4, 0, 1] });
      pc(M('glint', () => P(E(0, 0, 3.5, 3.5, 8), 576, 0.2)), '#ffffff', { shadow: false, edge: false, at: [x + lx + 4, y, 0, 1] });
    }
    // brows
    const br = { happy: [-842, 0.12], neutral: [-838, 0], worried: [-840, -0.32], shocked: [-858, 0.05], cold: [-840, -0.25], sick: [-836, -0.2], dead: [-838, 0], sleep: [-834, 0.05] }[ex] || [-838, 0];
    if (!acc.has('hat') || true) { c.save(); c.translate(x, br[0]); c.rotate(-s * br[1]); pc(M('brow', () => P(RR(-25, -6, 50, 12, 6), 578, 0.6)), pal.hair === '#e4ebf3' ? '#c9d3df' : '#3a2416', { shadow: [1, 2, 2] }); c.restore(); }
  }
  pc(M('nose', () => P(E(0, -762, 15, 19, 18), 580, 0.6)), pal.skinD, { shadow: [2, 3, 3] });
  for (const s of [-1, 1]) pc(M('cheek' + s, () => P(E(s * 64, -748, 19, 15, 16), 581 + s, 0.5)), pal.cheek, { shadow: false, edge: false });
  // mouth
  const mo = st.mouthOpen && ex !== 'dead';
  if (mo) pc(M('mOpen', () => P(E(0, -724, 30, 22, 24), 590, 0.6)), pal.mouth, { shadow: [1, 2, 2] });
  else if (ex === 'happy') pc(M('mHappy', () => P(E(0, -736, 44, 30, 24, 0, Math.PI), 591, 0.6)), pal.mouth, { shadow: [1, 2, 2] });
  else if (ex === 'shocked') pc(M('mO', () => P(E(0, -722, 20, 28, 24), 592, 0.6)), pal.mouth, { shadow: [1, 2, 2] });
  else if (ex === 'worried' || ex === 'sick') pc(M('mWorry', () => P([[-30, -722], [-15, -732], [0, -722], [15, -732], [30, -722], [30, -712], [15, -722], [0, -712], [-15, -722], [-30, -712]], 593, 0.4)), pal.mouth, { shadow: [1, 2, 2] });
  else if (ex === 'cold') {
    const chat = hash(f, 22) < 0.5 ? 4 : 0;
    pc(M('mCold', () => P(RR(-36, -742, 72, 34, 8), 594, 0.5)), pal.mouth, { shadow: [1, 2, 2] });
    pc(M('teethT', () => P(R(-32, -739, 64, 11), 595, 0.4)), '#fbfbf6', { shadow: false, at: [0, -chat / 2, 0, 1] });
    pc(M('teethB', () => P(R(-32, -723, 64, 10), 596, 0.4)), '#fbfbf6', { shadow: false, at: [0, chat / 2, 0, 1] });
  } else pc(M('mFlat', () => P(RR(-27, -728, 54, 10, 5), 597, 0.5)), pal.mouth, { shadow: [1, 2, 2] });
  if (acc.has('hat')) {
    pc(M('hat', () => P(E(0, -834, 112, 104, 30, Math.PI, Math.PI * 2), 600, 1.6)), '#d1453b');
    pc(M('hatS', () => P(R(-100, -890, 200, 16), 601, 1)), '#f3e6c4', { shadow: false });
    pc(M('brim', () => P(RR(-118, -862, 236, 50, 18), 602, 1.6)), '#f3e6c4');
    pc(M('bobble', () => P(E(0, -948, 34, 32, 22), 603, 3)), '#f3e6c4');
  }
  if (acc.has('icicles')) {
    for (let k = 0; k < 6; k++) pc(M('icicle' + k, () => P([[-100 + k * 40, -814], [-80 + k * 40, -814], [-90 + k * 40, -770 + (k % 3) * 14]], 610 + k, 0.6)), '#e8f4ff', { shadow: [1, 2, 2] });
    pc(M('noseIce', () => P([[-6, -746], [6, -746], [0, -716]], 617, 0.4)), '#e8f4ff', { shadow: [1, 2, 2] });
  }
  if (st.ghost) pc(M('halo', () => P([E(0, -960, 76, 20, 30), E(0, -960, 56, 11, 30).reverse()], 620, 0.8)), '#f3c623', { rule: 'evenodd', shadow: [2, 4, 6] });
  c.restore();
  // arms on top, split-pin puppet style
  for (const s of [-1, 1]) {
    const ua = s < 0 ? pose.lu : pose.ru, fa = s < 0 ? pose.lf : pose.rf;
    c.save(); c.translate(s * 112, -640); c.rotate(ua);
    pc(M('uarm', () => P(RR(-31, -24, 62, 182, 30), 630, 1)), sleeve);
    c.translate(0, 150); c.rotate(fa);
    pc(M('farm', () => P(RR(-28, -16, 56, 160, 27), 631, 1)), sleeve);
    if (acc.has('jumpers')) pc(M('cuff', () => P(R(-29, 120, 58, 22), 632, 0.8)), '#2f5c9e', { shadow: [1, 2, 2] });
    pc(M('hand', () => P(E(0, 165, 34, 34, 22), 633, 0.8)), acc.has('hat') && !st.ghost ? '#d1453b' : pal.skin);
    c.restore();
  }
  c.restore();
}
function shadeHex(hex, amt) { const n = parseInt(hex.slice(1), 16); const f = v => Math.round(clamp(v + amt * 255, 0, 255)); return `rgb(${f(n >> 16)},${f(n >> 8 & 255)},${f(n & 255)})`; }


// ---------- layer cache ----------
let cache = { key: null, layers: [] };
function ensureCache(S, sceneName, v) {
  const key = sceneName + '|' + v.key;
  if (cache.key === key) return;
  const tint = S.tint ? S.tint(v) : null;
  cache = { key, layers: S.layers.map((L, li) => {
    if (L.dyn) return null;
    const sc = L.d < 0.5 ? 1 : 1.25, cnv = canvas(Math.ceil(WW * sc), Math.ceil(WH * sc)), c = cnv.getContext('2d');
    c.setTransform(sc, 0, 0, sc, -X0 * sc, -Y0 * sc); c.__sh = [5 * sc, 8 * sc, 10 * sc];
    L.draw(c, v);
    if (tint && !L.noTint) { c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-atop'; c.fillStyle = tint; c.fillRect(0, 0, cnv.width, cnv.height); }
    return cnv;
  }) };
}

// ---------- captions (torn paper strips) and labels (ransom-note letters) ----------
const groups = [];
timeline.beats.forEach(b => {
  let cur = null;
  b.words.forEach(w => {
    if (!cur || cur.words.length >= 3 || cur.speaker !== w.speaker || cur.chars + w.w.length > 13) { cur = { words: [], speaker: w.speaker, chars: 0, s: w.s }; groups.push(cur); }
    cur.words.push(w.w); cur.chars += w.w.length + 1; cur.e = w.e;
    if (/[.,!?;:]$/.test(w.w)) cur = null;
  });
});
function captionAt(t) {
  for (let i = 0; i < groups.length; i++) { const g = groups[i], n = groups[i + 1]; if (t >= g.s - 0.04 && t < Math.min(n ? n.s : Infinity, g.e + 0.35)) return [g, i]; }
  return [null, -1];
}
function drawCaption(c, g, gi, t) {
  const text = g.words.join(' ').toUpperCase().replace(/[,;:]$/, '');
  const font = '400 96px "Permanent Marker"'; c.font = font;
  let lines = [text];
  if (c.measureText(text).width > 880 && g.words.length > 1) { const h = Math.ceil(g.words.length / 2); lines = [g.words.slice(0, h).join(' ').toUpperCase(), g.words.slice(h).join(' ').toUpperCase()]; }
  const tw = Math.max(...lines.map(l => c.measureText(l).width)), w = tw + 80, h = 40 + lines.length * 108;
  const r = rng(gi * 31 + 5), rot = (r() - 0.5) * 0.08, k = Math.floor((t - g.s) * SF);
  const sc = k < 1 ? 1.1 : 1;
  c.setTransform(sc, 0, 0, sc, 540, 1330); c.rotate(rot);
  const pts = [];
  for (let x = -w / 2; x <= w / 2; x += 24) pts.push([x, -h / 2 + (r() - 0.5) * 3]);
  for (let y = -h / 2; y <= h / 2; y += 12) pts.push([w / 2 + (r() - 0.5) * 12, y]);
  for (let x = w / 2; x >= -w / 2; x -= 24) pts.push([x, h / 2 + (r() - 0.5) * 3]);
  for (let y = h / 2; y >= -h / 2; y -= 12) pts.push([-w / 2 + (r() - 0.5) * 12, y]);
  c.__sh = [6, 10, 14];
  _piece(c, P(pts, gi + 700, 0.8), g.speaker === 'gary' ? '#ffe066' : '#fbf7ec');
  // a strip of tape
  c.save(); c.translate(-w / 2 + 30, -h / 2 + 6); c.rotate(-0.5); c.fillStyle = 'rgba(240,235,215,0.75)'; c.fillRect(-40, -16, 80, 32); c.restore();
  lines.forEach((l, i) => ink(c, l, 0, -((lines.length - 1) * 108) / 2 + i * 108 + 6, font, '#1b1b1b'));
  c.setTransform(1, 0, 0, 1, 0, 0);
}
const FONTS = ['400 Spx "Permanent Marker"', '400 Spx Anton', '700 Spx Fredoka', '400 Spx "Special Elite"'];
const PAPERS = ['#fbf7ec', '#f6e27a', '#f2b5c4', '#a9d6e5', '#e3ddcf', '#ffffff', '#c9e4a7', '#2b2b2b'];
const labelCache = new Map();
function layoutLabel(label, size, maxW) {
  const key = label + size; if (labelCache.has(key)) return labelCache.get(key);
  const r = rng(label.length * 97 + label.charCodeAt(0));
  const words = []; label.replace(/\*([^*]+)\*|(\S+)/g, (m, hot, plain) => { (hot || plain).split(' ').forEach(w => words.push({ w, hot: !!hot })); });
  const lines = [[]]; let lw = 0; const gap = size * 0.32;
  for (const wd of words) {
    const letters = [...wd.w].map(ch => {
      const fs = Math.round(size * (0.88 + r() * 0.24)), font = FONTS[Math.floor(r() * FONTS.length)].replace('S', fs);
      ctx.font = font; const mw = ctx.measureText(ch).width;
      const paper = wd.hot ? '#d7263d' : PAPERS[Math.floor(r() * PAPERS.length)];
      return { ch, font, w: Math.max(mw + size * 0.26, size * 0.55), h: size * 1.16, rot: (r() - 0.5) * 0.24, dy: (r() - 0.5) * 12, paper, color: wd.hot || paper === '#2b2b2b' ? '#ffffff' : '#1b1b1b', seed: Math.floor(r() * 1e6) };
    });
    const ww = letters.reduce((a, l) => a + l.w + 4, 0);
    if (lw + ww > maxW && lines[lines.length - 1].length) { lines.push([]); lw = 0; }
    lines[lines.length - 1].push({ letters, ww }); lw += ww + gap;
  }
  const out = { lines, gap, size }; labelCache.set(key, out); return out;
}
function drawLabel(c, b, lt, t) {
  if (!b.label) return;
  const hook = !!b.hook, L = layoutLabel(b.label, hook ? 124 : 150, 960);
  const shrink = hook ? 0 : ease((lt - 1.1) / 0.35);
  const n = Math.floor(lt * SF) * 3 + 3;                    // three more letters per stop-motion frame
  const cy0 = hook ? 280 : 330, sc = lerp(1, 0.6, shrink), ty = lerp(cy0, 210, shrink);
  let idx = 0;
  L.lines.forEach((line, li) => {
    const lw = line.reduce((a, w) => a + w.ww, 0) + L.gap * (line.length - 1);
    let x = -lw / 2; const y = (li - (L.lines.length - 1) / 2) * L.size * 1.28;
    line.forEach(wd => {
      wd.letters.forEach(l => {
        if (idx++ >= n) return;
        const wob = hook ? 0.03 * Math.sin(Math.floor(t * SF) * 1.7 + idx) : 0;
        c.setTransform(sc, 0, 0, sc, 540, ty); c.translate(x + l.w / 2, y + l.dy); c.rotate(l.rot + wob);
        c.__sh = [5, 8, 10];
        _piece(c, M('lab' + l.seed + Math.round(l.w), () => P(R(-l.w / 2, -l.h / 2, l.w, l.h), l.seed % 1000, 1.6)), l.paper);
        ink(c, l.ch, 0, 4, l.font, l.color);
        x += l.w + 4;
      });
      x += L.gap;
    });
  });
  c.setTransform(1, 0, 0, 1, 0, 0);
}

// ---------- overlays ----------
const frostCache = {};
function frost(level) {
  if (frostCache[level]) return frostCache[level];
  const cnv = canvas(W, H), c = cnv.getContext('2d'), r = rng(level * 7 + 1); c.__sh = null;
  const n = level === 2 ? 70 : 38;
  for (let i = 0; i < n; i++) {
    const side = i % 4, u = r();
    const x = side === 0 ? 0 : side === 1 ? W : u * W, y = side === 2 ? 0 : side === 3 ? H : u * H;
    const s = (60 + r() * 130) * (level === 2 ? 1.5 : 1);
    _piece(c, P(STAR(x, y, s, s * 0.6, 7, r() * 6), 900 + i, 6, 18), `rgba(236,246,255,${0.55 + r() * 0.3})`, { shadow: false, edge: false });
  }
  return (frostCache[level] = cnv);
}
const VIG = (() => { const cnv = canvas(W, H), c = cnv.getContext('2d'); const g = c.createRadialGradient(W / 2, H * 0.45, H * 0.3, W / 2, H * 0.45, H * 0.75); g.addColorStop(0, 'rgba(40,22,5,0)'); g.addColorStop(1, 'rgba(40,22,5,0.42)'); c.fillStyle = g; c.fillRect(0, 0, W, H); return cnv; })();
const charCanvas = canvas(W, H), cc = charCanvas.getContext('2d');

// ---------- cameras (target point and zoom; puppet-relative where it matters) ----------
function camFor(name, G, k) {
  const hy = G.y - 790 * G.s;
  const C = {
    wide: [[540, 960, 1.0], [540, 960, 1.04]],
    push: [[540, 960, 1.0], [G.x, G.y - 520 * G.s, 1.26]],
    face: [[G.x + 40, hy + 160, 1.55], [G.x, hy + 150, 1.7]],
    table: [[G.x + 70, G.y - 470 * G.s, 1.28], [G.x + 10, G.y - 500 * G.s, 1.36]],
    pan: [[400, 960, 1.1], [680, 960, 1.12]],
    orbit: [[330, 960, 1.06], [760, 980, 1.12]],
    low: [[540, 1080, 1.04], [520, 1040, 1.1]],
  }[name] || [[540, 960, 1], [540, 960, 1.05]];
  return { x: lerp(C[0][0], C[1][0], k), y: lerp(C[0][1], C[1][1], k), z: lerp(C[0][2], C[1][2], k) };
}

// ---------- main ----------
const beats = script.beats.map((b, i) => ({ ...b, ...timeline.beats[i] }));
const sunoutBeat = beats.findIndex(b => b.fx === 'sunout');
const SNOW = Array.from({ length: 90 }, (_, i) => { const r = rng(i + 1000); return { x: r() * 1300 - 110, y: r() * 2200, v: 120 + r() * 160, s: 6 + r() * 12, d: 1.05 + r() * 0.35, w: r() * 6 }; });

window.DURATION = timeline.duration;
window.renderFrame = (t) => {
  const fi = Math.floor(t * SF), tq = fi / SF; jitterFrame = fi;
  let bi = beats.findIndex(b => t < b.end); if (bi < 0) bi = beats.length - 1;
  const b = beats[bi], lt = Math.max(0, tq - b.start), dur = b.end - b.start, p = clamp(lt / dur);
  const S = SCENES[b.scene] || SCENES.garden;
  // lighting variant: after the sun goes out everything outside is dark
  const ctxB = {};
  let dark = sunoutBeat >= 0 && bi > sunoutBeat;
  if (bi === sunoutBeat) {
    const t0 = b.start + 0.25, pull = clamp((tq - t0) / 0.5), sw = t0 + 0.55;
    dark = tq >= sw && !(tq < sw + 0.25 && fi % 2 === 0);      // two-frame flicker as the lights go
    ctxB.sunout = { pull: Math.floor(pull * 6) / 6 };
  }
  const v = { dark, mood: b.mood || null, key: (dark ? 'dark' : 'day') + (b.mood || '') };
  ensureCache(S, b.scene, v);

  const G = S.gary(tq, b);
  cam = camFor(b.camera, G, ease(Math.floor(p * dur * SF) / Math.max(1, dur * SF)));
  shake = b.deathAt != null && t >= b.deathAt ? 30 * Math.exp(-(t - b.deathAt) * 5) : 0;

  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  const drawLayer = (L, li) => {
    xform(ctx, L.d, li);
    if (L.dyn) { ctx.__sh = [6, 9, 12]; L.draw(ctx, v, tq, b, ctxB); ctx.__sh = null; }
    else ctx.drawImage(cache.layers[li], X0, Y0, WW, WH);
  };
  S.layers.forEach((L, li) => { if (L.d <= 1) drawLayer(L, li); });

  // the puppet
  const st = { expr: b.gary?.expr || 'neutral', acc: b.gary?.acc || [], pose: b.gary?.pose, tq, frame: fi, ghost: b.gary?.pose === 'ghost' };
  st.cold = st.expr === 'cold';
  st.blink = (tq % 3.3) < 0.15;
  st.mouthOpen = !!b.words.find(w => w.speaker === 'gary' && t >= w.s && t <= w.e) && fi % 2 === 0;
  st.look = st.pose === 'point' ? 6 : 0;
  if (st.pose === 'point') st.headTilt = -0.06;
  if (bi === sunoutBeat && !dark && ctxB.sunout.pull === 0) { st.expr = 'neutral'; st.pose = undefined; }
  if (b.deathAt != null) {
    const ls = b.deathAt - 1.7;                                 // lie down for a nap, then never wake up
    if (tq >= ls) { st.lie = Math.floor(ease((tq - ls) / 0.9) * 6) / 6; st.expr = 'sleep'; st.pose = undefined; }
    if (tq >= b.deathAt) st.expr = 'dead';
  }
  cc.setTransform(1, 0, 0, 1, 0, 0); cc.clearRect(0, 0, W, H);
  xform(cc, 1, 77);
  cc.translate(G.x, G.y); cc.scale(G.s, G.s);
  cc.rotate((hash(fi, 23) - 0.5) * 0.012);
  cc.__sh = [6 * G.s + 2, 9 * G.s + 2, 10];
  if (st.ghost) cc.globalAlpha = 0.9;
  puppet(cc, st);
  if (st.lie && st.expr === 'sleep') for (let i = 0; i < 3; i++) { const ph = (tq * 0.8 + i / 3) % 1; cc.save(); cc.globalAlpha = Math.sin(ph * Math.PI); ink(cc, "z", 160 + ph * 120 + i * 30, -300 - ph * 260, `400 ${60 + i * 20}px "Permanent Marker"`, '#f7f3e6'); cc.restore(); }
  cc.globalAlpha = 1;
  const ct = S.charTint ? S.charTint(v) : null;
  if (ct) { cc.setTransform(1, 0, 0, 1, 0, 0); cc.globalCompositeOperation = 'source-atop'; cc.fillStyle = ct; cc.fillRect(0, 0, W, H); cc.globalCompositeOperation = 'source-over'; }
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(charCanvas, 0, 0);

  S.layers.forEach((L, li) => { if (L.d > 1) drawLayer(L, li); });
  if (S.glows) { xform(ctx, 0.8, 50); S.glows(ctx, v, tq, b); }
  if (b.fx === 'snow') {
    for (const f of SNOW) {
      xform(ctx, f.d, 60);
      const y = ((f.y + tq * f.v) % 2300) - 200, x = f.x + 30 * Math.sin(tq * 1.3 + f.w);
      piece(ctx, M('flake', () => P(E(0, 0, 10, 10, 10), 950, 1.2)), '#ffffff', { shadow: false, edge: false, alpha: 0.95, at: [x, y, 0, f.s / 10] });
    }
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (b.mood === 'cold' || b.mood === 'frozen') {
    let lvl = b.mood === 'frozen' ? 2 : 1;
    ctx.globalAlpha = 0.8; ctx.drawImage(frost(lvl), 0, 0); ctx.globalAlpha = 1;
  }
  ctx.drawImage(VIG, 0, 0);
  // a white paper "flash" on each cut, two stop-motion frames long
  if (bi > 0 && t - b.start < 2 / SF) { ctx.fillStyle = 'rgba(251,247,236,0.35)'; ctx.fillRect(0, 0, W, H); }

  drawLabel(ctx, b, lt, t);
  const [g, gi] = captionAt(t);
  if (g) drawCaption(ctx, g, gi, t);
};
// warm every scene/lighting combination once so first frames don't stall
for (const [i, b] of beats.entries()) ensureCache(SCENES[b.scene] || SCENES.garden, b.scene, { dark: sunoutBeat >= 0 && i >= sunoutBeat, mood: b.mood || null, key: ((sunoutBeat >= 0 && i >= sunoutBeat) ? 'dark' : 'day') + (b.mood || '') });
window.READY = true;
