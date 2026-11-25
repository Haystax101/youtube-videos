"""Mix voice.wav with a synthesised music bed and sound effects -> audio.mix.wav.

Everything is generated procedurally (no audio assets, nothing to license):
a plucked-string chord loop (Karplus-Strong), a pop on every beat change,
and a thud + bell when Gary dies.
Music: script.json "music": {"mood": "pluck|suspense|epic|lofi|chiptune|musicbox|none"}
(default pluck = the style's original loop), optional "bpm"/"chords" overrides.
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
    """the original plucked-string loop (mood 'pluck')"""
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


# ---------- extra instruments for the music moods (all synthesised, nothing to license) ----------
def _t(dur): return np.arange(int(SR * dur)) / SR


def pad(midis, dur):
    """soft detuned saw pad with slow attack, smoothed into a warm tone"""
    t = _t(dur); out = np.zeros(len(t))
    for m in midis:
        for det in (-0.12, 0.12):
            f = note(m + det); out += 2 * ((t * f) % 1) - 1
    out = np.convolve(out, np.ones(24) / 24, 'same')
    env = np.clip(t / 0.4, 0, 1) * np.clip((dur - t) / 0.4, 0, 1)
    return out * env / (2 * len(midis))


def epiano(m, dur):
    t = _t(dur); f = note(m)
    return (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t)) * np.exp(-t * 2.5) * (1 + 0.15 * np.sin(2 * np.pi * 5 * t))


def square(m, dur):
    t = _t(dur); f = note(m)
    return np.sign(np.sin(2 * np.pi * f * t)) * np.exp(-t * 6) * 0.35


def musicbox(m, dur):
    t = _t(dur); f = note(m)
    return (np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 3 * f * t)) * np.exp(-t * 4)


def kick():
    t = _t(0.3); return np.sin(2 * np.pi * np.cumsum(120 * np.exp(-t * 18) + 40) / SR) * np.exp(-t * 10)


def hat():
    t = _t(0.06); n = rng.normal(0, 1, len(t)); n = n - np.convolve(n, np.ones(4) / 4, 'same')
    return n * np.exp(-t * 70) * 0.4


def tick():
    t = _t(0.03); return np.sin(2 * np.pi * 3000 * t) * np.exp(-t * 200) * 0.6


def bass(m, dur):
    t = _t(dur); f = note(m)
    return np.sin(2 * np.pi * f * t) * np.clip(t / 0.01, 0, 1) * np.exp(-t * 3)


def mood_track(total, mood, bpm, chords):
    """one bar at a time; each mood is its own arrangement"""
    beat = 60 / bpm; out = np.zeros(int(total * SR) + 4 * SR); t = 0.0; bar = 0
    while t < total:
        ch = chords[bar % len(chords)]
        if mood == "suspense":  # low drone pad, ticking clock, heartbeat kick
            place(out, pad([c - 12 for c in ch], beat * 4), t, 1.0)
            for k in range(8): place(out, tick(), t + k * beat / 2, 0.5)
            for k in (0, 0.35): place(out, kick(), t + k * beat, 0.7)
        elif mood == "epic":  # big pad, driving kick and bass on every beat
            place(out, pad(ch + [ch[0] + 12], beat * 4), t, 1.2)
            for k in range(4):
                place(out, kick(), t + k * beat, 0.9); place(out, bass(ch[0] - 24, beat), t + k * beat, 0.6)
                place(out, hat(), t + (k + 0.5) * beat, 0.5)
        elif mood == "lofi":  # lazy electric piano chords, soft kick and hats
            for k, off in enumerate((0, 1.5)):
                for j, m in enumerate(ch): place(out, epiano(m, beat * 2.5), t + off * beat + j * 0.02, 0.35)
            for k in (0, 2.5): place(out, kick(), t + k * beat, 0.5)
            for k in range(4): place(out, hat(), t + (k + 0.5) * beat, 0.3)
        elif mood == "chiptune":  # fast square-wave arpeggio + bass
            arp = [ch[0], ch[1], ch[2], ch[1] + 12]
            for k in range(16): place(out, square(arp[k % 4] + 12, beat / 4), t + k * beat / 4, 0.5)
            for k in range(4): place(out, square(ch[0] - 12, beat / 2), t + k * beat, 0.5)
        elif mood == "musicbox":  # delicate high arpeggio, no drums
            arp = [ch[0], ch[2], ch[1] + 12, ch[2]]
            for k in range(8): place(out, musicbox(arp[k % 4] + 12, beat * 1.5), t + k * beat / 2, 0.6)
        t += beat * 4; bar += 1
    return out[: int(total * SR)]


# music moods for A/B tests: script.json "music": {"mood": NAME} (bpm/chords can still be overridden)
MOODS = {
    "pluck": dict(bpm=None, chords=None),  # the style's original plucked loop
    "suspense": dict(bpm=78, chords=[[57, 60, 64], [53, 57, 60], [52, 56, 59], [57, 60, 64]]),   # Am F E Am
    "epic": dict(bpm=118, chords=[[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]),      # Am F C G
    "lofi": dict(bpm=82, chords=[[60, 64, 67, 71], [57, 60, 64, 67], [62, 65, 69, 72], [55, 59, 62, 65]]),  # Cmaj7 Am7 Dm7 G7
    "chiptune": dict(bpm=140, chords=[[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]]),  # C G Am F
    "musicbox": dict(bpm=88, chords=[[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]]),   # C Am F G
    "none": dict(bpm=None, chords=None),  # voice and sfx only
}


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
    mcfg = script.get("music", {}) if isinstance(script.get("music"), dict) else {}
    mood = mcfg.get("mood", "pluck")
    if mood not in MOODS: sys.exit(f"unknown music mood {mood!r}; choose from {', '.join(MOODS)}")
    n = len(voice)
    if mood == "pluck":
        preset = {**STYLES.get(style, STYLES["cartoon"]), **{k: v for k, v in mcfg.items() if k != "mood"}}
        bed = music(n / SR, preset["bpm"], preset["chords"])
    elif mood == "none":
        bed = np.zeros(n)
    else:
        preset = {**MOODS[mood], **{k: v for k, v in mcfg.items() if k != "mood"}}
        bed = mood_track(n / SR, mood, preset["bpm"], preset["chords"])
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
