"""Score for Darwin's chair (GeneralUser GS soundfont): a playful Victorian galop for the chair race,
harpsichord-and-strings chamber music in the study, a brass fanfare and march at the 1851 Great Exhibition,
and a bright modern reprise of the galop in today's office. Times are VOICE seconds (timeline.json);
mixbed.py inserts the 1 s rewind after the hook.
Usage: python3 score.py EP_DIR  -> EP_DIR/music.wav"""
import sys, os, json, numpy as np, soundfile as sf
REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')); sys.path.insert(0, f'{REPO}/pipeline')
from sf2 import SoundFont, reverb
SR = 24000; EP = sys.argv[1]
tl = json.load(open(f'{EP}/timeline.json')); T = tl['duration'] + 0.8
B = [b['start'] for b in tl['beats']]; words = [(b['i'], w) for b in tl['beats'] for w in b['words']]
def WT(bi, word, n=1):
    c = 0
    for i, w in words:
        if i == bi and w['w'].strip('.,!?:;\'"').lower() == word.lower():
            c += 1
            if c == n: return w['s']
    raise KeyError(word)
F = SoundFont(f'{REPO}/models/GeneralUser-GS.sf2', SR); out = np.zeros(int((T + 4) * SR))
STR, SLOW, PIZZ, TREM, TIMP, BSN, CLAR, FLUTE, OBOE, GLOCK, HIT, BRASS, HORN, TPT, TBN, CELLO, HARP, HPSI, PIANO, XYL, TUBA, SNARE = \
    48, 49, 45, 44, 47, 70, 71, 73, 68, 9, 55, 61, 60, 56, 57, 42, 46, 6, 0, 13, 58, 115
def n(t, prog, key, vel, dur, gain=1.0):
    if t < 0 or t > T: return
    a = F.note(prog, key, int(min(127, max(1, vel))), dur) * gain; s = int(t * SR); e = min(len(out), s + len(a)); out[s:e] += a[:e - s]
def chord(t, prog, keys, vel, dur, gain=1.0):
    for k in keys: n(t, prog, k, vel, dur, gain)

# the galop: a cheeky racing tune (G major), used for the hook and reprised at the end
GAL = [67, 71, 74, 79, 78, 74, 76, 72, 71, 74, 72, 69, 67, 71, 69, 66]
GCH = [[43, 47, 50], [43, 47, 50], [48, 52, 55], [50, 54, 57]]
def galop(t0, t1, gain=1.0, lead=CLAR, bright=False):
    b = 60 / 168; t = t0; i = 0
    while t < t1 - 0.05:
        ch = GCH[(i // 4) % 4]
        n(t, PIZZ, ch[0] - 12 if i % 2 == 0 else ch[1], 105, b * 0.5, 0.75 * gain)       # oom-pah
        if i % 2: n(t, PIZZ, ch[2] + 12, 90, b * 0.4, 0.45 * gain)
        n(t, lead, GAL[i % 16] + (12 if bright else 0), 100, b * 0.9, 0.5 * gain)
        if bright and i % 2 == 0: n(t, XYL, GAL[i % 16] + 12, 90, 0.2, 0.35 * gain)
        if i % 4 == 0: n(t, TIMP, ch[0], 85, 0.3, 0.35 * gain)
        t += b; i += 1

# ---- HOOK (0..B1): the race. Galop, brass hit on "evolution" and a stinger on "chair"
galop(0.0, B[1] - 0.15)
x = WT(0, 'evolution'); chord(x, BRASS, [55, 59, 62], 110, 0.5, 0.45)
x = WT(0, 'chair'); chord(x, BRASS, [43, 50, 55, 59, 62], 120, 0.9, 0.6); n(x, HIT, 55, 115, 0.8, 0.6); n(x, TIMP, 43, 125, 0.8, 0.8)
for k in range(8): n(x + 0.35 + k * 0.06, STR, 67 + k * 2, 80 + k * 4, 0.12, 0.45)   # swirl into the rewind

# ---- KENT, 1842 (B1..B3): chamber music, harpsichord arpeggios under soft strings (D major)
b = 60 / 104; t = B[1]; i = 0; prog = [[50, 54, 57], [55, 59, 62], [57, 61, 64], [50, 54, 57]]
while t < B[3] - 0.05:
    ch = prog[(i // 8) % 4]
    n(t, HPSI, ch[i % 3] + 12 + (12 if i % 4 == 3 else 0), 85, b * 0.6, 0.45)
    if i % 8 == 0: chord(t, SLOW, [c + 12 for c in ch], 70, b * 8, 0.28); n(t, CELLO, ch[0] - 12, 80, b * 8, 0.35)
    t += b / 2; i += 1
n(B[1], HARP, 74, 90, 1.2, 0.4)
for k, key in enumerate([86, 90, 93, 98]): n(WT(2, 'Beetles') + k * 0.05, GLOCK, key, 95, 0.6, 0.4)
n(WT(2, 'Pickled'), BSN, 43, 105, 0.5, 0.6); n(WT(2, 'Pickled') + 0.35, BSN, 42, 100, 0.6, 0.55)   # squelchy
x = WT(2, 'eight'); chord(x, BRASS, [50, 57, 62, 66], 105, 0.6, 0.45); n(x, TIMP, 38, 115, 0.6, 0.6)

# ---- UP. DOWN. UP. (B3..B4): bassoon up-and-down motif that gets wearier
b = 60 / 120; t = B[3]; i = 0
while t < B[4] - 0.1:
    up = (i // 2) % 2 == 0
    n(t, BSN, (50 if up else 57) + (7 if up else -7) * (i % 2), 100, b * 0.8, 0.6)
    n(t, PIZZ, [38, 45][i % 2], 95, b * 0.4, 0.5)
    t += b; i += 1
x = WT(3, 'Again'); chord(x, TBN, [41, 47], 90, 0.6, 0.4); n(WT(3, 'again', 2), TBN, 40, 85, 0.9, 0.4)   # sigh

# ---- WHEELS (B4..B5): harp gliss on "wheels", the galop arrives (Darwin scoots), stinger on "Splendid!"
x = WT(4, 'wheels')
for k in range(12): n(x - 0.3 + k * 0.03, HARP, 62 + k * 2, 100, 0.4, 0.45)
n(x + 0.1, GLOCK, 91, 110, 0.6, 0.5)
galop(WT(4, 'scooted') - 0.1, WT(4, 'Splendid') - 0.05, 0.9, lead=FLUTE)
x = WT(4, 'Splendid'); chord(x, BRASS, [55, 59, 62, 67], 115, 0.8, 0.55); n(x, HIT, 55, 105, 0.6, 0.4)

# ---- REAL OR MYTH? (B5..B6): sneaky pizzicato question; it stops dead on "Not"
b = 60 / 132; t = B[5]; i = 0; nt = WT(5, 'Not')
while t < nt - 0.1:
    n(t, PIZZ, [45, 48, 52, 51][i % 4], 95, b * 0.4, 0.6); t += b; i += 1
n(nt, BSN, 40, 110, 0.4, 0.7); n(nt + 0.3, BSN, 39, 105, 0.6, 0.7)          # wah-wah
b = 60 / 104; t = WT(5, 'Furniture') - 0.1; i = 0
while t < B[6] - 0.3:
    n(t, HPSI, [62, 66, 69, 66][i % 4] + 12, 80, b * 0.5, 0.35); t += b / 2; i += 1

# ---- LONDON, 1851 (B6..B8): fanfare, then a grand march; a step up the scale for each trick
x = B[6]
for k, (key, d) in enumerate([(60, 0.18), (60, 0.18), (60, 0.18), (67, 0.7)]):
    n(x + [0, 0.18, 0.36, 0.54][k], TPT, key, 115, d, 0.6); n(x + [0, 0.18, 0.36, 0.54][k], TPT, key - 5, 105, d, 0.4)
n(x + 0.54, TIMP, 36, 125, 0.8, 0.8); chord(x + 0.54, BRASS, [48, 55, 60, 64], 115, 1.2, 0.5)
b = 60 / 112; t = x + 1.3; i = 0; mprog = [[48, 52, 55], [53, 57, 60], [55, 59, 62], [48, 52, 55]]
end = WT(7, 'Critics') - 0.05
while t < end:
    ch = mprog[(i // 4) % 4]
    n(t, TUBA, ch[0] - 12 if i % 2 == 0 else ch[0] - 5, 100, b * 0.5, 0.5)
    if i % 2: chord(t, HORN, [ch[1], ch[2]], 85, b * 0.4, 0.3)
    n(t, SNARE, 60, 80 if i % 2 else 95, 0.1, 0.25)
    if i % 2 == 0: n(t, STR, [72, 76, 79, 77, 76, 74, 72, 71][(i // 2) % 8], 95, b * 1.8, 0.35)
    t += b; i += 1
for k, w in enumerate(['swivelled', 'tilted', 'bounced', 'rolled']):
    x = WT(6, w); n(x, XYL, [72, 76, 79, 84][k], 115, 0.4, 0.6); n(x, GLOCK, [84, 88, 91, 96][k], 100, 0.6, 0.4)
x = WT(6, 'springs'); [n(x + k * 0.07, BSN, 48 + (k % 2) * 7, 100, 0.12, 0.5) for k in range(5)]   # boing-boing

# ---- TOO COMFORTABLE (B7..B8): snooty oboe, then a sleepy descending bassoon on "asleep"
x = WT(7, 'Critics'); n(x, HIT, 50, 100, 0.5, 0.4); chord(x, SLOW, [50, 53, 57], 75, B[8] - x, 0.3)
for k, key in enumerate([74, 77, 76, 72]): n(WT(7, 'too') + k * 0.32, OBOE, key, 95, 0.35, 0.45)
x = WT(7, 'asleep')
for k, key in enumerate([55, 52, 48, 43]): n(x + k * 0.22, BSN, key, 95, 0.4, 0.55)

# ---- TODAY (B8..): bright modern reprise of the galop (piano + xylophone), big finish on "first"
x = B[8]; n(x, HIT, 55, 110, 0.6, 0.5); chord(x, BRASS, [55, 59, 62, 67], 110, 0.8, 0.45)
b = 60 / 168; t = x + 0.4; i = 0
while t < WT(9, 'remember') - 0.1:
    ch = GCH[(i // 4) % 4]
    n(t, PIANO, ch[0] if i % 2 == 0 else ch[1] + 12, 95, b * 0.5, 0.45); n(t, PIANO, ch[2] + 12, 80, b * 0.4, 0.3)
    t += b; i += 1
galop(WT(9, 'remember') - 0.1, WT(9, 'first') + 0.2, 1.0, lead=TPT, bright=True)
x = WT(9, 'first'); chord(x, BRASS, [43, 50, 55, 59, 62, 67], 120, 1.6, 0.65); n(x, TIMP, 43, 127, 1.4, 0.9); n(x, HIT, 55, 120, 0.9, 0.6)
for k, key in enumerate([79, 83, 86, 91]): n(x + 0.05 * k, GLOCK, key, 110, 1.0, 0.45)
chord(x + 0.4, SLOW, [55, 59, 62, 67], 85, T - x - 0.4, 0.3)
chord(T - 1.2, STR, [43, 55, 62, 67, 71], 100, 1.3, 0.45); n(T - 1.2, TIMP, 43, 115, 1.2, 0.6)

mix = reverb(out, SR, 1.6, 0.2)[: int(T * SR)]; mix /= np.abs(mix).max() + 1e-9
sf.write(f'{EP}/music.wav', mix.astype(np.float32), SR); print('music', round(T, 1), 's')
