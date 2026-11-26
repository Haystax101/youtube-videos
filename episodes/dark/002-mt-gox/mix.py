"""Voice + score + sound effects for Mt. Gox, then the 1 s rewind after the hook.
Every effect is synthesised from tones (no filtered noise, no recorded files): george rejected static.
Levels follow the make-set-video skill: music 0.36 ducked 55% under the voice, SFX x0.18 through a 0.15*tanh soft limit.
Usage: python3 mix.py EP_DIR -> EP_DIR/audio.mix.wav (video time)"""
import sys, os, re, json, glob, subprocess, numpy as np, soundfile as sf
REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')); sys.path.insert(0, f'{REPO}/pipeline')
from mix import SR, place as _place
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
    x = sum(np.sin(ph * h) / h * (1 + 0.3 * np.sin(2 * np.pi * 23 * t * h)) for h in range(1, 7)); x = lpf(x, 900); env = np.minimum(1, np.minimum(t * 3, (d - t) * 4)); return norm(x * env, 0.9)
def crash():  # car through a metal gate: thump, crunch, metal ring, glass
    t = tt(2.2); x = np.sin(2 * np.pi * 48 * t) * np.exp(-t * 7) * 1.4
    x += sum(np.sin(2 * np.pi * fr * t + rng.random() * 6) for fr in rng.uniform(90, 600, 24)) / 6 * np.exp(-t * 6) * 0.9
    for fr in [310, 523, 787, 1130, 1490]: x += np.sin(2 * np.pi * fr * t + rng.random() * 6) * np.exp(-t * (2.5 + fr / 900)) * 0.18
    gl = np.zeros(len(t))
    for _ in range(40):
        s = int(rng.uniform(0.05, 0.9) * SR); L = int(0.05 * SR); gl[s:s + L] += np.sin(2 * np.pi * rng.uniform(3000, 7000) * tt(0.05)) * np.exp(-tt(0.05) * 80) * rng.uniform(0.1, 0.4)
    return norm(x + gl, 1.0)
def clang():  # cell door / gate clang
    t = tt(1.8); x = sum(np.sin(2 * np.pi * fr * t) * np.exp(-t * dk) * g for fr, dk, g in [(180, 2.2, 1), (431, 3, 0.6), (713, 4, 0.4), (1180, 6, 0.3), (2210, 9, 0.2)])
    x += np.sin(2 * np.pi * 95 * t) * np.exp(-t * 30) * 0.8; return norm(x, 0.9)
def typing(d=2.0, rate=9):
    out = np.zeros(int(d * SR)); t = 0.0
    while t < d - 0.05:
        s = int(t * SR); L = int(0.025 * SR); k = np.sin(2 * np.pi * rng.uniform(1400, 2600) * tt(0.025)) * np.exp(-tt(0.025) * 300); out[s:s + L] += k * rng.uniform(0.5, 1)
        t += rng.exponential(1 / rate) + 0.03
    return norm(out, 0.7)
def murmur(d=8.0):  # crowd of buyers
    t = tt(d); x = np.zeros(len(t))
    for _ in range(14):
        f0 = rng.uniform(110, 230); ph = 2 * np.pi * np.cumsum(f0 * (1 + 0.06 * np.sin(2 * np.pi * rng.uniform(2, 5) * t + rng.random() * 6))) / SR
        x += sum(np.sin(ph * h) / h for h in (1, 2, 3)) * np.clip(np.sin(2 * np.pi * rng.uniform(1.5, 4) * t + rng.random() * 6), 0, 1)
    return norm(lpf(x, 900), 0.6)
def hum(d=8.0, f=60):  # neon / server hum
    t = tt(d); x = np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * 2 * f * t) + 0.25 * np.sin(2 * np.pi * 3 * f * t); return norm(x, 0.5)
def wind(d=8.0):
    t = tt(d); x = sum(np.sin(2 * np.pi * np.cumsum(f * (1 + 0.15 * np.sin(2 * np.pi * 0.11 * t + f))) / SR) for f in (180, 241, 317)) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.15 * t)); return norm(x, 0.5)
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
        L = int(0.06 * SR); i = int(s * SR); out[i:i + L] += (np.sin(2 * np.pi * 2300 * tt(0.06)) + np.sin(2 * np.pi * 3470 * tt(0.06))) * np.exp(-tt(0.06) * 90)
    t = tt(0.7); out += np.sin(2 * np.pi * 3100 * t) * np.exp(-t * 14) * 0.2; return norm(out, 0.8)
def powerdown():
    t = tt(1.6); f = 220 * np.exp(-t * 1.6) + 30; x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.2) + 0.4 * np.sign(np.sin(2 * np.pi * np.cumsum(f * 2) / SR)) * np.exp(-t * 2); return norm(lpf(x, 1800), 0.9)
def beep(f=1000): t = tt(0.12); return np.sin(2 * np.pi * f * t) * np.exp(-t * 16) * 0.6
def click(): t = tt(0.02); return np.sin(2 * np.pi * 2000 * t) * np.exp(-t * 350) * 0.8
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
def swish():
    t = tt(0.5); f = 900 * np.exp(-t * 4) + 120; return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / 0.5) ** 2, 0.5)
def whoosh(): return swish()

SFX = '/nonexistent'  # tone-only: never load recorded effects
def gull():
    t = tt(0.5); f = 1400 + 900 * np.sin(np.pi * t / 0.5) - 600 * t; return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / 0.5) ** 1.5, 0.4)
def gulls(d=8.0):
    out = np.zeros(int(d * SR))
    for k in range(int(d / 2.3)):
        for j in range(2): g = gull(); i = int((0.5 + k * 2.3 + j * 0.35) * SR); out[i:i + len(g)] += g[:max(0, len(out) - i)] * (1 - 0.3 * j)
    return out
def sea(d=8.0):  # soft tonal swell, no noise
    t = tt(d); x = sum(np.sin(2 * np.pi * f * t + f) for f in (82, 110, 147, 196)) * (0.5 + 0.5 * np.sin(2 * np.pi * t / 4.0)) ** 2; return norm(lpf(x, 500), 0.4)
def shutter():
    out = np.zeros(int(0.15 * SR)); c = click(); out[:len(c)] += c; out[int(0.06 * SR):int(0.06 * SR) + len(c)] += c * 0.7; return out
def plane(d=4.0):
    t = tt(d); f = 90 - 15 * t / d; ph = 2 * np.pi * np.cumsum(f) / SR; x = sum(np.sin(ph * h) / h for h in range(1, 6)) * np.sin(np.pi * t / d); return norm(lpf(x, 700), 0.6)
def fall():  # price crash: a falling tone
    t = tt(1.2); f = 1200 * np.exp(-t * 2.5) + 80; return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.2), 0.7)
def chime(): t = tt(1.2); return norm(sum(np.sin(2 * np.pi * f * t) * np.exp(-t * 3) for f in (1046, 1318, 1568)), 0.6)

# ---- placement (voice seconds) -------------------------------------------------------------------
H1 = B[1]
# HOOK: the press conference. Camera shutters, the vault draining, a whoosh into the rewind
for k in range(14): put(None, 0.4 + k * 0.6 + rng.uniform(0, 0.3), 0.5, fallback=shutter)
put(None, WT(0, 'gone') - 0.1, 0.8, fallback=powerdown)
put(None, WT(0, 'billions') - 0.2, 0.6, fallback=lambda: coins(1.5, 20))
put(None, H1 - 0.3, 0.6, fallback=swish)
# CARD GAME: a swish per card, mouse clicks
put(None, B[1] + 0.9, 0.6, fallback=swish)
for w in ['Magic', 'Gathering', 'fantasy', 'cards']: put(None, WT(1, w) - 0.1, 0.35, fallback=swish)
put(None, WT(1, 'website'), 0.6, fallback=click)
# 2010: typing, a chime when bitcoin appears; Tokyo street hum
put(None, B[2] + 0.2, 0.5, fallback=lambda: typing(2.0))
put(None, WT(2, 'bitcoin') - 0.1, 0.6, fallback=chime)
put(None, WT(2, 'sold') - 0.1, 0.6, fallback=lambda: coins(0.6, 8))
bed(None, WT(2, 'programmer') - 1.0, B[3], 0.12, fallback=lambda d: hum(d, 120))
# BOOM: coins pouring and a ticker of clicks
put(None, WT(3, 'booming') - 0.2, 0.6, fallback=lambda: coins(2.0, 26))
for k in range(16): put(None, WT(3, 'seventy') - 0.8 + k * 0.05, 0.3, fallback=click)
# FIRST CRACK: a thump, typing, then the price falls
put(None, WT(4, 'crack') - 0.05, 0.9, fallback=thump)
put(None, WT(4, 'broke'), 0.5, fallback=lambda: typing(1.4, 14))
put(None, WT(4, 'dumped') - 0.1, 0.6, fallback=lambda: coins(1.2, 18))
put(None, WT(4, 'crashed') - 0.05, 0.8, fallback=fall)
# REAL HEIST: server hum, a clock, a beep as the file is copied
bed(None, B[5], B[6] - 0.1, 0.18, fallback=lambda d: hum(d, 60)); bed(None, B[5], B[6] - 0.1, 0.3, fallback=ticktock)
for k in range(6): put(None, WT(5, 'copied') + k * 0.12, 0.4, fallback=lambda: beep(1200))
put(None, WT(5, 'keys'), 0.5, fallback=cuffs)
# DRIP: coins trickle out of the vault, a drip under it; calm room on "normal"
bed(None, B[6], WT(6, 'And', 1), 0.35, fallback=drip)
for w in ['Slowly', 'leaked', 'batch', 'after']: put(None, WT(6, w), 0.5, fallback=lambda: coins(0.8, 8))
bed(None, WT(6, 'And', 1), B[7] - 0.1, 0.15, fallback=lambda d: hum(d, 120))
# FROZEN: clicks that go nowhere, an error buzz
for k in range(5): put(None, WT(7, 'tried') + k * 0.25, 0.6, fallback=click)
put(None, WT(7, 'froze') - 0.05, 0.6, fallback=lambda: beep(220)); put(None, WT(7, 'froze') + 0.15, 0.6, fallback=lambda: beep(220))
# PROTEST: snow wind in the street, a power-down when the site goes blank
bed(None, B[8], WT(8, 'blank'), 0.3, fallback=wind)
put(None, WT(8, 'blank') - 0.1, 0.9, fallback=powerdown)
# THE BOW: shutters again
put(None, B[9] - 0.15, 0.5, fallback=swish)
for k in range(16): put(None, WT(9, 'bowed') - 0.3 + k * 0.35 + rng.uniform(0, 0.15), 0.5, fallback=shutter)
put(None, WT(9, 'bankrupt'), 0.9, fallback=thump)
# TWIST: safe opens, chime and coins
put(None, WT(10, 'found') - 0.3, 0.6, fallback=clang); put(None, WT(10, 'found') + 0.1, 0.6, fallback=chime)
put(None, WT(10, 'wallet'), 0.5, fallback=lambda: coins(1.2, 16))
# FOLLOW THE COINS: beeps along the chain, a hum at BTC-e
put(None, B[11] - 0.15, 0.6, fallback=swish)
for k in range(12): put(None, WT(11, 'traced') + k * 0.3, 0.35, fallback=lambda: beep(900 + (k % 4) * 150))
bed(None, WT(11, 'BTCe'), B[12] - 0.2, 0.18, fallback=lambda d: hum(d, 50))
put(None, WT(11, 'Vinnik') - 0.05, 0.8, fallback=thump)
# GREECE: sea, gulls, cicadas; police car, cuffs
put(None, B[12] - 0.15, 0.6, fallback=swish)
bed(None, B[12], B[13] - 0.2, 0.3, fallback=sea); bed(None, B[12], B[13] - 0.2, 0.22, fallback=gulls); bed(None, B[12], B[13] - 0.2, 0.12, fallback=cicadas)
put(None, B[12] + 0.2, 0.5, fallback=lambda: engine(2.0, 90, 60))
put(None, WT(12, 'arrested') + 0.2, 0.8, fallback=cuffs)
# CHARGES: a thump for the indictment, the counter clicking up
put(None, WT(13, 'charged'), 0.8, fallback=thump)
for k in range(20): put(None, WT(13, 'six') + k * 0.08, 0.3, fallback=click)
# SWAP: a plane passes
put(None, WT(14, 'swapped') - 0.5, 0.6, fallback=lambda: plane(4.0))
# CELL: a door clang, drips
put(None, B[15] - 0.05, 0.6, fallback=clang); bed(None, B[15], B[16] - 0.2, 0.3, fallback=drip)
for w in ['cleared', 'convicted']: put(None, WT(15, w), 0.7, fallback=thump)
# TEN YEARS: ticking clock
bed(None, B[16], B[17] - 0.1, 0.3, fallback=ticktock)
put(None, WT(16, 'Repayments'), 0.5, fallback=lambda: coins(0.8, 8))
# LESSON: room tone, a ding on each tip, a whoosh into the end card
bed(None, B[17], END, 0.12, fallback=lambda d: hum(d, 120))
for w in ['If', 'Keep', 'twofactor']: put(None, WT(17, w) - 0.1, 0.55, fallback=ding)
put(None, WT(17, 'Follow') - 0.2, 0.7, fallback=swish)
venv = np.convolve(np.abs(pad(voice)), np.ones(2400) / 2400, 'same'); duck = 1 - 0.55 * np.clip(venv / (venv.max() * 0.25), 0, 1)
mix = pad(voice) + pad(m) * 0.36 * duck + 0.15 * np.tanh(fx[:N] * 0.18 / 0.15)
# insert the rewind after the hook: reversed, pitched-up slice of the music + tape squeal
Hs = int((B[1] - 0.05) * SR); R = int(RW * SR)
src = pad(m)[max(0, Hs - 2 * R):Hs][::-1]; idx = np.linspace(0, len(src) - 1, R).astype(int); rw = src[idx] * 0.5
t = tt(RW); squeal = np.sin(2 * np.pi * np.cumsum(900 + 1400 * t) / SR) * 0.08 * np.sin(np.pi * t / RW); rw = rw + squeal
fade = np.linspace(1, 0, int(0.05 * SR)); rw[-len(fade):] *= fade
mix = np.concatenate([mix[:Hs], rw, mix[Hs:]])
mix /= np.abs(mix).max() * 1.05; sf.write(f'{EP}/audio.mix.wav', mix.astype(np.float32), SR)
sf.write(f'{EP}/sfx.wav', (0.15 * np.tanh(fx[:N] * 0.18 / 0.15)).astype(np.float32), SR)
json.dump(used, open(f'{EP}/sfx-used.json', 'w'), indent=1)
print('audio', round(len(mix) / SR, 2), 's; recorded sfx files used:', len(used))
