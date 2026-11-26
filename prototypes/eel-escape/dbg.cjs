// node dbg.cjs "t;px,py,pz;lx,ly,lz;fov;name" ...  camera in fish-local coords (FOCUS=x for the X-ray fish)
const { chromium } = require('playwright'); const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '../..'), PAGE = '/prototypes/eel-escape/eel.html';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => { const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)); if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res); }).listen(0);
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } }); p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto(`http://localhost:${server.address().port}${PAGE}`); await p.waitForFunction('window.READY', null, { timeout: 240000 }); const st = await p.$('#stage'); fs.mkdirSync(path.join(__dirname, 'stills'), { recursive: true });
  for (const a of process.argv.slice(2)) { const [t, pp, ll, fov, name, focus] = a.split(';'); await p.evaluate(([t, pp, ll, fov, focus]) => { window.FOCUS = focus; return window.dbg(+t, pp.split(',').map(Number), ll.split(',').map(Number), +fov); }, [t, pp, ll, fov, focus]);
    await st.screenshot({ path: path.join(__dirname, 'stills', name + '.jpg'), type: 'jpeg', quality: 80 }); console.log(name); }
  await b.close(); server.close(); })();
