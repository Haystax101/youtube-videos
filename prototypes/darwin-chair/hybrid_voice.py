"""Hybrid voice for 015 (george, 26 Nov: Qwen narrator sounded wrong, Qwen character voices were good):
narrator lines with Kokoro (script "voices.narrator", "speed"), character lines cut from the Qwen3-TTS
render (voice.qwen.wav + timeline.qwen.json from the voice-<slug>-<run> release, see voice-tag.txt).
Writes voice.wav + timeline.json in the usual format. Usage: python3 hybrid_voice.py EP"""
import json, os, re, sys, numpy as np, soundfile as sf
REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')); sys.path.insert(0, f'{REPO}/pipeline')
from tts import split_sentences, syllables, SR
from kokoro_onnx import Kokoro
EP = sys.argv[1]; script = json.load(open(f'{EP}/script.json'))
HAVE_Q = os.path.exists(f'{EP}/voice.qwen.wav')
if HAVE_Q:
    q, qsr = sf.read(f'{EP}/voice.qwen.wav'); q = q.mean(1) if q.ndim > 1 else q; assert qsr == SR
    qtl = json.load(open(f'{EP}/timeline.qwen.json'))
KOKO_CHAR = {'darwin': 'bm_george', 'critic': 'bm_lewis'}  # placeholder when the Qwen render isn't here yet
k = Kokoro(f'{REPO}/models/kokoro-v1.0.onnx', f'{REPO}/models/voices-v1.0.bin')
narr = script.get('voices', {}).get('narrator', 'am_michael'); speed = script.get('speed', 1.12); cgain = script.get('character_gain', 1.0)
def sil(s): return np.zeros(int(s * SR), dtype=np.float32)
def norm(x, rms=0.09):  # loudness-match every sentence (RMS of voiced part), cap peaks
    v = x[np.abs(x) > 0.02 * np.abs(x).max()]; y = x * rms / (np.sqrt(np.mean(v ** 2)) + 1e-9); return np.clip(y, -0.98, 0.98)
audio = [sil(0.15)]; t = 0.15; beats = []
for i, beat in enumerate(script['beats']):
    b0 = t; words = []; qwords = [w for w in qtl['beats'][i]['words']] if HAVE_Q else []
    for line in beat['lines']:
        spk = line.get('speaker', 'narrator')
        for sent in split_sentences(line['text']):
            ws = sent.split()
            if spk == 'narrator' or not HAVE_Q:
                if spk != 'narrator': w, sr = k.create(sent, voice=KOKO_CHAR.get(spk, 'bm_george'), speed=1.0, lang='en-gb'); w = norm(np.asarray(w, np.float32)) * cgain
                else:
                    w, sr = k.create(sent, voice=narr, speed=speed * line.get('speed', 1.0), lang='en-us'); w = norm(np.asarray(w, np.float32))
            else:  # find this sentence in the Qwen render (same words, same speaker)
                n = len(ws); idx = next(j for j in range(len(qwords) - n + 1) if all(qwords[j + m]['speaker'] == spk for m in range(n)) and qwords[j]['w'] == ws[0])
                s, e = qwords[idx]['s'], qwords[idx + n - 1]['e']; w = q[max(0, int((s - 0.03) * SR)): int((e + 0.08) * SR)].astype(np.float32)
                w = norm(w) * cgain; qwords = qwords[idx + n:]
            dur = len(w) / SR; wt = [syllables(x) + (0.6 if re.search(r'[,;:]$', x) else 0) for x in ws]; tot = sum(wt); c = t
            for x, g in zip(ws, wt): d = dur * g / tot; words.append({'w': x, 's': round(c, 3), 'e': round(c + d, 3), 'speaker': spk}); c += d
            audio.append(w); t += dur; gap = line.get('gap', 0.12); audio.append(sil(gap)); t += gap
    hold = beat.get('hold', 0.1); audio.append(sil(hold)); t += hold
    beats.append({'i': i, 'start': round(b0, 3), 'end': round(t, 3), 'deathAt': None, 'words': words})
tail = script.get('tail', 1.0); audio.append(sil(tail)); t += tail
sf.write(f'{EP}/voice.wav', np.concatenate(audio), SR)
json.dump({'duration': round(t, 3), 'engine': f'kokoro:{narr}+qwen3-tts characters', 'beats': beats}, open(f'{EP}/timeline.json', 'w'), indent=1)
print('voiced', len(beats), 'beats', round(t, 1), 's; narrator', narr)
