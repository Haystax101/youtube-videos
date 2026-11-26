"""Quality gate: run every automatic check on a finished video before it goes to george.

Usage:
  python3 tools/qa.py EP_DIR [--video FILE] [--page PAGE.html] [--stems a.wav,b.wav] [--fix]
  python3 tools/qa.py VIDEO.mp4            (just the picture and sound checks, no episode files)

EP_DIR is an episode or set-video folder. The video defaults to EP/video.mp4 (or the newest .mp4 there).
Checks (each one PASS / WARN / FAIL):
  black      tools/check_frames.py: one-frame black tiles = FAIL (--fix patches 1-3 frame tiles into
             VIDEO.fixed.mp4 with the original audio, and re-checks it)
  dark       longer dark stretches = WARN (a dark shot on purpose, or the camera inside a wall/prop)
  guard      frames the renderer could not get clean after retries (EP/frame_guard.json, written by
             pipeline/frame_guard.cjs)
  freeze     ffmpeg freezedetect: picture not changing for 2+ s (a hung page or a stalled camera)
  loudness   ffmpeg ebur128: integrated -14 LUFS +/- 1.5 (YouTube's level), true peak <= -1 dBTP
  clipping   tools/audio_check.py on the final audio, plus static in any --stems (music/SFX stems)
  hiss       tools/hiss_scan.py on the final audio: 1 s+ runs of broadband noise (the "static" george heard)
  flicker    tools/check_flicker.py: one-frame pops (z-fighting, flashing facades, swimming shadows); the worst
             isolated ones go to EP/qa/flicker.jpg (before / pop / after) for the Claude review
  vanish     tools/check_vanish.py: labels, captions, cards or props that blink out for a frame and come back
             (also when it alternates every other frame); strip in EP/qa/vanish.jpg
  silence    ffmpeg silencedetect: dead air of 1.2 s+ inside the video
  balance    if EP/voice.wav exists: narration vs everything else under it (want >= 8 LU louder)
  length     portrait videos: warn outside 20-180 s
  continuity tools/set_check.cjs on the page (--page, or the one .html in EP_DIR; needs window.SETCHECK)
  overlap    tools/check_overlap.cjs on the same page (needs window.QA): characters through each other, heads
             or bodies inside props and furniture, from any camera that films them; FAIL if found, and FAIL
             if a set page has neither hook (then nothing checked it)
Then it writes EP/qa/contact.jpg (frames across every beat in timeline.json, about one per 1.5 s, else one
per second; each labelled with its time) for the Claude review in .claude/skills/qa-video, and EP/qa/qa.json.
Exit code 1 if anything FAILs. WARNs need a look but don't block delivery."""
import json, os, re, subprocess, sys
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
a = sys.argv[1:]
if not a or a[0] in ('-h', '--help'): print(__doc__); sys.exit(0)
opt = lambda k, d=None: a[a.index(k) + 1] if k in a else d
target = os.path.abspath(a[0])
if os.path.isdir(target):
    ep = target; video = opt('--video')
    if not video:
        mp4s = sorted((f for f in os.listdir(ep) if f.endswith('.mp4') and not f.endswith('.fixed.mp4')), key=lambda f: os.path.getmtime(os.path.join(ep, f)))
        video = os.path.join(ep, 'video.mp4') if os.path.exists(os.path.join(ep, 'video.mp4')) else (os.path.join(ep, mp4s[-1]) if mp4s else None)
else:
    ep, video = None, target
if not video or not os.path.exists(video): print('no video found; pass --video FILE'); sys.exit(2)
out_dir = os.path.join(ep, 'qa') if ep else os.path.splitext(video)[0] + '_qa'
os.makedirs(out_dir, exist_ok=True)
results = []

def add(name, status, detail): results.append({'check': name, 'status': status, 'detail': detail}); print(f'[{status:4}] {name:10} {detail}')
def run(cmd, **kw): return subprocess.run(cmd, capture_output=True, text=True, **kw)
def ff(*args): return run(['ffmpeg', '-hide_banner', '-nostats', *args]).stderr
def probe(path):
    j = json.loads(run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', path]).stdout)
    v = next((s for s in j['streams'] if s['codec_type'] == 'video'), None); au = next((s for s in j['streams'] if s['codec_type'] == 'audio'), None)
    return float(j['format']['duration']), v, au
def tail(s, n=6): return ' | '.join(l.strip() for l in s.strip().splitlines()[-n:])

dur, vs, aus = probe(video)
W, H = int(vs['width']), int(vs['height'])
fps = eval(vs.get('avg_frame_rate', '30/1').replace('/0', '/1')) or 30
print(f'{video}: {W}x{H} {fps:.0f} fps, {dur:.2f} s, audio {"yes" if aus else "NO"}')

# ---- pictures
def black_check(path):
    r = run([sys.executable, os.path.join(ROOT, 'tools', 'check_frames.py'), path, '--fps', str(round(fps))])
    return r.returncode, r.stdout
def luma_at(path, t):
    r = subprocess.run(['ffmpeg', '-loglevel', 'error', '-ss', f'{max(0, t):.3f}', '-i', path, '-frames:v', '1', '-vf', 'scale=54:96', '-pix_fmt', 'gray', '-f', 'rawvideo', '-'], capture_output=True)
    return float(np.frombuffer(r.stdout, np.uint8).mean()) if r.stdout else 0.0
def classify(txt, path=video):
    """check_frames ranges of 1-3 frames between two bright frames are glitches (FAIL). A short range next to
    dark frames is a fade/dip to black, and longer dark stretches are usually a dark shot on purpose (night,
    x-ray, inside a mouth) or the camera inside geometry: WARN, look at them."""
    short, long_ = [], []
    for s_, e_, d_ in re.findall(r'([\d.]+)-\s*([\d.]+)s\s+dark (\d+)%', txt):
        s_, e_ = float(s_), float(e_); lab = f'{s_:.2f}-{e_:.2f}s ({d_}% dark)'
        if e_ - s_ < 3.5 / fps and min(luma_at(path, s_ - 1 / fps), luma_at(path, e_ + 1 / fps)) > 35: short.append(lab)
        else: long_.append(lab)
    return short, long_
def report_black(txt, prefix='', path=video):
    short, long_ = classify(txt, path)
    if short: add('black', 'FAIL', prefix + 'one-frame black glitch at ' + ', '.join(short) + ' -> rerun with --fix, or re-render those chunks')
    elif not long_: add('black', 'PASS', prefix + 'no dark patches or black tiles')
    if long_: add('dark', 'WARN', 'dark stretch at ' + ', '.join(long_) + ': fine if the shot is meant to be dark, a bug if the camera is inside a wall or prop')
    return bool(short)
code, txt = black_check(video); video_for_rest = video
short, _ = classify(txt)
if short and '--fix' in a:
    fixed = os.path.splitext(video)[0] + '.fixed.mp4'
    run([sys.executable, os.path.join(ROOT, 'tools', 'check_frames.py'), video, '--fps', str(round(fps)), '--fix', fixed])
    if os.path.exists(fixed):
        # the patched file has no audio: put the original audio back
        muxed = fixed + '.mux.mp4'
        run(['ffmpeg', '-y', '-loglevel', 'error', '-i', fixed, '-i', video, '-map', '0:v', '-map', '1:a?', '-c', 'copy', '-shortest', muxed]); os.replace(muxed, fixed)
        _, txt = black_check(fixed); video_for_rest = fixed
        report_black(txt, f'patched -> {os.path.basename(fixed)} (deliver that file). ', fixed)
    else: report_black(txt)
else: report_black(txt)

guard = os.path.join(ep, 'frame_guard.json') if ep else None
if guard and os.path.exists(guard):
    g = json.load(open(guard)); bad = [x for x in g.get('unresolved', [])]
    add('guard', 'WARN' if bad else 'PASS', (f'{len(bad)} frame(s) still flagged after retries at ' + ', '.join(f"{x['t']:.2f}s" for x in bad[:10]) + ' (genuine dark shot, or a glitch: check them)') if bad else f"{g.get('retried', 0)} glitch frame(s) re-rendered clean")

fz = ff('-i', video_for_rest, '-vf', 'freezedetect=n=0.001:d=2', '-map', '0:v', '-f', 'null', '-')
starts = [float(x) for x in re.findall(r'freeze_start: ([\d.]+)', fz)]; durs = [float(x) for x in re.findall(r'freeze_duration: ([\d.]+)', fz)]
ends_open = len(starts) > len(durs)
spans = [f'{s:.1f}s for {d:.1f}s' for s, d in zip(starts, durs)] + ([f'{starts[-1]:.1f}s to the end'] if ends_open else [])
add('freeze', 'WARN' if spans else 'PASS', ('picture frozen at ' + ', '.join(spans) + ' (fine for a held end card, not mid-story)') if spans else 'picture keeps moving')

# ---- sound
if not aus: add('audio', 'FAIL', 'video has no audio track')
else:
    wav = os.path.join(out_dir, 'final.wav')
    run(['ffmpeg', '-y', '-loglevel', 'error', '-i', video_for_rest, '-vn', '-ac', '2', '-ar', '48000', wav])
    eb = ff('-i', wav, '-af', 'ebur128=peak=true', '-f', 'null', '-')
    summ = eb[eb.rfind('Summary:'):]
    I = float(re.search(r'I:\s+(-?[\d.]+) LUFS', summ).group(1)); TP = float(re.search(r'Peak:\s+(-?[\d.inf]+) dBFS', summ).group(1))
    st = 'PASS' if abs(I + 14) <= 1.5 and TP <= -0.9 else ('WARN' if abs(I + 14) <= 3 and TP <= 0 else 'FAIL')
    add('loudness', st, f'{I:.1f} LUFS, true peak {TP:.1f} dBTP (want -14 +/- 1.5, <= -1)' + ('' if st == 'PASS' else ' -> fix: ffmpeg loudnorm=I=-14:TP=-1.5 two-pass on the mix'))
    stems = [s for s in (opt('--stems', '') or '').split(',') if s]
    r = run([sys.executable, os.path.join(ROOT, 'tools', 'audio_check.py'), wav, *stems])
    add('clipping', 'FAIL' if r.returncode else 'PASS', tail(r.stdout, 1 + len(stems)).replace('final.wav: ', ''))
    r = run([sys.executable, os.path.join(ROOT, 'tools', 'hiss_scan.py'), wav])
    n = re.search(r': (\d+) noisy', r.stdout)
    add('hiss', 'FAIL' if r.returncode else 'PASS', (f'{n.group(1)} noisy window(s) in 1 s+ runs: ' + ', '.join(re.findall(r'^\s+([\d.]+s)', r.stdout, re.M)[:12]) + ' -> find the SFX/clip there') if r.returncode else 'no broadband static')
    sd = ff('-i', wav, '-af', 'silencedetect=n=-45dB:d=1.2', '-f', 'null', '-')
    ss = [float(x) for x in re.findall(r'silence_start: (-?[\d.]+)', sd)]; se = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', sd)]
    gaps = [(s, e) for s, e in zip(ss, se) if s > 0.3 and e < dur - 0.3]
    add('silence', 'WARN' if gaps else 'PASS', ('dead air at ' + ', '.join(f'{s:.1f}-{e:.1f}s' for s, e in gaps)) if gaps else 'no dead air')
    voice = os.path.join(ep, 'voice.wav') if ep else None
    if voice and os.path.exists(voice):
        # fit voice into the mix by least squares; whatever is left is music + SFX
        import soundfile as sf
        v, sr = sf.read(voice, always_2d=True); v = v.mean(1)
        m, _ = sf.read(wav, always_2d=True); m = m.mean(1)
        if sr != 48000: v = np.interp(np.arange(int(len(v) * 48000 / sr)) * sr / 48000, np.arange(len(v)), v)
        n_ = min(len(v), len(m)); v, m = v[:n_], m[:n_]
        g = float(np.dot(v, m) / (np.dot(v, v) + 1e-12)); bed = m - g * v
        def lufs(x):
            p = os.path.join(out_dir, '_tmp.wav'); sf.write(p, x.astype(np.float32), 48000)
            s = ff('-i', p, '-af', 'ebur128', '-f', 'null', '-'); os.remove(p)
            return float(re.findall(r'I:\s+(-?[\d.]+) LUFS', s)[-1])
        corr = float(np.corrcoef(g * v, m)[0, 1]) if n_ > 1 else 0
        if corr < 0.3: add('balance', 'WARN', f'voice.wav does not line up with the final mix (corr {corr:.2f}); skipped')
        else:
            lv, lb = lufs(g * v), lufs(bed); d = lv - lb
            add('balance', 'PASS' if d >= 8 else ('WARN' if d >= 5 else 'FAIL'), f'narration {lv:.1f} LUFS, music+SFX {lb:.1f} LUFS: voice {d:.1f} LU on top (want >= 8)')

# ---- flicker: one-frame pops (z-fighting, shadow swim, flashing facades, strobing wheels)
r = run([sys.executable, os.path.join(ROOT, 'tools', 'check_flicker.py'), video_for_rest, '600'])
ev = [(float(t), int(n)) for t, n in re.findall(r'^([\d.]+) n=(\d+)', r.stdout, re.M)]
ts = {round(t * 30) for t, _ in ev}
iso = sorted([(t, n) for t, n in ev if round(t * 30) - 1 not in ts and round(t * 30) + 1 not in ts], key=lambda x: -x[1])
if iso:
    from PIL import Image, ImageDraw
    rows = []
    for t, n in iso[:6]:   # previous / popping / next frame, pops in magenta on the middle one
        k = round(t * 30)
        raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-ss', f'{(k - 1) / fps - 0.001:.3f}', '-i', video_for_rest, '-frames:v', '3', '-vf', 'scale=270:480', '-pix_fmt', 'rgb24', '-f', 'rawvideo', '-'], capture_output=True).stdout
        if len(raw) < 3 * 270 * 480 * 3: continue
        F3 = np.frombuffer(raw, np.uint8).reshape(3, 480, 270, 3); G = F3.astype(np.float32).mean(3)
        m = (np.abs(G[1] - G[0]) > 25) & (np.abs(G[1] - G[2]) > 25) & (np.abs(G[0] - G[2]) < 10)
        mid = F3[1].copy(); mid[m] = [255, 0, 255]
        row = Image.fromarray(np.concatenate([F3[0], mid, F3[2]], 1)); ImageDraw.Draw(row).text((280, 6), f'{t:.2f}s pops {n}', fill=(255, 0, 255)); rows.append(row)
    if rows:
        strip = Image.new('RGB', (810, 480 * len(rows))); [strip.paste(rw, (0, 480 * i)) for i, rw in enumerate(rows)]
        strip.save(os.path.join(out_dir, 'flicker.jpg'), quality=85)
    big = [(t, n) for t, n in iso if n > 5000]   # > ~4% of the picture popping for one frame: a field or wall vanished
    add('flicker', 'FAIL' if big else 'WARN', (f'{len(big)} big one-frame pop(s) at ' + ', '.join(f'{t:.2f}s' for t, _ in big[:6]) + ' (z-fighting / a surface vanishing: see the No glitching in motion rules in make-set-video). ' if big else '') + f'{len(iso)} one-frame pop(s), worst at ' + ', '.join(f'{t:.2f}s' for t, _ in iso[:8]) + ' -> look at qa/flicker.jpg (before / pop / after): a flashing facade, vanishing ground or swimming shadow is a FAIL; snow, sparks or a cut are fine')
else: add('flicker', 'PASS', f'no isolated one-frame pops ({len(ev)} frames with sustained motion like particles)')

# ---- labels / cards / props vanishing for a frame (check_flicker masks the label bands; this doesn't)
r = run([sys.executable, os.path.join(ROOT, 'tools', 'check_vanish.py'), video_for_rest, '--strip', os.path.join(out_dir, 'vanish.jpg')])
rng_ = re.findall(r'^\s*([\d.]+)-\s*([\d.]+)s\s+worst ([\d.]+)s\s+(\d+) px', r.stdout, re.M)
big = [x for x in rng_ if int(x[3]) > 1500]
if big: add('vanish', 'FAIL', 'labels/cards blink out at ' + ', '.join(f'{float(a_):.1f}-{float(b_):.1f}s' for a_, b_, _, _ in big[:8]) + ' -> qa/vanish.jpg (vanished edges in green); usually two overlays fighting (z-order / depthTest on label planes) or a label toggled every other frame')
elif rng_: add('vanish', 'WARN', f'{len(rng_)} small blink(s) at ' + ', '.join(f'{float(w):.1f}s' for _, _, w, _ in rng_[:8]) + ' -> qa/vanish.jpg: an eye blink or a light is fine, a label or prop is not')
else: add('vanish', 'PASS', 'nothing blinks out for a frame')

# ---- length (Shorts)
if H > W and dur < 180: add('length', 'PASS' if 20 <= dur <= 180 else 'WARN', f'{dur:.1f} s (daily Shorts aim for 25-31 s; set videos up to 3 min)')

# ---- continuity
page = opt('--page')
if not page and ep:   # a set-video folder holds exactly one page: check it without being asked
    htmls = [f for f in os.listdir(ep) if f.endswith('.html')]
    if len(htmls) == 1: page = os.path.join(ep, htmls[0])
if page:
    nenv = {**os.environ, 'NODE_PATH': run(['npm', 'root', '-g']).stdout.strip()}
    r = run(['node', os.path.join(ROOT, 'tools', 'set_check.cjs'), os.path.abspath(page), '0.1'], env=nenv)
    if r.returncode != 2: add('continuity', 'PASS' if r.returncode == 0 else 'FAIL', tail(r.stdout, 8))
    o = run(['node', os.path.join(ROOT, 'tools', 'check_overlap.cjs'), os.path.abspath(page), '0.1'], env=nenv)
    if o.returncode == 2 and r.returncode == 2:
        add('overlap', 'FAIL', 'the page has neither window.QA nor window.SETCHECK, so nothing checked that characters and props stay out of each other; add the one-line window.QA hook (tools/check_overlap.cjs header)')
    elif o.returncode != 2:
        if ep: os.makedirs(os.path.join(ep, 'qa'), exist_ok=True); open(os.path.join(ep, 'qa', 'overlap.txt'), 'w').write(o.stdout)
        add('overlap', 'PASS' if o.returncode == 0 else 'FAIL', tail(o.stdout, 10) + (' -> full list in qa/overlap.txt' if o.returncode else ''))

# ---- contact sheet for the Claude review
times = []
tl = os.path.join(ep, 'timeline.json') if ep else None
if tl and os.path.exists(tl):
    beats = json.load(open(tl)).get('beats', [])
    for b in beats:   # every beat, about one frame per 1.5 s of it
        n = max(1, round((b['end'] - b['start']) / 1.5)); times += [b['start'] + (b['end'] - b['start']) * (k + 0.5) / n for k in range(n)]
if not times: times = list(np.arange(0.5, dur, 1.0 if dur <= 40 else dur / 40))
times = [t for t in times if t < dur - 0.05][:60]
cols = 6 if H > W else 5; tw = 270 if H > W else 384; th = round(tw * H / W)
frames = []
from PIL import Image, ImageDraw
for k, t in enumerate(times):
    p = os.path.join(out_dir, f'_f{k:03d}.jpg')
    run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', f'{t:.3f}', '-i', video_for_rest, '-frames:v', '1', '-vf', f'scale={tw}:{th}', p])
    if os.path.exists(p): frames.append((t, p))
rows = (len(frames) + cols - 1) // cols
sheet = Image.new('RGB', (cols * tw, rows * (th + 22)), (24, 24, 24)); d = ImageDraw.Draw(sheet)
for k, (t, p) in enumerate(frames):
    x, y = (k % cols) * tw, (k // cols) * (th + 22)
    sheet.paste(Image.open(p), (x, y + 22)); d.text((x + 6, y + 5), f'{t:5.2f}s', fill=(255, 255, 255)); os.remove(p)
contact = os.path.join(out_dir, 'contact.jpg'); sheet.save(contact, quality=85)
print(f'contact sheet: {contact} ({len(frames)} frames) -> review it with the qa-video skill')

fails = [r for r in results if r['status'] == 'FAIL']; warns = [r for r in results if r['status'] == 'WARN']
summary = {'video': os.path.relpath(video_for_rest, ROOT) if video_for_rest.startswith(ROOT) else video_for_rest, 'duration': round(dur, 2),
           'result': 'FAIL' if fails else 'PASS', 'checks': results, 'contact_sheet': os.path.relpath(contact, ROOT) if contact.startswith(ROOT) else contact, 'review': None}
qa_json = os.path.join(out_dir, 'qa.json')
if os.path.exists(qa_json):  # keep an earlier Claude review only if it was of this same file
    old = json.load(open(qa_json))
    if old.get('video') == summary['video'] and old.get('review_mtime') == os.path.getmtime(video_for_rest): summary['review'] = old.get('review')
summary['review_mtime'] = os.path.getmtime(video_for_rest)
json.dump(summary, open(qa_json, 'w'), indent=1)
if aus: os.remove(wav)
print(f"\nQA {'FAIL' if fails else 'PASS'}: {len(fails)} fail, {len(warns)} warn -> {qa_json}")
sys.exit(1 if fails else 0)
