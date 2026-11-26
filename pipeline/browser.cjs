// One place that launches headless Chromium for every renderer, so they all use the fastest software GL.
//
// Linux (GitHub runners, cloud sessions): Mesa llvmpipe through ANGLE's GL backend, in a headed Chromium on
// an Xvfb virtual display. Measured on the Archimedes set (4-core machine, 4 browsers): 3.9 frames/s vs 2.0
// with SwiftShader, with pixel-identical output (mean difference 0.7/255). llvmpipe needs a display, so
// call reexecUnderXvfb() first thing: it restarts the script under `xvfb-run` when there is no DISPLAY.
// Elsewhere (george's Mac), or with RENDER_GL=swiftshader, or if Xvfb/Mesa are missing: SwiftShader as before.
const { spawnSync } = require('child_process');
const has = (cmd) => spawnSync('sh', ['-c', `command -v ${cmd}`]).status === 0;
const SWIFTSHADER = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const LLVMPIPE = ['--use-gl=angle', '--use-angle=gl', '--ignore-gpu-blocklist'];

function mode() {
  if (process.env.RENDER_GL === 'swiftshader' || process.platform !== 'linux') return 'swiftshader';
  return process.env.DISPLAY ? 'llvmpipe' : 'swiftshader';
}

// Restart this process under xvfb-run (once) so llvmpipe has a display. Returns only if no restart happened.
function reexecUnderXvfb() {
  if (process.platform !== 'linux' || process.env.DISPLAY || process.env.RENDER_GL === 'swiftshader' || process.env.__XVFB_DONE || !has('xvfb-run')) return;
  const r = spawnSync('xvfb-run', ['-a', '-s', '-screen 0 1920x1920x24', process.execPath, ...process.argv.slice(1)],
    { stdio: 'inherit', env: { ...process.env, __XVFB_DONE: '1' } });
  process.exit(r.status ?? 1);
}

async function glName(b) {
  const p = await b.newPage();
  const n = await p.evaluate(() => { const c = document.createElement('canvas').getContext('webgl2'); if (!c) return 'none';
    const e = c.getExtension('WEBGL_debug_renderer_info'); return e ? c.getParameter(e.UNMASKED_RENDERER_WEBGL) : c.getParameter(c.RENDERER); });
  await p.close(); return n;
}
async function launch(chromium) {
  let m = mode();
  let b = await chromium.launch({ args: m === 'llvmpipe' ? LLVMPIPE : SWIFTSHADER, headless: m !== 'llvmpipe' });
  if (m === 'llvmpipe' && !launch.checked) {   // once per process: make sure Mesa really took over, else fall back
    const n = await glName(b); launch.checked = true;
    if (!/llvmpipe/i.test(n)) { console.log(`[gl] llvmpipe unavailable (${n}); using swiftshader`); process.env.RENDER_GL = 'swiftshader'; await b.close(); m = 'swiftshader';
      b = await chromium.launch({ args: SWIFTSHADER, headless: true }); }
  }
  if (!launch.said) { launch.said = true; console.log(`[gl] ${m}`); }
  return b;
}

module.exports = { launch, reexecUnderXvfb, mode };
