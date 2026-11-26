"""Orchestral score for the eel escape Short (GeneralUser GS soundfont via pipeline/sf2.py).
Cues: tense cold open -> playful pizzicato for the baby eel -> low menace for the dark sleeper ->
GULP hit -> dark drone + ticking in the stomach -> curious plucks in the lab -> a rising ostinato for
the backwards escape -> brass hero theme when it gets out -> bright resolution at the end.
Times come from timeline.json words. Usage: python3 score.py EP_DIR -> EP_DIR/music.wav"""
import sys, os, json, re, numpy as np, soundfile as sf
REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')); sys.path.insert(0, f'{REPO}/pipeline')
from sf2 import SoundFont, reverb
SR = 24000; here = sys.argv[1]
tl = json.load(open(f'{here}/timeline.json')); T = tl['duration'] + 0.6
IDS = ['hook', 'meet', 'fish', 'gulp', 'inside', 'lab', 'circle', 'reverse', 'tail', 'free', 'stats', 'payoff', 'cta']
def BS(i): return tl['beats'][IDS.index(i)]['start']
def BE(i): return tl['beats'][IDS.index(i)]['end']
def WT(i, word, n=1):
    c = 0
    for w in tl['beats'][IDS.index(i)]['words']:
        if re.sub(r"[^a-z0-9'-]", '', w['w'].lower()) == word.lower():
            c += 1
            if c == n: return w['s']
    raise KeyError(word)
F = SoundFont(f'{REPO}/models/GeneralUser-GS.sf2', SR); out = np.zeros(int((T + 4) * SR))
STR, SLOW, PIZZ, TIMP, BSN, CLAR, FLUTE, GLOCK, HIT, BRASS, HORN, TREM, CELLO, CHOIR, TAIKO, OBOE, TPT, MARIMBA, CELESTA, CONTRA = 48, 49, 45, 47, 70, 71, 73, 9, 55, 61, 60, 44, 42, 52, 116, 68, 56, 12, 8, 43
def n(t, prog, key, vel, dur, gain=1.0):
    if t < 0 or t > T: return
    a = F.note(prog, key, int(min(127, vel)), dur) * gain; s = int(t * SR); e = min(len(out), s + len(a)); out[s:e] += a[:e - s]
def rest_until(t, until, step, fn):
    i = 0
    while t < until - 0.02: fn(t, i); t += step; i += 1

RW0 = tl['beats'][0]['words'][-1]['e'] + 0.08; RW1 = BS('meet')
# 1. cold open: tense string ostinato in D minor + taiko, stab on "escape"
b = 60 / 132
rest_until(0, RW0, b / 2, lambda t, i: (n(t, STR, [50, 53, 50, 57][i % 4], 92, b * 0.45, 0.5), i % 4 == 0 and n(t, TAIKO, 41, 105, 0.5, 0.7), i % 8 == 0 and n(t, CONTRA, 38, 100, b * 4, 0.6)))
for k in (50, 57, 62, 65): n(WT('hook', 'escape'), BRASS, k, 112, 0.8, 0.5)
n(WT('hook', 'escape'), TIMP, 38, 120, 1.0, 0.8); n(WT('hook', 'gills'), HIT, 50, 118, 0.9, 0.8)
# the rewind gets no music here (mix adds the reversed slice)
# 2. baby eel: light pizzicato + flute/clarinet tune in F
b = 60 / 120; tune = [72, 74, 77, 79, 77, 74, 72, 69]
rest_until(RW1, BS('fish'), b / 2, lambda t, i: (n(t, PIZZ, [41, 48, 45, 48][i % 4], 92, b * 0.4, 0.75), i % 2 and n(t, PIZZ, 65 + (i % 3) * 2, 74, 0.3, 0.45), i >= 2 and i % 2 == 0 and n(t, FLUTE, tune[(i // 2) % 8], 84, b * 0.9, 0.5)))
for k, key in enumerate([84, 88, 91]): n(WT('meet', 'menu') + k * 0.06, GLOCK, key, 96, 0.5, 0.45)
n(WT('meet', 'menu'), CONTRA, 34, 110, 1.2, 0.7)  # uh-oh
# 3. dark sleeper: low bassoon + contrabass menace, tremolo cluster before the gulp
b = 60 / 96
rest_until(BS('fish'), BS('gulp'), b, lambda t, i: (n(t, CONTRA, [33, 34][i % 2], 100, b * 0.95, 0.8), n(t, BSN, [45, 46, 45, 41][i % 4], 92, b * 0.9, 0.6), i % 2 == 0 and n(t, TIMP, 33, 80, 0.4, 0.4)))
for key in (45, 46, 51, 52): n(WT('fish', 'swallows'), TREM, key, 90, BS('gulp') - WT('fish', 'swallows') + 0.3, 0.55)
# 4. GULP
g = WT('gulp', 'gone')
for k in range(8): n(WT('gulp', 'lunge') - 0.25 + k * 0.03, STR, 50 + k * 3, 95, 0.08, 0.5)
n(g, HIT, 43, 127, 1.4, 1.0); n(g, TIMP, 31, 127, 1.6, 1.0); n(g, TAIKO, 36, 127, 1.0, 0.9)
for key in (31, 38, 43, 46): n(g, BRASS, key, 118, 1.3, 0.6)
for key in (38, 41, 44): n(WT('gulp', 'Straight'), SLOW, key, 85, BS('inside') - WT('gulp', 'Straight'), 0.5)
# 5. inside the stomach: drone + heartbeat-like timpani + ticking clock (woodblock-ish marimba)
for key in (26, 33, 38): n(BS('inside'), CONTRA if key < 30 else CELLO, key, 95, BS('lab') - BS('inside') + 0.2, 0.55)
rest_until(BS('inside'), BS('lab'), 0.42, lambda t, i: (n(t, TIMP, 33, 110 if i % 2 == 0 else 80, 0.3, 0.55), n(t + 0.21, MARIMBA, 96, 70, 0.08, 0.25)))
n(WT('inside', 'minutes'), CHOIR, 62, 90, 1.4, 0.45); n(WT('inside', 'minutes'), CHOIR, 63, 90, 1.4, 0.4)
# 6. the lab: curious plucks + celesta, a little "power-up" glide on X-ray
b = 60 / 112
rest_until(BS('lab'), BS('circle'), b / 2, lambda t, i: (n(t, PIZZ, [57, 60, 64, 60, 62, 65, 69, 65][i % 8], 84, 0.3, 0.6), i % 4 == 0 and n(t, CELESTA, [81, 84, 88, 86][(i // 4) % 4], 80, 0.6, 0.4), i % 8 == 0 and n(t, CELLO, 45, 80, b * 4, 0.45)))
for k in range(10): n(WT('lab', 'X-ray') - 0.3 + k * 0.035, CELESTA, 72 + k * 2, 85, 0.15, 0.4)
for key in (69, 76, 81): n(WT('lab', 'Recording'), BRASS, key, 105, 0.5, 0.4)
# 7. circling + reversing: rising string ostinato, tempo climbs
t = BS('circle'); i = 0; seq = [50, 53, 57, 53, 50, 53, 58, 53]
while t < BS('tail') - 0.02:
    k = (t - BS('circle')) / (BS('tail') - BS('circle')); bt = 60 / (110 + 50 * k)
    n(t, STR, seq[i % 8] + (2 if k > 0.5 else 0), 90, bt * 0.45, 0.55); n(t, PIZZ, 38 + (2 if k > 0.5 else 0), 90, 0.2, 0.5) if i % 2 == 0 else None
    if i % 4 == 0: n(t, TAIKO, 41, 95 + int(25 * k), 0.4, 0.5)
    t += bt / 2; i += 1
for key in (62, 65, 69): n(WT('reverse', 'reverses'), HORN, key, 108, 1.2, 0.5)
n(WT('reverse', 'Backwards'), HIT, 50, 110, 0.6, 0.6)
# 8. the tail pops: a held hush, then pop
n(WT('tail', 'pops'), GLOCK, 96, 110, 0.4, 0.6); n(WT('tail', 'pops'), PIZZ, 84, 110, 0.2, 0.6)
for key in (62, 66, 69): n(WT('tail', 'Is'), TREM, key, 80, BS('free') - WT('tail', 'Is'), 0.5)
# 9. wriggle wriggle -> OUT: hero theme in brass
for k, key in enumerate([62, 64, 66, 67, 69, 71]): n(BS('free') + k * 0.12, STR, key, 100, 0.12, 0.55)
o = WT('free', 'out')
for key in (50, 57, 62, 66, 69): n(o, BRASS if key < 64 else STR, key, 120, 1.6, 0.7)
n(o, TIMP, 38, 127, 1.2, 0.9); n(o, HIT, 62, 115, 1.0, 0.7)
for k, (key, d) in enumerate([(74, 0.3), (78, 0.3), (81, 0.6), (79, 0.3), (81, 0.9)]): n(o + 0.25 + sum(x[1] for x in [(74, 0.3), (78, 0.3), (81, 0.6), (79, 0.3)][:k]), TPT, key, 108, d, 0.45)
# 10. stats: march (snare-like taiko + horns), counting stabs
b = 60 / 118
rest_until(BS('stats'), BS('payoff'), b, lambda t, i: (n(t, TAIKO, 38, 90 if i % 2 else 110, 0.3, 0.45), n(t, PIZZ, [38, 45, 42, 45][i % 4], 95, 0.3, 0.6), i % 4 == 0 and n(t, HORN, [62, 66, 69, 67][(i // 4) % 4], 92, b * 3.5, 0.4)))
for w, key in (('thirteen', 74), ('nine', 78), ('fifty-six', 81)): n(WT('stats', w), GLOCK, key + 12, 110, 0.5, 0.5); n(WT('stats', w), BRASS, key - 12, 105, 0.5, 0.4)
# 11. payoff + CTA: triumphant D major, choir, resolving
for key in (50, 57, 62, 66, 69, 74): n(BS('payoff'), STR if key > 55 else CONTRA, key, 100, BE('cta') - BS('payoff') + 1.2, 0.5)
n(BS('payoff'), CHOIR, 66, 95, 3.0, 0.4); n(BS('payoff'), CHOIR, 69, 95, 3.0, 0.4); n(BS('payoff'), TIMP, 38, 115, 1.2, 0.8)
for k, key in enumerate([74, 78, 81, 86]): n(WT('payoff', 'Tail') + k * 0.08, GLOCK, key, 100, 0.6, 0.5)
for k, (key, d) in enumerate([(69, 0.4), (74, 0.4), (78, 0.4), (81, 1.4)]): n(BS('cta') + k * 0.4, TPT, key, 104, d, 0.42)
n(BE('cta') - 0.4, TIMP, 38, 120, 1.4, 0.8); n(BE('cta') - 0.4, HIT, 62, 100, 1.4, 0.5)
mix = reverb(out, SR, 1.8, 0.22)[: int(T * SR)]; mix /= np.abs(mix).max() + 1e-9
sf.write(f'{here}/music.wav', mix.astype(np.float32), SR); print('music', round(T, 1), 's')
