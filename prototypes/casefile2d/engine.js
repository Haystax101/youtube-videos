// "Case File" 2D look for long-form dark stories (16:9, 1920x1080).
// Flat drawn cartoon: round pale heads, small stubby bodies, side-on flat sets, paper inserts
// (corkboard, documents, maps, calendars), date tags and bold keyword captions, all under a film
// grain / dust / vignette pass. Explainer-cartoon genre (as on Both Wars), but our own characters,
// palette and props, and darker: night exteriors, screen glow, cold shadows.
// Everything is a pure function of time t, so any frame can be rendered in any order.

export const W = 1920, H = 1080;
export const INK = '#26211f', SKIN = '#f6f1e7', SKIN_SH = '#ddd3c3', CHEEK = 'rgba(232,120,120,0.35)';
export const YEL = '#f3c34a', RED = '#d9483b', PAPER = '#efe6d2', PAPER_SH = '#d9ccb0';

// ---------- small helpers ----------
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, k) => a + (b - a) * k;
export const ease = k => { k = clamp(k); return k * k * (3 - 2 * k); };
export const easeOut = k => 1 - Math.pow(1 - clamp(k), 3);
export const easeInOut = k => { k = clamp(k); return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
export const pop = k => { k = clamp(k); const c = 1.70158 * 1.3; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
export function hash(n) { n = Math.sin(n * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); }
export function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; }; }

export function rr(ctx, x, y, w, h, r) {
  r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
export function fillStroke(ctx, fill, stroke = INK, lw = 3) {
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.stroke(); }
}
export function shade(hex, f) {   // f<1 darker, f>1 lighter
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  if (f < 1) { r *= f; g *= f; b *= f; } else { const k = f - 1; r += (255 - r) * k; g += (255 - g) * k; b += (255 - b) * k; }
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}
export function mix(a, b, k) {
  const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16);
  const c = s => Math.round(lerp((A >> s) & 255, (B >> s) & 255, k));
  return `rgb(${c(16)},${c(8)},${c(0)})`;
}
export function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

// cache static layers: key -> canvas
const CACHE = new Map();
export function cached(key, w, h, draw) {
  let c = CACHE.get(key); if (c) return c;
  c = canvas(w, h); draw(c.getContext('2d'), w, h); CACHE.set(key, c); return c;
}

// ---------- textures ----------
export function noiseTile(seed, size = 512, alpha = 1, grain = 1) {
  return cached('noise' + seed + size + grain, size, size, (g) => {
    const im = g.createImageData(size, size), r = rng(seed * 9973 + 7);
    for (let i = 0; i < im.data.length; i += 4) { const v = 128 + (r() - .5) * 255 * grain; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255 * alpha; }
    g.putImageData(im, 0, 0);
  });
}
// soft blotchy paper texture (multiply)
export function paperTex(seed = 1, w = 960, h = 540) {
  return cached('paper' + seed, w, h, (g) => {
    g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); const r = rng(seed * 31 + 5);
    for (let i = 0; i < 260; i++) {
      const x = r() * w, y = r() * h, rad = 20 + r() * 120, a = 0.025 + r() * 0.05;
      const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, `rgba(120,100,70,${a})`); gr.addColorStop(1, 'rgba(120,100,70,0)');
      g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    for (let i = 0; i < 4000; i++) { g.fillStyle = `rgba(90,70,50,${0.04 + r() * 0.08})`; g.fillRect(r() * w, r() * h, 1 + r() * 1.5, 1 + r() * 1.5); }
  });
}

// ---------- post pass: grade, paper, grain, dust, scratches, vignette ----------
export function post(ctx, t, opt = {}) {
  const fr = Math.floor(t * 30), dark = opt.dark ?? 0.0;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  // paper blotches (multiply)
  ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.55; ctx.drawImage(paperTex(1), 0, 0, W, H);
  // cool-shadow / warm-light grade
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'soft-light';
  const gg = ctx.createLinearGradient(0, 0, 0, H); gg.addColorStop(0, 'rgba(255,214,160,0.18)'); gg.addColorStop(1, 'rgba(40,60,90,0.22)');
  ctx.fillStyle = gg; ctx.fillRect(0, 0, W, H);
  // grain (overlay), jittered per frame
  ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.10;
  const nt = noiseTile(fr % 6, 512, 1, 1), ox = -Math.floor(hash(fr) * 512), oy = -Math.floor(hash(fr + 99) * 512);
  for (let x = ox; x < W; x += 512) for (let y = oy; y < H; y += 512) ctx.drawImage(nt, x, y);
  // dust specks and hairs (deterministic, drifting slowly)
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  for (let i = 0; i < 46; i++) {
    const life = 2 + hash(i * 3.1) * 4, ph = (t + hash(i) * 10) / life, k = ph - Math.floor(ph), id = Math.floor(ph);
    const x = hash(i * 7 + id * 13) * W + k * 40 * (hash(i + id) - .5), y = hash(i * 11 + id * 5) * H - k * 30;
    const a = Math.sin(k * Math.PI) * (0.25 + hash(i * 5 + id) * 0.4), s = 1.2 + hash(i * 17 + id) * 2.6;
    ctx.fillStyle = hash(i * 23 + id) > .3 ? `rgba(255,248,230,${a * .7})` : `rgba(30,25,20,${a * .6})`;
    ctx.beginPath(); ctx.arc(x, y, s, 0, 7); ctx.fill();
  }
  // occasional film blip: a thin scratch for 2 frames
  if (hash(Math.floor(t * 15)) > 0.93) { const x = hash(Math.floor(t * 15) + 3) * W; ctx.fillStyle = 'rgba(240,235,220,0.16)'; ctx.fillRect(x, 0, 1.5, H); }
  // vignette
  const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.38, W / 2, H / 2, H * 1.02);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, `rgba(12,8,6,${0.62 + dark * 0.25})`);
  ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  if (dark) { ctx.fillStyle = `rgba(10,14,24,${dark * 0.35})`; ctx.fillRect(0, 0, W, H); }
  ctx.restore();
}

// ---------- text ----------
export function textOutlined(ctx, s, x, y, { size = 64, fill = YEL, stroke = INK, lw = 10, font = 'Lilita One', align = 'center', shadow = true, letter = 1 } = {}) {
  ctx.save(); ctx.font = `${size}px "${font}"`; ctx.textAlign = align; ctx.textBaseline = 'middle';
  if (ctx.letterSpacing !== undefined) ctx.letterSpacing = letter + 'px';
  ctx.lineJoin = 'round'; ctx.miterLimit = 2;
  if (shadow) { ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillText(s, x + 4, y + 6); }
  ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.strokeText(s, x, y); ctx.fillStyle = fill; ctx.fillText(s, x, y);
  ctx.restore();
}
// keyword caption that pops in, holds, and fades out. k = local seconds since start, dur = seconds shown
export function caption(ctx, s, x, y, k, dur, opt = {}) {
  if (k < 0 || k > dur) return;
  const a = clamp(k / 0.12) * clamp((dur - k) / 0.2), sc = k < 0.35 ? pop(k / 0.35) : 1;
  ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.scale(sc, sc);
  const lines = s.split('\n');
  lines.forEach((ln, i) => textOutlined(ctx, ln, 0, (i - (lines.length - 1) / 2) * (opt.size || 64) * 1.05, { ...opt, fill: opt.fill || YEL }));
  ctx.restore();
}
// date / place tag (top left) - typed paper label with a red stamp edge
export function dateTag(ctx, s, k = 1) {
  if (k <= 0) return;
  ctx.save(); ctx.globalAlpha = clamp(k / 0.25); ctx.font = '34px "Nunito"'; ctx.font = '900 32px "Nunito"';
  const w = ctx.measureText(s).width + 52, x = 44 + (1 - easeOut(k / 0.35)) * -40, y = 40;
  ctx.fillStyle = 'rgba(0,0,0,.35)'; rr(ctx, x + 5, y + 6, w, 58, 6); ctx.fill();
  rr(ctx, x, y, w, 58, 6); fillStroke(ctx, PAPER, INK, 3);
  ctx.fillStyle = RED; rr(ctx, x, y, 12, 58, 4); ctx.fill();
  ctx.fillStyle = INK; ctx.textBaseline = 'middle'; ctx.fillText(s, x + 30, y + 31);
  ctx.restore();
}
// name card (lower left)
export function nameCard(ctx, name, role, k) {
  if (k <= 0) return;
  ctx.save(); const a = clamp(k / 0.25); ctx.globalAlpha = a;
  ctx.font = '900 46px "Nunito"'; const w1 = ctx.measureText(name).width; ctx.font = '800 26px "Nunito"'; const w2 = ctx.measureText(role).width;
  const w = Math.max(w1, w2) + 70, x = 56 - (1 - easeOut(k / 0.4)) * 60, y = H - 200;
  ctx.fillStyle = 'rgba(0,0,0,.35)'; rr(ctx, x + 6, y + 7, w, 118, 8); ctx.fill();
  rr(ctx, x, y, w, 118, 8); fillStroke(ctx, PAPER, INK, 3);
  ctx.fillStyle = RED; ctx.fillRect(x + 3, y + 3, 14, 112);
  ctx.fillStyle = INK; ctx.textBaseline = 'middle'; ctx.font = '900 46px "Nunito"'; ctx.fillText(name, x + 36, y + 44);
  ctx.fillStyle = '#6b5a4a'; ctx.font = '800 26px "Nunito"'; ctx.fillText(role, x + 38, y + 88);
  ctx.restore();
}

// ---------- characters ----------
// c: { x, y (feet), s, face: 1 right / -1 left / 0 front, hair, hairColor, outfit, color, glasses, cap,
//      beard, walk (steps, fractional), arms: [l, r] radians (0 = down, + = forward/up), talk (bool),
//      mood: 'neutral'|'worried'|'angry'|'sad'|'smug'|'shock', eyes: 'open'|'closed'|'down', id (blink seed),
//      glow: {color, side} screen light on one side }
export function drawChar(ctx, c, t) {
  const s = c.s ?? 1, f = c.face ?? 0, col = c.color || '#3b4a63';
  ctx.save(); ctx.translate(c.x, c.y); ctx.scale(s, s);
  if (window.__chars && !c.qaSkip) {   // 2D overlap check (tools/check_overlap2d.cjs): head circle + body box in screen px
    const m = ctx.getTransform(), P = (x, y) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f], z = Math.hypot(m.a, m.b);
    window.__chars.push({ name: c.name || ('char' + (c.id || '')), head: [...P(f * 4, -236), 60 * z], body: [...P(-44, -184), ...P(44, -58)] });
  }
  const ph = (c.walk || 0) * Math.PI, walking = !!c.walk, bob = walking ? Math.abs(Math.sin(ph)) * 6 : Math.sin(t * 1.7 + (c.id || 0)) * 1.2;
  // ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.beginPath(); ctx.ellipse(0, 2, 58, 10, 0, 0, 7); ctx.fill();
  // legs
  const leg = (dx, ang) => {
    ctx.save(); ctx.translate(dx, -62); ctx.rotate(ang);
    rr(ctx, -9, 0, 18, 60, 8); fillStroke(ctx, c.legs || '#2c2b30', INK, 3);
    ctx.beginPath(); ctx.ellipse(f * 5, 60, 15, 8, 0, 0, 7); fillStroke(ctx, c.shoes || '#1d1a19', INK, 3);
    ctx.restore();
  };
  const sw = walking ? Math.sin(ph) * 0.38 : 0;
  leg(-15, sw); leg(15, -sw);
  ctx.translate(0, -bob);
  // arms behind body when they hang
  const arm = (side, ang, front) => {
    ctx.save(); ctx.translate(side * 38, -160); ctx.rotate((f === 0 ? -side * ang : -f * ang) - side * 0.1);
    rr(ctx, -10, -4, 20, 76, 10); fillStroke(ctx, c.sleeve || col, INK, 3);
    ctx.beginPath(); ctx.arc(0, 76, 11, 0, 7); fillStroke(ctx, SKIN, INK, 3);
    if (c.hold && side === (c.holdSide || 1)) c.hold(ctx, t);
    ctx.restore();
  };
  const aL = c.arms ? c.arms[0] : (walking ? -sw * .8 : 0.06), aR = c.arms ? c.arms[1] : (walking ? sw * .8 : 0.06);
  arm(-1, aL); arm(1, aR);
  // body: rounded trapezoid
  ctx.beginPath(); ctx.moveTo(-44, -58); ctx.lineTo(44, -58); ctx.quadraticCurveTo(48, -58, 47, -64);
  ctx.lineTo(40, -166); ctx.quadraticCurveTo(38, -182, 22, -184); ctx.lineTo(-22, -184); ctx.quadraticCurveTo(-38, -182, -40, -166);
  ctx.lineTo(-47, -64); ctx.quadraticCurveTo(-48, -58, -44, -58); ctx.closePath();
  fillStroke(ctx, col, INK, 3.5);
  // body shading (right side)
  ctx.save(); ctx.clip(); ctx.fillStyle = 'rgba(0,0,0,0.13)'; ctx.fillRect(14, -190, 40, 140);
  if (c.glow) { const gx = c.glow.side * 50; const gr = ctx.createRadialGradient(gx, -120, 5, gx, -120, 110); gr.addColorStop(0, c.glow.color); gr.addColorStop(1, 'rgba(0,0,0,0)'); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = gr; ctx.fillRect(-60, -200, 120, 150); }
  ctx.restore();
  outfit(ctx, c, f);
  // head
  const hx = f * 4, hy = -236;
  ctx.save(); ctx.translate(hx, hy); if (c.tilt) ctx.rotate(c.tilt);
  if (c.hairBack) { ctx.fillStyle = c.hairColor || '#3a2a20'; ctx.beginPath(); ctx.ellipse(0, 6, 64, 66, 0, 0, 7); fillStroke(ctx, c.hairColor || '#3a2a20', INK, 3.5); }
  ctx.beginPath(); ctx.arc(0, 0, 60, 0, 7);
  const hg = ctx.createRadialGradient(-18, -22, 8, 0, 0, 64); hg.addColorStop(0, '#fffdf8'); hg.addColorStop(0.7, SKIN); hg.addColorStop(1, SKIN_SH);
  fillStroke(ctx, hg, INK, 3.5);
  if (c.glow) { ctx.save(); ctx.beginPath(); ctx.arc(0, 0, 58, 0, 7); ctx.clip(); const gx = c.glow.side * 60; const gr = ctx.createRadialGradient(gx, 0, 4, gx, 0, 95); gr.addColorStop(0, c.glow.color); gr.addColorStop(1, 'rgba(0,0,0,0)'); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = gr; ctx.fillRect(-60, -60, 120, 120); ctx.restore(); }
  face(ctx, c, f, t);
  hair(ctx, c, f);
  ctx.restore();
  ctx.restore();
}

function outfit(ctx, c, f) {
  const o = c.outfit || 'tee', col = c.color || '#3b4a63';
  ctx.save();
  if (o === 'suit') {
    ctx.fillStyle = c.shirt || '#efe9dd'; ctx.beginPath(); ctx.moveTo(-16, -183); ctx.lineTo(0, -140); ctx.lineTo(16, -183); ctx.closePath(); ctx.fill();
    ctx.fillStyle = c.tie || '#8c2f2a'; ctx.beginPath(); ctx.moveTo(-5, -176); ctx.lineTo(5, -176); ctx.lineTo(7, -132); ctx.lineTo(0, -122); ctx.lineTo(-7, -132); ctx.closePath(); fillStroke(ctx, c.tie || '#8c2f2a', INK, 2);
    ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-18, -183); ctx.lineTo(-4, -120); ctx.moveTo(18, -183); ctx.lineTo(4, -120); ctx.stroke();
    ctx.fillStyle = INK; [-100, -80].forEach(y => { ctx.beginPath(); ctx.arc(0, y, 3, 0, 7); ctx.fill(); });
  } else if (o === 'hoodie') {
    ctx.fillStyle = shade(col, 0.8); ctx.beginPath(); ctx.ellipse(0, -182, 34, 12, 0, 0, 7); fillStroke(ctx, shade(col, .8), INK, 2.5);
    ctx.strokeStyle = '#eee'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-9, -175); ctx.lineTo(-11, -140); ctx.moveTo(9, -175); ctx.lineTo(11, -140); ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = 2.5; rr(ctx, -26, -112, 52, 28, 8); ctx.stroke();
  } else if (o === 'police') {
    ctx.fillStyle = '#e8d27a'; ctx.beginPath(); ctx.arc(-22, -150, 6, 0, 7); fillStroke(ctx, '#e8d27a', INK, 2);
    ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(0, -184); ctx.lineTo(0, -66); ctx.stroke();
    ctx.fillStyle = '#1e1c1c'; ctx.fillRect(-46, -84, 92, 12);
  } else if (o === 'agent') {   // windbreaker with yellow letters on the back is unseen; front shows a badge lanyard
    ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(0, -184); ctx.lineTo(0, -66); ctx.stroke();
    ctx.strokeStyle = '#c9b46a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-14, -182); ctx.lineTo(0, -128); ctx.lineTo(14, -182); ctx.stroke();
    rr(ctx, -12, -132, 24, 30, 3); fillStroke(ctx, '#e9e2cf', INK, 2);
  } else if (o === 'tee') {
    ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(0, -186, 18, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  } else if (o === 'shirt') {
    ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-16, -183); ctx.lineTo(0, -166); ctx.lineTo(16, -183); ctx.moveTo(0, -166); ctx.lineTo(0, -66); ctx.stroke();
    ctx.fillStyle = INK; [-140, -112, -86].forEach(y => { ctx.beginPath(); ctx.arc(5, y, 2.6, 0, 7); ctx.fill(); });
  }
  ctx.restore();
}

function face(ctx, c, f, t) {
  const m = c.mood || 'neutral', ex = f * 10 + (c.lookX || 0), ey = (c.lookY || 0);
  // blink: deterministic, every ~3-5 s for 0.12 s
  const bp = (t + hash(c.id || 1) * 5) % (3.2 + hash((c.id || 1) * 3) * 2);
  const closed = c.eyes === 'closed' || bp < 0.12;
  // cheeks
  ctx.fillStyle = CHEEK; [-30, 30].forEach(x => { ctx.beginPath(); ctx.ellipse(x + f * 6, 16, 12, 8, 0, 0, 7); ctx.fill(); });
  // eyes
  ctx.fillStyle = INK; ctx.strokeStyle = INK; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
  [-18, 18].forEach(x => {
    const X = x + ex, Y = -4 + ey;
    if (closed) { ctx.beginPath(); ctx.moveTo(X - 7, Y + 1); ctx.quadraticCurveTo(X, Y + 5, X + 7, Y + 1); ctx.stroke(); }
    else if (c.eyes === 'down' || m === 'sad') { ctx.beginPath(); ctx.ellipse(X, Y + 2, 5.5, 4, 0, 0, 7); ctx.fill(); }
    else if (m === 'shock') { ctx.beginPath(); ctx.arc(X, Y, 7.5, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(X + 2, Y - 2, 2.2, 0, 7); ctx.fill(); ctx.fillStyle = INK; }
    else { ctx.beginPath(); ctx.ellipse(X, Y, 5.5, 7.5, 0, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.arc(X + 1.8, Y - 2.5, 1.7, 0, 7); ctx.fill(); ctx.fillStyle = INK; }
  });
  // brows
  const br = { neutral: [0, 0], worried: [-0.35, 3], angry: [0.4, 2], sad: [-0.3, 4], smug: [0.15, -2], shock: [-0.1, -8] }[m] || [0, 0];
  ctx.lineWidth = 4;
  [-1, 1].forEach(sd => { const X = sd * 18 + ex, Y = -22 + br[1] + ey, inner = X - sd * 9, outer = X + sd * 9;
    ctx.beginPath(); ctx.moveTo(outer, Y - br[0] * 9); ctx.lineTo(inner, Y + br[0] * 9); ctx.stroke(); });
  // mouth (moves while talking)
  const mx = f * 10, my = 30;
  if (c.talk) {
    const o = Math.abs(Math.sin(t * 15 + (c.id || 0))) * (0.5 + 0.5 * Math.abs(Math.sin(t * 6.3))), h = 2 + o * 9;
    ctx.beginPath(); ctx.ellipse(mx, my, 7, h, 0, 0, 7); fillStroke(ctx, '#6b2c2a', INK, 2.5);
  } else if (m === 'shock') { ctx.beginPath(); ctx.ellipse(mx, my + 2, 6, 8, 0, 0, 7); fillStroke(ctx, '#6b2c2a', INK, 2.5); }
  else {
    ctx.lineWidth = 3; ctx.beginPath();
    if (m === 'smug') { ctx.moveTo(mx - 9, my); ctx.quadraticCurveTo(mx + 2, my + 6, mx + 10, my - 3); }
    else if (m === 'sad' || m === 'worried') { ctx.moveTo(mx - 8, my + 3); ctx.quadraticCurveTo(mx, my - 3, mx + 8, my + 3); }
    else if (m === 'angry') { ctx.moveTo(mx - 9, my + 2); ctx.lineTo(mx + 9, my + 2); }
    else { ctx.moveTo(mx - 7, my); ctx.quadraticCurveTo(mx, my + 3, mx + 7, my); }
    ctx.stroke();
  }
  if (c.glasses) { ctx.lineWidth = 3; ctx.strokeStyle = INK; [-18, 18].forEach(x => { ctx.beginPath(); ctx.arc(x + ex, -3 + ey, 13, 0, 7); ctx.stroke(); }); ctx.beginPath(); ctx.moveTo(-5 + ex, -4 + ey); ctx.lineTo(5 + ex, -4 + ey); ctx.stroke(); }
  if (c.beard) { ctx.fillStyle = c.hairColor || '#3a2a20'; ctx.globalAlpha = .9; ctx.beginPath(); ctx.moveTo(-50, 8); ctx.quadraticCurveTo(-46, 56, 0, 60); ctx.quadraticCurveTo(46, 56, 50, 8); ctx.quadraticCurveTo(36, 40, 0, 42); ctx.quadraticCurveTo(-36, 40, -50, 8); fillStroke(ctx, c.hairColor || '#3a2a20', INK, 3); ctx.globalAlpha = 1; }
  if (c.stubble) { ctx.fillStyle = 'rgba(60,50,45,.13)'; ctx.beginPath(); ctx.moveTo(-46, 14); ctx.quadraticCurveTo(-40, 56, 0, 58); ctx.quadraticCurveTo(40, 56, 46, 14); ctx.quadraticCurveTo(30, 44, 0, 44); ctx.quadraticCurveTo(-30, 44, -46, 14); ctx.fill(); }
}

function hair(ctx, c, f) {
  const hc = c.hairColor || '#3a2a20', st = c.hair || 'short';
  ctx.save(); ctx.lineWidth = 3.5; ctx.strokeStyle = INK;
  if (st === 'short') {
    ctx.beginPath(); ctx.moveTo(-58, -8); ctx.quadraticCurveTo(-64, -62, -4, -64); ctx.quadraticCurveTo(54, -66, 59, -10);
    ctx.quadraticCurveTo(44, -34, 14 + f * 8, -36); ctx.quadraticCurveTo(-10, -30, -24, -42); ctx.quadraticCurveTo(-40, -28, -58, -8); fillStroke(ctx, hc, INK, 3.5);
  } else if (st === 'side') {
    ctx.beginPath(); ctx.moveTo(-59, -4); ctx.quadraticCurveTo(-62, -64, 0, -66); ctx.quadraticCurveTo(60, -64, 59, -4);
    ctx.quadraticCurveTo(52, -30, 30, -40); ctx.quadraticCurveTo(-10, -38, -40, -26); ctx.quadraticCurveTo(-52, -20, -59, -4); fillStroke(ctx, hc, INK, 3.5);
  } else if (st === 'messy') {
    ctx.beginPath(); ctx.moveTo(-60, -2);
    const pts = [[-66, -40], [-46, -60], [-30, -74], [-8, -66], [12, -78], [30, -64], [52, -62], [62, -30], [60, -2]];
    pts.forEach(([x, y], i) => ctx.quadraticCurveTo(x, y, (x + (pts[i + 1] || [60, -2])[0]) / 2, (y + (pts[i + 1] || [60, -2])[1]) / 2));
    ctx.quadraticCurveTo(46, -32, 20, -34); ctx.quadraticCurveTo(0, -28, -20, -38); ctx.quadraticCurveTo(-44, -26, -60, -2); fillStroke(ctx, hc, INK, 3.5);
  } else if (st === 'bald') {
    ctx.strokeStyle = 'rgba(0,0,0,.12)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(-14, -30, 18, 3.6, 4.6); ctx.stroke();
    ctx.fillStyle = hc; [-1, 1].forEach(sd => { ctx.beginPath(); ctx.ellipse(sd * 56, -4, 7, 18, sd * 0.2, 0, 7); fillStroke(ctx, hc, INK, 2.5); });
  } else if (st === 'buzz') {
    ctx.beginPath(); ctx.arc(0, 0, 60, Math.PI * 1.08, Math.PI * 1.92); ctx.quadraticCurveTo(30, -40, 0, -42); ctx.quadraticCurveTo(-30, -40, -56, -20); ctx.closePath(); ctx.globalAlpha = .75; fillStroke(ctx, hc, null); ctx.globalAlpha = 1;
    ctx.beginPath(); ctx.arc(0, 0, 60, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke();
  } else if (st === 'long') {
    ctx.beginPath(); ctx.moveTo(-60, 40); ctx.quadraticCurveTo(-70, -64, 0, -66); ctx.quadraticCurveTo(70, -64, 60, 40); ctx.quadraticCurveTo(50, -20, 20, -38); ctx.quadraticCurveTo(-30, -36, -48, -10); ctx.quadraticCurveTo(-54, 10, -60, 40); fillStroke(ctx, hc, INK, 3.5);
  } else if (st === 'beanie') {
    ctx.beginPath(); ctx.moveTo(-62, -14); ctx.quadraticCurveTo(-60, -78, 0, -78); ctx.quadraticCurveTo(60, -78, 62, -14); ctx.closePath(); fillStroke(ctx, c.capColor || '#2b2f36', INK, 3.5);
    rr(ctx, -64, -26, 128, 20, 8); fillStroke(ctx, shade(c.capColor || '#2b2f36', .8), INK, 3);
  }
  if (c.cap) {   // peaked cap (police / officer)
    const cc = c.capColor || '#2b3344';
    ctx.beginPath(); ctx.moveTo(-56, -30); ctx.quadraticCurveTo(-58, -76, 0, -80); ctx.quadraticCurveTo(58, -76, 56, -30); ctx.closePath(); fillStroke(ctx, cc, INK, 3.5);
    ctx.beginPath(); ctx.ellipse(f * 14, -28, 62, 10, 0, 0, 7); fillStroke(ctx, shade(cc, .7), INK, 3);
    ctx.fillStyle = '#e8d27a'; ctx.beginPath(); ctx.arc(f * 6, -52, 7, 0, 7); fillStroke(ctx, '#e8d27a', INK, 2);
  }
  ctx.restore();
}

// ---------- shot camera ----------
// cam: { x, y, z } world centre and zoom; push from cam0 to cam1 over the shot
export function camera(ctx, c0, c1, k) {
  const e = easeInOut(k), x = lerp(c0.x, c1.x, e), y = lerp(c0.y, c1.y, e), z = lerp(c0.z, c1.z, e);
  ctx.setTransform(z, 0, 0, z, W / 2 - x * z, H / 2 - y * z);
}
