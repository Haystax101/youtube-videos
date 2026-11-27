"""Soundtrack for 002 Bangladesh Bank: score bed per section, recorded sfx on actions, -14 LUFS."""
import sys, os; sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../../../prototypes/casefile2d'))
from audiolib import Track
EP = sys.argv[1]; tr = Track(EP); c = tr.cue; T = tr.T; nb = len(tr.tl['beats'])
st = lambda b: c(b, 0)
chapters = [(0, 'investigate', 52), (3, 'tense', 50), (5, 'pulse', 50), (7, 'investigate', 50)]
chapters = [x for x in chapters if x[0] < nb]
for i, (b, mood, key) in enumerate(chapters):
    t1 = st(chapters[i + 1][0]) if i + 1 < len(chapters) else T
    tr.bed(max(0, st(b) - 0.3), t1, mood, key=key)
tr.sting(c(4, 'accident'), key=48, g=0.7); tr.sting(c(6, 'fail'), key=48, g=0.6); tr.riser(c(3, 'almost'), c(3, 'almost') + 1.8)
tr.tick(c(0, 'it'), c(0, 'on'), bpm=120, g=0.8)
tr.chord(c(3, 'almost') + 1.8, 11, [72, 76, 79], 90, 1.2, 0.5)   # glockenspiel-ish ding on the total
for w in ('door', 'vault', 'gun'): tr.note(c(5, w), 47, 38, 100, 0.6, 0.6)   # timpani hit per crossed icon
tr.write(music_db=-24)
