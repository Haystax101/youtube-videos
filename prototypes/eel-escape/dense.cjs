// node dense.cjs STEP [T0 T1] -> stills/dense_*.jpg sheets (10 x 6 thumbs each) + black-frame report
const { chromium } = require('playwright'); const http = require('http'), fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const ROOT = path.resolve(__dirname, '../..'), PAGE = '/prototypes/eel-escape/eel.html';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => { const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)); if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res); }).listen(0);
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } }); p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto(`http://localhost:${server.address().port}${PAGE}`); await p.waitForFunction('window.READY', null, { timeout: 240000 }); const st = await p.$('#stage');
  const dur = await p.evaluate(() => window.DURATION), step = +process.argv[2] || 0.5, t0 = +(process.argv[3] || 0), t1 = +(process.argv[4] || dur);
  const dir = path.join(__dirname, 'stills', 'dense'); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  let n = 0; for (let t = t0; t <= t1; t += step) { await p.evaluate(t => window.renderFrame(t), t); await st.screenshot({ path: path.join(dir, `${String(n++).padStart(4, '0')}_${t.toFixed(2)}.jpg`), type: 'jpeg', quality: 70 }); }
  await b.close(); server.close();
  console.log(execSync(`python3 -c "
import glob,os
from PIL import Image,ImageDraw,ImageStat
fs=sorted(glob.glob('${dir}/*.jpg'));per=60;dark=[]
for k in range(0,len(fs),per):
  o=Image.new('RGB',(10*162,6*288))
  for i,f in enumerate(fs[k:k+per]):
    im=Image.open(f);L=ImageStat.Stat(im.convert('L')).mean[0]
    if L<20: dark.append(os.path.basename(f)[5:-4])
    im=im.resize((162,288));d=ImageDraw.Draw(im);d.rectangle([0,0,50,14],fill='black');d.text((2,1),os.path.basename(f)[5:-4],fill='white');o.paste(im,((i%10)*162,(i//10)*288))
  o.save('${path.join(__dirname, 'stills')}/dense_%d.jpg'%(k//per))
print('near-black frames (mean luma < 20/255):', dark or 'none')"`).toString()); })();
