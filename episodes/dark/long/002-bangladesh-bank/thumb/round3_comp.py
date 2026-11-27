from PIL import Image, ImageDraw, ImageFont, ImageEnhance, ImageFilter
F='/usr/share/fonts/opentype/inter/InterDisplay-Black.otf'
W,H=1280,720
def base(f,color=1.25,con=1.1,bri=1.1):
    im=Image.open(f).convert('RGB').resize((W,int(W*768/1344)))
    im=im.crop((0,(im.height-H)//2,W,(im.height-H)//2+H)) if im.height>H else im.resize((W,H))
    im=ImageEnhance.Color(im).enhance(color); im=ImageEnhance.Contrast(im).enhance(con); im=ImageEnhance.Brightness(im).enhance(bri)
    return im
def text(im,s,xy,size,fill='#ffd21f',anchor='la',stroke=8):
    d=ImageDraw.Draw(im); f=ImageFont.truetype(F,size)
    sh=Image.new('RGBA',im.size,(0,0,0,0)); ds=ImageDraw.Draw(sh)
    ds.text((xy[0]+6,xy[1]+8),s,font=f,fill=(0,0,0,200),anchor=anchor,stroke_width=stroke,stroke_fill=(0,0,0,200))
    im.paste(sh.filter(ImageFilter.GaussianBlur(6)),(0,0),sh.filter(ImageFilter.GaussianBlur(6)))
    d.text(xy,s,font=f,fill=fill,anchor=anchor,stroke_width=stroke,stroke_fill='black')
def tag(im,s,xy,size,bg='#e0201b',fg='white',rot=-4):
    f=ImageFont.truetype(F,size); b=f.getbbox(s); w,h=b[2]+size*0.6,b[3]+size*0.45
    t=Image.new('RGBA',(int(w),int(h)),bg); ImageDraw.Draw(t).text((w/2,h/2),s,font=f,fill=fg,anchor='mm')
    t=t.rotate(rot,expand=True,resample=Image.BICUBIC); im.paste(t,xy,t)
def flag(im,xy,w=120,rot=-4):
    h=int(w*0.5); fl=Image.new('RGBA',(w,h),'#024fa2'); d=ImageDraw.Draw(fl)
    d.rectangle((0,h*0.17,w,h*0.83),fill='white'); d.rectangle((0,h*0.21,w,h*0.79),fill='#ed1c27')
    cx,cy,r=w*0.36,h/2,h*0.25; d.ellipse((cx-r,cy-r,cx+r,cy+r),fill='white')
    import math; pts=[(cx+r*0.9*math.cos(math.radians(-90+i*36))*(1 if i%2==0 else 0.4),cy+r*0.9*math.sin(math.radians(-90+i*36))*(1 if i%2==0 else 0.4)) for i in range(10)]
    d.polygon(pts,fill='#ed1c27')
    fl=fl.rotate(rot,expand=True,resample=Image.BICUBIC); im.paste(fl,xy,fl)
def vign(im,s=0.55):
    m=Image.new('L',(W,H),0); ImageDraw.Draw(m).ellipse((-W*0.2,-H*0.25,W*1.2,H*1.25),fill=255)
    m=m.filter(ImageFilter.GaussianBlur(160)); dark=ImageEnhance.Brightness(im).enhance(1-s)
    return Image.composite(im,dark,m)
# 1 hackers vs bank
im=vign(base('h1.jpg',1.35,1.12,1.15),0.4)
flag(im,(60,70),150); tag(im,'HACKERS',(230,66),46)
text(im,'$1 BILLION',(W*0.74,H-40),118,anchor='ms')
d=ImageDraw.Draw(im)
im.save('T1-hackers-vs-bank.jpg',quality=93)
# 2 robbing
im=vign(base('r2.jpg',1.3,1.12,1.25),0.35)
flag(im,(50,50),150); tag(im,'NORTH KOREA',(220,48),46)
text(im,'$1 BILLION',(W/2,H-36),130,anchor='ms')
im.save('T2-robbing-bank.jpg',quality=93)
# 3 simple
im=base('s1.jpg',1.2,1.1,1.2)
text(im,'ONE TYPO',(W*0.66,H*0.24),104,fill='white',anchor='ms')
im.save('T3-simple.jpg',quality=93)
