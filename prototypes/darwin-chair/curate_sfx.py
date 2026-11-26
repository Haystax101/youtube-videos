"""Builds assets/sfx for Darwin's chair from the sfx-darwin-chair release (untarred at SRC): keeps only the real,
non-hissy recordings (hiss_scan clean) and cuts six creaks from the office-chair recording. Rolling, gasps and
applause stay on the tonal fallbacks in mixbed.py (the fetched ones were spoken words, marches or broadband noise).
Usage: python3 curate_sfx.py SRC/assets/sfx  -> assets/sfx"""
import sys, os, shutil, numpy as np, soundfile as sf
S = sys.argv[1]; D = os.path.join(os.path.dirname(__file__), '../../assets/sfx'); shutil.rmtree(D, ignore_errors=True)
def cp(src, dst): os.makedirs(os.path.dirname(f'{D}/{dst}'), exist_ok=True); shutil.copy(f'{S}/{src}', f'{D}/{dst}')
cp('cartoon/nl_boing.wav', 'cartoon/a_nl_boing.wav'); cp('cartoon/nl_boing.wav', 'spring/b_nl_boing.wav')
for i in [1, 2, 10, 11, 12]: cp(f'whoosh/swish_{i}.wav', f'whoosh/b_swish_{i}.wav')
a, sr = sf.read(f'{S}/creak/assorted_creaking_noises_of_office_chair.wav'); w = int(0.05 * sr)
e = np.array([np.sqrt(np.mean(a[i:i + w] ** 2)) for i in range(0, len(a) - w, w)]); picks = []
for i in np.argsort(-e):
    if all(abs(i - p) > 40 for p in picks): picks.append(i)
    if len(picks) == 6: break
os.makedirs(f'{D}/creak', exist_ok=True)
for n, p in enumerate(sorted(picks)):
    s = max(0, p * w - int(0.15 * sr)); seg = a[s:s + int(0.9 * sr)].copy(); f = int(0.05 * sr); seg[-f:] *= np.linspace(1, 0, f)
    sf.write(f'{D}/creak/c{n}.wav', seg, sr)
print('curated', sum(len(fs) for _, _, fs in os.walk(D)), 'files')
