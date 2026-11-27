"""Score for Stuxnet (GeneralUser GS soundfont): a dark thriller score, one cue per scene.
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

# ---- HOOK (0..B1): the machines tearing apart. Taiko heartbeat accelerating, tremolo cluster, a hit on "apart",
# then a sudden calm, eerie celesta on "everything was fine"
chord(0, TREM, [38, 50, 53, 57], 85, WT(0, 'apart'), 0.26); n(0, CHOIR, 62, 60, WT(0, 'apart'), 0.14)
t = 0.1; k = 0
while t < WT(0, 'apart') - 0.2: n(t, TAIKO, 41, 100 if k % 2 == 0 else 80, 0.4, 0.35); t += max(0.28, 0.8 - k * 0.04); k += 1
hit(WT(0, 'broke'), 38, 0.8); n(WT(0, 'Iran'), TBN, 38, 95, 1.0, 0.35)
riser(WT(0, 'centrifuges'), WT(0, 'apart') - 0.15, 50, 0.45); hit(WT(0, 'apart') - 0.15, 34, 1.3); chord(WT(0, 'apart') - 0.15, CHOIR, [50, 57, 62], 110, 1.6, 0.3)
x = WT(0, 'screens'); chord(x, SLOW, [62, 66, 69], 55, B[1] - x, 0.22)
for k, key in enumerate([86, 90, 93, 98]): n(WT(0, 'everything') + k * 0.12, CELESTA, key, 85, 0.8, 0.25)

# ---- MINSK (B1..B2): a cold, curious cue: piano arpeggio in D minor, a ringing phone motif on celesta
arp(B[1], B[2], 96, [[50, 53, 57], [46, 50, 53], [48, 52, 55], [45, 49, 52]], g=0.3)
for k in range(5): n(WT(1, 'tiny') + k * 0.32, CELESTA, 93 if k % 2 == 0 else 89, 80, 0.15, 0.22)
x = WT(1, 'Computers'); chord(x, TREM, [45, 48, 52], 75, B[2] - x, 0.22)
for w in ['crashing', 'rebooting', 'over']: n(WT(1, w), PIZZ, 33, 110, 0.4, 0.45)

# ---- THE WORM (B2..B3): investigation ostinato, a stab on "worm", a sting on "USB"
ostinato(B[2], B[3] - 0.1, 112, [50, 53, 57, 56, 57, 53, 50, 49], prog=PIZZ, vel=100, g=0.42, bass=[38, 38, 34, 36])
hit(WT(2, 'worm'), 38, 0.9); chord(WT(2, 'U'), HORN, [62, 65, 69], 100, 1.2, 0.35); n(WT(2, 'enough'), TIMP, 38, 115, 0.6, 0.45)

# ---- ZERO-DAYS (B3..B4): driving strings, four timpani hits for the four holes, brass on "stolen"
ostinato(B[3], B[4] - 0.2, 126, [50, 50, 62, 50, 50, 60, 50, 57], prog=STR, vel=100, g=0.28, step=0.25, bass=[38, 41, 43, 38], pulse=(SNARE, 38, 0.18))
x = WT(3, 'four'); [n(x + k * 0.22, TIMP, 38 + k * 2, 120, 0.4, 0.5) for k in range(4)]
hit(WT(3, 'spent'), 38, 1.0); hit(WT(3, 'stolen'), 36, 0.9); chord(WT(3, 'trusted'), BSN, [44, 50, 55], 90, 1.2, 0.35)

# ---- THE SPREAD (B4..B5): a pulsing, widening cue; horns climb as the count rises, a hit on "Iran"
ostinato(B[4], B[5] - 0.2, 120, [45, 52, 57, 52, 45, 52, 59, 52], prog=STR, vel=95, g=0.26, step=0.5, bass=[33, 33, 29, 31], pulse=(TIMP, 33, 0.25))
x = WT(4, 'infected'); riser(x, WT(4, 'computers'), 45, 0.35); chord(WT(4, 'computers'), HORN, [57, 61, 64], 105, 1.2, 0.4)
hit(WT(4, 'Iran'), 33, 1.1)

# ---- HUNTING (B5..B6): sudden quiet, a low drone and a ticking clock; stabs on each maker
x = B[5]; n(x, CBASS, 31, 95, B[6] - x, 0.45); chord(x, SLOW, [55, 58, 62], 55, B[6] - x, 0.2)
for k in range(int((B[6] - x) / 0.5)): n(x + k * 0.5, CELESTA, 91 if k % 2 == 0 else 86, 55, 0.12, 0.13)
n(WT(5, 'nothing'), HARP, 79, 90, 1.0, 0.3); chord(WT(5, 'Siemens'), TBN, [31, 38], 95, 1.4, 0.4)
n(WT(5, 'Finland'), TIMP, 31, 110, 0.6, 0.45); hit(WT(5, 'Iran'), 31, 1.0)

# ---- NATANZ (B6..B7): the reveal. Choir and full brass on "Natanz", then a vast slow chorale under the desert
x = WT(6, 'Natanz'); hit(x - 0.05, 34, 1.2); chord(x, CHOIR, [46, 53, 58, 62], 100, B[7] - x, 0.3); chord(x, TBN, [34, 41], 90, B[7] - x, 0.35)
riser(WT(6, 'Experts'), x - 0.1, 46, 0.35)
ostinato(WT(6, 'thousands'), B[7] - 0.1, 132, [70, 74, 77, 74], prog=CELESTA, vel=70, g=0.12, step=0.25)

# ---- THE ATTACK (B7..B8): a creeping ostinato that speeds up with the rotors, then sags on "dropped", then again
x0 = WT(7, 'pushed'); ostinato(B[7], x0, 100, [46, 49, 53, 52], prog=PIZZ, vel=95, g=0.4, bass=[34, 34], bassg=0.4)
ostinato(x0, WT(7, 'dropped') - 0.2, 150, [58, 58, 70, 58, 61, 58, 69, 58], prog=STR, vel=110, g=0.3, step=0.25, bass=[34, 37], pulse=(TAIKO, 41, 0.35))
x = WT(7, 'dropped')
for k in range(8): n(x + k * 0.14, TREM, 70 - k * 4, 100, 0.22, 0.3)
n(x + 1.0, CBASS, 22, 110, 1.4, 0.55); hit(WT(7, 'again') - 0.05, 34, 1.0)

# ---- 21 SECONDS (B8..B9): a music-box loop that repeats exactly (the replay), tension underneath, the burst
x = B[8]; chord(x, TREM, [46, 49, 53], 70, B[9] - x, 0.2); loop = [82, 86, 89, 86, 82, 81]
x1 = WT(8, 'During')
for r in range(8):
    for k, key in enumerate(loop): n(x1 + r * 0.9 + k * 0.15, CELESTA, key, 80, 0.14, 0.2)
x = WT(8, 'fine') - 0.1; hit(x, 30, 1.4); chord(x, CHOIR, [42, 49, 54], 110, 1.8, 0.3)

# ---- 1,000 (B9..B10): sombre: low brass chorale, timpani on the numbers
x = B[9] + 0.6; chord(x, SLOW, [41, 48, 53], 70, B[10] - x, 0.28)
for k, (keys, d) in enumerate([([41, 48], 2.0), ([39, 46], 2.0), ([37, 44], 2.0), ([36, 43], 3.0)]): chord(x + k * 2.2, TBN, keys, 80, d, 0.35)
n(WT(9, 'thousand'), TIMP, 29, 120, 0.6, 0.5); n(WT(9, 'nine'), TIMP, 29, 110, 0.6, 0.45)

# ---- WHO MADE IT? (B10..B11): a spy cue: muted brass and pizzicato bass, a stab on the code name
ostinato(B[10], B[11] - 0.2, 104, [38, 41, 45, 44, 45, 41, 38, 37], prog=PIZZ, vel=100, g=0.42, bass=[26, 26, 25, 24], bassg=0.45)
for w in ['American', 'Israeli']: chord(WT(10, w), HORN, [62, 65, 69], 95, 0.9, 0.3)
x = WT(10, 'Olympic'); hit(x, 38, 1.0); chord(x, CHOIR, [62, 69, 74], 100, 1.6, 0.25)
n(WT(10, 'Neither'), CBASS, 26, 110, 2.0, 0.5)

# ---- THE ESCAPE (B11..B12): a run: fast strings, the car leaving, horns as it spreads across the world
ostinato(B[11], B[12] - 0.2, 140, [45, 45, 57, 45, 48, 45, 55, 45], prog=STR, vel=105, g=0.28, step=0.25, bass=[33, 36], pulse=(SNARE, 38, 0.18))
hit(WT(11, 'error'), 33, 1.0); x = WT(11, 'copy'); riser(x - 0.5, x, 45, 0.35); chord(x, BRASS, [57, 61, 64], 110, 1.4, 0.35)

# ---- A NEW KIND OF WAR (B12..B13): wide, ominous chorale
x = B[12]; chord(x, CHOIR, [38, 45, 50, 53], 90, B[13] - x, 0.26); chord(x, TBN, [26, 33], 85, B[13] - x, 0.35); hit(WT(12, 'bombs'), 26, 1.1)

# ---- THE LESSON (B13..): reflective piano over strings, stingers on the tips, a last hit on "crime"
arp(B[13], T - 1.2, 84, [[50, 53, 57], [46, 50, 53], [43, 46, 50], [45, 49, 52]], g=0.33, padg=0.26)
for w in ["don't", 'install']: n(WT(13, w), CELESTA, 86, 100, 0.8, 0.28)
x = WT(13, 'Follow'); riser(x - 0.4, x + 0.2, 50, 0.3)
x = WT(13, 'crime'); hit(x, 38, 1.0); chord(x, TREM, [38, 50, 53, 57], 95, T - x, 0.35)

mix = reverb(out, SR, 1.8, 0.24)[: int(T * SR)]; mix /= np.abs(mix).max() + 1e-9
sf.write(f'{EP}/music.wav', mix.astype(np.float32), SR); print('music', round(T, 1), 's')
