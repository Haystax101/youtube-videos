"""Voice an episode script with Kokoro and estimate word timings.

Usage: python3 pipeline/tts.py episodes/<slug>

Reads script.json, writes voice.wav and timeline.json (beat start/end times and
per-word timings) into the episode folder.

Kokoro's ONNX export does not report phoneme durations, so each sentence is
synthesised on its own (giving exact sentence boundaries after silence trim) and
words inside a sentence are spread by a syllable-weighted estimate. That is
accurate to well under a word for 1-3 word captions.
"""
import json, re, sys
from pathlib import Path
import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
SR = 24000
VOICES = {"narrator": "am_michael", "gary": "am_puck"}


def syllables(word: str) -> float:
    w = re.sub(r"[^a-z0-9]", "", word.lower())
    if not w:
        return 0.5
    if w.isdigit():
        return 1.5 * len(w)
    groups = re.findall(r"[aeiouy]+", w)
    n = max(1, len(groups) - (1 if w.endswith("e") and len(groups) > 1 else 0))
    return n + 0.15 * len(w) / 4


def split_sentences(text: str):
    parts = re.split(r"(?<=[.!?])\s+", text.strip())
    return [p for p in parts if p]


PRONOUNCE = {}  # global fixes for words Kokoro gets wrong, e.g. "bow" (of a ship) -> "bough"


def silence(sec):
    return np.zeros(int(sec * SR), dtype=np.float32)


def main(ep_dir: str):
    from kokoro_onnx import Kokoro  # imported here so other voice engines can reuse the helpers
    ep = Path(ep_dir)
    script = json.loads((ep / "script.json").read_text())
    voices = {**VOICES, **script.get("voices", {})}
    speed = script.get("speed", 1.08)
    # pronunciation fixes: {"bow": "bough"} speaks a sound-alike but keeps the caption word
    say = {**PRONOUNCE, **{w.lower(): v for w, v in script.get("pronounce", {}).items()}}
    k = Kokoro(str(ROOT / "models/kokoro-v1.0.onnx"), str(ROOT / "models/voices-v1.0.bin"))

    audio = [silence(0.15)]
    t = 0.15
    beats_out = []
    for i, beat in enumerate(script["beats"]):
        b_start = t
        words_out = []
        for line in beat["lines"]:
            speaker = line.get("speaker", "narrator")
            for sent in split_sentences(line["text"]):
                spoken = " ".join(say.get(w.lower().strip(".,?!;:"), w.lower().strip(".,?!;:")) + w[len(w.rstrip(".,?!;:")):] if w.lower().strip(".,?!;:") in say else w for w in sent.split())
                samples, sr = k.create(spoken, voice=voices[speaker], speed=speed * line.get("speed", 1.0), lang="en-us")
                assert sr == SR
                dur = len(samples) / SR
                words = sent.split()
                weights = [syllables(w) + (0.6 if re.search(r"[,;:]$", w) else 0) for w in words]
                total = sum(weights)
                wt = t
                for w, wgt in zip(words, weights):
                    d = dur * wgt / total
                    words_out.append({"w": w, "s": round(wt, 3), "e": round(wt + d, 3), "speaker": speaker})
                    wt += d
                audio.append(samples.astype(np.float32))
                t += dur
                gap = 0.14
                audio.append(silence(gap))
                t += gap
        hold = beat.get("hold", 0.12)
        death_at = None
        if beat.get("death"):
            death_at = round(words_out[-1]["e"] + 0.15, 3)
            hold = max(hold, 1.8)
        audio.append(silence(hold))
        t += hold
        beats_out.append({"i": i, "start": round(b_start, 3), "end": round(t, 3), "deathAt": death_at, "words": words_out})

    tail = script.get("tail", 1.2)
    audio.append(silence(tail))
    t += tail
    wav = np.concatenate(audio)
    sf.write(ep / "voice.wav", wav, SR)
    (ep / "timeline.json").write_text(json.dumps({"duration": round(t, 3), "beats": beats_out}, indent=1))
    print(f"voiced {len(beats_out)} beats, {t:.1f}s")


if __name__ == "__main__":
    main(sys.argv[1])
