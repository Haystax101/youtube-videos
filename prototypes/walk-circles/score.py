"""Light comic orchestral bed for the walk-in-circles opening (pizzicato, bassoon, clarinet, glockenspiel)
with stings on the story turns. Times are voice seconds (no rewind/gaps in this one).
Usage: python3 score.py EP_DIR  -> EP_DIR/music.wav"""
import sys, os, json, numpy as np, soundfile as sf
REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')); sys.path.insert(0, f'{REPO}/pipeline')
from sf2 import SoundFont, reverb
SR = 24000; here = sys.argv[1]
tl = json.load(open(f'{here}/timeline.json')); T = tl['duration'] + 0.6
words = [w for b in tl['beats'] for w in b['words']]
def WT(word, n=1):
    c = 0
    for w in words:
        if w['w'].strip('.,!?') == word:
            c += 1
            if c == n: return w['s']
F = SoundFont(f'{REPO}/models/GeneralUser-GS.sf2', SR); out = np.zeros(int((T + 3) * SR))
STR, SLOW, PIZZ, TIMP, BSN, CLAR, FLUTE, GLOCK, HIT, BRASS, HORN, TREM = 48, 49, 45, 47, 70, 71, 73, 9, 55, 61, 60, 44
def n(t, prog, key, vel, dur, gain=1.0):
    if t < 0: return
    a = F.note(prog, key, int(min(127, vel)), dur) * gain; s = int(t * SR); e = min(len(out), s + len(a)); out[s:e] += a[:e - s]
BPM = 120; b = 60 / BPM
CH = {'F': [41, 45, 48], 'C': [36, 40, 43], 'Dm': [38, 41, 45], 'Bb': [34, 38, 41], 'G': [43, 47, 50]}
prog = ['F', 'F', 'C', 'C', 'Dm', 'Bb', 'C', 'C']
tune = [72, 74, 76, 72, 77, 76, 74, 72, 70, 72, 74, 70, 72, 70, 69, 67]
stop = WT("It's")            # the music stops dead for the realisation
t, i = 0.0, 0
while t < stop - 0.05:
    ch = CH[prog[(i // 8) % 8]]
    n(t, PIZZ, ch[0] if i % 2 == 0 else ch[2], 96, b * 0.5, 0.85)            # bouncy bass
    if i % 2 == 1: n(t, PIZZ, ch[1] + 12, 80, b * 0.4, 0.55)
    if i % 4 == 0: n(t, TIMP, ch[0] if ch[0] > 36 else ch[0] + 12, 60, 0.25, 0.35)
    if 8 <= i: n(t, BSN if (i // 16) % 2 == 0 else CLAR, tune[i % 16] - (12 if (i // 16) % 2 == 0 else 0), 88, b * 0.85, 0.6)
    t += b; i += 1
# stings
for k, key in enumerate([84, 88, 91, 96]): n(WT('campfire') + k * 0.07, GLOCK, key, 100, 0.6, 0.6)     # found a campfire!
for key in (65, 69, 72, 77): n(WT("Someone's"), STR, key, 100, 1.2, 0.5)                               # hope swell
for k, key in enumerate([84, 88, 91, 96]): n(WT('campfire', 2) + k * 0.07, GLOCK, key, 92, 0.6, 0.55)  # ...again
n(WT('log'), PIZZ, 48, 110, 0.3, 0.9); n(WT('sausage'), BSN, 43, 105, 0.7, 0.9); n(WT('sausage') + 0.35, BSN, 42, 100, 0.9, 0.9)  # sad trombone-ish bassoon
n(stop, HIT, 50, 115, 0.8, 0.9); n(stop, TIMP, 38, 120, 1.2, 0.9)                                          # dun!
for key in (38, 45, 50, 53): n(stop + 0.2, TREM, key, 85, WT('circles') - stop + 0.2, 0.7)                 # dread
for k in range(10): n(WT('circles') - 0.5 + k * 0.05, STR, 62 + k * 2, 90, 0.1, 0.6)                       # whoosh up for the reveal
for key in (50, 57, 62, 65, 69): n(WT('circles'), BRASS if key < 60 else STR, key, 110, 1.2, 0.7)
n(WT('circles'), TIMP, 38, 120, 1.0, 0.9)
for key in (62, 65, 69, 74): n(WT('scientists'), SLOW, key, 80, T - WT('scientists'), 0.55)                   # mysterious hold
for k, key in enumerate([81, 77, 74, 81, 86]): n(WT('scientists') + 0.1 + k * 0.3, GLOCK, key, 85, 0.5, 0.4)
mix = reverb(out, SR, 1.6, 0.22)[: int(T * SR)]; mix /= np.abs(mix).max() + 1e-9
sf.write(f'{here}/music.wav', mix.astype(np.float32), SR); print('music', round(T, 1), 's')
