"""Mix two voice-overs of the same script: keep BASE for most speakers (e.g. the Kokoro narrator) and
splice in OTHER's lines for chosen roles (e.g. Qwen3-TTS character voices). Both inputs are
voice.wav + timeline.json pairs whose words carry "speaker". Writes a new pair.
Usage: python3 tools/hybrid_voice.py BASE.wav BASE.json OTHER.wav OTHER.json OUT.wav OUT.json --roles hiker[,sci]"""
import json, sys
import numpy as np, soundfile as sf

a = sys.argv[1:]; roles = set(a[a.index('--roles') + 1].split(','))
def rd(p):
    w, sr = sf.read(p, dtype='float32'); return (w.mean(1) if w.ndim > 1 else w), sr
bw, sr = rd(a[0]); bt = json.load(open(a[1])); ow, osr = rd(a[2]); ot = json.load(open(a[3]))
if osr != sr: ow = np.interp(np.arange(int(len(ow) * sr / osr)) * osr / sr, np.arange(len(ow)), ow).astype(np.float32)

def runs(tl):  # consecutive same-speaker word runs, per beat
    out = []
    for b in tl['beats']:
        cur = None
        for w in b['words']:
            spk = w.get('speaker', 'narrator')
            if not cur or cur['spk'] != spk: cur = {'beat': b['i'], 'spk': spk, 'words': []}; out.append(cur)
            cur['words'].append(w)
    return out
br, orr = runs(bt), runs(ot)
def rms(w, rs): x = np.concatenate([w[int(q['s'] * sr):int(q['e'] * sr)] for r in rs for q in r['words']] or [np.zeros(1)]); return np.sqrt(np.mean(x ** 2)) + 1e-9
GAIN = rms(bw, [r for r in br if r['spk'] not in roles]) / rms(ow, [r for r in orr if r['spk'] in roles])  # match loudness
print(f'character lines gain {20 * np.log10(GAIN):+.1f} dB')
oq = {r: [x for x in orr if x['spk'] == r] for r in roles}
pieces, beats, t = [], {}, 0.0
for k, r in enumerate(br):
    nxt = br[k + 1]['words'][0]['s'] if k + 1 < len(br) else bt['duration']
    if r['spk'] in roles and oq[r['spk']]:
        o = oq[r['spk']].pop(0); s0 = max(0, o['words'][0]['s'] - 0.04); s1 = o['words'][-1]['e'] + 0.12
        seg, src = ow[int(s0 * sr):int(s1 * sr)] * GAIN, o['words']
        gap = max(0.12, nxt - r['words'][-1]['e'])  # keep the base's pause after the line
        seg = np.concatenate([seg, np.zeros(int(min(gap, 0.6) * sr), np.float32)])
    else:
        s0 = r['words'][0]['s'] - (0.15 if k == 0 else 0); s1 = nxt; s0 = max(0, s0)
        seg, src = bw[int(s0 * sr):int(s1 * sr)], r['words']
    for w in src: beats.setdefault(r['beat'], []).append({**w, 's': round(t + w['s'] - s0, 3), 'e': round(t + w['e'] - s0, 3), 'speaker': r['spk']})
    pieces.append(seg); t += len(seg) / sr
tail = np.zeros(int(0.6 * sr), np.float32); wav = np.concatenate(pieces + [tail]); dur = len(wav) / sr
sf.write(a[4], wav, sr)
out = {**bt, 'duration': round(dur, 3), 'engine': 'hybrid', 'beats': []}
for b in bt['beats']:
    ws = beats.get(b['i'], [])
    out['beats'].append({**b, 'words': ws, 'start': ws[0]['s'] if ws else b['start'], 'end': ws[-1]['e'] if ws else b['end']})
json.dump(out, open(a[5], 'w'), indent=1)
print(f'{len(br)} runs, {dur:.1f}s')
