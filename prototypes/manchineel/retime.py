"""Tighten a Qwen voice-over: shorten long silences, then speed it up without changing pitch (ffmpeg atempo),
and remap timeline.json to match. Usage: python3 retime.py EP SRC_WAV SRC_TIMELINE [TEMPO] -> EP/voice.wav, EP/timeline.json"""
import sys, json, subprocess, numpy as np, soundfile as sf
EP, SW, ST = sys.argv[1:4]; TEMPO = float(sys.argv[4]) if len(sys.argv) > 4 else 1.15; MAXGAP = 0.42
w, sr = sf.read(SW); w = w.mean(1) if w.ndim > 1 else w; tl = json.load(open(ST))
k = int(0.02 * sr); env = np.convolve(np.abs(w), np.ones(k) / k, 'same'); quiet = env < 0.008
cuts = []; i = 0; n = len(w)  # (start_sample, removed_samples)
while i < n:
    if quiet[i]:
        j = i
        while j < n and quiet[j]: j += 1
        if (j - i) / sr > MAXGAP and i > 0 and j < n: cuts.append((i + int(MAXGAP / 2 * sr), (j - i) - int(MAXGAP * sr)))
        i = j
    else: i += 1
keep = np.ones(n, bool)
for s, r in cuts: keep[s:s + r] = False
out = w[keep]
def remap(t):
    s = int(t * sr); rem = sum(min(r, max(0, s - a)) for a, r in cuts); return (s - rem) / sr / TEMPO
sf.write(f'{EP}/voice.tight.wav', out.astype(np.float32), sr)
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', f'{EP}/voice.tight.wav', '-af', f'atempo={TEMPO}', '-ar', str(sr), f'{EP}/voice.wav'], check=True)
for b in tl['beats']:
    b['start'] = round(remap(b['start']), 3); b['end'] = round(remap(b['end']), 3)
    for x in b['words']: x['s'] = round(remap(x['s']), 3); x['e'] = round(remap(x['e']), 3)
tl['duration'] = round(len(sf.read(f'{EP}/voice.wav')[0]) / sr + 0.05, 3); tl['retimed'] = {'tempo': TEMPO, 'maxgap': MAXGAP, 'cuts': len(cuts)}
json.dump(tl, open(f'{EP}/timeline.json', 'w'), indent=1); print('voice', tl['duration'], 's, removed', len(cuts), 'long pauses')
