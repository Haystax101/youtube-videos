"""Score for the phone hackers (GeneralUser GS soundfont): a phone-heist thriller, one cue per scene.
Hook: tense string ostinato, timpani, brass. Manila: marimba ostinato, then a night celesta for sleeping America.
Back door + notebooks: the sneaky heist groove with vibes pings. Italy: accordion and mandolin over pizzicato, a swell
for the totals. Victims: rising tremolo and timpani. Raids: taiko builds and hits. Round two: darker groove.
The lesson: bright groove and a final hit. Times are VOICE seconds; mix.py inserts the 1 s rewind after the hook.
Usage: python3 score.py EP_DIR  -> EP_DIR/music.wav"""
import sys, os, re, json, numpy as np, soundfile as sf
REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')); sys.path.insert(0, f'{REPO}/pipeline')
from sf2 import SoundFont, reverb
SR = 24000; EP = sys.argv[1]
tl = json.load(open(f'{EP}/timeline.json')); T = tl['duration'] + 0.8
B = [b['start'] for b in tl['beats']] + [T]; words = [(i, w) for i, b in enumerate(tl['beats']) for w in b['words']]
def WT(bi, word, n=1):
    c = 0
    for i, w in words:
        if i == bi and re.sub(r"[^A-Za-z0-9'_]", '', w['w']).lower() == word.lower():
            c += 1
            if c == n: return w['s']
    raise KeyError(word)
F = SoundFont(f'{REPO}/models/GeneralUser-GS.sf2', SR); out = np.zeros(int((T + 4) * SR))
STR, SLOW, PIZZ, TREM, TIMP, CELESTA, GLOCK, VIBES, HIT, BRASS, HORN, TPT, MUTE, TBN, CELLO, PIANO, RHODES, ABASS, CBASS, TAIKO, SAX = \
    48, 49, 45, 44, 47, 8, 9, 11, 55, 61, 60, 56, 59, 57, 42, 0, 4, 32, 43, 116, 66
KICK, SNARE, BRUSH, RIDE, CRASH, CLAP, SHAKE = 36, 38, 40, 51, 49, 39, 70
def n(t, prog, key, vel, dur, gain=1.0, bank=0):
    if t < 0 or t > T: return
    a = F.note(prog, key, int(min(127, max(1, vel))), dur, bank=bank) * gain; s = int(t * SR); e = min(len(out), s + len(a)); out[s:e] += a[:e - s]
def d(t, key, vel, g=0.3): n(t, 0, key, vel, 0.6, g, bank=128)
def chord(t, prog, keys, vel, dur, gain=1.0):
    for k in keys: n(t, prog, k, vel, dur, gain)
def hit(t, root=38, g=1.0):  # orchestral stab: brass + timpani + low strings
    chord(t, BRASS, [root + 12, root + 15, root + 19], 118, 0.7, 0.5 * g); n(t, TIMP, root, 125, 1.0, 0.9 * g); n(t, CBASS, root, 115, 0.8, 0.6 * g); n(t, HIT, root + 12, 110, 0.6, 0.3 * g)
def riser(t0, t1, root=50, g=0.4):
    for k, key in enumerate([root, root + 3, root + 7, root + 12]): n(t0, TREM, key, 60 + k * 10, t1 - t0, g)
def arp(t, keys, step=0.07, prog=GLOCK, vel=105, g=0.3):
    for k, key in enumerate(keys): n(t + k * step, prog, key, vel, 0.6, g)
# chord = (root, [intervals]) ; walking bass picks chord tones + a chromatic approach into the next bar
def groove(t0, t1, bpm, prog, g=1.0, ride=True, snare=True, keys=True, swing=0.62, bassg=0.55, keyg=0.22, kick=False):
    b = 60 / bpm; bar = 4 * b; t = t0; i = 0; g *= 1.5
    while t < t1 - 0.05:
        root, iv = prog[i % len(prog)]; nroot = prog[(i + 1) % len(prog)][0]
        walk = [root, root + iv[1], root + iv[2], nroot + (1 if (i % 2) else -1)]
        for q in range(4):
            tq = t + q * b
            if tq >= t1 - 0.05: break
            n(tq, ABASS, walk[q] - 12 if walk[q] > 45 else walk[q], 100 if q == 0 else 88, b * 0.95, bassg * g)
            if ride: d(tq, RIDE, 70 + (12 if q % 2 else 0), 0.16 * g); (q % 2 and ride) and d(tq + b * swing, RIDE, 55, 0.12 * g)
            if snare and q % 2: d(tq, BRUSH, 70, 0.22 * g)
            if kick and q % 2 == 0: d(tq, KICK, 95, 0.35 * g)
            if keys and q in (1, 3): chord(tq + b * swing, RHODES, [root + 12 + x for x in iv], 72, b * 0.4, keyg * g)
        t += bar; i += 1
Dm = [(38, [0, 3, 7, 10]), (43, [0, 4, 7, 10]), (40, [0, 3, 6, 10]), (45, [0, 4, 7, 10])]  # Dm7 G7 Em7b5 A7
Dm2 = [(38, [0, 3, 7, 10]), (38, [0, 3, 7, 10]), (46, [0, 4, 7, 10]), (45, [0, 4, 7, 10])]
Fmaj = [(41, [0, 4, 7, 11]), (38, [0, 3, 7, 10]), (43, [0, 3, 7, 10]), (36, [0, 4, 7, 10])]  # Fmaj7 Dm7 Gm7 C7

MARIMBA, ACCORD, MANDO, FLUTE = 12, 21, 25, 73
def ostinato(t0, t1, bpm, keys, prog=STR, vel=88, g=0.3):
    t = t0; i = 0
    while t < t1 - 0.05: n(t, prog, keys[i % len(keys)], vel + (10 if i % 4 == 0 else 0), 60 / bpm / 4 * 0.9, g); t += 60 / bpm / 4; i += 1
def taiko_build(t0, t1, bpm=140, g=0.38):
    b = 60 / bpm; t = t0; k = 0
    while t < t1 - 0.05: n(t, TAIKO, 45, 90 + min(30, k * 3), 0.3, g); t += b / 2; k += 1

# ---- HOOK (0..B1): tense ostinato, timpani on "computer" and "telephone", brass on the $55M, riser into the rewind
ostinato(0.0, B[1] - 0.1, 132, [50, 53, 57, 53, 50, 53, 58, 53], STR, 85, 0.16)
n(0.0, CBASS, 38, 100, B[1], 0.28); chord(0.0, TREM, [62, 65, 69], 65, B[1] - 0.1, 0.12)
hit(WT(0, 'computer'), 38, 0.6); n(WT(0, 'telephone'), TIMP, 38, 120, 1.0, 0.7); arp(WT(0, 'telephone'), [74, 77, 81], 0.08, GLOCK, 100, 0.25)
x = WT(0, 'fiftyfive'); hit(x, 41, 0.7); d(x, CRASH, 100, 0.2); chord(x, BRASS, [53, 57, 60, 65], 105, 1.4, 0.28)
riser(WT(0, 'phone'), B[1] - 0.05, 50, 0.25)

# ---- MANILA, 2005 (B1..B2): marimba ostinato in A minor; night celesta for sleeping America; pizz pulse for dialling
x1 = WT(1, 'While') - 0.05
b = 60 / 104; t = B[1]; i = 0; pat = [69, 72, 76, 72, 69, 74, 77, 74]
while t < x1:
    n(t, MARIMBA, pat[i % 8] - (5 if (i // 8) % 2 else 0), 96, b * 0.5, 0.4)
    if i % 2 == 0: d(t, SHAKE, 60, 0.12)
    if i % 8 == 0: n(t, PIZZ, [45, 41][(i // 8) % 2], 100, b, 0.4)
    t += b / 2; i += 1
for key, dt, du in [(76, 0.0, 0.5), (79, 0.5, 0.5), (81, 1.0, 1.0)]: n(WT(1, 'Kwan') + dt, FLUTE, key, 85, du, 0.25)
chord(x1, SLOW, [57, 60, 64], 60, WT(1, 'dials') - x1, 0.25)
for k, key in enumerate([88, 84, 81, 76]): n(x1 + k * 0.3, CELESTA, key, 90, 0.8, 0.25)
t = WT(1, 'dials'); i = 0
while t < B[2] - 0.1:
    n(t, PIZZ, [57, 60, 64, 60][i % 4], 92, 0.2, 0.35)
    if i % 4 == 0: n(t, PIZZ, 45, 100, 0.5, 0.4)
    t += 60 / 130 / 2; i += 1

# ---- THE BACK DOOR + NOTEBOOKS (B2..B4): the heist groove, vibes on each step, a hit on "factory default"
groove(B[2], WT(2, 'factory') - 0.1, 112, Dm, g=0.95, kick=True)
for w, key in [('Staff', 74), ('punch', 77), ('call', 81)]: n(WT(2, w), VIBES, key, 110, 0.8, 0.4)
chord(WT(2, "company's"), MUTE, [62, 65, 69], 95, 0.5, 0.3)
x = WT(2, 'factory'); hit(x, 38, 1.0); chord(x, TREM, [50, 53, 56], 90, B[3] - x, 0.3)
groove(B[3], B[4] - 0.1, 118, Dm2, g=1.0, kick=True)
arp(WT(3, 'cracked'), [74, 77, 81, 86], 0.06, GLOCK, 110, 0.3)
for w in ['wrote', 'number', 'code']: n(WT(3, w), VIBES, 81, 100, 0.5, 0.3)
x = WT(3, 'hundred'); chord(x, BRASS, [50, 53, 57, 62], 110, 0.8, 0.4); arp(x, [86, 89, 93], 0.05, GLOCK, 110, 0.3)

# ---- BRESCIA (B4..B5): accordion + mandolin over pizzicato (6/8), then a swell for the totals
x1 = WT(4, 'Those') - 0.05; b = 60 / 150; t = B[4]; i = 0
while t < x1:
    q = i % 6; root = [43, 43, 38, 38][(i // 6) % 4]
    if q in (0, 3): n(t, PIZZ, root, 100, b, 0.42)
    else: chord(t, ACCORD, [root + 24, root + 27 + (1 if root == 38 else 0), root + 31], 80, b * 0.6, 0.18)
    n(t, MANDO, [67, 70, 74, 72, 70, 67, 62, 65, 69, 67, 65, 62][i % 12] + (0 if root == 43 else -5), 88, b * 0.8, 0.22)
    t += b; i += 1
chord(x1, TREM, [43, 50, 55, 58], 75, WT(4, 'Twelve') - x1, 0.3); riser(x1, WT(4, 'Twelve'), 43, 0.3)
x = WT(4, 'Twelve'); hit(x, 43, 0.9); chord(x, STR, [43, 55, 58, 62], 100, WT(4, 'More') - x, 0.3)
x = WT(4, 'More'); chord(x, BRASS, [46, 50, 53, 58], 115, 1.5, 0.45); n(x, TIMP, 46, 120, 1.0, 0.6); d(x, CRASH, 100, 0.25)

# ---- 2,500 VICTIMS (B5..B6): rising tremolo, timpani + horn for each region, a low hit on the bill
chord(B[5], TREM, [38, 50, 53], 80, B[6] - B[5], 0.3)
for k, w in enumerate(['America', 'Canada', 'Australia', 'Europe']): n(WT(5, w), TIMP, 38 + k * 2, 110, 0.8, 0.5); n(WT(5, w), HORN, 62 + k * 3, 100, 0.6, 0.3)
x = WT(5, 'bill'); hit(x, 34, 1.0); chord(x, CELLO, [34, 41], 90, B[6] - x, 0.35)

# ---- THE RAID, 2007 (B6..B7): taiko build to "raided", strings and a steady taiko while the notebooks go
chord(B[6], TREM, [38, 45, 50, 53], 85, WT(6, 'raided') - B[6], 0.32); taiko_build(B[6] + 0.3, WT(6, 'raided') - 0.05)
x = WT(6, 'raided'); hit(x, 38, 1.2); d(x, CRASH, 115, 0.3); chord(x + 0.3, STR, [38, 50, 53, 57], 100, B[7] - x - 0.3, 0.3)
t = x + 0.4
while t < WT(6, 'Kwan') - 0.1: n(t, TAIKO, 45, 95, 0.3, 0.3); t += 60 / 140
hit(WT(6, 'arrested'), 34, 0.9)

# ---- CHARGED (B7..B8): low brass + timpani, the Italian raids (accordion stab, taiko), a hit on "arresting"
x = B[7]; chord(x, TBN, [38, 45], 95, 2.2, 0.4); n(x, TIMP, 38, 115, 1.0, 0.5); chord(x, SLOW, [50, 53, 57], 65, WT(7, 'Italian') - x, 0.25)
hit(WT(7, 'indicted'), 38, 0.9)
x = WT(7, 'Italian'); chord(x, ACCORD, [55, 58, 62], 100, 0.5, 0.3); taiko_build(x, WT(7, 'arresting') - 0.05, 150, 0.35); chord(x, TREM, [43, 50, 55], 85, WT(7, 'arresting') - x, 0.3)
x = WT(7, 'arresting'); hit(x, 43, 1.0); d(x, CRASH, 105, 0.25); chord(x + 0.3, CELLO, [43, 50], 85, B[8] - x - 0.3, 0.3)

# ---- ROUND TWO (B8..B9): darker groove, brass on premium, glockenspiel coins on the money, a hit on AT&T
groove(B[8], WT(8, 'ATT') - 0.1, 120, Dm2, g=0.95, kick=True)
chord(WT(8, 'premium'), BRASS, [50, 53, 56], 110, 0.8, 0.4)
arp(WT(8, 'money'), [86, 89, 93, 98], 0.06, GLOCK, 110, 0.3)
x = WT(8, 'ATT'); hit(x, 38, 1.0); chord(x, TREM, [38, 50, 53, 56], 90, B[9] - x, 0.3)

# ---- MANILA, 2011 (B9..B10): taiko build to the FBI, a hit on "arrested", a sombre drone under the Mumbai line
chord(B[9], TREM, [38, 45, 50], 80, WT(9, 'FBI') - B[9], 0.3); taiko_build(B[9] + 0.3, WT(9, 'FBI') - 0.05, 150)
x = WT(9, 'FBI'); hit(x, 38, 1.1); d(x, CRASH, 110, 0.28)
x = WT(9, 'arrested'); hit(x, 34, 0.9); chord(x + 0.3, STR, [38, 50, 53], 90, WT(9, 'Police') - x - 0.3, 0.28)
x = WT(9, 'Police'); chord(x, CELLO, [34, 41], 80, B[10] - x, 0.35); chord(x, SLOW, [58, 62, 65], 60, B[10] - x, 0.2); n(WT(9, 'Mumbai'), TIMP, 34, 110, 1.2, 0.5)

# ---- THE LESSON (B10..): bright groove, vibes for each device, brass on "change", riser into the follow line, final hit
groove(B[10] + 0.05, WT(10, 'Follow') - 0.3, 124, Fmaj, g=0.9, kick=True)
for w, key in [('router', 77), ('voicemail', 81), ('camera', 84)]: n(WT(10, w), VIBES, key, 110, 0.8, 0.35)
chord(WT(10, 'change'), BRASS, [53, 57, 60], 105, 0.7, 0.35)
x = WT(10, 'Follow'); riser(x - 0.5, x + 0.1, 53, 0.3); chord(x, BRASS, [53, 57, 60, 65], 112, 1.2, 0.4); d(x, CRASH, 100, 0.25)
groove(x + 0.6, T - 0.6, 124, Fmaj, g=0.7, kick=True)
x = WT(10, 'heists'); hit(x, 41, 0.9); chord(x, TREM, [41, 53, 57, 60], 95, T - x, 0.3)

mix = reverb(out, SR, 1.6, 0.2)[: int(T * SR)]; mix /= np.abs(mix).max() + 1e-9
sf.write(f'{EP}/music.wav', mix.astype(np.float32), SR); print('music', round(T, 1), 's')
