"""Soundtrack for 002 Bangladesh Bank: score bed per section, recorded sfx on actions, -14 LUFS."""
import sys, os; sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../../../prototypes/casefile2d'))
from audiolib import Track
EP = sys.argv[1]; tr = Track(EP); c = tr.cue; T = tr.T; nb = len(tr.tl['beats'])
st = lambda b: c(b, 0)
chapters = [(0, 'investigate', 52), (3, 'tense', 50), (5, 'pulse', 50), (7, 'investigate', 50), (9, 'dread', 48), (13, 'investigate', 52),
            (16, 'tense', 50), (20, 'pulse', 50), (24, 'tense', 48), (30, 'pulse', 50), (33, 'warm', 52), (34, 'investigate', 50),
            (38, 'dread', 48), (40, 'tense', 50), (42, 'dread', 48), (43, 'warm', 52)]
chapters = [x for x in chapters if x[0] < nb]
for i, (b, mood, key) in enumerate(chapters):
    t1 = st(chapters[i + 1][0]) if i + 1 < len(chapters) else T
    tr.bed(max(0, st(b) - 0.3), t1, mood, key=key)
tr.sting(c(4, 'accident'), key=48, g=0.7); tr.sting(c(6, 'fail'), key=48, g=0.6); tr.riser(c(3, 'almost'), c(3, 'almost') + 1.8)
tr.tick(c(0, 'it'), c(0, 'on'), bpm=120, g=0.8)
tr.chord(c(3, 'almost') + 1.8, 11, [72, 76, 79], 90, 1.2, 0.5)   # glockenspiel-ish ding on the total
for w in ('door', 'vault', 'gun'): tr.note(c(5, w), 47, 38, 100, 0.6, 0.6)   # timpani hit per crossed icon
if nb > 44:   # full video: reveals and callbacks
    tr.sting(c(8, 'clicked'), key=48, g=0.6); tr.sting(c(9, 'lazarus'), key=46, g=0.7); tr.sting(c(15, 'jupiter'), key=50, g=0.5)
    tr.chord(c(19, 'lazarus') + 0.3, 11, [72, 76, 79], 90, 1.0, 0.4)
    tr.riser(c(21, 'together'), c(21, 'dollars')); tr.chord(c(21, 'dollars') + 0.4, 11, [72, 76, 79], 90, 1.2, 0.45)
    tr.sting(c(24, 'apart'), key=46, g=0.7); tr.note(c(24, 'fandation'), 47, 38, 100, 0.6, 0.6); tr.note(c(25, 'stopped'), 47, 38, 100, 0.6, 0.6)
    tr.sting(c(26, 'iran'), key=46, g=0.6); tr.tick(c(31, 0), c(32, 0), bpm=110, g=0.6); tr.sting(c(32, 'pulled'), key=46, g=0.7)
    tr.chord(c(36, 'handed') + 0.3, 11, [72, 76, 79], 90, 1.0, 0.4); tr.note(c(37, 'convicted'), 47, 38, 100, 0.6, 0.6)
    tr.sting(c(38, 'never'), key=46, g=0.6); tr.sting(c(42, 'darker'), key=44, g=0.7); tr.chord(c(43, 'save'), 11, [72, 76, 79, 84], 90, 1.6, 0.45)
tr.write(music_db=-24)
