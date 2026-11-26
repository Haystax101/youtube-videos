// node rend.cjs stills 1,5,9   (renders prototypes/eel-escape/eel.html stills into ./stills)
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '../..'), PAGE = '/prototypes/eel-escape/eel.html';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => { const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res); }).listen(0);
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } }); p.on('pageerror', e => console.log('ERR', e.message)); p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.log('[c]', m.text().slice(0, 300)); });
  await p.goto(`http://localhost:${server.address().port}${PAGE}`); await p.waitForFunction('window.READY', null, { timeout: 240000 }); const st = await p.$('#stage');
  const dir = path.join(__dirname, 'stills'); fs.mkdirSync(dir, { recursive: true });
  for (const s of process.argv[3].split(',')) { const t0 = Date.now(); const dbg = await p.evaluate(t => { window.renderFrame(t); return window.DBG; }, +s); await st.screenshot({ path: path.join(dir, `s_${s}.jpg`), type: 'jpeg', quality: 85 }); console.log(s, Date.now() - t0, 'ms', JSON.stringify(dbg)); }
  await b.close(); server.close(); })();
