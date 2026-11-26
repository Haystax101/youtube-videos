"""Pre-delivery audio check: clipping on the final file, and hiss/static in the non-voice stems.
Usage: python3 tools/audio_check.py FINAL(.wav|.mp4) [STEM.wav ...]
Static = broadband noise: in each 0.25 s window of a stem (music, sound effects; not the voice, whose 's' sounds
are noise-like on purpose) it measures the 500 Hz-8 kHz band level and spectral flatness (1 = white noise,
~0 = tones/instruments). A window louder than -55 dBFS with flatness > 0.3 is flagged. Calibrated on the eel
Short george heard static in (26 Nov): its synthesised-noise effects stem flags 79 windows, the orchestral
score 0. Exit code 1 if the final clips or any stem has flagged windows."""
import sys, subprocess, tempfile, os, numpy as np, soundfile as sf
def load(p):
    if not p.endswith('.wav'):
        tmp = tempfile.mktemp(suffix='.wav'); subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', p, '-ac', '1', '-ar', '48000', tmp], check=True); p = tmp
    x, sr = sf.read(p, always_2d=True); return x.mean(1), sr
def noisy(x, sr, lo=500, hi=8000):
    w = int(0.25 * sr); win = np.hanning(w); f = np.fft.rfftfreq(w, 1 / sr); band = (f >= lo) & (f <= hi); bad = []
    for i in range(0, len(x) - w, w):
        X = np.abs(np.fft.rfft(x[i:i + w] * win)) ** 2; B = X[band] + 1e-20
        lvl = 10 * np.log10(B.sum() / (win ** 2).sum() * 2 / w + 1e-20); flat = np.exp(np.mean(np.log(B))) / np.mean(B)
        if lvl > -55 and flat > 0.3: bad.append(i / sr)
    return bad
ok = True
x, sr = load(sys.argv[1]); peak = np.abs(x).max(); clip = int((np.abs(x) > 0.999).sum())
print(f'{os.path.basename(sys.argv[1])}: peak {20 * np.log10(peak + 1e-9):.1f} dBFS, clipped samples {clip}'); ok &= clip == 0
for p in sys.argv[2:]:
    y, sr2 = load(p); bad = noisy(y, sr2); ok &= not bad
    print(f'{os.path.basename(p)}: {len(bad)} noisy window(s)' + (': ' + ', '.join(f'{t:.2f}s' for t in bad[:20]) if bad else ''))
print('AUDIO OK' if ok else 'AUDIO PROBLEMS'); sys.exit(0 if ok else 1)
