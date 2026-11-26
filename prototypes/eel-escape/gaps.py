"""Insert silences into a freshly downloaded Qwen voice-over (voice.wav + timeline.json), e.g. room for
the one rewind after the hook. GAPS = [(after beat index, seconds)]. Usage: python3 gaps.py EP"""
import sys, json, numpy as np, soundfile as sf
EP = sys.argv[1]; GAPS = [(0, 1.0)]
v, sr = sf.read(f'{EP}/voice.wav'); tl = json.load(open(f'{EP}/timeline.json'))
for bi, sec in sorted(GAPS, reverse=True):
    at = tl['beats'][bi]['words'][-1]['e'] + 0.12; i = int(at * sr)
    v = np.concatenate([v[:i], np.zeros(int(sec * sr)), v[i:]])
    for b in tl['beats'][bi + 1:]:
        b['start'] = round(b['start'] + sec, 3); b['end'] = round(b['end'] + sec, 3)
        for w in b['words']: w['s'] = round(w['s'] + sec, 3); w['e'] = round(w['e'] + sec, 3)
    tl['beats'][bi]['end'] = round(tl['beats'][bi]['end'] + sec, 3)
tl['duration'] = round(len(v) / sr, 3); sf.write(f'{EP}/voice.wav', v, sr); json.dump(tl, open(f'{EP}/timeline.json', 'w'), indent=1); print('gaps added; duration', tl['duration'])
