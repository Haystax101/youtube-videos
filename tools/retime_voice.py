"""Tighten a voice-over: cap every pause at MAXP seconds, then speed it up by TEMPO (ffmpeg atempo,
pitch kept), and remap the word times in its timeline.json to match. Qwen3-TTS reads slowly
(about 2.2 words/s); 1.2-1.3 brings it to Short pace.
Usage: python3 tools/retime_voice.py IN.wav IN.json OUT.wav OUT.json [--tempo 1.25] [--maxp 0.3]"""
import json, subprocess, sys, tempfile
import numpy as np, soundfile as sf

a = sys.argv[1:]; opt = lambda k, d: float(a[a.index(k) + 1]) if k in a else d
TEMPO, MAXP = opt('--tempo', 1.25), opt('--maxp', 0.3)
w, sr = sf.read(a[0], dtype='float32'); w = w if w.ndim == 1 else w.mean(1)
tl = json.load(open(a[1]))
hop = int(sr * 0.01); env = np.array([np.abs(w[i:i + hop]).max() for i in range(0, len(w), hop)])
quiet = env < 0.012
# cut list: for every quiet run longer than MAXP, drop the middle so MAXP remains
cuts = []; i = 0
while i < len(quiet):
    if quiet[i]:
        j = i
        while j < len(quiet) and quiet[j]: j += 1
        L = (j - i) * 0.01
        if L > MAXP and i > 0 and j < len(quiet): s0 = i * 0.01 + MAXP / 2; cuts.append((s0, s0 + L - MAXP))
        i = j
    else: i += 1
def remap(t):
    d = sum(min(max(t - c0, 0), c1 - c0) for c0, c1 in cuts); return (t - d) / TEMPO
keep = []; prev = 0.0
for c0, c1 in cuts: keep.append(w[int(prev * sr):int(c0 * sr)]); prev = c1
keep.append(w[int(prev * sr):]); out = np.concatenate(keep)
with tempfile.NamedTemporaryFile(suffix='.wav') as f:
    sf.write(f.name, out, sr)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', f.name, '-filter:a', f'atempo={TEMPO}', a[2]], check=True)
for b in tl['beats']:
    b['start'], b['end'] = round(remap(b['start']), 3), round(remap(b['end']), 3)
    for x in b['words']: x['s'], x['e'] = round(remap(x['s']), 3), round(remap(x['e']), 3)
tl['duration'] = round(remap(tl['duration']), 3); tl['retime'] = {'tempo': TEMPO, 'maxPause': MAXP}
json.dump(tl, open(a[3], 'w'), indent=1)
print(f'{len(cuts)} pauses capped; {len(w) / sr:.1f}s -> {tl["duration"]:.1f}s')
