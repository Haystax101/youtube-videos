"""Voice + score + recorded CC0 sound design for the beet-juice tyres Short. Levels from the
make-set-video skill: music 0.36 ducked 55% under the voice, effects x0.18 through a 0.15*tanh limit.
No synthesised noise anywhere (it read as static); events with no recording are simply skipped.
Usage: python3 mixbeet.py EP_DIR -> EP_DIR/audio.mix.wav"""
import sys, os, json, numpy as np, soundfile as sf
REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')); sys.path.insert(0, f'{REPO}/pipeline')
from mix import SR, place as _place
from sfxlib import Sfx
here = sys.argv[1]; lib = Sfx(SR, seed=11)
tl = json.load(open(f'{here}/timeline.json')); B = tl['beats']; HOOK_END, RW = B[1]['start'], 1.0
def WT(bi, word, n=1):
    c = 0
    for w in B[bi]['words']:
        if w['w'].strip('.,!?').lower() == word.lower():
            c += 1
            if c == n: return w['s']
    raise KeyError(word)
V = lambda w: w + RW           # story/voice time -> video time
def rd(path):
    x, sr = sf.read(path, dtype='float32'); x = x.mean(1) if x.ndim > 1 else x
    if sr != SR: x = np.interp(np.arange(int(len(x) * SR / sr)) * sr / SR, np.arange(len(x)), x)
    return x
voice = rd(f'{here}/voice.wav'); cut = int(HOOK_END * SR); voice = np.concatenate([voice[:cut], np.zeros(int(RW * SR)), voice[cut:]])
m = rd(f'{here}/music.wav'); N = max(len(voice), len(m)) + SR // 2
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
def bed(folders, a, b, g):
    for f in folders:
        x = lib.bed(f, b - a) if b > a else None
        if x is not None: place(fade(x), a, g * 0.3); return

winter = V(WT(3, 'winter')); fac, beet, pay = V(B[5]['start']), V(B[6]['start']), V(B[7]['start'])
# ---- ambience beds
bed(['farm', 'birds'], HOOK_END + RW, winter, 0.8)
bed(['wind'], 0, HOOK_END, 0.6); bed(['wind'], winter, N / SR, 0.7)
bed(['lab'], fac, beet, 0.5)
# ---- the tractor: engine while it drives and while the farmer sits in the cab
for a, b, g in [(HOOK_END + RW, V(B[2]['start']), 0.8), (pay, N / SR - 0.5, 0.8)]:
    x = lib.segment('tractor', b - a)
    if x is not None: place(fade(x, 0.4), a, g * 0.35)
# ---- pumping beet juice (hook and the beet beat)
for a, b in [(0.3, HOOK_END), (beet + 0.2, pay - 0.4)]:
    x = lib.segment('pour', b - a) if lib.files('pour') else lib.segment('water', b - a)
    if x is not None: place(fade(x, 0.3), a, 0.4)
# ---- the spin in the mud, the tip-up
place(first('tyre', 'eel', maxlen=1.6), V(WT(1, 'spin')), 0.7)
place(first('eel', maxlen=1.0), V(WT(1, 'mud')), 0.6)
place(first('metal', maxlen=1.2), V(WT(1, 'tips')) + 0.2, 0.6)
place(first('impact', maxlen=1.0), V(WT(1, 'tips')) + 0.45, 0.7)
# ---- filling with water
x = lib.segment('water', 2.0)
if x is not None: place(fade(x, 0.3), V(B[2]['start']) + 0.3, 0.45)
# ---- the freeze, the salt, the rust
place(first('ice', 'bones', maxlen=1.2), V(WT(3, 'freezes')) + 0.2, 0.8)
place(first('cartoon', maxlen=0.6), V(WT(4, 'salt')), 0.4)
place(first('metal', maxlen=2.0), V(WT(4, 'eats')), 0.7)
# ---- whooshes on the cuts (shot starts from beet.html), impact on the label changes
cuts = [V(B[1]['start']), V(WT(1, 'Too')), V(WT(1, 'spin')), V(WT(1, 'tips')) - 0.6, V(B[2]['start']), V(WT(3, 'Water')), winter - 0.15, V(WT(3, 'freezes')),
        V(WT(4, 'salt')) - 0.1, V(WT(4, 'eats')), fac, beet, V(WT(6, 'heavier')), V(WT(6, 'freeze')), V(WT(6, 'gentle')), pay, V(WT(7, 'technically')) - 0.3]
for at in cuts:
    x = lib.get('whoosh', maxlen=1.0)
    if x is not None: place(x * 0.45, at - 0.18, 0.6)
place(first('cartoon', maxlen=0.8), V(WT(7, 'vegetable')), 0.6)
x = lib.get('whoosh', maxlen=1.0)
if x is not None: place(x[::-1] * 0.4, HOOK_END, 0.7)   # the rewind: a reversed whoosh
# ---- level and mix
def lp(x, k): return np.convolve(x, np.ones(k) / k, 'same')
venv = lp(np.abs(pad(voice)), 2400); duck = 1 - 0.55 * np.clip(venv / (venv.max() * 0.25), 0, 1)
sfx = 0.15 * np.tanh(fx[:N] * 0.18 / 0.15)
mix = pad(voice) + pad(m) * 0.36 * duck + sfx
g = 1 / (np.abs(mix).max() * 1.05); mix *= g
sf.write(f'{here}/audio.sfx.wav', (sfx * g).astype(np.float32), SR); sf.write(f'{here}/audio.voice.wav', (pad(voice) * g).astype(np.float32), SR)
sf.write(f'{here}/audio.mix.wav', mix.astype(np.float32), SR); print('audio', round(N / SR, 2), 's')
