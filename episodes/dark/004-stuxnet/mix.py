"""Voice + score + sound effects for Stuxnet, then the 1 s rewind after the hook.
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

def ring(d=1.6):  # desk phone: two-tone bursts
    t = tt(d); on = ((t % 0.4) < 0.2) & (t < d); return norm((np.sin(2 * np.pi * 440 * t) + np.sin(2 * np.pi * 480 * t)) * on * np.exp(-((t % 0.4)) * 4), 0.6)
def whine(d, f0, f1):  # centrifuge motors: a pitched hum that glides with the drive frequency
    t = tt(d); f = f0 + (f1 - f0) * np.clip(t / max(0.5, d * 0.6), 0, 1); ph = 2 * np.pi * np.cumsum(f) / SR; x = np.sin(ph) + 0.5 * np.sin(2 * ph) + 0.25 * np.sin(3 * ph)
    env = np.minimum(1, np.minimum(t / 0.3, (d - t) / 0.4)); return norm(x * env, 0.5)
def rattle(d, rate=14, f=180):  # metal-on-metal shake: tonal clicks
    out = np.zeros(int(d * SR)); k = 0
    while k / rate < d - 0.05:
        i = int(k / rate * SR); c = np.sin(2 * np.pi * (f + 40 * (k % 3)) * tt(0.05)) * np.exp(-tt(0.05) * 90); out[i:i + len(c)] += c[:max(0, len(out) - i)] * (0.5 + 0.5 * min(1, k / (rate * d * 0.7))); k += 1
    return norm(out, 0.6)
def burst():  # the centrifuge tearing apart: a deep thump, a bright metal ring, falling clinks
    out = np.zeros(int(2.2 * SR)); th = thump(); out[:len(th)] += th * 1.2
    t = tt(1.6); ringm = sum(np.sin(2 * np.pi * f * t) * np.exp(-t * (3 + k)) for k, f in enumerate((523, 791, 1187, 1663))); out[:len(ringm)] += ringm * 0.4
    for k in range(9): c = np.sin(2 * np.pi * (1800 + 300 * (k % 4)) * tt(0.08)) * np.exp(-tt(0.08) * 50); i = int((0.35 + k * 0.13 + rng.uniform(0, 0.06)) * SR); out[i:i + len(c)] += c * (0.5 - k * 0.04)
    return norm(out, 1.0)
def car(d=3.6): return engine(d, 70, 120)
def ping(): t = tt(0.4); return norm(np.sin(2 * np.pi * 1568 * t) * np.exp(-t * 9) + 0.4 * np.sin(2 * np.pi * 2349 * t) * np.exp(-t * 12), 0.5)
def stampfx(): return thump()

# ---- placement (voice seconds) -------------------------------------------------------------------
H1 = B[1]
# HOOK: the hall roaring and rattling, the burst, then a calm beep in the control room
bed(None, 0.0, WT(0, 'screens') - 0.2, 0.35, fallback=lambda d: whine(d, 150, 176))
put(None, WT(0, 'spun') - 0.3, 0.45, fallback=lambda: rattle(WT(0, 'apart') - WT(0, 'spun') + 0.2, 16, 170))
put(None, WT(0, 'apart') - 0.15, 0.95, fallback=burst)
put(None, WT(0, 'screens'), 0.35, fallback=lambda: beep(880)); put(None, WT(0, 'fine'), 0.35, fallback=lambda: beep(1175))
put(None, H1 - 0.3, 0.6, fallback=swish)
# MINSK: office hum, the phone rings, typing; reboot chimes from the screen
bed(None, B[1], B[4] - 0.1, 0.1, fallback=lambda d: hum(d, 120))
put(None, WT(1, 'tiny'), 0.6, fallback=lambda: ring(WT(1, 'strange') - WT(1, 'tiny') - 0.1))
put(None, WT(1, 'strange') - 0.05, 0.5, fallback=click)
for w in ['crashing', 'rebooting', 'over']: put(None, WT(1, w), 0.35, fallback=chime)
# THE WORM: typing, a beep on the detection, a click on the USB stick
put(None, B[2] + 0.3, 0.45, fallback=lambda: typing(2.2, 11))
put(None, WT(2, 'worm') - 0.05, 0.55, fallback=lambda: beep(660))
put(None, WT(2, 'U') - 0.1, 0.6, fallback=click); put(None, WT(2, 'opening'), 0.45, fallback=ping)
# ZERO-DAYS: a lock clunk per hole, a stamp on "spent four", a stamp on "stolen"
for k in range(4): put(None, WT(3, 'four') + k * 0.22, 0.5, fallback=lambda: beep(330 - k * 30))
put(None, WT(3, 'spent') - 0.1, 0.8, fallback=stampfx); put(None, WT(3, 'stolen') - 0.05, 0.8, fallback=stampfx)
# THE SPREAD: map pings as the dots appear, a thump on Iran
put(None, B[4] - 0.15, 0.6, fallback=swish); bed(None, B[4], B[6] - 0.1, 0.1, fallback=lambda d: hum(d, 60))
for k in range(18): put(None, WT(4, 'infected') + k * 0.1 + rng.uniform(0, 0.05), 0.25, fallback=ping)
put(None, WT(4, 'Iran') - 0.05, 0.8, fallback=thump)
# HUNTING: a ticking clock, a ping per maker
bed(None, B[5], B[6] - 0.1, 0.25, fallback=ticktock)
for w in ['Siemens', 'Finland', 'Iran']: put(None, WT(5, w) - 0.05, 0.45, fallback=ping)
# NATANZ: desert wind, then the hall's motor whine fades up
bed(None, WT(6, 'Natanz') - 0.2, WT(6, 'thousands') - 0.1, 0.3, fallback=wind)
bed(None, WT(6, 'thousands') - 0.2, B[8] - 0.1, 0.32, fallback=lambda d: whine(d, 150, 150))
# THE ATTACK: the whine climbs on "pushed", sags on "dropped", climbs again; rattles
put(None, WT(7, 'pushed'), 0.5, fallback=lambda: whine(2.2, 150, 200)); put(None, WT(7, 'pushed') + 0.6, 0.4, fallback=lambda: rattle(1.8, 16, 190))
put(None, WT(7, 'dropped') - 0.3, 0.55, fallback=lambda: whine(1.6, 200, 60)); put(None, WT(7, 'dropped') + 0.3, 0.45, fallback=lambda: rattle(1.4, 5, 120))
put(None, WT(7, 'again') - 0.4, 0.5, fallback=lambda: whine(1.4, 60, 200))
# 21 SECONDS: control-room hum, a record click, a loop tick, then the burst on "fine"
bed(None, B[8], B[9] - 0.1, 0.12, fallback=lambda d: hum(d, 120)); bed(None, B[8], B[9] - 0.1, 0.22, fallback=lambda d: whine(d, 200, 200))
put(None, WT(8, 'recorded'), 0.5, fallback=click); put(None, WT(8, 'During'), 0.5, fallback=click)
put(None, WT(8, 'fine') - 0.1, 0.95, fallback=burst)
# 1,000: trolley wheels (soft rattle), a thump on the estimate
put(None, B[9] + 0.8, 0.3, fallback=lambda: rattle(4.0, 6, 110)); put(None, WT(9, 'thousand'), 0.7, fallback=thump)
# WHO MADE IT: ticking, a stamp on "Neither"
bed(None, B[10], B[11] - 0.1, 0.22, fallback=ticktock); put(None, WT(10, 'Olympic') - 0.1, 0.6, fallback=thump); put(None, WT(10, 'Neither') - 0.1, 0.8, fallback=stampfx)
# THE ESCAPE: a USB ping, the car leaves through the gate, pings as it spreads
put(None, WT(11, 'error') - 0.2, 0.5, fallback=ping); put(None, WT(11, "engineer's") - 0.3, 0.55, fallback=car)
for k in range(8): put(None, WT(11, 'copy') - 0.3 + k * 0.12, 0.3, fallback=ping)
# A NEW KIND OF WAR: low hall whine
bed(None, B[12], B[13] - 0.1, 0.2, fallback=lambda d: whine(d, 150, 150))
# LESSON: room tone, desert wind for the plant, a ding on each tip, a whoosh into the end card
bed(None, B[13], WT(13, 'So') - 0.1, 0.25, fallback=wind); bed(None, WT(13, 'So') - 0.1, END, 0.1, fallback=lambda d: hum(d, 120))
for w in ["don't", 'install']: put(None, WT(13, w) - 0.1, 0.55, fallback=ding)
put(None, WT(13, 'Follow') - 0.2, 0.7, fallback=swish)
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
