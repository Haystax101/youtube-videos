"""Voice + score + recorded CC0 sound design for the full walk-in-circles video (levels from the
make-set-video skill: music 0.36 ducked 55% under the voice, effects x0.18 through a 0.15*tanh limit).
Recorded effects come from assets/sfx (release sfx-v1); each event falls back to a synthesised sound.
Usage: python3 mixcircles.py EP_DIR -> EP_DIR/audio.mix.wav"""
import sys, os, json, numpy as np, soundfile as sf
REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')); sys.path.insert(0, f'{REPO}/pipeline')
from mix import SR, place as _place, thud, whoosh
from sfxlib import Sfx
here = sys.argv[1]; rng = np.random.default_rng(3); lib = Sfx(SR, seed=5)
tl = json.load(open(f'{here}/timeline.json')); B = tl['beats']
def W(beat, word, n=1):
    c = 0
    for w in B[beat]['words']:
        if w['w'].strip('.,!?').lower() == word.lower():
            c += 1
            if c == n: return w['s']
    raise KeyError(word)
def rd(path):
    x, sr = sf.read(path, dtype='float32'); x = x.mean(1) if x.ndim > 1 else x
    if sr != SR: x = np.interp(np.arange(int(len(x) * SR / sr)) * sr / SR, np.arange(len(x)), x)
    return x
voice, m = rd(f'{here}/voice.wav'), rd(f'{here}/music.wav'); N = max(len(voice), len(m)) + SR // 2
def pad(x): return np.pad(x, (0, max(0, N - len(x))))[:N]
fx = np.zeros(N + 10 * SR)
def place(clip, at, g=1.0):
    if clip is None or at is None: return
    clip = np.asarray(clip)
    if at < 0: clip = clip[int(-at * SR):]; at = 0
    if len(clip): _place(fx, clip, at, g)
def tt(d): return np.arange(int(SR * d)) / SR
def lp(x, k): return np.convolve(x, np.ones(k) / k, 'same')
def bp(x, lo, hi): return lp(x, lo) - lp(x, hi)
def fade(x, a=0.4):
    if x is None: return None
    k = min(len(x) // 3, int(a * SR)); x = x.copy(); x[:k] *= np.linspace(0, 1, k); x[-k:] *= np.linspace(1, 0, k); return x

forest_end, meadow = B[5]['start'], B[7]['start']
# ---- ambience beds (quiet): forest + birds in the woods, wind on the open field
def bed(folder, a, b, g, synth):
    x = lib.bed(folder, b - a) if b > a else None
    place(fade(x if x is not None else synth(b - a)), a, g)
def air(d): return None  # no synthetic noise beds: filtered noise read as static (george, 26 Nov); beds only from recordings
bed('forest', 0, forest_end, 0.9, air); bed('birds', 0, forest_end, 0.5, lambda d: None)
bed('forest', B[6]['start'], meadow, 0.7, air)
bed('wind', meadow, N / SR, 0.7, air)
bed('wind', W(6, 'Under'), meadow, 0.9, air)
# ---- footsteps while someone walks (recorded leaf/grass steps, else synthesised)
def step():  # soft, muffled forest-floor step: a low thud plus a quiet leafy rustle (george: the old clicks were harsh)
    t = tt(0.16); env = (1 - np.exp(-t * 400)) * np.exp(-t * 28)
    thump = lp(rng.normal(0, 1, len(t)), 90) * 6 * env
    rustle = bp(rng.normal(0, 1, len(t)), 40, 12) * 0.5 * np.exp(-t * 18) * (1 - np.exp(-t * 60))
    x = thump + rustle; return x / (np.abs(x).max() + 1e-9) * 0.22
def steps(a, b, g=0.9):
    s = lib.segment('footsteps_forest', b - a)
    if s is not None: place(s, a, g); return
    t = a
    while t < b: place(step(), t, 0.6 + rng.random() * 0.3); t += 0.42 + rng.uniform(-0.03, 0.03)
for a, b in [(W(0, 'legs') - 0.3, W(0, 'giant')), (W(1, 'straight') - 0.2, B[2]['start'] + 1.6), (W(3, 'marches'), W(3, 'Another', 2) + 1.0),
             (W(5, 'They'), W(5, 'straight') + 0.4), (W(6, 'without'), B[6]['end']), (meadow, meadow + 1.6), (W(9, 'walk'), W(9, 'Landmark')), (W(9, 'Klaus'), N / SR - 1)]:
    steps(a, b)
# ---- campfire crackle at both visits
for a, b in [(W(2, 'finds'), W(3, 'marches')), (W(3, 'Another', 2), B[4]['end'])]:
    c = lib.segment('fire', b - a)
    if c is not None: place(c, a, 0.8)
    # no synthetic crackle fallback: random noise ticks sound like static
# ---- whooshes on the whip pans and big camera moves
def wh(at, g=0.8): x = lib.get('whoosh', maxlen=1.2); place(x if x is not None else whoosh(), at - 0.18, g)
for at in [W(0, 'legs'), W(0, 'giant'), W(1, 'Easy'), W(2, 'An'), W(3, 'marches'), W(3, 'Another'), W(3, 'Same'), W(4, 'He\'s'),
           W(5, 'GPS'), W(6, 'Under'), W(8, 'And'), W(9, 'So'), W(9, 'Landmark'), W(9, 'Klaus')]:
    wh(at)
# ---- impacts on the turns
def hit(at, g=1.0): x = lib.get('impact', maxlen=1.0); place(x if x is not None else thud(), at, g)
hit(W(0, 'circle')); hit(W(4, 'Wait'), 1.1); hit(W(4, 'circles'), 0.9); hit(W(8, 'round'), 0.7)
# ---- small comic and detail sounds
place(lib.get('cartoon', maxlen=0.8), W(2, 'People'), 0.6)
place(lib.get('cartoon', maxlen=0.8), W(9, 'squirrel'), 0.9)
place(lib.get('squirrel', maxlen=1.2), W(9, 'squirrel') + 0.3, 0.8)
b = lib.get('camera', maxlen=0.4)
for k in range(3): place(b, W(5, 'GPS') + 0.1 + k * 0.25, 0.4)
place(lib.get('thunder', maxlen=4.0), W(6, 'clouds'), 0.35)
for at in rng.uniform(0.5, forest_end - 1, 6): place(lib.get('birds', maxlen=1.5), at, 0.3)

venv = lp(np.abs(pad(voice)), 2400); duck = 1 - 0.55 * np.clip(venv / (venv.max() * 0.25), 0, 1)
mix = pad(voice) + pad(m) * 0.36 * duck + 0.15 * np.tanh(fx[:N] * 0.18 / 0.15)
mix /= np.abs(mix).max() * 1.05; sf.write(f'{here}/audio.mix.wav', mix.astype(np.float32), SR); print('audio', round(N / SR, 2), 's')
