"""Kokoro narrator + Qwen3-TTS character lines (george, 26 Nov: Qwen narrator sounded wrong, the Qwen
character voices were good). Character sentences are cut from the Qwen voice-over (voice_NAME.wav +
timeline_NAME.json from the voice job); narrator sentences are voiced locally with Kokoro.
Every sentence is levelled to the same loudness so no voice jumps out.
Usage: python3 hybrid.py EP QWEN_WAV QWEN_TIMELINE  -> EP/voice.wav + EP/timeline.json"""
import sys, os, re, json, numpy as np, soundfile as sf
REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')); sys.path.insert(0, f'{REPO}/pipeline')
from tts import split_sentences, syllables, PRONOUNCE, SR
from kokoro_onnx import Kokoro
EP, QW, QT = sys.argv[1:4]
script = json.load(open(f'{EP}/script.json')); q, qsr = sf.read(QW); assert qsr == SR; qtl = json.load(open(QT))
k = Kokoro(f'{REPO}/models/kokoro-v1.0.onnx', f'{REPO}/models/voices-v1.0.bin')
NARR = script.get('voices', {}).get('narrator', 'bm_george'); SPEED = script.get('speed', 1.2)
say = {**PRONOUNCE, **{w.lower(): v for w, v in script.get('pronounce', {}).items()}}
def level(x, target=0.075):  # RMS over the voiced part
    v = x[np.abs(x) > 0.01]; r = np.sqrt(np.mean(v ** 2)) if len(v) else 1; return x * (target / max(r, 1e-6))
def qclip(bi, sent):  # the Qwen audio for one character sentence of beat bi
    ws = [w for w in qtl['beats'][bi]['words'] if w.get('speaker', 'narrator') != 'narrator']; n = len(sent.split())
    for i in range(len(ws) - n + 1):
        if ' '.join(w['w'] for w in ws[i:i + n]) == sent:
            a, b = ws[i]['s'], ws[i + n - 1]['e']; x = q[int(a * SR): int(b * SR)].copy(); f = int(0.01 * SR); x[:f] *= np.linspace(0, 1, f); x[-f:] *= np.linspace(1, 0, f); return x
    raise KeyError(sent)
audio = [np.zeros(int(0.15 * SR))]; t = 0.15; beats = []
for bi, beat in enumerate(script['beats']):
    b0 = t; words = []
    for line in beat['lines']:
        spk = line.get('speaker', 'narrator')
        for sent in split_sentences(line['text']):
            if spk == 'narrator':
                spoken = ' '.join(say.get(w.lower().strip('.,?!;:'), w) if w.lower().strip('.,?!;:') in say else w for w in sent.split())
                x, sr = k.create(spoken, voice=NARR, speed=SPEED * line.get('speed', 1.0), lang='en-us'); x = np.asarray(x, dtype=np.float64)
            else: x = qclip(bi, sent)
            x = level(x); dur = len(x) / SR; ws = sent.split(); wt = [syllables(w) + (0.6 if re.search(r'[,;:]$', w) else 0) for w in ws]; tot = sum(wt); c = t
            for w, g in zip(ws, wt): d = dur * g / tot; words.append({'w': w, 's': round(c, 3), 'e': round(c + d, 3), 'speaker': spk}); c += d
            gap = 0.12; audio += [x, np.zeros(int(gap * SR))]; t += dur + gap
    hold = beat.get('hold', 0.1); audio.append(np.zeros(int(hold * SR))); t += hold
    beats.append({'i': bi, 'start': round(b0, 3), 'end': round(t, 3), 'deathAt': None, 'words': words})
tail = script.get('tail', 0.7); audio.append(np.zeros(int(tail * SR))); t += tail
v = np.concatenate(audio); v /= max(1.0, np.abs(v).max() / 0.98)
sf.write(f'{EP}/voice.wav', v.astype(np.float32), SR)
json.dump({'duration': round(len(v) / SR, 3), 'engine': f'kokoro:{NARR}+qwen', 'cast': qtl.get('cast'), 'beats': beats}, open(f'{EP}/timeline.json', 'w'), indent=1)
print('hybrid voice', round(len(v) / SR, 1), 's, narrator', NARR)
