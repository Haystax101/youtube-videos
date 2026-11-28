"""Soundtrack for 003 WannaCry: score bed per section, stings on reveals, a few recorded sfx, -14 LUFS."""
import sys, os; sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../../../prototypes/casefile2d'))
from audiolib import Track
EP = sys.argv[1]; tr = Track(EP); c = tr.cue; T = tr.T; nb = len(tr.tl['beats'])
st = lambda b: c(b, 0)
chapters = [(0, 'dread', 50), (3, 'investigate', 52), (4, 'warm', 52), (5, 'tense', 50), (6, 'investigate', 50), (9, 'dread', 48), (11, 'warm', 52),
            (12, 'tense', 50), (14, 'pulse', 48), (17, 'dread', 48), (20, 'investigate', 52), (21, 'warm', 53), (25, 'tense', 50), (26, 'pulse', 50),
            (27, 'warm', 52), (28, 'investigate', 50), (29, 'warm', 52), (30, 'pulse', 50), (31, 'investigate', 52), (32, 'dread', 48), (34, 'warm', 50),
            (35, 'investigate', 50), (36, 'warm', 52), (37, 'investigate', 50), (39, 'tense', 48), (41, 'dread', 46), (42, 'tense', 48), (44, 'pulse', 46),
            (46, 'dread', 45), (49, 'tense', 48), (50, 'pulse', 48), (52, 'investigate', 50), (53, 'dread', 46), (55, 'investigate', 50), (56, 'tense', 48),
            (57, 'warm', 52), (59, 'investigate', 52), (60, 'warm', 55)]
chapters = [x for x in chapters if x[0] < nb]
for i, (b, mood, key) in enumerate(chapters):
    t1 = st(chapters[i + 1][0]) if i + 1 < len(chapters) else T
    tr.bed(max(0, st(b) - 0.3), t1, mood, key=key)
ding = lambda t, g=0.45: tr.chord(t, 11, [72, 76, 79], 90, 1.2, g)   # glockenspiel-ish ding
timp = lambda t: tr.note(t, 47, 38, 100, 0.6, 0.6)                   # timpani hit
# cold open
tr.sting(c(0, 'red'), key=48, g=0.6); tr.tick(st(1), st(2), bpm=110, g=0.6); timp(c(1, 'lose'))
for w in ('car', 'railways', 'phone'): timp(c(2, w))
tr.amb('sea', c(3, 'twenty'), st(4) - 0.1, 0.05)
tr.riser(c(3, 'spends'), c(4, 'stops'), key=52); ding(c(4, 'stops') + 0.1, 0.5)
tr.sting(c(5, 'worst'), key=46, g=0.6)
if nb > 40:
    for b, w in [(9, 'stolen'), (10, 'worse'), (13, 'many'), (15, 'wanna'), (16, 'worm'), (17, 'updated'), (23, 'nobody'), (26, 'kill'), (28, 'backfired'),
                 (32, 'arrested'), (33, 'kronos'), (37, 'north'), (40, 'never'), (41, 'worse'), (46, 'fake'), (47, 'not'), (52, 'except'), (54, 'destructive'), (56, 'devastating')]:
        tr.sting(c(b, w), key=48, g=0.6)
    ding(c(11, 'safe') + 0.2, 0.4); ding(c(24, 'ten') + 1.0, 0.45); ding(c(27, 'yes') + 0.1, 0.5); ding(c(34, 'no') + 0.2, 0.35); ding(c(60, 'let') + 0.4, 0.45)
    timp(c(48, 'no')); timp(c(50, 'gone')); timp(c(53, 'more', 2))
    tr.tick(st(50), c(50, 'tens'), bpm=120, g=0.6)
    for i in range(5): tr.sfx('camera', c(29, 'reporters') + 0.2 + i * 0.45, 0.25, which=2, maxlen=0.4)
    tr.sfx('cash', c(39, 'collected'), 0.3)
    tr.amb('sea', st(21), c(21, 'worked') + 3.0, 0.05)

# ---- recorded sfx layer (george 28 Nov: sfx were "poor or non existent"); clips screened for speech, see assets/sfx/skip.json
def fx(folder, b, w, dt=0.0, g=0.35, n=1, maxlen=2.5, which=None):
    try: t = c(b, w, n) if n > 1 else c(b, w)
    except Exception as e: print('fx: no cue', b, w, e); return
    tr.sfx(folder, t + dt, g * 0.55, which=which, maxlen=maxlen)
fx('impact', 0, 'red', 0.1, 0.4, maxlen=1.2)
fx('alarm', 0, 'screen', 0.3, 0.18, maxlen=2.5)
fx('impact', 1, 'encrypted', 0.0, 0.35, maxlen=1.2)
fx('siren', 2, 'ambulances', -0.3, 0.16, maxlen=4.0)
fx('paper', 2, 'pen', 0.0, 0.3, maxlen=1.5)
fx('powerdown', 2, 'factories', 0.0, 0.3, maxlen=2.0)
fx('keyboard', 3, 'laptop', 0.0, 0.25, maxlen=2.5)
fx('click', 3, 'website', 0.25, 0.5, maxlen=0.4); fx('stamp', 3, 'website', 0.55, 0.35, maxlen=0.6)
fx('whoosh', 5, 'arrest', -0.2, 0.25, maxlen=1.0)
fx('keyboard', 7, 'hacking', 0.0, 0.2, maxlen=2.0)
fx('click', 8, 'clicking', 0.0, 0.45, maxlen=0.4)
if nb > 40:
    fx('keyboard', 9, 'online', 0.0, 0.2, maxlen=2.0)
    fx('cash', 10, 'auction', 0.0, 0.25, maxlen=1.0)
    fx('whoosh', 10, 'free', 0.0, 0.3, maxlen=1.0)
    fx('click', 11, 'update', 0.0, 0.45, maxlen=0.4)
    fx('ding', 12, 'warning', 0.0, 0.3, maxlen=1.0)
    fx('click', 12, 'update', 0.0, 0.45, maxlen=0.4)
    fx('metal', 14, 'bolted', 0.0, 0.3, maxlen=1.0)
    fx('impact', 15, 'cry', 0.1, 0.35, maxlen=1.2)
    fx('whoosh', 16, 'jump', 0.0, 0.25, maxlen=1.0); fx('whoosh', 16, 'again', 0.0, 0.25, maxlen=1.0)
    fx('alarm', 17, 'locked', 0.0, 0.15, maxlen=2.0)
    fx('powerdown', 17, 'shut', 0.0, 0.3, maxlen=2.0)
    fx('paper', 18, 'report', 0.0, 0.3, maxlen=1.5)
    fx('cash', 19, 'paid', 0.0, 0.25, maxlen=1.0)
    fx('keyboard', 20, 'racing', 0.0, 0.2, maxlen=2.5)
    fx('keyboard', 22, 'code', 0.0, 0.22, maxlen=3.0)
    fx('click', 24, 'registered', 0.0, 0.5, maxlen=0.4)
    fx('powerdown', 26, 'shut', 0.0, 0.3, maxlen=2.0)
    fx('paper', 29, 'newspapers', 0.0, 0.3, maxlen=1.5)
    fx('alarm', 30, 'attack', 0.2, 0.14, maxlen=2.0)
    fx('plane', 31, 'flew', -0.3, 0.22, maxlen=3.5)
    fx('footsteps_hard', 32, 'airport', -1.2, 0.25, maxlen=1.8)
    fx('impact', 32, 'arrested', 0.0, 0.35, maxlen=1.2)
    fx('paper', 34, 'guilty', 0.0, 0.25, maxlen=1.2); fx('stamp', 34, 'served', 0.0, 0.35, maxlen=0.6)
    fx('stamp', 37, 'korea', 0.2, 0.35, maxlen=0.6)
    fx('paper', 38, 'charged', 0.0, 0.3, maxlen=1.2)
    fx('stamp', 46, 'fake', 0.1, 0.3, maxlen=0.6)
    fx('click', 43, 'updates', 0.0, 0.45, maxlen=0.4)
    fx('powerdown', 44, 'dark', 0.0, 0.35, maxlen=2.5)
    fx('impact', 45, 'red', 0.0, 0.3, maxlen=1.2)
    fx('port', 50, 'terminals', 0.0, 0.2, maxlen=3.5)
    fx('truck', 50, 'lorries', 0.0, 0.22, maxlen=3.0)
    fx('powerdown', 52, 'cut', 0.0, 0.35, maxlen=2.0)
    fx('plane', 52, 'plane', 0.0, 0.22, maxlen=3.5)
    fx('cash', 53, 'losses', 0.0, 0.25, maxlen=1.0)
    fx('click', 58, 'installed', 0.0, 0.45, maxlen=0.4)
    fx('ding', 60, 'restart', 0.0, 0.35, maxlen=1.0)
tr.write(music_db=-8, duck=0.6)   # george 28 Nov: couldn't hear the music at -24
