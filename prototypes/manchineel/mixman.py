"""Voice + music + sound design for the manchineel Short (levels from the make-set-video skill: music 0.36 ducked
55% under the voice, SFX x0.18 through a 0.15*tanh limit, ambiences quieter). Uses real CC0 recordings from
assets/sfx/<folder>/ (release sfx-v1, see sfx-keywords.txt) when present, synthesised stand-ins otherwise.
All times are VIDEO seconds: the voice is split at the hook and resumes after the 0.8 s rewind.
Usage: python3 mixman.py EP_DIR -> EP_DIR/audio.mix.wav"""
import sys, os, re, glob, json, numpy as np, soundfile as sf
REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')); sys.path.insert(0, f'{REPO}/pipeline')
from mix import SR, whoosh, thud
EP = sys.argv[1]; HERE = os.path.dirname(os.path.abspath(__file__)); rng = np.random.default_rng(5)
tl = json.load(open(f'{EP}/timeline.json')); cues = json.load(open(f'{HERE}/cues.json'))
RW = 0.8; HOOK_END = tl['beats'][1]['start'] - 0.02
WORDS = [dict(w, bi=i) for i, b in enumerate(tl['beats']) for w in b['words']]
clean = lambda s: re.sub(r"[^A-Za-z']", '', s)
def VT(bi, word, n=1):
    c = 0
    for w in WORDS:
        if w['bi'] == bi and clean(w['w']) == word:
            c += 1
            if c == n: return w['s']
    raise KeyError(word)
vid = lambda v: v if v < HOOK_END else v + RW
C = {k: vid(VT(a[0], a[1], a[2]) + a[3]) for k, a in cues.items() if not k.startswith('_')}

def load(p):
    x, sr = sf.read(p, always_2d=True); x = x.mean(1)
    if sr != SR: x = np.interp(np.arange(int(len(x) * SR / sr)) * sr / SR, np.arange(len(x)), x)
    m = np.abs(x).max(); return x / m if m > 0 else x
voice = load(f'{EP}/voice.wav') * 0.98
music = load(f'{EP}/music.wav')
N = int((tl['duration'] + RW + 1.2) * SR)
def pad(x): return np.pad(x, (0, max(0, N - len(x))))[:N]
def place(buf, clip, at, g=1.0):
    clip = np.asarray(clip) * g
    if at < 0: clip = clip[int(-at * SR):]; at = 0
    s = int(at * SR); e = min(len(buf), s + len(clip))
    if e > s: buf[s:e] += clip[:e - s]
def tt(d): return np.arange(int(SR * d)) / SR
def lp(x, k): return np.convolve(x, np.ones(k) / k, 'same')
def fade(x, a=0.05, b=0.2):
    x = x.copy(); na, nb = int(a * SR), int(b * SR)
    if na: x[:na] *= np.linspace(0, 1, na)
    if nb: x[-nb:] *= np.linspace(1, 0, nb)
    return x

# ---- real CC0 sounds (if the sfx-v1 release is unpacked), else stand-ins ----
SFX = f'{REPO}/assets/sfx'
def files(folder): return sorted(glob.glob(f'{SFX}/{folder}/*.wav')) + sorted(glob.glob(f'{SFX}/{folder}/*.ogg'))
def pick(folder, k=0, longest=False, maxlen=None):
    fs = files(folder)
    if not fs: return None
    if longest: fs = sorted(fs, key=lambda f: -os.path.getsize(f))
    x = load(fs[k % len(fs)])
    if maxlen: x = x[:int(maxlen * SR)]
    return x
def bed(folder, dur, synth, k=0):
    x = pick(folder, k, longest=True)
    if x is None or len(x) < SR: return synth(dur)
    reps = int(np.ceil(dur * SR / len(x))) + 1; y = np.tile(x, reps)[:int(dur * SR)]; return fade(y, 0.3, 0.4)
def s_rain(d): x = rng.normal(0, 1, int(d * SR)); return fade(lp(x, 3) - lp(x, 40), 0.3, 0.4) * 0.8
def s_wind(d): x = rng.normal(0, 1, int(d * SR)); y = lp(x, 60) * (0.6 + 0.4 * np.sin(np.arange(len(x)) / SR * 0.9)); return fade(y / np.abs(y).max(), 0.3, 0.4)
def s_surf(d):
    x = rng.normal(0, 1, int(d * SR)); y = lp(x, 8) - lp(x, 200); t = np.arange(len(x)) / SR; env = 0.35 + 0.65 * np.clip(np.sin(2 * np.pi * t / 6.5), 0, 1) ** 2; return fade(y * env / np.abs(y).max(), 0.3, 0.4)
def s_thunder(): t = tt(3.5); x = lp(rng.normal(0, 1, len(t)), 30) * (np.exp(-t * 1.2) + 0.6 * np.exp(-np.abs(t - 0.4) * 6)); return x / np.abs(x).max()
def s_crack(): t = tt(0.4); x = rng.normal(0, 1, len(t)) * np.exp(-t * 18); return x / np.abs(x).max()
def s_sizzle(): t = tt(1.2); x = rng.normal(0, 1, len(t)); x = x - lp(x, 4); x *= (0.6 + 0.4 * (rng.random(len(t)) > 0.97)) * np.exp(-t * 2.0); return x / np.abs(x).max()
def s_crunch():
    x = np.zeros(int(0.35 * SR))
    for k in range(9): s = int(rng.uniform(0, 0.25) * SR); n = rng.normal(0, 1, int(0.03 * SR)) * np.exp(-np.arange(int(0.03 * SR)) / SR * 120); x[s:s + len(n)] += n[:len(x) - s]
    return x / np.abs(x).max()
def s_step(): t = tt(0.1); x = lp(rng.normal(0, 1, len(t)), 3) * np.exp(-t * 40); return x / np.abs(x).max()
def s_gull(): t = tt(0.5); f = 1500 + 700 * np.exp(-t * 6) + 120 * np.sin(2 * np.pi * 18 * t); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / t[-1]) * 0.6
def s_arrow(): t = tt(0.7); f = 900 + 1500 * t; x = (rng.normal(0, 1, len(t)) * 0.6 + np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.2) * np.sin(np.pi * t / t[-1]) ** 2; return lp(x, 3) / np.abs(lp(x, 3)).max()
def one(folder, synth, k=0, maxlen=None):
    x = pick(folder, k, maxlen=maxlen); return fade(x, 0.0, 0.08) if x is not None else synth()

fx = np.zeros(N + 4 * SR); amb = np.zeros(N + 4 * SR)
end = N / SR
# ambiences: storm (rain + wind) in the cold open and the storm; surf + gulls on sunny beach
storm_spans = [(0.0, HOOK_END, 1.0), (C['storm'] + 0.3, C['locals'], 1.0), (C['locals'], C['spanish'], 0.55)]
for a, b, g in storm_spans:
    place(amb, bed('rain', b - a, s_rain), a, 0.55 * g); place(amb, bed('wind', b - a, s_wind), a, 0.35 * g)
sunny = [(C['beach'], C['storm'] + 1.0), (C['spanish'], C['iguana']), (C['iguana'], end)]
for i, (a, b) in enumerate(sunny):
    place(amb, bed('surf', b - a, s_surf, k=i), a, 0.4); place(amb, bed('palms', b - a, s_wind), a, 0.12)
    for at in rng.uniform(a, b, int((b - a) / 3)): place(fx, one('beach', s_gull, k=int(at * 7), maxlen=1.5), at, 0.35)
# thunder + lightning cracks
for k, bt in enumerate([C['hook_bolt'], C['bolt2'], C['bolt3'], C['storm'] + 0.6]):
    place(fx, one('thunder', s_crack, k=k, maxlen=0.6), bt, 0.9); place(fx, one('thunder', s_thunder, k=k + 1, maxlen=4.0), bt + 0.25, 0.8)
# footsteps on sand: the beach walk and the run for shelter
for a, b, rate in [(C['beach'], C['apples'] + 1.2, 0.48), (C['run'], C['same'] + 0.8, 0.27)]:
    t = a
    while t < b: place(fx, one('footsteps_forest', s_step, k=int(t * 13), maxlen=0.25), t, 0.35 + 0.1 * rng.random()); t += rate
# the bite, the burn, the sap
place(fx, one('bite', s_crunch, maxlen=0.6), C['bite'] + 0.2, 0.9)
for k in range(3): place(fx, one('bite', s_crunch, k=k + 1, maxlen=0.35), C['sweet'] + 0.2 + k * 0.45, 0.35)
place(fx, one('fire', s_sizzle, k=2, maxlen=1.6), C['fire'], 0.8); place(fx, whoosh(), C['fire'] - 0.05, 0.6)
place(fx, one('cough', s_crack, maxlen=1.2), C['throat'] + 0.6, 0.5)
for at in (C['hook_drip'] + 0.5, C['drop_hit'], C['blister'] + 0.1): place(fx, one('sizzle', s_sizzle, k=int(at), maxlen=1.4), at, 0.75)
place(fx, one('scream', s_crack, maxlen=1.0), C['drop_hit'] + 0.15, 0.4)
# fire crackle + coughing in the smoke
for a, b in [(C['smoke'], C['spanish'])]:
    place(amb, bed('fire', b - a, s_rain), a, 0.4)
place(fx, one('cough', s_crack, k=1, maxlen=1.5), C['blind'] - 0.4, 0.55)
# 1521: creaking ship + surf, arrow whoosh + impact, a cry
place(amb, bed('sea', C['legend'] - C['spanish'], s_surf), C['spanish'], 0.35)
place(fx, one('arrow', s_arrow, maxlen=1.0), C['arrow'], 0.9); place(fx, one('arrow', thud, k=1, maxlen=0.6), C['arrow_hit'], 0.9)
place(fx, one('scream', s_crack, k=1, maxlen=1.0), C['arrow_hit'] + 0.1, 0.4)
# iguana munching, page flourish, a record scratch on the turn
for k in range(4): place(fx, one('bite', s_crunch, k=k + 2, maxlen=0.3), C['mmm'] - 0.6 + k * 0.32, 0.4)
place(fx, whoosh(), C['journal'] - 0.1, 0.6)
place(fx, one('tape', s_crack, k=1, maxlen=0.8), C['turn'] - 0.05, 0.6)
# cut whooshes on the biggest camera moves
for k in ('beach', 'pepper', 'storm', 'same', 'hey', 'spanish', 'iguana', 'doctor'): place(fx, one('whoosh', whoosh, k=hash(k) % 5, maxlen=0.7), C[k] - 0.18, 0.5)

# voice with the rewind gap
v = np.zeros(N); h = int(HOOK_END * SR); place(v, voice[:h], 0); place(v, voice[h:], HOOK_END + RW)
m = pad(music)
# rewind: reversed, sped-up slice of the hook's music + tape squeal; everything else drops out for it
rs, re_ = int((HOOK_END - 1.6) * SR), int(HOOK_END * SR); rev = m[rs:re_][::-1]; rev = np.interp(np.arange(int(RW * SR)) * (len(rev) / (RW * SR)), np.arange(len(rev)), rev)
m[int(HOOK_END * SR): int((HOOK_END + RW) * SR)] = rev * np.linspace(1, 0.3, len(rev))
tape = one('tape', lambda: np.sin(2 * np.pi * np.cumsum(np.linspace(2200, 300, int(RW * SR))) / SR) * 0.5, maxlen=RW); place(fx, tape, HOOK_END, 0.5)
mute = np.ones(N); a, b = int(HOOK_END * SR), int((HOOK_END + RW) * SR); amb[a:b] *= 0.15
venv = lp(np.abs(v), 2400); duck = 1 - 0.55 * np.clip(venv / (venv.max() * 0.25), 0, 1)
mix = v + m * 0.36 * duck + 0.15 * np.tanh(fx[:N] * 0.18 / 0.15) + 0.15 * np.tanh(amb[:N] * 0.12 / 0.15)
mix /= np.abs(mix).max() * 1.05; sf.write(f'{EP}/audio.mix.wav', mix.astype(np.float32), SR)
print('audio', round(N / SR, 2), 's; real sfx folders:', sorted(os.listdir(SFX)) if os.path.isdir(SFX) else 'none (stand-ins)')
