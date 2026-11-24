// Render an episode to MP4: serves the repo, drives web/index.html headlessly,
// pipes JPEG frames into ffmpeg, then muxes in audio.mix.wav (or voice.wav).
// Usage: node pipeline/render.mjs episodes/<slug> [--fps 30] [--stills 1,5,9] [--from 0 --to 5]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const args = process.argv.slice(2);
const epDir = path.resolve(args[0]);
const slug = path.basename(epDir);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const FPS = +opt('fps', 30);
const stills = opt('stills', null);

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
}).listen(0);
const port = server.address().port;

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
page.on('console', m => { if (m.type() === 'error') console.error('[page]', m.text()); });
page.on('pageerror', e => console.error('[page error]', e.message));
await page.goto(`http://localhost:${port}/web/index.html?ep=${slug}`);
await page.waitForFunction(() => window.READY === true, null, { timeout: 60000 });
const duration = await page.evaluate(() => window.DURATION);
const stage = await page.$('#stage');

if (stills) {
  for (const s of stills.split(',')) {
    await page.evaluate(t => window.renderFrame(t), +s);
    await stage.screenshot({ path: path.join(epDir, `still_${s}.jpg`), type: 'jpeg', quality: 85 });
  }
  console.log('stills written');
} else {
  const from = +opt('from', 0), to = Math.min(+opt('to', duration), duration);
  const out = path.join(epDir, 'video.mp4');
  const audio = fs.existsSync(path.join(epDir, 'audio.mix.wav')) ? 'audio.mix.wav' : 'voice.wav';
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-ss', String(from), '-i', path.join(epDir, audio), '-map', '0:v', '-map', '1:a',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', '-r', String(FPS),
    '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const n = Math.round((to - from) * FPS);
  const t0 = Date.now();
  for (let i = 0; i < n; i++) {
    await page.evaluate(t => window.renderFrame(t), from + i / FPS);
    const buf = await stage.screenshot({ type: 'jpeg', quality: 92 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 150 === 0) console.log(`frame ${i}/${n} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  console.log(`wrote ${out} in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
await browser.close();
server.close();
