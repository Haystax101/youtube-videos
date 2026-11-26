
// =====================================================================================================
// captions + labels + 2D overlays
// =====================================================================================================
const labelEl = document.getElementById('label'), capEl = document.querySelector('#cap span'), rwEl = document.getElementById('rw');
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const KEYW = /^(million|computer|telephone|default|code|notebook|hundred|italy|minute|police|raided|arrested|indicted|premium|fbi|mumbai|password|change|bill|twelve|fifty-five|dollars)$/i;
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
function counter(x, t, t0, t1, v0, v1, top, col, y = 640, fmt = money) { const s = pop(t, t0); if (!s) return; const v = lerp(v0, v1, sstep(t0 + 0.1, t1, t));
  card2d(x, 540, y, 820, 250, 0.02, s, (c, cw, ch) => { c.fillStyle = '#f4efe4'; c.beginPath(); c.roundRect(-cw / 2, -ch / 2, cw, ch, 28); c.fill(); c.lineWidth = 9; c.strokeStyle = '#0e0b16'; c.stroke(); c.textAlign = 'center'; c.fillStyle = '#3a3e48'; c.font = '800 40px Poppins'; c.fillText(top, 0, -ch / 2 + 60); c.fillStyle = col; c.font = '900 104px Poppins'; c.fillText(fmt(v), 0, 80); }); }
function stamp(x, t, t0, l1, l2, y) { const a = clamp((t - t0) / 0.18); if (a <= 0) return; const sc = 1.8 - 0.8 * sstep(0, 1, a); x.save(); x.globalAlpha = Math.min(1, a * 1.5); x.translate(540, y); x.rotate(-0.12); x.scale(sc, sc);
  x.lineWidth = 14; x.strokeStyle = '#d7263d'; x.beginPath(); x.roundRect(-400, -110, 800, 220, 20); x.stroke(); x.fillStyle = 'rgba(244,239,228,.88)'; x.fill(); x.stroke(); x.fillStyle = '#d7263d'; x.textAlign = 'center'; x.font = '900 58px Poppins'; x.fillText(l1, 0, -18); x.font = '900 84px Poppins'; x.fillText(l2, 0, 74); x.restore(); }
function phone(x, t, t0, draw, y = 760, cx = 540, sc0 = 1) { const s = pop(t, t0) * sc0; if (!s) return; card2d(x, cx, y, 520, 880, -0.03, s, (c, cw, ch) => { c.fillStyle = '#14121a'; c.beginPath(); c.roundRect(-cw / 2, -ch / 2, cw, ch, 60); c.fill(); c.lineWidth = 8; c.strokeStyle = '#0e0b16'; c.stroke(); c.fillStyle = '#f4f6fb'; c.beginPath(); c.roundRect(-cw / 2 + 24, -ch / 2 + 70, cw - 48, ch - 140, 30); c.fill(); c.fillStyle = '#14121a'; c.beginPath(); c.roundRect(-50, -ch / 2 + 28, 100, 22, 11); c.fill(); draw(c, cw, ch); }); }
function bill(x, t, t0, y = 720) { const s = pop(t, t0); if (!s) return; card2d(x, 540, y, 640, 760, 0.04, s, (c, cw, ch) => { c.fillStyle = '#fbfaf6'; c.beginPath(); c.roundRect(-cw / 2, -ch / 2, cw, ch, 14); c.fill(); c.lineWidth = 8; c.strokeStyle = '#0e0b16'; c.stroke();
  c.fillStyle = '#2f6fe0'; c.fillRect(-cw / 2 + 4, -ch / 2 + 4, cw - 8, 100); c.fillStyle = '#fff'; c.font = '900 50px Poppins'; c.textAlign = 'center'; c.fillText('PHONE BILL', 0, -ch / 2 + 72);
  c.textAlign = 'left'; c.font = '700 28px monospace'; const L = [['+39 ITALY', '4,812 min'], ['+39 ITALY', '3,977 min'], ['+63 PHIL.', '2,203 min'], ['+92 PAK.', '1,986 min'], ['+39 ITALY', '5,140 min']]; L.forEach(([a, b], i) => { c.fillStyle = '#3a3e48'; c.fillText(a, -cw / 2 + 40, -ch / 2 + 170 + i * 52); c.textAlign = 'right'; c.fillText(b, cw / 2 - 40, -ch / 2 + 170 + i * 52); c.textAlign = 'left'; });
  c.fillStyle = '#d7263d'; c.fillRect(-cw / 2 + 30, ch / 2 - 200, cw - 60, 150); c.fillStyle = '#fff'; c.font = '800 34px Poppins'; c.textAlign = 'center'; c.fillText('TOTAL DUE', 0, ch / 2 - 150); c.font = '900 74px Poppins'; c.fillText('$120,450', 0, ch / 2 - 76); }); }
function overlays2d(t) { const x = OV; x.clearRect(0, 0, W, H);
  if (HOOK(t) && t > WT(0, 'fiftyfive') - 0.1) counter(x, t, WT(0, 'fiftyfive') - 0.1, WT(0, 'calls'), 0, 55000000, 'IN STOLEN PHONE CALLS', '#d7263d', 640);
  if (inB(t, 1) && t > WT(1, 'dials') - 0.1 && t < WT(1, 'one') - 0.1) chip(x, t, WT(1, 'dials') - 0.1, 'DIALLING THE USA', '#2f6fe0', 380);
  if (inB(t, 2)) { const st = [['Staff', 'STEP 1 · DIAL IN'], ['punch', 'STEP 2 · ENTER CODE'], ['call', 'STEP 3 · CALL ANYWHERE'], ["company's", 'BILL → THE COMPANY']]; let cur = null; for (const [w, s] of st) if (t > WT(2, w) - 0.15) cur = [w, s]; if (cur && t < WT(2, 'that') - 0.1) chip(x, t, WT(2, cur[0]) - 0.15, cur[1], cur[0] === "company's" ? '#d7263d' : '#2f6fe0', 380); }
  if (inB(t, 2) && t > WT(2, 'factory') - 0.1) stamp(x, t, WT(2, 'factory') - 0.1, 'ACCESS CODE STILL', '0000', 700);
  if (inB(t, 3) && t > WT(3, 'sold') - 0.1) chip(x, t, WT(3, 'sold') - 0.1, '$100 PER HACKED SYSTEM', '#2f8a3a', 380);
  if (inB(t, 4) && t > WT(4, 'Twelve') - 0.1 && t < WT(4, 'More') - 0.1) counter(x, t, WT(4, 'Twelve') - 0.1, WT(4, 'minutes'), 0, 12000000, 'MINUTES OF CALLS', '#2f6fe0', 640, v => Math.round(v).toLocaleString('en-US'));
  if (inB(t, 4) && t > WT(4, 'More') - 0.1) counter(x, t, WT(4, 'More') - 0.1, WT(4, 'dollars'), 12000000, 55000000, 'BILLED TO THE VICTIMS', '#d7263d', 640);
  if (inB(t, 5) && t < WT(5, 'Most') - 0.15) counter(x, t, VB(5) + 0.2, WT(5, 'organisations'), 0, 2500, 'ORGANISATIONS HIT', '#d7263d', 1520, v => Math.round(v).toLocaleString('en-US') + '+');
  if (inB(t, 5) && t > WT(5, 'bill') - 0.15) bill(x, t, WT(5, 'bill') - 0.15, 700);
  if (inB(t, 6) && t > WT(6, 'arrested') - 0.1) stamp(x, t, WT(6, 'arrested') - 0.1, 'MANILA · 2007', 'ARRESTED', 640);
  if (inB(t, 7) && t > WT(7, 'ten') - 0.1 && t < WT(7, 'arresting') - 0.15) chip(x, t, WT(7, 'ten') - 0.1, '10 CALL SHOPS · 1 MORNING', '#2f8a3a', 380);
  if (inB(t, 8) && t > WT(8, 'premium') - 0.15 && t < WT(8, 'money') - 0.1) phone(x, t, WT(8, 'premium') - 0.15, (c, cw, ch) => { c.textAlign = 'center'; c.fillStyle = '#16121f'; c.font = '800 34px Poppins'; c.fillText('Calling…', 0, -ch / 2 + 140); c.font = '900 48px Poppins'; c.fillText('+882 4•• ••••', 0, -120);
    c.fillStyle = '#ffcf3f'; c.beginPath(); c.roundRect(-200, -40, 400, 110, 24); c.fill(); c.fillStyle = '#16121f'; c.font = '900 40px Poppins'; c.fillText('PREMIUM RATE', 0, 26); c.fillStyle = '#d7263d'; c.font = '900 56px Poppins'; c.fillText('$$$ / MIN', 0, 170); }, 1540, 760, 0.6);
  if (inB(t, 8) && t > WT(8, 'ATT') - 0.1) counter(x, t, WT(8, 'ATT') - 0.1, WT(8, 'dollars'), 0, 1900000, 'AT&T CUSTOMERS · ALMOST', '#d7263d', 640);
  if (inB(t, 9) && t > WT(9, 'arrested') - 0.1 && t < WT(9, 'Police') - 0.1) stamp(x, t, WT(9, 'arrested') - 0.1, 'NOVEMBER 2011', 'ARRESTED AGAIN', 640);
  if (inB(t, 10) && t > WT(10, 'So') - 0.15 && t < WT(10, 'Follow') + 0.2) { const fade = 1 - clamp((t - WT(10, 'Follow')) / 0.2); x.globalAlpha = fade;
    phone(x, t, WT(10, 'So') - 0.15, (c, cw, ch) => { c.textAlign = 'center'; c.fillStyle = '#16121f'; c.font = '900 40px Poppins'; c.fillText('Default passwords', 0, -ch / 2 + 150);
      const items = [['router', 'Router'], ['voicemail', 'Voicemail'], ['camera', 'Smart camera']]; items.forEach(([w, lab], i) => { const on = t > WT(10, w) - 0.05; const yy = -170 + i * 120; c.fillStyle = on ? '#e3f6e6' : '#eceef4'; c.beginPath(); c.roundRect(-200, yy - 50, 400, 96, 20); c.fill(); c.fillStyle = '#16121f'; c.font = '800 36px Poppins'; c.textAlign = 'left'; c.fillText(lab, -170, yy + 12);
        c.fillStyle = on ? '#2f8a3a' : '#c9ccd6'; c.beginPath(); c.arc(150, yy - 2, 30, 0, 7); c.fill(); if (on) { c.strokeStyle = '#fff'; c.lineWidth = 9; c.beginPath(); c.moveTo(136, yy - 2); c.lineTo(147, yy + 10); c.lineTo(166, yy - 16); c.stroke(); } c.textAlign = 'center'; });
      const ch2 = t > WT(10, 'change') - 0.05; c.fillStyle = ch2 ? '#2f8a3a' : '#2f6fe0'; c.beginPath(); c.roundRect(-200, 200, 400, 100, 50); c.fill(); c.fillStyle = '#fff'; c.font = '900 38px Poppins'; c.fillText(ch2 ? 'Changed ✓' : 'Change it', 0, 264); }, 780); x.globalAlpha = 1; }
}

// =====================================================================================================
// frame
// =====================================================================================================
const FOG = { shop: new THREE.Fog('#2a1e40', 30, 90), apt: null, office: null, map: new THREE.Fog('#05040c', 14, 40), fbi: null };
const STATE = { apt: [aptState, () => Object.values(ACARD).forEach(hideCard)], office: [officeState, () => Object.values(OCARD).forEach(hideCard)], shop: [shopState, () => { hideCard(SCARD.owner); SCARD.cops.forEach(hideCard); SCARD.cust.forEach(hideCard); SCARD.walkers.forEach(hideCard); }], map: [mapState, () => {}], fbi: [fbiState, () => Object.values(FCARD).forEach(hideCard)] };
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
  post.uniforms.time.value = (Math.floor(t * 30) % 97) * 0.37; post.uniforms.warm.value = s.set === 'shop' || s.set === 'apt' ? 0.5 : 0;
  overlays(t); overlays2d(t);
  draw();
}
