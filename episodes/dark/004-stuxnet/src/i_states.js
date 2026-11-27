// ---------- screens ----------
const mono = (x, size, col) => { x.font = `700 ${size}px monospace`; x.fillStyle = col; };
function scan(x, w, h) { x.fillStyle = 'rgba(255,255,255,.035)'; for (let y = 0; y < h; y += 4) x.fillRect(0, y, w, 1); }
function hexRows(x, t, n, y0, dy, col, seed = 0) { mono(x, 24, col); const s = Math.floor(t * 6); for (let i = 0; i < n; i++) { const r = rng(seed + s + i * 7); let line = (0x40100 + (s + i) * 16).toString(16).padStart(8, '0') + '  '; for (let j = 0; j < 12; j++) line += Math.floor(r() * 256).toString(16).padStart(2, '0') + ' '; x.fillText(line, 24, y0 + i * dy); } }
function padlock(x, cx, cy, s, open, col) { x.save(); x.translate(cx, cy); x.scale(s, s); x.lineWidth = 14; x.strokeStyle = '#e8e2d6'; x.beginPath(); x.arc(0, -40 - open * 26, 34, Math.PI, 0); x.lineTo(34, -40 - open * 26 + (open ? -8 : 0)); x.stroke(); x.fillStyle = col; x.beginPath(); x.roundRect(-52, -40, 104, 84, 14); x.fill(); x.fillStyle = '#14121a'; x.beginPath(); x.arc(0, -6, 10, 0, 7); x.fill(); x.fillRect(-4, -6, 8, 24); x.restore(); }
function drawLab(x, w, h, t, mode, k = 1) {
  if (mode === 'reboot') { x.fillStyle = '#1a3fa8'; x.fillRect(0, 0, w, h); x.fillStyle = '#fff'; x.font = '900 56px Poppins'; x.textAlign = 'center'; x.fillText('SYSTEM RESTARTING…', w / 2, 210);
    const cyc = (t * 0.7) % 1; x.fillStyle = 'rgba(255,255,255,.25)'; x.fillRect(212, 280, 600, 34); x.fillStyle = '#fff'; x.fillRect(212, 280, 600 * cyc, 34); x.font = '800 40px Poppins'; x.fillText('REPORT FROM A CLIENT IN IRAN', w / 2, 420); x.fillStyle = '#ffcf3f'; x.font = '900 64px Poppins'; x.fillText('REBOOT #' + (31 + Math.floor(t * 0.7)), w / 2, 520); x.textAlign = 'left'; scan(x, w, h); return; }
  x.fillStyle = '#0b1020'; x.fillRect(0, 0, w, h); x.fillStyle = '#2f9a8a'; x.fillRect(0, 0, w, 58); x.fillStyle = '#fff'; x.font = '900 32px Poppins'; x.textAlign = 'left'; x.fillText('MALWARE ANALYSIS · SAMPLE 0x5A', 22, 40);
  if (mode === 'code') { hexRows(x, t, 13, 110, 40, '#3ff07a', 3); if (k > 0) { x.fillStyle = `rgba(215,38,61,${0.85 * clamp(k * 3)})`; x.fillRect(0, 230, w, 150); x.fillStyle = '#fff'; x.font = '900 60px Poppins'; x.textAlign = 'center'; x.fillText('UNKNOWN WORM', w / 2, 300); x.font = '800 34px Poppins'; x.fillText('spreads via USB drives', w / 2, 352); x.textAlign = 'left'; } }
  if (mode === 'zero') { const names = ['SHORTCUT ICONS', 'PRINT SPOOLER', 'TASK SCHEDULER', 'KEYBOARD LAYOUT']; x.fillStyle = '#ff3b4a'; x.font = '900 44px Poppins'; x.textAlign = 'center'; x.fillText('4 UNPATCHED WINDOWS HOLES', w / 2, 120);
    names.forEach((n, i) => { const o = clamp(k * 4 - i); padlock(x, 140 + i * 248, 330, 1.2, o, o > 0.5 ? '#ff3b4a' : '#3fae5a'); x.fillStyle = '#e8e2d6'; x.font = '800 24px Poppins'; x.fillText(n, 140 + i * 248, 470); x.fillStyle = o > 0.5 ? '#ff3b4a' : '#7a8290'; x.font = '900 30px Poppins'; x.fillText(o > 0.5 ? 'ZERO-DAY' : 'LOCKED', 140 + i * 248, 520); }); x.textAlign = 'left'; }
  if (mode === 'cert') { x.fillStyle = '#f4efe4'; x.beginPath(); x.roundRect(140, 90, w - 280, h - 140, 20); x.fill(); x.strokeStyle = '#c9932a'; x.lineWidth = 12; x.stroke(); x.fillStyle = '#14121a'; x.textAlign = 'center'; x.font = '900 52px Poppins'; x.fillText('DIGITAL CERTIFICATE', w / 2, 180);
    x.font = '700 30px Poppins'; x.fillText('Issued to: a hardware maker, Taiwan', w / 2, 250); x.fillStyle = '#3fae5a'; x.font = '900 48px Poppins'; x.fillText('✔ SIGNATURE VALID', w / 2, 340); x.fillStyle = '#c9932a'; x.beginPath(); x.arc(w - 250, 460, 56, 0, 7); x.fill(); x.textAlign = 'left';
    if (k > 0) { x.save(); x.translate(w / 2, 450); x.rotate(-0.12); const s = 1 + 0.5 * Math.exp(-k * 8); x.scale(s, s); x.strokeStyle = '#d7263d'; x.lineWidth = 12; x.strokeRect(-200, -50, 400, 100); x.fillStyle = '#d7263d'; x.font = '900 76px Poppins'; x.textAlign = 'center'; x.fillText('STOLEN', 0, 28); x.restore(); x.textAlign = 'left'; } }
  scan(x, w, h); }
function drawDrive(x, w, h, hz) { x.fillStyle = '#0e2a18'; x.fillRect(0, 0, w, h); const hot = hz > 1250 || hz < 400; x.fillStyle = hot ? '#ff6a4a' : '#5fff8a'; x.font = '900 72px monospace'; x.textAlign = 'right'; x.fillText(String(Math.round(hz)), w - 70, 92); x.font = '900 34px monospace'; x.fillText('Hz', w - 14, 92); x.textAlign = 'left'; scan(x, w, h); }
function drawCtrl(x, w, h, t) { x.fillStyle = '#e9eef4'; x.fillRect(0, 0, w, h); x.fillStyle = '#2f6f8a'; x.fillRect(0, 0, w, 52); x.fillStyle = '#fff'; x.font = '800 28px Poppins'; x.fillText('CASCADE A · STATUS', 16, 36);
  for (let i = 0; i < 4; i++) { const cx = 70 + i * 150; x.fillStyle = '#ffffff'; x.fillRect(cx - 40, 90, 80, 170); x.strokeStyle = '#2f6f8a'; x.lineWidth = 4; x.strokeRect(cx - 40, 90, 80, 170); x.fillStyle = '#3fae5a'; x.beginPath(); x.arc(cx, 120, 14, 0, 7); x.fill(); x.fillStyle = '#14121a'; x.font = '800 22px monospace'; x.textAlign = 'center'; x.fillText('1064', cx, 200); x.fillText('Hz', cx, 230); x.textAlign = 'left'; }
  x.fillStyle = '#3fae5a'; x.fillRect(16, 300, w - 32, 76); x.fillStyle = '#fff'; x.font = '900 46px Poppins'; x.textAlign = 'center'; x.fillText('✔ ALL NORMAL', w / 2, 354); x.textAlign = 'left'; }
function drawMimic(x, w, h, t) { x.fillStyle = '#0f1a2a'; x.fillRect(0, 0, w, h); x.fillStyle = '#fff'; x.font = '900 40px Poppins'; x.fillText('ENRICHMENT HALL · LIVE', 30, 56);
  for (let j = 0; j < 4; j++) for (let i = 0; i < 18; i++) { x.fillStyle = '#3fae5a'; x.fillRect(40 + i * 52, 110 + j * 92, 36, 60); } x.strokeStyle = '#5fd0ff'; x.lineWidth = 4; for (let j = 0; j < 4; j++) { x.beginPath(); x.moveTo(30, 100 + j * 92); x.lineTo(w - 30, 100 + j * 92); x.stroke(); }
  x.strokeStyle = '#3ff07a'; x.lineWidth = 5; x.beginPath(); for (let i = 0; i <= 60; i++) { const u = i / 60; x.lineTo(40 + u * (w - 80), 520 + Math.sin(u * 30 + t * 0.5) * 4); } x.stroke(); x.fillStyle = '#3ff07a'; x.font = '800 30px Poppins'; x.fillText('PRESSURE  NORMAL      SPEED  NORMAL', 40, 580); }
function drawLaptop(x, w, h, t, mode, k = 0) { x.fillStyle = '#e8ecf2'; x.fillRect(0, 0, w, h); x.fillStyle = '#1f6f8a'; x.fillRect(0, 0, w, 40); x.fillStyle = '#fff'; x.font = '800 24px Poppins'; x.fillText('CONTROLLER PROJECT', 12, 28);
  x.fillStyle = '#c9d2de'; x.fillRect(0, 40, 150, h - 40); mono(x, 18, '#14121a'); ['PLC 1', ' ├ OB1', ' ├ OB35', ' ├ FC1869', ' └ DB890'].forEach((s, i) => x.fillText(s, 10, 70 + i * 26));
  mono(x, 18, '#2f6fe0'); for (let i = 0; i < 9; i++) { const r = rng(i + Math.floor(t * 2)); x.fillText(['L', 'T', 'A', 'JC', 'CALL'][Math.floor(r() * 5)] + '  ' + ['DB890.DBW' + Math.floor(r() * 99), 'M ' + Math.floor(r() * 9) + '.' + Math.floor(r() * 8), 'FC ' + Math.floor(r() * 2000)][Math.floor(r() * 3)], 170, 70 + i * 28); }
  if (mode === 'usb') { x.fillStyle = 'rgba(215,38,61,.92)'; x.fillRect(150, h - 110, w - 150, 110); x.fillStyle = '#fff'; x.font = '900 30px Poppins'; x.fillText('USB DRIVE CONNECTED', 170, h - 66); x.font = '700 22px Poppins'; x.fillText('opening folder…', 170, h - 30); } }
function drawMap(t, o) { const x = SCR.map.x; x.drawImage(MAPBASE, 0, 0);
  if (o.iran) { x.beginPath(); IRAN.forEach(([lo, la], i) => i ? x.lineTo(mx(lo), my(la)) : x.moveTo(mx(lo), my(la))); x.closePath(); x.fillStyle = `rgba(255,59,74,${0.75 * o.iran})`; x.fill(); x.lineWidth = 6; x.strokeStyle = `rgba(255,220,220,${o.iran})`; x.stroke(); }
  const n = Math.floor(INF.length * (o.inf || 0)); for (let i = 0; i < n; i++) { const d = INF[i], pul = 0.7 + 0.3 * Math.sin(t * 4 + i); x.fillStyle = d.iran ? `rgba(255,80,90,${pul})` : `rgba(255,207,63,${pul})`; x.beginPath(); x.arc(mx(d.lo), my(d.la), d.iran ? 7 : 8, 0, 7); x.fill(); }
  for (const a of o.arcs || []) { const [p, q, k, col] = a; if (k <= 0) continue; const ax = mx(p[0]), ay = my(p[1]), bx = mx(q[0]), by = my(q[1]), mx2 = (ax + bx) / 2, my2 = Math.min(ay, by) - Math.hypot(bx - ax, by - ay) * 0.25; x.strokeStyle = col; x.lineWidth = 7; x.setLineDash([22, 14]); x.lineDashOffset = -t * 60; x.beginPath(); const N = 40; for (let i = 0; i <= N * k; i++) { const u = i / N; x.lineTo((1 - u) * (1 - u) * ax + 2 * (1 - u) * u * mx2 + u * u * bx, (1 - u) * (1 - u) * ay + 2 * (1 - u) * u * my2 + u * u * by); } x.stroke(); x.setLineDash([]); }
  if (o.ring) { const [lo, la] = o.ring; const r = 30 + ((t * 1.2) % 1) * 90; x.strokeStyle = `rgba(255,59,74,${1 - ((t * 1.2) % 1)})`; x.lineWidth = 8; x.beginPath(); x.arc(mx(lo), my(la), r, 0, 7); x.stroke(); }
  SCR.map.t.needsUpdate = true; }
function drawOpsWall(x, w, h, t, mode, k = 1) { x.fillStyle = '#0b1020'; x.fillRect(0, 0, w, h); x.fillStyle = '#5f2fd0'; x.fillRect(0, 0, w, 54); x.fillStyle = '#fff'; x.font = '900 32px Poppins'; x.textAlign = 'left';
  if (mode === 'count') { x.fillText('INFECTED COMPUTERS · SEPTEMBER 2010', 20, 38); x.textAlign = 'center'; x.fillStyle = '#ffcf3f'; x.font = '900 130px Poppins'; x.fillText(Math.floor(100000 * k).toLocaleString('en-US'), w / 2, 230);
    const ik = clamp((k - 0.999) * 1000) * (mode === 'count' ? 1 : 0); const sh = 0.58; x.fillStyle = '#2a3150'; x.fillRect(80, 320, w - 160, 70); x.fillStyle = '#ff3b4a'; x.fillRect(80, 320, (w - 160) * sh * clamp(k), 70); x.fillStyle = '#ffcf3f'; x.fillRect(80 + (w - 160) * sh * clamp(k), 320, (w - 160) * (1 - sh) * clamp(k), 70);
    x.font = '900 40px Poppins'; x.fillStyle = '#ff3b4a'; x.textAlign = 'left'; x.fillText('IRAN ~60%', 80, 450); x.fillStyle = '#ffcf3f'; x.textAlign = 'right'; x.fillText('REST OF WORLD', w - 80, 450); x.textAlign = 'left'; }
  if (mode === 'target') { x.fillText('PAYLOAD TARGET PROFILE', 20, 38); const box = (bx, by, bw, bh, col, s1, s2) => { x.fillStyle = col; x.beginPath(); x.roundRect(bx, by, bw, bh, 16); x.fill(); x.fillStyle = '#fff'; x.textAlign = 'center'; x.font = '900 34px Poppins'; x.fillText(s1, bx + bw / 2, by + bh / 2); x.font = '700 24px Poppins'; x.fillText(s2, bx + bw / 2, by + bh / 2 + 34); x.textAlign = 'left'; };
    box(330, 90, 360, 130, '#3a6fb0', 'CONTROLLER', 'Siemens'); x.strokeStyle = '#e8e2d6'; x.lineWidth = 6; x.beginPath(); x.moveTo(510, 220); x.lineTo(510, 260); x.lineTo(250, 260); x.lineTo(250, 300); x.moveTo(510, 260); x.lineTo(770, 260); x.lineTo(770, 300); x.stroke();
    if (k > 0.3) box(90, 300, 320, 130, '#2f9a5a', 'DRIVE MAKER 1', 'FINLAND'); if (k > 0.7) box(610, 300, 320, 130, '#d7263d', 'DRIVE MAKER 2', 'IRAN');
    x.strokeStyle = '#ff3b4a'; x.lineWidth = 6; const r = 40 + Math.sin(t * 4) * 6; x.beginPath(); x.arc(510, 155, r + 60, 0, 7); x.stroke(); x.beginPath(); x.moveTo(510, 155 - r - 90); x.lineTo(510, 155 - r - 30); x.stroke(); }
  if (mode === 'spread') { x.fillText('SPREAD', 20, 38); x.drawImage(MAPBASE, 0, 60, w, h - 60); }
  if (mode === 'code') { x.fillText('DISASSEMBLY', 20, 38); hexRows(x, t, 11, 100, 36, '#5fd0ff', 9); }
  if (mode === 'times') { x.fillStyle = '#f4f1ea'; x.fillRect(0, 54, w, h - 54); x.fillStyle = '#14121a'; x.font = '900 36px Georgia, serif'; x.textAlign = 'center'; x.fillText('NEWSPAPER REPORT · 1 JUNE 2012', w / 2, 110); x.fillRect(60, 130, w - 120, 4); x.font = '900 64px Poppins'; x.fillText('SECRET CYBERATTACKS', w / 2, 230); x.fillText('ON IRAN', w / 2, 300); x.fillStyle = '#c9ccd6'; for (let i = 0; i < 4; i++) x.fillRect(100, 350 + i * 34, w - 200 - (i * 63 % 140), 14); x.textAlign = 'left'; }
  scan(x, w, h); }
function drawSide(x, w, h, t) { x.fillStyle = '#0b1020'; x.fillRect(0, 0, w, h); x.strokeStyle = '#3ff0ff'; x.lineWidth = 5; x.beginPath(); for (let i = 0; i <= 50; i++) { const u = i / 50; x.lineTo(20 + u * (w - 40), 140 + Math.sin(u * 12 + t) * 40 + Math.sin(u * 31 + t * 2) * 15); } x.stroke(); x.fillStyle = '#ff4fd8'; for (let i = 0; i < 8; i++) { const v = 0.3 + 0.6 * Math.abs(Math.sin(t * 0.7 + i)); x.fillRect(30 + i * 58, h - 40 - v * 230, 40, v * 230); } scan(x, w, h); }

// =====================================================================================================
// WORLD STATES
// =====================================================================================================
const isHook = t => t < HOOK_END + RW;
function labState(t) { const U = LAB.userData; for (const k of Object.keys(LCARD)) hideCard(LCARD[k]);
  U.leds.forEach(l => l.material.color.set(Math.sin(t * 7 + l.userData.ph * 3) > 0.2 ? (l.userData.ph % 2 > 1 ? '#3ff07a' : '#ffb03f') : '#1a2a1a'));
  // the phone rings in beat 1 (shakes), Ulasen picks up at "strange"
  const ring = inB(t, 1) && t > WT(1, 'tiny') && t < WT(1, 'strange') - 0.1; U.phone.position.x = 0.7 + (ring ? Math.sin(t * 60) * 0.006 : 0); U.ringGlow.material.opacity = 0; U.ringArcs.forEach(a => { a.visible = false; });
  const lift = inB(t, 1) && t >= WT(1, 'strange') - 0.1; U.handset.position.set(lift ? -10 : 0.075, 0.075, 0);
  if (inBs(t, 1, 2, 3)) { let expr = 'neutral', armR = [1.0, 1.4], armL = [1.0, 1.4];
    if (inB(t, 1)) { if (lift) { armR = [2.7, 2.2]; expr = t > WT(1, 'Iran') ? 'shocked' : 'neutral'; } else expr = 'happy'; }
    if (inB(t, 2)) { expr = t > WT(2, 'finds') ? (t > WT(2, 'spreads') ? 'angry' : 'shocked') : 'neutral'; if (t > WT(2, 'spreads') - 0.2 && t < WT(2, 'Just')) armL = [2.3, 0.8]; }
    if (inB(t, 3)) { expr = t > WT(3, 'spent') ? 'shocked' : 'annoyed'; if (t > WT(3, 'stolen')) expr = 'angry'; }
    showCard(LCARD.ul, V(0.1, 0, -0.1), { sit: 1, expr, armR, armL, talk: inB(t, 1) && lift && Math.sin(t * 13) > 0.3 ? 0.4 : 0, sweat: inB(t, 3) ? 0.5 : 0, blink: blinkAt(t) });
    showCard(LCARD.mate, V(-3.25, 0, 1.3), { sit: 1, expr: inB(t, 3) && t > WT(3, 'four', 2) ? 'shocked' : 'neutral', armR: [1.0, 1.4 + Math.sin(t * 9) * 0.1], armL: [1.0, 1.4], blink: blinkAt(t, 1) }); }
  // the desk stick blinks; the floor stick for the ending
  const sb = Math.sin(t * 9) > 0; U.stick.userData.led.material.color.set(sb ? '#5fd0ff' : '#14304a'); U.stick.userData.glow.material.opacity = inB(t, 2) && t > WT(2, 'U') - 0.3 && sb ? 0.8 : 0; U.stick.userData.glow.scale.setScalar(0.12);
  U.floorStick.visible = inB(t, 13); U.floorStick.userData.glow.material.opacity = 0;
  if (inB(t, 13)) { const w = walkAlong([V(3.6, 0, 3.3), V(2.4, 0, 2.6)], VB(13) + 0.2, t, 1.2); const ex = t > WT(13, "don't") - 0.1 ? 'shocked' : (t > WT(13, 'find') ? 'delighted' : 'neutral');
    showCard(LCARD.finder, w.p, { walk: w.walking ? t * 3 : 0, expr: ex, armR: t > WT(13, 'find') && t < WT(13, "don't") ? [0.8, 1.4] : [0.2, 0.2], armL: [0.2, 0.2], lean: !w.walking && t < WT(13, "don't") ? -0.08 : 0, blink: blinkAt(t) }); LCARD.finder.spin = 0; }
  // the big wall screen
  let mode = 'code', k = 0; if (inB(t, 1)) mode = t > WT(1, 'Computers') - 0.2 ? 'reboot' : 'code'; else if (inB(t, 2)) { mode = 'code'; k = t > WT(2, 'worm') - 0.2 ? clamp((t - WT(2, 'worm') + 0.2) / 0.4) : 0; }
  else if (inB(t, 3)) { if (t < WT(3, 'And')) { mode = 'zero'; k = sstep(WT(3, 'four') - 0.2, WT(3, 'zerodays') + 0.6, t); if (t > WT(3, 'spent')) k = 1; } else { mode = 'cert'; k = t > WT(3, 'stolen') - 0.1 ? clamp((t - WT(3, 'stolen') + 0.1) / 0.6) : 0; } }
  else if (inB(t, 13)) mode = 'code', k = 0;
  drawLab(SCR.lab.x, 1024, 650, t, mode, k); SCR.lab.t.needsUpdate = true; U.scrL.color.set(mode === 'reboot' ? '#4a6fff' : mode === 'zero' && k > 0.5 ? '#ff4a5a' : '#5fd0ff');
}
// centrifuge wobble amount (0 calm .. 1 violent) and drive frequency by world time
function attackAt(t) { let a = 0.03, hz = 1064, slow = false;
  if (isHook(t)) { const b = WT(0, 'apart'); a = 0.25 + 0.75 * sstep(WT(0, 'spun'), b, t); hz = 1410; if (t > b + 0.4) a = 0.5 * Math.exp(-(t - b - 0.4) * 0.8) + 0.15; }
  else if (inB(t, 7)) { const p = WT(7, 'pushed'), d = WT(7, 'dropped'), g = WT(7, 'again'); if (t > p) { hz = lerp(1064, 1410, sstep(p, p + 1.2, t)); a = lerp(0.03, 0.55, sstep(p, p + 1.4, t)); }
    if (t > d - 0.3) { hz = lerp(1410, 2, sstep(d - 0.3, d + 1.0, t)); a = lerp(0.55, 0.9, sstep(d - 0.3, d + 0.8, t)); slow = true; } if (t > g - 0.4) { hz = lerp(2, 1410, sstep(g - 0.4, g + 0.6, t)); a = 0.7; slow = false; } }
  else if (inB(t, 8)) { hz = 1410; a = 0.6 + 0.4 * sstep(WT(8, 'During'), WT(8, 'fine'), t); }
  return { a, hz, slow }; }
const burstTime = t => isHook(t) ? WT(0, 'apart') - 0.15 : WT(8, 'fine') - 0.1;
function hallState(t) { const U = HALL.userData; for (const k of Object.keys(HCARD)) hideCard(HCARD[k]);
  const { a, hz, slow } = attackAt(t); const d = new THREE.Object3D();
  CF.rows.forEach((c, i) => { const near = 1 - clamp((Math.abs(c.x + 4.6) + Math.max(0, 3 - c.z) * 0.15) / 14); const amp = (slow ? 0.045 : 0.03) * a * c.amp * (0.5 + 0.8 * near) + 0.0012; const w = slow ? 2.2 : c.w * 2.2; d.position.set(c.x, 0.06, c.z); d.rotation.set(Math.sin(t * w + c.ph) * amp, 0, Math.cos(t * w + c.ph) * amp); d.updateMatrix(); U.cfMeshes.forEach(m => m.setMatrixAt(i, d.matrix)); });
  U.cfMeshes.forEach(m => { m.instanceMatrix.needsUpdate = true; });
  // the hero centrifuge: wobbles hard, then bursts; gone (removed) from beat 9 on
  const tb = burstTime(t), gone = !isHook(t) && t >= VB(9) + 1.6; U.hero.visible = !gone; const bk = clamp((t - tb) / 1.6), burst = t >= tb && (isHook(t) || inB(t, 8) || (inB(t, 9) && t < VB(9) + 1.6));
  const ha = (slow ? 0.06 : 0.04) * a + 0.002; U.hero.rotation.set(burst ? 0 : Math.sin(t * 15) * ha, 0, burst ? 0 : Math.cos(t * 15) * ha);
  U.shards.forEach((s, i) => { const ang = i * Math.PI / 3 + Math.PI / 6; if (!burst) { s.position.set(0, 0.89, 0); s.rotation.set(0, 0, 0); return; } const tt = Math.min(t - tb, 1.4), v = 2.2 + (i % 3) * 0.6;
    s.position.set(Math.cos(ang) * v * tt * 0.6, Math.max(0.15 - 0.74, 0.89 + 1.6 * tt - 4.9 * tt * tt) , -Math.sin(ang) * v * tt * 0.6); s.position.y = Math.max(0.13, s.position.y); s.rotation.set(-Math.sin(ang) * tt * 3, 0, Math.cos(ang) * tt * 3 + (s.position.y <= 0.131 ? Math.cos(ang) * 1.4 : 0)); });
  { const tt = burst ? Math.min(t - tb, 1.2) : 0; U.cap.position.set(0, burst ? Math.max(0.1, 1.78 + 3.2 * tt - 4.9 * tt * tt) : 1.78, burst ? tt * 0.6 : 0); U.cap.rotation.set(burst ? tt * 4 : 0, 0, burst ? tt * 2 : 0); U.rotor.rotation.z = burst ? 0.35 * clamp((t - tb) * 3) : 0; }
  U.sparks.forEach((s, i) => { if (!burst || t - tb > 1.0) { s.position.set(0, -20, 0); return; } const r = rng(i * 13), tt = t - tb, ang = r() * 6.28, sp = 1.5 + r() * 3; s.position.set(-4.18 + Math.cos(ang) * sp * tt, 1.2 + r() * 0.8 + (2 * r()) * tt - 4.9 * tt * tt, 3.15 + Math.sin(ang) * sp * tt); s.material.opacity = 0.95 * (1 - tt); });
  U.smoke.forEach((s, i) => { const tt = t - tb; s.visible = false; if (true) return; /* smoke puffs read as blobs; sparks and shards carry the burst */ const r = rng(i * 7); s.position.set(-4.18 + (r() - 0.5) * 1.2 * Math.min(1, tt), 1.0 + tt * (0.4 + r() * 0.3), 3.15 + (r() - 0.5) * 1.0 * Math.min(1, tt)); s.scale.set(0.45 + tt * 0.8, 0.35 + tt * 0.6, 0.45 + tt * 0.8); s.rotation.y = i + tt * 0.6; s.material.opacity = 0.55 * clamp(tt * 4) * (1 - clamp((tt - 1) / 2)); });
  U.flash.intensity = burst ? 20 * Math.exp(-(t - tb) * 5) : 0;
  // drive displays + cabinet LEDs
  drawDrive(SCR.drive.x, 256, 128, hz); SCR.drive.t.needsUpdate = true; U.cabLeds.forEach((l, i) => { l.material.color.set(l.userData.k === 0 ? (Math.sin(t * 6 + i) > -0.3 ? '#3ff07a' : '#14301a') : l.userData.k === 1 ? (Math.sin(t * 3 + i * 0.7) > 0.6 ? '#ffcf3f' : '#3a3010') : '#3a1010'); });
  drawCtrl(SCR.ctrl.x, 640, 400, t); SCR.ctrl.t.needsUpdate = true; drawMimic(SCR.mimic.x, 1024, 600, t); SCR.mimic.t.needsUpdate = true;
  drawLaptop(SCR.laptop.x, 512, 340, t, inB(t, 11) && t > WT(11, 'error') - 0.3 ? 'usb' : 'code'); SCR.laptop.t.needsUpdate = true; U.cartStick.visible = inBs(t, 6, 7, 8, 11, 12) || isHook(t);
  U.crane.position.z = -11 + Math.sin(t * 0.08) * 6; U.trolley.position.set(0, -20, 0);
  // operators in the control room: calm, always
  if (isHook(t) || inBs(t, 6, 7, 8)) { const happy = (isHook(t) && t > WT(0, 'screens') - 0.2) || (inB(t, 8) && t > WT(8, 'everything') - 0.2);
    showCard(HCARD.op1, V(-3.4, 0, 8.0), { sit: 1, expr: happy ? 'happy' : 'neutral', armR: [1.0, 1.4], armL: [1.0, 1.4 + Math.sin(t * 7) * 0.08], blink: blinkAt(t) }); showCard(HCARD.op2, V(1.1, 0, 8.0), { sit: 1, expr: happy ? 'smug' : 'neutral', armR: [2.4, 1.9], armL: [1.0, 1.4], blink: blinkAt(t, 1) }); }
  // technicians walk the aisles (beats 6-7), the hook shows one recoiling
  if (isHook(t)) { showCard(HCARD.t1, V(-2.4, 0, 0.5), { expr: t > burstTime(t) ? 'shocked' : 'worried', armR: t > burstTime(t) ? [2.6, 0.4] : [0.3, 0.3], armL: t > burstTime(t) ? [2.6, 0.4] : [0.3, 0.3], sweat: 1, blink: blinkAt(t) }); }
  if (inBs(t, 6, 7)) { const w1 = walkAlong([V(0.3, 0, -18), V(0.3, 0, 1.5)], VB(6), t, 0.8); showCard(HCARD.t1, w1.p, { walk: w1.walking ? t * 2.6 : 0, expr: 'neutral', blink: blinkAt(t) }); HCARD.t1.spin = 0;
    const w2 = walkAlong([V(-7.0, 0, 2.0), V(-7.0, 0, -16)], VB(6) + 0.5, t, 0.7); showCard(HCARD.t2, w2.p, { walk: w2.walking ? t * 2.6 + 1 : 0, expr: 'neutral', armR: [1.6, 1.2], blink: blinkAt(t, 2) }); HCARD.t2.spin = Math.PI;
    showCard(HCARD.t3, V(7.0, 0, -4.0), { expr: inB(t, 7) && t > WT(7, 'dropped') ? 'worried' : 'neutral', armR: [1.4, 1.4], armL: [0.3, 0.2], blink: blinkAt(t, 3) }); }
  // beat 9: two techs push a trolley of broken centrifuges down the centre aisle; an inspector watches
  if (inB(t, 9)) { const w = walkAlong([V(0, 0, -16), V(0, 0, 3.2)], VB(9) - 0.5, t, 1.6); U.trolley.position.set(w.p.x, 0, w.p.z); U.trolley.rotation.y = 0;
    showCard(HCARD.t1, w.p.clone().add(V(-0.55, 0, -1.3)), { walk: w.walking ? t * 3 : 0, expr: 'worried', armR: [1.4, 0.2], armL: [1.4, 0.2], blink: blinkAt(t) }); showCard(HCARD.t2, w.p.clone().add(V(0.55, 0, -1.3)), { walk: w.walking ? t * 3 + 1 : 0, expr: 'annoyed', armR: [1.4, 0.2], armL: [1.4, 0.2], blink: blinkAt(t, 1) });
    showCard(HCARD.t3, V(-2.0, 0, 4.6), { expr: t > WT(9, 'thousand') ? 'shocked' : 'neutral', armR: [1.8, 1.5], armL: [1.6, 1.6], blink: blinkAt(t, 2) }); }
  // beat 11: the engineer at the laptop cart, then gone
  if (inB(t, 11) && t < WT(11, 'laptop') + 0.6) showCard(HCARD.eng, V(-10.0, 0, 5.0), { expr: t > WT(11, 'error') ? 'neutral' : 'happy', armR: [1.2, 1.3], armL: [1.1, 1.4], blink: blinkAt(t) });
}
function desertState(t) { const U = DESERT.userData; for (const k of Object.keys(DCARD)) hideCard(DCARD[k]);
  U.searchlight.rotation.y = Math.sin(t * 0.5) * 0.8; U.car.root.position.set(0, -50, 0); U.barArm.rotation.z = 0;
  showCard(DCARD.guard, V(-3.6, 0, 9.6), { expr: 'neutral', armR: [0.3, 0.2], armL: [0.3, 0.2], blink: blinkAt(t) });
  if (inB(t, 11)) { const t0 = WT(11, "engineer's") - 0.2; const ck = sstep(t0, t0 + 3.6, t); const z = lerp(-14, 22, ck); U.car.root.position.set(1.6, 0, z); U.car.root.rotation.y = -Math.PI / 2; U.car.wheels.forEach(w => w.rotation.z = -t * 8 * (ck < 1 && ck > 0 ? 1 : 0)); U.barArm.rotation.z = 1.35 * (sstep(t0 + 0.6, t0 + 1.3, t) - sstep(t0 + 3.0, t0 + 3.8, t)); }
  if (inB(t, 6)) { // a truck of workers? keep the gate quiet; barrier closed
  }
}
function opsState(t) { const U = OPS.userData; for (const k of Object.keys(OCARD)) hideCard(OCARD[k]);
  Object.values(U.pins).forEach(p => p.visible = false); U.folder.position.y = -10;
  const o = { inf: 0, iran: 0, arcs: [] }; let wm = 'code', wk = 1;
  if (inB(t, 4)) { o.inf = sstep(WT(4, 'infected') - 0.3, WT(4, 'computers') + 0.2, t); o.iran = sstep(WT(4, 'sixty') - 0.2, WT(4, 'Iran') + 0.3, t); wm = t > WT(4, 'By') - 0.2 ? 'count' : 'code'; wk = o.inf; U.pins.minsk.visible = true; }
  if (inB(t, 5)) { o.inf = 1; o.iran = 0.35; wm = 'target'; wk = t > WT(5, 'One', 4) - 0.1 ? 1 : t > WT(5, 'Finland') - 0.2 ? 0.5 : 0; U.pins.finland.visible = t > WT(5, 'Finland') - 0.2; U.pins.natanz.visible = t > WT(5, 'One', 4) - 0.1; if (t > WT(5, 'One', 4) - 0.1) o.ring = PL.natanz; }
  if (inB(t, 6)) { o.inf = 1; o.iran = 1; wm = 'target'; wk = 1; U.pins.natanz.visible = true; o.ring = PL.natanz; }
  if (inB(t, 10)) { o.inf = 0.15; o.iran = 0.6; wm = 'times'; U.pins.natanz.visible = true; U.pins.dc.visible = t > WT(10, 'American') - 0.2; U.pins.israel.visible = t > WT(10, 'Israeli') - 0.2; o.arcs.push([PL.dc, PL.natanz, sstep(WT(10, 'American') - 0.2, WT(10, 'operation'), t), 'rgba(255,255,255,.9)'], [PL.israel, PL.natanz, sstep(WT(10, 'Israeli') - 0.2, WT(10, 'operation') + 0.3, t), 'rgba(255,255,255,.9)']);
    if (t > WT(10, 'Olympic') - 0.6) { U.folder.position.set(0.9, 0.93, 0.95); U.folder.rotation.y = -0.25; }
    showCard(OCARD.off1, V(-0.8, 0, -2.3), { expr: 'smug', armR: [0.6, 1.6], armL: [0.6, 1.6], blink: blinkAt(t) }); OCARD.off1.tint = '#c8cce0'; showCard(OCARD.off2, V(0.9, 0, -2.3), { expr: t > WT(10, 'Neither') ? 'deadpan' : 'neutral', armR: [0.4, 0.3], armL: [0.4, 0.3], blink: blinkAt(t, 1) }); OCARD.off2.tint = '#c8cce0'; }
  else { OCARD.off1.tint = null; OCARD.off2.tint = null; }
  if (inB(t, 11)) { U.pins.natanz.visible = true; o.iran = 0.5; const c0 = WT(11, 'copy') - 0.3; o.inf = sstep(c0, c0 + 1.6, t); const dests = [[-95, 40], [-60, -15], [10, 50], [30, 0], [78, 22], [110, 5], [135, 35], [140, -28]]; dests.forEach((q, i) => o.arcs.push([PL.natanz, q, sstep(c0 + i * 0.12, c0 + 1.0 + i * 0.12, t), 'rgba(255,207,63,.95)'])); o.ring = PL.natanz; wm = 'spread'; }
  if (inB(t, 12)) { o.inf = 1; o.iran = 0.8; wm = 'code'; }
  if (inBs(t, 4, 5, 12)) { showCard(OCARD.an, V(-2.6, 0, 2.1), { expr: inB(t, 4) && t > WT(4, 'sixty') ? 'shocked' : 'neutral', armR: [1.7, 1.2], armL: [1.0, 1.3], blink: blinkAt(t) }); showCard(OCARD.an2, V(2.5, 0, 2.2), { expr: inB(t, 5) && t > WT(5, 'Iran', 1) ? 'shocked' : 'neutral', armR: [1.2, 1.3], armL: [1.0, 1.4], blink: blinkAt(t, 2) }); }
  drawMap(t, o); drawOpsWall(SCR.opswall.x, 1024, 512, t, wm, wk); SCR.opswall.t.needsUpdate = true; drawSide(SCR.side.x, 512, 512, t); SCR.side.t.needsUpdate = true;
  U.tableGlow.material.color.set(o.iran > 0.5 ? '#ff6a7a' : '#5fd0ff');
}
