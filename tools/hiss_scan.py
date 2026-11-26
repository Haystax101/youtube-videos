"""Spectral hiss/static scan for a finished mix (george heard static from noise-based stand-in SFX, 26 Nov).
Flags 0.25 s windows where 5-12 kHz energy is high AND flat (noise-like) relative to the rest of the spectrum.
Speech sibilants ("s", "sh") look like that too but are short, so on a full mix only runs of >= RUN windows
(1 s) count. Scan the music/SFX stems too (e.g. sfx.wav from mixbed.py), where any noisy window is suspect.
Usage: python3 tools/hiss_scan.py [--run N] AUDIO.wav [more.wav ...]  -> prints flagged spans; exit 1 if any."""
import sys, numpy as np, soundfile as sf
args = sys.argv[1:]; RUN = 4
if args and args[0] == '--run': RUN = int(args[1]); args = args[2:]
bad = 0
for path in args:
    a, sr = sf.read(path); a = a.mean(1) if a.ndim > 1 else a
    W = int(0.25 * sr); f = np.fft.rfftfreq(W, 1 / sr); hi = (f > 5000) & (f < 12000); spans = []
    for i in range(0, len(a) - W, W):
        if np.sqrt(np.mean(a[i:i + W] ** 2)) < 3e-4: continue   # silence
        X = np.abs(np.fft.rfft(a[i:i + W] * np.hanning(W))) + 1e-12; P = X ** 2
        share = P[hi].sum() / P.sum(); flat = np.exp(np.mean(np.log(X[hi]))) / np.mean(X[hi])   # spectral flatness 0..1
        if share > 0.04 and flat > 0.45: spans.append((i / sr, share, flat))
    runs, cur = [], []
    for sp in spans:
        if cur and sp[0] - cur[-1][0] > 0.26: runs.append(cur); cur = []
        cur.append(sp)
    if cur: runs.append(cur)
    spans = [sp for r in runs if len(r) >= RUN for sp in r]
    print(f'{path}: {len(spans)} noisy window(s) in runs of >= {RUN}')
    for t, s, fl in spans[:30]: print(f'  {t:6.2f}s  high-band share {s:.2f}  flatness {fl:.2f}')
    bad += len(spans)
sys.exit(1 if bad else 0)
