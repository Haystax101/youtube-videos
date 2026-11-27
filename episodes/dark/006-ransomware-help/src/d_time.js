// =====================================================================================================
// TIME: video t -> voice. Hook (the press conference + the empty vault), one 1 s rewind, then the story.
// =====================================================================================================
const TL = await (await fetch('./timeline.json')).json();
const B = TL.beats.map(b => b.start), HOOK_END = B[1], RW = 1.0, VEND = TL.duration;
const DUR = VEND + RW + 0.2;
const vt = v => v + (v >= HOOK_END - 1e-6 ? RW : 0);
const VB = i => vt(B[i]);
function WT(i, word, n = 1) { let c = 0; for (const w of TL.beats[i].words) if (w.w.replace(/[^A-Za-z0-9'_]/g, '').toLowerCase() === word.toLowerCase() && ++c === n) return vt(w.s); console.log('[c] missing word', i, word); return VB(i); }
const WORDS = TL.beats.flatMap((b, i) => b.words.map(w => ({ ...w, s: vt(w.s), e: vt(w.e), i })));
const lerpV = (a, b, k) => a.clone().lerp(b, k);
const blinkAt = (t, ph = 0) => ((t + ph) % 3.4) < 0.11;
const inB = (t, i) => t >= VB(i) && t < (i + 1 < B.length ? VB(i + 1) : DUR);
const inBs = (t, ...is) => is.some(i => inB(t, i));
const HIDE = V(0, -60, 0);
const hideCard = c => { c.on = false; c.pos.copy(HIDE); };
const showCard = (c, p, pose) => { c.on = true; c.pos.copy(p); c.pose = pose; };
const path = (pts, k) => { const n = pts.length - 1, f = clamp(k) * n, i = Math.min(n - 1, Math.floor(f)); return lerpV(pts[i], pts[i + 1], f - i); };
const pathLen = pts => { let L = 0; for (let i = 1; i < pts.length; i++) L += pts[i].distanceTo(pts[i - 1]); return L; };
// walk along pts at speed (m/s) from t0; returns {p, walking, dir}
function walkAlong(pts, t0, t, speed = 1.4) { const L = pathLen(pts), d = clamp((t - t0) * speed, 0, L); let acc = 0; for (let i = 1; i < pts.length; i++) { const s = pts[i].distanceTo(pts[i - 1]); if (acc + s >= d || i === pts.length - 1) { const k = s ? clamp((d - acc) / s) : 1; return { p: lerpV(pts[i - 1], pts[i], k), walking: t > t0 && d < L - 1e-3, dir: pts[i].x - pts[i - 1].x }; } acc += s; } return { p: pts[pts.length - 1].clone(), walking: false, dir: 0 }; }

