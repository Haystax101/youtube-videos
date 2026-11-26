"""Voice an episode with Qwen3-TTS library voices (CustomVoice model). Runs on GitHub Actions
(.github/workflows/voice.yml, CPU, one runner per narrator voice) or anywhere with `pip install qwen-tts`.

script.json:
  "qwen_speakers": {"narrator": ["Ryan", "Dolce", "Arthur"], "hiker": "Aiden"}
      narrator may be a list (A/B/C test: one full voice-over per name); character speakers are one name.
  "qwen_instruct": {"narrator": "Lively, amused storytelling.", "hiker": "Overconfident, a bit loud."}  (optional)
  "qwen_clone": {"George": "voices/george.wav"}  (optional: a narrator name that is a cloned voice, from a
      reference clip the speaker gave permission for; voice.yml decrypts voices/*.wav.enc with the VOICE_KEY
      secret and transcribes the clip with faster-whisper, or give {"ref": ..., "text": ...})
  "qwen_speed": 1.1   (optional tempo change after synthesis; a line can set "speed")
  "pronounce": {"bow": "bough"}  (spoken text only; captions keep the real word)

Usage: python3 tools/qwen_voice.py EP [NARRATOR]
Writes EP/voice_<NARRATOR>.wav and EP/timeline_<NARRATOR>.json (same format as pipeline/tts.py, with
"engine": "qwen3-tts" and "voice"). To use one: copy them to EP/voice.wav and EP/timeline.json.
`python3 tools/qwen_voice.py --list` prints the supported speakers."""
import json, os, re, sys, time
import numpy as np, soundfile as sf, torch
from qwen_tts import Qwen3TTSModel
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'pipeline'))
from tts import split_sentences, syllables

MODEL = os.environ.get('QWEN_MODEL', 'Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice')
torch.set_num_threads(os.cpu_count() or 4)
t0 = time.time()
model = Qwen3TTSModel.from_pretrained(MODEL, device_map='cpu', dtype=torch.float32)
SUPPORTED = list(model.get_supported_speakers() or [])
print('supported speakers:', ', '.join(SUPPORTED), flush=True)
if sys.argv[1] == '--list': sys.exit(0)
CLONES = {}
def resolve(name, fallback=()):
    for n in [name, *fallback]:
        for s in SUPPORTED:
            if n and s.lower().replace('_', ' ') == str(n).lower().replace('_', ' '): return s
    return None

EP = sys.argv[1]; script = json.load(open(f'{EP}/script.json'))
SPK = script.get('qwen_speakers', {'narrator': ['Ryan']}); INS = script.get('qwen_instruct', {})
narrators = SPK['narrator'] if isinstance(SPK['narrator'], list) else [SPK['narrator']]
wanted = sys.argv[2] if len(sys.argv) > 2 else narrators[0]
CL = script.get('qwen_clone', {})
narrator = resolve(wanted)
if wanted in CL:  # cloned narrator: Base model + a voice-clone prompt from the reference clip
    c = CL[wanted] if isinstance(CL[wanted], dict) else {'ref': CL[wanted]}
    ref = os.path.join(os.path.dirname(__file__), '..', c['ref']); text = c.get('text')
    if not text:
        from faster_whisper import WhisperModel
        segs, _ = WhisperModel('small.en', device='cpu', compute_type='int8').transcribe(ref)
        text = ' '.join(x.text.strip() for x in segs); print('reference transcript:', text, flush=True)
    base = Qwen3TTSModel.from_pretrained('Qwen/Qwen3-TTS-12Hz-1.7B-Base', device_map='cpu', dtype=torch.float32)
    CLONES[wanted] = (base, base.create_voice_clone_prompt(ref_audio=ref, ref_text=text))
    narrator = wanted
if not narrator: sys.exit(f'speaker {wanted!r} not in the library: {SUPPORTED}')
cast = {'narrator': narrator}
for role, name in SPK.items():
    if role == 'narrator': continue
    s = resolve(name, ['Aiden', 'Dylan', 'Eric', 'Ryan'])
    if s == narrator: s = next((x for x in SUPPORTED if x != narrator), s)  # characters must differ from the narrator
    cast[role] = s
print('cast:', cast, flush=True)
pron = {**script.get('pronounce', {})}
def spoken(text):
    for k, v in pron.items(): text = re.sub(rf'\b{re.escape(k)}\b', v, text, flags=re.I)
    return text

gen = dict(max_new_tokens=1024, do_sample=True, top_k=50, top_p=1.0, temperature=0.8, repetition_penalty=1.05)
SR = None; audio = []; t = 0.15; beats = []
def sil(s): return np.zeros(int(s * SR), dtype=np.float32)
for i, beat in enumerate(script['beats']):
    b0 = None; words = []
    for line in beat['lines']:
        role = line.get('speaker', 'narrator'); spk = cast.get(role, narrator)
        for sent in split_sentences(line['text']):
            torch.manual_seed(11 + len(audio))
            if spk in CLONES:
                cm, cp = CLONES[spk]; wavs, sr = cm.generate_voice_clone(text=spoken(sent), language='English', voice_clone_prompt=cp, **gen)
            else:
                kw = dict(text=spoken(sent), language='English', speaker=spk, **gen)
                if INS.get(role) and '0.6B' not in MODEL: kw['instruct'] = INS[role]
                wavs, sr = model.generate_custom_voice(**kw)
            w = np.asarray(wavs[0], dtype=np.float32)
            if SR is None: SR = sr; audio.append(sil(0.15))
            nz = np.where(np.abs(w) > 0.01)[0]; w = w[max(0, nz[0] - int(0.03 * sr)): nz[-1] + int(0.06 * sr)] if len(nz) else w
            sp = line.get('speed', script.get('qwen_speed', 1.0))
            if abs(sp - 1) > 0.01:
                import librosa; w = librosa.effects.time_stretch(w, rate=sp).astype(np.float32)
            if b0 is None: b0 = t
            dur = len(w) / SR; ws = sent.split(); wt = [syllables(x) + (0.6 if re.search(r'[,;:]$', x) else 0) for x in ws]; tot = sum(wt); c = t
            for x, g in zip(ws, wt): d = dur * g / tot; words.append({'w': x, 's': round(c, 3), 'e': round(c + d, 3), 'speaker': role}); c += d
            audio.append(w); t += dur; gap = line.get('gap', 0.08); audio.append(sil(gap)); t += gap
            print(f'beat {i} {role}/{spk}: {sent[:50]} ({dur:.1f}s, {round(time.time() - t0)}s elapsed)', flush=True)
    hold = beat.get('hold', 0.1); audio.append(sil(hold)); t += hold
    beats.append({'i': i, 'start': round(b0 if b0 is not None else t, 3), 'end': round(t, 3), 'deathAt': None, 'words': words})
tail = script.get('tail', 0.8); audio.append(sil(tail)); t += tail
sf.write(f'{EP}/voice_{wanted}.wav', np.concatenate(audio), SR)
json.dump({'duration': round(t, 3), 'sr': SR, 'engine': 'qwen3-tts', 'voice': narrator, 'cast': cast, 'beats': beats},
          open(f'{EP}/timeline_{wanted}.json', 'w'), indent=1)
print('voiced', len(beats), 'beats', round(t, 1), 's with', narrator, 'in', round(time.time() - t0), 's')
