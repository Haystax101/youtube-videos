// node dbg2.cjs T  -> stills/h_*.jpg: hulls off by category to find a stray ink hull
const { chromium } = require('playwright'); const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '../..'), PAGE = '/prototypes/eel-escape/eel.html';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => { const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)); if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res); }).listen(0);
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } }); p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto(`http://localhost:${server.address().port}${PAGE}`); await p.waitForFunction('window.READY', null, { timeout: 240000 }); const st = await p.$('#stage');
  const t = +process.argv[2];
  for (const mode of (process.argv[3] || 'all,none,inst,big,eel').split(',')) {
    await p.evaluate(([t, mode]) => { const hs = []; window.SCENE.traverse(o => { if (o.userData.isHull) hs.push(o); });
      for (const h of hs) { const par = h.parent; let on = true; if (mode === 'none') on = false; if (mode === 'inst') on = !h.isInstancedMesh; if (mode === 'big') on = !(par.scale.x > 1.5); if (mode === 'eel') on = !(par.frustumCulled === false); h.visible = on; }
      window.renderFrame(t); }, [t, mode]);
    await st.screenshot({ path: path.join(__dirname, 'stills', `h_${mode}.jpg`), type: 'jpeg', quality: 60 }); }
  await b.close(); server.close();
  require('child_process').execSync(`python3 -c "
from PIL import Image
ims=[Image.open('stills/h_'+m+'.jpg').resize((270,480)) for m in ['all','none','inst','big','eel']];o=Image.new('RGB',(1350,480))
for i,im in enumerate(ims): o.paste(im,(i*270,0))
o.save('stills/h.jpg')"`, { cwd: __dirname }); })();
