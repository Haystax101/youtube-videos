"""Recorded CC0 sound effects from assets/sfx/<folder>/*.wav (release sfx-v1, tools/fetch_sfx.py).
    from sfxlib import Sfx
    fx = Sfx(SR, seed=3)
    clip = fx.get('whoosh')                    # a random file from the folder, peak-normalised, or None
    bed = fx.bed('forest', seconds=20)         # a looped, crossfaded ambience bed of that length
    steps = fx.segment('footsteps_forest', 3)  # a random 3 s slice of a longer recording
Every helper returns None when the folder is missing, so mixes can fall back to synthesised sound."""
import glob, json, os
import numpy as np, soundfile as sf

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'assets', 'sfx'))

def _resample(x, sr, SR):
    if sr == SR: return x
    t = np.arange(int(len(x) * SR / sr)) * sr / SR
    return np.interp(t, np.arange(len(x)), x)

class Sfx:
    def __init__(self, SR, seed=0, root=ROOT):
        self.SR, self.root, self.rng, self.cache = SR, root, np.random.default_rng(seed), {}
        self.bad = set()
        try:  # optional per-file blacklist after listening: assets/sfx/skip.json ["folder/file.wav", ...]
            self.bad = set(json.load(open(os.path.join(root, 'skip.json'))))
        except Exception: pass

    def files(self, folder):
        fs = sorted(glob.glob(os.path.join(self.root, folder, '*.wav')))
        return [f for f in fs if os.path.relpath(f, self.root) not in self.bad]

    def load(self, f):
        if f not in self.cache:
            x, sr = sf.read(f, dtype='float32'); x = x.mean(1) if x.ndim > 1 else x
            x = _resample(x, sr, self.SR); x = x / (np.abs(x).max() + 1e-9)
            nz = np.where(np.abs(x) > 0.02)[0]
            self.cache[f] = x[nz[0]: nz[-1] + 1] if len(nz) else x
        return self.cache[f]

    def get(self, folder, which=None, maxlen=None, fade=0.02):
        fs = self.files(folder)
        if not fs: return None
        x = self.load(fs[which % len(fs)] if which is not None else fs[self.rng.integers(len(fs))]).copy()
        if maxlen: x = x[: int(maxlen * self.SR)]
        k = min(len(x) // 4, int(fade * self.SR))
        if k: x[-k:] *= np.linspace(1, 0, k)
        return x

    def segment(self, folder, seconds, fade=0.08, which=None):
        fs = self.files(folder)
        if not fs: return None
        x = self.load(fs[which % len(fs)] if which is not None else fs[self.rng.integers(len(fs))])
        n = int(seconds * self.SR)
        if n <= 0: return None
        if len(x) <= n: x = np.tile(x, n // max(1, len(x)) + 1)
        s = self.rng.integers(0, len(x) - n + 1); y = x[s:s + n].copy()
        k = min(n // 3, int(fade * self.SR)); y[:k] *= np.linspace(0, 1, k); y[-k:] *= np.linspace(1, 0, k)
        return y

    def bed(self, folder, seconds, xf=1.0):
        fs = self.files(folder)
        if not fs: return None
        n, k = int(seconds * self.SR), int(xf * self.SR); out = np.zeros(n + k); p = 0
        while p < n:
            x = self.load(fs[self.rng.integers(len(fs))])
            if len(x) < 3 * k: x = np.tile(x, 3 * k // max(1, len(x)) + 1)
            seg = x.copy(); seg[:k] *= np.linspace(0, 1, k); seg[-k:] *= np.linspace(1, 0, k)
            e = min(len(out), p + len(seg)); out[p:e] += seg[:e - p]; p += len(seg) - k
        y = out[:n]; return y / (np.sqrt(np.mean(y ** 2)) + 1e-9) * 0.25  # RMS-normalised, so beds sit at a known level
