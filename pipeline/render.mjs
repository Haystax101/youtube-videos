// Render an episode to MP4: serves the repo, drives web/index.html headlessly,
// pipes JPEG frames into ffmpeg, then muxes in audio.mix.wav (or voice.wav).
// Usage: node pipeline/render.mjs EP_DIR [--fps 30] [--stills 1,5,9] [--workers N]
// EP_DIR may be nested (episodes/long/001-slug). Portrait 1080x1920 by default,
// 1920x1080 when script.json has "format": "landscape".
// --workers N splits the frames across N headless browsers (default: CPU count, max 4)
// and joins the parts, which roughly halves long renders on a 4-core machine.
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const args = process.argv.slice(2);
const epDir = path.resolve(args[0]);
const epRel = path.relative(path.join(ROOT, 'episodes'), epDir);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const FPS = +opt('fps', 30);
const stills = opt('stills', null);
const WORKERS = Math.max(1, +opt('workers', Math.min(4, os.cpus().length)));
const script = JSON.parse(fs.readFileSync(path.join(epDir, 'script.json'), 'utf8'));
const [VW, VH] = script.format === 'landscape' ? [1920, 1080] : [1080, 1920];

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
}).listen(0);
const port = server.address().port;

async function openPage() {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: VW, height: VH }, deviceScaleFactor: 1 });
  page.on('console', m => { if (m.type() === 'error') console.error('[page]', m.text()); });
  page.on('pageerror', e => console.error('[page error]', e.message));
  await page.goto(`http://localhost:${port}/web/index.html?ep=${encodeURIComponent(epRel)}`);
  await page.waitForFunction(() => window.READY === true, null, { timeout: 120000 });
  return { browser, page, stage: await page.$('#stage'), duration: await page.evaluate(() => window.DURATION) };
}

function ffmpeg(argv) {
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', ...argv], { stdio: ['pipe', 'inherit', 'inherit'] });
  ff.done = new Promise((res, rej) => ff.on('close', c => c === 0 ? res() : rej(new Error('ffmpeg exited ' + c))));
  return ff;
}

async function renderRange(w, from, n, out, label) {
  const ff = ffmpeg(['-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-maxrate', '12M', '-bufsize', '24M', '-pix_fmt', 'yuv420p', '-r', String(FPS), out]);
  const t0 = Date.now();
  for (let i = 0; i < n; i++) {
    await w.page.evaluate(t => window.renderFrame(t), (from + i) / FPS);
    const buf = await w.stage.screenshot({ type: 'jpeg', quality: 92 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 300 === 0) console.log(`${label} frame ${i}/${n} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  }
  ff.stdin.end();
  await ff.done;
}

const t0 = Date.now();
if (stills) {
  const w = await openPage();
  for (const s of stills.split(',')) {
    await w.page.evaluate(t => window.renderFrame(t), +s);
    await w.stage.screenshot({ path: path.join(epDir, `still_${s}.jpg`), type: 'jpeg', quality: 85 });
  }
  await w.browser.close();
  console.log('stills written');
} else {
  const first = await openPage();
  const total = Math.round(first.duration * FPS);
  const workers = Math.min(WORKERS, Math.max(1, Math.floor(total / 300)));
  const tmp = path.join(ROOT, '.render_tmp', epRel.replace(/[\\/]/g, '_'));
  fs.rmSync(tmp, { recursive: true, force: true }); fs.mkdirSync(tmp, { recursive: true });
  const per = Math.ceil(total / workers);
  const pages = [first, ...await Promise.all(Array.from({ length: workers - 1 }, openPage))];
  const parts = [];
  await Promise.all(pages.map((w, k) => {
    const from = k * per, n = Math.min(per, total - from);
    const out = path.join(tmp, `part_${String(k).padStart(2, '0')}.mp4`); parts.push(out);
    return renderRange(w, from, n, out, `[w${k}]`);
  }));
  await Promise.all(pages.map(w => w.browser.close()));
  parts.sort();
  fs.writeFileSync(path.join(tmp, 'list.txt'), parts.map(p => `file '${p}'`).join('\n'));
  const audio = fs.existsSync(path.join(epDir, 'audio.mix.wav')) ? 'audio.mix.wav' : 'voice.wav';
  const out = path.join(epDir, 'video.mp4');
  await ffmpeg(['-f', 'concat', '-safe', '0', '-i', path.join(tmp, 'list.txt'), '-i', path.join(epDir, audio),
    '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out]).done;
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`wrote ${out} (${total} frames, ${workers} workers) in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
server.close();
