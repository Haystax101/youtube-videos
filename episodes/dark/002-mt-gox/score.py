"""Score for Mt. Gox (GeneralUser GS soundfont): a dark thriller score, one cue per scene.
Times are VOICE seconds (timeline.json); mix.py inserts the 1 s rewind after the hook.
Usage: python3 score.py EP_DIR  -> EP_DIR/music.wav"""
import sys, os, re, json, numpy as np, soundfile as sf
REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')); sys.path.insert(0, f'{REPO}/pipeline')
from sf2 import SoundFont, reverb
SR = 24000; EP = sys.argv[1]
tl = json.load(open(f'{EP}/timeline.json')); T = tl['duration'] + 0.8
B = [b['start'] for b in tl['beats']] + [T]; words = [(b['i'], w) for b in tl['beats'] for w in b['words']]
def WT(bi, word, n=1):
    c = 0
    for i, w in words:
        if i == bi and re.sub(r"[^A-Za-z0-9'_]", '', w['w']).lower() == word.lower():
            c += 1
            if c == n: return w['s']
    raise KeyError(word)
F = SoundFont(f'{REPO}/models/GeneralUser-GS.sf2', SR); out = np.zeros(int((T + 4) * SR))
STR, SLOW, PIZZ, TREM, TIMP, BSN, CLAR, FLUTE, OBOE, CELESTA, HIT, BRASS, HORN, TPT, TBN, CELLO, HARP, PIANO, TUBA, SNARE, CBASS, CHOIR, TAIKO = \
    48, 49, 45, 44, 47, 70, 71, 73, 68, 8, 55, 61, 60, 56, 57, 42, 46, 0, 58, 115, 43, 52, 116
def n(t, prog, key, vel, dur, gain=1.0):
    if t < 0 or t > T: return
    a = F.note(prog, key, int(min(127, max(1, vel))), dur) * gain; s = int(t * SR); e = min(len(out), s + len(a)); out[s:e] += a[:e - s]
def chord(t, prog, keys, vel, dur, gain=1.0):
    for k in keys: n(t, prog, k, vel, dur, gain)
def hit(t, root=38, g=1.0):  # orchestral stab: brass + timpani + low strings
    chord(t, BRASS, [root + 12, root + 15, root + 19], 118, 0.7, 0.5 * g); n(t, TIMP, root, 125, 1.0, 0.9 * g); n(t, CBASS, root, 115, 0.8, 0.6 * g); n(t, HIT, root + 12, 110, 0.6, 0.35 * g)
def riser(t0, t1, root=50, g=0.4):  # string swell into a cut
    d = t1 - t0
    for k, key in enumerate([root, root + 3, root + 7, root + 12]): n(t0, TREM, key, 60 + k * 10, d, g)
def ostinato(t0, t1, bpm, notes, prog=STR, vel=95, g=0.45, step=0.5, bass=None, bassg=0.5, pulse=None):
    b = 60 / bpm; t = t0; i = 0
    while t < t1 - 0.05:
        n(t, prog, notes[i % len(notes)], vel - (0 if i % 4 == 0 else 12), b * step * 0.9, g)
        if bass and i % int(round(2 / step)) == 0: n(t, CBASS, bass[(i // int(round(8 / step))) % len(bass)], 100, b * 2, bassg)
        if pulse and i % int(round(1 / step)) == 0: n(t, pulse[0], pulse[1], 80 + (25 if i % int(round(4 / step)) == 0 else 0), 0.25, pulse[2])
        t += b * step; i += 1


def arp(t0, t1, bpm, prog, inst=PIANO, g=0.35, pad=SLOW, padg=0.25, bass=CELLO, bassg=0.3, up=12, vel=70):
    b = 60 / bpm; t = t0; i = 0
    while t < t1 - 0.1:
        ch = prog[(i // 8) % len(prog)]; n(t, inst, ch[i % 3] + up, vel, b, g)
        if i % 8 == 0: chord(t, pad, [c + 12 for c in ch], 60, b * 4, padg); n(t, bass, ch[0], 70, b * 4, bassg)
        t += b / 2; i += 1

# ---- HOOK (0..B1): 850,000 bitcoin gone. Tremolo in C minor, timpani heartbeat, stabs on the numbers
chord(0, TREM, [36, 48, 51, 55], 80, B[1] - 0.2, 0.24); n(0, CHOIR, 60, 60, B[1] - 0.4, 0.15)
for k in range(int(B[1] / 0.75)): n(0.1 + k * 0.75, TIMP, 36, 95 if k % 2 == 0 else 70, 0.4, 0.35)
hit(WT(0, 'admitted'), 36, 0.7); hit(WT(0, 'gone'), 32, 1.0)
chord(WT(0, 'billions'), HORN, [60, 63, 67], 105, 1.4, 0.4)
riser(WT(0, 'thief') - 0.2, B[1] - 0.05, 48, 0.45); n(WT(0, 'years'), TAIKO, 48, 120, 0.6, 0.6)

# ---- THE CARD GAME (B1..B2): playful fantasy. Pizzicato and flute, a harp gliss on "Magic"
ostinato(B[1] + 0.1, B[2] - 0.1, 116, [60, 64, 67, 72, 67, 64, 62, 65], prog=PIZZ, vel=95, g=0.4, bass=[48, 53, 55, 48], bassg=0.35)
for k, key in enumerate([67, 71, 74, 79, 83, 86]): n(WT(1, 'Magic') + k * 0.05, HARP, key, 100, 0.8, 0.35)
for k, key in enumerate([79, 81, 83, 84]): n(WT(1, 'fantasy') + k * 0.18, FLUTE, key, 90, 0.25, 0.3)

# ---- 2010 (B2..B3): curious celesta over piano, a sparkle on "bitcoin", warm strings for Tokyo
arp(B[2], B[3], 92, [[48, 52, 55], [45, 48, 52], [41, 45, 48], [43, 47, 50]], g=0.3)
for k, key in enumerate([84, 88, 91, 96]): n(WT(2, 'bitcoin') + k * 0.07, CELESTA, key, 100, 0.8, 0.35)
n(WT(2, 'Tokyo'), HARP, 79, 100, 1.0, 0.35); chord(WT(2, 'Mark'), HORN, [55, 60, 64], 85, 1.4, 0.3)

# ---- THE BOOM (B3..B4): driving strings, horns climbing to "seventy percent"
ostinato(B[3], B[4] - 0.2, 128, [48, 48, 60, 48, 48, 58, 48, 55], prog=STR, vel=100, g=0.3, step=0.25, bass=[36, 41, 43, 36], pulse=(SNARE, 38, 0.2))
chord(WT(3, 'booming'), HORN, [60, 64, 67], 105, 1.2, 0.35)
x = WT(3, 'seventy'); hit(x, 36, 0.9); chord(x, CHOIR, [60, 64, 67], 90, 1.6, 0.25)

# ---- FIRST CRACK (B4..B5): unease, then a falling string glissando on the crash
x = B[4]; n(x, CBASS, 34, 100, B[5] - x, 0.45); chord(x, TREM, [46, 49, 52], 65, WT(4, 'crashed') - x, 0.25)
hit(WT(4, 'crack'), 34, 0.8); n(WT(4, 'admin'), CELESTA, 91, 90, 0.5, 0.25)
x = WT(4, 'crashed')
for k in range(10): n(x + k * 0.09, STR, 82 - k * 3, 105, 0.15, 0.3)
hit(WT(4, 'cent'), 30, 1.1)

# ---- THE REAL HEIST (B5..B6): silent. A held low note, a clock-like celesta, a stab on "copied"
x = B[5]; n(x, CBASS, 31, 100, B[6] - x, 0.5); n(x, CHOIR, 55, 55, B[6] - x - 0.5, 0.12)
for k in range(int((B[6] - x) / 0.5)): n(x + k * 0.5, CELESTA, 91 if k % 2 == 0 else 86, 55, 0.15, 0.14)
x = WT(5, 'copied'); hit(x, 31, 1.0); chord(x, TREM, [43, 46, 49, 55], 105, 1.8, 0.35)
chord(WT(5, 'spend'), HORN, [55, 58, 62], 90, 1.2, 0.3)

# ---- DRIP (B6..B7): a slow heist ostinato, the vault emptying, eerie calm on "normal"
ostinato(B[6], WT(6, 'And', 1) - 0.1, 104, [43, 46, 50, 49, 50, 46, 43, 42], prog=PIZZ, vel=100, g=0.45, bass=[31, 31, 27, 29])
for w in ['Slowly', 'batch', 'empty']: n(WT(6, w), TIMP, 31, 100, 0.5, 0.45)
x = WT(6, 'And', 1); chord(x, SLOW, [55, 59, 62], 60, B[7] - x, 0.25); n(x, CELESTA, 91, 70, 1.2, 0.2)

# ---- FROZEN (B7..B8): tension. Procedural piano pulse, stab on "froze", a sour chord on "malleability"
ostinato(B[7], B[8] - 0.2, 110, [60, 60, 63, 60, 58, 60, 55, 60], prog=PIANO, vel=85, g=0.25, step=0.5, bass=[36, 36, 32, 34], bassg=0.35, pulse=(PIZZ, 36, 0.22))
hit(WT(7, 'froze'), 36, 1.0)
chord(WT(7, 'malleability'), BSN, [42, 48, 53], 95, 1.6, 0.4)

# ---- PROTEST (B8..B9): lone cello for the man with the sign, then the floor drops on "blank"
x = B[8] + 0.1; chord(x, SLOW, [48, 55, 60], 55, WT(8, 'blank') - x, 0.2)
for k, (key, d) in enumerate([(60, 1.2), (58, 0.6), (56, 1.2), (55, 1.8)]): n(x + [0, 1.2, 1.8, 3.0][k], CELLO, key, 80, d, 0.4)
x = WT(8, 'blank'); hit(x, 30, 0.9); n(x, CBASS, 30, 100, B[9] - x, 0.4)

# ---- THE BOW (B9..B10): solemn brass, stabs on the number and on "bankrupt"
x = B[9]; chord(x, TREM, [36, 43, 48, 51], 80, B[10] - x - 0.2, 0.3)
for k in range(int((B[10] - x) / 0.8)): n(x + k * 0.8, TIMP, 36, 90, 0.4, 0.3)
chord(WT(9, 'bowed'), TBN, [36, 43], 85, 2.0, 0.4)
chord(WT(9, 'Eight'), HORN, [60, 63, 67], 105, 1.6, 0.4)
hit(WT(9, 'bankrupt'), 32, 1.2)

# ---- THE TWIST (B10..B11): a hopeful harp lift on "found", then it sinks again on "gone"
x = WT(10, 'twist'); n(x, CELESTA, 84, 100, 0.6, 0.3); n(x, PIZZ, 48, 100, 0.3, 0.4)
x = WT(10, 'found'); arp(x, WT(10, 'still'), 100, [[48, 52, 55], [53, 57, 60]], inst=HARP, g=0.35, up=24)
for k, key in enumerate([72, 76, 79, 84]): n(x + k * 0.07, CELESTA, key, 100, 0.7, 0.3)
x = WT(10, 'still'); chord(x, SLOW, [44, 48, 51], 70, B[11] - x, 0.3); hit(WT(10, 'gone'), 32, 0.9)

# ---- FOLLOW THE COINS (B11..B12): investigative ostinato, building; stab on "Vinnik"
ostinato(B[11], B[12] - 0.2, 120, [45, 48, 52, 51, 52, 48, 45, 44], prog=PIZZ, vel=100, g=0.45, bass=[33, 33, 29, 31])
ostinato(WT(11, 'trail'), B[12] - 0.2, 120, [81, 84, 88, 84], prog=CELESTA, vel=70, g=0.14, step=1)
chord(WT(11, 'Russian'), TBN, [33, 40], 90, 1.6, 0.4)
x = WT(11, 'Vinnik'); riser(x - 0.6, x, 45, 0.35); hit(x, 33, 1.0)

# ---- GREECE (B12..B13): sunny Mediterranean strings and harp, then the action on "police"
x0 = B[12]; x1 = WT(12, 'police')
arp(x0, x1, 104, [[50, 54, 57], [55, 59, 62], [52, 55, 59], [57, 61, 64]], inst=HARP, g=0.35, up=24)
for k, key in enumerate([74, 78, 81, 86]): n(WT(12, 'holiday') + k * 0.15, FLUTE, key, 90, 0.3, 0.3)
hit(x1, 38, 1.0)
ostinato(x1 + 0.1, WT(12, 'He') - 0.1, 140, [50, 53, 50, 57, 50, 53, 50, 58], prog=STR, vel=110, g=0.3, step=0.25, bass=[38, 34], pulse=(TAIKO, 45, 0.3))
hit(WT(12, 'arrested'), 34, 1.0)
x = WT(12, 'He'); chord(x, SLOW, [50, 53, 57], 70, B[13] - x, 0.25); chord(WT(12, 'guilty'), BRASS, [50, 53, 57], 100, 0.8, 0.35)

# ---- CHARGES (B13..B14): procedural drums, counting horns on 647,000
ostinato(B[13], B[14] - 0.2, 120, [38, 38, 50, 38, 38, 48, 38, 45], prog=STR, vel=100, g=0.28, step=0.25, bass=[26, 29, 31, 26], pulse=(TIMP, 38, 0.3))
hit(WT(13, 'charged'), 38, 0.9)
x = WT(13, 'six'); chord(x, HORN, [62, 65, 69], 110, 2.0, 0.45); n(x, CHOIR, 62, 85, 2.0, 0.2)

# ---- SWAP (B14..B15): an ironic, airy turn: high strings and a plane-like flute line
x = B[14]; chord(x, SLOW, [55, 62, 67], 70, B[15] - x, 0.3); n(x, CBASS, 43, 80, B[15] - x, 0.3)
for k, key in enumerate([79, 81, 83, 86, 88]): n(WT(14, 'walked') + k * 0.2, FLUTE, key, 85, 0.35, 0.3)
chord(WT(14, 'swapped'), HORN, [55, 59, 62], 95, 1.6, 0.35)

# ---- THE CELL (B15..B16): a single cello and a gavel-like timpani on the verdicts
x = B[15] + 0.1; chord(x, SLOW, [45, 52, 57], 55, B[16] - x, 0.22)
for k, (key, d) in enumerate([(57, 1.4), (55, 0.7), (53, 1.4), (52, 2.2), (50, 2.0)]): n(x + [0, 1.4, 2.1, 3.5, 5.7][k], CELLO, key, 80, d, 0.4)
for w in ['cleared', 'convicted']: n(WT(15, w), TIMP, 33, 115, 0.6, 0.5)

# ---- TEN YEARS (B16..B17): bittersweet piano
arp(B[16], B[17], 84, [[45, 48, 52], [41, 45, 48], [48, 52, 55], [43, 47, 50]], g=0.32)
n(WT(16, 'Repayments'), CELESTA, 84, 90, 0.8, 0.25)

# ---- THE LESSON (B17..): reflective piano over strings, a last stinger on "crime"
arp(B[17], T - 1.2, 80, [[48, 51, 55], [44, 48, 51], [41, 44, 48], [43, 47, 50]], g=0.35, padg=0.28)
for w in ['If', 'Keep', 'twofactor']: n(WT(17, w), CELESTA, 84, 100, 0.8, 0.28)
x = WT(17, 'Follow'); riser(x - 0.4, x + 0.2, 48, 0.3)
x = WT(17, 'crime'); hit(x, 36, 1.0); chord(x, TREM, [36, 48, 51, 55], 95, T - x, 0.35)

mix = reverb(out, SR, 1.8, 0.24)[: int(T * SR)]; mix /= np.abs(mix).max() + 1e-9
sf.write(f'{EP}/music.wav', mix.astype(np.float32), SR); print('music', round(T, 1), 's')
