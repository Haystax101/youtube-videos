"""Voice + score + sound effects for Operation Bayonet, then the 1 s rewind after the hook.
Recorded CC0 effects come from assets/sfx/<folder>/ (release sfx-v1, tools/fetch_sfx.py) when present;
every effect has a synthesised fallback so the mix always builds. Levels follow the make-set-video skill:
music 0.36 ducked 55% under the voice, SFX x0.18 through a 0.15*tanh soft limit.
Usage: python3 mix.py EP_DIR -> EP_DIR/audio.mix.wav (video time)"""
import sys, os, re, json, glob, subprocess, numpy as np, soundfile as sf
REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')); sys.path.insert(0, f'{REPO}/pipeline')
from mix import SR, place as _place, whoosh
EP = sys.argv[1]; rng = np.random.default_rng(7); RW = 1.0
tl = json.load(open(f'{EP}/timeline.json')); B = [b['start'] for b in tl['beats']]
words = [(b['i'], w) for b in tl['beats'] for w in b['words']]
def WT(bi, word, n=1):
    c = 0
    for i, w in words:
        if i == bi and re.sub(r"[^A-Za-z0-9'_]", '', w['w']).lower() == word.lower():
            c += 1
            if c == n: return w['s']
    raise KeyError(word)
voice, vsr = sf.read(f'{EP}/voice.wav'); voice = voice.mean(1) if voice.ndim > 1 else voice
if vsr != SR:
    import librosa; voice = librosa.resample(voice.astype(np.float32), orig_sr=vsr, target_sr=SR)
m, msr = sf.read(f'{EP}/music.wav'); assert msr == SR, msr
N = max(len(voice), len(m)) + SR; END = N / SR - 0.3
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
    a = cache[f]; return a[: int(maxlen * SR)] * np.minimum(1, np.linspace(30, 0, min(len(a), int(maxlen * SR)))) if maxlen else a
def put(folder, at, g=1.0, k=0, maxlen=None, fallback=None):
    a = load(folder, k, maxlen) if folder else None
    if a is None:
        if fallback is None: return
        a = fallback()
    if at < 0: a = a[int(-at * SR):]; at = 0
    _place(fx, a, at, g)
def bed(folder, a, b, g, k=0, fallback=None):  # an ambience under a stretch of time (looped, faded)
    x = load(folder, k) if folder else None
    if x is None:
        if fallback is None: return
        x = fallback(min(8.0, b - a))
    L = int((b - a) * SR); y = np.tile(x, L // len(x) + 1)[:L]; f = min(L // 4, int(0.4 * SR)); env = np.ones(L); env[:f] = np.linspace(0, 1, f); env[-f:] = np.linspace(1, 0, f); _place(fx, y * env, a, g)

# ---- synthesised effects -------------------------------------------------------------------------
def tt(d): return np.arange(int(SR * d)) / SR
def lp(x, a):  # one-pole low-pass, a in (0,1): smaller = darker
    y = np.zeros_like(x); s = 0.0
    for i in range(len(x)): s += a * (x[i] - s); y[i] = s
    return y
def lpf(x, cut):  # cheap FFT low-pass
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); X[f > cut] *= np.exp(-(f[f > cut] - cut) / (cut * 0.3)); return np.fft.irfft(X, len(x))
def bpf(x, lo, hi):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); X[(f < lo) | (f > hi)] = 0; return np.fft.irfft(X, len(x))
def norm(x, p=1.0): return x / (np.abs(x).max() + 1e-9) * p
def siren(d=4.0):  # European two-tone police siren
    t = tt(d); f = np.where((t * 1.4) % 1 < 0.5, 466, 622); ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sign(np.sin(ph)) * 0.4 + np.sin(ph) * 0.6; x = lpf(x, 2500); env = np.minimum(1, np.minimum(t, d - t) * 3); return norm(x * env, 0.8)
def engine(d=2.0, f0=55, f1=110):  # car engine revving past
    t = tt(d); f = f0 + (f1 - f0) * np.clip(t / d, 0, 1) ** 0.7; ph = 2 * np.pi * np.cumsum(f) / SR
    x = sum(np.sin(ph * h) / h for h in range(1, 7)) + rng.normal(0, 0.3, len(t)); x = lpf(x, 900); env = np.minimum(1, np.minimum(t * 3, (d - t) * 4)); return norm(x * env, 0.9)
def crash():  # car through a metal gate: thump, crunch, metal ring, glass
    t = tt(2.2); x = np.sin(2 * np.pi * 48 * t) * np.exp(-t * 7) * 1.4
    x += lpf(rng.normal(0, 1, len(t)), 3000) * np.exp(-t * 4) * 0.9
    for fr in [310, 523, 787, 1130, 1490]: x += np.sin(2 * np.pi * fr * t + rng.random() * 6) * np.exp(-t * (2.5 + fr / 900)) * 0.18
    gl = np.zeros(len(t))
    for _ in range(40):
        s = int(rng.uniform(0.05, 0.9) * SR); L = int(0.05 * SR); gl[s:s + L] += np.sin(2 * np.pi * rng.uniform(3000, 7000) * tt(0.05)) * np.exp(-tt(0.05) * 80) * rng.uniform(0.1, 0.4)
    return norm(x + gl, 1.0)
def clang():  # cell door / gate clang
    t = tt(1.8); x = sum(np.sin(2 * np.pi * fr * t) * np.exp(-t * dk) * g for fr, dk, g in [(180, 2.2, 1), (431, 3, 0.6), (713, 4, 0.4), (1180, 6, 0.3), (2210, 9, 0.2)])
    x += rng.normal(0, 1, len(t)) * np.exp(-t * 60) * 0.6; return norm(x, 0.9)
def typing(d=2.0, rate=9):
    out = np.zeros(int(d * SR)); t = 0.0
    while t < d - 0.05:
        s = int(t * SR); L = int(0.025 * SR); k = rng.normal(0, 1, L) * np.exp(-tt(0.025) * 260); out[s:s + L] += bpf(np.pad(k, (0, 256)), 1500, 6000)[:L] * rng.uniform(0.5, 1)
        t += rng.exponential(1 / rate) + 0.03
    return norm(out, 0.7)
def murmur(d=8.0):  # crowd of buyers
    t = tt(d); x = bpf(rng.normal(0, 1, len(t)), 250, 1400) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.7 * t) * np.sin(2 * np.pi * 1.9 * t + 1)); return norm(x, 0.6)
def hum(d=8.0, f=60):  # neon / server hum
    t = tt(d); x = np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * 2 * f * t) + 0.25 * np.sin(2 * np.pi * 3 * f * t) + rng.normal(0, 0.05, len(t)); return norm(x, 0.5)
def wind(d=8.0):
    t = tt(d); x = lpf(rng.normal(0, 1, len(t)), 500) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.15 * t)); return norm(x, 0.6)
def cicadas(d=8.0):
    t = tt(d); x = np.sin(2 * np.pi * 4500 * t) * (0.5 + 0.5 * np.sin(2 * np.pi * 38 * t)) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.3 * t)); return norm(x, 0.35)
def coin():
    t = tt(0.5); f = rng.uniform(2500, 3400); x = (np.sin(2 * np.pi * f * t) + 0.6 * np.sin(2 * np.pi * f * 2.76 * t)) * np.exp(-t * 9); return norm(x, 0.5)
def coins(d=1.5, n=14):
    out = np.zeros(int((d + 0.6) * SR))
    for _ in range(n): c = coin(); s = int(rng.uniform(0, d) * SR); out[s:s + len(c)] += c * rng.uniform(0.3, 1)
    return norm(out, 0.8)
def ding():  # new-mail notification
    t = tt(0.9); x = np.sin(2 * np.pi * 1318 * t) * np.exp(-t * 5); t2 = tt(0.7); y = np.sin(2 * np.pi * 1760 * t2) * np.exp(-t2 * 5)
    out = np.zeros(len(t) + int(0.12 * SR)); out[:len(t)] += x; out[int(0.12 * SR):int(0.12 * SR) + len(t2)] += y; return norm(out, 0.7)
def cuffs():
    out = np.zeros(int(0.7 * SR))
    for s in [0.0, 0.18, 0.3]:
        L = int(0.06 * SR); i = int(s * SR); out[i:i + L] += bpf(np.pad(rng.normal(0, 1, L) * np.exp(-tt(0.06) * 90), (0, 64)), 2000, 8000)[:L]
    t = tt(0.7); out += np.sin(2 * np.pi * 3100 * t) * np.exp(-t * 14) * 0.2; return norm(out, 0.8)
def powerdown():
    t = tt(1.6); f = 220 * np.exp(-t * 1.6) + 30; x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.2) + 0.4 * np.sign(np.sin(2 * np.pi * np.cumsum(f * 2) / SR)) * np.exp(-t * 2); return norm(lpf(x, 1800), 0.9)
def beep(f=1000): t = tt(0.12); return np.sin(2 * np.pi * f * t) * np.exp(-t * 16) * 0.6
def click(): L = int(0.02 * SR); return bpf(np.pad(rng.normal(0, 1, L) * np.exp(-tt(0.02) * 300), (0, 64)), 1000, 6000)[:L] * 0.8
def thump(): t = tt(0.3); return np.sin(2 * np.pi * 70 * t) * np.exp(-t * 18) * 1.0
def ticktock(d=8.0):
    out = np.zeros(int(d * SR))
    for k in range(int(d / 0.5)): c = click() * (1.0 if k % 2 else 0.6); i = int(k * 0.5 * SR); out[i:i + len(c)] += c
    return out
def drip(d=8.0):
    out = np.zeros(int(d * SR))
    for k in range(int(d / 1.7)):
        t = tt(0.15); x = np.sin(2 * np.pi * (900 + 600 * np.exp(-t * 40)) * t) * np.exp(-t * 30) * 0.5; i = int((0.4 + k * 1.7) * SR); out[i:i + len(x)] += x
    return out
def swish(): return whoosh()

# ---- placement (voice seconds) -------------------------------------------------------------------
H1 = B[1]
# HOOK: the arrest as it happens. Siren, engine, the car hits the gate at 1.25 s, cuffs at 4.0 s
put('siren', 0.0, 0.28, maxlen=H1, fallback=lambda: siren(H1))
put('engine', 0.0, 0.7, maxlen=1.3, fallback=lambda: engine(1.3, 70, 150))
put('impact', 1.22, 1.0, fallback=crash); put(None, 1.25, 0.9, fallback=clang)
put(None, 4.0, 0.7, fallback=cuffs)
put('whoosh', H1 - 0.3, 0.6, fallback=swish)
# QUEBEC: winter wind outside, typing, a mouse click, the logo appears
bed('wind', B[1], B[2], 0.35, fallback=wind); bed(None, B[1], B[2], 0.12, fallback=lambda d: hum(d, 120))
put(None, WT(1, 'computer'), 0.6, fallback=lambda: typing(2.4)); put(None, WT(1, 'Online') - 0.3, 0.6, fallback=lambda: typing(1.6, 12))
put(None, WT(1, 'eBay') - 0.15, 0.8, fallback=click)
# DARK WEB: whoosh through the onion, neon hum and a murmuring crowd, coins rain on "Bitcoin"
put('whoosh', B[2] - 0.1, 0.8, k=1, fallback=swish); put('whoosh', WT(2, 'Tor') - 0.2, 0.6, k=2, fallback=swish)
bed('crowd', B[2], B[4] - 0.2, 0.3, k=1, fallback=murmur); bed(None, B[2], B[4] - 0.2, 0.15, fallback=lambda d: hum(d, 60))
for w in ['Drugs', 'Guns', 'Stolen', 'Hacking']: put('whoosh', WT(2, w) - 0.25, 0.35, k=3, fallback=swish)
put('cash', WT(2, 'All') - 0.2, 0.7, maxlen=2.0, fallback=lambda: coins(2.0, 24))
# BOOM: coins pouring, counters ticking
put('cash', B[3] + 0.4, 0.6, k=1, maxlen=2.5, fallback=lambda: coins(2.5, 30))
for k in range(18): put(None, WT(3, '200000') - 0.6 + k * 0.08, 0.35, fallback=click)
put('cash', WT(3, 'billion') - 0.2, 0.7, k=2, maxlen=2.0, fallback=lambda: coins(2.0, 26))
put(None, WT(3, 'AlphaBay') - 0.1, 0.7, fallback=lambda: engine(1.6, 40, 120))  # the pillar rises
# THAILAND: cicadas, birds, a Lamborghini revs, cash register
bed('palms', B[4], B[5] - 0.2, 0.25, fallback=cicadas); bed('birds', B[4], B[5] - 0.2, 0.15, k=2)
put('whoosh', B[4] - 0.15, 0.7, k=4, fallback=swish)
put('engine', WT(4, 'Lamborghini') - 0.1, 0.7, maxlen=1.4, fallback=lambda: engine(1.4, 90, 220))
for k, w in enumerate(['Cyprus', 'Liechtenstein', 'Antigua']): put('cash', WT(4, w) - 0.05, 0.4, k=3 + k, maxlen=0.6, fallback=lambda: coins(0.3, 5))
# THE MISTAKE: a clock ticks; mail ding on "welcome"; stinger on the address (in the score)
put('whoosh', B[5] - 0.15, 0.6, k=5, fallback=swish)
bed('clock', B[5], B[6] - 0.1, 0.35, fallback=ticktock)
put(None, WT(5, 'welcome') - 0.2, 0.7, fallback=ding)
put(None, WT(5, 'Pimp_Alex_91') - 0.05, 0.9, fallback=thump)
# INVESTIGATORS: office hum and typing, a pin for each lead on the corkboard
bed(None, B[6], B[8] - 0.1, 0.15, fallback=lambda d: hum(d, 50)); bed(None, B[6], B[8] - 0.1, 0.12, fallback=lambda d: typing(d, 5))
put('whoosh', B[6] - 0.15, 0.6, k=6, fallback=swish)
for w in ['address', 'LinkedIn', 'repair', 'forum', 'name']: put(None, WT(6, w) - 0.05, 0.8, fallback=thump)
put(None, WT(6, 'spotted'), 0.6, fallback=lambda: beep(880))
# HANSA: crowd, cuffs on the admins, typing as police rewire it, a beep for each thing they collected
put('whoosh', B[8] - 0.15, 0.7, k=7, fallback=swish); bed('crowd', B[8], WT(8, 'rewired') - 0.3, 0.25, k=2, fallback=murmur)
put(None, WT(8, 'arrested') + 0.3, 0.8, fallback=cuffs)
put(None, WT(8, 'rewired') - 0.2, 0.5, fallback=lambda: typing(1.5, 14))
for w in ['saved', 'copied', 'location']: put(None, WT(8, w), 0.6, fallback=lambda: beep(1320))
# THE ARREST: siren and engine, the crash, footsteps, cuffs; quiet room with the laptop
put('siren', B[9], 0.28, maxlen=WT(9, 'Inside') - B[9], fallback=lambda: siren(WT(9, 'Inside') - B[9]))
put('engine', WT(9, 'crashed') - 1.25, 0.7, maxlen=1.3, fallback=lambda: engine(1.3, 70, 150))
put('impact', WT(9, 'crashed') - 0.03, 0.75, k=1, fallback=crash); put(None, WT(9, 'crashed'), 0.55, fallback=clang)
put('footsteps_hard', WT(9, 'came'), 0.5, maxlen=1.0)
put(None, WT(9, 'grabbed') + 0.15, 0.8, fallback=cuffs)
put('whoosh', WT(9, 'Inside') - 0.15, 0.6, k=8, fallback=swish); bed(None, WT(9, 'Inside'), B[10] - 0.1, 0.2, fallback=lambda d: hum(d, 120))
put(None, WT(9, 'logged'), 0.6, fallback=ding)
# THE FLOOD: power-down on "dark", crowd surges toward Hansa
put(None, WT(10, 'dark') - 0.1, 0.9, fallback=powerdown)
bed('crowd', WT(10, 'Hundreds'), B[11] - 0.2, 0.4, k=3, fallback=murmur)
put('whoosh', WT(10, 'flooded') - 0.3, 0.8, k=9, fallback=swish)
for k in range(10): put(None, WT(10, 'signups') + k * 0.1, 0.4, fallback=lambda: beep(1500 + 60 * k))
put(None, WT(10, 'police'), 0.8, fallback=thump)
# THE CELL: a door clang, drips, silence
put(None, B[11] - 0.05, 0.6, fallback=clang); bed(None, B[11], B[12] - 0.2, 0.3, fallback=drip)
# PLUG PULLED: power-down, then a cascade of beeps for the addresses
put('whoosh', B[12] - 0.15, 0.6, k=10, fallback=swish)
put(None, WT(12, 'plug') - 0.1, 0.9, fallback=powerdown)
for k in range(16): put(None, WT(12, 'ten') + k * 0.09, 0.35, fallback=lambda: beep(1100 + (k % 4) * 110))
# THE LESSON: room tone, a mail ding, a whoosh into the end card
bed(None, B[13], END, 0.15, fallback=lambda d: hum(d, 120))
put(None, WT(13, 'email') - 0.1, 0.6, fallback=ding)
put('whoosh', WT(13, 'Follow') - 0.2, 0.7, k=11, fallback=swish)

venv = np.convolve(np.abs(pad(voice)), np.ones(2400) / 2400, 'same'); duck = 1 - 0.55 * np.clip(venv / (venv.max() * 0.25), 0, 1)
mix = pad(voice) + pad(m) * 0.36 * duck + 0.15 * np.tanh(fx[:N] * 0.18 / 0.15)
# insert the rewind after the hook: reversed, pitched-up slice of the music + tape squeal
Hs = int((B[1] - 0.05) * SR); R = int(RW * SR)
src = pad(m)[max(0, Hs - 2 * R):Hs][::-1]; idx = np.linspace(0, len(src) - 1, R).astype(int); rw = src[idx] * 0.5
t = tt(RW); squeal = np.sin(2 * np.pi * np.cumsum(900 + 1400 * t) / SR) * 0.08 * np.sin(np.pi * t / RW); rw = rw + squeal
fade = np.linspace(1, 0, int(0.05 * SR)); rw[-len(fade):] *= fade
mix = np.concatenate([mix[:Hs], rw, mix[Hs:]])
mix /= np.abs(mix).max() * 1.05; sf.write(f'{EP}/audio.mix.wav', mix.astype(np.float32), SR)
json.dump(used, open(f'{EP}/sfx-used.json', 'w'), indent=1)
print('audio', round(len(mix) / SR, 2), 's; recorded sfx files used:', len(used))
