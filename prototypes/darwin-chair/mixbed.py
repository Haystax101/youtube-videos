"""Voice + score + recorded CC0 sound effects for Darwin's chair, then the 1 s rewind after the hook.
SFX come from assets/sfx/<folder>/ (release sfx-v1, tools/fetch_sfx.py); a missing folder falls back to a
small synthesised sound so the mix always builds. Levels follow the make-set-video skill:
music 0.36 ducked 55% under the voice, SFX x0.18 through a 0.15*tanh soft limit.
Usage: python3 mixbed.py EP_DIR -> EP_DIR/audio.mix.wav (video time)"""
import sys, os, json, glob, subprocess, numpy as np, soundfile as sf
REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')); sys.path.insert(0, f'{REPO}/pipeline')
from mix import SR, place as _place, thud, whoosh
EP = sys.argv[1]; rng = np.random.default_rng(5); RW = 1.0
tl = json.load(open(f'{EP}/timeline.json')); B = [b['start'] for b in tl['beats']]
words = [(b['i'], w) for b in tl['beats'] for w in b['words']]
def WT(bi, word, n=1):
    c = 0
    for i, w in words:
        if i == bi and w['w'].strip('.,!?:;\'"').lower() == word.lower():
            c += 1
            if c == n: return w['s']
    raise KeyError(word)
voice, vsr = sf.read(f'{EP}/voice.wav'); voice = voice.mean(1) if voice.ndim > 1 else voice
if vsr != SR:
    import librosa; voice = librosa.resample(voice.astype(np.float32), orig_sr=vsr, target_sr=SR)
m, _ = sf.read(f'{EP}/music.wav'); N = max(len(voice), len(m)) + SR
def pad(x): return np.pad(x, (0, max(0, N - len(x))))[:N]
fx = np.zeros(N + 10 * SR)
SFX = os.path.join(REPO, 'assets', 'sfx'); cache = {}; used = []
def load(folder, k=0, maxlen=None):
    files = sorted(f for f in glob.glob(f'{SFX}/{folder}/**/*', recursive=True) if f.lower().endswith(('.wav', '.ogg', '.flac', '.mp3')) and not os.path.basename(f).startswith('._'))
    if not files: return None
    f = files[k % len(files)]
    if f not in cache:
        try:
            raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', f, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
            a = np.frombuffer(raw, np.float32).copy(); a /= np.abs(a).max() + 1e-9; cache[f] = a; used.append(os.path.relpath(f, SFX))
        except Exception as e: print('sfx fail', f, e); return None
    a = cache[f]; return a[: int(maxlen * SR)] * np.minimum(1, np.linspace(30, 0, min(len(a), int(maxlen * SR))) ) if maxlen else a
def put(folder, at, g=1.0, k=0, maxlen=None, fallback=None):
    a = load(folder, k, maxlen)
    if a is None:
        if fallback is None: print('no sfx for', folder); return
        a = fallback()
    if at < 0: a = a[int(-at * SR):]; at = 0
    _place(fx, a, at, g)
def bed(folder, a, b, g, k=0):  # an ambience under a stretch of time (looped, faded)
    x = load(folder, k)
    if x is None: print('no ambience', folder); return
    L = int((b - a) * SR); y = np.tile(x, L // len(x) + 1)[:L]; f = min(L // 4, int(0.3 * SR)); env = np.ones(L); env[:f] = np.linspace(0, 1, f); env[-f:] = np.linspace(1, 0, f); _place(fx, y * env, a, g)
def tt(d): return np.arange(int(SR * d)) / SR
def beep(): t = tt(0.12); return np.sin(2 * np.pi * 1000 * t) * np.exp(-t * 20) * 0.6
def tick(): t = tt(0.03); return rng.normal(0, 1, len(t)) * np.exp(-t * 300) * 0.5
def hb(): t = tt(0.25); return np.sin(2 * np.pi * 55 * t) * np.exp(-t * 18) * 1.2

def creak(): t = tt(0.35); f = 180 + 60 * np.sin(t * 40); return np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * np.exp(-t * 6) * 0.25 * (rng.random(len(t)) > 0.3)
def roll(d=1.0): t = tt(d); return (rng.normal(0, 1, len(t)) * (0.5 + 0.5 * np.sin(2 * np.pi * 14 * t)) * 0.25) * np.minimum(1, np.minimum(t, d - t) * 10)
def boing(): t = tt(0.5); return np.sin(2 * np.pi * np.cumsum(220 + 180 * np.sin(t * 50) * np.exp(-t * 5)) / SR) * np.exp(-t * 6) * 0.6
def clink(): t = tt(0.3); return (np.sin(2 * np.pi * 2400 * t) + 0.5 * np.sin(2 * np.pi * 3700 * t)) * np.exp(-t * 18) * 0.4
V1 = WT(9, 'remember') - 0.4

# hook: the race across the office. Rolling castors, whooshes as Darwin overtakes, office ambience under it
bed('office', 0, B[1], 0.25)
if load('rolling') is not None: bed('rolling', 0.1, B[1] - 0.1, 0.7)
else: _place(fx, roll(B[1] - 0.2), 0.1, 0.7)
put('whoosh', WT(0, 'He') - 0.2, 0.9, fallback=whoosh); put('gasp', WT(0, 'He') + 0.1, 0.35, maxlen=0.8)
put('whoosh', WT(0, 'chair') - 0.1, 0.6, k=1, fallback=whoosh)
# study: fire crackle and a ticking mantel clock, birds outside
bed('fire', B[1], B[6], 0.3); bed('clock', B[1], B[6], 0.18); bed('birds', B[1], B[3], 0.12, k=1)
put('footsteps_hard', WT(1, 'Darwin'), 0.5, maxlen=2.0)
put('quill', WT(1, 'filled'), 0.5, maxlen=1.4)
put('glass', WT(2, 'Pickled'), 0.7, maxlen=0.6, fallback=clink); put('glass', WT(2, 'barnacles') + 0.2, 0.5, k=1, maxlen=0.6, fallback=clink)
put('quill', WT(2, 'eight'), 0.4, k=1, maxlen=1.2)
# up and down: creaks and footsteps each time he gets up and sits down
for w, k in [('up', 0), ('sitting', 1), ('Again', 2), ('again', 3)]:
    try: x = WT(3, w)
    except KeyError: continue
    put('creak', x, 0.7, k=k, maxlen=0.6, fallback=creak)
put('footsteps_hard', WT(3, 'walking'), 0.55, k=1, maxlen=1.0)
# wheels: castors pop on, then he scoots
put('cartoon', WT(4, 'wheels'), 0.6, maxlen=0.5, fallback=boing)
put('rolling', WT(4, 'scooted'), 0.8, k=1, maxlen=WT(4, 'Splendid') - WT(4, 'scooted'), fallback=lambda: roll(2.0))
put('whoosh', WT(4, 'specimen', 2), 0.5, k=2, fallback=whoosh)
# myth: record stop, tea table rolls
put('cartoon', WT(5, 'Not') - 0.05, 0.5, k=1, maxlen=0.6)
put('rolling', WT(5, 'wheels'), 0.5, k=2, maxlen=1.0, fallback=lambda: roll(1.0)); put('glass', WT(5, 'wheels') + 0.4, 0.4, k=2, maxlen=0.5, fallback=clink)
# Great Exhibition: big hall murmur, a creak per trick, a boing for the springs, castors for "rolled"
put('whoosh', B[6] - 0.15, 0.8, fallback=whoosh); bed('murmur', B[6], B[8], 0.4); bed('water', B[6], B[7], 0.12)  # the crystal fountain
put('creak', WT(6, 'swivelled'), 0.6, k=4, maxlen=0.6, fallback=creak); put('creak', WT(6, 'tilted'), 0.6, k=5, maxlen=0.6, fallback=creak)
put('spring', WT(6, 'bounced'), 0.8, maxlen=0.7, fallback=boing); put('spring', WT(6, 'springs'), 0.5, k=1, maxlen=0.6, fallback=boing)
put('rolling', WT(6, 'rolled'), 0.7, k=3, maxlen=1.0, fallback=lambda: roll(1.0))
put('gasp', WT(7, 'Critics'), 0.5, k=1, maxlen=1.0); put('crowd', WT(7, 'asleep') + 0.5, 0.35, k=2, maxlen=1.5)
put('bed', WT(7, 'asleep'), 0.4, k=2, maxlen=1.2)
# today: office, keyboards, chairs rolling past; the race again
put('whoosh', B[8] - 0.1, 0.8, k=3, fallback=whoosh); bed('office', B[8], N / SR - 0.2, 0.3, k=1)
put('rolling', WT(8, 'rolling'), 0.7, k=4, maxlen=1.4, fallback=lambda: roll(1.4)); put('whoosh', WT(8, 'spinning'), 0.6, k=4, fallback=whoosh)
put('rolling', WT(9, 'scoot'), 0.6, k=5, maxlen=1.2, fallback=lambda: roll(1.2))
put('rolling', V1, 0.75, k=0, maxlen=WT(9, 'Follow') - V1, fallback=lambda: roll(2.0)); put('whoosh', WT(9, 'Darwin'), 0.8, k=5, fallback=whoosh)
put('crowd', WT(9, 'first') + 0.1, 0.35, k=3, maxlen=1.8)

venv = np.convolve(np.abs(pad(voice)), np.ones(2400) / 2400, 'same'); duck = 1 - 0.55 * np.clip(venv / (venv.max() * 0.25), 0, 1)
mix = pad(voice) + pad(m) * 0.36 * duck + 0.15 * np.tanh(fx[:N] * 0.18 / 0.15)
# insert the rewind after the hook: reversed, pitched-up slice of the music + tape squeal
H = int((B[1] - 0.05) * SR); R = int(RW * SR)
src = pad(m)[max(0, H - 2 * R):H][::-1]; idx = np.linspace(0, len(src) - 1, R).astype(int); rw = src[idx] * 0.5
t = tt(RW); squeal = np.sin(2 * np.pi * np.cumsum(900 + 1400 * t) / SR) * 0.08 * np.sin(np.pi * t / RW); rw = rw + squeal
fade = np.linspace(1, 0, int(0.05 * SR)); rw[-len(fade):] *= fade
mix = np.concatenate([mix[:H], rw, mix[H:]])
mix /= np.abs(mix).max() * 1.05; sf.write(f'{EP}/audio.mix.wav', mix.astype(np.float32), SR)
json.dump(used, open(f'{EP}/sfx-used.json', 'w'), indent=1)
print('audio', round(len(mix) / SR, 2), 's; sfx files used:', len(used))
