"""Voice + score + sound effects for the video poker bug, then the 1 s rewind after the hook.
Every effect is built from tones (no filtered noise: george heard static from noise-based effects).
Levels follow the make-set-video skill: music 0.36 ducked 55% under the voice, SFX x0.18 through a 0.15*tanh limit.
Usage: python3 mix.py EP_DIR -> EP_DIR/audio.mix.wav (video time) and EP_DIR/sfx.wav (the effects stem)"""
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


# ---- casino / raid / court effects (tones only) ---------------------------------------------------
def button(): t = tt(0.06); return norm(np.sin(2 * np.pi * 1700 * t) * np.exp(-t * 120) + 0.5 * np.sin(2 * np.pi * 420 * t) * np.exp(-t * 80), 0.7)
def billin():  # bill acceptor pulls the note in: a motor whirr that rises
    t = tt(0.7); f = 180 + 140 * t / 0.7; ph = 2 * np.pi * np.cumsum(f) / SR; x = (np.sin(ph) + 0.4 * np.sin(2 * ph) + 0.2 * np.sin(3 * ph)) * (0.7 + 0.3 * np.sin(2 * np.pi * 31 * t)); return norm(x * np.sin(np.pi * t / 0.7) ** 0.5, 0.6)
def printer(d=0.9):  # ticket printer: a fast stepped buzz
    t = tt(d); x = np.sin(2 * np.pi * 620 * t) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 42 * t))) + 0.4 * np.sin(2 * np.pi * 1240 * t); x = lpf(x, 2600); return norm(x * np.minimum(1, np.minimum(t * 30, (d - t) * 30)), 0.5)
def bell(d=1.6, f=1050):  # jackpot bell ringing
    t = tt(d); strike = (np.sin(2 * np.pi * 18 * t) > 0).astype(float); x = sum(np.sin(2 * np.pi * f * r * t) * g for r, g in [(1, 1), (2.76, 0.5), (5.4, 0.25)]); return norm(x * (0.55 + 0.45 * strike) * np.exp(-t * 0.8), 0.7)
def jingle(d=8.0):  # distant slot-machine jingles for the casino bed
    out = np.zeros(int(d * SR)); t0 = 0.0
    while t0 < d - 0.6:
        base = rng.choice([523, 587, 659, 784, 880]); s = int(t0 * SR)
        for k in range(4):
            tk = tt(0.12); y = np.sin(2 * np.pi * base * (1.26 ** k) * tk) * np.exp(-tk * 18); i = s + int(k * 0.07 * SR); out[i:i + len(y)] += y[:max(0, min(len(y), len(out) - i))] * 0.5
        t0 += rng.uniform(0.4, 1.3)
    return norm(out, 0.5)
def casino(d=8.0): return norm(murmur(d) * 0.8 + jingle(d) * 0.5 + hum(d, 120) * 0.15, 0.7)
def knock(f=320):  # gavel on the block
    t = tt(0.35); x = np.sin(2 * np.pi * f * t) * np.exp(-t * 28) + 0.6 * np.sin(2 * np.pi * f * 2.3 * t) * np.exp(-t * 40) + np.sin(2 * np.pi * 90 * t) * np.exp(-t * 25); return norm(x, 0.9)
def ram():  # battering ram hits the door: low thud, wood crack partials
    t = tt(1.2); x = np.sin(2 * np.pi * 55 * t) * np.exp(-t * 9) * 1.4 + sum(np.sin(2 * np.pi * fr * t + rng.random() * 6) * np.exp(-t * (14 + fr / 300)) for fr in rng.uniform(150, 900, 18)) / 5; return norm(x, 0.95)
def wail(d=3.0):  # US police siren (wail)
    t = tt(d); f = 900 + 450 * np.sin(2 * np.pi * 0.45 * t); ph = 2 * np.pi * np.cumsum(f) / SR; x = np.sin(ph) * 0.8 + np.sin(2 * ph) * 0.2; return norm(x * np.minimum(1, np.minimum(t, d - t) * 2), 0.7)
def buzz(): t = tt(0.5); return norm(np.sin(2 * np.pi * 180 * t) * (np.sin(2 * np.pi * 9 * t) > 0) * np.exp(-t * 2), 0.6)  # phone vibrating
def traffic(d=8.0): return norm(engine(d, 50, 62) * 0.6 + hum(d, 90) * 0.2, 0.5)
def honk(): t = tt(0.4); return norm((np.sin(2 * np.pi * 420 * t) + np.sin(2 * np.pi * 530 * t)) * np.minimum(1, (0.4 - t) * 20), 0.6)

# ---- placement (voice seconds) -------------------------------------------------------------------
# HOOK: the win rings out, the ticket prints, then the room goes quiet for the FBI
bed(None, 0, B[1] - 0.2, 0.25, fallback=casino)
put(None, 0.05, 0.6, fallback=lambda: bell(1.3)); put(None, WT(0, 'trick') + 0.1, 0.5, fallback=lambda: bell(1.4, 1180)); put(None, 2.0, 0.5, fallback=printer)
put(None, WT(0, 'jackpot') - 0.05, 0.4, fallback=lambda: coins(0.8, 10))
# VEGAS 2009: a street at night, then the casino floor, buttons as Kane loses
bed(None, B[1], WT(1, 'John') - 0.1, 0.3, fallback=traffic); put(None, B[1] + 0.6, 0.3, fallback=honk)
bed(None, WT(1, 'John') - 0.1, WT(1, 'Then') - 0.1, 0.25, fallback=casino)
for k in range(6): put(None, WT(1, 'John') + k * 0.62, 0.5, fallback=button)
bed(None, WT(1, 'Then') - 0.1, WT(1, 'playing') - 0.15, 0.3, fallback=traffic)
bed(None, WT(1, 'playing') - 0.15, B[2], 0.22, fallback=casino)
# THE TRICK and THE PAYOUT: every press, the bill going in, the ticket printing
bed(None, B[2], B[4], 0.18, fallback=casino)
for w, dt in [('Switch', 0), ('Switch', 0.35), ('play', 0), ('Back', 0), ('raise', 0), ('raise', 0.4), ('Then', 0)]:
    try: put(None, WT(2, w, 2 if w == 'play' else 1) + dt, 0.8, fallback=button)
    except KeyError: pass
put(None, WT(2, 'Feed') - 0.15, 0.7, fallback=billin)
put(None, WT(3, 'Hit') + 0.15, 0.8, fallback=button); put(None, WT(3, 'pays'), 0.6, fallback=printer); put(None, WT(3, 'pays'), 0.5, fallback=lambda: bell(1.5))
put(None, WT(3, 'Eight') + 0.1, 0.45, fallback=lambda: coins(2.4, 22))
# THE CREW: the floor, a door chime, the strip at night, the Meadows floor
bed(None, B[4], WT(4, 'small') - 0.2, 0.22, fallback=casino)
bed(None, WT(4, 'small') - 0.2, WT(4, 'Nestor', 2) - 0.1, 0.3, fallback=traffic); put(None, WT(4, 'Rio') - 0.2, 0.25, fallback=honk)
for w in ['Rio', 'Wynn', 'Golden']: put(None, WT(4, w) - 0.1, 0.35, fallback=swish)
bed(None, WT(4, 'Nestor', 2) - 0.1, B[5], 0.22, fallback=casino); put(None, WT(4, 'four'), 0.4, fallback=lambda: coins(1.8, 16))
# FIVE JACKPOTS: five bells, then the floor goes quiet when security arrives
bed(None, B[5], WT(5, 'he') - 0.1, 0.3, fallback=traffic); bed(None, WT(5, 'he') - 0.1, B[6], 0.22, fallback=casino)
for k in range(5): put(None, WT(5, 'five') - 0.1 + k * 0.32, 0.45, fallback=lambda: bell(0.6, 1050 + k * 60))
# THE LAB: room hum, the cabinet door, the chip reader beeps, typing
bed(None, B[6], B[7], 0.15, fallback=lambda d: hum(d, 120))
put(None, WT(6, 'opened') - 0.1, 0.6, fallback=clang); put(None, WT(6, 'chip') - 0.1, 0.5, fallback=lambda: beep(1320)); put(None, WT(6, 'chip') + 0.15, 0.5, fallback=lambda: beep(1760))
put(None, WT(6, 'Hidden') - 0.2, 0.4, fallback=lambda: typing(1.4))
# THE RAID: the phone buzzes, the floor, sirens outside, the ram, the door gives
put(None, B[7] + 0.1, 0.6, fallback=buzz); bed(None, B[7], WT(7, 'until') - 0.15, 0.2, fallback=casino)
put(None, WT(7, 'until') - 0.3, 0.35, fallback=lambda: wail(WT(7, 'door') - WT(7, 'until') + 1.5))
put(None, WT(7, 'door') - 0.05, 1.0, fallback=ram); put(None, WT(7, 'door') + 0.05, 0.5, fallback=crash)
for k in range(5): put(None, WT(7, 'door') + 0.6 + k * 0.25, 0.4, fallback=thump)
# THE CHARGES: office hum, papers (typing), buttons on the machine
bed(None, B[8], WT(8, 'But') - 0.1, 0.15, fallback=lambda d: hum(d, 120)); put(None, WT(8, 'charged') - 0.1, 0.5, fallback=thump)
bed(None, WT(8, 'But') - 0.1, B[9], 0.2, fallback=casino)
for w, dt in [('pressed', 0), ('pressed', 0.45), ('buttons', 0), ('machine', 0), ('gave', 0)]: put(None, WT(8, w) + dt, 0.8, fallback=button)
# THE VERDICT: a murmur in the gallery, the gavel twice
bed(None, B[9], B[10], 0.12, fallback=lambda d: murmur(d))
put(None, WT(9, 'thrown') - 0.02, 1.0, fallback=knock); put(None, WT(9, 'thrown') + 0.22, 0.8, fallback=knock)
put(None, WT(9, 'dropped') - 0.02, 1.0, fallback=lambda: knock(300)); put(None, WT(9, 'dropped') + 0.22, 0.8, fallback=lambda: knock(300))
# THE LESSON: the floor, an update chime on the phone, a whoosh into the end card
bed(None, B[10], WT(10, 'Follow') - 0.2, 0.18, fallback=casino)
put(None, WT(10, 'So') - 0.1, 0.5, fallback=ding); put(None, WT(10, 'let') - 0.05, 0.7, fallback=button)
bed(None, WT(10, 'Follow') - 0.2, END, 0.25, fallback=traffic); put(None, WT(10, 'Follow') - 0.2, 0.7, fallback=swish)


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

