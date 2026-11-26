
// =====================================================================================================
// TIME: video t -> voice. Hook, one 1 s rewind, then the story.
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
const UP = [2.7, 0.15], DOWN = [0.15, 0.1], EAR = [2.4, 1.2];
const HOOK = t => t < HOOK_END + RW;

// ---------- screens ----------
const mono = (x, size, col) => { x.font = `700 ${size}px monospace`; x.fillStyle = col; };
const scan = (x, w, h) => { x.fillStyle = 'rgba(255,255,255,.04)'; for (let y = 0; y < h; y += 4) x.fillRect(0, y, w, 1); };
function drawPBX(x, w, h, mode, t, k = 1) { x.fillStyle = '#06140c'; x.fillRect(0, 0, w, h); x.textAlign = 'center';
  x.fillStyle = '#1f6a3a'; x.fillRect(0, 0, w, 44); x.fillStyle = '#d8ffe0'; x.font = '900 26px Poppins'; x.fillText('PBX 2000 · REMOTE ACCESS', w / 2, 31);
  if (mode === 'idle') { mono(x, 30, '#3ff07a'); x.fillText('LINES IN USE: 0 / 24', w / 2, 130); x.fillText('NIGHT MODE', w / 2, 190); }
  if (mode === 'login' || mode === 'default') { mono(x, 30, '#3ff07a'); x.fillText('ENTER ACCESS CODE', w / 2, 110); const n = Math.floor(clamp(k) * 4.999);
    for (let i = 0; i < 4; i++) { x.strokeStyle = '#3ff07a'; x.lineWidth = 4; x.strokeRect(w / 2 - 170 + i * 88, 140, 72, 80); if (i < n) { x.fillStyle = mode === 'default' ? '#ff3b4a' : '#3ff07a'; x.font = '900 60px monospace'; x.fillText(mode === 'default' ? '0' : '*', w / 2 - 134 + i * 88, 202); } }
    if (mode === 'default' && k >= 1) { x.fillStyle = '#ff3b4a'; x.fillRect(0, 236, w, 64); x.fillStyle = '#fff'; x.font = '900 34px Poppins'; x.fillText('FACTORY DEFAULT', w / 2, 280); } }
  if (mode === 'ok') { x.fillStyle = '#3ff07a'; x.fillRect(30, 80, w - 60, 90); x.fillStyle = '#06140c'; x.font = '900 46px Poppins'; x.fillText('ACCESS GRANTED', w / 2, 142); mono(x, 26, '#3ff07a'); x.fillText('DIAL ANY NUMBER ▸', w / 2, 230); }
  if (mode === 'calls' || mode === 'premium') { mono(x, 22, '#3ff07a'); x.textAlign = 'left'; const rr = rng(Math.floor(t * 3)); const dst = mode === 'premium' ? ['+881 PREMIUM', '+882 PREMIUM', '+870 PREMIUM'] : ['+39 ITALY', '+63 PHILIPPINES', '+92 PAKISTAN', '+234 NIGERIA', '+880 BANGLADESH', '+40 ROMANIA'];
    for (let i = 0; i < 6; i++) { x.fillStyle = i === (Math.floor(t * 4) % 6) ? '#ffffff' : '#3ff07a'; x.fillText(`L${String(i + 3).padStart(2, '0')} ▸ ${dst[(i + Math.floor(t)) % dst.length]}  ${String(Math.floor(rr() * 59)).padStart(2, '0')}:${String(Math.floor(rr() * 59)).padStart(2, '0')}`, 26, 82 + i * 36); }
    x.textAlign = 'center'; x.fillStyle = '#ff3b4a'; x.fillRect(0, h - 48, w, 48); x.fillStyle = '#fff'; x.font = '900 26px Poppins'; x.fillText(mode === 'premium' ? 'PREMIUM RATE · $$$ PER MINUTE' : 'LINES IN USE: 24 / 24', w / 2, h - 15); }
  x.textAlign = 'left'; scan(x, w, h); }
function drawWall(x, w, h, t, mode, k = 1) { x.fillStyle = '#0b1020'; x.fillRect(0, 0, w, h); x.fillStyle = '#2f6fe0'; x.fillRect(0, 0, w, 56); x.fillStyle = '#fff'; x.font = '900 30px Poppins'; x.textAlign = 'center';
  if (mode === 'indict') { x.fillText('U.S. DISTRICT COURT · NEW JERSEY', w / 2, 38); x.fillStyle = '#ffffff'; x.font = '900 52px Poppins'; x.fillText('UNITED STATES', w / 2, 150); x.fillStyle = '#9fb0d0'; x.font = '800 40px Poppins'; x.fillText('v.', w / 2, 205); x.fillStyle = '#ffffff'; x.font = '900 52px Poppins'; x.fillText('PAUL MICHAEL KWAN', w / 2, 265);
    if (k > 0) { x.globalAlpha = clamp(k * 2); x.fillStyle = '#d7263d'; x.beginPath(); x.roundRect(w / 2 - 260, 320, 520, 110, 18); x.fill(); x.fillStyle = '#fff'; x.font = '900 72px Poppins'; x.fillText('INDICTED', w / 2, 400); x.globalAlpha = 1; x.fillStyle = '#cfd6e6'; x.font = '800 32px Poppins'; x.fillText('2009 · WIRE FRAUD CONSPIRACY', w / 2, 490); } }
  if (mode === 'premium') { x.fillText('FBI · NEWARK · CASE FILE', w / 2, 38); x.fillStyle = '#ffcf3f'; x.font = '900 80px Poppins'; x.fillText('PREMIUM LINES', w / 2, 170); x.fillStyle = '#cfd6e6'; x.font = '800 34px Poppins'; x.fillText('hacked phones dial · pay-per-minute numbers', w / 2, 240);
    x.fillStyle = 'rgba(255,255,255,.18)'; x.fillRect(w / 2 - 300, 520, 600, 4); x.font = '800 22px Poppins'; x.fillStyle = '#9aa6c0'; x.fillText('PAYOUT PER HOUR OF CALLS', w / 2, 300);
    const bars = [0.3, 0.45, 0.6, 0.8, 1.0], lab = ['+881', '+882', '+870', '+979', '+900']; bars.forEach((b, i) => { const g = clamp(k * 5 - i), hh = 170 * b * g, bx = w / 2 - 270 + i * 112; x.fillStyle = ['#ffcf3f', '#ffb03f', '#ff8a3a', '#ff5f4a', '#ff3b4a'][i]; x.beginPath(); x.roundRect(bx, 520 - hh, 86, hh, 8); x.fill();
      x.fillStyle = '#ffffff'; x.font = '800 22px Poppins'; x.fillText(lab[i], bx + 43, 552); if (g > 0.6) { x.fillStyle = '#ffcf3f'; x.font = '900 26px Poppins'; x.fillText('$' + Math.round(40 + b * 260 * g), bx + 43, 510 - hh); } }); }
  if (mode === 'arrest') { x.fillText('FBI · NEWARK · CASE FILE', w / 2, 38); x.fillStyle = '#ff3b4a'; x.font = '900 86px Poppins'; x.fillText('ARRESTED', w / 2, 180); x.fillStyle = '#ffffff'; x.font = '900 52px Poppins'; x.fillText('MANILA · NOVEMBER 2011', w / 2, 260); x.fillStyle = '#cfd6e6'; x.font = '800 34px Poppins'; x.fillText('4 suspects · joint FBI / Philippine police', w / 2, 330); }
  x.textAlign = 'left'; scan(x, w, h); }
function drawBoard(x, w, h, t, n) { x.fillStyle = '#b8814a'; x.fillRect(0, 0, w, h); const r = rng(9); for (let i = 0; i < 2500; i++) { x.fillStyle = r() < 0.5 ? 'rgba(110,60,25,.35)' : 'rgba(255,215,160,.3)'; x.fillRect(r() * w, r() * h, 3, 3); }
  const P = [[60, 60, 270, 330, 'PAUL KWAN', 'face'], [380, 60, 270, 200, 'NOTEBOOKS', 'book'], [700, 60, 270, 200, 'ITALY · CALL SHOPS', 'shop'], [380, 330, 270, 200, '$55 MILLION', 'money'], [700, 330, 280, 250, 'FINANCIER', 'link']];
  const cen = i => [P[i][0] + P[i][2] / 2, P[i][1] + 14];
  for (let i = 0; i < Math.min(P.length, Math.floor(n)); i++) { const [px, py, pw, ph, title, kind] = P[i]; x.save(); x.translate(px + pw / 2, py + ph / 2); x.rotate((i % 2 ? 1 : -1) * 0.03); x.translate(-pw / 2, -ph / 2);
    x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(6, 8, pw, ph); x.fillStyle = '#fbfaf6'; x.fillRect(0, 0, pw, ph); x.textAlign = 'center';
    if (kind === 'face') { x.fillStyle = '#2a2c38'; x.fillRect(20, 20, pw - 40, ph - 90); x.fillStyle = '#3a7a6a'; x.fillRect(pw / 2 - 80, ph - 150, 160, 80); x.fillStyle = '#f6f2ea'; x.beginPath(); x.arc(pw / 2, 130, 58, 0, 7); x.fill(); x.fillStyle = '#141016'; for (let k = -3; k <= 3; k++) { x.beginPath(); x.moveTo(pw / 2 + k * 16 - 8, 92); x.lineTo(pw / 2 + k * 16, 62); x.lineTo(pw / 2 + k * 16 + 8, 92); x.fill(); } x.fillStyle = '#16121f'; x.font = '900 30px Poppins'; x.fillText(title, pw / 2, ph - 26); }
    else if (kind === 'money') { x.fillStyle = '#d7263d'; x.font = '900 52px Poppins'; x.fillText(title, pw / 2, 110); x.fillStyle = '#3a3e48'; x.font = '700 24px Poppins'; x.fillText('IN STOLEN CALLS', pw / 2, 150); }
    else if (kind === 'link') { x.fillStyle = '#14121a'; x.fillRect(20, 20, pw - 40, 80); x.fillStyle = '#ffcf3f'; x.font = '900 34px Poppins'; x.fillText(title, pw / 2, 72); x.fillStyle = '#3a3e48'; x.font = '700 22px Poppins'; x.fillText('police: the same group', pw / 2, 132); x.fillText('helped fund the', pw / 2, 162); x.fillStyle = '#d7263d'; x.font = '900 25px Poppins'; x.fillText('2008 MUMBAI ATTACKS', pw / 2, 205); }
    else { x.fillStyle = '#14121a'; x.fillRect(20, 20, pw - 40, 90); x.fillStyle = kind === 'shop' ? '#3ff0ff' : '#ffcf3f'; x.font = '900 30px Poppins'; x.fillText(title, pw / 2, 76); x.fillStyle = '#3a3e48'; x.font = '700 24px Poppins'; x.fillText(kind === 'book' ? 'numbers + access codes' : 'paid by the minute', pw / 2, 150); }
    x.textAlign = 'left'; x.restore(); x.fillStyle = '#d7263d'; x.beginPath(); x.arc(cen(i)[0], cen(i)[1], 10, 0, 7); x.fill(); }
  x.strokeStyle = '#e3241f'; x.lineWidth = 6; for (const [a, b] of [[0, 1], [1, 2], [0, 3], [3, 4]]) { const kk = clamp(n - b); if (kk <= 0) continue; const A = cen(a), Bp = cen(b); x.beginPath(); x.moveTo(A[0], A[1]); x.lineTo(A[0] + (Bp[0] - A[0]) * kk, A[1] + (Bp[1] - A[1]) * kk); x.stroke(); } }

// =====================================================================================================
// WORLD STATES
// =====================================================================================================
const KWAN_SEAT = V(0.2, 0, -2.45), CREW_A = V(-3.2, 0, -1.3), CREW_B = V(-2.45, 0, -1.7), CREW_C = V(-3.4, 0, 0.6);
const DOOR_OUT = V(5.2, 0, 1.5), DOOR_IN = V(3.4, 0, 1.5);
function aptState(t) {
  const U = APT.userData; Object.values(ACARD).forEach(hideCard);
  U.fan.rotation.y = t * 5;
  const yr = inB(t, 6) || inB(t, 7) ? ['MAR', '2007'] : inB(t, 8) ? ['JAN', '2010'] : inB(t, 9) ? ['NOV', '2011'] : ['MAY', '2005']; SCR.cal.update(...yr);
  SCR.clkMNL.update(15, Math.floor((t * 2) % 60)); SCR.clkNY.update(2, Math.floor((t * 2) % 60));
  // keypad: dial digits while dialling
  const dialT = inB(t, 1) ? WT(1, 'dials') - 0.3 : HOOK(t) ? WT(0, 'Armed') : inB(t, 8) ? WT(8, 'This') : -9; const DIG = '19735550142';
  if (dialT > -1 && t > dialT) { const n = Math.floor((t - dialT) * 5); SCR.key.update(n < DIG.length && (t - dialT) * 5 % 1 < 0.6 ? DIG[n] : '', DIG.slice(0, Math.min(n + 1, DIG.length))); } else SCR.key.update('', '');
  // notebook page fills as the crew writes codes down
  let rows = 4; if (HOOK(t)) rows = 9; if (inB(t, 3)) rows = 4 + clamp((t - WT(3, 'wrote') + 0.2) / 2.2) * 5.99; if (t > VB(4)) rows = 10; SCR.note.update(Math.floor(rows));
  // raid timings
  const raid6 = inB(t, 6) ? WT(6, 'raided') - 0.2 : null, raid9 = inB(t, 9) ? WT(9, 'FBI') - 0.4 : null, raid = raid6 ?? raid9;
  const doorK = raid != null ? sstep(raid, raid + 0.35, t) : 0; U.door.rotation.y = -1.6 * doorK;
  // notebooks vanish into the police's arms (2007)
  const sz = inB(t, 6) ? WT(6, 'seized') : 1e9; const gone = t > sz ? Math.floor((t - sz) / 0.35) : 0; const empty = inB(t, 7) || inB(t, 8) && false;
  U.books.forEach((b, i) => b.visible = !(inB(t, 6) && i >= 7 - gone)); U.books2.forEach((b, i) => b.visible = !(inB(t, 6) && i >= 5 - Math.max(0, gone - 4)));
  U.notePage.visible = !(inB(t, 6) && t > sz + 0.6);
  // Kwan
  const arrested = (inB(t, 6) && t > WT(6, 'Kwan') - 0.1) || (inB(t, 9) && t > WT(9, 'arrested') - 0.1);
  const onPhone = !arrested && !(raid != null && t > raid) && !(inB(t, 3) && t > WT(3, 'sold') - 0.2);
  const kExpr = HOOK(t) ? 'smug' : inB(t, 3) && t > WT(3, 'cracked') - 0.1 ? 'delighted' : inB(t, 8) ? 'smug' : raid != null && t > raid + 0.1 ? 'shocked' : 'neutral';
  U.hero.hs.visible = !onPhone;
  if (arrested) showCard(ACARD.kwan, KWAN_SEAT.clone().add(V(0.05, 0, 0.05)), { expr: 'shocked', cuffed: 1, sweat: 1, blink: blinkAt(t) });
  else showCard(ACARD.kwan, KWAN_SEAT, { sit: 1, expr: kExpr, phone: onPhone, armR: onPhone ? EAR : raid != null && t > raid + 0.1 ? UP : DOWN, armL: inB(t, 3) && t > WT(3, 'cracked') && t < WT(3, 'wrote') ? UP : raid != null && t > raid + 0.1 ? UP : DOWN, sweat: raid != null && t > raid + 0.1 ? 1 : 0, talk: onPhone ? 0.3 + 0.3 * Math.sin(t * 9) : 0, blink: blinkAt(t) });
  // crew at the side desk (not in the 2011 scene until arrested)
  const crewHere = !inB(t, 1) || t > WT(1, 'While'); const crewArr = inB(t, 9) && t > WT(9, 'three') - 0.15;
  U.cp1.hs.visible = U.cp2.hs.visible = true;
  if (crewHere && !inB(t, 8)) { const sh = raid != null && t > raid + 0.1;
    const cp = (c, p, ph, hs, ex) => { if (crewArr) return showCard(c, p, { expr: 'shocked', cuffed: 1, blink: blinkAt(t, ph) }); const phn = !sh && !(inB(t, 3) && c === ACARD.crewB && t > WT(3, 'sold') - 0.2); if (hs) hs.visible = !phn; showCard(c, p, { sit: 1, expr: sh ? 'shocked' : ex, phone: phn, armR: phn ? EAR : sh ? UP : DOWN, armL: sh ? UP : DOWN, book: !phn && !sh, bookCol: '#3f9a72', talk: phn ? 0.3 + 0.3 * Math.sin(t * 8 + ph) : 0, blink: blinkAt(t, ph) }); };
    cp(ACARD.crewA, CREW_A, 1, U.cp1.hs, 'happy'); cp(ACARD.crewB, CREW_B, 2, U.cp2.hs, 'smug');
    if (crewArr) showCard(ACARD.crewC, CREW_C, { expr: 'annoyed', cuffed: 1, blink: blinkAt(t, 3) }); }
  // the police come through the door
  if (raid != null && t > raid - 0.2) { const L = [ACARD.p1, ACARD.p2, ACARD.p3]; if (raid9 != null) L[2] = ACARD.fbi;
    const dest = [V(1.05, 0, -2.55), V(-0.6, 0, -1.15), V(2.5, 0, -0.5)], DIN = V(4.7, 0, 1.5), dest9 = [V(1.05, 0, -2.55), V(-1.9, 0, -0.5), V(-0.4, 0, -0.9)];
    L.forEach((c, i) => { const s0 = raid + i * 0.3, k = clamp((t - s0) / 1.3), d = (raid9 != null ? dest9 : dest)[i];
      const p = t < s0 ? DOOR_OUT.clone() : path([DIN, DOOR_IN, V(2.2, 0, 0.2), d], sstep(0, 1, k));
      const carry = raid6 != null && i === 1 && t > sz; showCard(c, p, { expr: 'angry', walk: k > 0 && k < 1 ? t * 3.6 + i : 0, armR: carry ? [0.6, 1.6] : i === 0 && k >= 1 ? [1.5, 0.5] : DOWN, book: carry, bookCol: '#d7263d', blink: blinkAt(t, i) }); c.spin = 0; }); }
  if (CURSHOT && CURSHOT.pov) hideCard(ACARD.kwan);
}
function officeState(t) {
  const U = OFFICE.userData; Object.values(OCARD).forEach(hideCard);
  const day = inB(t, 5) && t > WT(5, 'Most') - 0.2; U.setDay(day); SCR.clkOff.update(day ? 9 : 2, day ? 15 : Math.floor(4 + t * 0.3) % 60);
  const hot = HOOK(t) || (inB(t, 1) && t > WT(1, 'dials')) || (inB(t, 2) && t > WT(2, 'call')) || inB(t, 4) || inB(t, 8) || (inB(t, 5) && !day);
  U.leds.forEach((l, i) => l.material.color.set(hot && Math.sin(t * 7 + i * 1.3) > -0.3 ? '#ff3b4a' : '#3a1014'));
  SCR.leds.update(Math.floor(t * 8) / 8, hot ? 1 : 0); U.rackL.color.set(hot ? '#ff5a5a' : '#3ff07a');
  let mode = 'idle', k = 1;
  if (HOOK(t)) mode = 'calls';
  if (inB(t, 1)) mode = t > WT(1, 'dials') ? 'login' : 'idle', k = sstep(WT(1, 'dials'), WT(1, 'one'), t);
  if (inB(t, 2)) { mode = 'idle'; if (t > WT(2, 'punch') - 0.2) { mode = 'login'; k = sstep(WT(2, 'punch'), WT(2, 'code') + 0.3, t); } if (t > WT(2, 'and') - 0.05) mode = 'ok'; if (t > WT(2, 'thousands') - 0.2) mode = 'calls'; if (t > WT(2, 'that') - 0.1) { mode = 'default'; k = sstep(WT(2, 'that'), WT(2, 'factory'), t); } }
  if (inB(t, 3) || inB(t, 4) || inB(t, 5)) mode = 'calls'; if (day) mode = 'idle'; if (inB(t, 8)) mode = 'premium';
  if (inB(t, 10)) { mode = 'default'; k = sstep(VB(10), WT(10, 'default'), t); }
  drawPBX(SCR.pbx.x, 512, 300, mode, t, k); SCR.pbx.t.needsUpdate = true;
  if (day) { const sh = t > WT(5, 'bill') - 0.1; showCard(OCARD.boss, V(0.0, 0, -1.25), { expr: sh ? 'shocked' : 'neutral', sweat: sh ? 1 : 0, book: true, bookCol: '#f4efe4', armR: sh ? UP : DOWN, blink: blinkAt(t) }); }
}
function shopState(t) {
  const U = SHOP.userData; hideCard(SCARD.owner); SCARD.cops.forEach(hideCard); SCARD.cust.forEach(hideCard); SCARD.walkers.forEach(hideCard);
  U.sign.set(true);
  const raid = inB(t, 7) ? WT(7, 'Italian') - 0.1 : null, busy = !inB(t, 7) || t < WT(7, 'raided');
  U.meters.forEach((m, i) => { const on = busy && i !== 3; const sec = m.ph + (on ? t * 1 : 0) + (inB(t, 4) && t > WT(4, 'Twelve') ? (t - WT(4, 'Twelve')) * 90 : 0); m.tc.update(Math.floor(sec), Math.floor(sec) * 0.1 / 60 * 10 / 10, on ? 1 : 0); });
  SCARD.cust.forEach((c, i) => { if (i === 3) return; const p = U.booths[i]; const scared = raid != null && t > WT(7, 'raided'); showCard(c, p, { expr: scared ? 'shocked' : ['happy', 'neutral', 'delighted', 'smug'][i % 4], phone: !scared, armR: scared ? UP : EAR, talk: scared ? 0 : 0.3 + 0.3 * Math.sin(t * 8 + i), blink: blinkAt(t, i * 0.7) }); });
  const arr = raid != null && t > WT(7, 'arresting') - 0.2; showCard(SCARD.owner, raid != null && t > WT(7, 'raided') ? V(0.35, 0, -6.1) : V(0, 0, -7.55), { expr: arr ? 'shocked' : raid != null && t > WT(7, 'raided') ? 'annoyed' : 'smug', cuffed: arr ? 1 : 0, armR: !arr && !raid && Math.floor(t * 0.7) % 2 ? [1.6, 0.5] : DOWN, blink: blinkAt(t, 2) });
  if (raid != null) SCARD.cops.forEach((c, i) => { const s0 = raid + i * 0.4, sd = i === 1 ? -1 : 1, k = clamp((t - s0) / 2.6);
    const P = i < 2 ? [V(-1.8 + i * 1.6, 0, 5.5), V(0, 0, 1.2), V(0, 0, -1.0), V(i ? -0.55 : 1.25, 0, -5.9)] : [V(1.4, 0, 5.5), V(0, 0, 1.2), V(0, 0, -1.0), V(1.7, 0, -5.2)];
    showCard(c, path(P, sstep(0, 1, k)), { expr: 'angry', walk: k > 0 && k < 1 ? t * 3.6 + i : 0, armR: k >= 1 && i === 0 ? [1.5, 0.5] : DOWN, blink: blinkAt(t, i) }); c.spin = 0; });
  SCARD.walkers.forEach((c, i) => { const span = 30, x = -15 + (((i * 11 + (i % 2 ? 1 : -1) * t * 1.1) % span) + span) % span; showCard(c, V(x, 0.04, 1.4 + i * 0.5), { expr: 'happy', walk: t * 3 + i, blink: blinkAt(t, i) }); c.spin = 0; });
}
const ARCS = () => ({ mnl_ny: [WT(1, 'dials') - 0.2], mnl_nj: [WT(1, 'one')], mnl_la: [WT(1, 'number')], mnl_chi: [WT(1, 'after')], ny_world: [WT(2, 'anywhere') - 0.2, WT(4, 'Those')], ny_lon: [WT(2, 'world') - 0.2, WT(4, 'Those')], bre_ny: [WT(4, 'Those') - 0.2], ny_mnl2: [WT(4, 'American', 1) - 0.3], ny_prem: [WT(8, 'premium') - 0.2], prem_mnl: [WT(8, 'money') - 0.3] });
let ARC_T = null;
function mapState(t) { const U = MAP.userData; if (!ARC_T) ARC_T = ARCS();
  const beat = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].find(i => inB(t, i)) ?? 0;
  const vis = { 1: ['mnl_ny', 'mnl_nj', 'mnl_la', 'mnl_chi'], 2: ['ny_world', 'ny_lon'], 4: ['bre_ny', 'ny_world', 'ny_lon'], 8: ['ny_prem', 'prem_mnl'], 10: ['mnl_ny', 'bre_ny'] }[beat] || [];
  for (const [k, a] of Object.entries(U.arcs)) { let kk = 0; if (vis.includes(k)) { const t0 = beat === 4 && (k === 'ny_world' || k === 'ny_lon') ? WT(4, 'American') : beat === 10 ? VB(10) : ARC_T[k][0]; kk = sstep(t0, t0 + 0.9, t); } a.geo.setDrawRange(0, Math.floor(kk * 80) * 6 * 6); a.m.visible = kk > 0; }
  const pinT = { manila: beat === 1 || beat === 8 || beat === 10 ? VB(beat) : 1e9, ny: [1, 2, 4, 5, 8, 10].includes(beat) ? (beat === 5 ? WT(5, 'America') : VB(beat)) : 1e9, bre: beat === 4 || beat === 10 ? VB(beat) : 1e9, prem: beat === 8 ? WT(8, 'premium') : 1e9 };
  if (beat === 1) Object.assign(pinT, { nj: WT(1, 'one'), la: WT(1, 'number'), chi: WT(1, 'after') });
  if (beat === 2) Object.assign(pinT, { syd: WT(2, 'anywhere'), lon: WT(2, 'world') });
  if (beat === 4) Object.assign(pinT, { syd: WT(4, 'American'), lon: WT(4, 'American') });
  if (beat === 5) Object.assign(pinT, { nj: WT(5, 'America') + 0.1, la: WT(5, 'America') + 0.2, chi: WT(5, 'America') + 0.3, hou: WT(5, 'America') + 0.4, dal: WT(5, 'America') + 0.5, atl: WT(5, 'America') + 0.6, tor: WT(5, 'Canada'), van: WT(5, 'Canada') + 0.2, syd: WT(5, 'Australia'), mel: WT(5, 'Australia') + 0.2, lon: WT(5, 'Europe'), ber: WT(5, 'Europe') + 0.1, par: WT(5, 'Europe') + 0.2, mad: WT(5, 'Europe') + 0.3, bre: WT(5, 'Europe') + 0.4 });
  for (const [k, p] of Object.entries(U.pins)) { const t0 = pinT[k] ?? 1e9; const a = clamp((t - t0) / 0.25); p.scale.setScalar(a <= 0 ? 0.001 : (1 + 0.4 * Math.sin(a * Math.PI)) * (1 + 0.06 * Math.sin(t * 6 + p.position.x))); }
  for (const [k, s] of Object.entries(U.tags)) s.visible = U.pins[k].scale.x > 0.5 && (beat !== 5 || k === 'ny');
  // coins fly back to Manila along the premium arc
  U.coins.forEach((c, i) => { const t0 = WT(8, 'flowed') - 0.4 + i * 0.22; if (beat !== 8 || t < t0) { c.position.y = -5; return; } const k = ((t - t0) / 1.6) % 1; c.position.copy(U.arcs.prem_mnl.curve.getPoint(k)); c.rotation.y = t * 6 + i; });
}
function fbiState(t) { Object.values(FCARD).forEach(hideCard);
  let mode = 'indict', k = 0; if (inB(t, 7)) k = sstep(WT(7, 'indicted') - 0.1, WT(7, 'indicted') + 0.3, t); else k = 1; if (inB(t, 8)) { mode = 'premium'; k = sstep(WT(8, 'premium'), WT(8, 'ATT'), t); } if (inB(t, 9)) mode = 'arrest';
  drawWall(SCR.wall.x, 1024, 585, t, mode, k); SCR.wall.t.needsUpdate = true;
  drawPBX(SCR.desk.x, 512, 320, 'calls', t); SCR.desk.t.needsUpdate = true;
  let n = 4; if (inB(t, 9)) n = 4 + clamp((t - WT(9, 'Police') + 0.2) / 0.9) * 0.99 + (t > WT(9, 'Mumbai') - 0.3 ? 0.01 : 0); if (inB(t, 7)) n = 3.99; drawBoard(SCR.board.x, 1024, 640, t, Math.min(5, n)); SCR.board.t.needsUpdate = true;
  showCard(FCARD.agentM, V(2.5, 0, 1.4), { expr: inB(t, 9) ? 'neutral' : 'smug', armL: inB(t, 9) && t > WT(9, 'Police') ? [2.0, 0.3] : DOWN, blink: blinkAt(t) });
  showCard(FCARD.agentF, V(-2.4, 0, -0.9), { expr: 'neutral', armR: [1.4, 0.8], blink: blinkAt(t, 1) });
  if (inB(t, 7)) showCard(FCARD.pros, V(-1.35, 0, -2.0), { expr: t > WT(7, 'indicted') ? 'smug' : 'neutral', armR: t > WT(7, 'indicted') - 0.2 && t < WT(7, 'Italian') ? [2.2, 0.3] : DOWN, blink: blinkAt(t, 2) });
}
