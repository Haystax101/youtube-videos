"""Hybrid voice-over: Kokoro narrator + Qwen3-TTS character lines (george, 26 Nov: the Qwen narrator sounded
ridiculous, the Qwen character voices were good). Narrator sentences are synthesised with Kokoro; each character
line is cut out of the Qwen render (voice_Ryan.wav + timeline_Ryan.json, where every word carries its speaker).
Usage: python3 hybrid.py EP [--timeline]  -> EP/voice.wav (+ EP/timeline.json with --timeline)
Without --timeline the committed timeline.json is kept, so CI audio matches the rendered picture."""
import sys, os, re, json, numpy as np, soundfile as sf
REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')); sys.path.insert(0, f'{REPO}/pipeline')
from tts import split_sentences, syllables, SR
from kokoro_onnx import Kokoro
EP = sys.argv[1]; WRITE_TL = '--timeline' in sys.argv
script = json.load(open(f'{EP}/script.json')); NARR = script.get('voices', {}).get('narrator', 'am_michael'); SPEED = script.get('speed', 1.25)
say = {w.lower(): v for w, v in script.get('pronounce', {}).items()}
qw, qsr = sf.read(f'{EP}/voice_Ryan.wav'); qw = qw.mean(1) if qw.ndim > 1 else qw
if qsr != SR: qw = np.interp(np.arange(int(len(qw) * SR / qsr)) * qsr / SR, np.arange(len(qw)), qw); qsr = SR
qtl = json.load(open(f'{EP}/timeline_Ryan.json'))
# character spans in the Qwen render, in script order: one span per (beat, consecutive run of the same speaker)
spans = []
for b in qtl['beats']:
    run = None
    for w in b['words']:
        if w['speaker'] == 'narrator': run = None; continue
        if run is None or run['spk'] != w['speaker']: run = {'beat': b['i'], 'spk': w['speaker'], 's': w['s'], 'e': w['e']}; spans.append(run)
        else: run['e'] = w['e']
def qclip(span):  # cut with a little air, trim to the actual sound
    a, b = int(max(0, span['s'] - 0.12) * SR), int((span['e'] + 0.2) * SR); x = qw[a:b].astype(np.float32)
    nz = np.where(np.abs(x) > 0.01)[0]; x = x[max(0, nz[0] - int(0.02 * SR)): nz[-1] + int(0.06 * SR)] if len(nz) else x
    k_ = int(0.02 * SR); env = np.convolve(np.abs(x), np.ones(k_) / k_, 'same'); q = env < 0.008; keep = np.ones(len(x), bool); i_ = 0
    while i_ < len(x):  # squeeze pauses inside a character line to 0.22 s
        if q[i_]:
            j_ = i_
            while j_ < len(x) and q[j_]: j_ += 1
            if (j_ - i_) / SR > 0.22: keep[i_ + int(0.11 * SR): j_ - int(0.11 * SR)] = False
            i_ = j_
        else: i_ += 1
    x = x[keep]; return x / (np.abs(x).max() + 1e-9) * 0.85
k = Kokoro(f'{REPO}/models/kokoro-v1.0.onnx', f'{REPO}/models/voices-v1.0.bin')
def sil(s): return np.zeros(int(s * SR), dtype=np.float32)
audio = [sil(0.15)]; t = 0.15; beats = []; si = 0
for i, beat in enumerate(script['beats']):
    b0 = t; words = []
    for line in beat['lines']:
        spk = line.get('speaker', 'narrator')
        if spk == 'narrator':
            for sent in split_sentences(line['text']):
                spoken = ' '.join(say.get(w.lower().strip('.,?!;:'), w) + (w[len(w.rstrip('.,?!;:')):] if w.lower().strip('.,?!;:') in say else '') for w in sent.split())
                x, sr = k.create(spoken, voice=NARR, speed=SPEED, lang='en-us'); x = np.asarray(x, np.float32)
                x = x / (np.abs(x).max() + 1e-9) * 0.85
                dur = len(x) / SR; ws = sent.split(); wt = [syllables(w) + (0.6 if re.search(r'[,;:]$', w) else 0) for w in ws]; tot = sum(wt); c = t
                for w, g in zip(ws, wt): d = dur * g / tot; words.append({'w': w, 's': round(c, 3), 'e': round(c + d, 3), 'speaker': spk}); c += d
                audio.append(x); t += dur; audio.append(sil(0.1)); t += 0.1
        else:
            sp = spans[si]; si += 1; assert sp['spk'] == spk and sp['beat'] == i, (sp, spk, i)
            x = qclip(sp); dur = len(x) / SR; ws = line['text'].split(); wt = [syllables(w) for w in ws]; tot = sum(wt); c = t
            for w, g in zip(ws, wt): d = dur * g / tot; words.append({'w': w, 's': round(c, 3), 'e': round(c + d, 3), 'speaker': spk}); c += d
            audio.append(x); t += dur; audio.append(sil(0.12)); t += 0.12
    hold = beat.get('hold', 0.1); audio.append(sil(hold)); t += hold
    beats.append({'i': i, 'start': round(b0, 3), 'end': round(t, 3), 'deathAt': None, 'words': words})
tail = script.get('tail', 0.7); audio.append(sil(tail)); t += tail
sf.write(f'{EP}/voice.wav', np.concatenate(audio), SR)
if WRITE_TL: json.dump({'duration': round(t, 3), 'sr': SR, 'engine': f'kokoro:{NARR}+qwen3-tts', 'beats': beats}, open(f'{EP}/timeline.json', 'w'), indent=1)
print('hybrid voice', round(t, 1), 's: Kokoro', NARR, '+', len(spans), 'Qwen character lines')
