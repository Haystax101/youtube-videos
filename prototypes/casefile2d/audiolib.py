"""Soundtrack helpers for Case File long-form videos.
Explainer-documentary mix: a quiet, steady score bed far under the narration (the reference sits roughly
20-25 dB under the voice), small recorded sfx on actions, a soft sting on reveals, two-pass -14 LUFS.

    from audiolib import Track
    tr = Track(EP)                              # loads timeline.json + voice.wav
    tr.bed(0, 20, 'tense', key=50)              # score sections: tense / investigate / dread / warm / pulse
    tr.sting(12.3); tr.riser(30, 32)
    tr.sfx('impact', 5.7, gain=0.5)            # recorded CC0 sfx (assets/sfx/<folder>)
    tr.amb('street', 0, 8, gain=0.12)           # ambience bed for a scene
    tr.write()                                  # -> music.wav, sfx.wav, audio.mix.wav, audio.norm.wav
"""
import sys, os, re, json, subprocess, numpy as np, soundfile as sf
REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')); sys.path.insert(0, f'{REPO}/pipeline')
from sf2 import SoundFont, reverb
from sfxlib import Sfx

SR = 24000
PIANO, CELESTA, HARP, STR, SLOW, PIZZ, TREM, CELLO, CBASS, CHOIR, TIMP, HORN, CLAR, FLUTE, BSN, OBOE, PAD, GLOCK, VIB, MARIMBA = \
    0, 8, 46, 48, 49, 45, 44, 42, 43, 52, 47, 60, 71, 73, 70, 68, 89, 9, 11, 12
MINOR = [0, 2, 3, 5, 7, 8, 10]


class Track:
    def __init__(self, ep, seed=1):
        self.ep = ep; self.tl = json.load(open(f'{ep}/timeline.json'))
        v, sr = sf.read(f'{ep}/voice.wav', dtype='float32'); v = v.mean(1) if v.ndim > 1 else v
        if sr != SR: v = np.interp(np.arange(int(len(v) * SR / sr)) * sr / SR, np.arange(len(v)), v)
        self.voice = v; self.T = len(v) / SR + 2.5
        n = int((self.T + 6) * SR); self.music = np.zeros(n); self.fx = np.zeros(n)
        self.F = SoundFont(f'{REPO}/models/GeneralUser-GS.sf2', SR); self.S = Sfx(SR, seed=seed)
        self.rng = np.random.default_rng(seed)

    # ---- timing ----
    def cue(self, b, w=0, n=1):
        B = self.tl['beats'][b]
        if isinstance(w, int): return B['words'][w]['s'] if w >= 0 else B['end']
        c = 0
        for x in B['words']:
            if re.sub(r"[^a-z0-9']", '', x['w'].lower()) == w.lower():
                c += 1
                if c == n: return x['s']
        raise KeyError((b, w))

    # ---- notes ----
    def note(self, t, prog, key, vel, dur, gain=1.0):
        if t < 0 or t > self.T: return
        a = self.F.note(prog, key, int(min(127, max(1, vel))), dur) * gain; s = int(t * SR); e = min(len(self.music), s + len(a)); self.music[s:e] += a[:e - s]
    def chord(self, t, prog, keys, vel, dur, gain=1.0):
        for k in keys: self.note(t, prog, k, vel, dur, gain)

    def bed(self, t0, t1, mood='tense', key=50, bpm=72, g=1.0):
        """One score section. key = MIDI root (50 = D3). Chords move every 2 bars in a minor key."""
        b = 60 / bpm; bar = 4 * b
        prog = {'tense': [0, -4, -2, -5], 'investigate': [0, 3, -4, -2], 'dread': [0, 1, 0, -1], 'warm': [0, -4, 3, -2], 'pulse': [0, -4, -2, -5]}[mood]
        t = t0; i = 0
        while t < t1 - 0.2:
            r = key + prog[(i // 2) % len(prog)]; third = r + (3 if mood != 'warm' or i % 4 else 4); fifth = r + 7
            L = min(2 * bar, t1 - t) if i % 2 == 0 else 0
            if L:
                if mood in ('tense', 'dread', 'pulse'):
                    self.chord(t, SLOW, [r, fifth, third + 12], 58, L + 0.6, 0.20 * g); self.note(t, CBASS, r - 12, 70, L + 0.4, 0.30 * g)
                if mood == 'dread': self.note(t, CHOIR, r + 12, 45, L, 0.10 * g); self.note(t, CELLO, r - 12 + 1 * (i % 4 == 2), 60, L, 0.18 * g)
                if mood in ('investigate', 'warm'):
                    self.chord(t, SLOW, [r, third + 12, fifth + 12], 52, L + 0.6, 0.13 * g); self.note(t, CELLO, r - 12, 62, L, 0.22 * g)
            # foreground figure per bar
            if mood in ('investigate', 'warm'):
                pat = [0, 7, 12, 15, 12, 7, 3, 7] if mood == 'investigate' else [0, 4, 7, 12, 7, 4, 7, 12]
                for j, p in enumerate(pat):
                    tt = t + j * b / 2
                    if tt < t1 - 0.1: self.note(tt, PIANO if mood == 'investigate' else HARP, r + 12 + p, 64 - 8 * (j % 2), b * 0.9, 0.20 * g)
            elif mood == 'pulse':
                for j in range(8):
                    tt = t + j * b / 2
                    if tt < t1 - 0.1: self.note(tt, PIZZ, r + (12 if j % 4 == 0 else 7), 84 - 10 * (j % 2), b * 0.4, 0.30 * g)
                self.note(t, TIMP, r - 12, 70, 0.8, 0.25 * g)
            elif mood == 'tense':
                for j, p in enumerate([12, 15, 14, 12]):
                    self.note(t + j * b, PIANO, r + 12 + p, 54, b * 1.6, 0.16 * g)
            elif mood == 'dread':
                self.note(t + 2 * b, PIANO, r + 24 + (1 if i % 2 else 0), 40, 2 * b, 0.12 * g)
            t += bar; i += 1

    def sting(self, t, key=50, g=1.0):   # soft low hit on a reveal
        self.note(t, TIMP, key - 12, 110, 1.2, 0.5 * g); self.chord(t, STR, [key - 12, key, key + 3], 96, 1.2, 0.28 * g); self.note(t, PIANO, key - 24, 100, 2.0, 0.35 * g)
    def riser(self, t0, t1, key=50, g=1.0):
        for k, d in enumerate([0, 3, 7, 12]): self.note(t0, TREM, key + d, 50 + 12 * k, t1 - t0, 0.12 * g)
    def tick(self, t0, t1, bpm=120, g=1.0):   # clock tick tension
        b = 60 / bpm; t = t0
        while t < t1: self.note(t, 115, 76, 60, 0.05, 0.10 * g); t += b   # woodblock

    # ---- sfx ----
    def put(self, x, t, gain=1.0):
        if x is None or t < 0: return
        s = int(t * SR); e = min(len(self.fx), s + len(x)); self.fx[s:e] += x[:e - s] * gain
    def sfx(self, folder, t, gain=0.5, which=None, maxlen=None): self.put(self.S.get(folder, which=which, maxlen=maxlen), t, gain)
    def amb(self, folder, t0, t1, gain=0.1, fade=0.4):
        x = self.S.bed(folder, t1 - t0)
        if x is None: return
        k = int(fade * SR); x[:k] *= np.linspace(0, 1, k); x[-k:] *= np.linspace(1, 0, k); self.put(x, t0, gain)

    # ---- mix ----
    def write(self, music_db=-21.0, duck=0.55):
        n = len(self.music); v = np.zeros(n); v[:len(self.voice)] = self.voice
        m = reverb(self.music, SR) if 'reverb' in globals() else self.music
        m = m[:n] if len(m) >= n else np.pad(m, (0, n - len(m)))
        # set the bed to music_db relative to the voice RMS, duck a little more under speech
        vr = np.sqrt(np.mean(v[v != 0] ** 2)) + 1e-9; mr = np.sqrt(np.mean(m[np.abs(m) > 1e-4] ** 2)) + 1e-9
        m *= vr / mr * 10 ** (music_db / 20)
        env = np.convolve(np.abs(v), np.ones(int(0.25 * SR)) / int(0.25 * SR), 'same'); env = np.clip(env / (env.max() + 1e-9) * 6, 0, 1)
        m *= 1 - (1 - duck) * env
        mix = v + m + self.fx
        mix = mix[: int(self.T * SR)]
        pk = np.abs(mix).max()
        if pk > 0.98: mix *= 0.98 / pk
        sf.write(f'{self.ep}/music.wav', m[: len(mix)].astype(np.float32), SR); sf.write(f'{self.ep}/sfx.wav', self.fx[: len(mix)].astype(np.float32), SR)
        sf.write(f'{self.ep}/audio.mix.wav', mix.astype(np.float32), SR)
        loudnorm(f'{self.ep}/audio.mix.wav', f'{self.ep}/audio.norm.wav')


def loudnorm(src, dst, I=-14, TP=-1.5, LRA=11):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', src, '-af', f'loudnorm=I={I}:TP={TP}:LRA={LRA}:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
    j = json.loads(r[r.rindex('{'):r.rindex('}') + 1])
    f = (f"loudnorm=I={I}:TP={TP}:LRA={LRA}:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}"
         f":measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true")
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', src, '-af', f, '-ar', '48000', dst], check=True)
