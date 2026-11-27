import sys; sys.path.insert(0,'pipeline')
from backgrounds import generate
from pathlib import Path
S=("detailed comic book caricature illustration, thick black ink outlines, rich cel shading and texture, "
   "exaggerated cartoon faces with big expressive eyes and sweat drops, dramatic cinematic lighting, saturated colours, "
   "YouTube thumbnail composition with a large face in the foreground, no text, no letters, no logos")
P={
 'a': "a panicking bank clerk with glasses in a white shirt clutching his head beside a broken office printer flashing a red error light, "
      "printer paper flying, a huge pile of green dollar bills vanishing out of an open window behind him into the night, dark office at night. "+S,
 'b': "split scene: on the left a calm menacing hacker in a dark hoodie lit by green computer screens smirking; on the right a shocked bank officer "
      "in a suit staring at a typed payment slip with one word circled in red pen, sweat drops, piles of cash on the desk. "+S,
 'c': "a smug masked hacker in a dark hoodie running with sacks of dollar bills past a huge oil tanker ship at a dock at sunset, a shocked banker behind him pointing, "
      "dramatic sky. "+S,
}
out=Path('episodes/dark/long/002-bangladesh-bank/thumb')
for k,p in P.items():
    for v in (1,2):
        generate(p+f" variation {v}",1344,768,out/f'{k}{v}.jpg'); print(k,v,flush=True)
