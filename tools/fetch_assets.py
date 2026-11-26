"""Fetch free CC0 assets for the 3D set videos (runs on GitHub Actions, where the internet is open).
Poly Haven (all CC0): HDRI skies, PBR textures and glTF plant/rock/log models chosen by tag.
Sound effects: CC0 packs from Kenney and CC0-licensed OpenGameArt sound entries found by keyword.
Writes OUT/ (default assets/) plus OUT/manifest.json with every file's source and licence.
Usage: python3 tools/fetch_assets.py [OUT]"""
import json, os, re, sys, time, urllib.request, urllib.parse, zipfile, io
OUT = sys.argv[1] if len(sys.argv) > 1 else 'assets'
UA = {'User-Agent': 'world-of-how-asset-fetch/1.0'}
man = []; budget = [900 * 2**20]

def get(url, binary=True, tries=3):
    for k in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
                b = r.read(); return b if binary else b.decode('utf-8', 'replace')
        except Exception as e:
            print('  retry', k, url, e); time.sleep(2 + k * 3)
    return None

def save(rel, data, src, lic, note=''):
    if data is None or len(data) > budget[0]: return False
    p = os.path.join(OUT, rel); os.makedirs(os.path.dirname(p), exist_ok=True); open(p, 'wb').write(data)
    budget[0] -= len(data); man.append({'file': rel, 'source': src, 'license': lic, 'note': note, 'bytes': len(data)}); print('saved', rel, len(data) // 1024, 'KB'); return True

# ---------------- Poly Haven ----------------
API = 'https://api.polyhaven.com'
def ph_assets(t):
    j = get(f'{API}/assets?t={t}', False); return json.loads(j) if j else {}
def score(info, want, avoid=()):
    tags = ' '.join(info.get('tags', []) + info.get('categories', []) + [info.get('name', '')]).lower()
    s = sum(2 if w in tags else 0 for w in want) - sum(5 for a in avoid if a in tags)
    return s + min(info.get('download_count', 0), 200000) / 200000
def pick(assets, want, avoid=(), n=4):
    return sorted(assets.items(), key=lambda kv: -score(kv[1], want, avoid))[:n]

hdris = ph_assets('hdris')
for group, want, avoid, n in [('forest', ['forest', 'trees', 'woods', 'sunny', 'day'], ['night', 'indoor', 'urban', 'snow', 'studio'], 4),
                              ('meadow', ['meadow', 'field', 'grass', 'sunny', 'clear'], ['night', 'indoor', 'urban', 'snow', 'studio', 'forest'], 3),
                              ('dusk', ['sunset', 'dusk', 'golden', 'field'], ['indoor', 'urban', 'studio'], 2)]:
    for aid, info in pick(hdris, want, avoid, n):
        f = json.loads(get(f'{API}/files/{aid}', False) or '{}')
        try:
            u = f['hdri']['2k']['hdr']['url']; save(f'hdri/{group}/{aid}_2k.hdr', get(u), f'https://polyhaven.com/a/{aid}', 'CC0', info.get('name', ''))
            u = f['tonemapped']['url'] if 'tonemapped' in f else None
            if u: save(f'hdri/{group}/{aid}_preview.jpg', get(u), f'https://polyhaven.com/a/{aid}', 'CC0')
        except Exception as e: print('hdri fail', aid, e)

tex = ph_assets('textures')
for group, want, avoid, n in [('ground', ['forest', 'ground', 'leaves', 'moss', 'dirt', 'soil'], ['wall', 'brick', 'tile', 'floor', 'wood planks', 'fabric'], 5),
                              ('bark', ['bark', 'tree'], ['brick', 'wall'], 3),
                              ('grass', ['grass', 'meadow', 'lawn'], ['wall', 'brick', 'artificial'], 2),
                              ('rock', ['rock', 'stone', 'boulder'], ['wall', 'brick', 'tile'], 2)]:
    for aid, info in pick(tex, want, avoid, n):
        f = json.loads(get(f'{API}/files/{aid}', False) or '{}')
        for m in ('Diffuse', 'nor_gl', 'Rough', 'arm', 'AO', 'Displacement'):
            try: u = f[m]['1k']['jpg']['url']; save(f'textures/{group}/{aid}/{m}_1k.jpg', get(u), f'https://polyhaven.com/a/{aid}', 'CC0')
            except Exception: pass

models = ph_assets('models')
for group, want, avoid, n in [('plants', ['fern', 'plant', 'shrub', 'bush', 'grass', 'flower', 'nature'], ['indoor', 'pot', 'vase', 'furniture'], 10),
                              ('trees', ['tree', 'trunk', 'sapling', 'pine', 'fir'], ['indoor', 'pot', 'furniture'], 6),
                              ('rocks', ['rock', 'boulder', 'stone'], ['indoor', 'furniture'], 4),
                              ('wood', ['log', 'stump', 'branch', 'firewood', 'wood'], ['indoor', 'furniture', 'table', 'chair', 'shelf'], 5)]:
    for aid, info in pick(models, want, avoid, n):
        f = json.loads(get(f'{API}/files/{aid}', False) or '{}')
        try:
            g = f['gltf']['1k']['gltf']; save(f'models/{group}/{aid}/{aid}.gltf', get(g['url']), f'https://polyhaven.com/a/{aid}', 'CC0', info.get('name', ''))
            for path, inc in g.get('include', {}).items(): save(f'models/{group}/{aid}/{path}', get(inc['url']), f'https://polyhaven.com/a/{aid}', 'CC0')
        except Exception as e: print('model fail', aid, e)

# ---------------- Kenney (CC0) sound packs ----------------
for slug in ['rpg-audio', 'impact-sounds', 'interface-sounds', 'digital-audio', 'casino-audio', 'voiceover-pack']:
    html = get(f'https://kenney.nl/assets/{slug}', False) or ''
    m = re.findall(r'href="([^"]+\.zip)"', html)
    if not m: print('no zip for', slug); continue
    z = get(urllib.parse.urljoin('https://kenney.nl/', m[0]))
    if not z: continue
    try:
        with zipfile.ZipFile(io.BytesIO(z)) as zf:
            for nm in zf.namelist():
                if nm.lower().endswith(('.ogg', '.wav', '.mp3')): save(f'sfx/kenney-{slug}/{os.path.basename(nm)}', zf.read(nm), f'https://kenney.nl/assets/{slug}', 'CC0')
                if 'license' in nm.lower(): save(f'sfx/kenney-{slug}/License.txt', zf.read(nm), f'https://kenney.nl/assets/{slug}', 'CC0')
    except Exception as e: print('kenney zip fail', slug, e)

# ---------------- OpenGameArt CC0 sound effects by keyword ----------------
OGA = 'https://opengameart.org'
def oga_search(q):
    # art type 13 = sound effect, licence 4 = CC0
    url = f'{OGA}/art-search-advanced?keys={urllib.parse.quote(q)}&field_art_type_tid%5B%5D=13&field_art_licenses_tid%5B%5D=4&sort_by=count&sort_order=DESC'
    html = get(url, False) or ''
    return list(dict.fromkeys(re.findall(r'href="(/content/[a-z0-9\-]+)"', html)))
seen = set()
for q, n in [('footsteps', 4), ('forest ambience', 3), ('birds', 3), ('campfire', 3), ('fire crackle', 2), ('wind', 3), ('whoosh', 3), ('leaves', 2), ('crickets', 2), ('swoosh', 2), ('splash', 2), ('waves', 3), ('ocean', 2), ('crowd', 2), ('thud', 2), ('wood creak', 2), ('rope', 1), ('cartoon', 3), ('pop', 2)]:
    for page in oga_search(q)[:n]:
        if page in seen: continue
        seen.add(page); html = get(OGA + page, False) or ''
        if 'CC0' not in html: print('skip (no CC0 on page)', page); continue
        for fu in dict.fromkeys(re.findall(r'href="(https://opengameart\.org/sites/default/files/[^"]+\.(?:ogg|wav|mp3|zip|flac))"', html)):
            data = get(fu)
            if not data: continue
            base = f'sfx/oga/{page.split("/")[-1]}'
            if fu.endswith('.zip'):
                try:
                    with zipfile.ZipFile(io.BytesIO(data)) as zf:
                        for nm in zf.namelist()[:80]:
                            if nm.lower().endswith(('.ogg', '.wav', '.mp3', '.flac')): save(f'{base}/{os.path.basename(nm)}', zf.read(nm), OGA + page, 'CC0', q)
                except Exception as e: print('oga zip fail', fu, e)
            else: save(f'{base}/{urllib.parse.unquote(os.path.basename(fu))}', data, OGA + page, 'CC0', q)

os.makedirs(OUT, exist_ok=True); json.dump(man, open(os.path.join(OUT, 'manifest.json'), 'w'), indent=1)
print('total files', len(man), 'MB', sum(m['bytes'] for m in man) // 2**20)
