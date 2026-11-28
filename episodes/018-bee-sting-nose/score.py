"""Original score for the bee-sting Short (GeneralUser GS samples via pipeline/sf2.py). Music arm: suspense.
Chiptune arm (square lead, saw bass, 8-bit drums) replacing the suspense cues below.
Old note: a sly hook sting, a bright party groove in Vietnam, a ticking low-string pulse
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

SQ, SAW, SBASS, KIT = 80, 81, 38, 0
C = [48, 52, 55]; G = [43, 47, 50]; Am = [45, 48, 52]; Fc = [41, 45, 48]; Dm = [50, 53, 57]
def drums(a, b, bpm, g=1.0, fill=False):
    beat = 60 / bpm; t = a; i = 0
    while t < b:
        n(t, SNARE if i % 2 else TIMP, 38 if i % 2 else 36, 90, 0.12, (0.35 if i % 2 else 0.5) * g); t += beat; i += 1
def groove(a, b, bpm, prog, lead=None, g=1.0):
    beat = 60 / bpm; t = a; i = 0
    while t < b:
        e = env(t, a, b, 0.08); ch = prog[(i // 8) % len(prog)]
        n(t, SBASS, ch[0] - 12, 100, beat * 0.45, 0.55 * e * g)
        n(t + beat / 2, SQ, ch[i % 3] + 12, 70, beat * 0.25, 0.18 * e * g)
        if lead and i % 2 == 0: n(t, SQ, lead[(i // 2) % len(lead)], 95, beat * 0.9, 0.3 * e * g)
        t += beat / 1; i += 1
TUNE = [72, 76, 79, 76, 74, 77, 81, 77, 72, 76, 79, 84, 83, 79, 74, 79]
# hook: a buzzy sting, then a squeal on "purpose"
n(0.05, SAW, 60, 110, 0.5, 0.4); n(0.05, TIMP, 36, 120, 0.6, 0.8)
for k in [60, 64, 67, 72]: n(WT(0, 'purpose'), SQ, k + 12, 110, 0.5, 0.35)
n(WT(0, 'purpose'), TIMP, 36, 120, 0.5, 0.8)
# cue 1: the question and the plan: bouncy groove in C
a1, b1 = B[1]['start'] - 0.05, B[3]['start'] - 0.05
groove(a1, b1, 150, [C, G, Am, Fc], TUNE, 0.9); drums(a1, b1, 150, 0.7)
n(WT(1, 'twenty'), GLOCK, 84, 100, 0.4, 0.4); n(WT(1, 'himself'), SQ, 84, 110, 0.4, 0.35)
for k in range(5): n(WT(2, 'Five') + k * 0.12, GLOCK, 79 + k * 2, 90, 0.15, 0.3)
# cue 2: the easy spots: a jaunty, smug version
a2, b2 = B[3]['start'] - 0.05, B[4]['start'] - 0.05
groove(a2, b2, 150, [Fc, C, G, C], TUNE[::-1], 0.9); drums(a2, b2, 150, 0.6)
n(WT(3, 'Barely'), SQ, 67, 100, 0.3, 0.35); n(WT(3, 'Barely') + 0.3, SQ, 60, 100, 0.5, 0.35)
# cue 3: the face: everything drops out, a creeping minor line, stingers on "Ow" and "nose"
a3, b3 = B[4]['start'] - 0.05, B[5]['start'] - 0.05
t = a3; k = 0
while t < WT(4, 'Ow'):
    n(t, SQ, [57, 58, 57, 58][k % 4] + 12, 85, 0.2, 0.25); n(t, SBASS, 33, 90, 0.2, 0.4); t += 0.22; k += 1
for key in [61, 67, 70]: n(WT(4, 'Ow'), SAW, key + 12, 120, 0.5, 0.35)
n(WT(4, 'Ow'), TIMP, 36, 125, 0.6, 0.9)
t = WT(4, 'And'); k = 0
while t < WT(4, 'nose'):
    n(t, SQ, 69 + k, 90, 0.1, 0.28); t += 0.12; k += 1
for key in [60, 66, 72, 78]: n(WT(4, 'nose'), SAW, key + 12, 125, 0.7, 0.35)
n(WT(4, 'nose'), TIMP, 36, 127, 0.8, 1.0); n(WT(4, 'nose'), HIT, 48, 120, 0.6, 0.6)
# cue 4: payoff: the groove comes back, brighter, to the end
a4 = B[5]['start'] - 0.05; end = T_END - 1.2
groove(a4, end, 160, [C, Fc, G, C], TUNE, 1.0); drums(a4, end, 160, 0.8)
for key in [60, 64, 67, 72, 76]: n(end, SQ, key + 12, 110, 1.0, 0.25)
n(end, TIMP, 36, 115, 0.8, 0.8)

mix = reverb(out, SR, 1.2, 0.15)[: int(T_END * SR)]; mix /= np.abs(mix).max() + 1e-9
sf.write(f'{here}/music.wav', mix.astype(np.float32), SR); print('music', round(len(mix) / SR, 1), 's')
