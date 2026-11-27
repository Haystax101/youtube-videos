"""Original score for the Roosevelt Short (GeneralUser GS samples via pipeline/sf2.py). Music arm: suspense.
A ticking suspense ostinato (pizzicato + low strings) through the street, a hit and silence on the shot,
a slow-motion string swell for the bullet in the pocket, a held breath for the cough, then the ostinato
grows into a brass march for "Bull Moose", a clock-tick for the hour and warm strings for the payoff.
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

# ---- hook: brass stab and timpani on "shot", tremolo under, a proud chord on "speech"
n(0.05, TIMP, 36, 120, 1.0); n(0.05, HIT, 48, 110, 0.8, 0.7)
for k in Cm: n(WT(0, 'shot'), BRASS, k, 112, 0.5, 0.6)
n(WT(0, 'shot'), TIMP, 36, 125, 0.7)
for k in [36, 43, 48]: n(0.3, TREM, k, 85, WT(0, 'This') - 0.3, 0.45)
n(WT(0, 'hospital'), CELESTA, 79, 85, 0.6, 0.4)
for k in [48, 52, 55, 60]: n(WT(0, 'speech'), BRASS, k, 115, 1.0, 0.6)
n(WT(0, 'speech'), TIMP, 36, 120, 0.8); n(WT(0, 'speech'), HIT, 60, 100, 0.6, 0.5)

# ---- cue 1: the street, a ticking suspense ostinato in C minor that tightens toward the shot
a1, b1 = B[1]['start'] - 0.05, WT(1, 'shoots') - 0.05
beat = 60 / 120; t = a1; i = 0; prog = [Cm, Cm, Ab, G]
while t < b1:
    g = env(t, a1, b1, 0.15); ch = prog[(i // 8) % 4]; grow = 0.6 + 0.4 * (t - a1) / (b1 - a1)
    n(t, PIZZ, ch[0] - 12, 100, beat * 0.4, 0.8 * g * grow); n(t + beat / 2, PIZZ, ch[2] - 12, 80, beat * 0.3, 0.45 * g)
    if i % 4 == 0: n(t, CELLO, ch[0] - 12, 90, beat * 4, 0.45 * g)
    if i % 2 == 1: n(t, GLOCK, 84 if i % 4 == 1 else 79, 60, 0.2, 0.18 * g)
    t += beat; i += 1
n(WT(1, 'Teddy'), HORN, 60, 90, 0.9, 0.5); n(WT(1, 'Teddy') + 0.5, HORN, 64, 90, 0.9, 0.5)
n(WT(1, 'man'), SLOW, 61, 90, b1 - WT(1, 'man') + 0.2, 0.45); n(WT(1, 'man'), SLOW, 49, 90, b1 - WT(1, 'man') + 0.2, 0.45)
# the shot: a hit, then nothing but a high string note
ts = WT(1, 'shoots'); n(ts, HIT, 48, 127, 1.0, 1.0); n(ts, TIMP, 36, 127, 1.2, 1.0); n(ts, BRASS, 37, 120, 0.8, 0.6)
n(ts + 0.25, TREM, 84, 70, B[2]['start'] - ts, 0.25)

# ---- cue 2: the bullet in the pocket: slow-motion low swell, a glassy tick on "steel"
a2, b2 = B[2]['start'] - 0.1, B[3]['start'] - 0.05
for k in [36, 43, 48, 51]: n(a2, SLOW, k, 80, b2 - a2, 0.5)
n(a2, CHOIR, 60, 70, b2 - a2, 0.25); n(WT(2, 'fifty'), TIMP, 38, 100, 0.6, 0.6); n(WT(2, 'fifty') + 0.05, CELESTA, 84, 90, 0.5, 0.35)
n(WT(2, 'steel'), GLOCK, 91, 110, 0.6, 0.45); n(WT(2, 'steel'), HIT, 55, 105, 0.6, 0.6)

# ---- cue 3: the cough, a held breath; "missed his lung" resolves to major
a3 = B[3]['start'] - 0.05
for k in [55, 60, 63]: n(a3, TREM, k, 70, WT(3, 'It') - a3, 0.3)
n(WT(3, 'No'), CELESTA, 72, 80, 0.8, 0.4)
for k in [48, 52, 55, 60]: n(WT(3, 'It'), STR, k, 85, B[4]['start'] - WT(3, 'It') + 0.2, 0.4)
n(WT(3, 'lung'), HORN, 67, 95, 0.9, 0.55)

# ---- cue 4: the hall: the ostinato returns in major, snare and brass build to "Bull Moose"
a4, b4 = B[4]['start'] - 0.05, WT(4, 'Bull')
beat = 60 / 132; t = a4; i = 0; prog = [C, F_, C, G]
while t < b4:
    g = env(t, a4, b4, 0.1); ch = prog[(i // 4) % 4]; grow = 0.5 + 0.5 * (t - a4) / (b4 - a4)
    n(t, PIZZ, ch[0] - 12, 105, beat * 0.4, 0.8 * g); n(t, STR, ch[1] + 12, 80, beat * 0.95, 0.3 * g * grow)
    if i % 2 == 0: n(t, SNARE, 38, 80 + 30 * grow, 0.2, 0.4 * g * grow)
    if i % 4 == 3: n(t, TPT, ch[2] + 12, 95, beat * 0.8, 0.4 * g * grow)
    t += beat; i += 1
n(WT(4, 'holds'), BRASS, 55, 105, 0.6, 0.5)
tb = WT(4, 'Bull')
for k in [48, 55, 60, 64, 67]: n(tb, BRASS, k, 122, 1.6, 0.6)
n(tb, TIMP, 36, 127, 1.0, 1.0); n(tb, HIT, 60, 120, 0.8, 0.8); n(tb + 0.4, TIMP, 43, 120, 0.8, 0.8)
for k, key in enumerate([72, 76, 79, 84]): n(tb + 0.1 + k * 0.08, TPT, key, 110, 0.6, 0.45)

# ---- cue 5: the hour: a clock-like tick (pizz + glock) speeding up under held strings
a5, b5 = B[5]['start'] - 0.05, B[6]['start'] - 0.05
t = a5; k = 0
while t < b5:
    n(t, GLOCK, 88 if k % 2 else 84, 85, 0.15, 0.3); n(t, PIZZ, 60, 90, 0.15, 0.4); t += max(0.09, 0.32 - k * 0.025); k += 1
for key in [48, 55, 64]: n(a5, SLOW, key, 85, b5 - a5 + 0.2, 0.45)

# ---- cue 6: payoff: warm strings and horn in F, proud finish
a6 = B[6]['start'] - 0.05; prog = [F_, C, [50, 53, 57], Bb, F_, C, F_]; seg = (T_END - 1.4 - a6) / len(prog)
for k, ch in enumerate(prog):
    t = a6 + k * seg
    for key in ch: n(t, STR, key + 12, 80 + k * 3, seg * 1.03, 0.5)
    n(t, CELLO, ch[0] - 12, 88, seg * 1.03, 0.55)
t = a6 + seg * 0.5; theme = [(65, 1), (69, 1), (72, 2), (70, 1), (69, 1), (67, 2), (65, 3)]
for key, d in theme:
    if t > T_END - 1.6: break
    n(t, HORN, key - 12, 92, d * seg / 2 * 0.95, 0.7); t += d * seg / 2
n(WT(6, 'rest'), GLOCK, 84, 95, 0.8, 0.45)
end = T_END - 1.4
for key in [41, 45, 48, 53, 57, 60, 65]: n(end, SLOW, key, 95, 1.4, 0.55)
n(end, TIMP, 41, 115, 1.0, 0.9); n(end, BRASS, 53, 100, 1.3, 0.55)

mix = reverb(out, SR, 2.0, 0.25)[: int(T_END * SR)]; mix /= np.abs(mix).max() + 1e-9
sf.write(f'{here}/music.wav', mix.astype(np.float32), SR); print('music', round(len(mix) / SR, 1), 's')
