"""Original orchestral score for the beet-juice tyres Short (GeneralUser GS samples via pipeline/sf2.py).
One orchestra, a cue per scene: a sly pizzicato cold open, a jaunty farmyard tune in summer, a cold
celesta-and-strings winter with an ominous turn for the rust, a hopeful build for the beet juice and a
proud full-orchestra payoff. All times are VIDEO seconds (story world time + RW after the hook).
Usage: python3 score.py EP_DIR -> EP_DIR/music.wav"""
import sys, json, os, numpy as np, soundfile as sf
REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')); sys.path.insert(0, f'{REPO}/pipeline')
from sf2 import SoundFont, reverb
SR = 24000
here = sys.argv[1]
tl = json.load(open(f'{here}/timeline.json')); B = tl['beats']
HOOK_END, RW = B[1]['start'], 1.0
def WT(bi, word, n=1):
    c = 0
    for w in B[bi]['words']:
        if w['w'].strip('.,!?').lower() == word.lower():
            c += 1
            if c == n: return w['s']
    raise KeyError(word)
W = lambda w: w + RW
T_END = tl['duration'] + RW + 0.8
F = SoundFont(f'{REPO}/models/GeneralUser-GS.sf2', SR)
out = np.zeros(int((T_END + 4) * SR))
STR, SLOW, TREM, PIZZ, CELLO, TIMP, CHOIR, HIT, TPT, TBN, TUBA, HORN, BRASS, OBOE, BSN, CLAR, FLUTE, CELESTA, GLOCK = 48, 49, 44, 45, 42, 47, 52, 55, 56, 57, 58, 60, 61, 68, 70, 71, 73, 8, 9

def n(t, prog, key, vel, dur, gain=1.0):
    if t < 0 or t > T_END: return
    a = F.note(prog, key, int(min(127, vel)), dur) * gain
    s = int(t * SR); e = min(len(out), s + len(a)); out[s:e] += a[: e - s]
def env(t, a, b, fade=0.35): return float(np.clip(min((t - a) / fade + 1, (b - t) / fade + 1), 0, 1))
G = {'G': [43, 47, 50], 'C': [48, 52, 55], 'D': [50, 54, 57], 'Em': [52, 55, 59], 'Am': [45, 48, 52], 'B7': [47, 51, 54], 'E': [40, 44, 47]}

# ---- cue 0: cold open, sly and curious: pizzicato walking up, tremolo creeping in, a stab on "tyres"
beat = 60 / 112; t = 0.0; walk = [43, 47, 50, 52, 50, 47, 45, 48]; i = 0
while t < HOOK_END - 0.1:
    n(t, PIZZ, walk[i % 8], 95, beat * 0.5, 0.9); n(t, PIZZ, walk[i % 8] + 12, 70, beat * 0.4, 0.5); t += beat; i += 1
for k in [55, 59, 62]: n(1.2, TREM, k, 60, HOOK_END - 1.3, 0.5)
n(0.15, CLAR, 67, 80, beat * 1.5, 0.6); n(0.15 + beat * 2, CLAR, 71, 80, beat, 0.6); n(0.15 + beat * 3, CLAR, 69, 85, beat * 2, 0.6)
n(WT(0, 'tyres'), HIT, 55, 110, 0.6, 0.8); n(WT(0, 'tyres'), TIMP, 43, 110, 0.6, 0.8)

# ---- cue 1: summer farmyard (after the rewind .. "winter"): bassoon and clarinet over oom-pah pizzicato
c1a, c1b = HOOK_END + RW, W(WT(3, 'winter')) - 0.15
beat = 60 / 126; t = c1a; i = 0; prog = ['G', 'G', 'C', 'D', 'G', 'Em', 'C', 'D']
tune = [67, 71, 74, 71, 72, 69, 66, 69, 67, 71, 74, 76, 74, 72, 71, 69]
while t < c1b:
    g = env(t, c1a, c1b); ch = G[prog[(i // 4) % 8]]
    n(t, PIZZ, ch[0] - 12 if i % 2 == 0 else ch[2] - 12, 100, beat * 0.5, 0.9 * g)
    if i % 2 == 1:
        for k in ch: n(t, PIZZ, k + 12, 72, beat * 0.3, 0.35 * g)
    n(t, BSN if (i // 16) % 2 == 0 else CLAR, tune[i % 16] - (12 if (i // 16) % 2 == 0 else 0), 92, beat * 0.85, 0.65 * g)
    if i % 4 == 0: n(t, TUBA, ch[0] - 12, 85, beat * 0.8, 0.5 * g)
    t += beat; i += 1
# the spin: a little flute run; the tip-up: brass stab + timpani
for k in range(6): n(W(WT(1, 'spin')) + k * 0.07, FLUTE, 74 + k * 2, 90, 0.1, 0.6)
at = W(WT(1, 'tips')) + 0.35; n(at, BRASS, 55, 115, 0.5, 0.9); n(at, BRASS, 62, 115, 0.5, 0.9); n(at, TIMP, 43, 120, 0.8); n(at, HIT, 50, 110, 0.6, 0.7)
n(W(WT(2, 'liquid')), GLOCK, 79, 90, 0.6, 0.5)

# ---- cue 2: winter (celesta over slow strings in E minor), freeze hit, creeping pizz for the salt, low brass for the rust
c2a, c2b = W(WT(3, 'winter')) - 0.15, W(B[5]['start']) - 0.1
for k in [52, 55, 59, 64]: n(c2a, SLOW, k, 80, c2b - c2a, 0.6)
n(c2a, SLOW, 40, 85, c2b - c2a, 0.5)
t = c2a; mel = [76, 79, 83, 81, 79, 76, 74, 76]; i = 0
while t < W(B[4]['start']):
    n(t, CELESTA, mel[i % 8], 85, 0.5, 0.55); t += 0.36; i += 1
fz = W(WT(3, 'freezes')) + 0.2; n(fz, HIT, 64, 110, 0.7, 0.8); n(fz, CELESTA, 88, 110, 0.8, 0.6); n(fz, TIMP, 40, 110, 0.6, 0.6)
t = W(B[4]['start']); i = 0
while t < c2b - 0.2:
    n(t, PIZZ, [40, 43, 47, 46, 45, 43, 42, 43][i % 8], 92, 0.2, 0.8); t += 0.27; i += 1
ea = W(WT(4, 'eats')); n(ea, TBN, 40, 105, 1.4, 0.8); n(ea, TUBA, 28, 105, 1.4, 0.7); n(ea, BRASS, 46, 95, 1.2, 0.5); n(ea + 0.7, TBN, 39, 100, 1.0, 0.7)

# ---- cue 3: the factory and the beet juice: hopeful horns over rising strings (G major)
c3a, c3b = W(B[5]['start']) - 0.1, W(B[7]['start']) - 0.1
seq = ['C', 'D', 'G', 'Em', 'C', 'D', 'G', 'G']; seg = (c3b - c3a) / len(seq)
for k, c in enumerate(seq):
    t = c3a + k * seg
    for key in G[c]: n(t, STR, key + 12, 78 + k * 3, seg * 1.02, 0.55)
    n(t, STR, G[c][0] - 12, 85, seg * 1.02, 0.5); n(t, TIMP, G[c][0] - 12 if G[c][0] - 12 >= 36 else G[c][0], 80, 0.3, 0.4)
    for j in range(4): n(t + j * seg / 4, PIZZ, G[c][j % 3] + 12, 80, 0.2, 0.5)
t = c3a + seg; theme = [(67, 1), (71, 1), (74, 2), (72, 1), (71, 1), (69, 2), (67, 1), (69, 1), (71, 1), (74, 1), (76, 3)]
for key, d in theme:
    if t > c3b: break
    n(t, HORN, key - 12, 95, d * seg / 2 * 0.95, 0.8); t += d * seg / 2
n(W(WT(6, 'Sugar')), GLOCK, 83, 100, 0.8, 0.6); n(W(WT(6, 'Sugar')), HIT, 55, 90, 0.5, 0.5)

# ---- cue 4: payoff, full orchestra, the farmyard tune played proud, ending on G major
c4a = W(B[7]['start']) - 0.1; beat = 60 / 108; t = c4a; i = 0
while t < T_END - 1.6:
    ch = G[['G', 'C', 'D', 'G'][(i // 4) % 4]]
    n(t, STR, ch[0], 90, beat * 0.9, 0.5); n(t, PIZZ, ch[0] - 12, 100, beat * 0.4, 0.7)
    n(t, BRASS, tune[i % 16] - 12, 95, beat * 0.85, 0.45); n(t, HORN, tune[i % 16] - 12, 85, beat * 0.85, 0.4)
    if i % 4 == 0: n(t, TIMP, ch[0] - 12 if ch[0] - 12 >= 36 else ch[0], 100, 0.4, 0.6)
    t += beat; i += 1
n(W(WT(7, 'vegetable')), HIT, 55, 115, 0.8, 0.8); n(W(WT(7, 'vegetable')), CHOIR, 67, 90, 1.2, 0.5)
end = T_END - 1.6
for key in [43, 47, 50, 55, 59, 62, 67]: n(end, SLOW, key, 95, 1.6, 0.6)
n(end, TIMP, 43, 110, 1.2); n(end, BRASS, 55, 100, 1.4, 0.6)

mix = reverb(out, SR, 2.0, 0.25)[: int(T_END * SR)]; mix /= np.abs(mix).max() + 1e-9
s, e = int((HOOK_END - 1.0) * SR), int(HOOK_END * SR); rev = mix[s:e][::-1]; idx = np.clip(np.arange(int(RW * SR)), 0, len(rev) - 1)
mix[e:e + len(idx)] = rev[idx] * np.linspace(1, 0.2, len(idx))
sf.write(f'{here}/music.wav', mix.astype(np.float32), SR); print('music', round(len(mix) / SR, 1), 's')
