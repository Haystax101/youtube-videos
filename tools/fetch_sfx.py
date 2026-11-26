"""Fetch CC0 / public-domain sound effects and Poly Haven textures for one video (runs on GitHub
Actions, where the internet is open; Claude sessions can't reach these sites).
Request file (sfx-request.txt): first line = a name (the release becomes sfx-<name>), then
  sfx: <query>[, <query>...]      sound searches (Wikimedia Commons CC0/PD audio + OpenGameArt CC0)
  tex: <query>[, <query>...]      Poly Haven texture searches (CC0), 1k jpg maps
  kenney: <pack-slug>[, ...]      Kenney CC0 audio packs
Writes OUT/ plus OUT/manifest.json (every file's source page and licence).
Usage: python3 tools/fetch_sfx.py sfx-request.txt OUT"""
import json, os, re, sys, time, urllib.request, urllib.parse, zipfile, io
REQ, OUT = sys.argv[1], sys.argv[2]
UA = {'User-Agent': 'world-of-how-asset-fetch/1.0 (CC0 sound research; github.com/Haystax101/youtube-videos)'}
man = []; budget = [600 * 2**20]
lines = [l.strip() for l in open(REQ) if l.strip() and not l.startswith('#')]
spec = {'sfx': [], 'tex': [], 'kenney': []}
for l in lines[1:]:
    k, _, v = l.partition(':')
    if k.strip() in spec: spec[k.strip()] += [q.strip() for q in v.split(',') if q.strip()]

def get(url, binary=True, tries=3):
    for k in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
                b = r.read(); return b if binary else b.decode('utf-8', 'replace')
        except Exception as e:
            print('  retry', k, url[:120], e); time.sleep(2 + k * 3)
    return None

def slug(s): return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')[:60]
def save(rel, data, src, lic, note=''):
    if data is None or len(data) > budget[0] or len(data) > 40 * 2**20: return False
    p = os.path.join(OUT, rel); os.makedirs(os.path.dirname(p), exist_ok=True); open(p, 'wb').write(data)
    budget[0] -= len(data); man.append({'file': rel, 'source': src, 'license': lic, 'note': note, 'bytes': len(data)}); print('saved', rel, len(data) // 1024, 'KB'); return True

# ---------- Wikimedia Commons: audio files whose licence is CC0 or public domain ----------
CAPI = 'https://commons.wikimedia.org/w/api.php'
OK_LIC = re.compile(r'^(cc0|cc-zero|public domain|pd|pdm)', re.I)
for q in spec['sfx']:
    p = {'action': 'query', 'format': 'json', 'generator': 'search', 'gsrsearch': f'{q} filetype:audio', 'gsrnamespace': 6, 'gsrlimit': 25,
         'prop': 'imageinfo', 'iiprop': 'url|extmetadata|size', 'iiextmetadatafilter': 'LicenseShortName|ImageDescription'}
    j = json.loads(get(CAPI + '?' + urllib.parse.urlencode(p), False) or '{}'); n = 0
    for pg in sorted((j.get('query', {}).get('pages', {}) or {}).values(), key=lambda x: x.get('index', 0)):
        ii = (pg.get('imageinfo') or [{}])[0]; lic = ii.get('extmetadata', {}).get('LicenseShortName', {}).get('value', '')
        if not OK_LIC.match(lic.strip()) or ii.get('size', 0) > 25 * 2**20: continue
        u = ii.get('url'); ext = os.path.splitext(u)[1].lower()
        if ext not in ('.ogg', '.oga', '.wav', '.flac', '.mp3', '.opus'): continue
        if save(f'sfx/commons/{slug(q)}/{slug(pg["title"][5:])}{ext}', get(u), ii.get('descriptionurl', u), lic, q): n += 1
        if n >= 6: break

# ---------- OpenGameArt: CC0 sound effects ----------
OGA = 'https://opengameart.org'; seen = set()
for q in spec['sfx']:
    url = f'{OGA}/art-search-advanced?keys={urllib.parse.quote(q)}&field_art_type_tid%5B%5D=13&field_art_licenses_tid%5B%5D=4&sort_by=count&sort_order=DESC'
    pages = list(dict.fromkeys(re.findall(r'href="(/content/[a-z0-9\-]+)"', get(url, False) or '')))[:3]
    for page in pages:
        if page in seen: continue
        seen.add(page); html = get(OGA + page, False) or ''
        if 'CC0' not in html: continue
        for fu in list(dict.fromkeys(re.findall(r'href="(https://opengameart\.org/sites/default/files/[^"]+\.(?:ogg|wav|mp3|zip|flac))"', html)))[:4]:
            data = get(fu); base = f'sfx/oga/{page.split("/")[-1]}'
            if not data: continue
            if fu.endswith('.zip'):
                try:
                    with zipfile.ZipFile(io.BytesIO(data)) as zf:
                        for nm in zf.namelist()[:60]:
                            b = os.path.basename(nm)
                            if b.startswith('._') or not b.lower().endswith(('.ogg', '.wav', '.mp3', '.flac')): continue
                            save(f'{base}/{b}', zf.read(nm), OGA + page, 'CC0', q)
                except Exception as e: print('oga zip fail', fu, e)
            else: save(f'{base}/{urllib.parse.unquote(os.path.basename(fu))}', data, OGA + page, 'CC0', q)

# ---------- Kenney CC0 audio packs ----------
for s in spec['kenney']:
    html = get(f'https://kenney.nl/assets/{s}', False) or ''
    links = re.findall(r'(https?://[^"\']+\.zip|/[^"\']+\.zip)', html); print('kenney', s, links[:3])
    if not links: continue
    z = get(urllib.parse.urljoin('https://kenney.nl/', links[0]))
    try:
        with zipfile.ZipFile(io.BytesIO(z)) as zf:
            for nm in zf.namelist():
                if nm.lower().endswith(('.ogg', '.wav', '.mp3')): save(f'sfx/kenney-{s}/{os.path.basename(nm)}', zf.read(nm), f'https://kenney.nl/assets/{s}', 'CC0')
    except Exception as e: print('kenney zip fail', s, e)

# ---------- Poly Haven textures ----------
API = 'https://api.polyhaven.com'
tex = json.loads(get(f'{API}/assets?t=textures', False) or '{}')
for q in spec['tex']:
    words = q.lower().split()
    def sc(kv):
        i = kv[1]; tags = ' '.join(i.get('tags', []) + i.get('categories', []) + [kv[0], i.get('name', '')]).lower()
        return sum(2 for w in words if w in tags) + min(i.get('download_count', 0), 2e5) / 2e5
    for aid, info in sorted(tex.items(), key=lambda kv: -sc(kv))[:2]:
        f = json.loads(get(f'{API}/files/{aid}', False) or '{}')
        for m in ('Diffuse', 'nor_gl', 'Rough', 'AO', 'Displacement'):
            try: save(f'textures/{slug(q)}/{aid}/{m}_1k.jpg', get(f[m]['1k']['jpg']['url']), f'https://polyhaven.com/a/{aid}', 'CC0', q)
            except Exception: pass

os.makedirs(OUT, exist_ok=True); json.dump(man, open(os.path.join(OUT, 'manifest.json'), 'w'), indent=1)
print('total files', len(man), 'MB', sum(m['bytes'] for m in man) // 2**20)
