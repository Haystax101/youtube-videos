"""Score for the Citibank heist (GeneralUser GS soundfont): a dark thriller score, one cue per scene.
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

# ---- HOOK: the vault pours out. Tremolo strings (D minor), timpani heartbeats, stabs
chord(0, TREM, [38, 50, 53, 57], 80, B[1] - 0.2, 0.24); n(0, CHOIR, 62, 60, B[1] - 0.4, 0.15)
for k in range(int(B[1] / 0.75)): n(0.1 + k * 0.75, TIMP, 38, 95 if k % 2 == 0 else 70, 0.4, 0.35)
hit(WT(0, 'robbed'), 38, 0.8); hit(WT(0, 'million'), 34, 1.0)
for w in ['No', 'mask']: n(WT(0, w), TAIKO, 45, 110, 0.4, 0.5)
riser(WT(0, 'phone') - 0.2, WT(0, 'password'), 50, 0.45); hit(WT(0, 'password'), 38, 1.1)

# ---- ST PETERSBURG (B1..B2): lonely piano arpeggios (A minor), celesta snow, low strings
b = 60 / 84; t = B[1] + 0.3; i = 0; prog = [[45, 48, 52], [41, 45, 48], [43, 47, 50], [40, 44, 47]]
while t < B[2] - 0.1:
    ch = prog[(i // 8) % 4]; n(t, PIANO, ch[i % 3] + 12 + (12 if i % 8 == 7 else 0), 70, b, 0.4)
    if i % 8 == 0: chord(t, SLOW, [ch[0] + 12, ch[2] + 12], 55, b * 4, 0.25); n(t, CELLO, ch[0], 70, b * 4, 0.3)
    if i % 3 == 1: n(t + 0.1, CELESTA, [84, 88, 91, 86][i % 4], 70, 0.6, 0.18)
    t += b / 2; i += 1
x = WT(1, 'Soviet'); chord(x, HORN, [45, 52], 70, 1.6, 0.25)
x = WT(1, 'bank'); hit(x, 33, 0.8)

# ---- THE BACK DOOR (B2..B3): procedural pulse, piano 8ths over pizz; stabs on "No teller / No signature"
ostinato(B[2], B[3] - 0.2, 110, [62, 62, 65, 62, 60, 62, 57, 62], prog=PIANO, vel=85, g=0.25, step=0.5, bass=[38, 38, 34, 36], bassg=0.35, pulse=(PIZZ, 38, 0.22))
chord(B[2], SLOW, [50, 57], 60, B[3] - B[2], 0.2)
for w in ['dial', 'type', 'send']: n(WT(2, w), CELESTA, 86, 100, 0.5, 0.25)
n(WT(2, 'No'), BRASS, 62, 105, 0.45, 0.35); n(WT(2, 'No', 2), BRASS, 64, 105, 0.45, 0.35)
x = WT(2, 'password', 2); hit(x, 38, 0.9)

# ---- THE KEYS (B3..B4): held low strings, harp glints for each country
x = B[3]; n(x, CBASS, 34, 100, B[4] - x, 0.45); chord(x, TREM, [46, 53], 70, B[4] - x - 0.3, 0.2)
for w, key in [('Argentina', 82), ('Indonesia', 85), ('Bahamas', 89)]: n(WT(3, w), HARP, key, 110, 0.6, 0.4); n(WT(3, w), TIMP, 34, 90, 0.4, 0.35)
riser(B[4] - 0.8, B[4], 46, 0.35)

# ---- THE SUMMER OF TRANSFERS (B4..B5): driving 16th strings, snare, horns climbing with each country
ostinato(B[4], B[5] - 0.2, 128, [50, 50, 62, 50, 50, 60, 50, 57], prog=STR, vel=100, g=0.3, step=0.25, bass=[38, 34, 36, 33], pulse=(SNARE, 38, 0.22))
hit(WT(4, 'work'), 38, 0.9); chord(WT(4, 'million'), HORN, [62, 65], 105, 1.2, 0.35)
for k, w in enumerate(['Finland', 'Israel', 'Netherlands', 'Germany', 'United']): chord(WT(4, w), HORN, [62 + k * 2, 65 + k * 2], 105, 0.6, 0.32)

# ---- THEY NOTICE (B5..B6): floor drops out, one held note, alarm stab, FBI hit
x = B[5]; n(x, CBASS, 34, 100, B[6] - x, 0.5); n(x, CHOIR, 58, 55, B[6] - x - 0.3, 0.12)
hit(WT(5, 'missing'), 34, 1.0); x = WT(5, 'FBI'); chord(x, HORN, [50, 53, 57], 95, 1.4, 0.4); n(x, TIMP, 38, 110, 0.8, 0.6)

# ---- THE TRAP (B6..B7): heist pizz ostinato + celesta; stabs on the arrests; a horn on "point"
ostinato(B[6], B[7] - 0.2, 120, [45, 48, 52, 51, 52, 48, 45, 44], prog=PIZZ, vel=100, g=0.5, bass=[33, 33, 29, 31])
ostinato(WT(6, 'San'), B[7] - 0.2, 120, [81, 84, 88, 84], prog=CELESTA, vel=70, g=0.14, step=1)
hit(WT(6, 'arrested'), 33, 0.9); hit(WT(6, 'husband'), 31, 0.7)
x = WT(6, 'point'); chord(x, BRASS, [45, 52, 57], 105, 1.6, 0.4); n(x, TIMP, 33, 110, 0.6, 0.5)

# ---- UNTOUCHABLE (B7..B8): slow strings, a cello line, a clock in the celesta
x = B[7]; chord(x, SLOW, [45, 52, 57], 60, B[8] - x, 0.22)
seq = [(57, 1.4), (55, 0.7), (53, 1.4), (52, 2.2), (50, 2.0)]; tt0 = x + 0.2
for key, d in seq: n(tt0, CELLO, key, 80, d, 0.4); tt0 += d
x = WT(7, 'So')
for k in range(int((B[8] - x) / 0.5)): n(x + k * 0.5, CELESTA, 96 if k % 2 == 0 else 91, 55, 0.15, 0.14)

# ---- STANSTED (B8..B9): tension builds, tremolo + taiko; hit on Scotland Yard
x = B[8]; chord(x, TREM, [38, 45, 50, 53], 80, WT(8, 'Scotland') - x, 0.3)
for k in range(int((WT(8, 'Scotland') - x) / 0.45)): n(x + k * 0.45, TAIKO, 45, 80 + min(40, k * 2), 0.3, 0.3)
riser(WT(8, 'transfer') - 0.4, WT(8, 'Scotland'), 50, 0.45); hit(WT(8, 'Scotland'), 38, 1.2); chord(WT(8, 'waiting'), CHOIR, [62, 65, 69], 90, 1.2, 0.25)

# ---- 30 MONTHS (B9..B10): a grim march, timpani and low brass; the gavel on "loses"
ostinato(B[9], B[10] - 0.2, 96, [38, 38, 41, 38, 36, 38, 33, 38], prog=TBN, vel=95, g=0.3, step=1, bass=[26, 26, 29, 24], pulse=(SNARE, 38, 0.18))
hit(WT(9, 'loses'), 34, 1.0); chord(WT(9, 'York'), HORN, [50, 57, 62], 100, 1.4, 0.4)

# ---- THE DEAL (B10..B11): grave strings, stabs on the sentence
x = B[10]; chord(x, SLOW, [38, 45, 50], 70, B[11] - x, 0.28); n(x, CBASS, 26, 90, B[11] - x, 0.35)
hit(WT(10, 'million'), 38, 0.7); hit(WT(10, 'sentence'), 34, 1.0); hit(WT(10, 'prison'), 31, 0.9)

# ---- REAL OR MYTH (B11..B12): mysterious celesta + pizz, choir on "twist", a question on "proven"
x = B[11]; chord(x, CHOIR, [57, 60, 64], 70, 2.0, 0.22); n(x, HARP, 81, 100, 0.8, 0.35)
ostinato(WT(11, 'Years'), B[12] - 0.3, 104, [69, 72, 76, 75], prog=CELESTA, vel=80, g=0.18, step=0.5, bass=[33, 36], bassg=0.3)
ostinato(WT(11, 'Years'), B[12] - 0.3, 104, [45, 52, 45, 51], prog=PIZZ, vel=90, g=0.35, step=1)
x = WT(11, 'proven'); chord(x, TREM, [45, 48, 51, 54], 100, 1.4, 0.35)

# ---- ALL BUT $400,000 (B12..B13): strings lift towards major; the vault shuts on "lock"
x = B[12]; ostinato(x, B[13] - 0.2, 100, [50, 57, 62, 57], prog=STR, vel=85, g=0.28, step=0.5, bass=[38, 43, 41, 45])
chord(WT(12, 'learned'), HORN, [50, 54, 57], 95, 1.6, 0.35); hit(WT(12, 'lock'), 38, 1.1)

# ---- THE LESSON (B13..): reflective piano over strings, a last stinger on "crime"
b = 60 / 80; t = B[13]; i = 0; prog = [[50, 53, 57], [46, 50, 53], [41, 45, 48], [45, 49, 52]]
while t < T - 1.2:
    ch = prog[(i // 8) % 4]; n(t, PIANO, ch[i % 3] + 12, 70, b, 0.35)
    if i % 8 == 0: chord(t, SLOW, [c + 12 for c in ch], 65, b * 4, 0.28); n(t, CELLO, ch[0], 70, b * 4, 0.3)
    t += b / 2; i += 1
x = WT(13, 'Follow'); riser(x - 0.4, x + 0.2, 50, 0.3)
x = WT(13, 'crime'); hit(x, 38, 1.0); chord(x, TREM, [38, 50, 53, 57], 95, T - x, 0.35)

mix = reverb(out, SR, 1.8, 0.24)[: int(T * SR)]; mix /= np.abs(mix).max() + 1e-9
sf.write(f'{EP}/music.wav', mix.astype(np.float32), SR); print('music', round(T, 1), 's')
