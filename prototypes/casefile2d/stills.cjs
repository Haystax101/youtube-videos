// node prototypes/casefile2d/stills.cjs PAGE.html t1,t2,... OUTDIR  -> OUTDIR/s_<t>.jpg (1920x1080)
const { chromium } = require('playwright'); const http = require('http'), fs = require('fs'), path = require('path');
const REPO = path.resolve(__dirname, '../..'); const [page, ts, out] = process.argv.slice(2); fs.mkdirSync(out, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.ttf': 'font/ttf' };
const srv = http.createServer((q, r) => { const p = path.join(REPO, decodeURIComponent(new URL(q.url, 'http://x').pathname)); if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(r); }).listen(0);
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  p.on('pageerror', e => console.log('ERR', e.message)); p.on('console', m => { if (m.type() === 'error') console.log('[c]', m.text()); });
  await p.goto(`http://localhost:${srv.address().port}/${path.relative(REPO, path.resolve(page))}`); await p.waitForFunction('window.READY', null, { timeout: 60000 });
  const list = ts === 'shots' ? (await p.evaluate(() => window.SHOTS)).map(s => +((s[0] + s[1]) / 2).toFixed(2)) : ts.split(',').map(Number);
  for (const t of list) { const t0 = Date.now(); await p.evaluate(t => window.renderFrame(t), t); await p.locator('#stage').screenshot({ path: `${out}/s_${String(t.toFixed(2)).padStart(6, '0')}.jpg`, type: 'jpeg', quality: 90 }); console.log(t, Date.now() - t0, 'ms'); }
  await b.close(); srv.close(); })();
