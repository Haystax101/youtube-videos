"""Voice + music + quiet sfx for the walk-in-circles opening (levels from the make-set-video skill)."""
import sys, os, json, numpy as np, soundfile as sf
REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')); sys.path.insert(0, f'{REPO}/pipeline')
from mix import SR, place as _place, thud, whoosh
here = sys.argv[1]; rng = np.random.default_rng(3)
tl = json.load(open(f'{here}/timeline.json')); words = [w for b in tl['beats'] for w in b['words']]
def WT(word, k=1):
    c = 0
    for w in words:
        if w['w'].strip('.,!?') == word:
            c += 1
            if c == k: return w['s']
voice, sr = sf.read(f'{here}/voice.wav'); voice = voice.mean(1) if voice.ndim > 1 else voice
m, _ = sf.read(f'{here}/music.wav'); N = max(len(voice), len(m)) + SR // 2
def pad(x): return np.pad(x, (0, N - len(x)))[:N]
def place(buf, clip, at, g=1.0):
    clip = np.asarray(clip)
    if at < 0: clip = clip[int(-at * SR):]; at = 0
    if len(clip): _place(buf, clip, at, g)
def tt(d): return np.arange(int(SR * d)) / SR
def lp(x, k): return np.convolve(x, np.ones(k) / k, 'same')
def bp(x, lo, hi): return lp(x, lo) - lp(x, hi)
fx = np.zeros(N + SR)
# forest air + birds (not over the meadow at the end)
air = bp(rng.normal(0, 1, N + SR), 60, 6); air /= np.abs(air).max(); fx += air * 0.06
for at in rng.uniform(0, WT('And'), 16):
    t = tt(0.25); f = 3200 + 900 * np.sin(2 * np.pi * 9 * t) + rng.uniform(-400, 400); place(fx, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / t[-1]) * 0.05, at)
# footsteps on leaves while he walks or marches
def step(): t = tt(0.12); return bp(rng.normal(0, 1, len(t)), 14, 2) * np.exp(-t * 35) * 0.5
for a, b, rate in [(0, WT('He\'s'), 0.46), (WT('No'), WT('An'), 0.33), (WT('An'), WT('campfire'), 0.46), (WT('He'), WT('Another'), 0.33), (WT('Another'), WT('Same'), 0.46), (WT('And'), len(voice) / SR, 0.5)]:
    t = a
    while t < b: place(fx, step(), t, 0.8 + rng.random() * 0.4); t += rate
# fire crackle at the clearing
for a, b in [(WT('An'), WT('He')), (WT('Another'), WT("He's", 2))]:
    for at in rng.uniform(a, b, int((b - a) * 9)): t = tt(0.03); place(fx, rng.normal(0, 1, len(t)) * np.exp(-t * 200) * 0.35, at)
# whooshes on the big moments
place(fx, whoosh(), WT("He's", 2) - 0.2, 0.7); place(fx, thud(), WT("It's"), 0.6)
venv = lp(np.abs(pad(voice)), 2400); duck = 1 - 0.55 * np.clip(venv / (venv.max() * 0.25), 0, 1)
mix = pad(voice) + pad(m) * 0.36 * duck + 0.15 * np.tanh(fx[:N] * 0.18 / 0.15)
mix /= np.abs(mix).max() * 1.05; sf.write(f'{here}/audio.mix.wav', mix.astype(np.float32), SR); print('audio', round(N / SR, 2), 's')
