// node stills.cjs PAGE.html 1,5,9 [outdir]  -> outdir/s_<t>.jpg (llvmpipe under xvfb, like render_set.cjs)
const { chromium } = require('playwright'); const gl = require('../../../pipeline/browser.cjs'); gl.reexecUnderXvfb();
const http = require('http'), fs = require('fs'), path = require('path');
const REPO = path.resolve(__dirname, '../../..'), [pageArg, list, outArg] = process.argv.slice(2);
const PAGE = '/' + path.relative(REPO, path.resolve(pageArg)).split(path.sep).join('/'), OUT = path.resolve(outArg || path.join(path.dirname(path.resolve(pageArg)), 'stills'));
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => { const p = path.join(REPO, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res); }).listen(0);
(async () => { fs.mkdirSync(OUT, { recursive: true });
  const b = await gl.launch(chromium); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('pageerror', e => { console.log('ERR', e.message); }); p.on('console', m => { if (m.type() === 'error' || m.text().startsWith('[c]')) console.log('[c]', m.text()); });
  await p.goto(`http://localhost:${server.address().port}${PAGE}`); await p.waitForFunction('window.READY', null, { timeout: 240000 });
  const st = await p.$('#stage'); console.log('duration', await p.evaluate(() => window.DURATION));
  let L = list.split(','); if (list === 'shots') { const [ts, D] = await p.evaluate(() => [window.DBG.SHOTS.map(s => s.t), window.DURATION]); L = ts.map((t, i) => ((t + (ts[i + 1] ?? D)) / 2).toFixed(2)); }
  for (const s of L) { const t0 = Date.now(); await p.evaluate(t => window.renderFrame(t), +s); await st.screenshot({ path: path.join(OUT, `s_${s}.jpg`), type: 'jpeg', quality: 85 }); console.log(s, Date.now() - t0, 'ms'); }
  await b.close(); server.close(); })();
