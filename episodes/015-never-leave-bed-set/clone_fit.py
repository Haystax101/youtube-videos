"""Swap 015's narrator for a cloned-voice render without moving the picture: each narrator sentence of the
clone (voice_NAME.wav + timeline_NAME.json from voice.yml) is denoised, loudness-matched and time-fitted
(ffmpeg atempo, pitch kept) into the slot the Kokoro sentence holds in timeline.json; character lines
stay as they are in the hybrid voice.wav. timeline.json is unchanged.
Usage: python3 clone_fit.py EP NAME   (reads EP/voice.wav, writes EP/voice.wav; keeps EP/voice.kokoro.wav)"""
import json, os, shutil, subprocess, sys, tempfile, numpy as np, soundfile as sf
EP, NAME = sys.argv[1], sys.argv[2]; SR = 24000
if not os.path.exists(f'{EP}/voice.kokoro.wav'): shutil.copy(f'{EP}/voice.wav', f'{EP}/voice.kokoro.wav')
base, sr = sf.read(f'{EP}/voice.kokoro.wav', dtype='float32'); assert sr == SR
def ff(x, sr_in, af):
    with tempfile.TemporaryDirectory() as d:
        sf.write(f'{d}/i.wav', x, sr_in)
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', f'{d}/i.wav', '-af', af, '-ar', str(SR), '-ac', '1', f'{d}/o.wav'], check=True)
        return sf.read(f'{d}/o.wav', dtype='float32')[0]
cw, csr = sf.read(f'{EP}/voice_{NAME}.wav', dtype='float32'); cw = cw.mean(1) if cw.ndim > 1 else cw
# The clone copies george's phone recording: dull above 3 kHz (8-10 dB under Kokoro), boomy low-mids and a room tail.
# Light denoise only (heavy afftdn made it watery), cut mud, restore presence/air, and a soft gate to shorten the room tail.
CHAIN = os.environ.get('CLONE_CHAIN', 'highpass=f=80,afftdn=nr=10:nf=-50,equalizer=f=250:width_type=o:width=1.5:g=-4,'
        'equalizer=f=5000:width_type=o:width=1.2:g=7,treble=g=3:f=7000,agate=threshold=0.015:ratio=2:attack=5:release=120:range=0.25')
cw = ff(cw, csr, CHAIN)
ct, kt = json.load(open(f'{EP}/timeline_{NAME}.json')), json.load(open(f'{EP}/timeline.json'))
def sents(tl):  # narrator sentences as (first word, last word)
    out = []
    for b in tl['beats']:
        cur = []
        for w in b['words']:
            if w.get('speaker', 'narrator') != 'narrator':
                if cur: out.append(cur); cur = []
                continue
            cur.append(w)
            if w['w'][-1] in '.!?': out.append(cur); cur = []
        if cur: out.append(cur)
    return out
cs, ks = sents(ct), sents(kt); assert len(cs) == len(ks), (len(cs), len(ks))
allw = [w for b in kt['beats'] for w in b['words']]
def rms(x): v = x[np.abs(x) > 0.02 * np.abs(x).max()]; return np.sqrt(np.mean(v ** 2)) + 1e-9
out = base.copy(); ratios = []
for c, k in zip(cs, ks):
    assert [w['w'] for w in c] == [w['w'] for w in k], (c[0]['w'], k[0]['w'])
    s0, s1 = k[0]['s'], k[-1]['e']
    nxt = next((w['s'] for w in allw if w['s'] > s1 - 1e-3 and w not in k), kt['duration'])
    room = s1 + max(0, min(0.35, nxt - s1 - 0.06))  # may spill into the following pause
    seg = cw[int(c[0]['s'] * SR):int((c[-1]['e'] + 0.02) * SR)]
    nz = np.where(np.abs(seg) > 0.01 * np.abs(seg).max())[0]; seg = seg[nz[0]:nz[-1] + 1]
    hop = int(0.01 * SR); env = np.array([np.abs(seg[i:i + hop]).max() for i in range(0, len(seg), hop)]) < 0.03 * np.abs(seg).max()
    keep = np.ones(len(env), bool); i = 0  # cap the clone's slow, dramatic inner pauses at 0.1 s
    while i < len(env):
        j = i
        while j < len(env) and env[j]: j += 1
        if j - i > 10: keep[i + 5:j - 5] = False
        i = max(j, i + 1)
    seg = np.concatenate([seg[k * hop:(k + 1) * hop] for k in np.where(keep)[0]])
    tgt = room - s0; r = len(seg) / SR / tgt; ratios.append(round(r, 2))
    y = ff(seg, SR, f'atempo={r:.4f}') if r > 1.03 else seg  # WSOLA (atempo) is cleaner on speech than rubberband's phasey stretch; never slow down
    y = y[:int(tgt * SR)]; f = min(len(y), int(0.01 * SR)); y[-f:] *= np.linspace(1, 0, f)
    ref = base[int(s0 * SR):int(s1 * SR)]; y = y * rms(ref) / rms(y)
    a = int((s0 - 0.03) * SR); out[a:int(room * SR) + int(0.03 * SR)] = 0; out[int(s0 * SR):int(s0 * SR) + len(y)] = y
sf.write(f'{EP}/voice.wav', np.clip(out, -0.98, 0.98), SR)
print('tempo per sentence', ratios, 'max', max(ratios))
