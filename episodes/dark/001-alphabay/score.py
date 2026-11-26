"""Score for Operation Bayonet (GeneralUser GS soundfont): a dark thriller score, one cue per scene.
Hook: string tremolo and timpani under the arrest. Quebec: lonely piano and celesta snow. Dark web: a sneaky
pizzicato ostinato that turns into driving strings for the boom. Thailand: lush, smug strings and harp.
The mistake: everything drops to one held note and a clock. Investigators: a ticking procedural pulse.
Hansa: a heist ostinato. The arrest: full action. The cell: a single cello. The lesson: piano and strings.
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

# ---- HOOK (0..B1): the arrest. Tremolo strings in D minor, timpani heartbeats, stabs on the key words
chord(0, TREM, [38, 50, 53, 57], 80, B[1] - 0.2, 0.24); n(0, CHOIR, 62, 60, B[1] - 0.4, 0.15)
for k in range(int(B[1] / 0.75)): n(0.1 + k * 0.75, TIMP, 38, 95 if k % 2 == 0 else 70, 0.4, 0.35)
hit(WT(0, 'black'), 38, 0.7); hit(WT(0, 'email'), 34, 1.0)
riser(WT(0, 'brought') - 0.2, B[1] - 0.05, 50, 0.45); n(WT(0, 'crashing'), TAIKO, 50, 120, 0.6, 0.6)

# ---- QUEBEC, 2014 (B1..B2): lonely piano arpeggios (A minor), celesta snowflakes, soft strings
b = 60 / 84; t = B[1] + 0.1; i = 0; prog = [[45, 48, 52], [41, 45, 48], [43, 47, 50], [40, 44, 47]]
while t < B[2] - 0.1:
    ch = prog[(i // 8) % 4]; n(t, PIANO, ch[i % 3] + 12 + (12 if i % 8 == 7 else 0), 70, b, 0.4)
    if i % 8 == 0: chord(t, SLOW, [ch[0] + 12, ch[2] + 12], 55, b * 4, 0.25); n(t, CELLO, ch[0], 70, b * 4, 0.3)
    if i % 3 == 1: n(t + 0.1, CELESTA, [84, 88, 91, 86][i % 4], 70, 0.6, 0.18)
    t += b / 2; i += 1
for k, key in enumerate([72, 76, 79, 84]): n(WT(1, 'eBay') + k * 0.06, CELESTA, key, 95, 0.8, 0.35)
n(WT(1, 'crime'), CBASS, 33, 110, 1.0, 0.6)

# ---- THE DARK WEB (B2..B3): sneaky pizzicato ostinato, low clarinet, a stab for each kind of goods
ostinato(B[2], B[3] - 0.1, 112, [50, 53, 57, 56, 53, 50, 49, 50], prog=PIZZ, vel=100, g=0.5, bass=[38, 36, 34, 33])
chord(B[2], SLOW, [50, 57, 62], 60, B[3] - B[2], 0.18)
for w, key in [('Drugs', 62), ('Guns', 64), ('Stolen', 65), ('Hacking', 67)]: n(WT(2, w), BRASS, key, 105, 0.45, 0.35); n(WT(2, w), TIMP, 38, 100, 0.4, 0.4)
riser(WT(2, 'All'), B[3] - 0.05, 50, 0.4)

# ---- THE BOOM (B3..B4): driving 16th strings, snare, horns climbing with the numbers
ostinato(B[3], B[4] - 0.2, 128, [50, 50, 62, 50, 50, 60, 50, 57], prog=STR, vel=100, g=0.3, step=0.25, bass=[38, 34, 36, 33], pulse=(SNARE, 38, 0.22))
hit(B[3], 38, 0.9)
for k, w in enumerate(['2017', '200000', '40000', 'billion']):
    try: x = WT(3, w)
    except KeyError: continue
    chord(x, HORN, [62 + k * 2, 65 + k * 2], 105, 1.2, 0.35)
n(WT(3, 'Silk'), CELLO, 38, 80, 2.5, 0.35)
x = WT(3, 'AlphaBay'); riser(x - 0.6, x, 50, 0.35); hit(x, 38, 1.0); chord(x, CHOIR, [62, 65, 69], 90, 1.6, 0.25)

# ---- THAILAND (B4..B5): lush and smug. Strings in F major over harp arpeggios, a cocky trumpet
b = 60 / 96; t = B[4]; i = 0; prog = [[41, 45, 48], [46, 50, 53], [43, 46, 50], [48, 52, 55]]
while t < B[5] - 0.2:
    ch = prog[(i // 8) % 4]; n(t, HARP, ch[i % 3] + 24, 85, b, 0.35)
    if i % 8 == 0: chord(t, SLOW, [c + 12 for c in ch], 75, b * 4, 0.3); n(t, CBASS, ch[0] - 12, 90, b * 4, 0.4)
    t += b / 2; i += 1
for k, key in enumerate([72, 74, 77, 81, 79]): n(WT(4, 'villa') + k * 0.22, TPT, key, 95, 0.3, 0.3)
for w in ['villa', 'Lamborghini', 'hotel']: n(WT(4, w), CELESTA, 96, 110, 0.6, 0.3)
for w in ['Cyprus', 'Liechtenstein', 'Antigua']: n(WT(4, w), HARP, 89, 110, 0.5, 0.35)
x = WT(4, 'touch'); chord(x, BRASS, [53, 57, 60, 65], 100, 0.9, 0.4)

# ---- THE MISTAKE (B5..B6): the floor drops out. One held low note, a clock, a stinger on the address
x = B[5]; n(x, CBASS, 34, 100, B[6] - x, 0.5); n(x, CHOIR, 58, 55, B[6] - x - 0.5, 0.12)
for k in range(int((B[6] - x) / 0.5)): n(x + k * 0.5, CELESTA, 96 if k % 2 == 0 else 91, 55, 0.15, 0.14)
x = WT(5, 'header'); riser(x - 0.3, WT(5, 'Pimp_Alex_91'), 46, 0.35)
x = WT(5, 'Pimp_Alex_91'); hit(x, 34, 1.0); chord(x, TREM, [46, 49, 52, 58], 110, 2.0, 0.4)

# ---- THE INVESTIGATORS (B6..B8): procedural pulse. Piano 8ths, staccato low strings, ticks
ostinato(B[6], B[8] - 0.2, 110, [62, 62, 65, 62, 60, 62, 57, 62], prog=PIANO, vel=85, g=0.25, step=0.5, bass=[38, 38, 34, 36], bassg=0.35, pulse=(PIZZ, 38, 0.22))
chord(B[6], SLOW, [50, 57], 60, B[8] - B[6], 0.2)
for w in ['address', 'LinkedIn', 'repair', 'forum']: n(WT(6, w), CELESTA, 86, 100, 0.5, 0.25)
x = WT(6, 'name'); hit(x, 38, 0.8)
x = WT(7, 'Dutch'); chord(x, HORN, [50, 53, 57], 95, 1.6, 0.4); n(x, TIMP, 38, 110, 0.8, 0.6)

# ---- HANSA (B8..B9): heist ostinato (pizz + celesta), low brass sneaks; stab on the takeover
ostinato(B[8], B[9] - 0.2, 120, [45, 48, 52, 51, 52, 48, 45, 44], prog=PIZZ, vel=100, g=0.5, bass=[33, 33, 29, 31])
ostinato(WT(8, 'quietly'), B[9] - 0.2, 120, [81, 84, 88, 84], prog=CELESTA, vel=70, g=0.16, step=1)
x = WT(8, 'arrested'); hit(x, 33, 0.8)
x = WT(8, 'quietly'); chord(x, TBN, [33, 40], 85, 2.0, 0.4)
for w in ['password', 'Messages', 'location']: n(WT(8, w), BRASS, 69, 100, 0.4, 0.3); n(WT(8, w), TIMP, 45, 100, 0.4, 0.4)

# ---- THE ARREST (B9..B10): full action. Taiko and timpani, fast strings, brass on the crash
x = B[9]; chord(x, TREM, [38, 45, 50, 53], 90, WT(9, 'crashed') - x, 0.4)
for k in range(8): n(x + k * 0.22, TAIKO, 45, 90 + k * 4, 0.3, 0.4)
x = WT(9, 'crashed'); hit(x, 38, 1.2)
ostinato(x + 0.3, WT(9, 'Inside') - 0.1, 140, [50, 53, 50, 57, 50, 53, 50, 58], prog=STR, vel=110, g=0.3, step=0.25, bass=[38, 34], pulse=(TAIKO, 45, 0.35))
x = WT(9, 'grabbed'); hit(x, 34, 1.0)
x = WT(9, 'Inside'); chord(x, SLOW, [50, 53, 57], 70, B[10] - x, 0.25); n(x, CBASS, 38, 90, B[10] - x, 0.35)
for k in range(10): n(x + 0.2 + k * 0.35, CELESTA, 91 if k % 2 else 96, 60, 0.15, 0.14)
x = WT(9, 'logged'); chord(x, HORN, [62, 65, 69], 100, 1.4, 0.4)

# ---- THE FLOOD (B10..B11): AlphaBay goes dark (a cut to nothing), then driving strings into Hansa
x = WT(10, 'dark'); hit(x, 33, 0.9)
ostinato(WT(10, 'Hundreds') - 0.1, B[11] - 0.25, 132, [45, 45, 57, 45, 45, 55, 45, 52], prog=STR, vel=100, g=0.3, step=0.25, bass=[33, 29, 31, 28], pulse=(SNARE, 38, 0.22))
x = WT(10, 'eightfold'); chord(x, HORN, [57, 61, 64], 110, 1.0, 0.45)
x = WT(10, 'police'); hit(x, 33, 1.1)

# ---- THE CELL (B11..B12): quiet and respectful. A single cello line over soft strings
x = B[11] + 0.2; chord(x, SLOW, [45, 52, 57], 55, B[12] - x, 0.22)
for k, (key, d) in enumerate([(57, 1.4), (55, 0.7), (53, 1.4), (52, 2.2)]): n(x + sum(dd for _, dd in [(57, 1.4), (55, 0.7), (53, 1.4), (52, 2.2)][:k]), CELLO, key, 80, d, 0.45)

# ---- PLUG PULLED (B12..B13): dark-triumphant brass, a final timpani roll
x = B[12]; ostinato(x, B[13] - 0.2, 104, [50, 57, 62, 57], prog=STR, vel=90, g=0.3, step=0.5, bass=[38, 41, 43, 38])
x = WT(12, 'plug'); hit(x, 38, 1.0); chord(x, BRASS, [50, 57, 62, 65], 110, 1.6, 0.4)
x = WT(12, 'addresses'); chord(x, HORN, [62, 65, 69, 74], 110, 1.6, 0.4)

# ---- THE LESSON (B13..): reflective piano over strings, a last stinger on "crime"
b = 60 / 80; t = B[13]; i = 0; prog = [[50, 53, 57], [46, 50, 53], [41, 45, 48], [45, 49, 52]]
while t < T - 1.2:
    ch = prog[(i // 8) % 4]; n(t, PIANO, ch[i % 3] + 12, 70, b, 0.35)
    if i % 8 == 0: chord(t, SLOW, [c + 12 for c in ch], 65, b * 4, 0.28); n(t, CELLO, ch[0], 70, b * 4, 0.3)
    t += b / 2; i += 1
x = WT(13, 'email'); n(x, CELESTA, 86, 100, 0.8, 0.3)
x = WT(13, 'Follow'); riser(x - 0.4, x + 0.2, 50, 0.3)
x = WT(13, 'crime'); hit(x, 38, 1.0); chord(x, TREM, [38, 50, 53, 57], 95, T - x, 0.35)

mix = reverb(out, SR, 1.8, 0.24)[: int(T * SR)]; mix /= np.abs(mix).max() + 1e-9
sf.write(f'{EP}/music.wav', mix.astype(np.float32), SR); print('music', round(T, 1), 's')
