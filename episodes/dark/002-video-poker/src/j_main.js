
// =====================================================================================================
// TIME: video t -> voice. Hook (the WIN 8,200), one 1 s rewind, then the story.
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
const HIDE = V(0, -60, 0);
const hideCard = c => { c.on = false; c.pos.copy(HIDE); };
const showCard = (c, p, pose) => { c.on = true; c.pos.copy(p); c.pose = pose; };
const path = (pts, k) => { const n = pts.length - 1, f = clamp(k) * n, i = Math.min(n - 1, Math.floor(f)); return lerpV(pts[i], pts[i + 1], f - i); };
const PRESS = [1.25, 1.0], UP = [2.7, 0.15], DOWN = [0.15, 0.1];

// ---------- screens ----------
const mono = (x, size, col) => { x.font = `700 ${size}px monospace`; x.fillStyle = col; };
function drawCode(x, w, h, t, seed, col = '#3ff07a') { x.fillStyle = '#07060d'; x.fillRect(0, 0, w, h); const n = Math.floor(t * 9); mono(x, 20, col);
  for (let i = 0; i < 15; i++) { const k = n - 14 + i; if (k < 0) continue; const rr = rng(seed * 100 + k); let s = ''; const L = 6 + Math.floor(rr() * 30); for (let j = 0; j < L; j++) s += 'abcdefghijklmnopqrstuvwxyz{}();=<>/_$'[Math.floor(rr() * 38)]; x.fillStyle = rr() < 0.2 ? '#ff3fa8' : col; x.fillText(' '.repeat(Math.floor(rr() * 6)) + s, 16, 30 + i * 22); }
  x.fillStyle = 'rgba(255,255,255,.04)'; for (let y = 0; y < h; y += 4) x.fillRect(0, y, w, 1); }
const HEX = Array.from({ length: 14 }, (_, i) => { const r = rng(300 + i); return Array.from({ length: 8 }, () => Math.floor(r() * 256).toString(16).toUpperCase().padStart(2, '0')).join(' '); });
function drawHex(x, w, h, t, bug, sc = 1) { x.fillStyle = '#07060d'; x.fillRect(0, 0, w, h); const lh = 26 * sc; mono(x, 22 * sc, '#3ff07a'); const off = Math.floor(t * 3) % 14;
  for (let i = 0; i < Math.floor(h / lh) - 1; i++) { const row = (i + off) % 14, hot = bug > 0 && i === 6; const adr = (0x4A20 + (row + off) * 8).toString(16).toUpperCase().padStart(6, '0');
    if (hot) { x.fillStyle = `rgba(255,59,74,${0.35 + 0.25 * Math.sin(t * 8)})`; x.fillRect(0, 12 * sc + i * lh, w, lh); }
    x.fillStyle = hot ? '#ffffff' : '#5a8a6a'; x.fillText(adr, 14 * sc, 32 * sc + i * lh); x.fillStyle = hot ? '#ffffff' : '#3ff07a'; x.fillText(HEX[row], 110 * sc, 32 * sc + i * lh);
    if (hot) { const tw = x.measureText(HEX[row]).width; x.fillStyle = '#ff3b4a'; x.font = `900 ${26 * sc}px Poppins`; x.fillText('◀ BUG', 130 * sc + tw, 34 * sc + i * lh); mono(x, 22 * sc, '#3ff07a'); } }
  if (bug > 0 && sc > 1) { x.fillStyle = '#ff3b4a'; x.beginPath(); x.roundRect(w / 2 - 190, h - 150, 380, 120, 24); x.fill(); x.fillStyle = '#fff'; x.font = '900 90px Poppins'; x.textAlign = 'center'; x.fillText('BUG', w / 2, h - 58); x.textAlign = 'left'; }
  x.fillStyle = 'rgba(255,255,255,.04)'; for (let y = 0; y < h; y += 4) x.fillRect(0, y, w, 1); }
function drawCCTV(x, w, h, t) { x.fillStyle = '#05050a'; x.fillRect(0, 0, w, h); const cw = w / 3, ch = h / 2;
  for (let j = 0; j < 2; j++) for (let i = 0; i < 3; i++) { const ox = i * cw, oy = j * ch; x.fillStyle = '#1a2a2a'; x.fillRect(ox + 6, oy + 6, cw - 12, ch - 12); x.fillStyle = '#2a3a3a'; for (let k = 0; k < 5; k++) x.fillRect(ox + 20 + k * (cw - 40) / 5, oy + ch * 0.35, (cw - 40) / 5 - 8, ch * 0.45);
    if (i === 1 && j === 0) { x.fillStyle = '#a8c8b8'; x.beginPath(); x.arc(ox + cw / 2, oy + ch * 0.42, 22, 0, 7); x.fill(); x.fillRect(ox + cw / 2 - 26, oy + ch * 0.5, 52, 60); x.strokeStyle = '#ff3b4a'; x.lineWidth = 5; x.strokeRect(ox + cw / 2 - 50, oy + ch * 0.25, 100, 140); }
    x.fillStyle = '#ffffff'; x.font = '700 18px monospace'; x.fillText('CAM ' + (j * 3 + i + 1) + '  07/03/09', ox + 14, oy + 28); if ((t * 2) % 1 < 0.5) { x.fillStyle = '#ff3b4a'; x.beginPath(); x.arc(ox + cw - 24, oy + 22, 7, 0, 7); x.fill(); } }
  x.fillStyle = 'rgba(255,255,255,.05)'; for (let y = 0; y < h; y += 3) x.fillRect(0, y, w, 1); }
function drawWall(x, w, h, t, mode, k = 1) {
  if (mode === 'cctv') { drawCCTV(x, w, h, t); x.fillStyle = 'rgba(5,5,10,.55)'; x.fillRect(0, h / 2 - 70, w, 140); x.fillStyle = '#ffcf3f'; x.font = '900 96px Poppins'; x.textAlign = 'center'; x.fillText('5 JACKPOTS · 1 HOUR', w / 2, h / 2 + 34); x.textAlign = 'left'; return; }
  if (mode === 'code') { drawHex(x, w, h, t, k, 1.6); return; }
  x.fillStyle = '#0b1020'; x.fillRect(0, 0, w, h); x.fillStyle = '#2f6fe0'; x.fillRect(0, 0, w, 56); x.fillStyle = '#fff'; x.font = '900 30px Poppins'; x.textAlign = 'center'; x.fillText(mode === 'hack' ? 'FBI · LAS VEGAS · CASE FILE' : 'UNITED STATES v. KANE & NESTOR', w / 2, 38);
  if (mode === 'hack') { x.fillStyle = '#ff3b4a'; x.font = '900 96px Poppins'; x.fillText('HACKING?', w / 2, 290); x.fillStyle = '#cfd6e6'; x.font = '800 34px Poppins'; x.fillText('video poker · $1 → $10', w / 2, 380); }
  if (mode === 'charges') { x.fillStyle = '#ffffff'; x.font = '900 60px Poppins'; x.fillText('INDICTED · 2011', w / 2, 150); const items = ['WIRE FRAUD', 'COMPUTER HACKING', 'CONSPIRACY'];
    items.forEach((s, i) => { const a = clamp(k * 3 - i); if (a <= 0) return; x.globalAlpha = a; x.fillStyle = '#16121f'; x.fillRect(222, 200 + i * 112, w - 444, 92); x.fillStyle = i === 1 ? '#ff3b4a' : '#ffcf3f'; x.font = '900 50px Poppins'; x.fillText(s, w / 2, 266 + i * 112); x.globalAlpha = 1; }); }
  x.textAlign = 'left'; }
function drawBoard(x, w, h, t, n) { x.fillStyle = '#b8814a'; x.fillRect(0, 0, w, h); const r = rng(9); for (let i = 0; i < 2500; i++) { x.fillStyle = r() < 0.5 ? 'rgba(110,60,25,.35)' : 'rgba(255,215,160,.3)'; x.fillRect(r() * w, r() * h, 3, 3); }
  const P = [[70, 70, 280, 330, 'JOHN KANE', '#9a9aa2', '#8a2f3a', true], [680, 70, 280, 330, 'ANDRE NESTOR', '#3a2a1e', '#2f4f7a', false], [360, 420, 320, 170, '$500,000', null], [380, 90, 260, 200, 'GAME KING', null]];
  const cen = i => [P[i][0] + P[i][2] / 2, P[i][1] + 14];
  for (let i = 0; i < Math.min(4, Math.floor(n)); i++) { const [px, py, pw, ph, title, hair, shirt, tache] = P[i]; x.save(); x.translate(px + pw / 2, py + ph / 2); x.rotate((i % 2 ? 1 : -1) * 0.035); x.translate(-pw / 2, -ph / 2);
    x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(6, 8, pw, ph); x.fillStyle = '#fbfaf6'; x.fillRect(0, 0, pw, ph);
    if (hair) { x.fillStyle = '#2a2c38'; x.fillRect(20, 20, pw - 40, ph - 90); x.fillStyle = shirt; x.fillRect(pw / 2 - 80, ph - 150, 160, 80); x.fillStyle = '#f2c39c'; x.beginPath(); x.arc(pw / 2, 130, 58, 0, 7); x.fill(); x.fillStyle = hair; x.fillRect(pw / 2 - 58, 72, 116, 28);
      if (tache) { x.fillStyle = '#9a9aa2'; x.fillRect(pw / 2 - 30, 150, 60, 14); x.strokeStyle = '#14121a'; x.lineWidth = 4; x.strokeRect(pw / 2 - 40, 112, 32, 22); x.strokeRect(pw / 2 + 8, 112, 32, 22); }
      x.fillStyle = '#16121f'; x.font = '900 30px Poppins'; x.textAlign = 'center'; x.fillText(title, pw / 2, ph - 26); }
    else if (i === 2) { x.fillStyle = '#d7263d'; x.font = '900 70px Poppins'; x.textAlign = 'center'; x.fillText(title, pw / 2, 100); x.fillStyle = '#3a3e48'; x.font = '700 26px Poppins'; x.fillText('KANE\'S WINNINGS (FBI)', pw / 2, 145); }
    else { x.fillStyle = '#14121a'; x.fillRect(20, 20, pw - 40, 90); x.fillStyle = '#ffcf3f'; x.font = '900 40px Poppins'; x.textAlign = 'center'; x.fillText(title, pw / 2, 80); x.fillStyle = '#3a3e48'; x.font = '700 24px Poppins'; x.fillText('video poker', pw / 2, 150); }
    x.textAlign = 'left'; x.restore(); x.fillStyle = '#d7263d'; x.beginPath(); x.arc(cen(i)[0], cen(i)[1], 10, 0, 7); x.fill(); }
  x.strokeStyle = '#e3241f'; x.lineWidth = 6; for (const [a, b] of [[0, 3], [1, 3], [0, 2]]) { const kk = clamp(n - Math.max(a, b)); if (kk <= 0 || Math.max(a, b) >= 4) continue; const A = cen(a), Bp = cen(b); x.beginPath(); x.moveTo(A[0], A[1]); x.lineTo(A[0] + (Bp[0] - A[0]) * kk, A[1] + (Bp[1] - A[1]) * kk); x.stroke(); } }

// =====================================================================================================
// WORLD STATES
// =====================================================================================================
const PUNTER_SPOTS = [[-2.88, 0.62, 1], [-1.44, 0.62, 1], [2.16, 0.62, 1], [3.6, 0.62, 1], [-2.16, -1.37, -1], [1.44, -1.37, -1], [-1.44, -4.58, 1], [2.88, -4.58, 1]];
function heroMode(t) { // what the hero Game King shows
  let mode = 'attract', k = 1; const o = { denom: '$1', credits: 120 };
  if (t < HOOK_END + RW) { mode = t < 1.45 ? 'win820' : 'win8200'; o.denom = '$10'; o.credits = 8320; return [mode, k, o]; }
  if (inB(t, 1)) { mode = t < WT(1, 'noticed') ? 'lose' : 'first'; o.credits = 40; }
  if (inB(t, 2)) { const sw = WT(2, 'Switch'), pl = WT(2, 'play', 2), du = WT(2, 'doubleup'), fe = WT(2, 'Feed'), bk = WT(2, 'Back'), ra = WT(2, 'raise'), th = WT(2, 'Then'), fi = WT(2, 'first');
    mode = t < WT(2, 'win') - 0.1 ? 'lose' : 'win820'; o.credits = t < WT(2, 'win') ? 60 : 880;
    if (t >= sw) { mode = 'menu'; k = sstep(sw, sw + 0.8, t); } if (t >= pl - 0.3) { mode = 'draw'; o.game = 'DRAW POKER'; } if (t >= du - 0.25) mode = 'double';
    if (t >= fe) { mode = 'cash'; o.credits = 980; } if (t >= bk - 0.1) { mode = 'menu'; k = 1; delete o.game; } if (t >= ra - 0.1) { mode = 'denom'; k = sstep(ra - 0.1, WT(2, 'ten') + 0.2, t); }
    if (t >= th - 0.1) { mode = 'menu'; k = 0; o.denom = '$10'; } if (t >= fi - 0.15) { mode = 'first'; o.denom = '$10'; } }
  if (inB(t, 3)) { mode = 'first'; o.denom = '$10'; o.credits = 98; if (t >= WT(3, 'pays') - 0.1) { mode = 'win8200'; o.credits = 8298; } }
  if (inB(t, 4)) { mode = t < WT(4, 'They') ? 'win8200' : t < WT(4, 'small') ? 'double' : 'attract'; o.denom = '$10'; if (t > WT(4, 'Meadows') - 0.3) { mode = 'win8200'; o.credits = 4800; } }
  if (inB(t, 5)) { o.denom = '$10'; mode = t > WT(5, 'jackpots') - 0.3 ? 'jackpot' : 'win8200'; if (t > WT(5, 'pulled')) mode = 'attract'; }
  if (inB(t, 7)) { mode = 'win8200'; o.denom = '$10'; }
  if (inB(t, 8)) { const m = Math.floor((t - WT(8, 'They')) * 2.2); mode = t < WT(8, 'They') ? 'attract' : ['menu', 'denom', 'menu', 'draw', 'double', 'first'][Math.min(5, Math.max(0, m))]; k = (t * 1.3) % 1; }
  if (inB(t, 10)) { mode = t > WT(10, 'But') ? 'attract' : 'update'; k = sstep(WT(10, 'The') + 0.1, WT(10, 'machines') + 0.3, t); if (t > WT(10, 'But') - 0.05 && t < WT(10, 'But') + 0.6) { mode = 'update'; k = 1; } }
  return [mode, k, o]; }
function casinoState(t) {
  const U = CASINO.userData, Hm = U.hero; Object.values(CCARD).forEach(hideCard); PUNTERS.forEach(hideCard);
  let name = 'CASINO'; if ((inB(t, 4) && t > WT(4, 'Meadows') - 0.3) || inB(t, 7)) name = 'THE MEADOWS'; if (inB(t, 5)) name = 'SILVERTON';
  SCR.casName.update(name, Math.floor(t * 4) % 3);
  const [mode, k, o] = heroMode(t); drawVP(SCR.vp.x, 1024, 768, mode, t, k, o); SCR.vp.t.needsUpdate = true;
  SCR.bg.forEach(s => s.update(Math.floor(t * 4) / 4));
  SCR.prog.update(String(Math.floor(48211 + t * 7.3)).replace(/\B(?=(\d{3})+(?!\d))/g, ','));
  const hot = mode === 'win8200' || mode === 'jackpot', fl = Math.floor(t * 6) % 2; Hm.candle.material.color.set(hot ? (fl ? '#ff3b4a' : '#ffffff') : '#ff3b4a'); Hm.cg.material.opacity = hot ? (fl ? 0.9 : 0.25) : 0;
  U.heroL.intensity = hot ? 5 + 2 * fl : 3; U.jack.set(!(inB(t, 5) && t > WT(5, 'jackpots') - 0.3 && t < WT(5, 'pulled')) || fl);
  Hm.stool.visible = false;
  // buttons light when pressed
  const press = [[WT(2, 'Switch'), 0], [WT(2, 'Switch') + 0.35, 1], [WT(2, 'play', 2), 2], [WT(2, 'Back'), 3], [WT(2, 'raise'), 4], [WT(2, 'raise') + 0.4, 4], [WT(2, 'Then'), 0], [WT(3, 'Hit') + 0.15, 5], [WT(8, 'pressed'), 1], [WT(8, 'pressed') + 0.45, 3], [WT(8, 'buttons'), 5], [WT(8, 'machine'), 2], [WT(8, 'gave'), 4], [WT(7, 'kept'), 5]];
  Hm.btn.forEach((b, i) => { const on = press.some(([pt, bi]) => bi === i && t >= pt && t < pt + 0.28); b.material.color.set(on ? '#ffffff' : '#c4c4c4'); b.position.y = (i < 5 ? 1.05 : 1.04) - (on ? 0.012 : 0); });
  // bill goes in, tickets come out
  const fe = WT(2, 'Feed'); Hm.bill.visible = t > fe - 0.4 && t < fe + 0.6; Hm.bill.position.z = lerp(0.36, 0.2, sstep(fe - 0.2, fe + 0.5, t));
  const tk = t < HOOK_END + RW ? 2.0 : inB(t, 3) ? WT(3, 'pays') : -1; Hm.ticket.visible = tk > 0 && t > tk; if (tk > 0) Hm.ticket.position.z = lerp(0.2, 0.32, sstep(tk, tk + 0.8, t));
  // people
  const kp = V(-0.05, 0, 0.62);
  const kane = (pose) => showCard(CCARD.kane, kp, { blink: blinkAt(t), ...pose });
  if (t < HOOK_END + RW) kane({ expr: t < 1.45 ? 'smug' : 'delighted', armR: t > 1.45 ? UP : PRESS, armL: t > 1.7 ? UP : DOWN });
  if (inB(t, 1)) kane({ expr: t < WT(1, 'noticed') ? 'annoyed' : 'shocked', armR: t < WT(1, 'noticed') && Math.floor(t * 1.6) % 2 ? PRESS : DOWN });
  if (inB(t, 2)) kane({ expr: t > WT(2, 'Then') ? 'smug' : 'neutral', armR: Hm.btn.some(b => b.position.y < 1.04) || (t > fe - 0.4 && t < fe + 0.5) ? PRESS : DOWN });
  if (inB(t, 3)) kane({ expr: t > WT(3, 'pays') ? 'delighted' : 'smug', armR: t < WT(3, 'pays') && t > WT(3, 'Hit') - 0.2 ? PRESS : t > WT(3, 'Eight') ? UP : DOWN, armL: t > WT(3, 'Eight') ? UP : DOWN });
  if (inB(t, 4) && t < WT(4, 'Meadows') - 0.3) { kane({ expr: 'smug' }); const a0 = WT(4, 'Nestor') - 0.4, w = clamp((t - a0) / 2.4);
    showCard(CCARD.nestor, lerpV(V(-4.6, 0, 1.9), V(-0.78, 0, 0.66), sstep(0, 1, w)), { expr: w < 1 ? 'happy' : 'smug', walk: w > 0 && w < 1 ? t * 3.4 : 0, blink: blinkAt(t, 1) }); CCARD.nestor.spin = 0;
    if (t > WT(4, 'They') - 0.6) { const w2 = clamp((t - WT(4, 'They') + 0.6) / 1.2); showCard(CCARD.att, lerpV(V(3.6, 0, 2.2), V(0.62, 0, 0.95), sstep(0, 1, w2)), { expr: 'happy', walk: w2 < 1 ? t * 3.4 : 0, armR: w2 >= 1 ? [1.9, 0.5] : DOWN, blink: blinkAt(t, 2) }); } }
  if ((inB(t, 4) && t >= WT(4, 'Meadows') - 0.3) || inB(t, 7)) showCard(CCARD.nestor, kp, { expr: inB(t, 7) && t < WT(7, 'Nestor', 2) ? 'annoyed' : t > WT(4, 'four') || inB(t, 7) ? 'delighted' : 'smug', armR: Math.floor(t * 2) % 2 ? PRESS : DOWN, armL: inB(t, 7) && t < WT(7, 'Nestor', 2) ? [2.2, 2.4] : DOWN, blink: blinkAt(t, 1) });
  if (inB(t, 5)) { const pu = WT(5, 'pulled'), se = WT(5, 'Security'), w = clamp((t - pu + 0.2) / 2.2);
    const kpos = t < pu ? kp : path([kp, V(-0.8, 0, 1.5), V(-4.8, 0, 2.2)], w); showCard(CCARD.kane, kpos, { expr: t > se ? 'shocked' : t > WT(5, 'jackpots') ? 'delighted' : 'smug', armR: t < se && t > WT(5, 'jackpots') ? UP : DOWN, armL: t < se && t > WT(5, 'hour') ? UP : DOWN, walk: t > pu && w < 1 ? t * 3 : 0, sweat: t > se ? 1 : 0, blink: blinkAt(t) });
    if (t > se - 1.0) { const a = clamp((t - se + 1.0) / 1.0); const g1 = t < pu ? lerpV(V(3.8, 0, 2.4), V(0.55, 0, 1.0), sstep(0, 1, a)) : kpos.clone().add(V(0.62, 0, 0.04)); const g2 = t < pu ? lerpV(V(4.4, 0, 1.4), V(-0.62, 0, 1.0), sstep(0, 1, a)) : kpos.clone().add(V(-0.62, 0, 0.0));
      showCard(CCARD.g1, g1, { expr: 'angry', walk: (a < 1 || t > pu) && w < 1 ? t * 3.4 : 0, armL: a >= 1 ? [1.6, 0.4] : DOWN }); showCard(CCARD.g2, g2, { expr: 'neutral', walk: (a < 1 || t > pu) && w < 1 ? t * 3.4 + 1 : 0, armR: a >= 1 ? [1.6, 0.4] : DOWN }); } }
  if (inB(t, 8)) kane({ expr: 'neutral', armR: Hm.btn.some(b => b.position.y < 1.04) ? PRESS : DOWN });
  // punters at other machines (all beats on the floor except the Meadows)
  if (CURSHOT && CURSHOT.pov) { hideCard(CCARD.kane); hideCard(CCARD.nestor); }
  PUNTERS.forEach((c, i) => { const [px, pz, f] = PUNTER_SPOTS[i]; const look = inB(t, 5) && t > WT(5, 'That') - 0.2; showCard(c, V(px, 0, pz), { expr: look ? (i % 2 ? 'shocked' : 'annoyed') : ['neutral', 'smug', 'annoyed', 'happy'][i % 4], armR: !look && Math.floor(t * 0.8 + i * 0.7) % 3 === 0 ? PRESS : DOWN, blink: blinkAt(t, i * 0.7) }); });
}
function stripState(t) {
  const U = STRIP.userData; const lit = { RIO: inB(t, 4) && t > WT(4, 'Rio') - 0.2, WYNN: inB(t, 4) && t > WT(4, 'Wynn') - 0.2, 'GOLDEN NUGGET': inB(t, 4) && t > WT(4, 'Golden') - 0.2, SILVERTON: inB(t, 5), 'THE MEADOWS': inB(t, 4) && t > WT(4, 'Back') - 0.2 };
  const any = Object.values(lit).some(Boolean); for (const [n, s] of Object.entries(U.signs)) s.set(!any || lit[n] || Math.sin(t * 9 + n.length) > 0.2);
  U.bulbs.forEach(b => b.material.color.set((b.userData.i + Math.floor(t * 8)) % 3 ? '#fff2c8' : '#ffb03f'));
  U.cars.forEach(c => { const span = 100, x = -40 + (((c.ph * span + c.dir * t * 7) % span) + span) % span; c.root.position.set(x, 0, c.z); c.root.rotation.y = c.dir > 0 ? 0 : Math.PI; c.wheels.forEach(w => w.rotation.z = -t * 7 / 0.33); });
  STRIPPEOPLE.forEach(c => { const b = c.base, span = 90, x = -36 + (((b.x0 + 36 + b.dir * t * 1.1) % span) + span) % span; showCard(c, V(x, 0.06, b.z), { expr: 'happy', walk: t * 3 + b.ph, blink: blinkAt(t, b.ph) }); c.spin = 0; });
}
function hqState(t) {
  const U = HQ.userData; Object.values(HCARD).forEach(hideCard);
  const lab = inB(t, 6) || inB(t, 10); SCR.emblem.update(lab ? 'gcb' : 'fbi');
  const op = WT(6, 'opened'), pu = WT(6, 'pulled'), hi = WT(6, 'Hidden'), bug = WT(6, 'bug');
  U.door.rotation.y = inB(t, 6) ? -1.9 * sstep(op - 0.2, op + 0.9, t) : -1.9;
  const chipOn = inB(t, 6) ? sstep(pu - 0.2, pu + 0.6, t) : 1; U.chipL.intensity = 4 * chipOn * (0.85 + 0.15 * Math.sin(t * 9)); U.chipGlow.material.opacity = 0.8 * chipOn;
  // wall
  let mode = 'hack', k = 1; if (inB(t, 6)) { mode = t < hi - 0.2 ? 'cctv' : 'code'; k = t > bug - 0.2 ? 1 : 0; } if (inB(t, 8)) { mode = 'charges'; k = sstep(WT(8, 'charged') - 0.2, WT(8, 'hacking') + 0.2, t); } if (inB(t, 10)) { mode = 'code'; k = 0; }
  drawWall(SCR.wall.x, 1024, 585, t, mode, k); SCR.wall.t.needsUpdate = true;
  drawHex(SCR.lap.x, 640, 420, t, inB(t, 6) && t > bug - 0.2 ? 1 : 0); SCR.lap.t.needsUpdate = true;
  drawCode(SCR.desk.x, 512, 320, t, 11, lab ? '#3ff07a' : '#5fd0ff'); SCR.desk.t.needsUpdate = true;
  let n = 4; if (inB(t, 8)) { n = 1 + clamp((t - VB(8)) / 0.6) * 0.99; for (const [w, v] of [['charged', 2], ['FBI', 3]]) if (t > WT(8, w) - 0.2) n = v + clamp((t - WT(8, w) + 0.2) / 0.6) * 0.99; } if (t < HOOK_END + RW) n = 2.99;
  drawBoard(SCR.board.x, 1024, 640, t, Math.min(3.99, n)); SCR.board.t.needsUpdate = true;
  // the hero screen on the bench cabinet shows the first game
  if (lab) { drawVP(SCR.vp.x, 1024, 768, inB(t, 10) ? 'update' : 'first', t, 1, { denom: '$10' }); SCR.vp.t.needsUpdate = true; }
  if (lab) { const look = t > bug - 0.3 && inB(t, 6); showCard(HCARD.eng1, V(-0.45, 0, -0.05), { expr: look ? 'shocked' : 'neutral', armR: t > op - 0.2 && t < op + 1.2 && inB(t, 6) ? [1.7, 0.5] : DOWN, blink: blinkAt(t) });
    showCard(HCARD.eng2, V(0.62, 0, -0.1), { expr: look ? 'shocked' : 'neutral', armL: t > pu - 0.2 && t < hi ? [1.5, 0.6] : DOWN, blink: blinkAt(t, 1) }); }
  else { showCard(HCARD.agentM, V(2.6, 0, 1.6), { expr: inB(t, 8) && t > WT(8, 'FBI') ? 'smug' : 'neutral', armL: inB(t, 8) && t > WT(8, 'FBI') - 0.2 ? [2.1, 0.3] : DOWN, blink: blinkAt(t) });
    showCard(HCARD.agentF, V(-3.0, 0, -0.9), { expr: t < HOOK_END ? 'smug' : 'neutral', armR: [1.4, 0.8], blink: blinkAt(t, 1) }); }
}
function houseState(t) {
  const U = HOUSE.userData; Object.values(HOCARD).forEach(hideCard); RAM.position.y = -5;
  const fl = Math.floor(t * 6) % 2; U.suvs.forEach((c, i) => { const a = (fl + i) % 2; c.lr.material.color.set(a ? '#ff2a3a' : '#4a1018'); c.lb.material.color.set(a ? '#10204a' : '#2a6aff'); c.gr.material.opacity = a ? 0.8 : 0.1; c.gb.material.opacity = a ? 0.1 : 0.8; c.pr.intensity = a ? 10 : 0; c.pb.intensity = a ? 0 : 10; });
  const hit = WT(7, 'door') + 0.05, s0 = WT(7, 'until') - 0.2;
  U.door.rotation.y = t < hit ? 0 : 1.75 * (1 - Math.exp(-(t - hit) * 9)) + Math.exp(-(t - hit) * 6) * Math.sin((t - hit) * 30) * -0.12;
  U.splinters.forEach((m, i) => { if (t < hit) { m.position.y = -5; return; } const q = Math.min(t - hit, 1.0), an = i * 2.1; m.position.set(0.4 * Math.cos(an) + Math.sin(an) * q * 1.8, Math.max(0.03, 1.1 + (i % 4) * 0.25 + 2.2 * q - 6 * q * q), -0.1 - q * (1.5 + (i % 3) * 0.6)); m.rotation.set(q * 8 + i, q * 6, q * 3); });
  // SWAT walk up the path, swing the ram, pour in
  const w = clamp((t - s0) / 1.4), A = V(0, 0, 6.0), Dr = V(0.05, 0.25, 0.55);
  const lead = t < hit ? path([A, V(0, 0.08, 2.2), Dr], sstep(0, 1, w)) : t < hit + 0.5 ? Dr : path([Dr, V(0, 0.03, -1.4)], clamp((t - hit - 0.5) / 0.8));
  showCard(HOCARD.s1, lead, { expr: 'angry', walk: (w > 0 && w < 1) || (t > hit + 0.5 && t < hit + 1.3) ? t * 4 : 0, armR: [1.3, 0.6], armL: [1.3, 0.6] });
  showCard(HOCARD.s2, lead.clone().add(V(-0.75, 0, 0.7)), { expr: 'angry', walk: w < 1 || t > hit + 0.5 ? t * 4 + 1 : 0, armR: [1.1, 1.2] });
  showCard(HOCARD.s3, lead.clone().add(V(0.8, 0, 0.9)), { expr: 'neutral', walk: w < 1 || t > hit + 0.5 ? t * 4 + 2 : 0, armL: [1.1, 1.2] });
  if (t > s0 && t < hit + 0.5) { const sw = t > hit - 0.45 ? -0.35 * Math.sin(clamp((t - hit + 0.45) / 0.45) * Math.PI) : 0.25 * sstep(hit - 1.2, hit - 0.45, t); RAM.position.copy(lead).add(V(0.38, 1.05, -0.3 + sw)); RAM.rotation.set(0, Math.PI / 2, 0); }
  const sh = t > hit + 0.1; showCard(HOCARD.nestor, V(-0.6, 0, -1.9), { expr: sh ? 'shocked' : 'happy', sweat: sh ? 1 : 0, armR: sh ? UP : DOWN, armL: sh ? UP : DOWN, blink: blinkAt(t, 1) });
}
function courtState(t) {
  const U = COURT.userData; Object.values(CTCARD).forEach(hideCard); GALLERY.forEach(hideCard);
  const g1 = WT(9, 'thrown'), g2 = WT(9, 'dropped'); const strike = tt => t > tt - 0.25 && t < tt + 0.2 ? (t < tt ? sstep(tt - 0.25, tt - 0.08, t) * 0.8 - sstep(tt - 0.08, tt, t) * 1.3 : -0.5 * (1 - sstep(tt, tt + 0.2, t))) : 0;
  U.gavelArm.rotation.z = strike(g1) + strike(g2);
  const free = t > WT(9, 'Neither') - 0.2;
  showCard(CTCARD.judge, V(0, 1.3, -5.75), { sit: 1, expr: t > g1 ? 'neutral' : 'annoyed', armR: Math.abs(U.gavelArm.rotation.z) > 0.05 ? [1.6, 0.6] : [1.0, 1.4], armL: [1.0, 1.4], blink: blinkAt(t) });
  showCard(CTCARD.kane, V(-2.35, 0, -0.95), { expr: free ? 'delighted' : t > g1 ? 'happy' : 'neutral', armR: free ? UP : DOWN, blink: blinkAt(t, 0.4) });
  showCard(CTCARD.lawyer, V(-3.1, 0, -1.0), { expr: t > g1 ? 'smug' : 'neutral', blink: blinkAt(t, 1.2) });
  showCard(CTCARD.nestor, V(-1.6, 0, -0.95), { expr: free ? 'delighted' : t > g1 ? 'happy' : 'neutral', armL: free ? UP : DOWN, blink: blinkAt(t, 2) });
  showCard(CTCARD.pros, V(1.85, 0, -1.0), { expr: t > g1 ? 'annoyed' : 'neutral', blink: blinkAt(t, 0.8) }); showCard(CTCARD.pros2, V(2.6, 0, -1.0), { expr: t > g2 ? 'angry' : 'neutral', blink: blinkAt(t, 1.7) });
  GALLERY.forEach((c, i) => showCard(c, V((i % 2 ? 1 : -1) * (1.6 + Math.floor(i / 4) * 1.6 + (i % 4 > 1 ? 0.8 : 0)), 0.03, 1.75 + (Math.floor(i / 2) % 2) * 1.1), { sit: 1, expr: t > g1 ? ['shocked', 'happy', 'neutral', 'annoyed'][i % 4] : 'neutral', blink: blinkAt(t, i) }));
}

// =====================================================================================================
// SHOTS (a cut every ~2 s, every shot moving). Positions are in each set's local coordinates.
// =====================================================================================================
const sh = (set, p0, l0, f0, p1, l1, f1) => ({ set, f: k => ({ p: lerpV(p0, p1 || p0, k), l: lerpV(l0, l1 || l0, k), fov: lerp(f0, f1 ?? f0, k) }) });
const orbit = (set, c, r, y, a0, a1, ly, fov) => ({ set, f: k => { const a = lerp(a0, a1, k); return { p: V(c.x + Math.sin(a) * r, y, c.z + Math.cos(a) * r), l: V(c.x, ly, c.z), fov }; } });
const SCRN = V(0, 1.42, 0.155), BTNS = V(0, 1.04, 0.33);
const SCR_L = V(0, 1.36, 0.15), BTN_L = V(0, 1.12, 0.25);
const scr = (dx = 0.06) => ({ ...sh('casino', V(dx, 1.42, 1.2), SCR_L, 50, V(dx * 0.4, 1.4, 1.0), SCR_L, 48), pov: true });
const BTN_L2 = V(0, 1.05, 0.33); const btns = (dx = 0.35) => ({ ...sh('casino', V(dx, 1.42, 0.86), BTN_L2, 46, V(dx * 0.6, 1.36, 0.74), BTN_L2, 42), pov: true });
const SHOTS = [];
function buildShots() {
  const S = (t, s) => SHOTS.push({ t, ...s });
  // ---- hook: the 8,200 win, then the FBI
  S(0, sh('casino', V(1.7, 1.25, 3.4), V(0, 1.35, 0.1), 48, V(1.1, 1.4, 2.4), V(0, 1.38, 0.1), 44));
  S(WT(0, 'trick') - 0.05, scr(0.1));
  S(WT(0, 'casino') - 0.1, sh('casino', V(-2.0, 1.55, 2.2), V(0, 1.4, 0.3), 48, V(-3.6, 3.4, 4.6), V(0, 1.1, -2.5), 56));
  S(WT(0, 'ten') - 0.2, sh('casino', V(-1.1, 0.95, 2.4), V(-0.1, 1.45, 0.6), 46, V(-0.85, 1.0, 2.05), V(-0.1, 1.5, 0.6), 44));
  S(WT(0, 'The') - 0.05, sh('hq', V(1.1, 2.15, 3.2), V(-0.1, 1.9, -4), 50, V(0.9, 2.1, 2.5), V(-0.1, 1.9, -4), 48));
  // ---- beat 1: Vegas 2009, Kane losing
  S(VB(1), sh('strip', V(-8, 15, 26), V(0, 4, -4), 54, V(-3, 6.5, 17), V(0, 4.5, -4), 52));
  S(WT(1, 'John') - 0.1, sh('casino', V(1.5, 1.6, 2.4), V(0, 1.3, 0.4), 46, V(1.1, 1.55, 1.9), V(0, 1.35, 0.4), 42));
  S(WT(1, 'video') - 0.1, scr(-0.1));
  S(WT(1, 'In') - 0.1, orbit('casino', V(0, 0, -2.5), 6.6, 2.6, -0.55, 0.15, 1.2, 52));
  S(WT(1, 'lost') - 0.05, sh('casino', V(0.95, 1.55, 3.1), V(-0.05, 1.3, 0.62), 42, V(0.75, 1.55, 2.65), V(-0.05, 1.32, 0.62), 40));
  S(WT(1, 'Then') - 0.1, sh('strip', V(-11, 1.8, 7.6), V(-7, 3.2, -2), 55, V(-4, 1.9, 7.6), V(0, 3.2, -2), 55));
  S(WT(1, 'playing') - 0.15, sh('casino', V(0.55, 2.15, 1.45), V(0, 2.0, -0.08), 44, V(0.22, 2.08, 1.0), V(0, 2.0, -0.08), 40));
  S(WT(1, 'noticed') - 0.1, sh('casino', V(-1.05, 1.52, 3.2), V(-0.05, 1.35, 0.62), 42, V(-0.75, 1.52, 2.6), V(-0.05, 1.4, 0.62), 38));
  // ---- beat 2: the trick, step by step
  S(VB(2), { ...sh('casino', V(0.9, 2.0, 2.0), V(0, 1.6, 0.1), 50, V(0.5, 1.8, 1.5), V(0, 1.5, 0.1), 48), pov: true });
  S(WT(2, 'Play') - 0.1, scr(0.08));
  S(WT(2, 'say') - 0.1, { ...sh('casino', V(-0.3, 1.3, 1.05), SCRN, 46, V(0.2, 1.45, 0.95), SCRN, 44), pov: true });
  S(WT(2, 'Switch') - 0.15, btns(0.36));
  S(WT(2, 'different') + 0.1, scr(-0.08));
  S(WT(2, 'machine') - 0.15, scr(0.1));
  S(WT(2, 'Feed') - 0.2, { ...sh('casino', V(0.6, 1.42, 1.0), V(0.15, 1.2, 0.22), 44, V(0.45, 1.36, 0.82), V(0.17, 1.17, 0.22), 40), pov: true });
  S(WT(2, 'raise') - 0.15, scr(0.0));
  S(WT(2, 'Then') - 0.15, sh('casino', V(-1.6, 1.6, 2.7), V(0, 1.35, 0.3), 46, V(-1.3, 1.6, 2.25), V(0, 1.38, 0.3), 42));
  // ---- beat 3: the payout
  S(VB(3), scr(-0.06));
  S(WT(3, 'Hit') - 0.15, btns(-0.3));
  S(WT(3, 'machine') - 0.15, { ...sh('casino', V(0.5, 1.3, 1.0), V(0.12, 1.25, 0.2), 44, V(0.15, 1.42, 1.15), SCR_L, 50), pov: true });
  S(WT(3, 'Eight') - 0.2, sh('casino', V(0.5, 1.5, 2.2), V(0, 1.4, 0.3), 44, V(1.8, 2.5, 4.6), V(0, 1.3, 0), 52));
  // ---- beat 4: the crew
  S(VB(4), sh('casino', V(2.4, 1.6, 3.2), V(-0.6, 1.2, 0.5), 50, V(2.0, 1.6, 2.6), V(-0.4, 1.2, 0.5), 46));
  S(WT(4, 'They') - 0.1, sh('casino', V(-0.4, 1.6, 3.4), V(0.45, 1.25, 0.75), 50, V(-0.2, 1.55, 2.9), V(0.5, 1.25, 0.75), 46));
  S(WT(4, 'small') - 0.2, sh('strip', V(-31, 7, 13), V(-24, 5, -2), 52, V(-22, 10, 15), V(-14, 5, -2), 54));
  S(WT(4, 'Rio') - 0.15, sh('strip', V(-24.4, 4.5, 10.5), V(-26, 6.2, -1.6), 46, V(-27.4, 5, 9.6), V(-26, 6.4, -1.6), 44));
  S(WT(4, 'Wynn') - 0.12, sh('strip', V(-11.4, 6.5, 11), V(-13, 9.2, -1.6), 46, V(-14.4, 7, 10), V(-13, 9.4, -1.6), 44));
  S(WT(4, 'Golden') - 0.12, sh('strip', V(1.8, 4.6, 17.5), V(0, 5.8, -1.6), 56, V(1.2, 4.8, 16.0), V(0, 6.0, -1.6), 54));
  S(WT(4, 'Back') - 0.12, sh('strip', V(41.6, 3.4, 16.5), V(40, 4.2, -1.6), 54, V(41.0, 3.6, 15.0), V(40, 4.2, -1.6), 52));
  S(WT(4, 'Nestor', 2) - 0.12, sh('casino', V(-1.0, 2.3, 3.0), V(0, 3.0, -17), 50, V(-0.6, 1.75, 2.1), V(0, 1.4, 0.4), 44));
  S(WT(4, 'four') - 0.1, sh('casino', V(0.95, 1.55, 3.1), V(-0.05, 1.3, 0.62), 42, V(0.75, 1.55, 2.65), V(-0.05, 1.32, 0.62), 40));
  // ---- beat 5: Silverton, five jackpots, security
  S(VB(5), sh('strip', V(16.5, 3.0, 14), V(13.5, 6.0, -1.6), 48, V(14.6, 4.6, 10.5), V(13.5, 6.8, -1.6), 46));
  S(WT(5, 'he') - 0.1, sh('casino', V(1.8, 1.5, 3.3), V(0, 1.35, 0.2), 46, V(1.3, 1.5, 2.7), V(0, 1.38, 0.2), 44));
  S(WT(5, 'under') - 0.1, sh('casino', V(-0.8, 2.6, 1.7), V(0, 2.1, 0), 44, V(-1.7, 3.4, 2.6), V(0, 1.6, 0), 50));
  S(WT(5, 'That') - 0.1, sh('casino', V(-6.5, 2.4, -5.6), V(-12, 3.4, -10), 50, V(-7.4, 2.7, -6.8), V(-12, 3.4, -10), 46));
  S(WT(5, 'Security') - 0.15, sh('casino', V(-0.6, 1.8, 5.2), V(-1.0, 1.1, 1.0), 56, V(-1.2, 1.8, 5.0), V(-1.9, 1.1, 1.3), 56));
  // ---- beat 6: the lab
  S(VB(6), sh('hq', V(0.3, 2.8, 3.8), V(0, 1.4, -1.5), 56, V(0.1, 2.5, 3.2), V(0, 1.4, -1.5), 54));
  S(WT(6, 'Engineers') - 0.1, sh('hq', V(0.5, 1.75, 3.6), V(0, 1.25, 0.9), 54, V(0.3, 1.7, 3.1), V(0, 1.25, 0.9), 50));
  S(WT(6, 'opened') - 0.15, sh('hq', V(-0.5, 2.25, 3.5), V(-0.85, 1.5, 0.85), 46, V(-0.65, 2.05, 3.0), V(-0.85, 1.5, 0.85), 44));
  S(WT(6, 'pulled') - 0.15, sh('hq', V(0.62, 1.38, 1.6), V(0.37, 1.0, 1.03), 36, V(0.5, 1.25, 1.35), V(0.37, 1.0, 1.03), 28));
  S(WT(6, 'Hidden') - 0.15, sh('hq', V(0.55, 1.38, 1.45), V(0.98, 1.17, 0.62), 38, V(0.66, 1.32, 1.2), V(0.98, 1.17, 0.62), 32));
  S(WT(6, 'bug') - 0.15, sh('hq', V(0.3, 2.05, 3.4), V(0, 1.75, -4), 52, V(0.1, 2.0, 2.8), V(0, 1.75, -4), 50));
  // ---- beat 7: the raid
  S(VB(7), sh('casino', V(-1.6, 1.6, 3.3), V(0.15, 1.3, 0.5), 44, V(-1.3, 1.58, 2.8), V(0.15, 1.32, 0.5), 42));
  S(WT(7, 'Nestor', 2) - 0.1, btns(0.3));
  S(WT(7, 'until') - 0.15, sh('house', V(0.4, 2.4, 13), V(0, 1.2, 1.5), 50, V(0.3, 1.8, 11.2), V(0, 1.2, 1.0), 48));
  S(WT(7, 'door') - 0.35, { ...sh('house', V(2.7, 1.35, 2.1), V(-0.1, 1.1, 0.2), 50, V(2.5, 1.33, 1.8), V(-0.1, 1.1, 0.2), 48), shake: WT(7, 'door') + 0.05 });
  S(WT(7, 'battering') - 0.05, { ...sh('house', V(-2.6, 1.6, -4.1), V(-0.1, 1.15, -0.9), 52, V(-2.3, 1.58, -3.7), V(-0.1, 1.15, -1.0), 48), shake: WT(7, 'battering') });
  // ---- beat 8: the charges
  S(VB(8), sh('hq', V(1.5, 2.3, 3.8), V(-0.1, 1.8, -4), 50, V(1.1, 2.2, 3.1), V(-0.1, 1.8, -4), 48));
  S(WT(8, 'charged') - 0.15, sh('hq', V(1.0, 2.1, 3.0), V(-0.1, 1.85, -4), 50, V(0.8, 2.0, 2.5), V(-0.1, 1.85, -4), 48));
  S(WT(8, 'FBI') - 0.1, sh('hq', V(1.6, 1.75, 1.4), V(3.96, 1.7, -0.4), 44, V(2.0, 1.72, 1.0), V(3.96, 1.7, -0.55), 42));
  S(WT(8, 'But') - 0.1, sh('casino', V(-1.6, 1.7, 2.6), V(0, 1.35, 0.2), 46, V(-1.1, 1.62, 2.0), V(0, 1.38, 0.2), 42));
  S(WT(8, 'They') - 0.1, btns(0.38));
  S(WT(8, 'machine') - 0.15, scr(0.05));
  // ---- beat 9: court
  S(VB(9), sh('court', V(0.3, 1.9, 1.2), V(0, 2.5, -5.5), 52, V(0.1, 2.0, -0.8), V(0, 2.55, -5.5), 50));
  S(WT(9, 'played') - 0.15, sh('court', V(0.25, 2.3, -2.4), V(0, 2.25, -6.0), 52, V(0.05, 2.3, -2.8), V(0, 2.25, -6.0), 50));
  S(WT(9, 'The', 2) - 0.1, sh('court', V(-0.25, 2.3, -2.4), V(0, 2.25, -6.0), 52, V(-0.05, 2.3, -2.8), V(0, 2.25, -6.0), 50));
  S(WT(9, 'and') - 0.1, sh('court', V(-2.3, 1.6, -4.2), V(-2.3, 1.3, -0.95), 50, V(-1.9, 1.6, -3.9), V(-2.3, 1.32, -0.95), 46));
  S(WT(9, 'dropped') - 0.2, sh('court', V(2.4, 2.3, -2.4), V(0.8, 1.75, -5.2), 46, V(2.1, 2.25, -2.8), V(0.8, 1.75, -5.2), 42));
  S(WT(9, 'Neither') - 0.1, sh('court', V(-2.0, 1.6, -3.9), V(-2.0, 1.35, -0.95), 44, V(-2.0, 1.58, -3.5), V(-2.0, 1.38, -0.95), 40));
  // ---- beat 10: the fix and the lesson
  S(VB(10), scr(0.06));
  S(WT(10, 'But') - 0.1, orbit('casino', V(0, 0, -5), 7.2, 3.7, 0.6, -0.15, 1.0, 56));
  S(WT(10, 'nobody') - 0.1, sh('hq', V(0.55, 1.38, 1.45), V(0.98, 1.17, 0.62), 40, V(0.7, 1.3, 1.15), V(0.98, 1.17, 0.62), 32));
  S(WT(10, 'So') - 0.1, sh('casino', V(2.6, 1.6, 4.2), V(0, 1.4, -1), 52, V(2.0, 1.7, 3.4), V(0, 1.4, -1), 50));
  S(WT(10, 'Follow') - 0.2, sh('strip', V(0.6, 4.2, 15.5), V(0, 5.2, -2), 56, V(0, 10, 22), V(0, 5, -4), 56));
}

// =====================================================================================================
// captions + labels + 2D overlays
// =====================================================================================================
const labelEl = document.getElementById('label'), capEl = document.querySelector('#cap span'), rwEl = document.getElementById('rw');
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const KEYW = /^(jackpots?|fbi|hacking|bug|police|update|ten|double-up|silverton|smashed|convicted|million|eight|thousand|stop|code|dropped|thrown)$/i;
function overlays(t) {
  const inRW = t >= HOOK_END && t < HOOK_END + RW; rwEl.style.opacity = inRW ? 1 : 0;
  let bi = 0; for (let i = 0; i < B.length; i++) if (t >= VB(i) - 0.05) bi = i; const lab = inRW ? '' : SCRIPT.beats[bi] && SCRIPT.beats[bi].label || '';
  labelEl.innerHTML = esc(lab).replace(/\*(.+?)\*/g, '<span class="hot">$1</span>'); labelEl.style.opacity = lab ? 1 : 0;
  if (inRW) { capEl.textContent = ''; return; }
  let wi = -1; for (let i = 0; i < WORDS.length; i++) if (WORDS[i].s <= t + 0.14) wi = i; const wd = WORDS[wi];
  if (!wd || t > wd.e + 0.5) { capEl.textContent = ''; return; }
  const w = wd.w.replace(/[.,!?;:]+$/, ''); capEl.textContent = w; capEl.style.fontSize = w.length > 11 ? '72px' : '';
  capEl.className = KEYW.test(w.replace(/['"]/g, '')) ? 'k' : '';
  const a = clamp((t + 0.14 - wd.s) / 0.06); capEl.style.transform = `scale(${0.8 + 0.2 * a + 0.06 * Math.sin(a * Math.PI)})`;
}
const OV = document.getElementById('ov').getContext('2d');
function card2d(x, cx, cy, w, h, rot, sc, draw) { x.save(); x.translate(cx, cy); x.rotate(rot); x.scale(sc, sc); x.fillStyle = 'rgba(0,0,0,.35)'; x.beginPath(); x.roundRect(-w / 2 + 10, -h / 2 + 14, w, h, 22); x.fill(); draw(x, w, h); x.restore(); }
const pop = (t, t0) => { const a = clamp((t - t0) / 0.22); return a <= 0 ? 0 : 1 + 0.12 * Math.sin(a * Math.PI); };
const money = v => '$' + Math.round(v).toLocaleString('en-US');
function chip(x, t, t0, text, col, y = 380) { const s = pop(t, t0); if (!s) return; x.font = '900 52px Poppins'; const tw = x.measureText(text).width + 80; card2d(x, 540, y, tw, 104, -0.015, s, (c, cw, ch) => { c.fillStyle = col; c.beginPath(); c.roundRect(-cw / 2, -ch / 2, cw, ch, 26); c.fill(); c.lineWidth = 8; c.strokeStyle = '#0e0b16'; c.stroke(); c.fillStyle = '#fff'; c.font = '900 52px Poppins'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, 0, 4); }); }
function counter(x, t, t0, t1, v0, v1, top, col, y = 640) { const s = pop(t, t0); if (!s) return; const v = lerp(v0, v1, sstep(t0 + 0.1, t1, t));
  card2d(x, 540, y, 760, 250, 0.02, s, (c, cw, ch) => { c.fillStyle = '#f4efe4'; c.beginPath(); c.roundRect(-cw / 2, -ch / 2, cw, ch, 28); c.fill(); c.lineWidth = 9; c.strokeStyle = '#0e0b16'; c.stroke(); c.textAlign = 'center'; c.fillStyle = '#3a3e48'; c.font = '800 40px Poppins'; c.fillText(top, 0, -ch / 2 + 60); c.fillStyle = col; c.font = '900 110px Poppins'; c.fillText(money(v), 0, 80); }); }
function stamp(x, t, t0, l1, l2, y) { const a = clamp((t - t0) / 0.18); if (a <= 0) return; const sc = 1.8 - 0.8 * sstep(0, 1, a); x.save(); x.globalAlpha = Math.min(1, a * 1.5); x.translate(540, y); x.rotate(-0.12); x.scale(sc, sc);
  x.lineWidth = 14; x.strokeStyle = '#d7263d'; x.beginPath(); x.roundRect(-400, -110, 800, 220, 20); x.stroke(); x.fillStyle = 'rgba(244,239,228,.88)'; x.fill(); x.stroke(); x.fillStyle = '#d7263d'; x.textAlign = 'center'; x.font = '900 58px Poppins'; x.fillText(l1, 0, -18); x.font = '900 84px Poppins'; x.fillText(l2, 0, 74); x.restore(); }
function phone(x, t, t0, draw, y = 760, cx = 540, sc0 = 1) { const s = pop(t, t0) * sc0; if (!s) return; card2d(x, cx, y, 520, 880, -0.03, s, (c, cw, ch) => { c.fillStyle = '#14121a'; c.beginPath(); c.roundRect(-cw / 2, -ch / 2, cw, ch, 60); c.fill(); c.lineWidth = 8; c.strokeStyle = '#0e0b16'; c.stroke(); c.fillStyle = '#f4f6fb'; c.beginPath(); c.roundRect(-cw / 2 + 24, -ch / 2 + 70, cw - 48, ch - 140, 30); c.fill(); c.fillStyle = '#14121a'; c.beginPath(); c.roundRect(-50, -ch / 2 + 28, 100, 22, 11); c.fill(); draw(c, cw, ch); }); }
function overlays2d(t) { const x = OV; x.clearRect(0, 0, W, H);
  if (inB(t, 1) && t > WT(1, 'lost') - 0.1) counter(x, t, WT(1, 'lost') - 0.1, WT(1, 'casino'), 0, 500000, 'LOST IN ONE YEAR', '#d7263d', 640);
  if (inB(t, 2)) { const st = [['Play', 'STEP 1 · WIN BIG AT $1'], ['Switch', 'STEP 2 · SWITCH GAMES'], ['Feed', 'STEP 3 · FEED IN CASH'], ['raise', 'STEP 4 · BET $10 A HAND'], ['first', 'STEP 5 · BACK TO GAME 1']]; let cur = null; for (const [w, s] of st) if (t > WT(2, w) - 0.15) cur = [w, s]; if (cur) chip(x, t, WT(2, cur[0]) - 0.15, cur[1], '#2f6fe0', 380); }
  if (inB(t, 3) && t > WT(3, 'Hit') - 0.15 && t < WT(3, 'Eight') - 0.2) chip(x, t, WT(3, 'Hit') - 0.15, 'STEP 6 · CASH OUT', '#2f6fe0', 380);
  if (inB(t, 3) && t > WT(3, 'Eight') - 0.2) counter(x, t, WT(3, 'Eight') - 0.2, WT(3, 'hundred', 2) + 0.2, 820, 8200, 'SAME WIN, PAID AT $10', '#2f8a3a', 640);
  if (inB(t, 4) && t > WT(4, 'four') - 0.15) counter(x, t, WT(4, 'four') - 0.15, WT(4, 'dollars'), 0, 480000, 'NESTOR AT THE MEADOWS', '#2f8a3a', 640);
  if (inB(t, 5) && t > WT(5, 'five') - 0.1 && t < WT(5, 'Security') - 0.1) { const n = 1 + Math.min(4, Math.floor((t - WT(5, 'five') + 0.1) / 0.32)); chip(x, t, WT(5, 'five') - 0.1, 'JACKPOT ×' + n + (n === 5 ? ' IN UNDER AN HOUR' : ''), '#d7263d', 380); }
  if (inB(t, 7) && t < WT(7, 'until') - 0.15) phone(x, t, VB(7) + 0.1, (c, cw, ch) => { c.fillStyle = '#16121f'; c.font = '800 34px Poppins'; c.textAlign = 'center'; c.fillText('Kane', 0, -ch / 2 + 130); c.textAlign = 'left';
    c.fillStyle = '#e1e4ee'; c.beginPath(); c.roundRect(-cw / 2 + 50, -150, 360, 190, 30); c.fill(); c.fillStyle = '#16121f'; c.font = '900 52px Poppins'; c.fillText('Stop playing.', -cw / 2 + 80, -70); c.fillText('Now.', -cw / 2 + 80, 0); }, 900, 760, 0.62);
  if (inB(t, 9) && t > WT(9, 'thrown') - 0.05) stamp(x, t, WT(9, 'thrown') - 0.05, 'HACKING CHARGES', 'DISMISSED', 560);
  if (inB(t, 9) && t > WT(9, 'dropped') - 0.05) stamp(x, t, WT(9, 'dropped') - 0.05, 'FRAUD CHARGES', 'DROPPED', 840);
  if (inB(t, 10) && t > WT(10, 'So') - 0.15 && t < WT(10, 'Follow') + 0.2) { const fade = 1 - clamp((t - WT(10, 'Follow')) / 0.2); x.globalAlpha = fade; const pressed = t > WT(10, 'let') - 0.05;
    phone(x, t, WT(10, 'So') - 0.15, (c, cw, ch) => { c.textAlign = 'center'; c.fillStyle = '#2f6fe0'; c.beginPath(); c.arc(0, -170, 90, 0, 7); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 16; c.beginPath(); c.arc(0, -170, 48, -0.4, 4.6); c.stroke(); c.fillStyle = '#fff'; c.beginPath(); c.moveTo(48 * Math.cos(-0.4) - 22, -170 + 48 * Math.sin(-0.4) - 6); c.lineTo(48 * Math.cos(-0.4) + 22, -170 + 48 * Math.sin(-0.4) - 6); c.lineTo(48 * Math.cos(-0.4), -170 + 48 * Math.sin(-0.4) + 22); c.fill();
      c.fillStyle = '#16121f'; c.font = '900 46px Poppins'; c.fillText('Software Update', 0, -20); c.fillStyle = '#5a5e70'; c.font = '700 30px Poppins'; c.fillText('Security fixes', 0, 30);
      c.fillStyle = pressed ? '#2f8a3a' : '#2f6fe0'; c.beginPath(); c.roundRect(-180, 120, 360, 110, 55); c.fill(); c.fillStyle = '#fff'; c.font = '900 44px Poppins'; c.fillText(pressed ? 'Installing ✓' : 'Install now', 0, 190); }, 780); x.globalAlpha = 1; }
}

// =====================================================================================================
// frame
// =====================================================================================================
const FOG = { strip: new THREE.Fog('#1c1030', 35, 120), house: new THREE.Fog('#10142a', 25, 75), casino: null, hq: null, court: null };
const STATE = { casino: [casinoState, () => { Object.values(CCARD).forEach(hideCard); PUNTERS.forEach(hideCard); }], strip: [stripState, () => STRIPPEOPLE.forEach(hideCard)], hq: [hqState, () => Object.values(HCARD).forEach(hideCard)], house: [houseState, () => Object.values(HOCARD).forEach(hideCard)], court: [courtState, () => { Object.values(CTCARD).forEach(hideCard); GALLERY.forEach(hideCard); }] };
let CURSHOT = null;
function renderFrame(t) {
  let ct = t; if (t >= HOOK_END && t < HOOK_END + RW) ct = HOOK_END * (1 - sstep(HOOK_END, HOOK_END + RW, t)) - 0.0001;
  let si = 0; for (let i = 0; i < SHOTS.length; i++) if (ct >= SHOTS[i].t) si = i;
  const s = SHOTS[si], tEnd = SHOTS[si + 1] ? SHOTS[si + 1].t : DUR, k = clamp((ct - s.t) / Math.max(0.01, tEnd - s.t));
  for (const [n, G] of Object.entries(SETS)) G.visible = n === s.set; const G = SETS[s.set]; scene.fog = FOG[s.set];
  const c = s.f(k, ct);
  let shake = 0; if (s.shake !== undefined && ct >= s.shake) shake = Math.exp(-(ct - s.shake) * 5) * 0.09;
  camera.position.copy(c.p).add(G.position); camera.position.x += Math.sin(t * 1.1) * 0.006 + Math.sin(t * 37) * shake; camera.position.y += Math.sin(t * 1.7 + 1) * 0.004 + Math.cos(t * 41) * shake;
  camera.lookAt(c.l.clone().add(G.position)); camera.fov = c.fov; camera.updateProjectionMatrix();
  CURSHOT = s; for (const [n, [on, off]] of Object.entries(STATE)) (n === s.set ? on : off)(ct);
  for (const cd of cards) updateCard(cd, ct);
  post.uniforms.time.value = (Math.floor(t * 30) % 97) * 0.37; post.uniforms.warm.value = s.set === 'casino' || s.set === 'court' ? 0.6 : 0;
  overlays(t); overlays2d(t);
  draw();
}
