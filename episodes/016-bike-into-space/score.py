"""Original score for the bike-into-space Short (GeneralUser GS samples via pipeline/sf2.py). Music arm: hype.
A driving D-major string ostinato with brass stabs for the hook, a playful pizzicato/celesta bounce for the
bread-light body, a floating choir for the hour-long jump, a spinning pizz figure for the slipping tyres, then the
ostinato builds bar by bar through the 45-minute pedal to a big hit on "orbit" and a proud brass theme as you leave.
Usage: python3 score.py EP_DIR -> EP_DIR/music.wav"""
import sys, json, os, numpy as np, soundfile as sf
REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')); sys.path.insert(0, f'{REPO}/pipeline')
from sf2 import SoundFont, reverb
SR = 24000
here = sys.argv[1]
tl = json.load(open(f'{here}/timeline.json')); B = tl['beats']
def WT(bi, word, n=1):
    c = 0
    for w in B[bi]['words']:
        if w['w'].strip('.,!?:').lower() == word.lower():
            c += 1
            if c == n: return w['s']
    raise KeyError(word)
T_END = tl['duration'] + 0.8
F = SoundFont(f'{REPO}/models/GeneralUser-GS.sf2', SR)
out = np.zeros(int((T_END + 4) * SR))
STR, SLOW, TREM, PIZZ, CELLO, TIMP, CHOIR, HIT, HORN, BRASS, TPT, CELESTA, GLOCK, TAIKO = 48, 49, 44, 45, 42, 47, 52, 55, 60, 61, 56, 8, 9, 116
def n(t, prog, key, vel, dur, gain=1.0):
    if t < 0 or t > T_END: return
    a = F.note(prog, key, int(min(127, vel)), dur) * gain
    s = int(t * SR); e = min(len(out), s + len(a)); out[s:e] += a[: e - s]
def env(t, a, b, fade=0.3): return float(np.clip(min((t - a) / fade + 1, (b - t) / fade + 1), 0, 1))
D = [50, 54, 57]; G = [43, 47, 50]; A = [45, 49, 52]; Bm = [47, 50, 54]; Em = [40, 43, 47]; F_ = [41, 45, 48]
def ostinato(a, b, bpm, prog, g0=0.5, g1=1.0, drums=True, brass=True):
    beat = 60 / bpm; t = a; i = 0
    while t < b:
        g = env(t, a, b, 0.12); ch = prog[(i // 8) % len(prog)]; grow = g0 + (g1 - g0) * (t - a) / max(0.1, b - a)
        for s in range(2):   # driving eighths in the strings
            tt = t + s * beat / 2; n(tt, STR, ch[(i * 2 + s) % 3] + 24, 88, beat * 0.4, 0.28 * g * grow)
        n(t, CELLO, ch[0] - 12, 100, beat * 0.5, 0.5 * g * grow)
        if drums and i % 2 == 0: n(t, TAIKO, 40, 90, 0.4, 0.35 * g * grow)
        if drums and i % 4 == 2: n(t, TIMP, ch[0] - 12, 100, 0.4, 0.4 * g * grow)
        if brass and i % 8 == 7: [n(t + beat / 2, BRASS, k + 12, 105, beat * 0.9, 0.35 * g * grow) for k in ch]
        t += beat; i += 1

# ---- hook: brass hit on "Twenty", driving ostinato, a rising run into "fly", a huge hit on "space"
th = WT(0, 'Twenty')
for k in D + [62]: n(th, BRASS, k, 118, 0.8, 0.55)
n(th, TIMP, 38, 125, 1.0, 0.9); n(th, HIT, 50, 110, 0.7, 0.6)
ostinato(th + 0.4, WT(0, 'fly'), 128, [D, D, G, A], 0.6, 1.0)
tf = WT(0, 'fly')
for k, key in enumerate([62, 66, 69, 74, 78]): n(tf - 0.5 + k * 0.1, TPT, key, 105, 0.4, 0.35)
ts = WT(0, 'space')
for k in [50, 57, 62, 66, 69, 74]: n(ts, BRASS, k, 122, 1.4, 0.55)
n(ts, TIMP, 38, 127, 1.2, 1.0); n(ts, HIT, 62, 115, 0.9, 0.7); n(ts, CHOIR, 74, 90, 1.6, 0.35)

# ---- beat 1: Deimos, bread-light. A bouncy pizz/celesta figure, light and comic
a1, b1 = B[1]['start'], B[2]['start'] - 0.05
beat = 60 / 128; t = a1; i = 0; prog = [D, Bm, G, A]
while t < b1:
    g = env(t, a1, b1, 0.15); ch = prog[(i // 4) % 4]
    n(t, PIZZ, ch[0] - 12, 100, beat * 0.4, 0.6 * g); n(t + beat / 2, PIZZ, ch[(i % 2) + 1], 90, beat * 0.3, 0.45 * g)
    if i % 2 == 1: n(t, CELESTA, ch[2] + 24, 80, 0.3, 0.3 * g)
    t += beat; i += 1
n(WT(1, 'bread'), GLOCK, 86, 110, 0.6, 0.5); n(WT(1, 'bread') + 0.12, GLOCK, 90, 110, 0.6, 0.45)

# ---- beat 2: jump and float for an hour: a rising whoosh of strings, then a suspended choir chord
tj = WT(2, 'Jump')
for k, key in enumerate(range(50, 76, 2)): n(tj - 0.3 + k * 0.035, STR, key, 90, 0.25, 0.25)
b2 = B[3]['start'] - 0.05
for k in [62, 66, 69, 73]: n(tj + 0.15, CHOIR, k, 80, b2 - tj, 0.3)
for k in [50, 57]: n(tj + 0.15, SLOW, k, 80, b2 - tj, 0.35)
for k in range(8): n(tj + 0.4 + k * 0.5, CELESTA, [86, 81, 78, 81, 86, 90, 86, 81][k], 70, 0.6, 0.25 * env(tj + 0.4 + k * 0.5, tj, b2, 0.4))
n(WT(2, 'hour'), GLOCK, 93, 100, 0.8, 0.4)

# ---- beat 3: tyres spin uselessly: a fast circling pizz figure that goes nowhere, a deflating trombone-ish drop
a3, b3 = B[3]['start'], B[4]['start'] - 0.05
t = a3; k = 0; fig = [62, 66, 69, 66]
while t < b3:
    n(t, PIZZ, fig[k % 4], 95, 0.15, 0.45 * env(t, a3, b3, 0.15)); t += 0.13; k += 1
tg = WT(3, 'grip')
for k, key in enumerate([62, 61, 59, 57]): n(tg + k * 0.14, HORN, key - 12, 90, 0.2 if k < 3 else 0.6, 0.45)

# ---- beat 4: pedal gently for 45 minutes: the ostinato starts soft and builds bar by bar to "orbit"
a4, to = B[4]['start'], WT(4, 'orbit')
ostinato(a4, to - 0.05, 128, [D, Bm, G, A, D, Em, G, A], 0.25, 1.0, drums=True, brass=True)
for k in D: n(WT(4, 'curves'), CHOIR, k + 12, 85, to - WT(4, 'curves'), 0.3)
for k in [50, 57, 62, 66, 69, 74, 78]: n(to, BRASS, k, 125, 1.6, 0.5)
n(to, TIMP, 38, 127, 1.2, 1.0); n(to, HIT, 62, 120, 1.0, 0.75); n(to + 0.35, TIMP, 45, 120, 0.8, 0.8)
for k, key in enumerate([74, 78, 81, 86]): n(to + 0.1 + k * 0.08, TPT, key, 110, 0.6, 0.4)

# ---- beat 5: leave Deimos forever, a proud brass theme over the ostinato
a5, b5 = B[5]['start'], B[6]['start']
ostinato(a5, b5 + 0.3, 128, [D, G, Bm, A], 0.8, 1.0, brass=False)
beat = 60 / 128; t = a5 + beat; theme = [(62, 2), (66, 1), (69, 1), (74, 3), (73, 1), (71, 2), (69, 2), (74, 4)]
for key, d in theme:
    if t > b5: break
    n(t, HORN, key - 12, 100, d * beat * 0.95, 0.6); n(t, TPT, key, 95, d * beat * 0.95, 0.3); t += d * beat

# ---- beat 6: CTA, a final big D chord and a sparkle
end = B[6]['start'] + 0.1
for k in [38, 50, 57, 62, 66, 69, 74]: n(end, SLOW, k, 100, T_END - end, 0.45)
n(end, BRASS, 62, 110, 1.4, 0.5); n(end, TIMP, 38, 120, 1.2, 0.9); n(end, GLOCK, 86, 100, 1.0, 0.4)

mix = reverb(out, SR, 2.0, 0.25)[: int(T_END * SR)]; mix /= np.abs(mix).max() + 1e-9
sf.write(f'{here}/music.wav', mix.astype(np.float32), SR); print('music', round(len(mix) / SR, 1), 's')
