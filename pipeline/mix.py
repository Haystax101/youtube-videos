"""Mix voice.wav with a synthesised music bed and sound effects -> audio.mix.wav.

Everything is generated procedurally (no audio assets, nothing to license):
a plucked-string chord loop (Karplus-Strong), a pop on every beat change,
and a thud + bell when Gary dies.
Usage: python3 pipeline/mix.py episodes/<slug>
"""
import json, sys
from pathlib import Path
import numpy as np
import soundfile as sf

SR = 24000
rng = np.random.default_rng(7)


def pluck(freq, dur, decay=0.996):
    n = int(SR * dur); p = int(SR / freq)
    buf = rng.uniform(-1, 1, p); out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % p]
        buf[i % p] = decay * 0.5 * (buf[i % p] + buf[(i + 1) % p])
    return out


def note(m):
    return 440 * 2 ** ((m - 69) / 12)


# per-style music presets (script.json "style"); script "music": {"bpm": N} overrides bpm
STYLES = {
    "cartoon": dict(bpm=104, chords=[[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]]),  # C G Am F
    "noir": dict(bpm=70, chords=[[57, 60, 64], [50, 53, 57], [52, 56, 59], [57, 60, 64]]),      # Am Dm E Am, slow minor
    "news": dict(bpm=126, chords=[[50, 53, 57], [46, 50, 53], [48, 52, 55], [45, 49, 52]]),     # Dm Bb C A, urgent
    "storybook": dict(bpm=92, chords=[[50, 53, 57], [48, 52, 55], [50, 53, 57], [45, 49, 52]]),  # Dm C Dm A, folky/medieval
    "lowpoly": dict(bpm=96, chords=[[53, 57, 60], [57, 60, 64], [50, 53, 57], [55, 59, 62]]),  # F Am Dm G, light and bouncy
}


def music(total, bpm=104, chords=None):
    beat = 60 / bpm
    chords = chords or STYLES["cartoon"]["chords"]
    pattern = [0, 1, 2, 1, 0, 1, 2, 1]
    cache = {}
    out = np.zeros(int(total * SR) + SR)
    t = 0.0; bar = 0
    while t < total:
        ch = chords[bar % 4]
        for k, idx in enumerate(pattern):
            m = ch[idx] + (12 if k in (2, 6) else 0)
            if m not in cache: cache[m] = pluck(note(m), beat * 1.5)
            place(out, cache[m], t + k * beat / 2, 0.9 if k % 2 == 0 else 0.6)
        if (bar % 4) not in cache: cache[bar % 4] = pluck(note(ch[0] - 24), beat * 4, 0.998)
        place(out, cache[bar % 4], t, 1.2)
        t += beat * 4; bar += 1
    return out[: int(total * SR)]


def pop():
    n = int(0.09 * SR); t = np.arange(n) / SR
    f = 900 - 6000 * t
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 40)


def whoosh():
    n = int(0.25 * SR); t = np.arange(n) / SR
    noise = rng.normal(0, 1, n); noise = np.convolve(noise, np.ones(12) / 12, 'same')
    return noise * np.sin(np.pi * t / t[-1]) * 0.6


def thud():
    n = int(0.4 * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * (110 * t - 120 * t * t)) * np.exp(-t * 9) * 1.4


def bell():
    n = int(1.2 * SR); t = np.arange(n) / SR
    return sum(np.sin(2 * np.pi * f * t) * a for f, a in [(880, 1), (1760, .4), (2640, .2)]) * np.exp(-t * 3.5) * 0.5


def clack():
    """typewriter key: a short filtered noise click"""
    n = int(0.05 * SR); t = np.arange(n) / SR
    return rng.normal(0, 1, n) * np.exp(-t * 120) * 0.8 + np.sin(2 * np.pi * 2400 * t) * np.exp(-t * 90) * 0.4


def sting():
    """news 'bong': two stacked tones"""
    n = int(0.7 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * 587 * t) + 0.7 * np.sin(2 * np.pi * 880 * t)) * np.exp(-t * 5) * 0.5


def place(buf, clip, at, gain):
    s = int(at * SR); e = min(len(buf), s + len(clip))
    if s < len(buf): buf[s:e] += clip[: e - s] * gain


def main(ep_dir):
    ep = Path(ep_dir)
    voice, sr = sf.read(ep / "voice.wav"); assert sr == SR
    tl = json.loads((ep / "timeline.json").read_text())
    script = json.loads((ep / "script.json").read_text())
    style = script.get("style", "cartoon")
    preset = {**STYLES.get(style, STYLES["cartoon"]), **script.get("music", {})}
    n = len(voice)
    bed = music(n / SR, preset["bpm"], preset["chords"])
    bed /= np.abs(bed).max() + 1e-9
    # duck the music under speech
    env = np.convolve(np.abs(voice), np.ones(2400) / 2400, 'same')
    duck = 1 - 0.55 * np.clip(env / (env.max() * 0.25), 0, 1)
    idx = np.arange(n)
    fade = np.clip(idx / (0.5 * SR), 0, 1) * np.clip((n - idx) / (1.5 * SR), 0, 1)
    sfx = np.zeros(n)
    for i, b in enumerate(tl["beats"]):
        if style == "noir":
            for k, w in enumerate(b["words"]):  # a key clack as each caption group types out
                if k % 2 == 0: place(sfx, clack(), w["s"], 0.12)
        elif style == "news":
            if i: place(sfx, whoosh(), b["start"] - 0.08, 0.25)
            place(sfx, sting() if i in (0, 1) else pop(), b["start"] + 0.05, 0.35)
        else:
            if i: place(sfx, whoosh(), b["start"] - 0.08, 0.25)
            place(sfx, pop(), b["start"] + 0.05, 0.35)
        if b.get("deathAt"):
            place(sfx, thud(), b["deathAt"], 0.8)
            place(sfx, bell(), b["deathAt"] + 0.05, 0.45)
    mix = voice + bed * 0.13 * duck * fade + sfx
    mix /= max(1.0, np.abs(mix).max() / 0.95)
    sf.write(ep / "audio.mix.wav", mix.astype(np.float32), SR)
    print("mixed", ep / "audio.mix.wav")


if __name__ == "__main__":
    main(sys.argv[1])
