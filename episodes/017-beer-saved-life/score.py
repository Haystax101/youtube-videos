"""Original score for the beer Short (GeneralUser GS samples via pipeline/sf2.py). Music arm: suspense.
Suspense arm: a sly hook sting, a bright party groove in Vietnam, a ticking low-string pulse
inside the liver with a stinger on "kill", a sneaky pizzicato for the ethanol trick, a march for the beer,
then warm strings for the walk out.
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
STR, SLOW, TREM, PIZZ, CELLO, TIMP, CHOIR, HIT, HORN, BRASS, TBN, TPT, FLUTE, CELESTA, GLOCK, SNARE, CLAR = 48, 49, 44, 45, 42, 47, 52, 55, 60, 61, 57, 56, 73, 8, 9, 116, 71
def n(t, prog, key, vel, dur, gain=1.0):
    if t < 0 or t > T_END: return
    a = F.note(prog, key, int(min(127, vel)), dur) * gain
    s = int(t * SR); e = min(len(out), s + len(a)); out[s:e] += a[: e - s]
def env(t, a, b, fade=0.3): return float(np.clip(min((t - a) / fade + 1, (b - t) / fade + 1), 0, 1))
Cm = [48, 51, 55]; Ab = [44, 48, 51]; G = [43, 47, 50]; Fm = [41, 44, 48]; C = [48, 52, 55]; F_ = [41, 45, 48]; Bb = [46, 50, 53]; Eb = [39, 43, 46]

Dm = [50, 53, 57]; Bbm = [46, 50, 53]; A = [45, 49, 52]; Gm = [43, 46, 50]; D = [50, 54, 57]; Gmaj = [43, 47, 50]
# ---- hook: timpani and tremolo, a brass stab on "beer"
n(0.05, TIMP, 38, 115, 1.0); n(0.05, HIT, 50, 105, 0.8, 0.6)
for k in [38, 45, 50]: n(0.25, TREM, k, 80, WT(0, 'beer') - 0.25, 0.4)
n(WT(0, 'life'), CELESTA, 81, 85, 0.6, 0.4)
for k in [50, 54, 57, 62]: n(WT(0, 'beer'), BRASS, k, 115, 0.9, 0.6)
n(WT(0, 'beer'), TIMP, 38, 120, 0.8); n(WT(0, 'beer'), GLOCK, 86, 100, 0.6, 0.4)

# ---- cue 1: the party: bouncy pizz + clarinet + glock in D major, souring on "laced"
a1, b1 = B[1]['start'] - 0.05, WT(1, 'laced') - 0.05
beat = 60 / 128; t = a1; i = 0; prog = [D, Gmaj, A, D]
while t < b1:
    g = env(t, a1, b1, 0.1); ch = prog[(i // 4) % 4]
    n(t, PIZZ, ch[0] - 12, 105, beat * 0.4, 0.8 * g); n(t + beat / 2, PIZZ, ch[2], 85, beat * 0.3, 0.5 * g)
    if i % 2 == 0: n(t, CLAR, ch[1] + 12, 80, beat * 0.9, 0.35 * g)
    if i % 4 == 3: n(t, GLOCK, ch[2] + 24, 70, 0.2, 0.25 * g)
    t += beat; i += 1
tl_ = WT(1, 'laced'); n(tl_, HIT, 49, 115, 0.8, 0.7); n(tl_, TIMP, 37, 120, 0.8)
for k in [49, 52, 55]: n(tl_, TREM, k, 80, B[2]['start'] - tl_, 0.4)

# ---- cue 2: the liver: a ticking low-string pulse in D minor, tightening to a stinger on "kill"
a2, b2 = B[2]['start'] - 0.05, WT(2, 'kill')
beat = 60 / 120; t = a2; i = 0; prog = [Dm, Dm, Bbm, A]
while t < b2:
    g = env(t, a2, b2, 0.1); ch = prog[(i // 4) % 4]; grow = 0.6 + 0.4 * (t - a2) / (b2 - a2)
    n(t, PIZZ, ch[0] - 12, 100, beat * 0.4, 0.8 * g * grow); n(t + beat / 2, PIZZ, ch[0] - 12, 80, beat * 0.3, 0.45 * g)
    if i % 4 == 0: n(t, CELLO, ch[0] - 12, 90, beat * 4, 0.5 * g)
    if i % 2 == 1: n(t, GLOCK, 81 if i % 4 == 1 else 77, 60, 0.2, 0.15 * g)
    t += beat; i += 1
n(WT(2, 'formic'), SLOW, 61, 90, b2 - WT(2, 'formic'), 0.4); n(WT(2, 'blind'), HIT, 50, 110, 0.6, 0.6)
tk = WT(2, 'kill'); n(tk, HIT, 38, 127, 1.0, 1.0); n(tk, TIMP, 38, 127, 1.0, 1.0); n(tk, BRASS, 39, 120, 0.8, 0.6)
n(tk + 0.3, TREM, 86, 70, B[3]['start'] - tk, 0.22)

# ---- cue 3: the trick: sneaky staccato pizz, a celesta wink on "busy" and "waits"
a3, b3 = B[3]['start'] - 0.05, B[4]['start'] - 0.05
beat = 60 / 140; t = a3; i = 0; line = [50, 53, 57, 53, 52, 55, 58, 55]
while t < b3:
    g = env(t, a3, b3, 0.1); n(t, PIZZ, line[i % 8], 95, beat * 0.3, 0.6 * g)
    if i % 4 == 0: n(t, CELLO, 38, 80, beat * 2, 0.35 * g)
    t += beat; i += 1
n(WT(3, 'busy'), CELESTA, 86, 90, 0.5, 0.4); n(WT(3, 'waits'), CELESTA, 81, 90, 0.8, 0.4); n(WT(3, 'waits') + 0.2, CELESTA, 74, 80, 0.8, 0.35)

# ---- cue 4: "Get me beer": a march with snare and brass that builds through the fifteen cans
a4, b4 = B[4]['start'] - 0.05, B[5]['start'] - 0.05
beat = 60 / 132; t = a4; i = 0; prog = [D, Gmaj, D, A]
while t < b4:
    g = env(t, a4, b4, 0.1); ch = prog[(i // 4) % 4]; grow = 0.5 + 0.5 * (t - a4) / (b4 - a4)
    n(t, PIZZ, ch[0] - 12, 105, beat * 0.4, 0.8 * g); n(t, STR, ch[1] + 12, 80, beat * 0.95, 0.3 * g * grow)
    if i % 2 == 0: n(t, SNARE, 38, 80 + 30 * grow, 0.2, 0.4 * g * grow)
    if i % 4 == 3: n(t, TPT, ch[2] + 12, 95, beat * 0.8, 0.4 * g * grow)
    t += beat; i += 1
for k in [50, 57, 62, 66]: n(WT(4, 'Fifteen'), BRASS, k, 118, 1.0, 0.55)
n(WT(4, 'Fifteen'), TIMP, 38, 120, 0.8)

# ---- cue 5: payoff: warm strings and horn in G, proud finish
a6 = B[5]['start'] - 0.05; prog = [Gmaj, D, [40, 43, 47], [48, 52, 55], Gmaj, D, Gmaj]; seg = (T_END - 1.4 - a6) / len(prog)
for k, ch in enumerate(prog):
    t = a6 + k * seg
    for key in ch: n(t, STR, key + 12, 80 + k * 3, seg * 1.03, 0.5)
    n(t, CELLO, ch[0] - 12, 88, seg * 1.03, 0.55)
t = a6 + seg * 0.5; theme = [(67, 1), (71, 1), (74, 2), (72, 1), (71, 1), (69, 2), (67, 3)]
for key, d in theme:
    if t > T_END - 1.6: break
    n(t, HORN, key - 12, 92, d * seg / 2 * 0.95, 0.7); t += d * seg / 2
n(WT(5, 'fully'), GLOCK, 86, 95, 0.8, 0.45)
end = T_END - 1.4
for key in [43, 47, 50, 55, 59, 62, 67]: n(end, SLOW, key, 95, 1.4, 0.55)
n(end, TIMP, 43, 115, 1.0, 0.9); n(end, BRASS, 55, 100, 1.3, 0.55)

mix = reverb(out, SR, 2.0, 0.25)[: int(T_END * SR)]; mix /= np.abs(mix).max() + 1e-9
sf.write(f'{here}/music.wav', mix.astype(np.float32), SR); print('music', round(len(mix) / SR, 1), 's')
