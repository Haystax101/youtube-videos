"""Voice + score + sound effects for the Citibank heist, then the 1 s rewind after the hook.
Recorded CC0 effects come from assets/sfx/<folder>/ (release sfx-v1, tools/fetch_sfx.py) when present;
every effect has a synthesised fallback so the mix always builds. Levels follow the make-set-video skill:
music 0.36 ducked 55% under the voice, SFX x0.18 through a 0.15*tanh soft limit.
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
# --- Citibank extras (all built from tones: no noise anywhere) ---
def dtmf(digits='5551994', on=0.09, off=0.06):
    lo = {'1': 697, '2': 697, '3': 697, '4': 770, '5': 770, '6': 770, '7': 852, '8': 852, '9': 852, '0': 941}
    hi = {'1': 1209, '2': 1336, '3': 1477, '4': 1209, '5': 1336, '6': 1477, '7': 1209, '8': 1336, '9': 1477, '0': 1336}
    out = []
    for d in digits:
        t = tt(on); e = np.minimum(1, np.minimum(t, on - t) * 200); out += [(np.sin(2 * np.pi * lo[d] * t) + np.sin(2 * np.pi * hi[d] * t)) * 0.4 * e, np.zeros(int(off * SR))]
    return np.concatenate(out)
def modem():  # dial, answer tone, then the warbling handshake (pure sine FSK)
    parts = [dtmf(), np.zeros(int(0.25 * SR))]
    t = tt(0.7); parts.append(np.sin(2 * np.pi * 2100 * t) * 0.35 * np.minimum(1, t * 40))
    t = tt(1.1); sel = (np.floor(t * 55) % 2); seq = np.where(rng.random(len(t)) < 0, 0, sel)
    f = np.where(seq > 0, 1270, 1070); f2 = np.where((np.floor(t * 47) % 2) > 0, 2225, 2025)
    parts.append((np.sin(2 * np.pi * np.cumsum(f) / SR) + np.sin(2 * np.pi * np.cumsum(f2) / SR)) * 0.22)
    x = np.concatenate(parts); x = lpf(x, 3400); n = int(0.05 * SR); x[-n:] *= np.linspace(1, 0, n); return norm(x, 0.6)
def ring():  # US ring tone 440+480 Hz, two bursts
    t = tt(2.0); g = ((t % 3.0) < 2.0).astype(float); x = (np.sin(2 * np.pi * 440 * t) + np.sin(2 * np.pi * 480 * t)) * 0.4 * g
    out = np.concatenate([x[:int(1.0 * SR)], np.zeros(int(0.4 * SR)), x[:int(1.0 * SR)]]); n = int(0.02 * SR); out[:n] *= np.linspace(0, 1, n); return norm(out, 0.6)
def alarm(n=6):
    out = np.zeros(int(n * 0.36 * SR + SR))
    for k in range(n):
        t = tt(0.22); x = np.sign(np.sin(2 * np.pi * 880 * t)) * 0.3 + np.sin(2 * np.pi * 1760 * t) * 0.3; x = lpf(x * np.minimum(1, np.minimum(t, 0.22 - t) * 120), 3000); i = int(k * 0.36 * SR); out[i:i + len(x)] += x
    return norm(out, 0.6)
def chime():  # airport announcement chime
    out = np.zeros(int(2.2 * SR))
    for k, f in enumerate([784, 659, 523]):
        t = tt(1.4); x = (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2 * f * t)) * np.exp(-t * 3); i = int(k * 0.35 * SR); out[i:i + len(x)] += x
    return norm(out, 0.6)
def jet(d=6.0):  # distant jet: low harmonics with a slow swell
    t = tt(d); f = 95 + 25 * np.sin(np.pi * t / d); ph = 2 * np.pi * np.cumsum(f) / SR
    x = sum(np.sin(ph * h + h) / h for h in range(1, 9)) + 0.15 * np.sin(2 * np.pi * np.cumsum(f * 31) / SR)
    return norm(lpf(x, 1500) * np.sin(np.pi * t / d) ** 1.5, 0.6)
def gavel():
    t = tt(0.5); x = np.sin(2 * np.pi * 90 * t) * np.exp(-t * 22) + sum(np.sin(2 * np.pi * fr * t) * np.exp(-t * 40) * g for fr, g in [(410, 0.6), (870, 0.35), (1530, 0.2)])
    out = np.concatenate([x, np.zeros(int(0.05 * SR)), x * 0.7]); return norm(out, 0.9)
def vault():  # heavy vault door: deep thump + low ring
    t = tt(2.0); x = np.sin(2 * np.pi * 42 * t) * np.exp(-t * 5) * 1.3 + sum(np.sin(2 * np.pi * fr * t) * np.exp(-t * dk) * g for fr, dk, g in [(120, 2.5, 0.6), (287, 3.5, 0.35), (523, 5, 0.2)])
    return norm(x, 1.0)

# ---- placement (voice seconds) -------------------------------------------------------------------
def W(i, w, n=1):
    try: return WT(i, w, n)
    except KeyError: print('missing word', i, w); return B[i]
S = lambda *a, **k: put(None, *a, **k)
# HOOK: the vault swings open and the money pours out
S(0.05, 0.8, fallback=vault); S(0.3, 0.55, fallback=lambda: coins(3.0, 24)); S(3.4, 0.5, fallback=lambda: coins(3.5, 22)); S(7.0, 0.45, fallback=lambda: coins(3.0, 16))
for s in (0.5, 2.2, 4.6, 6.8): S(s, 0.4, fallback=swish)
S(W(0, 'phone') - 0.1, 0.45, fallback=lambda: dtmf('3', 0.12))
# ST PETERSBURG: winter wind, typing, the modem connects
bed(None, B[1] + 0.1, B[2] - 0.2, 0.22, fallback=wind)
S(W(1, 'programmer'), 0.4, fallback=lambda: typing(2.0))
S(W(1, 'way') - 0.6, 0.55, fallback=modem)
# BACK DOOR: dial tones under "dial in", typing on "type", whoosh on "anywhere"
S(W(2, 'dial') - 0.05, 0.5, fallback=dtmf)
S(W(2, 'type'), 0.45, fallback=lambda: typing(2.2, 11))
S(W(2, 'anywhere') - 0.2, 0.5, fallback=swish)
S(W(2, 'password') - 0.05, 0.4, fallback=click)
# KEYS: a beep for each login on the list
for k, w in enumerate(['Argentina', 'Indonesia', 'Bahamas']): S(W(3, w), 0.35, fallback=lambda k=k: beep(900 + 150 * k))
# TRANSFERS: typing, modem, a coin and a beep per transfer as the counter climbs
S(B[4] + 0.2, 0.45, fallback=modem)
S(W(4, 'work'), 0.35, fallback=lambda: typing(4.0, 10))
for k in range(26): S(W(4, 'forty') + k * 0.45, 0.22, fallback=lambda k=k: beep(1200 + (k % 5) * 80))
for k, w in enumerate(['Finland', 'Israel', 'Netherlands', 'Germany', 'States']): S(W(4, w), 0.4, fallback=coin)
# CUSTOMERS NOTICE: alarm, then the phone call to the FBI
S(W(5, 'missing') - 0.1, 0.4, fallback=lambda: alarm(5))
S(W(5, 'calls') - 0.2, 0.4, fallback=ring)
# THE TRAP: bank murmur, the clock, cuffs on the courier and her husband
bed(None, B[6] + 0.1, W(6, 'arrested') + 0.3, 0.18, fallback=murmur)
bed(None, B[6] + 0.1, W(6, 'San') - 0.2, 0.25, fallback=ticktock)
S(W(6, 'withdraw'), 0.4, fallback=lambda: coins(0.8, 6))
S(W(6, 'arrested') - 0.15, 0.7, fallback=cuffs); S(W(6, 'husband') - 0.1, 0.6, fallback=cuffs)
S(W(6, 'Petersburg') - 0.2, 0.5, fallback=swish)
# UNTOUCHABLE: office hum, typing as evidence comes in, a clock while the FBI waits
bed(None, B[7] + 0.1, B[8] - 0.2, 0.2, fallback=lambda d: hum(d, 120))
S(W(7, 'laptop') - 0.2, 0.4, fallback=lambda: modem()[: int(1.2 * SR)])
bed(None, W(7, 'waits') - 0.5, B[8] - 0.1, 0.35, fallback=ticktock)
# STANSTED: jet over, announcement chime, cuffs when Scotland Yard is waiting
S(W(8, 'travels') - 0.5, 0.55, fallback=lambda: jet(5.0))
S(W(8, 'Stansted') - 0.6, 0.55, fallback=chime)
S(W(8, 'waiting') - 0.1, 0.7, fallback=cuffs)
# HOUSE OF LORDS: gavel on "loses", a jet on "flown"
S(W(9, 'loses') - 0.05, 0.7, fallback=gavel)
S(W(9, 'flown') - 0.8, 0.5, fallback=lambda: jet(4.0))
# COURT: gavel on "admits" and "sentence", a cell door on "prison"
S(W(10, 'court') - 0.1, 0.5, fallback=gavel)
S(W(10, 'sentence') - 0.05, 0.75, fallback=gavel)
S(W(10, 'prison') - 0.1, 0.6, fallback=clang)
# TWIST: whoosh, typing for the hackers, a single coin for $100
S(B[11] - 0.15, 0.55, fallback=swish)
S(W(11, 'hackers'), 0.35, fallback=lambda: typing(2.0))
S(W(11, 'dollars') - 0.1, 0.6, fallback=coin)
S(W(11, 'proven') - 0.1, 0.5, fallback=thump)
# RECOVERY: coins back, then the vault thud on "lock"
S(W(12, 'back') - 0.1, 0.4, fallback=lambda: coins(1.2, 10))
S(W(12, 'lock') - 0.1, 0.8, fallback=vault)
# LESSON: room tone, a phone-code beep on "two-step", a mail ding on "email", whoosh to the end card
bed(None, B[13], END, 0.12, fallback=lambda d: hum(d, 120))
S(W(13, 'login') - 0.1, 0.5, fallback=lambda: beep(1320))
S(W(13, 'email') - 0.1, 0.6, fallback=ding)
S(W(13, 'Follow') - 0.2, 0.6, fallback=swish)


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
