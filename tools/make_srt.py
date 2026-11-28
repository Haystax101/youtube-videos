"""Subtitles (.srt) from an episode's timeline.json word timings: python3 tools/make_srt.py EP OUT.srt"""
import json, re, sys
FIX = [(r'\b((?:[A-Z] ){1,4}[A-Z])(?=s?\b)', lambda m: m.group(1).replace(' ', '')), (r'\bAlpha Bay\b', 'AlphaBay'),
       (r'\btwenty (ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)\b', lambda m: str(2000 + ['ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen','twenty'].index(m.group(1)) + 10))]
def clean(t):
    for a, b in FIX: t = re.sub(a, b, t)
    return t
def ts(x):
    ms = int(round(x * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
    return f"{h:02}:{m:02}:{s:02},{ms:03}"
words = [w for b in json.load(open(sys.argv[1] + '/timeline.json'))['beats'] for w in b['words']]
cues, cur = [], []
for i, w in enumerate(words):
    cur.append(w); text = ' '.join(x['w'] for x in cur)
    nxt = words[i + 1] if i + 1 < len(words) else None
    end = (nxt is None or len(text) > 60 or w['w'][-1] in '.?!' or (w['w'][-1] in ',;:' and len(text) > 30)
           or (nxt and nxt['s'] - w['e'] > 0.6))
    if end and nxt and w['w'].lower() in ('twenty', 'the', 'a', 'of') and len(text) < 75: end = False
    if end: cues.append(cur); cur = []
out = []
for n, c in enumerate(cues, 1):
    text = clean(' '.join(x['w'] for x in c))
    if len(text) > 42:   # split into two balanced lines
        ws = text.split(); best = min(range(1, len(ws)), key=lambda k: abs(len(' '.join(ws[:k])) - len(' '.join(ws[k:]))))
        text = ' '.join(ws[:best]) + '\n' + ' '.join(ws[best:])
    out.append(f"{n}\n{ts(c[0]['s'])} --> {ts(max(c[-1]['e'], c[0]['s'] + 0.8))}\n{text}\n")
open(sys.argv[2], 'w').write('\n'.join(out))
print(len(cues), 'cues')
