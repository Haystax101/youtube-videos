"""Score for the video poker bug (GeneralUser GS soundfont): a Vegas heist score, one cue per scene.
Hook: tremolo strings and timpani, brass on the jackpot and the FBI. Vegas, 2009: a slow lounge walk (bass, ride,
Rhodes, a lazy muted trumpet). The trick: a sneaky heist groove with a vibes ping on every step and a big brass
payoff on the 8,200. The crew: an up-tempo swing with brass shouts for each casino. Five jackpots: glockenspiel
fanfares, then security drops the floor out. The lab: a procedural piano pulse. The raid: taiko and strings.
The charges: low brass. The court: held strings, hits on each dismissal, a major-key release. The lesson: the
groove comes back, bright. Times are VOICE seconds (timeline.json); mix.py inserts the 1 s rewind after the hook.
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

# ---- HOOK (0..B1): the 8,200 win and the FBI. Tremolo strings, timpani pulse, brass and glockenspiel
chord(0, TREM, [38, 50, 53, 57], 82, B[1] - 0.2, 0.22)
for k in range(int(B[1] / 0.5)): n(0.05 + k * 0.5, TIMP, 38, 95 if k % 2 == 0 else 70, 0.35, 0.3)
arp(WT(0, 'jackpot'), [74, 77, 81, 86, 89], 0.06, GLOCK, 110, 0.32); chord(WT(0, 'jackpot'), BRASS, [50, 53, 57, 62], 110, 0.8, 0.35)
hit(WT(0, 'FBI'), 38, 1.0); riser(WT(0, 'called'), B[1] - 0.05, 50, 0.4)

# ---- VEGAS, 2009 (B1..B2): a slow lounge walk, a lazy muted trumpet, then mystery on "noticed"
x1 = WT(1, 'noticed') - 0.05
groove(B[1] + 0.05, x1, 92, Dm2, g=0.9, snare=True)
for k, (key, dt, du) in enumerate([(62, 0.0, 0.5), (65, 0.55, 0.4), (64, 1.0, 0.9), (60, 2.2, 1.2)]): n(WT(1, 'John') + dt, MUTE, key, 85, du, 0.3)
for k, (key, dt, du) in enumerate([(57, 0.0, 0.6), (58, 0.7, 0.5), (57, 1.3, 1.4)]): n(WT(1, 'lost') + dt, MUTE, key, 80, du, 0.3)
n(WT(1, 'million'), CBASS, 34, 100, 1.2, 0.5)
chord(x1, TREM, [50, 53, 56, 59], 75, B[2] - x1, 0.3); arp(x1 + 0.1, [86, 89, 92, 95], 0.12, CELESTA, 90, 0.25); n(x1, TIMP, 38, 100, 1.0, 0.5)

# ---- THE TRICK (B2..B3): the heist groove, a vibes ping on every step
groove(B[2], B[3] - 0.05, 118, Dm, g=1.0, kick=True)
for w, key in [('Play', 74), ('win', 81), ('Switch', 77), ('doubleup', 79), ('Feed', 81), ('raise', 84), ('first', 86)]:
    try: n(WT(2, w), VIBES, key, 110, 0.8, 0.4)
    except KeyError: pass
chord(WT(2, 'dollars'), MUTE, [62, 65, 69], 95, 0.4, 0.3)

# ---- THE PAYOUT (B3..B4): groove keeps going, a big brass payoff on "pays", horns climb to 8,200
groove(B[3], WT(3, 'pays') - 0.05, 118, Dm, g=1.0, kick=True)
x = WT(3, 'pays'); hit(x, 38, 0.8); arp(x, [74, 77, 81, 86, 89, 93], 0.06, GLOCK, 115, 0.35); d(x, CRASH, 100, 0.25)
groove(x + 0.5, B[4] - 0.1, 118, [(41, [0, 4, 7, 11]), (46, [0, 4, 7, 11])], g=0.9, kick=True)
for k, w in enumerate(['Eight', 'hundred', 'twenty', 'becomes']): chord(WT(3, w), HORN, [62 + k * 2, 65 + k * 2, 69 + k * 2], 100, 0.5, 0.3)
x = WT(3, 'thousand'); chord(x, BRASS, [53, 57, 60, 65, 69], 118, 1.4, 0.45); d(x, CRASH, 110, 0.3); n(x, TIMP, 41, 120, 1.0, 0.6)

# ---- THE CREW (B4..B5): up-tempo swing, brass shouts for each casino, a turn for the Meadows
groove(B[4], WT(4, 'Back') - 0.1, 132, Fmaj, g=1.0, kick=True)
n(WT(4, 'Nestor'), SAX, 69, 100, 0.5, 0.3); n(WT(4, 'Nestor') + 0.5, SAX, 72, 100, 0.8, 0.3)
for w, ks in [('Rio', [65, 69, 72]), ('Wynn', [67, 70, 74]), ('Golden', [69, 72, 77])]: chord(WT(4, w), BRASS, ks, 118, 0.45, 0.4); d(WT(4, w), CRASH, 90, 0.18)
x = WT(4, 'Back'); chord(x, SLOW, [50, 53, 57], 70, 1.6, 0.25); groove(WT(4, 'Meadows') - 0.1, B[5] - 0.1, 132, Dm, g=0.95, kick=True)
x = WT(4, 'four'); chord(x, BRASS, [50, 53, 57, 62], 115, 0.9, 0.4); n(x, TIMP, 38, 115, 0.8, 0.5)

# ---- FIVE JACKPOTS (B5..B6): the groove pushes on, five glockenspiel fanfares, then security drops the floor
groove(B[5], WT(5, 'That') - 0.05, 136, Dm, g=1.0, kick=True)
j0 = WT(5, 'five') - 0.1
for k in range(5): t = j0 + k * 0.32; arp(t, [74 + k * 2, 78 + k * 2, 81 + k * 2, 86 + k * 2], 0.05, GLOCK, 112, 0.28); d(t, CRASH, 80, 0.12)
x = WT(5, 'That'); chord(x, TREM, [50, 53, 56], 80, WT(5, 'Security') - x, 0.3); n(x, CELESTA, 89, 90, 0.8, 0.25)
x = WT(5, 'Security'); hit(x, 34, 0.9); chord(x, TREM, [34, 46, 49], 90, B[6] - x, 0.35)

# ---- THE LAB (B6..B7): procedural piano pulse over pizzicato, a stinger on the bug
x0 = B[6] + 0.05
b = 60 / 108; t = x0; i = 0
while t < B[7] - 0.15:
    n(t, PIANO, [62, 62, 65, 62, 60, 62, 57, 62][i % 8], 85 - (0 if i % 4 == 0 else 12), b * 0.45, 0.24)
    if i % 2 == 0: n(t, PIZZ, [38, 38, 34, 36][(i // 8) % 4], 95, b, 0.4)
    t += b / 2; i += 1
chord(x0, SLOW, [50, 57], 60, B[7] - x0, 0.2)
for w in ['opened', 'chip']: n(WT(6, w), CELESTA, 86, 100, 0.5, 0.25)
x = WT(6, 'bug'); hit(x, 38, 0.9); chord(x, TREM, [50, 53, 56, 59], 100, B[7] - x, 0.3)

# ---- THE RAID (B7..B8): taiko and fast strings build to the door
x = B[7]; chord(x, TREM, [38, 45, 50, 53], 90, WT(7, 'door') - x, 0.35)
b = 60 / 140; t = WT(7, 'until') - 0.1; k = 0
while t < WT(7, 'door') - 0.05: n(t, TAIKO, 45, 90 + min(30, k * 3), 0.3, 0.38); t += b / 2; k += 1
x = WT(7, 'door'); hit(x, 38, 1.2); d(x, CRASH, 115, 0.3); chord(x + 0.3, STR, [38, 50, 53, 57], 100, B[8] - x - 0.3, 0.3)

# ---- THE CHARGES (B8..B9): low brass and timpani, then something lighter on "But"
x = B[8]; chord(x, TBN, [38, 45], 95, 2.2, 0.4); n(x, TIMP, 38, 115, 1.0, 0.5); chord(x, SLOW, [50, 53, 57], 65, WT(8, 'But') - x, 0.25)
for w in ['wire', 'fraud', 'computer', 'hacking']: n(WT(8, w), TIMP, 38, 105, 0.5, 0.4)
x = WT(8, 'hacking'); chord(x, BRASS, [50, 53, 56], 110, 0.9, 0.4)
x = WT(8, 'FBI'); n(x, CBASS, 34, 100, 1.5, 0.45)
x = WT(8, 'But'); b = 60 / 120; t = x; i = 0
while t < B[9] - 0.1:
    n(t, PIZZ, [62, 65, 69, 67, 65, 62, 60, 62][i % 8], 92, b * 0.4, 0.38)
    if i % 4 == 0: n(t, PIZZ, [38, 34, 36, 38][(i // 4) % 4], 100, b, 0.45)
    t += b / 2; i += 1
for w in ['pressed', 'buttons', 'machine', 'gave']: n(WT(8, w), VIBES, 81, 100, 0.5, 0.3)

# ---- THE VERDICT (B9..B10): held strings, a hit on each dismissal, a major-key release
x = B[9]; chord(x, SLOW, [50, 53, 57], 70, WT(9, 'thrown') - x, 0.3); n(x, CBASS, 38, 90, WT(9, 'thrown') - x, 0.35)
x = WT(9, 'thrown'); hit(x, 41, 1.0); chord(x + 0.2, SLOW, [53, 57, 60], 75, WT(9, 'dropped') - x, 0.3)
x = WT(9, 'dropped'); hit(x, 46, 1.0)
x = WT(9, 'Neither'); chord(x, BRASS, [53, 57, 60, 65], 115, 1.6, 0.45); chord(x, STR, [41, 53, 57, 60, 65], 100, B[10] - x, 0.32); d(x, CRASH, 100, 0.25); n(x, TIMP, 41, 120, 1.0, 0.5)

# ---- THE LESSON (B10..): the groove comes back bright, a riser into the follow line, a final hit
groove(B[10] + 0.05, WT(10, 'Follow') - 0.3, 124, Fmaj, g=0.9, kick=True)
for w, key in [('fixed', 77), ('bugs', 81), ('update', 84)]: n(WT(10, w), VIBES, key, 110, 0.8, 0.35)
x = WT(10, 'Follow'); riser(x - 0.5, x + 0.1, 53, 0.3); chord(x, BRASS, [53, 57, 60, 65], 112, 1.2, 0.4); d(x, CRASH, 100, 0.25)
groove(x + 0.6, T - 0.6, 124, Fmaj, g=0.7, kick=True)
x = WT(10, 'heists'); hit(x, 41, 0.9); chord(x, TREM, [41, 53, 57, 60], 95, T - x, 0.3)

mix = reverb(out, SR, 1.6, 0.2)[: int(T * SR)]; mix /= np.abs(mix).max() + 1e-9
sf.write(f'{EP}/music.wav', mix.astype(np.float32), SR); print('music', round(T, 1), 's')
