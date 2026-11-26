// node board.cjs [frac]  -> stills/board_*.jpg + stills/board.jpg contact sheet (one still per shot at frac of its length)
const { chromium } = require('playwright'); const http = require('http'), fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const ROOT = path.resolve(__dirname, '../..'), PAGE = '/prototypes/eel-escape/eel.html';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => { const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)); if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res); }).listen(0);
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } }); p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto(`http://localhost:${server.address().port}${PAGE}`); await p.waitForFunction('window.READY', null, { timeout: 240000 }); const st = await p.$('#stage');
  const shots = await p.evaluate(() => window.SHOTS), dur = await p.evaluate(() => window.DURATION); const fr = +(process.argv[2] || 0.5); const only = process.argv[3] ? process.argv[3].split(',').map(Number) : null; const files = [];
  for (let i = 0; i < shots.length; i++) { if (only && !only.includes(i)) continue; const t = shots[i] + ((shots[i + 1] ?? dur) - shots[i]) * fr; await p.evaluate(t => window.renderFrame(t), t); const f = path.join(__dirname, 'stills', `board_${String(i).padStart(2, '0')}.jpg`); await st.screenshot({ path: f, type: 'jpeg', quality: 80 }); files.push(f); console.log(i, t.toFixed(2)); }
  await b.close(); server.close();
  execSync(`python3 -c "
import sys;from PIL import Image,ImageDraw
fs=sys.argv[1:];n=len(fs);c=6;r=(n+c-1)//c;o=Image.new('RGB',(c*270,r*480))
for i,f in enumerate(fs):
  im=Image.open(f).resize((270,480));d=ImageDraw.Draw(im);d.rectangle([0,0,40,24],fill='black');d.text((4,4),f[-6:-4],fill='white');o.paste(im,((i%c)*270,(i//c)*480))
o.save('${path.join(__dirname, 'stills', 'board.jpg')}')" ${files.join(' ')}`); })();
