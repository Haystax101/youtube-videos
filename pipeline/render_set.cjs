// Chunked, cached renderer for one-continuous-camera "set" videos (three.js pages exposing
// window.READY, window.DURATION and window.renderFrame(t)).
//
// The video is rendered in 2-second chunks (EP/chunks/c000.mp4, c001.mp4, ...). Chunks that already
// exist are reused, so after a change you only re-render the seconds that changed:
//
//   node pipeline/render_set.cjs EP_DIR                       # render missing chunks, join -> EP/silent.mp4
//   node pipeline/render_set.cjs EP_DIR --redo 54-80          # re-render seconds 54-80 only
//   node pipeline/render_set.cjs EP_DIR --redo all            # everything
//   node pipeline/render_set.cjs EP_DIR --part 2/8            # render only every 8th chunk starting at 2
//                                                             # (split one video across machines / CI jobs)
//   node pipeline/render_set.cjs EP_DIR --seed old.mp4 --keep 0-54   # cut chunks from an earlier full render
//   options: --page claw.html (default: the only .html in EP_DIR), --workers 4, --join-only
// Then mux: ffmpeg -i EP/silent.mp4 -i EP/audio.norm.wav -c:v copy -c:a aac -b:a 192k -shortest EP/video.mp4
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), { spawn, spawnSync } = require('child_process');
const REPO = path.resolve(__dirname, '..'), FPS = 30, CHUNK = 2;
const args = process.argv.slice(2), EP = path.resolve(args[0]);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i < 0 ? d : (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true); };
const page = opt('page', fs.readdirSync(EP).filter(f => f.endsWith('.html'))[0]);
const PAGE = '/' + path.relative(REPO, path.join(EP, page)).split(path.sep).join('/');
const WORKERS = +opt('workers', 4), CH_DIR = path.join(EP, 'chunks'); fs.mkdirSync(CH_DIR, { recursive: true });
const cfile = i => path.join(CH_DIR, `c${String(i).padStart(3, '0')}.mp4`);
const range = s => { if (s === 'all') return [0, 1e9]; const [a, b] = String(s).split('-').map(Number); return [a, b ?? a]; };
const ENC = ['-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(FPS)];

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg' };
const server = http.createServer((req, res) => { const p = path.join(REPO, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(REPO) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res); }).listen(0);
const port = server.address().port;
async function open() {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('pageerror', e => console.log('ERR', e.message)); p.on('console', m => { if (m.type() === 'error') console.log('[c]', m.text()); });
  await p.goto(`http://localhost:${port}${PAGE}`); await p.waitForFunction('window.READY', null, { timeout: 180000 });
  const vp = await p.evaluate(() => { const r = document.getElementById('stage').getBoundingClientRect(); return [r.width, r.height]; });
  if (vp[0] !== 1080) await p.setViewportSize({ width: vp[0], height: vp[1] });
  return { b, p, dur: await p.evaluate(() => window.DURATION) };
}
const ff = (a) => spawnSync('ffmpeg', ['-y', '-loglevel', 'error', ...a], { stdio: 'inherit' });

(async () => {
  const probe = await open(); const total = Math.round(probe.dur * FPS), nChunks = Math.ceil(total / (CHUNK * FPS)); await probe.b.close();
  const chunkSpan = i => [i * CHUNK * FPS, Math.min(total, (i + 1) * CHUNK * FPS)];
  if (opt('seed')) {  // reuse an earlier full render for the chunks in --keep
    const [ka, kb] = range(opt('keep', 'all'));
    const keepTo = Math.min(kb, nChunks * CHUNK), first = Math.ceil(ka / CHUNK), last = Math.floor(keepTo / CHUNK);  // chunks [first, last)
    for (let i = first; i < last; i++) { const [f0, f1] = chunkSpan(i);
      ff(['-ss', (f0 / FPS).toFixed(4), '-i', opt('seed'), '-frames:v', String(f1 - f0), ...ENC, '-an', cfile(i)]); }
    console.log('seeded chunks from', opt('seed'));
  }
  if (opt('redo')) { const [a, b] = range(opt('redo')); for (let i = 0; i < nChunks; i++) if ((i + 1) * CHUNK > a && i * CHUNK < b && fs.existsSync(cfile(i))) fs.unlinkSync(cfile(i)); }
  let todo = [...Array(nChunks).keys()].filter(i => !fs.existsSync(cfile(i)));
  if (opt('part')) { const [k, n] = opt('part').split('/').map(Number); todo = todo.filter(i => i % n === k); }
  if (opt('join-only')) todo = [];
  console.log(`${nChunks} chunks, rendering ${todo.length} with ${WORKERS} workers`);
  const t0 = Date.now(); let done = 0;
  await Promise.all([...Array(Math.min(WORKERS, todo.length))].map(async () => {
    const w = await open();
    while (todo.length) { const i = todo.shift(); const [f0, f1] = chunkSpan(i); const tmp = cfile(i) + '.part.mp4';
      const enc = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', ...ENC, tmp], { stdio: ['pipe', 'inherit', 'inherit'] });
      const closed = new Promise(r => enc.on('close', r));
      for (let f = f0; f < f1; f++) { await w.p.evaluate(t => window.renderFrame(t), f / FPS); const buf = await w.p.screenshot({ type: 'jpeg', quality: 92 });
        if (!enc.stdin.write(buf)) await new Promise(r => enc.stdin.once('drain', r)); }
      enc.stdin.end(); await closed; fs.renameSync(tmp, cfile(i)); done++;
      console.log(`chunk ${i} done (${done} this run, ${((Date.now() - t0) / 1000).toFixed(0)}s)`); }
    await w.b.close(); }));
  server.close();
  const missing = [...Array(nChunks).keys()].filter(i => !fs.existsSync(cfile(i)));
  if (missing.length) { console.log('not joined; missing chunks', missing.join(',')); return; }
  fs.writeFileSync(path.join(CH_DIR, 'list.txt'), [...Array(nChunks).keys()].map(i => `file '${path.basename(cfile(i))}'`).join('\n'));
  ff(['-f', 'concat', '-safe', '0', '-i', path.join(CH_DIR, 'list.txt'), '-c', 'copy', path.join(EP, 'silent.mp4')]);
  console.log('joined', path.join(EP, 'silent.mp4'), ((Date.now() - t0) / 1000).toFixed(0) + 's');
})();
