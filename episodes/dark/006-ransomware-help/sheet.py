# python3 sheet.py OUT.jpg [cols]  -> contact sheet of stills/s_*.jpg sorted by time
import sys, glob, re
from PIL import Image, ImageDraw
fs = sorted(glob.glob('stills/s_*.jpg'), key=lambda f: float(re.findall(r's_([\d.]+)\.jpg', f)[0])); cols = int(sys.argv[2]) if len(sys.argv) > 2 else 8
w, h = 216, 384; rows = (len(fs) + cols - 1) // cols; o = Image.new('RGB', (cols * w, rows * (h + 18)), '#111'); d = ImageDraw.Draw(o)
for i, f in enumerate(fs):
    x, y = (i % cols) * w, (i // cols) * (h + 18); o.paste(Image.open(f).resize((w, h)), (x, y + 18)); d.text((x + 4, y + 3), re.findall(r's_([\d.]+)', f)[0], fill='white')
o.save(sys.argv[1], quality=88)
