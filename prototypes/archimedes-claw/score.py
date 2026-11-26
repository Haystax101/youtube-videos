"""Original orchestral score for the Archimedes claw Short, played on real instrument samples
(GeneralUser GS soundfont) through pipeline/sf2.py. One palette (strings, brass, horns, timpani,
taiko, choir, woodwinds) with a different cue per scene. All times are VIDEO seconds.
Usage: python3 score.py EP_DIR  -> EP_DIR/music.wav"""
import sys, json, numpy as np, soundfile as sf
import os; REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')); sys.path.insert(0, f'{REPO}/pipeline')
from sf2 import SoundFont, reverb
SR = 24000
here = sys.argv[1]
tl = json.load(open(f'{here}/timeline.json'))
HOOK_END, RW = tl['beats'][1]['start'], 1.0
W = lambda w: w + RW                      # world time -> video time
GAP1, GAP2 = 1.2, 0.8
T_END = tl['duration'] + RW + GAP1 + GAP2 + 1.2
F = SoundFont(f'{REPO}/models/GeneralUser-GS.sf2', SR)
out = np.zeros(int((T_END + 4) * SR))
STR, SLOW, TREM, PIZZ, CELLO, TIMP, CHOIR, HIT, TPT, TBN, TUBA, HORN, BRASS, OBOE, BSN, CLAR, FLUTE, TAIKO = 48, 49, 44, 45, 42, 47, 52, 55, 56, 57, 58, 60, 61, 68, 70, 71, 73, 116


def n(t, prog, key, vel, dur, gain=1.0, bank=0, rel=None):
    if t < 0 or t > T_END:
        return
    a = F.note(prog, key, int(min(127, vel)), dur, bank, rel) * gain
    s = int(t * SR); e = min(len(out), s + len(a)); out[s:e] += a[: e - s]


def env_gain(t, a, b, fade=0.4):
    return float(np.clip(min((t - a) / fade + 1, (b - t) / fade + 1), 0, 1))


CH = {'Dm': [50, 53, 57], 'Bb': [46, 50, 53], 'C': [48, 52, 55], 'Gm': [43, 46, 50], 'A': [45, 49, 52], 'F': [41, 45, 48], 'D': [50, 54, 57]}

# ---- cue 0: cold open (0 .. HOOK_END): low tremolo, timpani roll building, brass swell on "lift" ----
for k, key in enumerate([38, 50, 53, 57]):
    n(0.0, TREM, key, 70 + k * 5, HOOK_END - 0.1, 0.9)
for i in range(int(HOOK_END / 0.09)):
    t = i * 0.09; n(t, TIMP, 38, 40 + 70 * (t / HOOK_END) ** 2, 0.2, 0.7)
n(3.2, BRASS, 50, 95, 2.2); n(3.2, BRASS, 57, 95, 2.2); n(3.2, TBN, 38, 100, 2.2); n(3.2, CHOIR, 62, 80, 2.2); n(3.2, CHOIR, 69, 80, 2.2)
n(HOOK_END - 0.05, HIT, 62, 110, 0.6, 0.9)

# ---- cue 1: the march (after the rewind .. the claw swings out) ----
BPM = 100; beat = 60 / BPM; bar = beat * 4
c1a, c1b = HOOK_END + RW, W(28.0)
prog = ['Dm', 'Dm', 'Bb', 'C', 'Dm', 'Gm', 'A', 'Dm']
t = c1a; b = 0
melody = [(69, 1), (74, 1.5), (76, .5), (77, 1), (76, 1), (74, 2), (72, 1), (69, 1), (70, 1.5), (69, .5), (67, 1), (65, 1), (64, 2), (69, 2)]
mel_start = W(15.4)
while t < c1b:
    ch = CH[prog[b % len(prog)]]; r = ch[0]; g = env_gain(t, c1a, c1b)
    pat = [r, r, r + 12, r, r + 7, r, r + 12, r + 10]
    for k in range(8):
        n(t + k * beat / 2, STR, pat[k], 92 if k % 2 == 0 else 78, beat / 2 * 0.9, 0.7 * g)
    n(t, TBN, r - 12, 96, bar * 0.95, 0.55 * g); n(t, TIMP, r - 12 if r - 12 > 36 else r, 110, 0.5, 0.9 * g)
    n(t, BRASS, ch[1] + 12, 90, beat * 0.9, 0.55 * g); n(t, BRASS, ch[2] + 12, 90, beat * 0.9, 0.55 * g)
    for k in (0, 2):
        n(t + k * beat, TAIKO, 50, 120, 0.4, 0.8 * g)
    if b % 4 == 3:
        for k in range(4): n(t + 3 * beat + k * beat / 4, TAIKO, 50, 90 + k * 8, 0.3, 0.7 * g)
    if t >= W(15.0):  # choir joins when Archimedes appears
        for key in ch: n(t, CHOIR, key + 12, 72, bar * 0.98, 0.45 * g)
    t += bar; b += 1
# heroic horn theme for Archimedes
t = mel_start
for key, d in melody + melody[:8]:
    if t > c1b - 0.3: break
    n(t, HORN, key - 12, 100, d * beat * 0.95, 0.85); n(t, HORN, key, 85, d * beat * 0.95, 0.45); t += d * beat

# ---- cue 2: the claw (swing .. splash): tremolo rising, stabs on the grab, choir on the lift ----
c2a, c2b = W(28.0), W(37.3)
for k, key in enumerate([38, 45, 50, 53]):
    n(c2a, TREM, key, 80, c2b - c2a, 0.8)
t = c2a
while t < W(33.4):
    n(t, TIMP, 38, 60 + 40 * (t - c2a) / (W(33.4) - c2a), 0.2, 0.6); t += 0.12
for at in (W(32.25), W(32.25) + beat / 2):
    n(at, BRASS, 50, 120, 0.35); n(at, BRASS, 57, 120, 0.35); n(at, TBN, 38, 120, 0.35); n(at, TAIKO, 50, 127, 0.4)
rise = [50, 52, 53, 55, 57, 58, 60, 62]
for k, key in enumerate(rise):
    at = W(33.45) + k * (W(35.6) - W(33.45)) / len(rise)
    n(at, STR, key + 12, 100, 0.3, 0.8); n(at, BRASS, key, 95 + k * 3, 0.3, 0.6)
n(W(35.6), CHOIR, 62, 110, 1.05); n(W(35.6), CHOIR, 69, 110, 1.05); n(W(35.6), BRASS, 50, 120, 1.0); n(W(35.6), BRASS, 57, 120, 1.0); n(W(35.6), TBN, 38, 125, 1.0)
for k in range(5): n(W(35.6) + k * 0.2, TIMP, 38, 120, 0.3, 0.9)
n(W(37.24), HIT, 50, 127, 0.8, 1.0); n(W(37.24), TIMP, 38, 127, 1.0); n(W(37.24), TAIKO, 50, 127, 0.8)

# ---- cue 3: lighter, same orchestra (second lift, the rope, the cups) ----
c3a, c3b = W(37.8), W(55.0)
BPM3 = 116; b3 = 60 / BPM3; t = c3a; i = 0
bass3 = ['Dm', 'Dm', 'Gm', 'A']
tune = [74, 72, 70, 69, 70, 72, 74, 69, 77, 76, 74, 72, 70, 69, 67, 69]
while t < c3b:
    g = env_gain(t, c3a, c3b); ch = CH[bass3[(i // 8) % 4]]
    n(t, PIZZ, ch[0] - 12 if i % 2 == 0 else ch[2] - 12, 95, b3 * 0.5, 0.8 * g)
    if i % 2 == 1: n(t, PIZZ, ch[1], 80, b3 * 0.4, 0.6 * g)
    if (i // 16) % 2 == 1: n(t, BSN if i % 4 < 2 else CLAR, tune[i % 16] - 12, 90, b3 * 0.8, 0.6 * g)
    if i % 8 == 0: n(t, TIMP, ch[0] - 12 if ch[0] - 12 > 36 else ch[0], 80, 0.3, 0.5 * g)
    t += b3; i += 1
for at in (W(39.3), W(43.47)):
    n(at, BRASS, 50, 110, 0.4, 0.8); n(at, TAIKO, 50, 120, 0.4)
n(W(43.47), HIT, 50, 120, 0.7, 0.8)
n(W(46.5), FLUTE, 81, 90, 0.25); n(W(46.75), FLUTE, 76, 90, 0.25); n(W(47.0), FLUTE, 69, 90, 0.4)   # the rope
for k in range(6): n(W(48.8) + k * 0.12, STR, 62 + k * 2, 100, 0.12, 0.7)                              # the run

# ---- cue 4: night, the fall of the city (slow strings, choir, cello) ----
c4a, c4b = W(55.0), W(67.95)
slow = ['Dm', 'Bb', 'Gm', 'A', 'Dm', 'Bb', 'Gm', 'A']
seg = (c4b - c4a) / len(slow)
for k, c in enumerate(slow):
    t = c4a + k * seg; ch = CH[c]
    for key in ch: n(t, SLOW, key, 80, seg * 1.02, 0.8)
    n(t, SLOW, ch[0] - 12, 85, seg * 1.02, 0.6); n(t, CHOIR, ch[2] + 12, 70, seg * 1.02, 0.35)
cello = [(62, 2), (65, 1), (64, 1), (62, 2), (60, 2), (58, 3), (57, 1), (55, 2), (57, 2)]
t = c4a + 1.0
for key, d in cello:
    if t > c4b: break
    n(t, CELLO, key - 12, 95, d * 0.75 * 0.97, 0.9); t += d * 0.75
n(W(60.0), TIMP, 38, 110, 1.2); n(W(60.0), TAIKO, 48, 110, 0.8)
n(W(64.11), TIMP, 38, 127, 1.5); n(W(64.11), BRASS, 50, 100, 1.4, 0.6); n(W(64.11), BRASS, 53, 100, 1.4, 0.6)

# ---- cue 5: the payoff (heroic theme, quietly, resolving to D major) ----
c5a = W(67.95); t = c5a; beat5 = 60 / 84
for key in CH['Dm']: n(t, SLOW, key, 85, 4 * beat5, 0.8)
for key in CH['Bb']: n(t + 4 * beat5, SLOW, key, 85, 4 * beat5, 0.8)
for key in CH['D'] + [62, 66, 69]: n(t + 8 * beat5, SLOW, key, 90, T_END - (t + 8 * beat5) + 0.5, 0.8)
n(t + 8 * beat5, TIMP, 38, 110, 1.5)
for key, d in melody[:7]:
    n(t, HORN, key - 12, 95, d * beat5 * 0.95, 0.8); t += d * beat5

mix = reverb(out, SR, 2.4, 0.3)
mix = mix[: int(T_END * SR)]; mix /= np.abs(mix).max() + 1e-9
# the rewind: the last second of the cold open played backwards, pitched up
s, e = int((HOOK_END - 1.0) * SR), int(HOOK_END * SR); rev = mix[s:e][::-1]; idx = np.clip((np.arange(int(RW * SR)) * 1.0).astype(int), 0, len(rev) - 1)
mix[e:e + len(idx)] = rev[idx] * np.linspace(1, 0.2, len(idx))
sf.write(f'{here}/music.wav', mix.astype(np.float32), SR)
print('music', round(len(mix) / SR, 1), 's')
