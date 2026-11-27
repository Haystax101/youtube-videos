// Overlap check for flat 2D pages (Case File look, prototypes/casefile2d). The page sets window.QA2D = true;
// engine.drawChar then records each character's head circle and body box (screen px) per frame in
// window.__chars. Reports, on screen only: two heads overlapping, or a head inside another character's body.
// Characters drawn with qaSkip (a deliberate hug, an arrest grab) are ignored.
// Usage: node tools/check_overlap2d.cjs PAGE.html [step=0.1]   exit 0 clean, 1 overlaps, 2 no window.QA2D
const { chromium } = require('playwright'); const http = require('http'), fs = require('fs'), path = require('path');
const REPO = path.resolve(__dirname, '..'); const page = path.resolve(process.argv[2]); const step = +(process.argv[3] || 0.1);
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.ttf': 'font/ttf' };
const srv = http.createServer((q, r) => { const p = path.join(REPO, decodeURIComponent(new URL(q.url, 'http://x').pathname)); if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(r); }).listen(0);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  await p.goto(`http://localhost:${srv.address().port}/${path.relative(REPO, page)}`); await p.waitForFunction('window.READY', null, { timeout: 120000 });
  if (!(await p.evaluate(() => !!window.QA2D))) { console.log('no window.QA2D'); await b.close(); srv.close(); process.exit(2); }
  const res = await p.evaluate(async (step) => {
    const out = [];
    for (let t = 0; t < window.DURATION; t += step) {
      await window.renderFrame(t); const C = window.__chars || [];
      const on = c => c.head[0] > -60 && c.head[0] < 1980 && c.head[1] > -60 && c.head[1] < 1140;
      for (let i = 0; i < C.length; i++) for (let j = 0; j < C.length; j++) { if (i === j) continue; const A = C[i], B = C[j]; if (!on(A) || !on(B)) continue;
        if (i < j && Math.hypot(A.head[0] - B.head[0], A.head[1] - B.head[1]) < (A.head[2] + B.head[2]) * 0.92) out.push(`${t.toFixed(1)}s heads overlap: ${A.name} / ${B.name}`);
        const [x0, y0, x1, y1] = B.body; const r = A.head[2] * 0.6; if (A.head[0] > x0 - r && A.head[0] < x1 + r && A.head[1] > y0 - r && A.head[1] < y1 + r) out.push(`${t.toFixed(1)}s head of ${A.name} inside body of ${B.name}`); }
    }
    return out;
  }, step);
  const uniq = [...new Set(res)]; uniq.forEach(l => console.log(l)); console.log(`${uniq.length} overlap(s)`);
  await b.close(); srv.close(); process.exit(uniq.length ? 1 : 0);
})();
