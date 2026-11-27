"""Score for RansomwareHelp (GeneralUser GS soundfont): a dark thriller score, one cue per scene.
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

# ---- HOOK (0..B1): taiko heartbeat under tremolo, a stab on "paying", a big hit + choir on "F B I"
chord(0, TREM, [38, 50, 53, 57], 80, B[1], 0.24)
t = 0.1; k = 0
while t < WT(0, 'F') - 0.3: n(t, TAIKO, 41, 100 if k % 2 == 0 else 80, 0.4, 0.32); t += max(0.3, 0.7 - k * 0.03); k += 1
for w in ['company', 'hackers']: n(WT(0, w), PIZZ, 38, 110, 0.4, 0.4)
hit(WT(0, 'paying'), 38, 0.8); riser(WT(0, 'And'), WT(0, 'F') - 0.1, 50, 0.4)
x = WT(0, 'F') - 0.1; hit(x, 34, 1.3); chord(x, CHOIR, [46, 53, 58], 110, B[1] - x + 0.3, 0.3)

# ---- LOCKED (B1..B2): a cold ostinato; a hit as the screens flip; celesta ticks for the countdown
ostinato(B[1], B[2] - 0.1, 112, [50, 53, 57, 56, 57, 53, 50, 49], prog=PIZZ, vel=100, g=0.4, bass=[38, 38, 34, 36])
hit(WT(1, 'lock'), 38, 1.0); chord(WT(1, 'lock'), TREM, [50, 53, 56], 90, 2.5, 0.25)
for k in range(10): n(WT(1, 'demand') + k * 0.5, CELESTA, 93 if k % 2 == 0 else 88, 70, 0.12, 0.16)
n(WT(1, 'not'), CBASS, 26, 110, 1.2, 0.5)

# ---- WHY NOT PAY (B2..B3): low drone, a brass warning on "Treasury"
x = B[2]; n(x, CBASS, 31, 95, B[3] - x, 0.4); chord(x, SLOW, [55, 58, 62], 60, B[3] - x, 0.22)
chord(WT(2, 'Treasury'), TBN, [31, 38], 100, 1.6, 0.4); n(WT(2, 'sanctions'), TIMP, 31, 115, 0.6, 0.45)

# ---- THE FIRM (B3..B4): sunny, a little too cheerful: pizzicato in F major with harp
ostinato(B[3], B[4] - 0.2, 120, [53, 57, 60, 65, 60, 57, 55, 59], prog=PIZZ, vel=95, g=0.38, bass=[41, 41, 36, 38], bassg=0.35)
arp(B[3], B[4] - 0.2, 120, [[53, 57, 60], [50, 53, 57], [46, 50, 53], [48, 52, 55]], inst=HARP, g=0.2, padg=0.15)
chord(WT(3, 'ninetynine'), HORN, [65, 69, 72], 100, 1.2, 0.35)

# ---- THE CATCH (B4..B5): the music sours: a hit, then a creeping minor pizzicato
hit(WT(4, 'catch') - 0.05, 38, 1.0); ostinato(WT(4, 'catch') + 0.4, B[5] - 0.2, 100, [46, 49, 53, 52], prog=PIZZ, vel=95, g=0.4, bass=[34, 34], bassg=0.4)
chord(WT(4, 'quietly'), BSN, [44, 50, 55], 85, 1.4, 0.35); n(WT(4, 'more'), TIMP, 34, 115, 0.6, 0.45)

# ---- AN OLD TRICK (B5..B6): sombre low brass, timpani on the year, a stab on "Iran"
x = B[5] + 0.2; chord(x, SLOW, [41, 48, 53], 70, B[6] - x, 0.26)
for k, keys in enumerate([[41, 48], [39, 46], [37, 44], [36, 43]]): chord(x + k * 2.2, TBN, keys, 80, 2.0, 0.32)
n(WT(5, 'twentynineteen'), TIMP, 29, 120, 0.6, 0.5); hit(WT(5, 'Iran'), 29, 1.0)

# ---- THE STING (B6..B9): the spy cue: muted brass + pizzicato bass, building through both sides
hit(WT(6, 'trap'), 38, 1.0); chord(WT(6, 'both'), CHOIR, [62, 69, 74], 100, 1.4, 0.25)
ostinato(B[7], B[8] - 0.1, 104, [38, 41, 45, 44, 45, 41, 38, 37], prog=PIZZ, vel=100, g=0.42, bass=[26, 26, 25, 24], bassg=0.45)
for w in ['sent', 'clear']: chord(WT(7, w), HORN, [62, 65, 69], 95, 0.9, 0.3)
ostinato(B[8], B[9] - 0.1, 112, [38, 41, 45, 44, 45, 41, 38, 37], prog=STR, vel=100, g=0.26, step=0.25, bass=[26, 26, 25, 24], bassg=0.45, pulse=(SNARE, 38, 0.14))
chord(WT(8, 'indictment'), TBN, [26, 33], 100, 1.4, 0.4); hit(WT(8, 'Juan'), 38, 0.9); n(WT(8, 'haggle'), PIZZ, 50, 115, 0.3, 0.45)

# ---- THE DEAL (B9..B10): a ticking haggle, a stab when the price drops
x = B[9]; n(x, CBASS, 26, 95, B[10] - x, 0.4)
for k in range(int((B[10] - x) / 0.4)): n(x + k * 0.4, CELESTA, 91 if k % 2 == 0 else 86, 60, 0.12, 0.14)
hit(WT(9, 'six'), 33, 0.9); chord(WT(9, 'six'), HORN, [57, 61, 64], 100, 1.2, 0.3)

# ---- THE BILL (B10..B11): sly pizzicato, a cash-register celesta on each fee, a hit on the total
ostinato(B[10], B[11] - 0.2, 116, [50, 53, 57, 60, 57, 53, 50, 53], prog=PIZZ, vel=95, g=0.38, bass=[38, 36], bassg=0.35)
for w in ['diagnostic', 'recovery']:
    for k, key in enumerate([84, 88, 91]): n(WT(10, w) + k * 0.07, CELESTA, key, 95, 0.4, 0.22)
hit(WT(10, 'Sixteen'), 38, 1.0); chord(WT(10, 'presented'), BSN, [44, 50, 55], 85, 1.4, 0.3)

# ---- THE SAME PEOPLE (B11..B12): a riser into the reveal, a huge hit and choir, then a held chord
riser(B[11], WT(11, 'same') - 0.15, 50, 0.45); x = WT(11, 'same') - 0.1; hit(x, 34, 1.4); chord(x, CHOIR, [46, 53, 58, 62], 110, B[12] - x, 0.3); chord(x, TBN, [34, 41], 95, B[12] - x, 0.35)
n(WT(11, 'watched'), TIMP, 34, 115, 0.8, 0.5)

# ---- ARRESTED (B12..B13): driving strings and snare, a hit on "arrested", timpani on the counts, calm on "innocent"
ostinato(B[12], WT(12, 'He', 2) - 0.2, 132, [45, 45, 57, 45, 48, 45, 55, 45], prog=STR, vel=105, g=0.27, step=0.25, bass=[33, 36], pulse=(SNARE, 38, 0.16))
hit(WT(12, 'arrested'), 33, 1.1); [n(WT(12, 'three') + k * 0.22, TIMP, 33 + k * 2, 120, 0.4, 0.5) for k in range(3)]; hit(WT(12, 'prison'), 31, 0.9)
x = WT(12, 'He', 2) - 0.1; chord(x, SLOW, [45, 52, 57], 70, B[13] - x, 0.26)

# ---- PAID ANYWAY (B13..B14): a slow chorale, a stab on "markup"
x = B[13]; chord(x, TBN, [38, 45], 85, B[14] - x, 0.32); chord(x, SLOW, [50, 53, 57], 70, B[14] - x, 0.24); hit(WT(13, 'markup'), 38, 1.0)

# ---- THE LESSON (B14..): reflective piano over strings, stingers on each tip, a last hit on "crime"
arp(B[14], T - 1.2, 84, [[50, 53, 57], [46, 50, 53], [43, 46, 50], [45, 49, 52]], g=0.33, padg=0.26)
for w in ['ask', 'Keep', 'report']: n(WT(14, w), CELESTA, 86, 100, 0.8, 0.28)
x = WT(14, 'Follow'); riser(x - 0.4, x + 0.2, 50, 0.3)
x = WT(14, 'crime'); hit(x, 38, 1.0); chord(x, TREM, [38, 50, 53, 57], 95, T - x, 0.35)

mix = reverb(out, SR, 1.8, 0.24)[: int(T * SR)]; mix /= np.abs(mix).max() + 1e-9
sf.write(f'{EP}/music.wav', mix.astype(np.float32), SR); print('music', round(T, 1), 's')
