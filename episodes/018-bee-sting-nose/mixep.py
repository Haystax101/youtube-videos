"""Voice + score + recorded CC0 sound design for the bee-sting Short. Same levels as the beet mix
(make-set-video skill): music 0.36 ducked 55% under the voice, effects x0.18 through a 0.15*tanh limit.
Only real recordings from assets/sfx; no synthesised noise.
Usage: python3 mixshira.py EP_DIR -> EP_DIR/audio.mix.wav"""
import sys, os, re, json, numpy as np, soundfile as sf
REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')); sys.path.insert(0, f'{REPO}/pipeline')
from mix import SR, place as _place
from sfxlib import Sfx
here = sys.argv[1]; lib = Sfx(SR, seed=23)
# skip any recording that is noise-like (it would trip the stem static scan): spectral flatness > 0.3 above -55 dB
def _noisy(x, w=SR // 4):
    win = np.hanning(w); f = np.fft.rfftfreq(w, 1 / SR); band = (f >= 500) & (f <= 8000)
    for i in range(0, len(x) - w, w):
        X = np.abs(np.fft.rfft(x[i:i + w] * win)) ** 2; Bd = X[band] + 1e-20
        if 10 * np.log10(Bd.sum() / (win ** 2).sum() * 2 / w + 1e-20) > -55 and np.exp(np.mean(np.log(Bd))) / np.mean(Bd) > 0.3: return True
    return False
_files, _clean = lib.files, {}
def _clean_files(folder):
    if folder not in _clean: _clean[folder] = [f for f in _files(folder) if not _noisy(lib.load(f) * 0.05)]
    return _clean[folder]
lib.files = _clean_files
tl = json.load(open(f'{here}/timeline.json')); B = tl['beats']
def WT(bi, word, n=1):
    c = 0
    for w in B[bi]['words']:
        if w['w'].strip('.,!?:').lower() == word.lower():
            c += 1
            if c == n: return w['s']
    raise KeyError(word)
def rd(path):
    x, sr = sf.read(path, dtype='float32'); x = x.mean(1) if x.ndim > 1 else x
    if sr != SR: x = np.interp(np.arange(int(len(x) * SR / sr)) * sr / SR, np.arange(len(x)), x)
    return x
voice = rd(f'{here}/voice.wav'); m = rd(f'{here}/music.wav'); N = max(len(voice), len(m)) + SR // 2
def pad(x): return np.pad(x, (0, max(0, N - len(x))))[:N]
fx = np.zeros(N + 12 * SR)
def place(clip, at, g=1.0):
    if clip is None or at is None: return
    clip = np.asarray(clip)
    if at < 0: clip = clip[int(-at * SR):]; at = 0
    if len(clip): _place(fx, clip, at, g)
def fade(x, a=0.3):
    if x is None: return None
    k = min(len(x) // 3, int(a * SR)); x = x.copy(); x[:k] *= np.linspace(0, 1, k); x[-k:] *= np.linspace(1, 0, k); return x
def first(*folders, **kw):
    for f in folders:
        x = lib.get(f, **kw)
        if x is not None: return x
def bed(folder, a, b, g):
    x = lib.bed(folder, b - a) if b > a else None
    if x is not None: place(fade(x), a, g * 0.3)
def seg(folder, a, b, g):
    x = lib.segment(folder, b - a) if b > a else None
    if x is not None: place(fade(x, 0.15), a, g)
# shot cuts straight from the page (shot(WT(beat, 'word'[, n]) ...)
html = open(os.path.join(here, [f for f in os.listdir(here) if f.endswith('.html')][0])).read()   # the folder's only page
cuts = [WT(int(b), w, int(k or 1)) for b, w, k in re.findall(r"^shot\(WT\((\d), '(\w+)'(?:, (\d))?\)", html, re.M)]
# a bee buzz: a tonal sawtooth (no noise) with a wobble, low-passed
def buzz(sec, f0=210):
    tt = np.arange(int(sec * SR)) / SR; f = f0 + 12 * np.sin(2 * np.pi * 7 * tt); ph = 2 * np.pi * np.cumsum(f) / SR
    x = sum(np.sin(ph * k) / k for k in range(1, 9)) * (0.6 + 0.4 * np.sin(2 * np.pi * 31 * tt) ** 2)
    x = np.convolve(x, np.ones(6) / 6, 'same'); return fade(x / np.abs(x).max() * 0.5, 0.08)
# ---- hook: the buzz then the sting
place(buzz(0.9), 0.0, 0.5); place(first('impact', maxlen=0.4), WT(0, 'face'), 0.5); place(first('cartoon', maxlen=0.6), WT(0, 'purpose'), 0.4)
# ---- the bee yard: birds and buzzing hives
bed('birds', B[1]['start'], WT(1, 'So'), 0.5); place(buzz(2.6, 230), B[1]['start'] + 0.2, 0.25); place(buzz(1.6, 190), WT(1, 'wanted'), 0.3)
# ---- the lab: a pop per dot, the jar, the stopwatch ticking through the minute
place(first('cartoon', maxlen=0.4), WT(1, 'twenty'), 0.3); place(first('metal', maxlen=0.4), WT(2, 'Five'), 0.25)
place(buzz(1.0, 220), WT(2, 'Five') + 0.2, 0.3); place(first('impact', maxlen=0.3), WT(2, 'each'), 0.35)
for k in range(8): place(first('clock', maxlen=0.25), WT(2, 'full') + k * 0.2, 0.3)
# ---- the easy spots: little stings, a shrug
for w in ['Skull', 'toe', 'upper']: place(buzz(0.5, 240), WT(3, w) - 0.25, 0.3); place(first('impact', maxlen=0.25), WT(3, w), 0.3)
# ---- the face: buzz creeping in, the lip, the nose
place(buzz(1.2, 200), WT(4, 'Then'), 0.35); place(first('impact', maxlen=0.5), WT(4, 'Ow') - 0.05, 0.6)
place(buzz(1.4, 260), WT(4, 'And'), 0.4); place(first('impact', maxlen=0.6), WT(4, 'nose'), 0.8); place(first('cartoon', maxlen=0.8), WT(4, 'nose') + 0.15, 0.4)
# ---- payoff: pages, then the yard again
place(first('cartoon', maxlen=0.5), WT(5, 'mapped'), 0.3); bed('birds', WT(5, 'And') - 0.2, tl['duration'] + 0.4, 0.5)
place(buzz(2.0, 220), WT(5, 'And'), 0.2); place(first('cartoon', maxlen=0.8), WT(6, 'Follow'), 0.3)
# ---- whooshes on the cuts that whip (every shot except each third)
for i, at in enumerate(cuts):
    if (i + 1) % 3 == 2: continue
    x = lib.get('whoosh', maxlen=1.0)
    if x is not None: place(x * 0.45, at - 0.18, 0.55)
# ---- level and mix
def lp(x, k): return np.convolve(x, np.ones(k) / k, 'same')
venv = lp(np.abs(pad(voice)), 2400); duck = 1 - 0.55 * np.clip(venv / (venv.max() * 0.25), 0, 1)
sfx = 0.15 * np.tanh(fx[:N] * 0.09 / 0.15)
mix = pad(voice) + pad(m) * 0.046 * duck + sfx
g = 1 / (np.abs(mix).max() * 1.05); mix *= g
sf.write(f'{here}/audio.sfx.wav', (sfx * g).astype(np.float32), SR); sf.write(f'{here}/audio.voice.wav', (pad(voice) * g).astype(np.float32), SR)
sf.write(f'{here}/audio.mix.wav', mix.astype(np.float32), SR); print('audio', round(N / SR, 2), 's', len(cuts) + 1, 'shots')
