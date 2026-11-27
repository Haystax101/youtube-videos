from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
F='/home/user/youtube-videos/prototypes/casefile2d/fonts/LilitaOne.ttf'
YEL=(255,206,38); WHT=(255,255,255)
def base(src):
    im=Image.open(src).convert('RGB'); w,h=im.size; ch=int(w*9/16); top=(h-ch)//2
    im=im.crop((0,top,w,top+ch)).resize((1920,1080),Image.LANCZOS)
    im=ImageEnhance.Contrast(ImageEnhance.Color(im).enhance(1.12)).enhance(1.06)
    return im
def words(im,parts,xy,size,anchor='la',angle=0):
    # parts: [(text,color)], drawn on one line with thick black outline + drop shadow
    f=ImageFont.truetype(F,size); d=ImageDraw.Draw(im)
    widths=[d.textlength(t,font=f) for t,_ in parts]; sp=size*0.22; total=sum(widths)+sp*(len(parts)-1)
    x,y=xy
    if anchor=='ma': x-=total/2
    if anchor=='ra': x-=total
    layer=Image.new('RGBA',im.size,(0,0,0,0)); L=ImageDraw.Draw(layer)
    sh=Image.new('RGBA',im.size,(0,0,0,0)); S=ImageDraw.Draw(sh)
    cx=x
    for (t,c),wd in zip(parts,widths):
        S.text((cx+10,y+12),t,font=f,fill=(0,0,0,200),stroke_width=int(size*0.12),stroke_fill=(0,0,0,200))
        L.text((cx,y),t,font=f,fill=c,stroke_width=int(size*0.11),stroke_fill=(15,12,10))
        cx+=wd+sp
    sh=sh.filter(ImageFilter.GaussianBlur(6))
    if angle:
        sh=sh.rotate(angle,center=(x+total/2,y+size/2),resample=Image.BICUBIC); layer=layer.rotate(angle,center=(x+total/2,y+size/2),resample=Image.BICUBIC)
    im.paste(sh,(0,0),sh); im.paste(layer,(0,0),layer); return im
def patch(im,box,src_dx):
    # hide a logo by copying a nearby clean patch over it
    x0,y0,x1,y1=box; p=im.crop((x0+src_dx,y0,x1+src_dx,y1)); im.paste(p,(x0,y0)); return im
# 1: raid
im=base('a1.jpg')
im=words(im,[('ALWAYS',WHT)],(40,640),190,angle=4)
im=words(im,[('CAUGHT?',YEL)],(60,830),210,angle=4)
im.save('thumb-1-raid.jpg',quality=92)
# 2: split
im=base('b2.jpg')
im=words(im,[('UNTOUCHABLE',WHT)],(470,50),128,anchor='ma')
im=words(im,[('CAUGHT?',YEL)],(1450,40),170,anchor='ma')
im.save('thumb-2-split.jpg',quality=92)
# 3: library
im=base('c2.jpg')
im=words(im,[('ONE',WHT),('MISTAKE',YEL)],(960,40),190,anchor='ma')
im.save('thumb-3-library.jpg',quality=92)
