import sys, glob
from PIL import Image, ImageDraw
fs = sys.argv[2].split(','); out = sys.argv[1]; cols = int(sys.argv[3]) if len(sys.argv) > 3 else 7
w, h = 270, 480; rows = (len(fs) + cols - 1) // cols
o = Image.new('RGB', (cols * w, rows * (h + 20)), '#111'); d = ImageDraw.Draw(o)
for i, f in enumerate(fs):
    im = Image.open(f'stills/s_{f}.jpg').resize((w, h)); x, y = (i % cols) * w, (i // cols) * (h + 20); o.paste(im, (x, y + 20)); d.text((x + 4, y + 4), f, fill='white')
o.save(out, quality=88)
