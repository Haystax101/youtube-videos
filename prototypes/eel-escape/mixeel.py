"""Voice + orchestral score + sound design for the eel escape Short -> EP/audio.mix.wav.
Recorded CC0 sounds come from assets/sfx/<folder>/ (release sfx-v1, tools/fetch_sfx.py) when present;
otherwise each effect falls back to a synthesised version. Levels follow the make-set-video skill:
narration on top, music 0.36 ducked 55% under the voice, effects x0.18 through a soft limiter."""
import sys, os, re, json, glob, numpy as np, soundfile as sf
REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')); sys.path.insert(0, f'{REPO}/pipeline')
from mix import SR, place as _place
here = sys.argv[1]; rng = np.random.default_rng(5)
tl = json.load(open(f'{here}/timeline.json'))
IDS = ['hook', 'meet', 'fish', 'gulp', 'inside', 'lab', 'circle', 'reverse', 'tail', 'free', 'stats', 'payoff', 'cta']
def BS(i): return tl['beats'][IDS.index(i)]['start']
def BE(i): return tl['beats'][IDS.index(i)]['end']
def WT(i, word, n=1):
    c = 0
    for w in tl['beats'][IDS.index(i)]['words']:
        if re.sub(r"[^a-z0-9'-]", '', w['w'].lower()) == word.lower():
            c += 1
            if c == n: return w['s']
    raise KeyError(word)
def load(p):
    x, sr = sf.read(p, always_2d=True); x = x.mean(1)
    if sr != SR: x = np.interp(np.arange(int(len(x) * SR / sr)) * sr / SR, np.arange(len(x)), x)
    return x.astype(np.float64)
voice = load(f'{here}/voice.wav'); m = load(f'{here}/music.wav'); N = max(len(voice), len(m)) + SR
def pad(x): return np.pad(x, (0, max(0, N - len(x))))[:N]
def place(buf, clip, at, g=1.0):
    clip = np.asarray(clip)
    if at < 0: clip = clip[int(-at * SR):]; at = 0
    if len(clip): _place(buf, clip, at, g)
def tt(d): return np.arange(int(SR * d)) / SR
def lp(x, k): return np.convolve(x, np.ones(k) / k, 'same')
def bp(x, lo, hi): return lp(x, lo) - lp(x, hi)
def norm(x): return x / (np.abs(x).max() + 1e-9)
# recorded sounds (CC0), picked by folder; `k` chooses among files; `dur` trims with a fade
REC = os.path.join(REPO, 'assets', 'sfx'); USED = []
def rec(folder, k=0, dur=None, start=0.0):
    fs = sorted(glob.glob(f'{REC}/{folder}/*.wav'))
    if not fs: return None
    f = fs[k % len(fs)]; x = load(f)[int(start * SR):]
    if dur: x = x[:int(dur * SR)]
    if len(x) < SR * 0.03: return None
    f2 = min(len(x), int(0.03 * SR)); x[-f2:] *= np.linspace(1, 0, f2); USED.append(os.path.relpath(f, REC)); return norm(x)
fx = np.zeros(N + SR)
# george (26 Nov): the synthesised noise effects read as static. Only recorded CC0 sounds are used now;
# if a folder has no recording, that effect is simply left out. The only generated sounds left are
# clean sine ticks/beeps (no noise) and the reversed music slice for the rewind.
def lpf(x, hz):   # fast FFT brick-wall-ish low-pass with a soft 20% transition
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); X *= np.clip((hz * 1.2 - f) / (hz * 0.4), 0, 1); return np.fft.irfft(X, len(x))
def place_rec(folder, k, dur, at, g, cut=None):
    c = rec(folder, k, dur)
    if c is None: return False
    if cut: c = lpf(c, cut)
    place(fx, c, at, g); return True
RW0 = tl['beats'][0]['words'][-1]['e'] + 0.08; RW1 = BS('meet')
river = [(0, RW0), (RW1, BS('inside')), (BS('tail'), WT('tail', 'Is')), (BS('free'), BS('stats')), (BS('payoff'), N / SR)]
stom = [(BS('inside'), BS('lab')), (WT('circle', 'hunting'), WT('reverse', 'reverses'))]
lab = [(BS('lab'), BS('circle')), (WT('tail', 'Is'), BS('free'))]
def bed(segs, clip, g, cut=None):
    if clip is None: return
    if cut: clip = lpf(clip, cut)
    for a, b in segs:
        n = int((b - a) * SR); x = np.tile(clip, n // len(clip) + 2)[:n].copy(); f = min(n // 2, int(0.08 * SR))
        if f: x[:f] *= np.linspace(0, 1, f); x[-f:] *= np.linspace(1, 0, f)
        place(fx, x, a, g)
bed(river, rec('underwater', 0, 20), 0.3, cut=2500)
for a, b in river:
    for at in rng.uniform(a, b, int((b - a) * 1.2)): place_rec('bubbles', int(at * 7), 0.6, at, 0.22, cut=6000)
bed(stom, rec('stomach', 0, 10), 0.45, cut=1800)
for a, b in stom:
    for at in rng.uniform(a, b, int((b - a) * 0.8)): place_rec('squelch', int(at * 5), 0.5, at, 0.3, cut=5000)
bed(lab, rec('lab', 0, 10), 0.18, cut=5000)
place_rec('lab', 1, 1.0, WT('lab', 'X-ray') - 0.4, 0.45, cut=7000)
# "Recording!": a clean two-tone beep (pure sines, no noise)
t = tt(0.12); bp1 = np.sin(2 * np.pi * 1320 * t) * np.sin(np.pi * t / t[-1]); place(fx, np.concatenate([bp1, np.zeros(int(0.05 * SR)), np.sin(2 * np.pi * 1760 * t) * np.sin(np.pi * t / t[-1])]) * 0.5, WT('lab', 'Recording') - 0.25, 0.5)
for at in [WT('hook', 'And'), WT('hook', 'through'), BS('inside'), BS('circle'), WT('reverse', 'reverses'), WT('free', 'out')]: place_rec('whoosh', int(at * 3), 0.6, at - 0.18, 0.5, cut=9000)
# the rewind: a reversed, sped-up slice of the music (plus a recorded rewind if we have one)
sl = m[int(max(0, RW0 - 1.5) * SR): int(RW0 * SR)][::-1]; sl = np.interp(np.arange(0, len(sl), 1.5), np.arange(len(sl)), sl); place(fx, sl, RW0, 1.2)
place_rec('rewind', 0, RW1 - RW0, RW0, 0.35, cut=8000)
place_rec('whoosh', 2, 0.6, WT('gulp', 'lunge') - 0.1, 0.65, cut=9000)
place_rec('gulp', 0, 1.0, WT('gulp', 'gone') - 0.15, 0.95)
place_rec('squelch', 1, 0.5, BS('inside') - 0.1, 0.6, cut=5000)
place_rec('squelch', 2, 0.5, WT('reverse', 'jams') + 0.1, 0.55, cut=5000)
place_rec('cartoon', 3, 0.5, WT('tail', 'pops'), 0.7)
for k, at in enumerate(np.arange(BS('free'), WT('free', 'out'), 0.25)): place_rec('squelch', k, 0.3, at, 0.35, cut=5000)
place_rec('water', 0, 0.8, WT('free', 'out'), 0.75, cut=7000)
# stats: a soft sine tick per eel appearing
for i in range(32): t = tt(0.03); place(fx, np.sin(2 * np.pi * 2200 * t) * np.exp(-t * 160), BS('stats') + i * 0.035, 0.22)
# mix
venv = lp(np.abs(pad(voice)), 2400); duck = 1 - 0.6 * np.clip(venv / (venv.max() * 0.25), 0, 1)
mix = pad(voice) + pad(m) * 0.3 * duck + 0.15 * np.tanh(fx[:N] * 0.085 / 0.15)
V, M, X = pad(voice), pad(m) * 0.3 * duck, 0.15 * np.tanh(fx[:N] * 0.085 / 0.15); sp = lp(np.abs(V), 2400) > 0.01
db = lambda x: round(20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9), 1)
print('levels dB (speech / pauses): voice', db(V[sp]), '| music', db(M[sp]), '/', db(M[~sp]), '| sfx', db(X[sp]), '/', db(X[~sp]))
sf.write(f'{here}/stem.music.wav', M.astype(np.float32), SR); sf.write(f'{here}/stem.sfx.wav', X.astype(np.float32), SR)  # for tools/audio_check.py
mix /= np.abs(mix).max() * 1.05; sf.write(f'{here}/audio.mix.wav', mix.astype(np.float32), SR)
json.dump(sorted(set(USED)), open(f'{here}/sfx_used.json', 'w'), indent=1); print('audio', round(N / SR, 2), 's; recorded sfx used:', len(set(USED)))
