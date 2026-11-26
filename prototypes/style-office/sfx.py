# Synth ambience + sfx for the 10 s office trial (no samples, nothing to license)
import numpy as np, wave
SR=44100; D=10.6; N=int(SR*D); out=np.zeros(N)
rng=np.random.default_rng(1)
def add(sig,t,g=1.0):
    i=int(t*SR); j=min(N,i+len(sig)); out[i:j]+=sig[:j-i]*g
def env(n,a=0.002,r=0.05):
    t=np.arange(n)/SR; return np.minimum(1,t/a)*np.exp(-t/r)
# room tone + fluorescent hum
b=rng.standard_normal(N); b=np.convolve(b,np.ones(60)/60,'same'); out+=b*0.02
tt=np.arange(N)/SR; out+=0.006*np.sin(2*np.pi*100*tt)+0.003*np.sin(2*np.pi*200*tt)
# clock ticks
import math
prev=None
for k in range(int(D*100)):
    t=k/100; s=math.floor(48+t*2.5)
    if s!=prev and prev is not None:
        n=int(0.03*SR); x=rng.standard_normal(n)*env(n,0.0005,0.004)+np.sin(2*np.pi*3200*np.arange(n)/SR)*env(n,0.0005,0.006)
        add(x,t,0.25 if t<4.8 else 0.12)
    prev=s
# typing 0..4.0
t=0.15
while t<4.0:
    n=int(0.04*SR); x=rng.standard_normal(n)*env(n,0.0005,0.006); x=np.convolve(x,[1,-0.6],'same')
    add(x,t,0.22+rng.random()*0.12); t+=0.07+rng.random()*0.11
# bell ding at 4.8
n=int(1.6*SR); x=sum(np.sin(2*np.pi*f*np.arange(n)/SR)*a for f,a in [(1318,1),(2637,.4),(3951,.15)])*env(n,0.002,0.45); add(x,4.8,0.25)
# chair spin whoosh + caster rattle 5.45..6.35
n=int(1.0*SR); w=rng.standard_normal(n); w=np.convolve(w,np.ones(25)/25,'same'); e=np.sin(np.linspace(0,np.pi,n))**2; add(w*e,5.45,0.9)
for k in range(14): add(rng.standard_normal(int(0.01*SR))*env(int(0.01*SR),0.0003,0.003),5.5+k*0.06,0.12)
n=int(0.25*SR); f=np.linspace(900,1500,n); add(np.sin(2*np.pi*np.cumsum(f)/SR)*env(n,0.01,0.1),5.5,0.05)
# happy pluck jingle from 5.5
def pluck(freq,dur=0.5):
    n=int(dur*SR); tt=np.arange(n)/SR; return (np.sin(2*np.pi*freq*tt)+0.5*np.sin(4*np.pi*freq*tt)+0.2*np.sin(6*np.pi*freq*tt))*env(n,0.003,0.18)
notes=[(5.55,523),(5.7,659),(5.85,784),(6.0,1047),(6.4,784),(6.55,880),(6.7,1047),(7.1,880),(7.25,1047),(7.4,1175),(7.6,1319),(8.2,1047),(8.6,784),(8.9,659),(9.2,784),(9.6,1047)]
for t,f in notes: add(pluck(f),t,0.16)
for t,f in [(5.55,131),(6.4,175),(7.1,196),(8.2,131),(8.9,196),(9.6,131)]: add(pluck(f,0.9),t,0.28)
# relaxed sigh-ish exhale at 8.5 (filtered noise)
n=int(0.7*SR); w=rng.standard_normal(n); w=np.convolve(w,np.ones(12)/12,'same'); add(w*np.sin(np.linspace(0,np.pi,n)),8.45,0.12)
out=np.tanh(out*1.4)*0.8
fade=np.ones(N); k=int(0.5*SR); fade[-k:]=np.linspace(1,0,k); out*=fade
st=np.stack([out,out],1); d=(st*32767).astype(np.int16)
w=wave.open('audio.wav','wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(d.tobytes()); w.close()
