// =====================================================================================================
// 2D OVERLAYS
// =====================================================================================================
const OV = document.getElementById('ov').getContext('2d', { willReadFrequently: true }); // software canvas: an accelerated one can skip presenting a cleared frame on headless swiftshader (stale cards in chunk renders)
function card2d(x, cx, cy, w, h, rot, sc, draw) { x.save(); x.translate(cx, cy); x.rotate(rot); x.scale(sc, sc); x.fillStyle = 'rgba(0,0,0,.35)'; x.beginPath(); x.roundRect(-w / 2 + 10, -h / 2 + 14, w, h, 22); x.fill(); draw(x, w, h); x.restore(); }
const pop = (t, t0) => { const a = clamp((t - t0) / 0.22); return a <= 0 ? 0 : 1 + 0.12 * Math.sin(a * Math.PI); };
function paper(c, cw, ch, col = '#f4efe4') { c.fillStyle = col; c.beginPath(); c.roundRect(-cw / 2, -ch / 2, cw, ch, 24); c.fill(); c.lineWidth = 8; c.strokeStyle = '#0e0b16'; c.stroke(); }
function stamp(x, t, t0, text, col, cx, cy, rot = -0.12, size = 120) { const s = pop(t, t0); if (!s) return; x.save(); x.translate(cx, cy); x.rotate(rot); x.scale(s * (1 + 0.6 * Math.exp(-(t - t0) * 12)), s * (1 + 0.6 * Math.exp(-(t - t0) * 12))); x.font = `900 ${size}px Poppins`; x.textAlign = 'center'; x.textBaseline = 'middle'; const w = x.measureText(text).width + 60;
  x.fillStyle = 'rgba(244,239,228,.92)'; x.fillRect(-w / 2, -size * 0.62, w, size * 1.24); x.lineWidth = 14; x.strokeStyle = col; x.strokeRect(-w / 2, -size * 0.62, w, size * 1.24); x.fillStyle = col; x.fillText(text, 0, 6); x.restore(); x.textBaseline = 'alphabetic'; }
function gauge(c, hz) { // a speed dial: 0..1500 Hz, red zone past 1210
  const a0 = Math.PI * 0.8, a1 = Math.PI * 2.2, A = v => a0 + (a1 - a0) * clamp(v / 1500); c.lineWidth = 34; c.strokeStyle = '#c9ccd6'; c.beginPath(); c.arc(0, 40, 170, a0, a1); c.stroke(); c.strokeStyle = '#3fae5a'; c.beginPath(); c.arc(0, 40, 170, A(807), A(1210)); c.stroke(); c.strokeStyle = '#d7263d'; c.beginPath(); c.arc(0, 40, 170, A(1210), a1); c.stroke();
  const a = A(hz); c.lineWidth = 12; c.strokeStyle = '#0e0b16'; c.beginPath(); c.moveTo(0, 40); c.lineTo(Math.cos(a) * 150, 40 + Math.sin(a) * 150); c.stroke(); c.fillStyle = '#0e0b16'; c.beginPath(); c.arc(0, 40, 20, 0, 7); c.fill();
  c.textAlign = 'center'; c.fillStyle = hz > 1210 || hz < 807 ? '#d7263d' : '#3fae5a'; c.font = '900 76px Poppins'; c.fillText(Math.round(hz).toLocaleString('en-US') + ' Hz', 0, 170); c.textAlign = 'left'; }
function overlays2d(t) { const x = OV; x.clearRect(0, 0, W, H); x.fillStyle = 'rgba(0,0,0,0.004)'; x.fillRect(0, 0, 2, 2); x.textAlign = 'left'; x.textBaseline = 'alphabetic';
  // beat 3: stamps
  if (inB(t, 3) && t > WT(3, 'spent') - 0.1 && t < WT(3, 'And')) stamp(x, t, WT(3, 'spent') - 0.1, '4 ZERO-DAYS', '#d7263d', 540, 1480, -0.1, 100);
  // beat 7: the speed dial (rotor frequency)
  if (inB(t, 7) && t > WT(7, 'pushed') - 0.3) { const s = pop(t, WT(7, 'pushed') - 0.3), { hz } = attackAt(t); card2d(x, 540, 640, 760, 680, -0.02, s, (c, cw, ch) => { paper(c, cw, ch); c.textAlign = 'center'; c.fillStyle = '#0e0b16'; c.font = '900 40px Poppins'; c.fillText('ROTOR SPEED', 0, -200); c.textAlign = 'left'; gauge(c, hz); }); }
  // beat 8: the 21-second loop
  if (inB(t, 8) && t > WT(8, 'twentyone') - 0.2 && t < WT(8, 'fine') - 0.4) { const s = pop(t, WT(8, 'twentyone') - 0.2); card2d(x, 540, 680, 760, 440, 0.02, s, (c, cw, ch) => { paper(c, cw, ch, '#14121a');
    const rec = t < WT(8, 'During') - 0.1; c.textAlign = 'center'; c.fillStyle = rec ? '#ff3b4a' : '#3ff07a'; c.font = '900 56px Poppins'; c.fillText(rec ? '● REC' : '⟲ REPLAY', 0, -110);
    const sec = rec ? clamp((t - WT(8, 'twentyone') + 0.2) / 1.8) * 21 : ((t * 9) % 21); c.fillStyle = '#ffffff'; c.font = '900 120px monospace'; c.fillText('00:' + String(Math.floor(sec)).padStart(2, '0'), 0, 40);
    c.fillStyle = '#9aa2b0'; c.font = '800 34px Poppins'; c.fillText(rec ? 'NORMAL SENSOR READINGS' : 'ON A LOOP, DURING THE ATTACK', 0, 130); c.textAlign = 'left'; }); }
  // beat 9: one in nine
  if (inB(t, 9) && t > WT(9, 'estimated') - 0.2) { const s = pop(t, WT(9, 'estimated') - 0.2), k = sstep(WT(9, 'thousand') - 0.2, WT(9, 'service'), t); card2d(x, 540, 700, 900, 560, 0.02, s, (c, cw, ch) => { paper(c, cw, ch);
    for (let i = 0; i < 9; i++) { const bx = -360 + i * 90, red = i === 4 && k > 0.5; c.fillStyle = red ? '#d7263d' : '#dfe3ea'; c.beginPath(); c.roundRect(bx - 26, -190, 52, 200, 18); c.fill(); c.lineWidth = 6; c.strokeStyle = '#0e0b16'; c.stroke(); c.fillStyle = red ? '#ffcf3f' : '#2f7fe0'; c.fillRect(bx - 26, -150, 52, 16); }
    c.textAlign = 'center'; c.fillStyle = '#d7263d'; c.font = '900 84px Poppins'; c.fillText('~' + Math.round(1000 * k).toLocaleString('en-US'), -170, 130); c.fillStyle = '#0e0b16'; c.font = '900 56px Poppins'; c.fillText('OUT OF', 90, 120); c.fillText('~9,000', 300, 120);
    c.fillStyle = '#5a5e70'; c.font = '800 32px Poppins'; c.fillText('ESTIMATE · INSTITUTE FOR SCIENCE AND', 0, 200); c.fillText('INTERNATIONAL SECURITY, DEC 2010', 0, 240); c.textAlign = 'left'; }); }
  // beat 4: the infection count
  if (inB(t, 4) && t > WT(4, 'By') - 0.15) { const s = pop(t, WT(4, 'By') - 0.15), k = sstep(WT(4, 'infected') - 0.3, WT(4, 'computers') + 0.2, t), ik = sstep(WT(4, 'sixty') - 0.2, WT(4, 'Iran') + 0.2, t);
    card2d(x, 540, 640, 900, 470, -0.02, s, (c, cw, ch) => { paper(c, cw, ch, '#14121a'); c.textAlign = 'center'; c.fillStyle = '#9aa2b0'; c.font = '800 36px Poppins'; c.fillText('INFECTED COMPUTERS · SEPT 2010', 0, -150); c.fillStyle = '#ffcf3f'; c.font = '900 130px Poppins'; c.fillText('~' + (Math.round(100 * k) * 1000).toLocaleString('en-US'), 0, -20);
      c.fillStyle = '#2a3150'; c.fillRect(-380, 40, 760, 64); c.fillStyle = '#ff3b4a'; c.fillRect(-380, 40, 760 * 0.58 * ik, 64); c.fillStyle = '#ffcf3f'; if (ik > 0) c.fillRect(-380 + 760 * 0.58 * ik, 40, 760 * (1 - 0.58 * ik), 64);
      c.font = '900 44px Poppins'; c.textAlign = 'left'; c.fillStyle = '#ff3b4a'; if (ik > 0.3) c.fillText('IRAN ~60%', -380, 170); c.textAlign = 'right'; c.fillStyle = '#ffcf3f'; if (ik > 0.3) c.fillText('THE REST', 380, 170); c.textAlign = 'left'; }); }
  // beat 5: the target profile
  if (inB(t, 5) && t > WT(5, 'Siemens') - 0.2) { const s = pop(t, WT(5, 'Siemens') - 0.2); card2d(x, 540, 660, 920, 600, 0.02, s, (c, cw, ch) => { paper(c, cw, ch); c.textAlign = 'center';
    c.fillStyle = '#d7263d'; c.font = '900 40px Poppins'; c.fillText('WHAT IT WAS HUNTING FOR', 0, -225);
    const box = (bx, by, bw, bh, col, s1, s2, on) => { if (!on) return; c.fillStyle = col; c.beginPath(); c.roundRect(bx - bw / 2, by - bh / 2, bw, bh, 18); c.fill(); c.lineWidth = 6; c.strokeStyle = '#0e0b16'; c.stroke(); c.fillStyle = '#fff'; c.font = '900 40px Poppins'; c.fillText(s1, bx, by - 4); c.font = '800 28px Poppins'; c.fillText(s2, bx, by + 36); };
    box(0, -110, 520, 120, '#3a6fb0', 'CONTROLLER', 'made by Siemens', true); const w1 = t > WT(5, 'wired') - 0.2; if (w1) { c.strokeStyle = '#0e0b16'; c.lineWidth = 8; c.beginPath(); c.moveTo(0, -50); c.lineTo(0, -10); c.lineTo(-210, -10); c.lineTo(-210, 40); c.moveTo(0, -10); c.lineTo(210, -10); c.lineTo(210, 40); c.stroke(); }
    box(-210, 110, 360, 130, '#2f9a5a', 'MOTOR DRIVES', 'maker in FINLAND', t > WT(5, 'One', 3) - 0.15); box(210, 110, 360, 130, '#d7263d', 'MOTOR DRIVES', 'maker in IRAN', t > WT(5, 'One', 4) - 0.15);
    if (w1) { c.fillStyle = '#5a5e70'; c.font = '800 30px Poppins'; c.fillText('spinning at 807 to 1,210 Hz', 0, 245); } c.textAlign = 'left'; }); }
  // beat 10: the newspaper report
  if (inB(t, 10) && t > WT(10, 'New') - 0.15 && t < WT(10, 'Olympic') - 0.3) { const s = pop(t, WT(10, 'New') - 0.15); card2d(x, 540, 640, 900, 520, -0.02, s, (c, cw, ch) => { paper(c, cw, ch, '#f8f5ee'); c.textAlign = 'center'; c.fillStyle = '#14121a'; c.font = '900 36px Georgia, serif'; c.fillText('THE NEW YORK TIMES · 1 JUNE 2012', 0, -190); c.fillRect(-380, -170, 760, 5);
    c.font = '900 64px Poppins'; c.fillText('A SECRET U.S.', 0, -80); c.fillText('AND ISRAELI', 0, -10); c.fillText('OPERATION', 0, 60); c.fillStyle = '#c9ccd6'; for (let i = 0; i < 3; i++) c.fillRect(-330, 110 + i * 34, 660 - (i * 91 % 160), 14); c.textAlign = 'left'; }); }
  // beat 10: the code name + nobody admits it
  if (inB(t, 10) && t > WT(10, 'Neither') - 0.1) stamp(x, t, WT(10, 'Neither') - 0.1, 'NEVER CONFIRMED', '#d7263d', 540, 760, -0.1, 84);
  // beat 13: the lesson
  if (inB(t, 13) && t > WT(13, "don't") - 0.15 && t < WT(13, 'Follow') + 0.3) { const fade = 1 - clamp((t - WT(13, 'Follow')) / 0.3); x.globalAlpha = fade;
    const tips = [["don't", 'FOUND A USB STICK?', "don't plug it in. Hand it", 'in or throw it away.', '#d7263d'], ['install', 'INSTALL YOUR UPDATES', "they close holes like", "Stuxnet's zero-days.", '#3fae5a']];
    tips.forEach(([w, title, l1, l2, col], i) => { const s = pop(t, WT(13, w) - 0.15); if (!s) return; card2d(x, 540, 560 + i * 290, 920, 250, (i % 2 ? 1 : -1) * 0.025, s, (c, cw, ch) => { paper(c, cw, ch);
      c.fillStyle = col; c.beginPath(); c.arc(-cw / 2 + 115, 0, 72, 0, 7); c.fill(); c.lineWidth = 7; c.strokeStyle = '#0e0b16'; c.stroke(); c.fillStyle = '#fff'; c.strokeStyle = '#fff'; c.lineWidth = 12;
      if (i === 0) { c.fillRect(-cw / 2 + 80, -16, 50, 32); c.fillRect(-cw / 2 + 130, -10, 24, 20); c.beginPath(); c.moveTo(-cw / 2 + 70, -50); c.lineTo(-cw / 2 + 160, 50); c.stroke(); }
      else { c.beginPath(); c.arc(-cw / 2 + 115, 0, 36, -2.6, 1.9); c.stroke(); c.beginPath(); c.moveTo(-cw / 2 + 140, -40); c.lineTo(-cw / 2 + 98, -38); c.lineTo(-cw / 2 + 114, -6); c.closePath(); c.fill(); }
      c.fillStyle = '#0e0b16'; c.font = '900 48px Poppins'; c.fillText(title, -cw / 2 + 220, -34); c.fillStyle = '#3a3e48'; c.font = '700 36px Poppins'; c.fillText(l1, -cw / 2 + 220, 22); c.fillText(l2, -cw / 2 + 220, 68); }); });
    x.globalAlpha = 1; }
}
