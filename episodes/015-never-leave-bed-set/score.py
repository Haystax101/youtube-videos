"""Orchestral score for 015 never-leave-bed (GeneralUser GS soundfont, one orchestra, a cue per scene).
Times are VOICE seconds (timeline.json); mixbed.py inserts the 1 s rewind after the hook.
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
        if i == bi and w['w'].strip('.,!?\'"').lower() == word.lower():
            c += 1
            if c == n: return w['s']
    raise KeyError(word)
F = SoundFont(f'{REPO}/models/GeneralUser-GS.sf2', SR); out = np.zeros(int((T + 4) * SR))
STR, SLOW, PIZZ, TREM, TIMP, BSN, CLAR, FLUTE, OBOE, GLOCK, HIT, BRASS, HORN, TPT, TBN, CELLO, CHOIR, TAIKO, HARP = 48, 49, 45, 44, 47, 70, 71, 73, 68, 9, 55, 61, 60, 56, 57, 42, 52, 116, 46
def n(t, prog, key, vel, dur, gain=1.0):
    if t < 0 or t > T: return
    a = F.note(prog, key, int(min(127, max(1, vel))), dur) * gain; s = int(t * SR); e = min(len(out), s + len(a)); out[s:e] += a[:e - s]
def chord(t, prog, keys, vel, dur, gain=1.0):
    for k in keys: n(t, prog, k, vel, dur, gain)

# ---- HOOK (0 .. B1): tense low tremolo, heartbeat timpani, hit on "thirty"
h1 = B[1]
chord(0, TREM, [38, 45, 50], 90, h1, 0.6); chord(0, SLOW, [62, 65], 70, h1, 0.35)
t = 0.1
while t < h1 - 0.3: n(t, TIMP, 38, 105, 0.3, 0.8); n(t + 0.22, TIMP, 38, 80, 0.3, 0.6); t += 0.85
x = WT(0, 'thirty'); n(x, HIT, 50, 120, 1.0, 0.9); chord(x, BRASS, [38, 45, 50, 53], 115, 1.2, 0.6); n(x, TAIKO, 36, 120, 0.8, 0.9)
for k in range(8): n(x + 0.6 + k * 0.08, STR, 62 + k * 2, 80 + k * 4, 0.12, 0.5)   # rising swirl into the rewind

# ---- DAY 1 (B1..B2): comic pizzicato + bassoon, glock sparkle on "Bliss"
b = 60 / 132; t = B[1]; i = 0; tune = [65, 69, 72, 69, 70, 69, 67, 65]
while t < B[2] - 0.1:
    ch = [[41, 45, 48], [36, 40, 43]][(i // 4) % 2]
    n(t, PIZZ, ch[0] if i % 2 == 0 else ch[2], 100, b * 0.5, 0.8); n(t, PIZZ, ch[1] + 12, 80, b * 0.4, 0.45)
    if i % 2 == 0: n(t, BSN, tune[(i // 2) % 8] - 12, 90, b * 1.6, 0.55)
    t += b; i += 1
for k, key in enumerate([84, 88, 91, 96, 100]): n(WT(1, 'Bliss') + k * 0.06, GLOCK, key, 100, 0.8, 0.55)
chord(WT(1, 'Bliss'), STR, [65, 69, 72, 77], 95, 1.2, 0.4)

# ---- DALLAS 1966 (B2..B4): suspense march, low string ostinato + snare-like timpani; doctor's line; faint
b = 60 / 112; t = B[2]; i = 0
while t < WT(3, 'spins'):
    root = [38, 38, 41, 36][(i // 8) % 4]
    n(t, STR, root + (0 if i % 2 == 0 else 7), 95, b * 0.45, 0.6); n(t, CELLO, root - 12, 90, b * 0.45, 0.5)
    if i % 4 == 0: n(t, TIMP, root, 100, 0.3, 0.6)
    if i % 8 == 4: chord(t, HORN, [root + 12, root + 19], 85, b * 3, 0.35)
    t += b; i += 1
n(B[2], HIT, 50, 110, 0.8, 0.6)
sp = WT(3, 'spins'); chord(sp - 1.0, TREM, [61, 62, 66, 67], 100, 1.1, 0.5)          # dizzy cluster
for k in range(10): n(sp - 0.6 + k * 0.06, HARP, 84 - k * 3, 100, 0.3, 0.45)            # falling harp
n(sp + 0.3, TIMP, 36, 127, 1.2, 1.0); n(sp + 0.3, HIT, 43, 120, 1.0, 0.8)

# ---- TREADMILL + HEART (B4..B6): driving ostinato, brass stabs on "crashed" / "third"
b = 60 / 150; t = B[4]; i = 0
while t < B[6] - 0.05:
    root = [40, 40, 36, 38][(i // 8) % 4]
    n(t, STR, root + 12 + (7 if i % 2 else 0), 100, b * 0.4, 0.55); n(t, CELLO, root - 12, 95, b * 0.4, 0.5)
    if i % 4 == 0: n(t, TAIKO, 36, 110, 0.4, 0.55)
    t += b; i += 1
for w, bi in [('crashed', 4), ('third', 5)]: x = WT(bi, w); chord(x, BRASS, [40, 47, 52, 55], 120, 0.8, 0.7); n(x, TIMP, 40, 125, 0.8, 0.9); n(x, HIT, 52, 115, 0.8, 0.6)
t = B[5]
while t < B[6] - 0.2: n(t, TIMP, 33, 115, 0.3, 0.8); n(t + 0.2, TIMP, 33, 90, 0.3, 0.6); t += 0.8   # heartbeat

# ---- MONTH 2 (B6..B7): slow cello lament, bone crunch hit
chord(B[6], SLOW, [50, 53, 57], 75, B[7] - B[6], 0.5); n(B[6], CELLO, 38, 90, B[7] - B[6], 0.6)
for k, key in enumerate([62, 60, 58, 57]): n(B[6] + 0.3 + k * 0.8, OBOE, key, 85, 0.9, 0.45)
n(WT(6, 'bones'), HIT, 48, 110, 0.6, 0.5)

# ---- NASA $18,000 (B7..B8): playful pizzicato + clarinet, cash glock
b = 60 / 140; t = B[7]; i = 0
while t < B[8] - 0.1:
    ch = [[43, 47, 50], [48, 52, 55]][(i // 4) % 2]
    n(t, PIZZ, ch[i % 3], 100, b * 0.5, 0.7); n(t, PIZZ, ch[(i + 1) % 3] + 12, 85, b * 0.4, 0.4)
    if i % 2 == 0 and i >= 4: n(t, CLAR, [67, 71, 74, 72, 71, 69, 67, 74][(i // 2) % 8], 90, b * 1.5, 0.5)
    t += b; i += 1
x = WT(7, 'eighteen')
for k, key in enumerate([79, 84, 88, 91, 96]): n(x + k * 0.05, GLOCK, key, 110, 0.8, 0.6)
chord(x, BRASS, [55, 59, 62, 67], 110, 0.6, 0.5)

# ---- 30 YEARS LATER (B8..B9): nostalgic slow strings + horn; comic bassoon on the old man's line
chord(B[8], SLOW, [45, 52, 57, 60], 80, B[9] - B[8], 0.45); n(B[8], HORN, 64, 85, 2.0, 0.45); n(B[8] + 2.0, HORN, 62, 85, 1.6, 0.4)
x = WT(8, 'Not'); n(x + 0.9, BSN, 43, 110, 0.5, 0.8); n(x + 1.35, BSN, 42, 105, 0.5, 0.8); n(x + 1.8, BSN, 41, 100, 0.9, 0.8)
y = WT(8, 'Three'); chord(y, STR, [57, 60, 64], 90, B[9] - y, 0.45); n(y, TIMP, 45, 100, 0.6, 0.5)

# ---- THE TWIST (B9..): record stop, then heroic brass march rising to a full resolve at the end
x = B[9]; n(x, HIT, 55, 120, 0.8, 0.8); n(x, TIMP, 43, 125, 0.8, 0.9)
b = 60 / 128; t = x + 0.6; i = 0; theme = [67, 72, 74, 76, 74, 72, 79, 76]
prog = [[48, 52, 55], [53, 57, 60], [55, 59, 62], [48, 52, 55]]
while t < T - 1.2:
    ch = prog[(i // 8) % 4]
    n(t, STR, ch[i % 3] + 12, 100, b * 0.45, 0.45); n(t, CELLO, ch[0] - 12, 95, b * 0.5, 0.45)
    if i % 2 == 0: n(t, TIMP, ch[0] - 12 if ch[0] > 48 else ch[0], 95, 0.3, 0.45)
    if i % 4 == 0: n(t, TPT, theme[(i // 4) % 8], 105, b * 3.6, 0.45); n(t, HORN, theme[(i // 4) % 8] - 12, 95, b * 3.6, 0.35)
    if i % 8 == 0: chord(t, TBN, [ch[0], ch[2]], 95, b * 7.5, 0.35)
    t += b; i += 1
x = B[11]; chord(x, CHOIR, [60, 64, 67, 72], 100, T - x, 0.4); chord(x, BRASS, [48, 55, 60, 64], 115, 1.5, 0.6); n(x, HIT, 48, 120, 1.0, 0.7)
chord(T - 1.3, STR, [48, 55, 60, 64, 72], 110, 1.6, 0.6); n(T - 1.3, TIMP, 36, 125, 1.5, 0.9)
mix = reverb(out, SR, 1.8, 0.22)[: int(T * SR)]; mix /= np.abs(mix).max() + 1e-9
sf.write(f'{EP}/music.wav', mix.astype(np.float32), SR); print('music', round(T, 1), 's')
