// Per-frame black-tile guard for the headless renderers (pipeline/render.mjs, pipeline/render_set.cjs).
//
// SwiftShader occasionally hands back a frame with a rectangle of pure black (a tile that failed to draw).
// After each screenshot the guard decodes a 54x96 thumbnail of it in the page and compares it with the
// previous frame. If more than 2% of the picture has suddenly gone pure black (or the whole frame has),
// it renders the same time again, up to RETRIES times, and keeps the cleanest attempt. A frame that stays
// black after every retry is reproducible, so it is usually a real cut to a dark shot: it is kept and
// logged as "unresolved" for tools/qa.py to show. Adds ~5-10% to render time (measured on the Archimedes set); a retry costs one extra render.
//
//   const makeGuard = require('./frame_guard.cjs');
//   const guard = makeGuard(page, () => page.screenshot({ type: 'jpeg', quality: 92 }));
//   const buf = await guard.frame(t);       // renders t, screenshots, checks, retries; returns the JPEG
//   guard.log -> { frames, retried, unresolved: [{ t, black }] }
// FRAME_GUARD=0 in the environment turns the check off.
const RETRIES = 3, NEW_BLACK = 0.02, GW = 54, GH = 96;

async function grid(page, buf) {
  return page.evaluate(async (b64) => {
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const bmp = await createImageBitmap(new Blob([bytes], { type: 'image/jpeg' }), { resizeWidth: 54, resizeHeight: 96, resizeQuality: 'medium' });
    const c = (window.__guardCanvas ||= new OffscreenCanvas(54, 96)); const x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(bmp, 0, 0); const d = x.getImageData(0, 0, 54, 96).data; const out = new Array(54 * 96);
    for (let i = 0; i < out.length; i++) out[i] = 0.299 * d[4 * i] + 0.587 * d[4 * i + 1] + 0.114 * d[4 * i + 2];
    return out;
  }, buf.toString('base64'));
}
// share of cells that are pure black now but were clearly lit in the previous frame
const newBlack = (g, prev) => { let n = 0; for (let i = 0; i < g.length; i++) if (g[i] < 6 && prev[i] > 25) n++; return n / g.length; };

module.exports = function makeGuard(page, shoot) {
  let prev = null; const log = { frames: 0, retried: 0, unresolved: [] };
  const off = process.env.FRAME_GUARD === '0';   // escape hatch / benchmarking
  async function frame(t) {
    await page.evaluate(t => window.renderFrame(t), t);
    if (off) { log.frames++; return shoot(); }
    let buf = await shoot(), g = await grid(page, buf), bad = prev ? newBlack(g, prev) : 0;
    if (bad > NEW_BLACK) {
      log.retried++;
      for (let k = 0; k < RETRIES && bad > NEW_BLACK; k++) {
        await page.evaluate(t => window.renderFrame(t), t);
        const b2 = await shoot(), g2 = await grid(page, b2), bad2 = newBlack(g2, prev);
        if (bad2 < bad) { buf = b2; g = g2; bad = bad2; }
      }
      if (bad > NEW_BLACK) log.unresolved.push({ t: +t.toFixed(3), black: +bad.toFixed(3) });
      else console.log(`[guard] black tile at ${t.toFixed(2)}s re-rendered clean`);
    }
    prev = g; log.frames++; return buf;
  }
  return { frame, log, reset: () => { prev = null; } };
};
