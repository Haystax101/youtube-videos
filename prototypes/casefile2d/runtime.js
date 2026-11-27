// Page runtime for Case File episodes: loads fonts, map and timeline, exposes window.READY / DURATION /
// renderFrame(t) for pipeline/render_set.cjs, and plays a shot list.
// A shot: { t0, t1, draw(ctx, t, k, local) } where k = 0..1 through the shot and local = seconds into it.
// Cue helper: cue(beat, word) -> time the word starts (word = index or the word's text, first match).
import { W, H, post } from './engine.js';
import { loadWorld } from './sets.js';

const here = new URL('.', import.meta.url).href;
export async function boot(epUrl, buildShots, opt = {}) {
  const stage = document.getElementById('stage'); stage.style.width = W + 'px'; stage.style.height = H + 'px';
  const cv = document.getElementById('cv'); cv.width = W; cv.height = H;
  // willReadFrequently keeps the canvas on the CPU path, so headless chunk renders never show a stale frame
  const ctx = cv.getContext('2d', { willReadFrequently: true, alpha: false });
  const fonts = [['Lilita One', 'LilitaOne.ttf', '400'], ['Special Elite', 'SpecialElite.ttf', '400'], ['Caveat', 'Caveat.ttf', '400 700'], ['Nunito', 'Nunito900.ttf', '800 900']];
  await Promise.all(fonts.map(async ([f, file, wt]) => { const ff = new FontFace(f, `url(${here}fonts/${file})`, { weight: wt }); await ff.load(); document.fonts.add(ff); }));
  await Promise.all(['Lilita One', 'Special Elite', 'Caveat', '900 10px Nunito'].map(f => document.fonts.load(f.includes('px') ? f : `40px "${f}"`)));
  await loadWorld(here + 'world50m.json');
  const tl = await (await fetch(epUrl + 'timeline.json')).json();
  const cue = (b, w = 0) => { const B = tl.beats[b]; if (typeof w === 'number') return w < 0 ? B.end : (B.words[w] ? B.words[w].s : B.start);
    const i = B.words.findIndex(x => x.w.toLowerCase().replace(/[^a-z0-9']/g, '') === w.toLowerCase()); if (i < 0) throw new Error(`cue ${b} ${w}`); return B.words[i].s; };
  const end = b => tl.beats[b].end;
  const shots = buildShots({ cue, end, tl }); const DUR = opt.duration || tl.duration;
  shots.forEach((s, i) => { if (s.t1 == null) s.t1 = shots[i + 1] ? shots[i + 1].t0 : DUR; });
  window.SHOTS = shots.map(s => [s.t0, s.t1, s.name || '']);
  window.renderFrame = async (t) => {
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#111'; ctx.fillRect(0, 0, W, H);
    if (window.QA2D) window.__chars = [];
    let s = shots.find(s => t >= s.t0 && t < s.t1) || shots[shots.length - 1];
    const local = t - s.t0, k = Math.min(1, local / Math.max(0.01, s.t1 - s.t0));
    ctx.save(); s.draw(ctx, t, k, local); ctx.restore();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (s.overlay) { ctx.save(); s.overlay(ctx, t, k, local); ctx.restore(); }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    post(ctx, t, { dark: s.dark || 0 });
    // tiny pixel fill so a headless compositor always presents a fresh frame
    ctx.fillStyle = `rgba(0,0,0,${0.004 + (Math.round(t * 30) % 2) * 0.002})`; ctx.fillRect(0, 0, 1, 1);
  };
  window.DURATION = DUR; window.READY = true;
  const q = new URLSearchParams(location.search); if (q.has('t')) window.renderFrame(+q.get('t'));
  return { ctx, shots, cue, tl };
}
