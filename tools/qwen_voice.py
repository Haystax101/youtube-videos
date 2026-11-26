"""Voice an episode with Qwen3-TTS (runs on GitHub Actions; CPU is fine, just slow).
1. VoiceDesign makes a short reference clip for every speaker from a text description
   (script.json "qwen": {"narrator": "...", "hiker": "..."}), plus any extra narrator candidates
   ("qwen_candidates": {"A": "...", ...}) so george can pick a voice.
2. The Base model clones each reference so a speaker sounds the same in every line.
Writes EP/voice.wav and EP/timeline.json in the same format as pipeline/tts.py, and EP/voices/*.wav.
Usage: python3 tools/qwen_voice.py EP"""
import json, os, re, sys, time
import numpy as np, soundfile as sf, torch
from qwen_tts import Qwen3TTSModel
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'pipeline'))
from tts import split_sentences, syllables

EP = sys.argv[1]; script = json.load(open(f'{EP}/script.json')); os.makedirs(f'{EP}/voices', exist_ok=True)
QW = script['qwen']; CANDS = script.get('qwen_candidates', {})
REF_TEXT = "Right, so here's the thing nobody tells you. It sounds simple, but trust me, it gets weird very quickly."
torch.set_num_threads(os.cpu_count() or 4)
kw = dict(device_map='cpu', dtype=torch.float32)
t0 = time.time()
design = Qwen3TTSModel.from_pretrained('Qwen/Qwen3-TTS-12Hz-1.7B-VoiceDesign', **kw)
refs = {}
for name, instruct in list(QW.items()) + [(f'candidate_{k}', v) for k, v in CANDS.items()]:
    torch.manual_seed(7)
    wavs, sr = design.generate_voice_design(text=REF_TEXT, language='English', instruct=instruct, max_new_tokens=1024)
    sf.write(f'{EP}/voices/{name}_ref.wav', wavs[0], sr); refs[name] = f'{EP}/voices/{name}_ref.wav'
    print('designed', name, round(len(wavs[0]) / sr, 1), 's', round(time.time() - t0), 's elapsed', flush=True)
# candidates also read a real line so they can be compared
first = script['beats'][0]['lines'][0]['text']
for k, v in CANDS.items():
    torch.manual_seed(7); wavs, sr = design.generate_voice_design(text=first, language='English', instruct=v, max_new_tokens=1024)
    sf.write(f'{EP}/voices/candidate_{k}_line.wav', wavs[0], sr)
del design
base = Qwen3TTSModel.from_pretrained('Qwen/Qwen3-TTS-12Hz-1.7B-Base', **kw)
prompts = {n: base.create_voice_clone_prompt(ref_audio=refs[n], ref_text=REF_TEXT) for n in QW}
gen = dict(max_new_tokens=1024, do_sample=True, top_k=50, top_p=1.0, temperature=0.8, repetition_penalty=1.05)
SR = None; audio = []; t = 0.15; beats = []
def sil(s): return np.zeros(int(s * SR), dtype=np.float32)
for i, beat in enumerate(script['beats']):
    b0 = None; words = []
    for line in beat['lines']:
        spk = line.get('speaker', 'narrator')
        for sent in split_sentences(line['text']):
            torch.manual_seed(11 + len(audio))
            wavs, sr = base.generate_voice_clone(text=sent, language='English', voice_clone_prompt=prompts[spk], **gen)
            w = np.asarray(wavs[0], dtype=np.float32)
            if SR is None: SR = sr; audio.append(sil(0.15))
            # trim leading/trailing silence
            nz = np.where(np.abs(w) > 0.01)[0]; w = w[max(0, nz[0] - int(0.03 * sr)): nz[-1] + int(0.06 * sr)] if len(nz) else w
            sp = line.get('speed', script.get('qwen_speed', 1.0))
            if abs(sp - 1) > 0.01:  # resample-free tempo change via simple WSOLA-less approach: use librosa if present
                try:
                    import librosa; w = librosa.effects.time_stretch(w, rate=sp).astype(np.float32)
                except Exception as e: print('no time stretch', e)
            if b0 is None: b0 = t
            dur = len(w) / SR; ws = sent.split(); wt = [syllables(x) + (0.6 if re.search(r'[,;:]$', x) else 0) for x in ws]; tot = sum(wt); c = t
            for x, g in zip(ws, wt): d = dur * g / tot; words.append({'w': x, 's': round(c, 3), 'e': round(c + d, 3), 'speaker': spk}); c += d
            audio.append(w); t += dur; gap = line.get('gap', 0.08); audio.append(sil(gap)); t += gap
            print(f'beat {i} {spk}: {sent[:50]} ({dur:.1f}s, {round(time.time() - t0)}s elapsed)', flush=True)
    hold = beat.get('hold', 0.1); audio.append(sil(hold)); t += hold
    beats.append({'i': i, 'start': round(b0 if b0 is not None else t, 3), 'end': round(t, 3), 'deathAt': None, 'words': words})
tail = script.get('tail', 0.8); audio.append(sil(tail)); t += tail
wav = np.concatenate(audio); sf.write(f'{EP}/voice.wav', wav, SR)
json.dump({'duration': round(t, 3), 'sr': SR, 'engine': 'qwen3-tts', 'beats': beats}, open(f'{EP}/timeline.json', 'w'), indent=1)
print('voiced', len(beats), 'beats', round(t, 1), 's in', round(time.time() - t0), 's')
