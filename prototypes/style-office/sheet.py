import sys
from PIL import Image
ss=sys.argv[1].split(','); out=sys.argv[2]
ims=[Image.open(f'stills/s_{s}.jpg') for s in ss]
w,h=540,960; cols=min(len(ims),3); rows=(len(ims)+cols-1)//cols
sheet=Image.new('RGB',(w*cols,h*rows))
for i,im in enumerate(ims): sheet.paste(im.resize((w,h)),((i%cols)*w,(i//cols)*h))
sheet.save(out,quality=85)
