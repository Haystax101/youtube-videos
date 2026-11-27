// =====================================================================================================
// 2D OVERLAYS
// =====================================================================================================
const OV = document.getElementById('ov').getContext('2d', { willReadFrequently: true }); // software canvas: an accelerated one can skip presenting a cleared frame on headless swiftshader (stale cards in chunk renders)
function card2d(x, cx, cy, w, h, rot, sc, draw) { x.save(); x.translate(cx, cy); x.rotate(rot); x.scale(sc, sc); x.fillStyle = 'rgba(0,0,0,.35)'; x.beginPath(); x.roundRect(-w / 2 + 10, -h / 2 + 14, w, h, 22); x.fill(); draw(x, w, h); x.restore(); }
const pop = (t, t0) => { const a = clamp((t - t0) / 0.22); return a <= 0 ? 0 : 1 + 0.12 * Math.sin(a * Math.PI); };
function paper(c, cw, ch, col = '#f4efe4') { c.fillStyle = col; c.beginPath(); c.roundRect(-cw / 2, -ch / 2, cw, ch, 24); c.fill(); c.lineWidth = 8; c.strokeStyle = '#0e0b16'; c.stroke(); }
function stamp(x, t, t0, text, col, cx, cy, rot = -0.12, size = 120) { const s = pop(t, t0); if (!s) return; x.save(); x.translate(cx, cy); x.rotate(rot); const z = s * (1 + 0.6 * Math.exp(-(t - t0) * 12)); x.scale(z, z); x.font = `900 ${size}px Poppins`; x.textAlign = 'center'; x.textBaseline = 'middle'; const w = x.measureText(text).width + 60;
  x.fillStyle = 'rgba(244,239,228,.94)'; x.fillRect(-w / 2, -size * 0.62, w, size * 1.24); x.lineWidth = 14; x.strokeStyle = col; x.strokeRect(-w / 2, -size * 0.62, w, size * 1.24); x.fillStyle = col; x.fillText(text, 0, 6); x.restore(); x.textBaseline = 'alphabetic'; }
const within = (t, a, b) => t > a && t < b;
function lines(c, arr, y0, dy, font, col, align = 'center', x0 = 0) { c.textAlign = align; c.fillStyle = col; c.font = font; arr.forEach((s, i) => c.fillText(s, x0, y0 + i * dy)); c.textAlign = 'left'; }
function overlays2d(t) { const x = OV; x.clearRect(0, 0, W, H); x.fillStyle = 'rgba(0,0,0,0.004)'; x.fillRect(0, 0, 2, 2); x.textAlign = 'left'; x.textBaseline = 'alphabetic';
  // beat 2: the Treasury warning
  if (inB(t, 2) && t > WT(2, 'Treasury') - 0.2) { const s = pop(t, WT(2, 'Treasury') - 0.2); card2d(x, 540, 700, 900, 470, -0.02, s, (c, cw, ch) => { paper(c, cw, ch, '#f8f5ee');
    c.fillStyle = '#1d2a4a'; c.beginPath(); c.roundRect(-cw / 2, -ch / 2, cw, 96, [24, 24, 0, 0]); c.fill(); lines(c, ['U.S. TREASURY · ADVISORY'], -ch / 2 + 62, 0, '900 40px Poppins', '#e8c35a');
    lines(c, ['Paying some ransomware', 'gangs can break', 'sanctions law.'], -40, 66, '900 56px Poppins', '#14121a'); lines(c, ['Office of Foreign Assets Control, Sept 2021'], 190, 0, '700 28px Poppins', '#5a5e70'); }); }
  // beat 3: the claim
  if (inB(t, 3) && t > WT(3, 'success') - 0.15) stamp(x, t, WT(3, 'success') - 0.15, 'CLAIMED: 99%+', '#14a39a', 540, 1500, -0.08, 96);
  // beat 4: no way to unlock + the money flow
  if (inB(t, 4) && within(t, WT(4, 'no') - 0.15, WT(4, 'quietly') - 0.15)) stamp(x, t, WT(4, 'no') - 0.15, 'NO WAY TO UNLOCK', '#d7263d', 540, 820, -0.1, 84);
  if (inB(t, 4) && t > WT(4, 'quietly') - 0.15) { const s = pop(t, WT(4, 'quietly') - 0.15); card2d(x, 540, 720, 940, 620, 0.015, s, (c, cw, ch) => { paper(c, cw, ch);
    lines(c, ['WHAT PROSECUTORS ALLEGE'], -ch / 2 + 64, 0, '900 36px Poppins', '#d7263d');
    const node = (ny, col, s1, s2) => { c.fillStyle = col; c.beginPath(); c.roundRect(-300, ny - 58, 600, 116, 20); c.fill(); c.lineWidth = 6; c.strokeStyle = '#0e0b16'; c.stroke(); lines(c, [s1], ny + 4, 0, '900 44px Poppins', '#fff'); lines(c, [s2], ny + 42, 0, '700 24px Poppins', '#fff'); };
    const k1 = t > WT(4, 'paid') - 0.1, k2 = t > WT(4, 'charged') - 0.1;
    node(-150, '#2f6fe0', 'THE VICTIM', k2 ? 'pays the firm a lot' : 'needs the key', true); node(30, '#14a39a', 'THE FIRM', '"our own technology"'); if (k1) node(210, '#b3121f', 'THE GANG', 'gets paid for the key');
    c.strokeStyle = '#0e0b16'; c.lineWidth = 8; if (k2) { c.beginPath(); c.moveTo(-330, -150); c.quadraticCurveTo(-420, -60, -330, 30); c.stroke(); lines(c, ['$$$'], -50, 0, '900 40px Poppins', '#3fae5a', 'center', -400); }
    if (k1) { c.beginPath(); c.moveTo(330, 30); c.quadraticCurveTo(420, 120, 330, 210); c.stroke(); lines(c, ['$'], 140, 0, '900 40px Poppins', '#3fae5a', 'center', 400); } }); }
  // beat 5: ProPublica, May 2019
  if (inB(t, 5) && t > WT(5, 'twentynineteen') - 0.2) { const s = pop(t, WT(5, 'twentynineteen') - 0.2); card2d(x, 540, 700, 920, 560, -0.025, s, (c, cw, ch) => { paper(c, cw, ch, '#ffffff');
    lines(c, ['PROPUBLICA · MAY 2019'], -ch / 2 + 70, 0, '900 38px Georgia, serif', '#14121a'); c.fillStyle = '#14121a'; c.fillRect(-cw / 2 + 50, -ch / 2 + 92, cw - 100, 5);
    lines(c, ['"THE TRADE SECRET"'], -100, 0, '900 64px Poppins', '#d7263d'); lines(c, ['Two US recovery firms', 'mostly just paid', 'the hackers.'], -20, 60, '800 48px Poppins', '#14121a');
    if (t > WT(5, 'Iran') - 0.15) stamp(c, t, WT(5, 'Iran') - 0.15, 'HACKERS IN IRAN', '#d7263d', 0, 220, -0.06, 52); }); }
  // beat 8: the indictment, then the name card
  if (inB(t, 8) && within(t, WT(8, 'indictment') - 0.2, WT(8, 'chief') - 0.15)) { const s = pop(t, WT(8, 'indictment') - 0.2); card2d(x, 540, 700, 820, 600, 0.02, s, (c, cw, ch) => { paper(c, cw, ch, '#fbf8ee');
    lines(c, ['UNITED STATES DISTRICT COURT', 'DISTRICT OF RHODE ISLAND'], -ch / 2 + 70, 44, '900 32px Georgia, serif', '#14121a'); lines(c, ['INDICTMENT'], -40, 0, '900 84px Poppins', '#14121a');
    c.fillStyle = '#c9ccd6'; for (let i = 0; i < 5; i++) c.fillRect(-300, 30 + i * 36, 600 - (i * 91 % 160), 14); c.fillStyle = 'rgba(255,207,63,.55)'; c.fillRect(-310, 98, 520, 30); }); }
  if (inB(t, 8) && t > WT(8, 'Juan') - 0.15) { const s = clamp((t - WT(8, 'Juan') + 0.15) / 0.25); x.save(); x.globalAlpha = s; x.translate(-60 * (1 - s), 0);
    x.fillStyle = '#0e0b16'; x.beginPath(); x.roundRect(40, 1460, 1000, 190, 18); x.fill(); x.fillStyle = '#14a39a'; x.fillRect(40, 1460, 18, 190);
    x.fillStyle = '#ffffff'; x.font = '900 52px Poppins'; x.fillText('JUAN RICARDO', 90, 1528); x.fillText('PALACIO ESCOBAR', 90, 1588); x.fillStyle = '#9aa2b0'; x.font = '700 28px Poppins'; x.fillText('Co-founder and CTO · charged, not convicted', 90, 1632); x.restore(); }
  // beat 9: the haggle
  if (inB(t, 9) && t > WT(9, 'down') - 0.2) { const s = pop(t, WT(9, 'down') - 0.2), k = sstep(WT(9, 'about') - 0.1, WT(9, 'dollars'), t); card2d(x, 540, 700, 860, 430, -0.02, s, (c, cw, ch) => { paper(c, cw, ch, '#14121a');
    lines(c, ['PRICE FOR THE KEY'], -ch / 2 + 70, 0, '800 38px Poppins', '#9aa2b0'); c.fillStyle = '#f7931a'; c.beginPath(); c.arc(-250, 40, 70, 0, 7); c.fill(); lines(c, ['₿'], 66, 0, '900 90px Poppins', '#fff', 'center', -250);
    lines(c, [k < 0.5 ? 'TOO HIGH' : '~$6,000'], 60, 0, '900 100px Poppins', k < 0.5 ? '#ff3b4a' : '#ffcf3f', 'center', 110); lines(c, ['in bitcoin, as alleged'], 140, 0, '700 32px Poppins', '#9aa2b0', 'center', 110);
    if (k < 0.5 && t > WT(9, 'talked')) { c.strokeStyle = '#ff3b4a'; c.lineWidth = 10; c.beginPath(); c.moveTo(-50, 30); c.lineTo(270, 60); c.stroke(); } }); }
  // beat 10: the invoice
  if (inB(t, 10) && t > WT(10, 'A') - 0.2) { const s = pop(t, WT(10, 'A') - 0.2); card2d(x, 540, 690, 900, 720, 0.02, s, (c, cw, ch) => { paper(c, cw, ch, '#ffffff');
    c.fillStyle = '#14a39a'; c.beginPath(); c.roundRect(-cw / 2, -ch / 2, cw, 110, [24, 24, 0, 0]); c.fill(); lines(c, ['INVOICE'], -ch / 2 + 74, 0, '900 54px Poppins', '#fff');
    const row = (y, a, b, on, col = '#14121a', f = '800 44px Poppins') => { if (!on) return; c.font = f; c.fillStyle = col; c.textAlign = 'left'; c.fillText(a, -380, y); c.textAlign = 'right'; c.fillText(b, 380, y); c.textAlign = 'left'; };
    row(-140, 'Diagnostic fee', '$2,750', t > WT(10, 'diagnostic') - 0.15); row(-60, 'Recovery fee', '$13,260', t > WT(10, 'recovery') - 0.15);
    if (t > WT(10, 'Sixteen') - 0.15) { c.fillStyle = '#14121a'; c.fillRect(-380, -20, 760, 6); row(60, 'TOTAL', '$16,010', true, '#d7263d', '900 64px Poppins'); }
    if (t > WT(10, 'presented') - 0.15) { c.fillStyle = '#fff3d6'; c.beginPath(); c.roundRect(-400, 120, 800, 170, 18); c.fill(); lines(c, ['What the "gang" was paid:', '~$6,000'], 185, 70, '900 44px Poppins', '#b3121f'); } }); }
  // beat 11: both sides were the FBI
  if (inB(t, 11) && t > WT(11, 'same') - 0.1) { stamp(x, t, WT(11, 'same') - 0.1, 'VICTIM = FBI', '#2f6fe0', 540, 640, -0.1, 92); stamp(x, t, WT(11, 'people') - 0.05, 'GANG = FBI', '#d7263d', 540, 840, 0.06, 92); }
  // beat 12: charged, not convicted
  if (inB(t, 12) && within(t, WT(12, 'charged') - 0.15, WT(12, 'He', 2) - 0.2)) stamp(x, t, WT(12, 'charged') - 0.15, '3 COUNTS · WIRE FRAUD', '#d7263d', 540, 760, -0.08, 76);
  if (inB(t, 12) && t > WT(12, 'convicted') - 0.2) { const s = pop(t, WT(12, 'convicted') - 0.2); card2d(x, 540, 560, 860, 300, 0.02, s, (c, cw, ch) => { paper(c, cw, ch); lines(c, ['NOT CONVICTED'], -20, 0, '900 72px Poppins', '#14121a'); lines(c, ['presumed innocent'], 60, 0, '800 44px Poppins', '#5a5e70'); }); }
  // beat 13: the markup
  if (inB(t, 13) && t > WT(13, 'markup') - 0.15) stamp(x, t, WT(13, 'markup') - 0.15, '+ MARKUP', '#d7263d', 540, 780, -0.1, 120);
  // beat 14: the lesson
  if (inB(t, 14) && t > WT(14, 'ask') - 0.15 && t < WT(14, 'Follow') + 0.3) { const fade = 1 - clamp((t - WT(14, 'Follow')) / 0.3); x.globalAlpha = fade;
    const tips = [['ask', 'ASK THE FIRM', '"Do you pay the hackers?"', '#14a39a', 'ask'], ['Keep', 'OFFLINE BACKUPS', 'unplugged, out of reach', '#2f6fe0', 'back'], ['report', 'REPORT IT', 'to the police', '#d7263d', 'rep']];
    tips.forEach(([w, title, l1, col, icon], i) => { const s = pop(t, WT(14, w) - 0.15); if (!s) return; card2d(x, 540, 470 + i * 250, 940, 220, (i % 2 ? 1 : -1) * 0.02, s, (c, cw, ch) => { paper(c, cw, ch);
      c.fillStyle = col; c.beginPath(); c.arc(-cw / 2 + 110, 0, 66, 0, 7); c.fill(); c.lineWidth = 7; c.strokeStyle = '#0e0b16'; c.stroke(); c.fillStyle = '#fff'; c.font = '900 72px Poppins'; c.textAlign = 'center'; c.fillText(icon === 'ask' ? '?' : icon === 'back' ? '↺' : '!', -cw / 2 + 110, 26); c.textAlign = 'left';
      c.fillStyle = '#0e0b16'; c.font = '900 50px Poppins'; c.fillText(title, -cw / 2 + 210, -14); c.fillStyle = '#3a3e48'; c.font = '700 34px Poppins'; c.fillText(l1, -cw / 2 + 210, 40); }); });
    x.globalAlpha = 1; }
}
