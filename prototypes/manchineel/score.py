"""Score for the manchineel Short, from GeneralUser GS soundfont samples (pipeline/sf2.py), one cue per scene:
storm cold open (string tremolo, taiko, choir) -> calypso beach (steel drums, marimba, bass, congas) that stops
dead on the turn -> spicy brass stabs for the pepper -> storm ostinato (low strings, taiko, brass on the lightning)
-> Spanish guitar + castanets for 1521 -> comic bassoon/pizzicato for the iguana -> the calypso theme returns at sunset.
All times are VIDEO seconds (voice time + the 0.8 s rewind after the hook), read from cues.json + timeline.json.
Usage: python3 score.py EP_DIR -> EP_DIR/music.wav"""
import sys, os, json, re, numpy as np, soundfile as sf
REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')); sys.path.insert(0, f'{REPO}/pipeline')
from sf2 import SoundFont, reverb
SR = 24000; EP = sys.argv[1]; HERE = os.path.dirname(os.path.abspath(__file__))
tl = json.load(open(f'{EP}/timeline.json')); cues = json.load(open(f'{HERE}/cues.json'))
RW = 0.8; HOOK_END = tl['beats'][1]['start'] - 0.02
WORDS = [dict(w, bi=i) for i, b in enumerate(tl['beats']) for w in b['words']]
clean = lambda s: re.sub(r"[^A-Za-z']", '', s)
def VT(bi, word, n=1):
    c = 0
    for w in WORDS:
        if w['bi'] == bi and clean(w['w']) == word:
            c += 1
            if c == n: return w['s']
    raise KeyError(word)
vid = lambda v: v if v < HOOK_END else v + RW
C = {k: vid(VT(a[0], a[1], a[2]) + a[3]) for k, a in cues.items() if not k.startswith('_')}
T = tl['duration'] + RW + 1.0
F = SoundFont(f'{REPO}/models/GeneralUser-GS.sf2', SR); out = np.zeros(int((T + 4) * SR))
STR, TREM, PIZZ, TIMP, HIT, BRASS, HORN, TPT, CHOIR, BSN, CLAR, GLOCK, MAR, STEEL, BASS, NYLON, CELLO = 48, 44, 45, 47, 55, 61, 60, 56, 52, 70, 71, 9, 12, 114, 33, 24, 42
PEAK = {}
def level(prog, bank):  # instruments in the soundfont differ ~25x in level: normalise each program to a common peak
    if (prog, bank) not in PEAK: PEAK[(prog, bank)] = max(0.05, float(np.abs(F.note(prog, 60 if bank == 0 else 38, 100, 0.6, bank=bank)).max())) / 0.45
    return PEAK[(prog, bank)]
def n(t, prog, key, vel, dur, g=1.0, bank=0):
    if t < 0 or t > T: return
    a = F.note(prog, key, int(min(127, max(1, vel))), dur, bank=bank) * g / (level(prog, bank) if bank == 0 else 1.0); s = int(t * SR); e = min(len(out), s + len(a)); out[s:e] += a[:e - s]
def dr(t, key, vel, g=1.0): n(t, 0, key, vel, 0.4, g, bank=128)
KICK, RIM, SNARE, CONGA_H, CONGA_L, SHAKER, CLAVES, CASTA, TAIKO, CRASH, BONGO = 36, 37, 38, 62, 64, 82, 75, 85, 35, 49, 60

# 1) cold open: storm dread (D minor), taiko pulse, choir swell, hit on "dangerous"
for key in (38, 45, 50, 53): n(0.0, TREM, key, 90, HOOK_END + 0.1, 0.55)
for k in range(int(HOOK_END / 0.5) + 1): dr(k * 0.5, TAIKO, 115 if k % 2 == 0 else 85, 0.9)
for key in (62, 65, 69): n(0.3, CHOIR, key, 85, HOOK_END, 0.45)
d = vid(VT(0, 'dangerous')); n(d, HIT, 50, 120, 1.0, 0.9); n(d, TIMP, 38, 125, 1.2, 0.9); n(d, BRASS, 38, 115, 1.2, 0.7); dr(d, CRASH, 100, 0.6)
u = vid(VT(0, 'under')); n(u, HIT, 46, 115, 0.8, 0.7); n(u, BRASS, 37, 110, 0.9, 0.6)

# 2) calypso beach: steel drums + marimba + bass + congas/shaker, 112 bpm, C major, stops dead on the turn
BPM = 112; b = 60 / BPM; start = C['beach']; stop = C['turn']
CH = {'C': [48, 52, 55], 'F': [41, 45, 48], 'G': [43, 47, 50], 'Am': [45, 48, 52]}
prog = ['C', 'F', 'G', 'C', 'C', 'F', 'G', 'C']
tune = [76, 79, 81, 79, 76, 74, 72, 74, 76, 76, 79, 77, 76, 74, 72, None]
def calypso(t0, t1, vel=1.0, tune_from=0):
    t, i = t0, 0
    while t < t1 - 0.05:
        ch = CH[prog[(i // 4) % 8]]
        if i % 2 == 0: n(t, BASS, ch[0] - 12, 100 * vel, b * 0.9, 0.9)
        else: n(t + b * 0.5, BASS, ch[2] - 12, 90 * vel, b * 0.4, 0.8)
        n(t + b * 0.5, MAR, ch[1] + 12, 70 * vel, b * 0.3, 0.45); n(t + b * 0.5, MAR, ch[2] + 12, 70 * vel, b * 0.3, 0.45)
        dr(t, KICK, 90 * vel, 0.5) if i % 2 == 0 else None
        for h in range(2): dr(t + h * b / 2, SHAKER, 60 + 20 * h, 0.35)
        dr(t + b * 0.75, CONGA_H, 80, 0.45); dr(t + (b * 0.5 if i % 2 else 0), CONGA_L, 85, 0.45)
        if i % 4 in (0, 3): dr(t + b * 0.5 * (i % 2), CLAVES, 80, 0.35)
        m = tune[(i + tune_from) % 16]
        if i >= 2 and m: n(t, STEEL, m, 100 * vel, b * 0.9, 0.7); n(t + b * 0.5, STEEL, m - 3 if (i % 3 == 0) else m, 80 * vel, b * 0.4, 0.45)
        t += b; i += 1
calypso(start, stop)
for k, key in enumerate([84, 88, 91]): n(C['apples'] + 0.15 + k * 0.07, GLOCK, key, 95, 0.5, 0.5)   # sparkle on the apples
n(C['ooh'], STEEL, 84, 110, 0.5, 0.7); n(C['ooh'] + 0.12, STEEL, 88, 110, 0.6, 0.7)
n(C['bite'], PIZZ, 72, 110, 0.2, 0.7)                                                                 # crunch pluck
# the turn: a descending pizzicato "uh-oh", then silence
for k, key in enumerate([67, 64, 60, 55]): n(stop + 0.05 + k * 0.16, PIZZ, key, 105, 0.25, 0.8)
n(stop + 0.7, BSN, 43, 100, 0.9, 0.7)

# 3) pepper -> fire -> throat: spicy brass stabs over timpani, rising tension
p0 = C['pepper']; p1 = C['storm']
n(p0, HIT, 52, 120, 0.8, 0.8); n(p0, TPT, 76, 115, 0.3, 0.7); n(p0, TPT, 79, 115, 0.3, 0.7)
n(C['fire'], HIT, 55, 125, 0.9, 0.9); dr(C['fire'], CRASH, 110, 0.6)
for key in (64, 67, 71, 76): n(C['fire'], BRASS, key, 120, 0.6, 0.6)
t = p0 + 0.3; k = 0
while t < p1 - 0.2: n(t, TIMP, 40 + (k % 2) * 5, 80 + k * 2, 0.3, 0.55); dr(t, TAIKO, 70 + k * 2, 0.4); t += 0.36 - min(0.15, k * 0.006); k += 1
for key in (52, 55, 58, 61): n(C['throat'], TREM, key, 85, p1 - C['throat'], 0.5)               # diminished dread as the throat closes

# 4) storm: low-string ostinato (D minor), taiko, brass on the lightning, choir; ranger hit; lighter for the smoke
s0 = C['storm']; s1 = C['spanish']; bs = 60 / 132
osti = [38, 38, 50, 38, 41, 38, 50, 45]; t, i = s0, 0
while t < s1 - 0.1:
    g = 0.75 if t < C['locals'] else 0.45
    n(t, STR, osti[i % 8], 100, bs * 0.9, 0.55 * g); n(t, CELLO, osti[i % 8] - 12, 95, bs * 0.9, 0.5 * g)
    if i % 4 == 0: dr(t, TAIKO, 120, 0.8 * g); n(t, TIMP, 38, 100, 0.4, 0.5 * g)
    if i % 4 == 2: dr(t, TAIKO, 95, 0.6 * g)
    t += bs; i += 1
for key in (62, 65, 69, 74): n(C['same'], CHOIR, key, 95, C['hey'] - C['same'], 0.5)
for bolt in (C['bolt2'], C['bolt3']):
    for key in (38, 45, 50): n(bolt, BRASS, key, 120, 1.2, 0.6)
n(C['blister'], HIT, 49, 120, 0.8, 0.8)
n(C['hey'], HIT, 50, 125, 0.7, 0.9); dr(C['hey'], CRASH, 115, 0.7)
n(C['band'], TPT, 74, 120, 0.25, 0.6); n(C['band'] + 0.25, TPT, 74, 120, 0.5, 0.6)
for key in (50, 53, 57): n(C['smoke'], HORN, key, 90, C['spanish'] - C['smoke'], 0.4)

# 5) 1521: Spanish guitar (Phrygian, D), castanets; whoosh-up + hit on the arrow
h0 = C['spanish']; h1 = C['iguana']; bg = 60 / 100
gch = [[50, 57, 62, 65], [48, 55, 60, 64], [46, 53, 58, 62], [45, 52, 57, 61]]; t, i = h0, 0
while t < C['arrow'] - 0.05:
    ch = gch[(i // 4) % 4]
    for k, key in enumerate(ch): n(t + k * 0.025, NYLON, key, 95 if i % 2 == 0 else 75, bg * 0.9, 0.55)
    dr(t, CASTA, 95, 0.4); dr(t + bg * 0.5, CASTA, 75, 0.3); dr(t + bg * 0.75, CASTA, 75, 0.3)
    t += bg; i += 1
for key in (62, 65, 69): n(C['deathapple'], CHOIR, key - 12, 90, 1.6, 0.5)
for k in range(10): n(C['arrow'] + k * 0.05, STR, 60 + k * 2, 95, 0.12, 0.5)
n(C['arrow_hit'], HIT, 46, 127, 1.2, 1.0); n(C['arrow_hit'], TIMP, 38, 127, 1.4, 0.9); dr(C['arrow_hit'], CRASH, 120, 0.7)
for key in (38, 41, 45): n(C['arrow_hit'] + 0.1, CELLO, key, 100, h1 - C['arrow_hit'], 0.45)

# 6) the iguana: tiptoe pizzicato + bassoon, glock on "Mmm"
i0 = C['iguana']; i1 = C['doctor']; bi_ = 60 / 120; t, i = i0, 0
tip = [53, 57, 60, 57, 55, 58, 62, 58]
while t < i1 - 0.1:
    n(t, PIZZ, tip[i % 8], 95, 0.25, 0.6)
    if i % 2 == 0: n(t, BSN, tip[i % 8] - 12, 85, bi_ * 0.8, 0.5)
    t += bi_; i += 1
for k, key in enumerate([79, 84, 88]): n(C['mmm'] + k * 0.08, GLOCK, key, 100, 0.5, 0.55)

# 7) payoff at sunset: the calypso theme returns, softer, resolving on a held chord
calypso(i1, T - 1.2, vel=0.85, tune_from=0)
for key in (48, 55, 60, 64, 67): n(T - 1.4, STR, key, 90, 1.6, 0.5)
n(T - 1.4, STEEL, 84, 100, 1.4, 0.6)

mix = reverb(out, SR, 1.6, 0.2)[: int(T * SR)]; mix /= np.abs(mix).max() + 1e-9
sf.write(f'{EP}/music.wav', mix.astype(np.float32), SR); print('music', round(T, 1), 's')
