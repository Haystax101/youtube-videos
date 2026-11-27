import sys; sys.path.insert(0,'pipeline')
from backgrounds import generate
from pathlib import Path
S=("detailed comic book caricature illustration, thick black ink outlines, rich cel shading and texture, "
   "exaggerated cartoon faces with big expressive eyes and sweat drops, dramatic cinematic lighting, saturated colours, "
   "YouTube thumbnail composition with a large face in the foreground, no text, no letters, no logos")
P={
 'a': "a nervous young hacker in a dark hoodie at a glowing laptop in a dark bedroom at night, sweating and terrified, looking over his shoulder, "
      "behind him the door bursts open with police officers in tactical vests rushing in, red and blue police lights flooding the room, bitcoin coins scattered on the desk. "+S,
 'b': "split scene: on the left a smug rich young man in sunglasses leaning on a yellow sports car beside a tropical villa with piles of cash and bitcoin; "
      "on the right the same young man in handcuffs between two stern FBI agents in a grey police station, shocked and sweating. "+S,
 'c': "close up of a shocked young man with glasses staring at his laptop screen in a public library, a stern woman agent grabbing the open laptop from behind him, "
      "bookshelves behind, warm lamp light and cold blue screen glow. "+S,
}
out=Path('episodes/dark/long/001-dark-web-bosses/thumb')
for k,p in P.items():
    for v in (1,2):
        generate(p+f" variation {v}",1344,768,out/f'{k}{v}.jpg'); print(k,v,flush=True)
