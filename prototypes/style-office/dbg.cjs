const { chromium } = require('playwright'); const http=require('http'),fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'../..');
const server=http.createServer((req,res)=>{const p=path.join(ROOT,decodeURIComponent(new URL(req.url,'http://x').pathname)); if(!fs.existsSync(p)||fs.statSync(p).isDirectory()){res.writeHead(404);return res.end();} res.writeHead(200,{'Content-Type':{'.html':'text/html','.js':'text/javascript'}[path.extname(p)]||'application/octet-stream'}); fs.createReadStream(p).pipe(res);}).listen(0);
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}); const p=await b.newPage({viewport:{width:1080,height:1920}}); p.on('pageerror',e=>console.log('ERR',e.message)); p.on('console',m=>console.log('[c]',m.text()));
await p.goto(`http://localhost:${server.address().port}/prototypes/style-office/office.html`); await p.waitForFunction('window.READY',null,{timeout:180000});
await p.evaluate(process.argv[2]||''); await (await p.$('#stage')).screenshot({path:'stills/dbg.jpg',quality:80}); await b.close(); server.close();})();
