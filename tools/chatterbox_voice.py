#!/usr/bin/env python3
"""Voice an episode with Chatterbox "michael" (george's pick, 27-28 Nov): Chatterbox TTS cloning a short
Kokoro am_michael clip at calm settings (exaggeration 0.3, cfg 0.45), one sentence at a time.

    python3 tools/chatterbox_voice.py EP            (runs on GitHub: .github/workflows/chatterbox.yml)

Writes EP/voice.wav and EP/timeline.json in the same format as pipeline/tts.py, so the rest of the
pipeline is unchanged. Character lines ("speaker": "doctor") clone a Kokoro clip of that speaker's voice
from script.json "voices" (e.g. bm_lewis), so they sound different from the narrator.
Pacing: pauses inside a sentence longer than 0.35 s are shortened, and each sentence is sped up by
script.json "cb_speed" (default 1.12) with a pitch-preserving tempo change (george wants it a little faster).
Pronunciation: script.json "pronounce" swaps the spoken word but keeps the caption word, as in tts.py.
"""
import json, re, sys, os, subprocess, tempfile
from pathlib import Path
import numpy as np, soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "pipeline"))
from tts import syllables, split_sentences, PRONOUNCE  # noqa: E402

SR = 24000
REF_TEXT = ("Some stories sound made up, but every word of this one is true. "
            "Stay with me, because the strangest part is still to come.")


def kokoro_ref(voice, out):
    from kokoro_onnx import Kokoro
    k = Kokoro(str(ROOT / "models/kokoro-v1.0.onnx"), str(ROOT / "models/voices-v1.0.bin"))
    s, sr = k.create(REF_TEXT, voice=voice, speed=1.0, lang="en-us")
    sf.write(out, s, sr)


def trim(x, thr=0.01, pad=0.04, max_pause=0.35):
    """Cut leading/trailing silence and shorten long pauses inside the sentence."""
    hop = int(0.01 * SR); n = len(x) // hop
    if n == 0: return x
    rms = np.sqrt((x[: n * hop].reshape(n, hop) ** 2).mean(1))
    loud = rms > thr * max(rms.max(), 1e-6) * 3
    if not loud.any(): return x
    a, b = np.argmax(loud), n - np.argmax(loud[::-1])
    out, i, keep = [], a, int(max_pause / 0.01)
    while i < b:
        j = i
        if not loud[i]:
            while j < b and not loud[j]: j += 1
            run = j - i
            out.append(x[i * hop:(i + min(run, keep)) * hop]); i = j; continue
        while j < b and loud[j]: j += 1
        out.append(x[i * hop:j * hop]); i = j
    y = np.concatenate(out)
    p = int(pad * SR)
    return np.concatenate([np.zeros(p // 2, np.float32), y, np.zeros(p // 2, np.float32)])


def tempo(x, f):
    if abs(f - 1) < 1e-3: return x
    with tempfile.TemporaryDirectory() as d:
        sf.write(f"{d}/a.wav", x, SR)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", f"{d}/a.wav", "-af", f"atempo={f}", f"{d}/b.wav"], check=True)
        y, _ = sf.read(f"{d}/b.wav", dtype="float32")
    return y


def voice_beats(ep, script, which):
    """Voice the beats whose index is in `which`; returns {i: (audio incl. trailing hold, words relative to beat start)}."""
    import torch, torchaudio
    from chatterbox.tts import ChatterboxTTS
    voices = {"narrator": "am_michael", **script.get("voices", {})}
    if voices["narrator"] == "chatterbox_michael": voices["narrator"] = "am_michael"
    if os.environ.get("CB_NARRATOR_REF"): voices["narrator"] = os.environ["CB_NARRATOR_REF"]
    say = {**PRONOUNCE, **{w.lower(): v for w, v in script.get("pronounce", {}).items()}}
    speed = script.get("cb_speed", 1.12)
    ex, cfg = script.get("cb_exaggeration", 0.3), script.get("cb_cfg", 0.45)
    model = ChatterboxTTS.from_pretrained(device="cpu")
    refs = {}
    def ref(spk):
        v = voices.get(spk, voices["narrator"])
        if v not in refs:
            refs[v] = f"/tmp/ref_{v}.wav"; kokoro_ref(v, refs[v])
        return refs[v]

    out = {}
    for i, beat in enumerate(script["beats"]):
        if i not in which: continue
        audio, t, words_out = [], 0.0, []
        for line in beat["lines"]:
            spk = line.get("speaker", "narrator")
            for sent in split_sentences(line["text"]):
                spoken = " ".join(say.get(w.lower().strip(".,?!;:"), w.lower().strip(".,?!;:")) + w[len(w.rstrip(".,?!;:")):]
                                  if w.lower().strip(".,?!;:") in say else w for w in sent.split())
                torch.manual_seed(1234 + i * 31 + len(words_out) + 1000 * line.get("seed", 0))  # "seed": N on a line re-rolls a bad take
                wav = model.generate(spoken, audio_prompt_path=ref(spk), exaggeration=ex, cfg_weight=cfg)
                x = torchaudio.functional.resample(wav, model.sr, SR)[0].numpy().astype(np.float32)
                x = tempo(trim(x), speed * line.get("speed", 1.0))
                dur = len(x) / SR
                words = sent.split()
                wts = [syllables(w) + (0.6 if re.search(r"[,;:]$", w) else 0) for w in words]
                wt = t
                for w, g in zip(words, wts):
                    d = dur * g / sum(wts); words_out.append({"w": w, "s": wt, "e": wt + d, "speaker": spk}); wt += d
                audio.append(x); t += dur
                audio.append(np.zeros(int(0.1 * SR), np.float32)); t += 0.1
                print(f"beat {i} {spk}: {dur:.2f}s  {sent}", flush=True)
        hold = beat.get("hold", 0.1); audio.append(np.zeros(int(hold * SR), np.float32))
        out[i] = (np.concatenate(audio), words_out)
    return out


def assemble(ep, script, parts):
    """Join per-beat audio in order (same layout as a single full run) -> EP/voice.wav + EP/timeline.json."""
    def silence(s): return np.zeros(int(s * SR), np.float32)
    audio, t, beats_out = [silence(0.15)], len(silence(0.15)) / SR, []
    for i in range(len(script["beats"])):
        x, words = parts[i]; b_start = t
        beats_out.append({"i": i, "start": round(b_start, 3), "end": round(t + len(x) / SR, 3), "deathAt": None,
                          "words": [{**w, "s": round(b_start + w["s"], 3), "e": round(b_start + w["e"], 3)} for w in words]})
        audio.append(x); t += len(x) / SR
    tail = script.get("tail", 1.2); audio.append(silence(tail)); t += tail
    wav = np.concatenate(audio); wav = wav / max(1e-6, np.abs(wav).max()) * 0.9
    sf.write(ep / "voice.wav", wav, SR)
    (ep / "timeline.json").write_text(json.dumps({"duration": round(t, 3), "beats": beats_out, "source": "chatterbox"}, indent=1))
    print(f"voiced {len(beats_out)} beats, {t:.1f}s")


def split_parts(script, n):
    """Contiguous beat ranges with roughly equal word counts."""
    wc = [sum(len(l["text"].split()) for l in b["lines"]) for b in script["beats"]]
    total, groups, acc, k = sum(wc), [[] for _ in range(n)], 0, 0
    for i, w in enumerate(wc):
        if acc >= total * (k + 1) / n and k < n - 1: k += 1
        groups[k].append(i); acc += w
    return groups


def main(ep_dir, part=None, merge=False):
    """Full run: python3 tools/chatterbox_voice.py EP
    Long videos on parallel runners: --part k/n writes EP/cbparts/bNNN.wav + .json for one share of the beats,
    then --merge joins every part into voice.wav + timeline.json (identical layout to a full run)."""
    ep = Path(ep_dir); script = json.loads((ep / "script.json").read_text())
    if merge:
        parts = {}
        for i in range(len(script["beats"])):
            x, _ = sf.read(ep / "cbparts" / f"b{i:03d}.wav", dtype="float32")
            parts[i] = (x, json.loads((ep / "cbparts" / f"b{i:03d}.json").read_text()))
        return assemble(ep, script, parts)
    if part:
        k, n = map(int, part.split("/")); which = set(split_parts(script, n)[k])
        res = voice_beats(ep, script, which); (ep / "cbparts").mkdir(exist_ok=True)
        for i, (x, words) in res.items():
            sf.write(ep / "cbparts" / f"b{i:03d}.wav", x, SR)
            (ep / "cbparts" / f"b{i:03d}.json").write_text(json.dumps(words))
        print(f"part {k}/{n}: beats {sorted(which)}"); return
    assemble(ep, script, voice_beats(ep, script, set(range(len(script["beats"])))))


if __name__ == "__main__":
    a = sys.argv[1:]
    main(a[0], part=a[a.index("--part") + 1] if "--part" in a else None, merge="--merge" in a)
