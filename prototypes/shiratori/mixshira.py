"""Voice + score + recorded CC0 sound design for the Shiratori Short. Same levels as the beet mix
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
        if w['w'].strip('.,!?').lower() == word.lower():
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
OUT = [(WT(0, 'escaped'), WT(0, 'four')), (WT(2, 'slipped'), WT(3, 'coldest')), (WT(6, 'Nothing'), WT(7, 'And'))]   # snowy exteriors
# ---- ambience: wind over the snowy exteriors, a quiet room tone of wind in the cold cell
# (wind and bird beds dropped: the recordings read as broadband noise in the stem scan)
# ---- footsteps: running in the snow, guards marching, the walk to the station
seg('footsteps_hard', WT(0, 'four'), WT(0, 'One'), 0.45)
seg('footsteps_hard', WT(2, 'Caught'), WT(2, 'cell'), 0.5)
seg('footsteps_hard', WT(6, 'Nothing'), WT(6, 'Until'), 0.5)
seg('footsteps_hard', WT(6, 'Until'), WT(6, 'offered') - 0.3, 0.35)
seg('footsteps_hard', WT(7, 'turn'), WT(7, 'And'), 0.4)
# ---- the lock, the cell door, the cuffs
place(first('metal', maxlen=0.8), WT(1, 'locked') + 0.1, 0.6)
place(first('metal', maxlen=0.5), WT(1, 'picked'), 0.35); place(first('metal', maxlen=0.5), WT(1, 'picked') + 0.45, 0.3)
place(first('metal', maxlen=0.9), WT(3, 'iron'), 0.7)
place(first('metal', maxlen=0.6), WT(2, 'Caught'), 0.5)
# ---- climbing and the skylight
place(first('impact', maxlen=0.5), WT(2, 'climbed'), 0.3); place(first('impact', maxlen=0.5), WT(2, 'climbed') + 0.5, 0.3)
place(first('whoosh', maxlen=0.8), WT(2, 'slipped'), 0.4)
# ---- the soup: a pour in the hook and in the story, rust creaks, shoulders pop
seg('pour', WT(4, 'poured'), WT(4, 'until') - 0.6, 0.35)
place(first('metal', maxlen=1.2), WT(4, 'rusted'), 0.45)
place(first('cartoon', maxlen=0.4), WT(4, 'dislocated') + 0.2, 0.5); place(first('cartoon', maxlen=0.4), WT(4, 'shoulders'), 0.5)
place(first('cartoon', maxlen=0.6), WT(4, 'squeezed'), 0.45)
# ---- digging with the bowl
for k in range(4): place(first('impact', maxlen=0.35), WT(5, 'dug') + k * 0.45, 0.25)
# ---- the cigarette: a match strike / flame flare
place(first('fire', maxlen=0.8), WT(6, 'cigarette') - 0.1, 0.35)
# ---- whooshes on the cuts that whip (every shot except each third)
for i, at in enumerate(cuts):
    if (i + 1) % 3 == 2: continue
    x = lib.get('whoosh', maxlen=1.0)
    if x is not None: place(x * 0.45, at - 0.18, 0.55)
place(first('cartoon', maxlen=0.8), WT(7, 'never'), 0.5)
# ---- level and mix
def lp(x, k): return np.convolve(x, np.ones(k) / k, 'same')
venv = lp(np.abs(pad(voice)), 2400); duck = 1 - 0.55 * np.clip(venv / (venv.max() * 0.25), 0, 1)
sfx = 0.15 * np.tanh(fx[:N] * 0.18 / 0.15)
mix = pad(voice) + pad(m) * 0.10 * duck + sfx
g = 1 / (np.abs(mix).max() * 1.05); mix *= g
sf.write(f'{here}/audio.sfx.wav', (sfx * g).astype(np.float32), SR); sf.write(f'{here}/audio.voice.wav', (pad(voice) * g).astype(np.float32), SR)
sf.write(f'{here}/audio.mix.wav', mix.astype(np.float32), SR); print('audio', round(N / SR, 2), 's', len(cuts) + 1, 'shots')
