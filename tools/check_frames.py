"""Scan a rendered video for black or near-black patches before delivery.
Flags (1) frames where more than AREA of the picture is darker than LUMA (out of 255): the camera inside
a tree trunk, grass or a wall; (2) frames where pure black (luma < 4) jumps by more than JUMP above the
surrounding frames: one-frame glitch rectangles (a sprite or pass that failed to draw).
Usage: python3 tools/check_frames.py video.mp4 [--fps 30] [--luma 22] [--area 0.6] [--jump 0.06]
Prints merged time ranges and exits 1 if any were found."""
import subprocess, sys
import numpy as np

a = sys.argv[1:]; opt = lambda k, d: float(a[a.index(k) + 1]) if k in a else d
FPS, LUMA, AREA, JUMP = opt('--fps', 30), opt('--luma', 22), opt('--area', 0.6), opt('--jump', 0.06)
W, H = 108, 192
p = subprocess.Popen(['ffmpeg', '-loglevel', 'error', '-i', a[0], '-vf', f'fps={FPS},scale={W}:{H}', '-pix_fmt', 'gray', '-f', 'rawvideo', '-'], stdout=subprocess.PIPE)
bad, i, darks, blacks = [], 0, [], []
while True:
    b = p.stdout.read(W * H)
    if len(b) < W * H: break
    f = np.frombuffer(b, np.uint8).reshape(H, W)
    # ignore the caption band in the middle (white text on a dark stroke)
    m = np.ones_like(f, bool); m[int(H * 0.58):int(H * 0.69), :] = False
    darks.append((f[m] < LUMA).mean()); blacks.append((f[m] < 4).mean()); i += 1
blacks = np.array(blacks)
for k in range(i):
    nb = np.median(np.r_[blacks[max(0, k - 6):k], blacks[k + 1:k + 7]]) if i > 1 else 0
    if darks[k] > AREA or blacks[k] - nb > JUMP: bad.append((k / FPS, max(darks[k], blacks[k])))
ranges = []
for t, d in bad:
    if ranges and t - ranges[-1][1] <= 1.5 / FPS: ranges[-1][1] = t; ranges[-1][2] = max(ranges[-1][2], d)
    else: ranges.append([t, t, d])
for s, e, d in ranges: print(f'{s:6.2f}-{e:6.2f}s  dark {d:.0%} of frame')
print(f'{len(ranges)} dark patch(es) in {i / FPS:.1f}s')
sys.exit(1 if ranges else 0)
