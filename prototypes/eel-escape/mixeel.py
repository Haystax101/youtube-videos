"""Voice + orchestral score + sound design for the eel escape Short -> EP/audio.mix.wav.
Recorded CC0 sounds come from assets/sfx/<folder>/ (release sfx-v1, tools/fetch_sfx.py) when present;
otherwise each effect falls back to a synthesised version. Levels follow the make-set-video skill:
narration on top, music 0.36 ducked 55% under the voice, effects x0.18 through a soft limiter."""
import sys, os, re, json, glob, numpy as np, soundfile as sf
REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')); sys.path.insert(0, f'{REPO}/pipeline')
from mix import SR, place as _place, thud, whoosh, pop
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
def bub():   # synthetic bubble: rising sine blip
    t = tt(0.07); f = 600 + rng.uniform(0, 900) + 5000 * t; return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 45) * np.sin(np.pi * t / t[-1])
def squelch():
    t = tt(0.22); f = 180 + 300 * np.sin(np.pi * t / t[-1]); return (np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.6 + bp(rng.normal(0, 1, len(t)), 6, 1) * 0.5) * np.sin(np.pi * t / t[-1]) ** 2
def gulp():
    t = tt(0.55); f = 260 - 200 * t / t[-1]; s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-((t - 0.2) / 0.12) ** 2); th = thud(); s[:len(th)] += th[:len(s)] * 0.5; return s
fx = np.zeros(N + SR)
RW0 = tl['beats'][0]['words'][-1]['e'] + 0.08; RW1 = BS('meet')
river = [(0, RW0), (RW1, BS('inside')), (BS('tail'), WT('tail', 'Is')), (BS('free'), BS('stats')), (BS('payoff'), N / SR)]
stom = [(BS('inside'), BS('lab')), (WT('circle', 'hunting'), WT('reverse', 'reverses'))]
lab = [(BS('lab'), BS('circle')), (WT('tail', 'Is'), BS('free'))]
xray = [(0 + WT('hook', 'through'), RW0), (BS('circle'), WT('circle', 'hunting')), (WT('reverse', 'reverses'), BS('tail')), (BS('stats'), BS('payoff'))]
def bed(segs, clip, g):
    if clip is None: return
    for a, b in segs:
        n = int((b - a) * SR); x = np.tile(clip, n // len(clip) + 2)[:n].copy(); f = min(n // 2, int(0.05 * SR))
        if f: x[:f] *= np.linspace(0, 1, f); x[-f:] *= np.linspace(1, 0, f)
        place(fx, x, a, g)
# underwater bed: recorded underwater ambience if we have it, else low rumble noise
uw = rec('underwater', 0, 20)
bed(river, uw if uw is not None else norm(bp(rng.normal(0, 1, SR * 8), 400, 40)), 0.35)
for a, b in river:
    for at in rng.uniform(a, b, int((b - a) * 2.2)):
        c = rec('bubbles', int(at * 7), 0.6); place(fx, c if c is not None else bub(), at, 0.25 if c is not None else 0.35)
# stomach: muffled heartbeat-ish rumble + wet squelches
st = rec('stomach', 0, 10); bed(stom, st if st is not None else norm(lp(rng.normal(0, 1, SR * 6), 600)), 0.5)
for a, b in stom:
    for at in np.arange(a, b, 0.84): place(fx, thud(), at, 0.5); place(fx, thud(), at + 0.22, 0.3)
    for at in rng.uniform(a, b, int((b - a) * 1.2)): c = rec('eel', int(at * 5), 0.5); place(fx, c if c is not None else squelch(), at, 0.35)
# lab room tone + the X-ray power-up + a beep on "Recording"
lt = rec('lab', 0, 10); bed(lab, lt if lt is not None else norm(np.sin(2 * np.pi * 100 * tt(4)) * 0.3 + bp(rng.normal(0, 1, SR * 4), 30, 3) * 0.2), 0.25)
xr = WT('lab', 'X-ray'); t = tt(1.0); place(fx, np.sin(2 * np.pi * np.cumsum(120 + 500 * t) / SR) * np.sin(np.pi * t / t[-1]) * 0.6 + bp(rng.normal(0, 1, len(t)), 3, 1) * 0.2 * t, xr - 0.4, 0.6)
c = rec('camera', 1, 0.4); place(fx, c if c is not None else np.sin(2 * np.pi * 1760 * tt(0.15)), WT('lab', 'Recording'), 0.4)
# X-ray hum under the X-ray shots
bed(xray, norm(np.sin(2 * np.pi * 60 * tt(2)) + 0.4 * np.sin(2 * np.pi * 120 * tt(2)) + bp(rng.normal(0, 1, SR * 2), 20, 2) * 0.3), 0.18)
# cuts with flashes get a whoosh
for at in [WT('hook', 'And'), WT('hook', 'through'), BS('inside'), BS('circle'), WT('reverse', 'reverses'), WT('free', 'out')]:
    c = rec('whoosh', int(at * 3), 0.6); place(fx, c if c is not None else whoosh(), at - 0.18, 0.55)
# the rewind: tape squeal + reversed slice of the music
t = tt(RW1 - RW0); place(fx, np.sin(2 * np.pi * np.cumsum(2400 - 1800 * t / t[-1]) / SR) * 0.25 * np.sin(np.pi * t / t[-1]), RW0, 0.6)
sl = m[int(max(0, RW0 - 1.5) * SR): int(RW0 * SR)][::-1]; sl = np.interp(np.arange(0, len(sl), 1.5), np.arange(len(sl)), sl); place(fx, sl, RW0, 1.2)
# lunge + GULP
c = rec('whoosh', 2, 0.6); place(fx, c if c is not None else whoosh(), WT('gulp', 'lunge') - 0.1, 0.7)
c = rec('gulp', 0, 1.0); place(fx, c if c is not None else gulp(), WT('gulp', 'gone') - 0.15, 1.0)
# eel line "Oh, come on!" lands with a plop in the stomach
place(fx, squelch(), BS('inside') - 0.1, 0.7)
# tail jams into the gullet; pop out of the gill; wriggles; free splash
place(fx, squelch(), WT('reverse', 'jams') + 0.1, 0.6)
c = rec('cartoon', 3, 0.5); place(fx, c if c is not None else pop(), WT('tail', 'pops'), 0.8)
for k, at in enumerate(np.arange(BS('free'), WT('free', 'out'), 0.19)): c = rec('eel', k, 0.35); place(fx, c if c is not None else squelch(), at, 0.45)
c = rec('water', 0, 0.8); place(fx, c if c is not None else whoosh(), WT('free', 'out'), 0.8)
# stats: a soft tick per eel appearing, dings for 13 and 9
for i in range(32): t = tt(0.03); place(fx, np.sin(2 * np.pi * 2200 * t) * np.exp(-t * 160), BS('stats') + i * 0.035, 0.25)
# mix
venv = lp(np.abs(pad(voice)), 2400); duck = 1 - 0.55 * np.clip(venv / (venv.max() * 0.25), 0, 1)
mix = pad(voice) + pad(m) * 0.36 * duck + 0.15 * np.tanh(fx[:N] * 0.18 / 0.15)
mix /= np.abs(mix).max() * 1.05; sf.write(f'{here}/audio.mix.wav', mix.astype(np.float32), SR)
json.dump(sorted(set(USED)), open(f'{here}/sfx_used.json', 'w'), indent=1); print('audio', round(N / SR, 2), 's; recorded sfx used:', len(set(USED)))
