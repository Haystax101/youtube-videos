"""Score for Xbox Underground (GeneralUser GS soundfont): a heist-thriller score, one cue per scene.
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

# ---- HOOK (0..B1): the walk-out. Pizzicato heist ostinato, stabs on "Xbox" and "Nobody"
ostinato(0.1, B[1] - 0.3, 124, [50, 53, 57, 53, 56, 53, 57, 60], prog=PIZZ, vel=100, g=0.42, bass=[38, 38, 34, 36], bassg=0.4, pulse=(TIMP, 38, 0.25))
hit(WT(0, 'walked'), 38, 0.6); hit(WT(0, 'Xbox'), 38, 1.0)
x = WT(0, 'Nobody'); chord(x, TREM, [38, 50, 53, 57], 80, 2.0, 0.3)
riser(WT(0, 'worst') - 0.9, B[1] - 0.05, 50, 0.45); n(WT(0, 'part'), TAIKO, 45, 120, 0.6, 0.6)

# ---- TEENAGERS (B1..B2): playful, bright. Celesta arp over piano, a harp lift on each country
arp(B[1] + 0.9, B[2], 104, [[48, 52, 55], [45, 48, 52], [41, 45, 48], [43, 47, 50]], g=0.32)
for w in ['Canada', 'America', 'Australia']: n(WT(1, w), HARP, 79, 100, 0.8, 0.35)
x = WT(1, 'Xbox'); hit(x, 36, 0.7); chord(x, HORN, [60, 64, 67], 100, 1.4, 0.35)

# ---- CRACKING (B2..B3): mischievous pizzicato, clarinet answers
ostinato(B[2], B[3] - 0.2, 116, [55, 58, 62, 58, 60, 58, 62, 65], prog=PIZZ, vel=95, g=0.4, bass=[43, 43, 39, 41], bassg=0.35)
for k, key in enumerate([67, 70, 74]): n(WT(2, 'cracking') + k * 0.15, CLAR, key, 90, 0.2, 0.3)
x = WT(2, 'Underground'); hit(x, 31, 0.9); chord(x, CHOIR, [55, 58, 62], 85, 1.6, 0.22)

# ---- FURTHER (B3..B4): driving strings, a stab on each company
ostinato(B[3], B[4] - 0.2, 132, [45, 45, 57, 45, 45, 55, 45, 52], prog=STR, vel=100, g=0.3, step=0.25, bass=[33, 38, 40, 33], pulse=(SNARE, 38, 0.18))
for w in ['Epic', 'Valve', 'Activision']: n(WT(3, w), TIMP, 33, 115, 0.5, 0.5)
x = WT(3, 'itself'); hit(x, 33, 1.1)

# ---- LOOT (B4..B5): bigger. Horns on the games, then military snare and brass for the Army
x0 = B[4]; x1 = WT(4, 'stranger')
ostinato(x0, x1, 120, [50, 53, 57, 60, 57, 53, 50, 48], prog=STR, vel=95, g=0.28, step=0.5, bass=[38, 41, 36, 38], bassg=0.4)
chord(WT(4, 'Gears'), HORN, [62, 65, 69], 100, 1.0, 0.3)
x = WT(4, 'Apache'); hit(x, 34, 0.9)
for k in range(int((B[5] - x) / 0.25)): n(x + k * 0.25, SNARE, 38, 90 if k % 4 else 120, 0.2, 0.22)
chord(WT(4, 'training'), BRASS, [46, 53, 58], 95, 2.0, 0.3); chord(WT(4, 'United'), TPT, [58, 62, 65], 105, 1.6, 0.35)

# ---- DURANGO (B5..B6): secret. Low held note, ticking celesta, a choir reveal on "Durango"
x = B[5]; n(x, CBASS, 31, 100, B[6] - x, 0.45)
for k in range(int((B[6] - x) / 0.5)): n(x + k * 0.5, CELESTA, 86 if k % 2 == 0 else 91, 60, 0.15, 0.15)
x = WT(5, 'Durango'); hit(x, 31, 1.0); chord(x, CHOIR, [55, 58, 62, 67], 95, 2.4, 0.28)
riser(WT(5, 'months') - 0.2, B[6] - 0.05, 43, 0.35)

# ---- THE BADGE JOB (B6..B7): full heist ostinato with taiko, stabs on "copied", "Redmond", "three"
x0 = WT(6, 'So') - 0.1
chord(B[6], TREM, [38, 45, 50], 70, x0 - B[6], 0.28)
ostinato(x0, B[7] - 0.2, 128, [50, 53, 50, 57, 50, 53, 50, 58], prog=STR, vel=110, g=0.32, step=0.25, bass=[38, 34, 36, 38], pulse=(TAIKO, 45, 0.28))
hit(WT(6, 'copied'), 38, 0.9); hit(WT(6, 'Redmond'), 34, 0.8); hit(WT(6, 'three'), 38, 1.1)

# ---- WANDERED (B7..B8): sneaky calm, then the number lands
x = B[7]; ostinato(x, WT(7, 'Prosecutors') - 0.1, 100, [62, 65, 69, 65], prog=PIZZ, vel=85, g=0.35, step=0.5, bass=[38, 38], bassg=0.3)
x = WT(7, 'Prosecutors'); chord(x, TREM, [36, 43, 48, 51], 85, B[8] - x - 0.2, 0.3)
x = WT(7, 'hundred', 2); hit(x, 36, 1.2); chord(x, HORN, [60, 63, 67], 110, 1.6, 0.4)

# ---- THE FBI (B8..B9): investigative pulse, building to the border
ostinato(B[8], B[9] - 0.2, 120, [45, 48, 52, 51, 52, 48, 45, 44], prog=PIZZ, vel=100, g=0.42, bass=[33, 33, 29, 31])
ostinato(WT(8, 'March'), B[9] - 0.2, 120, [81, 84, 88, 84], prog=CELESTA, vel=70, g=0.14, step=1)
hit(WT(8, 'FBI'), 33, 0.9); chord(WT(8, 'Pokora'), TBN, [33, 40], 90, 1.6, 0.4)
riser(WT(8, 'border') - 0.6, B[9] - 0.05, 45, 0.4)

# ---- ARRESTED (B9..B10): the stab, then solemn brass and gavel timpani
hit(WT(9, 'arrested'), 33, 1.2); x = WT(9, 'Pokora'); chord(x, TREM, [36, 43, 48, 51], 80, B[10] - x - 0.2, 0.3)
n(WT(9, 'guilty'), TIMP, 33, 125, 0.6, 0.55); chord(WT(9, 'first'), HORN, [60, 63, 67], 100, 1.6, 0.35)
hit(WT(9, 'secrets'), 36, 0.9)

# ---- SENTENCES (B10..B11): a single cello, timpani on each sentence, a lighter harp on "probation"
x = B[10] + 0.1; chord(x, SLOW, [45, 52, 57], 55, B[11] - x, 0.22)
for k, (key, d) in enumerate([(57, 1.4), (55, 0.7), (53, 1.4), (52, 2.2)]): n(x + [0, 1.4, 2.1, 3.5][k], CELLO, key, 80, d, 0.4)
for w, k in [('eighteen', 1), ('eighteen', 2), ('two', 2)]: n(WT(10, w, k), TIMP, 33, 115, 0.6, 0.5)
for k, key in enumerate([72, 76, 79, 84]): n(WT(10, 'probation') + k * 0.07, HARP, key, 95, 0.7, 0.3)

# ---- PRAGUE (B11..B12): a sunny European cafe waltz (accordion-like oboe over pizz), sly brass on "can't"
x0 = B[11]; arp(x0, B[12], 108, [[50, 54, 57], [55, 59, 62], [52, 55, 59], [57, 61, 64]], inst=HARP, g=0.3, up=24)
for k, key in enumerate([74, 78, 81, 79, 78]): n(WT(11, 'Czech') + k * 0.25, OBOE, key, 85, 0.3, 0.28)
chord(WT(11, 'extradite'), TBN, [38, 45], 90, 1.4, 0.35)

# ---- THE LESSON (B12..): reflective piano, celesta on the tips, last stinger on "crime"
arp(B[12], T - 1.2, 84, [[48, 51, 55], [44, 48, 51], [41, 44, 48], [43, 47, 50]], g=0.34, padg=0.28)
for w in ['Badges', 'If', 'ask']: n(WT(12, w), CELESTA, 84, 100, 0.8, 0.28)
x = WT(12, 'Follow'); riser(x - 0.4, x + 0.2, 48, 0.3)
x = WT(12, 'crime'); hit(x, 36, 1.0); chord(x, TREM, [36, 48, 51, 55], 95, T - x, 0.35)

mix = reverb(out, SR, 1.8, 0.24)[: int(T * SR)]; mix /= np.abs(mix).max() + 1e-9
sf.write(f'{EP}/music.wav', mix.astype(np.float32), SR); print('music', round(T, 1), 's')
