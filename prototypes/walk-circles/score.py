"""Orchestral score for the full walk-in-circles video, one cue per scene (make-set-video skill):
hook (taiko + driving strings) -> comic pizzicato march (Klaus) -> dead stop + dread on "Wait" -> brass
reveal on "circles" -> curious clarinet pulse (the study) -> darker tremolo under clouds -> eerie circling
glockenspiel (blindfolded) -> building string ostinato (why) -> heroic horn theme (the tip) -> comic
pluck on "squirrel" -> theme resolves under the CTA. Times come from timeline.json, so any voice works.
Usage: python3 score.py EP_DIR  -> EP_DIR/music.wav"""
import sys, os, json, numpy as np, soundfile as sf
REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')); sys.path.insert(0, f'{REPO}/pipeline')
from sf2 import SoundFont, reverb
SR = 24000; here = sys.argv[1]
tl = json.load(open(f'{here}/timeline.json')); T = tl['duration'] + 0.8; B = tl['beats']
def W(beat, word, n=1):
    c = 0
    for w in B[beat]['words']:
        if w['w'].strip('.,!?').lower() == word.lower():
            c += 1
            if c == n: return w['s']
    raise KeyError(word)
F = SoundFont(f'{REPO}/models/GeneralUser-GS.sf2', SR); out = np.zeros(int((T + 4) * SR))
STR, SLOW, PIZZ, TIMP, BSN, CLAR, FLUTE, GLOCK, HIT, BRASS, HORN, TREM, CHOIR, TAIKO, CELLO, HARP = 48, 49, 45, 47, 70, 71, 73, 9, 55, 61, 60, 44, 52, 116, 42, 46
def n(t, prog, key, vel, dur, gain=1.0):
    if t < 0: return
    a = F.note(prog, key, int(min(127, vel)), dur) * gain; s = int(t * SR); e = min(len(out), s + len(a)); out[s:e] += a[:e - s]
def chord(t, prog, keys, vel, dur, gain): [n(t, prog, k, vel, dur, gain) for k in keys]

meet, wait, circ, study, when, under, blind, why, withw, curl, tip, land, squir, cta = (
    W(1, 'Meet'), W(4, 'Wait'), W(4, 'circles'), B[5]['start'], B[6]['start'], W(6, 'Under'), B[7]['start'], B[8]['start'],
    W(8, 'With'), W(8, 'curl'), B[9]['start'], W(9, 'Landmark'), W(9, 'squirrel'), B[10]['start'])

# 1. HOOK: taiko pulse + driving D-minor string ostinato, rising, big hit on "circle"
b = 60 / 140; t = 0.0; i = 0
while t < meet - 0.1:
    n(t, TAIKO, 36, 110 if i % 4 == 0 else 80, 0.4, 0.9)
    n(t, STR, [50, 53, 57, 53][i % 4] + (0 if t < 1.6 else 2), 90, b * 0.9, 0.5)
    if i % 2: n(t, CELLO, 38, 95, b * 0.8, 0.6)
    t += b; i += 1
hk = W(0, 'circle'); chord(hk, BRASS, [50, 57, 62], 118, 1.0, 0.7); n(hk, TIMP, 38, 125, 1.2, 1.0); n(hk, HIT, 50, 120, 0.8, 0.8)

# 2. COMIC MARCH: pizzicato + bassoon/clarinet tune in F, glock on each campfire, sad bassoon on the sausage
b = 60 / 120; CH = {'F': [41, 45, 48], 'C': [36, 40, 43], 'Dm': [38, 41, 45], 'Bb': [34, 38, 41]}
prog = ['F', 'F', 'C', 'C', 'Dm', 'Bb', 'C', 'C']; tune = [72, 74, 76, 72, 77, 76, 74, 72, 70, 72, 74, 70, 72, 70, 69, 67]
t, i = meet, 0
while t < wait - 0.15:
    ch = CH[prog[(i // 8) % 8]]
    n(t, PIZZ, ch[0] if i % 2 == 0 else ch[2], 96, b * 0.5, 0.85)
    if i % 2: n(t, PIZZ, ch[1] + 12, 80, b * 0.4, 0.55)
    if i % 4 == 0: n(t, TIMP, ch[0] if ch[0] > 36 else ch[0] + 12, 60, 0.25, 0.35)
    if i >= 4: n(t, BSN if (i // 16) % 2 == 0 else CLAR, tune[i % 16] - (12 if (i // 16) % 2 == 0 else 0), 88, b * 0.85, 0.55)
    t += b; i += 1
for c in (W(2, 'campfire'), W(3, 'campfire')):
    for k, key in enumerate([84, 88, 91, 96]): n(c + k * 0.07, GLOCK, key, 100, 0.6, 0.55)
chord(W(2, 'People'), STR, [65, 69, 72, 77], 100, 1.0, 0.45)
n(W(3, 'log'), PIZZ, 48, 110, 0.3, 0.9)
s = W(3, 'sausage'); n(s, BSN, 43, 105, 0.6, 0.9); n(s + 0.3, BSN, 42, 100, 0.9, 0.9)

# 3. "Wait." dead stop -> dread tremolo -> whoosh up -> brass reveal on "circles"
n(wait, HIT, 50, 115, 0.8, 0.9); n(wait, TIMP, 38, 120, 1.2, 0.9)
chord(wait + 0.2, TREM, [38, 45, 50, 53], 85, circ - wait, 0.7)
for k in range(10): n(circ - 0.5 + k * 0.05, STR, 62 + k * 2, 90, 0.1, 0.55)
chord(circ, BRASS, [50, 57], 115, 1.4, 0.75); chord(circ, STR, [62, 65, 69], 110, 1.4, 0.6); n(circ, TIMP, 38, 125, 1.2, 1.0)

# 4. THE STUDY: curious clarinet + pizz pulse in A minor, 100 bpm; darker tremolo once the clouds come
b = 60 / 100; t, i = study, 0; mel = [69, 72, 76, 74, 72, 71, 69, 64]
while t < blind - 0.1:
    dark = t >= under
    n(t, PIZZ, [45, 52][i % 2] - (2 if dark else 0), 85, b * 0.4, 0.7)
    if i % 2 == 0 and not dark: n(t, CLAR, mel[(i // 2) % 8], 82, b * 1.6, 0.5)
    if i % 4 == 0 and dark: chord(t, TREM, [43, 50, 55], 80, b * 4, 0.45); n(t, CELLO, 31, 90, b * 4, 0.5)
    t += b; i += 1
for k, key in enumerate([81, 84, 88]): n(W(5, '2009') + k * 0.12, GLOCK, key, 90, 0.5, 0.45)
n(W(6, 'looped'), TIMP, 33, 100, 0.8, 0.6)

# 5. BLINDFOLDED: eerie circling glockenspiel + flute over a low string drone
t, i = blind, 0; circle = [76, 79, 83, 86, 83, 79]
chord(blind, SLOW, [40, 47, 52], 75, why - blind, 0.45)
while t < why - 0.1:
    n(t, GLOCK, circle[i % 6], 70, 0.4, 0.35); n(t, HARP, circle[i % 6] - 24, 70, 0.4, 0.4)
    if i % 6 == 0: n(t, FLUTE, 76, 70, 0.9, 0.35)
    t += 0.18; i += 1
n(W(7, 'twenty'), GLOCK, 96, 100, 0.8, 0.5)

# 6. WHY: string ostinato that builds to "curl you round"
b = 60 / 132; t, i = why, 0
while t < tip - 0.1:
    k = (t - why) / max(0.1, tip - why)
    n(t, STR, [52, 55, 59, 55][i % 4] + (2 if t > withw else 0), int(70 + 45 * k), b * 0.9, 0.4 + 0.3 * k)
    if i % 2 == 0: n(t, CELLO, 40, int(70 + 40 * k), b * 1.8, 0.5)
    if t > withw and i % 4 == 0: n(t, TAIKO, 36, int(80 + 30 * k), 0.4, 0.6)
    t += b; i += 1
chord(curl, BRASS, [52, 59, 64], 118, 1.0, 0.65); n(curl, TIMP, 40, 120, 1.0, 0.9); n(W(8, 'round'), HIT, 52, 110, 0.6, 0.7)

# 7. THE TIP: heroic horn theme in C over marching strings; comic pluck + slide on "squirrel"
b = 60 / 116; t, i = tip, 0; theme = [60, 64, 67, 72, 71, 67, 69, 67]
while t < squir - 0.15:
    n(t, STR, [48, 55][i % 2], 90, b * 0.9, 0.45); n(t, PIZZ, 36 if i % 2 == 0 else 43, 90, b * 0.4, 0.6)
    if i % 2 == 0: n(t, HORN, theme[(i // 2) % 8], 100, b * 1.8, 0.6)
    t += b; i += 1
chord(land, BRASS, [48, 55, 60, 64], 112, 0.9, 0.6)
n(squir, PIZZ, 72, 120, 0.3, 0.9); n(squir + 0.25, PIZZ, 66, 110, 0.3, 0.9)
for k in range(8): n(squir + 0.45 + k * 0.04, FLUTE, 84 - k * 2, 90, 0.08, 0.5)

# 8. CTA: the march theme resolves, full orchestra, final chord
b = 60 / 120; t, i = squir + 0.9, 0
while t < T - 1.2:
    n(t, PIZZ, [41, 48][i % 2], 96, b * 0.5, 0.8); n(t, CLAR, tune[i % 16], 90, b * 0.85, 0.5); t += b; i += 1
end = T - 1.2; chord(end, STR, [53, 57, 60, 65], 110, 1.4, 0.6); chord(end, BRASS, [41, 48], 110, 1.4, 0.6); n(end, TIMP, 41, 120, 1.2, 0.9)

mix = reverb(out, SR, 1.6, 0.22)[: int(T * SR)]; mix /= np.abs(mix).max() + 1e-9
sf.write(f'{here}/music.wav', mix.astype(np.float32), SR); print('music', round(T, 1), 's')
