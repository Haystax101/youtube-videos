"""Soundtrack for 001 dark web bosses: quiet score bed per chapter, recorded sfx on actions, -14 LUFS."""
import sys, os; sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../../../prototypes/casefile2d'))
from audiolib import Track
EP = sys.argv[1]; tr = Track(EP); c = tr.cue; T = tr.T
st = lambda b: c(b, 0)
# chapters: (start beat, mood, key)
chapters = [(0, 'dread', 50), (2, 'tense', 50), (5, 'pulse', 50), (7, 'investigate', 52), (12, 'tense', 52), (15, 'pulse', 50),
            (18, 'tense', 48), (20, 'pulse', 48), (22, 'dread', 48), (23, 'investigate', 53), (24, 'warm', 55), (25, 'investigate', 50),
            (29, 'pulse', 50), (31, 'investigate', 47), (33, 'warm', 47), (34, 'tense', 50), (38, 'pulse', 50), (40, 'dread', 45),
            (41, 'investigate', 52), (43, 'tense', 52), (45, 'pulse', 52), (48, 'tense', 50), (52, 'warm', 50), (53, 'dread', 50)]
for i, (b, mood, key) in enumerate(chapters):
    t1 = st(chapters[i + 1][0]) if i + 1 < len(chapters) else T
    tr.bed(max(0, st(b) - 0.3), t1, mood, key=key)
# stings on reveals
for b, w in [(1, 'rails'), (4, 'undercover'), (6, 'why'), (13, 'real'), (15, 'one'), (21, 'open'), (22, 'life'), (27, 'homeland'), (35, 0), (36, 'alexandre'), (40, 0), (43, 'took'), (45, 'eight'), (47, 'police')]:
    tr.sting(c(b, w), key=48, g=0.6)
crash = c(1, 'backs') + 0.5
tr.sfx('impact', crash, 0.3); tr.sfx('metal', crash + 0.02, 0.22)
for b, w in [(3, 'tucks'), (21, 'grabs'), (29, 'copied')]: tr.sfx('whoosh', c(b, w), 0.12)
for b in [5, 7, 9, 12, 15, 25, 31, 34, 41, 45, 48]: tr.sfx('whoosh', st(b) - 0.15, 0.1)
tr.write(music_db=-25)
