"""Voice + orchestral score + recorded CC0 sound effects for 015, then the 1 s rewind after the hook.
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
        if i == bi and w['w'].strip('.,!?\'"').lower() == word.lower():
            c += 1
            if c == n: return w['s']
    raise KeyError(word)
voice, vsr = sf.read(f'{EP}/voice.wav'); voice = voice.mean(1) if voice.ndim > 1 else voice
if vsr != SR:
    import librosa; voice = librosa.resample(voice.astype(np.float32), orig_sr=vsr, target_sr=SR)
m, _ = sf.read(f'{EP}/music.wav'); N = max(len(voice), len(m)) + SR
def pad(x): return np.pad(x, (0, max(0, N - len(x))))[:N]
fx = np.zeros(N + 10 * SR)
FXG = 0.09  # real CC0 recordings (sfx-v1) are much hotter than the old synth stand-ins: keeps them >= 6 dB under the voice
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

# hook: heartbeat + heart monitor, night room
for k in range(int(B[1] / 0.85)): put('heart', 0.1 + k * 0.85, 0.9, maxlen=0.6, fallback=hb)
put('heart', 0.2, 0.5, k=1, maxlen=B[1], fallback=beep)
put('whoosh', WT(0, 'thirty') - 0.15, 0.9)
# day 1
put('sheets', B[1], 0.8, maxlen=1.2); put('clock', WT(1, 'alarm') - 0.1, 0.8, k=1, maxlen=0.6, fallback=beep)
put('impact', WT(1, 'alarm') + 0.45, 0.5, maxlen=0.4, fallback=thud)            # alarm slapped off
put('snack', WT(1, 'Snacks'), 0.9, maxlen=1.2); put('bed', WT(1, 'Bliss'), 0.7, maxlen=1.0)
bed('birds', B[1], B[2], 0.25)
# 1966 ward
put('whoosh', B[2] - 0.1, 0.8); put('projector', B[2], 0.6, maxlen=2.5)
bed('hospital', B[2], B[4], 0.35); put('clock', WT(2, 'Three'), 0.7, maxlen=2.0)
put('whoosh', WT(3, 'Your'), 0.7, k=1); put('fall', WT(3, 'spins') + 0.3, 1.0, maxlen=0.8, fallback=thud)
# treadmill + heart
bed('treadmill', B[4], WT(4, 'crashed'), 0.6); put('impact', WT(4, 'crashed'), 0.7, maxlen=0.5, fallback=thud)
for k in range(int((B[6] - B[5]) / 0.8)): put('heart', B[5] + k * 0.8, 1.0, maxlen=0.6, fallback=hb)
put('water', B[5] + 0.3, 0.5, maxlen=2.0)
# month 2: bones
put('whoosh', B[6], 0.6); put('bones', WT(6, 'bones'), 0.9, maxlen=0.8)
# NASA: money
put('heart', B[7], 0.35, k=1, maxlen=2.5, fallback=beep); put('cash', WT(7, 'eighteen'), 1.0, maxlen=1.2, fallback=beep)
for k in range(6): put('whoosh', WT(7, 'eighteen') + 0.3 + k * 0.3, 0.25, k=k)
# 1996
put('whoosh', B[8], 0.7); bed('footsteps_hard', B[8], WT(8, 'Not') - 0.1, 0.5); put('impact', WT(8, 'Three'), 0.4, maxlen=0.4, fallback=thud)
# twist: record scratch + crowd at the track
put('cartoon', B[9], 0.7, maxlen=0.6); bed('crowd', B[9], WT(9, 'eight'), 0.45); bed('treadmill', WT(9, 'eight'), WT(9, 'fitter'), 0.5); put('crowd', WT(9, 'fitter'), 0.5, k=1, maxlen=2.0)
# fix: hospital then corridor footsteps
bed('hospital', B[10], B[11], 0.35, k=1); bed('footsteps_hard', WT(10, 'now'), B[11], 0.4, k=1)
# get up: curtains whoosh, birds, street
put('whoosh', B[11] + 0.5, 0.9); bed('street', WT(11, 'heart'), N / SR - 0.2, 0.4); bed('birds', B[11] + 0.6, N / SR - 0.2, 0.35, k=1)
bed('footsteps_forest', WT(11, 'heart'), N / SR - 0.3, 0.35)

venv = np.convolve(np.abs(pad(voice)), np.ones(2400) / 2400, 'same'); duck = 1 - 0.55 * np.clip(venv / (venv.max() * 0.25), 0, 1)
mix = pad(voice) + pad(m) * 0.36 * duck + 0.15 * np.tanh(fx[:N] * FXG / 0.15)
# insert the rewind after the hook: reversed, pitched-up slice of the music + tape squeal
H = int((B[1] - 0.05) * SR); R = int(RW * SR)
src = pad(m)[max(0, H - 2 * R):H][::-1]; idx = np.linspace(0, len(src) - 1, R).astype(int); rw = src[idx] * 0.5
t = tt(RW); squeal = np.sin(2 * np.pi * np.cumsum(900 + 1400 * t) / SR) * 0.08 * np.sin(np.pi * t / RW); rw = rw + squeal
fade = np.linspace(1, 0, int(0.05 * SR)); rw[-len(fade):] *= fade
mix = np.concatenate([mix[:H], rw, mix[H:]])
sf.write(f'{EP}/sfx.stem.wav', (0.15 * np.tanh(fx[:N] * FXG / 0.15)).astype(np.float32), SR)
mix /= np.abs(mix).max() * 1.05; sf.write(f'{EP}/audio.mix.wav', mix.astype(np.float32), SR)
json.dump(used, open(f'{EP}/sfx-used.json', 'w'), indent=1)
print('audio', round(len(mix) / SR, 2), 's; sfx files used:', len(used))
