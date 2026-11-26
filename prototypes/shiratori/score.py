"""Original score for the Shiratori prison-escape Short (GeneralUser GS samples via pipeline/sf2.py).
A sneaky heist cue (pizzicato + taiko + koto) that climbs with each escape, a cold hush for Abashiri,
a tense ostinato for the soup and the shoulders, a hit on the cigarette, and warm strings for the
kindness payoff. Times are voice seconds (no rewind in this video).
Usage: python3 score.py EP_DIR -> EP_DIR/music.wav"""
import sys, json, os, numpy as np, soundfile as sf
REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')); sys.path.insert(0, f'{REPO}/pipeline')
from sf2 import SoundFont, reverb
SR = 24000
here = sys.argv[1]
tl = json.load(open(f'{here}/timeline.json')); B = tl['beats']
def WT(bi, word, n=1):
    c = 0
    for w in B[bi]['words']:
        if w['w'].strip('.,!?').lower() == word.lower():
            c += 1
            if c == n: return w['s']
    raise KeyError(word)
T_END = tl['duration'] + 0.8
F = SoundFont(f'{REPO}/models/GeneralUser-GS.sf2', SR)
out = np.zeros(int((T_END + 4) * SR))
STR, SLOW, TREM, PIZZ, CELLO, TIMP, CHOIR, HIT, HORN, BRASS, TBN, FLUTE, CELESTA, GLOCK, KOTO, SHAKU, TAIKO, CLAR, OBOE = 48, 49, 44, 45, 42, 47, 52, 55, 60, 61, 57, 73, 8, 9, 107, 77, 116, 71, 68
def n(t, prog, key, vel, dur, gain=1.0):
    if t < 0 or t > T_END: return
    a = F.note(prog, key, int(min(127, vel)), dur) * gain
    s = int(t * SR); e = min(len(out), s + len(a)); out[s:e] += a[: e - s]
def env(t, a, b, fade=0.3): return float(np.clip(min((t - a) / fade + 1, (b - t) / fade + 1), 0, 1))
Dm = [50, 53, 57]; Bb = [46, 50, 53]; C = [48, 52, 55]; A = [45, 49, 52]; Gm = [43, 46, 50]; F_ = [41, 45, 48]

# ---- cue 0: hook, a taiko hit and koto flourish on "escaped", sneaky pizz under, brass stab on "soup"
n(0.05, TAIKO, 60, 120, 0.8, 1.0); n(0.05, HIT, 50, 110, 0.8, 0.7)
for k, key in enumerate([62, 65, 69, 74, 77]): n(WT(0, 'escaped') + k * 0.06, KOTO, key, 105, 0.5, 0.7)
n(WT(0, 'four'), TAIKO, 55, 115, 0.6, 0.9); n(WT(0, 'four') + 0.25, TAIKO, 55, 100, 0.5, 0.7)
n(WT(0, 'soup'), BRASS, 50, 115, 0.6, 0.8); n(WT(0, 'soup'), BRASS, 57, 115, 0.6, 0.8); n(WT(0, 'soup'), TIMP, 38, 120, 0.8)

# ---- cue 1: the escapes (Aomori, Akita): sneaky D minor pizzicato heist with taiko, koto answers
a1, b1 = B[1]['start'] - 0.1, B[3]['start']
beat = 60 / 132; t = a1; i = 0; prog = [Dm, Dm, Bb, A]; walk = [0, 3, 5, 7, 8, 7, 5, 3]
while t < b1:
    g = env(t, a1, b1); ch = prog[(i // 8) % 4]
    n(t, PIZZ, ch[0] - 12 + walk[i % 8] * (1 if i % 16 < 8 else 0), 100, beat * 0.5, 0.8 * g)
    if i % 2 == 1: n(t, PIZZ, ch[2], 80, beat * 0.3, 0.4 * g)
    if i % 4 == 0: n(t, TAIKO, 48, 95, 0.4, 0.55 * g)
    if i % 8 == 6: n(t, KOTO, ch[2] + 12, 95, 0.4, 0.5 * g); n(t + beat * 0.5, KOTO, ch[1] + 12, 90, 0.4, 0.45 * g)
    t += beat; i += 1
n(WT(1, 'wire'), GLOCK, 81, 95, 0.5, 0.5)
n(WT(2, 'Caught'), HIT, 50, 110, 0.6, 0.7); n(WT(2, 'Caught'), TIMP, 38, 115, 0.6, 0.8)
for k in range(7): n(WT(2, 'climbed') + k * 0.11, FLUTE, 62 + [0, 2, 3, 5, 7, 9, 10][k], 90, 0.14, 0.55)
n(WT(2, 'slipped'), CELESTA, 86, 100, 0.8, 0.6); n(WT(2, 'skylight'), KOTO, 74, 100, 0.8, 0.6)

# ---- cue 2: Abashiri: cold, hushed strings and shakuhachi, iron cuffs land with low brass
a2, b2 = B[3]['start'] - 0.05, B[4]['start'] - 0.05
for key in [50, 53, 57, 62]: n(a2, SLOW, key, 82, b2 - a2 + 0.3, 0.55)
n(a2, SLOW, 38, 90, b2 - a2 + 0.3, 0.5); n(a2 + 0.2, SHAKU, 69, 90, 1.4, 0.55); n(a2 + 1.7, SHAKU, 67, 85, 1.6, 0.5)
n(WT(3, 'coldest'), CELESTA, 81, 90, 0.8, 0.5)
n(WT(3, 'iron'), TBN, 38, 110, 1.2, 0.8); n(WT(3, 'iron'), HIT, 50, 105, 0.6, 0.6)

# ---- cue 3: the soup and the shoulders: tense ostinato that builds, a hit on "squeezed out"
a3, b3 = B[4]['start'] - 0.05, B[5]['start']
beat = 60 / 140; t = a3; i = 0
while t < b3:
    g = env(t, a3, b3, 0.2); grow = 0.5 + 0.5 * (t - a3) / (b3 - a3)
    n(t, TREM if i % 8 == 0 else PIZZ, [38, 38, 45, 38, 41, 38, 45, 44][i % 8], 100, beat * (4 if i % 8 == 0 else 0.4), 0.7 * g * grow)
    if i % 4 == 0: n(t, TAIKO, 45, 90 + 20 * grow, 0.4, 0.6 * g * grow)
    t += beat; i += 1
n(WT(4, 'rusted'), BRASS, 49, 105, 0.8, 0.6); n(WT(4, 'dislocated'), HIT, 46, 115, 0.6, 0.8); n(WT(4, 'dislocated'), TIMP, 38, 120, 0.6, 0.9)
n(WT(4, 'squeezed'), TAIKO, 60, 125, 0.6, 1.0)
for key in [62, 66, 69]: n(WT(4, 'out'), BRASS, key - 12, 115, 0.7, 0.7)

# ---- cue 4: Sapporo and "nothing could hold him": the heist tune again, faster and bolder
a4, b4 = B[5]['start'], WT(6, 'Until') - 0.1
beat = 60 / 144; t = a4; i = 0; tune = [62, 65, 69, 67, 65, 64, 65, 62]
while t < b4:
    g = env(t, a4, b4, 0.2); ch = [Dm, Gm, A, Dm][(i // 4) % 4]
    n(t, PIZZ, ch[0] - 12, 105, beat * 0.4, 0.8 * g); n(t, STR, ch[1], 80, beat * 0.9, 0.35 * g)
    n(t, KOTO if i < 12 else HORN, tune[i % 8] + (12 if i < 12 else 0), 100, beat * 0.8, 0.5 * g)
    if i % 2 == 0: n(t, TAIKO, 50, 100, 0.35, 0.6 * g)
    t += beat; i += 1
n(WT(6, 'Nothing'), HIT, 50, 110, 0.6, 0.6)

# ---- cue 5: the cigarette: everything drops out to a lone shakuhachi and celesta
a5 = WT(6, 'Until') - 0.1
n(a5, SHAKU, 69, 90, 1.6, 0.6); n(WT(6, 'offered'), CELESTA, 81, 85, 1.0, 0.5); n(WT(6, 'cigarette'), CELESTA, 76, 80, 1.2, 0.45)
for key in [50, 57, 62]: n(a5, SLOW, key, 70, B[7]['start'] - a5, 0.4)

# ---- cue 6: kindness payoff: warm strings and horn in F major, proud finish
a6 = B[7]['start'] - 0.05; prog = [F_, C, [50, 53, 57], Bb, F_, C, F_, F_]; seg = (T_END - 1.4 - a6) / len(prog)
for k, ch in enumerate(prog):
    t = a6 + k * seg
    for key in ch: n(t, STR, key + 12, 78 + k * 3, seg * 1.03, 0.5)
    n(t, CELLO, ch[0] - 12, 88, seg * 1.03, 0.55)
    for j in range(4): n(t + j * seg / 4, KOTO, ch[j % 3] + 24, 75, 0.4, 0.35)
t = a6 + seg; theme = [(65, 1), (69, 1), (72, 2), (70, 1), (69, 1), (67, 2), (65, 1), (67, 1), (69, 3)]
for key, d in theme:
    if t > T_END - 1.6: break
    n(t, HORN, key - 12, 92, d * seg / 2 * 0.95, 0.7); t += d * seg / 2
n(WT(7, 'never'), GLOCK, 84, 95, 0.8, 0.5); n(WT(7, 'never'), TIMP, 41, 105, 0.6, 0.6)
end = T_END - 1.4
for key in [41, 45, 48, 53, 57, 60, 65]: n(end, SLOW, key, 95, 1.4, 0.55)
n(end, TAIKO, 55, 115, 1.0, 0.9); n(end, BRASS, 53, 100, 1.3, 0.55)

mix = reverb(out, SR, 2.0, 0.25)[: int(T_END * SR)]; mix /= np.abs(mix).max() + 1e-9
sf.write(f'{here}/music.wav', mix.astype(np.float32), SR); print('music', round(len(mix) / SR, 1), 's')
