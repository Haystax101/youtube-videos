"""Minimal SoundFont (.sf2) sample player in numpy, so the pipeline can render real orchestral
instrument samples without installing a synth. Supports key/velocity zones, root key, tuning,
looping, attenuation and a volume envelope (delay/attack/hold/decay/sustain/release).

    sf = SoundFont("models/GeneralUser-GS.sf2", sr=24000)
    audio = sf.note(program=48, key=62, vel=100, dur=1.5)          # bank 0
    drums = sf.note(program=0, key=36, vel=110, dur=0.5, bank=128)   # GM percussion
"""
import struct
import numpy as np

GEN = dict(startOff=0, endOff=1, loopStartOff=2, loopEndOff=3, startCoarse=4, pan=17, delayVol=33, attackVol=34, holdVol=35,
           decayVol=36, sustainVol=37, releaseVol=38, instrument=41, keyRange=43, velRange=44, loopStartCoarse=45, attenuation=48,
           endCoarse=12, loopEndCoarse=50, coarseTune=51, fineTune=52, sampleID=53, sampleModes=54, scaleTuning=56, rootKey=58)
INV = {v: k for k, v in GEN.items()}


def _chunks(buf, off, end):
    while off < end:
        cid, size = struct.unpack_from('<4sI', buf, off)
        yield cid, off + 8, size
        off += 8 + size + (size & 1)


class SoundFont:
    def __init__(self, path, sr=24000):
        self.sr = sr
        b = open(path, 'rb').read()
        assert b[:4] == b'RIFF' and b[8:12] == b'sfbk'
        pd = {}
        for cid, o, size in _chunks(b, 12, len(b)):
            if cid != b'LIST':
                continue
            kind = b[o:o + 4]
            for c2, o2, s2 in _chunks(b, o + 4, o + size):
                if kind == b'sdta' and c2 == b'smpl':
                    self.smpl = np.frombuffer(b, dtype='<i2', count=s2 // 2, offset=o2).astype(np.float32) / 32768
                if kind == b'pdta':
                    pd[c2.decode()] = b[o2:o2 + s2]
        rec = lambda name, fmt: [struct.unpack_from(fmt, pd[name], i) for i in range(0, len(pd[name]), struct.calcsize(fmt))]
        self.phdr = rec('phdr', '<20sHHHIII'); self.pbag = rec('pbag', '<HH'); self.pgen = rec('pgen', '<Hh')
        self.inst = rec('inst', '<20sH'); self.ibag = rec('ibag', '<HH'); self.igen = rec('igen', '<Hh')
        self.shdr = rec('shdr', '<20sIIIIIBbHH')
        self.pgen_raw = pd['pgen']; self.igen_raw = pd['igen']
        self._zones = {}
        self._cache = {}

    def _gens(self, raw, gens, a, b):
        out = {}
        for i in range(a, b):
            op = gens[i][0]
            if op in (43, 44):
                lo, hi = struct.unpack_from('<BB', raw, i * 4 + 2); out[INV[op]] = (lo, hi)
            elif op in INV:
                out[INV[op]] = gens[i][1]
        return out

    def zones(self, program, bank=0):
        key = (bank, program)
        if key in self._zones:
            return self._zones[key]
        pi = next((i for i, h in enumerate(self.phdr[:-1]) if h[1] == program and h[2] == bank), None)
        if pi is None:
            pi = next(i for i, h in enumerate(self.phdr[:-1]) if h[1] == program)
        zs = []; pglob = {}
        for bi in range(self.phdr[pi][3], self.phdr[pi + 1][3]):
            pg = self._gens(self.pgen_raw, self.pgen, self.pbag[bi][0], self.pbag[bi + 1][0])
            if 'instrument' not in pg:
                pglob = pg; continue
            pg = {**pglob, **pg}; ii = pg['instrument']; iglob = {}
            for bj in range(self.inst[ii][1], self.inst[ii + 1][1]):
                ig = self._gens(self.igen_raw, self.igen, self.ibag[bj][0], self.ibag[bj + 1][0])
                if 'sampleID' not in ig:
                    iglob = ig; continue
                z = {**iglob, **ig}
                # preset-level generators are additive offsets for tuning/attenuation
                for k in ('coarseTune', 'fineTune', 'attenuation'):
                    z[k] = z.get(k, 0) + pg.get(k, 0)
                pk = pg.get('keyRange', (0, 127)); ik = z.get('keyRange', (0, 127))
                z['keyRange'] = (max(pk[0], ik[0]), min(pk[1], ik[1]))
                zs.append(z)
        self._zones[key] = zs
        return zs

    def note(self, program, key, vel=100, dur=1.0, bank=0, release=None):
        ck = (program, bank, key, vel // 8, round(dur, 2), release)
        if ck in self._cache:
            return self._cache[ck]
        sr = self.sr; out = None
        for z in self.zones(program, bank):
            kr = z['keyRange']; vr = z.get('velRange', (0, 127))
            if not (kr[0] <= key <= kr[1] and vr[0] <= vel <= vr[1]):
                continue
            name, start, end, ls, le, srate, opitch, pcorr, link, stype = self.shdr[z['sampleID']]
            start += z.get('startOff', 0) + 32768 * z.get('startCoarse', 0); end += z.get('endOff', 0) + 32768 * z.get('endCoarse', 0)
            ls += z.get('loopStartOff', 0) + 32768 * z.get('loopStartCoarse', 0); le += z.get('loopEndOff', 0) + 32768 * z.get('loopEndCoarse', 0)
            root = z.get('rootKey', -1); root = opitch if root < 0 else root
            semis = (key - root) * z.get('scaleTuning', 100) / 100 + z.get('coarseTune', 0) + (z.get('fineTune', 0) + pcorr) / 100
            step = 2 ** (semis / 12) * srate / sr
            tc = lambda k, d: 2 ** (z.get(k, d) / 1200)
            att, hold, dec = tc('attackVol', -12000), tc('holdVol', -12000), tc('decayVol', -12000)
            sus = 10 ** (-max(0, z.get('sustainVol', 0)) / 200); rel = release if release is not None else min(tc('releaseVol', -12000), 2.5)
            n = int((dur + rel) * sr); t = np.arange(n) / sr
            pos = t * step * sr
            looped = z.get('sampleModes', 0) in (1, 3) and le > ls + 8
            if looped:
                L = le - ls; rel_start = ls - start
                p = pos.copy(); m = p >= le - start; p[m] = rel_start + (p[m] - rel_start) % L
            else:
                p = pos; p = np.where(p < end - start - 1, p, end - start - 1)
            i0 = p.astype(np.int64); fr = (p - i0).astype(np.float32)
            src = self.smpl[start:end + 2]
            i0 = np.clip(i0, 0, len(src) - 2)
            s = src[i0] * (1 - fr) + src[i0 + 1] * fr
            if not looped:
                s[pos >= end - start - 1] = 0
            env = np.interp(t, [0, att, att + hold, att + hold + dec, 1e9], [0, 1, 1, sus, sus])
            r = np.clip(1 - (t - dur) / max(rel, 1e-3), 0, 1); env = env * np.where(t > dur, r, 1)
            gain = 10 ** (-z.get('attenuation', 0) * 0.4 / 200) * (vel / 127) ** 1.6
            v = s * env * gain
            out = v if out is None else (out[:len(v)] + v[:len(out)] if len(out) != len(v) else out + v)
        if out is None:
            out = np.zeros(int(dur * sr), dtype=np.float32)
        self._cache[ck] = out
        return out


def reverb(x, sr, seconds=2.2, wet=0.28, seed=3):
    """Cheap hall: convolve with exponentially decaying filtered noise (FFT)."""
    rng = np.random.default_rng(seed); n = int(seconds * sr); t = np.arange(n) / sr
    ir = rng.normal(0, 1, n) * np.exp(-t * 6.9 / seconds); ir = np.convolve(ir, np.ones(6) / 6, 'same'); ir[: int(0.02 * sr)] *= np.linspace(0, 1, int(0.02 * sr))
    ir /= np.sqrt((ir ** 2).sum())
    L = len(x) + n; F = 1 << (L - 1).bit_length()
    y = np.fft.irfft(np.fft.rfft(x, F) * np.fft.rfft(ir, F), F)[: len(x)]
    return x * (1 - wet) + y * wet * 2.0
