import sys, os; sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from audiolib import Track
tr = Track(sys.argv[1]); c = tr.cue
crash = c(0, 'gate') + 0.05
tr.bed(0, c(1, 0), 'dread', key=50)
tr.sfx('impact', crash, 0.3); tr.sfx('metal', crash + 0.02, 0.2)
tr.sting(crash, key=50, g=0.8)
tr.bed(c(1, 0), c(2, 0), 'investigate', key=50)
tr.sfx('whoosh', c(1, 'more') - 0.2, 0.18)
tr.sting(c(1, 'billion'), key=45, g=0.6)
tr.bed(c(2, 0), c(3, 0), 'pulse', key=50, bpm=84)
tr.sfx('impact', c(2, 'crash'), 0.08)
tr.sfx('metal', c(2, 'walks') + 0.1, 0.12)
tr.sfx('whoosh', c(3, 0) - 0.15, 0.18)
tr.bed(c(3, 0), tr.T, 'tense', key=50)
tr.sting(c(3, 'handcuffs'), key=50, g=0.7)
tr.sfx('whoosh', c(4, 0) - 0.15, 0.15)
tr.write(music_db=-25)
