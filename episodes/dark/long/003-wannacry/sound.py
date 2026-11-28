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
tr.amb('hospital', st(0) + 3.0, st(3) - 0.2, 0.06)
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
    for i in range(5): tr.sfx('camera', c(29, 'reporters') + 0.2 + i * 0.45, 0.25)
    tr.amb('crowd', c(31, 'everyone') - 0.1, st(32) - 0.1, 0.07)
    tr.sfx('cash', c(39, 'collected'), 0.3)
    tr.amb('sea', st(21), c(21, 'worked') + 3.0, 0.05)
tr.write(music_db=-24)
