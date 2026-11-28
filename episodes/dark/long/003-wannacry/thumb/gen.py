import sys; sys.path.insert(0,'pipeline')
from backgrounds import generate
from pathlib import Path
R=("cinematic photorealistic digital painting, dramatic moody lighting, high detail, sharp focus, rich contrast, "
   "YouTube thumbnail composition, clean and simple, no text, no letters, no logos, no watermark")
P={
 'h': "a dim hospital corridor with a row of computer monitors on a nurses' station all glowing bright red with a large padlock symbol, worried doctor in scrubs in the background, red light spilling across the floor. "+R,
 'b': "a young man with messy hair seen from behind sitting at a desk in a small cosy bedroom at night, two monitors in front of him showing a dark world map covered in glowing red dots, warm desk lamp, posters on the wall. "+R,
 'k': "close up of a single big red glowing switch lever on a dark industrial control panel, being pulled down by a hand, sparks, red and amber light, dramatic. "+R,
}
out=Path(sys.argv[1])
for k,p in P.items():
    for v in (1,2):
        try: generate(p+f" variation {v}",1344,768,out/f'{k}{v}.jpg'); print(k,v,flush=True)
        except Exception as e: print(k,v,'ERR',e,flush=True)
