// Self-check for set videos: steps through the whole timeline and reports characters or moving props
// that pass through furniture, chairs seen from behind with a flat character in them, and characters that
// pop/teleport mid-shot, using the page's window.SETCHECK(t) (see prototypes/darwin-chair/darwin.html).
// Usage: NODE_PATH=$(npm root -g) node tools/set_check.cjs EP_DIR/page.html [step=0.1]
// Prints time ranges per problem; "(off screen)" when that set isn't the one being filmed at the time.
const { chromium } = require('playwright'); const http = require('http'), fs = require('fs'), path = require('path');
const REPO = path.resolve(__dirname, '..'); const page = path.resolve(process.argv[2]); const step = +(process.argv[3] || 0.1);
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => { const p = path.join(REPO, decodeURIComponent(new URL(req.url, 'http://x').pathname)); if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res); }).listen(0);
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } }); p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto(`http://localhost:${server.address().port}/${path.relative(REPO, page).split(path.sep).join('/')}`); await p.waitForFunction('window.READY', null, { timeout: 240000 });
  if (!await p.evaluate('typeof window.SETCHECK')) { console.log('page has no window.SETCHECK'); process.exit(2); }
  const dur = await p.evaluate('window.DURATION'); const open = new Map(), out = []; let prev = null;
  const JUMP = 5.0;   // m/s: anything faster within one shot is a teleport (a pop), not a walk or a roll
  for (let t = 0; t <= dur; t += step) {
    const r = await p.evaluate(`window.SETCHECK(${t})`); const now = new Set(r.hits.map(h => h + (h.startsWith(r.set + ':') ? '' : ' (off screen)')));
    if (r.cards && prev && prev.shot === r.shot && !r.fastOK) for (const [k, x, y, z] of r.cards) { const q = prev.cards.find(c => c[0] === k);
      if (q && Math.hypot(x - q[1], y - q[2], z - q[3]) / step > JUMP) now.add(`${r.set}: ${k.split("#")[0]} moves faster than ${JUMP} m/s mid-shot (a pop or teleport)`); }
    prev = r;
    for (const h of now) if (!open.has(h)) open.set(h, t);
    for (const [h, t0] of [...open]) if (!now.has(h)) { out.push([t0, t - step, h]); open.delete(h); }
  }
  for (const [h, t0] of open) out.push([t0, dur, h]);
  out.sort((a, c) => a[0] - c[0]); const on = out.filter(o => !o[2].endsWith('(off screen)'));
  for (const [a, c, h] of out) console.log(`${a.toFixed(1).padStart(5)}-${c.toFixed(1).padStart(5)}  ${h}`);
  console.log(`\n${on.length} on-screen problem(s), ${out.length - on.length} off screen`);
  await b.close(); server.close(); process.exit(on.length ? 1 : 0);
})();
