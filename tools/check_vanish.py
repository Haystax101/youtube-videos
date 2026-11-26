"""Find labels, captions, cards or props that vanish for a frame and come back (george spotted labels
flickering all through dark-story 002, 26 Nov; check_flicker.py masks the label bands and misses them).

A pixel counts when it sits on a hard edge in the frames before and after, the picture there is the same before
and after, and the edge is gone in this frame: something was there, blinked out, and came back. Moving things
don't count (before and after differ), and neither do cuts. Works when the flicker alternates every other frame.
Usage: python3 tools/check_vanish.py VIDEO [--strip OUT.jpg]
Prints time ranges with the worst frame and its vanished-edge pixel count (at 540x960); exit 1 if any frame has
more than 1500 (a label or card). 800-1500 is often a blink or a small light: look at the strip.
Usual cause (002): a GPU-accelerated 2D overlay canvas not presenting its cleared frame in headless renders; fix with
getContext('2d', { willReadFrequently: true }) plus a tiny pixel fill after clearRect."""
import subprocess, sys, numpy as np

W, H, FAIL, WARN = 540, 960, 1500, 800
a = sys.argv[1:]; v = a[0]; strip = a[a.index('--strip') + 1] if '--strip' in a else None
fps = 30.0
try:
    r = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=avg_frame_rate', '-of', 'csv=p=0', v], capture_output=True, text=True).stdout.strip()
    n_, d_ = r.split('/'); fps = float(n_) / float(d_) if float(d_) else 30.0
except Exception: pass
p = subprocess.Popen(['ffmpeg', '-loglevel', 'error', '-i', v, '-vf', f'scale={W}:{H}', '-pix_fmt', 'gray', '-f', 'rawvideo', '-'], stdout=subprocess.PIPE)
def nxt():
    b = p.stdout.read(W * H); return None if len(b) < W * H else np.frombuffer(b, np.uint8).astype(np.float32).reshape(H, W)
def edges(x): return np.maximum(np.abs(np.diff(x, axis=1, append=x[:, -1:])), np.abs(np.diff(x, axis=0, append=x[-1:])))
fa, fb, fc = nxt(), nxt(), nxt(); k = 1; S = []
if fc is not None: Ea, Eb = edges(fa), edges(fb)
while fc is not None:
    Ec = edges(fc)
    van = (Ea > 60) & (Ec > 60) & (Eb < 20) & (np.abs(fa - fc) < 12)
    S.append((k, int(van.sum())))
    fa, fb, fc, Ea, Eb = fb, fc, nxt(), Eb, Ec; k += 1
bad = [(k, n) for k, n in S if n > WARN]
ranges = []
for k, n in bad:
    if ranges and k - ranges[-1][1] <= 3: ranges[-1][1] = k; ranges[-1][2] = max(ranges[-1][2], (n, k))
    else: ranges.append([k, k, (n, k)])
for s, e, (n, kk) in ranges: print(f'{s / fps:6.2f}-{e / fps:6.2f}s  worst {kk / fps:.2f}s  {n} px{"  LABEL/CARD VANISHES" if n > FAIL else ""}')
fails = sum(1 for *_, (n, _) in ranges if n > FAIL)
print(f'{len(ranges)} vanish range(s), {fails} over {FAIL} px')
if strip and ranges:
    from PIL import Image
    rows = []
    for s, e, (n, kk) in sorted(ranges, key=lambda r: -r[2][0])[:6]:
        raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-ss', f'{(kk - 1) / fps - 0.001:.3f}', '-i', v, '-frames:v', '3', '-vf', f'scale={W // 2}:{H // 2}', '-pix_fmt', 'rgb24', '-f', 'rawvideo', '-'], capture_output=True).stdout
        if len(raw) < 3 * (W // 2) * (H // 2) * 3: continue
        F = np.frombuffer(raw, np.uint8).reshape(3, H // 2, W // 2, 3); G = F.astype(np.float32).mean(3)
        m = (edges(G[0]) > 60) & (edges(G[2]) > 60) & (edges(G[1]) < 20) & (np.abs(G[0] - G[2]) < 12)
        mid = F[1].copy(); mid[m] = [0, 255, 0]; rows.append(np.concatenate([F[0], mid, F[2]], 1))
    if rows: Image.fromarray(np.concatenate(rows, 0)).save(strip, quality=85)
sys.exit(1 if fails else 0)
