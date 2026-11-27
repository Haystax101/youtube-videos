// node shot.cjs page.html out.png [w h]  — serve the repo and screenshot a page once window.DONE/READY
const { chromium } = require('playwright'); const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '../..'); const T = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2', '.jpeg': 'image/jpeg', '.jpg': 'image/jpeg', '.png': 'image/png' };
const srv = http.createServer((q, r) => { const p = path.join(ROOT, decodeURIComponent(new URL(q.url, 'http://x').pathname)); if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': T[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(r); }).listen(0);
(async () => { const [page, out, w = 1800, h = 640, arg = ''] = process.argv.slice(2);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: +w, height: +h } }); p.on('pageerror', e => { console.log('ERR', e.message); process.exit(1); }); p.on('console', m => console.log('[c]', m.text()));
  await p.goto(`http://localhost:${srv.address().port}/prototypes/smol-look/${page}${arg}`); await p.waitForFunction('window.DONE', null, { timeout: 300000 });
  await p.screenshot({ path: out }); await b.close(); srv.close(); })();
