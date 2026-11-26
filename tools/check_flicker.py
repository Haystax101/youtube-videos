"""Find one-frame pops (pixels that change for a single frame and come back): z-fighting, texture or geometry flashes.
Usage: python3 tools/check_flicker.py VIDEO [min_pixels]. Prints times with many popping pixels (moving particles and fast
repeating patterns also show up; isolated spikes are the ones to look at)."""
import sys, subprocess, numpy as np
W,H=270,480
raw=subprocess.run(['ffmpeg','-loglevel','error','-i',sys.argv[1],'-vf',f'scale={W}:{H}','-f','rawvideo','-pix_fmt','gray','-'],capture_output=True).stdout
F=np.frombuffer(raw,np.uint8).reshape(-1,H,W).astype(np.float32)
res=[]
for i in range(1,len(F)-1):
    a,b,c=F[i-1],F[i],F[i+1]
    d1=np.abs(b-a); d2=np.abs(b-c); d0=np.abs(a-c)
    if d0.mean()>12: continue          # a cut between i-1 and i+1: different shots, not a pop
    m=(d1>25)&(d2>25)&(d0<10)          # pixel pops for one frame then returns
    m[int(H*0.62):int(H*0.75)]=False    # captions band
    m[:int(H*0.12)]=False
    n=m.sum()
    if n>(int(sys.argv[2]) if len(sys.argv)>2 else 600):
        ys,xs=np.nonzero(m); res.append((i/30,n,int(np.median(xs)),int(np.median(ys))))
for r in res: print('%.2f n=%d at x=%d y=%d'%r)
print(len(res),'flicker frames of',len(F))
