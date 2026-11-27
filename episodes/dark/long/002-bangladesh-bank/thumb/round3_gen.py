import sys; sys.path.insert(0,'pipeline')
from backgrounds import generate
from pathlib import Path
R=("cinematic photorealistic digital painting, dramatic moody lighting, high detail, sharp focus, rich contrast, "
   "YouTube thumbnail composition, clean and simple, no text, no letters, no logos, no watermark")
P={
 'h': "left half: a shadowy group of four hooded hackers in black hoodies, faces hidden in darkness, lit only by a cold red glow, standing in a dark room; "
      "right half: a grand neoclassical central bank building with columns lit by warm golden light at night, the two sides facing each other, strong contrast between red darkness and gold. "+R,
 'r': "hooded hackers in black hoodies and masks carrying bulging sacks overflowing with hundred dollar bills out of a huge open bank vault door, "
      "money flying through the air, red alarm light, dramatic heist scene, wide shot. "+R,
 's': "a single hooded hacker in a black hoodie seen from behind sitting in a dark room facing a large glowing computer screen showing a bank transfer, "
      "the room lit only by the screen, minimal composition, lots of empty dark space. "+R,
}
out=Path(sys.argv[1])
for k,p in P.items():
    for v in (1,2,3):
        try: generate(p+f" variation {v}",1344,768,out/f'{k}{v}.jpg'); print(k,v,flush=True)
        except Exception as e: print(k,v,'ERR',e,flush=True)
