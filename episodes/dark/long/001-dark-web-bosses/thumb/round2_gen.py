import sys; sys.path.insert(0,'pipeline')
from backgrounds import generate
from pathlib import Path
R=("cinematic photorealistic digital painting, dramatic moody lighting, high detail, sharp focus, rich contrast, "
   "YouTube thumbnail composition, clean and simple, no text, no letters, no logos, no watermark")
P={
 'v': "left half: a single hooded hacker in a black hoodie, face hidden in shadow, sitting behind a glowing laptop, lit by an eerie red glow in a dark room; "
      "right half: a team of armed federal agents in dark tactical vests with flashlights, lit by flashing blue and red police lights, the two sides facing each other, strong contrast. "+R,
 'a': "a hooded young man in a black hoodie being arrested at a laptop in a quiet public library, two federal agents in dark jackets grabbing his arms from behind, "
      "the laptop screen glowing, bookshelves behind, tense dramatic moment, wide shot. "+R,
 's': "a single hooded figure in a black hoodie seen from behind sitting at a laptop in a dark apartment at night, flashing blue and red police lights "
      "shining through the window blinds onto the wall, minimal composition, lots of empty dark space. "+R,
}
out=Path(sys.argv[1])
for k,p in P.items():
    for v in (1,2,3):
        try: generate(p+f" variation {v}",1344,768,out/f'{k}{v}.jpg'); print(k,v,flush=True)
        except Exception as e: print(k,v,'ERR',e,flush=True)
