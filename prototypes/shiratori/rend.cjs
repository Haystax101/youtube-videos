// node rend.cjs stills 1,5,9  |  node rend.cjs video out.mp4 [workers]
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), { spawn } = require('child_process');
const ROOT = path.resolve(__dirname, '../..'), PAGE = '/prototypes/shiratori/' + (process.env.PAGE || 'shira.html');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => { const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res); }).listen(0);
const port = server.address().port, FPS = 30;
async function open() { const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } }); p.on('pageerror', e => { console.log('ERR', e.message); process.exit(1); }); p.on('console', m => { if (m.type() === 'error') console.log('[c]', m.text()); });
  await p.goto(`http://localhost:${port}${PAGE}`); await p.waitForFunction('window.READY', null, { timeout: 180000 }); return { b, p, st: await p.$('#stage'), dur: await p.evaluate(() => window.DURATION) }; }
(async () => {
  const [mode, a1, a2] = process.argv.slice(2);
  if (mode === 'stills') { const w = await open(); const dir = path.join(__dirname, 'stills'); fs.mkdirSync(dir, { recursive: true });
    for (const s of a1.split(',')) { const t0 = Date.now(); await w.p.evaluate(t => window.renderFrame(t), +s); await w.st.screenshot({ path: path.join(dir, `s_${s}.jpg`), type: 'jpeg', quality: 85, timeout: 180000 }); console.log(s, Date.now() - t0, 'ms'); }
    await w.b.close(); server.close(); return; }
  const out = a1, N = +(a2 || 4); const probe = await open(); const T0 = Math.round(+(process.env.TMIN || 0) * FPS), total = (process.env.TMAX ? Math.round(+process.env.TMAX * FPS) : Math.round(probe.dur * FPS)) - T0; await probe.b.close(); const per = Math.ceil(total / N);
  await Promise.all([...Array(N)].map(async (_, k) => { const w = await open(); const from = k * per, n = Math.min(per, total - from);
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', path.join(__dirname, `part${k}.mp4`)], { stdio: ['pipe', 'inherit', 'inherit'] });
    const done = new Promise(r => ff.on('close', r)); const t0 = Date.now();
    for (let i = 0; i < n; i++) { await w.p.evaluate(t => window.renderFrame(t), (T0 + from + i) / FPS); const buf = await w.st.screenshot({ type: 'jpeg', quality: 92 }); if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r)); if (i % 60 === 0) console.log(k, i, n, ((Date.now() - t0) / 1000).toFixed(0) + 's'); }
    ff.stdin.end(); await done; await w.b.close(); }));
  fs.writeFileSync(path.join(__dirname, 'parts.txt'), [...Array(N)].map((_, k) => `file 'part${k}.mp4'`).join('\n'));
  await new Promise(r => spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(__dirname, 'parts.txt'), '-c', 'copy', out], { stdio: 'inherit' }).on('close', r));
  server.close(); console.log('done', out);
})();
