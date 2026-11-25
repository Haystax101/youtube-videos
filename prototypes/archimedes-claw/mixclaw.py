"""Audio for the Archimedes claw prototype: voice (with a 1 s gap for the rewind), music whose
mood follows the scene, and synthesised sound effects. Times below are VIDEO seconds."""
import sys, json, numpy as np, soundfile as sf
sys.path.insert(0, '/home/user/youtube-videos/pipeline')
from mix import SR, place as _place, thud, boom, clack, whoosh, mood_track, music, MOODS
rng = np.random.default_rng(5)
def place(buf, clip, at, g):
    clip = np.asarray(clip)
    if at < 0: clip = clip[int(-at * SR):]; at = 0
    if len(clip): _place(buf, clip, at, g)
here = sys.argv[1]
tl = json.load(open(f'{here}/timeline.json')); HOOK_END = tl['beats'][1]['start']; RW = 1.0
voice, sr = sf.read(f'{here}/voice.wav'); assert sr == SR
if voice.ndim > 1: voice = voice.mean(1)
cut = int(HOOK_END * SR); voice = np.concatenate([voice[:cut], np.zeros(int(RW * SR)), voice[cut:]])
T = len(voice) / SR + 0.8; N = int(T * SR); out = np.zeros(N + SR); fx = np.zeros(N + SR); mus = np.zeros(N + SR)
def tt(d): return np.arange(int(SR * d)) / SR
def lp(x, k): return np.convolve(x, np.ones(k) / k, 'same')
def bp(x, lo, hi): return lp(x, lo) - lp(x, hi)
W = lambda w: w + RW  # story world time -> video time
# ---- music: one track per mood, cross-faded by scene ----
segs = [(0, HOOK_END, 'suspense'), (HOOK_END + RW, W(37.5), 'epic'), (W(37.5), W(55), 'chiptune'), (W(55), W(65.6), 'suspense'), (W(65.6), T, 'musicbox')]
for a, b, mood in segs:
    m = mood_track(T, mood, MOODS[mood]['bpm'], MOODS[mood]['chords']); m = m / (np.abs(m).max() + 1e-9)
    env = np.clip(np.minimum((np.arange(N) / SR - a) / 0.5 + 1, (b - np.arange(N) / SR) / 0.5 + 1), 0, 1)
    gain = {'suspense': 0.30, 'epic': 0.24, 'chiptune': 0.16, 'musicbox': 0.28}[mood]
    mus[:N] += m[:N] * env * gain
# duck the music under the voice
venv = lp(np.abs(np.pad(voice, (0, N + SR - len(voice)))), 2400); duck = 1 - 0.45 * np.clip(venv / (venv.max() * 0.25), 0, 1)
mus *= duck
# ---- ambience ----
wav = lp(rng.normal(0, 1, N + SR), 300); wav /= np.abs(wav).max(); slow = 0.6 + 0.4 * np.sin(2 * np.pi * np.arange(N + SR) / SR * 0.15); fx += wav * slow * 0.09
for at in [0.8, 7.5, 10.2, 13.0, 18.4, 21.0, 40.2, 44.0, 46.5]:
    t = tt(0.35); f = 1500 + 600 * np.sin(2 * np.pi * 4 * t) - 500 * t; place(fx, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / t[-1]) * 0.06, at, 1)
for k in range(int((W(60) - W(56)) * 3)):  # crickets at night
    at = W(56) + k / 3 + rng.random() * 0.1; t = tt(0.08); place(fx, np.sin(2 * np.pi * 4200 * t) * (np.sin(2 * np.pi * 60 * t) > 0) * 0.025, at, 1)
for k in range(int(6 / 0.71)):  # oar splashes as the fleet rows
    t = tt(0.3); s = bp(rng.normal(0, 1, len(t)), 10, 2) * np.exp(-t * 10); place(fx, s * 0.25, W(5.6) + k * 0.71, 1)
# ---- rewind: tape squeal ----
t = tt(RW); f = 900 + 2200 * t / RW; s = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.12 + bp(rng.normal(0, 1, len(t)), 4, 1) * 0.2; place(fx, s * np.sin(np.pi * t / RW) ** 0.5, HOOK_END, 1)
# ---- the claw (in the cold open and in the story) ----
def creak(d, base=70): t = tt(d); return np.sin(2 * np.pi * (base * t + 6 * np.sin(2 * np.pi * 7 * t))) * (np.sin(2 * np.pi * 23 * t) > 0.2) * np.sin(np.pi * t / d) * 0.35
def rattle(d): s = np.zeros(int(SR * d)); [place(s, clack(), rng.random() * d, 0.3 + rng.random() * 0.3) for _ in range(int(d * 16))]; return s
def scream(d, n=5): s = np.zeros(int(SR * d)); 
def panic(d, n=5):
    s = np.zeros(int(SR * d) + SR)
    for v in range(n):
        st = rng.random() * 0.4; dd = d - st; t = tt(dd); f0 = 260 + v * 40 + 120 * np.sin(np.pi * t / dd) + 15 * np.sin(2 * np.pi * 7 * t)
        saw = 2 * ((np.cumsum(f0) / SR) % 1) - 1; place(s, bp(saw, 3, 1) * np.sin(np.pi * t / dd) * 0.07, st, 1)
    return s[:int(SR * d)]
def splash(sz=1.0): t = tt(1.3 * sz); return bp(rng.normal(0, 1, len(t)), 14, 2) * np.exp(-t * 3 / sz) * (1 - np.exp(-t * 60)) * 1.2
def claw_events(off):  # off: video time of world time 0 for this pass
    for w, clip, g in [(28.2, creak(1.8, 60), 1), (30.4, rattle(1.8), 1), (33.45, creak(2.0, 48), 1.2), (33.5, panic(3.0, 6), 1)]:
        place(fx, clip, w + off, g)
    place(fx, thud(), 32.25 + off, 0.6); [place(fx, clack(), 32.25 + off + k * 0.03, 0.8) for k in range(3)]
claw_events(-30.0)  # cold open: world 30 at video 0
claw_events(RW)
place(fx, clack(), W(36.62), 0.9); place(fx, whoosh(), W(36.7), 1.0)
place(fx, splash(1.6), W(37.24), 1.3); place(fx, boom(), W(37.24), 0.8); place(fx, thud(), W(37.24), 1.0)
for k in range(10): place(fx, clack(), W(37.4) + rng.random() * 1.2, 0.35)
# catapult, stone, ladder crash
place(fx, thud(), W(22.45), 0.7); t = tt(1.2); place(fx, bp(rng.normal(0, 1, len(t)), 20, 3) * (t / t[-1]) * 0.6, W(22.45), 1)
place(fx, boom(), W(23.62), 0.5); [place(fx, clack(), W(23.62) + rng.random() * 0.5, 0.6) for _ in range(12)]; place(fx, splash(1.2), W(24.5), 0.9)
for k in range(9):  # bolts
    t = tt(0.45); f = 2400 - 1600 * t / t[-1]; place(fx, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / t[-1]) * 0.08 + bp(rng.normal(0, 1, len(t)), 6, 1) * 0.15 * np.sin(np.pi * t / t[-1]), W(24.9 + k * 0.27), 1)
    place(fx, thud(), W(24.9 + k * 0.27 + 0.45), 0.25)
# rope: slide whistle, then panic and frantic rowing
t = tt(0.7); f = 1400 - 900 * t / t[-1]; place(fx, np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.12, W(46.5), 1)
place(fx, panic(1.4, 3), W(48.7), 1.4); [place(fx, splash(0.3), W(48.8) + k * 0.18, 0.4) for k in range(8)]
# cup clink
t = tt(0.8); place(fx, sum(np.sin(2 * np.pi * f * t) for f in (2100, 3150, 4400)) * np.exp(-t * 6) * 0.06, W(50.5), 1)
# the fall of the city: drum hit, sword ring
place(fx, boom(), W(57.3), 0.7)
t = tt(1.2); place(fx, (np.sin(2 * np.pi * 3100 * t) + 0.5 * np.sin(2 * np.pi * 4650 * t)) * np.exp(-t * 4) * 0.08 + bp(rng.normal(0, 1, len(t)), 3, 1) * np.exp(-t * 20) * 0.3, W(62.3), 1)
place(fx, boom(), W(62.85), 0.6)
# ending chime
t = tt(1.6); place(fx, sum(np.sin(2 * np.pi * f * t) * a for f, a in [(880, 1), (1320, .5), (1760, .3)]) * np.exp(-t * 2.5) * 0.12, W(65.9), 1)
mix = np.pad(voice, (0, N + SR - len(voice))) * 1.0 + mus + fx
mix = mix[:N]; mix /= np.abs(mix).max() * 1.05
sf.write(f'{here}/audio.mix.wav', mix.astype(np.float32), SR)
print('audio', round(N / SR, 2), 's')
