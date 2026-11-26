// Overlap check for 3D set videos (big-head smol look and any page with 3D characters).
// Steps through the whole timeline and reports, for the shot being filmed:
//   - two characters whose heads or bodies pass through each other
//   - a character's head or body inside a prop, piece of furniture or wall detail
//   - a prop someone carries (a child of the character) pushed through furniture
// It tests spheres (one for the head, three down the body) against each mesh's own rotated box, so a chair
// turned 30 degrees is not judged by a fat world-axis box.
//
// The page opts in with one line after its characters exist:
//   window.QA = { scene, camera, actors: [{ name: 'guard', root: G.root, head: G.head, seat: chairGroup? }] }
// actors may also be a function () => [...] when characters change per shot. `seat` is the chair (or any
// object) the character is meant to touch right now; it and its children are ignored for that character.
// Meshes with userData.noCheck (rugs, decals, glows, light shafts) are ignored. If the page has
// `if (window.NODRAW) return` before drawing, the check runs without rendering (much faster).
//
// Usage: NODE_PATH=$(npm root -g) node tools/check_overlap.cjs EP_DIR/page.html [step=0.1]
// Exit 0 = clean, 1 = on-screen overlaps found, 2 = page has no window.QA.
const { chromium } = require('playwright'); const http = require('http'), fs = require('fs'), path = require('path');
const REPO = path.resolve(__dirname, '..'); const page = path.resolve(process.argv[2]); const step = +(process.argv[3] || 0.1);
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg' };
const server = http.createServer((req, res) => { const p = path.join(REPO, decodeURIComponent(new URL(req.url, 'http://x').pathname)); if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res); }).listen(0);

// runs inside the page
function probe(t) {
  window.NODRAW = 1; window.renderFrame(t);
  const Q = window.QA, { scene, camera } = Q; const actors = (typeof Q.actors === 'function' ? Q.actors() : Q.actors) || [];
  const THREE = Q.THREE || window.THREE; scene.updateMatrixWorld(true); camera.updateMatrixWorld(true);
  const V3 = camera.position.constructor, Box = camera.position.constructor.prototype; // eslint-disable-line no-unused-vars
  const vis = o => { for (let a = o; a; a = a.parent) if (!a.visible) return false; return true; };
  const frustumHas = (p, r) => { const q = p.clone().project(camera); const asp = (camera.aspect || 0.5625); const rr = r / Math.max(1e-3, p.distanceTo(camera.position) * Math.tan(camera.fov * Math.PI / 360)); return q.z < 1 && Math.abs(q.x) - rr / asp < 1 && Math.abs(q.y) - rr < 1; };
  // sphere set per visible actor
  const live = [];
  for (const a of actors) {
    if (!a || !a.root || !vis(a.root)) continue;
    const hp = a.head.getWorldPosition(new V3()); const geoR = (() => { let r = 0; a.head.traverse(m => { if (m.isMesh && m.geometry) { if (!m.geometry.boundingSphere) m.geometry.computeBoundingSphere(); const s = new V3(); m.getWorldScale(s); const c = m.geometry.boundingSphere.center.clone(); m.localToWorld(c); r = Math.max(r, c.distanceTo(hp) * 0 + m.geometry.boundingSphere.radius * Math.max(s.x, s.y, s.z) * 0.92); } }); return r; })();
    const base = a.root.getWorldPosition(new V3()); const s = new V3(); a.root.getWorldScale(s);
    const H = Math.max(0.2, hp.y - geoR - base.y); const rb = Math.max(0.06, geoR * 0.42);
    const sph = [{ c: hp, r: geoR, part: 'head' }];
    for (const k of [0.45, 0.7, 0.92]) { const y = base.y + H * k; if (y + rb < hp.y - geoR * 0.6) sph.push({ c: new V3(base.x + (hp.x - base.x) * k, y, base.z + (hp.z - base.z) * k), r: rb, part: 'body' }); }
    live.push({ a, sph, onScreen: frustumHas(hp, geoR) || frustumHas(sph[sph.length - 1].c, rb) });
  }
  const hits = [];
  // actor vs actor
  for (let i = 0; i < live.length; i++) for (let j = i + 1; j < live.length; j++) {
    const A = live[i], B = live[j]; if (!A.onScreen && !B.onScreen) continue; let worst = 0, what = '';
    for (const p of A.sph) for (const q of B.sph) { const d = p.r + q.r - p.c.distanceTo(q.c); if (d > worst) { worst = d; what = `${p.part}/${q.part}`; } }
    if (worst > 0.04) hits.push([`${A.a.name} and ${B.a.name} pass through each other (${what})`, worst]);
  }
  // actor vs meshes
  const owner = new Map(); for (const L of live) L.a.root.traverse(o => owner.set(o, L));
  const ignoredFor = L => { const s = new Set(); const seats = [].concat(L.a.seat || []); for (const st of seats) st && st.traverse(o => s.add(o)); return s; };
  const tmp = new V3(), loc = new V3(), ws = new V3();
  const meshes = []; scene.traverse(m => { if (!m.isMesh || owner.has(m) || m.isSprite || m.isPoints || m.userData.noCheck) return; const mat = Array.isArray(m.material) ? m.material[0] : m.material; if (!mat || mat.transparent && mat.opacity < 0.5 || mat.blending === 2) return; if (!vis(m)) return; meshes.push(m); });
  const label = m => { const g = m.geometry; if (!g.boundingBox) g.computeBoundingBox(); const sz = g.boundingBox.getSize(new V3()); m.getWorldScale(ws); const c = g.boundingBox.getCenter(new V3()); m.localToWorld(c); const mat = Array.isArray(m.material) ? m.material[0] : m.material; return `${m.name || (mat && mat.color ? '#' + mat.color.getHexString() : 'mesh')} ${[sz.x * ws.x, sz.y * ws.y, sz.z * ws.z].map(v => v.toFixed(2)).join('x')} at (${[c.x, c.y, c.z].map(v => v.toFixed(1)).join(',')})`; };
  for (const L of live) {
    if (!L.onScreen) continue; const ign = ignoredFor(L);
    const all = L.sph.slice();   // carried props (meshes under the actor that are not its body): test their boxes too
    for (const m of meshes) {
      if (ign.has(m)) continue; const g = m.geometry; if (!g.boundingSphere) g.computeBoundingSphere(); if (!g.boundingBox) g.computeBoundingBox();
      m.getWorldScale(ws); const ms = Math.max(Math.abs(ws.x), Math.abs(ws.y), Math.abs(ws.z)); const bc = g.boundingSphere.center.clone(); m.localToWorld(bc); const br = g.boundingSphere.radius * ms;
      const bb = g.boundingBox, size = bb.getSize(tmp); const dims = [size.x * Math.abs(ws.x), size.y * Math.abs(ws.y), size.z * Math.abs(ws.z)].sort((a, b) => b - a);
      if (dims[1] > 3.5 || dims[0] > 6 || dims[2] < 0.004) continue;   // walls, floors, ceilings, flat decals
      for (const s of all) {
        if (s.c.distanceTo(bc) > s.r + br) continue;
        loc.copy(s.c); m.worldToLocal(loc); const cl = loc.clone().clamp(bb.min, bb.max); const inside = cl.equals(loc);
        let depth; if (inside) { depth = s.r + Math.min(loc.x - bb.min.x, bb.max.x - loc.x, loc.y - bb.min.y, bb.max.y - loc.y, loc.z - bb.min.z, bb.max.z - loc.z) * Math.min(Math.abs(ws.x), Math.abs(ws.y), Math.abs(ws.z)); }
        else { const w1 = cl.clone(); m.localToWorld(w1); depth = s.r - w1.distanceTo(s.c); }
        if (depth > (s.part === 'head' ? 0.05 : 0.06)) hits.push([`${L.a.name}'s ${s.part} inside ${label(m)}`, depth]);
      }
    }
  }
  const best = {}; for (const [k, d] of hits) best[k] = Math.max(best[k] || 0, d); return { hits: Object.entries(best), shot: window.SHOT ?? window.__shot ?? null };
}

(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } }); p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto(`http://localhost:${server.address().port}/${path.relative(REPO, page).split(path.sep).join('/')}`); await p.waitForFunction('window.READY', null, { timeout: 300000 });
  if (!await p.evaluate('!!window.QA')) { console.log('page has no window.QA (see tools/check_overlap.cjs header)'); await b.close(); server.close(); process.exit(2); }
  const dur = await p.evaluate('window.DURATION'); const open = new Map(), out = [];
  await p.evaluate(`window.__probe = ${probe.toString()}`);
  for (let t = 0; t <= dur; t += step) {
    const r = await p.evaluate(t => window.__probe(t), t); const now = new Set(r.hits.map(h => h[0]));
    for (const [h, d] of r.hits) { if (!open.has(h)) open.set(h, [t, 0]); open.get(h)[1] = Math.max(open.get(h)[1], d); }
    for (const [h, [t0, d]] of [...open]) if (!now.has(h)) { if (t - t0 > step * 0.5 || d > 0.08) out.push([t0, t - step, `${h} (up to ${Math.round(d * 100)} cm)`]); open.delete(h); }
  }
  for (const [h, [t0, d]] of open) out.push([t0, dur, `${h} (up to ${Math.round(d * 100)} cm)`]);
  // group by the time range so a list reads like a shot list
  out.sort((a, c) => a[0] - c[0]);
  for (const [a, c, h] of out) console.log(`${a.toFixed(1).padStart(6)}-${c.toFixed(1).padStart(6)}  ${h}`);
  console.log(`\n${out.length} on-screen overlap(s)`);
  await b.close(); server.close(); process.exit(out.length ? 1 : 0);
})();
