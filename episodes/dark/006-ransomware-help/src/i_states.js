// =====================================================================================================
// CHARACTERS + SCREENS + WORLD STATES
// =====================================================================================================
const OCARD = { w1: makeCard(OFFICE, 'worker1', 1.66), w2: makeCard(OFFICE, 'office', 1.74), w3: makeCard(OFFICE, 'cowork2', 1.74), mgr: makeCard(OFFICE, 'official2', 1.76), w4: makeCard(OFFICE, 'staffB', 1.68) };
const FCARD = { cto: makeCard(FIRM, 'cto', 1.76), staff: makeCard(FIRM, 'staffA', 1.72) };
FCARD.cto.keepNear = true; FCARD.cto.face = V(0, 0, 1);
const BCARD = { vf: makeCard(FBI, 'agentF', 1.7), vm: makeCard(FBI, 'agentM2', 1.76), uc: makeCard(FBI, 'undercover', 1.74), gm: makeCard(FBI, 'agentM', 1.78), boss: makeCard(FBI, 'agentBoss', 1.8) };
const VCARD = { cto: makeCard(VEGAS, 'ctoCasual', 1.76), a1: makeCard(VEGAS, 'agentM', 1.78), a2: makeCard(VEGAS, 'agentF', 1.7), a3: makeCard(VEGAS, 'agentM2', 1.76), p1: makeCard(VEGAS, 'lady2', 1.66), p2: makeCard(VEGAS, 'gent', 1.74) };

// ---------- screens ----------
function padlock(x, cx, cy, s, col = '#ffffff') { x.save(); x.translate(cx, cy); x.scale(s, s); x.lineWidth = 16; x.strokeStyle = col; x.beginPath(); x.arc(0, -40, 36, Math.PI, 0); x.lineTo(36, -10); x.moveTo(-36, -40); x.lineTo(-36, -10); x.stroke(); x.fillStyle = col; x.beginPath(); x.roundRect(-56, -14, 112, 92, 14); x.fill(); x.fillStyle = '#b3121f'; x.beginPath(); x.arc(0, 22, 12, 0, 7); x.fill(); x.fillRect(-5, 22, 10, 28); x.restore(); }
function drawRansom(t) { const c = SCR.ransom, x = c.x, w = 512, h = 320; const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#d7263d'); g.addColorStop(1, '#7a0f1c'); x.fillStyle = g; x.fillRect(0, 0, w, h);
  padlock(x, 92, 140, 0.95 + 0.04 * Math.sin(t * 6)); x.fillStyle = '#fff'; x.font = '900 34px Poppins'; x.textAlign = 'left'; x.fillText('YOUR FILES', 178, 96); x.fillText('ARE LOCKED', 178, 136); x.font = '700 21px Poppins'; x.fillText('Pay to get the key.', 180, 172);
  x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(178, 196, 300, 60); const left = Math.max(0, 71 * 3600 - Math.floor(t * 7) * 1); const hh = Math.floor(left / 3600), mm = Math.floor(left / 60) % 60, ss = left % 60;
  x.fillStyle = '#ffcf3f'; x.font = '900 40px monospace'; x.fillText(`${hh}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`, 194, 240); x.fillStyle = 'rgba(255,255,255,.06)'; for (let y = 0; y < h; y += 4) x.fillRect(0, y, w, 1); c.t.needsUpdate = true; }
const CLIENT_UI = { bg: '#f4f6fa', bar: '#14a39a', title: 'Client: Victim Co.', me: '#14a39a', them: '#e1e6ee' };
const GANG_UI = { bg: '#120c14', bar: '#7a0f1c', title: 'gang_support (encrypted)', me: '#2f6fe0', them: '#3a2a3a', themText: '#ffb0b8', dot: '#ff3b4a' };
const VICT_UI = { bg: '#f4f6fa', bar: '#2f6fe0', title: 'To: Ransomware Help', me: '#2f6fe0', them: '#e1e6ee' };
const GANGL_UI = { bg: '#120c14', bar: '#7a0f1c', title: 'GANG CHAT  (FBI UNDERCOVER)', me: '#7a0f1c', them: '#2a3a5a', themText: '#cfe0ff', dot: '#ff3b4a' };
let MSG = null; function msgs() { if (MSG) return MSG; const w = (i, word, n) => WT(i, word, n);
  MSG = {
    // the victim side (FBI agents posing as a company) <-> RansomwareHelp
    victim: [{ from: 'me', text: "We've been hit by ransomware.\nRansom note attached.", t0: w(7, 'sent') }, { from: 'me', text: 'We do NOT want to\npay the hackers.', t0: w(7, 'clear') }, { from: 'them', text: 'Invoice: $16,010\nDiagnostic + recovery', t0: w(10, 'bill') }],
    // RansomwareHelp <-> the gang (FBI agents posing as criminals)
    gang: [{ from: 'me', text: "What's your price\nfor the key?", t0: w(8, 'contacted') }, { from: 'them', text: 'That will cost you.\nPay in bitcoin.', t0: w(8, 'haggle') }, { from: 'me', text: 'Too high. Best price?', t0: w(9, 'talked') }, { from: 'them', text: 'Fine. About $6,000\nin bitcoin.', t0: w(9, 'six') }, { from: 'me', text: 'Payment sent.', t0: w(11, 'paid') }]
  }; return MSG; }
function hookPaid(t) { return isHook(t) && t > WT(0, 'paying') - 0.2; }
function drawFirmScreens(t) { const M = msgs();
  const early = !isHook(t) && t < VB(6); chat(SCR.client.x, 640, 400, t, early ? { ...CLIENT_UI, title: 'Client: a dental clinic', msgs: [{ from: 'them', text: 'Can you unlock\nour files?', t0: -1 }, { from: 'me', text: 'Yes. With our own\ntechnology.', t0: -1 }] } : { ...CLIENT_UI, msgs: M.victim.map(m => ({ ...m, from: m.from === 'me' ? 'them' : 'me' })) }); SCR.client.t.needsUpdate = true;
  const gm = isHook(t) ? [{ from: 'them', text: 'Key costs bitcoin.', t0: -1 }, { from: 'me', text: 'Payment sent.', t0: WT(0, 'paying') - 0.2 }] : M.gang;
  chat(SCR.gang.x, 640, 400, t, { ...GANG_UI, msgs: gm, typing: [WT(8, 'haggle') - 0.6, WT(8, 'haggle')] });
  const paidAt = isHook(t) ? WT(0, 'paying') - 0.2 : WT(11, 'paid'); if (t > paidAt) { const k = clamp((t - paidAt) / 0.4), x = SCR.gang.x; x.globalAlpha = k; x.fillStyle = '#f7931a'; x.beginPath(); x.roundRect(150, 250, 340, 120, 20); x.fill(); x.fillStyle = '#fff'; x.font = '900 38px Poppins'; x.textAlign = 'center'; x.fillText('₿  SENT ✓', 320, 322); x.textAlign = 'left'; x.globalAlpha = 1; }
  SCR.gang.t.needsUpdate = true; }
function drawFbiScreens(t) { const M = msgs();
  chat(SCR.vict.x, 640, 400, t, { ...VICT_UI, msgs: M.victim }); SCR.vict.t.needsUpdate = true;
  const gl = isHook(t) ? [{ from: 'them', text: 'Payment sent.', t0: -1 }] : M.gang.map(m => ({ ...m, from: m.from === 'me' ? 'them' : 'me' }));
  chat(SCR.gangl.x, 640, 400, t, { ...GANGL_UI, msgs: gl }); SCR.gangl.t.needsUpdate = true;
  // the wall: both chats feed one room
  const x = SCR.fbiwall.x, w = 1280, h = 640; x.fillStyle = '#0b1020'; x.fillRect(0, 0, w, h); x.fillStyle = '#1d2a4a'; x.fillRect(0, 0, w, 70); x.fillStyle = '#e8c35a'; x.font = '900 40px Poppins'; x.textAlign = 'center'; x.fillText('UNDERCOVER OPERATION · LIVE', w / 2, 50);
  const box = (bx, by, col, s1, s2) => { x.fillStyle = col; x.beginPath(); x.roundRect(bx - 190, by - 80, 380, 160, 24); x.fill(); x.fillStyle = '#fff'; x.font = '900 44px Poppins'; x.fillText(s1, bx, by - 6); x.font = '700 28px Poppins'; x.fillText(s2, bx, by + 40); };
  box(230, 300, '#2f6fe0', 'THE VICTIM', 'played by FBI'); box(1050, 300, '#b3121f', 'THE GANG', 'played by FBI'); box(640, 520, '#14a39a', 'RANSOMWARE HELP', 'the target');
  x.strokeStyle = '#e8e2d6'; x.lineWidth = 8; x.setLineDash([24, 14]); x.lineDashOffset = -t * 50; x.beginPath(); x.moveTo(420, 340); x.lineTo(460, 500); x.moveTo(860, 340); x.lineTo(820, 500); x.stroke(); x.setLineDash([]);
  const both = t > WT(11, 'same') - 0.2 || isHook(t); if (both) { x.strokeStyle = '#ffcf3f'; x.lineWidth = 10; x.beginPath(); x.moveTo(420, 260); x.quadraticCurveTo(640, 120, 860, 260); x.stroke(); x.fillStyle = '#ffcf3f'; x.font = '900 40px Poppins'; x.fillText('SAME PEOPLE', 640, 170); }
  x.textAlign = 'left'; x.fillStyle = 'rgba(255,255,255,.03)'; for (let y = 0; y < h; y += 4) x.fillRect(0, y, w, 1); SCR.fbiwall.t.needsUpdate = true; }

// ---------- world states ----------
const isHook = t => t < HOOK_END + RW;
// office: monitors flip to the ransom screen in a wave from "lock" (beat 1); during beats 2, 5, 13, 14 they stay red
function officeState(t) { const U = OFFICE.userData; for (const k of Object.keys(OCARD)) hideCard(OCARD[k]);
  drawRansom(t); const t0 = WT(1, 'lock') - 0.1, k = inB(t, 1) ? (t - t0) / 1.4 : 1;
  for (const m of U.mons) { const order = (m.userData.idx * 7) % U.mons.length / U.mons.length; m.userData.scr.material = k > order ? RANSOM_MAT : DESK_MAT; }
  const red = clamp(k); U.redLight.intensity = 6 * red * (0.85 + 0.15 * Math.sin(t * 5));
  U.rack.userData.leds.forEach(l => l.material.color.set(red > 0.5 ? (Math.sin(t * 9 + l.userData.ph) > 0 ? '#ff2a3a' : '#3a0a10') : (Math.sin(t * 7 + l.userData.ph * 3) > 0.2 ? '#3ff07a' : '#1a2a1a')));
  U.outside.traverse(o => { if (o.userData.blink) o.material.opacity = Math.sin(t * 3) > 0 ? 0.9 : 0.15; });
  const [hm, mm] = U.clock.userData.hands; hm.rotation.z = -0.4; mm.rotation.z = -t * 0.05;
  const shock = k > 0.3, late = inBs(t, 13, 14);
  showCard(OCARD.w1, V(-0.9, 0, 3.2), { expr: late ? 'annoyed' : shock ? 'shocked' : 'neutral', armR: shock && !late ? [2.7, 0.5] : [0.3, 0.3], armL: shock && !late ? [2.7, 0.5] : [0.3, 0.3], sweat: shock ? 0.6 : 0, blink: blinkAt(t) });
  showCard(OCARD.w2, V(1.3, 0, 3.6), { expr: shock ? (inB(t, 2) ? 'angry' : 'shocked') : 'neutral', armR: shock ? [1.6, 1.4] : [0.3, 0.3], armL: [0.3, 0.3], lean: shock ? -0.06 : 0, blink: blinkAt(t, 1) });
  showCard(OCARD.w3, V(-3.6, 0, 3.0), { expr: shock ? 'worried' : 'neutral', armR: shock ? [2.0, 0.9] : [0.2, 0.2], armL: [0.3, 0.3], blink: blinkAt(t, 2) });
  const phone = inBs(t, 2, 13); showCard(OCARD.mgr, V(4.1, 0, 3.4), { expr: phone ? (inB(t, 2) && t > WT(2, 'warns') ? 'shocked' : 'annoyed') : shock ? 'angry' : 'neutral', armR: phone ? [2.7, 2.2] : [0.4, 0.3], armL: phone ? [0.4, 0.3] : [1.2, 1.5], talk: phone && Math.sin(t * 11) > 0.2 ? 0.4 : 0, blink: blinkAt(t, 3) });
  showCard(OCARD.w4, V(2.75, 0, 3.45), { expr: shock ? 'shocked' : 'neutral', armR: [0.3, 0.3], armL: shock ? [1.5, 0.3] : [0.3, 0.3], blink: blinkAt(t, 4) }); }
// the firm
function firmState(t) { const U = FIRM.userData; for (const k of Object.keys(FCARD)) hideCard(FCARD[k]); drawFirmScreens(t);
  U.fan.rotation.y = t * 2.2; U.gangGlow.material.opacity = 0.18 + 0.06 * Math.sin(t * 4);
  // the invoice slides out of the printer in beat 10 (from "bill" to "fee", 2)
  const pk = inB(t, 10) ? sstep(WT(10, 'bill') - 0.2, WT(10, 'fee', 2), t) : (t > VB(10) && !isHook(t) ? 1 : 0); U.printer.userData.sheet.position.z = 0.2 + pk * 0.2; U.printer.userData.sheet.position.y = 0.14 - pk * 0.02;
  // coins slide off the stack when he pays (hook + beat 11)
  const paid = hookPaid(t) || (t > WT(11, 'paid') - 0.1 && !isHook(t)); const pt = isHook(t) ? WT(0, 'paying') - 0.2 : WT(11, 'paid') - 0.1;
  U.coins.forEach((c, i) => { const k = paid ? clamp((t - pt - i * 0.08) / 0.35) : 0; c.position.set(0.25 + (i % 2) * 0.02 - k * 0.5, 1.095 + i * 0.015 + Math.sin(k * Math.PI) * 0.12, 0.2 - k * 0.35); c.visible = k < 0.98; });
  // the CTO: smug while billing, typing at the keyboard while chatting, worried when the agents' faces show up
  let expr = 'neutral', armR = [1.2, 1.5], armL = [1.2, 1.5], talk = 0; const type = Math.sin(t * 14) * 0.08;
  if (isHook(t)) expr = t > WT(0, 'paying') - 0.2 ? 'smug' : 'happy';
  if (inB(t, 3)) { expr = 'happy'; armR = t > WT(3, 'technology') ? [2.3, 0.7] : [0.4, 0.3]; armL = [0.4, 0.3]; }
  if (inB(t, 4)) { expr = t > WT(4, 'paid') ? 'smug' : 'neutral'; }
  if (inB(t, 8)) { expr = t > WT(8, 'contacted') ? 'smug' : 'neutral'; armR = [1.2, 1.5 + type]; armL = [1.2, 1.5 - type]; }
  if (inB(t, 9)) { expr = t > WT(9, 'six') ? 'delighted' : 'annoyed'; armR = [1.2, 1.5 + type]; armL = [1.2, 1.5 - type]; }
  if (inB(t, 10)) { expr = 'smug'; armR = t > WT(10, 'Sixteen') ? [2.4, 0.6] : [1.2, 1.5]; }
  if (inB(t, 11)) { expr = t > WT(11, 'same') ? 'shocked' : 'smug'; }
  showCard(FCARD.cto, V(0, 0, -2.16), { expr, armR, armL, talk, blink: blinkAt(t) });
  if (!inBs(t, 8, 9)) showCard(FCARD.staff, V(2.3, 0, 2.3), { expr: inB(t, 3) ? 'happy' : 'neutral', armR: [1.4, 1.5], armL: [0.3, 0.3], blink: blinkAt(t, 2) }); }
// the FBI room
function fbiState(t) { const U = FBI.userData; for (const k of Object.keys(BCARD)) hideCard(BCARD[k]); drawFbiScreens(t);
  U.redP.intensity = 12 + 2 * Math.sin(t * 3); U.wallGlow.material.opacity = 0.1 + 0.03 * Math.sin(t * 2);
  const [hm, mm] = U.clock.userData.hands; hm.rotation.z = -2.1; mm.rotation.z = -t * 0.05;
  const type = Math.sin(t * 14) * 0.08, reveal = inB(t, 11) && t > WT(11, 'same') - 0.2;
  showCard(BCARD.vf, V(-4.5, 0, 0.42), { expr: inB(t, 10) && t > WT(10, 'Sixteen') ? 'smug' : (inB(t, 7) ? 'neutral' : 'smug'), armR: inB(t, 7) ? [1.3, 1.5 + type] : [0.4, 0.3], armL: [0.4, 0.3], blink: blinkAt(t) });
  showCard(BCARD.vm, V(-2.3, 0, 0.45), { expr: reveal ? 'happy' : 'neutral', armR: [0.5, 1.6], armL: [0.5, 1.6], blink: blinkAt(t, 1) });
  showCard(BCARD.uc, V(2.3, 0, 0.45), { expr: inB(t, 9) && t > WT(9, 'six') ? 'smug' : (reveal || isHook(t) && t > WT(0, 'F') - 0.2 ? 'happy' : 'neutral'), armR: inBs(t, 8, 9) ? [1.3, 1.5 + type] : [0.4, 0.3], armL: [0.4, 0.3], blink: blinkAt(t, 2) });
  showCard(BCARD.gm, V(4.5, 0, 0.42), { expr: reveal ? 'delighted' : 'neutral', armR: [0.6, 1.6], armL: [0.6, 1.6], blink: blinkAt(t, 3) });
  showCard(BCARD.boss, V(0.2, 0, 1.9), { expr: reveal || (isHook(t) && t > WT(0, 'F')) ? 'smug' : 'neutral', armR: inB(t, 6) && t > WT(6, 'both') - 0.2 ? [2.2, 0.4] : [0.7, 1.7], armL: inB(t, 6) && t > WT(6, 'both') - 0.2 ? [2.2, 0.4] : [0.7, 1.7], blink: blinkAt(t, 4) }); }
// Las Vegas: the arrest (beat 12)
const ARREST = [V(-4.0, 0, -5.6), V(-3.0, 0, -4.0), V(-1.2, 0, -2.6), V(-0.2, 0, -0.9)];
function vegasState(t) { const U = VEGAS.userData; for (const k of Object.keys(VCARD)) hideCard(VCARD[k]);
  const fl = Math.floor(t * 4) % 2; U.lr.material.color.set(fl ? '#ff2a3a' : '#40080c'); U.lb.material.color.set(fl ? '#0a1440' : '#2a6aff'); U.gr.material.opacity = fl ? 0.8 : 0.08; U.gb.material.opacity = fl ? 0.08 : 0.8; U.pr.intensity = fl ? 14 : 0; U.pb.intensity = fl ? 0 : 14;
  U.bulbs.forEach(b => b.material.color.set((b.userData.k + Math.floor(t * 6)) % 3 ? '#fff2b0' : '#7a5a20')); U.neon.forEach((n, i) => n.set(i !== 2 || Math.sin(t * 9) > -0.9));
  const w = walkAlong(ARREST, VB(12) + 0.3, t, 1.0), dir = V(0.45, 0, 0.9).normalize(), side = V(dir.z, 0, -dir.x);
  showCard(VCARD.cto, w.p, { walk: w.walking ? t * 2.8 : 0, cuffed: true, expr: t > WT(12, 'convicted') ? 'worried' : 'annoyed', blink: blinkAt(t) }); VCARD.cto.spin = 0;
  showCard(VCARD.a1, w.p.clone().addScaledVector(side, 0.85).addScaledVector(dir, -0.2), { walk: w.walking ? t * 2.8 + 1 : 0, expr: 'neutral', armR: [0.3, 0.2], armL: [0.9, 0.6], blink: blinkAt(t, 1) });
  showCard(VCARD.a2, w.p.clone().addScaledVector(side, -0.85).addScaledVector(dir, -0.3), { walk: w.walking ? t * 2.8 + 2 : 0, expr: 'neutral', armR: [0.9, 0.6], armL: [0.3, 0.2], blink: blinkAt(t, 2) });
  showCard(VCARD.a3, V(-1.7, 0, 2.0), { expr: 'neutral', armR: [0.4, 0.3], armL: [1.2, 1.5], blink: blinkAt(t, 3) });
  showCard(VCARD.p1, V(-9.5, 0, -4.4), { expr: 'shocked', armR: [1.6, 1.8], armL: [0.3, 0.3], blink: blinkAt(t, 4) }); showCard(VCARD.p2, V(-8.4, 0, -4.9), { expr: 'shocked', armR: [0.3, 0.3], armL: [0.4, 0.3], blink: blinkAt(t, 5) }); }
